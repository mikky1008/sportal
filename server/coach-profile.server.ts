// The coach's profile (stored in the database, not the browser) and the verification review.
//
// SERVER ONLY. Works on migration 5 in db.server.ts (extra coach_profiles columns, coach_verifications).
//
// How verification works:
//  1. The coach fills in the Verification Information on their profile (official email, credential
//     type, credential reference) and presses "Request verification". That copies those details into
//     a coach_verifications row with status 'pending'. Editing the profile never verifies anyone.
//  2. A reviewer (an account holding the `coaches:review` permission, today only `admin`) lists the
//     pending requests and approves or rejects each one. A rejection needs a written reason.
//  3. Approving grants the `verified_coach` role, which carries `sessions:verify`: the same permission
//     the connections API already reads as "verified coach". Rejecting (or revoking later) removes it.
//  4. A rejected coach can fix their details and request again. A verified coach cannot re-request.
//  - Nobody reviews their own request. Every decision is written to the audit log.
//  - The reviewer's request list shows credential details and the coach's email; nobody else sees them.

import { randomUUID } from "node:crypto";
import { getDb, type Db } from "./db.server.ts";
import { audit, type PublicUser, type RequestMeta } from "./auth.server.ts";
import { notify } from "./notifications.server.ts";
import { COACH_ROLE, ConnectionError, isVerifiedCoach, PAGE_DEFAULT, PAGE_MAX } from "./connections.server.ts";
import {
  COACH_PROFILE_KEYS, EMPTY_COACH, validateCoach, type CoachProfile,
} from "../src/lib/coachProfileRules.ts";

export const REVIEW_PERMISSION = "coaches:review";
export const VERIFIED_COACH_ROLE = "verified_coach";
export const NOTE_MAX = 500;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function requireCoach(actor: Pick<PublicUser, "roles">): void {
  if (!actor.roles.includes(COACH_ROLE))
    throw new ConnectionError(403, "role_not_allowed", "Only coach accounts have a coach profile.");
}

function requireReviewer(actor: Pick<PublicUser, "permissions">): void {
  if (!actor.permissions.includes(REVIEW_PERMISSION))
    throw new ConnectionError(403, "not_a_reviewer", "You don't have permission to review coaches.");
}

// ---------- verification state ----------

export type VerificationLabel = "Pending" | "Verified" | "Rejected";

export interface VerificationState {
  status: VerificationLabel;
  /** a request is waiting for a reviewer */
  requested: boolean;
  /** the coach may send (or re-send) a request right now */
  canRequest: boolean;
  submittedAt: string | null;
  reviewedAt: string | null;
  /** the reviewer's reason; only ever set after a decision */
  note: string;
}

interface VerificationRow {
  status: "pending" | "verified" | "rejected";
  submitted_at: Date;
  reviewed_at: Date | null;
  review_note: string;
}

export async function getVerificationState(db: Db, coachId: string): Promise<VerificationState> {
  const [row] = await db<VerificationRow[]>`
    SELECT status, submitted_at, reviewed_at, review_note FROM coach_verifications WHERE coach_id = ${coachId}`;
  // The permission is the truth: it also covers coaches an administrator verified by hand.
  const verified = await isVerifiedCoach(db, coachId);
  const status: VerificationLabel = verified ? "Verified" : row?.status === "rejected" ? "Rejected" : "Pending";
  const requested = !verified && row?.status === "pending";
  return {
    status,
    requested,
    canRequest: !verified && !requested,
    submittedAt: row ? row.submitted_at.toISOString() : null,
    reviewedAt: row?.reviewed_at ? row.reviewed_at.toISOString() : null,
    note: row && row.status !== "pending" ? row.review_note : "",
  };
}

// ---------- the profile ----------

interface ProfileRow {
  first_name: string | null;
  last_name: string | null;
  email: string;
  organization: string | null;
  coaching_position: string | null;
  sport_specialization: string | null;
  organization_type: string | null;
  organization_location: string | null;
  program_name: string | null;
  competition_level: string | null;
  years_experience: string | null;
  background: string | null;
  certifications: string | null;
  official_email: string | null;
  credential_type: string | null;
  credential_reference: string | null;
}

