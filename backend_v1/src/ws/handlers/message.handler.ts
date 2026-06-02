import cookie from "cookie";
import jwt from "jsonwebtoken";
import type { IncomingMessage } from "http";
import { prisma } from "../../lib/db.js";
import { sockets } from "../store.js";
import type { WsMessage } from "../../http/schemas/auth.schema.js";

interface BasePayload {
  to: string;
}

interface MessagePayload extends BasePayload {
  content: string;
  id: string;
}

interface TypingPayload extends BasePayload {}

interface ReadMessagesPayload extends BasePayload {
  messageIds: string[];
}

export function extractUserId(req: IncomingMessage): string | null {
  const cookies = cookie.parse(req.headers.cookie ?? "");
  const token = cookies.token;
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
    if (!decoded || typeof decoded !== "object" || !("id" in decoded)) {
      return null;
    }
    return decoded.id as string;
  } catch {
    return null;
  }
}

async function saveMessage(
  to: string,
  from: string,
  content: string,
  id: string,
  deliveredAt: Date | null,
) {
  return prisma.message.create({
    data: { senderId: from, receiverId: to, content, id, deliveredAt },
  });
}

export async function sendMessage(
  senderId: string,
  msg: Extract<WsMessage, { type: "send_message" }>,
) {
  const { to, content } = msg.payload;
  if (!to || !content) {
    throw new Error("Missing required fields: 'to' and 'content'");
  }
  const deliveredAt = sockets.isOnline(to) ? new Date() : null;
  await saveMessage(to, senderId, content, msg.payload.id, deliveredAt);

  const sender = await prisma.user.findUnique({ where: { id: senderId } });
  sockets.sendToUser(to, {
    type: "receive_message",
    payload: {
      from: senderId,
      name: sender?.name,
      content,
      id: msg.payload.id,
    },
  });
  if (deliveredAt) {
    sockets.sendToUser(senderId, {
      type: "delivered_messages",
      payload: {
        messageIds: [msg.payload.id],
      },
    });
  }
}
export async function sendTyping(
  senderId: string,
  msg: Extract<WsMessage, { type: "typing" }>,
) {
  const { to } = msg.payload;
  if (!to) {
    throw new Error("Missing field: to");
  }
  sockets.sendToUser(to, {
    type: "typing",
    payload: { userId: senderId },
  });
}
export async function sendStopTyping(
  senderId: string,
  msg: Extract<WsMessage, { type: "stop_typing" }>,
) {
  const { to } = msg.payload;
  if (!to) {
    throw new Error("Missing field: to");
  }
  sockets.sendToUser(to, {
    type: "stop_typing",
    payload: { userId: senderId },
  });
}
export async function markMessagesAsDelivered(receiverId: string) {
  const updateUsers = await prisma.message.findMany({
    where: {
      receiverId,
      deliveredAt: null,
    },
    select: {
      id: true,
      senderId: true,
    },
  });
  const time = new Date();
  await prisma.message.updateMany({
    where: {
      receiverId,
      deliveredAt: null,
    },
    data: {
      deliveredAt: time,
    },
  });
  const senderMessagesMap = new Map<string, string[]>();

  for (const msg of updateUsers) {
    const msgIds = senderMessagesMap.get(msg.senderId) ?? [];
    msgIds.push(msg.id);
    senderMessagesMap.set(msg.senderId, msgIds);
  }
  for (const [senderId, messageIds] of senderMessagesMap) {
    sockets.sendToUser(senderId, {
      type: "delivered_messages",
      payload: {
        messageIds: messageIds,
      },
    });
  }
}
export async function sendReadMessages(
  senderId: string,
  msg: Extract<WsMessage, { type: "read_messages" }>,
) {
  const time = new Date();
  await prisma.message.updateMany({
    where: {
      senderId: msg.payload.to,
      receiverId: senderId,
      id: {
        in: msg.payload.messageIds,
      },
      readAt: null,
    },
    data: {
      readAt: time,
    },
  });
  sockets.sendToUser(msg.payload.to, {
    type: "read_messages",
    payload: {
      messageIds: msg.payload.messageIds,
    },
  });
}
