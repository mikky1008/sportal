// Browser client for the School Representative's My Coaches page (server/rep-coaches.server.ts).
// Routes used (all limited by the server to the signed-in representative's own school):
//   GET  /api/rep/coaches                     ?q&sport&status&limit&offset   the school's coaches
//   GET  /api/rep/coaches/:id                 one coach's profile
//   POST /api/rep/coaches/:id/affiliation     { action: "remove" | "restore" }

import { apiRequest, type ApiResult } from "@/auth/authClient";

export type { ApiResult };

export type AffiliationStatus = "affiliated" | "pending" | "removed";

export interface RepCoach {
  id: string;
  name: string;
  email: string;
  /** null when there is no photo (initials are shown instead) */
  photo: string | null;
  sport: string;
  position: string;
  status: AffiliationStatus;
  /** false while the account is suspended */
  accountActive: boolean;
}

export interface RepCoachDetail extends RepCoach {
  programName: string;
  competitionLevel: string;
  yearsExperience: string;
  background: string;
  certifications: string;
  credentialType: string;
  athletesConnected: number;
  appliedAt: string;
  verifiedAt: string | null;
}

export interface RepCoachList {
  school: { name: string };
  items: RepCoach[];
  total: number;
  /** every sport among the school's coaches (for the filter), whatever the current search */
  sports: string[];
  counts: Record<AffiliationStatus, number>;
}

export const PAGE_SIZE = 20;

export interface CoachFilters {
  q: string;
  sport: string;
  status: "" | AffiliationStatus;
}

export const fetchRepCoaches = (f: CoachFilters, offset = 0, signal?: AbortSignal): Promise<ApiResult<RepCoachList>> => {
  const p = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(offset) });
  if (f.q.trim()) p.set("q", f.q.trim());
  if (f.sport) p.set("sport", f.sport);
  if (f.status) p.set("status", f.status);
  return apiRequest<RepCoachList>(`/api/rep/coaches?${p}`, signal ? { signal } : {});
};

export const fetchRepCoach = (id: string): Promise<ApiResult<{ coach: RepCoachDetail }>> =>
  apiRequest<{ coach: RepCoachDetail }>(`/api/rep/coaches/${encodeURIComponent(id)}`);

export const setCoachAffiliation = (id: string, action: "remove" | "restore"): Promise<ApiResult<{ coach: RepCoachDetail }>> =>
  apiRequest<{ coach: RepCoachDetail }>(`/api/rep/coaches/${encodeURIComponent(id)}/affiliation`, { method: "POST", body: { action } });
