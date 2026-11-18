// Platform Monitoring: the overview numbers and the Activity Logs. Administrator only, read-only,
// and built entirely from real rows: the audit log (every sign-in, sign-up, connection, scholarship,
// admin action and moderation step is written there) and the content_reports table.
//
// The Activity Logs show an explicit list of "important" events. Anything not listed (a search, a
// sign-out, a profile edit) is left out so the feed stays readable. Each event is turned into a plain
// sentence; names are looked up from the users table, never taken from the request.

import { getDb } from "./db.server.ts";
import type { PublicUser } from "./auth.server.ts";
import { requireAdmin } from "./admin.server.ts";

export type ActivityCategory = "signins" | "security" | "accounts" | "administration" | "platform" | "moderation";
export const ACTIVITY_CATEGORIES: readonly ActivityCategory[] = ["signins", "security", "accounts", "administration", "platform", "moderation"];

/** The events that count as important platform activity, and which group each belongs to. */
const EVENTS: Record<string, ActivityCategory> = {
  "login.success": "signins",
  "admin.login.success": "signins",

  "login.failed": "security",
  "login.blocked": "security",
  "admin.login.failed": "security",
  "admin.login.blocked": "security",
  "admin.provisioned": "security",
  "admin.password_rotated": "security",
  "admin.role_revoked": "security",
  "admin.password_changed": "security",
  "admin.password_change_failed": "security",
  "admin.session_revoked": "security",
  "admin.sessions_revoked": "security",

  "user.created": "accounts",
  "coach_verification.requested": "accounts",
  "coach_verification.approved": "accounts",
  "coach_verification.rejected": "accounts",

  "admin.user_suspended": "administration",
  "admin.user_reactivated": "administration",
  "admin.rep_approved": "administration",
  "admin.rep_rejected": "administration",
  "admin.profile_updated": "administration",

  "connection.requested": "platform",
  "connection.accepted": "platform",
  "connection.declined": "platform",
  "connection.cancelled": "platform",
  "connection.disconnected": "platform",
  "recruiting.inquiry_sent": "platform",
  "coach_application.sent": "platform",
  "scholarship.created": "platform",
  "scholarship.applied": "platform",
  "scholarship.withdrawn": "platform",
  "scholarship.application_status": "platform",
  "practice_session.verified": "platform",

  "report.submitted": "moderation",
  "report.investigating": "moderation",
  "report.dismissed": "moderation",
  "report.resolved": "moderation",
};
const ALL_EVENTS = Object.keys(EVENTS);
const eventsIn = (cat: ActivityCategory) => ALL_EVENTS.filter((e) => EVENTS[e] === cat);

export interface MonitoringOverview {
  activities: { total: number; last24h: number };
  /** pending = nobody has looked yet; open = pending + investigating */
  reports: { pending: number; investigating: number; resolved: number; dismissed: number };
  /** pieces of content that have at least one open report */
  flaggedContent: number;
}

export async function getMonitoringOverview(actor: Pick<PublicUser, "roles">): Promise<MonitoringOverview> {
  requireAdmin(actor);
  const db = await getDb();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [acts] = await db<{ total: number; last24h: number }[]>`
    SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE created_at > ${since})::int AS last24h
    FROM audit_log WHERE event IN ${db(ALL_EVENTS)}`;
  const counted = await db<{ status: string; n: number }[]>`SELECT status, COUNT(*)::int AS n FROM content_reports GROUP BY status`;
  const by = (s: string) => counted.find((c) => c.status === s)?.n ?? 0;
  const [flagged] = await db<{ n: number }[]>`
    SELECT COUNT(*)::int AS n FROM (
      SELECT DISTINCT target_user_id, content_type FROM content_reports WHERE status IN ('pending', 'investigating')
    ) x`;
  return {
    activities: { total: acts?.total ?? 0, last24h: acts?.last24h ?? 0 },
    reports: { pending: by("pending"), investigating: by("investigating"), resolved: by("resolved"), dismissed: by("dismissed") },
    flaggedContent: flagged?.n ?? 0,
  };
}

/* ------------------------------------------------------------------ activity logs */

