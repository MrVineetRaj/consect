import { and, desc, eq } from "drizzle-orm";
import { generateBase64String } from "../../lib/utils.js";
import { CONSECTO_BOT } from "../../lib/constants.js";
import { db } from "../connection.js";
import { message, user } from "../schema.js";

type MessageType = typeof message.$inferSelect;
class Repository {
  /**
   * Make sure the consecto bot exists as a `user` row so messages it sends can
   * satisfy the sender_id foreign key. Idempotent — safe to call repeatedly.
   */
  async ensureBotUser() {
    await db.insert(user).values(CONSECTO_BOT).onConflictDoNothing();
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
