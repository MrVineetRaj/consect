import { HttpResponse } from "../../adapter/http.js";
import { accessConfigRepository } from "../../db/repository/access-config.js";
import { conversationMemberRepository } from "../../db/repository/conservation-member.js";
import { organizationRepository } from "../../db/repository/organization.js";
import { generateBase64String } from "../../lib/utils.js";
import { getOrganizationAccessConfig } from "../../middleware/access-configs.js";
import { ResponseCodes } from "../../types/codes.js";
import type {
  CreateOrganizationPropType,
  ListOrganizationsPropType,
  ListWorkspaceMembersPropType,
  RemoveWorkspaceMemberPropType,
  UpdateWorkspaceMemberAccessPropType,
  UpdateWorkspaceMemberRolePropType,
} from "./schema.js";

/** Turns a free-form name into a url-safe slug fragment. */
function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

class Controller {
  async listOrganizations({ ctx }: ListOrganizationsPropType) {
    const organizations = await organizationRepository.getUserOrganizations({
      userId: ctx.userId,
    });

    return new HttpResponse({
      code: ResponseCodes.SUCCESS,
      message: "Organizations fetched",
      result: organizations,
    });
  }

  async createOrganization({ ctx, body }: CreateOrganizationPropType) {
    // Build a unique slug from the name, retrying with a random suffix on
    // collision so two organizations can share a display name.
    const base = slugify(body.name) || "org";
    let slug = base;
    let attempts = 0;
    while (await organizationRepository.getOrganizationBySlug({ slug })) {
      slug = `${base}-${generateBase64String(6).toLowerCase().replace(/[^a-z0-9]/g, "")}`;
      if (++attempts > 5) break;
    }

    const organization = await organizationRepository.createOrganization({
      userId: ctx.userId,
      name: body.name,
      slug,
      logo: body.logo ?? null,
    });

    if (!organization) {
      return new HttpResponse({
        code: ResponseCodes.SERVICE_UNAVAILABLE,
        message: "Failed to create organization",
      });
    }

    return new HttpResponse({
      code: ResponseCodes.CREATED,
      message: "Organization created",
      result: organization,
    });
  }

  /**
   * Workspace directory: every member with their effective org-level access
   * (role defaults merged with stored overrides; owners always full).
   */
  async listWorkspaceMembers({ ctx }: ListWorkspaceMembersPropType) {
    const members = await organizationRepository.getOrganizationMembersWithUsers(
      { organizationId: ctx.organizationId },
    );

    const myMembership = members.find((m) => m.userId === ctx.userId);
    if (!myMembership) {
      return new HttpResponse({
        code: ResponseCodes.FORBIDDEN,
        message: "You are not a member of this workspace",
      });
    }

    const overrides = await accessConfigRepository.getAccessConfigsBySpace({
      organizationId: ctx.organizationId,
      spaceId: ctx.organizationId,
      spaceType: "organization",
    });
    const overridesByUser = new Map(
      overrides.map((o) => [
        o.userId,
        (o.config as Record<string, boolean>) ?? {},
      ]),
    );

    const memberRows = members.map((m) => {
      const override = overridesByUser.get(m.userId) ?? {};
      return {
        memberId: m.id,
        userId: m.userId,
        role: m.role,
        name: m.user.name,
        email: m.user.email,
        image: m.user.image,
        joinedAt: m.createdAt,
        access:
          m.role === "owner"
            ? getOrganizationAccessConfig("owner")
            : { ...getOrganizationAccessConfig(m.role), ...override },
        overrides: override,
      };
    });

    // Owner first, then admins, then members — alphabetical within each.
    const roleRank = { owner: 0, admin: 1, member: 2 };
    memberRows.sort(
      (a, b) =>
        roleRank[a.role] - roleRank[b.role] ||
        a.name.localeCompare(b.name, undefined, { numeric: true }),
    );

    return new HttpResponse({
      code: ResponseCodes.SUCCESS,
      message: "Workspace members fetched",
      result: {
        members: memberRows,
        my: memberRows.find((m) => m.userId === ctx.userId),
      },
    });
  }

