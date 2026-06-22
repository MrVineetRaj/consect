import { and, desc, eq } from "drizzle-orm";
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
