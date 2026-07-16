import { messageRepository } from "../../db/repository/messages.js";
import { CONSECTO_BOT } from "../../lib/constants.js";
import { type CreateNewMessagePropType } from "./schema.js";
import { conversationRepository } from "../../db/repository/conversation.js";
import { conversationInviteRepository } from "../../db/repository/conservation-invite.js";
import { conversationMemberRepository } from "../../db/repository/conservation-member.js";
import { organizationRepository } from "../../db/repository/organization.js";
import { notifyUsersInBackground } from "../../workflow/notify.js";
import io from "../../socket/socket-io.js";
import { queryFromEmbedding } from "../../workflow/query-from-embedding.js";

/**
 * Nudge every member's personal socket room (joined on `mark_online`) so
 * sidebars can bump unread badges even for conversations whose room the
 * client hasn't joined. The sender is skipped — nothing is unread for them.
 */
export async function emitConversationActivity(args: {
  conversationId: string;
  senderId: string;
}) {
  const memberIds =
    await conversationMemberRepository.getConversationMemberUserIds({
      conversationId: args.conversationId,
    });

  for (const userId of memberIds) {
    if (userId === args.senderId) continue;
    io.to(userId).emit("conversation_activity", {
      conversationId: args.conversationId,
      senderId: args.senderId,
    });
  }
}

/**
 * Post-send fan-out for a new message:
 * - mentioned users who are already in the conversation get a `mention`
 *   notification;
 * - mentioned workspace members who are NOT in the conversation are invited
 *   to it (channels and groups only) and notified about the invite instead —
 *   a mention notification would point at a conversation they can't open;
 * - a thread reply pings the parent author unless they were mentioned too.
 *
 * Runs after the message is persisted; callers should fire-and-forget it.
 */
export async function fanOutMessageNotifications({
  ctx,
  body,
  messageId,
}: CreateNewMessagePropType & { messageId: string }) {
  await emitConversationActivity({
    conversationId: ctx.conversationId,
    senderId: ctx.userId,
  });

  const mentionedUserIds = Array.from(new Set(body.mentions)).filter(
    (id) => id !== CONSECTO_BOT.id && id !== ctx.userId,
  );
  const preview = body.content.slice(0, 140);

  // Only workspace members count — mentions arrive from the client as-is.
  const orgMentioned =
    await organizationRepository.filterOrganizationMemberUserIds({
      organizationId: ctx.organizationId,
      userIds: mentionedUserIds,
    });

  const conversationMemberIds =
    await conversationMemberRepository.filterConversationMemberUserIds({
      conversationId: ctx.conversationId,
      userIds: orgMentioned,
    });
  const nonMembers = orgMentioned.filter(
    (id) => !conversationMemberIds.includes(id),
  );

  notifyUsersInBackground({
    userIds: conversationMemberIds,
    organizationId: ctx.organizationId,
    type: "mention",
    actorId: ctx.userId,
    conversationId: ctx.conversationId,
    messageId,
    data: { preview },
  });

  if (nonMembers.length > 0) {
    const conversation = await conversationRepository.getConversationById({
      id: ctx.conversationId,
    });

    // DMs can't gain members; only channels and groups auto-invite.
    if (conversation?.type === "channel" || conversation?.type === "group") {
      const alreadyInvited =
        await conversationInviteRepository.filterAlreadyInvitedUserIds({
          conversationId: ctx.conversationId,
          userIds: nonMembers,
        });
      const toInvite = nonMembers.filter(
        (id) => !alreadyInvited.includes(id),
      );

      if (toInvite.length > 0) {
        await conversationInviteRepository.createMultipleConversationInvitation(
          {
            senderId: ctx.userId,
            forUsers: toInvite,
            conversationId: ctx.conversationId,
            expiry: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000),
            role: "member",
          },
        );
        notifyUsersInBackground({
          userIds: toInvite,
          organizationId: ctx.organizationId,
          type: "conversation_invite",
          actorId: ctx.userId,
          conversationId: ctx.conversationId,
          data: { role: "member", viaMention: true },
        });
      }
    }
  }

  // Thread reply: ping the parent author unless they were already covered
  // by a mention (or wrote the reply themselves).
  if (body.parentMessageId) {
    const parentMessage = await messageRepository.getMessageById({
      id: body.parentMessageId,
      organizationId: ctx.organizationId,
      conversationId: ctx.conversationId,
    });

    if (parentMessage && !orgMentioned.includes(parentMessage.senderId)) {
      notifyUsersInBackground({
        userIds: [parentMessage.senderId],
        organizationId: ctx.organizationId,
        type: "thread_reply",
        actorId: ctx.userId,
        conversationId: ctx.conversationId,
        messageId,
        data: { preview },
      });
    }
  }
}

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
  await emitConversationActivity({
    conversationId: ctx.conversationId,
    senderId: CONSECTO_BOT.id,
  });
}
