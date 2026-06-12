import WebSocket from "ws";
import request from "supertest";
import crypto from "crypto";
import { createRelayServer } from "../../src/server.js";

let server: any;
let wsPort: number;

beforeAll(async () => {
  server = createRelayServer();
  await new Promise<void>((resolve) => {
    server.listen(0, () => {
      wsPort = server.address().port;
      resolve();
    });
  });
});

afterAll(async () => {
  await new Promise<void>((resolve) => {
    server.close(() => resolve());
  });
});

it("delivers a message from A to B", async () => {
  const agent = request.agent(server);

  const phoneA = "A" + Date.now();
  const signupA = await agent.post("/signup").send({
    name: "User A",
    number: phoneA,
    password: "password",
  });
  const userAId = signupA.body.user.id;
  const cookieA = signupA.headers["set-cookie"].find((c: string) =>
    c.startsWith("token="),
  );

  const phoneB = "B" + Date.now();
  const signupB = await agent.post("/signup").send({
    name: "User B",
    number: phoneB,
    password: "password",
  });
  const userBId = signupB.body.user.id;
  const cookieB = signupB.headers["set-cookie"].find((c: string) =>
    c.startsWith("token="),
  );

  const wsA = new WebSocket(`ws://localhost:${wsPort}`, {
    headers: { Cookie: cookieA },
  });
  const wsB = new WebSocket(`ws://localhost:${wsPort}`, {
    headers: { Cookie: cookieB },
  });

  await new Promise((resolve) => wsA.on("open", resolve));
  await new Promise((resolve) => wsB.on("open", resolve));

  const receivedMessagePromise = new Promise<any>((resolve) => {
    wsB.on("message", (data) => {
      const parsed = JSON.parse(data.toString());
      if (parsed.type === "receive_message") {
        resolve(parsed);
      }
    });
  });

  const messageId = crypto.randomUUID();
  wsA.send(
    JSON.stringify({
      type: "send_message",
      payload: {
        id: messageId,
        to: userBId,
        content: "Hello B!",
      },
    }),
  );

  const received = await receivedMessagePromise;

  expect(received).toMatchObject({
    type: "receive_message",
    payload: {
      from: userAId,
      name: "User A",
      content: "Hello B!",
      id: messageId,
    },
  });
  wsA.close();
  wsB.close();
});
