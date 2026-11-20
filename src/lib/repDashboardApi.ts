// Browser client for the School Representative Dashboard (server/rep-dashboard.server.ts).
// Read-only. Route used:
//   GET /api/rep/charts      athletes per sport, coaches per sport and requests per month (the Dashboard's charts)
//   GET /api/rep/dashboard   the signed-in representative's own school, its numbers, its pending
//                            coach requests and its recent activity (never another school's)

import { apiRequest, type ApiResult } from "@/auth/authClient";

export type { ApiResult };

export interface PendingCoachRequest {
  id: string;
  name: string;
  sport: string;
  position: string;
  programName: string;
  credentialType: string;
  /** ISO time the coach sent the verification request */
  appliedAt: string;
}

export type ActivityKind =
  | "coach_requested" | "coach_approved" | "coach_rejected"
  | "athlete_connected" | "athlete_applied_coach"
  | "scholarship_posted" | "scholarship_applied";

export interface RepActivity {
  id: string;
  kind: ActivityKind;
  text: string;
  at: string;
}

export interface RepDashboardData {
  rep: { name: string; firstName: string; designation: string };
  school: { name: string; location: string; logoUrl: string; registered: boolean };
  stats: { totalCoaches: number; totalAthletes: number; pendingCoachRequests: number; activeCoaches: number };
  pendingRequests: { items: PendingCoachRequest[]; total: number };
  activities: RepActivity[];
  generatedAt: string;
}

export const fetchRepDashboard = (signal?: AbortSignal): Promise<ApiResult<RepDashboardData>> =>
  apiRequest<RepDashboardData>("/api/rep/dashboard", signal ? { signal } : {});

export interface RepCharts {
  athletesBySport: { sport: string; verified: number; unverified: number }[];
  coachesBySport: { sport: string; count: number }[];
  /** the last six months, oldest first, `month` as YYYY-MM */
  requestsByMonth: { month: string; pending: number; approved: number; rejected: number }[];
}

export const fetchRepCharts = (): Promise<ApiResult<{ charts: RepCharts }>> => apiRequest<{ charts: RepCharts }>("/api/rep/charts");
