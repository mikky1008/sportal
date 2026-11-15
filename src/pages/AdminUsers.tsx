import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import {
  BadgeCheck, CircleAlert, ClipboardCheck, Clock, Eye, GraduationCap, Mail, Search, ShieldOff, UserCheck, UserRoundX, X,
} from "lucide-react";
import { AdminLayout, ADMIN_VERIFICATIONS } from "@/layouts/AdminLayout";
import { Link } from "@/router-compat";
import { PersonAvatar } from "@/components/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  fetchUserDetail, fetchUsers, reactivateUser, suspendUser,
  type DirectoryRole, type DirectorySummary, type DirectoryUser, type UserDetail, type UserStatus,
} from "@/lib/adminApi";
import { FilterChip as Chip, StatusPill as StatusBadge, adminBtn as btnBase, adminCard as card, fmtDate, fmtDateTime } from "@/components/admin-ui";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 10;

const ROLES: { value: DirectoryRole; label: string }[] = [
  { value: "student_athlete", label: "Student-Athlete" },
  { value: "coach", label: "Coach" },
  { value: "university_representative", label: "School Representative" },
];
const STATUSES: { value: UserStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "pending", label: "Pending" },
  { value: "suspended", label: "Suspended" },
];

const ROLE_LABEL: Record<DirectoryRole, string> = Object.fromEntries(ROLES.map((r) => [r.value, r.label])) as Record<DirectoryRole, string>;
const ROLE_STYLE: Record<DirectoryRole, string> = {
  student_athlete: "bg-sky-50 text-sky-700 ring-sky-200",
  coach: "bg-[#0a1f44]/8 text-[#0a1f44] ring-[#0a1f44]/15",
  university_representative: "bg-slate-100 text-slate-700 ring-slate-200",
};


/* ------------------------------------------------------------------ small pieces */

function RoleBadge({ role }: { role: DirectoryRole | null }) {
  if (!role) return <span className="text-sm text-slate-400">No role</span>;
  return <span className={cn("inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset", ROLE_STYLE[role])}>{ROLE_LABEL[role]}</span>;
}

