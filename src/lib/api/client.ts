"use client";

import type { ResumeStyle, StructuredResume } from "@/lib/resume/types";
import type { RewriteAction } from "@/lib/ai/schema";

/**
 * Thin typed wrappers around the resume API for client components. Every
 * function throws a plain Error with the server's user-facing message on
 * failure (never a raw stack trace), so callers can show it directly in a
 * toast.
 */
async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: init?.body instanceof FormData ? init.headers : { "Content-Type": "application/json", ...init?.headers },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Something went wrong. Please try again.");
  }
  return res.json();
}

export interface ResumeSummary {
  id: string;
  name: string;
  targetRole: string | null;
  templateId: string;
  updatedAt: string;
  createdAt: string;
  overallScore: number | null;
}

export interface ResumeDetail {
  id: string;
  name: string;
  targetRole: string | null;
  templateId: string;
  content: StructuredResume;
  style: ResumeStyle;
}

export const api = {
  listResumes: () => request<{ resumes: ResumeSummary[] }>("/api/resumes"),

  createResume: (input: { name?: string; targetRole?: string; templateId?: string }) =>
    request<{ resume: ResumeDetail }>("/api/resumes", { method: "POST", body: JSON.stringify(input) }),

  createDemoResume: () => request<{ resume: ResumeDetail }>("/api/resumes/demo", { method: "POST" }),

  uploadResume: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return request<{ resume: ResumeDetail; warnings: string[]; status: string }>("/api/resumes/upload", {
      method: "POST",
      body: form,
    });
  },

  getResume: (id: string) => request<{ resume: ResumeDetail }>(`/api/resumes/${id}`),

  updateResume: (
    id: string,
    input: Partial<{ name: string; targetRole: string | null; templateId: string; content: StructuredResume; style: Partial<ResumeStyle> }>
  ) => request<{ resume: ResumeDetail }>(`/api/resumes/${id}`, { method: "PATCH", body: JSON.stringify(input) }),

  deleteResume: (id: string) => request<{ success: true }>(`/api/resumes/${id}`, { method: "DELETE" }),

  duplicateResume: (id: string) => request<{ resume: ResumeDetail }>(`/api/resumes/${id}/duplicate`, { method: "POST" }),

  analyzeResume: (id: string) =>
    request<{ analysis: AnalysisResultDto; suggestions: SuggestionDto[] }>(`/api/resumes/${id}/analyze`, { method: "POST" }),

  actOnSuggestion: (id: string, suggestionId: string, action: "accept" | "reject" | "edit", finalText?: string) =>
    request<{ suggestion: SuggestionDto; content?: StructuredResume }>(`/api/resumes/${id}/suggestions/${suggestionId}`, {
      method: "PATCH",
      body: JSON.stringify({ action, finalText }),
    }),

  acceptLowRiskSuggestions: (id: string) =>
    request<{ acceptedCount: number; content: StructuredResume }>(`/api/resumes/${id}/suggestions/accept-low-risk`, {
      method: "POST",
    }),

  rewriteBullet: (id: string, bulletId: string, action: RewriteAction) =>
    request<{ alternatives: { text: string; rationale: string }[]; clarifyingQuestion: string | null }>(
      `/api/resumes/${id}/rewrite`,
      { method: "POST", body: JSON.stringify({ bulletId, action }) }
    ),

  smartQuestions: (id: string, bulletId: string) =>
    request<{ bulletId: string; questions: string[] }>(`/api/resumes/${id}/smart-questions`, {
      method: "POST",
      body: JSON.stringify({ bulletId }),
    }),

  applyAnswers: (id: string, bulletId: string, questions: string[], answers: string[]) =>
    request<{ alternatives: { text: string; rationale: string }[]; clarifyingQuestion: string | null }>(
      `/api/resumes/${id}/apply-answers`,
      { method: "POST", body: JSON.stringify({ bulletId, questions, answers }) }
    ),

  jobMatch: (id: string, rawText: string, title?: string, company?: string) =>
    request<{ jobDescription: { id: string }; match: JobMatchDto; suggestions: SuggestionDto[] }>(
      `/api/resumes/${id}/job-match`,
      { method: "POST", body: JSON.stringify({ rawText, title, company }) }
    ),

  listVersions: (id: string) => request<{ versions: VersionDto[] }>(`/api/resumes/${id}/versions`),

  createVersion: (id: string, label: string) =>
    request<{ version: VersionDto }>(`/api/resumes/${id}/versions`, { method: "POST", body: JSON.stringify({ label }) }),

  restoreVersion: (id: string, versionId: string) =>
    request<{ resume: { id: string; content: StructuredResume; style: ResumeStyle } }>(
      `/api/resumes/${id}/versions/${versionId}/restore`,
      { method: "POST" }
    ),

  exportUrl: (id: string) => `/api/resumes/${id}/export`,
};

export interface SuggestionDto {
  id: string;
  category: string;
  severity: "HIGH" | "MEDIUM" | "LOW";
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "EDITED";
  sectionId: string | null;
  entryId: string | null;
  bulletId: string | null;
  originalText: string | null;
  suggestedText: string | null;
  finalText: string | null;
  explanation: string;
  question: string | null;
}

export interface AnalysisResultDto {
  id: string;
  overallScore: number;
  categoryScores: Record<string, number>;
  atsScore: number;
  atsIssues: { issue: string; detail: string; severity: string }[];
  healthChecklist: { label: string; passed: boolean; detail?: string }[];
  jobMatchScore?: number | null;
  createdAt: string;
}

export interface JobMatchDto {
  matchScore: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  emphasize: { point: string; reason: string; sectionId?: string | null; entryId?: string | null }[];
  deprioritize: { point: string; reason: string; sectionId?: string | null; entryId?: string | null }[];
  buriedQualifications: string[];
  explanationFactors: string[];
}

export interface VersionDto {
  id: string;
  label: string;
  isAutosave: boolean;
  createdAt: string;
}
