// Data for the Admin Dashboard. Read-only; every function re-checks the caller is the administrator.

import { getDb } from "./db.server.ts";
import { ConnectionError } from "./connections.server.ts";
import type { PublicUser } from "./auth.server.ts";

export function requireAdmin(actor: Pick<PublicUser, "roles">): void {
  if (!actor.roles.includes("admin"))
    throw new ConnectionError(403, "not_an_admin", "Administrator access is required.");
}

export interface AdminOverview {
  users: { students: number; coaches: number; verifiedCoaches: number; universityReps: number; inactive: number };
  /** headline numbers for the four dashboard cards; the administrator is never counted */
  totals: { users: number; athletes: number; schools: number; pending: number; usersThisWeek: number; athletesThisWeek: number };
  /** new accounts per month for the last 6 months, split by role */
  registrations: { month: string; athletes: number; coaches: number; schoolReps: number }[];
  pendingVerifications: number;
  signIns24h: { succeeded: number; failed: number };
  recentActivity: { event: string; identifier: string | null; roles: string[] | null; at: string }[];
}

const ACTIVITY_EVENTS = [
  "admin.login.success", "admin.login.failed", "admin.login.blocked",
  "login.success", "login.failed", "user.created", "logout",
  "admin.provisioned", "admin.password_rotated", "admin.role_revoked",
];

/** `user.created` rows carry { roles: [...] } in their detail; nothing else is read from it. */
function rolesFromDetail(detail: string | null): string[] | null {
  if (!detail) return null;
  try {
    const roles = (JSON.parse(detail) as { roles?: unknown }).roles;
    return Array.isArray(roles) ? roles.filter((r): r is string => typeof r === "string") : null;
  } catch {
    return null;
  }
}

export async function getAdminOverview(actor: Pick<PublicUser, "roles">): Promise<AdminOverview> {
  requireAdmin(actor);
  const db = await getDb();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const roleCounts = await db<{ name: string; n: number }[]>`
    SELECT r.name, COUNT(DISTINCT u.id)::int AS n
    FROM user_roles ur JOIN roles r ON r.id = ur.role_id JOIN users u ON u.id = ur.user_id
    WHERE u.deleted_at IS NULL AND u.is_active = TRUE GROUP BY r.name`;
  const count = (name: string) => roleCounts.find((r) => r.name === name)?.n ?? 0;

  const [inactive] = await db<{ n: number }[]>`SELECT COUNT(*)::int AS n FROM users WHERE is_active = FALSE AND deleted_at IS NULL`;
  const [pending] = await db<{ n: number }[]>`SELECT COUNT(*)::int AS n FROM coach_verifications WHERE status = 'pending'`;
  const [ok] = await db<{ n: number }[]>`
    SELECT COUNT(*)::int AS n FROM audit_log WHERE event IN ('login.success', 'admin.login.success') AND created_at > ${since}`;
  const [bad] = await db<{ n: number }[]>`
    SELECT COUNT(*)::int AS n FROM audit_log WHERE event IN ('login.failed', 'admin.login.failed') AND created_at > ${since}`;
  const recent = await db<{ event: string; identifier: string | null; detail: string | null; created_at: Date }[]>`
    SELECT event, identifier, detail, created_at FROM audit_log WHERE event IN ${db(ACTIVITY_EVENTS)}
    ORDER BY created_at DESC, id DESC LIMIT 10`;

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [totals] = await db<{ users: number; athletes: number; users_week: number; athletes_week: number }[]>`
    SELECT
      COUNT(*) FILTER (WHERE NOT is_admin)::int AS users,
      COUNT(*) FILTER (WHERE is_athlete)::int AS athletes,
      COUNT(*) FILTER (WHERE NOT is_admin AND created_at > ${weekAgo})::int AS users_week,
      COUNT(*) FILTER (WHERE is_athlete AND created_at > ${weekAgo})::int AS athletes_week
    FROM (
      SELECT u.created_at,
             EXISTS (SELECT 1 FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = u.id AND r.name = 'admin') AS is_admin,
             EXISTS (SELECT 1 FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = u.id AND r.name = 'student_athlete') AS is_athlete
      FROM users u WHERE u.deleted_at IS NULL
    ) x`;
  const [schools] = await db<{ n: number }[]>`SELECT COUNT(*)::int AS n FROM universities`;
  const months = await db<{ month: string; athletes: number; coaches: number; school_reps: number }[]>`
    SELECT to_char(m, 'Mon') AS month,
           COUNT(DISTINCT u.id) FILTER (WHERE r.name = 'student_athlete')::int AS athletes,
           COUNT(DISTINCT u.id) FILTER (WHERE r.name = 'coach')::int AS coaches,
           COUNT(DISTINCT u.id) FILTER (WHERE r.name = 'university_representative')::int AS school_reps
    FROM generate_series(date_trunc('month', now()) - interval '5 months', date_trunc('month', now()), interval '1 month') AS m
    LEFT JOIN users u ON date_trunc('month', u.created_at) = m AND u.deleted_at IS NULL
    LEFT JOIN user_roles ur ON ur.user_id = u.id
    LEFT JOIN roles r ON r.id = ur.role_id
    GROUP BY m ORDER BY m`;

  return {
    totals: {
      users: totals?.users ?? 0,
      athletes: totals?.athletes ?? 0,
      schools: schools?.n ?? 0,
      pending: pending?.n ?? 0,
      usersThisWeek: totals?.users_week ?? 0,
      athletesThisWeek: totals?.athletes_week ?? 0,
    },
    registrations: months.map((m) => ({ month: m.month, athletes: m.athletes, coaches: m.coaches, schoolReps: m.school_reps })),
    users: {
      students: count("student_athlete"),
      coaches: count("coach"),
      verifiedCoaches: count("verified_coach"),
      universityReps: count("university_representative"),
      inactive: inactive?.n ?? 0,
    },
    pendingVerifications: pending?.n ?? 0,
    signIns24h: { succeeded: ok?.n ?? 0, failed: bad?.n ?? 0 },
    recentActivity: recent.map((r) => ({ event: r.event, identifier: r.identifier, roles: rolesFromDetail(r.detail), at: r.created_at.toISOString() })),
  };
}
