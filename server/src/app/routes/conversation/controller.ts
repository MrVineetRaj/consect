import { HttpResponse } from "../../adapter/http.js";
import { conversationInviteRepository } from "../../db/repository/conservation-invite.js";
import { conversationMemberRepository } from "../../db/repository/conservation-member.js";
import { conversationRepository } from "../../db/repository/conversation.js";
import { message } from "../../db/schema.js";
import { ResponseCodes } from "../../types/codes.js";
import { notifyUsersInBackground } from "../../workflow/notify.js";
import type {
  CreateNewConversationPropType,
  DeleteMultipleSentInvitePropType,
  ListConversationMemberPropType,
  ListRecentConversationsPropType,
  SendInvitePropType,
} from "./schema.js";

class Controller {
  async createNewConversation({ ctx, body }: CreateNewConversationPropType) {
    const result = await conversationRepository.createNewConversation({
      ...body,
      description: body.description,
      organizationId: ctx.organizationId,
    });
    await conversationMemberRepository.createNewConversationMember({
      userId: ctx.userId,
      conversationId: result?.id!,
      role: "owner",
    });
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
    const result =
      await conversationInviteRepository.createMultipleConversationInvitation({
        senderId: ctx.userId,
        forUsers: body.forUsers,
        conversationId: ctx.conversationId,
        expiry: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000),
        role: body.role,
      });

    // todo : send email if user not online

    if (result) {
      notifyUsersInBackground({
        userIds: body.forUsers,
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
