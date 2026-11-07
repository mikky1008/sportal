// Practice sessions: the athlete's own history, and a coach's review of it.
//
// SERVER ONLY. Works on `practice_sessions` (migration 6 in db.server.ts).
//
// Trust rules (the whole point of the "Coach-Verified" label):
//  - The server, not the browser, decides a new session's status, using statusForNewSession from
//    src/lib/verification.ts. A new session can be AI-Assessed, Self-Reported or Pending Review.
//    It can never be created as Coach-Verified.
//  - Only a VERIFIED coach (permission sessions:verify) who has an ACCEPTED connection with the
//    athlete can verify that athlete's session, and the row records who and when.
//  - An athlete can only ever read, create and ask for review of their OWN sessions.
//  - KNOWN LIMIT: AI analysis currently runs in the browser and is simulated, so the server cannot
//    prove an "AI-Assessed" result came from a real analysis. Moving the analysis to the server is
//    what would make that label trustworthy.

import { randomUUID } from "node:crypto";
import { z } from "zod";
import { getDb, type Db } from "./db.server.ts";
import { audit, type PublicUser, type RequestMeta } from "./auth.server.ts";
import { ATHLETE_ROLE, COACH_ROLE, ConnectionError, PAGE_DEFAULT, PAGE_MAX } from "./connections.server.ts";
import { skills } from "../src/lib/skills.ts";
import { statusForNewSession } from "../src/lib/verification.ts";
import type { SessionStatus } from "../src/types/index.ts";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SKILL_IDS = skills.map((s) => s.id) as [string, ...string[]];
const DAY_MS = 24 * 60 * 60 * 1000;
const isoDay = (d: Date) => d.toISOString().slice(0, 10);
/** Most sessions an athlete can log in one day (a guard against runaway scripts, not a real limit). */
export const MAX_SESSIONS_PER_DAY = 100;
export const SESSIONS_LIMIT_MAX = 200;

type DbStatus = "ai_assessed" | "pending_review" | "self_reported" | "coach_verified";
const LABEL: Record<DbStatus, SessionStatus> = {
  ai_assessed: "AI-Assessed",
  pending_review: "Pending Review",
  self_reported: "Self-Reported",
  coach_verified: "Coach-Verified",
};
const TO_DB: Record<SessionStatus, DbStatus> = {
  "AI-Assessed": "ai_assessed",
  "Pending Review": "pending_review",
  "Self-Reported": "self_reported",
  "Coach-Verified": "coach_verified",
};

export interface SessionView {
  id: string;
  /** YYYY-MM-DD */
  date: string;
  skill: string;
  result: number;
  consistency: number | null;
  status: SessionStatus;
  /** the verifying coach's name, only when status is Coach-Verified */
  verifiedBy?: string;
  simulated?: true;
}

interface SessionRow {
  id: string;
  session_date: string;
  skill: string;
  result: number;
  consistency: number | null;
  status: DbStatus;
  simulated: boolean;
  verifier: string | null;
}

const SELECT = (db: Db) => db`
  s.id, to_char(s.session_date, 'YYYY-MM-DD') AS session_date, s.skill, s.result::float8 AS result,
  s.consistency::float8 AS consistency, s.status, s.simulated, v.display_name AS verifier`;

function toView(r: SessionRow): SessionView {
  return {
    id: r.id,
    date: r.session_date,
    skill: r.skill,
    result: r.result,
    consistency: r.consistency,
    // A "Coach-Verified" row whose coach account is gone can't be trusted, so it reads as pending.
    status: r.status === "coach_verified" && !r.verifier ? "Pending Review" : LABEL[r.status],
    ...(r.status === "coach_verified" && r.verifier ? { verifiedBy: r.verifier } : {}),
    ...(r.simulated ? { simulated: true as const } : {}),
  };
}

function requireAthlete(actor: Pick<PublicUser, "roles">): void {
  if (!actor.roles.includes(ATHLETE_ROLE))
    throw new ConnectionError(403, "role_not_allowed", "Only student-athlete accounts have practice sessions.");
}

function fail(fieldErrors: Record<string, string>): ConnectionError {
  return new ConnectionError(400, "validation", "Please fix the highlighted fields.", { fieldErrors });
}

