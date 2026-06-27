import z from "zod";
import { HeaderKeys } from "../../lib/constants.js";

export const CreateApiKeyInputSchema = z.object({
  body: z.object({
    name: z.string().nonempty(),
  }),
  ctx: z.object({
    organizationId: z.string().nonempty(),
    userId: z.string().nonempty(),
  }),
});
export type CreateApiKeyPropType = z.infer<typeof CreateApiKeyInputSchema>;

export const CreateApiKeyHeadersSchema = z.object({
  [HeaderKeys.organizationId]: z.string().meta({
    description: "Organization the API key belongs to.",
  }),
});

export const ListApiKeysInputSchema = z.object({
  ctx: z.object({
    organizationId: z.string().nonempty(),
    userId: z.string().nonempty(),
  }),
});
export type ListApiKeysPropType = z.infer<typeof ListApiKeysInputSchema>;

export const ListApiKeysHeadersSchema = z.object({
  [HeaderKeys.organizationId]: z.string().meta({
    description: "Organization the API keys belong to.",
  }),
});

export const DeleteApiKeyInputSchema = z.object({
  body: z.object({
    id: z.string().nonempty(),
  }),
  ctx: z.object({
    organizationId: z.string().nonempty(),
    userId: z.string().nonempty(),
  }),
});
export type DeleteApiKeyPropType = z.infer<typeof DeleteApiKeyInputSchema>;

export const DeleteApiKeyHeadersSchema = z.object({
  [HeaderKeys.organizationId]: z.string().meta({
    description: "Organization the API key belongs to.",
  }),
});

export const ApiKeyResponseSchema = z.object({
  code: z.number(),
  message: z.string(),
  result: z.any().optional(),
});
