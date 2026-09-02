"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { Plus, Trash2 } from "lucide-react";
import { EditableInput } from "./EditableField";
import { BulletRow } from "./BulletRow";
import { SortableList } from "./SortableList";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useResumeEditorStore } from "@/lib/editor/store";
import { cn } from "@/lib/utils";
import type { Entry, SectionType } from "@/lib/resume/types";

interface Props {
  resumeId: string;
  sectionId: string;
  sectionType: SectionType;
  entry: Entry;
  dragHandle: ReactNode;
  onRemove: () => void;
}

export function EntryBlock({ resumeId, sectionId, sectionType, entry, dragHandle, onRemove }: Props) {
  const updateEntry = useResumeEditorStore((s) => s.updateEntry);
  const addBullet = useResumeEditorStore((s) => s.addBullet);
  const removeBullet = useResumeEditorStore((s) => s.removeBullet);
  const reorderBullets = useResumeEditorStore((s) => s.reorderBullets);
  const isSelected = useResumeEditorStore(
    (s) => s.selection?.entryId === entry.id && !s.selection.bulletId
  );
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isSelected) ref.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [isSelected]);

  const patch = (p: Partial<Entry>) => updateEntry(sectionId, entry.id, p);
  const isSkills = sectionType === "SKILLS";

  if (isSkills) {
    return (
      <div ref={ref} className={cn("group/entry flex items-center gap-1 rounded-md", isSelected && "bg-accent ring-1 ring-primary/40")}>
        <EditableInput value={entry.title ?? ""} onChange={(v) => patch({ title: v })} placeholder="Category" className="w-32 shrink-0 font-medium" />
        <EditableInput value={entry.description ?? ""} onChange={(v) => patch({ description: v })} placeholder="Python, SQL, React…" className="flex-1" />
        <div className="flex items-center opacity-0 transition-opacity group-hover/entry:opacity-100">
          <button type="button" onClick={onRemove} aria-label="Remove" className="rounded p-1 text-muted-foreground/50 hover:bg-secondary hover:text-destructive">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
          {dragHandle}
        </div>
      </div>
    );
  }

  return (
    <div ref={ref} className={cn("group/entry rounded-md p-1.5", isSelected && "bg-accent ring-1 ring-primary/40")}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="flex flex-wrap items-baseline gap-x-1.5">
            <EditableInput value={entry.title ?? ""} onChange={(v) => patch({ title: v })} placeholder="Title / Role" className="w-auto min-w-32 flex-1 font-semibold" />
            <EditableInput value={entry.organization ?? ""} onChange={(v) => patch({ organization: v })} placeholder="Organization" className="w-auto min-w-32 flex-1 text-muted-foreground" />
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <EditableInput value={entry.location ?? ""} onChange={(v) => patch({ location: v })} placeholder="Location" className="w-32" />
            <EditableInput value={entry.startDate ?? ""} onChange={(v) => patch({ startDate: v })} placeholder="Start date" className="w-24" />
            <span>–</span>
            <EditableInput
              value={entry.isCurrent ? "" : entry.endDate ?? ""}
              onChange={(v) => patch({ endDate: v })}
              placeholder={entry.isCurrent ? "Present" : "End date"}
              disabled={entry.isCurrent}
              className="w-24 disabled:opacity-60"
            />
            <label className="flex items-center gap-1.5">
              <Checkbox checked={!!entry.isCurrent} onCheckedChange={(c) => patch({ isCurrent: c === true })} />
              Current
            </label>
          </div>
        </div>
        <div className="flex items-center opacity-0 transition-opacity group-hover/entry:opacity-100">
          <button type="button" onClick={onRemove} aria-label="Remove entry" className="rounded p-1 text-muted-foreground/50 hover:bg-secondary hover:text-destructive">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
          {dragHandle}
        </div>
      </div>

      {(sectionType === "PROJECTS" || entry.description) ? (
        <EditableInput
          value={entry.description ?? ""}
          onChange={(v) => patch({ description: v })}
          placeholder="One-line description (optional)"
          className="mt-1 text-sm text-muted-foreground"
        />
      ) : null}

      <div className="mt-1.5">
        <SortableList
          items={entry.bullets}
          onReorder={(ids) => reorderBullets(sectionId, entry.id, ids)}
          renderItem={(bullet, handle) => (
            <BulletRow
              resumeId={resumeId}
              sectionId={sectionId}
              entryId={entry.id}
              bullet={bullet}
              dragHandle={handle}
              onRemove={() => removeBullet(sectionId, entry.id, bullet.id)}
            />
          )}
        />
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="mt-1 h-7 text-xs text-muted-foreground"
        onClick={() => addBullet(sectionId, entry.id)}
      >
        <Plus className="h-3.5 w-3.5" /> Add bullet
      </Button>
    </div>
  );
}
