import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { contentFromDb, styleFromDb } from "@/lib/resume/dbMapping";
import { defaultResumeStyle } from "@/lib/resume/types";
import { ResumeEditorClient } from "./ResumeEditorClient";

export default async function ResumeEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const { id } = await params;
  const resume = await prisma.resume.findUnique({
    where: { id },
    include: {
      style: true,
      suggestions: { where: { status: "PENDING" }, orderBy: { createdAt: "desc" } },
      analysisResults: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  if (!resume || resume.userId !== session.user.id) notFound();

  const analysis = resume.analysisResults[0]
    ? {
        id: resume.analysisResults[0].id,
        overallScore: resume.analysisResults[0].overallScore,
        categoryScores: resume.analysisResults[0].categoryScores as Record<string, number>,
        atsScore: resume.analysisResults[0].atsScore,
        atsIssues: resume.analysisResults[0].atsIssues as { issue: string; detail: string; severity: string }[],
        healthChecklist: resume.analysisResults[0].healthChecklist as { label: string; passed: boolean; detail?: string }[],
        createdAt: resume.analysisResults[0].createdAt.toISOString(),
      }
    : null;

  return (
    <ResumeEditorClient
      resume={{
        id: resume.id,
        name: resume.name,
        targetRole: resume.targetRole,
        templateId: resume.templateId,
        content: contentFromDb(resume.content),
        style: resume.style ? styleFromDb(resume.style) : defaultResumeStyle(resume.templateId),
      }}
      initialAnalysis={analysis}
      initialSuggestions={resume.suggestions.map((s) => ({
        id: s.id,
        category: s.category,
        severity: s.severity,
        status: s.status,
        sectionId: s.sectionId,
        entryId: s.entryId,
        bulletId: s.bulletId,
        originalText: s.originalText,
        suggestedText: s.suggestedText,
        finalText: s.finalText,
        explanation: s.explanation,
        question: s.question,
      }))}
    />
  );
}
