import type WebSocket from "ws";

const userSocketMap: Map<string, WebSocket> = new Map();

export function addUser(id: string, socket: WebSocket) {
    userSocketMap.set(id, socket);
}

export function removeUserSocket(id: string, socket: WebSocket) {
    const existing = userSocketMap.get(id);
    if (existing === socket) {
        userSocketMap.delete(id);
    }
}

export function getUserSocket(id: string) {
    return userSocketMap.get(id);
}
