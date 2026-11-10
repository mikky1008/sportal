// Browser client for athlete applications to a coach's program ("show interest")
// (server/coach-applications.server.ts).
//   POST /api/coach-applications               an athlete shows interest in a verified coach
//   GET  /api/coach-applications               a coach's received applications
//   POST /api/coach-applications/:id/status    a coach marks one reviewed / dismissed

import { apiRequest, type ApiResult } from "@/auth/authClient";

export type { ApiResult };

export type CoachApplicationStatus = "new" | "reviewed" | "dismissed";

export interface ReceivedApplication {
  id: string;
  status: CoachApplicationStatus;
  createdAt: string;
  athlete: { id: string; displayName: string; sport: string; school: string };
  hasShowcase: boolean;
  relationship: "connected" | "request_sent" | "request_received" | "none";
}

export const showInterestInCoach = (coachId: string) =>
  apiRequest<{ application: { id: string; status: CoachApplicationStatus } }>("/api/coach-applications", { method: "POST", body: { coachId } });

export const fetchReceivedApplications = async (): Promise<ApiResult<ReceivedApplication[]>> => {
  const r = await apiRequest<{ received: ReceivedApplication[] }>("/api/coach-applications");
  return r.ok ? { ...r, data: r.data.received } : r;
};

export const setCoachApplicationStatus = (id: string, status: "reviewed" | "dismissed") =>
  apiRequest<{ status: CoachApplicationStatus }>(`/api/coach-applications/${encodeURIComponent(id)}/status`, { method: "POST", body: { status } });
