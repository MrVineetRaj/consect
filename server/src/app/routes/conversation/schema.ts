import z from "zod";
import { HeaderKeys } from "../../lib/constants.js";

export const CreateNewConversationSchema = z.object({
  body: z.object({
    name: z.string().nullish().default(null),
    type: z.enum(["group", "dm", "channel"]).default("dm"),
    description: z.string().nullish().default(null),
    // dm: exactly one user (added directly, idempotent); group: added
    // directly as members; channel: invited via the invitation flow.
    memberIds: z.array(z.string().nonempty()).default([]),
    // Only honoured for channels — groups are always private and DMs
    // always unlisted.
    visibility: z.enum(["public", "unlisted", "private"]).nullish(),
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

export const ListRecentConversationsInputSchema = z.object({
  ctx: z.object({
    organizationId: z.string().nonempty(),
    userId: z.string(),
  }),
});
export type ListRecentConversationsPropType = z.infer<
  typeof ListRecentConversationsInputSchema
>;

export const ListRecentConversationsHeadersSchema = z.object({
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
// browse channels----
export const BrowseChannelsInputSchema = z.object({
  query: z.object({
    q: z.string().optional(),
  }),
  ctx: z.object({
    organizationId: z.string().nonempty(),
    userId: z.string().nonempty(),
  }),
});
export type BrowseChannelsPropType = z.infer<typeof BrowseChannelsInputSchema>;

export const BrowseChannelsHeadersSchema = z.object({
  [HeaderKeys.organizationId]: z.string().meta({
    description: "Organization to browse channels in.",
  }),
});
// ---

// join channel----
export const JoinChannelInputSchema = z.object({
  body: z.object({
    conversationId: z.string().nonempty(),
  }),
  ctx: z.object({
    organizationId: z.string().nonempty(),
    userId: z.string().nonempty(),
  }),
});
export type JoinChannelPropType = z.infer<typeof JoinChannelInputSchema>;

export const JoinChannelHeadersSchema = z.object({
  [HeaderKeys.organizationId]: z.string().meta({
    description: "Organization the channel belongs to.",
  }),
});
// ---

// respond to invite----
export const RespondInviteInputSchema = z.object({
  body: z.object({
    // The invite is looked up by (recipient, conversation) — that pair is
    // what notification rows carry, and a user has at most one open invite
    // per conversation.
    conversationId: z.string().nonempty(),
  }),
  ctx: z.object({
    organizationId: z.string().nonempty(),
    userId: z.string().nonempty(),
  }),
});
export type RespondInvitePropType = z.infer<typeof RespondInviteInputSchema>;

export const RespondInviteHeadersSchema = z.object({
  [HeaderKeys.organizationId]: z.string().meta({
    description: "Organization the conversation belongs to.",
  }),
});
// ---

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
