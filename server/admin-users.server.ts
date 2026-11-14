// The administrator's User Management: a directory of every Student-Athlete, Coach and School
// Representative, with suspend / reactivate.
//
// Rules this module enforces itself (the caller's role is re-checked on every function):
//  - Only the administrator may call anything here.
//  - Administrator accounts never appear and can never be suspended, so the admin cannot lock
//    themselves out or touch the predefined account from this screen.
//  - Suspending is `users.is_active = FALSE`. Login and every session lookup already refuse inactive
//    accounts; suspending also signs the person out of every device immediately.
//
// Status shown in the directory:
//   suspended = account switched off by the administrator
//   pending   = a coach whose verification request is still waiting for review
//   active    = everything else

import { getDb, type Db } from "./db.server.ts";
import { audit, type PublicUser, type RequestMeta } from "./auth.server.ts";
import { ConnectionError } from "./connections.server.ts";
import { requireAdmin } from "./admin.server.ts";

export type UserStatus = "active" | "pending" | "suspended";
export type DirectoryRole = "student_athlete" | "coach" | "university_representative";
export const DIRECTORY_ROLES: readonly DirectoryRole[] = ["student_athlete", "coach", "university_representative"];
export const USER_STATUSES: readonly UserStatus[] = ["active", "pending", "suspended"];

export interface DirectoryUser {
  id: string;
  name: string;
  email: string;
  photo: string | null;
  /** the one role to show: representative > coach > student-athlete */
  role: DirectoryRole | null;
  school: string | null;
  status: UserStatus;
  registeredAt: string;
}

export interface DirectorySummary {
  total: number;
  active: number;
  pending: number;
  suspended: number;
}

export interface UserDetail extends DirectoryUser {
  username: string;
  roles: string[];
  verifiedCoach: boolean;
  sport: string | null;
  position: string | null;
  lastLoginAt: string | null;
  emailVerified: boolean;
  history: { event: "registered" | "suspended" | "reactivated"; at: string; reason: string | null }[];
}

const REASON_MAX = 300;
const SEARCH_MAX = 100;

