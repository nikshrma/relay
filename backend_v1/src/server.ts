import http from "http";
import app from "./http/app.js";
import { initWebSocketServer } from "./ws/socket.js";
import { initializeSubscriptions } from "./lib/redis.js";

export async function createRelayServer() {
  const server = http.createServer(app);
  initWebSocketServer(server);
  await initializeSubscriptions();
  return server;
}
