import { NextResponse } from "next/server";
import { withErrorHandling, NotFoundError } from "@/lib/api/errors";
import { requireUserId, requireOwnedResume } from "@/lib/api/auth";
import { SmartQuestionsRequestSchema } from "@/lib/validation/resume";
import { contentFromDb } from "@/lib/resume/dbMapping";
import { findBullet } from "@/lib/resume/helpers";
import { generateSmartQuestions } from "@/lib/ai/coach";

type Params = { params: Promise<{ id: string }> };

export const POST = withErrorHandling(async (req: Request, { params }: Params) => {
  const userId = await requireUserId();
  const { id } = await params;
  const resume = await requireOwnedResume(id, userId);

  const input = SmartQuestionsRequestSchema.parse(await req.json());
  const content = contentFromDb(resume.content);
  const found = findBullet(content, input.bulletId);
  if (!found) throw new NotFoundError("That bullet no longer exists on this resume.");

  const result = await generateSmartQuestions(found.bullet.text);
  return NextResponse.json({ bulletId: input.bulletId, questions: result.questions });
});
