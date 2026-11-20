// The School Representative's own Settings (profile, photo, password) and the small summary their top
// bar uses (name, photo, how many coach requests are waiting).
//
// SERVER ONLY. Every function acts on the signed-in representative's OWN account only; there is no user
// id to pass, so none can be pointed at anyone else, and each re-checks the caller holds the
// university_representative role. Modelled on the administrator's Settings and using the same shared
// pieces (password hashing and strength rules, login rate limiting, photo checks).
//
// NOT editable here, on purpose:
//   - the school: an administrator approved that institution, so changing it would skip the approval;
//   - the email and username: they are how the account signs in.
// They are shown read-only.

import { getDb, type Db } from "./db.server.ts";
import { audit, checkRateLimit, hashSessionToken, recordAttempt, type PublicUser, type RequestMeta } from "./auth.server.ts";
import { ConnectionError } from "./connections.server.ts";
import { checkPasswordStrength, hashPassword, verifyPassword } from "./password.server.ts";
import { validatePhotoDataUrl } from "../src/lib/athleteExtrasRules.ts";
import { REP_ROLE, RepDashboardError, resolveSchool } from "./rep-dashboard.server.ts";

type Actor = Pick<PublicUser, "id" | "roles">;

const NAME_MAX = 40;
const DESIGNATION_MAX = 80;
/** A profile photo is shrunk by the browser first; this is the most the server will keep. */
export const AVATAR_MAX_CHARS = 300_000;

const bad = (message: string, fieldErrors?: Record<string, string>) =>
  new ConnectionError(400, "validation", message, fieldErrors ? { fieldErrors } : undefined);

function requireRep(actor: Actor): void {
  if (!actor.roles.includes(REP_ROLE)) throw new RepDashboardError(403, "role_not_allowed", "Only school representatives can use this.");
}

// eslint-disable-next-line no-control-regex
const stripControl = (s: string) => s.replace(/[\u0000-\u001f\u007f]/g, "").replace(/\s+/g, " ").trim();

/* ------------------------------------------------------------------ profile */

export interface RepProfile {
  displayName: string;
  firstName: string;
  lastName: string;
  designation: string;
  /** read-only: the institution an administrator approved */
  school: string;
  /** read-only: how the account signs in */
  email: string;
  username: string;
  avatar: string | null;
  createdAt: string;
  lastLoginAt: string | null;
  passwordChangedAt: string | null;
}

const safeAvatar = (v: string | null): string | null => (v && v.length <= AVATAR_MAX_CHARS && validatePhotoDataUrl(v) === null ? v : null);

export async function getRepProfile(actor: Actor, dbArg?: Db): Promise<RepProfile> {
  requireRep(actor);
  const db = dbArg ?? (await getDb());
  const [r] = await db<{
    display_name: string; email: string; username: string; created_at: Date; last_login_at: Date | null; password_changed_at: Date | null;
    first_name: string | null; last_name: string | null; avatar_url: string | null; designation: string | null; school: string | null;
  }[]>`
    SELECT u.display_name, u.email, u.username, u.created_at, u.last_login_at, u.password_changed_at,
           up.first_name, up.last_name, up.avatar_url, rp.designation, rp.university_name AS school
    FROM users u
    LEFT JOIN user_profiles up ON up.user_id = u.id
    LEFT JOIN university_representative_profiles rp ON rp.user_id = u.id
    WHERE u.id = ${actor.id} AND u.deleted_at IS NULL`;
  if (!r) throw new ConnectionError(404, "not_found", "Your account could not be found.");
  return {
    displayName: r.display_name,
    firstName: r.first_name ?? "",
    lastName: r.last_name ?? "",
    designation: r.designation ?? "",
    school: (r.school ?? "").trim(),
    email: r.email,
    username: r.username,
    avatar: safeAvatar(r.avatar_url),
    createdAt: r.created_at.toISOString(),
    lastLoginAt: r.last_login_at ? r.last_login_at.toISOString() : null,
    passwordChangedAt: r.password_changed_at ? r.password_changed_at.toISOString() : null,
  };
}

