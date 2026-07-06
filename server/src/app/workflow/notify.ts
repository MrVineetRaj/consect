import { CONSECTO_BOT } from "../lib/constants.js";
import logger from "../lib/logger.js";
import {
  notificationRepository,
  type NewNotificationArgs,
} from "../db/repository/notification.js";
import io from "../socket/socket-io.js";

type NotifyUsersArgs = {
  userIds: string[];
  organizationId: string;
  type: NewNotificationArgs["type"];
  actorId?: string | null;
  conversationId?: string | null;
  messageId?: string | null;
  resourceId?: string | null;
  data?: Record<string, unknown>;
};

/**
 * Persist notifications for a set of users and push them over Socket.IO to
 * each recipient's personal room (joined on `mark_online`). The actor and the
 * consecto bot are always excluded so users never get notified about their
 * own actions.
 */
async function notifyUsers(args: NotifyUsersArgs) {
  const recipients = Array.from(new Set(args.userIds)).filter(
    (userId) => userId !== args.actorId && userId !== CONSECTO_BOT.id,
  );

  if (recipients.length === 0) return [];

  const notifications =
    await notificationRepository.createMultipleNotifications(
      recipients.map((userId) => ({
        userId,
        organizationId: args.organizationId,
        type: args.type,
        actorId: args.actorId ?? null,
        conversationId: args.conversationId ?? null,
        messageId: args.messageId ?? null,
        resourceId: args.resourceId ?? null,
        data: args.data ?? {},
      })),
    );

  for (const notification of notifications) {
    io.to(notification.userId).emit("notification:new", { notification });
  }

  return notifications;
}

/**
 * Fire-and-forget wrapper — notification fan-out must never fail the request
 * that triggered it.
 */
export function notifyUsersInBackground(args: NotifyUsersArgs) {
  void notifyUsers(args).catch((error) => {
    logger.error("Notification fan-out failed", { error, args });
  });
}
