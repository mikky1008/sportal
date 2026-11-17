import { useCallback, useEffect, useRef, useState } from "react";
import { Redirect } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { FileText, Search } from "lucide-react";
import { toast } from "sonner";
import { Page } from "@/components/Page";
import { Card, EmptyState, PageHeader, Pill, btn } from "@/components/common";
import { PersonAvatar } from "@/components/avatar";
import { Modal } from "@/components/listings";
import { useAuth } from "@/auth/AuthContext";
import { homePathFor, primaryRole } from "@/lib/roles";
import {
  REASON_MAX, decideCoachRequest, fetchCoachRequest, fetchCoachRequests,
  type CoachRequest, type CoachRequestDetail, type CoachRequestList, type RequestFilters, type RequestStatus,
} from "@/lib/repRequestsApi";
import { cn } from "@/lib/utils";

/* ---------------------------------------------------------------------------------------------
   SCHOOL REPRESENTATIVE: COACH REQUESTS  (route: /rep/requests)

   Everything comes from GET /api/rep/coach-requests. The server takes the school from the signed-in
   representative's own approved account, so only requests sent to that school can ever appear, and
   only those can be decided. Approving makes the coach a verified Sportal coach at this school (the
   same step an administrator's approval runs); rejecting needs a reason the coach will read.
--------------------------------------------------------------------------------------------- */

const prettyDate = (iso: string) => {
  try { return format(parseISO(iso), "MMM d, yyyy"); } catch { return iso; }
};

const STATUS_LABEL: Record<RequestStatus, string> = { pending: "Pending", approved: "Approved", rejected: "Rejected" };

const TABS: { value: RequestFilters["status"]; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "", label: "All" },
];

function StatusPill({ status }: { status: RequestStatus }) {
  if (status === "rejected")
    return <span className="inline-flex items-center rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-semibold text-destructive">{STATUS_LABEL.rejected}</span>;
  return <Pill tone={status === "approved" ? "success" : "warning"}>{STATUS_LABEL[status]}</Pill>;
}

/* ---- data ---- */

type ListState = { kind: "loading" } | { kind: "error"; message: string } | { kind: "ready"; data: CoachRequestList };

function useRequestList(filters: RequestFilters) {
  const [state, setState] = useState<ListState>({ kind: "loading" });
  const [more, setMore] = useState(false);
  const [moreError, setMoreError] = useState("");
  const run = useRef(0);

  const load = useCallback(async (signal?: AbortSignal) => {
    const id = ++run.current;
    setState((cur) => (cur.kind === "ready" ? cur : { kind: "loading" }));
    const r = await fetchCoachRequests(filters, 0, signal);
    if (id !== run.current) return;
    if (!r.ok) { if (r.code !== "aborted") setState({ kind: "error", message: r.message }); return; }
    setMoreError("");
    setState({ kind: "ready", data: r.data });
  }, [filters]);

  useEffect(() => {
    const ctrl = new AbortController();
    void load(ctrl.signal);
    return () => ctrl.abort();
  }, [load]);

  const showMore = async () => {
    if (state.kind !== "ready") return;
    setMore(true); setMoreError("");
    const r = await fetchCoachRequests(filters, state.data.items.length);
    setMore(false);
    if (!r.ok) { setMoreError(r.message); return; }
    setState((cur) => (cur.kind === "ready" ? { kind: "ready", data: { ...r.data, items: [...cur.data.items, ...r.data.items] } } : cur));
  };

  return { state, more, moreError, showMore, reload: () => void load() };
}

/* ---- review dialog ---- */

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 border-b py-2.5 last:border-b-0 sm:flex-row sm:gap-4">
      <dt className="text-sm text-muted-foreground sm:w-44 sm:shrink-0">{label}</dt>
      <dd className="min-w-0 whitespace-pre-line break-words text-sm font-medium">{value || "Not provided"}</dd>
    </div>
  );
}

type Step = "view" | "approve" | "reject";

