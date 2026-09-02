/**
 * Maps the user-facing font choice to one of PDF's 14 standard fonts.
 * Standard fonts need no embedding/registration and render identically in
 * every viewer, which is worth more for a resume than novelty typefaces —
 * see templateSkins.ts for the broader rationale. Adding real embedded
 * Google Fonts later only requires registering them with @react-pdf's
 * `Font.register` and extending this map; nothing else in the render
 * pipeline would need to change.
 */
export const FONT_FAMILY_OPTIONS = [
  { value: "Inter", label: "Inter (sans-serif)" },
  { value: "Georgia", label: "Georgia (serif)" },
  { value: "Courier New", label: "Courier New (monospace)" },
] as const;

export type PdfFontFamily = "Helvetica" | "Times-Roman" | "Courier";

export function resolvePdfFont(fontFamily: string): PdfFontFamily {
  switch (fontFamily) {
    case "Georgia":
      return "Times-Roman";
    case "Courier New":
      return "Courier";
    default:
      return "Helvetica";
  }
}

export function boldVariant(font: PdfFontFamily): string {
  if (font === "Times-Roman") return "Times-Bold";
  if (font === "Courier") return "Courier-Bold";
  return "Helvetica-Bold";
}

export function italicVariant(font: PdfFontFamily): string {
  if (font === "Times-Roman") return "Times-Italic";
  if (font === "Courier") return "Courier-Oblique";
  return "Helvetica-Oblique";
}
