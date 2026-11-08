// Browser client for the notifications API (server/notifications.server.ts), plus the shared
// unread count the header bell shows. Routes used:
//   GET  /api/notifications                 ?category&limit&offset
//   GET  /api/notifications/unread-count
//   POST /api/notifications/:id/read
//   POST /api/notifications/read-all

import { useSyncExternalStore } from "react";
import { apiRequest, type ApiResult } from "@/auth/authClient";
import type { NotificationCategory } from "@/types";

export interface NotificationView {
  id: string;
  category: NotificationCategory;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  createdAt: string;
}

export interface NotificationPage {
  items: NotificationView[];
  total: number;
  unread: number;
}

export type { ApiResult };

export const listNotifications = (category: NotificationCategory | "all" = "all", limit = 50, offset = 0) => {
  const p = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  if (category !== "all") p.set("category", category);
  return apiRequest<NotificationPage>(`/api/notifications?${p}`);
};

export const markNotificationRead = async (id: string): Promise<ApiResult<{ notification: NotificationView }>> => {
  const r = await apiRequest<{ notification: NotificationView }>(`/api/notifications/${encodeURIComponent(id)}/read`, { method: "POST" });
  if (r.ok) void refreshUnread();
  return r;
};

export const markAllNotificationsRead = async (): Promise<ApiResult<{ updated: number }>> => {
  const r = await apiRequest<{ updated: number }>("/api/notifications/read-all", { method: "POST" });
  if (r.ok) setUnread(0);
  return r;
};

/** "2h ago", "3d ago", or a date for anything older than a month. */
export function timeAgo(iso: string, now = Date.now()): string {
  const secs = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  if (secs < 60) return "Just now";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/* ---- the bell's unread count ----
   One shared number. It is fetched when the first screen that shows it mounts, refreshed every
   minute while any such screen is on, and updated straight away when the user reads something. */

let unread = 0;
let timer: ReturnType<typeof setInterval> | undefined;
const listeners = new Set<() => void>();

function setUnread(n: number): void {
  if (n === unread) return;
  unread = n;
  listeners.forEach((l) => l());
}

export async function refreshUnread(): Promise<void> {
  const r = await apiRequest<{ unread: number }>("/api/notifications/unread-count");
  if (r.ok) setUnread(r.data.unread);
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  if (listeners.size === 1) {
    void refreshUnread();
    timer = setInterval(() => void refreshUnread(), 60_000);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && timer) {
      clearInterval(timer);
      timer = undefined;
    }
  };
}

/** The number to show on the header bell. */
export function useUnreadCount(): number {
  return useSyncExternalStore(subscribe, () => unread, () => 0);
}
