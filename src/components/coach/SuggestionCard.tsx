"use client";

import { useState } from "react";
import { Check, X, Pencil, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CATEGORY_LABELS, SEVERITY_BADGE_VARIANT, SEVERITY_LABELS } from "@/lib/ai/labels";
import { api, type SuggestionDto } from "@/lib/api/client";
import { useResumeEditorStore } from "@/lib/editor/store";
import { cn } from "@/lib/utils";

interface Props {
  resumeId: string;
  suggestion: SuggestionDto;
  onResolved: (id: string) => void;
}

export function SuggestionCard({ resumeId, suggestion, onResolved }: Props) {
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(suggestion.suggestedText ?? "");
  const [answer, setAnswer] = useState("");
  const select = useResumeEditorStore((s) => s.select);
  const updateBulletText = useResumeEditorStore((s) => s.updateBulletText);
  const isSelected = useResumeEditorStore(
    (s) =>
      (!!suggestion.bulletId && s.selection?.bulletId === suggestion.bulletId) ||
      (!suggestion.bulletId && !!suggestion.entryId && s.selection?.entryId === suggestion.entryId) ||
      (!suggestion.bulletId && !suggestion.entryId && !!suggestion.sectionId && s.selection?.sectionId === suggestion.sectionId)
  );

  function highlight() {
    select({
      sectionId: suggestion.sectionId ?? undefined,
      entryId: suggestion.entryId ?? undefined,
      bulletId: suggestion.bulletId ?? undefined,
    });
  }

  function applyLocally(finalText: string) {
    if (suggestion.bulletId) updateBulletText(suggestion.bulletId, finalText);
    // Entry/section-level text suggestions are less common; the server-side
    // apply already updated resume.content, and the next content refresh
    // (autosave round trip) will reconcile the local store for those cases.
  }

  async function act(action: "accept" | "reject" | "edit", finalText?: string) {
    setBusy(true);
    try {
      await api.actOnSuggestion(resumeId, suggestion.id, action, finalText);
      if (action !== "reject" && finalText) applyLocally(finalText);
      onResolved(suggestion.id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't update this suggestion.");
    } finally {
      setBusy(false);
    }
  }

  async function submitAnswerAsRewrite() {
    if (!suggestion.bulletId) return;
    setBusy(true);
    try {
      const result = await api.applyAnswers(resumeId, suggestion.bulletId, [suggestion.question ?? ""], [answer]);
      const text = result.alternatives[0]?.text;
      if (text) await act("edit", text);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't generate a rewrite.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      onClick={highlight}
      className={cn(
        "cursor-pointer rounded-lg border border-border p-3 transition-colors hover:border-ring/40",
        isSelected && "border-primary bg-accent/60"
      )}
    >
      <div className="flex items-center gap-1.5">
        <Badge variant={SEVERITY_BADGE_VARIANT[suggestion.severity]}>{SEVERITY_LABELS[suggestion.severity]}</Badge>
        <Badge variant="outline">{CATEGORY_LABELS[suggestion.category] ?? suggestion.category}</Badge>
      </div>

      <p className="mt-2 text-sm">{suggestion.explanation}</p>

      {suggestion.originalText ? (
        <p className="mt-1.5 rounded bg-secondary/60 px-2 py-1 text-xs text-muted-foreground line-through decoration-muted-foreground/50">
          {suggestion.originalText}
        </p>
      ) : null}

      {editing ? (
        <div className="mt-1.5 space-y-2" onClick={(e) => e.stopPropagation()}>
          <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={2} className="text-sm" />
          <div className="flex gap-1.5">
            <Button size="sm" className="h-7 text-xs" disabled={busy || !draft.trim()} onClick={() => act("edit", draft)}>
              {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />} Save & accept
            </Button>
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : suggestion.suggestedText ? (
        <>
          <p className="mt-1.5 rounded bg-success/10 px-2 py-1 text-xs text-success">{suggestion.suggestedText}</p>
          <div className="mt-2 flex gap-1.5" onClick={(e) => e.stopPropagation()}>
            <Button size="sm" className="h-7 text-xs" disabled={busy} onClick={() => act("accept", suggestion.suggestedText!)}>
              {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />} Accept
            </Button>
            <Button size="sm" variant="outline" className="h-7 text-xs" disabled={busy} onClick={() => setEditing(true)}>
              <Pencil className="h-3 w-3" /> Edit
            </Button>
            <Button size="sm" variant="ghost" className="h-7 text-xs" disabled={busy} onClick={() => act("reject")}>
              <X className="h-3 w-3" /> Dismiss
            </Button>
          </div>
        </>
      ) : suggestion.question ? (
        <div className="mt-1.5 space-y-1.5" onClick={(e) => e.stopPropagation()}>
          <p className="rounded bg-accent px-2 py-1 text-xs font-medium text-accent-foreground">{suggestion.question}</p>
          <Textarea value={answer} onChange={(e) => setAnswer(e.target.value)} rows={1} placeholder="Your answer…" className="min-h-8 text-sm" />
          <div className="flex gap-1.5">
            <Button size="sm" className="h-7 text-xs" disabled={busy || !answer.trim() || !suggestion.bulletId} onClick={submitAnswerAsRewrite}>
              {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : null} Generate rewrite
            </Button>
            <Button size="sm" variant="ghost" className="h-7 text-xs" disabled={busy} onClick={() => act("reject")}>
              Dismiss
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-2 flex gap-1.5" onClick={(e) => e.stopPropagation()}>
          <Button size="sm" className="h-7 text-xs" disabled={busy} onClick={() => act("accept")}>
            Acknowledge
          </Button>
          <Button size="sm" variant="ghost" className="h-7 text-xs" disabled={busy} onClick={() => act("reject")}>
            Dismiss
          </Button>
        </div>
      )}
    </div>
  );
}
