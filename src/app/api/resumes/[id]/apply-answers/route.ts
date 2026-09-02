import { NextResponse } from "next/server";
import { withErrorHandling, NotFoundError } from "@/lib/api/errors";
import { requireUserId, requireOwnedResume } from "@/lib/api/auth";
import { ApplyAnswersRequestSchema } from "@/lib/validation/resume";
import { contentFromDb } from "@/lib/resume/dbMapping";
import { findBullet } from "@/lib/resume/helpers";
import { applyAnswersToBullet } from "@/lib/ai/coach";

type Params = { params: Promise<{ id: string }> };

/** Turns the user's answers to smart-questions into rewritten bullet alternatives. */
export const POST = withErrorHandling(async (req: Request, { params }: Params) => {
  const userId = await requireUserId();
  const { id } = await params;
  const resume = await requireOwnedResume(id, userId);

  const input = ApplyAnswersRequestSchema.parse(await req.json());
  const content = contentFromDb(resume.content);
  const found = findBullet(content, input.bulletId);
  if (!found) throw new NotFoundError("That bullet no longer exists on this resume.");

  const result = await applyAnswersToBullet(found.bullet.text, input.questions, input.answers);
  return NextResponse.json(result);
});