function ReviewDialog({ coachId, school, onClose, onDecided }: { coachId: string | null; school: string; onClose: () => void; onDecided: () => void }) {
  const [req, setReq] = useState<CoachRequestDetail | null>(null);
  const [error, setError] = useState("");
  const [step, setStep] = useState<Step>("view");
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setReq(null); setError(""); setStep("view"); setReason(""); setReasonError("");
    if (!coachId) return;
    let live = true;
    void fetchCoachRequest(coachId).then((r) => {
      if (!live) return;
      if (r.ok) setReq(r.data.request); else setError(r.message);
    });
    return () => { live = false; };
  }, [coachId]);

  const decide = async (decision: "approve" | "reject") => {
    if (!req) return;
    if (decision === "reject" && reason.trim().length === 0) { setReasonError("Please give a reason. The coach will read it."); return; }
    setBusy(true); setReasonError("");
    const r = await decideCoachRequest(req.id, decision, reason.trim());
    setBusy(false);
    if (!r.ok) {
      if (r.fieldErrors?.note) setReasonError(r.fieldErrors.note);
      else { toast.error(r.message); if (r.status === 409) { setStep("view"); onDecided(); } }
      return;
    }
    setReq(r.data.request); setStep("view");
    toast.success(decision === "approve" ? `${r.data.request.name} was approved` : `${r.data.request.name}'s request was rejected`);
    onDecided();
  };

  return (
    <Modal open={coachId !== null} onClose={() => !busy && onClose()} title="Review coach request">
      {!req && !error && <p role="status" className="py-8 text-center text-sm text-muted-foreground">Loading…</p>}
      {error && <p role="alert" className="py-8 text-center text-sm text-muted-foreground">{error}</p>}
      {req && (
        <>
          <div className="mb-3 flex items-center gap-3">
            <PersonAvatar name={req.name} size="md" {...(req.photo ? { src: req.photo } : {})} />
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold">{req.name}</p>
              <StatusPill status={req.status} />
            </div>
          </div>

          <dl>
            <Detail label="Email" value={req.email} />
            <Detail label="Sport" value={req.sport} />
            <Detail label="Position" value={req.position} />
            <Detail label="Program" value={req.programName} />
            <Detail label="Competition level" value={req.competitionLevel} />
            <Detail label="Years of experience" value={req.yearsExperience} />
            <Detail label="Application date" value={prettyDate(req.appliedAt)} />
            <Detail label="About" value={req.background} />
          </dl>

          <section aria-label="Supporting documents" className="mt-4 rounded-2xl border p-4">
            <h3 className="flex items-center gap-2 font-semibold"><FileText className="h-4 w-4" aria-hidden="true" /> Supporting documents</h3>
            <p className="mt-1 text-xs text-muted-foreground">What the coach submitted to prove who they are. Coaches enter these details; they don't upload files.</p>
            <dl className="mt-2">
              {req.supportingDocuments.map((d) => <Detail key={d.label} label={d.label} value={d.value} />)}
            </dl>
          </section>

          <section aria-label="Decision" className="mt-4 rounded-2xl border p-4">
            <h3 className="font-semibold">Decision</h3>

            {req.status !== "pending" && (
              <div className="mt-2 text-sm">
                <p>
                  {req.status === "approved" ? "Approved" : "Rejected"}{req.decidedAt ? ` on ${prettyDate(req.decidedAt)}` : ""}.
                </p>
                {req.status === "rejected" && req.reason && <p className="mt-2 rounded-xl bg-muted px-3 py-2.5"><span className="font-medium">Reason given: </span>{req.reason}</p>}
              </div>
            )}

            {req.status === "pending" && step === "view" && (
              <>
                <p className="mt-1 text-sm text-muted-foreground">Check the details and supporting documents above, then decide for {school}.</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" className={cn(btn.primary, btn.sm)} onClick={() => setStep("approve")}>Approve</button>
                  <button type="button" className={cn(btn.secondary, btn.sm, "border-destructive/40 text-destructive hover:bg-destructive/10")} onClick={() => setStep("reject")}>Reject</button>
                </div>
              </>
            )}

            {req.status === "pending" && step === "approve" && (
              <div role="alertdialog" aria-label="Confirm approval" className="mt-2">
                <p className="text-sm">
                  Approve <strong>{req.name}</strong> as a coach of {school}? They become a verified Sportal coach, join your school, and can connect with athletes.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" disabled={busy} className={cn(btn.secondary, btn.sm)} onClick={() => setStep("view")}>Cancel</button>
                  <button type="button" disabled={busy} className={cn(btn.primary, btn.sm)} onClick={() => void decide("approve")}>{busy ? "Approving…" : "Yes, approve"}</button>
                </div>
              </div>
            )}

            {req.status === "pending" && step === "reject" && (
              <div role="group" aria-label="Reject request" className="mt-2">
                <label htmlFor="reject-reason" className="text-sm font-medium">Reason for rejecting <span className="text-destructive">*</span></label>
                <p className="text-xs text-muted-foreground">The coach will read this.</p>
                <textarea
                  id="reject-reason" value={reason} maxLength={REASON_MAX} rows={4} disabled={busy}
                  onChange={(e) => { setReason(e.target.value); setReasonError(""); }}
                  aria-invalid={reasonError ? true : undefined} aria-describedby="reject-reason-help"
                  className="mt-1.5 w-full resize-y rounded-xl border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary"
                  placeholder="For example: the credential could not be verified."
                />
                <div id="reject-reason-help" className="mt-1 flex items-start justify-between gap-3 text-xs">
                  <span role="alert" className="text-destructive">{reasonError}</span>
                  <span className="shrink-0 text-muted-foreground">{reason.length}/{REASON_MAX}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" disabled={busy} className={cn(btn.secondary, btn.sm)} onClick={() => { setStep("view"); setReasonError(""); }}>Cancel</button>
                  <button
                    type="button" disabled={busy || reason.trim().length === 0}
                    className={cn(btn.secondary, btn.sm, "border-destructive bg-destructive text-white hover:bg-destructive hover:brightness-110")}
                    onClick={() => void decide("reject")}
                  >
                    {busy ? "Rejecting…" : "Confirm rejection"}
                  </button>
                </div>
              </div>
            )}
          </section>

          <div className="mt-5 flex justify-end">
            <button type="button" className={btn.secondary} disabled={busy} onClick={onClose}>Close</button>
          </div>
        </>
      )}
    </Modal>
  );
}

