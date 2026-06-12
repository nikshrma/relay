import request from "supertest";
import app from "../../src/http/app.js";
import { prisma } from "../../src/lib/db.js";

beforeEach(async () => {
  await prisma.$transaction([
    prisma.message.deleteMany(),
    prisma.user.deleteMany(),
  ]);
});

describe("GET /users", () => {
  it("requires auth", async () => {
    const response = await request(app).get("/users");
    expect(response.status).toBe(401);
    expect(response.body.message).toBe("No token provided");
  });
  it("doesn't send users on invalid cookie", async () => {
    const response = await request(app)
      .get("/users")
      .set("Cookie", ["token=random"]);
    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Invalid token");
  });
  it("sends back users with auth", async () => {
    const agent = request.agent(app);
    await agent.post("/signup").send({
      name: "Nikhil",
      number: new Date().toString(),
      password: "11111111",
    });
    const response = await agent.get("/users");
    expect(response.status).toBe(200);
  });
});
describe("GET /messages", () => {
  it("shouldn't allow unauthenticated users", async () => {
    const response = await request(app).get("/messages");

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("No token provided");
  });

  it("should require a userId query param", async () => {
    const phone = new Date().toString();
    const agent = request.agent(app);

    await agent.post("/signup").send({
      name: "Nikhil",
      number: phone,
      password: "11111111",
    });

    const response = await agent.get("/messages");

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Missing 'userId' query params");
  });

  it("should fetch messages", async () => {
    const phone1 = new Date().toString();
    const phone2 = Date.now().toString();

    const agent = request.agent(app);

    const user1 = await request(app).post("/signup").send({
      name: "Nikhil",
      number: phone1,
      password: "11111111",
    });

    const user2 = await request(app).post("/signup").send({
      name: "Rahul",
      number: phone2,
      password: "11111111",
    });

    await agent.post("/signin").send({
      number: phone1,
      password: "11111111",
    });

    const response = await agent
      .get("/messages")
      .query({ userId: user2.body.user.id });

    expect(response.status).toBe(200);
    expect(response.body.messages).toBeDefined();
    expect(Array.isArray(response.body.messages)).toBe(true);
  });
});
