import { HttpResponse } from "../../adapter/http.js";
import { conversationInviteRepository } from "../../db/repository/conservation-invite.js";
import { conversationMemberRepository } from "../../db/repository/conservation-member.js";
import { conversationRepository } from "../../db/repository/conversation.js";
import { message } from "../../db/schema.js";
import { ResponseCodes } from "../../types/codes.js";
import { notificationRepository } from "../../db/repository/notification.js";
import { organizationRepository } from "../../db/repository/organization.js";
import { notifyUsersInBackground } from "../../workflow/notify.js";
import type {
  BrowseChannelsPropType,
  CreateNewConversationPropType,
  DeleteMultipleSentInvitePropType,
  JoinChannelPropType,
  ListConversationMemberPropType,
  ListRecentConversationsPropType,
  RespondInvitePropType,
  SendInvitePropType,
} from "./schema.js";

class Controller {
  async createNewConversation({ ctx, body }: CreateNewConversationPropType) {
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
  
  async sendInvite({ ctx, body }: SendInvitePropType) {
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
