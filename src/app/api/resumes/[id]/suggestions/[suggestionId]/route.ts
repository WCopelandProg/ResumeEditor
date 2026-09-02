import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withErrorHandling, AppError, NotFoundError } from "@/lib/api/errors";
import { requireUserId, requireOwnedResume } from "@/lib/api/auth";
import { SuggestionActionSchema } from "@/lib/validation/resume";
import { contentFromDb } from "@/lib/resume/dbMapping";
import { applySuggestionToResume } from "@/lib/resume/applySuggestion";

type Params = { params: Promise<{ id: string; suggestionId: string }> };

export const PATCH = withErrorHandling(async (req: Request, { params }: Params) => {
  const userId = await requireUserId();
  const { id, suggestionId } = await params;
  const resume = await requireOwnedResume(id, userId);

  const suggestion = await prisma.suggestion.findUnique({ where: { id: suggestionId } });
  if (!suggestion || suggestion.resumeId !== id) throw new NotFoundError("Suggestion not found.");

  const input = SuggestionActionSchema.parse(await req.json());

  if (input.action === "reject") {
    const updated = await prisma.suggestion.update({ where: { id: suggestionId }, data: { status: "REJECTED" } });
    return NextResponse.json({ suggestion: updated });
  }

  const finalText = input.action === "edit" ? input.finalText : (suggestion.suggestedText ?? undefined);
  if (input.action === "edit" && !finalText) {
    throw new AppError("finalText is required when editing a suggestion.", 400);
  }

  const currentContent = contentFromDb(resume.content);
  const updatedContent = finalText
    ? applySuggestionToResume(currentContent, suggestion, finalText)
    : currentContent;

  const [updatedResume, updatedSuggestion] = await prisma.$transaction([
    prisma.resume.update({ where: { id }, data: { content: updatedContent } }),
    prisma.suggestion.update({
      where: { id: suggestionId },
      data: { status: input.action === "edit" ? "EDITED" : "ACCEPTED", finalText: finalText ?? null },
    }),
  ]);

  return NextResponse.json({ suggestion: updatedSuggestion, content: contentFromDb(updatedResume.content) });
});
