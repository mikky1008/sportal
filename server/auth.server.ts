// Authentication core: accounts, login, sessions, rate limiting and the audit trail.
//
// SERVER ONLY (the `.server.ts` suffix keeps it out of the browser bundle). It uses relative
// imports on purpose so the same file also runs from the `scripts/` command-line tools.
//
// Security notes
//  - Passwords are hashed with scrypt (see password.server.ts); plain text is never stored or logged.
//  - A session is a random 256-bit token. Only its SHA-256 hash is stored in the database.
//  - Every SQL statement is a tagged template with bound parameters (no string concatenation).
//  - "Unknown user" and "wrong password" return the same message and take about the same time.

import { createHash, randomBytes, randomUUID } from "node:crypto";
import { getDb, type Db } from "./db.server.ts";
import { isConfiguredAdminEmail } from "./admin-config.server.ts";
import {
  burnPasswordCheck,
  checkPasswordStrength,
  hashPassword,
  needsRehash,
  verifyPassword,
} from "./password.server.ts";

export const SESSION_COOKIE = "sportal_session";
export const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // normal sign-in: 12 hours
export const REMEMBER_TTL_MS = 30 * 24 * 60 * 60 * 1000; // "Remember me": 30 days
export const ADMIN_SESSION_TTL_MS = 4 * 60 * 60 * 1000; // administrator: 4 hours, never "remember me"

export const RATE_LIMIT = {
  windowMs: 15 * 60 * 1000,
  maxFailuresPerIdentifier: 5,
  maxFailuresPerIp: 25,
} as const;

export const SIGNUP_LIMIT = { windowMs: 60 * 60 * 1000, max: 5 } as const;

export interface PublicUser {
  id: string;
  email: string;
  username: string;
  displayName: string;
  roles: string[];
  permissions: string[];
}

export type LoginResult =
  | { ok: true; user: PublicUser; token: string; expiresAt: Date; remember: boolean }
  | { ok: false; code: "invalid_credentials" | "inactive" | "rate_limited"; retryAfterSec?: number };

export interface RequestMeta {
  ip: string | null;
  userAgent: string | null;
}

const now = () => new Date();
const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

export function normalizeIdentifier(raw: string): string {
  return raw.trim().toLowerCase().slice(0, 254);
}

// ---------- audit log ----------

export async function audit(
  event: string,
  fields: { userId?: string | null; identifier?: string | null; detail?: Record<string, unknown> } & Partial<RequestMeta> = {},
  db?: Db,
): Promise<void> {
  const sql = db ?? (await getDb());
  // `detail` must never contain passwords, hashes or tokens; callers only pass safe values.
  await sql`
    INSERT INTO audit_log (user_id, event, identifier, ip, user_agent, detail, created_at)
    VALUES (${fields.userId ?? null}, ${event}, ${fields.identifier ?? null}, ${fields.ip ?? null},
            ${fields.userAgent?.slice(0, 300) ?? null}, ${fields.detail ? JSON.stringify(fields.detail) : null}, ${now()})`;
}

// ---------- users ----------

interface UserRow {
  id: string;
  email: string;
  username: string;
  display_name: string;
  password_hash: string;
  is_active: boolean;
}

async function loadAccess(db: Db, userId: string): Promise<{ roles: string[]; permissions: string[] }> {
  const roles = await db<{ name: string }[]>`
    SELECT r.name FROM user_roles ur JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = ${userId} ORDER BY r.name`;
  const perms = await db<{ name: string }[]>`
    SELECT DISTINCT p.name FROM user_roles ur
    JOIN role_permissions rp ON rp.role_id = ur.role_id
    JOIN permissions p ON p.id = rp.permission_id
    WHERE ur.user_id = ${userId} ORDER BY p.name`;
  return { roles: roles.map((r) => r.name), permissions: perms.map((p) => p.name) };
}

