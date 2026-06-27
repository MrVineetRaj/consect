import z from "zod";
import { HeaderKeys } from "../../lib/constants.js";

export const ChatConsectoInputSchema = z.object({
  body: z.object({
    message: z.string().nonempty(),
    // Optional prior turns so the caller can keep a conversation going.
    history: z
      .array(
        z.object({
          role: z.enum(["user", "assistant"]),
          content: z.string(),
        }),
      )
      .default([]),
  }),
  ctx: z.object({
    apiKey: z.string().nonempty(),
    apiSecret: z.string().nonempty(),
  }),
});
export type ChatConsectoPropType = z.infer<typeof ChatConsectoInputSchema>;

export const ChatConsectoHeadersSchema = z.object({
  [HeaderKeys.apiKey]: z.string().meta({
    description: "Public API key identifying the caller.",
  }),
  [HeaderKeys.apiSecret]: z.string().meta({
    description: "Secret paired with the API key, verified against its hash.",
  }),
});

export const ChatConsectoResponseSchema = z.object({
  code: z.number(),
  message: z.string(),
  result: z.any().optional(),
});
