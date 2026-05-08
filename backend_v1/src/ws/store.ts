import type WebSocket from "ws";
class SocketManager {
  private userSocketMap: Map<string, Set<WebSocket>> = new Map();
  private static instance: SocketManager;
  private constructor() {}
  public static getInstance() {
    if (!this.instance) {
      this.instance = new SocketManager();
    }
    return this.instance;
  }

  addUser(id: string, socket: WebSocket) {
    if (!this.userSocketMap.has(id)) this.userSocketMap.set(id, new Set());
    this.userSocketMap.get(id)?.add(socket);
  }

  removeUserSocket(id: string, socket: WebSocket) {
    const existing = this.userSocketMap.get(id);

    if (!existing) return;
    existing?.delete(socket);
    if (existing?.size === 0) {
      this.userSocketMap.delete(id);
    }
  }

  getUserSocket(id: string) {
    return this.userSocketMap.get(id);
  }
  sendToUser(id: string, payload: unknown) {
  const sockets = this.userSocketMap.get(id);

  if (!sockets) return;

  const message = JSON.stringify(payload);

  for (const socket of sockets) {
    if (socket.readyState === socket.OPEN) {
      socket.send(message);
    }
  }
}
}
export const sockets = SocketManager.getInstance();
