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

const groupTypingSchema = z.object({
  type: z.literal("group_typing"),
  payload: z.object({
    groupId: z.uuid(),
  }),
});

const groupStopTypingSchema = z.object({
  type: z.literal("group_stop_typing"),
  payload: z.object({
    groupId: z.uuid(),
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

const sendGroupMessageSchema = z.object({
  type: z.literal("send_group_message"),
  payload: z.object({
    groupId: z.uuid(),
    content: z.string().trim().min(1),
    id: z.uuid(),
  }),
});
export const WsMessageSchema = z.discriminatedUnion("type", [
  sendMessageSchema,
  typingSchema,
  stopTypingSchema,
  readMessagesSchema,
  sendGroupMessageSchema,
  groupTypingSchema,
  groupStopTypingSchema,
]);
export type WsMessage = z.infer<typeof WsMessageSchema>;
