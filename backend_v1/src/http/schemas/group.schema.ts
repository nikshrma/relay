import z from "zod";

export const createGroupSchema = z.object({
  name: z.string().trim().min(1),
  members: z.array(z.uuid()).min(1),
});
export type CreateGroupPayload = z.infer<typeof createGroupSchema>;
export const groupIdSchema = z.uuid();
