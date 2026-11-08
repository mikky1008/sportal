// The signed-in athlete's practice sessions, loaded from and saved to the API
// (GET / POST /api/athletes/me/sessions). Nothing is kept in the browser any more.
//
// The SERVER decides every new session's status (see server/practice-sessions.server.ts): a session
// can be created AI-Assessed, Self-Reported or Pending Review, never Coach-Verified. Only a verified,
// connected coach can verify a session, and that happens through the coach endpoints, not here.

import { useSyncExternalStore } from "react";
import { apiRequest, type ApiResult } from "@/auth/authClient";
import type { PerformanceSession, SessionStatus, SkillId } from "@/types";

export type SessionsLoadState = "idle" | "loading" | "ready" | "error";

/** What the server sends for one session. */
export interface SessionView {
  id: string;
  date: string; // YYYY-MM-DD
  skill: string;
  result: number;
  consistency: number | null;
  status: SessionStatus;
  verifiedBy?: string;
  simulated?: true;
}

/** What a page hands over to log a session. The server works out the status from these. */
export interface NewSession {
  skill: SkillId;
  result: number;
  /** null for a hand-entered result: nothing was measured */
  consistency: number | null;
  /** "ai": the result came from an analysis. "manual": the athlete typed it in. */
  source: "ai" | "manual";
  /** the analysis flagged the result for a coach to look at */
  needsReview?: boolean;
  /** the athlete asked for a coach to review it */
  requestedReview?: boolean;
  /** true when the numbers came from the simulated prototype AI */
  simulated?: boolean;
}

export interface SessionsApi {
  list(): Promise<ApiResult<{ items: SessionView[] }>>;
  create(input: NewSession): Promise<ApiResult<{ session: SessionView }>>;
  requestReview(id: string): Promise<ApiResult<{ session: SessionView }>>;
}

const httpApi: SessionsApi = {
  list: () => apiRequest<{ items: SessionView[] }>("/api/athletes/me/sessions"),
  create: (input) => apiRequest<{ session: SessionView }>("/api/athletes/me/sessions", { method: "POST", body: input }),
  requestReview: (id) => apiRequest<{ session: SessionView }>(`/api/athletes/me/sessions/${encodeURIComponent(id)}/request-review`, { method: "POST" }),
};

const SHORT_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2026-10-29" → "Oct 29" (no time zone maths: the date is a plain calendar day). */
export function shortDate(iso: string): string {
  const [, m, d] = iso.split("-");
  const month = SHORT_MONTHS[Number(m) - 1];
  return month && d ? `${month} ${d}` : iso;
}

export function sessionFromView(v: SessionView): PerformanceSession {
  return {
    id: v.id,
    date: shortDate(v.date),
    isoDate: v.date,
    skill: v.skill as SkillId,
    result: v.result,
    consistency: v.consistency,
    status: v.status,
    ...(v.verifiedBy ? { verifiedBy: v.verifiedBy } : {}),
    ...(v.simulated ? { simulated: true } : {}),
  };
}

interface State { items: PerformanceSession[]; load: SessionsLoadState; loadError: string | null }

export function createSessionStore(api: SessionsApi = httpApi) {
  const listeners = new Set<() => void>();
  let generation = 0;
  const NONE: PerformanceSession[] = [];
  const fresh = (): State => ({ items: NONE, load: "idle", loadError: null });
  let state: State = fresh();
  const set = (next: State) => {
    state = next;
    listeners.forEach((l) => l());
  };

  return {
    getSnapshot: () => state.items,
    getServerSnapshot: () => NONE,
    getLoadSnapshot: () => state.load,
    getServerLoadSnapshot: (): SessionsLoadState => "idle",
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

    /** Loads the signed-in athlete's sessions. Call it only for student-athlete accounts. */
    async load(): Promise<void> {
      const mine = ++generation;
      set({ ...state, load: "loading", loadError: null });
      const res = await api.list();
      if (mine !== generation) return;
      if (res.ok) set({ items: res.data.items.map(sessionFromView), load: "ready", loadError: null });
      else set({ ...state, load: "error", loadError: res.message });
    },

    /** Saves a new session. Throws an Error with the server's message when it can't be saved. */
    async add(input: NewSession): Promise<PerformanceSession> {
      const mine = generation;
      const res = await api.create(input);
      if (!res.ok) throw new Error(res.fieldErrors ? Object.values(res.fieldErrors)[0] ?? res.message : res.message);
      const session = sessionFromView(res.data.session);
      if (mine === generation) set({ ...state, items: [session, ...state.items.filter((s) => s.id !== session.id)] });
      return session;
    },

    /** Athlete asks a coach to look at an AI-assessed or self-reported result. */
    async requestReview(id: string): Promise<PerformanceSession> {
      const mine = generation;
      const res = await api.requestReview(id);
      if (!res.ok) throw new Error(res.message);
      const session = sessionFromView(res.data.session);
      if (mine === generation) set({ ...state, items: state.items.map((s) => (s.id === session.id ? session : s)) });
      return session;
    },
  };
}

export const sessionStore = createSessionStore();

export function useSessions(): PerformanceSession[] {
  return useSyncExternalStore(sessionStore.subscribe, sessionStore.getSnapshot, sessionStore.getServerSnapshot);
}

export function useSessionsLoad(): SessionsLoadState {
  return useSyncExternalStore(sessionStore.subscribe, sessionStore.getLoadSnapshot, sessionStore.getServerLoadSnapshot);
}
