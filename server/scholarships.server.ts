// Scholarships and scholarship applications.
//
// SERVER ONLY. Works on `scholarships` and `scholarship_applications` (migration 6 in db.server.ts).
//
// Who may do what:
//  - Anyone signed in can browse open scholarships.
//  - Only a university representative (or an admin) can post one, and can only change their own.
//  - Only a student-athlete can apply, once per scholarship, and only while it is open and before
//    its deadline. Withdrawing keeps the row. Applying and withdrawing notify the poster.

import { randomUUID } from "node:crypto";
import { getDb, type Db } from "./db.server.ts";
import { audit, type PublicUser, type RequestMeta } from "./auth.server.ts";
import { notify } from "./notifications.server.ts";

export const ATHLETE_ROLE = "student_athlete";
export const UNIVERSITY_ROLE = "university_representative";
export const ADMIN_ROLE = "admin";

export const SCHOLARSHIP_PAGE_DEFAULT = 30;
export const SCHOLARSHIP_PAGE_MAX = 100;

export class ScholarshipError extends Error {
  readonly httpStatus: number;
  readonly code: string;
  constructor(httpStatus: number, code: string, message: string) {
    super(message);
    this.httpStatus = httpStatus;
    this.code = code;
  }
}

export interface ScholarshipInput {
  name: string;
  university?: string | undefined;
  sport: string;
  coverage: string;
  details: string;
  eligibility: string[];
  /** YYYY-MM-DD */
  deadline: string;
}

export type ApplicationStatus = "submitted" | "under_review" | "accepted" | "rejected" | "withdrawn";

export interface ScholarshipView {
  id: string;
  name: string;
  university: string;
  sport: string;
  coverage: string;
  details: string;
  eligibility: string[];
  deadline: string;
  isOpen: boolean;
  /** true when the signed-in user posted it, so the app can offer Close / Reopen */
  postedByMe: boolean;
  /** Only filled for the signed-in athlete's own application, otherwise null. */
  myApplication: { id: string; status: ApplicationStatus } | null;
}

interface Row {
  id: string;
  university: string;
  name: string;
  sport: string;
  coverage: string;
  details: string;
  eligibility: string[];
  deadline: string;
  is_open: boolean;
  posted_by_me: boolean;
  app_id: string | null;
  app_status: ApplicationStatus | null;
}

const toView = (r: Row): ScholarshipView => ({
  id: r.id,
  name: r.name,
  university: r.university,
  sport: r.sport,
  coverage: r.coverage,
  details: r.details,
  eligibility: Array.isArray(r.eligibility) ? r.eligibility : [],
  deadline: r.deadline,
  isOpen: r.is_open,
  postedByMe: r.posted_by_me,
  myApplication: r.app_id && r.app_status ? { id: r.app_id, status: r.app_status } : null,
});

const hasRole = (u: Pick<PublicUser, "roles">, role: string) => u.roles.includes(role);
const likeLiteral = (t: string) => t.replace(/[\\%_]/g, (c) => `\\${c}`);
const todayIso = () => new Date().toISOString().slice(0, 10);

