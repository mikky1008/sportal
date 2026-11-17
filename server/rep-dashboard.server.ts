// School Representative Dashboard (read-only).
//
// SERVER ONLY. Everything here is computed from real rows; nothing is hardcoded. It reads tables
// that already exist (university_representative_profiles, rep_applications, universities,
// coach_profiles, coach_verifications, coach_athlete_connections, athlete_applications,
// athlete_profiles, scholarships, scholarship_applications) and changes none of them.
//
// Access: the school is ALWAYS taken from the signed-in representative's own approved account,
// never from the request, so a representative can only ever see their own institution.
//
// How each number is decided (the same rules the coach's My University page already uses):
//  - Total Coaches   coaches whose verification a reviewer approved AND whose official university
//                    is this school (coach_profiles.university_id). Suspended accounts still count.
//  - Active Coaches  the part of Total Coaches whose account is active right now.
//  - Pending Coach   verification requests still waiting for review whose organization is this
//    Requests        school (a University or College, matched without case or edge spaces).
//  - Total Athletes  athletes with an ACCEPTED connection to an active, verified coach of this
//                    school. An athlete who hid their showcase is not counted or named.
//
// The activity feed follows the same rule: only active accounts are named.
//
// Responses carry names, sports, positions and dates only. Never emails, credential numbers or
// review notes.

import { getDb, type Db } from "./db.server.ts";
import type { PublicUser } from "./auth.server.ts";

export const REP_ROLE = "university_representative";

/** The most pending requests returned at once (a single school rarely has more). */
export const PENDING_LIMIT = 50;
export const ACTIVITY_LIMIT = 10;

export class RepDashboardError extends Error {
  readonly httpStatus: number;
  readonly code: string;
  constructor(httpStatus: number, code: string, message: string) {
    super(message);
    this.httpStatus = httpStatus;
    this.code = code;
  }
}

export interface PendingCoachRequest {
  /** the coach's user id (used as a list key only) */
  id: string;
  name: string;
  sport: string;
  position: string;
  programName: string;
  credentialType: string;
  /** when the coach sent the verification request */
  appliedAt: string;
}

export type ActivityKind =
  | "coach_requested" | "coach_approved" | "coach_rejected"
  | "athlete_connected" | "athlete_applied_coach"
  | "scholarship_posted" | "scholarship_applied";

export interface RepActivity {
  id: string;
  kind: ActivityKind;
  text: string;
  at: string;
}

export interface RepDashboard {
  rep: { name: string; firstName: string; designation: string };
  school: {
    name: string;
    location: string;
    logoUrl: string;
    /** the school exists in the universities table (true once a rep or coach of it was approved) */
    registered: boolean;
  };
  stats: { totalCoaches: number; totalAthletes: number; pendingCoachRequests: number; activeCoaches: number };
  pendingRequests: { items: PendingCoachRequest[]; total: number };
  activities: RepActivity[];
  generatedAt: string;
}

interface School {
  key: string;
  name: string;
  universityId: string | null;
  location: string;
  logoUrl: string;
  designation: string;
}

/** The signed-in representative's own approved school, or why they have none. */
async function resolveSchool(db: Db, user: PublicUser): Promise<School> {
  if (!user.roles.includes(REP_ROLE))
    throw new RepDashboardError(403, "role_not_allowed", "Only school representatives can open this dashboard.");

  const [row] = await db<{ university_name: string; designation: string; key: string; status: string | null }[]>`
    SELECT rp.university_name, rp.designation, lower(btrim(rp.university_name)) AS key, ra.status
    FROM university_representative_profiles rp
    LEFT JOIN rep_applications ra ON ra.user_id = rp.user_id
    WHERE rp.user_id = ${user.id}`;
  if (!row) throw new RepDashboardError(404, "no_school", "Your account isn't linked to a school yet.");
  // No application row = an account made by the operator's tool, which is already trusted.
  if (row.status !== null && row.status !== "approved")
    throw new RepDashboardError(403, "school_not_approved", "Your school hasn't been approved by a Sportal administrator yet.");

  const [u] = await db<{ id: string; name: string; location: string; logo_url: string }[]>`
    SELECT id, name, location, logo_url FROM universities WHERE name_key = ${row.key}`;
  return {
    key: row.key,
    // The registered name when the school exists on Sportal, otherwise what the representative applied with.
    name: u?.name ?? row.university_name.trim(),
    universityId: u?.id ?? null,
    location: u?.location ?? "",
    logoUrl: u?.logo_url ?? "",
    designation: row.designation,
  };
}

