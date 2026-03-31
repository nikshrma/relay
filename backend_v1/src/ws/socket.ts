import { WebSocketServer, type WebSocket } from 'ws'
import type { Server as HttpServer } from 'http'
import { addUser, getUserSocket, removeUserSocket } from './store.js'
import { extractUserId, saveMessage, send_message } from './handlers/message.handler.js'

export function initWebSocketServer(server: HttpServer) {
    const wss = new WebSocketServer({ server })
    wss.on('connection', function connection(ws: WebSocket, request) {
        ws.on('error', console.error);
        const id = extractUserId(request);
        if (!id) {
            ws.close();
            return;
        }

        addUser(id, ws);
        ws.on('message', async function message(data, isBinary) {
            try {
                const msg = JSON.parse(data.toString());
                if (!msg.type) return;
                switch (msg.type) {
                    case "send_message": {
                        send_message(id,msg)
                        ws.send("Message sent")
                        break;
                    }
                    default:
                        break;
                }
            } catch (e) {
                console.log("Something's gone wrong", e);
            }
        })
        ws.on('close', () => {
            removeUserSocket(id, ws);
        })
    })
}
