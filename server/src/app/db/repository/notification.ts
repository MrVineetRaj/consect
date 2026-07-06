import { and, count, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { generateBase64String } from "../../lib/utils.js";
import { db } from "../connection.js";
import { notification } from "../schema.js";

type NotificationType = typeof notification.$inferSelect;
export type NewNotificationArgs = Omit<
  NotificationType,
  "id" | "createdAt" | "updatedAt" | "readAt"
>;

class Repository {
  async createMultipleNotifications(args: NewNotificationArgs[]) {
    if (args.length === 0) return [];

    const inserted = await db
      .insert(notification)
      .values(
        args.map((notif) => ({
          id: generateBase64String(32),
          ...notif,
        })),
      )
      .returning();

    if (inserted.length === 0) return [];

    // Re-fetch with the actor joined so realtime payloads and API responses
    // carry the same shape the feed renders.
    const result = await db.query.notification.findMany({
      where: (fields, { inArray }) =>
        inArray(
          fields.id,
          inserted.map((n) => n.id),
        ),
      with: {
        actor: true,
        conversation: true,
      },
    });

    return result;
  }

  async getNotificationsByUserId({
    userId,
    organizationId,
    type,
    unreadOnly = false,
    limit = 50,
    offset = 0,
  }: {
    userId: string;
    organizationId: string;
    type?: NotificationType["type"] | undefined;
    unreadOnly?: boolean;
    limit?: number;
    offset?: number;
  }) {
    const result = await db.query.notification.findMany({
      where: (fields, { eq, and, isNull }) =>
        and(
          eq(fields.userId, userId),
          eq(fields.organizationId, organizationId),
          ...(type ? [eq(fields.type, type)] : []),
          ...(unreadOnly ? [isNull(fields.readAt)] : []),
        ),
      with: {
        actor: true,
        conversation: true,
      },
      orderBy: desc(notification.createdAt),
      limit,
      offset,
    });

    return result;
  }

  async getUnreadCount(args: { userId: string; organizationId: string }) {
    const [result] = await db
      .select({ count: count() })
      .from(notification)
      .where(
        and(
          eq(notification.userId, args.userId),
          eq(notification.organizationId, args.organizationId),
          isNull(notification.readAt),
        ),
      );

    return result?.count ?? 0;
  }

  async markAsRead(args: { ids: string[]; userId: string }) {
    if (args.ids.length === 0) return [];

    const updated = await db
      .update(notification)
      .set({ readAt: new Date() })
      .where(
        and(
          inArray(notification.id, args.ids),
          eq(notification.userId, args.userId),
          isNull(notification.readAt),
        ),
      )
      .returning();

    return updated;
  }

  /**
   * Stamp the user's invite notification(s) for a conversation with how they
   * responded, so the feed can stop offering Accept/Decline across reloads.
   */
  async markInviteNotificationsResponded(args: {
    userId: string;
    conversationId: string;
    response: "accepted" | "declined";
  }) {
    await db
      .update(notification)
      .set({
        readAt: new Date(),
        data: sql`coalesce(${notification.data}, '{}'::jsonb) || ${JSON.stringify(
          { responded: args.response },
        )}::jsonb`,
      })
      .where(
        and(
          eq(notification.userId, args.userId),
          eq(notification.conversationId, args.conversationId),
          eq(notification.type, "conversation_invite"),
        ),
      );

    return true;
  }

  async markAllAsRead(args: { userId: string; organizationId: string }) {
    await db
      .update(notification)
      .set({ readAt: new Date() })
      .where(
        and(
          eq(notification.userId, args.userId),
          eq(notification.organizationId, args.organizationId),
          isNull(notification.readAt),
        ),
      );

    return true;
  }
}

export const notificationRepository = new Repository();