/** A coach who is verified right now (approved + holds the role) with an active, undeleted account. */
const VERIFIED_AND_ACTIVE = (db: Db, alias: string) => db`
  EXISTS (SELECT 1 FROM user_roles vr JOIN roles r ON r.id = vr.role_id WHERE vr.user_id = ${db(alias)}.id AND r.name = 'verified_coach')
  AND EXISTS (SELECT 1 FROM coach_verifications cv WHERE cv.coach_id = ${db(alias)}.id AND cv.status = 'verified')
  AND ${db(alias)}.is_active = TRUE AND ${db(alias)}.deleted_at IS NULL`;

const personName = (db: Db, up: string, u: string) =>
  db`COALESCE(NULLIF(btrim(concat_ws(' ', ${db(up)}.first_name, ${db(up)}.last_name)), ''), ${db(u)}.display_name)`;

async function loadStats(db: Db, school: School): Promise<RepDashboard["stats"]> {
  const uid = school.universityId;

  const [pending] = await db<{ n: number }[]>`
    SELECT count(*)::int AS n
    FROM coach_verifications v
    JOIN users u ON u.id = v.coach_id AND u.is_active = TRUE AND u.deleted_at IS NULL
    JOIN coach_profiles cp ON cp.user_id = v.coach_id
    WHERE v.status = 'pending' AND lower(btrim(v.organization)) = ${school.key}
      AND cp.organization_type IN ('University', 'College')`;

  if (!uid) return { totalCoaches: 0, activeCoaches: 0, totalAthletes: 0, pendingCoachRequests: pending?.n ?? 0 };

  const [coaches] = await db<{ total: number; active: number }[]>`
    SELECT count(*)::int AS total, (count(*) FILTER (WHERE u.is_active))::int AS active
    FROM coach_profiles cp
    JOIN users u ON u.id = cp.user_id AND u.deleted_at IS NULL
    WHERE cp.university_id = ${uid}
      AND EXISTS (SELECT 1 FROM user_roles vr JOIN roles r ON r.id = vr.role_id WHERE vr.user_id = u.id AND r.name = 'verified_coach')
      AND EXISTS (SELECT 1 FROM coach_verifications cv WHERE cv.coach_id = u.id AND cv.status = 'verified')`;

  const [athletes] = await db<{ n: number }[]>`
    SELECT count(DISTINCT c.athlete_id)::int AS n
    FROM coach_athlete_connections c
    JOIN coach_profiles cp ON cp.user_id = c.coach_id AND cp.university_id = ${uid}
    JOIN users cu ON cu.id = c.coach_id
    JOIN users a ON a.id = c.athlete_id AND a.is_active = TRUE AND a.deleted_at IS NULL
    LEFT JOIN athlete_profiles ap ON ap.user_id = a.id
    WHERE c.status = 'accepted' AND COALESCE(ap.showcase_visible, TRUE) = TRUE
      AND ${VERIFIED_AND_ACTIVE(db, "cu")}`;

  return {
    totalCoaches: coaches?.total ?? 0,
    activeCoaches: coaches?.active ?? 0,
    totalAthletes: athletes?.n ?? 0,
    pendingCoachRequests: pending?.n ?? 0,
  };
}

