import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withErrorHandling, NotFoundError } from "@/lib/api/errors";
import { requireUserId, requireOwnedResume } from "@/lib/api/auth";
import { contentFromDb, styleFromDb, styleToDbFields } from "@/lib/resume/dbMapping";
import { ResumeStyleSchema } from "@/lib/resume/types";

type Params = { params: Promise<{ id: string; versionId: string }> };

export const POST = withErrorHandling(async (_req: Request, { params }: Params) => {
  const userId = await requireUserId();
  const { id, versionId } = await params;
  const resume = await requireOwnedResume(id, userId);

  const version = await prisma.resumeVersion.findUnique({ where: { id: versionId } });
  if (!version || version.resumeId !== id) throw new NotFoundError("Version not found.");

  const restoredContent = contentFromDb(version.content);
  const restoredStyle = ResumeStyleSchema.parse(version.style ?? {});

  // Snapshot the current state before overwriting it, so restoring is itself reversible.
  const currentStyle = resume.style ? styleFromDb(resume.style) : null;
  await prisma.resumeVersion.create({
    data: {
      resumeId: id,
      label: "Before restore",
      isAutosave: true,
      content: resume.content as object,
      style: currentStyle ?? {},
    },
  });

  const updated = await prisma.resume.update({
    where: { id },
    data: {
      content: restoredContent,
      style: { upsert: { create: styleToDbFields(restoredStyle), update: styleToDbFields(restoredStyle) } },
    },
    include: { style: true },
  });

  return NextResponse.json({
    resume: {
      id: updated.id,
      content: contentFromDb(updated.content),
      style: updated.style ? styleFromDb(updated.style) : null,
    },
  });
});
