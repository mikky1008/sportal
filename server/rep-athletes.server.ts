// School Representative "My Athletes" (list, profile with achievements, profile photo).
//
// SERVER ONLY. Read-only. Uses tables that already exist (users, user_profiles, athlete_profiles,
// athlete_extras, athlete_achievements, athlete_skills, practice_sessions, coach_athlete_connections,
// coach_profiles); no migration.
//
// Which athletes belong to the representative's school: the school is ALWAYS the signed-in
// representative's own approved school (resolveSchool), never taken from the request, and every query
// filters on it. A student-athlete is listed when EITHER
//   - a verified, active coach of this school has an ACCEPTED connection with them  -> "verified"
//     (the same rule the dashboard's Total Athletes and the coach's My University page use), OR
//   - the athlete's own profile names this school (athlete_profiles.school, matched without case or
//     edge spaces) but no coach of the school has confirmed them yet                  -> "unverified"
// Verification status therefore means: confirmed by a verified coach of this school, or not yet.
//
// Privacy (the rule the rest of Sportal uses): an athlete who hides their showcase
// (athlete_profiles.showcase_visible = false), a suspended or deleted account, and anyone who is not a
// student-athlete is never listed or returned. No email, phone, height or weight is returned.
//
// Photos are stored inline in athlete_extras and only an APPROVED photo is ever served. They are sent
// by a separate route (not inside the list), so the list stays small.

import { getDb, type Db } from "./db.server.ts";
import type { PublicUser } from "./auth.server.ts";
import { ATHLETE_ROLE } from "./connections.server.ts";
import { RepDashboardError, resolveSchool, type School } from "./rep-dashboard.server.ts";

export const ATHLETES_PAGE_DEFAULT = 20;
export const ATHLETES_PAGE_MAX = 50;
const SEARCH_MAX = 80;

export type AthleteVerification = "verified" | "unverified";
export const VERIFICATION_STATUSES: readonly AthleteVerification[] = ["verified", "unverified"];

export interface RepAthlete {
  id: string;
  name: string;
  /** true when an approved photo can be fetched from /api/rep/athletes/:id/photo */
  hasPhoto: boolean;
  /** changes when the photo changes (cache key for the image URL) */
  photoVersion: number;
  sport: string;
  position: string;
  yearLevel: string;
  /** the verified coach(es) of this school connected to the athlete; the first is shown in the list */
  coaches: string[];
  verification: AthleteVerification;
}

export interface RepAthleteDetail extends RepAthlete {
  bio: string;
  teamStatus: string;
  teamName: string;
  skills: string[];
  /** the athlete's recorded achievements, in the order the athlete set them */
  achievements: { id: string; title: string; year: string }[];
  /** performance sessions a verified coach has confirmed */
  verifiedSessions: number;
  /** when the earliest coach of this school accepted the athlete (null while unverified) */
  affiliatedSince: string | null;
}

const likeLiteral = (t: string) => t.replace(/[\\%_]/g, (c) => `\\${c}`);
const notFound = () => new RepDashboardError(404, "athlete_not_found", "That athlete could not be found at your school.");

/** A coach who is verified right now (approved + holds the role) with an active, undeleted account. */
const VERIFIED_AND_ACTIVE = (db: Db, alias: string) => db`
  EXISTS (SELECT 1 FROM user_roles vr JOIN roles r ON r.id = vr.role_id WHERE vr.user_id = ${db(alias)}.id AND r.name = 'verified_coach')
  AND EXISTS (SELECT 1 FROM coach_verifications cv WHERE cv.coach_id = ${db(alias)}.id AND cv.status = 'verified')
  AND ${db(alias)}.is_active = TRUE AND ${db(alias)}.deleted_at IS NULL`;

