import "server-only";
import type { StructuredResume } from "@/lib/resume/types";
import { serializeResumeForPrompt } from "@/lib/resume/helpers";
import { runStructured } from "./structured";
import {
  AnalysisOutputSchema,
  JobMatchOutputSchema,
  RewriteOutputSchema,
  SmartQuestionSchema,
  type AnalysisOutput,
  type JobMatchOutput,
  type RewriteAction,
  type RewriteOutput,
  type SmartQuestion,
} from "./schema";
import type { AiProvider } from "./provider";

/**
 * The single most important behavioral rule for this product: the AI must
 * never invent facts. Every prompt in this file repeats it explicitly
 * rather than relying on the model to infer it, because a resume is a
 * factual, high-stakes document — a fabricated metric or credential could
 * cost someone a job offer if they didn't notice it before submitting.
 */
const ANTI_FABRICATION_RULE = `
CRITICAL RULE — never fabricate: Do not invent, estimate, or assume any fact
that is not already present in the resume text given to you: no numbers,
percentages, dollar amounts, team sizes, dataset sizes, durations, employer
names, technologies, titles, or dates. If a bullet would be stronger with a
metric that isn't stated, do NOT invent one — instead set "suggestedText" to
null and put a specific clarifying question in "question" asking the user
for that exact number (e.g. "About how many users did this affect?").
Rewrites may improve wording, structure, and emphasis of EXISTING facts, but
must never add new claims.`.trim();

function systemPreamble(): string {
  return `You are an expert, specific, and honest professional resume coach. You give concrete, actionable feedback grounded in the actual content of the resume you are shown — never generic advice like "use more action verbs" without pointing at the exact bullet. ${ANTI_FABRICATION_RULE}

Always reply with a single JSON value and nothing else — no markdown fences, no commentary before or after.`;
}

export async function analyzeResume(resume: StructuredResume, provider?: AiProvider): Promise<AnalysisOutput> {
  const resumeText = serializeResumeForPrompt(resume);

  const prompt = `Analyze the following resume and return a JSON object matching this shape exactly:

{
  "overallScore": number 0-100,
  "categoryScores": { "impact": 0-100, "clarity": 0-100, "conciseness": 0-100, "formatting": 0-100, "ats": 0-100, "quantification": 0-100, "actionVerbs": 0-100, "skills": 0-100, "grammar": 0-100, "relevance": 0-100 },
  "atsScore": number 0-100,
  "atsIssues": [{ "issue": string, "detail": string, "severity": "HIGH"|"MEDIUM"|"LOW" }],
  "healthChecklist": [{ "label": string, "passed": boolean, "detail": string (optional) }],
  "suggestions": [{
    "category": "GRAMMAR"|"CLARITY"|"IMPACT"|"QUANTIFICATION"|"ACTION_VERB"|"FORMATTING"|"STRUCTURE"|"ATS"|"SKILLS"|"REDUNDANCY"|"RELEVANCE"|"TONE",
    "severity": "HIGH"|"MEDIUM"|"LOW",
    "sectionId": string|null, "entryId": string|null, "bulletId": string|null,
    "originalText": string|null, "suggestedText": string|null, "explanation": string, "question": string|null
  }]
}

Ground every suggestion in a specific sectionId/entryId/bulletId taken verbatim from the "[section:...]"/"[entry:...]"/"[bullet:...]" tags in the resume below — never leave all three null unless the feedback is truly resume-wide (e.g. overall length/structure). Evaluate each bullet individually for: weak/vague language, passive voice, missing outcomes, missing scale, repeated or weak action verbs, and whether it reads like a responsibility instead of an accomplishment. Evaluate structure: section ordering, resume length/density, whether the strongest experience is prominent. Evaluate tone: unprofessional language, inconsistent tense/punctuation, grammar and spelling. Tailor advice to the candidate's apparent field and level (e.g. a student's class projects and leadership are legitimate accomplishments, not filler). Healthcheck items should include at least: contact info completeness, LinkedIn present, consistent dates, skills section present, no excessive repeated action verbs.

RESUME:
"""
${resumeText}
"""`;

  return runStructured(AnalysisOutputSchema, { system: systemPreamble(), prompt, maxTokens: 4096 }, { provider });
}

