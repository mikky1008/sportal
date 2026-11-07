// Session history with persistence.
//
// PROTOTYPE LIMIT: this lives in the browser's localStorage, so anyone can edit it in devtools.
// The rule "only a coach can mark a session Coach-Verified" is enforced here in code, but it can
// only be *trusted* once the same check runs on the server. Swap this module's storage for an API
// and keep the same function names.

import { useSyncExternalStore } from "react";
import { sessions as seedSessions } from "@/data/mock";
import { sessionStatusMeta } from "@/lib/verification";
import type { PerformanceSession, SessionStatus, UserRole } from "@/types";

const KEY = "sportal.sessions.v1";

type StorageLike = Pick<Storage, "getItem" | "setItem">;

export interface Actor {
  role: UserRole;
  name: string;
}

export type NewSession = Omit<PerformanceSession, "id" | "date" | "verifiedBy"> & { date?: string };

function isSession(x: unknown): x is PerformanceSession {
  if (!x || typeof x !== "object") return false;
  const s = x as Record<string, unknown>;
  return (
    typeof s["id"] === "string" &&
    typeof s["date"] === "string" &&
    typeof s["skill"] === "string" &&
    typeof s["result"] === "number" &&
    (typeof s["consistency"] === "number" || s["consistency"] === null) &&
    typeof s["status"] === "string" &&
    s["status"] in sessionStatusMeta
  );
}

/** A "Coach-Verified" record that names no coach can't be trusted, so it is treated as pending. */
function sanitize(s: PerformanceSession): PerformanceSession {
  if (s.status === "Coach-Verified" && !s.verifiedBy) return { ...s, status: "Pending Review" };
  return s;
}

const SHORT_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2026-10-29" -> "Oct 29". Plain string maths, so no time zone can shift the day. */
export function shortDate(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${SHORT_MONTHS[Number(m) - 1] ?? m} ${d}`;
}

function isoDay(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function createSessionStore(
  storage: StorageLike | null,
  seed: PerformanceSession[],
  now: () => Date = () => new Date(),
) {
  let cache: PerformanceSession[] | null = null;
  const listeners = new Set<() => void>();

  function load(): PerformanceSession[] {
    if (!storage) return seed;
    try {
      const raw = storage.getItem(KEY);
      if (!raw) return seed;
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) return seed;
      return parsed.filter(isSession).map(sanitize);
    } catch {
      return seed;
    }
  }

  function commit(next: PerformanceSession[]) {
    cache = next;
    try {
      storage?.setItem(KEY, JSON.stringify(next));
    } catch {
      // storage full or blocked: keep working in memory
    }
    listeners.forEach((l) => l());
  }

  function getSnapshot() {
    if (cache === null) cache = load();
    return cache;
  }

  function update(id: string, fn: (s: PerformanceSession) => PerformanceSession) {
    const list = getSnapshot();
    if (!list.some((s) => s.id === id)) throw new Error(`Unknown session: ${id}`);
    commit(list.map((s) => (s.id === id ? fn(s) : s)));
  }

  return {
    getSnapshot,
    getServerSnapshot: () => seed,
    subscribe(l: () => void) {
      listeners.add(l);
      return () => {
        listeners.delete(l);
      };
    },

    /** New sessions can never arrive already Coach-Verified. */
    add(input: NewSession): PerformanceSession {
      if (input.status === "Coach-Verified")
        throw new Error("A new session cannot start as Coach-Verified.");
      const { date, isoDate, ...rest } = input;
      const day = isoDate ?? isoDay(now());
      const session: PerformanceSession = {
        ...rest,
        id: `s-${now().getTime()}-${getSnapshot().length}`,
        isoDate: day,
        date: date ?? shortDate(day),
      };
      commit([session, ...getSnapshot()]);
      return session;
    },

    /** Athlete asks a coach to look at an AI-assessed or self-reported result. */
    requestReview(id: string) {
      update(id, (s) =>
        s.status === "AI-Assessed" || s.status === "Self-Reported"
          ? { ...s, status: "Pending Review" }
          : s,
      );
    },

    /** Only a coach can verify. Throws for anyone else. */
    verify(id: string, actor: Actor) {
      if (actor.role !== "coach") throw new Error("Only a coach can verify a session.");
      if (!actor.name.trim()) throw new Error("A verifying coach must be named.");
      update(id, (s) => ({
        ...s,
        status: "Coach-Verified" satisfies SessionStatus,
        verifiedBy: actor.name,
      }));
    },

    reset() {
      commit(seed);
    },
  };
}

export const sessionStore = createSessionStore(
  typeof window === "undefined" ? null : safeLocalStorage(),
  seedSessions,
);

function safeLocalStorage(): StorageLike | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function useSessions(): PerformanceSession[] {
  return useSyncExternalStore(
    sessionStore.subscribe,
    sessionStore.getSnapshot,
    sessionStore.getServerSnapshot,
  );
}
