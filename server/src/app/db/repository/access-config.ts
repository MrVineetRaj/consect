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
