import { Page } from "@/components/Page";
import { useCallback, useEffect, useState } from "react";
import type { Notification, NotificationCategory } from "@/types";
import { PageHeader, btn } from "@/components/common";
import { NotificationItem, notificationCategories } from "@/components/listings";
import { listNotifications, markAllNotificationsRead, markNotificationRead, refreshUnread, timeAgo, type NotificationView } from "@/lib/notificationsApi";
import { cn } from "@/lib/utils";

type State = { kind: "loading" } | { kind: "error"; message: string } | { kind: "ready"; items: NotificationView[] };

const toItem = (n: NotificationView): Notification => ({ id: n.id, category: n.category, title: n.title, message: n.message, read: n.read, time: timeAgo(n.createdAt) });

function Notifications() {
  const [state, setState] = useState<State>({ kind: "loading" });
  const [cat, setCat] = useState<NotificationCategory | "all">("all");

  const load = useCallback(async () => {
    const r = await listNotifications(cat);
    setState(r.ok ? { kind: "ready", items: r.data.items } : { kind: "error", message: r.message });
    if (r.ok) void refreshUnread();
  }, [cat]);

  useEffect(() => {
    setState({ kind: "loading" });
    void load();
  }, [load]);

  const patch = (fn: (n: NotificationView) => NotificationView) =>
    setState((s) => (s.kind === "ready" ? { kind: "ready", items: s.items.map(fn) } : s));

  const readOne = async (id: string) => {
    patch((n) => (n.id === id ? { ...n, read: true } : n));
    const r = await markNotificationRead(id);
    if (!r.ok) void load(); // the server did not save it, so show what it really holds
  };
  const readAll = async () => {
    patch((n) => ({ ...n, read: true }));
    const r = await markAllNotificationsRead();
    if (!r.ok) void load();
  };

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Notifications" action={<button className={btn.secondary} onClick={readAll}>Mark all read</button>} />
      <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
        {(["all", ...Object.keys(notificationCategories)] as const).map((c) => (
          <button key={c} onClick={() => setCat(c as NotificationCategory | "all")} className={cn("whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold", cat === c ? "border-primary bg-primary text-primary-foreground" : "bg-card text-muted-foreground")}>
            {c === "all" ? "All" : notificationCategories[c as NotificationCategory].label}
          </button>
        ))}
      </div>
      {state.kind === "loading" && <p className="py-8 text-center text-sm text-muted-foreground">Loading…</p>}
      {state.kind === "error" && (
        <div className="py-8 text-center">
          <p className="text-sm text-muted-foreground">{state.message}</p>
          <button className={cn(btn.secondary, "mt-3")} onClick={() => { setState({ kind: "loading" }); void load(); }}>Try again</button>
        </div>
      )}
      {state.kind === "ready" && (
        <ul className="flex flex-col gap-2">
          {state.items.map((n) => <NotificationItem key={n.id} n={toItem(n)} onRead={() => void readOne(n.id)} />)}
          {!state.items.length && <p className="py-8 text-center text-sm text-muted-foreground">Nothing here yet.</p>}
        </ul>
      )}
    </div>
  );
}

export default function NotificationsPage() {
  return (
    <Page title="Notifications">
      <Notifications />
    </Page>
  );
}
