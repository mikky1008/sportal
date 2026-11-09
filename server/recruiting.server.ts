// Recruiting: the athlete directory, a coach's watchlist and notes, recruitment inquiries and the
// conversations that follow them.
//
// SERVER ONLY. Works on `athlete_profiles`, `practice_sessions`, `coach_shortlist`,
// `recruitment_inquiries` and `coach_messages` (migrations 4, 6 and 9 in db.server.ts).
//
// The rules the Recruiting page used to enforce in the browser now live here, where they can be trusted:
//  - Only a VERIFIED coach can discover athletes, keep notes and send inquiries.
//  - An athlete who hides their showcase (athlete_profiles.showcase_visible = false) is not in the
//    directory and cannot receive NEW inquiries. Conversations that already exist stay open.
//  - An inquiry is a request, not a message. Only the athlete can answer it, only while it is
//    awaiting, and NO message can be sent in either direction until they accept.
//  - Only the two people in an inquiry can read or write its thread.
//  - Notes are private to the coach who wrote them.
// Responses carry names, schools and results only, never emails.

import { randomUUID } from "node:crypto";
import { getDb, type Db } from "./db.server.ts";
import { audit, type PublicUser, type RequestMeta } from "./auth.server.ts";
import { ATHLETE_ROLE, COACH_ROLE, isVerifiedCoach } from "./connections.server.ts";
import { notify } from "./notifications.server.ts";
import { headlinePositions } from "./rankings.server.ts";
import { formatHeight } from "../src/lib/athleteProfileRules.ts";
import { skills as SKILLS } from "../src/lib/skills.ts";

export const DIRECTORY_LIMIT_DEFAULT = 60;
export const DIRECTORY_LIMIT_MAX = 100;
export const INQUIRIES_PER_DAY = 25;
export const NOTE_MAX = 500;
export const MESSAGE_MAX = 2000;
export const INQUIRY_MESSAGE_MAX = 1000;
export const ORGANIZATION_MAX = 120;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class RecruitingError extends Error {
  readonly httpStatus: number;
  readonly code: string;
  constructor(httpStatus: number, code: string, message: string) {
    super(message);
    this.httpStatus = httpStatus;
    this.code = code;
  }
}

// ---------- views ----------

export interface DirectoryAthleteView {
  id: string;
  firstName: string;
  lastName: string;
  sport: string;
  position: string;
  school: string;
  year: string;
  height: string;
  bio: string;
  teamStatus: string;
  teamName?: string;
  municipality: string;
  province: string;
  /** average of the athlete's counted Overall Performance results; 0 when there are none yet */
  performanceScore: number;
  /** nationwide headline rank; 0 = not ranked yet */
  rank: number;
  verifiedSessions: number;
  totalSessions: number;
  skills: { name: string; value: string }[];
  achievements: { title: string; year: string }[];
  visible: boolean;
}

export type InquiryStatusView = "Pending" | "Accepted" | "Declined";

export interface InquiryView {
  id: string;
  athleteId: string;
  athleteName: string;
  recruiterId: string;
  recruiterName: string;
  organization: string;
  message: string;
  status: InquiryStatusView;
  createdAt: string;
  updatedAt: string;
  /** messages in this conversation the signed-in user has not read yet */
  unread: number;
}

export interface MessageView {
  id: string;
  inquiryId: string;
  from: "recruiter" | "athlete";
  body: string;
  createdAt: string;
}

const STATUS: Record<string, InquiryStatusView> = { awaiting: "Pending", replied: "Accepted", accepted: "Accepted", declined: "Declined" };
const round1 = (n: number) => Math.round(n * 10) / 10;

// ---------- guards ----------

async function requireVerifiedCoach(db: Db, user: PublicUser): Promise<void> {
  if (!user.roles.includes(COACH_ROLE)) throw new RecruitingError(403, "role_not_allowed", "Only coaches can recruit.");
  if (!(await isVerifiedCoach(db, user.id)))
    throw new RecruitingError(403, "coach_not_verified", "Your coach account must be verified before you can recruit athletes.");
}

function requireAthlete(user: PublicUser): void {
  if (!user.roles.includes(ATHLETE_ROLE)) throw new RecruitingError(403, "role_not_allowed", "Only student-athletes can do this.");
}

