// Browser client for the School Representative's Settings and top bar (server/rep-settings.server.ts).
// Every route acts on the signed-in representative's OWN account only. Routes used:
//   GET  /api/rep/header                 name, photo and how many coach requests are waiting
//   GET|PUT /api/rep/settings/profile    first name, last name, designation (school, email, username are read-only)
//   PUT|DELETE /api/rep/settings/avatar  the profile photo
//   POST /api/rep/settings/password      change the password (other devices are signed out)

import { useEffect, useState } from "react";
import { apiRequest, type ApiResult } from "@/auth/authClient";

export type { ApiResult };

export interface RepProfile {
  displayName: string;
  firstName: string;
  lastName: string;
  designation: string;
  school: string;
  email: string;
  username: string;
  avatar: string | null;
  createdAt: string;
  lastLoginAt: string | null;
  passwordChangedAt: string | null;
}

export interface RepHeader {
  displayName: string;
  avatar: string | null;
  pendingCoachRequests: number;
}

export const fetchRepProfile = () => apiRequest<{ profile: RepProfile }>("/api/rep/settings/profile");
export const saveRepProfile = (b: { firstName: string; lastName: string; designation: string }) =>
  apiRequest<{ profile: RepProfile }>("/api/rep/settings/profile", { method: "PUT", body: b });
export const saveRepAvatar = (dataUrl: string) => apiRequest<{ profile: RepProfile }>("/api/rep/settings/avatar", { method: "PUT", body: { dataUrl } });
export const removeRepAvatar = () => apiRequest<{ profile: RepProfile }>("/api/rep/settings/avatar", { method: "DELETE" });
export const changeRepPassword = (b: { currentPassword: string; newPassword: string; confirmPassword: string }) =>
  apiRequest<{ otherSessionsSignedOut: number }>("/api/rep/settings/password", { method: "POST", body: b });

/* ---- the top bar's summary, shared by everything that shows it ---- */

const REFRESH_MS = 60_000;
let cached: { owner: string; header: RepHeader } | null = null;
let inflight: Promise<void> | null = null;
let watchers = 0;
let timer: ReturnType<typeof setInterval> | null = null;
const listeners = new Set<() => void>();

/** Loads the summary once, however many parts of the page ask at the same moment. */
export function refreshRepHeader(owner: string): Promise<void> {
  if (!inflight) {
    inflight = apiRequest<{ header: RepHeader }>("/api/rep/header")
      .then((r) => {
        if (r.ok) { cached = { owner, header: r.data.header }; listeners.forEach((fn) => fn()); }
      })
      .catch(() => undefined)
      .finally(() => { inflight = null; });
  }
  return inflight;
}

let currentOwner = "";
/** Call after something that changes the name, the photo or the waiting requests, so the bar updates now. */
export const notifyRepHeaderChanged = () => { if (currentOwner) void refreshRepHeader(currentOwner); };

/**
 * The representative's name, photo and waiting-request count for the top bar and the phone tab bar.
 * One shared copy; refreshed on load, every minute, when the window regains focus, and on request.
 * `ownerId` keeps one person's summary from showing for the next person who signs in.
 */
export function useRepHeader(ownerId: string | undefined): RepHeader | null {
  const [, force] = useState(0);
  useEffect(() => {
    if (!ownerId) return;
    currentOwner = ownerId;
    if (cached && cached.owner !== ownerId) cached = null;
    const rerender = () => force((n) => n + 1);
    listeners.add(rerender);
    watchers += 1;
    void refreshRepHeader(ownerId);
    const onFocus = () => void refreshRepHeader(ownerId);
    window.addEventListener("focus", onFocus);
    if (!timer) timer = setInterval(() => { if (currentOwner) void refreshRepHeader(currentOwner); }, REFRESH_MS);
    return () => {
      listeners.delete(rerender);
      window.removeEventListener("focus", onFocus);
      watchers -= 1;
      if (watchers <= 0 && timer) { clearInterval(timer); timer = null; watchers = 0; }
    };
  }, [ownerId]);
  return cached && ownerId && cached.owner === ownerId ? cached.header : null;
}
