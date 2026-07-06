import { and, desc, eq, sql } from "drizzle-orm";
import { generateBase64String } from "../../lib/utils.js";
import { CONSECTO_BOT, SYSTEM_BOT } from "../../lib/constants.js";
import { db } from "../connection.js";
import { conversation, conversationMember, message, user } from "../schema.js";

type MessageType = typeof message.$inferSelect;
class Repository {
  /**
   * Make sure a bot exists as a `user` row so messages it sends can satisfy
   * the sender_id foreign key. Idempotent — safe to call repeatedly.
   */
  async ensureBotUser(bot: typeof CONSECTO_BOT | typeof SYSTEM_BOT = CONSECTO_BOT) {
    await db.insert(user).values(bot).onConflictDoNothing();
  }

  async getUserById(args: { id: string }) {
    const result = await db.query.user.findFirst({
      where: (fields, { eq }) => eq(fields.id, args.id),
    });

    return result;
  }

  async createNewMessage(
    args: Omit<MessageType, "id" | "createdAt" | "updatedAt">,
  ) {
    const [newMessage] = await db
      .insert(message)
      .values({
        id: generateBase64String(32),
        ...args,
      })
      .returning();

    if (!newMessage?.id) return undefined;
    
    const result = await db.query.message.findFirst({
      where: (fields, { eq }) => eq(fields.id, newMessage.id),
      with: {
        sender: true,
        files: true,
      },
    });

    return result;
  }

  async getMessageById(args: {
    id: string;
    organizationId: string;
    conversationId: string;
  }) {
    const result = await db.query.message.findFirst({
      where: (fields, { eq, and }) =>
        and(
          eq(fields.id, args.id),
          eq(fields.organizationId, args.organizationId),
          eq(fields.conversationId, args.conversationId),
        ),
    });

    return result;
  }

  async getMessagesByConversationId({
    conversationId,
    organizationId,
    limit = 200,
    offset = 0,
  }: {
    conversationId: string;
    organizationId: string;
    limit?: number;
    offset?: number;
  }) {
    const result = await db.query.message.findMany({
      where: (fields, { eq, and }) =>
        and(
          eq(fields.conversationId, conversationId),
          eq(fields.organizationId, organizationId),
        ),
      with: {
        sender: true,
      },
      offset,
      limit,
      orderBy: desc(message.createdAt),
    });

    return result.reverse();
  }

  async getMessagesByParentMessageId(args: {
    conversationId: string;
    parentMessageId: string;
    organizationId: string;
  }) {
    const result = await db.query.message.findMany({
      where: (fields, { eq, and }) =>
        and(
          eq(fields.conversationId, args.conversationId),
          eq(fields.parentMessageId, args.parentMessageId),
          eq(fields.organizationId, args.organizationId),
        ),
    });

    return result;
  }

  /**
   * Full-text-ish search over messages in every conversation the user is a
   * member of. Content is stored as Tiptap HTML, so tags are stripped before
   * matching to avoid hits on markup.
   */
  async searchMessages(args: {
    organizationId: string;
    userId: string;
    query: string;
    limit?: number;
  }) {
    const pattern = `%${args.query.trim()}%`;

    const result = await db
      .select({
        message: message,
        sender: {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        },
        conversation: conversation,
      })
      .from(message)
      .innerJoin(
        conversationMember,
        and(
          eq(conversationMember.conversationId, message.conversationId),
          eq(conversationMember.userId, args.userId),
        ),
      )
      .innerJoin(conversation, eq(conversation.id, message.conversationId))
      .innerJoin(user, eq(user.id, message.senderId))
      .where(
        and(
          eq(message.organizationId, args.organizationId),
          sql`regexp_replace(${message.content}, '<[^>]+>', ' ', 'g') ilike ${pattern}`,
        ),
      )
      .orderBy(desc(message.createdAt))
      .limit(args.limit ?? 20);

    return result.map((r) => ({
      ...r.message,
      sender: r.sender,
      conversation: r.conversation,
    }));
  }

  async updateMessage(args: {
    id: string;
    senderId: string;
    conversationId: string;
    newContent: string;
  }) {
    const [updatedMessage] = await db
      .update(message)
      .set({
        content: args.newContent,
      })
      .where(
        and(
          eq(message.id, args.id),
          eq(message.senderId, args.senderId),
          eq(message.conversationId, args.conversationId),
        ),
      )
      .returning();

    return updatedMessage;
  }

  async deleteMessage(args: {
    id: string;
    senderId: string;
    conversationId: string;
  }) {
    await db
      .delete(message)
      .where(
        and(
          eq(message.id, args.id),
          eq(message.senderId, args.senderId),
          eq(message.conversationId, args.conversationId),
        ),
      );
    return true;
  }
}

export const messageRepository = new Repository();