const isUuid = (id: string) => UUID_RE.test(id);
const notFound = () => new RecruitingError(404, "not_found", "Not found.");

// ---------- the directory ----------

interface ProfileRow {
  id: string;
  first_name: string | null;
  last_name: string | null;
  display_name: string;
  sport: string;
  position: string;
  school: string;
  year: string;
  height_cm: number | null;
  bio: string;
  team_status: string;
  team_name: string;
  municipality: string;
  province: string;
  visible: boolean;
}

interface SessionAgg {
  athlete_id: string;
  skill: string;
  n: number;
  total: number;
  verified: number;
}

/** Everyone who has a started profile. Hidden athletes are only returned when `includeHidden` is set. */
async function loadDirectory(db: Db, opts: { onlyId?: string; includeHidden?: boolean } = {}): Promise<DirectoryAthleteView[]> {
  const rows = await db<ProfileRow[]>`
    SELECT u.id, up.first_name, up.last_name, u.display_name,
           ap.sport, ap.playing_position AS position, ap.school, ap.year_level AS year, ap.height_cm::float8 AS height_cm,
           ap.bio, ap.team_status, ap.team_name, ap.municipality, ap.province, ap.showcase_visible AS visible
    FROM athlete_profiles ap
    JOIN users u ON u.id = ap.user_id
    LEFT JOIN user_profiles up ON up.user_id = u.id
    WHERE u.is_active = TRUE AND u.deleted_at IS NULL AND ap.sport <> ''
      ${opts.includeHidden ? db`` : db`AND ap.showcase_visible = TRUE`}
      ${opts.onlyId ? db`AND u.id = ${opts.onlyId}` : db``}`;
  if (rows.length === 0) return [];

  const sessionRows = await db<SessionAgg[]>`
    SELECT athlete_id, skill, count(*)::int AS n, sum(result)::float8 AS total,
           (count(*) FILTER (WHERE status = 'coach_verified'))::int AS verified
    FROM practice_sessions
    WHERE status IN ('ai_assessed', 'coach_verified') ${opts.onlyId ? db`AND athlete_id = ${opts.onlyId}` : db``}
    GROUP BY athlete_id, skill`;
  const bySkill = new Map<string, SessionAgg[]>();
  for (const r of sessionRows) {
    const list = bySkill.get(r.athlete_id);
    if (list) list.push(r);
    else bySkill.set(r.athlete_id, [r]);
  }

  const achievements = await db<{ athlete_id: string; title: string; year: string }[]>`
    SELECT athlete_id, title, year FROM athlete_achievements
    WHERE ${opts.onlyId ? db`athlete_id = ${opts.onlyId}` : db`TRUE`} ORDER BY athlete_id, position`;
  const achBy = new Map<string, { title: string; year: string }[]>();
  for (const a of achievements) {
    const list = achBy.get(a.athlete_id);
    if (list) list.push({ title: a.title, year: a.year });
    else achBy.set(a.athlete_id, [{ title: a.title, year: a.year }]);
  }

  const ranks = await headlinePositions(db, "");

  return rows.map((r) => {
    // Per-skill sessions are Basketball sessions, so other sports have no results to show yet.
    const mine = r.sport === "Basketball" ? (bySkill.get(r.id) ?? []) : [];
    const total = mine.reduce((a, s) => a + s.n, 0);
    const verified = mine.reduce((a, s) => a + s.verified, 0);
    const overall = mine.filter((s) => s.skill !== "vertical"); // cm, so it cannot be averaged with percentages
    const overallN = overall.reduce((a, s) => a + s.n, 0);
    const score = overallN ? round1(overall.reduce((a, s) => a + s.total, 0) / overallN) : 0;
    const skillList = mine
      .map((s) => ({ id: s.skill, avg: s.total / s.n }))
      .sort((x, y) => y.avg - x.avg)
      .slice(0, 3)
      .map((s) => ({ name: SKILLS.find((k) => k.id === s.id)?.name ?? s.id, value: `${Math.round(s.avg)}${s.id === "vertical" ? " cm" : "%"}` }));
    const first = r.first_name ?? r.display_name.trim().split(/\s+/)[0] ?? "";
    const last = r.last_name ?? r.display_name.trim().split(/\s+/).slice(1).join(" ");
    return {
      id: r.id,
      firstName: first,
      lastName: last,
      sport: r.sport,
      position: r.position,
      school: r.school,
      year: r.year,
      height: r.height_cm === null ? "" : formatHeight(r.height_cm),
      bio: r.bio,
      teamStatus: r.team_status,
      ...(r.team_name ? { teamName: r.team_name } : {}),
      municipality: r.municipality,
      province: r.province,
      performanceScore: score,
      rank: ranks.get(r.id) ?? 0,
      verifiedSessions: verified,
      totalSessions: total,
      skills: skillList,
      achievements: achBy.get(r.id) ?? [],
      visible: r.visible,
    };
  });
}

