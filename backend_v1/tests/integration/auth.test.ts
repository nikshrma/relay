import { describe } from "node:test";
import request from "supertest";
import app from "../../src/http/app.js";
import { response } from "express";

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
});
