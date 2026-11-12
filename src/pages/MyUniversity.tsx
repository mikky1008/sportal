import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Building2, ExternalLink, MapPin } from "lucide-react";
import { CoachLayout } from "@/layouts/CoachLayout";
import { Card, EmptyState, PageHeader, Pill, btn } from "@/components/common";
import { PersonAvatar } from "@/components/avatar";
import {
  fetchUniversity, fetchUniversityAthletes, fetchUniversityCoaches,
  type NotAffiliatedReason, type UniversityAthlete, type UniversityCoach, type UniversityInfo,
} from "@/lib/universityApi";
import { cn } from "@/lib/utils";

const NOT_AFFILIATED: Record<NotAffiliatedReason, string> = {
  not_verified: "Your coach account hasn't been verified yet. Once a reviewer approves your verification and your organization is a university or college, your university appears here.",
  no_university: "Your account isn't linked to a university. This page is for coaches whose approved organization is a university or college.",
};

/** One section's loading / error / empty / data states, plus "Show more" for long lists. */
function useList<T>(fetcher: (offset: number) => Promise<{ ok: true; data: { items: T[]; total: number } } | { ok: false; message: string }>) {
  const [items, setItems] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState("");
  const [more, setMore] = useState(false);

  const load = useCallback(async (offset: number) => {
    offset === 0 ? setState("loading") : setMore(true);
    const r = await fetcher(offset);
    setMore(false);
    if (!r.ok) { setError(r.message); setState("error"); return; }
    setItems((cur) => (offset === 0 ? r.data.items : [...cur, ...r.data.items]));
    setTotal(r.data.total);
    setState("ready");
  }, [fetcher]);
  useEffect(() => { void load(0); }, [load]);
  return { items, total, state, error, more, reload: () => void load(0), showMore: () => void load(items.length) };
}

function Section<T>({ title, empty, list, render }: { title: string; empty: string; list: ReturnType<typeof useList<T>>; render: (item: T) => ReactNode }) {
  return (
    <Card title={`${title}${list.state === "ready" ? ` (${list.total})` : ""}`}>
      {list.state === "loading" && <p className="py-6 text-center text-sm text-muted-foreground">Loading…</p>}
      {list.state === "error" && (
        <div className="py-6 text-center">
          <p className="text-sm text-muted-foreground">{list.error}</p>
          <button className={cn(btn.secondary, "mt-3")} onClick={list.reload}>Try again</button>
        </div>
      )}
      {list.state === "ready" && list.items.length === 0 && <EmptyState message={empty} />}
      {list.state === "ready" && list.items.length > 0 && (
        <>
          <ul className="flex flex-col divide-y">{list.items.map(render)}</ul>
          {list.items.length < list.total && (
            <div className="pt-4 text-center">
              <button className={btn.secondary} disabled={list.more} onClick={list.showMore}>{list.more ? "Loading…" : "Show more"}</button>
            </div>
          )}
        </>
      )}
    </Card>
  );
}

function UniversityHeader({ info }: { info: UniversityInfo & { affiliated: true } }) {
  const u = info.university;
  const [logoBroken, setLogoBroken] = useState(false);
  return (
    <Card>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        {u.logoUrl && !logoBroken ? (
          <img src={u.logoUrl} alt={`${u.name} logo`} onError={() => setLogoBroken(true)} className="h-20 w-20 shrink-0 rounded-2xl border bg-card object-contain p-1" />
        ) : (
          <span aria-hidden="true" className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-muted text-muted-foreground"><Building2 className="h-9 w-9" /></span>
        )}
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold">{u.name}</h2>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {u.location && <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" />{u.location}</span>}
            {u.website && (
              <a href={u.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 font-semibold text-primary hover:underline">
                <ExternalLink className="h-4 w-4" />Website
              </a>
            )}
          </div>
          {u.description ? <p className="mt-3 text-sm">{u.description}</p> : <p className="mt-3 text-sm text-muted-foreground">No description has been added for this university yet.</p>}
        </div>
      </div>
    </Card>
  );
}

function MyUniversity() {
  const [info, setInfo] = useState<{ kind: "loading" } | { kind: "error"; message: string } | { kind: "ready"; info: UniversityInfo }>({ kind: "loading" });
  const loadInfo = useCallback(async () => {
    setInfo({ kind: "loading" });
    const r = await fetchUniversity();
    setInfo(r.ok ? { kind: "ready", info: r.data } : { kind: "error", message: r.message });
  }, []);
  useEffect(() => { void loadInfo(); }, [loadInfo]);

  const coachFetcher = useCallback((offset: number) => fetchUniversityCoaches(offset), []);
  const athleteFetcher = useCallback((offset: number) => fetchUniversityAthletes(offset), []);
  const coaches = useList<UniversityCoach>(coachFetcher);
  const athletes = useList<UniversityAthlete>(athleteFetcher);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="My University" subtitle="Your university, its verified coaches and its affiliated student-athletes." />

      {info.kind === "loading" && <p className="py-8 text-center text-sm text-muted-foreground">Loading…</p>}
      {info.kind === "error" && (
        <div className="py-8 text-center">
          <p className="text-sm text-muted-foreground">{info.message}</p>
          <button className={cn(btn.secondary, "mt-3")} onClick={() => void loadInfo()}>Try again</button>
        </div>
      )}
      {info.kind === "ready" && !info.info.affiliated && <EmptyState message={NOT_AFFILIATED[info.info.reason]} />}

      {info.kind === "ready" && info.info.affiliated && (
        <>
          <UniversityHeader info={info.info} />
          <div className="grid gap-6 lg:grid-cols-2">
            <Section
              title="Coaches"
              empty="No other verified coaches are affiliated with your university yet."
              list={coaches}
              render={(c) => (
                <li key={c.id} className="flex items-center gap-3 py-3">
                  <PersonAvatar name={c.name} size="md" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{c.name}{c.isYou && <span className="ml-2 text-xs font-normal text-muted-foreground">(you)</span>}</p>
                    <p className="truncate text-xs text-muted-foreground">{[c.position, c.sport].filter(Boolean).join(" · ") || "No position or sport listed"}</p>
                  </div>
                  <Pill tone="success">Verified</Pill>
                </li>
              )}
            />
            <Section
              title="Student-athletes"
              empty="No student-athletes have an approved affiliation with your university yet. Athletes who accept a connection with a verified coach of your university appear here."
              list={athletes}
              render={(a) => (
                <li key={a.id} className="flex items-center gap-3 py-3">
                  <PersonAvatar name={a.name} size="md" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{a.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{[a.sport, a.position].filter(Boolean).join(" · ") || "No sport or position listed"}</p>
                  </div>
                  <Pill tone="success">Approved</Pill>
                </li>
              )}
            />
          </div>
        </>
      )}
    </div>
  );
}

export default function MyUniversityPage() {
  return <CoachLayout><MyUniversity /></CoachLayout>;
}
