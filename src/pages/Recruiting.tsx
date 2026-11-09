import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearch } from "@/router-compat";
import { toast } from "sonner";
import { Info, Search } from "lucide-react";
import { useAuth } from "@/auth/AuthContext";
import { Page } from "@/components/Page";
import { CoachLayout } from "@/layouts/CoachLayout";
import { Card, PageHeader, Select, btn } from "@/components/common";
import { AthleteCard, InquiryRow, ThreadView, WatchNote } from "@/components/recruiting";
import { CoachCompletionCard } from "@/components/profile-completion-cards";
import {
  answerInquiry, fetchDirectory, fetchInquiries, fetchMessages, fetchWatchlist, postMessage, saveNote, setWatched,
  type DirectoryFilters, type DirectoryPage, type InquiryItem,
} from "@/lib/recruitingApi";
import type { DirectoryAthlete, ThreadMessage } from "@/types";
import { cn } from "@/lib/utils";

const parseRecruitingSearch = (search: Record<string, unknown>) => ({
  tab: typeof search["tab"] === "string" ? search["tab"] : undefined,
  thread: typeof search["thread"] === "string" ? search["thread"] : undefined,
});

const sortOptions: { id: DirectoryFilters["sort"]; label: string }[] = [
  { id: "score", label: "Highest score" },
  { id: "verified", label: "Most coach-verified" },
  { id: "name", label: "Name (A–Z)" },
];

type Tab = "discover" | "watchlist" | "messages" | "inbox";
const COACH_TABS: { id: Tab; label: string }[] = [
  { id: "discover", label: "Discover" },
  { id: "watchlist", label: "Watchlist" },
  { id: "messages", label: "Messages" },
];
const ATHLETE_TABS: { id: Tab; label: string }[] = [{ id: "inbox", label: "Inbox" }];

const message = (e: { message?: string }, fallback: string) => e.message || fallback;

