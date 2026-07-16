import { createApiRouter } from "../../adapter/openapi.js";
import { authMiddleware } from "../../middleware/auth.js";
import { controller } from "./controller.js";
import {
  ListOrganizationsInputSchema,
  ListOrganizationsHeadersSchema,
  ListOrganizationsResponseSchema,
  CreateOrganizationInputSchema,
  CreateOrganizationHeadersSchema,
  CreateOrganizationResponseSchema,
  ListWorkspaceMembersInputSchema,
  ListWorkspaceMembersHeadersSchema,
  UpdateWorkspaceMemberRoleInputSchema,
  UpdateWorkspaceMemberRoleHeadersSchema,
  UpdateWorkspaceMemberAccessInputSchema,
  UpdateWorkspaceMemberAccessHeadersSchema,
  RemoveWorkspaceMemberInputSchema,
  RemoveWorkspaceMemberHeadersSchema,
  WorkspaceMembersResponseSchema,
} from "./schema.js";

export const ORGANIZATION_BASE_PATH = "/api/v1/organization";

const api = createApiRouter(ORGANIZATION_BASE_PATH);

api.get("/", authMiddleware, {
  schema: ListOrganizationsInputSchema,
  response: ListOrganizationsResponseSchema,
  headers: ListOrganizationsHeadersSchema,
  auth: true,
  handler: controller.listOrganizations.bind(controller),
  summary: "List organizations the current user belongs to",
  tags: ["Organization"],
});

api.post("/", authMiddleware, {
  schema: CreateOrganizationInputSchema,
  response: CreateOrganizationResponseSchema,
  headers: CreateOrganizationHeadersSchema,
  auth: true,
  handler: controller.createOrganization.bind(controller),
  summary: "Create a new organization owned by the current user",
  tags: ["Organization"],
});

api.get("/members", authMiddleware, {
  schema: ListWorkspaceMembersInputSchema,
  response: WorkspaceMembersResponseSchema,
  headers: ListWorkspaceMembersHeadersSchema,
  auth: true,
  handler: controller.listWorkspaceMembers.bind(controller),
  summary: "Workspace members with their effective org-level access",
  tags: ["Organization"],
});

api.patch("/member/role", authMiddleware, {
  schema: UpdateWorkspaceMemberRoleInputSchema,
  response: WorkspaceMembersResponseSchema,
  headers: UpdateWorkspaceMemberRoleHeadersSchema,
  auth: true,
  handler: controller.updateWorkspaceMemberRole.bind(controller),
  summary: "Change a workspace member's role",
  tags: ["Organization"],
});

api.patch("/member/access", authMiddleware, {
  schema: UpdateWorkspaceMemberAccessInputSchema,
  response: WorkspaceMembersResponseSchema,
  headers: UpdateWorkspaceMemberAccessHeadersSchema,
  auth: true,
  handler: controller.updateWorkspaceMemberAccess.bind(controller),
  summary: "Override a workspace member's org-level capabilities",
  tags: ["Organization"],
});

api.delete("/member", authMiddleware, {
  schema: RemoveWorkspaceMemberInputSchema,
  response: WorkspaceMembersResponseSchema,
  headers: RemoveWorkspaceMemberHeadersSchema,
  auth: true,
  handler: controller.removeWorkspaceMember.bind(controller),
  summary: "Remove a member from the workspace",
  tags: ["Organization"],
});

export const router = api.router;
