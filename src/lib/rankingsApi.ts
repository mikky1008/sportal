// Browser client for the rankings API (server/rankings.server.ts). Every function resolves to an
// ApiResult and never throws. Routes used:
//   GET /api/rankings            ?sport&metric&municipality&school&limit
//   GET /api/rankings/headline   ?ids=a,b,c
//   GET / PUT /api/athletes/me/visibility

import { apiRequest, type ApiResult } from "@/auth/authClient";
import type { Ranking } from "@/types";

export interface RankingsPage {
  sport: string;
  metric: string;
  minCountedSessions: number;
  rows: Ranking[];
  /** how many athletes are ranked in this view (rows may be cut to the top 100) */
  total: number;
  notEnoughSessions: number;
  /** the signed-in athlete's own standing in this view; absent for coaches and other roles */
  me?: { row: Ranking | null; counted: number; total: number };
  options: { provinces: string[]; municipalities: string[]; schools: string[] };
}

export interface HeadlinePage {
  /** null when the signed-in account is not an athlete; position null = not ranked yet */
  me: { position: number | null; sport: string; metric: string; counted: number } | null;
  ranks: Record<string, number>;
}

export type { ApiResult };

export const fetchRankings = (
  f: { sport: string; metric: string; municipality?: string; school?: string; category?: string },
  signal?: AbortSignal,
): Promise<ApiResult<RankingsPage>> => {
  const p = new URLSearchParams({ sport: f.sport, metric: f.metric });
  if (f.municipality) p.set("municipality", f.municipality);
  if (f.school) p.set("school", f.school);
  if (f.category) p.set("category", f.category);
  return apiRequest<RankingsPage>(`/api/rankings?${p}`, signal ? { signal } : {});
};

export const fetchHeadline = (ids: string[] = [], signal?: AbortSignal): Promise<ApiResult<HeadlinePage>> =>
  apiRequest<HeadlinePage>(`/api/rankings/headline${ids.length ? `?ids=${ids.map(encodeURIComponent).join(",")}` : ""}`, signal ? { signal } : {});

/** Whether the signed-in athlete shows up in other people's rankings. */
export const getShowcaseVisibility = () => apiRequest<{ visible: boolean }>("/api/athletes/me/visibility");
export const setShowcaseVisibility = (visible: boolean) =>
  apiRequest<{ visible: boolean }>("/api/athletes/me/visibility", { method: "PUT", body: { visible } });
