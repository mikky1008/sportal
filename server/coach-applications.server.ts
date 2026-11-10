// Athlete applications to a coach's program ("show interest").
//
// SERVER ONLY. Works on `athlete_applications` (migration 4: new / reviewed / dismissed).
//
//  - A student-athlete can show interest in a VERIFIED coach, once. They cannot if the two are already
//    connected. A coach who dismissed them is not pestered again (it stays dismissed).
//  - The coach is told, sees who applied (name, sport, school, nothing private) and can mark the
//    application reviewed or dismissed. From there they open the athlete's showcase or send a
//    connection request, using the screens that already exist.
//  - Athletes see only their own applications; coaches only the ones sent to them.
//  - Capped at 10 new applications per athlete per day.

import { randomUUID } from "node:crypto";
import { getDb, type Db } from "./db.server.ts";
import { audit, type PublicUser, type RequestMeta } from "./auth.server.ts";
import { ATHLETE_ROLE, COACH_ROLE, isVerifiedCoach } from "./connections.server.ts";
import { notify } from "./notifications.server.ts";

export const APPLICATIONS_PER_DAY = 10;

export class CoachApplicationError extends Error {
  readonly httpStatus: number;
  readonly code: string;
  constructor(httpStatus: number, code: string, message: string) {
    super(message);
    this.httpStatus = httpStatus;
    this.code = code;
  }
}

export type ApplicationStatus = "new" | "reviewed" | "dismissed";

export interface ReceivedApplication {
  id: string;
  status: ApplicationStatus;
  createdAt: string;
  athlete: { id: string; displayName: string; sport: string; school: string };
  /** a showcase page exists for this athlete (started profile and not hidden) */
  hasShowcase: boolean;
  /** already on the coach's My Athletes, or a connection request is open */
  relationship: "connected" | "request_sent" | "request_received" | "none";
}

export interface SentApplication {
  id: string;
  status: ApplicationStatus;
  createdAt: string;
  coach: { id: string; displayName: string; organization: string };
}

const notFound = () => new CoachApplicationError(404, "not_found", "Not found.");

export async function applyToCoach(user: PublicUser, coachId: string, meta: Partial<RequestMeta> = {}, dbArg?: Db): Promise<SentApplication> {
  if (!user.roles.includes(ATHLETE_ROLE)) throw new CoachApplicationError(403, "role_not_allowed", "Only student-athletes can show interest in a coach.");
  const db = dbArg ?? (await getDb());
  const [coach] = await db<{ id: string; display_name: string; organization: string | null }[]>`
    SELECT u.id, u.display_name, cp.organization
    FROM users u
    LEFT JOIN coach_profiles cp ON cp.user_id = u.id
    WHERE u.id = ${coachId} AND u.is_active = TRUE AND u.deleted_at IS NULL`;
  if (!coach || !user.id || coachId === user.id || !(await isVerifiedCoach(db, coachId))) throw notFound();

  const [connected] = await db`SELECT 1 FROM coach_athlete_connections WHERE coach_id = ${coachId} AND athlete_id = ${user.id} AND status = 'accepted'`;
  if (connected) throw new CoachApplicationError(409, "already_connected", "You are already connected to this coach.");

  const id = randomUUID();
  const now = new Date();
  const [today] = await db<{ n: number }[]>`
    SELECT count(*)::int AS n FROM athlete_applications WHERE athlete_id = ${user.id} AND created_at > ${new Date(now.getTime() - 24 * 60 * 60 * 1000)}`;
  if ((today?.n ?? 0) >= APPLICATIONS_PER_DAY) throw new CoachApplicationError(429, "rate_limited", "You have applied to a lot of coaches today. Please try again tomorrow.");

  // One row per coach-athlete pair: a second attempt (or a dismissed one) never creates another.
  const rows = await db<{ id: string }[]>`
    INSERT INTO athlete_applications (id, coach_id, athlete_id, status, created_at, updated_at)
    VALUES (${id}, ${coachId}, ${user.id}, 'new', ${now}, ${now})
    ON CONFLICT (coach_id, athlete_id) DO NOTHING RETURNING id`;
  if (rows.length === 0) throw new CoachApplicationError(409, "already_applied", "You have already shown interest in this coach.");

  await audit("coach_application.sent", { userId: user.id, ...meta, detail: { applicationId: id, coachId } }, db);
  await notify(coachId, { category: "application", title: "New athlete application", message: `${user.displayName} is interested in your program.`, link: "/coach/applications" }, db);
  return { id, status: "new", createdAt: now.toISOString(), coach: { id: coach.id, displayName: coach.display_name, organization: coach.organization ?? "" } };
}

