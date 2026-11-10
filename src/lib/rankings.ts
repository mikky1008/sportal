// Rankings are computed from athletes' recorded sessions — nothing here is a fixed table.
//
// Rules (kept in one place so the page, dashboard and recruiting views always agree):
//  - Only sessions that are Coach-Verified or AI-Assessed count. Self-Reported and Pending Review
//    sessions are left out: they are unverified, or the AI itself flagged them for a coach.
//  - An athlete needs at least MIN_COUNTED_SESSIONS counted sessions for a metric to be ranked.
//  - An athlete's value is the average of their counted results for that metric.
//  - Positions are computed inside whatever filters are active ("#2 in Misamis Oriental"),
//    and tied values share a position.
//  - Rankings never mix sports.

import { skillById } from "./skills.ts";
import type {
  DirectoryAthlete,
  PerformanceSession,
  Ranking,
  RankingResult,
  SessionStatus,
  SkillId,
} from "@/types";

export const MIN_COUNTED_SESSIONS = 3;
export const COUNTED_STATUSES: SessionStatus[] = ["Coach-Verified", "AI-Assessed"];

export const SPORT_METRICS: Record<string, string[]> = {
  Basketball: ["Shooting Accuracy", "Overall Performance", "Consistency"],
  Volleyball: ["Spike Accuracy", "Serve Accuracy"],
  "Track & Field": ["100m Sprint (s)"],
  Football: ["Passing Accuracy", "Kick Accuracy"],
};

/** The metric used for an athlete's single headline "Basketball Rank" style number. */
export const PRIMARY_METRIC: Record<string, string> = {
  Basketball: "Overall Performance",
  Volleyball: "Spike Accuracy",
  "Track & Field": "100m Sprint (s)",
  Football: "Passing Accuracy",
};

export const ALL = "All";

/** The municipalities offered by the Municipality filter. The list lives with the profile rules, so athletes can only pick what the filter offers. */
export { MUNICIPALITIES as SURIGAO_DEL_NORTE_MUNICIPALITIES, CATEGORIES } from "./athleteProfileRules.ts";

/** Times are better when lower. */
export const lowerIsBetter = (metric: string) => metric.includes("(s)");

/** Skills that have a ranking metric of their own (everything else feeds the Basketball metrics below). */
const SKILL_METRIC: Partial<Record<SkillId, string>> = {
  spiking: "Spike Accuracy",
  serving: "Serve Accuracy",
  sprint100: "100m Sprint (s)",
  fbpassing: "Passing Accuracy",
  fbkicking: "Kick Accuracy",
};

/**
 * Turns an athlete's sessions into ranking results. Volleyball and Track & Field skills each feed
 * their own metric. Basketball skills feed Shooting Accuracy, Overall Performance (percentage
 * skills only: vertical jump is in cm so it cannot be averaged with them) and Consistency.
 */
export function resultsFromSessions(
  sessions: Pick<PerformanceSession, "skill" | "result" | "consistency" | "status">[],
): RankingResult[] {
  const out: RankingResult[] = [];
  for (const s of sessions) {
    const own = SKILL_METRIC[s.skill];
    if (own) out.push({ metric: own, value: s.result, status: s.status });
    const def = skillById(s.skill);
    if (def?.sport !== "Basketball") continue;
    if (s.skill === "shooting")
      out.push({ metric: "Shooting Accuracy", value: s.result, status: s.status });
    if (def.unit === "%")
      out.push({ metric: "Overall Performance", value: s.result, status: s.status });
    if (s.consistency !== null)
      out.push({ metric: "Consistency", value: s.consistency, status: s.status });
  }
  return out;
}

export interface RankingCandidate {
  id: string;
  name: string;
  sport: string;
  school: string;
  municipality: string;
  province: string;
  /** the ranking category the athlete chose; "" or missing = none */
  category?: string;
  isCurrentUser?: boolean;
  results: RankingResult[];
}

export interface RankingFilters {
  sport: string;
  metric: string;
  province?: string;
  municipality?: string;
  school?: string;
  category?: string;
}

export interface RankingOutcome {
  rows: Ranking[];
  /** athletes in the pool who don't have enough counted sessions yet */
  notEnoughSessions: number;
  /** the signed-in athlete's standing, if they are in this pool */
  me?: { row: Ranking | undefined; counted: number; total: number };
}

const round1 = (n: number) => Math.round(n * 10) / 10;

function matches(v: string | undefined, wanted: string | undefined) {
  return !wanted || wanted === ALL || v === wanted;
}

