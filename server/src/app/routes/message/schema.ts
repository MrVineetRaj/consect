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
    description: "Conversation ID",
  }),
});

export const MessageSchema = z.object({
  id: z.string(),
  senderId: z.string(),
  conversationId: z.string(),
  organizationId: z.string(),
  parentMessageId: z.string().nullable(),
  mentions: z.array(z.string()).nullable(),
  content: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const MessageResponseSchema = z.object({
  code: z.number(),
  message: z.string(),
  result: MessageSchema,
});

export const MessageListResponseSchema = z.object({
  code: z.number(),
  message: z.string(),
  result: z.object({
    messages: z.array(MessageSchema),
    nextCursor: z.string().nullable().meta({
      description:
        "Pass as `before` to fetch the next (older) page. Null when exhausted.",
    }),
    hasMore: z.boolean(),
  }),
});

export type CreateNewMessagePropType = z.infer<
  typeof CreateNewMessageInputSchema
>;

// list messages----
export const ListMessagesInputSchema = z.object({
  query: z.object({
    before: z
      .string()
      .optional()
      .meta({ description: "Message id cursor — return messages older than this." }),
    limit: z.coerce.number().int().min(1).max(100).default(50),
  }),
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

// LLm response schema
export const LLMOptimizedQueriesSchema = z.object({
  queries: z.array(z.string()),
});
