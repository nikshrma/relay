import request from "supertest";
import app from "../../src/http/app.js";
import { prisma } from "../../src/lib/db.js";

beforeEach(async () => {
  await prisma.$transaction([
    prisma.message.deleteMany(),
    prisma.user.deleteMany(),
  ]);
});

describe("POST /signup", () => {
  it("should create a user", async () => {
    const phone = new Date().toString();
    const response = await request(app).post("/signup").send({
      name: "Nikhil",
      number: phone,
      password: "11111111",
    });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("User created");
    expect(response.body.user).toMatchObject({
      name: "Nikhil",
      number: phone,
    });
    expect(response.body.user.id).toBeDefined();
    const cookies = response.headers["set-cookie"];
    expect(cookies).toBeDefined();
    expect(cookies![0]).toContain("token=");
  });
  it("shouldn't allow same user to signup twice", async () => {
    const phone = new Date().toString();
    await request(app).post("/signup").send({
      name: "Nikhil",
      number: phone,
      password: "11111111",
    });
    const response = await request(app).post("/signup").send({
      name: "Nikhil",
      number: phone,
      password: "11111111",
    });
    expect(response.status).toBe(400);
    expect(response.body.message).toBe("User already exists");
  });
  it("shouldn't allow signup with wrong payload", async () => {
    const response = await request(app).post("/signup").send({
      name: "Nikhil",
      number: "1",
      password: "11111111",
    });
    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Invalid signup attempt");
  });
  it("shouldn't allow signup with incomplete payload", async () => {
    const response = await request(app).post("/signup").send({
      name: "Nikhil",
      password: "11111111",
    });
    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Invalid signup attempt");
  });
});
describe("POST /signin", () => {
  it("should sign in an existing user", async () => {
    const phone = new Date().toString();
    await request(app).post("/signup").send({
      name: "Nikhil",
      number: phone,
      password: "11111111",
    });
    const response = await request(app).post("/signin").send({
      number: phone,
      password: "11111111",
    });
    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Signed in");
    const cookies = response.headers["set-cookie"];
    expect(cookies).toBeDefined();
    expect(cookies![0]).toContain("token=");
  });
  it("shouldn't allow non-existing users to signin", async () => {
    const phone = new Date().toString();
    const response = await request(app).post("/signin").send({
      number: phone,
      password: "11111111",
    });
    expect(response.status).toBe(404);
    expect(response.body.message).toBe("User doesn't exist. Please signup");
  });
  it("shouldn't allow signin for missing arguments", async () => {
    const phone = new Date().toString();
    const response = await request(app).post("/signin").send({
      password: "11111111",
    });
    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Missing args");
  });
  it("shouldn't allow signin on wrong password", async () => {
    const phone = new Date().toString();
    await request(app).post("/signup").send({
      name: "Nikhil",
      number: phone,
      password: "11111111",
    });
    const response = await request(app).post("/signin").send({
      number: phone,
      password: "11111561",
    });
    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Invalid password.");
  });
});
describe("GET /me", () => {
  it("doesn't send back any details if no token is present in cookies", async () => {
    const response = await request(app).get("/me");
    expect(response.status).toBe(401);
    expect(response.body.message).toBe("No token provided");
  });
  it("works after signup", async () => {
    const phone = new Date().toString();
    const agent = request.agent(app);
    await agent.post("/signup").send({
      name: "Nikhil",
      number: phone,
      password: "11111111",
    });
    const response = await agent.get("/me");
    expect(response.status).toBe(200);
    expect(response.body.user).toMatchObject({
      name: "Nikhil",
      number: phone,
    });
    expect(response.body.user.id).toBeDefined();
  });
  it("works after signin", async () => {
    const phone = new Date().toString();

    await request(app).post("/signup").send({
      name: "Nikhil",
      number: phone,
      password: "11111111",
    });

    const agent = request.agent(app);

    await agent.post("/signin").send({
      number: phone,
      password: "11111111",
    });

    const response = await agent.get("/me");

    expect(response.status).toBe(200);
  });
  it("shouldn't work after logout", async () => {
    const phone = new Date().toString();
    const agent = request.agent(app);
    await agent.post("/signup").send({
      name: "Nikhil",
      number: phone,
      password: "11111111",
    });
    await agent.post("/logout");
    const response = await agent.get("/me");
    expect(response.status).toBe(401);
    expect(response.body.message).toBe("No token provided");
  });
});
