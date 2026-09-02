import type { StructuredResume } from "./types";

export interface SuggestionTarget {
  sectionId?: string | null;
  entryId?: string | null;
  bulletId?: string | null;
}

/**
 * Applies an accepted/edited suggestion's final text to the exact node it
 * targets. Returns a new StructuredResume (never mutates the input) so
 * callers can diff before/after for "impact" UI and so this composes
 * cleanly with the editor's undo/redo history.
 *
 * Suggestions with no bulletId/entryId/sectionId (resume-wide feedback like
 * "your resume runs long") have nothing to splice in — accepting one of
 * those is purely an acknowledgment and this function is a no-op on content.
 */
export function applySuggestionToResume(
  resume: StructuredResume,
  target: SuggestionTarget,
  finalText: string
): StructuredResume {
  if (target.bulletId) {
    return {
      ...resume,
      sections: resume.sections.map((section) => ({
        ...section,
        entries: section.entries.map((entry) => ({
          ...entry,
          bullets: entry.bullets.map((bullet) =>
            bullet.id === target.bulletId ? { ...bullet, text: finalText } : bullet
          ),
        })),
      })),
    };
  }

  if (target.entryId) {
    return {
      ...resume,
      sections: resume.sections.map((section) => ({
        ...section,
        entries: section.entries.map((entry) =>
          entry.id === target.entryId ? { ...entry, description: finalText } : entry
        ),
      })),
    };
  }

  if (target.sectionId) {
    return {
      ...resume,
      sections: resume.sections.map((section) =>
        section.id === target.sectionId ? { ...section, text: finalText } : section
      ),
    };
  }

  return resume;
}
