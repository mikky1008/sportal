import { useCallback, useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";
import {
  ArrowRight, Check, CircleAlert, ClipboardCheck, KeyRound, LogIn, LogOut, Medal, School, ShieldAlert, ShieldCheck,
  TrendingUp, UserPlus, Users, X, type LucideIcon,
} from "lucide-react";
import { AdminLayout, ADMIN_VERIFICATIONS } from "@/layouts/AdminLayout";
import { useAuth } from "@/auth/AuthContext";
import { Link } from "@/router-compat";
import { PersonAvatar } from "@/components/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  approveCoach, fetchAdminOverview, fetchVerifications, rejectCoach,
  type AdminOverview, type VerificationRequest,
} from "@/lib/adminApi";
import { cn } from "@/lib/utils";

// Sportal palette
const NAVY = "#0a1f44";
const NAVY_MID = "#0f3160";
const SKY = "#38bdf8";
const SKY_SOFT = "#bae6fd";

const card = "rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(10,31,68,0.04),0_4px_16px_rgba(10,31,68,0.05)]";

/* ------------------------------------------------------------------ helpers */

function timeAgo(iso: string): string {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 86400 * 7) return `${Math.floor(s / 86400)}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

const ROLE_LABEL: Record<string, string> = {
  student_athlete: "student-athlete",
  coach: "coach",
  university_representative: "school representative",
};

interface ActivityView { icon: LucideIcon; tone: "sky" | "navy" | "amber"; text: string }

function describe(a: AdminOverview["recentActivity"][number]): ActivityView {
  const who = a.identifier ? ` (${a.identifier})` : "";
  switch (a.event) {
    case "user.created": {
      const role = a.roles?.map((r) => ROLE_LABEL[r]).find(Boolean);
      return { icon: UserPlus, tone: "sky", text: `New ${role ?? "account"} registered` };
    }
    case "login.success": return { icon: LogIn, tone: "navy", text: `Sign-in${who}` };
    case "login.failed": return { icon: ShieldAlert, tone: "amber", text: `Failed sign-in attempt${who}` };
    case "logout": return { icon: LogOut, tone: "navy", text: `Signed out${who}` };
    case "admin.login.success": return { icon: KeyRound, tone: "sky", text: "Administrator signed in" };
    case "admin.login.failed": return { icon: ShieldAlert, tone: "amber", text: "Failed administrator sign-in" };
    case "admin.login.blocked": return { icon: ShieldAlert, tone: "amber", text: "Administrator sign-in locked after repeated failures" };
    case "admin.provisioned": return { icon: ShieldCheck, tone: "sky", text: "Administrator account set up" };
    case "admin.password_rotated": return { icon: KeyRound, tone: "navy", text: "Administrator password updated" };
    case "admin.role_revoked": return { icon: ShieldAlert, tone: "amber", text: "Administrator access removed from another account" };
    default: return { icon: CircleAlert, tone: "navy", text: a.event };
  }
}

const TONE: Record<ActivityView["tone"], string> = {
  sky: "bg-sky-50 text-sky-600",
  navy: "bg-[#0a1f44]/8 text-[#0a1f44]",
  amber: "bg-amber-50 text-amber-600",
};

/* ------------------------------------------------------------------ hero */

/** Faint basketball-court line art behind the welcome banner. Decorative only. */
function CourtLines() {
  return (
    <svg aria-hidden="true" viewBox="0 0 600 220" preserveAspectRatio="xMaxYMid slice" className="pointer-events-none absolute inset-y-0 right-0 h-full w-full opacity-[0.13] sm:w-3/5">
      <g fill="none" stroke="#fff" strokeWidth="2">
        <rect x="20" y="14" width="560" height="192" rx="6" />
        <line x1="300" y1="14" x2="300" y2="206" />
        <circle cx="300" cy="110" r="38" />
        <path d="M20 54h74a64 64 0 0 1 0 112H20" />
        <rect x="20" y="76" width="96" height="68" />
        <path d="M580 54h-74a64 64 0 0 0 0 112h74" />
        <rect x="484" y="76" width="96" height="68" />
        <circle cx="116" cy="110" r="22" />
        <circle cx="484" cy="110" r="22" />
      </g>
    </svg>
  );
}

function Hero({ name, pending }: { name: string; pending: number | null }) {
  // The default display name is "Sportal Administrator"; greeting that as "Sportal" would read oddly.
  const first = !name || /^sportal administrator$/i.test(name.trim()) ? "Administrator" : name.trim().split(/\s+/)[0]!;
  const today = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0a1f44] via-[#0c2850] to-[#0f3160] p-6 text-white shadow-[0_8px_30px_rgba(10,31,68,0.25)] sm:p-8">
      <CourtLines />
      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-300">{today}</p>
          <h2 className="mt-1.5 font-display text-3xl font-bold leading-tight sm:text-4xl">Welcome back, {first}.</h2>
          <p className="mt-1.5 max-w-xl text-sm text-sky-100/85">Here's how athletes, coaches and schools are showing up on Sportal today.</p>
        </div>
        {pending !== null && pending > 0 && (
          <Link to={ADMIN_VERIFICATIONS} direction="forward" className="inline-flex shrink-0 items-center gap-2 self-start rounded-full bg-sky-400 px-5 py-2.5 text-sm font-semibold text-[#0a1f44] shadow-lg shadow-sky-900/30 transition hover:bg-sky-300 sm:self-auto">
            {pending} awaiting review <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ stat cards */

function StatCard({ label, value, hint, icon: Icon, featured = false }: { label: string; value: number | null; hint?: string; icon: LucideIcon; featured?: boolean }) {
  return (
    <div className={cn(card, "relative overflow-hidden p-5 transition-shadow hover:shadow-[0_8px_24px_rgba(10,31,68,0.12)]", featured && "border-transparent bg-gradient-to-br from-[#0a1f44] to-[#0f3160] text-white")}>
      <div className="flex items-start justify-between gap-3">
        <p className={cn("text-xs font-semibold uppercase tracking-[0.14em]", featured ? "text-sky-300" : "text-slate-500")}>{label}</p>
        <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl", featured ? "bg-white/10 text-sky-300" : "bg-sky-50 text-sky-600")}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
      {value === null ? (
        <Skeleton className="mt-3 h-10 w-24" />
      ) : (
        <p className={cn("mt-2 font-display text-4xl font-bold tabular-nums leading-none", featured ? "text-white" : "text-[#0a1f44]")}>{value.toLocaleString()}</p>
      )}
      {hint && value !== null && (
        <p className={cn("mt-3 flex items-center gap-1.5 text-xs font-medium", featured ? "text-sky-200" : "text-slate-500")}>
          <TrendingUp className={cn("h-3.5 w-3.5", featured ? "text-sky-300" : "text-sky-500")} /> {hint}
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ chart */

const SERIES = [
  { key: "athletes", label: "Student-athletes", color: SKY },
  { key: "coaches", label: "Coaches", color: NAVY_MID },
  { key: "schoolReps", label: "School reps", color: SKY_SOFT },
] as const;

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { dataKey: string; value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg">
      <p className="mb-1 font-semibold text-[#0a1f44]">{label}</p>
      {SERIES.map((s) => (
        <p key={s.key} className="flex items-center justify-between gap-6 text-slate-600">
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: s.color }} />{s.label}</span>
          <span className="font-semibold tabular-nums text-[#0a1f44]">{payload.find((p) => p.dataKey === s.key)?.value ?? 0}</span>
        </p>
      ))}
    </div>
  );
}

function RegistrationChart({ data }: { data: AdminOverview["registrations"] | null }) {
  const empty = data !== null && data.every((m) => m.athletes + m.coaches + m.schoolReps === 0);
  return (
    <section className={cn(card, "p-5 sm:p-6 lg:col-span-2")} aria-labelledby="reg-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 id="reg-title" className="font-display text-xl font-bold text-[#0a1f44]">User Registration Analytics</h3>
          <p className="text-sm text-slate-500">New accounts per month, last 6 months</p>
        </div>
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
          {SERIES.map((s) => (
            <li key={s.key} className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />{s.label}</li>
          ))}
        </ul>
      </div>
      <div className="relative mt-4 h-72 lg:h-80">
        {data === null ? (
          <Skeleton className="h-full w-full rounded-xl" />
        ) : (
          <>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} barGap={3} barCategoryGap="22%" margin={{ top: 8, right: 4, left: -18, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="4 4" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                <Tooltip cursor={{ fill: "rgba(56,189,248,0.08)" }} content={<ChartTooltip />} />
                {SERIES.map((s) => (
                  <Bar key={s.key} dataKey={s.key} name={s.label} fill={s.color} radius={[6, 6, 0, 0]} maxBarSize={22} />
                ))}
              </BarChart>
            </ResponsiveContainer>
            {empty && (
              <p className="pointer-events-none absolute inset-0 grid place-items-center text-sm font-medium text-slate-400">No registrations in this period yet</p>
            )}
          </>
        )}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ recent activity */

function RecentActivity({ items }: { items: AdminOverview["recentActivity"] | null }) {
  return (
    <section className={cn(card, "p-5 sm:p-6")} aria-labelledby="act-title">
      <h3 id="act-title" className="font-display text-xl font-bold text-[#0a1f44]">Recent Activities</h3>
      <p className="text-sm text-slate-500">Latest sign-ins and registrations</p>
      <div className="mt-4">
        {items === null ? (
          <div className="space-y-3">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}</div>
        ) : items.length === 0 ? (
          <p className="rounded-xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">Nothing has happened yet.</p>
        ) : (
          <ol className="relative space-y-1">
            {items.slice(0, 5).map((a, i) => {
              const v = describe(a);
              return (
                <li key={i} className="flex items-start gap-3 rounded-xl px-1 py-2">
                  <span className={cn("mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full", TONE[v.tone])}><v.icon className="h-4 w-4" /></span>
                  <div className="min-w-0 flex-1">
                    <p className="break-words text-sm font-medium leading-snug text-[#0a1f44]">{v.text}</p>
                    <time dateTime={a.at} className="text-xs text-slate-400">{timeAgo(a.at)}</time>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ approvals */

const COLS = "md:grid-cols-[minmax(0,1.6fr)_minmax(0,1.5fr)_7.5rem_12.5rem]";

function ApprovalsTable({ rows, total, onApprove, onReject, busy }: {
  rows: VerificationRequest[] | null;
  total: number;
  onApprove: (r: VerificationRequest) => void;
  onReject: (r: VerificationRequest) => void;
  busy: string | null;
}) {
  return (
    <section className={cn(card, "overflow-hidden")} aria-labelledby="appr-title">
      <div className="flex flex-wrap items-center justify-between gap-3 p-5 pb-4 sm:p-6 sm:pb-4">
        <div>
          <h3 id="appr-title" className="font-display text-xl font-bold text-[#0a1f44]">Pending School Representative Approvals</h3>
          <p className="text-sm text-slate-500">School staff asking to be verified before they can recruit on Sportal</p>
        </div>
        {total > 0 && <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">{total} pending</span>}
      </div>

      <div role="table" aria-label="Pending approvals">
        <div role="row" className={cn("hidden gap-4 border-y border-slate-100 bg-slate-50 px-6 py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 md:grid", COLS)}>
          <span role="columnheader">Applicant</span>
          <span role="columnheader">School</span>
          <span role="columnheader">Submitted</span>
          <span role="columnheader" className="text-right">Action</span>
        </div>

        {rows === null ? (
          <div className="space-y-2 p-5">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}</div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-sky-50 text-sky-600"><ClipboardCheck className="h-6 w-6" /></span>
            <p className="font-semibold text-[#0a1f44]">You're all caught up</p>
            <p className="text-sm text-slate-500">No one is waiting for approval right now.</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {rows.map((r) => {
              const working = busy === r.coachId;
              return (
                <li key={r.coachId} role="row" className={cn("grid items-center gap-x-4 gap-y-3 px-5 py-4 sm:px-6", COLS)}>
                  <div role="cell" className="flex min-w-0 items-center gap-3">
                    <PersonAvatar name={r.displayName} size="md" />
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-[#0a1f44]">{r.displayName}</p>
                      <p className="truncate text-xs text-slate-500">{r.position || "Coach"} · {r.email}</p>
                    </div>
                  </div>
                  <div role="cell" className="flex min-w-0 items-center gap-2 text-sm">
                    <School className="h-4 w-4 shrink-0 text-sky-500" />
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-slate-800">{r.organization}</span>
                      {r.organizationType && <span className="block truncate text-xs text-slate-500">{r.organizationType}</span>}
                    </span>
                  </div>
                  <time role="cell" dateTime={r.submittedAt} className="text-sm text-slate-600">{fmtDate(r.submittedAt)}</time>
                  <div role="cell" className="flex gap-2 md:justify-end">
                    <button type="button" disabled={working} onClick={() => onApprove(r)} aria-label={`Approve ${r.displayName}`}
                      className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full bg-[#0a1f44] px-4 text-sm font-semibold text-white transition hover:bg-[#0f3160] disabled:opacity-50 md:flex-none">
                      <Check className="h-4 w-4" /> Approve
                    </button>
                    <button type="button" disabled={working} onClick={() => onReject(r)} aria-label={`Reject ${r.displayName}`}
                      className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-red-300 hover:bg-red-50 hover:text-red-700 disabled:opacity-50 md:flex-none">
                      <X className="h-4 w-4" /> Reject
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {rows !== null && total > rows.length && (
        <div className="border-t border-slate-100 px-6 py-3 text-right">
          <Link to={ADMIN_VERIFICATIONS} direction="forward" className="inline-flex items-center gap-1.5 text-sm font-semibold text-sky-700 hover:text-sky-600">
            View all {total} requests <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </section>
  );
}

function RejectDialog({ target, busy, onCancel, onConfirm }: {
  target: VerificationRequest | null; busy: boolean; onCancel: () => void; onConfirm: (note: string) => void;
}) {
  const [note, setNote] = useState("");
  useEffect(() => setNote(""), [target]);
  const trimmed = note.trim();
  return (
    <Dialog open={!!target} onOpenChange={(o) => !o && !busy && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reject {target?.displayName}?</DialogTitle>
          <DialogDescription>
            Tell them why. They'll see this reason and can correct their details and submit again.
          </DialogDescription>
        </DialogHeader>
        <label htmlFor="reject-reason" className="sr-only">Reason</label>
        <textarea
          id="reject-reason" value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} rows={4} autoFocus
          placeholder="e.g. The official school email doesn't match the school domain."
          className="w-full resize-none rounded-xl border border-slate-300 p-3 text-sm outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-400/20"
        />
        <p className="text-right text-xs text-slate-400">{note.length}/500</p>
        <DialogFooter className="gap-2 sm:gap-2">
          <button type="button" onClick={onCancel} disabled={busy} className="h-10 rounded-full border border-slate-300 px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
          <button type="button" onClick={() => onConfirm(trimmed)} disabled={busy || trimmed.length < 3}
            className="h-10 rounded-full bg-red-600 px-5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50">
            {busy ? "Rejecting…" : "Reject request"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ page */

export default function AdminDashboard() {
  const { user } = useAuth();
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [rows, setRows] = useState<VerificationRequest[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<VerificationRequest | null>(null);

  const load = useCallback(async (fresh = false) => {
    const [o, v] = await Promise.all([fetchAdminOverview(fresh), fetchVerifications("pending")]);
    if (o.ok) { setOverview(o.data.overview); setError(null); } else setError(o.message);
    if (v.ok) setRows(v.data.items);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const act = useCallback(async (r: VerificationRequest, run: () => ReturnType<typeof approveCoach>, done: string) => {
    setBusy(r.coachId);
    const res = await run();
    setBusy(null);
    if (!res.ok) { toast.error(res.message); return false; }
    toast.success(done);
    setRows((cur) => cur?.filter((x) => x.coachId !== r.coachId) ?? cur);
    void load(true); // refresh the card counts, bell badge and activity
    return true;
  }, [load]);

  const pendingTotal = overview?.totals.pending ?? rows?.length ?? 0;
  const shown = useMemo(() => rows?.slice(0, 6) ?? null, [rows]);
  const t = overview?.totals;

  return (
    <AdminLayout title="Dashboard">
      <div className="flex flex-col gap-6">
        <Hero name={user?.displayName ?? ""} pending={overview ? overview.totals.pending : null} />

        {error && (
          <div role="alert" className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <CircleAlert className="h-4 w-4 shrink-0" /> {error}
            <button type="button" onClick={() => void load(true)} className="ml-auto font-semibold underline">Retry</button>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total Users" value={t?.users ?? null} icon={Users} hint={t ? `${t.usersThisWeek} new this week` : undefined} />
          <StatCard label="Total Athletes" value={t?.athletes ?? null} icon={Medal} hint={t ? `${t.athletesThisWeek} new this week` : undefined} />
          <StatCard label="Registered Schools" value={t?.schools ?? null} icon={School} hint="Schools with a Sportal page" />
          <StatCard label="Pending Approvals" value={t?.pending ?? null} icon={ClipboardCheck} featured hint={t ? (t.pending ? "Waiting for your review" : "Nothing waiting") : undefined} />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <RegistrationChart data={overview?.registrations ?? null} />
          <RecentActivity items={overview?.recentActivity ?? null} />
        </div>

        <ApprovalsTable
          rows={shown}
          total={pendingTotal}
          busy={busy}
          onApprove={(r) => void act(r, () => approveCoach(r.coachId), `${r.displayName} approved`)}
          onReject={setRejecting}
        />
      </div>

      <RejectDialog
        target={rejecting}
        busy={busy !== null}
        onCancel={() => setRejecting(null)}
        onConfirm={async (note) => {
          if (rejecting && (await act(rejecting, () => rejectCoach(rejecting.coachId, note), `${rejecting.displayName} rejected`))) setRejecting(null);
        }}
      />
    </AdminLayout>
  );
}
