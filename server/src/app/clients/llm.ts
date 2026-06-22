import { Agent } from "@openai/agents";
import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod.mjs";
import type z from "zod";

class LLMClient {
  private client;
  private agent;
  constructor() {
    this.client = new OpenAI();
    this.agent = new Agent({
      name: "consecto",
      model: "gpt-5.4-min",
    });
  }

  async getEmbeddings(args: { text: string }) {
    const result = this.client.embeddings.create({
      input: args.text,
      model: "text-embedding-3-small",
    });

    return result;
  }

  async getLLMResponse<T>(args: {
    userPrompt: string;
    systemPrompt: string;
    developerPrompt: string;
    schema?: { label: string; structure: z.ZodObject };
  }) {
    const messages: {
      role: "system" | "developer" | "user" | "assistant";
      content: string;
    }[] = [];

    if (args.systemPrompt) {
      messages.push({
        role: "system",
        content: args.systemPrompt,
      });
    }
    if (args.developerPrompt) {
      messages.push({
        role: "developer",
        content: args.developerPrompt,
      });
    }
    if (args.userPrompt) {
      messages.push({
        role: "user",
        content: args.userPrompt,
      });
    }

    if (args.schema) {
      const result = await this.client.chat.completions.parse({
        model: "gpt-5.4-mini",
        messages: messages,
        response_format: zodResponseFormat(
          args.schema.structure,
          args.schema.label,
        ),
      });

      return result.choices[0]?.message.parsed as { [key: string]: T };
    }

    const result = await this.client.chat.completions.parse({
      model: "gpt-5.4-mini",
      messages: messages,
    });

    return result.choices[0]?.message.content;
  }
}

export const llmClient = new LLMClient();