function clean(input: ScholarshipInput): ScholarshipInput {
  const name = input.name.trim();
  if (name.length < 3 || name.length > 120) throw new ScholarshipError(400, "validation", "Name must be 3-120 characters.");
  if (!input.sport.trim()) throw new ScholarshipError(400, "validation", "Choose a sport.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.deadline) || Number.isNaN(Date.parse(input.deadline)))
    throw new ScholarshipError(400, "validation", "Deadline must be a date (YYYY-MM-DD).");
  if (input.deadline < todayIso()) throw new ScholarshipError(400, "validation", "Deadline cannot be in the past.");
  if (input.details.length > 2000) throw new ScholarshipError(400, "validation", "Details are too long.");
  const eligibility = input.eligibility.map((e) => e.trim()).filter(Boolean).slice(0, 10).map((e) => e.slice(0, 120));
  return { ...input, name, sport: input.sport.trim(), coverage: input.coverage.trim().slice(0, 120), eligibility };
}

const SELECT = (db: Db, viewerId: string) => db`
  SELECT s.id, s.university, s.name, s.sport, s.coverage, s.details, s.eligibility,
         to_char(s.deadline, 'YYYY-MM-DD') AS deadline, s.is_open,
         (s.posted_by IS NOT NULL AND s.posted_by = ${viewerId}) AS posted_by_me,
         a.id AS app_id, a.status AS app_status
  FROM scholarships s
  LEFT JOIN scholarship_applications a ON a.scholarship_id = s.id AND a.athlete_id = ${viewerId}`;

export async function listScholarships(
  user: PublicUser,
  opts: { sport?: string | undefined; q?: string | undefined; includeClosed?: boolean; limit: number; offset: number },
  dbArg?: Db,
): Promise<{ items: ScholarshipView[]; total: number }> {
  const db = dbArg ?? (await getDb());
  const sport = opts.sport?.trim();
  const q = opts.q?.trim().slice(0, 80);
  const where = db`
    WHERE TRUE
    ${
      opts.includeClosed
        ? hasRole(user, ADMIN_ROLE)
          ? db``
          : db`AND ((s.is_open = TRUE AND s.deadline >= CURRENT_DATE) OR s.posted_by = ${user.id})` // your own closed ones too
        : db`AND s.is_open = TRUE AND s.deadline >= CURRENT_DATE`
    }
    ${sport ? db`AND lower(s.sport) = lower(${sport})` : db``}
    ${q ? db`AND (s.name ILIKE ${`%${likeLiteral(q)}%`} OR s.university ILIKE ${`%${likeLiteral(q)}%`})` : db``}`;
  const rows = await db<Row[]>`${SELECT(db, user.id)} ${where} ORDER BY s.deadline, s.id LIMIT ${opts.limit} OFFSET ${opts.offset}`;
  const [c] = await db<{ n: string }[]>`SELECT count(*) AS n FROM scholarships s ${where}`;
  return { items: rows.map(toView), total: Number(c?.n ?? 0) };
}

export async function createScholarship(user: PublicUser, input: ScholarshipInput, meta: Partial<RequestMeta> = {}, dbArg?: Db): Promise<ScholarshipView> {
  if (!hasRole(user, UNIVERSITY_ROLE) && !hasRole(user, ADMIN_ROLE))
    throw new ScholarshipError(403, "role_not_allowed", "Only university representatives can post scholarships.");
  const db = dbArg ?? (await getDb());
  const c = clean(input);

  let university = c.university?.trim();
  if (hasRole(user, UNIVERSITY_ROLE)) {
    // A representative always posts under their own university; the request cannot override it.
    const [p] = await db<{ university_name: string }[]>`SELECT university_name FROM university_representative_profiles WHERE user_id = ${user.id}`;
    if (p) university = p.university_name;
  }
  if (!university || university.length < 2) throw new ScholarshipError(400, "validation", "University is required.");

  const id = randomUUID();
  const now = new Date();
  await db`
    INSERT INTO scholarships (id, posted_by, university, name, sport, coverage, details, eligibility, deadline, created_at, updated_at)
    VALUES (${id}, ${user.id}, ${university.slice(0, 120)}, ${c.name}, ${c.sport}, ${c.coverage}, ${c.details},
            ${db.json(c.eligibility)}, ${c.deadline}::date, ${now}, ${now})`;
  await audit("scholarship.created", { userId: user.id, ...meta, detail: { scholarshipId: id } }, db);
  const [row] = await db<Row[]>`${SELECT(db, user.id)} WHERE s.id = ${id}`;
  return toView(row as Row);
}

/** Opens or closes a scholarship. Only the poster (or an admin) can. */
export async function setScholarshipOpen(user: PublicUser, id: string, open: boolean, meta: Partial<RequestMeta> = {}, dbArg?: Db): Promise<ScholarshipView> {
  const db = dbArg ?? (await getDb());
  const admin = hasRole(user, ADMIN_ROLE);
  const updated = await db`
    UPDATE scholarships SET is_open = ${open}, updated_at = ${new Date()}
    WHERE id = ${id} AND (${admin} OR posted_by = ${user.id}) RETURNING id`;
  if (!updated.length) throw new ScholarshipError(404, "not_found", "Scholarship not found.");
  await audit(open ? "scholarship.opened" : "scholarship.closed", { userId: user.id, ...meta, detail: { scholarshipId: id } }, db);
  const [row] = await db<Row[]>`${SELECT(db, user.id)} WHERE s.id = ${id}`;
  return toView(row as Row);
}

export async function applyToScholarship(user: PublicUser, scholarshipId: string, meta: Partial<RequestMeta> = {}, dbArg?: Db): Promise<{ id: string; status: ApplicationStatus }> {
  if (!hasRole(user, ATHLETE_ROLE)) throw new ScholarshipError(403, "role_not_allowed", "Only student-athletes can apply.");
  const db = dbArg ?? (await getDb());

  const [s] = await db<{ id: string; name: string; posted_by: string | null; open: boolean }[]>`
    SELECT id, name, posted_by, (is_open AND deadline >= CURRENT_DATE) AS open FROM scholarships WHERE id = ${scholarshipId}`;
  if (!s) throw new ScholarshipError(404, "not_found", "Scholarship not found.");
  if (!s.open) throw new ScholarshipError(409, "closed", "This scholarship is no longer accepting applications.");

  const id = randomUUID();
  const now = new Date();
  // One conditional statement, so two taps cannot create two applications. A withdrawn one can be re-opened.
  const rows = await db<{ id: string; status: ApplicationStatus }[]>`
    INSERT INTO scholarship_applications (id, scholarship_id, athlete_id, status, created_at, updated_at)
    VALUES (${id}, ${scholarshipId}, ${user.id}, 'submitted', ${now}, ${now})
    ON CONFLICT (scholarship_id, athlete_id) DO UPDATE SET status = 'submitted', updated_at = ${now}
      WHERE scholarship_applications.status = 'withdrawn'
    RETURNING id, status`;
  const app = rows[0];
  if (!app) throw new ScholarshipError(409, "already_applied", "You have already applied to this scholarship.");

  await audit("scholarship.applied", { userId: user.id, ...meta, detail: { scholarshipId } }, db);
  await notify(user.id, { category: "application", title: "Application received", message: `Your application to ${s.name} was submitted.`, link: "/scholarships" }, db);
  if (s.posted_by)
    await notify(s.posted_by, { category: "application", title: "New applicant", message: `${user.displayName} applied to ${s.name}.` }, db);
  return app;
}

export async function withdrawApplication(user: PublicUser, scholarshipId: string, meta: Partial<RequestMeta> = {}, dbArg?: Db): Promise<{ id: string; status: ApplicationStatus }> {
  const db = dbArg ?? (await getDb());
  const rows = await db<{ id: string; status: ApplicationStatus }[]>`
    UPDATE scholarship_applications SET status = 'withdrawn', updated_at = ${new Date()}
    WHERE scholarship_id = ${scholarshipId} AND athlete_id = ${user.id} AND status IN ('submitted', 'under_review')
    RETURNING id, status`;
  const app = rows[0];
  if (!app) throw new ScholarshipError(404, "not_found", "No active application to withdraw.");
  await audit("scholarship.withdrawn", { userId: user.id, ...meta, detail: { scholarshipId } }, db);
  return app;
}

/** The signed-in athlete's applications, newest first. */
export async function listMyApplications(user: PublicUser, limit: number, offset: number, dbArg?: Db) {
  const db = dbArg ?? (await getDb());
  const rows = await db<{ id: string; status: ApplicationStatus; created_at: Date; scholarship_id: string; name: string; university: string }[]>`
    SELECT a.id, a.status, a.created_at, s.id AS scholarship_id, s.name, s.university
    FROM scholarship_applications a JOIN scholarships s ON s.id = a.scholarship_id
    WHERE a.athlete_id = ${user.id} ORDER BY a.created_at DESC LIMIT ${limit} OFFSET ${offset}`;
  const [c] = await db<{ n: string }[]>`SELECT count(*) AS n FROM scholarship_applications WHERE athlete_id = ${user.id}`;
  return {
    items: rows.map((r) => ({ id: r.id, status: r.status, appliedAt: r.created_at.toISOString(), scholarship: { id: r.scholarship_id, name: r.name, university: r.university } })),
    total: Number(c?.n ?? 0),
  };
}

/** Universities with at least one open scholarship, for the athlete's "interested in" picker. */
export async function listUniversities(dbArg?: Db): Promise<string[]> {
  const db = dbArg ?? (await getDb());
  const rows = await db<{ university: string }[]>`
    SELECT DISTINCT university FROM scholarships WHERE is_open = TRUE AND deadline >= CURRENT_DATE ORDER BY university`;
  return rows.map((r) => r.university);
}
