import { initializeSubscriptions } from "./lib/redis.js";
import { createRelayServer } from "./server.js";

const server = createRelayServer();
server.listen(process.env.PORT || 3000, () => {
  console.log("Server running on port 3000");
});
await initializeSubscriptions();
