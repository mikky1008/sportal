import { useCallback, useEffect, useRef, useState } from "react";
import { Redirect } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { Page } from "@/components/Page";
import { Card, EmptyState, PageHeader, Pill, Select, btn } from "@/components/common";
import { PersonAvatar } from "@/components/avatar";
import { RepExportButton } from "@/components/RepExportButton";
import { Modal } from "@/components/listings";
import { useAuth } from "@/auth/AuthContext";
import { homePathFor, primaryRole } from "@/lib/roles";
import {
  fetchRepCoach, fetchRepCoaches, setCoachAffiliation,
  type AffiliationStatus, type CoachFilters, type RepCoach, type RepCoachDetail, type RepCoachList,
} from "@/lib/repCoachesApi";
import { cn } from "@/lib/utils";

/* ---------------------------------------------------------------------------------------------
   SCHOOL REPRESENTATIVE: MY COACHES  (route: /rep/coaches)

   Everything comes from GET /api/rep/coaches. The server takes the school from the signed-in
   representative's own approved account, so only that school's coaches can ever appear here.
   The one thing a representative can change is a coach's affiliation with their own school
   (remove / restore); verification and accounts stay with the administrator.
--------------------------------------------------------------------------------------------- */

const prettyDate = (iso: string) => {
  try { return format(parseISO(iso), "MMM d, yyyy"); } catch { return iso; }
};

const STATUS: Record<AffiliationStatus, { label: string; tone: "success" | "warning" | "default" }> = {
  affiliated: { label: "Affiliated", tone: "success" },
  pending: { label: "Pending", tone: "warning" },
  removed: { label: "Removed", tone: "default" },
};

const TABS: { value: CoachFilters["status"]; label: string }[] = [
  { value: "", label: "All" },
  { value: "affiliated", label: "Affiliated" },
  { value: "pending", label: "Pending" },
  { value: "removed", label: "Removed" },
];

function StatusPill({ coach }: { coach: Pick<RepCoach, "status" | "accountActive"> }) {
  const s = STATUS[coach.status];
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <Pill tone={s.tone}>{s.label}</Pill>
      {!coach.accountActive && <Pill tone="gold" title="This coach's Sportal account is suspended">Account suspended</Pill>}
    </span>
  );
}

/* ---- data ---- */

type ListState =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ready"; data: RepCoachList };

function useCoachList(filters: CoachFilters) {
  const [state, setState] = useState<ListState>({ kind: "loading" });
  const [more, setMore] = useState(false);
  const [moreError, setMoreError] = useState("");
  const sports = useRef<string[]>([]);
  const run = useRef(0);

  const load = useCallback(async (signal?: AbortSignal) => {
    const id = ++run.current;
    setState((cur) => (cur.kind === "ready" ? cur : { kind: "loading" }));
    const r = await fetchRepCoaches(filters, 0, signal);
    if (id !== run.current) return;
    if (!r.ok) { if (r.code !== "aborted") setState({ kind: "error", message: r.message }); return; }
    sports.current = r.data.sports;
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
    const r = await fetchRepCoaches(filters, state.data.items.length);
    setMore(false);
    if (!r.ok) { setMoreError(r.message); return; }
    setState((cur) => (cur.kind === "ready" ? { kind: "ready", data: { ...r.data, items: [...cur.data.items, ...r.data.items] } } : cur));
  };

  return { state, more, moreError, showMore, reload: () => void load() };
}

/* ---- profile + manage dialog ---- */

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 border-b py-2.5 last:border-b-0 sm:flex-row sm:gap-4">
      <dt className="text-sm text-muted-foreground sm:w-40 sm:shrink-0">{label}</dt>
      <dd className="min-w-0 whitespace-pre-line break-words text-sm font-medium">{value || "Not provided"}</dd>
    </div>
  );
}

