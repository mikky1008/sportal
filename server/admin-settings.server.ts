// The administrator's Settings: profile, password, active sessions and notification preferences, plus
// the small summary the top bar uses (name, photo, notification counts).
//
// Every function acts on the signed-in administrator's OWN account only; there is no user id to pass,
// so it cannot be pointed at anyone else. Each one also re-checks the caller holds the admin role.
//
// Two things are deliberately NOT editable here:
//   - the email: signing in requires it to equal ADMIN_EMAIL, so changing it would lock the account out;
//   - the username: the server keeps it equal to ADMIN_USERNAME.
// Both are configured by whoever runs the server, and Settings shows them read-only.

import { getDb, type Db } from "./db.server.ts";
import {
  audit, checkRateLimit, hashSessionToken, recordAttempt, type PublicUser, type RequestMeta,
} from "./auth.server.ts";
import { ConnectionError } from "./connections.server.ts";
import { requireAdmin } from "./admin.server.ts";
import { ADMIN_PASSWORD_MIN } from "./admin-config.server.ts";
import { checkPasswordStrength, hashPassword, verifyPassword } from "./password.server.ts";
import { validatePhotoDataUrl } from "../src/lib/athleteExtrasRules.ts";

type Actor = Pick<PublicUser, "id" | "roles">;

const NAME_MIN = 2;
const NAME_MAX = 80;
const PART_MAX = 40;
/** A profile photo is shrunk by the browser first; this is the most the server will keep. */
export const AVATAR_MAX_CHARS = 300_000;

const bad = (message: string, fieldErrors?: Record<string, string>) =>
  new ConnectionError(400, "validation", message, fieldErrors ? { fieldErrors } : undefined);

// eslint-disable-next-line no-control-regex
const stripControl = (s: string) => s.replace(/[\u0000-\u001f\u007f]/g, "").replace(/\s+/g, " ").trim();

/* ------------------------------------------------------------------ profile */

export interface AdminProfile {
  displayName: string;
  firstName: string;
  lastName: string;
  /** read-only: set by ADMIN_EMAIL */
  email: string;
  /** read-only: set by ADMIN_USERNAME */
  username: string;
  avatar: string | null;
  createdAt: string;
  lastLoginAt: string | null;
  passwordChangedAt: string | null;
}

interface ProfileRow {
  display_name: string; email: string; username: string; created_at: Date; last_login_at: Date | null;
  password_changed_at: Date | null; first_name: string | null; last_name: string | null; avatar_url: string | null;
}

const safeAvatar = (v: string | null): string | null => (v && v.length <= AVATAR_MAX_CHARS && validatePhotoDataUrl(v) === null ? v : null);

export async function getAdminProfile(actor: Actor): Promise<AdminProfile> {
  requireAdmin(actor);
  const db = await getDb();
  const [r] = await db<ProfileRow[]>`
    SELECT u.display_name, u.email, u.username, u.created_at, u.last_login_at, u.password_changed_at,
           up.first_name, up.last_name, up.avatar_url
    FROM users u LEFT JOIN user_profiles up ON up.user_id = u.id
    WHERE u.id = ${actor.id} AND u.deleted_at IS NULL`;
  if (!r) throw new ConnectionError(404, "not_found", "Your account could not be found.");
  return {
    displayName: r.display_name,
    firstName: r.first_name ?? "",
    lastName: r.last_name ?? "",
    email: r.email,
    username: r.username,
    avatar: safeAvatar(r.avatar_url),
    createdAt: r.created_at.toISOString(),
    lastLoginAt: r.last_login_at ? r.last_login_at.toISOString() : null,
    passwordChangedAt: r.password_changed_at ? r.password_changed_at.toISOString() : null,
  };
}

