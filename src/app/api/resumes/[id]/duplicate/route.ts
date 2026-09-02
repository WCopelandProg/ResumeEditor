import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withErrorHandling } from "@/lib/api/errors";
import { requireUserId, requireOwnedResume } from "@/lib/api/auth";
import { contentFromDb, styleFromDb, styleToDbFields } from "@/lib/resume/dbMapping";

type Params = { params: Promise<{ id: string }> };

export const POST = withErrorHandling(async (_req: Request, { params }: Params) => {
  const userId = await requireUserId();
  const { id } = await params;
  const original = await requireOwnedResume(id, userId);

  const duplicate = await prisma.resume.create({
    data: {
      userId,
      name: `${original.name} (Copy)`,
      targetRole: original.targetRole,
      templateId: original.templateId,
      content: contentFromDb(original.content),
      style: { create: styleToDbFields(styleFromDb(original.style!)) },
    },
    include: { style: true },
  });

  return NextResponse.json({ resume: duplicate }, { status: 201 });
});
