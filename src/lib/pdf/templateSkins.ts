import type { TemplateId } from "@/lib/resume/types";

/**
 * Visual "skin" per template. Templates only ever change how content looks
 * (fonts, dividers, heading case, accent treatment) — never the content
 * model itself. This is what makes "switch templates without losing
 * content" trivial: the same StructuredResume + ResumeStyle renders through
 * whichever skin is selected.
 *
 * Font families are restricted to PDF's standard 14 fonts (Helvetica,
 * Times-Roman, Courier families). These require no embedded font files and
 * are guaranteed to render identically everywhere, which matters more for a
 * resume than novelty typography — see fonts.ts for the mapping from the
 * user-facing font choice to these families.
 */
export interface TemplateSkin {
  headingCase: "upper" | "title";
  headingStyle: "underline" | "bar" | "plain";
  headingColor: "accent" | "ink";
  nameAlign: "left" | "center";
  nameBanner: boolean;
  headingLetterSpacing: number;
  serifHeadings: boolean;
}

export const TEMPLATE_SKINS: Record<TemplateId, TemplateSkin> = {
  classic: {
    headingCase: "title",
    headingStyle: "underline",
    headingColor: "ink",
    nameAlign: "center",
    nameBanner: false,
    headingLetterSpacing: 0,
    serifHeadings: true,
  },
  modern: {
    headingCase: "upper",
    headingStyle: "bar",
    headingColor: "accent",
    nameAlign: "left",
    nameBanner: false,
    headingLetterSpacing: 0.6,
    serifHeadings: false,
  },
  technical: {
    headingCase: "upper",
    headingStyle: "plain",
    headingColor: "accent",
    nameAlign: "left",
    nameBanner: false,
    headingLetterSpacing: 0.4,
    serifHeadings: false,
  },
  minimal: {
    headingCase: "upper",
    headingStyle: "plain",
    headingColor: "ink",
    nameAlign: "left",
    nameBanner: false,
    headingLetterSpacing: 1.2,
    serifHeadings: false,
  },
  executive: {
    headingCase: "upper",
    headingStyle: "underline",
    headingColor: "accent",
    nameAlign: "left",
    nameBanner: true,
    headingLetterSpacing: 0.8,
    serifHeadings: true,
  },
  student: {
    headingCase: "title",
    headingStyle: "bar",
    headingColor: "accent",
    nameAlign: "left",
    nameBanner: false,
    headingLetterSpacing: 0,
    serifHeadings: false,
  },
};

export function getTemplateSkin(templateId: string): TemplateSkin {
  return TEMPLATE_SKINS[templateId as TemplateId] ?? TEMPLATE_SKINS.modern;
}

const SIDEBAR_SECTION_TYPES = new Set(["SKILLS", "EDUCATION", "CERTIFICATIONS", "AWARDS", "LEADERSHIP"]);
export function isSidebarSection(type: string): boolean {
  return SIDEBAR_SECTION_TYPES.has(type);
}
