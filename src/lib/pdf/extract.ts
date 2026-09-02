import "server-only";
import { execFile } from "child_process";
import { mkdtemp, rm, writeFile } from "fs/promises";
import { tmpdir } from "os";
import path from "path";

/**
 * Low-level PDF text/layout extraction. This module only knows about raw
 * positioned text and link annotations — turning that into a
 * StructuredResume is segment.ts's job. Keeping these separate means the
 * fragile, PDF-format-specific code stays isolated from the resume-domain
 * heuristics.
 *
 * The actual pdfjs-dist parsing runs in a separate child process (see
 * scripts/pdf-extract-worker.mjs) rather than being imported here directly.
 * pdfjs-dist dynamically imports its own worker submodule at runtime, and
 * both Turbopack and webpack mangle that import once pdfjs is pulled into a
 * Next.js server bundle ("Cannot find module '.../chunks/pdf.worker.mjs'").
 * Running it as a plain, unbundled `node` process sidesteps that bundler
 * limitation entirely, with the side benefit of isolating a malformed PDF's
 * parsing from the main server process.
 */

export interface TextItem {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontName: string;
  bold: boolean;
}

export interface LinkAnnotation {
  url: string;
  rect: [number, number, number, number];
  pageIndex: number;
}

export interface ExtractedPage {
  index: number;
  width: number;
  height: number;
  items: TextItem[];
}

export interface ExtractedPdf {
  pages: ExtractedPage[];
  links: LinkAnnotation[];
  rawText: string;
  hasTextLayer: boolean;
}

export class PdfParseError extends Error {}

const WORKER_SCRIPT = path.join(process.cwd(), "scripts", "pdf-extract-worker.mjs");
const EXTRACT_TIMEOUT_MS = 30_000;

export async function extractPdf(buffer: Buffer): Promise<ExtractedPdf> {
  const dir = await mkdtemp(path.join(tmpdir(), "resume-pdf-"));
  const filePath = path.join(dir, "input.pdf");

  try {
    await writeFile(filePath, buffer);

    const { stdout } = await new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
      execFile(
        process.execPath,
        [WORKER_SCRIPT, filePath],
        { timeout: EXTRACT_TIMEOUT_MS, maxBuffer: 1024 * 1024 * 64 },
        (error, stdout, stderr) => {
          if (error) {
            reject(new WorkerFailure(stderr || error.message));
            return;
          }
          resolve({ stdout, stderr });
        }
      );
    });

    return JSON.parse(stdout) as ExtractedPdf;
  } catch (err) {
    if (err instanceof WorkerFailure) {
      let message = err.message;
      try {
        message = (JSON.parse(err.message) as { error?: string }).error ?? message;
      } catch {
        // stderr wasn't JSON (e.g. a timeout/kill) — fall through with the raw message.
      }
      console.error("[pdf-extract] worker failed:", message);
      if (/password/i.test(message)) {
        throw new PdfParseError("This PDF is password-protected. Please upload an unprotected file.");
      }
      throw new PdfParseError("We couldn't read this PDF. The file may be corrupted or in an unsupported format.");
    }
    throw err;
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

class WorkerFailure extends Error {}
