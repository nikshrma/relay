import { WebSocketServer, type WebSocket } from "ws";
import type { Server as HttpServer } from "http";
import {
  extractUserId,
  markMessagesAsDelivered,
  sendMessage,
  sendReadMessages,
  sendStopTyping,
  sendTyping,
} from "./handlers/message.handler.js";
import { sockets } from "./store.js";
import {
  WsMessageSchema,
  type WsMessage,
} from "../http/schemas/auth.schema.js";

export function initWebSocketServer(server: HttpServer) {
  const wss = new WebSocketServer({ server });

  wss.on("connection", (ws: WebSocket, request) => {
    ws.on("error", console.error);

    const id = extractUserId(request);
    if (!id) {
      ws.close(4001, "Unauthorized");
      return;
    }

    sockets.addUser(id, ws);
    markMessagesAsDelivered(id);
    ws.send(
      JSON.stringify({
        type: "online-users",
        payload: {
          users: [...sockets.getOnlineUsers()],
        },
      }),
    );

    sockets.broadcast({
      type: "online",
      payload: {
        userId: id,
      },
    });

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

    ws.on("close", () => {
      sockets.removeUserSocket(id, ws);
      sockets.broadcast({
        type: "offline",
        payload: { userId: id },
      });
    });
  });
}
