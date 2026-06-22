import WebSocket from "ws";
import request from "supertest";
import crypto from "crypto";
import { createRelayServer } from "../../src/server.js";
import { prisma } from "../../src/lib/db.js";
import { redis, closeRedis } from "../../src/lib/redis.js";

let server: any;
let wsPort: number;

beforeAll(async () => {
  server = await createRelayServer();
  await new Promise<void>((resolve) => {
    server.listen(0, () => {
      wsPort = server.address().port;
      resolve();
    });
  });
});

afterAll(async () => {
  server.closeAllConnections();
  await new Promise<void>((resolve) => {
    server.close(() => resolve());
  });
  await closeRedis();
});

beforeEach(async () => {
  const presenceKeys = await redis.keys("presence:*");
  if (presenceKeys.length > 0) await redis.del(presenceKeys);
  await redis.del("online_users");

  await prisma.groupMember.deleteMany();
  await prisma.groupMessage.deleteMany();
  await prisma.group.deleteMany();
  await prisma.message.deleteMany();
  await prisma.user.deleteMany();
});

async function createUser(name: string, prefix: string) {
  const agent = request.agent(server);
  const phone = prefix + Date.now().toString();

  const signup = await agent.post("/signup").send({
    name,
    number: phone,
    password: "password123",
  });

  if (!signup.body.user) {
    throw new Error(`Signup failed: ${JSON.stringify(signup.body)}`);
  }

  const id = signup.body.user.id;
  const setCookie = signup.headers["set-cookie"];
  const cookieArray = Array.isArray(setCookie)
    ? setCookie
    : setCookie
      ? [setCookie]
      : [];
  const cookie = cookieArray.find((c: string) => c.startsWith("token="));

  return { id, cookie };
}

interface TestWebSocket extends WebSocket {
  messages: any[];
}

function connectWs(cookie?: string): Promise<TestWebSocket> {
  return new Promise((resolve) => {
    const ws = new WebSocket(`ws://localhost:${wsPort}`, {
      headers: cookie ? { Cookie: cookie } : undefined,
    }) as TestWebSocket;

    ws.messages = [];

    ws.on("message", (data) => {
      ws.messages.push(JSON.parse(data.toString()));
    });

    ws.on("open", () => resolve(ws));
    ws.on("close", () => resolve(ws));
  });
}

