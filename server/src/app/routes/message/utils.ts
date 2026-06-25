import type z from "zod";
import { llmClient } from "../../clients/llm.js";
import { messageRepository } from "../../db/repository/messages.js";
import { CONSECTO_BOT } from "../../lib/constants.js";
import {
  LLMOptimizedQueriesSchema,
  type CreateNewMessagePropType,
} from "./schema.js";
import { vectorDB } from "../../vector_db/client.js";
import { conversationRepository } from "../../db/repository/conversation.js";

export async function invokeLLMForMessage({
  ctx,
  body,
}: CreateNewMessagePropType) {
  const conversationDetails = await conversationRepository.getConversationById({
    id: ctx.conversationId,
  });

  let resourceForChannels: string[] = [];

  if (conversationDetails?.type == "channel") {
    resourceForChannels = [conversationDetails.id];
  }

  const oldMessages = await messageRepository.getMessagesByConversationId({
    conversationId: ctx.conversationId,
    organizationId: ctx.organizationId,
    limit: 20,
    offset: 1,
  });

  const optimizedQueries = (await llmClient.getLLMResponse<
    z.infer<typeof LLMOptimizedQueriesSchema>
  >({
    userPrompt: body.content,
    systemPrompt:
      "You are consecto a powerful helping assistant who helps people in a chat room so to answer user query you have to look at the old messages attached by developer and then generate 2 to 5 optimized queries for what user is asking in specified formate",
    developerPrompt: `Old messages are
            eg structure : <userId>12345</userId> || <message> actual message </message> || <createdAt> timestamp when it was created</createdAt>
            ${oldMessages.reverse().map((msg) => `<userId>${msg.senderId}</userId> || <message>${msg.content}</message> || <createdAt>${msg.createdAt}</createdAt>`)}
            `,
    schema: {
      structure: LLMOptimizedQueriesSchema,
    },
  })) as z.infer<typeof LLMOptimizedQueriesSchema>;
  let context = "";

  if (optimizedQueries) {
    const searchEmbeddings = await Promise.all(
      optimizedQueries.queries.map((query) => {
        return llmClient.getEmbeddings({
          text: query,
        });
      }),
    );

    const searchResults = await Promise.all(
      searchEmbeddings.map((vector) => {
        return vectorDB.searchEmbedding({
          collection: ctx.organizationId,
          vector: vector[0]?.embedding!,
          filter: {
            must: [
              {
                key: "allowedChannelIds",
                match: { any: resourceForChannels },
              },
            ],
          },
        });
      }),
    );

    const RRF_K = 60;
    const normalize = (t: string) =>
      t.replace(/\s+/g, " ").trim().toLowerCase();

    // fuse scores across the per-query searches
    const fused = new Map<string, { item: any; score: number }>();

    for (const singleSearch of searchResults) {
      const ranked = [...singleSearch].sort((a, b) => b.score - a.score);
      ranked.forEach((item, rank) => {
        const key = String(item.id);
        const add = 1 / (RRF_K + rank);
        const prev = fused.get(key);
        if (prev) {
          prev.score += add;
          // keep the higher-scoring representative of the duplicate
          if (item.score > prev.item.score) prev.item = item;
        } else {
          fused.set(key, { item, score: add });
        }
      });
    }

    // {
    // id: 0,
    // version: 0,
    // score: 0.60324264,
    // payload: {
    //   text: 'Vineet Raj\n'
    //   secureURL,
    //   type
    const results = [...fused.values()]
      .sort((a, b) => b.score - a.score)
      .map((entry) => {
        return {
          text: entry.item?.payload?.text as string,
          secureURL: entry.item?.payload?.secureURL as string,
          type: entry.item?.payload?.type as string,
          publicId: entry.item?.payload?.publicId as string,
        };
      });

    context = results
      .map(
        (item) => `
      secureURL: ${item.secureURL}
      publicId: ${item.publicId}
      fileType: ${item.type}
      contextText: ${item.text}
      `,
      )
      .join("\n\n");

    console.log(context);
  }
  const llmResponse = await llmClient.getLLMResponse({
    userPrompt: body.content,
    systemPrompt:
      "You are consecto a powerful helping assistant who helps people in a chat room which could be of one member two member or multiple members so you have to look at old messges which are mapped by userIds of user or consecto if a message is sent b you so please response accordingly also it is possible that user just tagged you it means there is old response then your current message in developer prompt list of old messages so if nothing in user query then look into most recent messages according to createdAt and look then reply and then reply and please send you messages in html formate not markdown please make no mistakes\n and also you have to take developer attached context as source of truth if you didn't get a context just say highlight that you don't have context but still if you can answer the question lie something technical then you can answer but make sure you highlight you don't have context your answers should be short and slightly styled and formatted html would be appreciated ",
    developerPrompt: `Old messages are
            eg structure : <userId>12345</userId> || <message> actual message </message> || <createdAt> timestamp when it was created</createdAt>
            ${oldMessages
              .reverse()
              .map(
                (msg) =>
                  `<userId>${msg.senderId}</userId> || <message>${msg.content}</message> || <createdAt>${msg.createdAt}</createdAt>`,
              )
              .join("\n\n")}


            ## Context
            ${context == "" ? "No context about it" : context}
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
