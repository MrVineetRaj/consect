import { and, desc, eq } from "drizzle-orm";
import { generateBase64String } from "../../lib/utils.js";
import { db } from "../connection.js";
import { accessConfig } from "../schema.js";

type AccessConfigType = typeof accessConfig.$inferSelect;
class Repository {
  async createNewAccessConfig(args: Omit<AccessConfigType, "id">) {
    const [newAccessConfig] = await db
      .insert(accessConfig)
      .values({
        id: generateBase64String(32),
        ...args,
      })
      .returning();

    return newAccessConfig;
  }

  async getAccessConfigById(args: { id: string }) {
    const result = await db.query.accessConfig.findFirst({
      where: (fields, { eq }) => eq(fields.id, args.id),
    });

    return result;
  }

  async getAccessConfigsByUserId(args: {
    userId: string;
    organizationId: string;
    spaceId: string[];
  }) {
    const result = await db.query.accessConfig.findMany({
      where: (fields, { eq, and, inArray }) =>
        and(
          eq(fields.userId, args.userId),
          eq(fields.organizationId, args.organizationId),
          inArray(fields.spaceId, args.spaceId),
        ),
    });

    return result;
  }

  /** A single user's override row for one space (e.g. one channel). */
  async getAccessConfigForUserInSpace(args: {
    userId: string;
    organizationId: string;
    spaceId: string;
    spaceType: "channel" | "organization";
  }) {
    const result = await db.query.accessConfig.findFirst({
      where: (fields, { eq, and }) =>
        and(
          eq(fields.userId, args.userId),
          eq(fields.organizationId, args.organizationId),
          eq(fields.spaceId, args.spaceId),
          eq(fields.spaceType, args.spaceType),
        ),
    });

    return result;
  }

  /** Every member's override row for one space (e.g. one channel). */
  async getAccessConfigsBySpace(args: {
    organizationId: string;
    spaceId: string;
    spaceType: "channel" | "organization";
  }) {
    const result = await db.query.accessConfig.findMany({
      where: (fields, { eq, and }) =>
        and(
          eq(fields.organizationId, args.organizationId),
          eq(fields.spaceId, args.spaceId),
          eq(fields.spaceType, args.spaceType),
        ),
    });

    return result;
  }

  /**
   * Merge `config` into the user's override row for the space, creating the
   * row if none exists. Returns the stored (merged) config.
   */
  async upsertAccessConfigForUserInSpace(args: {
    userId: string;
    organizationId: string;
    spaceId: string;
    spaceType: "channel" | "organization";
    config: Record<string, boolean>;
  }) {
    const existing = await this.getAccessConfigForUserInSpace(args);

    if (existing) {
      const merged = {
        ...((existing.config as Record<string, boolean>) ?? {}),
        ...args.config,
      };
      const [updated] = await db
        .update(accessConfig)
        .set({ config: merged })
        .where(eq(accessConfig.id, existing.id))
        .returning();
      return updated;
    }

    const [created] = await db
      .insert(accessConfig)
      .values({
        id: generateBase64String(32),
        userId: args.userId,
        organizationId: args.organizationId,
        spaceId: args.spaceId,
        spaceType: args.spaceType,
        config: args.config,
      })
      .returning();
    return created;
  }

  /** Drop every override a user has in a workspace (org + channel scoped). */
  async deleteAccessConfigsForUserInOrganization(args: {
    userId: string;
    organizationId: string;
  }) {
    await db
      .delete(accessConfig)
      .where(
        and(
          eq(accessConfig.userId, args.userId),
          eq(accessConfig.organizationId, args.organizationId),
        ),
      );
    return true;
  }

  async deleteAccessConfigForUserInSpace(args: {
    userId: string;
    organizationId: string;
    spaceId: string;
    spaceType: "channel" | "organization";
  }) {
    await db
      .delete(accessConfig)
      .where(
        and(
          eq(accessConfig.userId, args.userId),
          eq(accessConfig.organizationId, args.organizationId),
          eq(accessConfig.spaceId, args.spaceId),
          eq(accessConfig.spaceType, args.spaceType),
        ),
      );
    return true;
  }

  async updateAccessConfig(args: {
    id: string;
    args: Partial<AccessConfigType>;
  }) {
    const [updatedAccessConfig] = await db
      .update(accessConfig)
      .set({ ...args })
      .where(eq(accessConfig.id, args.id))
      .returning();

    return updatedAccessConfig;
  }

  async deleteAccessConfig(args: { id: string }) {
    await db.delete(accessConfig).where(eq(accessConfig.id, args.id));
    return true;
  }
}

export const accessConfigRepository = new Repository();
