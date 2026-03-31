import http from 'http'
import app from './http/app.js'
import { initWebSocketServer } from './ws/socket.js'
export const server = http.createServer(app)

initWebSocketServer(server);

server.listen(3000, () => {
  console.log("Server running on port 3000");
});