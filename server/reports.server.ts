// Content reports and their moderation.
//
//  - Any signed-in user (not the administrator) can report an athlete's profile, highlight video or
//    profile photo: fileReport. The content has to exist, you can't report yourself, you can't file
//    the same open report twice, and there is a daily limit.
//  - Only the administrator can look at reports and act on them (Platform Monitoring):
//        investigate  pending -> investigating
//        dismiss      pending | investigating -> dismissed          (an invalid report; nothing is changed)
//        resolve      pending | investigating -> resolved           (with one or more moderation actions)
//  - Moderation actions reuse what already exists. They never touch roles, role permissions or any
//    verification (coach_verifications, rep_applications):
//        remove_content   video / photo -> its existing status becomes 'rejected'; profile -> biography is cleared
//        warn_user        an in-app notification to the athlete
//        suspend_account  the same switch as User Management (is_active = false, signed out everywhere)
//  - Every step is written to the audit log, which is what the Activity Logs section reads.

import { randomUUID } from "node:crypto";
import { getDb, type Db } from "./db.server.ts";
import { audit, type PublicUser, type RequestMeta } from "./auth.server.ts";
import { ConnectionError, PAGE_DEFAULT, PAGE_MAX } from "./connections.server.ts";
import { notify } from "./notifications.server.ts";
import { requireAdmin } from "./admin.server.ts";

export const CONTENT_TYPES = ["athlete_profile", "video", "photo"] as const;
export type ContentType = (typeof CONTENT_TYPES)[number];
export const REASONS = ["inappropriate", "impersonation", "harassment", "spam", "false_information", "other"] as const;
export type Reason = (typeof REASONS)[number];
export const REPORT_STATUSES = ["pending", "investigating", "resolved", "dismissed"] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];
export const MODERATION_ACTIONS = ["remove_content", "warn_user", "suspend_account"] as const;
export type ModerationAction = (typeof MODERATION_ACTIONS)[number];

const DETAILS_MAX = 500;
const NOTE_MAX = 500;
const MESSAGE_MIN = 3;
const MESSAGE_MAX = 300;
const DAILY_LIMIT = 10;

const bad = (message: string, fieldErrors?: Record<string, string>) =>
  new ConnectionError(400, "validation", message, fieldErrors ? { fieldErrors } : undefined);

const isUniqueViolation = (err: unknown) => (err as { code?: string } | null)?.code === "23505";

/* ------------------------------------------------------------------ filing a report */

