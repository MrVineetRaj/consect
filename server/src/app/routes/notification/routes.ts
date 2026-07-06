import { createApiRouter } from "../../adapter/openapi.js";
import { authMiddleware } from "../../middleware/auth.js";
import { controller } from "./controller.js";
import {
  ListNotificationsHeadersSchema,
  ListNotificationsInputSchema,
  MarkAllReadHeadersSchema,
  MarkAllReadInputSchema,
  MarkReadHeadersSchema,
  MarkReadInputSchema,
  NotificationResponseSchema,
  UnreadCountHeadersSchema,
  UnreadCountInputSchema,
} from "./schema.js";

export const NOTIFICATION_BASE_PATH = "/api/v1/notification";

const api = createApiRouter(NOTIFICATION_BASE_PATH);

api.get("/", authMiddleware, {
  schema: ListNotificationsInputSchema,
  response: NotificationResponseSchema,
  headers: ListNotificationsHeadersSchema,
  auth: true,
  handler: controller.listNotifications.bind(controller),
  summary: "List notifications for the current user",
  tags: ["Notification"],
});

api.get("/unread-count", authMiddleware, {
  schema: UnreadCountInputSchema,
  response: NotificationResponseSchema,
  headers: UnreadCountHeadersSchema,
  auth: true,
  handler: controller.unreadCount.bind(controller),
  summary: "Count unread notifications",
  tags: ["Notification"],
});

api.patch("/read", authMiddleware, {
  schema: MarkReadInputSchema,
  response: NotificationResponseSchema,
  headers: MarkReadHeadersSchema,
  auth: true,
  handler: controller.markRead.bind(controller),
  summary: "Mark notification(s) as read",
  tags: ["Notification"],
});

api.post("/read-all", authMiddleware, {
  schema: MarkAllReadInputSchema,
  response: NotificationResponseSchema,
  headers: MarkAllReadHeadersSchema,
  auth: true,
  handler: controller.markAllRead.bind(controller),
  summary: "Mark all notifications as read",
  tags: ["Notification"],
});

export const router = api.router;