async function loadPending(db: Db, school: School): Promise<RepDashboard["pendingRequests"]> {
  const rows = await db<{
    coach_id: string; name: string; sport: string; position: string; program_name: string;
    credential_type: string; submitted_at: Date; total: number;
  }[]>`
    SELECT v.coach_id, ${personName(db, "up", "u")} AS name,
           COALESCE(cp.sport_specialization, '') AS sport, COALESCE(cp.coaching_position, '') AS position,
           COALESCE(cp.program_name, '') AS program_name, v.credential_type, v.submitted_at,
           count(*) OVER ()::int AS total
    FROM coach_verifications v
    JOIN users u ON u.id = v.coach_id AND u.is_active = TRUE AND u.deleted_at IS NULL
    JOIN coach_profiles cp ON cp.user_id = v.coach_id
    LEFT JOIN user_profiles up ON up.user_id = v.coach_id
    WHERE v.status = 'pending' AND lower(btrim(v.organization)) = ${school.key}
      AND cp.organization_type IN ('University', 'College')
    ORDER BY v.submitted_at, v.coach_id
    LIMIT ${PENDING_LIMIT}`;
  return {
    total: rows[0]?.total ?? 0,
    items: rows.map((r) => ({
      id: r.coach_id, name: r.name, sport: r.sport, position: r.position, programName: r.program_name,
      credentialType: r.credential_type, appliedAt: r.submitted_at.toISOString(),
    })),
  };
}

