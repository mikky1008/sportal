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
