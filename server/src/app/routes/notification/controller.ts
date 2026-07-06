import { HttpResponse } from "../../adapter/http.js";
import { notificationRepository } from "../../db/repository/notification.js";
import { ResponseCodes } from "../../types/codes.js";
import type {
  ListNotificationsPropType,
  MarkAllReadPropType,
  MarkReadPropType,
  UnreadCountPropType,
} from "./schema.js";

class Controller {
  async listNotifications({ ctx, query }: ListNotificationsPropType) {
    const result = await notificationRepository.getNotificationsByUserId({
      userId: ctx.userId,
      organizationId: ctx.organizationId,
      type: query.type,
      unreadOnly: query.unreadOnly,
      limit: query.limit,
      offset: query.offset,
    });

    return new HttpResponse({
      code: ResponseCodes.SUCCESS,
      message: "Fetched notifications",
      result,
    });
  }

  async unreadCount({ ctx }: UnreadCountPropType) {
    const result = await notificationRepository.getUnreadCount({
      userId: ctx.userId,
      organizationId: ctx.organizationId,
    });

    return new HttpResponse({
      code: ResponseCodes.SUCCESS,
      message: "Fetched unread notification count",
      result: { count: result },
    });
  }

  async markRead({ ctx, body }: MarkReadPropType) {
    const result = await notificationRepository.markAsRead({
      ids: body.ids,
      userId: ctx.userId,
    });

    return new HttpResponse({
      code: ResponseCodes.SUCCESS,
      message: "Notification(s) marked as read",
      result,
    });
  }

  async markAllRead({ ctx }: MarkAllReadPropType) {
    await notificationRepository.markAllAsRead({
      userId: ctx.userId,
      organizationId: ctx.organizationId,
    });

    return new HttpResponse({
      code: ResponseCodes.SUCCESS,
      message: "All notifications marked as read",
    });
  }
}

export const controller = new Controller();