/** Every athlete of this school with their verification, already limited by privacy. Starts at FROM. */
const SCOPE = (db: Db, school: School) => db`
  FROM users a
  LEFT JOIN user_profiles up ON up.user_id = a.id
  LEFT JOIN athlete_profiles ap ON ap.user_id = a.id
  LEFT JOIN athlete_extras ex ON ex.user_id = a.id
  LEFT JOIN (
    SELECT c.athlete_id, min(COALESCE(c.responded_at, c.updated_at)) AS since
    FROM coach_athlete_connections c
    JOIN coach_profiles cp ON cp.user_id = c.coach_id AND cp.university_id = ${school.universityId ?? ""}
    JOIN users cu ON cu.id = c.coach_id
    WHERE c.status = 'accepted' AND ${VERIFIED_AND_ACTIVE(db, "cu")}
    GROUP BY c.athlete_id
  ) sc ON sc.athlete_id = a.id
  WHERE a.is_active = TRUE AND a.deleted_at IS NULL
    AND EXISTS (SELECT 1 FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = a.id AND r.name = ${ATHLETE_ROLE})
    AND COALESCE(ap.showcase_visible, TRUE) = TRUE
    AND (sc.athlete_id IS NOT NULL OR lower(btrim(COALESCE(ap.school, ''))) = ${school.key})`;

const NAME = (db: Db) => db`COALESCE(NULLIF(btrim(concat_ws(' ', up.first_name, up.last_name)), ''), a.display_name)`;
const HAS_PHOTO = (db: Db) => db`(ex.photo_data IS NOT NULL AND ex.photo_status = 'approved')`;

type Row = {
  id: string; name: string; has_photo: boolean; photo_v: string | null; sport: string; position: string; year_level: string;
  verified: boolean; since: Date | null;
};

async function coachNames(db: Db, school: School, athleteIds: string[]): Promise<Map<string, string[]>> {
  const out = new Map<string, string[]>();
  if (athleteIds.length === 0 || !school.universityId) return out;
  const rows = await db<{ athlete_id: string; name: string }[]>`
    SELECT c.athlete_id, COALESCE(NULLIF(btrim(concat_ws(' ', cup.first_name, cup.last_name)), ''), cu.display_name) AS name
    FROM coach_athlete_connections c
    JOIN coach_profiles cp ON cp.user_id = c.coach_id AND cp.university_id = ${school.universityId}
    JOIN users cu ON cu.id = c.coach_id
    LEFT JOIN user_profiles cup ON cup.user_id = cu.id
    WHERE c.status = 'accepted' AND c.athlete_id = ANY(${athleteIds}::text[]) AND ${VERIFIED_AND_ACTIVE(db, "cu")}
    ORDER BY COALESCE(c.responded_at, c.updated_at), cu.id`;
  for (const r of rows) out.set(r.athlete_id, [...(out.get(r.athlete_id) ?? []), r.name]);
  return out;
}

const toAthlete = (r: Row, coaches: string[]): RepAthlete => ({
  id: r.id, name: r.name, hasPhoto: r.has_photo, photoVersion: r.photo_v ? Number(r.photo_v) : 0, sport: r.sport,
  position: r.position, yearLevel: r.year_level, coaches, verification: r.verified ? "verified" : "unverified",
});

const FIELDS = (db: Db) => db`
  a.id, ${NAME(db)} AS name, ${HAS_PHOTO(db)} AS has_photo, (extract(epoch FROM ex.updated_at) * 1000)::bigint::text AS photo_v,
  COALESCE(ap.sport, '') AS sport, COALESCE(ap.playing_position, '') AS position, COALESCE(ap.year_level, '') AS year_level,
  (sc.athlete_id IS NOT NULL) AS verified, sc.since`;

