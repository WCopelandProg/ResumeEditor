import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withErrorHandling } from "@/lib/api/errors";
import { requireUserId } from "@/lib/api/auth";
import { CreateResumeSchema } from "@/lib/validation/resume";
import { starterStructuredResume } from "@/lib/resume/helpers";
import { defaultResumeStyle } from "@/lib/resume/types";
import { styleToDbFields } from "@/lib/resume/dbMapping";

export const GET = withErrorHandling(async () => {
  const userId = await requireUserId();

  const resumes = await prisma.resume.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: {
      style: true,
      analysisResults: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  return NextResponse.json({
    resumes: resumes.map((r) => ({
      id: r.id,
      name: r.name,
      targetRole: r.targetRole,
      templateId: r.templateId,
      updatedAt: r.updatedAt,
      createdAt: r.createdAt,
      overallScore: r.analysisResults[0]?.overallScore ?? null,
    })),
  });
});

export const POST = withErrorHandling(async (req: Request) => {
  const userId = await requireUserId();
  const body = await req.json().catch(() => ({}));
  const input = CreateResumeSchema.parse(body);

  const style = defaultResumeStyle(input.templateId);
  const resume = await prisma.resume.create({
    data: {
      userId,
      name: input.name,
      targetRole: input.targetRole,
      templateId: input.templateId,
      content: starterStructuredResume(),
      style: { create: styleToDbFields(style) },
    },
    include: { style: true },
  });

  return NextResponse.json({ resume }, { status: 201 });
});
