import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withErrorHandling } from "@/lib/api/errors";
import { requireUserId, requireOwnedResume } from "@/lib/api/auth";
import { CreateVersionSchema } from "@/lib/validation/resume";
import { styleFromDb } from "@/lib/resume/dbMapping";

type Params = { params: Promise<{ id: string }> };

export const GET = withErrorHandling(async (_req: Request, { params }: Params) => {
  const userId = await requireUserId();
  const { id } = await params;
  await requireOwnedResume(id, userId);

  const versions = await prisma.resumeVersion.findMany({
    where: { resumeId: id },
    orderBy: { createdAt: "desc" },
    select: { id: true, label: true, isAutosave: true, createdAt: true },
  });
  return NextResponse.json({ versions });
});

export const POST = withErrorHandling(async (req: Request, { params }: Params) => {
  const userId = await requireUserId();
  const { id } = await params;
  const resume = await requireOwnedResume(id, userId);

  const input = CreateVersionSchema.parse(await req.json());
  const style = resume.style ? styleFromDb(resume.style) : null;

  const version = await prisma.resumeVersion.create({
    data: {
      resumeId: id,
      label: input.label,
      content: resume.content as object,
      style: style ?? {},
    },
  });

  return NextResponse.json({ version }, { status: 201 });
});
