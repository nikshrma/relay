import cookie from "cookie";
import jwt from "jsonwebtoken";
import type { IncomingMessage } from "http";
import { prisma } from "../../lib/db.js";
import { sockets } from "../store.js";

interface BasePayload {
  to: string;
}

interface MessagePayload extends BasePayload {
  content: string;
}

interface TypingPayload extends BasePayload {}

export type WsMessage =
  | {
      type: "send_message";
      payload: MessagePayload;
    }
  | {
      type: "typing";
      payload: TypingPayload;
    }
  | {
      type: "stop_typing";
      payload: TypingPayload;
    };

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

async function saveMessage(to: string, from: string, content: string) {
  return prisma.message.create({
    data: { senderId: from, receiverId: to, content },
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

  await saveMessage(to, senderId, content);

  const sender = await prisma.user.findUnique({ where: { id: senderId } });
  sockets.sendToUser(to, {
    type: "receive_message",
    payload: { from: senderId, name: sender?.name, content },
  });
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
  await prisma.message.updateMany({
    where: {
      receiverId,
      deliveredAt: null,
    },
    data: {
      deliveredAt: new Date(),
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

