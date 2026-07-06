import { and, desc, eq, inArray } from "drizzle-orm";
import { generateBase64String } from "../../lib/utils.js";
import { db } from "../connection.js";
import { conversationMember } from "../schema.js";

type ConversationMemberType = typeof conversationMember.$inferSelect;
class Repository {
  async createNewConversationMember(
    args: Omit<ConversationMemberType, "id" | "createdAt" | "updatedAt">,
  ) {
    const [newConversationMember] = await db
      .insert(conversationMember)
      .values({
        id: generateBase64String(32),
        ...args,
      })
      .returning();

    return newConversationMember;
  }

  async createMultipleConversationMembers(args: {
    conversationId: string;
    userIds: string[];
    role: "admin" | "member";
  }) {
    if (args.userIds.length === 0) return [];

    const newMembers = await db
      .insert(conversationMember)
      .values(
        args.userIds.map((userId) => ({
          id: generateBase64String(32),
          userId,
          conversationId: args.conversationId,
          role: args.role,
        })),
      )
      .returning();

    return newMembers;
  }

  async getConversationMemberById(args: { id: string }) {
    const result = await db.query.conversationMember.findFirst({
      where: (fields, { eq }) => eq(fields.id, args.id),
    });

    return result;
  }
  async getConversationMembershipOfUser(args: {
    userId: string;
    conversationId: string;
  }) {
    const result = await db.query.conversationMember.findFirst({
      where: (fields, { eq, and }) =>
        and(
          eq(fields.userId, args.userId),
          eq(fields.conversationId, args.conversationId),
        ),
    });

    return result;
  }

  /** The subset of the given user ids that are members of the conversation. */
  async filterConversationMemberUserIds(args: {
    conversationId: string;
    userIds: string[];
  }) {
    if (args.userIds.length === 0) return [];

    const result = await db
      .select({ userId: conversationMember.userId })
      .from(conversationMember)
      .where(
        and(
          eq(conversationMember.conversationId, args.conversationId),
          inArray(conversationMember.userId, args.userIds),
        ),
      );

    return result.map((r) => r.userId);
  }

  async getConversationMembersByConversationId(args: {
    conversationId: string;
  }) {
    const result = await db.query.conversationMember.findMany({
      where: (fields, { eq }) => eq(fields.conversationId, args.conversationId),
      with: {
        user: true,
      },
    });

    return result;
  }

  async updateConversationMemberRole(args: {
    id: string;
    newRole: "admin" | "member";
  }) {
    const [updatedConversationMember] = await db
      .update(conversationMember)
      .set({ role: args.newRole })
      .where(eq(conversationMember.id, args.id))
      .returning();

    return updatedConversationMember;
  }

  async deleteConversationMember(args: { id: string }) {
    await db
      .delete(conversationMember)
      .where(eq(conversationMember.id, args.id));
    return true;
  }
}

export const conversationMemberRepository = new Repository();
