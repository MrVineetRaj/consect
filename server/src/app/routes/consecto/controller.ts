import { HttpResponse } from "../../adapter/http.js";
import { apiKeyRepository } from "../../db/repository/api-key.js";
import { conversationRepository } from "../../db/repository/conversation.js";
import { ResponseCodes } from "../../types/codes.js";
import { queryFromEmbedding } from "../../workflow/query-from-embedding.js";
import type { ChatConsectoPropType } from "./schema.js";

class Controller {
  async chatConsecto({ ctx, body }: ChatConsectoPropType) {
    const apiKey = await apiKeyRepository.getApiKeyByApiKey({
      apiKey: ctx.apiKey,
    });

    const conversations = await conversationRepository.getUserChannels({
      userId: apiKey?.userId!,
      organizationId: apiKey?.organizationId!,
    });

    const resourceForChannels = conversations.map((it) => it.id);

    // Flatten the caller-supplied history into a single block both the query
    // optimizer and the final answer can read. Unlike the in-app chat (which
    // keys turns by userId), this API is a 1:1 exchange, so turns are tagged by
    // role (user/assistant).
    const conversationHistory =
      body.history.length === 0
        ? "No prior conversation."
        : body.history
            .map(
              (turn) =>
                `<role>${turn.role}</role> || <message>${turn.content}</message>`,
            )
            .join("\n\n");

    const userPrompt = body.message;

    // Prompts for generating optimized retrieval queries from the user's
    // message + history. Resolving references against history matters here so
    // follow-ups like "and what about it?" still produce useful search queries.
    const systemPromptForMultipleOptimizedQueries =
      "You are Consecto, an assistant answering a programmatic caller over the /consecto/chat API. Using the conversation history attached by the developer and the user's latest message, generate 2 to 5 optimized search queries that capture what the user is really asking, in the specified format. Resolve pronouns and references like 'it' or 'that' against the history so the queries are self-contained.";

    const developerPromptForMultipleOptimizedQueries = `Conversation history (oldest to newest)
            eg structure : <role>user|assistant</role> || <message> actual message </message>
            ${conversationHistory}
            `;

    // Prompts for the final answer. The workflow appends the retrieved context
    // under a "## Context" section onto developerPrompt before calling the LLM.
    const systemPrompt =
      "You are Consecto, a helpful assistant answering an external caller through the /consecto/chat API. Use the conversation history (tagged as user or assistant) to understand the request, and treat the context the developer attaches as your source of truth. Answer the user's latest message clearly and concisely in Markdown. When the attached context is relevant, cite the resources you used as Markdown links like [name](secureURL) so the caller can open them. If no context is attached, say so explicitly; you may still answer general or technical questions from your own knowledge, but make clear you had no context to draw on. Never invent sources or URLs.";

    const developerPrompt = `Conversation history (oldest to newest)
            eg structure : <role>user|assistant</role> || <message> actual message </message>
            ${conversationHistory}
            `;

    const llmResponse = await queryFromEmbedding({
      userPrompt,
      systemPrompt,
      developerPrompt,
      developerPromptForMultipleOptimizedQueries,
      systemPromptForMultipleOptimizedQueries,
      organizationId: apiKey?.organizationId!,
      resourceForChannels,
    });

    return new HttpResponse({
      code: ResponseCodes.SUCCESS,
      message: "Consecto response",
      result: llmResponse,
    });
  }
}

export const controller = new Controller();
