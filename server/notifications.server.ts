// In-app notifications.
//
// SERVER ONLY. Works on the `notifications` table (migration 6 in db.server.ts). Notifications are
// created by the server when something happens (see `notify`), never by a client, and a user can
// only ever read or mark their own.

import { randomUUID } from "node:crypto";
import { getDb, type Db } from "./db.server.ts";
import type { PublicUser } from "./auth.server.ts";

export const NOTIFICATION_CATEGORIES = [
  "analysis", "ranking", "recruitment", "scholarship", "application", "verification", "connection", "system",
] as const;
export type NotificationCategory = (typeof NOTIFICATION_CATEGORIES)[number];

export const NOTIF_PAGE_DEFAULT = 30;
export const NOTIF_PAGE_MAX = 100;

export class NotificationError extends Error {
  readonly httpStatus: number;
  readonly code: string;
  constructor(httpStatus: number, code: string, message: string) {
    super(message);
    this.httpStatus = httpStatus;
    this.code = code;
  }
}

export interface NotificationView {
  id: string;
  category: NotificationCategory;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  createdAt: string;
}

interface Row {
  id: string;
  category: NotificationCategory;
  title: string;
  message: string;
  link: string | null;
  created_at: Date;
  read_at: Date | null;
}

const toView = (r: Row): NotificationView => ({
  id: r.id,
  category: r.category,
  title: r.title,
  message: r.message,
  link: r.link,
  read: r.read_at !== null,
  createdAt: r.created_at.toISOString(),
});

/** Creates a notification for one user. Pass `db` (or a transaction) to make it part of a bigger change. */
export async function notify(
  userId: string,
  n: { category: NotificationCategory; title: string; message: string; link?: string },
  dbArg?: Db,
): Promise<void> {
  const db = dbArg ?? (await getDb());
  await db`
    INSERT INTO notifications (id, user_id, category, title, message, link, created_at)
    VALUES (${randomUUID()}, ${userId}, ${n.category}, ${n.title.slice(0, 120)}, ${n.message.slice(0, 500)},
            ${n.link ?? null}, ${new Date()})`;
}

export async function listNotifications(
  user: PublicUser,
  opts: { category?: string | undefined; limit: number; offset: number },
  dbArg?: Db,
): Promise<{ items: NotificationView[]; total: number; unread: number }> {
  const db = dbArg ?? (await getDb());
  const category = opts.category && (NOTIFICATION_CATEGORIES as readonly string[]).includes(opts.category) ? opts.category : null;
  if (opts.category && !category) throw new NotificationError(400, "validation", "Unknown notification category.");

  const rows = await db<Row[]>`
    SELECT id, category, title, message, link, created_at, read_at
    FROM notifications
    WHERE user_id = ${user.id} ${category ? db`AND category = ${category}` : db``}
    ORDER BY created_at DESC, id
    LIMIT ${opts.limit} OFFSET ${opts.offset}`;
  const [counts] = await db<{ total: string; unread: string }[]>`
    SELECT count(*) FILTER (WHERE ${category ? db`category = ${category}` : db`TRUE`}) AS total,
           count(*) FILTER (WHERE read_at IS NULL) AS unread
    FROM notifications WHERE user_id = ${user.id}`;
  return { items: rows.map(toView), total: Number(counts?.total ?? 0), unread: Number(counts?.unread ?? 0) };
}

/** The number on the header bell. */
export async function unreadCount(user: PublicUser, dbArg?: Db): Promise<number> {
  const db = dbArg ?? (await getDb());
  const [r] = await db<{ n: string }[]>`SELECT count(*) AS n FROM notifications WHERE user_id = ${user.id} AND read_at IS NULL`;
  return Number(r?.n ?? 0);
}

export async function markRead(user: PublicUser, id: string, dbArg?: Db): Promise<NotificationView> {
  const db = dbArg ?? (await getDb());
  // The user_id condition means someone else's notification looks exactly like a missing one.
  const rows = await db<Row[]>`
    UPDATE notifications SET read_at = COALESCE(read_at, ${new Date()})
    WHERE id = ${id} AND user_id = ${user.id}
    RETURNING id, category, title, message, link, created_at, read_at`;
  const row = rows[0];
  if (!row) throw new NotificationError(404, "not_found", "Notification not found.");
  return toView(row);
}

export async function markAllRead(user: PublicUser, dbArg?: Db): Promise<number> {
  const db = dbArg ?? (await getDb());
  const rows = await db`UPDATE notifications SET read_at = ${new Date()} WHERE user_id = ${user.id} AND read_at IS NULL RETURNING id`;
  return rows.length;
}
