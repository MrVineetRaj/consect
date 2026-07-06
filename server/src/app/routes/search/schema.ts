import z from "zod";
import { HeaderKeys } from "../../lib/constants.js";

export const WorkspaceSearchInputSchema = z.object({
  query: z.object({
    q: z.string().nonempty(),
  }),
  ctx: z.object({
    organizationId: z.string().nonempty(),
    userId: z.string().nonempty(),
  }),
});
export type WorkspaceSearchPropType = z.infer<
  typeof WorkspaceSearchInputSchema
>;

export const WorkspaceSearchHeadersSchema = z.object({
  [HeaderKeys.organizationId]: z.string().meta({
    description: "Organization (workspace) to search in.",
  }),
});

export const WorkspaceSearchResponseSchema = z.object({
  code: z.number(),
  message: z.string(),
  result: z.any().optional(),
});
