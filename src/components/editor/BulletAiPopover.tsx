"use client";

import { useState } from "react";
import { Sparkles, Loader2, HelpCircle, Check, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api/client";
import { REWRITE_ACTIONS, REWRITE_ACTION_LABELS, type RewriteAction } from "@/lib/ai/schema";
import { useResumeEditorStore } from "@/lib/editor/store";
import { toast } from "sonner";

interface Alternative {
  text: string;
  rationale: string;
}

type ViewState =
  | { mode: "menu" }
  | { mode: "loading" }
  | { mode: "result"; alternatives: Alternative[]; clarifyingQuestion: string | null }
  | { mode: "questions"; questions: string[] };

export function BulletAiPopover({ resumeId, bulletId }: { resumeId: string; bulletId: string }) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<ViewState>({ mode: "menu" });
  const [answer, setAnswer] = useState("");
  const [answers, setAnswers] = useState<string[]>([]);
  const updateBulletText = useResumeEditorStore((s) => s.updateBulletText);

  function reset() {
    setView({ mode: "menu" });
    setAnswer("");
    setAnswers([]);
  }

  async function runAction(action: RewriteAction) {
    setView({ mode: "loading" });
    try {
      const result = await api.rewriteBullet(resumeId, bulletId, action);
      setView({ mode: "result", alternatives: result.alternatives, clarifyingQuestion: result.clarifyingQuestion });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't generate a rewrite.");
      setView({ mode: "menu" });
    }
  }

  async function askQuestions() {
    setView({ mode: "loading" });
    try {
      const result = await api.smartQuestions(resumeId, bulletId);
      setAnswers(new Array(result.questions.length).fill(""));
      setView({ mode: "questions", questions: result.questions });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't generate questions.");
      setView({ mode: "menu" });
    }
  }

  async function submitAnswers(questions: string[]) {
    setView({ mode: "loading" });
    try {
      const result = await api.applyAnswers(resumeId, bulletId, questions, answers);
      setView({ mode: "result", alternatives: result.alternatives, clarifyingQuestion: result.clarifyingQuestion });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't apply your answers.");
      setView({ mode: "menu" });
    }
  }

  async function submitClarification(question: string) {
    setView({ mode: "loading" });
    try {
      const result = await api.applyAnswers(resumeId, bulletId, [question], [answer]);
      setView({ mode: "result", alternatives: result.alternatives, clarifyingQuestion: result.clarifyingQuestion });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't apply your answer.");
    }
  }

  function applyAlternative(text: string) {
    updateBulletText(bulletId, text);
    setOpen(false);
    reset();
    toast.success("Bullet updated.");
  }

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <PopoverTrigger asChild>
        <Button size="iconSm" variant="ghost" className="text-muted-foreground" aria-label="AI rewrite actions">
          <Sparkles className="h-3.5 w-3.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        {view.mode === "menu" && (
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">Improve this bullet with AI</p>
            <div className="grid grid-cols-2 gap-1">
              {REWRITE_ACTIONS.map((action) => (
                <button
                  key={action}
                  onClick={() => runAction(action)}
                  className="rounded-md px-2 py-1.5 text-left text-xs hover:bg-secondary"
                >
                  {REWRITE_ACTION_LABELS[action]}
                </button>
              ))}
            </div>
            <div className="mt-2 border-t border-border pt-2">
              <button
                onClick={askQuestions}
                className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-xs font-medium text-primary hover:bg-secondary"
              >
                <HelpCircle className="h-3.5 w-3.5" /> Ask me questions to strengthen this
              </button>
            </div>
          </div>
        )}

        {view.mode === "loading" && (
          <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Thinking…
          </div>
        )}

        {view.mode === "questions" && (
          <div className="space-y-3">
            <button onClick={reset} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-3 w-3" /> Back
            </button>
            {view.questions.map((q, i) => (
              <div key={i} className="space-y-1">
                <label className="text-xs font-medium">{q}</label>
                <Textarea
                  rows={1}
                  className="min-h-8 text-sm"
                  value={answers[i] ?? ""}
                  onChange={(e) => setAnswers((prev) => prev.map((a, idx) => (idx === i ? e.target.value : a)))}
                />
              </div>
            ))}
            <Button size="sm" className="w-full" onClick={() => submitAnswers(view.questions)}>
              Generate improved bullet
            </Button>
          </div>
        )}

        {view.mode === "result" && (
          <div className="space-y-3">
            <button onClick={reset} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-3 w-3" /> Back
            </button>
            {view.alternatives.map((alt, i) => (
              <div key={i} className="rounded-md border border-border p-2.5">
                <p className="text-sm">{alt.text}</p>
                <p className="mt-1 text-xs text-muted-foreground">{alt.rationale}</p>
                <Button size="sm" variant="outline" className="mt-2 h-7 text-xs" onClick={() => applyAlternative(alt.text)}>
                  <Check className="h-3 w-3" /> Use this
                </Button>
              </div>
            ))}
            {view.clarifyingQuestion ? (
              <div className="rounded-md bg-accent p-2.5 text-accent-foreground">
                <p className="text-xs font-medium">{view.clarifyingQuestion}</p>
                <Textarea
                  rows={1}
                  className="mt-1.5 min-h-8 bg-card text-sm"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Your answer…"
                />
                <Button
                  size="sm"
                  className="mt-1.5 h-7 text-xs"
                  disabled={!answer.trim()}
                  onClick={() => submitClarification(view.clarifyingQuestion!)}
                >
                  Regenerate with this detail
                </Button>
              </div>
            ) : null}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
