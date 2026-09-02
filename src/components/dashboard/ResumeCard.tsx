"use client";

import { useState } from "react";
import Link from "next/link";
import { MoreHorizontal, Pencil, Copy, Trash2, Download, FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { relativeTime, scoreColorClass } from "@/lib/format";
import { api, type ResumeSummary } from "@/lib/api/client";
import { RESUME_TEMPLATES } from "@/lib/resume/types";

interface Props {
  resume: ResumeSummary;
  onDuplicated: (resume: ResumeSummary) => void;
  onRenamed: (id: string, name: string) => void;
  onDeleted: (id: string) => void;
}

export function ResumeCard({ resume, onDuplicated, onRenamed, onDeleted }: Props) {
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [name, setName] = useState(resume.name);
  const [busy, setBusy] = useState(false);

  const template = RESUME_TEMPLATES.find((t) => t.id === resume.templateId);

  async function handleDuplicate() {
    setBusy(true);
    try {
      const { resume: dup } = await api.duplicateResume(resume.id);
      onDuplicated({
        id: dup.id,
        name: dup.name,
        targetRole: dup.targetRole,
        templateId: dup.templateId,
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        overallScore: null,
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleRename() {
    await api.updateResume(resume.id, { name });
    onRenamed(resume.id, name);
    setRenameOpen(false);
  }

  return (
    <>
      <Card className="group flex flex-col overflow-hidden transition-shadow hover:shadow-md">
        <Link href={`/resume/${resume.id}`} className="flex-1 p-5">
          <div className="mb-3 flex items-start justify-between">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
              <FileText className="h-4.5 w-4.5" />
            </span>
            {resume.overallScore !== null ? (
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${scoreColorClass(resume.overallScore)}`}>
                {resume.overallScore}
              </span>
            ) : null}
          </div>
          <h3 className="line-clamp-1 font-medium">{resume.name}</h3>
          {resume.targetRole ? <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">{resume.targetRole}</p> : null}
          <div className="mt-4 flex items-center gap-2">
            <Badge variant="secondary">{template?.name ?? resume.templateId}</Badge>
            <span className="text-xs text-muted-foreground">Edited {relativeTime(resume.updatedAt)}</span>
          </div>
        </Link>

        <div className="flex items-center justify-between border-t border-border px-5 py-2.5">
          <Button asChild size="sm" variant="ghost">
            <Link href={`/resume/${resume.id}`}>Edit</Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="iconSm" variant="ghost" disabled={busy} aria-label="More actions">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setRenameOpen(true)}>
                <Pencil /> Rename
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDuplicate}>
                <Copy /> Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a href={api.exportUrl(resume.id)} download>
                  <Download /> Download PDF
                </a>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={() => setDeleteOpen(true)}>
                <Trash2 /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </Card>

      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename resume</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="rename">Name</Label>
            <Input id="rename" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRename} disabled={!name.trim()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete this resume?"
        description={`"${resume.name}" and all of its versions, suggestions, and analysis history will be permanently deleted. This can't be undone.`}
        confirmLabel="Delete"
        destructive
        onConfirm={async () => {
          await api.deleteResume(resume.id);
          onDeleted(resume.id);
        }}
      />
    </>
  );
}
