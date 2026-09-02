"use client";

import { create } from "zustand";
import type { Bullet, Entry, ResumeStyle, Section, SectionType, StructuredResume } from "@/lib/resume/types";
import { newEmptyBullet, newEmptyEntry, newEmptySection, reindex } from "@/lib/resume/helpers";
import { SECTION_TYPE_LABELS } from "@/lib/resume/types";

export interface Selection {
  sectionId?: string;
  entryId?: string;
  bulletId?: string;
}

interface HistoryEntry {
  content: StructuredResume;
}

export type SaveStatus = "idle" | "saving" | "saved" | "error";

interface ResumeEditorState {
  resumeId: string | null;
  name: string;
  targetRole: string;
  content: StructuredResume;
  style: ResumeStyle;
  selection: Selection | null;
  saveStatus: SaveStatus;

  past: HistoryEntry[];
  future: HistoryEntry[];

  hydrate: (data: { id: string; name: string; targetRole: string | null; content: StructuredResume; style: ResumeStyle }) => void;
  setSaveStatus: (status: SaveStatus) => void;
  setName: (name: string) => void;
  setTargetRole: (targetRole: string) => void;
  setStyle: (patch: Partial<ResumeStyle>) => void;
  setTemplate: (templateId: string) => void;

  select: (selection: Selection | null) => void;

  updatePersonalInfo: (patch: Partial<StructuredResume["personalInfo"]>) => void;

  addSection: (type: SectionType) => void;
  removeSection: (sectionId: string) => void;
  renameSection: (sectionId: string, title: string) => void;
  reorderSections: (orderedIds: string[]) => void;
  setSectionText: (sectionId: string, text: string) => void;

  addEntry: (sectionId: string) => void;
  removeEntry: (sectionId: string, entryId: string) => void;
  updateEntry: (sectionId: string, entryId: string, patch: Partial<Entry>) => void;
  reorderEntries: (sectionId: string, orderedIds: string[]) => void;

  addBullet: (sectionId: string, entryId: string, text?: string) => void;
  removeBullet: (sectionId: string, entryId: string, bulletId: string) => void;
  updateBulletText: (bulletId: string, text: string) => void;
  reorderBullets: (sectionId: string, entryId: string, orderedIds: string[]) => void;

