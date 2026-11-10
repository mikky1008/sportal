// Browser client for the coach's session review queue (server/practice-sessions.server.ts).
//   GET  /api/coach/sessions              results the coach's connected athletes asked them to review
//   POST /api/coach/sessions/:id/verify   mark one Coach-Verified (it then counts in rankings)

import { apiRequest, type ApiResult } from "@/auth/authClient";

export type { ApiResult };

export interface ReviewItem {
  id: string;
  /** YYYY-MM-DD */
  date: string;
  skill: string;
  result: number;
  consistency: number | null;
  status: string;
  athlete: { id: string; displayName: string };
}

export const fetchReviewQueue = async (): Promise<ApiResult<ReviewItem[]>> => {
  const r = await apiRequest<{ items: ReviewItem[] }>("/api/coach/sessions");
  return r.ok ? { ...r, data: r.data.items } : r;
};

export const verifySession = (id: string) =>
  apiRequest<{ session: { id: string; status: string } }>(`/api/coach/sessions/${encodeURIComponent(id)}/verify`, { method: "POST" });
