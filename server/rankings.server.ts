// Rankings, computed from real athletes and their real practice sessions.
//
// SERVER ONLY. Reads `athlete_profiles`, `user_profiles`, `users` and `practice_sessions`.
//
// The rules are the SAME functions the Rankings page used while it ran on sample data
// (src/lib/rankings.ts), so nothing about how a position is worked out has changed:
//  - only AI-Assessed and Coach-Verified sessions count (Self-Reported / Pending Review never do);
//  - a metric needs at least MIN_COUNTED_SESSIONS counted sessions before an athlete is ranked;
//  - an athlete's value is the average of their counted results, ties share a position;
//  - rankings never mix sports, and positions are worked out inside the active filters.
//
// Privacy: an athlete who hides their showcase (athlete_profiles.showcase_visible = false) is left
// out of everyone else's rankings, but can still see their own standing. Responses carry names,
// schools and places only, never emails.
//
// KNOWN LIMIT: per-skill sessions exist for Basketball only, so Volleyball and Track & Field
// athletes appear as "not enough sessions" until those sports have a way to record results.
// Rankings are recomputed on every request, which is fine for a prototype-sized pool.

import { getDb, type Db } from "./db.server.ts";
import type { PublicUser } from "./auth.server.ts";
import { ATHLETE_ROLE } from "./connections.server.ts";
import {
  ALL,
  MIN_COUNTED_SESSIONS,
  PRIMARY_METRIC,
  SPORT_METRICS,
  computeRankings,
  filterOptions,
  headlineRanks,
  resultsFromSessions,
  type RankingCandidate,
} from "../src/lib/rankings.ts";
import type { Ranking, SessionStatus, SkillId } from "../src/types/index.ts";

export const RANKINGS_LIMIT_DEFAULT = 100;
export const RANKINGS_LIMIT_MAX = 200;
export const HEADLINE_IDS_MAX = 100;

export class RankingError extends Error {
  readonly httpStatus: number;
  readonly code: string;
  constructor(httpStatus: number, code: string, message: string) {
    super(message);
    this.httpStatus = httpStatus;
    this.code = code;
  }
}

const COUNTED_DB = ["ai_assessed", "coach_verified"] as const;
const LABEL: Record<(typeof COUNTED_DB)[number], SessionStatus> = {
  ai_assessed: "AI-Assessed",
  coach_verified: "Coach-Verified",
};

interface AthleteRow {
  id: string;
  name: string;
  sport: string;
  school: string;
  municipality: string;
  province: string;
}
interface SessionRow {
  athlete_id: string;
  skill: string;
  result: number;
  consistency: number | null;
  status: (typeof COUNTED_DB)[number];
}

/** Every athlete who may appear in rankings for this viewer, with their counted results. */
async function loadCandidates(db: Db, viewerId: string): Promise<RankingCandidate[]> {
  const athletes = await db<AthleteRow[]>`
    SELECT u.id,
           COALESCE(NULLIF(btrim(concat_ws(' ', up.first_name, up.last_name)), ''), u.display_name) AS name,
           ap.sport, ap.school, ap.municipality, ap.province
    FROM athlete_profiles ap
    JOIN users u ON u.id = ap.user_id
    LEFT JOIN user_profiles up ON up.user_id = u.id
    WHERE u.is_active = TRUE AND u.deleted_at IS NULL AND ap.sport <> ''
      AND (ap.showcase_visible = TRUE OR ap.user_id = ${viewerId})`;
  if (athletes.length === 0) return [];

  const sessions = await db<SessionRow[]>`
    SELECT athlete_id, skill, result::float8 AS result, consistency::float8 AS consistency, status
    FROM practice_sessions
    WHERE status IN ('ai_assessed', 'coach_verified')`;
  const byAthlete = new Map<string, SessionRow[]>();
  for (const s of sessions) {
    const list = byAthlete.get(s.athlete_id);
    if (list) list.push(s);
    else byAthlete.set(s.athlete_id, [s]);
  }

  return athletes.map((a) => ({
    id: a.id,
    name: a.name,
    sport: a.sport,
    school: a.school,
    municipality: a.municipality,
    province: a.province,
    ...(a.id === viewerId ? { isCurrentUser: true } : {}),
    // Per-skill sessions are Basketball sessions; other sports have no results to rank yet.
    results:
      a.sport === "Basketball"
        ? resultsFromSessions(
            (byAthlete.get(a.id) ?? []).map((s) => ({
              skill: s.skill as SkillId,
              result: s.result,
              consistency: s.consistency,
              status: LABEL[s.status],
            })),
          )
        : [],
  }));
}

export interface RankingQuery {
  sport: string;
  metric?: string | undefined;
  province?: string | undefined;
  municipality?: string | undefined;
  school?: string | undefined;
  limit: number;
}