  async updateWorkspaceMemberRole({
    ctx,
    body,
    accessConfig,
  }: UpdateWorkspaceMemberRolePropType) {
    if (accessConfig?.organization?.changeMemberRole !== true) {
      return new HttpResponse({
        code: ResponseCodes.FORBIDDEN,
        message: "You are not allowed to change workspace roles",
      });
    }

    const target = await organizationRepository.getOrganizationMemberById({
      id: body.memberId,
    });
    if (!target || target.organizationId !== ctx.organizationId) {
      return new HttpResponse({
        code: ResponseCodes.NOT_FOUND,
        message: "Member not found in this workspace",
      });
    }

    if (target.role === "owner") {
      return new HttpResponse({
        code: ResponseCodes.UNPROCESSABLE_ENTITY,
        message: "The workspace owner's role cannot be changed",
      });
    }
    if (target.userId === ctx.userId) {
      return new HttpResponse({
        code: ResponseCodes.UNPROCESSABLE_ENTITY,
        message: "You cannot change your own role",
      });
    }

    const result = await organizationRepository.updateOrganizationMemberRole({
      id: body.memberId,
      newRole: body.role,
    });

    return new HttpResponse({
      code: ResponseCodes.SUCCESS,
      message: "Workspace role updated",
      result,
    });
  }

  async updateWorkspaceMemberAccess({
    ctx,
    body,
    accessConfig,
  }: UpdateWorkspaceMemberAccessPropType) {
    if (accessConfig?.organization?.changeMemberConfig !== true) {
      return new HttpResponse({
        code: ResponseCodes.FORBIDDEN,
        message: "You are not allowed to change workspace member access",
      });
    }

    const targetRoles = await organizationRepository.getOrganizationMemberRoles({
      organizationId: ctx.organizationId,
      userIds: [body.userId],
    });
    const target = targetRoles[0];
    if (!target) {
      return new HttpResponse({
        code: ResponseCodes.NOT_FOUND,
        message: "Member not found in this workspace",
      });
    }

    if (target.role === "owner") {
      return new HttpResponse({
        code: ResponseCodes.UNPROCESSABLE_ENTITY,
        message: "The workspace owner's access cannot be restricted",
      });
    }
    if (body.userId === ctx.userId) {
      return new HttpResponse({
        code: ResponseCodes.UNPROCESSABLE_ENTITY,
        message: "You cannot change your own access",
      });
    }

    const override = await accessConfigRepository.upsertAccessConfigForUserInSpace(
      {
        userId: body.userId,
        organizationId: ctx.organizationId,
        spaceId: ctx.organizationId,
        spaceType: "organization",
        config: body.config as Record<string, boolean>,
      },
    );

    const merged = (override?.config as Record<string, boolean>) ?? {};

    return new HttpResponse({
      code: ResponseCodes.SUCCESS,
      message: "Workspace member access updated",
      result: {
        userId: body.userId,
        access: { ...getOrganizationAccessConfig(target.role), ...merged },
        overrides: merged,
      },
    });
  }

  async removeWorkspaceMember({
    ctx,
    body,
    accessConfig,
  }: RemoveWorkspaceMemberPropType) {
    if (accessConfig?.organization?.removeMember !== true) {
      return new HttpResponse({
        code: ResponseCodes.FORBIDDEN,
        message: "You are not allowed to remove workspace members",
      });
    }

    const target = await organizationRepository.getOrganizationMemberById({
      id: body.memberId,
    });
    if (!target || target.organizationId !== ctx.organizationId) {
      return new HttpResponse({
        code: ResponseCodes.NOT_FOUND,
        message: "Member not found in this workspace",
      });
    }

    if (target.role === "owner") {
      return new HttpResponse({
        code: ResponseCodes.UNPROCESSABLE_ENTITY,
        message: "The workspace owner cannot be removed",
      });
    }
    if (target.userId === ctx.userId) {
      return new HttpResponse({
        code: ResponseCodes.UNPROCESSABLE_ENTITY,
        message: "You cannot remove yourself",
      });
    }

    await organizationRepository.deleteOrganizationMember({
      id: body.memberId,
    });
    // Membership everywhere inside the workspace goes with it.
    await conversationMemberRepository.deleteUserMembershipsInOrganization({
      userId: target.userId,
      organizationId: ctx.organizationId,
    });
    await accessConfigRepository.deleteAccessConfigsForUserInOrganization({
      userId: target.userId,
      organizationId: ctx.organizationId,
    });

    return new HttpResponse({
      code: ResponseCodes.SUCCESS,
      message: "Workspace member removed",
    });
  }
}

export const controller = new Controller();
