// Browser client for the scholarships API (server/scholarships.server.ts).
// Every function resolves to an ApiResult and never throws. Routes used:
//   GET  /api/scholarships                   open scholarships (with my application, if any)
//   POST /api/scholarships/:id/apply         student-athlete applies
//   POST /api/scholarships/:id/withdraw      student-athlete withdraws

import { apiRequest, type ApiResult } from "@/auth/authClient";

export type ApplicationStatus = "submitted" | "under_review" | "accepted" | "rejected" | "withdrawn";

export interface ScholarshipView {
  id: string;
  name: string;
  university: string;
  sport: string;
  coverage: string;
  details: string;
  eligibility: string[];
  /** YYYY-MM-DD */
  deadline: string;
  isOpen: boolean;
  postedByMe: boolean;
  myApplication: { id: string; status: ApplicationStatus } | null;
}

export interface ScholarshipPage {
  items: ScholarshipView[];
  total: number;
}

export type { ApiResult };

export const listScholarships = (opts: { sport?: string; q?: string; includeClosed?: boolean; signal?: AbortSignal } = {}): Promise<ApiResult<ScholarshipPage>> => {
  const p = new URLSearchParams({ limit: "100" });
  if (opts.sport) p.set("sport", opts.sport);
  if (opts.q) p.set("q", opts.q);
  if (opts.includeClosed) p.set("includeClosed", "true");
  return apiRequest<ScholarshipPage>(`/api/scholarships?${p}`, opts.signal ? { signal: opts.signal } : {});
};

export const applyToScholarship = (id: string) =>
  apiRequest<{ application: { id: string; status: ApplicationStatus } }>(`/api/scholarships/${encodeURIComponent(id)}/apply`, { method: "POST" });

export const withdrawApplication = (id: string) =>
  apiRequest<{ application: { id: string; status: ApplicationStatus } }>(`/api/scholarships/${encodeURIComponent(id)}/withdraw`, { method: "POST" });

/** "2026-12-15" -> "Dec 15, 2026" (read as a calendar date, so the time zone never shifts the day). */
export function formatDeadline(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
}

export const listUniversities = (signal?: AbortSignal) =>
  apiRequest<{ items: string[] }>("/api/scholarships/universities", signal ? { signal } : {});

export interface ScholarshipDraft {
  name: string;
  sport: string;
  coverage: string;
  details: string;
  eligibility: string[];
  deadline: string;
}

/** University representatives and admins only. The server fills in the university. */
export const createScholarship = (d: ScholarshipDraft) =>
  apiRequest<{ scholarship: ScholarshipView }>("/api/scholarships", { method: "POST", body: d });

export const setScholarshipOpen = (id: string, open: boolean) =>
  apiRequest<{ scholarship: ScholarshipView }>(`/api/scholarships/${encodeURIComponent(id)}/${open ? "open" : "close"}`, { method: "POST" });

export interface ApplicantView {
  id: string;
  status: ApplicationStatus;
  appliedAt: string;
  updatedAt: string;
  athlete: { id: string; displayName: string; sport: string; school: string };
}

/** The poster (or an admin) only. */
export const listApplicants = (scholarshipId: string) =>
  apiRequest<{ items: ApplicantView[] }>(`/api/scholarships/${encodeURIComponent(scholarshipId)}/applications`);

export const setApplicationStatus = (applicationId: string, status: "under_review" | "accepted" | "rejected") =>
  apiRequest<{ status: ApplicationStatus }>(`/api/scholarships/applications/${encodeURIComponent(applicationId)}/status`, { method: "POST", body: { status } });
