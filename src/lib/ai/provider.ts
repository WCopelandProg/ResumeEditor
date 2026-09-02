import "server-only";
import { AppError } from "@/lib/api/errors";
import { AnthropicProvider } from "./anthropicProvider";
import { OpenAiProvider } from "./openaiProvider";

/**
 * Provider-agnostic AI abstraction. Everything above this file (the coach,
 * rewrite tools, job-match) talks only to `AiProvider` — never to the
 * Anthropic or OpenAI SDKs directly — so switching providers or adding a
 * new one never touches prompt/business logic. API keys are read from
 * server-only env vars here and never reach the client.
 */
export interface CompletionRequest {
  system: string;
  prompt: string;
  maxTokens?: number;
}

export interface AiProvider {
  readonly name: string;
  complete(req: CompletionRequest): Promise<string>;
}

export class AiUnavailableError extends AppError {
  constructor(message = "The AI Resume Coach isn't configured yet. Add an API key to enable it.") {
    super(message, 503);
  }
}

export class AiRequestError extends AppError {
  constructor(message = "The AI Resume Coach is temporarily unavailable. Please try again in a moment.") {
    super(message, 502);
  }
}

let cached: AiProvider | null = null;

export function getAiProvider(): AiProvider {
  if (cached) return cached;

  const which = process.env.AI_PROVIDER || "anthropic";
  if (which === "openai") {
    if (!process.env.OPENAI_API_KEY) throw new AiUnavailableError();
    cached = new OpenAiProvider();
    return cached;
  }

  if (!process.env.ANTHROPIC_API_KEY) throw new AiUnavailableError();
  cached = new AnthropicProvider();
  return cached;
}

/** Test-only hook: inject a fake provider so coach/rewrite logic can be unit tested without network access. */
export function __setProviderForTests(provider: AiProvider | null) {
  cached = provider;
}
