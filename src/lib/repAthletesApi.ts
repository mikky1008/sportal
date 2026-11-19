// Browser client for the School Representative's My Athletes page (server/rep-athletes.server.ts).
// Read-only. Routes used (all limited by the server to athletes of the signed-in representative's own school):
//   GET /api/rep/athletes              ?q&sport&status&limit&offset   the school's athletes
//   GET /api/rep/athletes/:id          one athlete's profile and recorded achievements
//   GET /api/rep/athletes/:id/photo    the athlete's approved profile photo (image bytes)

import { Preferences } from "@capacitor/preferences";
import { API_URL, apiRequest, type ApiResult } from "@/auth/authClient";

export type { ApiResult };

export type AthleteVerification = "verified" | "unverified";

export interface RepAthlete {
  id: string;
  name: string;
  hasPhoto: boolean;
  photoVersion: number;
  sport: string;
  position: string;
  yearLevel: string;
  /** verified coach(es) of this school connected to the athlete */
  coaches: string[];
  verification: AthleteVerification;
}

export interface RepAthleteDetail extends RepAthlete {
  bio: string;
  teamStatus: string;
  teamName: string;
  skills: string[];
  achievements: { id: string; title: string; year: string }[];
  verifiedSessions: number;
  affiliatedSince: string | null;
}

export interface RepAthleteList {
  school: { name: string };
  items: RepAthlete[];
  total: number;
  /** every sport among the school's athletes (for the filter), whatever the current search */
  sports: string[];
  counts: Record<AthleteVerification, number>;
}

export const PAGE_SIZE = 20;

export interface AthleteFilters {
  q: string;
  sport: string;
  status: "" | AthleteVerification;
}

export const fetchRepAthletes = (f: AthleteFilters, offset = 0, signal?: AbortSignal): Promise<ApiResult<RepAthleteList>> => {
  const p = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(offset) });
  if (f.q.trim()) p.set("q", f.q.trim());
  if (f.sport) p.set("sport", f.sport);
  if (f.status) p.set("status", f.status);
  return apiRequest<RepAthleteList>(`/api/rep/athletes?${p}`, signal ? { signal } : {});
};

export const fetchRepAthlete = (id: string): Promise<ApiResult<{ athlete: RepAthleteDetail }>> =>
  apiRequest<{ athlete: RepAthleteDetail }>(`/api/rep/athletes/${encodeURIComponent(id)}`);

// The photo route needs the sign-in token, which an <img src> can't send, so the image is fetched
// with the token and shown from a local object URL. Same storage key the sign-in code uses.
const TOKEN_KEY = "sportal.session.token";
const photoRequests = new Map<string, Promise<string | null>>();

async function loadPhoto(id: string): Promise<string | null> {
  try {
    const { value } = await Preferences.get({ key: TOKEN_KEY });
    if (!value) return null;
    const res = await fetch(`${API_URL}/api/rep/athletes/${encodeURIComponent(id)}/photo`, { headers: { Authorization: `Bearer ${value}` } });
    if (!res.ok) return null;
    const blob = await res.blob();
    if (!/^image\/(png|jpeg|webp)$/.test(blob.type)) return null;
    return URL.createObjectURL(blob);
  } catch {
    return null;
  }
}

/**
 * An object URL for the athlete's approved photo, or null when there is none. One request per photo
 * version, shared by everything that asks for it at the same time (the table and the phone cards both
 * show the avatar) and remembered afterwards. A failed request is forgotten so it can be tried again.
 */
export function fetchAthletePhoto(id: string, version: number): Promise<string | null> {
  const key = `${id}:${version}`;
  let p = photoRequests.get(key);
  if (!p) {
    p = loadPhoto(id).then((url) => { if (!url) photoRequests.delete(key); return url; });
    photoRequests.set(key, p);
  }
  return p;
}
