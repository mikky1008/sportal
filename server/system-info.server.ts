// "System Information" in the administrator's Settings: a read-only look at the platform, measured live.
//
// It only reports facts that are safe to show an administrator: versions, database health, how much
// is on the platform, and the security rules in force. It never includes a connection string, a host
// name, a secret or any environment value other than the deployment's name and region.

import { getDb } from "./db.server.ts";
import type { PublicUser } from "./auth.server.ts";
import { ADMIN_SESSION_TTL_MS, RATE_LIMIT, REMEMBER_TTL_MS, SESSION_TTL_MS } from "./auth.server.ts";
import { requireAdmin } from "./admin.server.ts";
import { ADMIN_PASSWORD_MIN } from "./admin-config.server.ts";
import { PASSWORD_RULES } from "./password.server.ts";
import pkg from "../package.json" with { type: "json" };

const STARTED_AT = Date.now();

export interface SystemInfo {
  application: {
    name: string;
    version: string;
    environment: string;
    runtime: string;
    region: string | null;
    serverTime: string;
    startedAt: string;
    uptimeSeconds: number;
  };
  database: {
    engine: string;
    reachable: boolean;
    latencyMs: number;
    sizeBytes: number | null;
    schemaVersion: number;
    migrationsApplied: number;
  };
  platform: {
    users: number;
    athletes: number;
    coaches: number;
    schoolRepresentatives: number;
    suspendedAccounts: number;
    schools: number;
    scholarships: number;
    openReports: number;
    activeSessions: number;
    activityEvents: number;
  };
  security: {
    adminSessionHours: number;
    userSessionHours: number;
    rememberDays: number;
    adminPasswordMinLength: number;
    userPasswordMinLength: number;
    lockoutAttempts: number;
    lockoutMinutes: number;
    adminAccountSource: string;
  };
}

export async function getSystemInfo(actor: Pick<PublicUser, "roles">): Promise<SystemInfo> {
  requireAdmin(actor);
  const db = await getDb();

  const t0 = performance.now();
  const [ver] = await db<{ v: string }[]>`SELECT version() AS v`;
  const latencyMs = Math.max(1, Math.round(performance.now() - t0));
  const engine = /^PostgreSQL\s+[\d.]+/.exec(ver?.v ?? "")?.[0] ?? "PostgreSQL";
  const [size] = await db<{ n: string | null }[]>`SELECT pg_database_size(current_database())::text AS n`;
  const [mig] = await db<{ v: number | null; n: number }[]>`SELECT MAX(version)::int AS v, COUNT(*)::int AS n FROM schema_migrations`;

  const [p] = await db<{
    users: number; athletes: number; coaches: number; reps: number; suspended: number; schools: number; scholarships: number;
    open_reports: number; sessions: number; events: number;
  }[]>`
    WITH people AS (
      SELECT u.id, u.is_active,
             ARRAY(SELECT r.name FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = u.id) AS roles
      FROM users u WHERE u.deleted_at IS NULL
    )
    SELECT
      (SELECT COUNT(*) FROM people WHERE NOT ('admin' = ANY(roles)))::int AS users,
      (SELECT COUNT(*) FROM people WHERE 'student_athlete' = ANY(roles))::int AS athletes,
      (SELECT COUNT(*) FROM people WHERE roles && ARRAY['coach', 'verified_coach'])::int AS coaches,
      (SELECT COUNT(*) FROM people WHERE 'university_representative' = ANY(roles))::int AS reps,
      (SELECT COUNT(*) FROM people WHERE NOT is_active AND NOT ('admin' = ANY(roles)))::int AS suspended,
      (SELECT COUNT(*) FROM universities)::int AS schools,
      (SELECT COUNT(*) FROM scholarships)::int AS scholarships,
      (SELECT COUNT(*) FROM content_reports WHERE status IN ('pending', 'investigating'))::int AS open_reports,
      (SELECT COUNT(*) FROM sessions WHERE revoked_at IS NULL AND expires_at > now())::int AS sessions,
      (SELECT COUNT(*) FROM audit_log)::int AS events`;

  const now = Date.now();
  return {
    application: {
      name: "Sportal",
      version: pkg.version,
      environment: process.env["VERCEL_ENV"] ?? process.env["NODE_ENV"] ?? "development",
      runtime: `Node.js ${process.version.replace(/^v/, "")}`,
      region: process.env["VERCEL_REGION"] ?? null,
      serverTime: new Date(now).toISOString(),
      startedAt: new Date(STARTED_AT).toISOString(),
      uptimeSeconds: Math.floor((now - STARTED_AT) / 1000),
    },
    database: {
      engine,
      reachable: true,
      latencyMs,
      sizeBytes: size?.n ? Number(size.n) : null,
      schemaVersion: mig?.v ?? 0,
      migrationsApplied: mig?.n ?? 0,
    },
    platform: {
      users: p?.users ?? 0,
      athletes: p?.athletes ?? 0,
      coaches: p?.coaches ?? 0,
      schoolRepresentatives: p?.reps ?? 0,
      suspendedAccounts: p?.suspended ?? 0,
      schools: p?.schools ?? 0,
      scholarships: p?.scholarships ?? 0,
      openReports: p?.open_reports ?? 0,
      activeSessions: p?.sessions ?? 0,
      activityEvents: p?.events ?? 0,
    },
    security: {
      adminSessionHours: ADMIN_SESSION_TTL_MS / 3_600_000,
      userSessionHours: SESSION_TTL_MS / 3_600_000,
      rememberDays: REMEMBER_TTL_MS / 86_400_000,
      adminPasswordMinLength: ADMIN_PASSWORD_MIN,
      userPasswordMinLength: PASSWORD_RULES.min,
      lockoutAttempts: RATE_LIMIT.maxFailuresPerIdentifier,
      lockoutMinutes: RATE_LIMIT.windowMs / 60_000,
      adminAccountSource: "Server environment variables (ADMIN_EMAIL, ADMIN_PASSWORD)",
    },
  };
}
