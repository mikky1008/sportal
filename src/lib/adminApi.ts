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
