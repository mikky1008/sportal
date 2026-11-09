// The signed-in athlete's profile, loaded from and saved to the API (GET / PUT /api/athletes/me/profile).
// Nothing is kept in the browser any more: the same profile shows on every device.
//
// Only the fields in ProfileDraft can be edited. rank, performanceScore, consistency, municipality,
// province, id and role belong to the system: the server returns them but never accepts them.
//
// The rules (limits, validateProfile, height / weight helpers) live in athleteProfileRules.ts, the
// same file the server runs, so a draft that passes here passes there.

import { useSyncExternalStore } from "react";
import { apiRequest, type ApiResult } from "@/auth/authClient";
import { activeAccount } from "@/lib/accountScope";
import type { Athlete, DirectoryAthlete, TeamStatus } from "@/types";
import {
  ProfileValidationError, formatHeight, formatWeight, hasErrors, parseHeightCm, parseWeightKg, validateProfile,
  type ProfileDraft, type ProfileErrors,
} from "@/lib/athleteProfileRules";

export * from "@/lib/athleteProfileRules";

export type ProfileLoadState = "idle" | "loading" | "ready" | "error";

/** What GET / PUT /api/athletes/me/profile returns. */
export interface AthleteProfileView {
  id: string;
  firstName: string;
  lastName: string;
  sport: string;
  position: string;
  school: string;
  year: string;
  heightCm: number | null;
  weightKg: number | null;
  teamStatus: TeamStatus | "";
  teamName: string;
  bio: string;
  achievements: { title: string; year: string }[];
  rank: number | null;
  performanceScore: number | null;
  consistency: number | null;
  municipality: string;
  province: string;
  category: string;
}

export interface ProfileApi {
  get(): Promise<ApiResult<{ profile: AthleteProfileView }>>;
  put(draft: ProfileDraft): Promise<ApiResult<{ profile: AthleteProfileView }>>;
}

const httpApi: ProfileApi = {
  get: () => apiRequest<{ profile: AthleteProfileView }>("/api/athletes/me/profile"),
  put: (draft) => apiRequest<{ profile: AthleteProfileView }>("/api/athletes/me/profile", { method: "PUT", body: draft }),
};

// ---------- conversion ----------

export function toDraft(a: Athlete): ProfileDraft {
  const h = parseHeightCm(a.height);
  const w = parseWeightKg(a.weight);
  return {
    firstName: a.firstName,
    lastName: a.lastName,
    sport: a.sport,
    position: a.position,
    school: a.school,
    municipality: a.municipality ?? "",
    category: a.category ?? "",
    year: a.year,
    heightCm: h === null ? "" : String(h),
    weightKg: w === null ? "" : String(w),
    teamStatus: a.teamStatus,
    teamName: a.teamName ?? "",
    bio: a.bio,
    achievements: a.achievements.map((x) => ({ ...x })),
  };
}

/** What a brand-new account starts with: its name, and nothing else filled in. */
export function blankAthlete(firstName: string, lastName: string, id = ""): Athlete {
  return {
    id, role: "athlete", firstName, lastName,
    sport: "", position: "", school: "", year: "", height: "", weight: "", bio: "",
    rank: 0, performanceScore: 0, consistency: 0,
    teamStatus: "" as TeamStatus, teamName: "", achievements: [],
  };
}

export function athleteFromView(v: AthleteProfileView): Athlete {
  return {
    id: v.id,
    role: "athlete",
    firstName: v.firstName,
    lastName: v.lastName,
    sport: v.sport,
    position: v.position,
    school: v.school,
    year: v.year,
    height: v.heightCm === null ? "" : formatHeight(v.heightCm),
    weight: v.weightKg === null ? "" : formatWeight(v.weightKg),
    bio: v.bio,
    rank: v.rank ?? 0,
    performanceScore: v.performanceScore ?? 0,
    consistency: v.consistency ?? 0,
    teamStatus: v.teamStatus as TeamStatus,
    teamName: v.teamName,
    ...(v.municipality ? { municipality: v.municipality } : {}),
    ...(v.province ? { province: v.province } : {}),
    ...(v.category ? { category: v.category } : {}),
    achievements: v.achievements.map((a) => ({ title: a.title, year: a.year })),
  };
}

