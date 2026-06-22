import { HttpResponse } from "../../adapter/http.js";
import { messageRepository } from "../../db/repository/messages.js";
import { ResponseCodes } from "../../types/codes.js";
import type {
  CreateNewMessagePropType,
  DeleteMessagePropType,
  ListMessagesPropType,
  UpdateMessagePropType,
} from "./schema.js";

class Controller {
  async newMessage({ ctx, body }: CreateNewMessagePropType) {
    const result = await messageRepository.createNewMessage({
      senderId: ctx.userId,
      conversationId: ctx.conversationId,
      organizationId: ctx.organizationId,
      parentMessageId: body.parentMessageId,
      content: body.content,
      mentions: body.mentions,
    });

    // todo : announce message to socket
    return new HttpResponse({
      code: ResponseCodes.CREATED,
      message: "Message sent",
      result,
    });
  }

  async listMessages({ ctx }: ListMessagesPropType) {
    const result = await messageRepository.getMessagesByConversationId({
      conversationId: ctx.conversationId,
      organizationId: ctx.organizationId,
    });

    return new HttpResponse({
      code: ResponseCodes.SUCCESS,
      message: "Fetched Channels and Recent groups and DMs",
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
      message: "Message updated",
      result,
    });
  }
}

export const controller = new Controller();
