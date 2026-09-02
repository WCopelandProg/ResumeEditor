import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withErrorHandling } from "@/lib/api/errors";
import { requireUserId, requireOwnedResume } from "@/lib/api/auth";
import { contentFromDb } from "@/lib/resume/dbMapping";
import { analyzeResume } from "@/lib/ai/coach";

type Params = { params: Promise<{ id: string }> };

export const POST = withErrorHandling(async (_req: Request, { params }: Params) => {
  const userId = await requireUserId();
  const { id } = await params;
  const resume = await requireOwnedResume(id, userId);

  const content = contentFromDb(resume.content);
  const analysis = await analyzeResume(content);

  // Stale pending suggestions from a previous analysis are superseded by
  // this run; accepted/rejected/edited ones stay as history.
  await prisma.suggestion.deleteMany({ where: { resumeId: id, status: "PENDING" } });

  const [, createdSuggestions, analysisResult] = await prisma.$transaction([
    prisma.suggestion.createMany({
      data: analysis.suggestions.map((s) => ({
        resumeId: id,
        category: s.category,
        severity: s.severity,
        sectionId: s.sectionId ?? null,
        entryId: s.entryId ?? null,
        bulletId: s.bulletId ?? null,
        originalText: s.originalText ?? null,
        suggestedText: s.suggestedText ?? null,
        explanation: s.explanation,
        question: s.question ?? null,
      })),
    }),
    prisma.suggestion.findMany({ where: { resumeId: id, status: "PENDING" }, orderBy: { createdAt: "desc" } }),
    prisma.analysisResult.create({
      data: {
        resumeId: id,
        overallScore: analysis.overallScore,
        categoryScores: analysis.categoryScores,
        atsScore: analysis.atsScore,
        atsIssues: analysis.atsIssues,
        healthChecklist: analysis.healthChecklist,
      },
    }),
  ]);

  return NextResponse.json({ analysis: analysisResult, suggestions: createdSuggestions });
});
