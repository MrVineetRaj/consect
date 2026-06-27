import { messageRepository } from "../../db/repository/messages.js";
import { CONSECTO_BOT } from "../../lib/constants.js";
import { type CreateNewMessagePropType } from "./schema.js";
import { conversationRepository } from "../../db/repository/conversation.js";
import io from "../../socket/socket-io.js";
import { queryFromEmbedding } from "../../workflow/query-from-embedding.js";

export async function invokeLLMForMessage({
  ctx,
  body,
}: CreateNewMessagePropType) {
  // Fetching details about current conversation details
  const conversationDetails = await conversationRepository.getConversationById({
    id: ctx.conversationId,
  });

  let resourceForChannels: string[] = [];

  // deciding which resource is to be shared for current conversation
  if (conversationDetails?.type == "channel") {
    resourceForChannels = [conversationDetails.id];
  } else if (
    conversationDetails?.type == "dm" ||
    conversationDetails?.type == "group"
  ) {
    const temp =
      await conversationRepository.getChannelsWhereMemberOfConversationIsParticipant(
        {
          conversationId: ctx.conversationId,
          organizationId: ctx.organizationId,
        },
      );

    resourceForChannels = temp;
  }

  // fetching old messages for current conversation
  const oldMessages = await messageRepository.getMessagesByConversationId({
    conversationId: ctx.conversationId,
    organizationId: ctx.organizationId,
    limit: 20,
    offset: 1,
  });

  const developerPromptForMultipleOptimizedQueries = `Old messages are
            eg structure : <userId>12345</userId> || <message> actual message </message> || <createdAt> timestamp when it was created</createdAt>
            ${oldMessages.reverse().map((msg) => `<userId>${msg.senderId}</userId> || <message>${msg.content}</message> || <createdAt>${msg.createdAt}</createdAt>`)}
            `;
  const systemPromptForMultipleOptimizedQueries =
    "You are consecto a powerful helping assistant who helps people in a chat room so to answer user query you have to look at the old messages attached by developer and then generate 2 to 5 optimized queries for what user is asking in specified formate";

  const userPrompt = body.content;

  // #region ------queryFromEmbedding
  // generating user query variants for properly reading resource and then giving user a valid answer

  const systemPrompt =
    "You are consecto a powerful helping assistant who helps people in a chat room which could be of one member two member or multiple members so you have to look at old messges which are mapped by userIds of user or consecto if a message is sent b you so please response accordingly also it is possible that user just tagged you it means there is old response then your current message in developer prompt list of old messages so if nothing in user query then look into most recent messages according to createdAt and look then reply and then reply and please send you messages in html formate not markdown please make no mistakes\n and also you have to take developer attached context as source of truth if you didn't get a context just say highlight that you don't have context but still if you can answer the question lie something technical then you can answer but make sure you highlight you don't have context your answers should be short and slightly styled and formatted html would be appreciated, if you got any context you should also site resources in a <a/> tag like <a href={secure_url} class='cite'>{name}</a> so user can also click on resources citing the url is necessary otherwise you have to mention that you don't have context";

  const developerPrompt = `Old messages are
            eg structure : <userId>12345</userId> || <message> actual message </message> || <createdAt> timestamp when it was created</createdAt>
            ${oldMessages
              .reverse()
              .map(
                (msg) =>
                  `<userId>${msg.senderId}</userId> || <message>${msg.content}</message> || <createdAt>${msg.createdAt}</createdAt>`,
              )
              .join("\n\n")}
            `;
  const llmResponse = await queryFromEmbedding({
    userPrompt,
    systemPromptForMultipleOptimizedQueries,
    developerPromptForMultipleOptimizedQueries,
    systemPrompt,
    developerPrompt,
    organizationId: ctx.organizationId,
    resourceForChannels,
  });

  await messageRepository.ensureBotUser();
  const result = await messageRepository.createNewMessage({
    senderId: CONSECTO_BOT.id,
    conversationId: ctx.conversationId,
    organizationId: ctx.organizationId,
    parentMessageId: body.parentMessageId,
    content: llmResponse as string,
    mentions: [],
  });

  io.to("convo_" + ctx.conversationId).emit("new_message", {
    message: result,
  });
}
