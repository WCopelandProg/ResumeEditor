import type { Bullet, Entry, ResumeStyle, Section, StructuredResume } from "./types";
import { newBulletId, newEntryId, newSectionId } from "./ids";

export function findSection(resume: StructuredResume, sectionId: string): Section | undefined {
  return resume.sections.find((s) => s.id === sectionId);
}

export function findEntry(resume: StructuredResume, entryId: string): { section: Section; entry: Entry } | undefined {
  for (const section of resume.sections) {
    const entry = section.entries.find((e) => e.id === entryId);
    if (entry) return { section, entry };
  }
  return undefined;
}

export function findBullet(
  resume: StructuredResume,
  bulletId: string
): { section: Section; entry: Entry; bullet: Bullet } | undefined {
  for (const section of resume.sections) {
    for (const entry of section.entries) {
      const bullet = entry.bullets.find((b) => b.id === bulletId);
      if (bullet) return { section, entry, bullet };
    }
  }
  return undefined;
}

export function newEmptySection(type: Section["type"], title: string, order: number): Section {
  return { id: newSectionId(), type, title, order, entries: [] };
}

export function newEmptyEntry(order: number): Entry {
  return { id: newEntryId(), order, bullets: [], links: [], meta: {} };
}

export function newEmptyBullet(order: number, text = ""): Bullet {
  return { id: newBulletId(), order, text };
}

/** Reindexes `.order` on an array of ordered nodes after a reorder/insert/delete. */
export function reindex<T extends { order: number }>(items: T[]): T[] {
  return items.map((item, i) => ({ ...item, order: i }));
}

/**
 * Serializes the structured resume into a compact, id-annotated text block
 * for AI prompts. Every addressable node's id is inlined so the model can
 * reference it directly in structured output instead of us doing fuzzy text
 * matching to figure out what a suggestion is "about".
 */
export function serializeResumeForPrompt(resume: StructuredResume): string {
  const lines: string[] = [];
  const p = resume.personalInfo;
  lines.push(`# ${p.fullName || "(no name provided)"}`);
  if (p.headline) lines.push(p.headline);
  const contact = [p.email, p.phone, p.location, p.linkedin, p.github, p.website].filter(Boolean);
  if (contact.length) lines.push(contact.join(" | "));
  lines.push("");

  for (const section of [...resume.sections].sort((a, b) => a.order - b.order)) {
    lines.push(`## [section:${section.id}] ${section.title} (type=${section.type})`);
    if (section.text) lines.push(section.text);
    for (const entry of [...section.entries].sort((a, b) => a.order - b.order)) {
      const header = [entry.title, entry.organization].filter(Boolean).join(" — ");
      const dates = [entry.startDate, entry.isCurrent ? "Present" : entry.endDate].filter(Boolean).join(" - ");
      lines.push(`### [entry:${entry.id}] ${header}${entry.location ? ` (${entry.location})` : ""} ${dates}`.trim());
      if (entry.description) lines.push(entry.description);
      for (const bullet of [...entry.bullets].sort((a, b) => a.order - b.order)) {
        lines.push(`- [bullet:${bullet.id}] ${bullet.text}`);
      }
    }
    lines.push("");
  }
  return lines.join("\n");
}

/**
 * Very rough character-budget based page-length estimate. This is not meant
 * to be pixel-accurate — it exists to power the "your resume is ~1.15 pages"
 * type feedback in the UI/AI coach without doing a full PDF layout pass on
 * every keystroke. The real page count at export time comes from the actual
 * PDF renderer.
 */
export function estimatePageLength(resume: StructuredResume, style: Pick<ResumeStyle, "fontSizePt" | "lineSpacing" | "sectionSpacingPt">): number {
  let charCount = 0;
  const p = resume.personalInfo;
  charCount += (p.fullName?.length ?? 0) + (p.headline?.length ?? 0) + 60;

  for (const section of resume.sections) {
    charCount += section.title.length + 20;
    charCount += section.text?.length ?? 0;
    for (const entry of section.entries) {
      charCount += (entry.title?.length ?? 0) + (entry.organization?.length ?? 0) + (entry.location?.length ?? 0) + 20;
      charCount += entry.description?.length ?? 0;
      for (const bullet of entry.bullets) {
        charCount += bullet.text.length + 4;
      }
    }
  }

  // Characters-per-page baseline for a standard 1-column US Letter resume at
  // 10pt/1.15 line spacing, scaled by font size and line spacing.
  const basePerPage = 3800;
  const fontScale = 10 / style.fontSizePt;
  const spacingScale = 1.15 / style.lineSpacing;
  const sectionOverhead = resume.sections.length * (style.sectionSpacingPt - 10) * 6;
  const effectivePerPage = basePerPage * fontScale * spacingScale;

  return Math.max(0.1, (charCount + Math.max(0, sectionOverhead)) / effectivePerPage);
}

/** Starting point for a brand-new (non-uploaded) resume: familiar section shells, no content to fabricate. */
export function starterStructuredResume(): StructuredResume {
  return {
    personalInfo: { fullName: "" },
    sections: [
      newEmptySection("SUMMARY", "Summary", 0),
      newEmptySection("EXPERIENCE", "Experience", 1),
      newEmptySection("EDUCATION", "Education", 2),
      newEmptySection("SKILLS", "Skills", 3),
    ],
  };
}

export function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}