/* ---- page ---- */

const field = "w-full rounded-xl border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary";

function Skeleton() {
  return (
    <div role="status" aria-label="Loading requests" className="flex flex-col gap-3">
      {Array.from({ length: 5 }, (_, i) => <div key={i} className="h-16 animate-pulse rounded-2xl bg-muted" />)}
    </div>
  );
}

/** Keeps the filters object the same between renders until a value really changes (so effects don't refire). */
function useStableFilters(f: RequestFilters): RequestFilters {
  const ref = useRef(f);
  if (ref.current.q !== f.q || ref.current.status !== f.status) ref.current = f;
  return ref.current;
}

function Documents({ r }: { r: CoachRequest }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm">
      <FileText className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      <span className="truncate">{r.credentialType || "Credentials"}</span>
    </span>
  );
}

function RepRequests() {
  const [query, setQuery] = useState("");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<RequestFilters["status"]>("pending");
  const [reviewing, setReviewing] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setQ(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  const list = useRequestList(useStableFilters({ q, status }));
  const data = list.state.kind === "ready" ? list.state.data : null;
  const school = data?.school.name ?? "your school";
  const filtered = q.trim() !== "";

  const reviewBtn = (r: CoachRequest) => (
    <button type="button" className={cn(r.status === "pending" ? btn.primary : btn.secondary, btn.sm)} aria-label={`${r.status === "pending" ? "Review" : "View"} request from ${r.name}`} onClick={() => setReviewing(r.id)}>
      {r.status === "pending" ? "Review" : "View"}
    </button>
  );

  return (
    <div>
      <PageHeader title="Coach Requests" subtitle={data ? `Affiliation requests sent to ${data.school.name}` : "Affiliation requests sent to your school"} />

      <Card className="mb-6">
        <label className="relative block">
          <span className="sr-only">Search requests by name or email</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} maxLength={80} placeholder="Search by name or email" className={cn(field, "pl-9")} />
        </label>
        <div role="group" aria-label="Filter by status" className="mt-4 flex flex-wrap gap-2">
          {TABS.map((t) => {
            const n = data ? (t.value ? data.counts[t.value] : data.counts.pending + data.counts.approved + data.counts.rejected) : null;
            const active = status === t.value;
            return (
              <button
                key={t.label} type="button" aria-pressed={active} onClick={() => setStatus(t.value)}
                className={cn("rounded-full border px-3.5 py-1.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-muted")}
              >
                {t.label}{n !== null && <span className={cn("ml-1.5 text-xs", active ? "text-primary-foreground/80" : "text-muted-foreground")}>{n}</span>}
              </button>
            );
          })}
        </div>
      </Card>

      {list.state.kind === "loading" && <Skeleton />}
      {list.state.kind === "error" && (
        <div role="alert" className="surface mx-auto flex max-w-lg flex-col items-center gap-3 px-6 py-10 text-center">
          <p className="text-sm text-muted-foreground">{list.state.message}</p>
          <button type="button" className={cn(btn.secondary, btn.sm)} onClick={list.reload}>Try again</button>
        </div>
      )}

      {data && (
        <Card title={`Requests (${data.total})`}>
          {data.items.length === 0 ? (
            <EmptyState message={filtered ? "No requests match your search." : status === "pending" ? "No coach requests are waiting for your school right now." : "Nothing to show here yet."} />
          ) : (
            <>
              {/* tablet and up: a table */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b text-xs uppercase tracking-wider text-muted-foreground">
                      <th scope="col" className="pb-2.5 pr-3 font-medium">Applicant</th>
                      <th scope="col" className="pb-2.5 pr-3 font-medium">Email</th>
                      <th scope="col" className="pb-2.5 pr-3 font-medium">Sport</th>
                      <th scope="col" className="pb-2.5 pr-3 font-medium">Supporting documents</th>
                      <th scope="col" className="pb-2.5 pr-3 font-medium">Application date</th>
                      <th scope="col" className="pb-2.5 pr-3 font-medium">Status</th>
                      <th scope="col" className="pb-2.5 text-right font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((r) => (
                      <tr key={r.id} className="border-b last:border-b-0">
                        <td className="py-3 pr-3">
                          <div className="flex items-center gap-3">
                            <PersonAvatar name={r.name} size="header" {...(r.photo ? { src: r.photo } : {})} />
                            <div className="min-w-0">
                              <p className="truncate font-semibold">{r.name}</p>
                              {r.position && <p className="truncate text-xs text-muted-foreground">{r.position}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="max-w-[13rem] truncate py-3 pr-3" title={r.email}>{r.email}</td>
                        <td className="py-3 pr-3">{r.sport || <span className="text-muted-foreground">Not set</span>}</td>
                        <td className="max-w-[11rem] py-3 pr-3"><Documents r={r} /></td>
                        <td className="whitespace-nowrap py-3 pr-3">{prettyDate(r.appliedAt)}</td>
                        <td className="py-3 pr-3"><StatusPill status={r.status} /></td>
                        <td className="py-3 text-right">{reviewBtn(r)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* phones: one card per request */}
              <ul className="flex flex-col gap-3 md:hidden">
                {data.items.map((r) => (
                  <li key={r.id} className="rounded-2xl border bg-card p-3">
                    <div className="flex items-center gap-3">
                      <PersonAvatar name={r.name} size="sm" {...(r.photo ? { src: r.photo } : {})} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">{r.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{r.email}</p>
                      </div>
                      <StatusPill status={r.status} />
                    </div>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                      <div className="min-w-0 text-xs text-muted-foreground">
                        <p>{r.sport || "Sport not set"} · Applied {prettyDate(r.appliedAt)}</p>
                        <p className="mt-0.5"><Documents r={r} /></p>
                      </div>
                      {reviewBtn(r)}
                    </div>
                  </li>
                ))}
              </ul>

              {data.items.length < data.total && (
                <div className="pt-4 text-center">
                  <button type="button" className={btn.secondary} disabled={list.more} onClick={() => void list.showMore()}>{list.more ? "Loading…" : "Show more"}</button>
                  {list.moreError && <p role="alert" className="mt-2 text-xs text-destructive">{list.moreError}</p>}
                </div>
              )}
            </>
          )}
        </Card>
      )}

      <ReviewDialog coachId={reviewing} school={school} onClose={() => setReviewing(null)} onDecided={list.reload} />
    </div>
  );
}

export default function RepRequestsPage() {
  const { user } = useAuth();
  // Only school representatives have this page; anyone else goes to their own home.
  if (user && primaryRole(user.roles) !== "university_representative") return <Redirect to={homePathFor(user.roles)} />;
  return (
    <Page title="Coach Requests">
      <RepRequests />
    </Page>
  );
}
