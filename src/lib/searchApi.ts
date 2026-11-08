// Browser client for the header search (server/search.server.ts).
//   GET /api/search?q=...   scholarships for everyone; athletes only for verified coaches

import { apiRequest, type ApiResult } from "@/auth/authClient";
import type { ScholarshipView } from "@/lib/scholarshipsApi";

export interface SearchAthlete {
  id: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
}

export interface SearchResults {
  athletes: SearchAthlete[];
  scholarships: ScholarshipView[];
}

export const MIN_SEARCH_CHARS = 2;

export const searchEverything = (q: string, signal?: AbortSignal): Promise<ApiResult<SearchResults>> =>
  apiRequest<SearchResults>(`/api/search?q=${encodeURIComponent(q)}&limit=5`, signal ? { signal } : {});
