import { and, desc, eq, gte, ne, sql } from "drizzle-orm";
import { generateBase64String } from "../../lib/utils.js";
import { db } from "../connection.js";
import { conversation, conversationMember, message, user } from "../schema.js";

type ConversationType = typeof conversation.$inferSelect;
class Repository {
  async createNewConversation(
    args: Omit<ConversationType, "id" | "createdAt" | "updatedAt">,
  ) {
    const [newConversation] = await db
      .insert(conversation)
      .values({
        id: generateBase64String(32),
        ...args,
      })
      .returning();

    return newConversation;
  }

  async getConversationById(args: { id: string }) {
    const result = await db.query.conversation.findFirst({
      where: (fields, { eq }) => eq(fields.id, args.id),
    });

    return result;
  }

  async getUserChannels(args: { userId: string; organizationId: string }) {
    const result = await db
      .select()
      .from(conversation)
      .innerJoin(
        conversationMember,
        eq(conversationMember.conversationId, conversation.id),
      )
      .where(
        and(
          eq(conversationMember.userId, args.userId),
          eq(conversation.organizationId, args.organizationId),
          eq(conversation.type, "channel"),
        ),
      );

    const finalResult = result.map((item) => {
      return item.conversation;
    });
    return finalResult;
  }

  async getUserRecentGroupsAndDMs(args: {
    userId: string;
    organizationId: string;
  }) {
    const currentTS = new Date().getTime();
    const last7Days = new Date(currentTS - 7 * 24 * 60 * 60 * 1000);

    const result = await db
      .select({
        conversation: conversation,
        lastMessageAt: sql<Date>`max(${message.createdAt})`,
        // Correlated subquery aggregating ALL members. The outer
        // conversationMember join is filtered to the current user, so it can't
        // be reused here. Aliased ("cm"/"u") to avoid colliding with that join.
        members: sql<
          Array<{
            id: string;
            userId: string;
            role: string | null;
            name: string;
            email: string;
            image: string | null;
          }>
        >`coalesce(
          (
            select json_agg(member)
            from (
              select json_build_object(
                'id', cm.id,
                'userId', cm.user_id,
                'role', cm.role,
                'name', u.name,
                'email', u.email,
                'image', u.image
              ) as member
              from ${conversationMember} as cm
              inner join ${user} as u on u.id = cm.user_id
              where cm.conversation_id = ${conversation.id}
                and cm.user_id <> ${args.userId}
              order by cm.created_at asc
              limit 4
            ) as sliced
          ),
          '[]'
        )`,
      })
      .from(conversation)
      .innerJoin(
        conversationMember,
        eq(conversationMember.conversationId, conversation.id),
      )
      .innerJoin(message, eq(message.conversationId, conversation.id))
      .where(
        and(
          eq(conversationMember.userId, args.userId),
          eq(conversation.organizationId, args.organizationId),
          ne(conversation.type, "channel"),
          gte(message.createdAt, last7Days),
        ),
      )
      .groupBy(conversation.id)
      .orderBy(desc(sql`max(${message.createdAt})`));

    // Flatten so each row is the conversation with members/lastMessageAt
    // merged in, matching the shape the frontend expects.
    const finalResult = result.map((r) => ({
      ...r.conversation,
      lastMessageAt: r.lastMessageAt,
      members: r.members,
    }));

    return finalResult;
  }

  async getUserGroupsAndDMs(args: { userId: string; organizationId: string }) {
    const result = await db
      .select({
        conversation: conversation,
        lastMessageAt: sql<Date>`max(${message.createdAt})`,
      })
      .from(conversation)
      .innerJoin(
        conversationMember,
        eq(conversationMember.conversationId, conversation.id),
      )
      .innerJoin(message, eq(message.conversationId, conversation.id))
      .where(
        and(
          eq(conversationMember.userId, args.userId),
          eq(conversation.organizationId, args.organizationId),
          ne(conversation.type, "channel"),
        ),
      )
      .groupBy(conversation.id)
      .orderBy(desc(sql`max(${message.createdAt})`));

    const finalResult = result.map((r) => r.conversation);

    return finalResult;
  }

  async updateConversationDetails(args: {
    id: string;
    updatedData: Partial<ConversationType>;
  }) {
    const [updatedConversation] = await db
      .update(conversation)
      .set({ ...args.updatedData })
      .where(eq(conversation.id, args.id))
      .returning();

    return updatedConversation;
  }

  async deleteConversation(args: { id: string }) {
    await db.delete(conversation).where(eq(conversation.id, args.id));
    return true;
  }
}

export const conversationRepository = new Repository();