/** Turns the server's { "field": message, "achievements.2": message } back into the form's error shape. */
function toProfileErrors(fieldErrors: Record<string, string>): ProfileErrors {
  const out: Record<string, unknown> = {};
  const rows: string[] = [];
  for (const [k, msg] of Object.entries(fieldErrors)) {
    const m = /^achievements\.(\d+)$/.exec(k);
    if (m) rows[Number(m[1])] = msg;
    else out[k] = msg;
  }
  if (rows.length > 0) out["achievements"] = Array.from(rows, (r) => r ?? "");
  return out as ProfileErrors;
}

// ---------- store ----------

interface State { athlete: Athlete; load: ProfileLoadState; loadError: string | null }

export function createProfileStore(api: ProfileApi = httpApi, now: () => Date = () => new Date()) {
  const listeners = new Set<() => void>();
  let generation = 0;

  function blank(): Athlete {
    const acct = activeAccount();
    return acct ? blankAthlete(acct.firstName, acct.lastName, acct.id) : blankAthlete("", "");
  }
  const fresh = (): State => ({ athlete: blank(), load: "idle", loadError: null });
  let state: State = fresh();
  const server: State = { athlete: blankAthlete("", ""), load: "idle", loadError: null };
  const set = (next: State) => {
    state = next;
    listeners.forEach((l) => l());
  };

  return {
    /** The athlete (blank until the server answers). */
    getSnapshot: () => state.athlete,
    getServerSnapshot: () => server.athlete,
    getLoadSnapshot: () => state.load,
    getServerLoadSnapshot: () => server.load,
    subscribe(l: () => void) {
      listeners.add(l);
      return () => {
        listeners.delete(l);
      };
    },

    /** Forget everything (sign in, sign out, new account). */
    refresh() {
      generation++;
      set(fresh());
    },

    /** Loads the signed-in athlete's profile. Call it only for student-athlete accounts. */
    async load(): Promise<void> {
      const mine = ++generation;
      set({ ...state, load: "loading", loadError: null });
      const res = await api.get();
      if (mine !== generation) return; // signed out, or a newer load took over
      if (res.ok) set({ athlete: athleteFromView(res.data.profile), load: "ready", loadError: null });
      else set({ ...state, load: "error", loadError: res.message });
    },

    /**
     * Validates, then saves to the server. Throws ProfileValidationError (nothing is saved) when anything
     * is invalid, and a plain Error with the server's message when the save itself fails.
     */
    async save(draft: ProfileDraft): Promise<Athlete> {
      const errors = validateProfile(draft, now());
      if (hasErrors(errors)) throw new ProfileValidationError(errors);
      const mine = generation;
      const res = await api.put(draft);
      if (!res.ok) {
        if (res.fieldErrors) throw new ProfileValidationError(toProfileErrors(res.fieldErrors));
        throw new Error(res.message);
      }
      const athlete = athleteFromView(res.data.profile);
      if (mine === generation) set({ athlete, load: "ready", loadError: null });
      return athlete;
    },
  };
}

export const profileStore = createProfileStore();

/** The signed-in athlete's saved profile (blank, apart from their name, until it has loaded). */
export function useAthleteProfile(): Athlete {
  return useSyncExternalStore(profileStore.subscribe, profileStore.getSnapshot, profileStore.getServerSnapshot);
}

/** Where the load from the server stands. Forms key themselves on this so they start from the saved profile. */
export function useProfileLoad(): ProfileLoadState {
  return useSyncExternalStore(profileStore.subscribe, profileStore.getLoadSnapshot, profileStore.getServerLoadSnapshot);
}

/**
 * Until the directory comes from the API, the signed-in athlete appears in the sample directory as the
 * entry below. This overlays their saved profile onto that entry.
 */
export const OWN_DIRECTORY_ID = "a-001";

export function withProfile<T extends DirectoryAthlete>(entry: T, profile: Athlete): T {
  if (entry.id !== OWN_DIRECTORY_ID) return entry;
  return {
    ...entry,
    firstName: profile.firstName,
    lastName: profile.lastName,
    sport: profile.sport,
    position: profile.position,
    school: profile.school,
    year: profile.year,
    height: profile.height,
    bio: profile.bio,
    teamStatus: profile.teamStatus,
    ...(profile.teamName !== undefined ? { teamName: profile.teamName } : {}),
    achievements: profile.achievements,
  };
}