export interface DirectoryQuery {
  q?: string | undefined;
  sport?: string | undefined;
  position?: string | undefined;
  school?: string | undefined;
  skill?: string | undefined;
  verifiedOnly?: boolean | undefined;
  sort?: "score" | "verified" | "name" | undefined;
  limit: number;
  offset: number;
}

export interface DirectoryResponse {
  items: DirectoryAthleteView[];
  total: number;
  /** ids the signed-in coach has saved, so the cards can show their bookmark state */
  watchlist: string[];
  options: { sports: string[]; positions: string[]; schools: string[]; skills: string[] };
}

const distinct = (xs: string[]) => [...new Set(xs.filter(Boolean))].sort((a, b) => a.localeCompare(b));
const verifiedShare = (a: DirectoryAthleteView) => (a.totalSessions ? a.verifiedSessions / a.totalSessions : 0);

export async function listAthletes(user: PublicUser, q: DirectoryQuery, dbArg?: Db): Promise<DirectoryResponse> {
  const db = dbArg ?? (await getDb());
  await requireVerifiedCoach(db, user);
  const all = await loadDirectory(db);
  const inSport = all.filter((a) => !q.sport || a.sport === q.sport);
  const needle = q.q?.trim().toLowerCase().slice(0, 80);

  const matches = inSport
    .filter((a) => !q.position || a.position === q.position)
    .filter((a) => !q.school || a.school === q.school)
    .filter((a) => !q.skill || a.skills.some((s) => s.name === q.skill))
    .filter((a) => !q.verifiedOnly || a.verifiedSessions > 0)
    .filter((a) => !needle || [a.firstName, a.lastName, a.school, a.position, a.bio, ...a.skills.map((s) => s.name)].some((x) => x.toLowerCase().includes(needle)))
    .sort((x, y) =>
      q.sort === "verified" ? verifiedShare(y) - verifiedShare(x) || x.lastName.localeCompare(y.lastName)
        : q.sort === "name" ? `${x.firstName} ${x.lastName}`.localeCompare(`${y.firstName} ${y.lastName}`)
        : y.performanceScore - x.performanceScore || `${x.firstName} ${x.lastName}`.localeCompare(`${y.firstName} ${y.lastName}`));

  const watch = await db<{ athlete_id: string }[]>`SELECT athlete_id FROM coach_shortlist WHERE coach_id = ${user.id}`;
  return {
    items: matches.slice(q.offset, q.offset + q.limit),
    total: matches.length,
    watchlist: watch.map((w) => w.athlete_id),
    options: {
      sports: distinct(all.map((a) => a.sport)),
      positions: distinct(inSport.map((a) => a.position)),
      schools: distinct(all.map((a) => a.school)),
      skills: distinct(inSport.flatMap((a) => a.skills.map((s) => s.name))),
    },
  };
}

export interface AthleteDetail {
  athlete: DirectoryAthleteView;
  /** the signed-in athlete is looking at their own showcase (shown even when hidden) */
  own: boolean;
  watched: boolean;
  note: string;
  /** the signed-in coach's open or accepted inquiry with this athlete, if any */
  inquiry: { id: string; status: InquiryStatusView } | null;
}

