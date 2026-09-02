"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { EditableTextarea } from "./EditableField";
import { BulletAiPopover } from "./BulletAiPopover";
import { useResumeEditorStore } from "@/lib/editor/store";
import { cn } from "@/lib/utils";
import type { Bullet } from "@/lib/resume/types";

interface Props {
  resumeId: string;
  sectionId: string;
  entryId: string;
  bullet: Bullet;
  dragHandle: ReactNode;
  onRemove: () => void;
}

export function BulletRow({ resumeId, sectionId, entryId, bullet, dragHandle, onRemove }: Props) {
  const updateBulletText = useResumeEditorStore((s) => s.updateBulletText);
  const isSelected = useResumeEditorStore((s) => s.selection?.bulletId === bullet.id);
  const select = useResumeEditorStore((s) => s.select);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isSelected) ref.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [isSelected]);

  return (
    <div
      ref={ref}
      className={cn(
        "group/bullet flex items-start gap-1 rounded-md py-0.5 pl-0.5 transition-colors",
        isSelected && "bg-accent ring-1 ring-primary/40"
      )}
      onFocus={() => select({ sectionId, entryId, bulletId: bullet.id })}
    >
      <span className="mt-1.5 text-muted-foreground">{"•"}</span>
      <EditableTextarea
        value={bullet.text}
        onChange={(v) => updateBulletText(bullet.id, v)}
        placeholder="Describe an accomplishment…"
        className="flex-1 text-sm"
      />
      <div className="flex items-center opacity-0 transition-opacity group-hover/bullet:opacity-100 focus-within:opacity-100">
        <BulletAiPopover resumeId={resumeId} bulletId={bullet.id} />
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove bullet"
          className="rounded p-1 text-muted-foreground/50 hover:bg-secondary hover:text-destructive"
        >
          <X className="h-3.5 w-3.5" />
        </button>
        {dragHandle}
      </div>
    </div>
  );
}
