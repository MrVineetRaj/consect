import z from "zod";
import { HeaderKeys } from "../../lib/constants.js";

export const CreateNewConversationSchema = z.object({
  body: z.object({
    name: z.string().nullish().default(null),
    type: z.enum(["group", "dm", "channel"]).default("dm"),
    description: z.string().nullish().default(null),
  }),
  ctx: z.object({
    organizationId: z.string(),
    userId: z.string(),
  }),
});

export const CreateNewConversationHeadersSchema = z.object({
  [HeaderKeys.organizationId]: z.string().meta({
    description: "Organization the conversation belongs to.",
  }),
});

export const CreateNewConversationResponseSchema = z.object({
  code: z.number(),
  message: z.string(),
  result: z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().nullable(),
    type: z.enum(["group", "dm", "channel"]),
    organizationId: z.string(),
    createdAt: z.date(),
    updatedAt: z.date(),
  }),
});

export type CreateNewConversationPropType = z.infer<
  typeof CreateNewConversationSchema
>;

export const ListConversationsInputSchema = z.object({
  ctx: z.object({
    organizationId: z.string().nonempty(),
    userId: z.string(),
  }),
});
export type ListConversationsPropType = z.infer<
  typeof ListConversationsInputSchema
>;

export const ListConversationsHeadersSchema = z.object({
  [HeaderKeys.organizationId]: z.string().meta({
    description: "Organization the conversation belongs to.",
  }),
});
export const ListConversationMemberInputSchema = z.object({
  ctx: z.object({
    conversationId: z.string().nonempty(),
  }),
});
export type ListConversationMemberPropType = z.infer<
  typeof ListConversationMemberInputSchema
>;

export const ListConversationMemberHeadersSchema = z.object({
  [HeaderKeys.conversationId]: z.string().meta({
    description: "Organization the conversation belongs to.",
  }),
});
export const SendInviteInputSchema = z.object({
  body: z.object({
    forUsers: z.array(z.string().nonempty()),
    role: z.enum(["admin", "member"]),
  }),
  ctx: z.object({
    organizationId: z.string().nonempty(),
    userId: z.string().nonempty(),
    conversationId: z.string().nonempty(),
  }),
});

export type SendInvitePropType = z.infer<typeof SendInviteInputSchema>;

export const SendInviteHeadersSchema = z.object({
  [HeaderKeys.organizationId]: z.string().meta({
    description: "Organization the conversation belongs to.",
  }),
  [HeaderKeys.conversationId]: z.string().meta({
    description: "Users's current conversation",
  }),
});
export const DeleteMultipleSentInviteInputSchema = z.object({
  body: z.object({
    invitationIds: z.array(z.string().nonempty()),
  }),
  ctx: z.object({
    organizationId: z.string().nonempty(),
    userId: z.string().nonempty(),
  }),
});

export type DeleteMultipleSentInvitePropType = z.infer<
  typeof DeleteMultipleSentInviteInputSchema
>;

export const DeleteMultipleSentInviteHeadersSchema = z.object({
  [HeaderKeys.organizationId]: z.string().meta({
    description: "Organization the conversation belongs to.",
  }),
});