/** The signed-in user's inquiries, kept fresh while the screen is open. */
function useInquiries() {
  const [items, setItems] = useState<InquiryItem[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState("");
  const refresh = useCallback(async () => {
    const r = await fetchInquiries();
    if (r.ok) { setItems(r.data); setState("ready"); } else { setError(r.message); setState((s) => (s === "ready" ? s : "error")); }
  }, []);
  useEffect(() => {
    void refresh();
    const t = setInterval(() => void refresh(), 20_000);
    return () => clearInterval(t);
  }, [refresh]);
  return { items, state, error, refresh };
}

/** One conversation. It is fetched when opened and every few seconds while it stays open. */
function useThread(inquiryId: string | null, onChange: () => void) {
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  useEffect(() => {
    if (!inquiryId) return;
    let live = true;
    const load = async () => {
      const r = await fetchMessages(inquiryId);
      if (live && r.ok) { setMessages(r.data); onChange(); }
    };
    setMessages([]);
    void load();
    const t = setInterval(() => void load(), 8_000);
    return () => { live = false; clearInterval(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onChange only refreshes the unread counts
  }, [inquiryId]);
  const send = async (body: string): Promise<boolean> => {
    if (!inquiryId) return false;
    const r = await postMessage(inquiryId, body);
    if (!r.ok) { toast.error(message(r, "Could not send the message.")); return false; }
    setMessages((m) => [...m, r.data]);
    return true;
  };
  return { messages, send };
}

function Recruiting() {
  const { user } = useAuth();
  const isCoach = !!user?.roles.includes("coach");
  const isAthlete = !!user?.roles.includes("student_athlete");
  const search = useSearch(parseRecruitingSearch);
  const tabs = isCoach ? COACH_TABS : ATHLETE_TABS;
  const [tab, setTab] = useState<Tab>(() => {
    const wanted = tabs.find((t) => t.id === search.tab);
    return wanted ? wanted.id : tabs[0]!.id;
  });
  // undefined = follow the ?thread= deep link; null = explicitly closed
  const [threadPick, setThreadPick] = useState<string | null | undefined>(undefined);
  const openThreadId = threadPick === undefined ? (search.thread ?? null) : threadPick;

  const inquiries = useInquiries();
  const openInquiry = openThreadId ? inquiries.items.find((i) => i.id === openThreadId) : undefined;
  const thread = useThread(openInquiry ? openInquiry.id : null, inquiries.refresh);

  // ---- coach: discover ----
  const [filters, setFilters] = useState<DirectoryFilters>({ q: "", sport: "All sports", position: "All positions", school: "All schools", skill: "All skills", verifiedOnly: false, sort: "score" });
  const [page, setPage] = useState<DirectoryPage | null>(null);
  const [dirState, setDirState] = useState<"loading" | "ready" | "error">("loading");
  const [dirError, setDirError] = useState("");
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const set = (patch: Partial<DirectoryFilters>) => setFilters((f) => ({ ...f, ...patch }));

  useEffect(() => {
    if (!isCoach || tab !== "discover") return;
    const ctrl = new AbortController();
    // Wait for a pause in typing, and cancel the request if a newer one replaces it.
    const t = setTimeout(async () => {
      setDirState((s) => (s === "ready" ? s : "loading"));
      const r = await fetchDirectory(filters, ctrl.signal);
      if (ctrl.signal.aborted) return;
      if (r.ok) { setPage(r.data); setSaved(new Set(r.data.watchlist)); setDirState("ready"); } else { setDirError(message(r, "Could not load athletes.")); setDirState("error"); }
    }, filters.q ? 300 : 0);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [isCoach, tab, filters]);

  // ---- coach: watchlist ----
  const [watchlist, setWatchlist] = useState<(DirectoryAthlete & { note: string })[] | null>(null);
  const loadWatchlist = useCallback(async () => {
    const r = await fetchWatchlist();
    if (r.ok) setWatchlist(r.data); else toast.error(message(r, "Could not load your watchlist."));
  }, []);
  useEffect(() => { if (isCoach && tab === "watchlist") void loadWatchlist(); }, [isCoach, tab, loadWatchlist]);

  const toggleWatch = async (id: string) => {
    const on = !saved.has(id);
    const r = await setWatched(id, on);
    if (!r.ok) return void toast.error(message(r, "Could not update the watchlist."));
    setSaved((s) => { const n = new Set(s); if (on) n.add(id); else n.delete(id); return n; });
    if (tab === "watchlist") void loadWatchlist();
  };
  const onNote = async (id: string, note: string) => {
    const r = await saveNote(id, note);
    if (!r.ok) toast.error(message(r, "Could not save the note."));
    else setWatchlist((w) => w && w.map((a) => (a.id === id ? { ...a, note: r.data.note } : a)));
  };

  const respond = async (id: string, decision: "Accepted" | "Declined") => {
    const r = await answerInquiry(id, decision);
    if (!r.ok) toast.error(message(r, "Could not update the inquiry."));
    else toast.success(decision === "Accepted" ? "Inquiry accepted — conversation unlocked" : "Inquiry declined");
    void inquiries.refresh();
  };

  const pickTab = (t: Tab) => { setTab(t); setThreadPick(undefined); };

  if (!isCoach && !isAthlete) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Recruiting" />
        <Card><p className="text-sm text-muted-foreground">Recruiting is for coaches (who find athletes) and student-athletes (who answer inquiries).</p></Card>
      </div>
    );
  }

  const unreadTotal = inquiries.items.reduce((n, i) => n + i.unread, 0);
  const nameOf = (i: InquiryItem) => (isCoach ? i.athleteName : i.recruiterName);
  const threadView = openInquiry && (
    <ThreadView
      inquiry={openInquiry}
      title={nameOf(openInquiry)}
      subtitle={openInquiry.organization}
      side={isCoach ? "recruiter" : "athlete"}
      messages={thread.messages}
      onBack={() => setThreadPick(null)}
      onSend={(body) => void thread.send(body)}
    />
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Recruiting"
        subtitle={isCoach ? "Search athlete showcases, build a watchlist and send recruitment inquiries." : "Coaches who found your showcase. You decide who can start a conversation."}
      />
      {isCoach && <CoachCompletionCard />}

      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => pickTab(t.id)}
            aria-pressed={tab === t.id}
            className={cn("whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold transition", tab === t.id ? "border-primary bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground")}
          >
            {t.label}
            {t.id === "watchlist" && saved.size > 0 && ` (${saved.size})`}
            {(t.id === "messages" || t.id === "inbox") && inquiries.items.length > 0 && ` (${inquiries.items.length})`}
            {(t.id === "messages" || t.id === "inbox") && unreadTotal > 0 && <span className="ml-2 rounded-full bg-primary-foreground/20 px-1.5 text-xs">{unreadTotal} new</span>}
          </button>
        ))}
      </div>

      {isCoach && tab === "discover" && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <label className="relative flex flex-col gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:col-span-2 lg:col-span-1">
              Search
              <span className="sr-only">Search athletes</span>
              <Search className="pointer-events-none absolute bottom-3 left-3 h-4 w-4 text-muted-foreground" />
              <input type="search" value={filters.q} onChange={(e) => set({ q: e.target.value })} placeholder="Name, school, skill…" className="h-11 w-full rounded-xl border bg-card pl-9 pr-3 text-sm font-normal normal-case tracking-normal outline-none focus:ring-2 focus:ring-ring" />
            </label>
            {[
              { label: "Sport", value: filters.sport, set: (v: string) => set({ sport: v, position: "All positions", skill: "All skills" }), all: "All sports", opts: page?.options.sports ?? [] },
              { label: "Position", value: filters.position, set: (v: string) => set({ position: v }), all: "All positions", opts: page?.options.positions ?? [] },
              { label: "School", value: filters.school, set: (v: string) => set({ school: v }), all: "All schools", opts: page?.options.schools ?? [] },
              { label: "Skill", value: filters.skill, set: (v: string) => set({ skill: v }), all: "All skills", opts: page?.options.skills ?? [] },
            ].map((f) => (
              <label key={f.label} className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {f.label}
                <Select value={f.value} onChange={(e) => f.set(e.target.value)}>
                  <option>{f.all}</option>
                  {f.opts.map((o) => <option key={o}>{o}</option>)}
                </Select>
              </label>
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input type="checkbox" checked={filters.verifiedOnly} onChange={(e) => set({ verifiedOnly: e.target.checked })} className="h-4 w-4 accent-[var(--primary)]" />
              Coach-verified results only
            </label>
            <div className="flex items-center gap-3 text-sm">
              <span className="text-muted-foreground" aria-live="polite">{page ? `${page.total} ${page.total === 1 ? "athlete" : "athletes"}` : ""}</span>
              <label className="flex items-center gap-2 font-medium">
                Sort
                <Select size="sm" value={filters.sort} onChange={(e) => set({ sort: e.target.value as DirectoryFilters["sort"] })}>
                  {sortOptions.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                </Select>
              </label>
            </div>
          </div>
          {dirState === "loading" && !page && <p className="py-8 text-center text-sm text-muted-foreground">Loading athletes…</p>}
          {dirState === "error" && <p className="py-8 text-center text-sm text-muted-foreground">{dirError}</p>}
          {page && (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {page.items.map((a) => <AthleteCard key={a.id} a={a} watched={saved.has(a.id)} onToggleWatch={() => void toggleWatch(a.id)} />)}
            </div>
          )}
          {page && !page.items.length && <p className="py-8 text-center text-sm text-muted-foreground">No athletes match these filters yet.</p>}
        </>
      )}

      {isCoach && tab === "watchlist" && (
        watchlist === null ? <p className="py-8 text-center text-sm text-muted-foreground">Loading…</p>
        : watchlist.length ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {watchlist.map((a) => (
              <AthleteCard key={a.id} a={a} watched onToggleWatch={() => void toggleWatch(a.id)} footer={<WatchNote athleteId={a.id} value={a.note} onSave={(n) => void onNote(a.id, n)} />} />
            ))}
          </div>
        ) : <p className="py-8 text-center text-sm text-muted-foreground">No saved athletes yet — tap the bookmark on any showcase to add it here.</p>
      )}

      {isCoach && tab === "messages" && (
        threadView ? threadView
        : inquiries.state === "loading" ? <p className="py-8 text-center text-sm text-muted-foreground">Loading…</p>
        : inquiries.items.length ? (
          <ul className="flex flex-col gap-2">
            {inquiries.items.map((i) => (
              <InquiryRow key={i.id} inquiry={i} title={i.athleteName} subtitle={i.unread ? `${i.organization} · ${i.unread} new` : i.organization} onClick={() => setThreadPick(i.id)} />
            ))}
          </ul>
        ) : <p className="py-8 text-center text-sm text-muted-foreground">No inquiries yet. Open an athlete showcase and send your first inquiry.</p>
      )}

      {isAthlete && !isCoach && tab === "inbox" && (
        <>
          <Card>
            <div className="flex gap-3 text-sm text-muted-foreground">
              <Info className="h-5 w-5 shrink-0 text-primary" />
              <span>These are inquiries sent to your showcase. You decide who can start a conversation — accepting unlocks messaging; declining closes it. Prefer not to be found? Turn off "Visible to coaches &amp; universities" in <Link to="/settings" className="font-semibold text-primary">Settings</Link>.</span>
            </div>
          </Card>
          {threadView ? threadView
          : inquiries.state === "loading" ? <p className="py-8 text-center text-sm text-muted-foreground">Loading…</p>
          : inquiries.state === "error" ? <p className="py-8 text-center text-sm text-muted-foreground">{inquiries.error}</p>
          : inquiries.items.length ? (
            <ul className="flex flex-col gap-2">
              {inquiries.items.map((i) => (
                <InquiryRow
                  key={i.id}
                  inquiry={i}
                  title={i.recruiterName}
                  subtitle={i.unread ? `${i.organization} · ${i.unread} new` : i.organization}
                  onClick={() => setThreadPick(i.id)}
                  actions={i.status === "Pending" ? (
                    <span className="flex shrink-0 flex-col gap-1.5 sm:flex-row">
                      <button onClick={() => void respond(i.id, "Accepted")} className={cn(btn.primary, "px-3 py-1.5 text-xs")}>Accept</button>
                      <button onClick={() => void respond(i.id, "Declined")} className={cn(btn.secondary, "px-3 py-1.5 text-xs")}>Decline</button>
                    </span>
                  ) : undefined}
                />
              ))}
            </ul>
          ) : <p className="py-8 text-center text-sm text-muted-foreground">No inquiries yet.</p>}
        </>
      )}
    </div>
  );
}

export default function RecruitingPage() {
  const { user } = useAuth();
  const body = useMemo(() => <Recruiting />, []);
  return user?.roles.includes("coach") ? <CoachLayout>{body}</CoachLayout> : <Page title="Recruiting">{body}</Page>;
}
