import http from "http";
import app from "./http/app.js";
import { initWebSocketServer } from "./ws/socket.js";
export function createRelayServer() {
  const server = http.createServer(app);
  initWebSocketServer(server);
  return server;
}