export async function fileReport(
  actor: Pick<PublicUser, "id" | "roles">,
  raw: unknown,
  meta: RequestMeta,
): Promise<{ id: string; status: "pending" }> {
  if (actor.roles.includes("admin")) throw new ConnectionError(403, "not_allowed", "Administrators review reports, they don't file them.");
  const body = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};

  const athleteId = typeof body["athleteId"] === "string" ? body["athleteId"].trim() : "";
  if (!athleteId || athleteId.length > 64) throw bad("Choose who you are reporting.");
  const contentType = body["contentType"];
  if (typeof contentType !== "string" || !(CONTENT_TYPES as readonly string[]).includes(contentType))
    throw bad("Choose what you are reporting.", { contentType: "Choose what you are reporting." });
  const reason = body["reason"];
  if (typeof reason !== "string" || !(REASONS as readonly string[]).includes(reason))
    throw bad("Choose a reason.", { reason: "Choose a reason." });
  const detailsRaw = body["details"];
  if (detailsRaw !== undefined && typeof detailsRaw !== "string") throw bad("Details must be text.");
  const details = (typeof detailsRaw === "string" ? detailsRaw : "").trim();
  if (details.length > DETAILS_MAX) throw bad(`Details can be up to ${DETAILS_MAX} characters.`, { details: `Keep it under ${DETAILS_MAX} characters.` });
  if (athleteId === actor.id) throw bad("You can't report your own profile.");

  const db = await getDb();
  // Only a real, active student-athlete can be reported (never the administrator or any other role).
  const [target] = await db<{ id: string }[]>`
    SELECT u.id FROM users u
    WHERE u.id = ${athleteId} AND u.deleted_at IS NULL AND u.is_active = TRUE
      AND EXISTS (SELECT 1 FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = u.id AND r.name = 'student_athlete')
      AND NOT EXISTS (SELECT 1 FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = u.id AND r.name = 'admin')`;
  if (!target) throw new ConnectionError(404, "athlete_not_found", "That athlete could not be found.");

  // What exactly is being reported must exist, and we keep the reported text as evidence.
  let snapshot: string | null = null;
  if (contentType === "athlete_profile") {
    const [p] = await db<{ bio: string }[]>`SELECT bio FROM athlete_profiles WHERE user_id = ${athleteId}`;
    snapshot = p?.bio ? p.bio.slice(0, 1000) : null;
  } else if (contentType === "video") {
    const [x] = await db<{ video_url: string | null }[]>`SELECT video_url FROM athlete_extras WHERE user_id = ${athleteId}`;
    if (!x?.video_url) throw new ConnectionError(409, "no_content", "This athlete hasn't shared a highlight video.");
    snapshot = x.video_url;
  } else {
    const [x] = await db<{ has: boolean }[]>`SELECT (photo_data IS NOT NULL) AS has FROM athlete_extras WHERE user_id = ${athleteId}`;
    if (!x?.has) throw new ConnectionError(409, "no_content", "This athlete hasn't set a profile photo.");
  }

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [recent] = await db<{ n: number }[]>`SELECT COUNT(*)::int AS n FROM content_reports WHERE reporter_id = ${actor.id} AND created_at > ${since}`;
  if ((recent?.n ?? 0) >= DAILY_LIMIT)
    throw new ConnectionError(429, "rate_limited", "You've sent a lot of reports today. Please try again tomorrow.");

  const id = randomUUID();
  try {
    await db`
      INSERT INTO content_reports (id, reporter_id, target_user_id, content_type, reason, details, snapshot, status, created_at)
      VALUES (${id}, ${actor.id}, ${athleteId}, ${contentType}, ${reason}, ${details}, ${snapshot}, 'pending', ${new Date()})`;
  } catch (err) {
    if (isUniqueViolation(err)) throw new ConnectionError(409, "already_reported", "You've already reported this. We're looking into it.");
    throw err;
  }
  await audit("report.submitted", { userId: actor.id, ...meta, detail: { reportId: id, targetUserId: athleteId, contentType, reason } }, db);
  return { id, status: "pending" };
}

/* ------------------------------------------------------------------ the administrator's side */

export interface ReportSummary {
  id: string;
  contentType: ContentType;
  reason: Reason;
  status: ReportStatus;
  createdAt: string;
  details: string;
  reporter: { id: string; name: string } | null;
  target: { id: string; name: string; suspended: boolean };
}

export type ReportContent =
  | { kind: "athlete_profile"; bio: string; sport: string; position: string; school: string }
  | { kind: "video"; url: string | null; status: string | null }
  | { kind: "photo"; dataUrl: string | null; status: string | null };

export interface ReportDetail extends ReportSummary {
  snapshot: string | null;
  content: ReportContent;
  reporterEmail: string | null;
  targetEmail: string;
  otherReports: { total: number; open: number };
  investigatedBy: string | null;
  investigatedAt: string | null;
  resolvedBy: string | null;
  resolvedAt: string | null;
  actions: ModerationAction[];
  resolutionNote: string;
}

interface Row {
  id: string; content_type: ContentType; reason: Reason; status: ReportStatus; created_at: Date; details: string;
  reporter_id: string | null; reporter_name: string | null; target_id: string; target_name: string; target_active: boolean;
}

const toSummary = (r: Row): ReportSummary => ({
  id: r.id,
  contentType: r.content_type,
  reason: r.reason,
  status: r.status,
  createdAt: r.created_at.toISOString(),
  details: r.details,
  reporter: r.reporter_id ? { id: r.reporter_id, name: r.reporter_name ?? "Unknown" } : null,
  target: { id: r.target_id, name: r.target_name, suspended: !r.target_active },
});

