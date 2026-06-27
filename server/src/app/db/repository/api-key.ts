import { and, eq } from "drizzle-orm";
import { generateBase64String } from "../../lib/utils.js";
import { db } from "../connection.js";
import { apiKey } from "../schema.js";

type ApiKeyType = typeof apiKey.$inferSelect;
class Repository {
  async createNewApiKey(
    args: Omit<ApiKeyType, "id" | "createdAt" | "updatedAt">,
  ) {
    const [newApiKey] = await db
      .insert(apiKey)
      .values({
        id: generateBase64String(32),
        ...args,
      })
      .returning();

    return newApiKey;
  }

  async getApiKeys(args: { userId: string; organizationId: string }) {
    return db
      .select()
      .from(apiKey)
      .where(
        and(
          eq(apiKey.organizationId, args.organizationId),
          eq(apiKey.userId, args.userId),
        ),
      );
  }

  async getApiKeyByApiKey(args: { apiKey: string }) {
    const [found] = await db
      .select()
      .from(apiKey)
      .where(eq(apiKey.apiKey, args.apiKey));

    return found;
  }

  async deleteApiKey(args: {
    id: string;
    userId: string;
    organizationId: string;
  }) {
    const [deleted] = await db
      .delete(apiKey)
      .where(
        and(
          eq(apiKey.id, args.id),
          eq(apiKey.organizationId, args.organizationId),
          eq(apiKey.userId, args.userId),
        ),
      )
      .returning();

    return deleted;
  }
}

export const apiKeyRepository = new Repository();
