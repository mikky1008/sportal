// My University (the coach's read-only view of their official university).
//
// SERVER ONLY. Works on `universities` and `coach_profiles.university_id` (migration 11), plus tables
// that already existed: coach_verifications, user_roles, coach_athlete_connections, athlete_profiles.
//
// How "affiliated" is decided, using only approvals that already exist:
//  - A COACH is affiliated when a reviewer approved their verification and their organization is a
//    university or college (coach_profiles.university_id is set at that moment, cleared if the
//    approval is withdrawn). Only coaches who are verified RIGHT NOW and have an active account are listed.
//  - An ATHLETE is affiliated when they have an ACCEPTED connection with a verified coach of this
//    university: the athlete said yes and the university's own verified coach is on the other side.
//    Pending, declined, cancelled and disconnected connections never count. An athlete who hid their
//    showcase is listed only to the coach they are directly connected to.
//
// Access: the university is ALWAYS taken from the signed-in coach's account, never from the request,
// so a coach can only ever see their own university. Everything here is read-only: there is no way
// to change university information or other coaches' accounts through this module.
// Responses carry names, sports, positions and statuses only, never emails.

import { getDb, type Db } from "./db.server.ts";
import type { PublicUser } from "./auth.server.ts";
import { COACH_ROLE, isVerifiedCoach } from "./connections.server.ts";

export const UNIVERSITY_PAGE_DEFAULT = 50;
export const UNIVERSITY_PAGE_MAX = 100;
const SEARCH_MAX = 80;

export class UniversityError extends Error {
  readonly httpStatus: number;
  readonly code: string;
  constructor(httpStatus: number, code: string, message: string) {
    super(message);
    this.httpStatus = httpStatus;
    this.code = code;
  }
}

export type NotAffiliatedReason = "not_verified" | "no_university";

export interface UniversityView {
  id: string;
  name: string;
  /** "" when the university has no logo yet */
  logoUrl: string;
  location: string;
  description: string;
  website: string;
}

export interface UniversityCoachView {
  id: string;
  name: string;
  sport: string;
  position: string;
  programName: string;
  /** every listed coach is verified (approved by a reviewer) */
  status: "verified";
  accountStatus: "active";
  isYou: boolean;
}

export interface UniversityAthleteView {
  id: string;
  name: string;
  sport: string;
  position: string;
  /** every listed athlete has an accepted connection with a verified coach of this university */
  affiliationStatus: "approved";
  /** when the earliest approved connection was made */
  affiliatedSince: string;
}

export interface Page {
  limit: number;
  offset: number;
  q?: string | undefined;
}

type Resolved = { affiliated: true; universityId: string } | { affiliated: false; reason: NotAffiliatedReason };

const likeLiteral = (t: string) => t.replace(/[\\%_]/g, (c) => `\\${c}`);

function requireCoach(user: PublicUser): void {
  if (!user.roles.includes(COACH_ROLE)) throw new UniversityError(403, "role_not_allowed", "Only coaches can open My University.");
}

/** The signed-in coach's own university, or why they have none. */
async function resolve(db: Db, user: PublicUser): Promise<Resolved> {
  requireCoach(user);
  if (!(await isVerifiedCoach(db, user.id))) return { affiliated: false, reason: "not_verified" };
  const [row] = await db<{ university_id: string | null }[]>`SELECT university_id FROM coach_profiles WHERE user_id = ${user.id}`;
  if (!row?.university_id) return { affiliated: false, reason: "no_university" };
  return { affiliated: true, universityId: row.university_id };
}

/** A coach who is verified right now (approved + holds the role) with an active, undeleted account. */
const VERIFIED_AND_ACTIVE = (db: Db, coachAlias: string) => db`
  EXISTS (SELECT 1 FROM user_roles vr JOIN roles r ON r.id = vr.role_id WHERE vr.user_id = ${db(coachAlias)}.id AND r.name = 'verified_coach')
  AND EXISTS (SELECT 1 FROM coach_verifications cv WHERE cv.coach_id = ${db(coachAlias)}.id AND cv.status = 'verified')
  AND ${db(coachAlias)}.is_active = TRUE AND ${db(coachAlias)}.deleted_at IS NULL`;

/** The ILIKE pattern for the search box, or null when it is empty. */
function searchPattern(q: string | undefined): string | null {
  const needle = q?.trim().slice(0, SEARCH_MAX);
  return needle ? `%${likeLiteral(needle)}%` : null;
}

