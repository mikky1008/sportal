import { useCallback, useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import {
  Activity, CheckCircle2, CircleAlert, ExternalLink, Flag, ImageIcon, Search, ShieldAlert, UserRound, Video, X, type LucideIcon,
} from "lucide-react";
import { AdminLayout } from "@/layouts/AdminLayout";
import { PersonAvatar } from "@/components/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { AdminStatCard, FilterChip, StatusPill, adminBtn, adminCard, fmtDate, fmtDateTime } from "@/components/admin-ui";
import {
  dismissReport, fetchActivity, fetchMonitoringOverview, fetchReport, fetchReports, investigateReport, resolveReport,
  type ActivityCategory, type ActivityItem, type ModerationAction, type MonitoringOverview, type ReportContentType,
  type ReportDetail, type ReportReason, type ReportStatus, type ReportSummary,
} from "@/lib/adminApi";
import { cn } from "@/lib/utils";

const LOG_PAGE = 8;
const REPORT_PAGE = 8;

/* ------------------------------------------------------------------ labels */

const CATEGORIES: { value: ActivityCategory; label: string; tone: string }[] = [
  { value: "signins", label: "Sign-ins", tone: "bg-sky-50 text-sky-700 ring-sky-200" },
  { value: "security", label: "Security", tone: "bg-amber-50 text-amber-700 ring-amber-200" },
  { value: "accounts", label: "Accounts", tone: "bg-[#0a1f44]/8 text-[#0a1f44] ring-[#0a1f44]/15" },
  { value: "administration", label: "Administration", tone: "bg-slate-100 text-slate-700 ring-slate-200" },
  { value: "platform", label: "Platform", tone: "bg-sky-100 text-sky-800 ring-sky-200" },
  { value: "moderation", label: "Moderation", tone: "bg-red-50 text-red-700 ring-red-200" },
];
const CATEGORY = Object.fromEntries(CATEGORIES.map((c) => [c.value, c])) as Record<ActivityCategory, (typeof CATEGORIES)[number]>;

const STATUS_TABS: { value: ReportStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "investigating", label: "Investigating" },
  { value: "resolved", label: "Resolved" },
  { value: "dismissed", label: "Dismissed" },
];

const TYPES: { value: ReportContentType; label: string; singular: string; icon: LucideIcon }[] = [
  { value: "athlete_profile", label: "Athlete profiles", singular: "Athlete profile", icon: UserRound },
  { value: "video", label: "Videos", singular: "Highlight video", icon: Video },
  { value: "photo", label: "Photos", singular: "Profile photo", icon: ImageIcon },
];
const TYPE = Object.fromEntries(TYPES.map((t) => [t.value, t])) as Record<ReportContentType, (typeof TYPES)[number]>;

const REASON_LABEL: Record<ReportReason, string> = {
  inappropriate: "Inappropriate content", impersonation: "Impersonation", harassment: "Harassment",
  spam: "Spam", false_information: "False information", other: "Other",
};
const REASON_TONE: Record<ReportReason, string> = {
  inappropriate: "bg-red-50 text-red-700 ring-red-200", harassment: "bg-red-50 text-red-700 ring-red-200",
  impersonation: "bg-amber-50 text-amber-700 ring-amber-200", false_information: "bg-amber-50 text-amber-700 ring-amber-200",
  spam: "bg-slate-100 text-slate-700 ring-slate-200", other: "bg-slate-100 text-slate-700 ring-slate-200",
};
const ACTION_LABEL: Record<ModerationAction, string> = {
  remove_content: "Content removed", warn_user: "Athlete warned", suspend_account: "Account suspended",
};

function Pill({ className, children }: { className: string; children: ReactNode }) {
  return <span className={cn("inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset", className)}>{children}</span>;
}

/* ------------------------------------------------------------------ activity logs */

const LOG_COLS = "lg:grid-cols-[9.5rem_minmax(0,1.1fr)_minmax(0,2fr)_8.5rem]";