async function loadProfile(db: Db, coachId: string): Promise<CoachProfile> {
  const [r] = await db<ProfileRow[]>`
    SELECT up.first_name, up.last_name, u.email,
           cp.organization, cp.coaching_position, cp.sport_specialization, cp.organization_type, cp.organization_location,
           cp.program_name, cp.competition_level, cp.years_experience, cp.background, cp.certifications,
           cp.official_email, cp.credential_type, cp.credential_reference
    FROM users u
    LEFT JOIN user_profiles up ON up.user_id = u.id
    LEFT JOIN coach_profiles cp ON cp.user_id = u.id
    WHERE u.id = ${coachId}`;
  if (!r) throw new ConnectionError(404, "profile_not_found", "Profile not found.");
  return {
    firstName: r.first_name?.trim() ?? "",
    lastName: r.last_name?.trim() ?? "",
    email: r.email,
    organizationName: r.organization ?? "",
    organizationType: r.organization_type ?? "",
    organizationLocation: r.organization_location ?? "",
    positionTitle: r.coaching_position ?? "",
    programName: r.program_name ?? "",
    primarySport: r.sport_specialization ?? "",
    competitionLevel: r.competition_level ?? "",
    yearsExperience: r.years_experience ?? "",
    background: r.background ?? "",
    certifications: r.certifications ?? "",
    officialEmail: r.official_email ?? "",
    credentialType: r.credential_type ?? "",
    credentialReference: r.credential_reference ?? "",
  };
}

export async function getCoachProfile(actor: PublicUser, dbArg?: Db): Promise<{ profile: CoachProfile; verification: VerificationState }> {
  requireCoach(actor);
  const db = dbArg ?? (await getDb());
  const [profile, verification] = await Promise.all([loadProfile(db, actor.id), getVerificationState(db, actor.id)]);
  return { profile, verification };
}

function fail(fieldErrors: Record<string, string>, message = "Please fix the highlighted fields."): ConnectionError {
  return new ConnectionError(400, "validation", message, { fieldErrors });
}

/** Reads the body as a CoachProfile: every known field must be a string, unknown fields are ignored. */
function readBody(raw: unknown, accountEmail: string): CoachProfile {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw fail({}, "Send the profile as an object.");
  const r = raw as Record<string, unknown>;
  const out: CoachProfile = { ...EMPTY_COACH };
  const bad: Record<string, string> = {};
  for (const k of COACH_PROFILE_KEYS) {
    const v = r[k];
    if (v === undefined) continue;
    if (typeof v !== "string") bad[k] = "Must be text.";
    else out[k] = v.trim();
  }
  if (Object.keys(bad).length > 0) throw fail(bad);
  // The sign-in email belongs to the account, not to the profile form: it is never changed here.
  out.email = accountEmail;
  return out;
}

