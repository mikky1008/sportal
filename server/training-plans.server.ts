// Coach training plans: creating, editing, listing and reading plans, with their weekly schedule,
// target goals and athlete assignments.
//
// SERVER ONLY. Works on the tables from migration 3 in db.server.ts.
//
// Rules enforced here (the database guarantees the shape, this file guarantees who may do what):
//  - Only a coach can use these routes, and a coach only ever sees and changes their OWN plans
//    (someone else's plan id is "not found", never "forbidden").
//  - A plan is saved as DRAFT (title only is required) or PUBLISHED (must be complete). The rules
//    live in src/lib/trainingPlanRules.ts, the same file the form uses.
//  - A coach may only assign a plan to athletes they have an ACCEPTED connection with. That is
//    checked inside the saving transaction with the connection rows locked, so an athlete can't
//    disconnect between the check and the save.
//  - A published plan can be edited but never turned back into a draft.

import { randomUUID } from "node:crypto";
import type { TransactionSql } from "postgres";
import { getDb, type Db } from "./db.server.ts";
import { audit, type PublicUser, type RequestMeta } from "./auth.server.ts";
import {
  sanitizePlanInput, summarizeErrors, validatePlan, PLAN_STATUSES,
  type FieldErrors, type PlanInput, type PlanStatus,
} from "../src/lib/trainingPlanRules.ts";

export const COACH_ROLE = "coach";
export const ATHLETE_ROLE = "student_athlete";
export const PAGE_DEFAULT = 50;
export const PAGE_MAX = 100;

/** The handle a transaction callback receives (what `db.begin` passes in). */
type Tx = TransactionSql;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class PlanError extends Error {
  readonly httpStatus: number;
  readonly code: string;
  readonly extra: Record<string, unknown> | undefined;
  constructor(httpStatus: number, code: string, message: string, extra?: Record<string, unknown>) {
    super(message);
    this.httpStatus = httpStatus;
    this.code = code;
    this.extra = extra;
  }
}

export interface PlanAthlete {
  id: string;
  displayName: string;
  /** false when the coach and athlete are no longer connected (the plan keeps the assignment) */
  connected: boolean;
}

