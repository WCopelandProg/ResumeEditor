"use client";

import { useEffect, useState } from "react";
import { Loader2, Save, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { api, type VersionDto } from "@/lib/api/client";
import { useResumeEditorStore } from "@/lib/editor/store";
import { relativeTime } from "@/lib/format";

export function VersionHistoryDialog({
  resumeId,
  open,
  onOpenChange,
}: {
  resumeId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [versions, setVersions] = useState<VersionDto[] | null>(null);
  const [label, setLabel] = useState("");
  const [saving, setSaving] = useState(false);
  const [restoreTarget, setRestoreTarget] = useState<VersionDto | null>(null);
  const replaceContent = useResumeEditorStore((s) => s.replaceContent);
  const setStyle = useResumeEditorStore((s) => s.setStyle);

  useEffect(() => {
    if (!open) return;
    api.listVersions(resumeId).then((r) => setVersions(r.versions));
  }, [open, resumeId]);

  async function saveVersion() {
    if (!label.trim()) return;
    setSaving(true);
    try {
      const { version } = await api.createVersion(resumeId, label.trim());
      setVersions((prev) => (prev ? [version, ...prev] : [version]));
      setLabel("");
      toast.success("Version saved.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save this version.");
    } finally {
      setSaving(false);
    }
  }

  async function restore(version: VersionDto) {
    const { resume } = await api.restoreVersion(resumeId, version.id);
    replaceContent(resume.content);
    setStyle(resume.style);
    toast.success(`Restored "${version.label}".`);
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Version history</DialogTitle>
            <DialogDescription>
              Save a named snapshot (e.g. &quot;Data Analyst Resume&quot;, &quot;Amazon Application&quot;) and restore it anytime.
            </DialogDescription>
          </DialogHeader>

          <div className="flex gap-2">
            <Input placeholder="Version name…" value={label} onChange={(e) => setLabel(e.target.value)} />
            <Button onClick={saveVersion} disabled={!label.trim() || saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save
            </Button>
          </div>

          <div className="max-h-72 space-y-1.5 overflow-y-auto">
            {versions === null ? (
              <p className="py-4 text-center text-sm text-muted-foreground">Loading…</p>
            ) : versions.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">No saved versions yet.</p>
            ) : (
              versions.map((v) => (
                <div key={v.id} className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                  <div>
                    <p className="text-sm font-medium">{v.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {relativeTime(v.createdAt)} {v.isAutosave ? <Badge variant="secondary" className="ml-1">auto</Badge> : null}
                    </p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => setRestoreTarget(v)}>
                    <RotateCcw className="h-3.5 w-3.5" /> Restore
                  </Button>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!restoreTarget}
        onOpenChange={(o) => !o && setRestoreTarget(null)}
        title={`Restore "${restoreTarget?.label}"?`}
        description="Your current content and formatting will be replaced. A snapshot of what you have right now is saved automatically first, so you can always undo this."
        confirmLabel="Restore"
        onConfirm={async () => {
          if (restoreTarget) await restore(restoreTarget);
          setRestoreTarget(null);
        }}
      />
    </>
  );
}
