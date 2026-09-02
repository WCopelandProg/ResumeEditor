"use client";

import { useMemo, useState } from "react";
import { Loader2, Sparkles, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScoreDashboard } from "./ScoreDashboard";
import { SuggestionCard } from "./SuggestionCard";
import { AtsHealthPanel } from "./AtsHealthPanel";
import { JobMatchPanel } from "./JobMatchPanel";
import { api, type AnalysisResultDto, type SuggestionDto } from "@/lib/api/client";
import { SEVERITY_LABELS } from "@/lib/ai/labels";

interface Props {
  resumeId: string;
  initialAnalysis: AnalysisResultDto | null;
  initialSuggestions: SuggestionDto[];
}

const SEVERITY_ORDER = ["HIGH", "MEDIUM", "LOW"] as const;

export function CoachSidebar({ resumeId, initialAnalysis, initialSuggestions }: Props) {
  const [analysis, setAnalysis] = useState(initialAnalysis);
  const [previousScore, setPreviousScore] = useState<number | null>(null);
  const [suggestions, setSuggestions] = useState(initialSuggestions.filter((s) => s.status === "PENDING"));
  const [analyzing, setAnalyzing] = useState(false);
  const [acceptingAll, setAcceptingAll] = useState(false);

  const grouped = useMemo(() => {
    const map: Record<string, SuggestionDto[]> = { HIGH: [], MEDIUM: [], LOW: [] };
    for (const s of suggestions) map[s.severity]?.push(s);
    return map;
  }, [suggestions]);

  async function runAnalysis() {
    setAnalyzing(true);
    try {
      const result = await api.analyzeResume(resumeId);
      setPreviousScore(analysis?.overallScore ?? null);
      setAnalysis(result.analysis);
      setSuggestions(result.suggestions);
      toast.success("Analysis complete.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Analysis failed. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  }

  async function acceptAllLowRisk() {
    setAcceptingAll(true);
    try {
      const result = await api.acceptLowRiskSuggestions(resumeId);
      setSuggestions((prev) => prev.filter((s) => s.severity === "HIGH"));
      toast.success(`Accepted ${result.acceptedCount} low-risk suggestion${result.acceptedCount === 1 ? "" : "s"}.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't accept suggestions.");
    } finally {
      setAcceptingAll(false);
    }
  }

  function resolveSuggestion(id: string) {
    setSuggestions((prev) => prev.filter((s) => s.id !== id));
  }

  const hasLowRisk = suggestions.some((s) => s.severity !== "HIGH" && s.suggestedText);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border p-4">
        <div className="flex items-center gap-1.5 font-medium">
          <Sparkles className="h-4 w-4 text-primary" /> AI Resume Coach
        </div>
        <Button size="sm" onClick={runAnalysis} disabled={analyzing}>
          {analyzing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
          {analysis ? "Re-analyze" : "Analyze"}
        </Button>
      </div>

      <Tabs defaultValue="suggestions" className="flex flex-1 flex-col overflow-hidden">
        <div className="border-b border-border px-4 pt-3">
          <TabsList className="w-full">
            <TabsTrigger value="suggestions" className="flex-1">
              Suggestions
            </TabsTrigger>
            <TabsTrigger value="ats" className="flex-1">
              ATS &amp; Health
            </TabsTrigger>
            <TabsTrigger value="jobmatch" className="flex-1">
              Job Match
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <TabsContent value="suggestions" className="mt-0 space-y-5">
            {!analysis ? (
              <EmptyAnalysisState onAnalyze={runAnalysis} analyzing={analyzing} />
            ) : (
              <>
                <ScoreDashboard analysis={analysis} previousScore={previousScore} />

                {hasLowRisk ? (
                  <Button variant="outline" size="sm" className="w-full" onClick={acceptAllLowRisk} disabled={acceptingAll}>
                    {acceptingAll ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                    Accept all low-risk suggestions
                  </Button>
                ) : null}

                {suggestions.length === 0 ? (
                  <p className="rounded-md bg-secondary/50 p-3 text-center text-sm text-muted-foreground">
                    No open suggestions. Nice work — re-analyze after making changes.
                  </p>
                ) : (
                  SEVERITY_ORDER.map((sev) =>
                    grouped[sev].length > 0 ? (
                      <div key={sev}>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          {SEVERITY_LABELS[sev]} ({grouped[sev].length})
                        </p>
                        <div className="space-y-2">
                          {grouped[sev].map((s) => (
                            <SuggestionCard key={s.id} resumeId={resumeId} suggestion={s} onResolved={resolveSuggestion} />
                          ))}
                        </div>
                      </div>
                    ) : null
                  )
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="ats" className="mt-0">
            {analysis ? <AtsHealthPanel analysis={analysis} /> : <EmptyAnalysisState onAnalyze={runAnalysis} analyzing={analyzing} />}
          </TabsContent>

          <TabsContent value="jobmatch" className="mt-0">
            <JobMatchPanel
              resumeId={resumeId}
              onNewSuggestions={(newSuggestions) => {
                // The job-match run replaces the server's pending queue with
                // relevance/skills-focused suggestions; mirror that locally.
                setSuggestions(newSuggestions.filter((s) => s.status === "PENDING"));
              }}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

function EmptyAnalysisState({ onAnalyze, analyzing }: { onAnalyze: () => void; analyzing: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-10 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-accent text-accent-foreground">
        <Sparkles className="h-5 w-5" />
      </span>
      <p className="mt-3 max-w-56 text-sm text-muted-foreground">
        Run an analysis to get specific, grounded feedback on your resume.
      </p>
      <Button size="sm" className="mt-4" onClick={onAnalyze} disabled={analyzing}>
        {analyzing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
        Analyze my resume
      </Button>
    </div>
  );
}
