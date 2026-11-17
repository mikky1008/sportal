// School Representative "Coach Requests": review and decide the coach affiliation requests sent to
// the representative's own school.
//
// SERVER ONLY. Uses tables that already exist (coach_verifications, coach_profiles, users,
// user_profiles); no migration. The school is ALWAYS the signed-in representative's own approved
// school (resolveSchool), never taken from the request, and every query filters on it.
//
// A "coach request" is a coach_verifications row whose organization is this school (matched without
// case or edge spaces) and whose organization type is University or College. Status shown:
//   pending / approved (verified) / rejected.   Pending requests from suspended accounts are left out.
//
// Deciding:
//  - Only a PENDING request of this school can be decided here (revoking an approval stays with the
//    administrator; a representative removes an affiliation from My Coaches instead).
//  - It runs the SAME decision the administrator's review runs (applyReview in coach-profile.server.ts):
//    approving grants the verified_coach role and joins the coach to this university; rejecting needs
//    a reason (1 to 500 characters) that the coach is shown in a notification. Because it is the same
//    step, an approval here makes the coach a verified Sportal coach, exactly as an administrator's would.
//    The administrator can still review or revoke afterwards. The whole decision is one transaction with a
//    row lock, so it can never collide with an administrator deciding the same request at the same moment.
//  - Every decision is audited (coach_verification.* by applyReview, plus rep.coach_request_* naming the school).
//
// "Supporting documents": coaches do not upload files. What a coach submits as proof is text: credential
// type, credential reference (ID / license number), official school email and certifications. Those
// are what is shown. Nothing is returned for anyone who is not a request of this school.

import { getDb, type Db } from "./db.server.ts";
import { audit, type PublicUser, type RequestMeta } from "./auth.server.ts";
import { ConnectionError } from "./connections.server.ts";
import { applyReview, NOTE_MAX } from "./coach-profile.server.ts";
import { RepDashboardError, resolveSchool, type School } from "./rep-dashboard.server.ts";

export const REQUESTS_PAGE_DEFAULT = 20;
export const REQUESTS_PAGE_MAX = 50;
const SEARCH_MAX = 80;

export type RequestStatus = "pending" | "approved" | "rejected";
export const REQUEST_STATUSES: readonly RequestStatus[] = ["pending", "approved", "rejected"];

export interface CoachRequest {
  /** the coach's user id (the request is one per coach) */
  id: string;
  name: string;
  photo: string | null;
  /** the coach's account email */
  email: string;
  sport: string;
  position: string;
  credentialType: string;
  status: RequestStatus;
  /** when the coach sent the request */
  appliedAt: string;
  decidedAt: string | null;
  /** the reason given when it was rejected (empty otherwise) */
  reason: string;
}

export interface SupportingDocument { label: string; value: string }

export interface CoachRequestDetail extends CoachRequest {
  organization: string;
  programName: string;
  competitionLevel: string;
  yearsExperience: string;
  background: string;
  /** the proof the coach submitted, as labelled text (coaches do not upload files) */
  supportingDocuments: SupportingDocument[];
}

