import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { setMockUser } from "./setup";
import { prisma } from "@/lib/db";
import { POST as uploadResume } from "@/app/api/resumes/upload/route";
import { buildTestResumePdf, buildBlankPdf } from "../fixtures/buildTestResumePdf";

function uploadRequest(file: File) {
  const form = new FormData();
  form.append("file", file);
  return new Request("http://test.local/api/resumes/upload", { method: "POST", body: form });
}

describe("resume upload", () => {
  let userId: string;
  const createdResumeIds: string[] = [];

  beforeAll(async () => {
    const user = await prisma.user.create({ data: { email: `upload-${Date.now()}@test.local`, name: "Uploader" } });
    userId = user.id;
    setMockUser(userId);
  });

  afterAll(async () => {
    await prisma.resume.deleteMany({ where: { id: { in: createdResumeIds } } });
    await prisma.user.deleteMany({ where: { id: userId } });
  });

  it("parses a real PDF into a structured resume end-to-end", async () => {
    const buffer = await buildTestResumePdf();
    const file = new File([new Uint8Array(buffer)], "Jordan Rivera Resume.pdf", { type: "application/pdf" });

    const response = await uploadResume(uploadRequest(file));
    expect(response.status).toBe(201);

    const body = await response.json();
    expect(body.status).toBe("SUCCESS");
    expect(body.resume.userId).toBe(userId);
    createdResumeIds.push(body.resume.id);

    const content = body.resume.content as { personalInfo: { fullName: string }; sections: Array<{ type: string }> };
    expect(content.personalInfo.fullName).toMatch(/jordan rivera/i);
    expect(content.sections.map((s) => s.type)).toContain("EXPERIENCE");

    const uploadedFile = await prisma.uploadedFile.findUnique({ where: { id: body.resume.sourceFileId } });
    expect(uploadedFile?.parseStatus).toBe("SUCCESS");
    expect(uploadedFile?.resumeId).toBe(body.resume.id);
  });

  it("rejects a non-PDF file", async () => {
    const file = new File([new Uint8Array([1, 2, 3])], "not-a-resume.txt", { type: "text/plain" });
    const response = await uploadResume(uploadRequest(file));
    expect(response.status).toBe(415);
  });

  it("reports NO_TEXT_LAYER for a scanned/image-only PDF instead of creating an empty resume", async () => {
    const buffer = await buildBlankPdf();
    const file = new File([new Uint8Array(buffer)], "scanned.pdf", { type: "application/pdf" });
    const response = await uploadResume(uploadRequest(file));
    expect(response.status).toBe(422);
    const body = await response.json();
    expect(body.status).toBe("NO_TEXT_LAYER");
  });
});
