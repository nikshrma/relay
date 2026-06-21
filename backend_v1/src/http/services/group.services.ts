import { prisma } from "../../lib/db.js";
import type {
  AddMembersPayload,
  CreateGroupPayload,
} from "../schemas/group.schema.js";

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
    include: {
      members: true,
    },
  });
  return groups;
}
export async function checkUserPresenceInGroup(
  groupId: string,
  userIds: string[],
) {
  const members = await prisma.groupMember.findMany({
    where: {
      groupId,
      userId: {
        in: userIds,
      },
    },
    select: {
      userId: true,
    },
  });

  return members.length === userIds.length;
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
export async function addMembers(
  memberIds: AddMembersPayload,
  groupId: string,
) {
  return prisma.groupMember.createMany({
    data: memberIds.map((userId) => ({
      userId,
      groupId,
      role: "MEMBER",
    })),
    skipDuplicates: true,
  });
}
export async function removeMembersFromGroup(
  groupId: string,
  userIds: string[],
) {
  await prisma.$transaction(async (tx) => {
    await tx.groupMember.deleteMany({
      where: {
        groupId,
        userId: {
          in: userIds,
        },
      },
    });

    const remainingMembers = await tx.groupMember.count({
      where: {
        groupId,
      },
    });

    if (remainingMembers === 0) {
      await tx.group.delete({
        where: {
          id: groupId,
        },
      });
    }
  });
}

export async function checkUserAdminInGroup(groupId: string, userId: string) {
  const member = await prisma.groupMember.findUnique({
    where: {
      userId_groupId: {
        userId,
        groupId,
      },
    },
  });
  return member?.role === "ADMIN";
}

export async function getGroupDetails(groupId: string) {
  return prisma.group.findUnique({
    where: { id: groupId },
    include: {
      members: {
        include: {
          user: {
            select: { id: true, name: true, number: true },
          },
        },
      },
    },
  });
}

export async function leaveGroup(groupId: string, userId: string) {
  await prisma.groupMember.delete({
    where: {
      userId_groupId: {
        userId,
        groupId,
      },
    },
  });
  
  const remainingMembers = await prisma.groupMember.count({
    where: { groupId },
  });
  
  if (remainingMembers === 0) {
    await prisma.group.delete({ where: { id: groupId } });
  }
}

export async function updateMemberRole(groupId: string, userId: string, role: "ADMIN" | "MEMBER") {
  return prisma.groupMember.update({
    where: {
      userId_groupId: {
        userId,
        groupId,
      },
    },
    data: { role },
  });
}

export async function deleteGroup(groupId: string) {
  await prisma.$transaction(async (tx) => {
    await tx.groupMessage.deleteMany({ where: { groupId } });
    await tx.groupMember.deleteMany({ where: { groupId } });
    await tx.group.delete({ where: { id: groupId } });
  });
}