const SELECT = (db: Db) => db`
  SELECT r.id, r.content_type, r.reason, r.status, r.created_at, r.details,
         rp.id AS reporter_id, rp.display_name AS reporter_name,
         t.id AS target_id, t.display_name AS target_name, t.is_active AS target_active
  FROM content_reports r
  LEFT JOIN users rp ON rp.id = r.reporter_id
  JOIN users t ON t.id = r.target_user_id`;

const notFound = () => new ConnectionError(404, "report_not_found", "That report could not be found.");

export async function listReports(
  actor: Pick<PublicUser, "roles">,
  opts: { status?: ReportStatus; type?: ContentType; limit?: number; offset?: number } = {},
): Promise<{ items: ReportSummary[]; total: number; counts: Record<ReportStatus, number> }> {
  requireAdmin(actor);
  const db = await getDb();
  const limit = Math.min(Math.max(Math.trunc(opts.limit ?? PAGE_DEFAULT), 1), PAGE_MAX);
  const offset = Math.max(Math.trunc(opts.offset ?? 0), 0);
  const statusF = opts.status ? db`AND r.status = ${opts.status}` : db``;
  const typeF = opts.type ? db`AND r.content_type = ${opts.type}` : db``;

  // Open reports first, the one waiting longest on top; closed reports newest first.
  const rows = await db<Row[]>`
    ${SELECT(db)} WHERE TRUE ${statusF} ${typeF}
    ORDER BY (r.status IN ('pending', 'investigating')) DESC,
             CASE WHEN r.status IN ('pending', 'investigating') THEN r.created_at END ASC,
             r.created_at DESC, r.id
    LIMIT ${limit} OFFSET ${offset}`;
  const [count] = await db<{ n: number }[]>`SELECT COUNT(*)::int AS n FROM content_reports r WHERE TRUE ${statusF} ${typeF}`;
  const counted = await db<{ status: ReportStatus; n: number }[]>`
    SELECT r.status, COUNT(*)::int AS n FROM content_reports r WHERE TRUE ${typeF} GROUP BY r.status`;
  const counts: Record<ReportStatus, number> = { pending: 0, investigating: 0, resolved: 0, dismissed: 0 };
  for (const c of counted) counts[c.status] = c.n;
  return { items: rows.map(toSummary), total: count?.n ?? 0, counts };
}

const PHOTO_OK = /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/;

