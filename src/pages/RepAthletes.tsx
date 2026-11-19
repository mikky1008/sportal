import { useCallback, useEffect, useRef, useState } from "react";
import { Redirect } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { Award, Search } from "lucide-react";
import { Page } from "@/components/Page";
import { Card, EmptyState, PageHeader, Pill, Select, btn } from "@/components/common";
import { PersonAvatar } from "@/components/avatar";
import { Modal } from "@/components/listings";
import { useAuth } from "@/auth/AuthContext";
import { homePathFor, primaryRole } from "@/lib/roles";
import {
  fetchAthletePhoto, fetchRepAthlete, fetchRepAthletes,
  type AthleteFilters, type AthleteVerification, type RepAthlete, type RepAthleteDetail, type RepAthleteList,
} from "@/lib/repAthletesApi";
import { cn } from "@/lib/utils";

/* ---------------------------------------------------------------------------------------------
   SCHOOL REPRESENTATIVE: MY ATHLETES  (route: /rep/athletes)

   Everything comes from GET /api/rep/athletes. The server takes the school from the signed-in
   representative's own approved account, so only that school's athletes can ever appear. The page
   only reads: a representative views profiles and recorded achievements here.
   Verified = confirmed by a verified coach of the school. Not yet verified = the athlete's own
   profile names the school, but no coach of the school has accepted them yet.
--------------------------------------------------------------------------------------------- */

const prettyDate = (iso: string) => {
  try { return format(parseISO(iso), "MMM d, yyyy"); } catch { return iso; }
};

const TABS: { value: AthleteFilters["status"]; label: string }[] = [
  { value: "", label: "All" },
  { value: "verified", label: "Verified" },
  { value: "unverified", label: "Not yet verified" },
];

function VerificationPill({ status }: { status: AthleteVerification }) {
  return status === "verified" ? <Pill tone="success">Verified</Pill> : <Pill tone="warning">Not yet verified</Pill>;
}

/** The athlete's approved photo (fetched with the sign-in token), or their initials. */
function AthleteAvatar({ athlete, size }: { athlete: Pick<RepAthlete, "id" | "name" | "hasPhoto" | "photoVersion">; size: "header" | "sm" | "md" }) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    setSrc(null);
    if (!athlete.hasPhoto) return;
    let live = true;
    void fetchAthletePhoto(athlete.id, athlete.photoVersion).then((u) => { if (live) setSrc(u); });
    return () => { live = false; };
  }, [athlete.id, athlete.hasPhoto, athlete.photoVersion]);
  return <PersonAvatar name={athlete.name} size={size} {...(src ? { src } : {})} />;
}

const coachLabel = (a: RepAthlete) =>
  a.coaches.length === 0 ? null : a.coaches.length === 1 ? a.coaches[0]! : `${a.coaches[0]} +${a.coaches.length - 1} more`;

/* ---- data ---- */

type ListState = { kind: "loading" } | { kind: "error"; message: string } | { kind: "ready"; data: RepAthleteList };

function useAthleteList(filters: AthleteFilters) {
  const [state, setState] = useState<ListState>({ kind: "loading" });
  const [more, setMore] = useState(false);
  const [moreError, setMoreError] = useState("");
  const run = useRef(0);

  const load = useCallback(async (signal?: AbortSignal) => {
    const id = ++run.current;
    setState((cur) => (cur.kind === "ready" ? cur : { kind: "loading" }));
    const r = await fetchRepAthletes(filters, 0, signal);
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
    const r = await fetchRepAthletes(filters, state.data.items.length);
    setMore(false);
    if (!r.ok) { setMoreError(r.message); return; }
    setState((cur) => (cur.kind === "ready" ? { kind: "ready", data: { ...r.data, items: [...cur.data.items, ...r.data.items] } } : cur));
  };

  return { state, more, moreError, showMore, reload: () => void load() };
}

/* ---- profile dialog ---- */

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 border-b py-2.5 last:border-b-0 sm:flex-row sm:gap-4">
      <dt className="text-sm text-muted-foreground sm:w-40 sm:shrink-0">{label}</dt>
      <dd className="min-w-0 whitespace-pre-line break-words text-sm font-medium">{value || "Not provided"}</dd>
    </div>
  );
}

