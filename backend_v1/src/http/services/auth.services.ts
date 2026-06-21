import bcrypt from "bcrypt";
import { prisma } from "../../lib/db.js";
import type { SignInPayload, SignUpPayload } from "../schemas/auth.schema.js";
const saltRounds = 10;

export async function checkUserExistance(number: string) {
  return await prisma.user.findUnique({
    where: {
      number,
    },
  });
}
export async function createUser(userPayload: SignUpPayload) {
  const userHash = await bcrypt.hash(userPayload.password, saltRounds);
  const user = await prisma.user.create({
    data: {
      number: userPayload.number,
      password: userHash,
      name: userPayload.name,
    },
  });
  return user;
}

export async function signInUser(userPayload: SignInPayload, hash: string) {
  const a: boolean = await bcrypt.compare(userPayload.password, hash);
  return a;
}
export async function fetchMe(userId: string) {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      number: true,
      name: true,
      id: true,
    },
  });
  return user;
}
