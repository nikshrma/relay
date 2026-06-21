import request from "supertest";
import app from "../../src/http/app.js";
import { prisma } from "../../src/lib/db.js";

beforeEach(async () => {
  await prisma.$transaction([
    prisma.groupMember.deleteMany(),
    prisma.groupMessage.deleteMany(),
    prisma.group.deleteMany(),
    prisma.message.deleteMany(),
    prisma.user.deleteMany(),
  ]);
});

async function createUser(name: string, phone: string) {
  const agent = request.agent(app);
  const response = await agent.post("/signup").send({
    name,
    number: phone,
    password: "password123",
  });
  return { id: response.body.user.id, agent };
}

describe("Group Routes API", () => {
  let user1: any, user2: any, user3: any;

  beforeEach(async () => {
    user1 = await createUser("User 1", `1000${Date.now()}`);
    user2 = await createUser("User 2", `2000${Date.now()}`);
    user3 = await createUser("User 3", `3000${Date.now()}`);
  });

  describe("POST /groups", () => {
    it("creates a group and adds creator as admin", async () => {
      const response = await user1.agent.post("/groups").send({
        name: "Test Group",
        members: [user2.id, user3.id],
      });

      expect(response.status).toBe(200);
      expect(response.body.createdGroup).toBeDefined();
      expect(response.body.createdGroup.name).toBe("Test Group");

      const groupMembers = await prisma.groupMember.findMany({
        where: { groupId: response.body.createdGroup.id },
      });

      expect(groupMembers).toHaveLength(3);
      const admin = groupMembers.find((m) => m.userId === user1.id);
      expect(admin?.role).toBe("ADMIN");
    });
  });

  describe("GET /groups", () => {
    it("fetches groups user belongs to", async () => {
      const groupRes = await user1.agent.post("/groups").send({
        name: "My Group",
        members: [user2.id],
      });
      
      const response1 = await user1.agent.get("/groups");
      expect(response1.status).toBe(200);
      expect(response1.body.groups).toHaveLength(1);
      expect(response1.body.groups[0].name).toBe("My Group");

      const response2 = await user2.agent.get("/groups");
      expect(response2.status).toBe(200);
      expect(response2.body.groups).toHaveLength(1);

      const response3 = await user3.agent.get("/groups");
      expect(response3.status).toBe(200);
      expect(response3.body.groups).toHaveLength(0); // User3 not in group
    });
  });

  describe("Member Management", () => {
    let groupId: string;

    beforeEach(async () => {
      const res = await user1.agent.post("/groups").send({
        name: "Management Group",
        members: [user2.id],
      });
      groupId = res.body.createdGroup.id;
    });

    it("allows admin to add members", async () => {
      const response = await user1.agent.post(`/groups/${groupId}/members`).send([user3.id]);
      expect(response.status).toBe(200);
      
      const dbMembers = await prisma.groupMember.findMany({ where: { groupId } });
      expect(dbMembers).toHaveLength(3);
    });

    it("prevents non-admin from adding members", async () => {
      const response = await user2.agent.post(`/groups/${groupId}/members`).send([user3.id]);
      expect(response.status).toBe(403);
    });

    it("allows admin to remove members", async () => {
      const response = await user1.agent.delete(`/groups/${groupId}/members`).send([user2.id]);
      expect(response.status).toBe(200);

      const dbMembers = await prisma.groupMember.findMany({ where: { groupId } });
      expect(dbMembers).toHaveLength(1);
      expect(dbMembers[0].userId).toBe(user1.id);
    });

    it("allows user to leave group", async () => {
      const response = await user2.agent.delete(`/groups/${groupId}/leave`);
      expect(response.status).toBe(200);

      const dbMembers = await prisma.groupMember.findMany({ where: { groupId } });
      expect(dbMembers.find((m) => m.userId === user2.id)).toBeUndefined();
    });
  });

  describe("GET /groups/:groupId/messages", () => {
    let groupId: string;

    beforeEach(async () => {
      const res = await user1.agent.post("/groups").send({
        name: "Message Group",
        members: [user2.id],
      });
      groupId = res.body.createdGroup.id;

      await prisma.groupMessage.create({
        data: {
          id: "msg-1",
          content: "Hello group",
          senderId: user1.id,
          groupId: groupId,
        },
      });
    });

    it("allows members to fetch messages", async () => {
      const response = await user2.agent.get(`/groups/${groupId}/messages`);
      expect(response.status).toBe(200);
      expect(response.body.messages).toHaveLength(1);
      expect(response.body.messages[0].content).toBe("Hello group");
    });

    it("prevents non-members from fetching messages", async () => {
      const response = await user3.agent.get(`/groups/${groupId}/messages`);
      expect(response.status).toBe(403);
    });
  });
});
