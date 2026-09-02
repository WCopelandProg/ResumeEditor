import "server-only";
import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";
import type { ResumeStyle, StructuredResume } from "@/lib/resume/types";
import { ResumeDocument } from "./ResumeDocument";

/**
 * Renders a StructuredResume + ResumeStyle to a real PDF: genuine text
 * objects (selectable, copy-pasteable, ATS-readable) and real link
 * annotations — not a screenshot. See ResumeDocument.tsx for the layout
 * and pagination rules.
 */
export async function renderResumeToPdfBuffer(resume: StructuredResume, style: ResumeStyle): Promise<Buffer> {
  const buffer = await renderToBuffer(createElement(ResumeDocument, { resume, style }));
  return Buffer.from(buffer);
}
