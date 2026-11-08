// Coach–athlete connections: sending, answering, cancelling and ending connection requests.
//
// SERVER ONLY. Works on the `coach_athlete_connections` table (migration 2 in db.server.ts).
// A coach is a user with the `coach` role and an athlete is a user with the `student_athlete`
// role, so both sides reference users(id). The table keeps ONE row per coach-athlete pair for the
// life of the relationship: declining, cancelling or disconnecting changes its status, and a later
// request flips the same row back to 'pending'.
//
// Rules enforced here (the database guarantees the shape, this file guarantees who may do what):
//  - Only a coach and a student-athlete can be connected, in either direction of request.
//  - The coach in a pair must be VERIFIED whenever a link is created or activated (sending a
//    request, accepting one). Leaving (decline / cancel / disconnect) is never blocked.
//  - Only the person a request was sent TO can accept or decline it; only the person who SENT it
//    can cancel it; either side of an accepted connection can disconnect.
//  - A pair can never hold two live requests: a second request, from either side, is a conflict.
//  - Every state change is one conditional UPDATE, so two racing requests cannot both win.
//  - Athlete search is for VERIFIED coaches only and returns ids and names, never email addresses.

import { randomUUID } from "node:crypto";
import { getDb, type Db } from "./db.server.ts";
import { audit, type PublicUser, type RequestMeta } from "./auth.server.ts";
import { notify } from "./notifications.server.ts";

export const COACH_ROLE = "coach";
export const ATHLETE_ROLE = "student_athlete";

/**
 * A coach counts as verified when this permission reaches them through any of their roles. It is
 * the permission db.server.ts says to grant "when coach approval exists", so verification is read
 * from the existing role/permission tables and is never taken from the request. Today only the
 * `admin` role holds it, so a self-registered coach stays unverified until approval grants it.
 */
export const COACH_VERIFIED_PERMISSION = "sessions:verify";

export const PAGE_DEFAULT = 50;
export const PAGE_MAX = 100;

export const SEARCH_MIN_CHARS = 2;
export const SEARCH_MAX_CHARS = 80;
export const SEARCH_LIMIT_DEFAULT = 10;
export const SEARCH_LIMIT_MAX = 20;

export type ConnectionStatus = "pending" | "accepted" | "declined" | "cancelled" | "disconnected";
export type ListKind = "incoming" | "outgoing" | "accepted";
type Side = "coach" | "athlete";

