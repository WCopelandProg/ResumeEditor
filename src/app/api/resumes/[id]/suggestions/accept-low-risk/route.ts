import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withErrorHandling } from "@/lib/api/errors";
import { requireUserId, requireOwnedResume } from "@/lib/api/auth";
import { contentFromDb } from "@/lib/resume/dbMapping";
import { applySuggestionToResume } from "@/lib/resume/applySuggestion";

type Params = { params: Promise<{ id: string }> };

/**
 * "Accept all low-risk" applies every pending suggestion that (a) has a
 * concrete rewrite (not a clarifying question — those need the user's
 * input) and (b) isn't a HIGH-severity content change, since a high-impact
 * rewrite deserves the user's own read before it lands on their resume.
 */
export const POST = withErrorHandling(async (_req: Request, { params }: Params) => {
  const userId = await requireUserId();
  const { id } = await params;
  const resume = await requireOwnedResume(id, userId);

  const candidates = await prisma.suggestion.findMany({
    where: { resumeId: id, status: "PENDING", severity: { in: ["LOW", "MEDIUM"] }, suggestedText: { not: null } },
  });

  let content = contentFromDb(resume.content);
  const updates = [];
  for (const s of candidates) {
    if (!s.suggestedText) continue;
    content = applySuggestionToResume(content, s, s.suggestedText);
    updates.push(
      prisma.suggestion.update({ where: { id: s.id }, data: { status: "ACCEPTED", finalText: s.suggestedText } })
    );
  }

  await prisma.$transaction([prisma.resume.update({ where: { id }, data: { content } }), ...updates]);

  return NextResponse.json({ acceptedCount: updates.length, content });
});
