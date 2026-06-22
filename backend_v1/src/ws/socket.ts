import { WebSocketServer, type WebSocket } from "ws";
import type { Server as HttpServer } from "http";
import {
  extractUserId,
  markMessagesAsDelivered,
  sendGroupMessage,
  sendGroupStopTyping,
  sendGroupTyping,
  sendMessage,
  sendReadMessages,
  sendStopTyping,
  sendTyping,
} from "./handlers/message.handler.js";
import { sockets } from "./store.js";
import { WsMessageSchema } from "./schemas/message.schema.js";
import { presence } from "../services/presence.service.js";
import { pubsub } from "../services/pubsub.service.js";

export function initWebSocketServer(server: HttpServer) {
  const wss = new WebSocketServer({ server });

  wss.on("connection", async (ws: WebSocket, request) => {
    ws.on("error", console.error);

    const id = extractUserId(request);
    if (!id) {
      ws.close(4001, "Unauthorized");
      return;
    }

    sockets.addUser(id, ws);
    await markMessagesAsDelivered(id);
    const wentOnline = await presence.markOnline(id);
    if (wentOnline)
      await pubsub.publishPresence({
        type: "online",
        userId: id,
      });
    ws.send(
      JSON.stringify({
        type: "online-users",
        payload: {
          users: [...(await presence.getOnlineUsers())],
        },
      }),
    );

    ws.on("message", async (data) => {
      try {
        const parsed = WsMessageSchema.safeParse(JSON.parse(data.toString()));
        if (!parsed.success) return;
        const msg = parsed.data;
        switch (msg.type) {
          case "send_message": {
            await sendMessage(id, msg);
            ws.send(
              JSON.stringify({ type: "ack", payload: { status: "sent" } }),
            );
            break;
          }
          case "typing": {
            await sendTyping(id, msg);
            break;
          }
          case "stop_typing": {
            await sendStopTyping(id, msg);
            break;
          }
          case "read_messages": {
            await sendReadMessages(id, msg);
            break;
          }
          case "send_group_message": {
            await sendGroupMessage(id, msg);
            break;
          }
          case "group_typing": {
            await sendGroupTyping(id, msg);
            break;
          }
          case "group_stop_typing": {
            await sendGroupStopTyping(id, msg);
            break;
          }
          default:
            break;
        }
      } catch (e) {
        console.error("WS error", e);
        ws.send(
          JSON.stringify({
            type: "error",
            payload: { message: "Failed to process message" },
          }),
        );
      }
    });

    ws.on("close", async () => {
      sockets.removeUserSocket(id, ws);
      if (!sockets.getUserSocket(id)) {
        const wentOffline = await presence.markOffline(id);
        if (wentOffline)
          await pubsub.publishPresence({
            type: "offline",
            userId: id,
          });
      }
    });
  });
}