/** Only ordinary http(s) image links are sent in the list; big inline images stay out of the payload. */
const safePhoto = (url: string | null): string | null => (url && /^https?:\/\//i.test(url) && url.length <= 500 ? url : null);

function primaryRole(roles: string[]): DirectoryRole | null {
  if (roles.includes("university_representative")) return "university_representative";
  if (roles.includes("coach") || roles.includes("verified_coach")) return "coach";
  if (roles.includes("student_athlete")) return "student_athlete";
  return null;
}

/** Every directory query starts from this: ordinary accounts only, with status/roles/school worked out. */
function directoryCte(db: Db) {
  return db`
    d AS (
      SELECT u.id, u.display_name, u.email, u.username, u.is_active, u.created_at, u.last_login_at, u.email_verified_at,
             up.avatar_url,
             ARRAY(SELECT r.name FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = u.id ORDER BY r.name) AS roles,
             COALESCE(NULLIF(btrim(rp.university_name), ''), NULLIF(btrim(cp.organization), ''), NULLIF(btrim(ap.school), '')) AS school,
             COALESCE(NULLIF(btrim(ap.sport), ''), NULLIF(btrim(cp.sport_specialization), '')) AS sport,
             COALESCE(NULLIF(btrim(ap.playing_position), ''), NULLIF(btrim(cp.coaching_position), ''), NULLIF(btrim(rp.designation), '')) AS position,
             CASE WHEN NOT u.is_active THEN 'suspended'
                  WHEN EXISTS (SELECT 1 FROM coach_verifications v WHERE v.coach_id = u.id AND v.status = 'pending') THEN 'pending'
                  ELSE 'active' END AS status
      FROM users u
      LEFT JOIN user_profiles up ON up.user_id = u.id
      LEFT JOIN athlete_profiles ap ON ap.user_id = u.id
      LEFT JOIN coach_profiles cp ON cp.user_id = u.id
      LEFT JOIN university_representative_profiles rp ON rp.user_id = u.id
      WHERE u.deleted_at IS NULL
        AND NOT EXISTS (SELECT 1 FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = u.id AND r.name = 'admin')
    )`;
}

interface Row {
  id: string; display_name: string; email: string; username: string; avatar_url: string | null;
  roles: string[]; school: string | null; sport: string | null; position: string | null;
  status: UserStatus; created_at: Date; last_login_at: Date | null; email_verified_at: Date | null;
}

const toListUser = (r: Row): DirectoryUser => ({
  id: r.id,
  name: r.display_name,
  email: r.email,
  photo: safePhoto(r.avatar_url),
  role: primaryRole(r.roles),
  school: r.school,
  status: r.status,
  registeredAt: r.created_at.toISOString(),
});

const escapeLike = (s: string) => s.replace(/[\\%_]/g, (c) => `\\${c}`);

export interface ListOptions {
  q?: string;
  role?: DirectoryRole;
  status?: UserStatus;
  limit?: number;
  offset?: number;
}

export async function listUsers(
  actor: Pick<PublicUser, "roles">,
  opts: ListOptions = {},
): Promise<{ items: DirectoryUser[]; total: number; limit: number; offset: number; summary: DirectorySummary }> {
  requireAdmin(actor);
  const db = await getDb();
  const limit = Math.min(Math.max(Math.trunc(opts.limit ?? 20), 1), 100);
  const offset = Math.max(Math.trunc(opts.offset ?? 0), 0);

  // The role fragments are constants chosen by a switch, never built from input.
  const roleF =
    opts.role === "student_athlete" ? db`AND 'student_athlete' = ANY(roles)`
    : opts.role === "coach" ? db`AND (roles && ARRAY['coach', 'verified_coach'])`
    : opts.role === "university_representative" ? db`AND 'university_representative' = ANY(roles)`
    : db``;
  const statusF = opts.status ? db`AND status = ${opts.status}` : db``;
  const q = (opts.q ?? "").trim().slice(0, SEARCH_MAX);
  const pattern = `%${escapeLike(q)}%`;
  const qF = q ? db`AND (display_name ILIKE ${pattern} OR email ILIKE ${pattern} OR username ILIKE ${pattern} OR COALESCE(school, '') ILIKE ${pattern})` : db``;

  const rows = await db<Row[]>`
    WITH ${directoryCte(db)}
    SELECT * FROM d WHERE TRUE ${roleF} ${statusF} ${qF}
    ORDER BY created_at DESC, id LIMIT ${limit} OFFSET ${offset}`;
  const [count] = await db<{ n: number }[]>`
    WITH ${directoryCte(db)} SELECT COUNT(*)::int AS n FROM d WHERE TRUE ${roleF} ${statusF} ${qF}`;
  const [sum] = await db<{ total: number; active: number; pending: number; suspended: number }[]>`
    WITH ${directoryCte(db)}
    SELECT COUNT(*)::int AS total,
           COUNT(*) FILTER (WHERE status = 'active')::int AS active,
           COUNT(*) FILTER (WHERE status = 'pending')::int AS pending,
           COUNT(*) FILTER (WHERE status = 'suspended')::int AS suspended
    FROM d`;
  return {
    items: rows.map(toListUser),
    total: count?.n ?? 0,
    limit,
    offset,
    summary: { total: sum?.total ?? 0, active: sum?.active ?? 0, pending: sum?.pending ?? 0, suspended: sum?.suspended ?? 0 },
  };
}

async function findRow(db: Db, id: string): Promise<Row | undefined> {
  const [row] = await db<Row[]>`WITH ${directoryCte(db)} SELECT * FROM d WHERE id = ${id}`;
  return row;
}

const notFound = () => new ConnectionError(404, "user_not_found", "That user could not be found.");

export async function getUserDetail(actor: Pick<PublicUser, "roles">, id: string): Promise<UserDetail> {
  requireAdmin(actor);
  const db = await getDb();
  const row = await findRow(db, id);
  if (!row) throw notFound();

  const events = await db<{ event: string; detail: string | null; created_at: Date }[]>`
    SELECT event, detail, created_at FROM audit_log
    WHERE user_id = ${id} AND event IN ('user.created', 'admin.user_suspended', 'admin.user_reactivated')
    ORDER BY created_at DESC, id DESC LIMIT 10`;
  const history = events.map((e) => {
    let reason: string | null = null;
    try { reason = (JSON.parse(e.detail ?? "{}") as { reason?: unknown }).reason as string | null ?? null; } catch { /* no reason */ }
    return {
      event: e.event === "user.created" ? ("registered" as const) : e.event === "admin.user_suspended" ? ("suspended" as const) : ("reactivated" as const),
      at: e.created_at.toISOString(),
      reason: typeof reason === "string" && reason ? reason : null,
    };
  });

  return {
    ...toListUser(row),
    username: row.username,
    roles: row.roles,
    verifiedCoach: row.roles.includes("verified_coach"),
    sport: row.sport,
    position: row.position,
    lastLoginAt: row.last_login_at ? row.last_login_at.toISOString() : null,
    emailVerified: !!row.email_verified_at,
    history,
  };
}

async function setSuspended(
  actor: Pick<PublicUser, "id" | "roles">,
  id: string,
  suspend: boolean,
  reasonInput: unknown,
  meta: RequestMeta,
): Promise<UserDetail> {
  requireAdmin(actor);
  if (id === actor.id) throw new ConnectionError(400, "cannot_suspend_self", "You can't change your own account here.");
  const db = await getDb();

  let reason: string | null = null;
  if (typeof reasonInput === "string" && reasonInput.trim()) {
    reason = reasonInput.trim();
    if (reason.length > REASON_MAX) throw new ConnectionError(400, "validation", `The reason can be up to ${REASON_MAX} characters.`);
  }

  await db.begin(async (tx) => {
    // Lock the row so two administrators (or a double click) cannot race.
    const [locked] = await tx<{ is_active: boolean }[]>`
      SELECT u.is_active FROM users u
      WHERE u.id = ${id} AND u.deleted_at IS NULL
        AND NOT EXISTS (SELECT 1 FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = u.id AND r.name = 'admin')
      FOR UPDATE`;
    if (!locked) throw notFound();
    if (suspend && !locked.is_active) throw new ConnectionError(409, "already_suspended", "This account is already suspended.");
    if (!suspend && locked.is_active) throw new ConnectionError(409, "not_suspended", "This account isn't suspended.");

    await tx`UPDATE users SET is_active = ${!suspend}, updated_at = ${new Date()} WHERE id = ${id}`;
    if (suspend) await tx`DELETE FROM sessions WHERE user_id = ${id}`; // signed out everywhere, right now
    await audit(
      suspend ? "admin.user_suspended" : "admin.user_reactivated",
      { userId: id, ...meta, detail: { by: actor.id, ...(reason ? { reason } : {}) } },
      tx as unknown as Db,
    );
  });
  return getUserDetail(actor, id);
}

export const suspendUser = (actor: Pick<PublicUser, "id" | "roles">, id: string, reason: unknown, meta: RequestMeta) =>
  setSuspended(actor, id, true, reason, meta);

export const reactivateUser = (actor: Pick<PublicUser, "id" | "roles">, id: string, reason: unknown, meta: RequestMeta) =>
  setSuspended(actor, id, false, reason, meta);
