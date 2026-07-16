import z from "zod";
import { HeaderKeys } from "../../lib/constants.js";
import { AccessConfigInputSchema } from "../../types/access-config.js";

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

// ---- Workspace members directory & permissions

const OrgScopedHeadersSchema = z.object({
  [HeaderKeys.organizationId]: z.string().meta({
    description: "Workspace being operated on.",
  }),
});

export const ListWorkspaceMembersInputSchema = z.object({
  ctx: z.object({
    organizationId: z.string().nonempty(),
    userId: z.string().nonempty(),
  }),
});
export type ListWorkspaceMembersPropType = z.infer<
  typeof ListWorkspaceMembersInputSchema
>;
export const ListWorkspaceMembersHeadersSchema = OrgScopedHeadersSchema;

export const UpdateWorkspaceMemberRoleInputSchema = z.object({
  body: z.object({
    // member.id of the workspace membership row being changed.
    memberId: z.string().nonempty(),
    role: z.enum(["admin", "member"]),
  }),
  ctx: z.object({
    organizationId: z.string().nonempty(),
    userId: z.string().nonempty(),
  }),
  accessConfig: AccessConfigInputSchema,
});
export type UpdateWorkspaceMemberRolePropType = z.infer<
  typeof UpdateWorkspaceMemberRoleInputSchema
>;
export const UpdateWorkspaceMemberRoleHeadersSchema = OrgScopedHeadersSchema;

export const UpdateWorkspaceMemberAccessInputSchema = z.object({
  body: z.object({
    userId: z.string().nonempty(),
    // Partial per-capability overrides, merged over the role defaults.
    config: z
      .object({
        removeMember: z.boolean().optional(),
        inviteMember: z.boolean().optional(),
        changeMemberConfig: z.boolean().optional(),
        changeMemberRole: z.boolean().optional(),
        aiHubWrite: z.boolean().optional(),
        createChannel: z.boolean().optional(),
      })
      .refine((c) => Object.keys(c).length > 0, {
        message: "config must set at least one capability",
      }),
  }),
  ctx: z.object({
    organizationId: z.string().nonempty(),
    userId: z.string().nonempty(),
  }),
  accessConfig: AccessConfigInputSchema,
});
export type UpdateWorkspaceMemberAccessPropType = z.infer<
  typeof UpdateWorkspaceMemberAccessInputSchema
>;
export const UpdateWorkspaceMemberAccessHeadersSchema = OrgScopedHeadersSchema;

export const RemoveWorkspaceMemberInputSchema = z.object({
  body: z.object({
    // member.id of the workspace membership row being removed.
    memberId: z.string().nonempty(),
  }),
  ctx: z.object({
    organizationId: z.string().nonempty(),
    userId: z.string().nonempty(),
  }),
  accessConfig: AccessConfigInputSchema,
});
export type RemoveWorkspaceMemberPropType = z.infer<
  typeof RemoveWorkspaceMemberInputSchema
>;
export const RemoveWorkspaceMemberHeadersSchema = OrgScopedHeadersSchema;

export const WorkspaceMembersResponseSchema = z.object({
  code: z.number(),
  message: z.string(),
  result: z.any().optional(),
});
