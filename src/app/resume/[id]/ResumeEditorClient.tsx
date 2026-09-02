"use client";

import { useEffect, useState } from "react";
import { FileText, Sparkles } from "lucide-react";
import { EditorToolbar } from "@/components/editor/EditorToolbar";
import { ResumeCanvas } from "@/components/editor/ResumeCanvas";
import { CoachSidebar } from "@/components/coach/CoachSidebar";
import { useResumeEditorStore } from "@/lib/editor/store";
import { useAutosave } from "@/lib/editor/useAutosave";
import { useKeyboardShortcuts } from "@/lib/editor/useKeyboardShortcuts";
import { cn } from "@/lib/utils";
import type { ResumeDetail, AnalysisResultDto, SuggestionDto } from "@/lib/api/client";

interface Props {
  resume: ResumeDetail;
  initialAnalysis: AnalysisResultDto | null;
  initialSuggestions: SuggestionDto[];
}

export function ResumeEditorClient({ resume, initialAnalysis, initialSuggestions }: Props) {
  const hydrate = useResumeEditorStore((s) => s.hydrate);
  const [mobileTab, setMobileTab] = useState<"resume" | "coach">("resume");

  useEffect(() => {
    hydrate({ id: resume.id, name: resume.name, targetRole: resume.targetRole, content: resume.content, style: resume.style });
    // Only re-hydrate if a different resume is loaded.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resume.id]);

  useAutosave(resume.id);
  useKeyboardShortcuts(resume.id);

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <EditorToolbar resumeId={resume.id} />

      <div className="flex items-center gap-1 border-b border-border bg-card px-2 py-1.5 md:hidden">
        <button
          onClick={() => setMobileTab("resume")}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-sm font-medium",
            mobileTab === "resume" ? "bg-secondary" : "text-muted-foreground"
          )}
        >
          <FileText className="h-4 w-4" /> Resume
        </button>
        <button
          onClick={() => setMobileTab("coach")}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-sm font-medium",
            mobileTab === "coach" ? "bg-secondary" : "text-muted-foreground"
          )}
        >
          <Sparkles className="h-4 w-4" /> AI Coach
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className={cn("flex-1 overflow-y-auto bg-secondary/30 px-4", mobileTab !== "resume" && "hidden md:block")}>
          <ResumeCanvas resumeId={resume.id} />
        </div>
        <aside
          className={cn(
            "w-full shrink-0 border-l border-border bg-card md:w-[380px]",
            mobileTab !== "coach" && "hidden md:block"
          )}
        >
          <CoachSidebar resumeId={resume.id} initialAnalysis={initialAnalysis} initialSuggestions={initialSuggestions} />
        </aside>
      </div>
    </div>
  );
}