/** Candidates that fall inside the sport and location/school filters. */
export function poolFor(
  candidates: RankingCandidate[],
  f: {
    sport: string;
    province?: string | undefined;
    municipality?: string | undefined;
    school?: string | undefined;
    category?: string | undefined;
  },
): RankingCandidate[] {
  return candidates.filter(
    (c) =>
      c.sport === f.sport &&
      matches(c.province, f.province) &&
      matches(c.municipality, f.municipality) &&
      matches(c.school, f.school) &&
      matches(c.category, f.category),
  );
}

export function computeRankings(candidates: RankingCandidate[], f: RankingFilters): RankingOutcome {
  const pool = poolFor(candidates, f);
  const scored: { c: RankingCandidate; value: number; counted: number; verified: number }[] = [];
  let notEnough = 0;
  let me: RankingOutcome["me"];

  for (const c of pool) {
    const counted = c.results.filter(
      (r) => r.metric === f.metric && COUNTED_STATUSES.includes(r.status),
    );
    if (c.isCurrentUser) me = { row: undefined, counted: counted.length, total: 0 };
    if (counted.length < MIN_COUNTED_SESSIONS) {
      notEnough += 1;
      continue;
    }
    const value = round1(counted.reduce((a, r) => a + r.value, 0) / counted.length);
    scored.push({
      c,
      value,
      counted: counted.length,
      verified: counted.filter((r) => r.status === "Coach-Verified").length,
    });
  }

  const dir = lowerIsBetter(f.metric) ? 1 : -1;
  scored.sort((a, b) => dir * (a.value - b.value) || a.c.name.localeCompare(b.c.name));

  const rows: Ranking[] = [];
  scored.forEach((s, i) => {
    const prev = rows[i - 1];
    const position = prev && prev.value === s.value ? prev.position : i + 1;
    rows.push({
      position,
      athleteId: s.c.id,
      athleteName: s.c.name,
      school: s.c.school,
      municipality: s.c.municipality,
      province: s.c.province,
      value: s.value,
      ...(s.c.isCurrentUser ? { isCurrentUser: true } : {}),
      verifiedSessions: s.verified,
      totalSessions: s.counted,
    });
  });

  if (me) me = { row: rows.find((r) => r.isCurrentUser), counted: me.counted, total: rows.length };
  return { rows, notEnoughSessions: notEnough, ...(me ? { me } : {}) };
}

/** Distinct, sorted option lists for the filter dropdowns, scoped to the sport and the choices above them. */
export function filterOptions(
  candidates: RankingCandidate[],
  f: { sport: string; province?: string | undefined; municipality?: string | undefined },
) {
  const inSport = poolFor(candidates, { sport: f.sport });
  const distinct = (xs: string[]) => [...new Set(xs)].sort((a, b) => a.localeCompare(b));
  return {
    provinces: distinct(inSport.map((c) => c.province)),
    municipalities: distinct(
      poolFor(candidates, { sport: f.sport, province: f.province }).map((c) => c.municipality),
    ),
    schools: distinct(
      poolFor(candidates, {
        sport: f.sport,
        province: f.province,
        municipality: f.municipality,
      }).map((c) => c.school),
    ),
  };
}

export interface CandidateSources {
  directory: DirectoryAthlete[];
  /** the signed-in athlete's id, and their live sessions */
  currentUserId: string;
  currentUserSessions: PerformanceSession[];
  /** sample sessions for other basketball athletes, keyed by athlete id */
  sessionsByAthlete: Record<string, PerformanceSession[]>;
  /** sample results for athletes in sports without per-skill sessions */
  resultsByAthlete: Record<string, RankingResult[]>;
}

/** Hidden showcases stay out of public rankings (the signed-in athlete always sees themselves). */
export function buildCandidates(src: CandidateSources): RankingCandidate[] {
  return src.directory
    .filter((a) => a.visible || a.id === src.currentUserId)
    .map((a) => {
      const isMe = a.id === src.currentUserId;
      const results = isMe
        ? a.sport === "Basketball"
          ? resultsFromSessions(src.currentUserSessions)
          : []
        : [
            ...resultsFromSessions(src.sessionsByAthlete[a.id] ?? []),
            ...(src.resultsByAthlete[a.id] ?? []),
          ];
      return {
        id: a.id,
        name: `${a.firstName} ${a.lastName}`,
        sport: a.sport,
        school: a.school,
        municipality: a.municipality,
        province: a.province,
        ...(isMe ? { isCurrentUser: true } : {}),
        results,
      };
    });
}

/** Nationwide position per athlete in their sport's headline metric (absent = not ranked yet). */
export function headlineRanks(candidates: RankingCandidate[]): Map<string, number> {
  const out = new Map<string, number>();
  for (const sport of new Set(candidates.map((c) => c.sport))) {
    const metric = PRIMARY_METRIC[sport];
    if (!metric) continue;
    for (const r of computeRankings(candidates, { sport, metric }).rows)
      if (r.athleteId) out.set(r.athleteId, r.position);
  }
  return out;
}