function AthleteDialog({ athleteId, school, onClose }: { athleteId: string | null; school: string; onClose: () => void }) {
  const [athlete, setAthlete] = useState<RepAthleteDetail | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setAthlete(null); setError("");
    if (!athleteId) return;
    let live = true;
    void fetchRepAthlete(athleteId).then((r) => {
      if (!live) return;
      if (r.ok) setAthlete(r.data.athlete); else setError(r.message);
    });
    return () => { live = false; };
  }, [athleteId]);

  return (
    <Modal open={athleteId !== null} onClose={onClose} title="Athlete profile">
      {!athlete && !error && <p role="status" className="py-8 text-center text-sm text-muted-foreground">Loading…</p>}
      {error && <p role="alert" className="py-8 text-center text-sm text-muted-foreground">{error}</p>}
      {athlete && (
        <>
          <div className="mb-3 flex items-center gap-3">
            <AthleteAvatar athlete={athlete} size="md" />
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold">{athlete.name}</p>
              <VerificationPill status={athlete.verification} />
            </div>
          </div>

          {athlete.verification === "unverified" && (
            <p className="mb-3 rounded-xl bg-accent px-3 py-2.5 text-sm text-accent-foreground">
              This athlete lists {school} on their profile, but no verified coach of your school has accepted them yet.
            </p>
          )}

          <dl>
            <Detail label="Sport" value={athlete.sport} />
            <Detail label="Playing position" value={athlete.position} />
            <Detail label="Year level" value={athlete.yearLevel} />
            <Detail label="Team" value={[athlete.teamStatus, athlete.teamName].filter(Boolean).join(" · ")} />
            <Detail label="Assigned coach" value={athlete.coaches.join(", ")} />
            {athlete.affiliatedSince && <Detail label="Affiliated since" value={prettyDate(athlete.affiliatedSince)} />}
            <Detail label="Coach-verified sessions" value={String(athlete.verifiedSessions)} />
            <Detail label="About" value={athlete.bio} />
          </dl>

          {athlete.skills.length > 0 && (
            <div className="mt-3">
              <h3 className="text-sm font-semibold">Skills</h3>
              <ul className="mt-2 flex flex-wrap gap-2">
                {athlete.skills.map((s) => <li key={s} className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">{s}</li>)}
              </ul>
            </div>
          )}

          <section aria-label="Recorded achievements" className="mt-4 rounded-2xl border p-4">
            <h3 className="flex items-center gap-2 font-semibold"><Award className="h-4 w-4" aria-hidden="true" /> Recorded achievements</h3>
            {athlete.achievements.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">No achievements recorded yet.</p>
            ) : (
              <ul className="mt-2">
                {athlete.achievements.map((a) => (
                  <li key={a.id} className="flex items-start justify-between gap-3 border-b py-2.5 text-sm last:border-b-0">
                    <span className="min-w-0 break-words font-medium">{a.title}</span>
                    {a.year && <span className="shrink-0 text-muted-foreground">{a.year}</span>}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <div className="mt-5 flex justify-end">
            <button type="button" className={btn.secondary} onClick={onClose}>Close</button>
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
    <div role="status" aria-label="Loading athletes" className="flex flex-col gap-3">
      {Array.from({ length: 5 }, (_, i) => <div key={i} className="h-16 animate-pulse rounded-2xl bg-muted" />)}
    </div>
  );
}

/** Keeps the filters object the same between renders until a value really changes (so effects don't refire). */
function useStableFilters(f: AthleteFilters): AthleteFilters {
  const ref = useRef(f);
  if (ref.current.q !== f.q || ref.current.sport !== f.sport || ref.current.status !== f.status) ref.current = f;
  return ref.current;
}

function RepAthletes() {
  const [query, setQuery] = useState("");
  const [q, setQ] = useState("");
  const [sport, setSport] = useState("");
  const [status, setStatus] = useState<AthleteFilters["status"]>("");
  const [viewing, setViewing] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setQ(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  const list = useAthleteList(useStableFilters({ q, sport, status }));
  const data = list.state.kind === "ready" ? list.state.data : null;
  const school = data?.school.name ?? "your school";
  const filtered = q.trim() !== "" || sport !== "" || status !== "";

  const viewBtn = (a: RepAthlete) => (
    <button type="button" className={cn(btn.secondary, btn.sm)} aria-label={`View profile of ${a.name}`} onClick={() => setViewing(a.id)}>View profile</button>
  );

  return (
    <div>
      <PageHeader title="My Athletes" subtitle={data ? `Student-athletes of ${data.school.name}` : "Student-athletes of your school"} />

      <Card className="mb-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">Search athletes by name</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} maxLength={80} placeholder="Search by name" className={cn(field, "pl-9")} />
          </label>
          <Select aria-label="Filter by sport" value={sport} onChange={(e) => setSport(e.target.value)} wrapperClassName="md:w-56">
            <option value="">All sports</option>
            {(data?.sports ?? []).map((s) => <option key={s} value={s}>{s}</option>)}
            {sport && !(data?.sports ?? []).includes(sport) && <option value={sport}>{sport}</option>}
          </Select>
        </div>
        <div role="group" aria-label="Filter by verification" className="mt-4 flex flex-wrap gap-2">
          {TABS.map((t) => {
            const n = data ? (t.value ? data.counts[t.value] : data.counts.verified + data.counts.unverified) : null;
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
        <p className="mt-3 text-xs text-muted-foreground">
          Verified means a verified coach of {school} has accepted the athlete. Not yet verified means the athlete lists {school} on their profile but no coach of yours has confirmed them.
        </p>
      </Card>

      {list.state.kind === "loading" && <Skeleton />}
      {list.state.kind === "error" && (
        <div role="alert" className="surface mx-auto flex max-w-lg flex-col items-center gap-3 px-6 py-10 text-center">
          <p className="text-sm text-muted-foreground">{list.state.message}</p>
          <button type="button" className={cn(btn.secondary, btn.sm)} onClick={list.reload}>Try again</button>
        </div>
      )}

      {data && (
        <Card title={`Athletes (${data.total})`}>
          {data.items.length === 0 ? (
            <EmptyState message={filtered ? "No athletes match your search or filters." : "No student-athletes are linked to your school yet. Athletes appear here once they list your school on their profile or a verified coach of yours accepts them."} />
          ) : (
            <>
              {/* tablet and up: a table */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b text-xs uppercase tracking-wider text-muted-foreground">
                      <th scope="col" className="pb-2.5 pr-3 font-medium">Athlete</th>
                      <th scope="col" className="pb-2.5 pr-3 font-medium">Sport</th>
                      <th scope="col" className="pb-2.5 pr-3 font-medium">Position</th>
                      <th scope="col" className="pb-2.5 pr-3 font-medium">Year level</th>
                      <th scope="col" className="pb-2.5 pr-3 font-medium">Assigned coach</th>
                      <th scope="col" className="pb-2.5 pr-3 font-medium">Verification</th>
                      <th scope="col" className="pb-2.5 text-right font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((a) => (
                      <tr key={a.id} className="border-b last:border-b-0">
                        <td className="py-3 pr-3">
                          <div className="flex items-center gap-3">
                            <AthleteAvatar athlete={a} size="header" />
                            <p className="truncate font-semibold">{a.name}</p>
                          </div>
                        </td>
                        <td className="py-3 pr-3">{a.sport || <span className="text-muted-foreground">Not set</span>}</td>
                        <td className="py-3 pr-3">{a.position || <span className="text-muted-foreground">Not set</span>}</td>
                        <td className="whitespace-nowrap py-3 pr-3">{a.yearLevel || <span className="text-muted-foreground">Not set</span>}</td>
                        <td className="max-w-[12rem] truncate py-3 pr-3" title={a.coaches.join(", ")}>{coachLabel(a) ?? <span className="text-muted-foreground">Unassigned</span>}</td>
                        <td className="py-3 pr-3"><VerificationPill status={a.verification} /></td>
                        <td className="py-3 text-right">{viewBtn(a)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* phones: one card per athlete */}
              <ul className="flex flex-col gap-3 md:hidden">
                {data.items.map((a) => (
                  <li key={a.id} className="rounded-2xl border bg-card p-3">
                    <div className="flex items-center gap-3">
                      <AthleteAvatar athlete={a} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">{a.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{[a.sport, a.position, a.yearLevel].filter(Boolean).join(" · ") || "No details yet"}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <VerificationPill status={a.verification} />
                        <span className="text-xs text-muted-foreground">Coach: {coachLabel(a) ?? "Unassigned"}</span>
                      </div>
                      {viewBtn(a)}
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

      <AthleteDialog athleteId={viewing} school={school} onClose={() => setViewing(null)} />
    </div>
  );
}

export default function RepAthletesPage() {
  const { user } = useAuth();
  // Only school representatives have this page; anyone else goes to their own home.
  if (user && primaryRole(user.roles) !== "university_representative") return <Redirect to={homePathFor(user.roles)} />;
  return (
    <Page title="My Athletes">
      <RepAthletes />
    </Page>
  );
}
