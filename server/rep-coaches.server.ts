// School Representative "My Coaches" (list, profile, and managing the school affiliation).
//
// SERVER ONLY. Works on tables that already exist (coach_profiles, coach_verifications, users,
// user_profiles, universities, coach_athlete_connections); no migration.
//
// Which coaches belong to the representative's school: the school is ALWAYS the signed-in
// representative's own approved school (resolveSchool), never taken from the request, and every
// query below filters on it. A coach is shown with one affiliation status:
//   affiliated  a reviewer verified them and coach_profiles.university_id is this school
//   pending     their verification request for this school is still waiting for review
//   removed     verified, but the school's representative ended the affiliation (university_id empty)
// Rejected requests are not listed. Only University / College organizations can be affiliated.
//
// What the representative may change: end ("remove") or restore a coach's affiliation with THEIR OWN
// school, by clearing or setting coach_profiles.university_id. That is all. It never touches the
// coach's verification, roles or account; approving or rejecting a coach stays with the administrator.
// Every change is written to the audit log and the coach is notified.
//
// Responses carry the fields the page shows (name, photo, email, sport, position, profile text).
// Credential numbers and review notes are never returned.

import { getDb, type Db } from "./db.server.ts";
import { audit, type PublicUser, type RequestMeta } from "./auth.server.ts";
import { notify } from "./notifications.server.ts";
import { RepDashboardError, resolveSchool, type School } from "./rep-dashboard.server.ts";

export const COACHES_PAGE_DEFAULT = 20;
export const COACHES_PAGE_MAX = 50;
const SEARCH_MAX = 80;

export type AffiliationStatus = "affiliated" | "pending" | "removed";
export const AFFILIATION_STATUSES: readonly AffiliationStatus[] = ["affiliated", "pending", "removed"];

export interface RepCoach {
  id: string;
  name: string;
  email: string;
  /** null when the coach has no usable photo (the page shows initials) */
  photo: string | null;
  sport: string;
  position: string;
  status: AffiliationStatus;
  /** false while the account is suspended */
  accountActive: boolean;
}

export interface RepCoachDetail extends RepCoach {
  programName: string;
  competitionLevel: string;
  yearsExperience: string;
  background: string;
  certifications: string;
  credentialType: string;
  athletesConnected: number;
  appliedAt: string;
  /** when a reviewer verified them (null while pending) */
  verifiedAt: string | null;
}