/** The coach's inbox of applications (new first), or the athlete's own sent ones. */
export async function listApplications(user: PublicUser, dbArg?: Db): Promise<{ received?: ReceivedApplication[]; sent?: SentApplication[] }> {
  const db = dbArg ?? (await getDb());
  if (user.roles.includes(COACH_ROLE)) {
    if (!(await isVerifiedCoach(db, user.id))) throw new CoachApplicationError(403, "coach_not_verified", "Your coach account must be verified first.");
    const rows = await db<{
      id: string; status: ApplicationStatus; created_at: Date; athlete_id: string; name: string; sport: string; school: string; visible: boolean;
      conn_status: string | null; requested_by: string | null;
    }[]>`
      SELECT a.id, a.status, a.created_at, u.id AS athlete_id,
             COALESCE(NULLIF(btrim(concat_ws(' ', up.first_name, up.last_name)), ''), u.display_name) AS name,
             COALESCE(ap.sport, '') AS sport, COALESCE(ap.school, '') AS school, COALESCE(ap.showcase_visible, TRUE) AS visible,
             c.status AS conn_status, c.requested_by
      FROM athlete_applications a
      JOIN users u ON u.id = a.athlete_id
      LEFT JOIN user_profiles up ON up.user_id = u.id
      LEFT JOIN athlete_profiles ap ON ap.user_id = u.id
      LEFT JOIN coach_athlete_connections c ON c.coach_id = a.coach_id AND c.athlete_id = a.athlete_id
      WHERE a.coach_id = ${user.id} AND u.is_active = TRUE AND u.deleted_at IS NULL
      ORDER BY (a.status = 'new') DESC, a.created_at DESC, a.id`;
    return {
      received: rows.map((r) => ({
        id: r.id,
        status: r.status,
        createdAt: r.created_at.toISOString(),
        athlete: { id: r.athlete_id, displayName: r.name, sport: r.sport, school: r.school },
        hasShowcase: r.sport !== "" && r.visible,
        relationship:
          r.conn_status === "accepted" ? "connected"
          : r.conn_status === "pending" ? (r.requested_by === user.id ? "request_sent" : "request_received")
          : "none",
      })),
    };
  }
  if (user.roles.includes(ATHLETE_ROLE)) {
    const rows = await db<{ id: string; status: ApplicationStatus; created_at: Date; coach_id: string; name: string; organization: string | null }[]>`
      SELECT a.id, a.status, a.created_at, u.id AS coach_id, u.display_name AS name, cp.organization
      FROM athlete_applications a
      JOIN users u ON u.id = a.coach_id
      LEFT JOIN coach_profiles cp ON cp.user_id = u.id
      WHERE a.athlete_id = ${user.id} ORDER BY a.created_at DESC, a.id`;
    return { sent: rows.map((r) => ({ id: r.id, status: r.status, createdAt: r.created_at.toISOString(), coach: { id: r.coach_id, displayName: r.name, organization: r.organization ?? "" } })) };
  }
  throw new CoachApplicationError(403, "role_not_allowed", "Only coaches and student-athletes have applications.");
}

export async function setApplicationStatus(user: PublicUser, applicationId: string, status: "reviewed" | "dismissed", dbArg?: Db): Promise<ApplicationStatus> {
  const db = dbArg ?? (await getDb());
  if (!user.roles.includes(COACH_ROLE)) throw new CoachApplicationError(403, "role_not_allowed", "Only coaches can do this.");
  if (!(await isVerifiedCoach(db, user.id))) throw new CoachApplicationError(403, "coach_not_verified", "Your coach account must be verified first.");
  const rows = await db`UPDATE athlete_applications SET status = ${status}, updated_at = ${new Date()} WHERE id = ${applicationId} AND coach_id = ${user.id} RETURNING id`;
  if (rows.length === 0) throw notFound();
  return status;
}
