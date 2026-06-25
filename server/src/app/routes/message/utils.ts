import { llmClient } from "../../clients/llm.js";
import { messageRepository } from "../../db/repository/messages.js";
import { CONSECTO_BOT } from "../../lib/constants.js";
import type { CreateNewMessagePropType } from "./schema.js";

export async function invokeLLMForMessage({
  ctx,
  body,
}: CreateNewMessagePropType) {
  console.log("llmResponse");
  const oldMessages = await messageRepository.getMessagesByConversationId({
    conversationId: ctx.conversationId,
    organizationId: ctx.organizationId,
    limit: 20,
    offset: 1,
  });
  console.log("llmResponse 1");
  const llmResponse = await llmClient.getLLMResponse({
    userPrompt: body.content,
    systemPrompt:
      "You are consecto a powerful helping assistant who helps people in a chat room which could be of one member two member or multiple members so you have to look at old messges which are mapped by userIds of user or consecto if a message is sent b you so please response accordingly",
    developerPrompt: `Old messages are 
            eg structure : <userId>12345</userId> || <message> actual message </message> || <createdAt> timestamp when it was created</createdAt>
            ${oldMessages.map((msg) => `<userId>${msg.senderId}</userId> || <message>${msg.content}</message> || <createdAt>${msg.createdAt}</createdAt>`)}
            `,
  });

  await messageRepository.ensureBotUser();
  await messageRepository.createNewMessage({
    senderId: CONSECTO_BOT.id,
    conversationId: ctx.conversationId,
    organizationId: ctx.organizationId,
    parentMessageId: body.parentMessageId,
    content: llmResponse as string,
    mentions: [],
  });

  console.log(llmResponse);
  // todo : send message to the room via socket
}
