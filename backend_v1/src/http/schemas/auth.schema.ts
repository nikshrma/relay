import z from "zod";

export const signupSchema = z.object({
  name: z.string().trim().min(1),
  number: z.string().trim().min(10),
  password: z.string().min(6),
});
export type SignUpPayload = z.infer<typeof signupSchema>;

export const signinSchema = z.object({
  number: z.string().trim().min(10),
  password: z.string().min(6),
});
export type SignInPayload = z.infer<typeof signinSchema>;

export const jwtPayloadSchema = z.object({
  id: z.uuid(),
});
