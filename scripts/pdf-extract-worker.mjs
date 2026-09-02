#!/usr/bin/env node
// Standalone PDF extraction worker, run as a real child process (see
// src/lib/pdf/extract.ts). This file is intentionally never `import`-ed by
// any app module, so it is never bundled by webpack/Turbopack — both
// mangle pdfjs-dist's own internal dynamic import of its worker submodule
// when pdfjs is pulled into a bundle ("Cannot find module
// '.../chunks/pdf.worker.mjs'"), a bug that reproduces with either bundler.
// Running pdfjs in a plain, unbundled `node` process sidesteps that
// entirely, and as a side benefit isolates a malformed/huge PDF's parsing
// from the main server process (a hang or crash here can't take the server
// down, and it can be time-limited at the call site).
//
// Usage: node pdf-extract-worker.mjs <path-to-pdf>
// Prints one JSON object to stdout: { pages, links, rawText, hasTextLayer }
// or { error: string } with a non-zero exit code on failure.

import { readFile } from "fs/promises";

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    throw new Error("Usage: pdf-extract-worker.mjs <path-to-pdf>");
  }

  const buffer = await readFile(filePath);
  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");

  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buffer), useSystemFonts: true });
  const doc = await loadingTask.promise;

  const pages = [];
  const links = [];
  let rawText = "";

  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const viewport = page.getViewport({ scale: 1 });
    const content = await page.getTextContent();

    const items = [];
    for (const raw of content.items) {
      if (!("str" in raw) || !raw.str.trim()) continue;
      const transform = raw.transform;
      const fontSize = Math.hypot(transform[0], transform[1]) || Math.abs(transform[3]) || 10;
      const fontName = raw.fontName ?? "";
      items.push({
        text: raw.str,
        x: transform[4],
        y: viewport.height - transform[5],
        width: raw.width ?? 0,
        height: raw.height || fontSize,
        fontSize,
        fontName,
        bold: /bold|black|heavy/i.test(fontName),
      });
      rawText += raw.str + (raw.hasEOL ? "\n" : " ");
    }
    pages.push({ index: i - 1, width: viewport.width, height: viewport.height, items });

    const annotations = await page.getAnnotations();
    for (const ann of annotations) {
      const url = ann.url ?? ann.unsafeUrl;
      if (ann.subtype === "Link" && url && Array.isArray(ann.rect)) {
        const [x0, y0, x1, y1] = ann.rect;
        links.push({ url, pageIndex: i - 1, rect: [x0, viewport.height - y1, x1, viewport.height - y0] });
      }
    }
  }

  const hasTextLayer = rawText.trim().length >= 20;
  process.stdout.write(JSON.stringify({ pages, links, rawText: rawText.trim(), hasTextLayer }));
}

main().catch((err) => {
  process.stderr.write(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }));
  process.exit(1);
});
