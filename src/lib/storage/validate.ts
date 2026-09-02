import { AppError } from "@/lib/api/errors";

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME_TYPES = new Set(["application/pdf"]);
// A real PDF starts with "%PDF-"; checking magic bytes catches a renamed
// non-PDF file even if the browser sent a spoofed Content-Type.
const PDF_MAGIC = Buffer.from("%PDF-");

export function assertValidPdfUpload(file: { type: string; size: number }, buffer: Buffer) {
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    throw new AppError("Only PDF files are supported.", 415);
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new AppError(`File is too large. The maximum upload size is ${MAX_UPLOAD_BYTES / (1024 * 1024)}MB.`, 413);
  }
  if (buffer.length === 0) {
    throw new AppError("The uploaded file is empty.", 400);
  }
  if (!buffer.subarray(0, 5).equals(PDF_MAGIC)) {
    throw new AppError("This file doesn't look like a valid PDF.", 400);
  }
}

/** Strips path separators, control characters, and collapses whitespace so a filename is always safe to log/store. */
export function sanitizeFilename(name: string): string {
  const base = name.split(/[/\\]/).pop() ?? "resume.pdf";
  const cleaned = base
    .replace(/[^\w.\-\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned.slice(0, 150) || "resume.pdf";
}
