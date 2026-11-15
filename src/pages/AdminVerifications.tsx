import { useCallback, useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import {
  Check, CircleAlert, ClipboardCheck, Download, ExternalLink, Eye, FileImage, FileText, GraduationCap, Mail, Paperclip, UserCog, X, type LucideIcon,
} from "lucide-react";
import { AdminLayout, ADMIN_USERS } from "@/layouts/AdminLayout";
import { PersonAvatar } from "@/components/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/router-compat";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { FilterChip, StatusPill, adminBtn, adminCard, fmtDate, fmtDateTime } from "@/components/admin-ui";
import {
  approveApplication, fetchApplication, fetchApplications, openApplicationDocument, rejectApplication,
  type ApplicationCounts, type ApplicationDetail, type ApplicationDocument, type ApplicationStatus, type ApplicationSummary,
} from "@/lib/adminApi";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 10;

const TABS: { value: ApplicationStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

const KIND_LABEL: Record<string, string> = {
  staff_id: "Staff / employee ID",
  authorization_letter: "Letter of authorization",
  appointment_letter: "Appointment letter or contract",
  other: "Other proof of affiliation",
};

const fmtSize = (n: number) => (n < 1024 * 1024 ? `${Math.max(1, Math.round(n / 1024))} KB` : `${(n / 1024 / 1024).toFixed(1)} MB`);

const COLS = "lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1.3fr)_5.75rem_6.75rem_6.75rem_17.5rem]";

/* ------------------------------------------------------------------ reject dialog */

function RejectDialog({ target, busy, onCancel, onConfirm }: {
  target: { id: string; name: string } | null; busy: boolean; onCancel: () => void; onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");
  useEffect(() => setReason(""), [target]);
  const trimmed = reason.trim();
  return (
    <Dialog open={!!target} onOpenChange={(o) => !o && !busy && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reject {target?.name}'s application?</DialogTitle>
          <DialogDescription>
            They won't be able to use their account. They'll read this reason when they try to sign in, so say what was wrong.
          </DialogDescription>
        </DialogHeader>
        <label htmlFor="reject-reason" className="text-sm font-medium text-slate-700">Rejection reason <span className="font-normal text-red-600">(required)</span></label>
        <textarea
          id="reject-reason" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} rows={4} autoFocus
          placeholder="e.g. The authorization letter isn't signed, or doesn't name this school."
          className="w-full resize-none rounded-xl border border-slate-300 p-3 text-sm outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-400/20"
        />
        <p className="text-right text-xs text-slate-400">{reason.length}/500</p>
        <DialogFooter className="gap-2 sm:gap-2">
          <button type="button" onClick={onCancel} disabled={busy} className={cn(adminBtn, "border border-slate-300 text-slate-700 hover:bg-slate-50")}>Cancel</button>
          <button type="button" onClick={() => onConfirm(trimmed)} disabled={busy || trimmed.length < 3} className={cn(adminBtn, "bg-red-600 text-white hover:bg-red-700")}>
            {busy ? "Rejecting…" : "Reject application"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ review panel */

function Row({ icon: Icon, label, children }: { icon: LucideIcon; label: string; children: ReactNode }) {
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

function DocumentRow({ appId, doc }: { appId: string; doc: ApplicationDocument }) {
  const [busy, setBusy] = useState<"view" | "download" | null>(null);
  const Icon = doc.mimeType === "application/pdf" ? FileText : FileImage;
  const run = async (mode: "view" | "download") => {
    setBusy(mode);
    const err = await openApplicationDocument(appId, doc, mode);
    setBusy(null);
    if (err) toast.error(err);
  };
  return (
    <li className="flex items-center gap-3 rounded-xl border border-slate-200 p-3">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#0a1f44]/8 text-[#0a1f44]"><Icon className="h-5 w-5" /></span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-[#0a1f44]" title={doc.fileName}>{doc.fileName}</p>
        <p className="text-xs text-slate-500">{KIND_LABEL[doc.kind] ?? doc.kind} · {fmtSize(doc.sizeBytes)}</p>
      </div>
      <div className="flex shrink-0 gap-1.5">
        <button type="button" disabled={busy !== null} onClick={() => void run("view")} aria-label={`View ${doc.fileName}`} className={cn(adminBtn, "h-8 border border-slate-300 px-3 text-xs text-slate-700 hover:border-sky-300 hover:bg-sky-50")}>
          <ExternalLink className="h-3.5 w-3.5" /> {busy === "view" ? "Opening…" : "View"}
        </button>
        <button type="button" disabled={busy !== null} onClick={() => void run("download")} aria-label={`Download ${doc.fileName}`} className={cn(adminBtn, "h-8 w-8 border border-slate-300 px-0 text-slate-700 hover:border-sky-300 hover:bg-sky-50")}>
          <Download className="h-3.5 w-3.5" />
        </button>
      </div>
    </li>
  );
}

function ReviewSheet({ id, busy, refreshKey, onClose, onApprove, onReject }: {
  id: string | null; busy: boolean; refreshKey: number; onClose: () => void;
  onApprove: (id: string, name: string) => void; onReject: (t: { id: string; name: string }) => void;
}) {
  const [detail, setDetail] = useState<ApplicationDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) { setDetail(null); return; }
    let live = true;
    setError(null);
    void fetchApplication(id).then((r) => {
      if (!live) return;
      if (r.ok) setDetail(r.data.application);
      else setError(r.message);
    });
    return () => { live = false; };
  }, [id, refreshKey]);

  const d = detail && detail.id === id ? detail : null;
  return (
    <Sheet open={!!id} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full overflow-y-auto bg-white sm:max-w-lg">
        <SheetHeader className="text-left">
          <SheetTitle className="sr-only">{d ? `${d.name}'s application` : "Application"}</SheetTitle>
          <SheetDescription className="sr-only">Review the applicant's details and documents</SheetDescription>
        </SheetHeader>
        {error ? (
          <p role="alert" className="mt-6 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"><CircleAlert className="h-4 w-4" /> {error}</p>
        ) : !d ? (
          <div className="mt-6 space-y-4"><Skeleton className="h-24 w-full rounded-2xl" /><Skeleton className="h-40 w-full rounded-2xl" /><Skeleton className="h-28 w-full rounded-2xl" /></div>
        ) : (
          <div className="mt-2 flex flex-col gap-5">
            <div className="flex items-center gap-4 rounded-2xl bg-gradient-to-br from-[#0a1f44] to-[#0f3160] p-5 text-white">
              <PersonAvatar name={d.name} src={d.photo ?? undefined} size="lg" tone="onDark" />
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-300">School representative application</p>
                <h2 className="truncate font-display text-2xl font-bold leading-tight">{d.name}</h2>
                <div className="mt-2"><StatusPill status={d.status} /></div>
              </div>
            </div>

            {d.status === "rejected" && d.rejectionReason && (
              <div role="note" className="rounded-xl border border-red-200 bg-red-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-red-700">Rejection reason (shown to the applicant)</p>
                <p className="mt-1 text-sm text-red-900">{d.rejectionReason}</p>
              </div>
            )}

            <dl className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white px-4">
              <Row icon={GraduationCap} label="School / university">{d.school}</Row>
              <Row icon={UserCog} label="Position / designation">{d.designation}</Row>
              <Row icon={Mail} label="Email"><a href={`mailto:${d.email}`} className="text-sky-700 hover:underline">{d.email}</a></Row>
              <Row icon={ClipboardCheck} label="Applied">{fmtDateTime(d.submittedAt)}</Row>
              {d.reviewedAt && <Row icon={Check} label={d.status === "approved" ? "Approved" : "Reviewed"}>{fmtDateTime(d.reviewedAt)}{d.reviewedBy ? ` by ${d.reviewedBy}` : ""}</Row>}
            </dl>

            <section aria-labelledby="docs-title">
              <h3 id="docs-title" className="mb-2 flex items-center gap-2 font-display text-lg font-bold text-[#0a1f44]">
                <Paperclip className="h-4 w-4 text-sky-600" /> Submitted documents <span className="text-sm font-medium text-slate-400">({d.documents.length})</span>
              </h3>
              {d.documents.length === 0 ? (
                <p className="rounded-xl bg-slate-50 px-4 py-4 text-sm text-slate-500">No documents on file. This account was set up before applications required them.</p>
              ) : (
                <ul className="space-y-2">{d.documents.map((doc) => <DocumentRow key={doc.id} appId={d.id} doc={doc} />)}</ul>
              )}
            </section>

            <div className="sticky bottom-0 -mx-1 bg-white px-1 pb-1 pt-3">
              {d.status === "approved" ? (
                <p className="text-center text-sm text-slate-500">
                  This account is active. Suspend or reactivate it from{" "}
                  <Link to={ADMIN_USERS} direction="root" className="font-semibold text-sky-700 hover:underline">User Management</Link>.
                </p>
              ) : (
                <div className="flex gap-2">
                  {d.status === "pending" && (
                    <button type="button" disabled={busy} onClick={() => onReject({ id: d.id, name: d.name })} className={cn(adminBtn, "h-11 flex-1 border border-red-300 bg-white text-red-700 hover:bg-red-50")}>
                      <X className="h-4 w-4" /> Reject
                    </button>
                  )}
                  <button type="button" disabled={busy} onClick={() => onApprove(d.id, d.name)} className={cn(adminBtn, "h-11 flex-1 bg-[#0a1f44] text-white hover:bg-[#0f3160]")}>
                    <Check className="h-4 w-4" /> {busy ? "Approving…" : d.status === "rejected" ? "Approve instead" : "Approve"}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

/* ------------------------------------------------------------------ page */

export default function AdminVerifications() {
  const [tab, setTab] = useState<ApplicationStatus>("pending");
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState<ApplicationSummary[] | null>(null);
  const [total, setTotal] = useState(0);
  const [counts, setCounts] = useState<ApplicationCounts | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);

  const [reviewing, setReviewing] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<{ id: string; name: string } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [detailKey, setDetailKey] = useState(0);

  useEffect(() => {
    let live = true;
    setError(null);
    void fetchApplications(tab, PAGE_SIZE, page * PAGE_SIZE).then((r) => {
      if (!live) return;
      if (r.ok) { setRows(r.data.items); setTotal(r.data.total); setCounts(r.data.counts); }
      else setError(r.message);
    });
    return () => { live = false; };
  }, [tab, page, reload]);

  const decided = useCallback(() => {
    setDetailKey((k) => k + 1);
    setReload((k) => k + 1);
  }, []);

  const approve = async (id: string, name: string) => {
    setBusy(id);
    const r = await approveApplication(id);
    setBusy(null);
    if (!r.ok) { toast.error(r.message); return; }
    toast.success(`${name} approved`, { description: "They can now sign in to their account." });
    decided();
  };

  const reject = async (id: string, name: string, reason: string) => {
    setBusy(id);
    const r = await rejectApplication(id, reason);
    setBusy(null);
    if (!r.ok) { toast.error(r.fieldErrors?.["reason"] ?? r.message); return; }
    toast.success(`${name}'s application was rejected`);
    setRejecting(null);
    decided();
  };

  const from = total === 0 ? 0 : page * PAGE_SIZE + 1;
  const to = Math.min(total, (page + 1) * PAGE_SIZE);
  const switchTab = (t: ApplicationStatus) => { setTab(t); setPage(0); setRows(null); };

  return (
    <AdminLayout title="School Verification">
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="font-display text-3xl font-bold leading-tight text-[#0a1f44] sm:text-4xl">School Verification</h2>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Review applications from school and university representatives. Only approved representatives can sign in and use their accounts.
          </p>
        </div>

        <div role="tablist" aria-label="Application status" className="flex flex-wrap gap-2">
          {TABS.map((t) => (
            <div key={t.value} role="presentation">
              <FilterChip active={tab === t.value} onClick={() => switchTab(t.value)}>
                {t.label}
                <span className={cn("ml-2 rounded-full px-2 py-0.5 text-xs", tab === t.value ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600")}>{counts ? counts[t.value] : "–"}</span>
              </FilterChip>
            </div>
          ))}
        </div>

        {error && (
          <div role="alert" className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <CircleAlert className="h-4 w-4 shrink-0" /> {error}
            <button type="button" onClick={() => setReload((k) => k + 1)} className="ml-auto font-semibold underline">Retry</button>
          </div>
        )}

        <section className={cn(adminCard, "overflow-hidden")} aria-label="Applications">
          <div role="table" aria-label="School representative applications" aria-busy={rows === null}>
            <div role="row" className={cn("hidden gap-4 border-b border-slate-100 bg-slate-50 px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 lg:grid", COLS)}>
              <span role="columnheader">Applicant</span>
              <span role="columnheader">School / University</span>
              <span role="columnheader">Documents</span>
              <span role="columnheader">Applied</span>
              <span role="columnheader">Status</span>
              <span role="columnheader" className="text-right">Actions</span>
            </div>

            {rows === null && !error ? (
              <div className="space-y-2 p-5">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
            ) : rows && rows.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-sky-50 text-sky-600"><ClipboardCheck className="h-6 w-6" /></span>
                <p className="font-semibold text-[#0a1f44]">{tab === "pending" ? "You're all caught up" : `No ${tab} applications`}</p>
                <p className="text-sm text-slate-500">{tab === "pending" ? "No school representatives are waiting for approval." : "Nothing to show here yet."}</p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {rows?.map((a) => (
                  <li key={a.id} role="row" className={cn("grid items-center gap-x-4 gap-y-3 px-4 py-4 transition-colors hover:bg-sky-50/40 sm:px-6", COLS)}>
                    <div role="cell" className="flex min-w-0 items-center gap-3">
                      <PersonAvatar name={a.name} src={a.photo ?? undefined} size="md" />
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-[#0a1f44]">{a.name}</p>
                        <p className="truncate text-xs text-slate-500" title={a.email}>{a.email}</p>
                        <p className="truncate text-xs text-slate-400">{a.designation}</p>
                      </div>
                    </div>
                    <div role="cell" className="flex min-w-0 items-center justify-between gap-3 text-sm lg:block">
                      <span className="text-xs font-semibold uppercase tracking-wide text-slate-400 lg:hidden">School</span>
                      <span className="flex min-w-0 items-center gap-2 font-medium text-slate-800"><GraduationCap className="hidden h-4 w-4 shrink-0 text-sky-500 lg:block" /><span className="truncate">{a.school}</span></span>
                    </div>
                    <div role="cell" className="flex items-center justify-between gap-3 text-sm lg:block">
                      <span className="text-xs font-semibold uppercase tracking-wide text-slate-400 lg:hidden">Documents</span>
                      <button type="button" onClick={() => setReviewing(a.id)} aria-label={`${a.documentCount} documents from ${a.name}, open to review`} className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-sky-100 hover:text-sky-800">
                        <Paperclip className="h-3.5 w-3.5" /> {a.documentCount} {a.documentCount === 1 ? "file" : "files"}
                      </button>
                    </div>
                    <div role="cell" className="flex items-center justify-between gap-3 text-sm text-slate-600 lg:block">
                      <span className="text-xs font-semibold uppercase tracking-wide text-slate-400 lg:hidden">Applied</span>
                      <time dateTime={a.submittedAt}>{fmtDate(a.submittedAt)}</time>
                    </div>
                    <div role="cell" className="flex items-center justify-between gap-3 lg:block">
                      <span className="text-xs font-semibold uppercase tracking-wide text-slate-400 lg:hidden">Status</span>
                      <StatusPill status={a.status} />
                    </div>
                    <div role="cell" className="flex flex-wrap gap-2 lg:flex-nowrap lg:justify-end">
                      <button type="button" onClick={() => setReviewing(a.id)} aria-label={`Review application from ${a.name}`} className={cn(adminBtn, "px-3 border border-slate-300 bg-white text-slate-700 hover:border-sky-300 hover:bg-sky-50 hover:text-[#0a1f44]")}>
                        <Eye className="h-4 w-4" /> Review
                      </button>
                      {a.status !== "approved" && (
                        <button type="button" disabled={busy === a.id} onClick={() => void approve(a.id, a.name)} aria-label={`Approve ${a.name}`} className={cn(adminBtn, "px-3 bg-[#0a1f44] text-white hover:bg-[#0f3160]")}>
                          <Check className="h-4 w-4" /> Approve
                        </button>
                      )}
                      {a.status === "pending" && (
                        <button type="button" disabled={busy === a.id} onClick={() => setRejecting({ id: a.id, name: a.name })} aria-label={`Reject ${a.name}`} className={cn(adminBtn, "px-3 border border-slate-300 bg-white text-slate-700 hover:border-red-300 hover:bg-red-50 hover:text-red-700")}>
                          <X className="h-4 w-4" /> Reject
                        </button>
                      )}
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
                <button type="button" disabled={page === 0} onClick={() => setPage((p) => p - 1)} className={cn(adminBtn, "border border-slate-300 text-slate-700 hover:bg-slate-50")}>Previous</button>
                <button type="button" disabled={to >= total} onClick={() => setPage((p) => p + 1)} className={cn(adminBtn, "bg-[#0a1f44] text-white hover:bg-[#0f3160]")}>Next</button>
              </div>
            </div>
          )}
        </section>
      </div>

      <ReviewSheet
        id={reviewing} busy={busy === reviewing} refreshKey={detailKey} onClose={() => setReviewing(null)}
        onApprove={(id, name) => void approve(id, name)} onReject={setRejecting}
      />
      <RejectDialog
        target={rejecting} busy={busy !== null} onCancel={() => setRejecting(null)}
        onConfirm={(reason) => rejecting && void reject(rejecting.id, rejecting.name, reason)}
      />
    </AdminLayout>
  );
}
