import { describe, expect, it } from "vitest";
import { analyzeResume, matchJobDescription, rewriteBullet, generateSmartQuestions } from "@/lib/ai/coach";
import type { AiProvider, CompletionRequest } from "@/lib/ai/provider";
import { buildSampleResume } from "../fixtures/sampleResume";

function fakeProvider(reply: (req: CompletionRequest) => string): AiProvider {
  return { name: "fake", async complete(req) { return reply(req); } };
}

const validAnalysis = {
  overallScore: 74,
  categoryScores: {
    impact: 70, clarity: 80, conciseness: 75, formatting: 90, ats: 85,
    quantification: 40, actionVerbs: 60, skills: 80, grammar: 95, relevance: 75,
  },
  atsScore: 85,
  atsIssues: [{ issue: "No issues detected", detail: "Layout is simple and parses cleanly.", severity: "LOW" }],
  healthChecklist: [{ label: "Contact information complete", passed: true }],
  suggestions: [
    {
      category: "QUANTIFICATION",
      severity: "HIGH",
      sectionId: "sec1",
      entryId: "ent1",
      bulletId: "blt1",
      originalText: "Worked on data analysis for company reports.",
      suggestedText: null,
      explanation: "This bullet has no measurable outcome.",
      question: "Approximately how many reports or how much data was involved?",
    },
  ],
};

describe("analyzeResume", () => {
  it("sends the resume content (with stable ids) and the anti-fabrication rule, and validates the reply", async () => {
    let sentPrompt = "";
    let sentSystem = "";
    const provider = fakeProvider((req) => {
      sentPrompt = req.prompt;
      sentSystem = req.system;
      return JSON.stringify(validAnalysis);
    });

    const resume = buildSampleResume();
    const result = await analyzeResume(resume, provider);

    expect(result.overallScore).toBe(74);
    expect(result.suggestions[0].category).toBe("QUANTIFICATION");
    expect(sentPrompt).toContain("Acme Corporation");
    expect(sentPrompt).toContain(resume.sections[1].entries[0].bullets[0].id);
    expect(sentSystem).toMatch(/never fabricate/i);
  });

  it("rejects a reply that invents a suggestion with both a fabricated metric and no question", async () => {
    const bad = {
      ...validAnalysis,
      suggestions: [
        {
          category: "QUANTIFICATION",
          severity: "HIGH",
          sectionId: null,
          entryId: null,
          bulletId: null,
          originalText: null,
          suggestedText: null,
          explanation: "missing both suggestedText and question",
          question: null,
        },
      ],
    };
    const provider = fakeProvider(() => JSON.stringify(bad));
    await expect(analyzeResume(buildSampleResume(), provider)).rejects.toThrow();
  });
});

describe("matchJobDescription", () => {
  it("labels the match score as an internal estimate", async () => {
    const provider = fakeProvider((req) => {
      expect(req.prompt).toContain("Senior Backend Engineer");
      return JSON.stringify({
        matchScore: 63,
        scoreIsInternalEstimate: true,
        matchedKeywords: ["Python", "SQL"],
        missingKeywords: ["Kubernetes"],
        emphasize: [],
        deprioritize: [],
        buriedQualifications: [],
        explanationFactors: ["Estimated from keyword overlap, not a real ATS algorithm."],
        suggestions: [],
      });
    });

    const result = await matchJobDescription(buildSampleResume(), "Senior Backend Engineer role requiring Python, SQL, Kubernetes", provider);
    expect(result.scoreIsInternalEstimate).toBe(true);
    expect(result.missingKeywords).toContain("Kubernetes");
  });
});

describe("rewriteBullet", () => {
  it("asks a clarifying question instead of inventing a metric", async () => {
    const provider = fakeProvider(() =>
      JSON.stringify({
        alternatives: [{ text: "Improved application performance through targeted optimizations.", rationale: "Tightened wording without inventing a number." }],
        clarifyingQuestion: "About how much did performance improve (e.g. latency reduced by X%)?",
      })
    );
    const result = await rewriteBullet("Improved application performance", "measurable_impact", {}, provider);
    expect(result.alternatives[0].text).not.toMatch(/\d+%/);
    expect(result.clarifyingQuestion).toMatch(/how much/i);
  });
});

describe("generateSmartQuestions", () => {
  it("returns specific follow-up questions for a vague bullet", async () => {
    const provider = fakeProvider(() =>
      JSON.stringify({ bulletId: "n/a", questions: ["How many people used the dashboards?", "What tools did you use to build them?"] })
    );
    const result = await generateSmartQuestions("Built dashboards for sales team.", provider);
    expect(result.questions.length).toBeGreaterThanOrEqual(2);
  });
});
