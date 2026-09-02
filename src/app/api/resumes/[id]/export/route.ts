import { NextResponse } from "next/server";
import { withErrorHandling } from "@/lib/api/errors";
import { requireUserId, requireOwnedResume } from "@/lib/api/auth";
import { contentFromDb, styleFromDb } from "@/lib/resume/dbMapping";
import { defaultResumeStyle } from "@/lib/resume/types";
import { renderResumeToPdfBuffer } from "@/lib/pdf/render";
import { sanitizeFilename } from "@/lib/storage/validate";

type Params = { params: Promise<{ id: string }> };

export const GET = withErrorHandling(async (_req: Request, { params }: Params) => {
  const userId = await requireUserId();
  const { id } = await params;
  const resume = await requireOwnedResume(id, userId);

  const content = contentFromDb(resume.content);
  const style = resume.style ? styleFromDb(resume.style) : defaultResumeStyle(resume.templateId);

  const buffer = await renderResumeToPdfBuffer(content, style);
  const filename = sanitizeFilename(`${resume.name || "resume"}.pdf`);

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": String(buffer.length),
      "Cache-Control": "no-store",
    },
  });
});
