import "server-only";
import OpenAI from "openai";
import type { AiProvider, CompletionRequest } from "./provider";
import { AiRequestError } from "./provider";

export class OpenAiProvider implements AiProvider {
  readonly name = "openai";
  private client: OpenAI;
  private model: string;

  constructor() {
    this.client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    this.model = process.env.OPENAI_MODEL || "gpt-4o";
  }

  async complete({ system, prompt, maxTokens = 4096 }: CompletionRequest): Promise<string> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        max_tokens: maxTokens,
        messages: [
          { role: "system", content: system },
          { role: "user", content: prompt },
        ],
      });
      const text = response.choices[0]?.message?.content;
      if (!text) throw new AiRequestError("The AI returned an empty response.");
      return text;
    } catch (err) {
      if (err instanceof AiRequestError) throw err;
      console.error("[ai:openai]", err);
      throw new AiRequestError();
    }
  }
}
