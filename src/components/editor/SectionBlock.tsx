"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { Plus, Trash2 } from "lucide-react";
import { EditableInput, EditableTextarea } from "./EditableField";
import { EntryBlock } from "./EntryBlock";
import { SortableList } from "./SortableList";
import { Button } from "@/components/ui/button";
import { useResumeEditorStore } from "@/lib/editor/store";
import { cn } from "@/lib/utils";
import type { Section } from "@/lib/resume/types";
import type { TemplateSkin } from "@/lib/pdf/templateSkins";

interface Props {
  resumeId: string;
  section: Section;
  dragHandle: ReactNode;
  onRemove: () => void;
  accentColor: string;
  skin: TemplateSkin;
}

export function SectionBlock({ resumeId, section, dragHandle, onRemove, accentColor, skin }: Props) {
  const renameSection = useResumeEditorStore((s) => s.renameSection);
  const setSectionText = useResumeEditorStore((s) => s.setSectionText);
  const addEntry = useResumeEditorStore((s) => s.addEntry);
  const removeEntry = useResumeEditorStore((s) => s.removeEntry);
  const reorderEntries = useResumeEditorStore((s) => s.reorderEntries);
  const isSelected = useResumeEditorStore((s) => s.selection?.sectionId === section.id && !s.selection.entryId);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isSelected) ref.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [isSelected]);

  const isTextSection = section.type === "SUMMARY";
  const headingColor = skin.headingColor === "ink" ? "#3f3f46" : accentColor;

  return (
    <section ref={ref} className={cn("group/section rounded-lg p-2", isSelected && "bg-accent/60 ring-1 ring-primary/30")}>
      <div
        className={cn(
          "flex items-center gap-2 pb-1",
          skin.headingStyle === "underline" && "border-b",
          skin.headingStyle === "bar" && "border-l-[3px] pl-2"
        )}
        style={{
          borderColor: skin.headingStyle === "underline" ? `${headingColor}40` : headingColor,
        }}
      >
        <EditableInput
          value={section.title}
          onChange={(v) => renameSection(section.id, v)}
          className={cn(
            "flex-1 text-sm font-bold",
            skin.headingCase === "upper" ? "uppercase" : "capitalize",
            skin.serifHeadings && "font-serif"
          )}
          style={{ color: headingColor, letterSpacing: skin.headingLetterSpacing }}
        />
        <div className="flex items-center opacity-0 transition-opacity group-hover/section:opacity-100">
          <button
            type="button"
            onClick={onRemove}
            aria-label="Remove section"
            className="rounded p-1 text-muted-foreground/50 hover:bg-secondary hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          {dragHandle}
        </div>
      </div>

      <div className="mt-2">
        {isTextSection ? (
          <EditableTextarea
            value={section.text ?? ""}
            onChange={(v) => setSectionText(section.id, v)}
            placeholder="A 1-3 sentence summary of your experience and goals…"
            className="text-sm"
          />
        ) : (
          <>
            <SortableList
              items={section.entries}
              onReorder={(ids) => reorderEntries(section.id, ids)}
              className="space-y-2"
              renderItem={(entry, handle) => (
                <EntryBlock
                  resumeId={resumeId}
                  sectionId={section.id}
                  sectionType={section.type}
                  entry={entry}
                  dragHandle={handle}
                  onRemove={() => removeEntry(section.id, entry.id)}
                />
              )}
            />
            <Button variant="ghost" size="sm" className="mt-1 h-7 text-xs text-muted-foreground" onClick={() => addEntry(section.id)}>
              <Plus className="h-3.5 w-3.5" /> Add {section.type === "SKILLS" ? "category" : "entry"}
            </Button>
          </>
        )}
      </div>
    </section>
  );
}
