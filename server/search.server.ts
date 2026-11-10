// Header search: one query across what the signed-in user is allowed to find.
//
//  - Scholarships: open ones, for everyone signed in.
//  - Athletes: only for verified coaches. Everyone who matches by name is returned, whether or not they
//    are on the coach's My Athletes list, each with how they relate to the coach (connected, request
//    sent, request received or none) so the screen can offer the right next step.
//    Athletes who hid their showcase are left out, except ones the coach is already connected to.
//    Names, school and sport only, never emails.

import { getDb, type Db } from "./db.server.ts";
import type { PublicUser } from "./auth.server.ts";
import { COACH_ROLE, ATHLETE_ROLE, isVerifiedCoach } from "./connections.server.ts";
import { listScholarships, type ScholarshipView } from "./scholarships.server.ts";

export const GLOBAL_SEARCH_MIN_CHARS = 2;
export const GLOBAL_SEARCH_MAX_CHARS = 80;

export type Relationship = "connected" | "request_sent" | "request_received" | "none";

export interface SearchAthleteView {
  id: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  sport: string;
  school: string;
  relationship: Relationship;
  /** a showcase page exists for this athlete (started profile and not hidden) */
  hasShowcase: boolean;
}

export interface SearchCoachView {
  id: string;
  displayName: string;
  organization: string;
  sport: string;
  /** connected (already your coach), applied (you showed interest) or none */
  relationship: "connected" | "applied" | "none";
}

const likeLiteral = (t: string) => t.replace(/[\\%_]/g, (c) => `\\${c}`);

async function searchAthletesForCoach(db: Db, coach: PublicUser, q: string, limit: number): Promise<SearchAthleteView[]> {
  if (!coach.roles.includes(COACH_ROLE) || !(await isVerifiedCoach(db, coach.id))) return [];

  // One condition per word, all of which must hold (AND).
  const words = q.split(/\s+/).filter(Boolean).slice(0, 4);
  let nameMatch = db`TRUE`;
  for (const w of words) {
    const prefix = `${likeLiteral(w)}%`;
    const inner = `% ${likeLiteral(w)}%`;
    nameMatch = db`${nameMatch} AND (
      u.display_name ILIKE ${prefix} OR u.display_name ILIKE ${inner}
      OR up.first_name ILIKE ${prefix} OR up.last_name ILIKE ${prefix})`;
  }

  const rows = await db<{
    id: string; display_name: string; first_name: string | null; last_name: string | null;
    sport: string; school: string; visible: boolean; conn_status: string | null; requested_by: string | null;
  }[]>`
    SELECT u.id, u.display_name, up.first_name, up.last_name,
           COALESCE(ap.sport, '') AS sport, COALESCE(ap.school, '') AS school,
           COALESCE(ap.showcase_visible, TRUE) AS visible, c.status AS conn_status, c.requested_by
    FROM users u
    LEFT JOIN user_profiles up ON up.user_id = u.id
    LEFT JOIN athlete_profiles ap ON ap.user_id = u.id
    LEFT JOIN coach_athlete_connections c ON c.coach_id = ${coach.id} AND c.athlete_id = u.id
    WHERE u.is_active = TRUE AND u.deleted_at IS NULL AND u.id <> ${coach.id}
      AND EXISTS (SELECT 1 FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = u.id AND r.name = ${ATHLETE_ROLE})
      AND (COALESCE(ap.showcase_visible, TRUE) = TRUE OR c.status = 'accepted')
      AND ${nameMatch}
    ORDER BY (c.status = 'accepted') DESC NULLS LAST, u.display_name, u.id
    LIMIT ${limit}`;

  return rows.map((r) => ({
    id: r.id,
    displayName: r.display_name,
    ...(r.first_name?.trim() ? { firstName: r.first_name.trim() } : {}),
    ...(r.last_name?.trim() ? { lastName: r.last_name.trim() } : {}),
    sport: r.sport,
    school: r.school,
    relationship:
      r.conn_status === "accepted" ? "connected"
      : r.conn_status === "pending" ? (r.requested_by === coach.id ? "request_sent" : "request_received")
      : "none",
    hasShowcase: r.sport !== "" && r.visible,
  }));
}

/** Verified coaches an athlete can show interest in. Name, organization and sport only. */
async function searchCoachesForAthlete(db: Db, athlete: PublicUser, q: string, limit: number): Promise<SearchCoachView[]> {
  if (!athlete.roles.includes(ATHLETE_ROLE)) return [];
  const words = q.split(/\s+/).filter(Boolean).slice(0, 4);
  let match = db`TRUE`;
  for (const w of words) {
    const prefix = `${likeLiteral(w)}%`;
    const inner = `% ${likeLiteral(w)}%`;
    match = db`${match} AND (u.display_name ILIKE ${prefix} OR u.display_name ILIKE ${inner} OR cp.organization ILIKE ${prefix} OR cp.organization ILIKE ${inner})`;
  }
  const rows = await db<{ id: string; display_name: string; organization: string | null; sport: string | null; app_status: string | null; conn_status: string | null }[]>`
    SELECT u.id, u.display_name, cp.organization, cp.sport_specialization AS sport, a.status AS app_status, c.status AS conn_status
    FROM users u
    JOIN coach_profiles cp ON cp.user_id = u.id
    LEFT JOIN athlete_applications a ON a.coach_id = u.id AND a.athlete_id = ${athlete.id}
    LEFT JOIN coach_athlete_connections c ON c.coach_id = u.id AND c.athlete_id = ${athlete.id}
    WHERE u.is_active = TRUE AND u.deleted_at IS NULL
      AND EXISTS (SELECT 1 FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = u.id AND r.name = 'verified_coach')
      AND ${match}
    ORDER BY u.display_name, u.id LIMIT ${limit}`;
  return rows.map((r) => ({
    id: r.id,
    displayName: r.display_name,
    organization: r.organization ?? "",
    sport: r.sport ?? "",
    relationship: r.conn_status === "accepted" ? "connected" : r.app_status ? "applied" : "none",
  }));
}

export async function globalSearch(
  user: PublicUser,
  rawQuery: string,
  rawLimit = 5,
  dbArg?: Db,
): Promise<{ athletes: SearchAthleteView[]; scholarships: ScholarshipView[]; coaches: SearchCoachView[] }> {
  const q = rawQuery.trim().slice(0, GLOBAL_SEARCH_MAX_CHARS);
  if (q.length < GLOBAL_SEARCH_MIN_CHARS) return { athletes: [], scholarships: [], coaches: [] };
  const limit = Math.min(Math.max(Math.trunc(Number.isFinite(rawLimit) ? rawLimit : 5), 1), 10);
  const db = dbArg ?? (await getDb());

  const [scholarships, athletes, coaches] = await Promise.all([
    listScholarships(user, { q, limit, offset: 0 }, db).then((r) => r.items),
    searchAthletesForCoach(db, user, q, limit),
    searchCoachesForAthlete(db, user, q, limit),
  ]);
  return { athletes, scholarships, coaches };
}
