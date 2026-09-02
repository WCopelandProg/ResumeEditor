import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { AiProvider, CompletionRequest } from "./provider";
import { AiRequestError } from "./provider";

export class AnthropicProvider implements AiProvider {
  readonly name = "anthropic";
  private client: Anthropic;
  private model: string;

  constructor() {
    this.client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    this.model = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";
  }

  async complete({ system, prompt, maxTokens = 4096 }: CompletionRequest): Promise<string> {
    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: maxTokens,
        system,
        messages: [{ role: "user", content: prompt }],
      });
      const textBlock = response.content.find((b) => b.type === "text");
      if (!textBlock || textBlock.type !== "text") {
        throw new AiRequestError("The AI returned an empty response.");
      }
      return textBlock.text;
    } catch (err) {
      if (err instanceof AiRequestError) throw err;
      console.error("[ai:anthropic]", err);
      throw new AiRequestError();
    }
  }
}
