// Browser client for the university suggestions on the coach sign-up (server/university-search.server.ts).
//   GET /api/universities?q=   no sign-in needed; at most 8 schools that already exist on Sportal ({ name, location })
// Only suggestions: the field stays free text, so a school that isn't listed can simply be typed.

import { apiRequest, type ApiResult } from "@/auth/authClient";

export type { ApiResult };

export interface UniversitySuggestion { name: string; location: string }

export const searchUniversities = (q: string, signal?: AbortSignal): Promise<ApiResult<{ items: UniversitySuggestion[] }>> =>
  apiRequest<{ items: UniversitySuggestion[] }>(`/api/universities?q=${encodeURIComponent(q)}`, signal ? { signal } : {});
