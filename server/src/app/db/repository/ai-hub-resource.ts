import { desc, eq } from "drizzle-orm";
import { generateBase64String } from "../../lib/utils.js";
import { db } from "../connection.js";
import { aiHubResource } from "../schema.js";

type AiHubResourceType = typeof aiHubResource.$inferSelect;

class Repository {
  async createResource(
    args: Omit<AiHubResourceType, "id" | "createdAt" | "updatedAt">,
  ) {
    const [newResource] = await db
      .insert(aiHubResource)
      .values({
        id: generateBase64String(32),
        ...args,
      })
      .returning();

    return newResource;
  }

  async getResourcesByOrganizationId(args: { organizationId: string }) {
    const result = await db.query.aiHubResource.findMany({
      where: (fields, { eq }) => eq(fields.organizationId, args.organizationId),
      orderBy: (fields) => [desc(fields.createdAt)],
    });

    return result;
  }

  async getResourceById(args: { id: string }) {
    const result = await db.query.aiHubResource.findFirst({
      where: (fields, { eq }) => eq(fields.id, args.id),
    });

    return result;
  }

  async deleteResource(args: { id: string }) {
    await db.delete(aiHubResource).where(eq(aiHubResource.id, args.id));
    return true;
  }
}

export const aiHubResourceRepository = new Repository();
