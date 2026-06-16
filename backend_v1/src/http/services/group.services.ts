import { prisma } from "../../lib/db.js";
import type { CreateGroupPayload } from "../schemas/group.schema.js";

export async function createGroup(
  payload: CreateGroupPayload,
  adminId: string,
) {
  const uniqueMembers = [...new Set(payload.members)].filter(
    (id) => id !== adminId,
  );
  const createdGroup = await prisma.group.create({
    data: {
      name: payload.name,
      members: {
        create: [
          {
            userId: adminId,
            role: "ADMIN",
          },
          ...uniqueMembers.map((userId) => ({
            userId,
            role: "MEMBER" as const,
          })),
        ],
      },
    },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });
  return createdGroup;
}
export async function getGroups(userId: string) {
  const groups = await prisma.group.findMany({
    where: {
      members: {
        some: {
          userId,
        },
      },
    },
  });
  return groups;
}
export async function checkUserPresenceInGroup(
  groupId: string,
  userId: string,
) {
  const membership = await prisma.groupMember.findUnique({
    where: {
      userId_groupId: {
        userId,
        groupId,
      },
    },
  });
  return !!membership;
}
export async function getMessages(groupId: string) {
  const messages = await prisma.groupMessage.findMany({
    where: {
      groupId,
    },
    select: {
      content: true,
      createdAt: true,
      id: true,
      senderId: true,
      sender: {
        select: {
          name: true,
          id: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });
  return messages;
}
