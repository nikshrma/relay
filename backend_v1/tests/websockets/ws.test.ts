import WebSocket from "ws";
import request from "supertest";
import crypto from "crypto";
import { createRelayServer } from "../../src/server.js";
import { prisma } from "../../src/lib/db.js";

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

beforeEach(async () => {
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
  const cookieArray = Array.isArray(setCookie) ? setCookie : (setCookie ? [setCookie] : []);
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