export async function getAthlete(user: PublicUser, athleteId: string, dbArg?: Db): Promise<AthleteDetail> {
  if (!isUuid(athleteId)) throw notFound();
  const db = dbArg ?? (await getDb());
  const own = user.roles.includes(ATHLETE_ROLE) && user.id === athleteId;
  if (!own) await requireVerifiedCoach(db, user);
  const [athlete] = await loadDirectory(db, { onlyId: athleteId, includeHidden: own });
  if (!athlete) throw notFound(); // missing, inactive and hidden all look the same
  if (own) return { athlete, own: true, watched: false, note: "", inquiry: null };

  const [w] = await db<{ note: string }[]>`SELECT note FROM coach_shortlist WHERE coach_id = ${user.id} AND athlete_id = ${athleteId}`;
  const [inq] = await db<{ id: string; status: string }[]>`
    SELECT id, status FROM recruitment_inquiries
    WHERE coach_id = ${user.id} AND athlete_id = ${athleteId} AND status <> 'declined' ORDER BY created_at DESC LIMIT 1`;
  return { athlete, own: false, watched: !!w, note: w?.note ?? "", inquiry: inq ? { id: inq.id, status: STATUS[inq.status] ?? "Pending" } : null };
}

// ---------- watchlist ----------

export async function listWatchlist(user: PublicUser, dbArg?: Db): Promise<{ items: (DirectoryAthleteView & { note: string })[] }> {
  const db = dbArg ?? (await getDb());
  await requireVerifiedCoach(db, user);
  const rows = await db<{ athlete_id: string; note: string }[]>`
    SELECT athlete_id, note FROM coach_shortlist WHERE coach_id = ${user.id} ORDER BY created_at DESC`;
  if (rows.length === 0) return { items: [] };
  const all = new Map((await loadDirectory(db)).map((a) => [a.id, a]));
  // Athletes who have since hidden their showcase drop out of the watchlist view (the bookmark stays).
  return { items: rows.flatMap((r) => { const a = all.get(r.athlete_id); return a ? [{ ...a, note: r.note }] : []; }) };
}

export async function setNote(user: PublicUser, athleteId: string, rawNote: string, dbArg?: Db): Promise<{ note: string }> {
  const db = dbArg ?? (await getDb());
  await requireVerifiedCoach(db, user);
  const note = rawNote.trim();
  if (note.length > NOTE_MAX) throw new RecruitingError(400, "validation", `Notes are limited to ${NOTE_MAX} characters.`);
  if (!isUuid(athleteId)) throw notFound();
  const rows = await db`UPDATE coach_shortlist SET note = ${note} WHERE coach_id = ${user.id} AND athlete_id = ${athleteId} RETURNING athlete_id`;
  if (rows.length === 0) throw new RecruitingError(409, "not_saved", "Save the athlete to your watchlist before adding a note.");
  return { note };
}

// ---------- inquiries ----------

interface InquiryRow {
  id: string;
  coach_id: string;
  athlete_id: string;
  status: string;
  organization: string;
  message: string;
  created_at: Date;
  updated_at: Date;
  athlete_name: string;
  coach_name: string;
  unread: number;
}

const toInquiry = (r: InquiryRow): InquiryView => ({
  id: r.id,
  athleteId: r.athlete_id,
  athleteName: r.athlete_name,
  recruiterId: r.coach_id,
  recruiterName: r.coach_name,
  organization: r.organization,
  message: r.message,
  status: STATUS[r.status] ?? "Pending",
  createdAt: r.created_at.toISOString(),
  updatedAt: r.updated_at.toISOString(),
  unread: r.unread,
});

const SELECT_INQUIRY = (db: Db, viewerId: string) => db`
  SELECT i.id, i.coach_id, i.athlete_id, i.status, i.organization, i.message, i.created_at, i.updated_at,
         au.display_name AS athlete_name, cu.display_name AS coach_name,
         (SELECT count(*)::int FROM coach_messages m WHERE m.inquiry_id = i.id AND m.sender_id <> ${viewerId} AND m.read_at IS NULL) AS unread
  FROM recruitment_inquiries i
  JOIN users au ON au.id = i.athlete_id
  JOIN users cu ON cu.id = i.coach_id`;

export async function listInquiries(user: PublicUser, dbArg?: Db): Promise<{ items: InquiryView[] }> {
  const db = dbArg ?? (await getDb());
  const isCoach = user.roles.includes(COACH_ROLE);
  if (!isCoach && !user.roles.includes(ATHLETE_ROLE)) throw new RecruitingError(403, "role_not_allowed", "Only coaches and student-athletes have inquiries.");
  const rows = await db<InquiryRow[]>`
    ${SELECT_INQUIRY(db, user.id)}
    WHERE ${isCoach ? db`i.coach_id = ${user.id}` : db`i.athlete_id = ${user.id}`}
    ORDER BY i.updated_at DESC, i.id`;
  return { items: rows.map(toInquiry) };
}

