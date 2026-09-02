import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withErrorHandling } from "@/lib/api/errors";
import { requireUserId } from "@/lib/api/auth";
import { demoStructuredResume, DEMO_RESUME_NAME, DEMO_TARGET_ROLE } from "@/lib/resume/demoResume";
import { defaultResumeStyle } from "@/lib/resume/types";
import { styleToDbFields } from "@/lib/resume/dbMapping";

export const POST = withErrorHandling(async () => {
  const userId = await requireUserId();

  const style = defaultResumeStyle("modern");
  const resume = await prisma.resume.create({
    data: {
      userId,
      name: DEMO_RESUME_NAME,
      targetRole: DEMO_TARGET_ROLE,
      templateId: "modern",
      content: demoStructuredResume(),
      style: { create: styleToDbFields(style) },
    },
    include: { style: true },
  });

  return NextResponse.json({ resume }, { status: 201 });
});
