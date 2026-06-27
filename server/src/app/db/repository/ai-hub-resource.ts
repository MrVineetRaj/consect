import { and, desc, eq, inArray, lte, or } from "drizzle-orm";
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

  async updateResourceMeta(args: {
    resourceId: string;
    allowedChannelIds?: string[] | undefined;
    name?: string | undefined;
    description?: string | undefined;
    tags?: string[] | undefined;
  }) {
    const [updatedAIHubResource] = await db
      .update(aiHubResource)
      .set({
        ...(args.allowedChannelIds !== undefined && {
          allowedChannelIds: args.allowedChannelIds,
        }),
        ...(args.name !== undefined && { name: args.name }),
        ...(args.description !== undefined && {
          description: args.description,
        }),
        ...(args.tags !== undefined && { tags: args.tags }),
      })
      .where(eq(aiHubResource.id, args.resourceId))
      .returning();

    return updatedAIHubResource;
  }

  async updateResourceDetails(args: {
    pointIds: string[];
    resourceId: string;
    status: "pending" | "failed" | "processing" | "success";
  }) {
    const [updatedAIHubResource] = await db
      .update(aiHubResource)
      .set({
        status: args.status,
        embeddingIds: args.pointIds,
      })
      .where(eq(aiHubResource.id, args.resourceId))
      .returning();

    return updatedAIHubResource;
  }

  async getUnEmbeddedResourcesByStatus() {
    const failedResources = await db
      .select()
      .from(aiHubResource)
      .where(inArray(aiHubResource.status, ["failed", "processing"]));

    const last2Hr = new Date(new Date().getTime() - 2 * 60 * 60 * 1000);

    const processingOrPendingResourcesSinceOneHrs = await db
      .select()
      .from(aiHubResource)
      .where(
        and(
          or(
            eq(aiHubResource.status, "pending"),
            eq(aiHubResource.status, "processing"),
          ),
          lte(aiHubResource.createdAt, last2Hr),
        ),
      );

    return {
      failed: failedResources,
      pending: processingOrPendingResourcesSinceOneHrs,
    };
  }
}

export const aiHubResourceRepository = new Repository();