export async function updateAdminProfile(actor: Actor, raw: unknown, meta: RequestMeta): Promise<AdminProfile> {
  requireAdmin(actor);
  const body = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const text = (k: string) => (typeof body[k] === "string" ? stripControl(body[k] as string) : "");

  const displayName = text("displayName");
  if (displayName.length < NAME_MIN || displayName.length > NAME_MAX)
    throw bad(`Enter a name of ${NAME_MIN} to ${NAME_MAX} characters.`, { displayName: `Enter a name of ${NAME_MIN} to ${NAME_MAX} characters.` });
  const firstName = text("firstName");
  const lastName = text("lastName");
  if (firstName.length > PART_MAX) throw bad("First name is too long.", { firstName: `Keep it under ${PART_MAX} characters.` });
  if (lastName.length > PART_MAX) throw bad("Last name is too long.", { lastName: `Keep it under ${PART_MAX} characters.` });

  const db = await getDb();
  const before = await getAdminProfile(actor);
  const ts = new Date();
  await db.begin(async (txRaw) => {
    const tx = txRaw as unknown as Db;
    await tx`UPDATE users SET display_name = ${displayName}, updated_at = ${ts} WHERE id = ${actor.id}`;
    await tx`
      INSERT INTO user_profiles (user_id, first_name, last_name, updated_at) VALUES (${actor.id}, ${firstName || null}, ${lastName || null}, ${ts})
      ON CONFLICT (user_id) DO UPDATE SET first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name, updated_at = EXCLUDED.updated_at`;
    const changed = [
      before.displayName !== displayName && "name",
      (before.firstName !== firstName || before.lastName !== lastName) && "first and last name",
    ].filter(Boolean);
    if (changed.length) await audit("admin.profile_updated", { userId: actor.id, ...meta, detail: { changed } }, tx);
  });
  return getAdminProfile(actor);
}

/** `dataUrl: null` removes the photo. The browser has already resized it; the server still checks type and size. */
export async function setAdminAvatar(actor: Actor, dataUrl: unknown, meta: RequestMeta): Promise<AdminProfile> {
  requireAdmin(actor);
  const db = await getDb();
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
  await audit("admin.profile_updated", { userId: actor.id, ...meta, detail: { changed: [value ? "photo" : "photo removed"] } }, db);
  return getAdminProfile(actor);
}

/* ------------------------------------------------------------------ password */

export async function changeAdminPassword(
  actor: Actor,
  raw: unknown,
  currentToken: string | undefined,
  meta: RequestMeta,
): Promise<{ otherSessionsSignedOut: number }> {
  requireAdmin(actor);
  const body = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const current = typeof body["currentPassword"] === "string" ? body["currentPassword"] : "";
  const next = typeof body["newPassword"] === "string" ? body["newPassword"] : "";

  if (!current) throw bad("Enter your current password.", { currentPassword: "Enter your current password." });
  if (current.length > 128 || next.length > 128) throw bad("That password is too long.");
  if (typeof body["confirmPassword"] === "string" && body["confirmPassword"] !== next)
    throw bad("The passwords don't match.", { confirmPassword: "The passwords don't match." });
  const weak = next.length < ADMIN_PASSWORD_MIN ? `Use at least ${ADMIN_PASSWORD_MIN} characters.` : checkPasswordStrength(next);
  if (weak) throw bad(weak, { newPassword: weak });
  if (next === current) throw bad("Choose a password you haven't used here.", { newPassword: "The new password must be different." });

  const db = await getDb();
  // Someone holding a stolen session must not be able to guess the current password at full speed.
  const bucket = `admin-pw:${actor.id}`;
  const wait = await checkRateLimit(db, bucket, meta.ip);
  if (wait !== null) {
    const mins = Math.ceil(wait / 60);
    throw new ConnectionError(429, "rate_limited", `Too many wrong passwords. Try again in about ${mins} minute${mins === 1 ? "" : "s"}.`, { retryAfterSec: wait });
  }

  const [row] = await db<{ password_hash: string }[]>`SELECT password_hash FROM users WHERE id = ${actor.id} AND deleted_at IS NULL`;
  if (!row) throw new ConnectionError(404, "not_found", "Your account could not be found.");
  if (!(await verifyPassword(current, row.password_hash))) {
    await recordAttempt(db, bucket, meta.ip, false);
    await audit("admin.password_change_failed", { userId: actor.id, ...meta }, db);
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
    await audit("admin.password_changed", { userId: actor.id, ...meta, detail: { otherSessionsSignedOut: signedOut } }, tx);
  });
  return { otherSessionsSignedOut: signedOut };
}

