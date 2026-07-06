import { and, desc, eq, inArray } from "drizzle-orm";
import { generateBase64String } from "../../lib/utils.js";
import { db } from "../connection.js";
import { conversationInvitation } from "../schema.js";

type ConversationInvitationType = typeof conversationInvitation.$inferSelect;
class Repository {
  async createNewConversationInvitationInvitation(
    args: Omit<ConversationInvitationType, "id" | "createdAt" | "updatedAt">,
  ) {
    const [newConversationInvitation] = await db
      .insert(conversationInvitation)
      .values({
        id: generateBase64String(32),
        ...args,
      })
      .returning();

    return newConversationInvitation;
  }
  async createMultipleConversationInvitation(args: {
    senderId: string;
    forUsers: string[];
    conversationId: string;
    expiry: Date;
    role: "admin" | "member";
  }) {
    const newInvitations = await db
      .insert(conversationInvitation)
      .values(
        args.forUsers.map((forUser) => {
          return {
            id: generateBase64String(28),
            forUser,
            senderId: args.senderId,
            conversationId: args.conversationId,
            expiry: args.expiry,
            role: args.role,
          };
        }),
      )
      .returning();

    return newInvitations;
  }

  async getConversationInvitationById(args: { id: string }) {
    const result = await db.query.conversationInvitation.findFirst({
      where: (fields, { eq }) => eq(fields.id, args.id),
    });

    return result;
  }

  async getInvitationForUserInConversation(args: {
    userId: string;
    conversationId: string;
  }) {
    const result = await db.query.conversationInvitation.findFirst({
      where: (fields, { eq, and }) =>
        and(
          eq(fields.forUser, args.userId),
          eq(fields.conversationId, args.conversationId),
        ),
    });

    return result;
  }

  async getUserReceivedInvitations(args: { userId: string }) {
    const result = await db
      .select()
      .from(conversationInvitation)
      .where(and(eq(conversationInvitation.forUser, args.userId)))
      .orderBy(desc(conversationInvitation.createdAt));
    return result;
  }

  async getUserSentInvitations(args: { userId: string }) {
    const result = await db
      .select()
      .from(conversationInvitation)
      .where(and(eq(conversationInvitation.senderId, args.userId)))
      .orderBy(desc(conversationInvitation.createdAt));
    return result;
  }

  async updateConversationInvitationRole(args: {
    id: string;
    newRole: "admin" | "member";
  }) {
    const [updatedConversationInvitation] = await db
      .update(conversationInvitation)
      .set({ role: args.newRole })
      .where(eq(conversationInvitation.id, args.id))
      .returning();

    return updatedConversationInvitation;
  }

  async deleteConversationInvitation(args: { id: string }) {
    await db
      .delete(conversationInvitation)
      .where(eq(conversationInvitation.id, args.id));
    return true;
  }

  async deleteMultipleConversationInvitation(args: {
    invitationIds: string[];
    senderId: string;
  }) {
    await db
      .delete(conversationInvitation)
      .where(
        and(
          inArray(conversationInvitation.id, args.invitationIds),
          eq(conversationInvitation.senderId, args.senderId),
        ),
      );
    return true;
  }
}

export const conversationInviteRepository = new Repository();
