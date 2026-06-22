import cookie from "cookie";
import jwt from "jsonwebtoken";
import type { IncomingMessage } from "http";
import { prisma } from "../../lib/db.js";
import { jwtPayloadSchema } from "../../http/schemas/auth.schema.js";
import type { WsMessage } from "../schemas/message.schema.js";
import {
  checkUserPresenceInGroup,
  getGroupDetails,
} from "../../http/services/group.services.js";
import { pubsub } from "../../services/pubsub.service.js";
import { presence } from "../../services/presence.service.js";

export function extractUserId(req: IncomingMessage): string | null {
  const cookies = cookie.parse(req.headers.cookie ?? "");
  const token = cookies.token;
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
    const parsed = jwtPayloadSchema.safeParse(decoded);
    if (!parsed.success) {
      return null;
    }
    return parsed.data.id;
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
  const deliveredAt = (await presence.isOnline(to)) ? new Date() : null;
  await saveMessage(to, senderId, content, msg.payload.id, deliveredAt);

  const sender = await prisma.user.findUnique({ where: { id: senderId } });
  await pubsub.publishMessage({
    userId: to,
    payload: {
      type: "receive_message",
      payload: {
        from: senderId,
        name: sender?.name,
        content,
        id: msg.payload.id,
      },
    },
  });
  if (deliveredAt) {
    await pubsub.publishMessage({
      userId: senderId,
      payload: {
        type: "delivered_messages",
        payload: {
          messageIds: [msg.payload.id],
        },
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
  await pubsub.publishMessage({
    userId: to,
    payload: {
      type: "typing",
      payload: { userId: senderId },
    },
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
  await pubsub.publishMessage({
    userId: to,
    payload: {
      type: "stop_typing",
      payload: { userId: senderId },
    },
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
    await pubsub.publishMessage({
      userId: senderId,
      payload: {
        type: "delivered_messages",
        payload: {
          messageIds: messageIds,
        },
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
  await pubsub.publishMessage({
    userId: msg.payload.to,
    payload: {
      type: "read_messages",
      payload: {
        messageIds: msg.payload.messageIds,
      },
    },
  });
}
export async function sendGroupMessage(
  senderId: string,
  msg: Extract<WsMessage, { type: "send_group_message" }>,
) {
  const { groupId, content, id } = msg.payload;
  const userId = await checkUserPresenceInGroup(groupId, [senderId]);
  if (!userId) {
    throw new Error("You are not a member of this group");
  }
  const savedMessage = await prisma.groupMessage.create({
    data: {
      id,
      content,
      groupId,
      senderId,
    },
    include: {
      sender: {
        select: {
          name: true,
        },
      },
    },
  });
  const groupDetails = await getGroupDetails(groupId);
  if (!groupDetails) return;

  for (const member of groupDetails.members) {
    if (member.userId !== senderId) {
      await pubsub.publishMessage({
        userId: member.userId,
        payload: {
          type: "receive_group_message",
          payload: {
            groupId,
            groupName: groupDetails.name,
            from: senderId,
            name: savedMessage.sender.name,
            content,
            id,
            createdAt: savedMessage.createdAt,
          },
        },
      });
    }
  }
}
export async function sendGroupTyping(
  senderId: string,
  msg: Extract<WsMessage, { type: "group_typing" }>,
) {
  const { groupId } = msg.payload;

  const isMember = await checkUserPresenceInGroup(groupId, [senderId]);
  if (!isMember) return;

  const groupDetails = await getGroupDetails(groupId);
  if (!groupDetails) return;

  for (const member of groupDetails.members) {
    if (member.userId !== senderId) {
      await pubsub.publishMessage({
        userId: member.userId,
        payload: {
          type: "group_typing",
          payload: { groupId, userId: senderId },
        },
      });
    }
  }
}

export async function sendGroupStopTyping(
  senderId: string,
  msg: Extract<WsMessage, { type: "group_stop_typing" }>,
) {
  const { groupId } = msg.payload;

  const isMember = await checkUserPresenceInGroup(groupId, [senderId]);
  if (!isMember) return;

  const groupDetails = await getGroupDetails(groupId);
  if (!groupDetails) return;

  for (const member of groupDetails.members) {
    if (member.userId !== senderId) {
      await pubsub.publishMessage({
        userId: member.userId,
        payload: {
          type: "group_stop_typing",
          payload: { groupId, userId: senderId },
        },
      });
    }
  }
}
