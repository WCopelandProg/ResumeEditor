import { z } from "zod";

/**
 * The structured resume model. This is the application's source of truth
 * after import — the original PDF is kept only for reference/re-parsing.
 * Every node (section/entry/bullet) carries a stable `id` so AI suggestions,
 * undo/redo history, and UI selection can all reference exact content even
 * as the tree is reordered or edited.
 */

export const SECTION_TYPES = [
  "SUMMARY",
  "EXPERIENCE",
  "EDUCATION",
  "PROJECTS",
  "SKILLS",
  "CERTIFICATIONS",
  "AWARDS",
  "LEADERSHIP",
  "PUBLICATIONS",
  "RESEARCH",
  "VOLUNTEERING",
  "CUSTOM",
] as const;

export type SectionType = (typeof SECTION_TYPES)[number];

export const SECTION_TYPE_LABELS: Record<SectionType, string> = {
  SUMMARY: "Professional Summary",
  EXPERIENCE: "Experience",
  EDUCATION: "Education",
  PROJECTS: "Projects",
  SKILLS: "Skills",
  CERTIFICATIONS: "Certifications",
  AWARDS: "Awards",
  LEADERSHIP: "Leadership",
  PUBLICATIONS: "Publications",
  RESEARCH: "Research",
  VOLUNTEERING: "Volunteering",
  CUSTOM: "Custom Section",
};

export const LinkItemSchema = z.object({
  label: z.string().default("Link"),
  url: z.string(),
});
export type LinkItem = z.infer<typeof LinkItemSchema>;

export const BulletSchema = z.object({
  id: z.string(),
  text: z.string(),
  order: z.number().int(),
});
export type Bullet = z.infer<typeof BulletSchema>;

export const EntrySchema = z.object({
  id: z.string(),
  order: z.number().int(),
  /** Company / school / issuing organization / project owner. */
  organization: z.string().optional(),
  /** Job title / degree / project name / award name. */
  title: z.string().optional(),
  location: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  isCurrent: z.boolean().optional(),
  /** Freeform paragraph — used for skills-category values, one-line entries, etc. */
  description: z.string().optional(),
  bullets: z.array(BulletSchema).default([]),
  links: z.array(LinkItemSchema).default([]),
  /** Small structured extras that vary by entry type (e.g. gpa, degree, issuer date). */
  meta: z.record(z.string(), z.string()).default({}),
});
export type Entry = z.infer<typeof EntrySchema>;

export const SectionSchema = z.object({
  id: z.string(),
  type: z.enum(SECTION_TYPES),
  title: z.string(),
  order: z.number().int(),
  /** Freeform paragraph body, used primarily by SUMMARY and CUSTOM text sections. */
  text: z.string().optional(),
  entries: z.array(EntrySchema).default([]),
});
export type Section = z.infer<typeof SectionSchema>;

export const PersonalInfoSchema = z.object({
  fullName: z.string().default(""),
  headline: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  location: z.string().optional(),
  linkedin: z.string().optional(),
  github: z.string().optional(),
  website: z.string().optional(),
});
export type PersonalInfo = z.infer<typeof PersonalInfoSchema>;

export const StructuredResumeSchema = z.object({
  personalInfo: PersonalInfoSchema,
  sections: z.array(SectionSchema).default([]),
});
export type StructuredResume = z.infer<typeof StructuredResumeSchema>;

export const RESUME_TEMPLATES = [
  { id: "classic", name: "Classic", description: "Traditional serif layout, timeless and conservative." },
  { id: "modern", name: "Modern", description: "Clean sans-serif with a subtle accent color." },
  { id: "technical", name: "Technical", description: "Dense, skills-forward layout for engineers." },
  { id: "minimal", name: "Minimal", description: "Maximum whitespace, understated typography." },
  { id: "executive", name: "Executive", description: "Bold header, generous spacing for senior profiles." },
  { id: "student", name: "Student", description: "Education-forward layout for students & new grads." },
] as const;

export type TemplateId = (typeof RESUME_TEMPLATES)[number]["id"];

export const ResumeStyleSchema = z.object({
  templateId: z.string().default("modern"),
  fontFamily: z.string().default("Inter"),
  fontSizePt: z.number().min(8).max(13).default(10),
  headingScale: z.number().min(1).max(1.6).default(1.15),
  lineSpacing: z.number().min(1).max(1.6).default(1.15),
  marginTopIn: z.number().min(0.3).max(1.25).default(0.6),
  marginRightIn: z.number().min(0.3).max(1.25).default(0.6),
  marginBottomIn: z.number().min(0.3).max(1.25).default(0.6),
  marginLeftIn: z.number().min(0.3).max(1.25).default(0.6),
  bulletSpacingPt: z.number().min(0).max(10).default(2),
  sectionSpacingPt: z.number().min(4).max(24).default(10),
  alignment: z.enum(["left", "justified"]).default("left"),
  accentColor: z.string().default("#1d4ed8"),
  showDividers: z.boolean().default(true),
  columns: z.union([z.literal(1), z.literal(2)]).default(1),
});
export type ResumeStyle = z.infer<typeof ResumeStyleSchema>;

/** Reasonable safeguarded bounds so users can't easily produce an ugly resume. */
export const STYLE_BOUNDS = {
  fontSizePt: { min: 9, max: 12, step: 0.5 },
  lineSpacing: { min: 1.0, max: 1.4, step: 0.05 },
  sectionSpacingPt: { min: 6, max: 18, step: 1 },
  bulletSpacingPt: { min: 0, max: 6, step: 1 },
  margins: { min: 0.4, max: 1.0, step: 0.05 },
} as const;

export function defaultResumeStyle(templateId: string = "modern"): ResumeStyle {
  return ResumeStyleSchema.parse({ templateId });
}

export function emptyStructuredResume(): StructuredResume {
  return {
    personalInfo: { fullName: "" },
    sections: [],
  };
}