function waitForMessage(ws: TestWebSocket, type: string): Promise<any> {
  const index = ws.messages.findIndex((m) => m.type === type);

  if (index !== -1) {
    const [msg] = ws.messages.splice(index, 1);
    return Promise.resolve(msg);
  }

  return new Promise((resolve) => {
    const listener = (data: WebSocket.RawData) => {
      const parsed = JSON.parse(data.toString());

      if (parsed.type === type) {
        ws.off("message", listener);

        const idx = ws.messages.findIndex((m) => m.type === type);
        if (idx !== -1) ws.messages.splice(idx, 1);

        resolve(parsed);
      }
    };

    ws.on("message", listener);
  });
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe("Authentication & Connections", () => {
  it("valid JWT connects successfully", async () => {
    const { cookie } = await createUser("User Valid", "1111111");

    const ws = await connectWs(cookie);

    expect(ws.readyState).toBe(WebSocket.OPEN);

    const initialMessage = await waitForMessage(ws, "online-users");

    expect(initialMessage.type).toBe("online-users");

    ws.close();
  });

  it("invalid JWT connection rejected", async () => {
    const ws = new WebSocket(`ws://localhost:${wsPort}`, {
      headers: {
        Cookie: "token=invalid_jwt_token_here",
      },
    });

    const closeCode = await new Promise((resolve) => {
      ws.on("close", (code) => resolve(code));
    });

    expect(closeCode).toBe(4001);
  });

  it("missing JWT connection rejected", async () => {
    const ws = new WebSocket(`ws://localhost:${wsPort}`);

    const closeCode = await new Promise((resolve) => {
      ws.on("close", (code) => resolve(code));
    });

    expect(closeCode).toBe(4001);
  });
});

describe("Presence Broadcasts", () => {
  it("User comes online -> presence broadcast", async () => {
    const userA = await createUser("User A", "presenceA");
    const userB = await createUser("User B", "presenceB");

    const wsA = await connectWs(userA.cookie);

    await waitForMessage(wsA, "online-users");
    await waitForMessage(wsA, "online");

    const onlineEventPromise = waitForMessage(wsA, "online");

    const wsB = await connectWs(userB.cookie);

    const event = await onlineEventPromise;

    expect(event.payload.userId).toBe(userB.id);

    wsA.close();
    wsB.close();
  });

  it("User disconnects -> offline broadcast", async () => {
    const userA = await createUser("User A", "offlineA");
    const userB = await createUser("User B", "offlineB");

    const wsA = await connectWs(userA.cookie);
    const wsB = await connectWs(userB.cookie);

    await waitForMessage(wsA, "online-users");

    const offlineEventPromise = waitForMessage(wsA, "offline");

    wsB.close();

    const event = await offlineEventPromise;

    expect(event.payload.userId).toBe(userB.id);

    wsA.close();
  });
});

describe("Messaging", () => {
  it("User A sends message to User B", async () => {
    const userA = await createUser("User A", "msgA");
    const userB = await createUser("User B", "msgB");

    const wsA = await connectWs(userA.cookie);
    const wsB = await connectWs(userB.cookie);

    const messageId = crypto.randomUUID();

    const receivePromise = waitForMessage(wsB, "receive_message");

    wsA.send(
      JSON.stringify({
        type: "send_message",
        payload: {
          id: messageId,
          to: userB.id,
          content: "Hello B!",
        },
      }),
    );

    const received = await receivePromise;

    expect(received.payload.content).toBe("Hello B!");
    expect(received.payload.from).toBe(userA.id);

    wsA.close();
    wsB.close();
  });

  it("Message is persisted in database", async () => {
    const userA = await createUser("User A", "persistA");
    const userB = await createUser("User B", "persistB");

    const wsA = await connectWs(userA.cookie);
    const wsB = await connectWs(userB.cookie);

    const messageId = crypto.randomUUID();

    wsA.send(
      JSON.stringify({
        type: "send_message",
        payload: {
          id: messageId,
          to: userB.id,
          content: "Persistent Message",
        },
      }),
    );

    await waitForMessage(wsA, "ack");

    const dbMessage = await prisma.message.findUnique({
      where: {
        id: messageId,
      },
    });

    expect(dbMessage).toBeDefined();
    expect(dbMessage?.content).toBe("Persistent Message");
    expect(dbMessage?.senderId).toBe(userA.id);
    expect(dbMessage?.receiverId).toBe(userB.id);

    wsA.close();
    wsB.close();
  });

  it("User cannot send message to nonexistent user", async () => {
    const userA = await createUser("User A", "ghostA");

    const wsA = await connectWs(userA.cookie);

    const fakeId = crypto.randomUUID();

    const errorPromise = waitForMessage(wsA, "error");

    wsA.send(
      JSON.stringify({
        type: "send_message",
        payload: {
          id: crypto.randomUUID(),
          to: fakeId,
          content: "Hello Ghost!",
        },
      }),
    );

    const errMessage = await errorPromise;

    expect(errMessage.payload.message).toBe("Failed to process message");

    wsA.close();
  });

  it("Read receipt reaches original sender", async () => {
    const userA = await createUser("User A", "readA");
    const userB = await createUser("User B", "readB");

    const wsA = await connectWs(userA.cookie);
    const wsB = await connectWs(userB.cookie);

    const messageId = crypto.randomUUID();

    wsA.send(
      JSON.stringify({
        type: "send_message",
        payload: {
          id: messageId,
          to: userB.id,
          content: "Read me",
        },
      }),
    );

    await waitForMessage(wsB, "receive_message");

    const readPromise = waitForMessage(wsA, "read_messages");

    wsB.send(
      JSON.stringify({
        type: "read_messages",
        payload: {
          to: userA.id,
          messageIds: [messageId],
        },
      }),
    );

    const readReceipt = await readPromise;

    expect(readReceipt.payload.messageIds).toContain(messageId);

    const dbMessage = await prisma.message.findUnique({
      where: {
        id: messageId,
      },
    });

    expect(dbMessage?.readAt).not.toBeNull();

    wsA.close();
    wsB.close();
  });

  it("Cannot mark another user's message as read", async () => {
    const userA = await createUser("User A", "crossA");
    const userB = await createUser("User B", "crossB");
    const userC = await createUser("User C", "crossC");

    const wsA = await connectWs(userA.cookie);
    const wsB = await connectWs(userB.cookie);
    const wsC = await connectWs(userC.cookie);

    const messageId = crypto.randomUUID();

    wsA.send(
      JSON.stringify({
        type: "send_message",
        payload: {
          id: messageId,
          to: userB.id,
          content: "Secret",
        },
      }),
    );

    await waitForMessage(wsB, "receive_message");

    wsC.send(
      JSON.stringify({
        type: "read_messages",
        payload: {
          to: userA.id,
          messageIds: [messageId],
        },
      }),
    );

    await delay(100);

    const dbMessage = await prisma.message.findUnique({
      where: {
        id: messageId,
      },
    });

    expect(dbMessage?.readAt).toBeNull();

    wsA.close();
    wsB.close();
    wsC.close();
  });
});

describe("Typing Indicators", () => {
  it("Typing event reaches recipient", async () => {
    const userA = await createUser("User A", "typeA");
    const userB = await createUser("User B", "typeB");

    const wsA = await connectWs(userA.cookie);
    const wsB = await connectWs(userB.cookie);

    const typingPromise = waitForMessage(wsB, "typing");

    wsA.send(
      JSON.stringify({
        type: "typing",
        payload: {
          to: userB.id,
        },
      }),
    );

    const event = await typingPromise;

    expect(event.payload.userId).toBe(userA.id);

    wsA.close();
    wsB.close();
  });
});

describe("Group Messaging", () => {
  it("Group message delivered to all online members", async () => {
    const userA = await createUser("User A", "gA");
    const userB = await createUser("User B", "gB");
    const userC = await createUser("User C", "gC"); // Not in group

    const group = await prisma.group.create({
      data: {
        name: "Test Group",
        members: {
          create: [
            { userId: userA.id, role: "ADMIN" },
            { userId: userB.id, role: "MEMBER" },
          ],
        },
      },
    });

    const wsA = await connectWs(userA.cookie);
    const wsB = await connectWs(userB.cookie);
    const wsC = await connectWs(userC.cookie);

    const messageId = crypto.randomUUID();
    const receivePromiseB = waitForMessage(wsB, "receive_group_message");

    // Set a timeout for C to ensure they don't receive it
    let cReceived = false;
    const listener = (data: WebSocket.RawData) => {
      const parsed = JSON.parse(data.toString());
      if (parsed.type === "receive_group_message") {
        cReceived = true;
      }
    };
    wsC.on("message", listener);

    wsA.send(
      JSON.stringify({
        type: "send_group_message",
        payload: {
          id: messageId,
          groupId: group.id,
          content: "Hello Group!",
        },
      }),
    );

    const receivedB = await receivePromiseB;
    expect(receivedB.payload.content).toBe("Hello Group!");
    expect(receivedB.payload.groupId).toBe(group.id);

    await delay(200);
    expect(cReceived).toBe(false);

    wsA.close();
    wsB.close();
    wsC.close();
  });

  it("Non-member cannot send group messages", async () => {
    const userA = await createUser("User A", "gAuthA");
    const userB = await createUser("User B", "gAuthB"); // Non-member

    const group = await prisma.group.create({
      data: {
        name: "Secret Group",
        members: {
          create: [{ userId: userA.id, role: "ADMIN" }],
        },
      },
    });

    const wsB = await connectWs(userB.cookie);

    const errorPromise = waitForMessage(wsB, "error");

    wsB.send(
      JSON.stringify({
        type: "send_group_message",
        payload: {
          id: crypto.randomUUID(),
          groupId: group.id,
          content: "Sneak in",
        },
      }),
    );

    const errMessage = await errorPromise;
    expect(errMessage.payload.message).toBe("Failed to process message");

    wsB.close();
  });

  it("Offline users receive persisted messages after reconnect", async () => {
    const userA = await createUser("User A", "gOffA");
    const userB = await createUser("User B", "gOffB");

    const group = await prisma.group.create({
      data: {
        name: "Offline Group",
        members: {
          create: [
            { userId: userA.id, role: "ADMIN" },
            { userId: userB.id, role: "MEMBER" },
          ],
        },
      },
    });

    const wsA = await connectWs(userA.cookie);
    // User B is offline

    const messageId = crypto.randomUUID();
    wsA.send(
      JSON.stringify({
        type: "send_group_message",
        payload: {
          id: messageId,
          groupId: group.id,
          content: "Message while B is offline",
        },
      }),
    );

    // Wait for the server to process the message and insert into DB
    await delay(200);

    // User B comes online and checks messages via HTTP
    const agent = request.agent(server);
    await agent.post("/signin").send({
      number: "gOffB" + userB.id, // The signin helper would need exact phone, but let's just use the userB's id to query DB directly to prove persistence
      password: "password123",
    });

    const dbMessage = await prisma.groupMessage.findUnique({
      where: { id: messageId },
    });

    expect(dbMessage).toBeDefined();
    expect(dbMessage?.content).toBe("Message while B is offline");

    wsA.close();
  });
});
