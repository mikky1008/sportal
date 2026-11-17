// Browser client for the School Representative's Coach Requests page (server/rep-coach-requests.server.ts).
// Routes used (all limited by the server to requests sent to the signed-in representative's own school):
//   GET  /api/rep/coach-requests                  ?q&status&limit&offset   the school's coach requests
//   GET  /api/rep/coach-requests/:id              one request in full (id = the coach's user id)
//   POST /api/rep/coach-requests/:id/decision     { decision: "approve" | "reject", reason }   reason is required to reject

import { apiRequest, type ApiResult } from "@/auth/authClient";

export type { ApiResult };

export type RequestStatus = "pending" | "approved" | "rejected";

export interface CoachRequest {
  id: string;
  name: string;
  /** null when there is no photo (initials are shown instead) */
  photo: string | null;
  email: string;
  sport: string;
  position: string;
  credentialType: string;
  status: RequestStatus;
  appliedAt: string;
  decidedAt: string | null;
  /** the reason given when it was rejected */
  reason: string;
}

export interface SupportingDocument { label: string; value: string }

export interface CoachRequestDetail extends CoachRequest {
  organization: string;
  programName: string;
  competitionLevel: string;
  yearsExperience: string;
  background: string;
  supportingDocuments: SupportingDocument[];
}

export interface CoachRequestList {
  school: { name: string };
  items: CoachRequest[];
  total: number;
  counts: Record<RequestStatus, number>;
}

export const PAGE_SIZE = 20;
export const REASON_MAX = 500;

export interface RequestFilters {
  q: string;
  status: "" | RequestStatus;
}

export const fetchCoachRequests = (f: RequestFilters, offset = 0, signal?: AbortSignal): Promise<ApiResult<CoachRequestList>> => {
  const p = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(offset) });
  if (f.q.trim()) p.set("q", f.q.trim());
  if (f.status) p.set("status", f.status);
  return apiRequest<CoachRequestList>(`/api/rep/coach-requests?${p}`, signal ? { signal } : {});
};

export const fetchCoachRequest = (id: string): Promise<ApiResult<{ request: CoachRequestDetail }>> =>
  apiRequest<{ request: CoachRequestDetail }>(`/api/rep/coach-requests/${encodeURIComponent(id)}`);

export const decideCoachRequest = (id: string, decision: "approve" | "reject", reason?: string): Promise<ApiResult<{ request: CoachRequestDetail }>> =>
  apiRequest<{ request: CoachRequestDetail }>(`/api/rep/coach-requests/${encodeURIComponent(id)}/decision`, {
    method: "POST",
    body: decision === "reject" ? { decision, reason } : { decision },
  });
