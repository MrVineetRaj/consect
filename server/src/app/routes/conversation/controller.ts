import { HttpResponse } from "../../adapter/http.js";
import { cloudinaryClient } from "../../clients/cloudinary.js";
import { accessConfigRepository } from "../../db/repository/access-config.js";
import { conversationInviteRepository } from "../../db/repository/conservation-invite.js";
import { conversationMemberRepository } from "../../db/repository/conservation-member.js";
import { conversationRepository } from "../../db/repository/conversation.js";
import { fileRepository } from "../../db/repository/file.js";
import { message } from "../../db/schema.js";
import { ResponseCodes } from "../../types/codes.js";
import { messageRepository } from "../../db/repository/messages.js";
import { notificationRepository } from "../../db/repository/notification.js";
import { organizationRepository } from "../../db/repository/organization.js";
import { getChannelAccessConfig } from "../../middleware/access-configs.js";
import { notifyUsersInBackground } from "../../workflow/notify.js";
import { postSystemMessageInBackground } from "../../workflow/system-message.js";
import type {
  BrowseChannelsPropType,
  CreateNewConversationPropType,
  DeleteMultipleSentInvitePropType,
  GetConversationDetailsPropType,
  JoinChannelPropType,
  ListConversationFilesPropType,
  ListConversationMemberPropType,
  ListRecentConversationsPropType,
  RemoveMemberPropType,
  RespondInvitePropType,
  SendInvitePropType,
  UpdateMemberAccessPropType,
  UpdateMemberRolePropType,
} from "./schema.js";

const escapeHtml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

class Controller {
  /** Announce a newly joined member inside the conversation. */
  private async announceJoin(args: {
    userId: string;
    conversationId: string;
    organizationId: string;
  }) {
    const joinedUser = await messageRepository.getUserById({
      id: args.userId,
    });
    postSystemMessageInBackground({
      conversationId: args.conversationId,
      organizationId: args.organizationId,
      content: `<p>${escapeHtml(joinedUser?.name ?? "Someone")} joined</p>`,
    });
  }

  async createNewConversation({
    ctx,
    body,
    accessConfig,
  }: CreateNewConversationPropType) {
    // Channel creation is a workspace capability (default-on, revocable per
    // member). Groups and DMs stay open to everyone.
    if (
      body.type === "channel" &&
      accessConfig?.organization?.createChannel !== true
    ) {
      return new HttpResponse({
        code: ResponseCodes.FORBIDDEN,
        message: "You are not allowed to create channels in this workspace",
      });
    }

    const memberIds = Array.from(new Set(body.memberIds)).filter(
      (id) => id !== ctx.userId,
    );

    // Everyone being added or invited must belong to this workspace.
    const orgMemberIds =
      await organizationRepository.filterOrganizationMemberUserIds({
        organizationId: ctx.organizationId,
        userIds: memberIds,
      });
    if (orgMemberIds.length !== memberIds.length) {
      return new HttpResponse({
        code: ResponseCodes.UNPROCESSABLE_ENTITY,
        message: "All members must belong to this workspace",
      });
    }

    if (body.type === "dm") {
      if (memberIds.length !== 1) {
        return new HttpResponse({
          code: ResponseCodes.UNPROCESSABLE_ENTITY,
          message: "A DM needs exactly one other member",
        });
      }

      // DMs are idempotent — reuse the existing 1:1 conversation.
      const existingDM = await conversationRepository.getExistingDMBetweenUsers(
        {
          organizationId: ctx.organizationId,
          userIds: [ctx.userId, memberIds[0]!],
        },
      );
      if (existingDM) {
        return new HttpResponse({
          code: ResponseCodes.SUCCESS,
          message: "Conversation already exists",
          result: existingDM,
        });
      }
    }

    if (body.type === "group" && memberIds.length === 0) {
      return new HttpResponse({
        code: ResponseCodes.UNPROCESSABLE_ENTITY,
        message: "A group needs at least one other member",
      });
    }

    // Groups are always private and DMs always unlisted; only channels get
    // to choose (public = listed in the browser, unlisted = search-only,
    // private = invite-only).
    const visibility =
      body.type === "group"
        ? ("private" as const)
        : body.type === "dm"
          ? ("unlisted" as const)
          : (body.visibility ?? ("public" as const));

    const result = await conversationRepository.createNewConversation({
      name: body.name,
      type: body.type,
      description: body.description,
      visibility,
      organizationId: ctx.organizationId,
    });
    await conversationMemberRepository.createNewConversationMember({
      userId: ctx.userId,
      conversationId: result?.id!,
      role: "owner",
    });

    if (result && memberIds.length > 0) {
      if (body.type === "channel") {
        // Channel members join through the invitation flow.
        await conversationInviteRepository.createMultipleConversationInvitation(
          {
            senderId: ctx.userId,
            forUsers: memberIds,
            conversationId: result.id,
            expiry: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000),
            role: "member",
          },
        );
        notifyUsersInBackground({
          userIds: memberIds,
          organizationId: ctx.organizationId,
          type: "conversation_invite",
          actorId: ctx.userId,
          conversationId: result.id,
          data: { role: "member" },
        });
      } else {
        // DMs and groups add everyone directly — no invitation round-trip.
        await conversationMemberRepository.createMultipleConversationMembers({
          conversationId: result.id,
          userIds: memberIds,
          role: "member",
        });
      }
    }

