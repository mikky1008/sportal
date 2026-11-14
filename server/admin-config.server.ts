// The predefined Sportal administrator, configured ONLY through environment variables.
//
//   ADMIN_EMAIL         required  the administrator's sign-in email
//   ADMIN_PASSWORD      required  at least 12 characters, letters and numbers
//   ADMIN_USERNAME      optional  default "admin"
//   ADMIN_DISPLAY_NAME  optional  default "Sportal Administrator"
//
// There is no Sign up for administrators and no API that can grant the role: the account below is
// created (and kept in step with these values) by server/admin-account.server.ts when the server
// starts. Leave ADMIN_EMAIL / ADMIN_PASSWORD unset and administrator sign-in is simply switched off.
//
// This file has no database or framework imports so both the account provisioning and the login
// check can use it without creating an import cycle. The password is never logged or returned.

import { checkPasswordStrength } from "./password.server.ts";

export const ADMIN_PASSWORD_MIN = 12;

export interface AdminConfig {
  email: string;
  username: string;
  displayName: string;
  password: string;
}

export type AdminConfigResult =
  | { state: "ready"; config: AdminConfig }
  | { state: "not_configured" }
  | { state: "invalid"; problem: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const USERNAME_RE = /^[a-zA-Z0-9_.-]{3,32}$/;

type Env = Record<string, string | undefined>;

/** Reads and validates the ADMIN_* variables. Pass `env` in tests; it defaults to process.env. */
export function readAdminConfig(env: Env = process.env): AdminConfigResult {
  const email = env["ADMIN_EMAIL"]?.trim().toLowerCase() ?? "";
  const password = env["ADMIN_PASSWORD"] ?? "";
  if (!email && !password) return { state: "not_configured" };
  if (!email) return { state: "invalid", problem: "ADMIN_EMAIL is not set." };
  if (!password) return { state: "invalid", problem: "ADMIN_PASSWORD is not set." };

  if (email.length > 254 || !EMAIL_RE.test(email)) return { state: "invalid", problem: "ADMIN_EMAIL is not a valid email address." };

  if (password.length < ADMIN_PASSWORD_MIN)
    return { state: "invalid", problem: `ADMIN_PASSWORD must be at least ${ADMIN_PASSWORD_MIN} characters.` };
  const weak = checkPasswordStrength(password);
  if (weak) return { state: "invalid", problem: `ADMIN_PASSWORD: ${weak}` };

  const username = (env["ADMIN_USERNAME"]?.trim() || "admin");
  if (!USERNAME_RE.test(username))
    return { state: "invalid", problem: "ADMIN_USERNAME must be 3-32 characters: letters, numbers, dot, dash or underscore." };

  const displayName = (env["ADMIN_DISPLAY_NAME"]?.trim() || "Sportal Administrator").slice(0, 80);
  return { state: "ready", config: { email, username, displayName, password } };
}

/** True when `email` is the configured administrator's email (and only then). */
export function isConfiguredAdminEmail(email: string, env: Env = process.env): boolean {
  const r = readAdminConfig(env);
  return r.state === "ready" && r.config.email === email.trim().toLowerCase();
}