/* ------------------------------------------------------------------ active sessions */

export interface AdminSession {
  /** an opaque id for this list; the stored token hash never leaves the server */
  id: string;
  current: boolean;
  device: string;
  browser: string;
  os: string;
  ip: string | null;
  signedInAt: string;
  lastActiveAt: string;
  expiresAt: string;
}

export function describeDevice(ua: string | null): { device: string; browser: string; os: string } {
  const s = ua ?? "";
  const browser =
    !s ? "Unknown browser"
    : /Edg\//.test(s) ? "Edge"
    : /OPR\/|Opera/.test(s) ? "Opera"
    : /Firefox\//.test(s) ? "Firefox"
    : /Chrome\/|CriOS\//.test(s) ? "Chrome"
    : /Safari\//.test(s) ? "Safari"
    : /curl|node|axios|python|okhttp/i.test(s) ? "API client"
    : "Browser";
  const os =
    /Windows/.test(s) ? "Windows"
    : /Android/.test(s) ? "Android"
    : /iPhone|iPad|iPod/.test(s) ? "iOS"
    : /Mac OS X|Macintosh/.test(s) ? "macOS"
    : /CrOS/.test(s) ? "ChromeOS"
    : /Linux/.test(s) ? "Linux"
    : "";
  return { device: os ? `${browser} on ${os}` : browser, browser, os };
};

/** The id shown in the list. Derived from the stored hash, so it can't be used to sign in as anything. */
const opaqueId = (tokenHash: string) => hashSessionToken(`session-list:${tokenHash}`).slice(0, 24);

interface SessionRow { token_hash: string; created_at: Date; last_seen_at: Date; expires_at: Date; ip: string | null; user_agent: string | null }

async function activeSessions(db: Db, userId: string): Promise<SessionRow[]> {
  return db<SessionRow[]>`
    SELECT token_hash, created_at, last_seen_at, expires_at, ip, user_agent FROM sessions
    WHERE user_id = ${userId} AND revoked_at IS NULL AND expires_at > ${new Date()}
    ORDER BY last_seen_at DESC, created_at DESC`;
}

export async function listAdminSessions(actor: Actor, currentToken: string | undefined): Promise<AdminSession[]> {
  requireAdmin(actor);
  const db = await getDb();
  const mine = currentToken ? hashSessionToken(currentToken) : "";
  return (await activeSessions(db, actor.id)).map((r) => ({
    id: opaqueId(r.token_hash),
    current: r.token_hash === mine,
    ...describeDevice(r.user_agent),
    ip: r.ip,
    signedInAt: r.created_at.toISOString(),
    lastActiveAt: r.last_seen_at.toISOString(),
    expiresAt: r.expires_at.toISOString(),
  }));
}

export async function revokeAdminSession(actor: Actor, sessionId: string, currentToken: string | undefined, meta: RequestMeta): Promise<void> {
  requireAdmin(actor);
  const db = await getDb();
  const mine = currentToken ? hashSessionToken(currentToken) : "";
  const target = (await activeSessions(db, actor.id)).find((r) => opaqueId(r.token_hash) === sessionId);
  if (!target) throw new ConnectionError(404, "session_not_found", "That session has already ended.");
  if (target.token_hash === mine) throw new ConnectionError(400, "current_session", "This is the device you're using. Use Sign out instead.");
  await db`DELETE FROM sessions WHERE token_hash = ${target.token_hash} AND user_id = ${actor.id}`;
  await audit("admin.session_revoked", { userId: actor.id, ...meta, detail: { device: describeDevice(target.user_agent).device } }, db);
}

export async function revokeOtherAdminSessions(actor: Actor, currentToken: string | undefined, meta: RequestMeta): Promise<{ revoked: number }> {
  requireAdmin(actor);
  const db = await getDb();
  const keep = currentToken ? hashSessionToken(currentToken) : "";
  const gone = await db`DELETE FROM sessions WHERE user_id = ${actor.id} AND token_hash <> ${keep} RETURNING token_hash`;
  if (gone.length) await audit("admin.sessions_revoked", { userId: actor.id, ...meta, detail: { count: gone.length } }, db);
  return { revoked: gone.length };
}

