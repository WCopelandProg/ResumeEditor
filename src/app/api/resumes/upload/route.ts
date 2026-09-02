import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withErrorHandling, AppError } from "@/lib/api/errors";
import { requireUserId } from "@/lib/api/auth";
import { assertValidPdfUpload, sanitizeFilename } from "@/lib/storage/validate";
import { getStorageProvider } from "@/lib/storage";
import { parseResumePdf } from "@/lib/pdf/parseResume";
import { emptyStructuredResume } from "@/lib/resume/types";
import { defaultResumeStyle } from "@/lib/resume/types";
import { styleToDbFields } from "@/lib/resume/dbMapping";
import { nanoid } from "nanoid";

/**
 * Upload flow: validate -> store the original file -> parse it into a
 * StructuredResume -> create the Resume record. The original file is kept
 * (UploadedFile) so it can be re-parsed or referenced later, but the parsed
 * StructuredResume immediately becomes the source of truth for editing.
 */
export const POST = withErrorHandling(async (req: Request) => {
  const userId = await requireUserId();

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    throw new AppError("No file was uploaded.", 400);
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  assertValidPdfUpload({ type: file.type || "application/pdf", size: buffer.length }, buffer);

  const filename = sanitizeFilename(file.name || "resume.pdf");
  const storageKey = `${userId}/${nanoid()}-${filename}`;
  const storage = getStorageProvider();
  await storage.put(storageKey, buffer, "application/pdf");

  const parseResult = await parseResumePdf(buffer);

  const uploadedFile = await prisma.uploadedFile.create({
    data: {
      userId,
      originalFilename: filename,
      storageKey,
      mimeType: "application/pdf",
      sizeBytes: buffer.length,
      parseStatus: parseResult.status,
      extractedText: "rawText" in parseResult ? parseResult.rawText : null,
      parseError: parseResult.status === "FAILED" ? parseResult.error : null,
    },
  });

  if (parseResult.status === "FAILED") {
    return NextResponse.json(
      { error: parseResult.error, uploadedFileId: uploadedFile.id, status: "FAILED" },
      { status: 422 }
    );
  }

  if (parseResult.status === "NO_TEXT_LAYER") {
    // Detected condition per spec: no extractable text layer (scanned/image PDF).
    // OCR isn't wired up yet, so we surface this distinctly rather than silently
    // creating an empty resume — see README "Scanned resumes" for the OCR plug-in point.
    return NextResponse.json(
      {
        status: "NO_TEXT_LAYER",
        uploadedFileId: uploadedFile.id,
        message:
          "This PDF doesn't contain selectable text (it looks like a scanned image). We can't extract structured content from it automatically yet — try exporting a text-based PDF from the original document, or start from a blank resume.",
      },
      { status: 422 }
    );
  }

  const style = defaultResumeStyle("modern");
  const resume = await prisma.resume.create({
    data: {
      userId,
      name: filename.replace(/\.pdf$/i, "") || "Imported Resume",
      templateId: "modern",
      content: parseResult.resume ?? emptyStructuredResume(),
      sourceFileId: uploadedFile.id,
      style: { create: styleToDbFields(style) },
    },
    include: { style: true },
  });

  // Link the file from its own side too, so resume deletion can find (and
  // clean up) every file ever attached to it via a single query.
  await prisma.uploadedFile.update({ where: { id: uploadedFile.id }, data: { resumeId: resume.id } });

  return NextResponse.json(
    { resume, warnings: parseResult.warnings, status: "SUCCESS" },
    { status: 201 }
  );
});
