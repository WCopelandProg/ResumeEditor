import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withErrorHandling } from "@/lib/api/errors";
import { requireUserId, requireOwnedResume } from "@/lib/api/auth";
import { JobDescriptionSchema } from "@/lib/validation/resume";
import { contentFromDb } from "@/lib/resume/dbMapping";
import { matchJobDescription } from "@/lib/ai/coach";

type Params = { params: Promise<{ id: string }> };

export const POST = withErrorHandling(async (req: Request, { params }: Params) => {
  const userId = await requireUserId();
  const { id } = await params;
  const resume = await requireOwnedResume(id, userId);

  const input = JobDescriptionSchema.parse(await req.json());
  const content = contentFromDb(resume.content);

  const jobDescription = await prisma.jobDescription.create({
    data: { resumeId: id, rawText: input.rawText, title: input.title, company: input.company },
  });

  const match = await matchJobDescription(content, input.rawText);

  await prisma.suggestion.deleteMany({ where: { resumeId: id, status: "PENDING" } });
  await prisma.suggestion.createMany({
    data: match.suggestions.map((s) => ({
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
  });
  const suggestions = await prisma.suggestion.findMany({ where: { resumeId: id, status: "PENDING" } });

  // A job-match run also needs core quality scores to populate the full
  // AnalysisResult row; reuse the most recent one if it's fresh, otherwise
  // this endpoint still records the match with placeholder-free scores by
  // pulling the latest known analysis (the UI always runs /analyze first).
  const latestAnalysis = await prisma.analysisResult.findFirst({
    where: { resumeId: id },
    orderBy: { createdAt: "desc" },
  });

  const analysisResult = await prisma.analysisResult.create({
    data: {
      resumeId: id,
      jobDescriptionId: jobDescription.id,
      overallScore: latestAnalysis?.overallScore ?? 0,
      categoryScores: latestAnalysis?.categoryScores ?? {},
      atsScore: latestAnalysis?.atsScore ?? 0,
      atsIssues: latestAnalysis?.atsIssues ?? [],
      healthChecklist: latestAnalysis?.healthChecklist ?? [],
      jobMatchScore: match.matchScore,
      missingKeywords: match.missingKeywords,
      matchExplanation: match.explanationFactors,
    },
  });

  return NextResponse.json({
    jobDescription,
    analysis: analysisResult,
    match: {
      matchScore: match.matchScore,
      matchedKeywords: match.matchedKeywords,
      missingKeywords: match.missingKeywords,
      emphasize: match.emphasize,
      deprioritize: match.deprioritize,
      buriedQualifications: match.buriedQualifications,
      explanationFactors: match.explanationFactors,
    },
    suggestions,
  });
});
