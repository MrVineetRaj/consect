import { cachingClient } from "../clients/caching.js";

class SocketHandlers {
  async markUserOnline({
    userId,
    organizationId,
  }: {
    userId: string;
    organizationId: string;
  }) {
    await cachingClient.hsetex(
      `users:${organizationId}:presence`,
      "EX",
      21,
      "FIELDS",
      1,
      userId,
      "true",
    );
  }
}

export const socketHandlers = new SocketHandlers();
