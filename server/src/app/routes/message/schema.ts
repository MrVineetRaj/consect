import z from "zod";
import { HeaderKeys } from "../../lib/constants.js";

export const CreateNewMessageInputSchema = z.object({
  body: z.object({
    content: z.string().nonempty(),
    mentions: z.array(z.string()).default([]),
    parentMessageId: z.string().nullish().default(null),
  }),
  ctx: z.object({
    organizationId: z.string(),
    conversationId: z.string(),
    userId: z.string(),
  }),
});

export const CreateNewMessageHeadersSchema = z.object({
  [HeaderKeys.organizationId]: z.string().meta({
    description: "Organization the conversation belongs to.",
  }),
  [HeaderKeys.conversationId]: z.string().meta({
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

export type CreateNewMessagePropType = z.infer<
  typeof CreateNewMessageInputSchema
>;

// list messages----
export const ListMessagesInputSchema = z.object({
  ctx: z.object({
    conversationId: z.string().nonempty(),
    organizationId: z.string(),
    userId: z.string(),
  }),
});

export const ListMessagesHeadersSchema = z.object({
  [HeaderKeys.conversationId]: z.string().meta({
    description: "Conversation ID",
  }),
  [HeaderKeys.organizationId]: z.string().meta({
    description: "Organization the conversation belongs to.",
  }),
});
export type ListMessagesPropType = z.infer<typeof ListMessagesInputSchema>;

// ---

// update message----
export const UpdateMessageInputSchema = z.object({
  body: z.object({
    id: z.string().nonempty(),
    newContent: z.string().nonempty(),
  }),
  ctx: z.object({
    conversationId: z.string().nonempty(),
    organizationId: z.string(),
    userId: z.string(),
  }),
});

export const UpdateMessageHeadersSchema = z.object({
  [HeaderKeys.conversationId]: z.string().meta({
    description: "Conversation ID",
  }),
  [HeaderKeys.organizationId]: z.string().meta({
    description: "Organization the conversation belongs to.",
  }),
});
export type UpdateMessagePropType = z.infer<typeof UpdateMessageInputSchema>;
// ---
// update message----
export const DeleteMessageInputSchema = z.object({
  query: z.object({
    id: z.string().nonempty(),
  }),
  ctx: z.object({
    conversationId: z.string().nonempty(),
    organizationId: z.string(),
    userId: z.string(),
  }),
});

export const DeleteMessageHeadersSchema = z.object({
  [HeaderKeys.conversationId]: z.string().meta({
    description: "Conversation ID",
  }),
  [HeaderKeys.organizationId]: z.string().meta({
    description: "Organization the conversation belongs to.",
  }),
});
export type DeleteMessagePropType = z.infer<typeof DeleteMessageInputSchema>;
// ---