function SummaryTile({ label, value, tone }: { label: string; value: number | null; tone: string }) {
  return (
    <div className={cn(card, "flex items-center gap-3 px-4 py-3")}>
      <span className={cn("h-9 w-1.5 shrink-0 rounded-full", tone)} />
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
        {value === null ? <Skeleton className="mt-1 h-6 w-12" /> : <p className="font-display text-2xl font-bold leading-tight tabular-nums text-[#0a1f44]">{value.toLocaleString()}</p>}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ row actions */

function RowActions({ u, busy, onView, onSuspend, onReactivate }: {
  u: DirectoryUser; busy: boolean; onView: () => void; onSuspend: () => void; onReactivate: () => void;
}) {
  return (
    <div className="flex flex-wrap gap-2 md:justify-end">
      <button type="button" onClick={onView} aria-label={`View details for ${u.name}`} className={cn(btnBase, "border border-slate-300 bg-white text-slate-700 hover:border-sky-300 hover:bg-sky-50 hover:text-[#0a1f44]")}>
        <Eye className="h-4 w-4" /> View
      </button>
      {u.status === "pending" || u.status === "rejected" ? (
        <Link to={ADMIN_VERIFICATIONS} direction="root" aria-label={`Open ${u.name}'s application`} className={cn(btnBase, "bg-[#0a1f44] text-white hover:bg-[#0f3160]")}>
          <ClipboardCheck className="h-4 w-4" /> Application
        </Link>
      ) : u.status === "suspended" ? (
        <button type="button" disabled={busy} onClick={onReactivate} aria-label={`Reactivate ${u.name}`} className={cn(btnBase, "bg-[#0a1f44] text-white hover:bg-[#0f3160]")}>
          <UserCheck className="h-4 w-4" /> {busy ? "Reactivating…" : "Reactivate"}
        </button>
      ) : (
        <button type="button" disabled={busy} onClick={onSuspend} aria-label={`Suspend ${u.name}`} className={cn(btnBase, "border border-slate-300 bg-white text-slate-700 hover:border-red-300 hover:bg-red-50 hover:text-red-700")}>
          <ShieldOff className="h-4 w-4" /> Suspend
        </button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ dialogs */

function SuspendDialog({ target, busy, onCancel, onConfirm }: {
  target: { id: string; name: string } | null; busy: boolean; onCancel: () => void; onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");
  useEffect(() => setReason(""), [target]);
  return (
    <Dialog open={!!target} onOpenChange={(o) => !o && !busy && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Suspend {target?.name}?</DialogTitle>
          <DialogDescription>
            They'll be signed out on every device right away and can't sign in again until you reactivate the account. Their profile and data are kept.
          </DialogDescription>
        </DialogHeader>
        <label htmlFor="suspend-reason" className="text-sm font-medium text-slate-700">Reason <span className="font-normal text-slate-400">(optional, kept in the audit log)</span></label>
        <textarea
          id="suspend-reason" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} rows={3} autoFocus
          placeholder="e.g. Reported for impersonating a coach."
          className="w-full resize-none rounded-xl border border-slate-300 p-3 text-sm outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-400/20"
        />
        <DialogFooter className="gap-2 sm:gap-2">
          <button type="button" onClick={onCancel} disabled={busy} className={cn(btnBase, "border border-slate-300 text-slate-700 hover:bg-slate-50")}>Cancel</button>
          <button type="button" onClick={() => onConfirm(reason.trim())} disabled={busy} className={cn(btnBase, "bg-red-600 text-white hover:bg-red-700")}>
            {busy ? "Suspending…" : "Suspend account"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DetailRow({ icon: Icon, label, children }: { icon: typeof Mail; label: string; children: ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-sky-50 text-sky-600"><Icon className="h-4 w-4" /></span>
      <div className="min-w-0">
        <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</dt>
        <dd className="break-words text-sm font-medium text-[#0a1f44]">{children}</dd>
      </div>
    </div>
  );
}

const HISTORY_LABEL = { registered: "Account created", suspended: "Suspended by administrator", reactivated: "Reactivated by administrator" } as const;

function DetailSheet({ id, busy, onClose, onSuspend, onReactivate, refreshKey }: {
  id: string | null; busy: boolean; onClose: () => void;
  onSuspend: (u: { id: string; name: string }) => void; onReactivate: (id: string) => void; refreshKey: number;
}) {
  const [detail, setDetail] = useState<UserDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let live = true;
    setError(null);
    void fetchUserDetail(id).then((r) => {
      if (!live) return;
      if (r.ok) setDetail(r.data.user);
      else setError(r.message);
    });
    return () => { live = false; };
  }, [id, refreshKey]);

  useEffect(() => { if (!id) setDetail(null); }, [id]);
  const d = detail && detail.id === id ? detail : null;

  return (
    <Sheet open={!!id} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full overflow-y-auto bg-white sm:max-w-md">
        <SheetHeader className="text-left">
          <SheetTitle className="sr-only">{d?.name ?? "User details"}</SheetTitle>
          <SheetDescription className="sr-only">Account details and history</SheetDescription>
        </SheetHeader>
        {error ? (
          <p role="alert" className="mt-6 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"><CircleAlert className="h-4 w-4" /> {error}</p>
        ) : !d ? (
          <div className="mt-6 space-y-4"><Skeleton className="h-20 w-full rounded-2xl" /><Skeleton className="h-48 w-full rounded-2xl" /></div>
        ) : (
          <div className="mt-2 flex flex-col gap-5">
            <div className="flex items-center gap-4 rounded-2xl bg-gradient-to-br from-[#0a1f44] to-[#0f3160] p-5 text-white">
              <PersonAvatar name={d.name} src={d.photo ?? undefined} size="lg" tone="onDark" />
              <div className="min-w-0">
                <h2 className="truncate font-display text-2xl font-bold leading-tight">{d.name}</h2>
                <p className="truncate text-sm text-sky-100/80">{d.email}</p>
                <div className="mt-2 flex flex-wrap gap-2"><RoleBadge role={d.role} /><StatusBadge status={d.status} /></div>
              </div>
            </div>

            <dl className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white px-4">
              <DetailRow icon={GraduationCap} label="Affiliated school">{d.school ?? "Not provided"}</DetailRow>
              {(d.position || d.sport) && (
                <DetailRow icon={BadgeCheck} label={d.role === "student_athlete" ? "Sport & position" : d.role === "coach" ? "Position & sport" : "Position"}>
                  {[d.position, d.sport].filter(Boolean).join(" · ")}
                </DetailRow>
              )}
              <DetailRow icon={Mail} label="Username">@{d.username}{d.emailVerified ? " · email verified" : ""}</DetailRow>
              <DetailRow icon={Clock} label="Registered">{fmtDate(d.registeredAt)}</DetailRow>
              <DetailRow icon={Clock} label="Last sign-in">{d.lastLoginAt ? fmtDateTime(d.lastLoginAt) : "Never"}</DetailRow>
            </dl>

            <section aria-labelledby="hist-title">
              <h3 id="hist-title" className="mb-2 font-display text-lg font-bold text-[#0a1f44]">Account history</h3>
              <ol className="space-y-3 border-l-2 border-sky-100 pl-4">
                {d.history.map((h, i) => (
                  <li key={i} className="relative">
                    <span className={cn("absolute -left-[1.4rem] top-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-white", h.event === "suspended" ? "bg-red-500" : "bg-sky-500")} />
                    <p className="text-sm font-medium text-[#0a1f44]">{HISTORY_LABEL[h.event]}</p>
                    <time dateTime={h.at} className="text-xs text-slate-500">{fmtDateTime(h.at)}</time>
                    {h.reason && <p className="mt-0.5 text-xs text-slate-600">Reason: {h.reason}</p>}
                  </li>
                ))}
              </ol>
            </section>

            <div className="sticky bottom-0 -mx-1 bg-white/90 px-1 pb-1 pt-3 backdrop-blur">
              {d.status === "pending" || d.status === "rejected" ? (
                <p className="text-center text-sm text-slate-500">
                  {d.status === "pending" ? "This representative is waiting for approval." : "This representative's application was rejected."}{" "}
                  <Link to={ADMIN_VERIFICATIONS} direction="root" className="font-semibold text-sky-700 hover:underline">Open School Verification</Link>
                </p>
              ) : d.status === "suspended" ? (
                <button type="button" disabled={busy} onClick={() => onReactivate(d.id)} className={cn(btnBase, "h-11 w-full bg-[#0a1f44] text-white hover:bg-[#0f3160]")}>
                  <UserCheck className="h-4 w-4" /> {busy ? "Reactivating…" : "Reactivate account"}
                </button>
              ) : (
                <button type="button" disabled={busy} onClick={() => onSuspend({ id: d.id, name: d.name })} className={cn(btnBase, "h-11 w-full border border-red-300 bg-white text-red-700 hover:bg-red-50")}>
                  <ShieldOff className="h-4 w-4" /> Suspend account
                </button>
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

/* ------------------------------------------------------------------ page */

const COLS = "md:grid-cols-[minmax(0,2.2fr)_9.5rem_minmax(0,1.5fr)_7.5rem_7.5rem_14rem]";

export default function AdminUsers() {
  const [input, setInput] = useState("");
  const [q, setQ] = useState("");
  const [role, setRole] = useState<DirectoryRole | "">("");
  const [status, setStatus] = useState<UserStatus | "">("");
  const [page, setPage] = useState(0);

  const [rows, setRows] = useState<DirectoryUser[] | null>(null);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState<DirectorySummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [viewing, setViewing] = useState<string | null>(null);
  const [suspending, setSuspending] = useState<{ id: string; name: string } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [detailKey, setDetailKey] = useState(0);
  const [reload, setReload] = useState(0);
  const firstLoad = useRef(true);

  // Search as you type, but wait for a pause so we don't ask the server on every key.
  useEffect(() => {
    const t = setTimeout(() => { setQ(input); setPage(0); }, 300);
    return () => clearTimeout(t);
  }, [input]);

  useEffect(() => {
    const ctl = new AbortController();
    setError(null);
    if (!firstLoad.current) setRows((cur) => cur); // keep the old rows visible while the next page loads
    void fetchUsers({ q, role, status, limit: PAGE_SIZE, offset: page * PAGE_SIZE }, ctl.signal).then((r) => {
      if (ctl.signal.aborted) return;
      firstLoad.current = false;
      if (r.ok) { setRows(r.data.items); setTotal(r.data.total); setSummary(r.data.summary); }
      else setError(r.message);
    });
    return () => ctl.abort();
  }, [q, role, status, page, reload]);

  const applyUpdate = useCallback((u: UserDetail) => {
    setRows((cur) => cur?.map((x) => (x.id === u.id ? { ...x, status: u.status } : x)) ?? cur);
    setDetailKey((k) => k + 1);
    setReload((k) => k + 1); // refresh the counts and any active status filter
  }, []);

  const doSuspend = async (id: string, name: string, reason: string) => {
    setBusy(id);
    const r = await suspendUser(id, reason);
    setBusy(null);
    if (!r.ok) { toast.error(r.message); return; }
    toast.success(`${name} was suspended`, { description: "They've been signed out everywhere." });
    setSuspending(null);
    applyUpdate(r.data.user);
  };

  const doReactivate = async (id: string, name: string) => {
    setBusy(id);
    const r = await reactivateUser(id);
    setBusy(null);
    if (!r.ok) { toast.error(r.message); return; }
    toast.success(`${name} can sign in again`);
    applyUpdate(r.data.user);
  };

  const nameOf = (id: string) => rows?.find((x) => x.id === id)?.name ?? "This user";
  const filtering = !!(q || role || status);
  const clearAll = () => { setInput(""); setQ(""); setRole(""); setStatus(""); setPage(0); };
  const from = total === 0 ? 0 : page * PAGE_SIZE + 1;
  const to = Math.min(total, (page + 1) * PAGE_SIZE);

  return (
    <AdminLayout title="User Management">
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="font-display text-3xl font-bold leading-tight text-[#0a1f44] sm:text-4xl">User Management</h2>
          <p className="mt-1 text-sm text-slate-500">Everyone on Sportal in one place. Find people, see who they are, and suspend or reactivate accounts.</p>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <SummaryTile label="All users" value={summary?.total ?? null} tone="bg-[#0a1f44]" />
          <SummaryTile label="Active" value={summary?.active ?? null} tone="bg-sky-400" />
          <SummaryTile label="Pending" value={summary?.pending ?? null} tone="bg-amber-400" />
          <SummaryTile label="Suspended" value={summary?.suspended ?? null} tone="bg-red-400" />
        </div>

        {/* search + filters */}
        <section className={cn(card, "flex flex-col gap-4 p-4 sm:p-5")} aria-label="Search and filters">
          <div className="relative">
            <label htmlFor="user-search" className="sr-only">Search users</label>
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              id="user-search" type="search" value={input} onChange={(e) => setInput(e.target.value)} autoComplete="off" spellCheck={false}
              placeholder="Search name, email or school"
              className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-12 pr-11 text-sm outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-400/20 [&::-webkit-search-cancel-button]:hidden"
            />
            {input && (
              <button type="button" onClick={() => setInput("")} aria-label="Clear search" className="absolute right-3 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-700">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="grid gap-3 lg:grid-cols-2 lg:gap-6">
            <div role="group" aria-label="Filter by role" className="flex flex-wrap items-center gap-2">
              <span className="mr-1 w-14 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Role</span>
              <Chip active={role === ""} onClick={() => { setRole(""); setPage(0); }}>All</Chip>
              {ROLES.map((r) => <Chip key={r.value} active={role === r.value} onClick={() => { setRole(role === r.value ? "" : r.value); setPage(0); }}>{r.label}</Chip>)}
            </div>
            <div role="group" aria-label="Filter by status" className="flex flex-wrap items-center gap-2">
              <span className="mr-1 w-14 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Status</span>
              <Chip active={status === ""} onClick={() => { setStatus(""); setPage(0); }}>All</Chip>
              {STATUSES.map((s) => <Chip key={s.value} active={status === s.value} onClick={() => { setStatus(status === s.value ? "" : s.value); setPage(0); }}>{s.label}</Chip>)}
            </div>
          </div>
        </section>

        {error && (
          <div role="alert" className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <CircleAlert className="h-4 w-4 shrink-0" /> {error}
            <button type="button" onClick={() => setReload((k) => k + 1)} className="ml-auto font-semibold underline">Retry</button>
          </div>
        )}

        {/* directory */}
        <section className={cn(card, "overflow-hidden")} aria-label="User directory">
          <div role="table" aria-label="Users" aria-busy={rows === null}>
            <div role="row" className={cn("hidden gap-4 border-b border-slate-100 bg-slate-50 px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 md:grid", COLS)}>
              <span role="columnheader">User</span>
              <span role="columnheader">Role</span>
              <span role="columnheader">School</span>
              <span role="columnheader">Registered</span>
              <span role="columnheader">Status</span>
              <span role="columnheader" className="text-right">Actions</span>
            </div>

            {rows === null && !error ? (
              <div className="space-y-2 p-5">{[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
            ) : rows && rows.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-sky-50 text-sky-600"><UserRoundX className="h-6 w-6" /></span>
                <p className="font-semibold text-[#0a1f44]">{filtering ? "No users match your search" : "No users yet"}</p>
                <p className="text-sm text-slate-500">{filtering ? "Try a different name, or clear the filters." : "New accounts will show up here."}</p>
                {filtering && <button type="button" onClick={clearAll} className={cn(btnBase, "mt-2 border border-slate-300 text-slate-700 hover:bg-slate-50")}>Clear search and filters</button>}
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {rows?.map((u) => (
                  <li key={u.id} role="row" className={cn("grid items-center gap-x-4 gap-y-3 px-4 py-4 transition-colors hover:bg-sky-50/40 sm:px-6", COLS, u.status === "suspended" && "bg-slate-50/60")}>
                    <div role="cell" className="flex min-w-0 items-center gap-3">
                      <PersonAvatar name={u.name} src={u.photo ?? undefined} size="md" className={cn(u.status === "suspended" && "opacity-60 grayscale")} />
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-[#0a1f44]">{u.name}</p>
                        <p className="truncate text-xs text-slate-500">{u.email}</p>
                      </div>
                    </div>
                    <div role="cell" className="flex items-center justify-between gap-3 md:block">
                      <span className="text-xs font-semibold uppercase tracking-wide text-slate-400 md:hidden">Role</span>
                      <RoleBadge role={u.role} />
                    </div>
                    <div role="cell" className="flex min-w-0 items-center justify-between gap-3 text-sm md:block">
                      <span className="text-xs font-semibold uppercase tracking-wide text-slate-400 md:hidden">School</span>
                      <span className={cn("block min-w-0 truncate text-right md:text-left", u.school ? "text-slate-800" : "text-slate-400")}>{u.school ?? "Not provided"}</span>
                    </div>
                    <div role="cell" className="flex items-center justify-between gap-3 text-sm text-slate-600 md:block">
                      <span className="text-xs font-semibold uppercase tracking-wide text-slate-400 md:hidden">Registered</span>
                      <time dateTime={u.registeredAt}>{fmtDate(u.registeredAt)}</time>
                    </div>
                    <div role="cell" className="flex items-center justify-between gap-3 md:block">
                      <span className="text-xs font-semibold uppercase tracking-wide text-slate-400 md:hidden">Status</span>
                      <StatusBadge status={u.status} />
                    </div>
                    <div role="cell">
                      <RowActions
                        u={u} busy={busy === u.id}
                        onView={() => setViewing(u.id)}
                        onSuspend={() => setSuspending({ id: u.id, name: u.name })}
                        onReactivate={() => void doReactivate(u.id, u.name)}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {rows && total > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 sm:px-6">
              <p className="text-sm text-slate-500" aria-live="polite">Showing <span className="font-semibold text-[#0a1f44]">{from}–{to}</span> of <span className="font-semibold text-[#0a1f44]">{total.toLocaleString()}</span></p>
              <div className="flex gap-2">
                <button type="button" disabled={page === 0} onClick={() => setPage((p) => p - 1)} className={cn(btnBase, "border border-slate-300 text-slate-700 hover:bg-slate-50")}>Previous</button>
                <button type="button" disabled={to >= total} onClick={() => setPage((p) => p + 1)} className={cn(btnBase, "bg-[#0a1f44] text-white hover:bg-[#0f3160]")}>Next</button>
              </div>
            </div>
          )}
        </section>
      </div>

      <DetailSheet
        id={viewing} busy={busy === viewing} refreshKey={detailKey} onClose={() => setViewing(null)}
        onSuspend={(u) => setSuspending(u)}
        onReactivate={(id) => void doReactivate(id, nameOf(id))}
      />
      <SuspendDialog
        target={suspending} busy={busy !== null}
        onCancel={() => setSuspending(null)}
        onConfirm={(reason) => suspending && void doSuspend(suspending.id, suspending.name, reason)}
      />
    </AdminLayout>
  );
}
