import { and, desc, eq } from "drizzle-orm";
import { generateBase64String } from "../../lib/utils.js";
import { db } from "../connection.js";
import { message } from "../schema.js";

type MessageType = typeof message.$inferSelect;
class Repository {
  async createNewMessage(args: Omit<MessageType, "id">) {
    const [newMessage] = await db
      .insert(message)
      .values({
        id: generateBase64String(32),
        ...args,
      })
      .returning();

    return newMessage;
  }

  async getMessageById(args: { id: string }) {
    const result = await db.query.message.findFirst({
      where: (fields, { eq }) => eq(fields.id, args.id),
    });

    return result;
  }

  async getMessagesByConversationId(args: { conversationId: string }) {
    const result = await db.query.message.findFirst({
      where: (fields, { eq }) => eq(fields.conversationId, args.conversationId),
    });

    return result;
  }

  async getMessagesByParentMessageId(args: {
    conversationId: string;
    parentMessageId: string;
  }) {
    const result = await db.query.message.findFirst({
      where: (fields, { eq, and }) =>
        and(
          eq(fields.conversationId, args.conversationId),
          eq(fields.parentMessageId, args.parentMessageId),
        ),
    });

    return result;
  }

  async updateMessage(args: { id: string; newContent: Partial<MessageType> }) {
    const [updatedMessage] = await db
      .update(message)
      .set({ ...args.newContent })
      .where(eq(message.id, args.id))
      .returning();

    return updatedMessage;
  }

  async deleteMessage(args: { id: string }) {
    await db.delete(message).where(eq(message.id, args.id));
    return true;
  }
}

export const messageRepository = new Repository();
