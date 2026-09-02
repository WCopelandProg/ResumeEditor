import { z } from "zod";
import { ResumeStyleSchema, StructuredResumeSchema } from "@/lib/resume/types";
import { REWRITE_ACTIONS } from "@/lib/ai/schema";

export const CreateResumeSchema = z.object({
  name: z.string().trim().min(1).max(150).default("Untitled Resume"),
  targetRole: z.string().trim().max(150).optional(),
  templateId: z.string().trim().max(50).default("modern"),
});

export const UpdateResumeSchema = z.object({
  name: z.string().trim().min(1).max(150).optional(),
  targetRole: z.string().trim().max(150).nullable().optional(),
  templateId: z.string().trim().max(50).optional(),
  content: StructuredResumeSchema.optional(),
  style: ResumeStyleSchema.partial().optional(),
});

export const CreateVersionSchema = z.object({
  label: z.string().trim().min(1).max(150),
});

export const SuggestionActionSchema = z.object({
  action: z.enum(["accept", "reject", "edit"]),
  finalText: z.string().trim().min(1).optional(),
});

export const JobDescriptionSchema = z.object({
  rawText: z.string().trim().min(30, "Paste the full job description (at least a few sentences).").max(20000),
  title: z.string().trim().max(150).optional(),
  company: z.string().trim().max(150).optional(),
});

export const RewriteRequestSchema = z.object({
  bulletId: z.string().min(1),
  action: z.enum(REWRITE_ACTIONS),
});

export const SmartQuestionsRequestSchema = z.object({
  bulletId: z.string().min(1),
});

export const ApplyAnswersRequestSchema = z.object({
  bulletId: z.string().min(1),
  questions: z.array(z.string()).min(1),
  answers: z.array(z.string()),
});
