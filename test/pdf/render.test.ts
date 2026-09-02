import { describe, expect, it } from "vitest";
import { renderResumeToPdfBuffer } from "@/lib/pdf/render";
import { defaultResumeStyle, RESUME_TEMPLATES } from "@/lib/resume/types";
import { parseResumePdf } from "@/lib/pdf/parseResume";
import { buildSampleResume } from "../fixtures/sampleResume";

describe("renderResumeToPdfBuffer", () => {
  it.each(RESUME_TEMPLATES.map((t) => t.id))("renders a valid, non-trivial PDF for the %s template", async (templateId) => {
    const resume = buildSampleResume();
    const style = defaultResumeStyle(templateId);
    const buffer = await renderResumeToPdfBuffer(resume, style);

    expect(buffer.subarray(0, 5).toString()).toBe("%PDF-");
    expect(buffer.length).toBeGreaterThan(1000);
  });

  it("produces selectable text that our own parser can read back", async () => {
    const resume = buildSampleResume();
    const style = defaultResumeStyle("modern");
    const buffer = await renderResumeToPdfBuffer(resume, style);

    const result = await parseResumePdf(buffer);
    expect(result.status).toBe("SUCCESS");
    if (result.status === "SUCCESS") {
      expect(result.rawText).toContain("Jordan Rivera");
      expect(result.rawText).toContain("Acme Corporation");
      expect(result.rawText).toContain("jordan.rivera@email.com");
    }
  });

  it("renders two-column layouts without throwing", async () => {
    const resume = buildSampleResume();
    const style = defaultResumeStyle("technical");
    style.columns = 2;
    const buffer = await renderResumeToPdfBuffer(resume, style);
    expect(buffer.subarray(0, 5).toString()).toBe("%PDF-");
  });
});