  replaceContent: (content: StructuredResume) => void;

  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

const MAX_HISTORY = 60;

function withHistory(state: ResumeEditorState, nextContent: StructuredResume) {
  const past = [...state.past, { content: state.content }].slice(-MAX_HISTORY);
  return { content: nextContent, past, future: [] };
}

function mapSections(content: StructuredResume, sectionId: string, fn: (s: Section) => Section): StructuredResume {
  return { ...content, sections: content.sections.map((s) => (s.id === sectionId ? fn(s) : s)) };
}

function mapEntries(section: Section, entryId: string, fn: (e: Entry) => Entry): Section {
  return { ...section, entries: section.entries.map((e) => (e.id === entryId ? fn(e) : e)) };
}

export const useResumeEditorStore = create<ResumeEditorState>((set, get) => ({
  resumeId: null,
  name: "",
  targetRole: "",
  content: { personalInfo: { fullName: "" }, sections: [] },
  style: {
    templateId: "modern",
    fontFamily: "Inter",
    fontSizePt: 10,
    headingScale: 1.15,
    lineSpacing: 1.15,
    marginTopIn: 0.6,
    marginRightIn: 0.6,
    marginBottomIn: 0.6,
    marginLeftIn: 0.6,
    bulletSpacingPt: 2,
    sectionSpacingPt: 10,
    alignment: "left",
    accentColor: "#1d4ed8",
    showDividers: true,
    columns: 1,
  },
  selection: null,
  saveStatus: "idle",
  past: [],
  future: [],

  hydrate: (data) =>
    set({
      resumeId: data.id,
      name: data.name,
      targetRole: data.targetRole ?? "",
      content: data.content,
      style: data.style,
      past: [],
      future: [],
      saveStatus: "idle",
    }),

  setSaveStatus: (saveStatus) => set({ saveStatus }),
  setName: (name) => set({ name }),
  setTargetRole: (targetRole) => set({ targetRole }),
  setStyle: (patch) => set((s) => ({ style: { ...s.style, ...patch } })),
  setTemplate: (templateId) => set((s) => ({ style: { ...s.style, templateId } })),

  select: (selection) => set({ selection }),

  updatePersonalInfo: (patch) =>
    set((s) => withHistory(s, { ...s.content, personalInfo: { ...s.content.personalInfo, ...patch } })),

  addSection: (type) =>
    set((s) => {
      const order = s.content.sections.length;
      const section = newEmptySection(type, SECTION_TYPE_LABELS[type], order);
      return withHistory(s, { ...s.content, sections: [...s.content.sections, section] });
    }),

  removeSection: (sectionId) =>
    set((s) =>
      withHistory(s, {
        ...s.content,
        sections: reindex(s.content.sections.filter((sec) => sec.id !== sectionId)),
      })
    ),

  renameSection: (sectionId, title) =>
    set((s) => withHistory(s, mapSections(s.content, sectionId, (sec) => ({ ...sec, title })))),

  reorderSections: (orderedIds) =>
    set((s) => {
      const bySection = new Map(s.content.sections.map((sec) => [sec.id, sec]));
      const sections = reindex(orderedIds.map((id) => bySection.get(id)!).filter(Boolean));
      return withHistory(s, { ...s.content, sections });
    }),

  setSectionText: (sectionId, text) =>
    set((s) => withHistory(s, mapSections(s.content, sectionId, (sec) => ({ ...sec, text })))),

  addEntry: (sectionId) =>
    set((s) =>
      withHistory(
        s,
        mapSections(s.content, sectionId, (sec) => ({
          ...sec,
          entries: [...sec.entries, newEmptyEntry(sec.entries.length)],
        }))
      )
    ),

  removeEntry: (sectionId, entryId) =>
    set((s) =>
      withHistory(
        s,
        mapSections(s.content, sectionId, (sec) => ({
          ...sec,
          entries: reindex(sec.entries.filter((e) => e.id !== entryId)),
        }))
      )
    ),

  updateEntry: (sectionId, entryId, patch) =>
    set((s) =>
      withHistory(s, mapSections(s.content, sectionId, (sec) => mapEntries(sec, entryId, (e) => ({ ...e, ...patch }))))
    ),

  reorderEntries: (sectionId, orderedIds) =>
    set((s) =>
      withHistory(
        s,
        mapSections(s.content, sectionId, (sec) => {
          const byEntry = new Map(sec.entries.map((e) => [e.id, e]));
          return { ...sec, entries: reindex(orderedIds.map((id) => byEntry.get(id)!).filter(Boolean)) };
        })
      )
    ),

  addBullet: (sectionId, entryId, text = "") =>
    set((s) =>
      withHistory(
        s,
        mapSections(s.content, sectionId, (sec) =>
          mapEntries(sec, entryId, (e) => ({ ...e, bullets: [...e.bullets, newEmptyBullet(e.bullets.length, text)] }))
        )
      )
    ),

  removeBullet: (sectionId, entryId, bulletId) =>
    set((s) =>
      withHistory(
        s,
        mapSections(s.content, sectionId, (sec) =>
          mapEntries(sec, entryId, (e) => ({ ...e, bullets: reindex(e.bullets.filter((b) => b.id !== bulletId)) }))
        )
      )
    ),

  updateBulletText: (bulletId, text) =>
    set((s) =>
      withHistory(s, {
        ...s.content,
        sections: s.content.sections.map((sec) => ({
          ...sec,
          entries: sec.entries.map((e) => ({
            ...e,
            bullets: e.bullets.map((b) => (b.id === bulletId ? { ...b, text } : b)),
          })),
        })),
      })
    ),

  reorderBullets: (sectionId, entryId, orderedIds) =>
    set((s) =>
      withHistory(
        s,
        mapSections(s.content, sectionId, (sec) =>
          mapEntries(sec, entryId, (e) => {
            const byBullet = new Map<string, Bullet>(e.bullets.map((b) => [b.id, b]));
            return { ...e, bullets: reindex(orderedIds.map((id) => byBullet.get(id)!).filter(Boolean)) };
          })
        )
      )
    ),

  replaceContent: (content) => set((s) => withHistory(s, content)),

  undo: () =>
    set((s) => {
      if (s.past.length === 0) return s;
      const previous = s.past[s.past.length - 1];
      return {
        content: previous.content,
        past: s.past.slice(0, -1),
        future: [{ content: s.content }, ...s.future].slice(0, MAX_HISTORY),
      };
    }),

  redo: () =>
    set((s) => {
      if (s.future.length === 0) return s;
      const [next, ...rest] = s.future;
      return { content: next.content, past: [...s.past, { content: s.content }].slice(-MAX_HISTORY), future: rest };
    }),

  canUndo: () => get().past.length > 0,
  canRedo: () => get().future.length > 0,
}));
