import { prisma } from "../../backend_v1/src/lib/db";
export async function clearDatabase() {
  await prisma.$transaction([
    prisma.groupMember.deleteMany(),
    prisma.groupMessage.deleteMany(),
    prisma.group.deleteMany(),
    prisma.message.deleteMany(),
    prisma.user.deleteMany(),
  ]);
}
