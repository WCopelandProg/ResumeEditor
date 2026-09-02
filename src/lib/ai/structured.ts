import "server-only";
import type { z } from "zod";
import type { AiProvider, CompletionRequest } from "./provider";
import { getAiProvider, AiRequestError } from "./provider";

/**
 * AI responses are never trusted as valid JSON on their own. This strips
 * common wrapping (markdown fences, leading/trailing prose) and parses the
 * largest plausible JSON object/array in the text, then validates it
 * against the caller's Zod schema. On failure it retries once with the
 * validation error fed back to the model, since that alone fixes the vast
 * majority of malformed responses.
 */
function extractJsonCandidate(raw: string): string {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = fenced ? fenced[1] : raw;
  const trimmed = body.trim();

  const firstBrace = trimmed.search(/[[{]/);
  if (firstBrace === -1) return trimmed;

  const open = trimmed[firstBrace];
  const close = open === "{" ? "}" : "]";
  const lastClose = trimmed.lastIndexOf(close);
  if (lastClose === -1) return trimmed;

  return trimmed.slice(firstBrace, lastClose + 1);
}

export async function runStructured<T>(
  schema: z.ZodType<T>,
  request: CompletionRequest,
  opts: { provider?: AiProvider; retries?: number } = {}
): Promise<T> {
  const provider = opts.provider ?? getAiProvider();
  const retries = opts.retries ?? 1;

  let lastError = "";
  let currentPrompt = request.prompt;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const raw = await provider.complete({ ...request, prompt: currentPrompt });
    const candidate = extractJsonCandidate(raw);

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(candidate);
    } catch {
      lastError = "Response was not valid JSON.";
      currentPrompt = `${request.prompt}\n\nYour previous reply could not be parsed as JSON (${lastError}). Reply with ONLY the JSON object/array — no prose, no markdown fences.`;
      continue;
    }

    const result = schema.safeParse(parsedJson);
    if (result.success) return result.data;

    lastError = result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    currentPrompt = `${request.prompt}\n\nYour previous reply did not match the required schema (${lastError}). Reply again with ONLY corrected JSON matching the schema exactly.`;
  }

  console.error("[ai:structured] validation failed after retries", lastError);
  throw new AiRequestError("The AI Resume Coach returned an unexpected response. Please try again.");
}