async function viewById(db: Db, id: string, athleteId?: string): Promise<SessionView | null> {
  const [row] = await db<SessionRow[]>`
    SELECT ${SELECT(db)} FROM practice_sessions s LEFT JOIN users v ON v.id = s.verified_by
    WHERE s.id = ${id} ${athleteId ? db`AND s.athlete_id = ${athleteId}` : db``}`;
  return row ? toView(row) : null;
}

// ---------- the athlete's side ----------

export async function listMySessions(actor: PublicUser, opts: { limit?: number } = {}, dbArg?: Db): Promise<{ items: SessionView[] }> {
  requireAthlete(actor);
  const db = dbArg ?? (await getDb());
  const limit = Math.min(Math.max(Math.trunc(opts.limit ?? SESSIONS_LIMIT_MAX), 1), SESSIONS_LIMIT_MAX);
  const rows = await db<SessionRow[]>`
    SELECT ${SELECT(db)} FROM practice_sessions s LEFT JOIN users v ON v.id = s.verified_by
    WHERE s.athlete_id = ${actor.id}
    ORDER BY s.session_date DESC, s.created_at DESC, s.id LIMIT ${limit}`;
  return { items: rows.map(toView) };
}

const createSchema = z.object({
  skill: z.enum(SKILL_IDS),
  result: z.number().finite(),
  consistency: z.number().finite().min(0, "Consistency must be 0-100.").max(100, "Consistency must be 0-100.").nullable().optional(),
  source: z.enum(["ai", "manual"]),
  needsReview: z.boolean().optional(),
  requestedReview: z.boolean().optional(),
  simulated: z.boolean().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use the date format YYYY-MM-DD.").optional(),
});

export async function createSession(actor: PublicUser, body: unknown, dbArg?: Db): Promise<SessionView> {
  requireAthlete(actor);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "body");
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    throw fail(fieldErrors);
  }
  const b = parsed.data;
  const max = b.skill === "vertical" ? 300 : 100;
  if (b.result < 0 || b.result > max) throw fail({ result: `Enter a result between 0 and ${max}.` });
  // A hand-entered result has no measured consistency; only an analysis can supply one.
  if (b.source === "manual" && b.consistency !== undefined && b.consistency !== null)
    throw fail({ consistency: "A self-reported session has no consistency score." });

  const ts = new Date();
  const date = b.date ?? isoDay(ts);
  const asDate = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(asDate.getTime()) || isoDay(asDate) !== date) throw fail({ date: "Enter a real date." });
  if (date > isoDay(new Date(ts.getTime() + DAY_MS))) throw fail({ date: "A session can't be dated in the future." });

  const status = TO_DB[statusForNewSession({
    source: b.source,
    ...(b.needsReview !== undefined ? { needsReview: b.needsReview } : {}),
    ...(b.requestedReview !== undefined ? { requestedReview: b.requestedReview } : {}),
  })];
  if (status === "coach_verified") throw new Error("a new session can never start as coach_verified"); // defensive: statusForNewSession never returns it

  const db = dbArg ?? (await getDb());
  const [today] = await db<{ n: number }[]>`
    SELECT COUNT(*)::int AS n FROM practice_sessions WHERE athlete_id = ${actor.id} AND created_at >= ${new Date(ts.getTime() - DAY_MS)}`;
  if ((today?.n ?? 0) >= MAX_SESSIONS_PER_DAY)
    throw new ConnectionError(429, "too_many_sessions", "That's a lot of sessions for one day. Try again tomorrow.");

  const id = randomUUID();
  await db`
    INSERT INTO practice_sessions (id, athlete_id, skill, result, consistency, status, simulated, session_date, created_at)
    VALUES (${id}, ${actor.id}, ${b.skill}, ${b.result}, ${b.source === "manual" ? null : (b.consistency ?? null)}, ${status},
            ${b.simulated === true}, ${date}::date, ${ts})`;
  const view = await viewById(db, id);
  if (!view) throw new Error("session vanished after insert");
  return view;
}

