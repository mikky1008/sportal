// Browser client for the header search (server/search.server.ts).
//   GET /api/search?q=...   scholarships for everyone; athletes only for verified coaches

import { apiRequest, type ApiResult } from "@/auth/authClient";
import type { ScholarshipView } from "@/lib/scholarshipsApi";

export type Relationship = "connected" | "request_sent" | "request_received" | "none";

export interface SearchAthlete {
  id: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  sport: string;
  school: string;
  /** how this athlete relates to the signed-in coach */
  relationship: Relationship;
  /** a showcase page exists for this athlete (started profile and not hidden) */
  hasShowcase: boolean;
}

export interface SearchCoach {
  id: string;
  displayName: string;
  organization: string;
  sport: string;
  /** connected = already your coach, applied = you showed interest */
  relationship: "connected" | "applied" | "none";
}

export interface SearchResults {
  athletes: SearchAthlete[];
  scholarships: ScholarshipView[];
  /** verified coaches an athlete can show interest in (athletes only) */
  coaches: SearchCoach[];
}

export const MIN_SEARCH_CHARS = 2;

export const searchEverything = (q: string, signal?: AbortSignal): Promise<ApiResult<SearchResults>> =>
  apiRequest<SearchResults>(`/api/search?q=${encodeURIComponent(q)}&limit=5`, signal ? { signal } : {});

/** Sends a connection request to an athlete found in the search. */
export const sendConnectionRequest = (userId: string) =>
  apiRequest<{ connection: { id: string; status: string } }>("/api/connections/requests", { method: "POST", body: { userId } });