export interface RankingsResponse {
  sport: string;
  metric: string;
  minCountedSessions: number;
  /** the top `limit` positions; `total` is how many athletes are ranked in all */
  rows: Ranking[];
  total: number;
  /** athletes in this view without enough counted sessions yet */
  notEnoughSessions: number;
  /** the signed-in athlete's own standing in this view (athletes only) */
  me?: { row: Ranking | null; counted: number; total: number };
  /** values for the filter dropdowns, from the athletes in this sport */
  options: { provinces: string[]; municipalities: string[]; schools: string[] };
}

const clean = (v: string | undefined, name: string): string | undefined => {
  if (v === undefined || v === "" || v === ALL) return undefined;
  if (v.length > 120) throw new RankingError(400, "validation", `${name} is too long.`);
  return v;
};

export async function getRankings(user: PublicUser, q: RankingQuery, dbArg?: Db): Promise<RankingsResponse> {
  const metrics = SPORT_METRICS[q.sport];
  if (!metrics) throw new RankingError(400, "validation", "Unknown sport.");
  const metric = q.metric ?? metrics[0] ?? "";
  if (!metrics.includes(metric)) throw new RankingError(400, "validation", "Unknown metric for this sport.");
  const province = clean(q.province, "Province");
  const municipality = clean(q.municipality, "Municipality");
  const school = clean(q.school, "School");

  const db = dbArg ?? (await getDb());
  const candidates = await loadCandidates(db, user.id);
  const outcome = computeRankings(candidates, { sport: q.sport, metric, province, municipality, school });
  const isAthlete = user.roles.includes(ATHLETE_ROLE);

  return {
    sport: q.sport,
    metric,
    minCountedSessions: MIN_COUNTED_SESSIONS,
    rows: outcome.rows.slice(0, q.limit),
    total: outcome.rows.length,
    notEnoughSessions: outcome.notEnoughSessions,
    ...(isAthlete && outcome.me ? { me: { row: outcome.me.row ?? null, counted: outcome.me.counted, total: outcome.me.total } } : {}),
    options: filterOptions(candidates, { sport: q.sport, province, municipality }),
  };
}

export interface HeadlineResponse {
  /** the signed-in athlete's nationwide rank in their sport's headline metric; null = not ranked yet */
  me: { position: number | null; sport: string; metric: string; counted: number } | null;
  /** positions for the athletes asked about (leave out anyone who is not ranked or is hidden) */
  ranks: Record<string, number>;
}

export async function getHeadline(user: PublicUser, ids: string[], dbArg?: Db): Promise<HeadlineResponse> {
  if (ids.length > HEADLINE_IDS_MAX) throw new RankingError(400, "validation", `Ask about at most ${HEADLINE_IDS_MAX} athletes at a time.`);
  const db = dbArg ?? (await getDb());
  const candidates = await loadCandidates(db, user.id);
  const positions = headlineRanks(candidates);

  const ranks: Record<string, number> = {};
  for (const id of ids) {
    const p = positions.get(id);
    if (p !== undefined) ranks[id] = p;
  }

  const mine = candidates.find((c) => c.isCurrentUser);
  let me: HeadlineResponse["me"] = null;
  if (mine) {
    const metric = PRIMARY_METRIC[mine.sport];
    if (metric) {
      const counted = computeRankings(candidates, { sport: mine.sport, metric }).me?.counted ?? 0;
      me = { position: positions.get(mine.id) ?? null, sport: mine.sport, metric, counted };
    }
  }
  return { me, ranks };
}

/* ---- showcase visibility: whether the athlete appears in other people's rankings ---- */

function requireAthlete(user: PublicUser): void {
  if (!user.roles.includes(ATHLETE_ROLE)) throw new RankingError(403, "role_not_allowed", "Only student-athletes can use this.");
}

export async function getShowcaseVisible(user: PublicUser, dbArg?: Db): Promise<boolean> {
  requireAthlete(user);
  const db = dbArg ?? (await getDb());
  const [r] = await db<{ v: boolean }[]>`SELECT showcase_visible AS v FROM athlete_profiles WHERE user_id = ${user.id}`;
  return r?.v ?? true;
}

export async function setShowcaseVisible(user: PublicUser, visible: boolean, dbArg?: Db): Promise<boolean> {
  requireAthlete(user);
  const db = dbArg ?? (await getDb());
  const ts = new Date();
  await db`
    INSERT INTO athlete_profiles (user_id, showcase_visible, created_at, updated_at)
    VALUES (${user.id}, ${visible}, ${ts}, ${ts})
    ON CONFLICT (user_id) DO UPDATE SET showcase_visible = EXCLUDED.showcase_visible, updated_at = EXCLUDED.updated_at`;
  return visible;
}

/** Nationwide headline position per athlete (absent = not ranked yet), for the recruiting directory. */
export async function headlinePositions(db: Db, viewerId: string): Promise<Map<string, number>> {
  return headlineRanks(await loadCandidates(db, viewerId));
}
