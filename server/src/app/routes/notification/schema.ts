import z from "zod";
import { HeaderKeys } from "../../lib/constants.js";

export const NotificationTypeSchema = z.enum([
  "mention",
  "thread_reply",
  "conversation_invite",
  "ai_resource_ready",
  "ai_resource_failed",
]);

const OrganizationHeadersSchema = z.object({
  [HeaderKeys.organizationId]: z.string().meta({
    description: "Organization the notifications belong to.",
  }),
});

// list notifications----
export const ListNotificationsInputSchema = z.object({
  query: z.object({
    type: NotificationTypeSchema.optional(),
    unreadOnly: z
      .enum(["true", "false"])
      .default("false")
      .transform((v) => v === "true"),
    limit: z.coerce.number().min(1).max(100).default(50),
    offset: z.coerce.number().min(0).default(0),
  }),
  ctx: z.object({
    organizationId: z.string().nonempty(),
    userId: z.string(),
  }),
});
export const ListNotificationsHeadersSchema = OrganizationHeadersSchema;
export type ListNotificationsPropType = z.infer<
  typeof ListNotificationsInputSchema
>;
// ---

// unread count----
export const UnreadCountInputSchema = z.object({
  ctx: z.object({
    organizationId: z.string().nonempty(),
    userId: z.string(),
  }),
});
export const UnreadCountHeadersSchema = OrganizationHeadersSchema;
export type UnreadCountPropType = z.infer<typeof UnreadCountInputSchema>;
// ---

// mark read----
export const MarkReadInputSchema = z.object({
  body: z.object({
    ids: z.array(z.string().nonempty()).min(1),
  }),
  ctx: z.object({
    organizationId: z.string().nonempty(),
    userId: z.string(),
  }),
});
export const MarkReadHeadersSchema = OrganizationHeadersSchema;
export type MarkReadPropType = z.infer<typeof MarkReadInputSchema>;
// ---

// mark all read----
export const MarkAllReadInputSchema = z.object({
  ctx: z.object({
    organizationId: z.string().nonempty(),
    userId: z.string(),
  }),
});
export const MarkAllReadHeadersSchema = OrganizationHeadersSchema;
export type MarkAllReadPropType = z.infer<typeof MarkAllReadInputSchema>;
// ---

export const NotificationResponseSchema = z.object({
  code: z.number(),
  message: z.string(),
  result: z.any().optional(),
});
