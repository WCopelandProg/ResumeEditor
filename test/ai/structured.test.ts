import { describe, expect, it } from "vitest";
import { z } from "zod";
import { runStructured } from "@/lib/ai/structured";
import type { AiProvider } from "@/lib/ai/provider";

const Schema = z.object({ score: z.number().min(0).max(100), label: z.string() });

function fakeProvider(responses: string[]): AiProvider {
  let call = 0;
  return {
    name: "fake",
    async complete() {
      const r = responses[Math.min(call, responses.length - 1)];
      call++;
      return r;
    },
  };
}

describe("runStructured", () => {
  it("parses a clean JSON response", async () => {
    const provider = fakeProvider([JSON.stringify({ score: 82, label: "great" })]);
    const result = await runStructured(Schema, { system: "sys", prompt: "p" }, { provider });
    expect(result).toEqual({ score: 82, label: "great" });
  });

  it("strips markdown code fences before parsing", async () => {
    const provider = fakeProvider(["```json\n" + JSON.stringify({ score: 50, label: "ok" }) + "\n```"]);
    const result = await runStructured(Schema, { system: "sys", prompt: "p" }, { provider });
    expect(result).toEqual({ score: 50, label: "ok" });
  });

  it("strips leading/trailing prose around the JSON object", async () => {
    const provider = fakeProvider([`Sure, here is the JSON:\n${JSON.stringify({ score: 10, label: "x" })}\nHope that helps!`]);
    const result = await runStructured(Schema, { system: "sys", prompt: "p" }, { provider });
    expect(result).toEqual({ score: 10, label: "x" });
  });

  it("retries once after invalid JSON and succeeds on the second attempt", async () => {
    const provider = fakeProvider(["not json at all", JSON.stringify({ score: 99, label: "fixed" })]);
    const result = await runStructured(Schema, { system: "sys", prompt: "p" }, { provider });
    expect(result).toEqual({ score: 99, label: "fixed" });
  });

  it("retries once after a schema violation and succeeds on the second attempt", async () => {
    const provider = fakeProvider([
      JSON.stringify({ score: 999, label: "too high" }),
      JSON.stringify({ score: 42, label: "valid" }),
    ]);
    const result = await runStructured(Schema, { system: "sys", prompt: "p" }, { provider });
    expect(result).toEqual({ score: 42, label: "valid" });
  });

  it("throws a safe AiRequestError after exhausting retries", async () => {
    const provider = fakeProvider(["garbage", "still garbage", "more garbage"]);
    await expect(runStructured(Schema, { system: "sys", prompt: "p" }, { provider, retries: 1 })).rejects.toThrow(
      /unexpected response/i
    );
  });
});