export async function getMyUniversity(
  user: PublicUser,
  dbArg?: Db,
): Promise<{ affiliated: true; university: UniversityView } | { affiliated: false; reason: NotAffiliatedReason }> {
  const db = dbArg ?? (await getDb());
  const me = await resolve(db, user);
  if (!me.affiliated) return me;
  const [u] = await db<{ id: string; name: string; logo_url: string; location: string; description: string; website: string }[]>`
    SELECT id, name, logo_url, location, description, website FROM universities WHERE id = ${me.universityId}`;
  if (!u) return { affiliated: false, reason: "no_university" };
  return { affiliated: true, university: { id: u.id, name: u.name, logoUrl: u.logo_url, location: u.location, description: u.description, website: u.website } };
}

export async function listUniversityCoaches(
  user: PublicUser,
  page: Page,
  dbArg?: Db,
): Promise<{ affiliated: boolean; reason?: NotAffiliatedReason; items: UniversityCoachView[]; total: number }> {
  const db = dbArg ?? (await getDb());
  const me = await resolve(db, user);
  if (!me.affiliated) return { affiliated: false, reason: me.reason, items: [], total: 0 };

  const pattern = searchPattern(page.q);
  const name = db`COALESCE(NULLIF(btrim(concat_ws(' ', up.first_name, up.last_name)), ''), u.display_name)`;
  const rows = await db<{ id: string; name: string; sport: string; position: string; program_name: string; total: number }[]>`
    SELECT u.id, ${name} AS name, cp.sport_specialization AS sport, cp.coaching_position AS position, cp.program_name,
           count(*) OVER ()::int AS total
    FROM coach_profiles cp
    JOIN users u ON u.id = cp.user_id
    LEFT JOIN user_profiles up ON up.user_id = u.id
    WHERE cp.university_id = ${me.universityId} AND ${VERIFIED_AND_ACTIVE(db, "u")}
      ${pattern ? db`AND ${name} ILIKE ${pattern}` : db``}
    ORDER BY ${name}, u.id
    LIMIT ${page.limit} OFFSET ${page.offset}`;
  return {
    affiliated: true,
    total: rows[0]?.total ?? 0,
    items: rows.map((r) => ({
      id: r.id,
      name: r.name,
      sport: r.sport,
      position: r.position,
      programName: r.program_name,
      status: "verified" as const,
      accountStatus: "active" as const,
      isYou: r.id === user.id,
    })),
  };
}

export async function listUniversityAthletes(
  user: PublicUser,
  page: Page,
  dbArg?: Db,
): Promise<{ affiliated: boolean; reason?: NotAffiliatedReason; items: UniversityAthleteView[]; total: number }> {
  const db = dbArg ?? (await getDb());
  const me = await resolve(db, user);
  if (!me.affiliated) return { affiliated: false, reason: me.reason, items: [], total: 0 };

  const pattern = searchPattern(page.q);
  const name = db`COALESCE(NULLIF(btrim(concat_ws(' ', up.first_name, up.last_name)), ''), a.display_name)`;
  const rows = await db<{ id: string; name: string; sport: string; position: string; since: Date; total: number }[]>`
    WITH affiliated AS (
      -- accepted connections with a verified coach of THIS university; one row per athlete
      SELECT c.athlete_id, min(COALESCE(c.responded_at, c.updated_at)) AS since, bool_or(c.coach_id = ${user.id}) AS mine
      FROM coach_athlete_connections c
      JOIN coach_profiles cp ON cp.user_id = c.coach_id AND cp.university_id = ${me.universityId}
      JOIN users u ON u.id = c.coach_id
      WHERE c.status = 'accepted' AND ${VERIFIED_AND_ACTIVE(db, "u")}
      GROUP BY c.athlete_id
    )
    SELECT a.id, ${name} AS name, COALESCE(ap.sport, '') AS sport, COALESCE(ap.playing_position, '') AS position,
           af.since, count(*) OVER ()::int AS total
    FROM affiliated af
    JOIN users a ON a.id = af.athlete_id
    LEFT JOIN user_profiles up ON up.user_id = a.id
    LEFT JOIN athlete_profiles ap ON ap.user_id = a.id
    WHERE a.is_active = TRUE AND a.deleted_at IS NULL
      AND (af.mine OR COALESCE(ap.showcase_visible, TRUE) = TRUE)
      ${pattern ? db`AND ${name} ILIKE ${pattern}` : db``}
    ORDER BY ${name}, a.id
    LIMIT ${page.limit} OFFSET ${page.offset}`;
  return {
    affiliated: true,
    total: rows[0]?.total ?? 0,
    items: rows.map((r) => ({ id: r.id, name: r.name, sport: r.sport, position: r.position, affiliationStatus: "approved" as const, affiliatedSince: r.since.toISOString() })),
  };
}
