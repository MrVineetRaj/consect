import { messageRepository } from "../db/repository/messages.js";
import { SYSTEM_BOT } from "../lib/constants.js";
import logger from "../lib/logger.js";
import io from "../socket/socket-io.js";

/**
 * Post a system-generated message (e.g. "X joined") into a conversation as
 * the system bot, and push it to anyone with the conversation open. Ensures
 * the bot's `user` row exists first so the sender FK holds.
 */
async function postSystemMessage(args: {
  conversationId: string;
  organizationId: string;
  content: string;
}) {
  await messageRepository.ensureBotUser(SYSTEM_BOT);

  const message = await messageRepository.createNewMessage({
    senderId: SYSTEM_BOT.id,
    conversationId: args.conversationId,
    organizationId: args.organizationId,
    parentMessageId: null,
    mentions: [],
    content: args.content,
  });

  if (message) {
    io.to("convo_" + args.conversationId).emit("new_message", { message });
  }

  return message;
}

/** Fire-and-forget wrapper — a failed system message must never fail the request. */
export function postSystemMessageInBackground(args: {
  conversationId: string;
  organizationId: string;
  content: string;
}) {
  void postSystemMessage(args).catch((error) => {
    logger.error("Failed to post system message", { error, args });
  });
}
