// Coach "My Athletes" list, the coach dashboard's recruitment / performance / pending-action
// numbers, and the coach shortlist. (The athlete's own profile lives in athlete-profile.server.ts.)
//
// SERVER ONLY. Works on migration 4 in db.server.ts (athlete_profiles, athlete_skills,
// athlete_achievements, athlete_records, coach_shortlist, recruitment_inquiries, coach_messages,
// athlete_applications) plus the connections table from migration 2.
//
// Rules enforced here:
//  - A coach only ever sees athletes they have an ACCEPTED connection with (My Athletes, the
//    profile popup, performance numbers). Pending, declined and disconnected athletes are never
//    included, and neither are inactive or deleted accounts.
//  - Emails and usernames are never returned.
//  - Every list is scoped by the signed-in user's id taken from the session, never from the request.

import { standingFor } from "./rankings.server.ts";
import { getDb, type Db } from "./db.server.ts";
import type { PublicUser } from "./auth.server.ts";
import { ATHLETE_ROLE, COACH_ROLE, ConnectionError, PAGE_DEFAULT, PAGE_MAX } from "./connections.server.ts";
import { skills as skillCatalog } from "../src/lib/skills.ts";

const skillNames = new Map<string, string>(skillCatalog.map((k) => [k.id, k.name]));

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const now = () => new Date();
const DAY_MS = 24 * 60 * 60 * 1000;
const isoDay = (d: Date) => d.toISOString().slice(0, 10);

/** How many recent records the profile popup shows per athlete. */
export const RECORDS_PER_ATHLETE = 5;
/** The dashboard looks at the last 30 days, and compares with the 30 days before that. */
export const PERFORMANCE_WINDOW_DAYS = 30;

function requireCoach(actor: Pick<PublicUser, "roles">): void {
  if (!actor.roles.includes(COACH_ROLE))
    throw new ConnectionError(403, "role_not_allowed", "Only coach accounts can use this.");
}

// ---------- My Athletes ----------

export interface AthleteDetail {
  id: string;
  displayName: string;
  firstName: string;
  lastName: string;
  /** null when the athlete has no photo; the app then shows initials */
  photo: string | null;
  sport: string;
  position: string;
  school: string;
  /** null until the athlete has enough counted sessions to be ranked */
  rank: number | null;
  performance: number | null;
  consistency: number | null;
  bio: string;
  skills: string[];
  achievements: { title: string; year: string }[];
  /** newest first; recordedOn is YYYY-MM-DD */
  records: { label: string; value: string; recordedOn: string }[];
}

interface AthleteRow {
  id: string;
  display_name: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  sport: string | null;
  playing_position: string | null;
  school: string | null;
  bio: string | null;
}

function clampPaging(paging: { limit?: number; offset?: number }) {
  const limit = Math.min(Math.max(Math.trunc(paging.limit ?? PAGE_DEFAULT), 1), PAGE_MAX);
  const offset = Math.max(Math.trunc(paging.offset ?? 0), 0);
  return { limit, offset };
}

/** Splits "Juan Dela Cruz" for accounts that have no separate first / last name saved. */
function splitName(displayName: string): { firstName: string; lastName: string } {
  const parts = displayName.trim().split(/\s+/);
  return { firstName: parts[0] ?? "", lastName: parts.slice(1).join(" ") };
}