export async function getReport(actor: Pick<PublicUser, "roles">, id: string): Promise<ReportDetail> {
  requireAdmin(actor);
  const db = await getDb();
  const [row] = await db<Row[]>`${SELECT(db)} WHERE r.id = ${id}`;
  if (!row) throw notFound();
  const [more] = await db<{
    snapshot: string | null; actions: ModerationAction[]; resolution_note: string; investigated_at: Date | null; resolved_at: Date | null;
    investigator: string | null; resolver: string | null; reporter_email: string | null; target_email: string;
  }[]>`
    SELECT r.snapshot, r.actions, r.resolution_note, r.investigated_at, r.resolved_at,
           iv.display_name AS investigator, rv.display_name AS resolver, rp.email AS reporter_email, t.email AS target_email
    FROM content_reports r
    JOIN users t ON t.id = r.target_user_id
    LEFT JOIN users rp ON rp.id = r.reporter_id
    LEFT JOIN users iv ON iv.id = r.investigated_by
    LEFT JOIN users rv ON rv.id = r.resolved_by
    WHERE r.id = ${id}`;
  const [cur] = await db<{
    bio: string | null; sport: string | null; position: string | null; school: string | null;
    video_url: string | null; video_status: string | null; photo_data: string | null; photo_status: string | null;
  }[]>`
    SELECT ap.bio, ap.sport, ap.playing_position AS position, ap.school, ex.video_url, ex.video_status, ex.photo_data, ex.photo_status
    FROM users u
    LEFT JOIN athlete_profiles ap ON ap.user_id = u.id
    LEFT JOIN athlete_extras ex ON ex.user_id = u.id
    WHERE u.id = ${row.target_id}`;
  const [others] = await db<{ total: number; open: number }[]>`
    SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE status IN ('pending', 'investigating'))::int AS open
    FROM content_reports WHERE target_user_id = ${row.target_id} AND id <> ${id}`;

  const content: ReportContent =
    row.content_type === "video"
      ? { kind: "video", url: cur?.video_url ?? null, status: cur?.video_status ?? null }
      : row.content_type === "photo"
        ? { kind: "photo", dataUrl: cur?.photo_data && cur.photo_data.length <= 400_000 && PHOTO_OK.test(cur.photo_data) ? cur.photo_data : null, status: cur?.photo_status ?? null }
        : { kind: "athlete_profile", bio: cur?.bio ?? "", sport: cur?.sport ?? "", position: cur?.position ?? "", school: cur?.school ?? "" };

  return {
    ...toSummary(row),
    snapshot: more?.snapshot ?? null,
    content,
    reporterEmail: more?.reporter_email ?? null,
    targetEmail: more?.target_email ?? "",
    otherReports: { total: others?.total ?? 0, open: others?.open ?? 0 },
    investigatedBy: more?.investigator ?? null,
    investigatedAt: more?.investigated_at ? more.investigated_at.toISOString() : null,
    resolvedBy: more?.resolver ?? null,
    resolvedAt: more?.resolved_at ? more.resolved_at.toISOString() : null,
    actions: more?.actions ?? [],
    resolutionNote: more?.resolution_note ?? "",
  };
}

type Locked = { status: ReportStatus; target_user_id: string; content_type: ContentType };

async function lockOpenReport(tx: Db, id: string, allowInvestigating: boolean): Promise<Locked> {
  const [r] = await tx<Locked[]>`SELECT status, target_user_id, content_type FROM content_reports WHERE id = ${id} FOR UPDATE`;
  if (!r) throw notFound();
  const ok = r.status === "pending" || (allowInvestigating && r.status === "investigating");
  if (!ok) throw new ConnectionError(409, "report_closed", r.status === "investigating" ? "This report is already being investigated." : "This report was already closed.");
  return r;
}

export async function investigateReport(actor: Pick<PublicUser, "id" | "roles">, id: string, meta: RequestMeta): Promise<ReportDetail> {
  requireAdmin(actor);
  const db = await getDb();
  await db.begin(async (txRaw) => {
    const tx = txRaw as unknown as Db;
    const [r] = await tx<Locked[]>`SELECT status, target_user_id, content_type FROM content_reports WHERE id = ${id} FOR UPDATE`;
    if (!r) throw notFound();
    if (r.status === "investigating") return; // opening it again is fine
    if (r.status !== "pending") throw new ConnectionError(409, "report_closed", "This report was already closed.");
    await tx`UPDATE content_reports SET status = 'investigating', investigated_by = ${actor.id}, investigated_at = ${new Date()} WHERE id = ${id}`;
    await audit("report.investigating", { userId: actor.id, ...meta, detail: { reportId: id, targetUserId: r.target_user_id } }, tx);
  });
  return getReport(actor, id);
}

function cleanNote(input: unknown): string {
  if (input === undefined || input === null) return "";
  if (typeof input !== "string") throw bad("The note must be text.");
  const note = input.trim();
  if (note.length > NOTE_MAX) throw bad(`The note can be up to ${NOTE_MAX} characters.`, { note: `Keep it under ${NOTE_MAX} characters.` });
  return note;
}