export interface ActivityItem {
  id: string;
  at: string;
  category: ActivityCategory;
  /** who it happened to or who did it, as a name; never a password-looking string */
  user: { id: string | null; name: string };
  description: string;
}

interface AuditRow {
  id: string; event: string; user_id: string | null; identifier: string | null; detail: string | null; created_at: Date; display_name: string | null;
}

const ROLE_LABEL: Record<string, string> = {
  student_athlete: "student-athlete",
  coach: "coach",
  university_representative: "school representative",
};
const TYPE_LABEL: Record<string, string> = { athlete_profile: "profile", video: "highlight video", photo: "profile photo" };
const REASON_LABEL: Record<string, string> = {
  inappropriate: "inappropriate content", impersonation: "impersonation", harassment: "harassment",
  spam: "spam", false_information: "false information", other: "another reason",
};
const ACTION_LABEL: Record<string, string> = { remove_content: "removed content", warn_user: "warned the athlete", suspend_account: "suspended the account" };

const parse = (detail: string | null): Record<string, unknown> => {
  if (!detail) return {};
  try {
    const v = JSON.parse(detail);
    return v && typeof v === "object" ? (v as Record<string, unknown>) : {};
  } catch {
    return {};
  }
};
const str = (v: unknown, max = 120): string => (typeof v === "string" ? v.slice(0, max) : "");

/** Names for ids mentioned inside event details (the administrator who acted, the person reported). */
async function namesFor(ids: string[]): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  if (ids.length === 0) return out;
  const db = await getDb();
  const rows = await db<{ id: string; display_name: string }[]>`SELECT id, display_name FROM users WHERE id IN ${db(ids)}`;
  for (const r of rows) out.set(r.id, r.display_name);
  return out;
}

function describe(event: string, d: Record<string, unknown>, names: Map<string, string>): string {
  const by = names.get(str(d["by"], 64)) ?? "an administrator";
  const target = names.get(str(d["targetUserId"], 64)) ?? "an athlete";
  switch (event) {
    case "login.success": return "Signed in";
    case "admin.login.success": return "Signed in to the admin console";
    case "login.failed": return "Failed sign-in attempt";
    case "admin.login.failed": return "Failed administrator sign-in attempt";
    case "login.blocked":
    case "admin.login.blocked": return "Sign-in locked after too many failed attempts";
    case "admin.provisioned": return "Administrator account set up";
    case "admin.password_rotated": return "Administrator password updated";
    case "admin.role_revoked": return "Administrator access removed from this account";
    case "admin.password_changed": return "Changed their password";
    case "admin.password_change_failed": return "Entered the wrong current password while changing their password";
    case "admin.session_revoked": return `Signed out another device${str(d["device"]) ? ` (${str(d["device"])})` : ""}`;
    case "admin.sessions_revoked": return "Signed out all their other devices";
    case "admin.profile_updated": {
      const what = Array.isArray(d["changed"]) ? d["changed"].map((c) => String(c)).join(", ") : "";
      return `Updated their profile${what ? ` (${what})` : ""}`;
    }
    case "user.created": {
      const roles = Array.isArray(d["roles"]) ? d["roles"].map((r) => ROLE_LABEL[String(r)]).filter(Boolean) : [];
      return roles.length ? `Created a ${roles[0]} account` : "Created an account";
    }
    case "coach_verification.requested": return "Requested coach verification";
    case "coach_verification.approved": return "Coach verification approved";
    case "coach_verification.rejected": return "Coach verification rejected";
    case "admin.user_suspended": {
      const reason = str(d["reason"]);
      return `Account suspended by ${by}${reason ? ` (${reason})` : ""}`;
    }
    case "admin.user_reactivated": return `Account reactivated by ${by}`;
    case "admin.rep_approved": return `School representative application approved by ${by}`;
    case "admin.rep_rejected": return `School representative application rejected by ${by}`;
    case "connection.requested": return "Sent a connection request";
    case "connection.accepted": return "Accepted a connection request";
    case "connection.declined": return "Declined a connection request";
    case "connection.cancelled": return "Cancelled a connection request";
    case "connection.disconnected": return "Ended a connection";
    case "recruiting.inquiry_sent": return "Sent a recruiting inquiry";
    case "coach_application.sent": return "Applied to a coach";
    case "scholarship.created": return "Posted a scholarship";
    case "scholarship.applied": return "Applied for a scholarship";
    case "scholarship.withdrawn": return "Withdrew a scholarship application";
    case "scholarship.application_status": return "Updated a scholarship application";
    case "practice_session.verified": return "Verified a practice session";
    case "report.submitted":
      return `Reported ${target}'s ${TYPE_LABEL[str(d["contentType"], 30)] ?? "content"} for ${REASON_LABEL[str(d["reason"], 30)] ?? "review"}`;
    case "report.investigating": return `Started investigating a report about ${target}`;
    case "report.dismissed": return `Dismissed a report about ${target}`;
    case "report.resolved": {
      const acts = Array.isArray(d["actions"]) ? d["actions"].map((a) => ACTION_LABEL[String(a)]).filter(Boolean) : [];
      return `Resolved a report about ${target}${acts.length ? `: ${acts.join(", ")}` : ""}`;
    }
    default: return event;
  }
}

