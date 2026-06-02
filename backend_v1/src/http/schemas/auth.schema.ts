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

export const messageQuerySchema = z.object({
  userId: z.uuid(),
});
const sendMessageSchema = z.object({
  type: z.literal("send_message"),
  payload: z.object({
    to: z.string(),
    content: z.string(),
    id: z.string(),
  }),
});

const typingSchema = z.object({
  type: z.literal("typing"),
  payload: z.object({
    to: z.string(),
  }),
});

const stopTypingSchema = z.object({
  type: z.literal("stop_typing"),
  payload: z.object({
    to: z.string(),
  }),
});

const readMessagesSchema = z.object({
  type: z.literal("read_messages"),
  payload: z.object({
    to: z.string(),
    messageIds: z.array(z.string()),
  }),
});

export const WsMessageSchema = z.discriminatedUnion("type", [
  sendMessageSchema,
  typingSchema,
  stopTypingSchema,
  readMessagesSchema,
]);
export type WsMessage = z.infer<typeof WsMessageSchema>;
