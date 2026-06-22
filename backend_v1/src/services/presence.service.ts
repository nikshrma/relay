import { redis } from "../lib/redis.js";

class PresenceService {
  private static readonly CONN_KEY_PREFIX = "presence:conn_count:";
  private static instance: PresenceService;
  private constructor() {}
  public static getInstance() {
    if (!this.instance) {
      this.instance = new PresenceService();
    }
    return this.instance;
  }
  async markOnline(userId: string) {
    const key = `${PresenceService.CONN_KEY_PREFIX}${userId}`;
    const newCount = await redis.incr(key);
    if (newCount === 1) {
      await redis.expire(key, 86400);
      await redis.sAdd("online_users", userId);
      return true;
    }
    return false;
  }

  async markOffline(userId: string) {
    const key = `${PresenceService.CONN_KEY_PREFIX}${userId}`;
    const newCount = await redis.decr(key);
    if (newCount <= 0) {
      await redis.del(key);
      await redis.sRem("online_users", userId);
      return true;
    }
    return false;
  }

  async isOnline(userId: string) {
    return await redis.sIsMember("online_users", userId);
  }
  async getOnlineUsers() {
    return await redis.sMembers("online_users");
  }
}
export const presence = PresenceService.getInstance();
