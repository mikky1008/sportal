// Browser client for the administrator's pages (server/admin*.server.ts, server/rep-applications.server.ts).

import { apiBlob, apiRequest, type ApiResult } from "@/auth/authClient";

export type { ApiResult };

// ---- School Verification: school / university representative applications ----
export type ApplicationStatus = "pending" | "approved" | "rejected";

export interface ApplicationSummary {
  /** the applicant's user id */
  id: string;
  name: string;
  email: string;
  school: string;
  designation: string;
  photo: string | null;
  status: ApplicationStatus;
  submittedAt: string;
  documentCount: number;
}

export interface ApplicationDocument {
  id: string;
  kind: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: string;
}

export interface ApplicationDetail extends ApplicationSummary {
  username: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
  rejectionReason: string | null;
  documents: ApplicationDocument[];
}

export type ApplicationCounts = Record<ApplicationStatus, number>;

export const fetchApplications = (status: ApplicationStatus | "", limit = 100, offset = 0) =>
  apiRequest<{ items: ApplicationSummary[]; total: number; counts: ApplicationCounts }>(
    `/api/admin/school-verifications?${status ? `status=${status}&` : ""}limit=${limit}&offset=${offset}`,
  );

export const fetchApplication = (id: string) =>
  apiRequest<{ application: ApplicationDetail }>(`/api/admin/school-verifications/${encodeURIComponent(id)}`);

export const approveApplication = (id: string) =>
  apiRequest<{ application: ApplicationDetail }>(`/api/admin/school-verifications/${encodeURIComponent(id)}/approve`, { method: "POST", body: {} });

export const rejectApplication = (id: string, reason: string) =>
  apiRequest<{ application: ApplicationDetail }>(`/api/admin/school-verifications/${encodeURIComponent(id)}/reject`, { method: "POST", body: { reason } });

/** Opens a submitted document in a new tab (or saves it, if the browser blocks the tab). Returns an error message, or null. */
export async function openApplicationDocument(applicationId: string, doc: ApplicationDocument, mode: "view" | "download" = "view"): Promise<string | null> {
  // Open the tab before the download starts, so the browser treats it as the click's own action.
  const tab = mode === "view" ? window.open("", "_blank") : null;
  const res = await apiBlob(`/api/admin/school-verifications/${encodeURIComponent(applicationId)}/documents/${encodeURIComponent(doc.id)}`);
  if (!res.ok) {
    tab?.close();
    return res.message;
  }
  const url = URL.createObjectURL(res.blob);
  if (tab) {
    tab.location.href = url;
  } else {
    const a = document.createElement("a");
    a.href = url;
    a.download = doc.fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
  return null;
}

export interface AdminOverview {
  totals: { users: number; athletes: number; schools: number; pending: number; usersThisWeek: number; athletesThisWeek: number };
  registrations: { month: string; athletes: number; coaches: number; schoolReps: number }[];
  users: { students: number; coaches: number; verifiedCoaches: number; universityReps: number; inactive: number };
  pendingVerifications: number;
  signIns24h: { succeeded: number; failed: number };
  recentActivity: { event: string; identifier: string | null; roles: string[] | null; at: string }[];
}

/**
 * The top bar (bell badge) and the dashboard both want the overview. Asking twice within a few
 * seconds shares one request; `fresh` forces a new one (after approving someone, say).
 */
let shared: { at: number; promise: Promise<ApiResult<{ overview: AdminOverview }>> } | null = null;
export function fetchAdminOverview(fresh = false): Promise<ApiResult<{ overview: AdminOverview }>> {
  if (!fresh && shared && Date.now() - shared.at < 3000) return shared.promise;
  const promise = apiRequest<{ overview: AdminOverview }>("/api/admin/overview");
  shared = { at: Date.now(), promise };
  return promise;
}

// ---- User Management (server/admin-users.server.ts) ----
export type DirectoryRole = "student_athlete" | "coach" | "university_representative";
export type UserStatus = "active" | "pending" | "suspended" | "rejected";

export interface DirectoryUser {
  id: string;
  name: string;
  email: string;
  photo: string | null;
  role: DirectoryRole | null;
  school: string | null;
  status: UserStatus;
  registeredAt: string;
}

export interface UserDetail extends DirectoryUser {
  username: string;
  roles: string[];
  verifiedCoach: boolean;
  sport: string | null;
  position: string | null;
  lastLoginAt: string | null;
  emailVerified: boolean;
  history: { event: "registered" | "suspended" | "reactivated"; at: string; reason: string | null }[];
}

export interface DirectorySummary { total: number; active: number; pending: number; suspended: number; rejected: number }

export const fetchUsers = (
  p: { q: string; role: DirectoryRole | ""; status: UserStatus | ""; limit: number; offset: number },
  signal?: AbortSignal,
) => {
  const qs = new URLSearchParams();
  if (p.q.trim()) qs.set("q", p.q.trim());
  if (p.role) qs.set("role", p.role);
  if (p.status) qs.set("status", p.status);
  qs.set("limit", String(p.limit));
  qs.set("offset", String(p.offset));
  return apiRequest<{ items: DirectoryUser[]; total: number; summary: DirectorySummary }>(`/api/admin/users?${qs}`, signal ? { signal } : {});
};

export const fetchUserDetail = (id: string) => apiRequest<{ user: UserDetail }>(`/api/admin/users/${encodeURIComponent(id)}`);

export const suspendUser = (id: string, reason: string) =>
  apiRequest<{ user: UserDetail }>(`/api/admin/users/${encodeURIComponent(id)}/suspend`, { method: "POST", body: { reason } });

export const reactivateUser = (id: string) =>
  apiRequest<{ user: UserDetail }>(`/api/admin/users/${encodeURIComponent(id)}/reactivate`, { method: "POST", body: {} });