/** Replaces the coach's profile. Partial profiles are fine; anything filled in must be valid. */
export async function saveCoachProfile(
  actor: PublicUser,
  raw: unknown,
  meta: Partial<RequestMeta> = {},
  dbArg?: Db,
): Promise<{ profile: CoachProfile; verification: VerificationState }> {
  requireCoach(actor);
  const p = readBody(raw, actor.email);
  const errors = validateCoach(p);
  if (Object.keys(errors).length > 0) throw fail(errors as Record<string, string>);
  const db = dbArg ?? (await getDb());
  const ts = new Date();

  await db.begin(async (tx) => {
    await tx`
      UPDATE user_profiles SET first_name = ${p.firstName || null}, last_name = ${p.lastName || null}, updated_at = ${ts}
      WHERE user_id = ${actor.id}`;
    const display = `${p.firstName} ${p.lastName}`.trim();
    if (display) await tx`UPDATE users SET display_name = ${display.slice(0, 80)}, updated_at = ${ts} WHERE id = ${actor.id}`;
    await tx`
      INSERT INTO coach_profiles
        (user_id, organization, coaching_position, sport_specialization, organization_type, organization_location,
         program_name, competition_level, years_experience, background, certifications,
         official_email, credential_type, credential_reference, created_at, updated_at)
      VALUES
        (${actor.id}, ${p.organizationName}, ${p.positionTitle}, ${p.primarySport}, ${p.organizationType}, ${p.organizationLocation},
         ${p.programName}, ${p.competitionLevel}, ${p.yearsExperience}, ${p.background}, ${p.certifications},
         ${p.officialEmail}, ${p.credentialType}, ${p.credentialReference}, ${ts}, ${ts})
      ON CONFLICT (user_id) DO UPDATE SET
        organization = EXCLUDED.organization, coaching_position = EXCLUDED.coaching_position,
        sport_specialization = EXCLUDED.sport_specialization, organization_type = EXCLUDED.organization_type,
        organization_location = EXCLUDED.organization_location, program_name = EXCLUDED.program_name,
        competition_level = EXCLUDED.competition_level, years_experience = EXCLUDED.years_experience,
        background = EXCLUDED.background, certifications = EXCLUDED.certifications,
        official_email = EXCLUDED.official_email, credential_type = EXCLUDED.credential_type,
        credential_reference = EXCLUDED.credential_reference, updated_at = EXCLUDED.updated_at`;
  });
  await audit("coach_profile.updated", { userId: actor.id, ...meta }, db);
  return getCoachProfile(actor, db);
}

// ---------- the coach asks to be verified ----------

/** Sends the coach's current verification details to the reviewers. */
export async function requestVerification(actor: PublicUser, meta: Partial<RequestMeta> = {}, dbArg?: Db): Promise<VerificationState> {
  requireCoach(actor);
  const db = dbArg ?? (await getDb());
  const profile = await loadProfile(db, actor.id);

  const errors = validateCoach(profile);
  const missing: Record<string, string> = {};
  if (!profile.organizationName) missing["organizationName"] = "Enter your organization name.";
  if (!profile.officialEmail) missing["officialEmail"] = "Enter your official organization email.";
  if (!profile.credentialType) missing["credentialType"] = "Choose a credential type.";
  if (!profile.credentialReference) missing["credentialReference"] = "Enter your credential or ID reference.";
  const fieldErrors: Record<string, string> = { ...(errors as Record<string, string>), ...missing };
  if (Object.keys(missing).length > 0 || errors.officialEmail || errors.credentialReference || errors.credentialType)
    throw fail(fieldErrors, "Complete the Verification Information before requesting verification.");

  if (await isVerifiedCoach(db, actor.id))
    throw new ConnectionError(409, "already_verified", "Your account is already verified.");

  const ts = new Date();
  // One atomic statement: it inserts a first request, or re-opens a REJECTED one. A request that is
  // already pending (or approved) matches nothing, so two clicks can never create two requests.
  const [row] = await db<{ coach_id: string }[]>`
    INSERT INTO coach_verifications
      (coach_id, status, organization, official_email, credential_type, credential_reference, submitted_at, updated_at)
    VALUES (${actor.id}, 'pending', ${profile.organizationName}, ${profile.officialEmail}, ${profile.credentialType},
            ${profile.credentialReference}, ${ts}, ${ts})
    ON CONFLICT (coach_id) DO UPDATE SET
      status = 'pending', organization = EXCLUDED.organization, official_email = EXCLUDED.official_email,
      credential_type = EXCLUDED.credential_type, credential_reference = EXCLUDED.credential_reference,
      submitted_at = EXCLUDED.submitted_at, reviewed_at = NULL, reviewed_by = NULL, review_note = '', updated_at = EXCLUDED.updated_at
    WHERE coach_verifications.status = 'rejected'
    RETURNING coach_id`;
  if (!row) throw new ConnectionError(409, "already_requested", "Your verification request is already waiting for review.");
  await audit("coach_verification.requested", { userId: actor.id, ...meta }, db);
  return getVerificationState(db, actor.id);
}

