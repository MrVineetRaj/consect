import {
  and,
  asc,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  ne,
  or,
  sql,
} from "drizzle-orm";
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

  async getConversationByIds(args: {
    ids: string[];
    conversationType: "dm" | "channel" | "group";
  }) {
    const result = await db.query.conversation.findFirst({
      where: (fields, { inArray, and, eq }) =>
        and(
          inArray(fields.id, args.ids),
          eq(fields.type, args.conversationType),
        ),
    });

    return result;
  }

  /**
   * The 1:1 DM between two users in an org, if it exists. DMs always have
   * exactly two members, so matching both users is sufficient.
   */
  async getExistingDMBetweenUsers(args: {
    organizationId: string;
    userIds: [string, string];
  }) {
    const result = await db
      .select({ conversation: conversation })
      .from(conversation)
      .innerJoin(
        conversationMember,
        eq(conversationMember.conversationId, conversation.id),
      )
      .where(
        and(
          eq(conversation.organizationId, args.organizationId),
          eq(conversation.type, "dm"),
          inArray(conversationMember.userId, args.userIds),
        ),
      )
      .groupBy(conversation.id)
      .having(eq(sql`count(distinct ${conversationMember.userId})`, 2))
      .limit(1);

    return result[0]?.conversation;
  }

  /**
   * Channels a user can discover: public ones are always listed; unlisted
   * ones only surface when the search query matches their name. Private
   * channels never appear — invitation is the only way in.
   */
  async browseChannels(args: {
    organizationId: string;
    userId: string;
    query?: string | undefined;
  }) {
    const q = args.query?.trim();

    const result = await db
      .select({
        conversation: conversation,
        membershipId: conversationMember.id,
      })
      .from(conversation)
      .leftJoin(
        conversationMember,
        and(
          eq(conversationMember.conversationId, conversation.id),
          eq(conversationMember.userId, args.userId),
        ),
      )
      .where(
        and(
          eq(conversation.organizationId, args.organizationId),
          eq(conversation.type, "channel"),
          q
            ? and(
                inArray(conversation.visibility, ["public", "unlisted"]),
                ilike(conversation.name, `%${q}%`),
              )
            : eq(conversation.visibility, "public"),
        ),
      )
      .orderBy(asc(conversation.name));

    return result.map((r) => ({
      ...r.conversation,
      isMember: !!r.membershipId,
    }));
  }

  /**
   * Channels matching a name search, for the workspace search bar: the
   * user's own channels (any visibility) plus discoverable public/unlisted
   * ones. Private channels the user isn't in stay hidden.
   */
  async searchChannels(args: {
    organizationId: string;
    userId: string;
    query: string;
    limit?: number;
  }) {
    const pattern = `%${args.query.trim()}%`;

    const result = await db
      .select({
        conversation: conversation,
        membershipId: conversationMember.id,
      })
      .from(conversation)
      .leftJoin(
        conversationMember,
        and(
          eq(conversationMember.conversationId, conversation.id),
          eq(conversationMember.userId, args.userId),
        ),
      )
      .where(
        and(
          eq(conversation.organizationId, args.organizationId),
          eq(conversation.type, "channel"),
          ilike(conversation.name, pattern),
          or(
            sql`${conversationMember.id} is not null`,
            inArray(conversation.visibility, ["public", "unlisted"]),
          ),
        ),
      )
      .orderBy(asc(conversation.name))
      .limit(args.limit ?? 15);

    return result.map((r) => ({
      ...r.conversation,
      isMember: !!r.membershipId,
    }));
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

  /**
   * Every group and DM the user belongs to, regardless of when the last
   * message was sent (unlike the "recent" variant above). Conversations with
   * no messages yet are included too, ordered by their creation time.
   */
  async getUserGroupsAndDMs(args: { userId: string; organizationId: string }) {
    const result = await db
      .select({
        conversation: conversation,
        lastMessageAt: sql<Date>`coalesce(max(${message.createdAt}), ${conversation.createdAt})`,
        // Same aliased correlated subquery as in getUserRecentGroupsAndDMs:
        // the outer conversationMember join is filtered to the current user.
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
      .leftJoin(message, eq(message.conversationId, conversation.id))
      .where(
        and(
          eq(conversationMember.userId, args.userId),
          eq(conversation.organizationId, args.organizationId),
          ne(conversation.type, "channel"),
        ),
      )
      .groupBy(conversation.id)
      .orderBy(
        desc(
          sql`coalesce(max(${message.createdAt}), ${conversation.createdAt})`,
        ),
      );

    const finalResult = result.map((r) => ({
      ...r.conversation,
      lastMessageAt: r.lastMessageAt,
      members: r.members,
    }));

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

  async getChannelsWhereMemberOfConversationIsParticipant(args: {
    conversationId: string;
    organizationId: string;
  }) {
    // userIds of everyone in the source conversation
    const memberIds = db
      .select({ userId: conversationMember.userId })
      .from(conversationMember)
      .where(eq(conversationMember.conversationId, args.conversationId));

    // total number of members in the source conversation
    const [memberCountRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(conversationMember)
      .where(eq(conversationMember.conversationId, args.conversationId));
    const memberCount = memberCountRow?.count ?? 0;

    // channels where EVERY source member is a participant:
    // group by channel, keep those whose distinct member count == memberCount
    const result = await db
      .select({ conversation: conversation })
      .from(conversation)
      .innerJoin(
        conversationMember,
        eq(conversationMember.conversationId, conversation.id),
      )
      .where(
        and(
          inArray(conversationMember.userId, memberIds),
          eq(conversation.type, "channel"),
          eq(conversation.organizationId, args.organizationId),
          ne(conversation.id, args.conversationId),
        ),
      )
      .groupBy(conversation.id)
      .having(
        eq(
          sql`count(distinct ${conversationMember.userId})`,
          memberCount,
        ),
      );

    return result.map((r) => r.conversation.id);
  }

  async deleteConversation(args: { id: string }) {
    await db.delete(conversation).where(eq(conversation.id, args.id));
    return true;
  }
}

export const conversationRepository = new Repository();
