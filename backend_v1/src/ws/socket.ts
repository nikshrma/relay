import { WebSocketServer, type WebSocket } from "ws";
import type { Server as HttpServer } from "http";
import { extractUserId, sendMessage, type WsMessage } from "./handlers/message.handler.js";
import { sockets } from "./store.js";

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

        ws.send(JSON.stringify({
            type:"online-users",
            payload:{
                users:[...sockets.getOnlineUsers()]
            }
        }))

        sockets.broadcast({
            type: "online",
            payload: {
                userId:id
            }
        })

        ws.on("message", async (data) => {
            try {
                const msg: WsMessage = JSON.parse(data.toString());
                if (!msg.type) return;

                switch (msg.type) {
                    case "send_message": {
                        await sendMessage(id, msg);
                        ws.send(JSON.stringify({ type: "ack", payload: { status: "sent" } }));
                        break;
                    }

                    default:
                        break;
                }
            } catch (e) {
                console.error("WS error", e);
                ws.send(JSON.stringify({ type: "error", payload: { message: "Failed to process message" } }));
            }
        });

        ws.on("close", () => {
            sockets.removeUserSocket(id, ws);
            sockets.broadcast({
                type: "offline",
                payload: { userId: id }
            });
        });
    });
}
