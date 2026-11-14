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
  pendingVerifications: number;
  signIns24h: { succeeded: number; failed: number };
  recentActivity: { event: string; identifier: string | null; at: string }[];
}

const ACTIVITY_EVENTS = [
  "admin.login.success", "admin.login.failed", "admin.login.blocked",
  "login.success", "login.failed", "user.created", "logout",
  "admin.provisioned", "admin.password_rotated", "admin.role_revoked",
];

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
  const recent = await db<{ event: string; identifier: string | null; created_at: Date }[]>`
    SELECT event, identifier, created_at FROM audit_log WHERE event IN ${db(ACTIVITY_EVENTS)}
    ORDER BY created_at DESC, id DESC LIMIT 10`;

  return {
    users: {
      students: count("student_athlete"),
      coaches: count("coach"),
      verifiedCoaches: count("verified_coach"),
      universityReps: count("university_representative"),
      inactive: inactive?.n ?? 0,
    },
    pendingVerifications: pending?.n ?? 0,
    signIns24h: { succeeded: ok?.n ?? 0, failed: bad?.n ?? 0 },
    recentActivity: recent.map((r) => ({ event: r.event, identifier: r.identifier, at: r.created_at.toISOString() })),
  };
}
