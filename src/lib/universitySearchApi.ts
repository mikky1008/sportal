// Browser client for the university suggestions on the coach sign-up (server/university-search.server.ts).
//   GET /api/universities?q=   no sign-in needed; at most 8 schools that have an approved representative ({ name, location })
// A coach can only sign up for one of these; the server checks it again when the account is created.

import { apiRequest, type ApiResult } from "@/auth/authClient";

export type { ApiResult };

export interface UniversitySuggestion { name: string; location: string }

export const searchUniversities = (q: string, signal?: AbortSignal): Promise<ApiResult<{ items: UniversitySuggestion[] }>> =>
  apiRequest<{ items: UniversitySuggestion[] }>(`/api/universities?q=${encodeURIComponent(q)}`, signal ? { signal } : {});
