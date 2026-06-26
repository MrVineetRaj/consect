import { Redis } from "ioredis";
class CachingClient {
  private client;
  constructor() {
    this.client = new Redis();
  }

  getClient() {
    return this.client;
  }
}

export const cachingClient = new CachingClient().getClient();
