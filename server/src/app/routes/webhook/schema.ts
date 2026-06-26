import z from "zod";
import { HeaderKeys } from "../../lib/constants.js";

export const ResourceTypeSchema = z.enum(["doc", "pdf", "url", "text", "md"]);

export const CreateResourceInputSchema = z.object({
  body: z.object({
    type: ResourceTypeSchema,
    // The raw resource (a URL, pasted text/markdown, or extracted file text).
    // It is fed to the embedding pipeline; only the resulting embeddingId is
    // persisted on the resource row.
    content: z.string().nonempty(),
    tags: z.array(z.string()).default([]),
    allowedChannelIds: z.array(z.string()).default([]),
  }),
  ctx: z.object({
    organizationId: z.string().nonempty(),
    userId: z.string().nonempty(),
  }),
});
export type CreateResourcePropType = z.infer<typeof CreateResourceInputSchema>;

export const CreateResourceHeadersSchema = z.object();

export const EmbeddingStatusUpdateInputSchema = z.object({
  body: z.object({
    resourceId: z.string().nonempty(),
    pointIds: z.array(z.string()),
    status: z.enum(["failed", "success"]).default("failed"),
  }),
});

export type EmbeddingStatusUpdatePropType = z.infer<
  typeof EmbeddingStatusUpdateInputSchema
>;

export const EmbeddingStatusUpdateHeadersSchema = z.object({});

export const DeleteResourceInputSchema = z.object({
  body: z.object({
    id: z.string().nonempty(),
  }),
  ctx: z.object({
    organizationId: z.string().nonempty(),
    userId: z.string(),
  }),
});
export type DeleteResourcePropType = z.infer<typeof DeleteResourceInputSchema>;

export const DeleteResourceHeadersSchema = z.object({
  [HeaderKeys.organizationId]: z.string().meta({
    description: "Organization the resource belongs to.",
  }),
});

export const AiHubResponseSchema = z.object({
  code: z.number(),
  message: z.string(),
  result: z.any().optional(),
});