export async function updateRepProfile(actor: Actor, raw: unknown, meta: Partial<RequestMeta> = {}, dbArg?: Db): Promise<RepProfile> {
  requireRep(actor);
  const body = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const text = (k: string) => (typeof body[k] === "string" ? stripControl(body[k] as string) : "");
  const firstName = text("firstName"), lastName = text("lastName"), designation = text("designation");

  const errors: Record<string, string> = {};
  if (firstName.length < 1 || firstName.length > NAME_MAX) errors["firstName"] = `Enter your first name (up to ${NAME_MAX} characters).`;
  if (lastName.length < 1 || lastName.length > NAME_MAX) errors["lastName"] = `Enter your last name (up to ${NAME_MAX} characters).`;
  if (designation.length < 1 || designation.length > DESIGNATION_MAX) errors["designation"] = `Enter your position or designation (up to ${DESIGNATION_MAX} characters).`;
  if (Object.keys(errors).length > 0) throw bad("Please fix the highlighted fields.", errors);

  const db = dbArg ?? (await getDb());
  const before = await getRepProfile(actor, db);
  const displayName = `${firstName} ${lastName}`.slice(0, 80);
  const ts = new Date();
  await db.begin(async (txRaw) => {
    const tx = txRaw as unknown as Db;
    await tx`UPDATE users SET display_name = ${displayName}, updated_at = ${ts} WHERE id = ${actor.id}`;
    await tx`
      INSERT INTO user_profiles (user_id, first_name, last_name, updated_at) VALUES (${actor.id}, ${firstName}, ${lastName}, ${ts})
      ON CONFLICT (user_id) DO UPDATE SET first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name, updated_at = EXCLUDED.updated_at`;
    await tx`UPDATE university_representative_profiles SET designation = ${designation}, updated_at = ${ts} WHERE user_id = ${actor.id}`;
    const changed = [
      (before.firstName !== firstName || before.lastName !== lastName) && "name",
      before.designation !== designation && "designation",
    ].filter(Boolean);
    if (changed.length) await audit("rep.profile_updated", { userId: actor.id, ...meta, detail: { changed } }, tx);
  });
  return getRepProfile(actor, db);
}

/** `dataUrl: null` removes the photo. The browser has already resized it; the server still checks type and size. */
export async function setRepAvatar(actor: Actor, dataUrl: unknown, meta: Partial<RequestMeta> = {}, dbArg?: Db): Promise<RepProfile> {
  requireRep(actor);
  const db = dbArg ?? (await getDb());
  let value: string | null = null;
  if (dataUrl !== null) {
    if (typeof dataUrl !== "string") throw bad("Choose an image.");
    const problem = validatePhotoDataUrl(dataUrl);
    if (problem) throw bad(problem, { avatar: problem });
    if (dataUrl.length > AVATAR_MAX_CHARS) throw bad("That image is too large. Try a smaller one.", { avatar: "That image is too large." });
    value = dataUrl;
  }
  const ts = new Date();
  await db`
    INSERT INTO user_profiles (user_id, avatar_url, updated_at) VALUES (${actor.id}, ${value}, ${ts})
    ON CONFLICT (user_id) DO UPDATE SET avatar_url = EXCLUDED.avatar_url, updated_at = EXCLUDED.updated_at`;
  await audit("rep.profile_updated", { userId: actor.id, ...meta, detail: { changed: [value ? "photo" : "photo removed"] } }, db);
  return getRepProfile(actor, db);
}

/* ------------------------------------------------------------------ password */