/** The coach's connected athletes with everything the My Athletes page and its popup show. */
export async function listMyAthletes(
  actor: PublicUser,
  paging: { limit?: number; offset?: number } = {},
  dbArg?: Db,
): Promise<{ items: AthleteDetail[]; total: number; limit: number; offset: number }> {
  requireCoach(actor);
  const db = dbArg ?? (await getDb());
  const me = actor.id;
  const { limit, offset } = clampPaging(paging);

  const rows = await db<AthleteRow[]>`
    SELECT u.id, u.display_name, up.first_name, up.last_name, up.avatar_url,
           ap.sport, ap.playing_position, ap.school, ap.bio
    FROM coach_athlete_connections c
    JOIN users u ON u.id = c.athlete_id
    LEFT JOIN user_profiles up ON up.user_id = u.id
    LEFT JOIN athlete_profiles ap ON ap.user_id = u.id
    WHERE c.coach_id = ${me} AND c.status = 'accepted' AND u.is_active = TRUE AND u.deleted_at IS NULL
    ORDER BY lower(u.display_name), u.id
    LIMIT ${limit} OFFSET ${offset}`;
  const [count] = await db<{ n: number }[]>`
    SELECT COUNT(*)::int AS n
    FROM coach_athlete_connections c
    JOIN users u ON u.id = c.athlete_id
    WHERE c.coach_id = ${me} AND c.status = 'accepted' AND u.is_active = TRUE AND u.deleted_at IS NULL`;

  if (rows.length === 0) return { items: [], total: count?.n ?? 0, limit, offset };
  const ids = rows.map((r) => r.id);

  // Three small queries for the whole page, instead of three per athlete.
  const [skills, achievements, records] = await Promise.all([
    db<{ athlete_id: string; name: string }[]>`
      SELECT athlete_id, name FROM athlete_skills WHERE athlete_id IN ${db(ids)} ORDER BY athlete_id, position`,
    db<{ athlete_id: string; title: string; year: string }[]>`
      SELECT athlete_id, title, year FROM athlete_achievements WHERE athlete_id IN ${db(ids)} ORDER BY athlete_id, position`,
    db<{ athlete_id: string; label: string; value: string; recorded_on: string }[]>`
      SELECT athlete_id, label, value, recorded_on::text AS recorded_on
      FROM (
        SELECT r.athlete_id, r.label, r.value, r.recorded_on, r.created_at,
               ROW_NUMBER() OVER (PARTITION BY r.athlete_id ORDER BY r.recorded_on DESC, r.created_at DESC) AS rn
        FROM athlete_records r WHERE r.athlete_id IN ${db(ids)}
      ) t
      WHERE rn <= ${RECORDS_PER_ATHLETE}
      ORDER BY athlete_id, rn`,
  ]);

  const group = <T extends { athlete_id: string }>(list: T[]) => {
    const m = new Map<string, T[]>();
    for (const item of list) (m.get(item.athlete_id) ?? m.set(item.athlete_id, []).get(item.athlete_id)!).push(item);
    return m;
  };
  const skillsBy = group(skills);
  // Worked out from each athlete's counted sessions, never read from a stored column.
  const standings = await standingFor(db, ids, me);
  const achievementsBy = group(achievements);
  const recordsBy = group(records);

  const items: AthleteDetail[] = rows.map((r) => {
    const fallback = splitName(r.display_name);
    const first = r.first_name?.trim() || fallback.firstName;
    const last = r.last_name?.trim() || (r.first_name?.trim() ? "" : fallback.lastName);
    return {
      id: r.id,
      displayName: r.display_name,
      firstName: first,
      lastName: last,
      photo: r.avatar_url,
      sport: r.sport ?? "",
      position: r.playing_position ?? "",
      school: r.school ?? "",
      rank: standings.get(r.id)?.rank ?? null,
      performance: standings.get(r.id)?.performance ?? null,
      consistency: standings.get(r.id)?.consistency ?? null,
      bio: r.bio ?? "",
      skills: (skillsBy.get(r.id) ?? []).map((s) => s.name),
      achievements: (achievementsBy.get(r.id) ?? []).map((a) => ({ title: a.title, year: a.year })),
      records: (recordsBy.get(r.id) ?? []).map((x) => ({ label: x.label, value: x.value, recordedOn: x.recorded_on })),
    };
  });
  return { items, total: count?.n ?? 0, limit, offset };
}

// ---------- Coach dashboard ----------

export interface DashboardPerson {
  id: string;
  displayName: string;
  firstName: string;
  lastName: string;
  photo: string | null;
}

export interface CoachDashboard {
  /** What needs the coach's attention. connectionRequests are requests sent TO the coach. */
  pendingActions: { connectionRequests: number; unansweredInquiries: number; unreadMessages: number; newApplications: number };
  recruitment: {
    shortlist: DashboardPerson[];
    /** one entry per athlete the coach is talking to, newest message first */
    conversations: { athlete: DashboardPerson; last: string; at: string }[];
    inquiryStatuses: { awaiting: number; replied: number; accepted: number; declined: number };
  };
  performance: {
    /** connected athletes */
    athletesTotal: number;
    /** connected athletes with at least one practice session in the last 30 days */
    athletesUpdated: number;
    /** average score per skill over the last 30 days, and the change from the 30 days before (0 when there is no earlier data) */
    skills: { name: string; avg: number; change: number }[];
  };
}

