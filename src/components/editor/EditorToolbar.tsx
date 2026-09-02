"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Undo2, Redo2, Settings2, Download, History, Loader2, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useResumeEditorStore } from "@/lib/editor/store";
import { RESUME_TEMPLATES } from "@/lib/resume/types";
import { api } from "@/lib/api/client";
import { FormattingPanel } from "./FormattingPanel";
import { VersionHistoryDialog } from "./VersionHistoryDialog";

function SaveIndicator() {
  const status = useResumeEditorStore((s) => s.saveStatus);
  if (status === "saving") {
    return (
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" /> Saving…
      </span>
    );
  }
  if (status === "saved") {
    return (
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        <Check className="h-3 w-3 text-success" /> Saved
      </span>
    );
  }
  if (status === "error") {
    return (
      <span className="flex items-center gap-1 text-xs text-destructive">
        <AlertCircle className="h-3 w-3" /> Couldn&apos;t save
      </span>
    );
  }
  return null;
}

export function EditorToolbar({ resumeId }: { resumeId: string }) {
  const name = useResumeEditorStore((s) => s.name);
  const setName = useResumeEditorStore((s) => s.setName);
  const templateId = useResumeEditorStore((s) => s.style.templateId);
  const setTemplate = useResumeEditorStore((s) => s.setTemplate);
  const undo = useResumeEditorStore((s) => s.undo);
  const redo = useResumeEditorStore((s) => s.redo);
  const past = useResumeEditorStore((s) => s.past.length);
  const future = useResumeEditorStore((s) => s.future.length);

  const [formatOpen, setFormatOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  return (
    <div className="flex h-14 items-center gap-3 border-b border-border bg-card px-4">
      <Button asChild variant="ghost" size="icon" aria-label="Back to dashboard">
        <Link href="/dashboard">
          <ArrowLeft className="h-4 w-4" />
        </Link>
      </Button>

      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="h-8 w-52 border-transparent bg-transparent font-medium hover:border-border focus:border-ring"
        aria-label="Resume name"
      />

      <SaveIndicator />

      <div className="ml-auto flex items-center gap-1.5">
        <Button variant="ghost" size="icon" onClick={undo} disabled={past === 0} aria-label="Undo">
          <Undo2 className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={redo} disabled={future === 0} aria-label="Redo">
          <Redo2 className="h-4 w-4" />
        </Button>

        <Select value={templateId} onValueChange={setTemplate}>
          <SelectTrigger className="h-8 w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {RESUME_TEMPLATES.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button variant="outline" size="sm" onClick={() => setFormatOpen(true)}>
          <Settings2 className="h-4 w-4" /> Format
        </Button>
        <Button variant="outline" size="sm" onClick={() => setHistoryOpen(true)}>
          <History className="h-4 w-4" /> History
        </Button>
        <Button asChild size="sm">
          <a href={api.exportUrl(resumeId)} download>
            <Download className="h-4 w-4" /> Export PDF
          </a>
        </Button>
      </div>

      <FormattingPanel open={formatOpen} onOpenChange={setFormatOpen} />
      <VersionHistoryDialog resumeId={resumeId} open={historyOpen} onOpenChange={setHistoryOpen} />
    </div>
  );
}
