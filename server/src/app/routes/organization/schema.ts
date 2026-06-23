import z from "zod";

const OrganizationResultSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  logo: z.string().nullable(),
  metadata: z.string().nullable(),
  createdAt: z.date(),
  role: z.enum(["owner", "admin", "member"]),
});

// ---- List Organizations
export const ListOrganizationsInputSchema = z.object({
  ctx: z.object({
    userId: z.string(),
  }),
});

export const ListOrganizationsHeadersSchema = z.object({});

export const ListOrganizationsResponseSchema = z.object({
  code: z.number(),
  message: z.string(),
  result: z.array(OrganizationResultSchema),
});

export type ListOrganizationsPropType = z.infer<
  typeof ListOrganizationsInputSchema
>;

// ---- Create Organization
export const CreateOrganizationInputSchema = z.object({
  body: z.object({
    name: z.string().nonempty(),
    logo: z.string().nullish(),
  }),
  ctx: z.object({
    userId: z.string(),
  }),
});

export const CreateOrganizationHeadersSchema = z.object({});

export const CreateOrganizationResponseSchema = z.object({
  code: z.number(),
  message: z.string(),
  result: OrganizationResultSchema,
});

export type CreateOrganizationPropType = z.infer<
  typeof CreateOrganizationInputSchema
>;
