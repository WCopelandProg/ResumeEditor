"use client";

import { useState } from "react";
import { Loader2, Target } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { api, type JobMatchDto, type SuggestionDto } from "@/lib/api/client";
import { useResumeEditorStore } from "@/lib/editor/store";

export function JobMatchPanel({
  resumeId,
  onNewSuggestions,
}: {
  resumeId: string;
  onNewSuggestions: (suggestions: SuggestionDto[]) => void;
}) {
  const [jobText, setJobText] = useState("");
  const [loading, setLoading] = useState(false);
  const [match, setMatch] = useState<JobMatchDto | null>(null);
  const select = useResumeEditorStore((s) => s.select);

  async function runMatch() {
    setLoading(true);
    try {
      const result = await api.jobMatch(resumeId, jobText);
      setMatch(result.match);
      onNewSuggestions(result.suggestions);
      toast.success("Job match analysis ready.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't analyze this job description.");
    } finally {
      setLoading(false);
    }
  }

  if (!match) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Paste a job description to see missing keywords, what to emphasize, and an internal match estimate.
        </p>
        <Textarea
          value={jobText}
          onChange={(e) => setJobText(e.target.value)}
          rows={10}
          placeholder="Paste the full job description here…"
          className="text-sm"
        />
        <Button className="w-full" onClick={runMatch} disabled={loading || jobText.trim().length < 30}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Target className="h-4 w-4" />}
          Analyze match
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground">Match Estimate</p>
          <span className="text-3xl font-semibold tracking-tight">{match.matchScore}</span>
          <span className="text-sm text-muted-foreground">/100</span>
        </div>
        <Badge variant="outline">Internal estimate, not a real ATS score</Badge>
      </div>
      <Progress value={match.matchScore} className="h-1.5" />

      {match.explanationFactors.length > 0 ? (
        <ul className="list-inside list-disc space-y-1 text-xs text-muted-foreground">
          {match.explanationFactors.map((f, i) => (
            <li key={i}>{f}</li>
          ))}
        </ul>
      ) : null}

      {match.missingKeywords.length > 0 ? (
        <div>
          <p className="text-sm font-medium">Missing keywords</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {match.missingKeywords.map((k) => (
              <Badge key={k} variant="destructive">
                {k}
              </Badge>
            ))}
          </div>
        </div>
      ) : null}

      {match.matchedKeywords.length > 0 ? (
        <div>
          <p className="text-sm font-medium">Already covered</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {match.matchedKeywords.map((k) => (
              <Badge key={k} variant="success">
                {k}
              </Badge>
            ))}
          </div>
        </div>
      ) : null}

      {match.emphasize.length > 0 ? (
        <div>
          <p className="text-sm font-medium">Emphasize more</p>
          <div className="mt-1.5 space-y-1.5">
            {match.emphasize.map((e, i) => (
              <button
                key={i}
                onClick={() => select({ sectionId: e.sectionId ?? undefined, entryId: e.entryId ?? undefined })}
                className="block w-full rounded-md border border-border p-2 text-left text-xs hover:border-ring/40"
              >
                <p className="font-medium">{e.point}</p>
                <p className="text-muted-foreground">{e.reason}</p>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {match.buriedQualifications.length > 0 ? (
        <div>
          <p className="text-sm font-medium">Buried qualifications</p>
          <ul className="mt-1.5 list-inside list-disc space-y-1 text-xs text-muted-foreground">
            {match.buriedQualifications.map((q, i) => (
              <li key={i}>{q}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <Button variant="outline" size="sm" className="w-full" onClick={() => setMatch(null)}>
        Try another job description
      </Button>
    </div>
  );
}
