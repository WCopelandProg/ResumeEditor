import type { ResumeStyle as PrismaResumeStyle } from "@prisma/client";
import { ResumeStyleSchema, StructuredResumeSchema, type ResumeStyle, type StructuredResume } from "./types";

/**
 * `Resume.content` is stored as Prisma `Json` (no compile-time shape), and
 * `ResumeStyle` is stored as flat DB columns rather than the nested object
 * the rest of the app works with. These mappers are the single seam where
 * that translation happens and where untyped JSON gets validated back into
 * a trusted `StructuredResume`/`ResumeStyle` — nothing else in the codebase
 * should reach into raw DB rows for these two shapes.
 */
export function contentFromDb(json: unknown): StructuredResume {
  return StructuredResumeSchema.parse(json);
}

export function styleFromDb(row: PrismaResumeStyle): ResumeStyle {
  return ResumeStyleSchema.parse({
    templateId: row.templateId,
    fontFamily: row.fontFamily,
    fontSizePt: row.fontSizePt,
    headingScale: row.headingScale,
    lineSpacing: row.lineSpacing,
    marginTopIn: row.marginTopIn,
    marginRightIn: row.marginRightIn,
    marginBottomIn: row.marginBottomIn,
    marginLeftIn: row.marginLeftIn,
    bulletSpacingPt: row.bulletSpacingPt,
    sectionSpacingPt: row.sectionSpacingPt,
    alignment: row.alignment,
    accentColor: row.accentColor,
    showDividers: row.showDividers,
    columns: row.columns,
  });
}

export function styleToDbFields(style: ResumeStyle) {
  return {
    templateId: style.templateId,
    fontFamily: style.fontFamily,
    fontSizePt: style.fontSizePt,
    headingScale: style.headingScale,
    lineSpacing: style.lineSpacing,
    marginTopIn: style.marginTopIn,
    marginRightIn: style.marginRightIn,
    marginBottomIn: style.marginBottomIn,
    marginLeftIn: style.marginLeftIn,
    bulletSpacingPt: style.bulletSpacingPt,
    sectionSpacingPt: style.sectionSpacingPt,
    alignment: style.alignment,
    accentColor: style.accentColor,
    showDividers: style.showDividers,
    columns: style.columns,
  };
}