/** An expected, user-facing failure. `httpStatus` and `code` are what the API sends back. */
export class ConnectionError extends Error {
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

export interface ConnectionCounterpart {
  id: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  role: "coach" | "student_athlete";
  /** Only present when the counterpart is a coach. */
  coach?: { organization: string; position: string; sport: string; verified: boolean };
}

export interface ConnectionView {
  id: string;
  status: ConnectionStatus;
  /** true when the signed-in user is the one who sent the request */
  requestedByMe: boolean;
  requestedAt: string;
  /** When the request was accepted or declined; null while pending or after a cancel. */
  respondedAt: string | null;
  updatedAt: string;
  counterpart: ConnectionCounterpart;
}

export interface ConnectionPage {
  items: ConnectionView[];
  total: number;
  limit: number;
  offset: number;
}

interface ConnectionRow {
  id: string;
  coach_id: string;
  athlete_id: string;
  requested_by: string;
  status: ConnectionStatus;
  requested_at: Date;
  responded_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

interface ViewRow {
  id: string;
  coach_id: string;
  athlete_id: string;
  requested_by: string;
  status: ConnectionStatus;
  requested_at: Date;
  responded_at: Date | null;
  updated_at: Date;
  other_id: string;
  other_name: string;
  first_name: string | null;
  last_name: string | null;
  organization: string | null;
  coaching_position: string | null;
  sport_specialization: string | null;
  coach_verified: boolean;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const now = () => new Date();

// ---------- small helpers ----------

function hasRole(user: Pick<PublicUser, "roles">, role: string): boolean {
  return user.roles.includes(role);
}

/** Everyone who calls this API must be a coach or a student-athlete (not an admin or a rep). */
function requireConnectionRole(user: PublicUser): void {
  if (!hasRole(user, COACH_ROLE) && !hasRole(user, ATHLETE_ROLE))
    throw new ConnectionError(403, "role_not_allowed", "Only coaches and student-athletes can use connections.");
}

function requireId(id: string): void {
  if (!UUID_RE.test(id)) throw new ConnectionError(404, "connection_not_found", "Connection not found.");
}

export async function isVerifiedCoach(db: Db, coachId: string): Promise<boolean> {
  const [row] = await db<{ ok: boolean }[]>`
    SELECT EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN role_permissions rp ON rp.role_id = ur.role_id
      JOIN permissions p ON p.id = rp.permission_id
      WHERE ur.user_id = ${coachId} AND p.name = ${COACH_VERIFIED_PERMISSION}
    ) AS ok`;
  return row?.ok === true;
}

async function assertCoachVerified(db: Db, coachId: string, actorIsCoach: boolean): Promise<void> {
  if (await isVerifiedCoach(db, coachId)) return;
  throw new ConnectionError(
    403,
    "coach_not_verified",
    actorIsCoach
      ? "Your coach account has not been verified yet."
      : "This coach has not been verified yet.",
  );
}

async function findById(db: Db, id: string): Promise<ConnectionRow | undefined> {
  const [row] = await db<ConnectionRow[]>`SELECT * FROM coach_athlete_connections WHERE id = ${id}`;
  return row;
}

async function findPair(db: Db, coachId: string, athleteId: string): Promise<ConnectionRow | undefined> {
  const [row] = await db<ConnectionRow[]>`
    SELECT * FROM coach_athlete_connections WHERE coach_id = ${coachId} AND athlete_id = ${athleteId}`;
  return row;
}

/** Loads a connection the actor is part of. Anyone else gets "not found", never "forbidden". */
async function loadForActor(db: Db, id: string, actor: PublicUser): Promise<{ row: ConnectionRow; side: Side }> {
  requireId(id);
  const [row] = await db<ConnectionRow[]>`
    SELECT * FROM coach_athlete_connections
    WHERE id = ${id} AND (coach_id = ${actor.id} OR athlete_id = ${actor.id})`;
  if (!row) throw new ConnectionError(404, "connection_not_found", "Connection not found.");
  const side: Side = row.coach_id === actor.id ? "coach" : "athlete";
  // The actor must still hold the role of the side they are on in this pair.
  if (!hasRole(actor, side === "coach" ? COACH_ROLE : ATHLETE_ROLE))
    throw new ConnectionError(403, "role_not_allowed", "Your account can't manage this connection.");
  return { row, side };
}

// ---------- reading ----------

function baseSelect(db: Db, me: string) {
  return db`
    SELECT c.id, c.coach_id, c.athlete_id, c.requested_by, c.status, c.requested_at, c.responded_at, c.updated_at,
           u.id AS other_id, u.display_name AS other_name,
           up.first_name, up.last_name,
           cp.organization, cp.coaching_position, cp.sport_specialization,
           EXISTS (
             SELECT 1 FROM user_roles ur
             JOIN role_permissions rp ON rp.role_id = ur.role_id
             JOIN permissions p ON p.id = rp.permission_id
             WHERE ur.user_id = c.coach_id AND p.name = ${COACH_VERIFIED_PERMISSION}
           ) AS coach_verified
    FROM coach_athlete_connections c
    JOIN users u ON u.id = CASE WHEN c.coach_id = ${me} THEN c.athlete_id ELSE c.coach_id END
    LEFT JOIN user_profiles up ON up.user_id = u.id
    LEFT JOIN coach_profiles cp ON cp.user_id = c.coach_id`;
}

function toView(row: ViewRow, me: string): ConnectionView {
  const otherIsCoach = row.coach_id !== me;
  const counterpart: ConnectionCounterpart = {
    id: row.other_id,
    displayName: row.other_name,
    ...(row.first_name?.trim() ? { firstName: row.first_name.trim() } : {}),
    ...(row.last_name?.trim() ? { lastName: row.last_name.trim() } : {}),
    role: otherIsCoach ? COACH_ROLE : ATHLETE_ROLE,
    ...(otherIsCoach
      ? {
          coach: {
            organization: row.organization ?? "",
            position: row.coaching_position ?? "",
            sport: row.sport_specialization ?? "",
            verified: row.coach_verified,
          },
        }
      : {}),
  };
  return {
    id: row.id,
    status: row.status,
    requestedByMe: row.requested_by === me,
    requestedAt: row.requested_at.toISOString(),
    respondedAt: row.responded_at ? row.responded_at.toISOString() : null,
    updatedAt: row.updated_at.toISOString(),
    counterpart,
  };
}

async function viewById(db: Db, id: string, me: string): Promise<ConnectionView> {
  const [row] = await db<ViewRow[]>`${baseSelect(db, me)} WHERE c.id = ${id}`;
  if (!row) throw new ConnectionError(404, "connection_not_found", "Connection not found.");
  return toView(row, me);
}

/** Pending requests sent TO me (incoming), pending requests I sent (outgoing), or accepted connections. */
export async function listConnections(
  actor: PublicUser,
  kind: ListKind,
  paging: { limit?: number; offset?: number } = {},
  dbArg?: Db,
): Promise<ConnectionPage> {
  requireConnectionRole(actor);
  const db = dbArg ?? (await getDb());
  const me = actor.id;
  const limit = Math.min(Math.max(Math.trunc(paging.limit ?? PAGE_DEFAULT), 1), PAGE_MAX);
  const offset = Math.max(Math.trunc(paging.offset ?? 0), 0);

  const filter =
    kind === "incoming"
      ? db`c.status = 'pending' AND c.requested_by <> ${me}`
      : kind === "outgoing"
        ? db`c.status = 'pending' AND c.requested_by = ${me}`
        : db`c.status = 'accepted'`;
  // Only people who can still sign in are listed; the order is newest activity first.
  const where = db`
    WHERE (c.coach_id = ${me} OR c.athlete_id = ${me}) AND ${filter}
      AND u.is_active = TRUE AND u.deleted_at IS NULL`;
  const order = kind === "accepted" ? db`ORDER BY c.responded_at DESC, c.id` : db`ORDER BY c.requested_at DESC, c.id`;

  const rows = await db<ViewRow[]>`${baseSelect(db, me)} ${where} ${order} LIMIT ${limit} OFFSET ${offset}`;
  const [count] = await db<{ n: number }[]>`
    SELECT COUNT(*)::int AS n
    FROM coach_athlete_connections c
    JOIN users u ON u.id = CASE WHEN c.coach_id = ${me} THEN c.athlete_id ELSE c.coach_id END
    ${where}`;
  return { items: rows.map((r) => toView(r, me)), total: count?.n ?? 0, limit, offset };
}

// ---------- athlete search ----------

/** What a coach may learn about an athlete before connecting: an id and a name, nothing else. */
export interface AthleteSearchResult {
  id: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
}

/** Escapes LIKE wildcards so "50%" or "a_b" is matched literally rather than as a pattern. */
function likeLiteral(text: string): string {
  return text.replace(/[\\%_]/g, (c) => `\\${c}`);
}

/**
 * Lets a VERIFIED coach find active student-athletes by name. Every word typed must match the
 * start of the display name, first name or last name. Email and username are never searched and
 * never returned. Athletes who are inactive or deleted are left out. A short or empty query
 * returns an empty list instead of the whole athlete table.
 */
export async function searchAthletes(
  actor: PublicUser,
  rawQuery: string,
  rawLimit: number = SEARCH_LIMIT_DEFAULT,
  meta: Partial<RequestMeta> = {},
  dbArg?: Db,
): Promise<{ items: AthleteSearchResult[] }> {
  if (!hasRole(actor, COACH_ROLE))
    throw new ConnectionError(403, "role_not_allowed", "Only coaches can search for athletes.");
  const db = dbArg ?? (await getDb());
  await assertCoachVerified(db, actor.id, true);

  const words = rawQuery.trim().slice(0, SEARCH_MAX_CHARS).split(/\s+/).filter(Boolean).slice(0, 4);
  if (words.join(" ").length < SEARCH_MIN_CHARS) return { items: [] };
  const limit = Math.min(Math.max(Math.trunc(Number.isFinite(rawLimit) ? rawLimit : SEARCH_LIMIT_DEFAULT), 1), SEARCH_LIMIT_MAX);

  // One condition per word, all of which must hold (AND).
  let nameMatch = db`TRUE`;
  for (const w of words) {
    const prefix = `${likeLiteral(w)}%`;
    const inner = `% ${likeLiteral(w)}%`;
    nameMatch = db`${nameMatch} AND (
      u.display_name ILIKE ${prefix} OR u.display_name ILIKE ${inner}
      OR up.first_name ILIKE ${prefix} OR up.last_name ILIKE ${prefix})`;
  }

  const rows = await db<{ id: string; display_name: string; first_name: string | null; last_name: string | null }[]>`
    SELECT u.id, u.display_name, up.first_name, up.last_name
    FROM users u
    LEFT JOIN user_profiles up ON up.user_id = u.id
    WHERE u.is_active = TRUE AND u.deleted_at IS NULL AND u.id <> ${actor.id}
      AND EXISTS (
        SELECT 1 FROM user_roles ur JOIN roles r ON r.id = ur.role_id
        WHERE ur.user_id = u.id AND r.name = ${ATHLETE_ROLE})
      AND ${nameMatch}
    ORDER BY u.display_name, u.id
    LIMIT ${limit}`;

  await audit("athlete.searched", { userId: actor.id, ...meta, detail: { queryLength: words.join(" ").length, results: rows.length } }, db);

  return {
    items: rows.map((r) => ({
      id: r.id,
      displayName: r.display_name,
      ...(r.first_name?.trim() ? { firstName: r.first_name.trim() } : {}),
      ...(r.last_name?.trim() ? { lastName: r.last_name.trim() } : {}),
    })),
  };
}

// ---------- sending ----------

function conflictFor(row: ConnectionRow, actorId: string): ConnectionError {
  if (row.status === "accepted")
    return new ConnectionError(409, "already_connected", "You are already connected.", { connectionId: row.id });
  if (row.status === "pending" && row.requested_by === actorId)
    return new ConnectionError(409, "request_already_sent", "You already sent a request to this person.", {
      connectionId: row.id,
    });
  if (row.status === "pending")
    return new ConnectionError(
      409,
      "request_already_received",
      "This person already sent you a request. Accept or decline it instead.",
      { connectionId: row.id },
    );
  return new ConnectionError(409, "request_conflict", "This connection changed. Reload and try again.", {
    connectionId: row.id,
  });
}

export async function sendRequest(
  actor: PublicUser,
  targetUserId: string,
  meta: Partial<RequestMeta> = {},
  dbArg?: Db,
): Promise<{ connection: ConnectionView; created: boolean }> {
  requireConnectionRole(actor);
  const db = dbArg ?? (await getDb());
  if (targetUserId === actor.id)
    throw new ConnectionError(422, "cannot_connect_to_self", "You can't send a connection request to yourself.");

  const [target] = await db<{ id: string }[]>`
    SELECT id FROM users WHERE id = ${targetUserId} AND is_active = TRUE AND deleted_at IS NULL`;
  if (!target) throw new ConnectionError(404, "user_not_found", "That user could not be found.");
  const targetRoles = (
    await db<{ name: string }[]>`
      SELECT r.name FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = ${targetUserId}`
  ).map((r) => r.name);

  // Work out who is the coach and who is the athlete from the roles on both accounts.
  let coachId: string;
  let athleteId: string;
  if (hasRole(actor, COACH_ROLE) && targetRoles.includes(ATHLETE_ROLE)) {
    coachId = actor.id;
    athleteId = targetUserId;
  } else if (hasRole(actor, ATHLETE_ROLE) && targetRoles.includes(COACH_ROLE)) {
    coachId = targetUserId;
    athleteId = actor.id;
  } else {
    throw new ConnectionError(
      422,
      "invalid_pair",
      hasRole(actor, COACH_ROLE)
        ? "Coaches can only send requests to student-athletes."
        : "Student-athletes can only send requests to coaches.",
    );
  }

  await assertCoachVerified(db, coachId, coachId === actor.id);

  const ts = now();
  let row = await findPair(db, coachId, athleteId);
  let created = false;
  if (!row) {
    const [inserted] = await db<ConnectionRow[]>`
      INSERT INTO coach_athlete_connections
        (id, coach_id, athlete_id, requested_by, status, requested_at, created_at, updated_at)
      VALUES (${randomUUID()}, ${coachId}, ${athleteId}, ${actor.id}, 'pending', ${ts}, ${ts}, ${ts})
      ON CONFLICT (coach_id, athlete_id) DO NOTHING
      RETURNING *`;
    if (inserted) {
      row = inserted;
      created = true;
    } else {
      // Someone else created the pair a moment ago; fall through to the normal duplicate rules.
      row = await findPair(db, coachId, athleteId);
    }
  }
  if (!row) throw new ConnectionError(409, "request_conflict", "This connection changed. Try again.");

  if (!created) {
    if (row.status === "pending" || row.status === "accepted") throw conflictFor(row, actor.id);
    // declined / cancelled / disconnected: the same row becomes a fresh pending request.
    const [reopened] = await db<ConnectionRow[]>`
      UPDATE coach_athlete_connections
      SET status = 'pending', requested_by = ${actor.id}, requested_at = ${ts}, responded_at = NULL, updated_at = ${ts}
      WHERE id = ${row.id} AND status IN ('declined', 'cancelled', 'disconnected')
      RETURNING *`;
    if (!reopened) {
      const current = await findById(db, row.id);
      throw current ? conflictFor(current, actor.id) : new ConnectionError(409, "request_conflict", "Try again.");
    }
    row = reopened;
  }

  await audit(
    "connection.requested",
    { userId: actor.id, ...meta, detail: { connectionId: row.id, coachId, athleteId, reopened: !created } },
    db,
  );
  const otherId = actor.id === coachId ? athleteId : coachId;
  await notify(otherId, { category: "connection", title: "New connection request", message: `${actor.displayName} wants to connect with you.` }, db);
  return { connection: await viewById(db, row.id, actor.id), created };
}

// ---------- answering, cancelling, disconnecting ----------

export async function respondToRequest(
  actor: PublicUser,
  connectionId: string,
  decision: "accepted" | "declined",
  meta: Partial<RequestMeta> = {},
  dbArg?: Db,
): Promise<ConnectionView> {
  requireConnectionRole(actor);
  const db = dbArg ?? (await getDb());
  const { row, side } = await loadForActor(db, connectionId, actor);

  if (row.requested_by === actor.id)
    throw new ConnectionError(403, "not_recipient", "Only the person who received a request can answer it.");
  if (row.status !== "pending")
    throw new ConnectionError(409, "not_pending", "This request is no longer pending.");

  if (decision === "accepted") {
    await assertCoachVerified(db, row.coach_id, side === "coach");
    const otherId = side === "coach" ? row.athlete_id : row.coach_id;
    const [other] = await db`SELECT 1 AS x FROM users WHERE id = ${otherId} AND is_active = TRUE AND deleted_at IS NULL`;
    if (!other) throw new ConnectionError(409, "user_unavailable", "The other person's account is no longer available.");
  }

  const ts = now();
  // GREATEST keeps the database's "an answer cannot predate the request" rule safe when two
  // server instances have clocks a few milliseconds apart.
  const [updated] = await db<ConnectionRow[]>`
    UPDATE coach_athlete_connections
    SET status = ${decision}, responded_at = GREATEST(${ts}::timestamptz, requested_at), updated_at = ${ts}
    WHERE id = ${row.id} AND status = 'pending' AND requested_by <> ${actor.id}
    RETURNING *`;
  if (!updated) throw new ConnectionError(409, "not_pending", "This request is no longer pending.");

  await audit(
    decision === "accepted" ? "connection.accepted" : "connection.declined",
    { userId: actor.id, ...meta, detail: { connectionId: row.id, coachId: row.coach_id, athleteId: row.athlete_id } },
    db,
  );
  // The person who sent the request is the one waiting for the answer.
  await notify(
    row.requested_by,
    {
      category: "connection",
      title: decision === "accepted" ? "Connection accepted" : "Connection declined",
      message: decision === "accepted" ? `${actor.displayName} accepted your connection request.` : `${actor.displayName} declined your connection request.`,
    },
    db,
  );
  return viewById(db, row.id, actor.id);
}

export async function cancelRequest(
  actor: PublicUser,
  connectionId: string,
  meta: Partial<RequestMeta> = {},
  dbArg?: Db,
): Promise<ConnectionView> {
  requireConnectionRole(actor);
  const db = dbArg ?? (await getDb());
  const { row } = await loadForActor(db, connectionId, actor);

  if (row.requested_by !== actor.id)
    throw new ConnectionError(403, "not_requester", "Only the person who sent a request can cancel it.");
  if (row.status !== "pending")
    throw new ConnectionError(409, "not_pending", "This request is no longer pending.");

  const ts = now();
  const [updated] = await db<ConnectionRow[]>`
    UPDATE coach_athlete_connections
    SET status = 'cancelled', updated_at = ${ts}
    WHERE id = ${row.id} AND status = 'pending' AND requested_by = ${actor.id}
    RETURNING *`;
  if (!updated) throw new ConnectionError(409, "not_pending", "This request is no longer pending.");

  await audit(
    "connection.cancelled",
    { userId: actor.id, ...meta, detail: { connectionId: row.id, coachId: row.coach_id, athleteId: row.athlete_id } },
    db,
  );
  return viewById(db, row.id, actor.id);
}

export async function disconnect(
  actor: PublicUser,
  connectionId: string,
  meta: Partial<RequestMeta> = {},
  dbArg?: Db,
): Promise<ConnectionView> {
  requireConnectionRole(actor);
  const db = dbArg ?? (await getDb());
  const { row } = await loadForActor(db, connectionId, actor);

  if (row.status !== "accepted")
    throw new ConnectionError(409, "not_connected", "You are not connected to this person.");

  const ts = now();
  const [updated] = await db<ConnectionRow[]>`
    UPDATE coach_athlete_connections
    SET status = 'disconnected', updated_at = ${ts}
    WHERE id = ${row.id} AND status = 'accepted'
    RETURNING *`;
  if (!updated) throw new ConnectionError(409, "not_connected", "You are not connected to this person.");

  await audit(
    "connection.disconnected",
    { userId: actor.id, ...meta, detail: { connectionId: row.id, coachId: row.coach_id, athleteId: row.athlete_id } },
    db,
  );
  return viewById(db, row.id, actor.id);
}
