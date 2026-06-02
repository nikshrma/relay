import z from "zod";

const sendMessageSchema = z.object({
  type: z.literal("send_message"),
  payload: z.object({
    to: z.uuid(),
    content: z.string().trim().min(1),
    id: z.uuid(),
  }),
});

const typingSchema = z.object({
  type: z.literal("typing"),
  payload: z.object({
    to: z.uuid(),
  }),
});

const stopTypingSchema = z.object({
  type: z.literal("stop_typing"),
  payload: z.object({
    to: z.uuid(),
  }),
});

const readMessagesSchema = z.object({
  type: z.literal("read_messages"),
  payload: z.object({
    to: z.uuid(),
    messageIds: z.array(z.uuid()).min(1),
  }),
});

export const WsMessageSchema = z.discriminatedUnion("type", [
  sendMessageSchema,
  typingSchema,
  stopTypingSchema,
  readMessagesSchema,
]);
export type WsMessage = z.infer<typeof WsMessageSchema>;