export interface TrainingPlanView {
  id: string;
  status: PlanStatus;
  title: string;
  description: string;
  sport: string;
  skillFocus: string;
  startDate: string | null;
  endDate: string | null;
  schedule: { day: string; drillName: string; durationMinutes: number; intensity: string }[];
  goals: string[];
  athletes: PlanAthlete[];
  coach: { id: string; displayName: string };
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TrainingPlanSummary {
  id: string;
  status: PlanStatus;
  title: string;
  sport: string;
  skillFocus: string;
  startDate: string | null;
  endDate: string | null;
  athleteCount: number;
  updatedAt: string;
}

interface PlanRow {
  id: string;
  coach_id: string;
  title: string;
  description: string;
  sport: string;
  skill_focus: string;
  start_date: string | null;
  end_date: string | null;
  status: PlanStatus;
  published_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

const PLAN_COLUMNS = (db: Db) => db`
  id, coach_id, title, description, sport, skill_focus,
  to_char(start_date, 'YYYY-MM-DD') AS start_date, to_char(end_date, 'YYYY-MM-DD') AS end_date,
  status, published_at, created_at, updated_at`;

function requireCoach(user: PublicUser): void {
  if (!user.roles.includes(COACH_ROLE))
    throw new PlanError(403, "role_not_allowed", "Only coaches can manage training plans.");
}

function requireId(id: string): void {
  if (!UUID_RE.test(id)) throw new PlanError(404, "plan_not_found", "Training plan not found.");
}

/** Reads and checks the body. Throws a 400 with per-field messages when it isn't valid. */
function parseBody(raw: unknown): { input: PlanInput; status: PlanStatus } {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const status = r["status"];
  if (typeof status !== "string" || !(PLAN_STATUSES as readonly string[]).includes(status))
    throw new PlanError(400, "validation", "Choose DRAFT or PUBLISHED.", { fieldErrors: { status: "Status must be DRAFT or PUBLISHED." } });
  const input = sanitizePlanInput(raw);
  const fieldErrors: FieldErrors = validatePlan(input, status as PlanStatus);
  if (Object.keys(fieldErrors).length > 0) throw new PlanError(400, "validation", summarizeErrors(fieldErrors), { fieldErrors });
  return { input, status: status as PlanStatus };
}

/**
 * Every athlete must have an ACCEPTED connection with this coach and still be an active account.
 * Run inside the saving transaction: FOR SHARE locks those connection rows until it commits.
 */
async function assertAthletesConnected(tx: Tx, coachId: string, athleteIds: string[]): Promise<void> {
  if (athleteIds.length === 0) return;
  const ok = await tx<{ athlete_id: string }[]>`
    SELECT c.athlete_id
    FROM coach_athlete_connections c
    JOIN users u ON u.id = c.athlete_id AND u.is_active = TRUE AND u.deleted_at IS NULL
    WHERE c.coach_id = ${coachId} AND c.status = 'accepted' AND c.athlete_id IN ${tx(athleteIds)}
      AND EXISTS (SELECT 1 FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = ${coachId} AND r.name = 'verified_coach')
    FOR SHARE OF c`;
  const allowed = new Set(ok.map((r) => r.athlete_id));
  const rejected = athleteIds.filter((id) => !allowed.has(id));
  if (rejected.length > 0)
    throw new PlanError(
      403,
      "athlete_not_connected",
      rejected.length === 1
        ? "You can only assign plans to athletes you are connected with. Remove the athlete who isn't connected."
        : "You can only assign plans to athletes you are connected with. Remove the athletes who aren't connected.",
      { athleteIds: rejected, fieldErrors: { athleteIds: "Some selected athletes aren't connected to you." } },
    );
}

async function writeChildren(tx: Tx, planId: string, input: PlanInput, ts: Date): Promise<void> {
  await tx`DELETE FROM training_plan_schedule_items WHERE plan_id = ${planId}`;
  await tx`DELETE FROM training_plan_goals WHERE plan_id = ${planId}`;
  await tx`DELETE FROM training_plan_assignments WHERE plan_id = ${planId}`;
  if (input.schedule.length > 0) {
    const rows = input.schedule.map((it, i) => ({
      id: randomUUID(), plan_id: planId, position: i, day_of_week: it.day,
      drill_name: it.drillName, duration_minutes: it.durationMinutes as number, intensity: it.intensity,
    }));
    await tx`INSERT INTO training_plan_schedule_items ${tx(rows)}`;
  }
  if (input.goals.length > 0) {
    const rows = input.goals.map((g, i) => ({ id: randomUUID(), plan_id: planId, position: i, description: g }));
    await tx`INSERT INTO training_plan_goals ${tx(rows)}`;
  }
  if (input.athleteIds.length > 0) {
    const rows = input.athleteIds.map((a) => ({ plan_id: planId, athlete_id: a, assigned_at: ts }));
    await tx`INSERT INTO training_plan_assignments ${tx(rows)}`;
  }
}

// ---------- reading ----------

async function viewById(db: Db, id: string, coachId: string): Promise<TrainingPlanView> {
  const [row] = await db<PlanRow[]>`SELECT ${PLAN_COLUMNS(db)} FROM training_plans WHERE id = ${id} AND coach_id = ${coachId}`;
  if (!row) throw new PlanError(404, "plan_not_found", "Training plan not found.");
  const [schedule, goals, athletes, [coach]] = await Promise.all([
    db<{ day_of_week: string; drill_name: string; duration_minutes: number; intensity: string }[]>`
      SELECT day_of_week, drill_name, duration_minutes, intensity FROM training_plan_schedule_items WHERE plan_id = ${id} ORDER BY position`,
    db<{ description: string }[]>`SELECT description FROM training_plan_goals WHERE plan_id = ${id} ORDER BY position`,
    db<{ id: string; display_name: string; connected: boolean }[]>`
      SELECT u.id, u.display_name,
             EXISTS (SELECT 1 FROM coach_athlete_connections c
                     WHERE c.coach_id = ${coachId} AND c.athlete_id = u.id AND c.status = 'accepted') AS connected
      FROM training_plan_assignments a JOIN users u ON u.id = a.athlete_id
      WHERE a.plan_id = ${id} ORDER BY u.display_name, u.id`,
    db<{ id: string; display_name: string }[]>`SELECT id, display_name FROM users WHERE id = ${coachId}`,
  ]);
  return {
    id: row.id,
    status: row.status,
    title: row.title,
    description: row.description,
    sport: row.sport,
    skillFocus: row.skill_focus,
    startDate: row.start_date,
    endDate: row.end_date,
    schedule: schedule.map((s) => ({ day: s.day_of_week, drillName: s.drill_name, durationMinutes: s.duration_minutes, intensity: s.intensity })),
    goals: goals.map((g) => g.description),
    athletes: athletes.map((a) => ({ id: a.id, displayName: a.display_name, connected: a.connected })),
    coach: { id: coachId, displayName: coach?.display_name ?? "" },
    publishedAt: row.published_at ? row.published_at.toISOString() : null,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export async function getPlan(actor: PublicUser, id: string, dbArg?: Db): Promise<TrainingPlanView> {
  requireCoach(actor);
  requireId(id);
  return viewById(dbArg ?? (await getDb()), id, actor.id);
}

export async function listPlans(
  actor: PublicUser,
  opts: { status?: PlanStatus; limit?: number; offset?: number } = {},
  dbArg?: Db,
): Promise<{ items: TrainingPlanSummary[]; total: number; limit: number; offset: number }> {
  requireCoach(actor);
  const db = dbArg ?? (await getDb());
  const limit = Math.min(Math.max(Math.trunc(opts.limit ?? PAGE_DEFAULT), 1), PAGE_MAX);
  const offset = Math.max(Math.trunc(opts.offset ?? 0), 0);
  const filter = opts.status ? db`AND p.status = ${opts.status}` : db``;
  const rows = await db<
    { id: string; status: PlanStatus; title: string; sport: string; skill_focus: string; start_date: string | null; end_date: string | null; athlete_count: number; updated_at: Date }[]
  >`
    SELECT p.id, p.status, p.title, p.sport, p.skill_focus,
           to_char(p.start_date, 'YYYY-MM-DD') AS start_date, to_char(p.end_date, 'YYYY-MM-DD') AS end_date,
           (SELECT COUNT(*)::int FROM training_plan_assignments a WHERE a.plan_id = p.id) AS athlete_count,
           p.updated_at
    FROM training_plans p WHERE p.coach_id = ${actor.id} ${filter}
    ORDER BY p.updated_at DESC, p.id LIMIT ${limit} OFFSET ${offset}`;
  const [count] = await db<{ n: number }[]>`SELECT COUNT(*)::int AS n FROM training_plans p WHERE p.coach_id = ${actor.id} ${filter}`;
  return {
    items: rows.map((r) => ({
      id: r.id, status: r.status, title: r.title, sport: r.sport, skillFocus: r.skill_focus,
      startDate: r.start_date, endDate: r.end_date, athleteCount: r.athlete_count, updatedAt: r.updated_at.toISOString(),
    })),
    total: count?.n ?? 0, limit, offset,
  };
}

// ---------- writing ----------

export async function createPlan(actor: PublicUser, raw: unknown, meta: Partial<RequestMeta> = {}, dbArg?: Db): Promise<TrainingPlanView> {
  requireCoach(actor);
  const { input, status } = parseBody(raw);
  const db = dbArg ?? (await getDb());
  const id = randomUUID();
  const ts = new Date();

  await db.begin(async (tx) => {
    await assertAthletesConnected(tx, actor.id, input.athleteIds);
    await tx`
      INSERT INTO training_plans
        (id, coach_id, title, description, sport, skill_focus, start_date, end_date, status, published_at, created_at, updated_at)
      VALUES (${id}, ${actor.id}, ${input.title}, ${input.description}, ${input.sport}, ${input.skillFocus},
              ${input.startDate || null}, ${input.endDate || null}, ${status}, ${status === "PUBLISHED" ? ts : null}, ${ts}, ${ts})`;
    await writeChildren(tx, id, input, ts);
  });

  await audit(
    status === "PUBLISHED" ? "training_plan.published" : "training_plan.created",
    { userId: actor.id, ...meta, detail: { planId: id, status, athletes: input.athleteIds.length } },
    db,
  );
  return viewById(db, id, actor.id);
}

export async function updatePlan(actor: PublicUser, id: string, raw: unknown, meta: Partial<RequestMeta> = {}, dbArg?: Db): Promise<TrainingPlanView> {
  requireCoach(actor);
  requireId(id);
  const { input, status } = parseBody(raw);
  const db = dbArg ?? (await getDb());
  const ts = new Date();
  let publishedNow = false;

  await db.begin(async (tx) => {
    // Lock this plan's row so two saves of the same plan run one after the other.
    const [row] = await tx<{ status: PlanStatus }[]>`
      SELECT status FROM training_plans WHERE id = ${id} AND coach_id = ${actor.id} FOR UPDATE`;
    if (!row) throw new PlanError(404, "plan_not_found", "Training plan not found.");
    if (row.status === "PUBLISHED" && status === "DRAFT")
      throw new PlanError(409, "cannot_unpublish", "A published plan can't be turned back into a draft.");
    await assertAthletesConnected(tx, actor.id, input.athleteIds);
    publishedNow = row.status === "DRAFT" && status === "PUBLISHED";
    await tx`
      UPDATE training_plans
      SET title = ${input.title}, description = ${input.description}, sport = ${input.sport}, skill_focus = ${input.skillFocus},
          start_date = ${input.startDate || null}, end_date = ${input.endDate || null}, status = ${status},
          published_at = CASE WHEN ${publishedNow} THEN ${ts}::timestamptz ELSE published_at END, updated_at = ${ts}
      WHERE id = ${id}`;
    await writeChildren(tx, id, input, ts);
  });

  await audit(
    publishedNow ? "training_plan.published" : "training_plan.updated",
    { userId: actor.id, ...meta, detail: { planId: id, status, athletes: input.athleteIds.length } },
    db,
  );
  return viewById(db, id, actor.id);
}

// ---------- the athlete's side: plans assigned to me ----------

/** What an athlete sees of a plan: no other athletes, no draft state, no coach internals. */
export interface AssignedPlanSummary {
  id: string;
  title: string;
  sport: string;
  skillFocus: string;
  startDate: string | null;
  endDate: string | null;
  coach: { id: string; displayName: string };
  assignedAt: string;
}

export interface AssignedPlanView extends AssignedPlanSummary {
  description: string;
  schedule: { day: string; drillName: string; durationMinutes: number; intensity: string }[];
  goals: string[];
  publishedAt: string | null;
}

function requireAthlete(user: PublicUser): void {
  if (!user.roles.includes(ATHLETE_ROLE))
    throw new PlanError(403, "role_not_allowed", "Only student-athletes have assigned training plans.");
}

/**
 * Plans an athlete may see: PUBLISHED, assigned to them, and from a coach they are still connected
 * to (accepted). Disconnecting from a coach hides that coach's plans; reconnecting shows them again.
 */
const ASSIGNED_WHERE = (db: Db, me: string) => db`
  a.athlete_id = ${me} AND p.status = 'PUBLISHED'
  AND EXISTS (SELECT 1 FROM coach_athlete_connections c
              WHERE c.coach_id = p.coach_id AND c.athlete_id = a.athlete_id AND c.status = 'accepted')`;

export async function listAssignedPlans(
  actor: PublicUser,
  opts: { limit?: number; offset?: number } = {},
  dbArg?: Db,
): Promise<{ items: AssignedPlanSummary[]; total: number; limit: number; offset: number }> {
  requireAthlete(actor);
  const db = dbArg ?? (await getDb());
  const limit = Math.min(Math.max(Math.trunc(opts.limit ?? PAGE_DEFAULT), 1), PAGE_MAX);
  const offset = Math.max(Math.trunc(opts.offset ?? 0), 0);
  const rows = await db<{
    id: string; title: string; sport: string; skill_focus: string; start_date: string | null; end_date: string | null;
    coach_id: string; coach_name: string; assigned_at: Date;
  }[]>`
    SELECT p.id, p.title, p.sport, p.skill_focus,
           to_char(p.start_date, 'YYYY-MM-DD') AS start_date, to_char(p.end_date, 'YYYY-MM-DD') AS end_date,
           p.coach_id, cu.display_name AS coach_name, a.assigned_at
    FROM training_plan_assignments a
    JOIN training_plans p ON p.id = a.plan_id
    JOIN users cu ON cu.id = p.coach_id
    WHERE ${ASSIGNED_WHERE(db, actor.id)}
    ORDER BY p.start_date DESC NULLS LAST, p.id
    LIMIT ${limit} OFFSET ${offset}`;
  const [count] = await db<{ n: number }[]>`
    SELECT COUNT(*)::int AS n
    FROM training_plan_assignments a JOIN training_plans p ON p.id = a.plan_id
    WHERE ${ASSIGNED_WHERE(db, actor.id)}`;
  return {
    items: rows.map((r) => ({
      id: r.id, title: r.title, sport: r.sport, skillFocus: r.skill_focus, startDate: r.start_date, endDate: r.end_date,
      coach: { id: r.coach_id, displayName: r.coach_name }, assignedAt: r.assigned_at.toISOString(),
    })),
    total: count?.n ?? 0, limit, offset,
  };
}

export async function getAssignedPlan(actor: PublicUser, id: string, dbArg?: Db): Promise<AssignedPlanView> {
  requireAthlete(actor);
  requireId(id);
  const db = dbArg ?? (await getDb());
  const [row] = await db<{
    id: string; title: string; description: string; sport: string; skill_focus: string; start_date: string | null; end_date: string | null;
    coach_id: string; coach_name: string; assigned_at: Date; published_at: Date | null;
  }[]>`
    SELECT p.id, p.title, p.description, p.sport, p.skill_focus,
           to_char(p.start_date, 'YYYY-MM-DD') AS start_date, to_char(p.end_date, 'YYYY-MM-DD') AS end_date,
           p.coach_id, cu.display_name AS coach_name, a.assigned_at, p.published_at
    FROM training_plan_assignments a
    JOIN training_plans p ON p.id = a.plan_id
    JOIN users cu ON cu.id = p.coach_id
    WHERE p.id = ${id} AND ${ASSIGNED_WHERE(db, actor.id)}`;
  // Someone else's plan, a draft, or a plan from a disconnected coach all look the same: not found.
  if (!row) throw new PlanError(404, "plan_not_found", "Training plan not found.");
  const [schedule, goals] = await Promise.all([
    db<{ day_of_week: string; drill_name: string; duration_minutes: number; intensity: string }[]>`
      SELECT day_of_week, drill_name, duration_minutes, intensity FROM training_plan_schedule_items WHERE plan_id = ${id} ORDER BY position`,
    db<{ description: string }[]>`SELECT description FROM training_plan_goals WHERE plan_id = ${id} ORDER BY position`,
  ]);
  return {
    id: row.id, title: row.title, description: row.description, sport: row.sport, skillFocus: row.skill_focus,
    startDate: row.start_date, endDate: row.end_date,
    coach: { id: row.coach_id, displayName: row.coach_name },
    assignedAt: row.assigned_at.toISOString(),
    publishedAt: row.published_at ? row.published_at.toISOString() : null,
    schedule: schedule.map((s) => ({ day: s.day_of_week, drillName: s.drill_name, durationMinutes: s.duration_minutes, intensity: s.intensity })),
    goals: goals.map((g) => g.description),
  };
}
