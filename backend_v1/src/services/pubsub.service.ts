import { MESSAGE_CHANNEL, PRESENCE_CHANNEL, publisher } from "../lib/redis.js";

class PubSubService {
  private static instance: PubSubService;
  private constructor() {}
  public static getInstance() {
    if (!this.instance) {
      this.instance = new PubSubService();
    }
    return this.instance;
  }
  async publishMessage(event: any) {
    await publisher.publish(MESSAGE_CHANNEL, JSON.stringify(event));
  }
  async publishPresence(event: any) {
    await publisher.publish(PRESENCE_CHANNEL, JSON.stringify(event));
  }
}
export const pubsub = PubSubService.getInstance();