function ActivityLogs({ reloadKey }: { reloadKey: number }) {
  const [input, setInput] = useState("");
  const [q, setQ] = useState("");
  const [category, setCategory] = useState<ActivityCategory | "">("");
  const [page, setPage] = useState(0);
  const [items, setItems] = useState<ActivityItem[] | null>(null);
  const [total, setTotal] = useState(0);
  const [counts, setCounts] = useState<Record<ActivityCategory, number> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => { setQ(input); setPage(0); }, 300);
    return () => clearTimeout(t);
  }, [input]);

  useEffect(() => {
    const ctl = new AbortController();
    setError(null);
    void fetchActivity({ category, q, limit: LOG_PAGE, offset: page * LOG_PAGE }, ctl.signal).then((r) => {
      if (ctl.signal.aborted) return;
      if (r.ok) { setItems(r.data.items); setTotal(r.data.total); setCounts(r.data.counts); }
      else setError(r.message);
    });
    return () => ctl.abort();
  }, [category, q, page, reloadKey, retry]);

  const from = total === 0 ? 0 : page * LOG_PAGE + 1;
  const to = Math.min(total, (page + 1) * LOG_PAGE);
  const filtering = !!(q || category);

  return (
    <section className={cn(adminCard, "overflow-hidden")} aria-labelledby="logs-title">
      <div className="flex flex-col gap-4 p-5 pb-4 sm:p-6 sm:pb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 id="logs-title" className="font-display text-xl font-bold text-[#0a1f44]">Activity Logs</h3>
            <p className="text-sm text-slate-500">Important events across the platform, newest first</p>
          </div>
          <div className="relative w-full sm:w-72">
            <label htmlFor="log-search" className="sr-only">Search activity by user name</label>
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              id="log-search" type="search" value={input} onChange={(e) => setInput(e.target.value)} autoComplete="off" spellCheck={false}
              placeholder="Search by user name"
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-9 text-sm outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-400/20 [&::-webkit-search-cancel-button]:hidden"
            />
            {input && (
              <button type="button" onClick={() => setInput("")} aria-label="Clear search" className="absolute right-2 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-700">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
        <div role="group" aria-label="Filter activity by type" className="flex flex-wrap gap-2">
          <FilterChip active={category === ""} onClick={() => { setCategory(""); setPage(0); }}>All</FilterChip>
          {CATEGORIES.map((c) => (
            <FilterChip key={c.value} active={category === c.value} onClick={() => { setCategory(category === c.value ? "" : c.value); setPage(0); }}>
              {c.label}
              {counts && <span className={cn("ml-2 rounded-full px-2 py-0.5 text-xs", category === c.value ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600")}>{counts[c.value].toLocaleString()}</span>}
            </FilterChip>
          ))}
        </div>
      </div>

      {error && (
        <div role="alert" className="mx-5 mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:mx-6">
          <CircleAlert className="h-4 w-4 shrink-0" /> {error}
          <button type="button" onClick={() => setRetry((k) => k + 1)} className="ml-auto font-semibold underline">Retry</button>
        </div>
      )}

      <div role="table" aria-label="Activity log" aria-busy={items === null}>
        <div role="row" className={cn("hidden gap-4 border-y border-slate-100 bg-slate-50 px-6 py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 lg:grid", LOG_COLS)}>
          <span role="columnheader">When</span>
          <span role="columnheader">User</span>
          <span role="columnheader">Activity</span>
          <span role="columnheader">Type</span>
        </div>
        {items === null && !error ? (
          <div className="space-y-2 p-5">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}</div>
        ) : items && items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-sky-50 text-sky-600"><Activity className="h-6 w-6" /></span>
            <p className="font-semibold text-[#0a1f44]">{filtering ? "No activity matches" : "No activity yet"}</p>
            <p className="text-sm text-slate-500">{filtering ? "Try a different name or type." : "Events appear here as people use Sportal."}</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {items?.map((a) => (
              <li key={a.id} role="row" className={cn("grid items-center gap-x-4 gap-y-2 px-5 py-3.5 transition-colors hover:bg-sky-50/40 sm:px-6", LOG_COLS)}>
                <time role="cell" dateTime={a.at} className="text-xs text-slate-500 lg:text-sm">
                  <span className="font-medium text-slate-700">{fmtDate(a.at)}</span>
                  <span className="ml-2 lg:ml-0 lg:block">{new Date(a.at).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}</span>
                </time>
                <div role="cell" className="flex min-w-0 items-center gap-2.5">
                  <PersonAvatar name={a.user.name} size="sm" />
                  <span className="truncate text-sm font-semibold text-[#0a1f44]">{a.user.name}</span>
                </div>
                <p role="cell" className="text-sm leading-snug text-slate-700">{a.description}</p>
                <div role="cell"><Pill className={CATEGORY[a.category].tone}>{CATEGORY[a.category].label}</Pill></div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {items && total > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-3 sm:px-6">
          <p className="text-sm text-slate-500" aria-live="polite">Showing <span className="font-semibold text-[#0a1f44]">{from}–{to}</span> of <span className="font-semibold text-[#0a1f44]">{total.toLocaleString()}</span></p>
          <div className="flex gap-2">
            <button type="button" disabled={page === 0} onClick={() => setPage((p) => p - 1)} className={cn(adminBtn, "border border-slate-300 text-slate-700 hover:bg-slate-50")}>Previous</button>
            <button type="button" disabled={to >= total} onClick={() => setPage((p) => p + 1)} className={cn(adminBtn, "bg-[#0a1f44] text-white hover:bg-[#0f3160]")}>Next</button>
          </div>
        </div>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ dialogs */

function DismissDialog({ target, busy, onCancel, onConfirm }: {
  target: { id: string; name: string } | null; busy: boolean; onCancel: () => void; onConfirm: (note: string) => void;
}) {
  const [note, setNote] = useState("");
  useEffect(() => setNote(""), [target]);
  return (
    <Dialog open={!!target} onOpenChange={(o) => !o && !busy && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Dismiss this report?</DialogTitle>
          <DialogDescription>
            Use this when the report about {target?.name} is invalid. Nothing is changed on their profile or account.
          </DialogDescription>
        </DialogHeader>
        <label htmlFor="dismiss-note" className="text-sm font-medium text-slate-700">Note <span className="font-normal text-slate-400">(optional, kept with the report)</span></label>
        <textarea
          id="dismiss-note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} rows={3} autoFocus
          placeholder="e.g. The biography follows the community rules."
          className="w-full resize-none rounded-xl border border-slate-300 p-3 text-sm outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-400/20"
        />
        <DialogFooter className="gap-2 sm:gap-2">
          <button type="button" onClick={onCancel} disabled={busy} className={cn(adminBtn, "border border-slate-300 text-slate-700 hover:bg-slate-50")}>Cancel</button>
          <button type="button" onClick={() => onConfirm(note.trim())} disabled={busy} className={cn(adminBtn, "bg-[#0a1f44] text-white hover:bg-[#0f3160]")}>
            {busy ? "Dismissing…" : "Dismiss report"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ActionDialog({ target, busy, onCancel, onConfirm }: {
  target: { id: string; name: string; type: ReportContentType } | null; busy: boolean; onCancel: () => void;
  onConfirm: (b: { actions: ModerationAction[]; note: string; message: string }) => void;
}) {
  const [picked, setPicked] = useState<ModerationAction[]>([]);
  const [message, setMessage] = useState("");
  const [note, setNote] = useState("");
  useEffect(() => { setPicked([]); setMessage(""); setNote(""); }, [target]);
  const toggle = (a: ModerationAction) => setPicked((cur) => (cur.includes(a) ? cur.filter((x) => x !== a) : [...cur, a]));
  const warn = picked.includes("warn_user");
  const ready = picked.length > 0 && (!warn || message.trim().length >= 3);
  const removeText =
    target?.type === "video" ? "Mark the highlight video as rejected. The link is kept as evidence."
    : target?.type === "photo" ? "Mark the profile photo as rejected. The image is kept as evidence."
    : "Clear the athlete's biography. What it said stays on this report.";
  const options: { value: ModerationAction; title: string; text: string; danger?: boolean }[] = [
    { value: "remove_content", title: "Remove the content", text: removeText },
    { value: "warn_user", title: "Warn the athlete", text: "Send them a notification explaining what was wrong." },
    { value: "suspend_account", title: "Suspend the account", text: "Sign them out everywhere and block sign-in until you reactivate them in User Management.", danger: true },
  ];
  return (
    <Dialog open={!!target} onOpenChange={(o) => !o && !busy && onCancel()}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Take action on {target?.name}</DialogTitle>
          <DialogDescription>Choose what to do. The report is marked resolved and every step is written to the activity log.</DialogDescription>
        </DialogHeader>
        <fieldset className="space-y-2">
          <legend className="sr-only">Moderation actions</legend>
          {options.map((o) => {
            const on = picked.includes(o.value);
            return (
              <label key={o.value} className={cn("flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition", on ? (o.danger ? "border-red-300 bg-red-50" : "border-sky-300 bg-sky-50") : "border-slate-200 hover:border-slate-300")}>
                <input type="checkbox" checked={on} onChange={() => toggle(o.value)} className="mt-1 h-4 w-4 accent-[#0a1f44]" />
                <span>
                  <span className={cn("block text-sm font-semibold", o.danger ? "text-red-700" : "text-[#0a1f44]")}>{o.title}</span>
                  <span className="block text-xs text-slate-500">{o.text}</span>
                </span>
              </label>
            );
          })}
        </fieldset>
        {warn && (
          <div>
            <label htmlFor="warn-message" className="text-sm font-medium text-slate-700">Message to the athlete <span className="font-normal text-red-600">(required)</span></label>
            <textarea id="warn-message" value={message} onChange={(e) => setMessage(e.target.value)} maxLength={300} rows={3} placeholder="e.g. Please keep your profile free of offensive language."
              className="mt-1 w-full resize-none rounded-xl border border-slate-300 p-3 text-sm outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-400/20" />
          </div>
        )}
        <div>
          <label htmlFor="action-note" className="text-sm font-medium text-slate-700">Internal note <span className="font-normal text-slate-400">(optional)</span></label>
          <textarea id="action-note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} rows={2}
            className="mt-1 w-full resize-none rounded-xl border border-slate-300 p-3 text-sm outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-400/20" />
        </div>
        <DialogFooter className="gap-2 sm:gap-2">
          <button type="button" onClick={onCancel} disabled={busy} className={cn(adminBtn, "border border-slate-300 text-slate-700 hover:bg-slate-50")}>Cancel</button>
          <button type="button" disabled={busy || !ready} onClick={() => onConfirm({ actions: picked, note: note.trim(), message: message.trim() })}
            className={cn(adminBtn, picked.includes("suspend_account") ? "bg-red-600 text-white hover:bg-red-700" : "bg-[#0a1f44] text-white hover:bg-[#0f3160]")}>
            {busy ? "Applying…" : "Apply and resolve"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ report review panel */

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="py-2.5">
      <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</dt>
      <dd className="mt-0.5 break-words text-sm font-medium text-[#0a1f44]">{children}</dd>
    </div>
  );
}

function ReportedContentView({ d }: { d: ReportDetail }) {
  const c = d.content;
  if (c.kind === "video") {
    const safe = c.url && /^https?:\/\//i.test(c.url);
    return (
      <div className="space-y-2">
        {c.url ? (
          <>
            <p className="break-all rounded-xl bg-slate-50 px-3 py-2.5 text-sm text-slate-800">{c.url}</p>
            {safe && (
              <a href={c.url} target="_blank" rel="noopener noreferrer" className={cn(adminBtn, "h-8 border border-slate-300 px-3 text-xs text-slate-700 hover:border-sky-300 hover:bg-sky-50")}>
                <ExternalLink className="h-3.5 w-3.5" /> Open link (external site)
              </a>
            )}
            {c.status && <p className="text-xs text-slate-500">Current status: <span className="font-semibold capitalize">{c.status}</span></p>}
          </>
        ) : <p className="rounded-xl bg-slate-50 px-3 py-3 text-sm text-slate-500">The athlete no longer has a highlight video.</p>}
      </div>
    );
  }
  if (c.kind === "photo") {
    return c.dataUrl ? (
      <div className="space-y-2">
        <img src={c.dataUrl} alt="Reported profile photo" className="max-h-64 w-full rounded-xl border border-slate-200 bg-slate-50 object-contain" />
        {c.status && <p className="text-xs text-slate-500">Current status: <span className="font-semibold capitalize">{c.status}</span></p>}
      </div>
    ) : <p className="rounded-xl bg-slate-50 px-3 py-3 text-sm text-slate-500">The athlete no longer has a profile photo.</p>;
  }
  return (
    <div className="space-y-2">
      <p className="whitespace-pre-wrap break-words rounded-xl bg-slate-50 px-3 py-3 text-sm text-slate-800">{c.bio || "No biography."}</p>
      <p className="text-xs text-slate-500">{[c.sport, c.position, c.school].filter(Boolean).join(" · ") || "No sport or school set"}</p>
    </div>
  );
}

function ReviewSheet({ id, busy, refreshKey, onClose, onInvestigate, onDismiss, onAct }: {
  id: string | null; busy: boolean; refreshKey: number; onClose: () => void;
  onInvestigate: (id: string) => void; onDismiss: (t: { id: string; name: string }) => void; onAct: (t: { id: string; name: string; type: ReportContentType }) => void;
}) {
  const [detail, setDetail] = useState<ReportDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) { setDetail(null); return; }
    let live = true;
    setError(null);
    void fetchReport(id).then((r) => {
      if (!live) return;
      if (r.ok) setDetail(r.data.report);
      else setError(r.message);
    });
    return () => { live = false; };
  }, [id, refreshKey]);

  const d = detail && detail.id === id ? detail : null;
  const open = d && (d.status === "pending" || d.status === "investigating");
  const changed = d && d.snapshot !== null && d.content.kind !== "photo" && d.snapshot !== (d.content.kind === "video" ? d.content.url ?? "" : d.content.bio);
  const Icon = d ? TYPE[d.contentType].icon : Flag;

  return (
    <Sheet open={!!id} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full overflow-y-auto bg-white sm:max-w-lg">
        <SheetHeader className="text-left">
          <SheetTitle className="sr-only">{d ? `Report about ${d.target.name}` : "Report"}</SheetTitle>
          <SheetDescription className="sr-only">Review the reported content and decide what to do</SheetDescription>
        </SheetHeader>
        {error ? (
          <p role="alert" className="mt-6 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"><CircleAlert className="h-4 w-4" /> {error}</p>
        ) : !d ? (
          <div className="mt-6 space-y-4"><Skeleton className="h-24 w-full rounded-2xl" /><Skeleton className="h-40 w-full rounded-2xl" /><Skeleton className="h-28 w-full rounded-2xl" /></div>
        ) : (
          <div className="mt-2 flex flex-col gap-5">
            <div className="flex items-center gap-4 rounded-2xl bg-gradient-to-br from-[#0a1f44] to-[#0f3160] p-5 text-white">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white/10 text-sky-300"><Icon className="h-7 w-7" /></span>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-300">{TYPE[d.contentType].singular} report</p>
                <h2 className="truncate font-display text-2xl font-bold leading-tight">{d.target.name}</h2>
                <div className="mt-2 flex flex-wrap gap-2"><StatusPill status={d.status} />{d.target.suspended && <StatusPill status="suspended" />}</div>
              </div>
            </div>

            <section aria-labelledby="rc-title">
              <h3 id="rc-title" className="mb-2 font-display text-lg font-bold text-[#0a1f44]">Reported content</h3>
              <ReportedContentView d={d} />
              {changed && (
                <div role="note" className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">Changed since it was reported. As reported:</p>
                  <p className="mt-1 whitespace-pre-wrap break-words text-sm text-amber-950">{d.snapshot || "(empty)"}</p>
                </div>
              )}
            </section>

            <dl className="divide-y divide-slate-100 rounded-2xl border border-slate-200 px-4">
              <Field label="Reason"><Pill className={REASON_TONE[d.reason]}>{REASON_LABEL[d.reason]}</Pill></Field>
              <Field label="What the reporter said">{d.details || <span className="font-normal text-slate-400">No details given</span>}</Field>
              <Field label="Reported by">{d.reporter ? <>{d.reporter.name}{d.reporterEmail && <span className="block text-xs font-normal text-slate-500">{d.reporterEmail}</span>}</> : "A deleted account"}</Field>
              <Field label="Reported">{fmtDateTime(d.createdAt)}</Field>
              <Field label="The athlete">{d.target.name}<span className="block text-xs font-normal text-slate-500">{d.targetEmail}</span></Field>
              <Field label="Other reports about this athlete">
                {d.otherReports.total === 0 ? "None" : `${d.otherReports.total} (${d.otherReports.open} still open)`}
              </Field>
              {d.investigatedAt && <Field label="Investigation started">{fmtDateTime(d.investigatedAt)}{d.investigatedBy ? ` by ${d.investigatedBy}` : ""}</Field>}
            </dl>

            {!open && d.resolvedAt && (
              <section aria-labelledby="res-title" className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <h3 id="res-title" className="font-display text-lg font-bold text-[#0a1f44]">{d.status === "dismissed" ? "Dismissed" : "Resolved"}</h3>
                <p className="text-xs text-slate-500">{fmtDateTime(d.resolvedAt)}{d.resolvedBy ? ` by ${d.resolvedBy}` : ""}</p>
                {d.actions.length > 0 && (
                  <ul className="mt-2 flex flex-wrap gap-2">{d.actions.map((a) => <li key={a}><Pill className="bg-white text-[#0a1f44] ring-slate-200">{ACTION_LABEL[a]}</Pill></li>)}</ul>
                )}
                {d.resolutionNote && <p className="mt-2 text-sm text-slate-700">{d.resolutionNote}</p>}
              </section>
            )}

            {open && (
              <div className="sticky bottom-0 -mx-1 bg-white px-1 pb-1 pt-3">
                <div className="flex flex-wrap gap-2">
                  {d.status === "pending" && (
                    <button type="button" disabled={busy} onClick={() => onInvestigate(d.id)} className={cn(adminBtn, "h-11 flex-1 border border-slate-300 bg-white text-slate-700 hover:border-sky-300 hover:bg-sky-50")}>
                      Mark as investigating
                    </button>
                  )}
                  <button type="button" disabled={busy} onClick={() => onDismiss({ id: d.id, name: d.target.name })} className={cn(adminBtn, "h-11 flex-1 border border-slate-300 bg-white text-slate-700 hover:bg-slate-50")}>Dismiss</button>
                  <button type="button" disabled={busy} onClick={() => onAct({ id: d.id, name: d.target.name, type: d.contentType })} className={cn(adminBtn, "h-11 flex-1 bg-[#0a1f44] text-white hover:bg-[#0f3160]")}>Take action</button>
                </div>
              </div>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

/* ------------------------------------------------------------------ reported content */

const REPORT_COLS = "xl:grid-cols-[minmax(0,1.4fr)_9rem_minmax(0,1fr)_6.5rem_8rem_19rem]";

function ReportedContent({ onChanged, reloadKey }: { onChanged: () => void; reloadKey: number }) {
  const [status, setStatus] = useState<ReportStatus>("pending");
  const [type, setType] = useState<ReportContentType | "">("");
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState<ReportSummary[] | null>(null);
  const [total, setTotal] = useState(0);
  const [counts, setCounts] = useState<Record<ReportStatus, number> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);

  const [reviewing, setReviewing] = useState<string | null>(null);
  const [detailKey, setDetailKey] = useState(0);
  const [dismissing, setDismissing] = useState<{ id: string; name: string } | null>(null);
  const [acting, setActing] = useState<{ id: string; name: string; type: ReportContentType } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    setError(null);
    void fetchReports({ status, type, limit: REPORT_PAGE, offset: page * REPORT_PAGE }).then((r) => {
      if (!live) return;
      if (r.ok) { setRows(r.data.items); setTotal(r.data.total); setCounts(r.data.counts); }
      else setError(r.message);
    });
    return () => { live = false; };
  }, [status, type, page, reload, reloadKey]);

  const changed = useCallback(() => {
    setReload((k) => k + 1);
    setDetailKey((k) => k + 1);
    onChanged();
  }, [onChanged]);

  const investigate = async (id: string, openPanel: boolean) => {
    setBusy(id);
    const r = await investigateReport(id);
    setBusy(null);
    if (!r.ok) { toast.error(r.message); return; }
    toast.success("Report marked as investigating");
    if (openPanel) setReviewing(id);
    changed();
  };

  const dismiss = async (id: string, note: string) => {
    setBusy(id);
    const r = await dismissReport(id, note);
    setBusy(null);
    if (!r.ok) { toast.error(r.fieldErrors?.["note"] ?? r.message); return; }
    toast.success("Report dismissed", { description: "Nothing was changed on the athlete's profile." });
    setDismissing(null);
    changed();
  };

  const act = async (id: string, body: { actions: ModerationAction[]; note: string; message: string }) => {
    setBusy(id);
    const r = await resolveReport(id, body);
    setBusy(null);
    if (!r.ok) { toast.error(r.fieldErrors?.["message"] ?? r.fieldErrors?.["actions"] ?? r.message); return; }
    toast.success("Report resolved", { description: r.data.effects.join(" · ") });
    setActing(null);
    changed();
  };

  const from = total === 0 ? 0 : page * REPORT_PAGE + 1;
  const to = Math.min(total, (page + 1) * REPORT_PAGE);
  const switchStatus = (s: ReportStatus) => { setStatus(s); setPage(0); setRows(null); };

  return (
    <section className={cn(adminCard, "overflow-hidden")} aria-labelledby="rep-title">
      <div className="flex flex-col gap-4 p-5 pb-4 sm:p-6 sm:pb-4">
        <div>
          <h3 id="rep-title" className="font-display text-xl font-bold text-[#0a1f44]">Reported Content</h3>
          <p className="text-sm text-slate-500">Reports about athlete profiles, highlight videos and profile photos</p>
        </div>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div role="group" aria-label="Report status" className="flex flex-wrap gap-2">
            {STATUS_TABS.map((t) => (
              <FilterChip key={t.value} active={status === t.value} onClick={() => switchStatus(t.value)}>
                {t.label}
                <span className={cn("ml-2 rounded-full px-2 py-0.5 text-xs", status === t.value ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600")}>{counts ? counts[t.value] : "–"}</span>
              </FilterChip>
            ))}
          </div>
          <div role="group" aria-label="Content type" className="flex flex-wrap gap-2">
            <FilterChip active={type === ""} onClick={() => { setType(""); setPage(0); }}>All types</FilterChip>
            {TYPES.map((t) => <FilterChip key={t.value} active={type === t.value} onClick={() => { setType(type === t.value ? "" : t.value); setPage(0); }}>{t.label}</FilterChip>)}
          </div>
        </div>
      </div>

      {error && (
        <div role="alert" className="mx-5 mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:mx-6">
          <CircleAlert className="h-4 w-4 shrink-0" /> {error}
          <button type="button" onClick={() => setReload((k) => k + 1)} className="ml-auto font-semibold underline">Retry</button>
        </div>
      )}

      <div role="table" aria-label="Reported content" aria-busy={rows === null}>
        <div role="row" className={cn("hidden gap-4 border-y border-slate-100 bg-slate-50 px-6 py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 xl:grid", REPORT_COLS)}>
          <span role="columnheader">Reported content</span>
          <span role="columnheader">Reason</span>
          <span role="columnheader">Reported by</span>
          <span role="columnheader">Reported</span>
          <span role="columnheader">Status</span>
          <span role="columnheader" className="text-right">Actions</span>
        </div>
        {rows === null && !error ? (
          <div className="space-y-2 p-5">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
        ) : rows && rows.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-sky-50 text-sky-600"><CheckCircle2 className="h-6 w-6" /></span>
            <p className="font-semibold text-[#0a1f44]">{status === "pending" ? "No reports waiting" : `No ${status} reports`}</p>
            <p className="max-w-sm text-sm text-slate-500">
              {status === "pending" && !type ? "When someone reports an athlete's profile, video or photo, it shows up here for review." : "Nothing matches this view."}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {rows?.map((r) => {
              const T = TYPE[r.contentType];
              const working = busy === r.id;
              const isOpen = r.status === "pending" || r.status === "investigating";
              return (
                <li key={r.id} role="row" className={cn("grid items-center gap-x-4 gap-y-3 px-4 py-4 transition-colors hover:bg-sky-50/40 sm:px-6", REPORT_COLS)}>
                  <div role="cell" className="flex min-w-0 items-center gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#0a1f44]/8 text-[#0a1f44]"><T.icon className="h-5 w-5" /></span>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-[#0a1f44]">{r.target.name}</p>
                      <p className="truncate text-xs text-slate-500">{T.singular}{r.target.suspended ? " · account suspended" : ""}</p>
                    </div>
                  </div>
                  <div role="cell" className="flex items-center justify-between gap-3 xl:block">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-400 xl:hidden">Reason</span>
                    <Pill className={REASON_TONE[r.reason]}>{REASON_LABEL[r.reason]}</Pill>
                  </div>
                  <div role="cell" className="flex min-w-0 items-center justify-between gap-3 text-sm xl:block">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-400 xl:hidden">Reported by</span>
                    <span className="block min-w-0 truncate text-slate-700">{r.reporter?.name ?? "A deleted account"}</span>
                  </div>
                  <div role="cell" className="flex items-center justify-between gap-3 text-sm text-slate-600 xl:block">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-400 xl:hidden">Reported</span>
                    <time dateTime={r.createdAt}>{fmtDate(r.createdAt)}</time>
                  </div>
                  <div role="cell" className="flex items-center justify-between gap-3 xl:block">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-400 xl:hidden">Status</span>
                    <StatusPill status={r.status} />
                  </div>
                  <div role="cell" className="flex flex-wrap gap-2 xl:flex-nowrap xl:justify-end">
                    {r.status === "pending" ? (
                      <button type="button" disabled={working} onClick={() => void investigate(r.id, true)} aria-label={`Investigate report about ${r.target.name}`} className={cn(adminBtn, "px-3 bg-[#0a1f44] text-white hover:bg-[#0f3160]")}>Investigate</button>
                    ) : (
                      <button type="button" onClick={() => setReviewing(r.id)} aria-label={`${isOpen ? "Review" : "View"} report about ${r.target.name}`} className={cn(adminBtn, "px-3 border border-slate-300 bg-white text-slate-700 hover:border-sky-300 hover:bg-sky-50")}>{isOpen ? "Review" : "View"}</button>
                    )}
                    {isOpen && (
                      <>
                        <button type="button" disabled={working} onClick={() => setDismissing({ id: r.id, name: r.target.name })} aria-label={`Dismiss report about ${r.target.name}`} className={cn(adminBtn, "px-3 border border-slate-300 bg-white text-slate-700 hover:bg-slate-50")}>Dismiss</button>
                        <button type="button" disabled={working} onClick={() => setActing({ id: r.id, name: r.target.name, type: r.contentType })} aria-label={`Take action on ${r.target.name}`} className={cn(adminBtn, "px-3 border border-slate-300 bg-white text-slate-700 hover:border-red-300 hover:bg-red-50 hover:text-red-700")}>Take action</button>
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {rows && total > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-3 sm:px-6">
          <p className="text-sm text-slate-500" aria-live="polite">Showing <span className="font-semibold text-[#0a1f44]">{from}–{to}</span> of <span className="font-semibold text-[#0a1f44]">{total.toLocaleString()}</span></p>
          <div className="flex gap-2">
            <button type="button" disabled={page === 0} onClick={() => setPage((p) => p - 1)} className={cn(adminBtn, "border border-slate-300 text-slate-700 hover:bg-slate-50")}>Previous</button>
            <button type="button" disabled={to >= total} onClick={() => setPage((p) => p + 1)} className={cn(adminBtn, "bg-[#0a1f44] text-white hover:bg-[#0f3160]")}>Next</button>
          </div>
        </div>
      )}

      <ReviewSheet
        id={reviewing} busy={busy === reviewing} refreshKey={detailKey} onClose={() => setReviewing(null)}
        onInvestigate={(id) => void investigate(id, false)} onDismiss={setDismissing} onAct={setActing}
      />
      <DismissDialog target={dismissing} busy={busy !== null} onCancel={() => setDismissing(null)} onConfirm={(note) => dismissing && void dismiss(dismissing.id, note)} />
      <ActionDialog target={acting} busy={busy !== null} onCancel={() => setActing(null)} onConfirm={(b) => acting && void act(acting.id, b)} />
    </section>
  );
}

/* ------------------------------------------------------------------ page */

export default function AdminMonitoring() {
  const [overview, setOverview] = useState<MonitoringOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [key, setKey] = useState(0);

  useEffect(() => {
    let live = true;
    void fetchMonitoringOverview().then((r) => {
      if (!live) return;
      if (r.ok) { setOverview(r.data.overview); setError(null); }
      else setError(r.message);
    });
    return () => { live = false; };
  }, [key]);

  // Anything done to a report changes the overview numbers and adds lines to the activity log.
  const changed = useCallback(() => setKey((k) => k + 1), []);
  const o = overview;

  return (
    <AdminLayout title="Platform Monitoring">
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="font-display text-3xl font-bold leading-tight text-[#0a1f44] sm:text-4xl">Platform Monitoring</h2>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">Keep an eye on what's happening on Sportal, and review what people have reported.</p>
        </div>

        {error && (
          <div role="alert" className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <CircleAlert className="h-4 w-4 shrink-0" /> {error}
            <button type="button" onClick={changed} className="ml-auto font-semibold underline">Retry</button>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <AdminStatCard label="Total Activities" value={o?.activities.total ?? null} icon={Activity} hint={o ? `${o.activities.last24h.toLocaleString()} in the last 24 hours` : undefined} />
          <AdminStatCard label="Pending Reports" value={o?.reports.pending ?? null} icon={Flag} featured
            hint={o ? (o.reports.investigating ? `${o.reports.investigating} under investigation` : o.reports.pending ? "Waiting for a first look" : "Nothing waiting") : undefined} />
          <AdminStatCard label="Resolved Reports" value={o ? o.reports.resolved + o.reports.dismissed : null} icon={CheckCircle2}
            hint={o ? `${o.reports.resolved} actioned · ${o.reports.dismissed} dismissed` : undefined} />
          <AdminStatCard label="Flagged Content" value={o?.flaggedContent ?? null} icon={ShieldAlert} hint={o ? "Items with an open report" : undefined} />
        </div>

        <ActivityLogs reloadKey={key} />
        <ReportedContent onChanged={changed} reloadKey={key} />
      </div>
    </AdminLayout>
  );
}
