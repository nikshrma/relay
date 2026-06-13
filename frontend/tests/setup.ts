import { prisma } from "../../backend_v1/src/lib/db";
export async function clearDatabase() {
  await prisma.message.deleteMany();
  await prisma.user.deleteMany();
}
