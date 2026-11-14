// Browser client for the administrator's coach-verification review (server/coach-profile.server.ts).
//   GET  /api/admin/coach-verifications?status=pending|verified|rejected
//   POST /api/admin/coach-verifications/:coachId/approve
//   POST /api/admin/coach-verifications/:coachId/reject    { note }  (the reason is shown to the coach)

import { apiRequest, type ApiResult } from "@/auth/authClient";

export type { ApiResult };

export type VerificationStatus = "pending" | "verified" | "rejected";

export interface VerificationRequest {
  coachId: string;
  displayName: string;
  email: string;
  status: VerificationStatus;
  organization: string;
  organizationType: string;
  position: string;
  sport: string;
  officialEmail: string;
  credentialType: string;
  credentialReference: string;
  submittedAt: string;
  reviewedAt: string | null;
  note: string;
}

export const fetchVerifications = async (status: VerificationStatus): Promise<ApiResult<{ items: VerificationRequest[]; total: number }>> =>
  apiRequest<{ items: VerificationRequest[]; total: number }>(`/api/admin/coach-verifications?status=${status}&limit=100`);

export const approveCoach = (coachId: string) =>
  apiRequest<{ status: VerificationStatus }>(`/api/admin/coach-verifications/${encodeURIComponent(coachId)}/approve`, { method: "POST", body: {} });

export const rejectCoach = (coachId: string, note: string) =>
  apiRequest<{ status: VerificationStatus }>(`/api/admin/coach-verifications/${encodeURIComponent(coachId)}/reject`, { method: "POST", body: { note } });

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
export type UserStatus = "active" | "pending" | "suspended";

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

export interface DirectorySummary { total: number; active: number; pending: number; suspended: number }

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