export async function listRepAthletes(
  user: PublicUser,
  opts: { q?: string | undefined; sport?: string | undefined; status?: AthleteVerification | undefined; limit: number; offset: number },
  dbArg?: Db,
): Promise<{ school: { name: string }; items: RepAthlete[]; total: number; sports: string[]; counts: Record<AthleteVerification, number> }> {
  const db = dbArg ?? (await getDb());
  const school = await resolveSchool(db, user);
  const needle = opts.q?.trim().slice(0, SEARCH_MAX);
  const pattern = needle ? `%${likeLiteral(needle)}%` : null;
  const sport = opts.sport?.trim().slice(0, 80) || null;

  const rows = await db<(Row & { total: number })[]>`
    SELECT ${FIELDS(db)}, count(*) OVER ()::int AS total
    ${SCOPE(db, school)}
      ${opts.status === "verified" ? db`AND sc.athlete_id IS NOT NULL` : opts.status === "unverified" ? db`AND sc.athlete_id IS NULL` : db``}
      ${sport ? db`AND lower(ap.sport) = lower(${sport})` : db``}
      ${pattern ? db`AND ${NAME(db)} ILIKE ${pattern}` : db``}
    ORDER BY ${NAME(db)}, a.id
    LIMIT ${opts.limit} OFFSET ${opts.offset}`;

  // The filter choices and tab numbers describe the whole school, not the current search.
  const meta = await db<{ verified: boolean; sport: string }[]>`SELECT (sc.athlete_id IS NOT NULL) AS verified, COALESCE(ap.sport, '') AS sport ${SCOPE(db, school)}`;
  const counts: Record<AthleteVerification, number> = { verified: 0, unverified: 0 };
  for (const m of meta) counts[m.verified ? "verified" : "unverified"] += 1;
  const sports = [...new Set(meta.map((m) => m.sport).filter(Boolean))].sort((x, y) => x.localeCompare(y));

  const coaches = await coachNames(db, school, rows.map((r) => r.id));
  return { school: { name: school.name }, items: rows.map((r) => toAthlete(r, coaches.get(r.id) ?? [])), total: rows[0]?.total ?? 0, sports, counts };
}

export async function getRepAthlete(user: PublicUser, athleteId: string, dbArg?: Db): Promise<RepAthleteDetail> {
  const db = dbArg ?? (await getDb());
  const school = await resolveSchool(db, user);
  const [r] = await db<(Row & { bio: string; team_status: string; team_name: string })[]>`
    SELECT ${FIELDS(db)}, COALESCE(ap.bio, '') AS bio, COALESCE(ap.team_status, '') AS team_status, COALESCE(ap.team_name, '') AS team_name
    ${SCOPE(db, school)} AND a.id = ${athleteId}`;
  if (!r) throw notFound();

  const [achievements, skills, [sessions], coaches] = await Promise.all([
    db<{ id: string; title: string; year: string }[]>`SELECT id, title, year FROM athlete_achievements WHERE athlete_id = ${athleteId} ORDER BY position`,
    db<{ name: string }[]>`SELECT name FROM athlete_skills WHERE athlete_id = ${athleteId} ORDER BY position`,
    db<{ n: number }[]>`SELECT count(*)::int AS n FROM practice_sessions WHERE athlete_id = ${athleteId} AND status = 'coach_verified'`,
    coachNames(db, school, [athleteId]),
  ]);
  return {
    ...toAthlete(r, coaches.get(athleteId) ?? []),
    bio: r.bio, teamStatus: r.team_status, teamName: r.team_name, skills: skills.map((s) => s.name), achievements,
    verifiedSessions: sessions?.n ?? 0, affiliatedSince: r.since ? r.since.toISOString() : null,
  };
}

const PHOTO_OK = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$/;

/** The athlete's APPROVED profile photo as image bytes, for an athlete of the representative's school. */
export async function getRepAthletePhoto(user: PublicUser, athleteId: string, dbArg?: Db): Promise<{ mimeType: string; data: Buffer }> {
  const db = dbArg ?? (await getDb());
  const school = await resolveSchool(db, user);
  const [r] = await db<{ photo: string | null }[]>`
    SELECT CASE WHEN ex.photo_status = 'approved' AND length(ex.photo_data) <= 400000 THEN ex.photo_data END AS photo
    ${SCOPE(db, school)} AND a.id = ${athleteId}`;
  const m = r?.photo ? PHOTO_OK.exec(r.photo) : null;
  if (!m) throw new RepDashboardError(404, "photo_not_found", "This athlete has no profile photo.");
  return { mimeType: `image/${m[1]}`, data: Buffer.from(m[2]!, "base64") };
}
