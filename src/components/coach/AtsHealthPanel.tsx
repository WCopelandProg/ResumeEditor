"use client";

import { Check, X, AlertTriangle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { scoreColorClass } from "@/lib/format";
import type { AnalysisResultDto } from "@/lib/api/client";

export function AtsHealthPanel({ analysis }: { analysis: AnalysisResultDto }) {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">ATS Readiness</p>
          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${scoreColorClass(analysis.atsScore)}`}>
            {analysis.atsScore}/100
          </span>
        </div>
        <Progress value={analysis.atsScore} className="mt-2 h-1.5" />
        <div className="mt-3 space-y-2">
          {analysis.atsIssues.map((issue, i) => (
            <div key={i} className="flex items-start gap-2 rounded-md border border-border p-2.5 text-sm">
              <AlertTriangle
                className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${issue.severity === "HIGH" ? "text-destructive" : issue.severity === "MEDIUM" ? "text-warning" : "text-muted-foreground"}`}
              />
              <div>
                <p className="font-medium">{issue.issue}</p>
                <p className="text-xs text-muted-foreground">{issue.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm font-medium">Resume Health Checklist</p>
        <div className="mt-2 space-y-1.5">
          {analysis.healthChecklist.map((item, i) => (
            <div key={i} className="flex items-start gap-2 text-sm">
              {item.passed ? (
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
              ) : (
                <X className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
              )}
              <div>
                <span className={item.passed ? "" : "font-medium"}>{item.label}</span>
                {item.detail ? <p className="text-xs text-muted-foreground">{item.detail}</p> : null}
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        <Badge variant="outline" className="mr-1.5">Note</Badge>
        This is an internal readability estimate based on structure and formatting — not a real employer ATS system.
      </p>
    </div>
  );
}
