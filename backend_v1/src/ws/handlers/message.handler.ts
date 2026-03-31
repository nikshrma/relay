import cookie from "cookie";
import jwt from 'jsonwebtoken'
import type { IncomingMessage } from "http";
import { prisma } from "../../lib/db.js";
import { getUserSocket } from "../store.js";

export function extractUserId(req: IncomingMessage) {
    const cookies = cookie.parse(req.headers.cookie || "");

    const token = cookies?.token;
    if (!token) return null;

    try {
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET as string
        )

        if (!decoded || typeof decoded !== "object" || !decoded.id) {
            return null;
        }

        return decoded.id;
    } catch (err) {
        return null;
    }
}

export async function saveMessage(to: string, from: string, content: string) {
    const message = await prisma.message.create({
        data: {
            senderId: from,
            receiverId: to,
            content
        }
    });
    return message;
}
//TODO: add type of msg here
//@ts-ignore
export async function send_message(id:string, msg){
        const { to, content } = msg.payload
        if (!to || !content) {
            return;
        }
        await saveMessage(to, id, content);
        const receiverSocket = getUserSocket(to);
        if (receiverSocket) {
            receiverSocket.send(
                JSON.stringify({
                    type: "receive_message",
                    payload: {
                        from: id,
                        content,
                    },
                })
            );
        }   
}