// ---------- the reviewer's side ----------

export interface VerificationRequestView {
  coachId: string;
  displayName: string;
  email: string;
  status: "pending" | "verified" | "rejected";
  organization: string;
  organizationType: string;
  position: string;
  sport: string;
  officialEmail: string;
  credentialType: string;
  credentialReference: string;
  submittedAt: string;
  reviewedAt: string | null;
  note: string;
}

export async function listVerificationRequests(
  actor: PublicUser,
  opts: { status?: "pending" | "verified" | "rejected"; limit?: number; offset?: number } = {},
  dbArg?: Db,
): Promise<{ items: VerificationRequestView[]; total: number; limit: number; offset: number }> {
  requireReviewer(actor);
  const db = dbArg ?? (await getDb());
  const limit = Math.min(Math.max(Math.trunc(opts.limit ?? PAGE_DEFAULT), 1), PAGE_MAX);
  const offset = Math.max(Math.trunc(opts.offset ?? 0), 0);
  const filter = opts.status ? db`AND v.status = ${opts.status}` : db``;
  const rows = await db<{
    coach_id: string; display_name: string; email: string; status: "pending" | "verified" | "rejected";
    organization: string; organization_type: string | null; coaching_position: string | null; sport_specialization: string | null;
    official_email: string; credential_type: string; credential_reference: string;
    submitted_at: Date; reviewed_at: Date | null; review_note: string;
  }[]>`
    SELECT v.coach_id, u.display_name, u.email, v.status, v.organization, cp.organization_type, cp.coaching_position,
           cp.sport_specialization, v.official_email, v.credential_type, v.credential_reference,
           v.submitted_at, v.reviewed_at, v.review_note
    FROM coach_verifications v
    JOIN users u ON u.id = v.coach_id
    LEFT JOIN coach_profiles cp ON cp.user_id = v.coach_id
    WHERE u.deleted_at IS NULL ${filter}
    ORDER BY (v.status = 'pending') DESC, v.submitted_at, v.coach_id
    LIMIT ${limit} OFFSET ${offset}`;
  const [count] = await db<{ n: number }[]>`
    SELECT COUNT(*)::int AS n FROM coach_verifications v JOIN users u ON u.id = v.coach_id WHERE u.deleted_at IS NULL ${filter}`;
  return {
    items: rows.map((r) => ({
      coachId: r.coach_id, displayName: r.display_name, email: r.email, status: r.status,
      organization: r.organization, organizationType: r.organization_type ?? "", position: r.coaching_position ?? "",
      sport: r.sport_specialization ?? "", officialEmail: r.official_email, credentialType: r.credential_type,
      credentialReference: r.credential_reference, submittedAt: r.submitted_at.toISOString(),
      reviewedAt: r.reviewed_at ? r.reviewed_at.toISOString() : null, note: r.review_note,
    })),
    total: count?.n ?? 0, limit, offset,
  };
}

export type ReviewDecision = "approve" | "reject";

/**
 * Records a decision. `reviewerId` is null when it comes from the command-line tool. Approve only
 * works on a pending request; reject works on a pending request or on an approved one (revoking it).
 */
