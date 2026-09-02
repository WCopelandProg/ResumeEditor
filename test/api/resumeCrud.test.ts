import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { setMockUser } from "./setup";
import { prisma } from "@/lib/db";
import { GET as listResumes, POST as createResume } from "@/app/api/resumes/route";
import { GET as getResume, PATCH as patchResume, DELETE as deleteResume } from "@/app/api/resumes/[id]/route";
import { PATCH as patchSuggestion } from "@/app/api/resumes/[id]/suggestions/[suggestionId]/route";

function jsonRequest(body: unknown, method = "POST") {
  return new Request("http://test.local/api", {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("resume CRUD + authorization", () => {
  let ownerId: string;
  let otherId: string;
  let resumeId: string;

  beforeAll(async () => {
    const owner = await prisma.user.create({ data: { email: `owner-${Date.now()}@test.local`, name: "Owner" } });
    const other = await prisma.user.create({ data: { email: `other-${Date.now()}@test.local`, name: "Other" } });
    ownerId = owner.id;
    otherId = other.id;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { id: { in: [ownerId, otherId] } } });
  });

  it("creates a resume for the signed-in user with starter content", async () => {
    setMockUser(ownerId);
    const res = await createResume(jsonRequest({ name: "My Resume", templateId: "modern" }));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.resume.name).toBe("My Resume");
    resumeId = body.resume.id;
  });

  it("lists only the signed-in user's resumes", async () => {
    setMockUser(ownerId);
    const res = await listResumes();
    const body = await res.json();
    expect(body.resumes.some((r: { id: string }) => r.id === resumeId)).toBe(true);

    setMockUser(otherId);
    const res2 = await listResumes();
    const body2 = await res2.json();
    expect(body2.resumes.some((r: { id: string }) => r.id === resumeId)).toBe(false);
  });

  it("blocks a different user from reading the resume (404, not 403 — no existence leak)", async () => {
    setMockUser(otherId);
    const res = await getResume(new Request("http://test.local"), { params: Promise.resolve({ id: resumeId }) });
    expect(res.status).toBe(404);
  });

  it("blocks a different user from updating or deleting the resume", async () => {
    setMockUser(otherId);
    const patchRes = await patchResume(jsonRequest({ name: "Hijacked" }, "PATCH"), {
      params: Promise.resolve({ id: resumeId }),
    });
    expect(patchRes.status).toBe(404);

    const delRes = await deleteResume(new Request("http://test.local", { method: "DELETE" }), {
      params: Promise.resolve({ id: resumeId }),
    });
    expect(delRes.status).toBe(404);

    const stillThere = await prisma.resume.findUnique({ where: { id: resumeId } });
    expect(stillThere).not.toBeNull();
    expect(stillThere?.name).toBe("My Resume");
  });

  it("lets the owner update resume content and persists validated content", async () => {
    setMockUser(ownerId);
    const newContent = {
      personalInfo: { fullName: "Jordan Rivera" },
      sections: [
        {
          id: "sec1",
          type: "EXPERIENCE",
          title: "Experience",
          order: 0,
          entries: [
            {
              id: "ent1",
              order: 0,
              organization: "Acme",
              title: "Engineer",
              bullets: [{ id: "blt1", order: 0, text: "Worked on data analysis for company reports." }],
              links: [],
              meta: {},
            },
          ],
        },
      ],
    };
    const res = await patchResume(jsonRequest({ content: newContent }, "PATCH"), {
      params: Promise.resolve({ id: resumeId }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.resume.content.personalInfo.fullName).toBe("Jordan Rivera");
  });

  it("applies an accepted suggestion's rewrite directly into the bullet it targets", async () => {
    setMockUser(ownerId);
    const suggestion = await prisma.suggestion.create({
      data: {
        resumeId,
        category: "QUANTIFICATION",
        severity: "HIGH",
        bulletId: "blt1",
        originalText: "Worked on data analysis for company reports.",
        suggestedText: "Analyzed 50+ weekly company reports using Python and SQL.",
        explanation: "Adds specificity about tools and scope.",
      },
    });

    const res = await patchSuggestion(jsonRequest({ action: "accept" }, "PATCH"), {
      params: Promise.resolve({ id: resumeId, suggestionId: suggestion.id }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.suggestion.status).toBe("ACCEPTED");

    const bullet = body.content.sections[0].entries[0].bullets[0];
    expect(bullet.text).toBe("Analyzed 50+ weekly company reports using Python and SQL.");
  });

  it("leaves content untouched when a suggestion is rejected", async () => {
    setMockUser(ownerId);
    const suggestion = await prisma.suggestion.create({
      data: {
        resumeId,
        category: "CLARITY",
        severity: "LOW",
        bulletId: "blt1",
        suggestedText: "Some other rewrite that should never be applied.",
        explanation: "test",
      },
    });

    const res = await patchSuggestion(jsonRequest({ action: "reject" }, "PATCH"), {
      params: Promise.resolve({ id: resumeId, suggestionId: suggestion.id }),
    });
    expect(res.status).toBe(200);

    const resume = await prisma.resume.findUnique({ where: { id: resumeId } });
    const content = resume!.content as { sections: Array<{ entries: Array<{ bullets: Array<{ text: string }> }> }> };
    expect(content.sections[0].entries[0].bullets[0].text).not.toContain("should never be applied");
  });

  it("deletes the resume for its owner", async () => {
    setMockUser(ownerId);
    const res = await deleteResume(new Request("http://test.local", { method: "DELETE" }), {
      params: Promise.resolve({ id: resumeId }),
    });
    expect(res.status).toBe(200);
    const gone = await prisma.resume.findUnique({ where: { id: resumeId } });
    expect(gone).toBeNull();
  });

  it("returns 401 for an unauthenticated request", async () => {
    setMockUser(null);
    const res = await listResumes();
    expect(res.status).toBe(401);
  });
});
