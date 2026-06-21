import z from "zod";

export const createGroupSchema = z.object({
  name: z.string().trim().min(1),
  members: z.array(z.uuid()).min(1),
});
export type CreateGroupPayload = z.infer<typeof createGroupSchema>;
export const groupIdSchema = z.uuid();
export const addMembersSchema = z.array(z.uuid());
export type AddMembersPayload = z.infer<typeof addMembersSchema>;
export const userIdScehma = z.array(z.uuid());
export const roleSchema = z.enum(["ADMIN", "MEMBER"]);