export async function sendInquiry(
  user: PublicUser,
  input: { athleteId: string; organization: string; message: string },
  meta: Partial<RequestMeta> = {},
  dbArg?: Db,
): Promise<InquiryView> {
  const db = dbArg ?? (await getDb());
  await requireVerifiedCoach(db, user);
  const organization = input.organization.trim();
  const message = input.message.trim();
  if (organization.length < 2 || organization.length > ORGANIZATION_MAX) throw new RecruitingError(400, "validation", "Name your organization or program (2-120 characters).");
  if (!message || message.length > INQUIRY_MESSAGE_MAX) throw new RecruitingError(400, "validation", `Write a message of up to ${INQUIRY_MESSAGE_MAX} characters.`);
  if (!isUuid(input.athleteId)) throw notFound();

  const [athlete] = await db<{ id: string; visible: boolean }[]>`
    SELECT u.id, COALESCE(ap.showcase_visible, TRUE) AS visible
    FROM users u
    JOIN user_roles ur ON ur.user_id = u.id JOIN roles r ON r.id = ur.role_id
    LEFT JOIN athlete_profiles ap ON ap.user_id = u.id
    WHERE u.id = ${input.athleteId} AND r.name = ${ATHLETE_ROLE} AND u.is_active = TRUE AND u.deleted_at IS NULL`;
  if (!athlete) throw notFound();
  if (!athlete.visible) throw new RecruitingError(409, "showcase_hidden", "This athlete has hidden their showcase, so new inquiries are closed.");

  const id = randomUUID();
  const now = new Date();
  await db.begin(async (tx) => {
    // One lock per coach-athlete pair, so two quick taps cannot both pass the "already open" check.
    await tx`SELECT pg_advisory_xact_lock(hashtext(${`inq:${user.id}:${input.athleteId}`}))`;
    const [open] = await tx`SELECT 1 FROM recruitment_inquiries WHERE coach_id = ${user.id} AND athlete_id = ${input.athleteId} AND status <> 'declined'`;
    if (open) throw new RecruitingError(409, "already_open", "You already have an open inquiry with this athlete.");
    const [today] = await tx<{ n: number }[]>`
      SELECT count(*)::int AS n FROM recruitment_inquiries WHERE coach_id = ${user.id} AND created_at > ${new Date(now.getTime() - 24 * 60 * 60 * 1000)}`;
    if ((today?.n ?? 0) >= INQUIRIES_PER_DAY) throw new RecruitingError(429, "rate_limited", "You have sent a lot of inquiries today. Please try again tomorrow.");
    await tx`
      INSERT INTO recruitment_inquiries (id, coach_id, athlete_id, status, organization, message, created_at, updated_at)
      VALUES (${id}, ${user.id}, ${input.athleteId}, 'awaiting', ${organization}, ${message}, ${now}, ${now})`;
  });
  await audit("recruiting.inquiry_sent", { userId: user.id, ...meta, detail: { inquiryId: id, athleteId: input.athleteId } }, db);
  await notify(input.athleteId, { category: "recruitment", title: "New recruitment inquiry", message: `${user.displayName} (${organization}) sent you an inquiry.`, link: "/recruiting" }, db);
  const [row] = await db<InquiryRow[]>`${SELECT_INQUIRY(db, user.id)} WHERE i.id = ${id}`;
  return toInquiry(row as InquiryRow);
}

export async function respondToInquiry(
  user: PublicUser,
  inquiryId: string,
  decision: "accepted" | "declined",
  meta: Partial<RequestMeta> = {},
  dbArg?: Db,
): Promise<InquiryView> {
  requireAthlete(user);
  if (!isUuid(inquiryId)) throw notFound();
  const db = dbArg ?? (await getDb());
  const now = new Date();
  const updated = await db<{ coach_id: string }[]>`
    UPDATE recruitment_inquiries SET status = ${decision}, responded_at = ${now}, updated_at = ${now}
    WHERE id = ${inquiryId} AND athlete_id = ${user.id} AND status = 'awaiting' RETURNING coach_id`;
  const hit = updated[0];
  if (!hit) {
    const [exists] = await db`SELECT 1 FROM recruitment_inquiries WHERE id = ${inquiryId} AND athlete_id = ${user.id}`;
    if (!exists) throw notFound();
    throw new RecruitingError(409, "already_answered", "This inquiry has already been answered.");
  }
  await audit(`recruiting.inquiry_${decision}`, { userId: user.id, ...meta, detail: { inquiryId } }, db);
  await notify(
    hit.coach_id,
    decision === "accepted"
      ? { category: "recruitment", title: "Inquiry accepted", message: `${user.displayName} accepted your inquiry. You can message each other now.`, link: `/recruiting?tab=messages&thread=${inquiryId}` }
      : { category: "recruitment", title: "Inquiry declined", message: `${user.displayName} declined your inquiry.` },
    db,
  );
  const [row] = await db<InquiryRow[]>`${SELECT_INQUIRY(db, user.id)} WHERE i.id = ${inquiryId}`;
  return toInquiry(row as InquiryRow);
}

