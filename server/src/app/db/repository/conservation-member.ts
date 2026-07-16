import { and, desc, eq, gt, inArray, ne, sql } from "drizzle-orm";
import { generateBase64String } from "../../lib/utils.js";
import { SYSTEM_BOT } from "../../lib/constants.js";
import { db } from "../connection.js";
import { conversation, conversationMember, message } from "../schema.js";

type ConversationMemberType = typeof conversationMember.$inferSelect;
class Repository {
  async createNewConversationMember(
    args: Omit<
      ConversationMemberType,
      "id" | "createdAt" | "updatedAt" | "lastReadAt"
    >,
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

  /** Just the member user ids — for fan-out paths that don't need user rows. */
  async getConversationMemberUserIds(args: { conversationId: string }) {
    const result = await db
      .select({ userId: conversationMember.userId })
      .from(conversationMember)
      .where(eq(conversationMember.conversationId, args.conversationId));

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

  /** Everything up to now counts as read for this member. */
  async markConversationRead(args: {
    userId: string;
    conversationId: string;
  }) {
    const [updated] = await db
      .update(conversationMember)
      .set({ lastReadAt: new Date() })
      .where(
        and(
          eq(conversationMember.userId, args.userId),
          eq(conversationMember.conversationId, args.conversationId),
        ),
      )
      .returning();

    return updated;
  }

  /**
   * conversationId -> messages sent by others since the member last read, for
   * every conversation the user belongs to in the workspace.
   */
  async getUnreadCounts(args: { userId: string; organizationId: string }) {
    const rows = await db
      .select({
        conversationId: conversationMember.conversationId,
        unreadCount: sql<number>`count(${message.id})::int`,
      })
      .from(conversationMember)
      .innerJoin(
        conversation,
        eq(conversation.id, conversationMember.conversationId),
      )
      .leftJoin(
        message,
        and(
          eq(message.conversationId, conversationMember.conversationId),
          gt(message.createdAt, conversationMember.lastReadAt),
          ne(message.senderId, args.userId),
          // "X joined" announcements don't badge anyone.
          ne(message.senderId, SYSTEM_BOT.id),
        ),
      )
      .where(
        and(
          eq(conversationMember.userId, args.userId),
          eq(conversation.organizationId, args.organizationId),
        ),
      )
      .groupBy(conversationMember.conversationId);

    const counts: Record<string, number> = {};
    for (const row of rows) counts[row.conversationId] = row.unreadCount;
    return counts;
  }

  /** Drop a user from every conversation of one workspace (org removal). */
  async deleteUserMembershipsInOrganization(args: {
    userId: string;
    organizationId: string;
  }) {
    const orgConversationIds = db
      .select({ id: conversation.id })
      .from(conversation)
      .where(eq(conversation.organizationId, args.organizationId));

    await db
      .delete(conversationMember)
      .where(
        and(
          eq(conversationMember.userId, args.userId),
          inArray(conversationMember.conversationId, orgConversationIds),
        ),
      );
    return true;
  }

  async deleteConversationMember(args: { id: string }) {
    await db
      .delete(conversationMember)
      .where(eq(conversationMember.id, args.id));
    return true;
  }
}

export const conversationMemberRepository = new Repository();