export async function dismissReport(actor: Pick<PublicUser, "id" | "roles">, id: string, noteInput: unknown, meta: RequestMeta): Promise<ReportDetail> {
  requireAdmin(actor);
  const note = cleanNote(noteInput);
  const db = await getDb();
  await db.begin(async (txRaw) => {
    const tx = txRaw as unknown as Db;
    const r = await lockOpenReport(tx, id, true);
    await tx`
      UPDATE content_reports SET status = 'dismissed', resolved_by = ${actor.id}, resolved_at = ${new Date()}, resolution_note = ${note}
      WHERE id = ${id}`;
    await audit("report.dismissed", { userId: actor.id, ...meta, detail: { reportId: id, targetUserId: r.target_user_id, ...(note ? { note } : {}) } }, tx);
  });
  return getReport(actor, id);
}

export async function resolveReport(
  actor: Pick<PublicUser, "id" | "roles">,
  id: string,
  raw: unknown,
  meta: RequestMeta,
): Promise<{ report: ReportDetail; effects: string[] }> {
  requireAdmin(actor);
  const body = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};

  const list = body["actions"];
  if (!Array.isArray(list) || list.length === 0) throw bad("Choose at least one action.", { actions: "Choose at least one action." });
  const actions: ModerationAction[] = [];
  for (const a of list) {
    if (typeof a !== "string" || !(MODERATION_ACTIONS as readonly string[]).includes(a)) throw bad("That action isn't available.", { actions: "That action isn't available." });
    if (!actions.includes(a as ModerationAction)) actions.push(a as ModerationAction);
  }
  const note = cleanNote(body["note"]);
  let message = "";
  if (actions.includes("warn_user")) {
    message = typeof body["message"] === "string" ? body["message"].trim() : "";
    if (message.length < MESSAGE_MIN || message.length > MESSAGE_MAX)
      throw bad(`Write the warning the athlete will read (${MESSAGE_MIN} to ${MESSAGE_MAX} characters).`, { message: "A warning message is required." });
  }

  const db = await getDb();
  const effects: string[] = [];
  const ts = new Date();
  await db.begin(async (txRaw) => {
    const tx = txRaw as unknown as Db;
    const r = await lockOpenReport(tx, id, true);
    const target = r.target_user_id;

    if (actions.includes("remove_content")) {
      if (r.content_type === "video") {
        const rows = await tx`UPDATE athlete_extras SET video_status = 'rejected', updated_at = ${ts} WHERE user_id = ${target} AND video_url IS NOT NULL RETURNING user_id`;
        effects.push(rows.length ? "Video marked as rejected" : "The video was already removed");
      } else if (r.content_type === "photo") {
        const rows = await tx`UPDATE athlete_extras SET photo_status = 'rejected', updated_at = ${ts} WHERE user_id = ${target} AND photo_data IS NOT NULL RETURNING user_id`;
        effects.push(rows.length ? "Profile photo marked as rejected" : "The photo was already removed");
      } else {
        await tx`UPDATE athlete_profiles SET bio = '', updated_at = ${ts} WHERE user_id = ${target}`;
        effects.push("Biography cleared");
      }
    }
    if (actions.includes("warn_user")) {
      await notify(target, { category: "system", title: "A report about your profile was reviewed", message }, tx);
      effects.push("Athlete warned");
    }
    if (actions.includes("suspend_account")) {
      const rows = await tx`UPDATE users SET is_active = FALSE, updated_at = ${ts} WHERE id = ${target} AND is_active = TRUE RETURNING id`;
      if (rows.length) {
        await tx`DELETE FROM sessions WHERE user_id = ${target}`;
        // Same event User Management writes, so the account's history there shows why.
        await audit("admin.user_suspended", { userId: target, ...meta, detail: { by: actor.id, reason: `Moderation: report ${id}`, reportId: id } }, tx);
        effects.push("Account suspended");
      } else effects.push("The account was already suspended");
    }

    await tx`
      UPDATE content_reports SET status = 'resolved', resolved_by = ${actor.id}, resolved_at = ${ts}, actions = ${actions}, resolution_note = ${note}
      WHERE id = ${id}`;
    await audit("report.resolved", { userId: actor.id, ...meta, detail: { reportId: id, targetUserId: target, actions, ...(note ? { note } : {}) } }, tx);
  });
  return { report: await getReport(actor, id), effects };
}