interface PersonRow {
  id: string;
  display_name: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
}

function toPerson(r: PersonRow): DashboardPerson {
  const fallback = splitName(r.display_name);
  return {
    id: r.id,
    displayName: r.display_name,
    firstName: r.first_name?.trim() || fallback.firstName,
    lastName: r.last_name?.trim() || (r.first_name?.trim() ? "" : fallback.lastName),
    photo: r.avatar_url,
  };
}

export const SKILLS_SHOWN = 6;
export const CONVERSATIONS_SHOWN = 5;
export const SHORTLIST_SHOWN = 12;

export async function getCoachDashboard(actor: PublicUser, dbArg?: Db): Promise<CoachDashboard> {
  requireCoach(actor);
  const db = dbArg ?? (await getDb());
  const me = actor.id;
  const today = now();
  const since = isoDay(new Date(today.getTime() - PERFORMANCE_WINDOW_DAYS * DAY_MS));
  const before = isoDay(new Date(today.getTime() - 2 * PERFORMANCE_WINDOW_DAYS * DAY_MS));

  const [
    incoming, inquiryRows, unread, applications, shortlistRows, conversationRows, roster, updated, skillRows,
  ] = await Promise.all([
    db<{ n: number }[]>`
      SELECT COUNT(*)::int AS n
      FROM coach_athlete_connections c JOIN users u ON u.id = c.athlete_id
      WHERE c.coach_id = ${me} AND c.status = 'pending' AND c.requested_by <> ${me}
        AND u.is_active = TRUE AND u.deleted_at IS NULL`,
    db<{ status: string; n: number }[]>`
      SELECT i.status, COUNT(*)::int AS n
      FROM recruitment_inquiries i JOIN users u ON u.id = i.athlete_id
      WHERE i.coach_id = ${me} AND u.is_active = TRUE AND u.deleted_at IS NULL
      GROUP BY i.status`,
    db<{ n: number }[]>`
      SELECT COUNT(*)::int AS n
      FROM coach_messages m JOIN users u ON u.id = m.athlete_id
      WHERE m.coach_id = ${me} AND m.sender_id <> ${me} AND m.read_at IS NULL
        AND u.is_active = TRUE AND u.deleted_at IS NULL`,
    db<{ n: number }[]>`
      SELECT COUNT(*)::int AS n
      FROM athlete_applications a JOIN users u ON u.id = a.athlete_id
      WHERE a.coach_id = ${me} AND a.status = 'new' AND u.is_active = TRUE AND u.deleted_at IS NULL`,
    db<PersonRow[]>`
      SELECT u.id, u.display_name, up.first_name, up.last_name, up.avatar_url
      FROM coach_shortlist s
      JOIN users u ON u.id = s.athlete_id
      LEFT JOIN user_profiles up ON up.user_id = u.id
      WHERE s.coach_id = ${me} AND u.is_active = TRUE AND u.deleted_at IS NULL
      ORDER BY s.created_at DESC, u.id
      LIMIT ${SHORTLIST_SHOWN}`,
    db<(PersonRow & { body: string; created_at: Date })[]>`
      SELECT u.id, u.display_name, up.first_name, up.last_name, up.avatar_url, t.body, t.created_at
      FROM (
        SELECT DISTINCT ON (m.athlete_id) m.athlete_id, m.body, m.created_at
        FROM coach_messages m
        WHERE m.coach_id = ${me}
        ORDER BY m.athlete_id, m.created_at DESC
      ) t
      JOIN users u ON u.id = t.athlete_id
      LEFT JOIN user_profiles up ON up.user_id = u.id
      WHERE u.is_active = TRUE AND u.deleted_at IS NULL
      ORDER BY t.created_at DESC
      LIMIT ${CONVERSATIONS_SHOWN}`,
    db<{ n: number }[]>`
      SELECT COUNT(*)::int AS n
      FROM coach_athlete_connections c JOIN users u ON u.id = c.athlete_id
      WHERE c.coach_id = ${me} AND c.status = 'accepted' AND u.is_active = TRUE AND u.deleted_at IS NULL`,
    db<{ n: number }[]>`
      SELECT COUNT(DISTINCT s.athlete_id)::int AS n
      FROM practice_sessions s
      JOIN coach_athlete_connections c ON c.athlete_id = s.athlete_id AND c.coach_id = ${me} AND c.status = 'accepted'
      JOIN users u ON u.id = s.athlete_id
      WHERE s.session_date >= ${since}::date AND u.is_active = TRUE AND u.deleted_at IS NULL`,
    // Only sessions that count toward rankings (coach-verified or AI-assessed), and only skills measured
    // in percent: vertical jump is in centimetres, so it can't be averaged with the rest.
    db<{ id: string; cur: number; prev: number | null }[]>`
      SELECT s.skill AS id,
             AVG(s.result) FILTER (WHERE s.session_date >= ${since}::date)::float8 AS cur,
             AVG(s.result) FILTER (WHERE s.session_date < ${since}::date)::float8 AS prev
      FROM practice_sessions s
      JOIN coach_athlete_connections c ON c.athlete_id = s.athlete_id AND c.coach_id = ${me} AND c.status = 'accepted'
      JOIN users u ON u.id = s.athlete_id
      WHERE s.status IN ('ai_assessed', 'coach_verified') AND s.skill <> 'vertical'
        AND s.session_date >= ${before}::date AND u.is_active = TRUE AND u.deleted_at IS NULL
      GROUP BY s.skill
      HAVING AVG(s.result) FILTER (WHERE s.session_date >= ${since}::date) IS NOT NULL
      ORDER BY s.skill
      LIMIT ${SKILLS_SHOWN}`,
  ]);

  const statuses = { awaiting: 0, replied: 0, accepted: 0, declined: 0 };
  for (const row of inquiryRows) if (row.status in statuses) statuses[row.status as keyof typeof statuses] = row.n;

  return {
    pendingActions: {
      connectionRequests: incoming[0]?.n ?? 0,
      unansweredInquiries: statuses.awaiting,
      unreadMessages: unread[0]?.n ?? 0,
      newApplications: applications[0]?.n ?? 0,
    },
    recruitment: {
      shortlist: shortlistRows.map(toPerson),
      conversations: conversationRows.map((r) => ({ athlete: toPerson(r), last: r.body, at: r.created_at.toISOString() })),
      inquiryStatuses: statuses,
    },
    performance: {
      athletesTotal: roster[0]?.n ?? 0,
      athletesUpdated: updated[0]?.n ?? 0,
      skills: skillRows.map((s) => ({
        name: skillNames.get(s.id) ?? s.id,
        avg: Math.round(s.cur),
        change: s.prev === null ? 0 : Math.round(s.cur) - Math.round(s.prev),
      })),
    },
  };
}