async function loadActivities(db: Db, school: School): Promise<RepActivity[]> {
  const uid = school.universityId;
  const out: RepActivity[] = [];
  const push = (kind: ActivityKind, key: string, text: string, at: Date | null) => {
    if (at) out.push({ id: `${kind}:${key}:${at.getTime()}`, kind, text, at: at.toISOString() });
  };

  const queries: Promise<void>[] = [];

  // Coach verification requests for this school, and the decisions made on them.
  queries.push((async () => {
    const rows = await db<{ coach_id: string; name: string; status: string; submitted_at: Date; reviewed_at: Date | null }[]>`
      SELECT v.coach_id, ${personName(db, "up", "u")} AS name, v.status, v.submitted_at, v.reviewed_at
      FROM coach_verifications v
      JOIN users u ON u.id = v.coach_id AND u.is_active = TRUE AND u.deleted_at IS NULL
      JOIN coach_profiles cp ON cp.user_id = v.coach_id
      LEFT JOIN user_profiles up ON up.user_id = v.coach_id
      WHERE lower(btrim(v.organization)) = ${school.key} AND cp.organization_type IN ('University', 'College')
      ORDER BY GREATEST(v.submitted_at, COALESCE(v.reviewed_at, v.submitted_at)) DESC
      LIMIT ${ACTIVITY_LIMIT}`;
    for (const r of rows) {
      push("coach_requested", r.coach_id, `Coach ${r.name} requested verification for your school.`, r.submitted_at);
      if (r.status === "verified") push("coach_approved", r.coach_id, `Coach ${r.name} was approved as a verified coach.`, r.reviewed_at);
      if (r.status === "rejected") push("coach_rejected", r.coach_id, `Coach ${r.name}'s verification request was not approved.`, r.reviewed_at);
    }
  })());

  if (uid) {
    // Athletes who accepted a connection with one of this school's active, verified coaches (the same rule as Total Athletes).
    queries.push((async () => {
      const rows = await db<{ id: string; athlete: string; coach: string; at: Date }[]>`
        SELECT c.id, ${personName(db, "aup", "a")} AS athlete, ${personName(db, "cup", "cu")} AS coach,
               COALESCE(c.responded_at, c.updated_at) AS at
        FROM coach_athlete_connections c
        JOIN coach_profiles cp ON cp.user_id = c.coach_id AND cp.university_id = ${uid}
        JOIN users cu ON cu.id = c.coach_id AND cu.deleted_at IS NULL
        LEFT JOIN user_profiles cup ON cup.user_id = cu.id
        JOIN users a ON a.id = c.athlete_id AND a.is_active = TRUE AND a.deleted_at IS NULL
        LEFT JOIN user_profiles aup ON aup.user_id = a.id
        LEFT JOIN athlete_profiles ap ON ap.user_id = a.id
        WHERE c.status = 'accepted' AND COALESCE(ap.showcase_visible, TRUE) = TRUE
          AND ${VERIFIED_AND_ACTIVE(db, "cu")}
        ORDER BY at DESC LIMIT ${ACTIVITY_LIMIT}`;
      for (const r of rows) push("athlete_connected", r.id, `${r.athlete} connected with Coach ${r.coach}.`, r.at);
    })());

    // Athletes who showed interest in one of this school's active, verified coaches.
    queries.push((async () => {
      const rows = await db<{ id: string; athlete: string; coach: string; at: Date }[]>`
        SELECT aa.id, ${personName(db, "aup", "a")} AS athlete, ${personName(db, "cup", "cu")} AS coach, aa.created_at AS at
        FROM athlete_applications aa
        JOIN coach_profiles cp ON cp.user_id = aa.coach_id AND cp.university_id = ${uid}
        JOIN users cu ON cu.id = aa.coach_id AND cu.deleted_at IS NULL
        LEFT JOIN user_profiles cup ON cup.user_id = cu.id
        JOIN users a ON a.id = aa.athlete_id AND a.is_active = TRUE AND a.deleted_at IS NULL
        LEFT JOIN user_profiles aup ON aup.user_id = a.id
        LEFT JOIN athlete_profiles ap ON ap.user_id = a.id
        WHERE COALESCE(ap.showcase_visible, TRUE) = TRUE
          AND ${VERIFIED_AND_ACTIVE(db, "cu")}
        ORDER BY aa.created_at DESC LIMIT ${ACTIVITY_LIMIT}`;
      for (const r of rows) push("athlete_applied_coach", r.id, `${r.athlete} applied to Coach ${r.coach}'s program.`, r.at);
    })());
  }

  // Scholarships this school posted (the scholarship's university is matched the same way).
  queries.push((async () => {
    const rows = await db<{ id: string; name: string; at: Date }[]>`
      SELECT s.id, s.name, s.created_at AS at FROM scholarships s
      WHERE lower(btrim(s.university)) = ${school.key}
      ORDER BY s.created_at DESC LIMIT ${ACTIVITY_LIMIT}`;
    for (const r of rows) push("scholarship_posted", r.id, `Scholarship posted: ${r.name}.`, r.at);
  })());

  // Athletes who applied to those scholarships (withdrawn ones are left out).
  queries.push((async () => {
    const rows = await db<{ id: string; athlete: string; scholarship: string; at: Date }[]>`
      SELECT sa.id, ${personName(db, "aup", "a")} AS athlete, s.name AS scholarship, sa.created_at AS at
      FROM scholarship_applications sa
      JOIN scholarships s ON s.id = sa.scholarship_id AND lower(btrim(s.university)) = ${school.key}
      JOIN users a ON a.id = sa.athlete_id AND a.is_active = TRUE AND a.deleted_at IS NULL
      LEFT JOIN user_profiles aup ON aup.user_id = a.id
      LEFT JOIN athlete_profiles ap ON ap.user_id = a.id
      WHERE sa.status <> 'withdrawn' AND COALESCE(ap.showcase_visible, TRUE) = TRUE
      ORDER BY sa.created_at DESC LIMIT ${ACTIVITY_LIMIT}`;
    for (const r of rows) push("scholarship_applied", r.id, `${r.athlete} applied for ${r.scholarship}.`, r.at);
  })());

  await Promise.all(queries);
  return out.sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : a.id < b.id ? 1 : -1)).slice(0, ACTIVITY_LIMIT);
}

export async function getRepDashboard(user: PublicUser, dbArg?: Db): Promise<RepDashboard> {
  const db = dbArg ?? (await getDb());
  const school = await resolveSchool(db, user);

  const [stats, pendingRequests, activities, [me]] = await Promise.all([
    loadStats(db, school),
    loadPending(db, school),
    loadActivities(db, school),
    db<{ first_name: string | null }[]>`SELECT first_name FROM user_profiles WHERE user_id = ${user.id}`,
  ]);

  const firstName = me?.first_name?.trim() || user.displayName.split(/\s+/)[0] || user.displayName;
  return {
    rep: { name: user.displayName, firstName, designation: school.designation },
    school: { name: school.name, location: school.location, logoUrl: school.logoUrl, registered: school.universityId !== null },
    stats,
    pendingRequests,
    activities,
    generatedAt: new Date().toISOString(),
  };
}