export async function applyReview(
  db: Db,
  input: { coachId: string; decision: ReviewDecision; note: string; reviewerId: string | null; meta?: Partial<RequestMeta> },
): Promise<void> {
  const note = input.note.trim();
  if (input.decision === "reject" && (note.length < 1 || note.length > NOTE_MAX))
    throw fail({ note: `Give a reason, up to ${NOTE_MAX} characters.` }, "Rejecting a request needs a reason the coach can read.");
  if (note.length > NOTE_MAX) throw fail({ note: `Notes can be up to ${NOTE_MAX} characters.` });
  const ts = new Date();

  await db.begin(async (tx) => {
    const [row] = await tx<{ status: "pending" | "verified" | "rejected" }[]>`
      SELECT status FROM coach_verifications WHERE coach_id = ${input.coachId} FOR UPDATE`;
    if (!row) throw new ConnectionError(404, "request_not_found", "That coach hasn't requested verification.");
    if (input.decision === "approve" && row.status !== "pending")
      throw new ConnectionError(409, "not_pending", "Only a pending request can be approved.");
    if (input.decision === "reject" && row.status === "rejected")
      throw new ConnectionError(409, "not_pending", "This request was already rejected.");

    const status = input.decision === "approve" ? "verified" : "rejected";
    await tx`
      UPDATE coach_verifications
      SET status = ${status}, reviewed_at = ${ts}, reviewed_by = ${input.reviewerId}, review_note = ${note}, updated_at = ${ts}
      WHERE coach_id = ${input.coachId}`;
    if (input.decision === "approve") {
      await tx`
        INSERT INTO user_roles (user_id, role_id, granted_at)
        SELECT ${input.coachId}, id, ${ts} FROM roles WHERE name = ${VERIFIED_COACH_ROLE}
        ON CONFLICT DO NOTHING`;
      // Official affiliation: a coach at a university or college joins that university, using the
      // organization the reviewer saw in the request (not whatever the profile says later). The
      // university row is created the first time anyone from it is approved.
      await tx`
        INSERT INTO universities (id, name, name_key, location, created_at, updated_at)
        SELECT ${randomUUID()}, btrim(v.organization), lower(btrim(v.organization)), left(btrim(cp.organization_location), 200), ${ts}, ${ts}
        FROM coach_verifications v JOIN coach_profiles cp ON cp.user_id = v.coach_id
        WHERE v.coach_id = ${input.coachId} AND cp.organization_type IN ('University', 'College')
          AND length(btrim(v.organization)) BETWEEN 2 AND 120
        ON CONFLICT (name_key) DO NOTHING`;
      await tx`
        UPDATE coach_profiles cp SET university_id = u.id
        FROM coach_verifications v JOIN universities u ON u.name_key = lower(btrim(v.organization))
        WHERE cp.user_id = v.coach_id AND v.coach_id = ${input.coachId} AND cp.organization_type IN ('University', 'College')`;
    } else {
      await tx`
        DELETE FROM user_roles
        WHERE user_id = ${input.coachId} AND role_id IN (SELECT id FROM roles WHERE name = ${VERIFIED_COACH_ROLE})`;
      // Withdrawing (or refusing) the approval also withdraws the affiliation.
      await tx`UPDATE coach_profiles SET university_id = NULL WHERE user_id = ${input.coachId}`;
    }
  });
  await audit(
    input.decision === "approve" ? "coach_verification.approved" : "coach_verification.rejected",
    { userId: input.reviewerId, ...input.meta, detail: { coachId: input.coachId, via: input.reviewerId ? "api" : "cli" } },
    db,
  );
  await notify(
    input.coachId,
    input.decision === "approve"
      ? { category: "verification", title: "You're verified", message: "Your coach account has been verified. You can now connect with athletes." }
      : { category: "verification", title: "Verification not approved", message: `Reason: ${note}` },
    db,
  );
}

export async function reviewVerification(
  actor: PublicUser,
  coachId: string,
  decision: ReviewDecision,
  rawNote: unknown,
  meta: Partial<RequestMeta> = {},
  dbArg?: Db,
): Promise<{ coachId: string; status: VerificationLabel }> {
  requireReviewer(actor);
  if (!UUID_RE.test(coachId)) throw new ConnectionError(404, "request_not_found", "That coach hasn't requested verification.");
  if (coachId === actor.id) throw new ConnectionError(403, "cannot_review_self", "You can't review your own verification.");
  if (rawNote !== undefined && typeof rawNote !== "string") throw fail({ note: "Must be text." });
  const db = dbArg ?? (await getDb());
  await applyReview(db, { coachId, decision, note: typeof rawNote === "string" ? rawNote : "", reviewerId: actor.id, meta });
  return { coachId, status: decision === "approve" ? "Verified" : "Rejected" };
}