export async function changeRepPassword(
  actor: Actor,
  raw: unknown,
  currentToken: string | undefined,
  meta: Partial<RequestMeta> = {},
  dbArg?: Db,
): Promise<{ otherSessionsSignedOut: number }> {
  requireRep(actor);
  const body = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const current = typeof body["currentPassword"] === "string" ? body["currentPassword"] : "";
  const next = typeof body["newPassword"] === "string" ? body["newPassword"] : "";

  if (!current) throw bad("Enter your current password.", { currentPassword: "Enter your current password." });
  if (current.length > 128 || next.length > 128) throw bad("That password is too long.");
  if (typeof body["confirmPassword"] === "string" && body["confirmPassword"] !== next)
    throw bad("The passwords don't match.", { confirmPassword: "The passwords don't match." });
  const weak = checkPasswordStrength(next);
  if (weak) throw bad(weak, { newPassword: weak });
  if (next === current) throw bad("Choose a password you haven't used here.", { newPassword: "The new password must be different." });

  const db = dbArg ?? (await getDb());
  // Someone holding a stolen session must not be able to guess the current password at full speed.
  const bucket = `rep-pw:${actor.id}`;
  const wait = await checkRateLimit(db, bucket, meta.ip ?? null);
  if (wait !== null) {
    const mins = Math.ceil(wait / 60);
    throw new ConnectionError(429, "rate_limited", `Too many wrong passwords. Try again in about ${mins} minute${mins === 1 ? "" : "s"}.`, { retryAfterSec: wait });
  }

  const [row] = await db<{ password_hash: string }[]>`SELECT password_hash FROM users WHERE id = ${actor.id} AND deleted_at IS NULL`;
  if (!row) throw new ConnectionError(404, "not_found", "Your account could not be found.");
  if (!(await verifyPassword(current, row.password_hash))) {
    await recordAttempt(db, bucket, meta.ip ?? null, false);
    await audit("rep.password_change_failed", { userId: actor.id, ...meta }, db);
    throw bad("That isn't your current password.", { currentPassword: "That isn't your current password." });
  }

  const hash = await hashPassword(next);
  const keep = currentToken ? hashSessionToken(currentToken) : "";
  const ts = new Date();
  let signedOut = 0;
  await db.begin(async (txRaw) => {
    const tx = txRaw as unknown as Db;
    await tx`UPDATE users SET password_hash = ${hash}, password_changed_at = ${ts}, updated_at = ${ts} WHERE id = ${actor.id}`;
    // Every other device is signed out; this one stays signed in.
    const gone = await tx`DELETE FROM sessions WHERE user_id = ${actor.id} AND token_hash <> ${keep} RETURNING token_hash`;
    signedOut = gone.length;
    await tx`DELETE FROM login_attempts WHERE identifier = ${bucket}`;
    await audit("rep.password_changed", { userId: actor.id, ...meta, detail: { otherSessionsSignedOut: signedOut } }, tx);
  });
  return { otherSessionsSignedOut: signedOut };
}

/* ------------------------------------------------------------------ the top bar */

export interface RepHeader {
  displayName: string;
  avatar: string | null;
  /** coach requests waiting for this representative's decision (same count as the Dashboard card) */
  pendingCoachRequests: number;
}

/** What the top bar shows: the name, the photo, and how many coach requests are waiting. */
export async function getRepHeader(actor: Actor & { displayName?: string }, dbArg?: Db): Promise<RepHeader> {
  requireRep(actor);
  const db = dbArg ?? (await getDb());
  const profile = await getRepProfile(actor, db);
  let pending = 0;
  try {
    const school = await resolveSchool(db, actor as PublicUser);
    const [r] = await db<{ n: number }[]>`
      SELECT count(*)::int AS n
      FROM coach_verifications v
      JOIN users u ON u.id = v.coach_id AND u.is_active = TRUE AND u.deleted_at IS NULL
      JOIN coach_profiles cp ON cp.user_id = v.coach_id
      WHERE v.status = 'pending' AND lower(btrim(v.organization)) = ${school.key}
        AND cp.organization_type IN ('University', 'College')`;
    pending = r?.n ?? 0;
  } catch (err) {
    if (!(err instanceof RepDashboardError)) throw err; // no approved school yet: nothing is waiting
  }
  return { displayName: profile.displayName, avatar: profile.avatar, pendingCoachRequests: pending };
}
