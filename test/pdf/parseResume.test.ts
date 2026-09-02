import { describe, expect, it, beforeAll } from "vitest";
import { parseResumePdf } from "@/lib/pdf/parseResume";
import type { StructuredResume } from "@/lib/resume/types";
import { buildTestResumePdf, buildBlankPdf } from "../fixtures/buildTestResumePdf";

describe("parseResumePdf", () => {
  let resume: StructuredResume;
  let warnings: string[];

  beforeAll(async () => {
    const buffer = await buildTestResumePdf();
    const result = await parseResumePdf(buffer);
    if (result.status !== "SUCCESS") {
      throw new Error(`Expected SUCCESS, got ${result.status}: ${"error" in result ? result.error : ""}`);
    }
    resume = result.resume;
    warnings = result.warnings;
  });

  it("extracts the candidate's name and contact info", () => {
    expect(resume.personalInfo.fullName).toMatch(/jordan rivera/i);
    expect(resume.personalInfo.email).toBe("jordan.rivera@email.com");
    expect(resume.personalInfo.phone).toContain("555");
    expect(resume.personalInfo.location).toMatch(/San Francisco/i);
  });

  it("detects the expected sections in order", () => {
    const types = resume.sections.map((s) => s.type);
    expect(types).toEqual(["SUMMARY", "EXPERIENCE", "EDUCATION", "SKILLS"]);
  });

  it("splits experience into two entries with bullets and dates", () => {
    const exp = resume.sections.find((s) => s.type === "EXPERIENCE")!;
    expect(exp.entries).toHaveLength(2);

    const [acme, beta] = exp.entries;
    expect(acme.organization).toMatch(/Acme/i);
    expect(acme.bullets.length).toBe(3);
    expect(acme.startDate).toMatch(/Jun 2022/i);
    expect(acme.isCurrent).toBe(true);

    expect(beta.organization).toMatch(/Beta Startup/i);
    expect(beta.bullets.length).toBe(2);
    expect(beta.endDate).toMatch(/Aug 2021/i);
  });

  it("parses education with a degree entry", () => {
    const edu = resume.sections.find((s) => s.type === "EDUCATION")!;
    expect(edu.entries).toHaveLength(1);
    expect(edu.entries[0].organization).toMatch(/Stanford/i);
  });

  it("parses skills into categorized entries", () => {
    const skills = resume.sections.find((s) => s.type === "SKILLS")!;
    expect(skills.entries).toHaveLength(2);
    expect(skills.entries[0].title).toMatch(/Languages/i);
    expect(skills.entries[0].description).toContain("Python");
  });

  it("produces no warnings for a well-structured resume", () => {
    expect(warnings).toEqual([]);
  });
});

describe("parseResumePdf on a scanned (no text layer) PDF", () => {
  it("reports NO_TEXT_LAYER instead of an empty resume", async () => {
    const result = await parseResumePdf(await buildBlankPdf());
    expect(result.status).toBe("NO_TEXT_LAYER");
  });
});
