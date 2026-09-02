import { NextResponse } from "next/server";
import { withErrorHandling, NotFoundError } from "@/lib/api/errors";
import { requireUserId, requireOwnedResume } from "@/lib/api/auth";
import { RewriteRequestSchema } from "@/lib/validation/resume";
import { contentFromDb } from "@/lib/resume/dbMapping";
import { findBullet } from "@/lib/resume/helpers";
import { rewriteBullet } from "@/lib/ai/coach";

type Params = { params: Promise<{ id: string }> };

/**
 * Contextual "Improve this bullet" / "Make this more concise" etc actions.
 * These are stateless — no Suggestion row is created, since the user picks
 * an alternative (or doesn't) immediately in the UI. Accepting an
 * alternative is just a normal content edit, applied via PATCH /resumes/:id
 * like any other editor change.
 */
export const POST = withErrorHandling(async (req: Request, { params }: Params) => {
  const userId = await requireUserId();
  const { id } = await params;
  const resume = await requireOwnedResume(id, userId);

  const input = RewriteRequestSchema.parse(await req.json());
  const content = contentFromDb(resume.content);
  const found = findBullet(content, input.bulletId);
  if (!found) throw new NotFoundError("That bullet no longer exists on this resume.");

  const result = await rewriteBullet(found.bullet.text, input.action, {
    entryTitle: found.entry.title,
    organization: found.entry.organization,
    otherBulletsInEntry: found.entry.bullets.filter((b) => b.id !== input.bulletId).map((b) => b.text),
  });

  return NextResponse.json(result);
});
