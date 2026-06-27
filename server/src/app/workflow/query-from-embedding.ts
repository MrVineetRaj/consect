import z from "zod";
import { llmClient } from "../clients/llm.js";
import { vectorDB } from "../vector_db/client.js";

const LLMOptimizedQueriesSchema = z.object({
  queries: z.array(z.string()),
});
export async function queryFromEmbedding({
  userPrompt,
  systemPrompt,
  systemPromptForMultipleOptimizedQueries,
  developerPromptForMultipleOptimizedQueries,
  developerPrompt,
  resourceForChannels,
  organizationId,
}: {
  userPrompt: string;
  systemPrompt: string;
  systemPromptForMultipleOptimizedQueries: string;
  developerPromptForMultipleOptimizedQueries: string;
  developerPrompt: string;
  organizationId: string;
  resourceForChannels: string[];
}) {
  const optimizedQueries = (await llmClient.getLLMResponse<
    z.infer<typeof LLMOptimizedQueriesSchema>
  >({
    userPrompt: userPrompt,
    systemPrompt: systemPromptForMultipleOptimizedQueries,
    developerPrompt: developerPromptForMultipleOptimizedQueries,
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
          collection: organizationId,
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

    // now applying rf ranking on docs to sort them out according to relevance
    const RRF_K = 60;

    // fuse scores across the per-query searches
    const fused = new Map<string, { item: any; score: number }>();

    for (const singleSearch of searchResults) {
      const ranked = [...(singleSearch == null ? [] : singleSearch)].sort(
        (a, b) => b.score - a.score,
      );
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
    const results = [...fused.values()]
      .sort((a, b) => b.score - a.score)
      .map((entry) => {
        return {
          name: entry.item?.payload?.name as string,
          text: entry.item?.payload?.text as string,
          secureURL: entry.item?.payload?.secureURL as string,
        };
      });

    // generating a context used fused content
    context = results
      .map(
        (item) => `
    name: ${item.name}
      secureURL: ${item.secureURL}
      contextText: ${item.text}
      `,
      )
      .join("\n\n");
  }

  console.log(context);
  // finally getting llm response for user query
  const llmResponse = await llmClient.getLLMResponse({
    userPrompt: userPrompt,
    systemPrompt: systemPrompt,
    developerPrompt:
      developerPrompt +
      ` ## Context 
      
      ${context == "" ? "No context about it" : context}`,
  });

  return llmResponse;
}