/** The athlete asks a coach to look at an AI-assessed or self-reported result. */
export async function requestSessionReview(actor: PublicUser, id: string, dbArg?: Db): Promise<SessionView> {
  requireAthlete(actor);
  const notFound = new ConnectionError(404, "session_not_found", "Session not found.");
  if (!UUID_RE.test(id)) throw notFound;
  const db = dbArg ?? (await getDb());
  const [row] = await db<{ id: string }[]>`
    UPDATE practice_sessions SET status = 'pending_review'
    WHERE id = ${id} AND athlete_id = ${actor.id} AND status IN ('ai_assessed', 'self_reported')
    RETURNING id`;
  if (!row) {
    const existing = await viewById(db, id, actor.id);
    if (!existing) throw notFound;
    throw new ConnectionError(409, "cannot_request_review", existing.status === "Coach-Verified" ? "A coach has already verified this session." : "This session is already waiting for review.");
  }
  const view = await viewById(db, id, actor.id);
  if (!view) throw notFound;
  return view;
}

// ---------- the coach's side ----------

export interface PendingSessionView extends SessionView {
  athlete: { id: string; displayName: string };
}

function requireVerifiedCoach(actor: Pick<PublicUser, "roles" | "permissions">): void {
  if (!actor.roles.includes(COACH_ROLE))
    throw new ConnectionError(403, "role_not_allowed", "Only coaches can review sessions.");
  if (!actor.permissions.includes("sessions:verify"))
    throw new ConnectionError(403, "coach_not_verified", "Your coach account has to be verified before you can review sessions.");
}

/** Sessions waiting for review from the coach's connected athletes, oldest first. */
export async function listSessionsForReview(
  actor: PublicUser,
  opts: { limit?: number } = {},
  dbArg?: Db,
): Promise<{ items: PendingSessionView[] }> {
  requireVerifiedCoach(actor);
  const db = dbArg ?? (await getDb());
  const limit = Math.min(Math.max(Math.trunc(opts.limit ?? PAGE_DEFAULT), 1), PAGE_MAX);
  const rows = await db<(SessionRow & { athlete_id: string; athlete_name: string })[]>`
    SELECT ${SELECT(db)}, s.athlete_id, a.display_name AS athlete_name
    FROM practice_sessions s
    JOIN coach_athlete_connections c ON c.athlete_id = s.athlete_id AND c.coach_id = ${actor.id} AND c.status = 'accepted'
    JOIN users a ON a.id = s.athlete_id AND a.is_active = TRUE AND a.deleted_at IS NULL
    LEFT JOIN users v ON v.id = s.verified_by
    WHERE s.status = 'pending_review'
    ORDER BY s.session_date, s.created_at, s.id LIMIT ${limit}`;
  return { items: rows.map((r) => ({ ...toView(r), athlete: { id: r.athlete_id, displayName: r.athlete_name } })) };
}

/** Marks one session Coach-Verified. The coach must be verified AND connected to the athlete. */
export async function verifySession(actor: PublicUser, id: string, meta: Partial<RequestMeta> = {}, dbArg?: Db): Promise<SessionView> {
  requireVerifiedCoach(actor);
  const notFound = new ConnectionError(404, "session_not_found", "Session not found.");
  if (!UUID_RE.test(id)) throw notFound;
  const db = dbArg ?? (await getDb());
  const ts = new Date();

  await db.begin(async (tx) => {
    // Locks the session row; the connection must be accepted, otherwise it is simply "not found".
    const [row] = await tx<{ status: DbStatus; athlete_id: string }[]>`
      SELECT s.status, s.athlete_id
      FROM practice_sessions s
      JOIN coach_athlete_connections c ON c.athlete_id = s.athlete_id AND c.coach_id = ${actor.id} AND c.status = 'accepted'
      WHERE s.id = ${id}
      FOR UPDATE OF s`;
    if (!row) throw notFound;
    if (row.status === "coach_verified") throw new ConnectionError(409, "already_verified", "This session is already verified.");
    await tx`
      UPDATE practice_sessions SET status = 'coach_verified', verified_by = ${actor.id}, verified_at = ${ts}
      WHERE id = ${id}`;
  });
  await audit("practice_session.verified", { userId: actor.id, ...meta, detail: { sessionId: id } }, db);
  const view = await viewById(db, id);
  if (!view) throw notFound;
  return view;
}
