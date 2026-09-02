import "server-only";
import { extractPdf, PdfParseError } from "./extract";
import { segmentIntoResume } from "./segment";
import type { StructuredResume } from "@/lib/resume/types";

export type ParseOutcome =
  | { status: "SUCCESS"; resume: StructuredResume; warnings: string[]; rawText: string }
  | { status: "NO_TEXT_LAYER"; rawText: string }
  | { status: "FAILED"; error: string };

/**
 * Parses an uploaded PDF into a StructuredResume. Scanned/image-only PDFs
 * (no extractable text layer) are detected and reported distinctly rather
 * than silently producing an empty resume — the API layer surfaces this so
 * the UI can explain that OCR would be needed (see architecture note in
 * README's "Scanned resumes" section for how OCR would plug in here).
 */
export async function parseResumePdf(buffer: Buffer): Promise<ParseOutcome> {
  let extracted;
  try {
    extracted = await extractPdf(buffer);
  } catch (err) {
    if (err instanceof PdfParseError) {
      return { status: "FAILED", error: err.message };
    }
    console.error("[pdf-parse] unexpected extraction failure", err);
    return { status: "FAILED", error: "We couldn't read this PDF. Please try a different file." };
  }

  if (!extracted.hasTextLayer) {
    return { status: "NO_TEXT_LAYER", rawText: extracted.rawText };
  }

  try {
    const { resume, warnings } = segmentIntoResume(extracted);
    return { status: "SUCCESS", resume, warnings, rawText: extracted.rawText };
  } catch (err) {
    console.error("[pdf-parse] unexpected segmentation failure", err);
    return {
      status: "FAILED",
      error: "We extracted text from this PDF but couldn't organize it into sections. Please try a different file.",
    };
  }
}