// ---------- Shortlist ----------

/** Adds or removes an athlete on the coach's shortlist. Both are safe to repeat. */
export async function setShortlisted(actor: PublicUser, athleteId: string, on: boolean, dbArg?: Db): Promise<{ athleteId: string; shortlisted: boolean }> {
  requireCoach(actor);
  if (!UUID_RE.test(athleteId)) throw new ConnectionError(404, "athlete_not_found", "Athlete not found.");
  const db = dbArg ?? (await getDb());
  if (on) {
    // Only a real, active student-athlete can be shortlisted.
    const [athlete] = await db<{ id: string }[]>`
      SELECT u.id FROM users u
      JOIN user_roles ur ON ur.user_id = u.id JOIN roles r ON r.id = ur.role_id
      WHERE u.id = ${athleteId} AND r.name = ${ATHLETE_ROLE} AND u.is_active = TRUE AND u.deleted_at IS NULL`;
    if (!athlete) throw new ConnectionError(404, "athlete_not_found", "Athlete not found.");
    await db`
      INSERT INTO coach_shortlist (coach_id, athlete_id, created_at) VALUES (${actor.id}, ${athleteId}, ${now()})
      ON CONFLICT (coach_id, athlete_id) DO NOTHING`;
  } else {
    await db`DELETE FROM coach_shortlist WHERE coach_id = ${actor.id} AND athlete_id = ${athleteId}`;
  }
  return { athleteId, shortlisted: on };
}