function CoachDialog({ coachId, school, onClose, onChanged }: { coachId: string | null; school: string; onClose: () => void; onChanged: () => void }) {
  const [coach, setCoach] = useState<RepCoachDetail | null>(null);
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setCoach(null); setError(""); setConfirming(false);
    if (!coachId) return;
    let live = true;
    void fetchRepCoach(coachId).then((r) => {
      if (!live) return;
      if (r.ok) setCoach(r.data.coach); else setError(r.message);
    });
    return () => { live = false; };
  }, [coachId]);

  const act = async (action: "remove" | "restore") => {
    if (!coach) return;
    setBusy(true);
    const r = await setCoachAffiliation(coach.id, action);
    setBusy(false);
    if (!r.ok) { toast.error(r.message); setConfirming(false); return; }
    setCoach(r.data.coach); setConfirming(false);
    toast.success(action === "remove" ? `${r.data.coach.name} was removed from ${school}` : `${r.data.coach.name}'s affiliation was restored`);
    onChanged();
  };

  return (
    <Modal open={coachId !== null} onClose={() => !busy && onClose()} title="Coach profile">
      {!coach && !error && <p role="status" className="py-8 text-center text-sm text-muted-foreground">Loading…</p>}
      {error && <p role="alert" className="py-8 text-center text-sm text-muted-foreground">{error}</p>}
      {coach && (
        <>
          <div className="mb-3 flex items-center gap-3">
            <PersonAvatar name={coach.name} size="md" {...(coach.photo ? { src: coach.photo } : {})} />
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold">{coach.name}</p>
              <StatusPill coach={coach} />
            </div>
          </div>
          <dl>
            <Detail label="Email" value={coach.email} />
            <Detail label="Sport" value={coach.sport} />
            <Detail label="Position" value={coach.position} />
            <Detail label="Program" value={coach.programName} />
            <Detail label="Competition level" value={coach.competitionLevel} />
            <Detail label="Years of experience" value={coach.yearsExperience} />
            <Detail label="Connected athletes" value={String(coach.athletesConnected)} />
            <Detail label={coach.verifiedAt ? "Verified on" : "Applied on"} value={prettyDate(coach.verifiedAt ?? coach.appliedAt)} />
            <Detail label="About" value={coach.background} />
            <Detail label="Certifications" value={coach.certifications} />
          </dl>

          <div className="mt-4 rounded-2xl border p-4">
            <h3 className="font-semibold">Manage affiliation</h3>
            {coach.status === "pending" && (
              <p className="mt-1 text-sm text-muted-foreground">This request is waiting for a decision. Approve it or reject it with a reason in Coach Requests; once approved they join {school}.</p>
            )}
            {coach.status === "affiliated" && !confirming && (
              <>
                <p className="mt-1 text-sm text-muted-foreground">Removing ends this coach's affiliation with {school}. Their Sportal verification and account are not changed.</p>
                <button type="button" className={cn(btn.secondary, btn.sm, "mt-3 border-destructive/40 text-destructive hover:bg-destructive/10")} onClick={() => setConfirming(true)}>
                  Remove from school
                </button>
              </>
            )}
            {coach.status === "affiliated" && confirming && (
              <div role="alertdialog" aria-label="Confirm removal" className="mt-2">
                <p className="text-sm">Remove <strong>{coach.name}</strong> from {school}? They will be told, and you can restore the affiliation later.</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" disabled={busy} className={cn(btn.secondary, btn.sm)} onClick={() => setConfirming(false)}>Cancel</button>
                  <button type="button" disabled={busy} className={cn(btn.secondary, btn.sm, "border-destructive bg-destructive text-white hover:bg-destructive hover:brightness-110")} onClick={() => void act("remove")}>
                    {busy ? "Removing…" : "Yes, remove"}
                  </button>
                </div>
              </div>
            )}
            {coach.status === "removed" && (
              <>
                <p className="mt-1 text-sm text-muted-foreground">
                  {coach.accountActive ? `This coach is no longer affiliated with ${school}. You can restore the affiliation.` : "This coach's account is suspended, so the affiliation can't be restored right now."}
                </p>
                <button type="button" disabled={busy || !coach.accountActive} className={cn(btn.primary, btn.sm, "mt-3")} onClick={() => void act("restore")}>
                  {busy ? "Restoring…" : "Restore affiliation"}
                </button>
              </>
            )}
          </div>
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
    <div role="status" aria-label="Loading coaches" className="flex flex-col gap-3">
      {Array.from({ length: 5 }, (_, i) => <div key={i} className="h-16 animate-pulse rounded-2xl bg-muted" />)}
    </div>
  );
}

function RepCoaches() {
  const [query, setQuery] = useState("");
  const [q, setQ] = useState("");
  const [sport, setSport] = useState("");
  const [status, setStatus] = useState<CoachFilters["status"]>("");
  const [viewing, setViewing] = useState<string | null>(null);

  // Search as you type, without a request per key press.
  useEffect(() => {
    const t = setTimeout(() => setQ(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  const filters: CoachFilters = { q, sport, status };
  const list = useCoachList(useStableFilters(filters));
  const data = list.state.kind === "ready" ? list.state.data : null;
  const school = data?.school.name ?? "your school";
  const filtered = q.trim() !== "" || sport !== "" || status !== "";

  return (
    <div>
      <PageHeader title="My Coaches" subtitle={data ? `Coaches affiliated with ${data.school.name}` : "Coaches affiliated with your school"} action={<RepExportButton kind="coaches" noun="coaches" filters={{ q, sport, status }} />} />

      <Card className="mb-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">Search coaches by name or email</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} maxLength={80} placeholder="Search by name or email" className={cn(field, "pl-9")} />
          </label>
          <Select aria-label="Filter by sport" value={sport} onChange={(e) => setSport(e.target.value)} wrapperClassName="md:w-56">
            <option value="">All sports</option>
            {(data?.sports ?? []).map((s) => <option key={s} value={s}>{s}</option>)}
            {sport && !(data?.sports ?? []).includes(sport) && <option value={sport}>{sport}</option>}
          </Select>
        </div>
        <div role="group" aria-label="Filter by affiliation status" className="mt-4 flex flex-wrap gap-2">
          {TABS.map((t) => {
            const n = data ? (t.value ? data.counts[t.value] : data.counts.affiliated + data.counts.pending + data.counts.removed) : null;
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
        <Card title={`Coaches (${data.total})`}>
          {data.items.length === 0 ? (
            <EmptyState message={filtered ? "No coaches match your search or filters." : "No coaches are affiliated with your school yet. Coaches who request verification for your school will appear here."} />
          ) : (
            <>
              {/* tablet and up: a table */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b text-xs uppercase tracking-wider text-muted-foreground">
                      <th scope="col" className="pb-2.5 pr-3 font-medium">Coach</th>
                      <th scope="col" className="pb-2.5 pr-3 font-medium">Email</th>
                      <th scope="col" className="pb-2.5 pr-3 font-medium">Sport</th>
                      <th scope="col" className="pb-2.5 pr-3 font-medium">Affiliation</th>
                      <th scope="col" className="pb-2.5 text-right font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((c) => (
                      <tr key={c.id} className="border-b last:border-b-0">
                        <td className="py-3 pr-3">
                          <div className="flex items-center gap-3">
                            <PersonAvatar name={c.name} size="header" {...(c.photo ? { src: c.photo } : {})} />
                            <div className="min-w-0">
                              <p className="truncate font-semibold">{c.name}</p>
                              {c.position && <p className="truncate text-xs text-muted-foreground">{c.position}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="max-w-[14rem] truncate py-3 pr-3" title={c.email}>{c.email}</td>
                        <td className="py-3 pr-3">{c.sport || <span className="text-muted-foreground">Not set</span>}</td>
                        <td className="py-3 pr-3"><StatusPill coach={c} /></td>
                        <td className="py-3 text-right">
                          <button type="button" className={cn(btn.secondary, btn.sm)} aria-label={`View profile of ${c.name}`} onClick={() => setViewing(c.id)}>View profile</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* phones: one card per coach */}
              <ul className="flex flex-col gap-3 md:hidden">
                {data.items.map((c) => (
                  <li key={c.id} className="rounded-2xl border bg-card p-3">
                    <div className="flex items-center gap-3">
                      <PersonAvatar name={c.name} size="sm" {...(c.photo ? { src: c.photo } : {})} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">{c.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{c.email}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <span className="text-sm">{c.sport || "Sport not set"}</span>
                        <StatusPill coach={c} />
                      </div>
                      <button type="button" className={cn(btn.secondary, btn.sm)} aria-label={`View profile of ${c.name}`} onClick={() => setViewing(c.id)}>View profile</button>
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

      <CoachDialog coachId={viewing} school={school} onClose={() => setViewing(null)} onChanged={list.reload} />
    </div>
  );
}

/** Keeps the filters object the same between renders until a value really changes (so effects don't refire). */
function useStableFilters(f: CoachFilters): CoachFilters {
  const ref = useRef(f);
  if (ref.current.q !== f.q || ref.current.sport !== f.sport || ref.current.status !== f.status) ref.current = f;
  return ref.current;
}

export default function RepCoachesPage() {
  const { user } = useAuth();
  // Only school representatives have this page; anyone else goes to their own home.
  if (user && primaryRole(user.roles) !== "university_representative") return <Redirect to={homePathFor(user.roles)} />;
  return (
    <Page title="My Coaches">
      <RepCoaches />
    </Page>
  );
}