const likeLiteral = (t: string) => t.replace(/[\\%_]/g, (c) => `\\${c}`);
const safePhoto = (url: string | null): string | null => (url && /^https?:\/\//i.test(url) && url.length <= 500 ? url : null);
const notFound = () => new RepDashboardError(404, "coach_not_found", "That coach could not be found at your school.");

/** The coaches of this school with their status. Pending requests from suspended accounts are left out (as on the dashboard). */
const SCOPE = (db: Db, school: School) => db`
  FROM coach_profiles cp
  JOIN users u ON u.id = cp.user_id AND u.deleted_at IS NULL
  JOIN coach_verifications v ON v.coach_id = cp.user_id
  LEFT JOIN user_profiles up ON up.user_id = cp.user_id
  CROSS JOIN LATERAL (SELECT CASE
      WHEN v.status = 'pending' AND u.is_active THEN 'pending'
      WHEN v.status = 'verified' AND cp.university_id = ${school.universityId ?? ""} THEN 'affiliated'
      WHEN v.status = 'verified' AND cp.university_id IS NULL THEN 'removed'
    END AS status) s
  WHERE s.status IS NOT NULL AND lower(btrim(v.organization)) = ${school.key}
    AND cp.organization_type IN ('University', 'College')`;

const NAME = (db: Db) => db`COALESCE(NULLIF(btrim(concat_ws(' ', up.first_name, up.last_name)), ''), u.display_name)`;

type Row = {
  id: string; name: string; email: string; avatar_url: string | null; sport: string; position: string;
  status: AffiliationStatus; is_active: boolean;
};

const toCoach = (r: Row): RepCoach => ({
  id: r.id, name: r.name, email: r.email, photo: safePhoto(r.avatar_url), sport: r.sport, position: r.position,
  status: r.status, accountActive: r.is_active,
});

export async function listRepCoaches(
  user: PublicUser,
  opts: { q?: string | undefined; sport?: string | undefined; status?: AffiliationStatus | undefined; limit: number; offset: number },
  dbArg?: Db,
): Promise<{
  school: { name: string };
  items: RepCoach[]; total: number;
  sports: string[]; counts: Record<AffiliationStatus, number>;
}> {
  const db = dbArg ?? (await getDb());
  const school = await resolveSchool(db, user);
  const needle = opts.q?.trim().slice(0, SEARCH_MAX);
  const pattern = needle ? `%${likeLiteral(needle)}%` : null;
  const sport = opts.sport?.trim().slice(0, 80) || null;

  const rows = await db<(Row & { total: number })[]>`
    SELECT u.id, ${NAME(db)} AS name, u.email, up.avatar_url, COALESCE(cp.sport_specialization, '') AS sport,
           COALESCE(cp.coaching_position, '') AS position, s.status, u.is_active, count(*) OVER ()::int AS total
    ${SCOPE(db, school)}
      ${opts.status ? db`AND s.status = ${opts.status}` : db``}
      ${sport ? db`AND lower(cp.sport_specialization) = lower(${sport})` : db``}
      ${pattern ? db`AND (${NAME(db)} ILIKE ${pattern} OR u.email ILIKE ${pattern})` : db``}
    ORDER BY ${NAME(db)}, u.id
    LIMIT ${opts.limit} OFFSET ${opts.offset}`;

  // The filter choices and tab numbers describe the whole school, not the current search.
  const meta = await db<{ status: AffiliationStatus; sport: string }[]>`
    SELECT s.status, COALESCE(cp.sport_specialization, '') AS sport ${SCOPE(db, school)}`;
  const counts: Record<AffiliationStatus, number> = { affiliated: 0, pending: 0, removed: 0 };
  for (const m of meta) counts[m.status] += 1;
  const sports = [...new Set(meta.map((m) => m.sport).filter(Boolean))].sort((a, b) => a.localeCompare(b));

  return { school: { name: school.name }, items: rows.map(toCoach), total: rows[0]?.total ?? 0, sports, counts };
}

async function loadDetail(db: Db, school: School, coachId: string): Promise<RepCoachDetail> {
  const [r] = await db<(Row & {
    program_name: string; competition_level: string; years_experience: string; background: string; certifications: string;
    credential_type: string; submitted_at: Date; reviewed_at: Date | null; athletes: number;
  })[]>`
    SELECT u.id, ${NAME(db)} AS name, u.email, up.avatar_url, COALESCE(cp.sport_specialization, '') AS sport,
           COALESCE(cp.coaching_position, '') AS position, s.status, u.is_active,
           cp.program_name, cp.competition_level, cp.years_experience, cp.background, cp.certifications,
           v.credential_type, v.submitted_at, v.reviewed_at,
           (SELECT count(*)::int FROM coach_athlete_connections c
              JOIN users a ON a.id = c.athlete_id AND a.is_active = TRUE AND a.deleted_at IS NULL
              WHERE c.coach_id = u.id AND c.status = 'accepted') AS athletes
    ${SCOPE(db, school)} AND u.id = ${coachId}`;
  if (!r) throw notFound();
  return {
    ...toCoach(r),
    programName: r.program_name, competitionLevel: r.competition_level, yearsExperience: r.years_experience,
    background: r.background, certifications: r.certifications, credentialType: r.credential_type,
    athletesConnected: r.athletes, appliedAt: r.submitted_at.toISOString(),
    verifiedAt: r.status === "pending" || !r.reviewed_at ? null : r.reviewed_at.toISOString(),
  };
}

export async function getRepCoach(user: PublicUser, coachId: string, dbArg?: Db): Promise<RepCoachDetail> {
  const db = dbArg ?? (await getDb());
  const school = await resolveSchool(db, user);
  return loadDetail(db, school, coachId);
}

/** End or restore a coach's affiliation with the representative's OWN school. */
export async function setCoachAffiliation(
  user: PublicUser,
  coachId: string,
  action: "remove" | "restore",
  meta: Partial<RequestMeta> = {},
  dbArg?: Db,
): Promise<RepCoachDetail> {
  const db = dbArg ?? (await getDb());
  const school = await resolveSchool(db, user);
  if (!school.universityId) throw new RepDashboardError(409, "school_not_registered", "Your school isn't registered on Sportal yet.");
  const uid = school.universityId;

  await db.begin(async (tx) => {
    // Lock the coach's profile row, then re-check that this coach really is at THIS school.
    await tx`SELECT 1 FROM coach_profiles WHERE user_id = ${coachId} FOR UPDATE`;
    const [cur] = await tx<{ status: AffiliationStatus; is_active: boolean }[]>`
      SELECT s.status, u.is_active ${SCOPE(tx as unknown as Db, school)} AND u.id = ${coachId}`;
    if (!cur) throw notFound();
    if (action === "remove") {
      if (cur.status !== "affiliated") throw new RepDashboardError(409, "not_affiliated", "This coach isn't currently affiliated with your school.");
      await tx`UPDATE coach_profiles SET university_id = NULL, updated_at = ${new Date()} WHERE user_id = ${coachId} AND university_id = ${uid}`;
    } else {
      if (cur.status !== "removed") throw new RepDashboardError(409, "not_removed", "This coach's affiliation wasn't removed, so there is nothing to restore.");
      if (!cur.is_active) throw new RepDashboardError(409, "account_suspended", "This coach's account is suspended, so the affiliation can't be restored.");
      await tx`UPDATE coach_profiles SET university_id = ${uid}, updated_at = ${new Date()} WHERE user_id = ${coachId} AND university_id IS NULL`;
    }
    await audit(
      action === "remove" ? "rep.coach_affiliation_removed" : "rep.coach_affiliation_restored",
      { userId: user.id, ...meta, detail: { coachId, school: school.name } },
      tx as unknown as Db,
    );
  });

  await notify(
    coachId,
    action === "remove"
      ? { category: "system", title: "Affiliation ended", message: `${school.name} ended your affiliation with the school. Your coach verification is unchanged.` }
      : { category: "system", title: "Affiliation restored", message: `${school.name} restored your affiliation with the school.` },
    db,
  );
  return loadDetail(db, school, coachId);
}

/** Coaches affiliated with the school (not pending or removed) per sport. Same rules as the list. */
export async function coachSportBreakdown(db: Db, school: School): Promise<{ sport: string; count: number }[]> {
  return db<{ sport: string; count: number }[]>`
    SELECT COALESCE(NULLIF(btrim(cp.sport_specialization), ''), 'Not set') AS sport, count(*)::int AS count
    ${SCOPE(db, school)} AND s.status = 'affiliated'
    GROUP BY 1 ORDER BY count(*) DESC, 1 LIMIT 12`;
}