    return new HttpResponse({
      code: ResponseCodes.CREATED,
      message: "New conversation is created",
      result,
    });
  }

  async listRecentConversations({ ctx }: ListRecentConversationsPropType) {
    const channels = await conversationRepository.getUserChannels({
      userId: ctx.userId,
      organizationId: ctx.organizationId,
    });
    const dmAndGroups = await conversationRepository.getUserRecentGroupsAndDMs({
      userId: ctx.userId,
      organizationId: ctx.organizationId,
    });

    return new HttpResponse({
      code: ResponseCodes.SUCCESS,
      message: "Fetched Channels and Recent groups and DMs",
      result: {
        channels,
        dmAndGroups,
      },
    });
  }

  /**
   * Every group and DM the user belongs to — no recency cutoff, unlike
   * /recent. Backs the DM page sidebar.
   */
  async listGroupsAndDMs({ ctx }: ListRecentConversationsPropType) {
    const dmAndGroups = await conversationRepository.getUserGroupsAndDMs({
      userId: ctx.userId,
      organizationId: ctx.organizationId,
    });

    return new HttpResponse({
      code: ResponseCodes.SUCCESS,
      message: "Fetched all groups and DMs",
      result: { dmAndGroups },
    });
  }

  async listConversationMember({ ctx }: ListConversationMemberPropType) {
    const result =
      await conversationMemberRepository.getConversationMembersByConversationId(
        {
          conversationId: ctx.conversationId,
        },
      );

    return new HttpResponse({
      code: ResponseCodes.SUCCESS,
      message: "List of members fetched",
      result,
    });
  }
  
  /**
   * Everything the details page needs in one call: the conversation, every
   * member with their effective per-channel access (role defaults merged
   * with any stored override), and the requester's own membership.
   */
  async getConversationDetails({ ctx }: GetConversationDetailsPropType) {
    const conversation = await conversationRepository.getConversationById({
      id: ctx.conversationId,
    });

    if (!conversation || conversation.organizationId !== ctx.organizationId) {
      return new HttpResponse({
        code: ResponseCodes.NOT_FOUND,
        message: "Conversation not found",
      });
    }

    const members =
      await conversationMemberRepository.getConversationMembersByConversationId(
        { conversationId: ctx.conversationId },
      );

    const myMembership = members.find((m) => m.userId === ctx.userId);
    if (!myMembership) {
      return new HttpResponse({
        code: ResponseCodes.FORBIDDEN,
        message: "You are not member of this conversation",
      });
    }

    const overrides = await accessConfigRepository.getAccessConfigsBySpace({
      organizationId: ctx.organizationId,
      spaceId: ctx.conversationId,
      spaceType: "channel",
    });
    const overridesByUser = new Map(
      overrides.map((o) => [
        o.userId,
        (o.config as Record<string, boolean>) ?? {},
      ]),
    );

    // Workspace owners/admins trump channel roles and overrides (mirrors
    // the boost in authMiddleware), so surface their org role too.
    const orgRoles = await organizationRepository.getOrganizationMemberRoles({
      organizationId: ctx.organizationId,
      userIds: members.map((m) => m.userId),
    });
    const orgRoleByUser = new Map(orgRoles.map((r) => [r.userId, r.role]));

    const memberRows = members.map((m) => {
      const override = overridesByUser.get(m.userId) ?? {};
      const orgRole = orgRoleByUser.get(m.userId) ?? null;
      const orgPrivileged = orgRole === "owner" || orgRole === "admin";
      return {
        memberId: m.id,
        userId: m.userId,
        role: m.role,
        orgRole,
        name: m.user.name,
        email: m.user.email,
        image: m.user.image,
        joinedAt: m.createdAt,
        access: orgPrivileged
          ? getChannelAccessConfig("owner")
          : { ...getChannelAccessConfig(m.role), ...override },
        overrides: override,
      };
    });

    // Owner first, then admins, then members — alphabetical within each.
    const roleRank = { owner: 0, admin: 1, member: 2 };
    memberRows.sort(
      (a, b) =>
        roleRank[a.role ?? "member"] - roleRank[b.role ?? "member"] ||
        a.name.localeCompare(b.name, undefined, { numeric: true }),
    );

    return new HttpResponse({
      code: ResponseCodes.SUCCESS,
      message: "Conversation details fetched",
      result: {
        conversation,
        members: memberRows,
        my: memberRows.find((m) => m.userId === ctx.userId),
      },
    });
  }

  /** Files attached to messages in this conversation, for the details page. */
  async listConversationFiles({ ctx }: ListConversationFilesPropType) {
    const membership =
      await conversationMemberRepository.getConversationMembershipOfUser({
        userId: ctx.userId,
        conversationId: ctx.conversationId,
      });

    if (!membership) {
      return new HttpResponse({
        code: ResponseCodes.FORBIDDEN,
        message: "You are not member of this conversation",
      });
    }

    const files = await fileRepository.getFilesByConversationId({
      conversationId: ctx.conversationId,
      organizationId: ctx.organizationId,
    });

    const result = files
      .filter((f) => f.publicId)
      .map((f) => ({
        ...f,
        url: cloudinaryClient.getSecureUrl({ publicId: f.publicId! }),
      }));

    return new HttpResponse({
      code: ResponseCodes.SUCCESS,
      message: "Conversation files fetched",
      result,
    });
  }

  async updateMemberRole({ ctx, body, accessConfig }: UpdateMemberRolePropType) {
    if (accessConfig?.channel?.changeMemberRole !== true) {
      return new HttpResponse({
        code: ResponseCodes.FORBIDDEN,
        message: "You are not allowed to change member roles here",
      });
    }

    const target = await conversationMemberRepository.getConversationMemberById(
      { id: body.memberId },
    );
    if (!target || target.conversationId !== ctx.conversationId) {
      return new HttpResponse({
        code: ResponseCodes.NOT_FOUND,
        message: "Member not found in this conversation",
      });
    }

    if (target.role === "owner") {
      return new HttpResponse({
        code: ResponseCodes.UNPROCESSABLE_ENTITY,
        message: "The owner's role cannot be changed",
      });
    }
    if (target.userId === ctx.userId) {
      return new HttpResponse({
        code: ResponseCodes.UNPROCESSABLE_ENTITY,
        message: "You cannot change your own role",
      });
    }

    const result = await conversationMemberRepository.updateConversationMemberRole(
      { id: body.memberId, newRole: body.role },
    );

    return new HttpResponse({
      code: ResponseCodes.SUCCESS,
      message: "Member role updated",
      result,
    });
  }

  async updateMemberAccess({
    ctx,
    body,
    accessConfig,
  }: UpdateMemberAccessPropType) {
    if (accessConfig?.channel?.changeMemberConfig !== true) {
      return new HttpResponse({
        code: ResponseCodes.FORBIDDEN,
        message: "You are not allowed to change member access here",
      });
    }

    const target =
      await conversationMemberRepository.getConversationMembershipOfUser({
        userId: body.userId,
        conversationId: ctx.conversationId,
      });
    if (!target) {
      return new HttpResponse({
        code: ResponseCodes.NOT_FOUND,
        message: "Member not found in this conversation",
      });
    }

    if (target.role === "owner") {
      return new HttpResponse({
        code: ResponseCodes.UNPROCESSABLE_ENTITY,
        message: "The owner's access cannot be restricted",
      });
    }
    if (body.userId === ctx.userId) {
      return new HttpResponse({
        code: ResponseCodes.UNPROCESSABLE_ENTITY,
        message: "You cannot change your own access",
      });
    }

    // Drop overrides that just restate the role default so rows stay minimal.
    const defaults = getChannelAccessConfig(target.role) as Record<
      string,
      boolean
    >;
    const override = await accessConfigRepository.upsertAccessConfigForUserInSpace(
      {
        userId: body.userId,
        organizationId: ctx.organizationId,
        spaceId: ctx.conversationId,
        spaceType: "channel",
        config: body.config as Record<string, boolean>,
      },
    );

    const merged = (override?.config as Record<string, boolean>) ?? {};

    return new HttpResponse({
      code: ResponseCodes.SUCCESS,
      message: "Member access updated",
      result: {
        userId: body.userId,
        access: { ...defaults, ...merged },
        overrides: merged,
      },
    });
  }

  async removeMember({ ctx, body, accessConfig }: RemoveMemberPropType) {
    if (accessConfig?.channel?.removeMember !== true) {
      return new HttpResponse({
        code: ResponseCodes.FORBIDDEN,
        message: "You are not allowed to remove members here",
      });
    }

    const target = await conversationMemberRepository.getConversationMemberById(
      { id: body.memberId },
    );
    if (!target || target.conversationId !== ctx.conversationId) {
      return new HttpResponse({
        code: ResponseCodes.NOT_FOUND,
        message: "Member not found in this conversation",
      });
    }

    if (target.role === "owner") {
      return new HttpResponse({
        code: ResponseCodes.UNPROCESSABLE_ENTITY,
        message: "The owner cannot be removed",
      });
    }
    if (target.userId === ctx.userId) {
      return new HttpResponse({
        code: ResponseCodes.UNPROCESSABLE_ENTITY,
        message: "You cannot remove yourself",
      });
    }

    await conversationMemberRepository.deleteConversationMember({
      id: body.memberId,
    });
    // Their per-channel override is meaningless without membership.
    await accessConfigRepository.deleteAccessConfigForUserInSpace({
      userId: target.userId,
      organizationId: ctx.organizationId,
      spaceId: ctx.conversationId,
      spaceType: "channel",
    });

    const removedUser = await messageRepository.getUserById({
      id: target.userId,
    });
    postSystemMessageInBackground({
      conversationId: ctx.conversationId,
      organizationId: ctx.organizationId,
      content: `<p>${escapeHtml(removedUser?.name ?? "Someone")} was removed</p>`,
    });

    return new HttpResponse({
      code: ResponseCodes.SUCCESS,
      message: "Member removed",
    });
  }

  async sendInvite({ ctx, body, accessConfig }: SendInvitePropType) {
    // Default-on for every member; a per-member override can revoke it.
    if (accessConfig?.channel?.inviteMember !== true) {
      return new HttpResponse({
        code: ResponseCodes.FORBIDDEN,
        message: "You are not allowed to invite members here",
      });
    }

    const forUsers = Array.from(new Set(body.forUsers)).filter(
      (id) => id !== ctx.userId,
    );

    if (forUsers.length === 0) {
      return new HttpResponse({
        code: ResponseCodes.UNPROCESSABLE_ENTITY,
        message: "No users to invite",
      });
    }

    // Invitees must belong to this workspace.
    const orgMemberIds =
      await organizationRepository.filterOrganizationMemberUserIds({
        organizationId: ctx.organizationId,
        userIds: forUsers,
      });
    if (orgMemberIds.length !== forUsers.length) {
      return new HttpResponse({
        code: ResponseCodes.UNPROCESSABLE_ENTITY,
        message: "All invitees must belong to this workspace",
      });
    }

    const result =
      await conversationInviteRepository.createMultipleConversationInvitation({
        senderId: ctx.userId,
        forUsers,
        conversationId: ctx.conversationId,
        expiry: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000),
        role: body.role,
      });

    // todo : send email if user not online

    if (result) {
      notifyUsersInBackground({
        userIds: forUsers,
        organizationId: ctx.organizationId,
        type: "conversation_invite",
        actorId: ctx.userId,
        conversationId: ctx.conversationId,
        data: { role: body.role },
      });
    }

    if (!result) {
      return new HttpResponse({
        code: ResponseCodes.CREATED,
        message: "Failed to invite user(s)",
      });
    }

    return new HttpResponse({
      code: ResponseCodes.CREATED,
      message: "Invitation sent successfully",
      result,
    });
  }

  async browseChannels({ ctx, query }: BrowseChannelsPropType) {
    const result = await conversationRepository.browseChannels({
      organizationId: ctx.organizationId,
      userId: ctx.userId,
      query: query.q,
    });

    return new HttpResponse({
      code: ResponseCodes.SUCCESS,
      message: "Fetched channels",
      result,
    });
  }

  async joinChannel({ ctx, body }: JoinChannelPropType) {
    const channel = await conversationRepository.getConversationById({
      id: body.conversationId,
    });

    if (
      !channel ||
      channel.organizationId !== ctx.organizationId ||
      channel.type !== "channel"
    ) {
      return new HttpResponse({
        code: ResponseCodes.NOT_FOUND,
        message: "Channel not found",
      });
    }

    if (channel.visibility === "private") {
      return new HttpResponse({
        code: ResponseCodes.FORBIDDEN,
        message: "This channel is invite-only",
      });
    }

    const existingMembership =
      await conversationMemberRepository.getConversationMembershipOfUser({
        userId: ctx.userId,
        conversationId: channel.id,
      });

    if (!existingMembership) {
      await conversationMemberRepository.createNewConversationMember({
        userId: ctx.userId,
        conversationId: channel.id,
        role: "member",
      });
      await this.announceJoin({
        userId: ctx.userId,
        conversationId: channel.id,
        organizationId: ctx.organizationId,
      });
    }

    return new HttpResponse({
      code: ResponseCodes.SUCCESS,
      message: "Joined channel",
      result: channel,
    });
  }

  async acceptInvite({ ctx, body }: RespondInvitePropType) {
    const invitation =
      await conversationInviteRepository.getInvitationForUserInConversation({
        userId: ctx.userId,
        conversationId: body.conversationId,
      });

    if (!invitation) {
      return new HttpResponse({
        code: ResponseCodes.NOT_FOUND,
        message: "Invitation not found",
      });
    }

    if (invitation.expiry && invitation.expiry < new Date()) {
      await conversationInviteRepository.deleteConversationInvitation({
        id: invitation.id,
      });
      return new HttpResponse({
        code: ResponseCodes.BAD_REQUEST,
        message: "Invitation has expired",
      });
    }

    const existingMembership =
      await conversationMemberRepository.getConversationMembershipOfUser({
        userId: ctx.userId,
        conversationId: invitation.conversationId,
      });

    if (!existingMembership) {
      await conversationMemberRepository.createNewConversationMember({
        userId: ctx.userId,
        conversationId: invitation.conversationId,
        role: invitation.role ?? "member",
      });
      await this.announceJoin({
        userId: ctx.userId,
        conversationId: invitation.conversationId,
        organizationId: ctx.organizationId,
      });
    }

    await conversationInviteRepository.deleteConversationInvitation({
      id: invitation.id,
    });
    await notificationRepository.markInviteNotificationsResponded({
      userId: ctx.userId,
      conversationId: invitation.conversationId,
      response: "accepted",
    });

    const result = await conversationRepository.getConversationById({
      id: invitation.conversationId,
    });

    return new HttpResponse({
      code: ResponseCodes.SUCCESS,
      message: "Invitation accepted",
      result,
    });
  }

  async declineInvite({ ctx, body }: RespondInvitePropType) {
    const invitation =
      await conversationInviteRepository.getInvitationForUserInConversation({
        userId: ctx.userId,
        conversationId: body.conversationId,
      });

    if (!invitation) {
      return new HttpResponse({
        code: ResponseCodes.NOT_FOUND,
        message: "Invitation not found",
      });
    }

    await conversationInviteRepository.deleteConversationInvitation({
      id: invitation.id,
    });
    await notificationRepository.markInviteNotificationsResponded({
      userId: ctx.userId,
      conversationId: invitation.conversationId,
      response: "declined",
    });

    return new HttpResponse({
      code: ResponseCodes.SUCCESS,
      message: "Invitation declined",
    });
  }

  async deleteMultipleSentInvite({
    ctx,
    body,
  }: DeleteMultipleSentInvitePropType) {
    await conversationInviteRepository.deleteMultipleConversationInvitation({
      invitationIds: body.invitationIds,
      senderId: ctx.userId,
    });

    return new HttpResponse({
      code: ResponseCodes.SUCCESS,
      message: "Multiple Invitations Deleted",
    });
  }
}

export const controller = new Controller();
