import { createClient, type RedisClientType } from "redis";
import { sockets } from "../ws/store.js";

export const redis = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});
export const publisher: RedisClientType = redis.duplicate();
export const subscriber: RedisClientType = redis.duplicate();
redis.on("error", (err) => console.log("Redis Client Error", err));
publisher.on("error", console.error);
subscriber.on("error", console.error);
async function connectRedis() {
  await redis.connect();
  console.log("Successfully connected to Redis");
  await publisher.connect();
  console.log("Publisher successfully connected to Redis");
  await subscriber.connect();
  console.log("Subscriber successfully connected to Redis");
}
await connectRedis();

export const MESSAGE_CHANNEL = "message";
export const PRESENCE_CHANNEL = "presence";

export async function closeRedis() {
  // Suppress any pending errors on clients during teardown
  const noop = () => {};
  subscriber.on("error", noop);
  publisher.on("error", noop);
  redis.on("error", noop);

  try { await subscriber.unsubscribe(); } catch {}
  try { await subscriber.quit(); } catch {}
  try { await publisher.quit(); } catch {}
  try { await redis.quit(); } catch {}
}

export async function initializeSubscriptions() {
  await subscriber.subscribe(MESSAGE_CHANNEL, (payload) => {
    try {
      const event = JSON.parse(payload);
      sockets.sendToUserLocal(event.userId, event.payload);
    } catch (err) {
      console.error("Failed to parse message channel payload:", err);
    }
  });

  await subscriber.subscribe(PRESENCE_CHANNEL, (payload) => {
    try {
      const event = JSON.parse(payload);
      sockets.broadcast({
        type: event.type,
        payload: { userId: event.userId },
      });
    } catch (err) {
      console.error("Failed to parse presence channel payload:", err);
    }
  });
}