/* ------------------------------------------------------------------ notification preferences */

export interface AdminPreferences {
  applications: boolean;
  reports: boolean;
  registrations: boolean;
  security: boolean;
}

const DEFAULT_PREFS: AdminPreferences = { applications: true, reports: true, registrations: true, security: true };

export async function getAdminPreferences(actor: Actor): Promise<AdminPreferences> {
  requireAdmin(actor);
  const db = await getDb();
  const [r] = await db<{ a: boolean; r: boolean; g: boolean; s: boolean }[]>`
    SELECT notify_applications AS a, notify_reports AS r, notify_registrations AS g, notify_security AS s
    FROM admin_preferences WHERE user_id = ${actor.id}`;
  return r ? { applications: r.a, reports: r.r, registrations: r.g, security: r.s } : { ...DEFAULT_PREFS };
}

export async function updateAdminPreferences(actor: Actor, raw: unknown): Promise<AdminPreferences> {
  requireAdmin(actor);
  const body = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const next = await getAdminPreferences(actor);
  for (const key of Object.keys(DEFAULT_PREFS) as (keyof AdminPreferences)[]) {
    if (body[key] === undefined) continue;
    if (typeof body[key] !== "boolean") throw bad(`"${key}" must be true or false.`);
    next[key] = body[key] as boolean;
  }
  const db = await getDb();
  await db`
    INSERT INTO admin_preferences (user_id, notify_applications, notify_reports, notify_registrations, notify_security, updated_at)
    VALUES (${actor.id}, ${next.applications}, ${next.reports}, ${next.registrations}, ${next.security}, ${new Date()})
    ON CONFLICT (user_id) DO UPDATE SET
      notify_applications = EXCLUDED.notify_applications, notify_reports = EXCLUDED.notify_reports,
      notify_registrations = EXCLUDED.notify_registrations, notify_security = EXCLUDED.notify_security,
      updated_at = EXCLUDED.updated_at`;
  return next;
}

/* ------------------------------------------------------------------ the top bar */

export interface AdminHeader {
  displayName: string;
  avatar: string | null;
  /** a number for each notification the administrator has switched ON; null for the ones switched off */
  bell: {
    applications: number | null;
    reports: number | null;
    registrations: number | null;
    securityAlerts: number | null;
  };
}

/**
 * What the top bar shows: the name and photo, and the bell. The bell only counts what the administrator
 * asked for in Notification Preferences, so switching a preference off changes it straight away.
 */
export async function getAdminHeader(actor: Actor): Promise<AdminHeader> {
  requireAdmin(actor);
  const db = await getDb();
  const prefs = await getAdminPreferences(actor);
  const profile = await getAdminProfile(actor);
  const day = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const week = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const count = async (q: Promise<{ n: number }[]>) => (await q)[0]?.n ?? 0;
  return {
    displayName: profile.displayName,
    avatar: profile.avatar,
    bell: {
      applications: prefs.applications
        ? await count(db<{ n: number }[]>`SELECT COUNT(*)::int AS n FROM rep_applications ra JOIN users u ON u.id = ra.user_id AND u.deleted_at IS NULL WHERE ra.status = 'pending'`)
        : null,
      reports: prefs.reports
        ? await count(db<{ n: number }[]>`SELECT COUNT(*)::int AS n FROM content_reports WHERE status = 'pending'`)
        : null,
      registrations: prefs.registrations
        ? await count(db<{ n: number }[]>`
            SELECT COUNT(*)::int AS n FROM users u
            WHERE u.deleted_at IS NULL AND u.created_at > ${week}
              AND NOT EXISTS (SELECT 1 FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = u.id AND r.name = 'admin')`)
        : null,
      securityAlerts: prefs.security
        ? await count(db<{ n: number }[]>`SELECT COUNT(*)::int AS n FROM audit_log WHERE event IN ('admin.login.failed', 'admin.login.blocked') AND created_at > ${day}`)
        : null,
    },
  };
}