async function toPublicUser(
  db: Db,
  row: Pick<UserRow, "id" | "email" | "username" | "display_name">,
): Promise<PublicUser> {
  // The names typed on the Sign up form, so the app can show them on any browser or device.
  const [profile] = await db<{ first_name: string | null; last_name: string | null }[]>`
    SELECT first_name, last_name FROM user_profiles WHERE user_id = ${row.id}`;
  const firstName = profile?.first_name?.trim();
  const lastName = profile?.last_name?.trim();
  return {
    id: row.id,
    email: row.email,
    username: row.username,
    displayName: row.display_name,
    ...(firstName ? { firstName } : {}),
    ...(lastName ? { lastName } : {}),
    ...(await loadAccess(db, row.id)),
  };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const USERNAME_RE = /^[a-zA-Z0-9_.-]{3,32}$/;

export class UserInputError extends Error {
  /** which form field the message is about, when it is about one */
  readonly field: "email" | "username" | "password" | undefined;
  constructor(message: string, field?: "email" | "username" | "password") {
    super(message);
    this.field = field;
  }
}

/** What each self-registered role saves besides the account itself. */
export type RoleDetails =
  | { kind: "student_athlete" }
  | { kind: "coach"; organization: string; coachingPosition: string; sportSpecialization: string }
  | { kind: "university_representative"; universityName: string; designation: string };

export interface NewUser {
  email: string;
  username: string;
  password: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  roles?: string[];
  /** saved in the same transaction as the account, so there is never half an account */
  details?: RoleDetails;
}

/** Roles used to be called "athlete"; scripts and older callers may still pass that name. */
const ROLE_ALIASES: Record<string, string> = { athlete: "student_athlete" };

/** Postgres unique-violation (error code 23505) on a named index. */
function uniqueViolation(err: unknown, indexName: string): boolean {
  if (typeof err !== "object" || err === null) return false;
  const e = err as { code?: string; constraint_name?: string };
  return e.code === "23505" && e.constraint_name === indexName;
}

export async function createUser(input: NewUser, dbArg?: Db): Promise<PublicUser> {
  const db = dbArg ?? (await getDb());
  const email = input.email.trim().toLowerCase();
  const username = input.username.trim();
  if (email.length > 254 || !EMAIL_RE.test(email)) throw new UserInputError("Enter a valid email address.");
  if (!USERNAME_RE.test(username))
    throw new UserInputError("Username must be 3-32 characters: letters, numbers, dot, dash or underscore.");
  const pwError = checkPasswordStrength(input.password);
  if (pwError) throw new UserInputError(pwError, "password");
  const displayName = (input.displayName?.trim() || username).slice(0, 80);
  const roleNames = (input.roles?.length ? input.roles : ["student_athlete"]).map((r) => ROLE_ALIASES[r] ?? r);
  // The administrator is provisioned from environment variables only (server/admin-account.server.ts).
  // No caller of createUser - Sign up, scripts, anything - can hand out the role.
  if (roleNames.includes("admin"))
    throw new UserInputError("The administrator account is configured through ADMIN_EMAIL and ADMIN_PASSWORD, not created here.");

  const roleIds: number[] = [];
  for (const name of roleNames) {
    const [row] = await db<{ id: number }[]>`SELECT id FROM roles WHERE name = ${name}`;
    if (!row) throw new UserInputError(`Unknown role "${name}".`);
    roleIds.push(row.id);
  }

  const [emailTaken] = await db`SELECT 1 AS x FROM users WHERE lower(email) = ${email}`;
  if (emailTaken) throw new UserInputError("An account with this email is already registered.", "email");
  const [nameTaken] = await db`SELECT 1 AS x FROM users WHERE lower(username) = ${username.toLowerCase()}`;
  if (nameTaken) throw new UserInputError("That username is already taken.", "username");

  const passwordHash = await hashPassword(input.password);
  const id = randomUUID();
  const ts = now();

  try {
    await db.begin(async (tx) => {
      await tx`
        INSERT INTO users (id, email, username, password_hash, display_name, password_changed_at, created_at, updated_at)
        VALUES (${id}, ${email}, ${username}, ${passwordHash}, ${displayName}, ${ts}, ${ts}, ${ts})`;
      await tx`
        INSERT INTO user_profiles (user_id, first_name, last_name, updated_at)
        VALUES (${id}, ${input.firstName?.trim() || null}, ${input.lastName?.trim() || null}, ${ts})`;
      for (const roleId of roleIds) {
        await tx`INSERT INTO user_roles (user_id, role_id, granted_at) VALUES (${id}, ${roleId}, ${ts})`;
      }
      const d = input.details;
      if (d?.kind === "coach") {
        await tx`
          INSERT INTO coach_profiles (user_id, organization, coaching_position, sport_specialization, created_at, updated_at)
          VALUES (${id}, ${d.organization.trim()}, ${d.coachingPosition.trim()}, ${d.sportSpecialization.trim()}, ${ts}, ${ts})`;
      } else if (d?.kind === "university_representative") {
        await tx`
          INSERT INTO university_representative_profiles (user_id, university_name, designation, created_at, updated_at)
          VALUES (${id}, ${d.universityName.trim()}, ${d.designation.trim()}, ${ts}, ${ts})`;
      }
    });
  } catch (err) {
    // Two people registering the same email at the same moment: the database's UNIQUE rule decides.
    if (uniqueViolation(err, "users_email_key"))
      throw new UserInputError("An account with this email is already registered.", "email");
    if (uniqueViolation(err, "users_username_key"))
      throw new UserInputError("That username is already taken.", "username");
    throw err;
  }
  await audit("user.created", { userId: id, detail: { roles: roleNames } }, db);
  return toPublicUser(db, { id, email, username, display_name: displayName });
}

/**
 * A valid, unique username for an account that signs up with just an email. Login works with the
 * email itself, so this is only an internal handle. Two different emails can sanitize to the same
 * text (a+b@x.com and a_b@x.com), so a short random suffix is added when the plain one is taken.
 */
export async function deriveUsername(email: string, dbArg?: Db): Promise<string> {
  const db = dbArg ?? (await getDb());
  const clean = email.trim().toLowerCase().replace(/[^a-z0-9_.-]/g, "_").slice(0, 32);
  const base = clean.length >= 3 ? clean : `${clean}___`.slice(0, 3);
  const taken = async (u: string) => {
    const [row] = await db`SELECT 1 AS x FROM users WHERE lower(username) = ${u.toLowerCase()}`;
    return !!row;
  };
  if (!(await taken(base))) return base;
  for (let i = 0; i < 20; i++) {
    const suffix = `-${randomBytes(3).toString("hex")}`;
    const candidate = `${base.slice(0, 32 - suffix.length)}${suffix}`;
    if (!(await taken(candidate))) return candidate;
  }
  throw new UserInputError("Could not create a username. Try a different email.", "email");
}

/** Turn an account off (or back on) and revoke its sessions. Used by future admin tooling. */
export async function setUserActive(userId: string, active: boolean, dbArg?: Db): Promise<void> {
  const db = dbArg ?? (await getDb());
  await db`UPDATE users SET is_active = ${active}, updated_at = ${now()} WHERE id = ${userId}`;
  if (!active) await revokeAllSessions(userId, db);
  await audit(active ? "user.activated" : "user.deactivated", { userId }, db);
}

// ---------- rate limiting ----------

async function checkRateLimit(db: Db, identifier: string, ip: string | null): Promise<number | null> {
  const since = new Date(Date.now() - RATE_LIMIT.windowMs);
  const [byId] = await db<{ n: number; oldest: Date | null }[]>`
    SELECT COUNT(*)::int AS n, MIN(created_at) AS oldest FROM login_attempts
    WHERE identifier = ${identifier} AND success = FALSE AND created_at > ${since}`;
  const byIp = ip
    ? (
        await db<{ n: number; oldest: Date | null }[]>`
          SELECT COUNT(*)::int AS n, MIN(created_at) AS oldest FROM login_attempts
          WHERE ip = ${ip} AND success = FALSE AND created_at > ${since}`
      )[0]
    : undefined;

  const hits = [
    byId && byId.n >= RATE_LIMIT.maxFailuresPerIdentifier ? byId.oldest : null,
    byIp && byIp.n >= RATE_LIMIT.maxFailuresPerIp ? byIp.oldest : null,
  ].filter((x): x is Date => x !== null);
  if (hits.length === 0) return null;
  const unlockAt = Math.max(...hits.map((o) => o.getTime() + RATE_LIMIT.windowMs));
  return Math.max(1, Math.ceil((unlockAt - Date.now()) / 1000));
}

async function recordAttempt(db: Db, identifier: string, ip: string | null, success: boolean): Promise<void> {
  await db`INSERT INTO login_attempts (identifier, ip, success, created_at) VALUES (${identifier}, ${ip}, ${success}, ${now()})`;
}

/**
 * Best-effort limit on sign ups per address. Kept in the database because serverless instances
 * share no memory. Returns false when this address has signed up too often recently.
 */
export async function signupAllowed(ip: string | null, dbArg?: Db): Promise<boolean> {
  const db = dbArg ?? (await getDb());
  const key = ip ?? "unknown";
  const max = ip ? SIGNUP_LIMIT.max : SIGNUP_LIMIT.max * 4;
  const since = new Date(Date.now() - SIGNUP_LIMIT.windowMs);
  const [row] = await db<{ n: number }[]>`
    SELECT COUNT(*)::int AS n FROM signup_attempts WHERE ip = ${key} AND created_at > ${since}`;
  if ((row?.n ?? 0) >= max) return false;
  await db`INSERT INTO signup_attempts (ip, created_at) VALUES (${key}, ${now()})`;
  return true;
}

async function housekeeping(db: Db): Promise<void> {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  await db`DELETE FROM login_attempts WHERE created_at < ${cutoff}`;
  await db`DELETE FROM signup_attempts WHERE created_at < ${cutoff}`;
  await db`DELETE FROM sessions WHERE expires_at < ${now()} OR revoked_at IS NOT NULL`;
}

// ---------- sessions ----------

export async function createSession(
  userId: string,
  remember: boolean,
  meta: RequestMeta,
  dbArg?: Db,
  ttlMs?: number,
): Promise<{ token: string; expiresAt: Date }> {
  const db = dbArg ?? (await getDb());
  const token = randomBytes(32).toString("base64url");
  const ts = now();
  const expiresAt = new Date(Date.now() + (ttlMs ?? (remember ? REMEMBER_TTL_MS : SESSION_TTL_MS)));
  await db`
    INSERT INTO sessions (token_hash, user_id, created_at, last_seen_at, expires_at, remember, ip, user_agent)
    VALUES (${sha256(token)}, ${userId}, ${ts}, ${ts}, ${expiresAt}, ${remember}, ${meta.ip}, ${meta.userAgent?.slice(0, 300) ?? null})`;
  return { token, expiresAt };
}

export async function getUserBySessionToken(token: string | undefined, dbArg?: Db): Promise<PublicUser | null> {
  if (!token || token.length > 200) return null;
  const db = dbArg ?? (await getDb());
  const [row] = await db<{ id: string; email: string; username: string; display_name: string; last_seen_at: Date }[]>`
    SELECT u.id, u.email, u.username, u.display_name, s.last_seen_at
    FROM sessions s JOIN users u ON u.id = s.user_id
    WHERE s.token_hash = ${sha256(token)} AND s.revoked_at IS NULL AND s.expires_at > ${now()}
      AND u.is_active = TRUE AND u.deleted_at IS NULL`;
  if (!row) return null;
  if (Date.now() - row.last_seen_at.getTime() > 60_000) {
    await db`UPDATE sessions SET last_seen_at = ${now()} WHERE token_hash = ${sha256(token)}`;
  }
  return toPublicUser(db, row);
}

/** Invalidate one session on the server (logout). */
export async function destroySession(token: string | undefined, meta: RequestMeta, dbArg?: Db): Promise<void> {
  if (!token) return;
  const db = dbArg ?? (await getDb());
  const [row] = await db<{ user_id: string }[]>`DELETE FROM sessions WHERE token_hash = ${sha256(token)} RETURNING user_id`;
  if (row) await audit("logout", { userId: row.user_id, ...meta }, db);
}

export async function revokeAllSessions(userId: string, dbArg?: Db): Promise<void> {
  const db = dbArg ?? (await getDb());
  await db`DELETE FROM sessions WHERE user_id = ${userId}`;
}

// ---------- login ----------

/**
 * Which sign-in door the request came through. The two doors are mutually exclusive:
 *  - "user":  Student-athletes, coaches and university representatives. An administrator's
 *             credentials are REFUSED here (same message as a wrong password).
 *  - "admin": Only the one administrator configured through ADMIN_EMAIL / ADMIN_PASSWORD.
 *             Every other account is refused here, whatever its password.
 * Refusals look identical to a wrong password, so neither door reveals which accounts exist or
 * which of them is the administrator.
 */
export type LoginScope = "user" | "admin";

export async function authenticate(
  input: { identifier: string; password: string; remember: boolean; scope?: LoginScope },
  meta: RequestMeta,
  dbArg?: Db,
): Promise<LoginResult> {
  const db = dbArg ?? (await getDb());
  const scope: LoginScope = input.scope ?? "user";
  const identifier = normalizeIdentifier(input.identifier);
  // Administrator attempts are counted in their own bucket so that guessing at the admin form can
  // never lock a regular user out of the normal form (and the other way round).
  const bucket = scope === "admin" ? `admin:${identifier}` : identifier;
  const failEvent = scope === "admin" ? "admin.login.failed" : "login.failed";
  await housekeeping(db);

  const retryAfterSec = await checkRateLimit(db, bucket, meta.ip);
  if (retryAfterSec !== null) {
    await audit(scope === "admin" ? "admin.login.blocked" : "login.blocked", { identifier, ...meta }, db);
    return { ok: false, code: "rate_limited", retryAfterSec };
  }

  const [user] = await db<UserRow[]>`
    SELECT id, email, username, display_name, password_hash, is_active FROM users
    WHERE (lower(email) = ${identifier} OR lower(username) = ${identifier}) AND deleted_at IS NULL`;

  if (!user) {
    await burnPasswordCheck(input.password);
    await recordAttempt(db, bucket, meta.ip, false);
    await audit(failEvent, { identifier, ...meta, detail: { reason: "unknown_account" } }, db);
    return { ok: false, code: "invalid_credentials" };
  }

  const passwordOk = await verifyPassword(input.password, user.password_hash);
  if (!passwordOk) {
    await recordAttempt(db, bucket, meta.ip, false);
    await audit(failEvent, { userId: user.id, identifier, ...meta, detail: { reason: "bad_password" } }, db);
    return { ok: false, code: "invalid_credentials" };
  }

  // The password is right; now check the account is allowed through THIS door. This runs before the
  // "inactive" answer so a wrong-door attempt never learns anything about the account.
  const access = await loadAccess(db, user.id);
  const isAdminAccount = access.roles.includes("admin");
  const wrongDoor =
    scope === "admin"
      ? !(isAdminAccount && isConfiguredAdminEmail(user.email))
      : isAdminAccount;
  if (wrongDoor) {
    await recordAttempt(db, bucket, meta.ip, false);
    await audit(failEvent, { userId: user.id, identifier, ...meta, detail: { reason: scope === "admin" ? "not_the_administrator" : "administrator_on_user_login" } }, db);
    return { ok: false, code: "invalid_credentials" };
  }

  if (!user.is_active) {
    await audit(failEvent, { userId: user.id, identifier, ...meta, detail: { reason: "inactive" } }, db);
    return { ok: false, code: "inactive" };
  }

  if (needsRehash(user.password_hash)) {
    await db`UPDATE users SET password_hash = ${await hashPassword(input.password)}, updated_at = ${now()} WHERE id = ${user.id}`;
  }

  // Administrator sessions are short and can never be "remembered".
  const remember = scope === "admin" ? false : input.remember;

  await db`DELETE FROM login_attempts WHERE identifier = ${bucket} AND success = FALSE`;
  await recordAttempt(db, bucket, meta.ip, true);
  await db`UPDATE users SET last_login_at = ${now()} WHERE id = ${user.id}`;
  const { token, expiresAt } = await createSession(user.id, remember, meta, db, scope === "admin" ? ADMIN_SESSION_TTL_MS : undefined);
  await audit(scope === "admin" ? "admin.login.success" : "login.success", { userId: user.id, identifier, ...meta, detail: { remember } }, db);
  return { ok: true, user: await toPublicUser(db, user), token, expiresAt, remember };
}
