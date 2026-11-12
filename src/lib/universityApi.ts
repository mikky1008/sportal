// Browser client for the coach's My University page (server/university.server.ts). Read-only: there is
// nothing here that changes university information or other coaches' accounts. Routes used:
//   GET /api/coach/university            the coach's own university (or why they have none)
//   GET /api/coach/university/coaches    verified, active coaches of that university
//   GET /api/coach/university/athletes   athletes with an approved affiliation to it

import { apiRequest, type ApiResult } from "@/auth/authClient";

export type { ApiResult };

export type NotAffiliatedReason = "not_verified" | "no_university";

export interface University {
  id: string;
  name: string;
  /** "" when the university has no logo yet */
  logoUrl: string;
  location: string;
  description: string;
  website: string;
}

export type UniversityInfo = { affiliated: true; university: University } | { affiliated: false; reason: NotAffiliatedReason };

export interface UniversityCoach {
  id: string;
  name: string;
  sport: string;
  position: string;
  programName: string;
  status: "verified";
  accountStatus: "active";
  isYou: boolean;
}

export interface UniversityAthlete {
  id: string;
  name: string;
  sport: string;
  position: string;
  affiliationStatus: "approved";
  affiliatedSince: string;
}

export interface UniversityList<T> {
  affiliated: boolean;
  reason?: NotAffiliatedReason;
  items: T[];
  total: number;
}

export const PAGE_SIZE = 20;

export const fetchUniversity = (signal?: AbortSignal): Promise<ApiResult<UniversityInfo>> =>
  apiRequest<UniversityInfo>("/api/coach/university", signal ? { signal } : {});

export const fetchUniversityCoaches = (offset = 0, signal?: AbortSignal): Promise<ApiResult<UniversityList<UniversityCoach>>> =>
  apiRequest<UniversityList<UniversityCoach>>(`/api/coach/university/coaches?limit=${PAGE_SIZE}&offset=${offset}`, signal ? { signal } : {});

export const fetchUniversityAthletes = (offset = 0, signal?: AbortSignal): Promise<ApiResult<UniversityList<UniversityAthlete>>> =>
  apiRequest<UniversityList<UniversityAthlete>>(`/api/coach/university/athletes?limit=${PAGE_SIZE}&offset=${offset}`, signal ? { signal } : {});
