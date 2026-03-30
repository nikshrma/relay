import http from 'http'
import app from './http/app.js'
export const server = http.createServer(app)

server.listen(3000, () => {
  console.log("Server running on port 3000");
});