import { HttpResponse } from "../../adapter/http.js";
import { llmClient } from "../../clients/llm.js";
import { conversationMemberRepository } from "../../db/repository/conservation-member.js";
import { messageRepository } from "../../db/repository/messages.js";
import { auth } from "../../lib/auth.js";
import io from "../../socket/socket-io.js";
import { ResponseCodes } from "../../types/codes.js";
import type {
  CreateNewMessagePropType,
  DeleteMessagePropType,
  ListMessagesPropType,
  UpdateMessagePropType,
} from "./schema.js";
import { fanOutMessageNotifications, invokeLLMForMessage } from "./utils.js";
import logger from "../../lib/logger.js";

class Controller {
  async newMessage({ ctx, body }: CreateNewMessagePropType) {
    const memberShip =
      await conversationMemberRepository.getConversationMembershipOfUser({
        userId: ctx.userId,
        conversationId: ctx.conversationId,
      });

    if (!memberShip) {
      return new HttpResponse({
        code: ResponseCodes.FORBIDDEN,
        message: "You are not member of this conversation",
      });
    }
    const result = await messageRepository.createNewMessage({
      senderId: ctx.userId,
      conversationId: ctx.conversationId,
      organizationId: ctx.organizationId,
      parentMessageId: body.parentMessageId,
      content: body.content,
      mentions: body.mentions.filter((men) => men != "consecto"),
    });

    io.to("convo_" + ctx.conversationId).emit("new_message", {
      message: result,
    });

    if (result) {
      // Mentions, auto-invites for non-member mentions, and thread-reply
      // pings — all off the request path so sending stays fast.
      fanOutMessageNotifications({ ctx, body, messageId: result.id }).catch(
        (error) => {
          logger.error("Message notification fan-out failed", { error });
        },
      );
    }

    if (body.mentions.includes("consecto")) {
      invokeLLMForMessage({ ctx, body }).catch((e) => {
        return new HttpResponse({
          code: ResponseCodes.SERVICE_UNAVAILABLE,
          message: "Not able to invoke consecto",
        });
      });
    }

    return new HttpResponse({
      code: ResponseCodes.CREATED,
      message: "Message sent",
      result,
    });
  }

  async listMessages({ ctx, query }: ListMessagesPropType) {
    const memberShip =
      await conversationMemberRepository.getConversationMembershipOfUser({
        userId: ctx.userId,
        conversationId: ctx.conversationId,
      });

    if (!memberShip) {
      return new HttpResponse({
        code: ResponseCodes.FORBIDDEN,
        message: "You are not member of this conversation",
      });
    }
    const result = await messageRepository.getMessagePage({
      conversationId: ctx.conversationId,
      organizationId: ctx.organizationId,
      before: query.before,
      limit: query.limit,
    });

    return new HttpResponse({
      code: ResponseCodes.SUCCESS,
      message: "Fetched conversation messages",
      result,
    });
  }

  async updateMessage({ ctx, body }: UpdateMessagePropType) {
    const result = await messageRepository.updateMessage({
      conversationId: ctx.conversationId,
      senderId: ctx.userId,
      id: body.id,
      newContent: body.newContent,
    });
    return new HttpResponse({
      code: ResponseCodes.SUCCESS,
      message: "Message updated",
      result,
    });
  }

  async deleteMessage({ ctx, query }: DeleteMessagePropType) {
    const result = await messageRepository.deleteMessage({
      conversationId: ctx.conversationId,
      senderId: ctx.userId,
      id: query.id,
    });
    return new HttpResponse({
      code: ResponseCodes.SUCCESS,
      message: "Message deleted",
      result,
    });
  }
}

export const controller = new Controller();
