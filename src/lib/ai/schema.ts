import { z } from "zod";

/**
 * Zod schemas for everything the AI layer returns. AI responses are never
 * trusted as valid JSON on their own — every call site parses the raw model
 * output through one of these schemas and rejects/repairs anything that
 * doesn't validate before it touches the database or the UI.
 */

export const SUGGESTION_CATEGORIES = [
  "GRAMMAR",
  "CLARITY",
  "IMPACT",
  "QUANTIFICATION",
  "ACTION_VERB",
  "FORMATTING",
  "STRUCTURE",
  "ATS",
  "SKILLS",
  "REDUNDANCY",
  "RELEVANCE",
  "TONE",
] as const;
export const SEVERITIES = ["HIGH", "MEDIUM", "LOW"] as const;

export const AiSuggestionSchema = z
  .object({
    category: z.enum(SUGGESTION_CATEGORIES),
    severity: z.enum(SEVERITIES),
    sectionId: z.string().nullable().optional(),
    entryId: z.string().nullable().optional(),
    bulletId: z.string().nullable().optional(),
    originalText: z.string().nullable().optional(),
    // Rewrite proposal. Must be omitted/null when the model instead needs to
    // ask the user a clarifying question (see `question`) rather than invent
    // a fact such as a metric that isn't in the source text.
    suggestedText: z.string().nullable().optional(),
    explanation: z.string(),
    question: z.string().nullable().optional(),
  })
  .refine((s) => !!s.suggestedText || !!s.question, {
    message: "A suggestion must include either suggestedText or a clarifying question.",
  });
export type AiSuggestion = z.infer<typeof AiSuggestionSchema>;

export const CategoryScoresSchema = z.object({
  impact: z.number().min(0).max(100),
  clarity: z.number().min(0).max(100),
  conciseness: z.number().min(0).max(100),
  formatting: z.number().min(0).max(100),
  ats: z.number().min(0).max(100),
  quantification: z.number().min(0).max(100),
  actionVerbs: z.number().min(0).max(100),
  skills: z.number().min(0).max(100),
  grammar: z.number().min(0).max(100),
  relevance: z.number().min(0).max(100),
});
export type CategoryScores = z.infer<typeof CategoryScoresSchema>;

export const HealthCheckItemSchema = z.object({
  label: z.string(),
  passed: z.boolean(),
  detail: z.string().optional(),
});

export const AtsIssueSchema = z.object({
  issue: z.string(),
  detail: z.string(),
  severity: z.enum(SEVERITIES),
});

export const AnalysisOutputSchema = z.object({
  overallScore: z.number().min(0).max(100),
  categoryScores: CategoryScoresSchema,
  atsScore: z.number().min(0).max(100),
  atsIssues: z.array(AtsIssueSchema),
  healthChecklist: z.array(HealthCheckItemSchema),
  suggestions: z.array(AiSuggestionSchema),
});
export type AnalysisOutput = z.infer<typeof AnalysisOutputSchema>;

export const JobMatchOutputSchema = z.object({
  matchScore: z.number().min(0).max(100),
  scoreIsInternalEstimate: z.literal(true),
  matchedKeywords: z.array(z.string()),
  missingKeywords: z.array(z.string()),
  emphasize: z.array(
    z.object({
      point: z.string(),
      reason: z.string(),
      sectionId: z.string().nullable().optional(),
      entryId: z.string().nullable().optional(),
    })
  ),
  deprioritize: z.array(
    z.object({
      point: z.string(),
      reason: z.string(),
      sectionId: z.string().nullable().optional(),
      entryId: z.string().nullable().optional(),
    })
  ),
  buriedQualifications: z.array(z.string()),
  explanationFactors: z.array(z.string()),
  suggestions: z.array(AiSuggestionSchema).default([]),
});
export type JobMatchOutput = z.infer<typeof JobMatchOutputSchema>;

export const RewriteAlternativeSchema = z.object({
  text: z.string(),
  rationale: z.string(),
});

export const RewriteOutputSchema = z.object({
  alternatives: z.array(RewriteAlternativeSchema).min(1).max(4),
  /** Present instead of confident alternatives when a key fact is missing. */
  clarifyingQuestion: z.string().nullable().optional(),
});
export type RewriteOutput = z.infer<typeof RewriteOutputSchema>;

export const REWRITE_ACTIONS = [
  "improve",
  "concise",
  "impactful",
  "technical",
  "professional",
  "leadership",
  "measurable_impact",
  "fix_grammar",
  "stronger_verbs",
  "reduce_repetition",
] as const;
export type RewriteAction = (typeof REWRITE_ACTIONS)[number];

export const REWRITE_ACTION_LABELS: Record<RewriteAction, string> = {
  improve: "Improve this bullet",
  concise: "Make this more concise",
  impactful: "Make this more impactful",
  technical: "Make this more technical",
  professional: "Make this more professional",
  leadership: "Focus on leadership",
  measurable_impact: "Focus on measurable impact",
  fix_grammar: "Fix grammar",
  stronger_verbs: "Rewrite using stronger action verbs",
  reduce_repetition: "Reduce repetition",
};

export const SmartQuestionSchema = z.object({
  bulletId: z.string(),
  questions: z.array(z.string()).min(1).max(5),
});
export type SmartQuestion = z.infer<typeof SmartQuestionSchema>;
