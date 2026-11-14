import { useEffect, useState } from "react";
import { ShieldCheck, UserCheck, Users } from "lucide-react";
import { AdminLayout } from "@/layouts/AdminLayout";
import { Card, EmptyState, PageHeader, StatTile, btn } from "@/components/common";
import { Link } from "@/router-compat";
import { fetchAdminOverview, type AdminOverview } from "@/lib/adminApi";
import { cn } from "@/lib/utils";

type State = { kind: "loading" } | { kind: "error"; message: string } | { kind: "ready"; overview: AdminOverview };

const EVENT_LABELS: Record<string, string> = {
  "admin.login.success": "Administrator signed in",
  "admin.login.failed": "Failed administrator sign in",
  "admin.login.blocked": "Administrator sign in blocked (too many attempts)",
  "login.success": "User signed in",
  "login.failed": "Failed user sign in",
  "user.created": "Account created",
  logout: "Signed out",
  "admin.provisioned": "Administrator account provisioned",
  "admin.password_rotated": "Administrator password rotated",
  "admin.role_revoked": "Administrator role removed from another account",
};

export default function AdminDashboard() {
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    let live = true;
    void fetchAdminOverview().then((res) => {
      if (!live) return;
      setState(res.ok ? { kind: "ready", overview: res.data.overview } : { kind: "error", message: res.message });
    });
    return () => {
      live = false;
    };
  }, []);

  return (
    <AdminLayout>
      <PageHeader title="Admin Dashboard" subtitle="Accounts, coach verification and recent sign-in activity." />
      {state.kind === "loading" && <p className="text-sm text-muted-foreground">Loading…</p>}
      {state.kind === "error" && <EmptyState message={state.message} />}
      {state.kind === "ready" && (
        <div className="flex flex-col gap-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatTile label="Student-athletes" value={String(state.overview.users.students)} icon={<Users />} />
            <StatTile label="Coaches" value={String(state.overview.users.coaches)} hint={`${state.overview.users.verifiedCoaches} verified`} icon={<UserCheck />} />
            <StatTile label="University reps" value={String(state.overview.users.universityReps)} icon={<Users />} />
            <StatTile label="Pending verifications" value={String(state.overview.pendingVerifications)} icon={<ShieldCheck />} />
          </div>

          <Card
            title="Coach verification"
            action={<Link to="/admin/verifications" direction="forward" className={cn(btn.primary, "px-4 py-2")}>Review requests</Link>}
          >
            <p className="text-sm text-muted-foreground">
              {state.overview.pendingVerifications === 0
                ? "No coaches are waiting for review."
                : `${state.overview.pendingVerifications} coach${state.overview.pendingVerifications === 1 ? " is" : "es are"} waiting for review.`}
            </p>
          </Card>

          <Card title="Sign-ins, last 24 hours">
            <p className="text-sm">
              <span className="font-semibold">{state.overview.signIns24h.succeeded}</span> succeeded ·{" "}
              <span className="font-semibold">{state.overview.signIns24h.failed}</span> failed
              {state.overview.users.inactive > 0 && <> · {state.overview.users.inactive} deactivated account(s)</>}
            </p>
          </Card>

          <Card title="Recent activity">
            {state.overview.recentActivity.length === 0 ? (
              <EmptyState message="Nothing yet." />
            ) : (
              <ul className="divide-y">
                {state.overview.recentActivity.map((a, i) => (
                  <li key={i} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                    <span>{EVENT_LABELS[a.event] ?? a.event}{a.identifier ? <span className="text-muted-foreground"> · {a.identifier}</span> : null}</span>
                    <time className="text-xs text-muted-foreground" dateTime={a.at}>{new Date(a.at).toLocaleString()}</time>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}
    </AdminLayout>
  );
}