export async function matchJobDescription(
  resume: StructuredResume,
  jobDescriptionText: string,
  provider?: AiProvider
): Promise<JobMatchOutput> {
  const resumeText = serializeResumeForPrompt(resume);

  const prompt = `Compare this resume against the job description and return a JSON object matching this shape exactly:

{
  "matchScore": number 0-100,
  "scoreIsInternalEstimate": true,
  "matchedKeywords": string[],
  "missingKeywords": string[],
  "emphasize": [{ "point": string, "reason": string, "sectionId": string|null, "entryId": string|null }],
  "deprioritize": [{ "point": string, "reason": string, "sectionId": string|null, "entryId": string|null }],
  "buriedQualifications": string[],
  "explanationFactors": string[],
  "suggestions": [ /* same Suggestion shape as the resume-analysis tool, RELEVANCE/SKILLS-focused */ ]
}

"matchScore" is explicitly an internal compatibility estimate based on keyword and experience overlap — it is NOT a real employer ATS score, and explanationFactors must make that clear (e.g. "Estimated from keyword overlap and years of relevant experience, not a real ATS algorithm"). Identify: keywords/skills in the job description missing from the resume, resume experience that should be emphasized more for this role, resume content taking up space that's less relevant to this role, and qualifications already on the resume that are buried (present but not prominent). Reference sectionId/entryId from the "[section:...]"/"[entry:...]" tags below where relevant.

JOB DESCRIPTION:
"""
${jobDescriptionText}
"""

RESUME:
"""
${resumeText}
"""`;

  return runStructured(JobMatchOutputSchema, { system: systemPreamble(), prompt, maxTokens: 3072 }, { provider });
}

const REWRITE_INSTRUCTIONS: Record<RewriteAction, string> = {
  improve: "Improve this bullet's overall clarity and impact.",
  concise: "Make this bullet significantly more concise without losing its meaning.",
  impactful: "Make this bullet's impact and results more prominent.",
  technical: "Make this bullet more technically specific and precise for a technical reader.",
  professional: "Make this bullet's tone more professional and polished.",
  leadership: "Reframe this bullet to highlight leadership, ownership, or initiative — only if that is genuinely supported by the existing text.",
  measurable_impact: "Emphasize measurable impact already present in the bullet; if no measurable outcome is stated, ask for one instead of inventing it.",
  fix_grammar: "Fix any grammar, spelling, punctuation, or tense issues without changing the meaning.",
  stronger_verbs: "Replace weak or repeated verbs with stronger, more precise action verbs.",
  reduce_repetition: "Reduce repetitive wording or structure compared to the candidate's other bullets.",
};

export async function rewriteBullet(
  bulletText: string,
  action: RewriteAction,
  context: { entryTitle?: string; organization?: string; otherBulletsInEntry?: string[] },
  provider?: AiProvider
): Promise<RewriteOutput> {
  const prompt = `${REWRITE_INSTRUCTIONS[action]}

Return a JSON object: { "alternatives": [{ "text": string, "rationale": string }] (1-4 items), "clarifyingQuestion": string|null }.
If you cannot meaningfully apply this action without inventing a fact, return an empty-ish single alternative that only makes safe wording changes and set "clarifyingQuestion" to a specific question instead.

Role: ${context.entryTitle ?? "(unspecified)"} at ${context.organization ?? "(unspecified)"}
Other bullets in this role (for context/tone, do not copy): ${(context.otherBulletsInEntry ?? []).join(" | ") || "(none)"}

BULLET TO REWRITE:
"""
${bulletText}
"""`;

  return runStructured(RewriteOutputSchema, { system: systemPreamble(), prompt, maxTokens: 1024 }, { provider });
}

export async function generateSmartQuestions(
  bulletText: string,
  provider?: AiProvider
): Promise<SmartQuestion> {
  const prompt = `This resume bullet may be missing information that would make it stronger (scale, tools, measurable outcome, audience, or business impact). Ask 2-4 short, specific clarifying questions whose answers could be used to improve it — do not guess the answers yourself.

Return JSON: { "bulletId": "n/a", "questions": string[] }.

BULLET:
"""
${bulletText}
"""`;

  const result = await runStructured(SmartQuestionSchema, { system: systemPreamble(), prompt, maxTokens: 512 }, { provider });
  return result;
}

export async function applyAnswersToBullet(
  bulletText: string,
  questions: string[],
  answers: string[],
  provider?: AiProvider
): Promise<RewriteOutput> {
  const qa = questions.map((q, i) => `Q: ${q}\nA: ${answers[i] ?? "(not answered)"}`).join("\n\n");

  const prompt = `Rewrite this resume bullet incorporating ONLY the facts the candidate provided below. Do not add any fact beyond what is stated in the bullet or the answers.

Return JSON: { "alternatives": [{ "text": string, "rationale": string }] (1-3 items), "clarifyingQuestion": null }.

ORIGINAL BULLET:
"""
${bulletText}
"""

CLARIFYING Q&A:
${qa}`;

  return runStructured(RewriteOutputSchema, { system: systemPreamble(), prompt, maxTokens: 1024 }, { provider });
}
