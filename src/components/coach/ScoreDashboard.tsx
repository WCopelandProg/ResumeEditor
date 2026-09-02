"use client";

import { Progress } from "@/components/ui/progress";
import { CATEGORY_SCORE_LABELS } from "@/lib/ai/labels";
import { scoreColorClass } from "@/lib/format";
import type { AnalysisResultDto } from "@/lib/api/client";

export function ScoreDashboard({ analysis, previousScore }: { analysis: AnalysisResultDto; previousScore?: number | null }) {
  const entries = Object.entries(analysis.categoryScores).filter(([key]) => key in CATEGORY_SCORE_LABELS);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground">Overall Score</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-semibold tracking-tight">{analysis.overallScore}</span>
            <span className="text-sm text-muted-foreground">/ 100</span>
            {previousScore != null && previousScore !== analysis.overallScore ? (
              <span className="text-xs font-medium text-success">
                {previousScore} → {analysis.overallScore}
              </span>
            ) : null}
          </div>
        </div>
        <span className={`flex h-14 w-14 items-center justify-center rounded-full text-sm font-semibold ${scoreColorClass(analysis.overallScore)}`}>
          {analysis.overallScore >= 80 ? "Strong" : analysis.overallScore >= 60 ? "Fair" : "Needs work"}
        </span>
      </div>

      <div className="mt-4 space-y-2.5">
        {entries.map(([key, value]) => (
          <div key={key}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{CATEGORY_SCORE_LABELS[key]}</span>
              <span className="font-medium">{value}</span>
            </div>
            <Progress value={value} className="h-1.5" />
          </div>
        ))}
      </div>
    </div>
  );
}