// ---------- conversations ----------

interface ThreadInquiry {
  coach_id: string;
  athlete_id: string;
  status: string;
}

async function loadParticipantInquiry(db: Db, user: PublicUser, inquiryId: string): Promise<ThreadInquiry> {
  if (!isUuid(inquiryId)) throw notFound();
  // Someone who is not in the conversation gets the same answer as for one that does not exist.
  const [r] = await db<ThreadInquiry[]>`
    SELECT coach_id, athlete_id, status FROM recruitment_inquiries
    WHERE id = ${inquiryId} AND (coach_id = ${user.id} OR athlete_id = ${user.id})`;
  if (!r) throw notFound();
  return r;
}

export async function listMessages(user: PublicUser, inquiryId: string, dbArg?: Db): Promise<{ items: MessageView[] }> {
  const db = dbArg ?? (await getDb());
  const inq = await loadParticipantInquiry(db, user, inquiryId);
  const rows = await db<{ id: string; sender_id: string; body: string; created_at: Date }[]>`
    SELECT id, sender_id, body, created_at FROM coach_messages WHERE inquiry_id = ${inquiryId} ORDER BY created_at, id`;
  // Opening the conversation marks the other person's messages as read.
  await db`UPDATE coach_messages SET read_at = ${new Date()} WHERE inquiry_id = ${inquiryId} AND sender_id <> ${user.id} AND read_at IS NULL`;
  return {
    items: rows.map((m) => ({
      id: m.id,
      inquiryId,
      from: m.sender_id === inq.coach_id ? "recruiter" : "athlete",
      body: m.body,
      createdAt: m.created_at.toISOString(),
    })),
  };
}

export async function sendMessage(user: PublicUser, inquiryId: string, rawBody: string, dbArg?: Db): Promise<MessageView> {
  const db = dbArg ?? (await getDb());
  const inq = await loadParticipantInquiry(db, user, inquiryId);
  const body = rawBody.trim();
  if (!body) throw new RecruitingError(400, "validation", "A message cannot be empty.");
  if (body.length > MESSAGE_MAX) throw new RecruitingError(400, "validation", `Messages are limited to ${MESSAGE_MAX} characters.`);
  // Controlled messaging: nothing in either direction until the athlete has accepted.
  if (inq.status !== "accepted" && inq.status !== "replied")
    throw new RecruitingError(409, "not_accepted", "Messaging unlocks only after the athlete accepts the inquiry.");

  const id = randomUUID();
  const now = new Date();
  await db.begin(async (tx) => {
    await tx`
      INSERT INTO coach_messages (id, coach_id, athlete_id, sender_id, body, created_at, inquiry_id)
      VALUES (${id}, ${inq.coach_id}, ${inq.athlete_id}, ${user.id}, ${body}, ${now}, ${inquiryId})`;
    await tx`UPDATE recruitment_inquiries SET updated_at = ${now} WHERE id = ${inquiryId}`;
  });
  const other = user.id === inq.coach_id ? inq.athlete_id : inq.coach_id;
  await notify(other, { category: "recruitment", title: "New message", message: `${user.displayName}: ${body.length > 80 ? `${body.slice(0, 80)}…` : body}`, link: `/recruiting?tab=${user.id === inq.coach_id ? "inbox" : "messages"}&thread=${inquiryId}` }, db);
  return { id, inquiryId, from: user.id === inq.coach_id ? "recruiter" : "athlete", body, createdAt: now.toISOString() };
}
