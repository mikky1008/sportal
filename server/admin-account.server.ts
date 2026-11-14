// Creates and maintains the one predefined administrator account from the ADMIN_* environment
// variables (see admin-config.server.ts). Runs once per server process, before the first request
// is handled, so the administrator's email and username are claimed before anyone can sign up
// with them.
//
// What it guarantees, all inside one transaction under an advisory lock (two cold-starting
// serverless instances never race):
//  - the account exists, holds the `admin` role, and its password matches ADMIN_PASSWORD
//    (change the variable and redeploy to rotate the password; the old sessions are revoked);
//  - NO other account holds the `admin` role. Anything that does is stripped and signed out, so the
//    environment variables are the only way to be an administrator;
//  - it fails closed: if ADMIN_EMAIL belongs to an ordinary account, nothing is promoted.
//
// It never logs or returns the password.

import { randomUUID } from "node:crypto";
import { getDb, type Db } from "./db.server.ts";
import { readAdminConfig } from "./admin-config.server.ts";
import { audit } from "./auth.server.ts";
import { hashPassword, verifyPassword } from "./password.server.ts";

const ADMIN_LOCK_ID = 727_274_002;

export type AdminProvisionResult =
  | { state: "disabled"; reason: string }
  | { state: "ready"; created: boolean; passwordChanged: boolean; revokedOthers: number };

interface ExistingRow {
  id: string;
  username: string;
  password_hash: string;
}

export async function provisionAdminAccount(dbArg?: Db, env: Record<string, string | undefined> = process.env): Promise<AdminProvisionResult> {
  const cfgResult = readAdminConfig(env);
  if (cfgResult.state === "not_configured") return { state: "disabled", reason: "ADMIN_EMAIL and ADMIN_PASSWORD are not set." };
  if (cfgResult.state === "invalid") return { state: "disabled", reason: cfgResult.problem };
  const cfg = cfgResult.config;

  const db = dbArg ?? (await getDb());
  return db.begin(async (tx): Promise<AdminProvisionResult> => {
    await tx`SELECT pg_advisory_xact_lock(${ADMIN_LOCK_ID})`;
    const ts = new Date();

    const [role] = await tx<{ id: number }[]>`SELECT id FROM roles WHERE name = 'admin'`;
    if (!role) return { state: "disabled", reason: "The admin role does not exist in the database." };

    const [existing] = await tx<ExistingRow[]>`
      SELECT id, username, password_hash FROM users WHERE lower(email) = ${cfg.email} AND deleted_at IS NULL`;

    let adminId: string;
    let created = false;
    let passwordChanged = false;

    if (!existing) {
      const [nameTaken] = await tx`SELECT 1 AS x FROM users WHERE lower(username) = ${cfg.username.toLowerCase()}`;
      if (nameTaken) return { state: "disabled", reason: `ADMIN_USERNAME "${cfg.username}" is already used by another account. Choose a different one.` };
      adminId = randomUUID();
      const hash = await hashPassword(cfg.password);
      await tx`
        INSERT INTO users (id, email, username, password_hash, display_name, password_changed_at, created_at, updated_at)
        VALUES (${adminId}, ${cfg.email}, ${cfg.username}, ${hash}, ${cfg.displayName}, ${ts}, ${ts}, ${ts})`;
      await tx`INSERT INTO user_profiles (user_id, first_name, last_name, updated_at) VALUES (${adminId}, NULL, NULL, ${ts})`;
      await tx`INSERT INTO user_roles (user_id, role_id, granted_at) VALUES (${adminId}, ${role.id}, ${ts})`;
      await audit("admin.provisioned", { userId: adminId }, tx as unknown as Db);
      created = true;
    } else {
      adminId = existing.id;
      const [holdsRole] = await tx`SELECT 1 AS x FROM user_roles WHERE user_id = ${adminId} AND role_id = ${role.id}`;
      // Fail closed: an ordinary account that happens to use this email is never promoted.
      if (!holdsRole)
        return { state: "disabled", reason: "ADMIN_EMAIL belongs to an existing non-administrator account. Use an email address that nobody has registered with." };

      if (!(await verifyPassword(cfg.password, existing.password_hash))) {
        await tx`UPDATE users SET password_hash = ${await hashPassword(cfg.password)}, password_changed_at = ${ts}, updated_at = ${ts} WHERE id = ${adminId}`;
        await tx`DELETE FROM sessions WHERE user_id = ${adminId}`;
        await audit("admin.password_rotated", { userId: adminId }, tx as unknown as Db);
        passwordChanged = true;
      }
      if (existing.username.toLowerCase() !== cfg.username.toLowerCase()) {
        const [nameTaken] = await tx`SELECT 1 AS x FROM users WHERE lower(username) = ${cfg.username.toLowerCase()} AND id <> ${adminId}`;
        if (!nameTaken) await tx`UPDATE users SET username = ${cfg.username}, updated_at = ${ts} WHERE id = ${adminId}`;
      }
    }

    // The environment is the single source of truth: nobody else may hold the administrator role.
    const others = await tx<{ user_id: string }[]>`
      DELETE FROM user_roles WHERE role_id = ${role.id} AND user_id <> ${adminId} RETURNING user_id`;
    for (const o of others) {
      await tx`DELETE FROM sessions WHERE user_id = ${o.user_id}`;
      await audit("admin.role_revoked", { userId: o.user_id, detail: { reason: "not the configured administrator" } }, tx as unknown as Db);
    }

    return { state: "ready", created, passwordChanged, revokedOthers: others.length };
  });
}

let started: Promise<void> | undefined;

/**
 * Called by the request handler. Provisions once per process and then does nothing. A failure
 * (database waking up) is retried on the next request instead of being cached.
 */
export function ensureAdminAccount(): Promise<void> {
  started ??= (async () => {
    const result = await provisionAdminAccount();
    if (result.state === "disabled") {
      // One line, no secrets. Administrator sign-in stays off until this is fixed.
      console.warn(`[admin] administrator sign-in is disabled: ${result.reason}`);
    } else if (result.created) {
      console.log("[admin] administrator account created from ADMIN_EMAIL.");
    } else if (result.passwordChanged) {
      console.log("[admin] administrator password updated from ADMIN_PASSWORD.");
    }
    if (result.state === "ready" && result.revokedOthers > 0)
      console.warn(`[admin] removed the administrator role from ${result.revokedOthers} other account(s).`);
  })().catch((err) => {
    started = undefined;
    throw err;
  });
  return started;
}

/** For tests: forget that provisioning ran so the next request runs it again. */
export function resetAdminProvisioningForTests(): void {
  started = undefined;
}
