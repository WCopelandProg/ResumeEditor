import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withErrorHandling } from "@/lib/api/errors";
import { requireUserId, requireOwnedResume } from "@/lib/api/auth";
import { UpdateResumeSchema } from "@/lib/validation/resume";
import { contentFromDb, styleFromDb, styleToDbFields } from "@/lib/resume/dbMapping";
import { defaultResumeStyle } from "@/lib/resume/types";
import { getStorageProvider } from "@/lib/storage";

type Params = { params: Promise<{ id: string }> };

export const GET = withErrorHandling(async (_req: Request, { params }: Params) => {
  const userId = await requireUserId();
  const { id } = await params;
  const resume = await requireOwnedResume(id, userId);

  return NextResponse.json({
    resume: {
      id: resume.id,
      name: resume.name,
      targetRole: resume.targetRole,
      templateId: resume.templateId,
      createdAt: resume.createdAt,
      updatedAt: resume.updatedAt,
      content: contentFromDb(resume.content),
      style: resume.style ? styleFromDb(resume.style) : null,
    },
  });
});

export const PATCH = withErrorHandling(async (req: Request, { params }: Params) => {
  const userId = await requireUserId();
  const { id } = await params;
  await requireOwnedResume(id, userId);

  const body = await req.json();
  const input = UpdateResumeSchema.parse(body);

  const resume = await prisma.resume.update({
    where: { id },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.targetRole !== undefined ? { targetRole: input.targetRole } : {}),
      ...(input.templateId !== undefined ? { templateId: input.templateId } : {}),
      ...(input.content !== undefined ? { content: input.content } : {}),
      ...(input.style !== undefined
        ? {
            style: {
              upsert: {
                create: styleToDbFields({ ...defaultResumeStyle(input.templateId), ...input.style }),
                update: input.style,
              },
            },
          }
        : {}),
    },
    include: { style: true },
  });

  return NextResponse.json({
    resume: {
      id: resume.id,
      name: resume.name,
      targetRole: resume.targetRole,
      templateId: resume.templateId,
      updatedAt: resume.updatedAt,
      content: contentFromDb(resume.content),
      style: resume.style ? styleFromDb(resume.style) : null,
    },
  });
});

export const DELETE = withErrorHandling(async (_req: Request, { params }: Params) => {
  const userId = await requireUserId();
  const { id } = await params;
  const resume = await requireOwnedResume(id, userId);

  const files = await prisma.uploadedFile.findMany({ where: { resumeId: id } });
  const storage = getStorageProvider();
  await Promise.all(files.map((f) => storage.delete(f.storageKey).catch(() => undefined)));

  await prisma.resume.delete({ where: { id: resume.id } });
  return NextResponse.json({ success: true });
});