/** Name to show. An unregistered sign-in name is shown only if it looks like an email: people sometimes paste a password there. */
function displayName(r: AuditRow): string {
  if (r.display_name) return r.display_name;
  if (r.identifier && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.identifier)) return r.identifier.slice(0, 80);
  return "Unknown account";
}

const escapeLike = (s: string) => s.replace(/[\\%_]/g, (c) => `\\${c}`);

export async function listActivity(
  actor: Pick<PublicUser, "roles">,
  opts: { category?: ActivityCategory; q?: string; limit?: number; offset?: number } = {},
): Promise<{ items: ActivityItem[]; total: number; counts: Record<ActivityCategory, number> }> {
  requireAdmin(actor);
  const db = await getDb();
  const limit = Math.min(Math.max(Math.trunc(opts.limit ?? 10), 1), 50);
  const offset = Math.max(Math.trunc(opts.offset ?? 0), 0);
  const events = opts.category ? eventsIn(opts.category) : ALL_EVENTS;
  const q = (opts.q ?? "").trim().slice(0, 100);
  const pattern = `%${escapeLike(q)}%`;
  const qF = q ? db`AND (u.display_name ILIKE ${pattern} OR (u.display_name IS NULL AND a.identifier ILIKE ${pattern}))` : db``;

  const rows = await db<AuditRow[]>`
    SELECT a.id::text AS id, a.event, a.user_id, a.identifier, a.detail, a.created_at, u.display_name
    FROM audit_log a LEFT JOIN users u ON u.id = a.user_id
    WHERE a.event IN ${db(events)} ${qF}
    ORDER BY a.created_at DESC, a.id DESC
    LIMIT ${limit} OFFSET ${offset}`;
  const [count] = await db<{ n: number }[]>`
    SELECT COUNT(*)::int AS n FROM audit_log a LEFT JOIN users u ON u.id = a.user_id WHERE a.event IN ${db(events)} ${qF}`;
  const perEvent = await db<{ event: string; n: number }[]>`SELECT event, COUNT(*)::int AS n FROM audit_log WHERE event IN ${db(ALL_EVENTS)} GROUP BY event`;
  const counts = Object.fromEntries(ACTIVITY_CATEGORIES.map((c) => [c, 0])) as Record<ActivityCategory, number>;
  for (const e of perEvent) {
    const cat = EVENTS[e.event];
    if (cat) counts[cat] += e.n;
  }

  const parsed = rows.map((r) => parse(r.detail));
  const ids = new Set<string>();
  for (const d of parsed) for (const k of ["by", "targetUserId"]) if (typeof d[k] === "string") ids.add(d[k] as string);
  const names = await namesFor([...ids].slice(0, 100));

  const items: ActivityItem[] = rows.map((r, i) => ({
    id: r.id,
    at: r.created_at.toISOString(),
    category: EVENTS[r.event] ?? "platform",
    user: { id: r.user_id, name: displayName(r) },
    description: describe(r.event, parsed[i] ?? {}, names),
  }));
  return { items, total: count?.n ?? 0, counts };
}

export const isActivityCategory = (v: string): v is ActivityCategory => (ACTIVITY_CATEGORIES as readonly string[]).includes(v);
