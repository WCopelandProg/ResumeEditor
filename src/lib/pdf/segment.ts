import "server-only";
import type { ExtractedPage, ExtractedPdf, LinkAnnotation, TextItem } from "./extract";
import type { Entry, PersonalInfo, Section, SectionType, StructuredResume } from "@/lib/resume/types";
import { newBulletId, newEntryId, newSectionId } from "@/lib/resume/ids";

/**
 * Turns raw positioned PDF text into a StructuredResume. This is
 * intentionally a heuristic layout parser, not a machine-learning model:
 * it looks at font size, boldness, indentation, bullet glyphs, and known
 * resume vocabulary to infer structure the same way a human skimming the
 * page would. Real-world resumes vary enormously in layout, so this will
 * not be perfect on every file — the product goal is a strong first pass
 * that the user can immediately fix up in the editor, not flawless OCR.
 */

interface Line {
  text: string;
  x: number;
  y: number;
  right: number;
  fontSize: number;
  bold: boolean;
  pageIndex: number;
  items: TextItem[];
}

const BULLET_GLYPHS = /^[•\-*▪●‣·◦○]\s*|^o\s+(?=[A-Z])/;
const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.-]+/;
const PHONE_RE = /(\+?\d{1,2}[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/;
const URL_RE = /(https?:\/\/[^\s,]+|(?:www\.)?[\w-]+\.(?:com|dev|io|me|net|org)(?:\/[^\s,]*)?)/i;
const LINKEDIN_RE = /linkedin\.com\/[^\s,]+/i;
const GITHUB_RE = /github\.com\/[^\s,]+/i;
// NOTE: this is a plain string (not a regex literal), so backslashes must be
// doubled — "\\s" here, not "\s" — or they're silently dropped by the JS
// string literal parser and the pattern stops matching whitespace/digits.
const DATE_TOKEN =
  "(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t)?(?:ember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\\.?\\s+\\d{4}|\\d{1,2}\\/\\d{4}|\\d{4}";
const DATE_RANGE_RE = new RegExp(`(${DATE_TOKEN})\\s*(?:-|–|—|to)\\s*(${DATE_TOKEN}|[Pp]resent|[Cc]urrent)`, "i");
const TRAILING_YEAR_RE = /(?:,|\(|\|)?\s*(\d{4})\s*\)?\s*$/;
const LOCATION_RE = /([A-Z][a-zA-Z.]+(?:\s[A-Z][a-zA-Z.]+)*),\s*([A-Z]{2}\b|[A-Z][a-z]+)/;
const TITLE_KEYWORDS =
  /engineer|manager|analyst|intern|developer|director|designer|specialist|consultant|coordinator|lead|scientist|founder|president|associate|assistant|architect|administrator|officer|strategist|researcher|teaching assistant|volunteer/i;

const HEADING_ALIASES: Array<{ type: SectionType; patterns: RegExp[] }> = [
  { type: "SUMMARY", patterns: [/^(professional\s+)?summary$/i, /^objective$/i, /^profile$/i, /^about\s?(me)?$/i] },
  { type: "EXPERIENCE", patterns: [/experience/i, /employment/i, /work\s+history/i] },
  { type: "EDUCATION", patterns: [/education/i, /academic/i] },
  { type: "PROJECTS", patterns: [/projects?/i] },
  { type: "SKILLS", patterns: [/skills/i, /technical\s+proficienc/i, /technologies/i] },
  { type: "CERTIFICATIONS", patterns: [/certificat/i, /licenses?/i] },
  { type: "AWARDS", patterns: [/awards?/i, /honors?/i, /achievements?/i] },
  { type: "LEADERSHIP", patterns: [/leadership/i, /activities/i, /extracurricular/i] },
  { type: "PUBLICATIONS", patterns: [/publications?/i] },
  { type: "RESEARCH", patterns: [/research/i] },
  { type: "VOLUNTEERING", patterns: [/volunteer/i, /community\s+service/i] },
];

function isAllCaps(text: string): boolean {
  const letters = text.replace(/[^a-zA-Z]/g, "");
  return letters.length >= 3 && letters === letters.toUpperCase();
}

function matchHeading(text: string): { type: SectionType; title: string } | null {
  const trimmed = text.trim();
  // Headings are short labels ("Experience", "Technical Skills") — without
  // this bound, a keyword like "experience" appearing inside a long summary
  // sentence would wrongly be classified as a new section heading.
  if (trimmed.length > 40 || trimmed.split(/\s+/).length > 5) return null;
  for (const { type, patterns } of HEADING_ALIASES) {
    if (patterns.some((p) => p.test(trimmed))) {
      return { type, title: toTitleCase(trimmed) };
    }
  }
  return null;
}

function toTitleCase(text: string): string {
  return text
    .toLowerCase()
    .split(/\s+/)
    .map((w) => (w.length ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

/** Groups raw text items on a page into visual lines, ordered for reading (handles simple 2-column layouts). */
function buildLinesForPage(page: ExtractedPage): Line[] {
  const sorted = [...page.items].sort((a, b) => a.y - b.y || a.x - b.x);
  const rawLines: Line[] = [];
  for (const item of sorted) {
    const last = rawLines[rawLines.length - 1];
    const tolerance = Math.max(item.height, last?.fontSize ?? 0) * 0.55;
    if (last && Math.abs(item.y - last.y) <= tolerance) {
      const gap = item.x - last.right;
      last.text += gap > last.fontSize * 0.3 ? ` ${item.text}` : item.text;
      last.right = Math.max(last.right, item.x + item.width);
      last.fontSize = Math.max(last.fontSize, item.fontSize);
      last.bold = last.bold || item.bold;
      last.items.push(item);
    } else {
      rawLines.push({
        text: item.text,
        x: item.x,
        y: item.y,
        right: item.x + item.width,
        fontSize: item.fontSize,
        bold: item.bold,
        pageIndex: page.index,
        items: [item],
      });
    }
  }

  // Re-sort each line's constituent items left-to-right (they were only
  // guaranteed sorted primarily by y, secondarily by x across the whole page).
  for (const line of rawLines) {
    line.items.sort((a, b) => a.x - b.x);
    line.text = line.items.map((i) => i.text).join(" ").replace(/\s+/g, " ").trim();
  }

  return detectColumnsAndOrder(rawLines, page.width);
}

function detectColumnsAndOrder(lines: Line[], pageWidth: number): Line[] {
  if (lines.length < 6) return lines;
  const xs = [...new Set(lines.map((l) => Math.round(l.x)))].sort((a, b) => a - b);
  let bestGap = 0;
  let splitAt = -1;
  for (let i = 1; i < xs.length; i++) {
    const gap = xs[i] - xs[i - 1];
    if (gap > bestGap) {
      bestGap = gap;
      splitAt = xs[i];
    }
  }
  if (bestGap < pageWidth * 0.12 || splitAt < 0) return lines;

  const left = lines.filter((l) => l.x < splitAt);
  const right = lines.filter((l) => l.x >= splitAt);
  if (left.length < 3 || right.length < 3) return lines;

  return [...left.sort((a, b) => a.y - b.y), ...right.sort((a, b) => a.y - b.y)];
}

function extractDates(text: string): { text: string; startDate?: string; endDate?: string; isCurrent?: boolean } {
  const rangeMatch = text.match(DATE_RANGE_RE);
  if (rangeMatch) {
    const isCurrent = /present|current/i.test(rangeMatch[2]);
    return {
      text: text.replace(rangeMatch[0], "").replace(/[|,-]\s*$/, "").trim(),
      startDate: rangeMatch[1],
      endDate: isCurrent ? undefined : rangeMatch[2],
      isCurrent,
    };
  }
  const yearMatch = text.match(TRAILING_YEAR_RE);
  if (yearMatch && Number(yearMatch[1]) > 1950 && Number(yearMatch[1]) < 2100) {
    return { text: text.replace(TRAILING_YEAR_RE, "").trim(), endDate: yearMatch[1] };
  }
  return { text };
}

function extractLocation(text: string): { text: string; location?: string } {
  const match = text.match(LOCATION_RE);
  if (!match) return { text };
  return { text: text.replace(match[0], "").replace(/[|,-]\s*$/, "").replace(/^[|,-]\s*/, "").trim(), location: match[0] };
}

function splitHeaderIntoOrgAndTitle(headerLines: string[]): { organization?: string; title?: string } {
  const parts = headerLines.flatMap((l) => l.split(/\s*[|—]\s*| - (?=[A-Z])/)).map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) return {};
  if (parts.length === 1) return { title: parts[0] };

  const titleIdx = parts.findIndex((p) => TITLE_KEYWORDS.test(p));
  if (titleIdx === 0) return { title: parts[0], organization: parts.slice(1).join(", ") };
  if (titleIdx > 0) return { organization: parts.slice(0, titleIdx).join(", "), title: parts[titleIdx] };
  // No keyword match: conventional resume order is Organization, then Title.
  return { organization: parts[0], title: parts.slice(1).join(", ") };
}

interface ParsedPersonal {
  personalInfo: PersonalInfo;
  consumedLineCount: number;
}

function parsePersonalInfoBlock(lines: Line[], links: LinkAnnotation[]): ParsedPersonal {
  if (lines.length === 0) return { personalInfo: { fullName: "" }, consumedLineCount: 0 };

  const nameLine = lines.reduce((a, b) => (b.fontSize > a.fontSize ? b : a), lines[0]);
  const fullName = toTitleCase(nameLine.text.trim());
  const rest = lines.filter((l) => l !== nameLine);

  const info: PersonalInfo = { fullName };

  const nonContactCandidate = rest.find(
    (l) => !EMAIL_RE.test(l.text) && !PHONE_RE.test(l.text) && !URL_RE.test(l.text) && l.text.split(" ").length <= 8
  );
  if (nonContactCandidate && rest.indexOf(nonContactCandidate) <= 1) {
    info.headline = nonContactCandidate.text.trim();
  }

  const combined = rest.map((l) => l.text).join(" | ");
  const email = combined.match(EMAIL_RE)?.[0];
  const phone = combined.match(PHONE_RE)?.[0];
  const linkedinFromText = combined.match(LINKEDIN_RE)?.[0];
  const githubFromText = combined.match(GITHUB_RE)?.[0];

  const linkedinLink = links.find((l) => LINKEDIN_RE.test(l.url));
  const githubLink = links.find((l) => GITHUB_RE.test(l.url));
  const otherLinks = links.filter((l) => l !== linkedinLink && l !== githubLink);

  if (email) info.email = email;
  if (phone) info.phone = phone;
  if (linkedinLink || linkedinFromText) info.linkedin = linkedinLink?.url ?? `https://${linkedinFromText}`;
  if (githubLink || githubFromText) info.github = githubLink?.url ?? `https://${githubFromText}`;
  if (otherLinks[0]) info.website = otherLinks[0].url;

  const locationMatch = combined.match(LOCATION_RE);
  if (locationMatch) info.location = locationMatch[0];

  return { personalInfo: info, consumedLineCount: lines.length };
}

function buildEntriesFromLines(lines: Line[], sectionType: SectionType): { entries: Entry[]; text?: string } {
  if (sectionType === "SKILLS") {
    const entries: Entry[] = lines.map((line, i) => {
      const stripped = line.text.replace(BULLET_GLYPHS, "").trim();
      const idx = stripped.indexOf(":");
      if (idx > -1 && idx < 40) {
        return { id: newEntryId(), order: i, title: stripped.slice(0, idx).trim(), description: stripped.slice(idx + 1).trim(), bullets: [], links: [], meta: {} };
      }
      return { id: newEntryId(), order: i, description: stripped, bullets: [], links: [], meta: {} };
    });
    return { entries };
  }

  type Block = { header: string[]; bullets: string[] };
  const blocks: Block[] = [];
  let current: Block = { header: [], bullets: [] };
  const MAX_HEADER_LINES = 2;

  for (const line of lines) {
    const stripped = line.text.replace(BULLET_GLYPHS, "").trim();
    const isBullet = BULLET_GLYPHS.test(line.text.trim());

    if (isBullet) {
      current.bullets.push(stripped);
    } else if (current.bullets.length > 0 || current.header.length >= MAX_HEADER_LINES) {
      if (current.header.length || current.bullets.length) blocks.push(current);
      current = { header: [stripped], bullets: [] };
    } else {
      current.header.push(stripped);
    }
  }
  if (current.header.length || current.bullets.length) blocks.push(current);

  if (blocks.length === 0) return { entries: [] };

  // A section with no bullets anywhere and only one block of short lines
  // reads better as a paragraph (e.g. a CUSTOM narrative section).
  const totalBullets = blocks.reduce((n, b) => n + b.bullets.length, 0);
  if (totalBullets === 0 && blocks.length === 1 && sectionType === "CUSTOM") {
    return { entries: [], text: blocks[0].header.join(" ") };
  }

  const entries: Entry[] = blocks.map((block, i) => {
    const headerJoined = block.header.join(" | ");
    const { text: afterDates, ...dateInfo } = extractDates(headerJoined);
    const { text: afterLocation, location } = extractLocation(afterDates);
    const { organization, title } = splitHeaderIntoOrgAndTitle([afterLocation]);

    return {
      id: newEntryId(),
      order: i,
      organization,
      title,
      location,
      startDate: dateInfo.startDate,
      endDate: dateInfo.endDate,
      isCurrent: dateInfo.isCurrent,
      bullets: block.bullets.map((text, bi) => ({ id: newBulletId(), text, order: bi })),
      links: [],
      meta: {},
    };
  });

  return { entries };
}

export function segmentIntoResume(extracted: ExtractedPdf): { resume: StructuredResume; warnings: string[] } {
  const warnings: string[] = [];
  const allLines = extracted.pages.flatMap((p) => buildLinesForPage(p)).filter((l) => l.text.trim().length > 0);

  if (allLines.length === 0) {
    warnings.push("No readable text lines were found in this PDF.");
    return { resume: { personalInfo: { fullName: "" }, sections: [] }, warnings };
  }

  const fontSizes = [...new Set(allLines.map((l) => Math.round(l.fontSize)))].sort((a, b) => b - a);
  const secondTierSize = fontSizes[1] ?? fontSizes[0];

  const headingIndices: number[] = [];
  const headingInfo = new Map<number, { type: SectionType; title: string }>();
  allLines.forEach((line, i) => {
    if (i === 0) return; // first line is always treated as the name, never a heading
    const known = matchHeading(line.text);
    if (known) {
      headingIndices.push(i);
      headingInfo.set(i, known);
      return;
    }
    const trimmed = line.text.trim();
    if (trimmed.length <= 45 && !BULLET_GLYPHS.test(trimmed) && isAllCaps(trimmed) && line.fontSize >= secondTierSize) {
      headingIndices.push(i);
      headingInfo.set(i, { type: "CUSTOM", title: toTitleCase(trimmed) });
    }
  });

  const personalLines = allLines.slice(0, headingIndices[0] ?? allLines.length);
  const linkedinLinks = extracted.links;
  const { personalInfo } = parsePersonalInfoBlock(personalLines, linkedinLinks);

  const sections: Section[] = [];
  for (let h = 0; h < headingIndices.length; h++) {
    const start = headingIndices[h] + 1;
    const end = h + 1 < headingIndices.length ? headingIndices[h + 1] : allLines.length;
    const bodyLines = allLines.slice(start, end);
    const { type, title } = headingInfo.get(headingIndices[h])!;

    const { entries, text } = buildEntriesFromLines(bodyLines, type);
    sections.push({ id: newSectionId(), type, title, order: h, text, entries });
  }

  if (sections.length === 0) {
    warnings.push("Couldn't confidently detect section headings — everything was placed in a single Experience section for you to reorganize.");
    const { entries } = buildEntriesFromLines(allLines.slice(personalLines.length), "EXPERIENCE");
    sections.push({ id: newSectionId(), type: "EXPERIENCE", title: "Experience", order: 0, entries });
  }

  return { resume: { personalInfo, sections }, warnings };
}