const likeLiteral = (t: string) => t.replace(/[\\%_]/g, (c) => `\\${c}`);
const safePhoto = (url: string | null): string | null => (url && /^https?:\/\//i.test(url) && url.length <= 500 ? url : null);
const notFound = () => new RepDashboardError(404, "request_not_found", "That request could not be found at your school.");
const LABEL: Record<string, RequestStatus> = { pending: "pending", verified: "approved", rejected: "rejected" };

const SCOPE = (db: Db, school: School) => db`
  FROM coach_verifications v
  JOIN users u ON u.id = v.coach_id AND u.deleted_at IS NULL
  JOIN coach_profiles cp ON cp.user_id = v.coach_id
  LEFT JOIN user_profiles up ON up.user_id = v.coach_id
  WHERE lower(btrim(v.organization)) = ${school.key} AND cp.organization_type IN ('University', 'College')
    AND (v.status <> 'pending' OR u.is_active = TRUE)`;

const NAME = (db: Db) => db`COALESCE(NULLIF(btrim(concat_ws(' ', up.first_name, up.last_name)), ''), u.display_name)`;

type Row = {
  id: string; name: string; email: string; avatar_url: string | null; sport: string; position: string; credential_type: string;
  status: string; submitted_at: Date; reviewed_at: Date | null; review_note: string;
};

const toRequest = (r: Row): CoachRequest => {
  const status = LABEL[r.status] ?? "pending";
  return {
    id: r.id, name: r.name, photo: safePhoto(r.avatar_url), email: r.email, sport: r.sport, position: r.position,
    credentialType: r.credential_type, status, appliedAt: r.submitted_at.toISOString(),
    decidedAt: r.reviewed_at ? r.reviewed_at.toISOString() : null, reason: status === "rejected" ? r.review_note : "",
  };
};

export async function listCoachRequests(
  user: PublicUser,
  opts: { q?: string | undefined; status?: RequestStatus | undefined; limit: number; offset: number },
  dbArg?: Db,
): Promise<{ school: { name: string }; items: CoachRequest[]; total: number; counts: Record<RequestStatus, number> }> {
  const db = dbArg ?? (await getDb());
  const school = await resolveSchool(db, user);
  const needle = opts.q?.trim().slice(0, SEARCH_MAX);
  const pattern = needle ? `%${likeLiteral(needle)}%` : null;
  const dbStatus = opts.status === "approved" ? "verified" : opts.status;

  const rows = await db<(Row & { total: number })[]>`
    SELECT u.id, ${NAME(db)} AS name, u.email, up.avatar_url, COALESCE(cp.sport_specialization, '') AS sport,
           COALESCE(cp.coaching_position, '') AS position, v.credential_type, v.status, v.submitted_at, v.reviewed_at,
           v.review_note, count(*) OVER ()::int AS total
    ${SCOPE(db, school)}
      ${dbStatus ? db`AND v.status = ${dbStatus}` : db``}
      ${pattern ? db`AND (${NAME(db)} ILIKE ${pattern} OR u.email ILIKE ${pattern})` : db``}
    ORDER BY (v.status = 'pending') DESC, CASE WHEN v.status = 'pending' THEN v.submitted_at END ASC,
             v.reviewed_at DESC NULLS LAST, u.id
    LIMIT ${opts.limit} OFFSET ${opts.offset}`;

  const tallies = await db<{ status: string; n: number }[]>`SELECT v.status, count(*)::int AS n ${SCOPE(db, school)} GROUP BY v.status`;
  const counts: Record<RequestStatus, number> = { pending: 0, approved: 0, rejected: 0 };
  for (const t of tallies) { const s = LABEL[t.status]; if (s) counts[s] += t.n; }

  return { school: { name: school.name }, items: rows.map(toRequest), total: rows[0]?.total ?? 0, counts };
}

async function loadDetail(db: Db, school: School, coachId: string): Promise<CoachRequestDetail> {
  const [r] = await db<(Row & {
    organization: string; program_name: string; competition_level: string; years_experience: string; background: string;
    certifications: string; credential_reference: string; official_email: string;
  })[]>`
    SELECT u.id, ${NAME(db)} AS name, u.email, up.avatar_url, COALESCE(cp.sport_specialization, '') AS sport,
           COALESCE(cp.coaching_position, '') AS position, v.credential_type, v.status, v.submitted_at, v.reviewed_at, v.review_note,
           v.organization, cp.program_name, cp.competition_level, cp.years_experience, cp.background, cp.certifications,
           v.credential_reference, v.official_email
    ${SCOPE(db, school)} AND u.id = ${coachId}`;
  if (!r) throw notFound();
  return {
    ...toRequest(r),
    organization: r.organization.trim(), programName: r.program_name, competitionLevel: r.competition_level,
    yearsExperience: r.years_experience, background: r.background,
    supportingDocuments: [
      { label: "Credential type", value: r.credential_type },
      { label: "Credential reference (ID / license no.)", value: r.credential_reference },
      { label: "Official school email", value: r.official_email },
      { label: "Certifications", value: r.certifications },
    ],
  };
}

export async function getCoachRequest(user: PublicUser, coachId: string, dbArg?: Db): Promise<CoachRequestDetail> {
  const db = dbArg ?? (await getDb());
  return loadDetail(db, await resolveSchool(db, user), coachId);
}

/** applyReview opens its own transaction; inside ours it simply continues in the one we already hold. */
const withBegin = (tx: Db): Db =>
  new Proxy(tx, { get: (t, p, r) => (p === "begin" ? (fn: (x: Db) => unknown) => fn(t) : Reflect.get(t, p, r)) });

/** Approve or reject a PENDING request sent to the representative's own school. */
export async function decideCoachRequest(
  user: PublicUser,
  coachId: string,
  decision: "approve" | "reject",
  rawReason: unknown,
  meta: Partial<RequestMeta> = {},
  dbArg?: Db,
): Promise<CoachRequestDetail> {
  const db = dbArg ?? (await getDb());
  const school = await resolveSchool(db, user);
  if (rawReason !== undefined && rawReason !== null && typeof rawReason !== "string")
    throw new ConnectionError(400, "validation", "The reason must be text.", { fieldErrors: { note: "Must be text." } });
  const reason = typeof rawReason === "string" ? rawReason.trim() : "";
  if (decision === "reject" && (reason.length < 1 || reason.length > NOTE_MAX))
    throw new ConnectionError(400, "validation", "Rejecting a request needs a reason the coach can read.", {
      fieldErrors: { note: `Give a reason, up to ${NOTE_MAX} characters.` },
    });

  // Scope check first: a request that is not this school's looks the same as one that doesn't exist.
  const current = await loadDetail(db, school, coachId);
  if (current.status !== "pending")
    throw new RepDashboardError(409, "not_pending", current.status === "approved" ? "This request was already approved." : "This request was already rejected.");

  // One transaction: lock the request, make sure it is STILL pending, then run the shared review step
  // inside it. If an administrator decides at the same moment, whoever locks first wins and the other
  // is refused (409), so a representative's rejection can never undo an approval made a moment earlier.
  await db.begin(async (tx) => {
    const [row] = await tx<{ status: string }[]>`SELECT status FROM coach_verifications WHERE coach_id = ${coachId} FOR UPDATE`;
    if (!row || row.status !== "pending")
      throw new RepDashboardError(409, "not_pending", row?.status === "verified" ? "This request was already approved." : "This request was already decided.");
    const inTx = withBegin(tx as unknown as Db);
    await applyReview(inTx, { coachId, decision, note: decision === "reject" ? reason : "", reviewerId: user.id, meta });
    await audit(
      decision === "approve" ? "rep.coach_request_approved" : "rep.coach_request_rejected",
      { userId: user.id, ...meta, detail: { coachId, school: school.name } },
      inTx,
    );
  });
  return loadDetail(db, school, coachId);
}
