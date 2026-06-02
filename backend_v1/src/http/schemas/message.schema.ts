import z from "zod";

export const messageQuerySchema = z.object({
  userId: z.uuid(),
});
