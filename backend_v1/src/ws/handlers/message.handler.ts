import cookie from "cookie";
import jwt from "jsonwebtoken";
import type { IncomingMessage } from "http";
import { prisma } from "../../lib/db.js";
import { getUserSocket } from "../store.js";

export interface SendMessagePayload {
    to: string;
    content: string;
}

export interface WsMessage {
    type: string;
    payload: SendMessagePayload;
}

export function extractUserId(req: IncomingMessage): string | null {
    const cookies = cookie.parse(req.headers.cookie ?? "");
    const token = cookies.token;
    if (!token) return null;

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
        if (!decoded || typeof decoded !== "object" || !("id" in decoded)) {
            return null;
        }
        return decoded.id as string;
    } catch {
        return null;
    }
}

async function saveMessage(to: string, from: string, content: string) {
    return prisma.message.create({
        data: { senderId: from, receiverId: to, content },
    });
}

export async function sendMessage(senderId: string, msg: WsMessage) {
    const { to, content } = msg.payload;
    if (!to || !content) {
        throw new Error("Missing required fields: 'to' and 'content'");
    }

    await saveMessage(to, senderId, content);

    const receiverSocket = getUserSocket(to);
    if (receiverSocket) {
        receiverSocket.send(
            JSON.stringify({
                type: "receive_message",
                payload: { from: senderId, content },
            })
        );
    }
}