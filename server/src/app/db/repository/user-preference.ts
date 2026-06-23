import { and, desc, eq } from "drizzle-orm";
import { generateBase64String } from "../../lib/utils.js";
import { db } from "../connection.js";
import { message, userPreference } from "../schema.js";

type UserPreferenceType = typeof userPreference.$inferSelect;
class Repository {
  async createNewUserPreference(args: {
    userId: string;
    organizationId?: string;
  }) {
    const [newUserPreference] = await db
      .insert(userPreference)
      .values({
        id: generateBase64String(32),
        ...args,
      })
      .returning();

    return newUserPreference;
  }

  async getUserPreferenceByUserId(args: { userId: string }) {
    const result = await db.query.userPreference.findFirst({
      where: (fields, { eq, and }) => eq(fields.userId, args.userId),
    });

    return result;
  }

  async updateUserPreference(args: {
    userId: string;
    newContent: Partial<UserPreferenceType>;
  }) {
    const [updatedUserPreference] = await db
      .update(userPreference)
      .set({
        ...args.newContent,
      })
      .where(and(eq(userPreference.userId, args.userId)))
      .returning();

    return updatedUserPreference;
  }

  async deleteUserPreference(args: { userId: string }) {
    await db
      .delete(userPreference)
      .where(and(eq(userPreference.userId, args.userId)));
    return true;
  }
}

export const userPreferenceRepository = new Repository();
