import { useEffect, useMemo, useState } from "react";
import { Page } from "@/components/Page";
import { Bookmark, BookmarkCheck, Eye, Lock, MapPin, Play, Scale, Search, Send, UserX, X, BadgeCheck } from "lucide-react";
import { toast } from "sonner";
import { ALL } from "@/lib/rankings";
import { PageHeader, Pill, ProgressBar, Select, btn } from "@/components/common";
import { cn } from "@/lib/utils";
import { DISCOVERY_ATHLETES, YEAR_LEVELS, type DiscoveryAthlete } from "@/lib/discoveryMock";

const labelCls = "flex flex-col gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground";
const MAX_COMPARE = 3;
type SortKey = "rank" | "performance" | "consistency";
type Tab = "Overview" | "Skill Ratings" | "Logged Performance" | "Highlight Videos";
type Filters = { sport: string; position: string; school: string; year: string; verifiedOnly: boolean };
const DEFAULTS: Filters = { sport: ALL, position: ALL, school: ALL, year: ALL, verifiedOnly: true };

const uniq = (xs: string[]) => [...new Set(xs)].sort();
const initials = (n: string) => n.split(" ").map((p) => p[0]).slice(0, 2).join("");

function Avatar({ name, className }: { name: string; className?: string }) {
  // Mock photo: initials on a brand tile, so no new image assets are needed.
  return (
    <div aria-hidden="true" className={cn("flex shrink-0 items-center justify-center rounded-2xl bg-hero font-display font-bold text-navy-foreground ring-2 ring-electric", className)}>
      {initials(name)}
    </div>
  );
}

function VerifyBadge({ verified }: { verified: boolean }) {
  return verified ? (
    <Pill tone="success" title="Results confirmed by a coach"><BadgeCheck className="mr-1 inline h-3 w-3" />Verified</Pill>
  ) : (
    <Pill title="No coach has verified this athlete's results yet">Unverified</Pill>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()} className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-card p-5 shadow-card sm:rounded-3xl sm:p-6">
        {children}
      </div>
    </div>
  );
}

function ProfileModal({ a, saved, onSave, onInquiry, onClose }: { a: DiscoveryAthlete; saved: boolean; onSave: () => void; onInquiry: () => void; onClose: () => void }) {
  const [tab, setTab] = useState<Tab>("Overview");
  const tabs: Tab[] = ["Overview", "Skill Ratings", "Logged Performance", "Highlight Videos"];
  return (
    <Modal title={`${a.name} profile`} onClose={onClose}>
      <div className="flex items-start gap-4">
        <Avatar name={a.name} className="h-20 w-20 text-2xl" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-2xl font-bold">{a.name}</h2>
            <VerifyBadge verified={a.verified} />
          </div>
          <p className="text-muted-foreground">{a.sport} • {a.position}</p>
          <p className="flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="h-3.5 w-3.5" />{a.school} • {a.year}</p>
          <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><Lock className="h-3 w-3" />Public record view. Private details stay hidden.</p>
        </div>
        <button autoFocus aria-label="Close profile" onClick={onClose} className="rounded-full p-1.5 text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><X className="h-5 w-5" /></button>
      </div>

      <div role="tablist" className="mt-5 flex gap-1 overflow-x-auto border-b">
        {tabs.map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}
            className={cn("whitespace-nowrap border-b-2 px-3 py-2 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground")}>
            {t === "Highlight Videos" ? `Highlight Videos (${a.videos.length})` : t}
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-col gap-5">
        {tab === "Overview" && (
          <>
            <div className="grid grid-cols-3 gap-3">
              {[["Rank", `#${a.rank}`], ["Performance", `${a.performance}%`], ["Consistency", `${a.consistency}%`]].map(([l, v]) => (
                <div key={l} className="rounded-2xl bg-muted p-3 text-center"><p className="font-display text-2xl font-bold">{v}</p><p className="text-xs text-muted-foreground">{l}</p></div>
              ))}
            </div>
            <section>
              <h3 className="mb-2 font-semibold">Verified athletic achievements</h3>
              <ul className="flex flex-col gap-1.5 text-sm">{a.achievements.map((x) => <li key={x.title}>{x.icon} {x.title}</li>)}</ul>
            </section>
          </>
        )}
        {tab === "Skill Ratings" && (
          <section className="grid gap-4 sm:grid-cols-2">
            {a.skills.map((s) => (
              <div key={s.name}>
                <div className="mb-1 flex justify-between text-sm"><span>{s.name}</span><b>{s.value}%</b></div>
                <ProgressBar value={s.value} />
              </div>
            ))}
          </section>
        )}
        {tab === "Logged Performance" && (
          <ul className="flex flex-col gap-2">
            {a.logged.map((l, i) => (
              <li key={i} className="flex items-center justify-between gap-3 rounded-2xl bg-muted p-3 text-sm">
                <div><p className="font-semibold">{l.label}</p><p className="text-xs text-muted-foreground">{l.date}</p></div>
                <div className="flex items-center gap-2"><b>{l.result}</b><Pill tone={l.status === "Coach-Verified" ? "success" : "default"}>{l.status}</Pill></div>
              </li>
            ))}
          </ul>
        )}
        {tab === "Highlight Videos" && (
          <div className="grid gap-3 sm:grid-cols-2">
            {a.videos.map((v) => (
              <button key={v.title} onClick={() => toast("Video preview isn't available in this mock.")} className="flex aspect-video flex-col items-center justify-center gap-2 rounded-2xl bg-hero text-navy-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <Play className="h-8 w-8 text-gold" /><span className="px-3 text-center text-sm font-semibold">{v.title}</span><span className="text-xs text-navy-muted">{v.length}</span>
              </button>
            ))}
          </div>
        )}
        <div className="flex flex-wrap gap-2 border-t pt-4">
          <button onClick={onSave} className={btn.secondary}>{saved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}{saved ? "Saved to shortlist" : "Save to shortlist"}</button>
          <button onClick={onInquiry} className={btn.primary}><Send className="h-4 w-4" />Send inquiry</button>
        </div>
      </div>
    </Modal>
  );
}

function Discovery() {
  const [query, setQuery] = useState("");
  const [f, setF] = useState<Filters>(DEFAULTS);
  const [sort, setSort] = useState<SortKey>("rank");
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [compare, setCompare] = useState<string[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [sideBySide, setSideBySide] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  const set = <K extends keyof Filters>(k: K, v: Filters[K]) => setF((p) => ({ ...p, [k]: v }));
  const inSport = DISCOVERY_ATHLETES.filter((a) => f.sport === ALL || a.sport === f.sport);
  const positions = uniq(inSport.map((a) => a.position));
  const schools = uniq(DISCOVERY_ATHLETES.map((a) => a.school));
  const position = positions.includes(f.position) ? f.position : ALL; // a stale choice falls back to All

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return DISCOVERY_ATHLETES.filter((a) =>
      (!q || [a.name, a.school, a.sport, a.position, a.city].some((s) => s.toLowerCase().includes(q))) &&
      (f.sport === ALL || a.sport === f.sport) &&
      (position === ALL || a.position === position) &&
      (f.school === ALL || a.school === f.school) &&
      (f.year === ALL || a.year === f.year) &&
      (!f.verifiedOnly || a.verified),
    ).sort((a, b) => (sort === "rank" ? a.rank - b.rank : b[sort] - a[sort]));
  }, [query, f, position, sort]);

  const reset = () => { setQuery(""); setF(DEFAULTS); };
  const byId = (id: string) => DISCOVERY_ATHLETES.find((a) => a.id === id)!;
  const picked = compare.map(byId);
  const open = openId ? byId(openId) : null;

  const toggleSave = (a: DiscoveryAthlete) => {
    setSaved((p) => { const n = new Set(p); n.has(a.id) ? n.delete(a.id) : n.add(a.id); return n; });
    toast.success(saved.has(a.id) ? `Removed ${a.name} from your shortlist` : `Saved ${a.name} to your shortlist`);
  };
  const toggleCompare = (a: DiscoveryAthlete) => {
    if (!compare.includes(a.id) && compare.length >= MAX_COMPARE) return toast.error(`You can compare up to ${MAX_COMPARE} athletes at a time.`);
    setCompare((p) => (p.includes(a.id) ? p.filter((x) => x !== a.id) : [...p, a.id]));
    setDrawerOpen(true);
  };
  const inquire = (a: DiscoveryAthlete) => toast.success(`Inquiry sent to ${a.name}. You can message once they accept.`);
  const clearCompare = () => { setCompare([]); setSideBySide(false); };

  return (
    <div className={cn("flex flex-col gap-6", compare.length >= 2 && drawerOpen && "pb-40")}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeader title="Athlete Discovery" subtitle="Explore and recruit verified student-athletes across universities." />
        <button onClick={() => setDrawerOpen(true)} disabled={!compare.length} className={btn.secondary}><Scale className="h-4 w-4" />Compare ({compare.length})</button>
      </div>

      <label className="relative block">
        <span className="sr-only">Search athletes</span>
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name, school, sport, position, or location"
          className="w-full rounded-2xl border bg-card py-3 pl-11 pr-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
      </label>

      <div className="grid gap-6 lg:grid-cols-[16rem_1fr]">
        <aside aria-label="Filters" className="flex h-fit flex-col gap-4 rounded-2xl bg-card p-4 shadow-card">
          <div className="flex items-center justify-between"><h2 className="font-semibold">Filters</h2><button onClick={reset} className="text-sm font-semibold text-primary">Clear all</button></div>
          {([
            ["Sport", f.sport, (v: string) => set("sport", v), uniq(DISCOVERY_ATHLETES.map((a) => a.sport)), "All sports"],
            ["Playing position", position, (v: string) => set("position", v), positions, "All positions"],
            ["School / university", f.school, (v: string) => set("school", v), schools, "All universities"],
            ["Year level", f.year, (v: string) => set("year", v), [...YEAR_LEVELS], "All years"],
          ] as const).map(([label, value, onChange, opts, all]) => (
            <label key={label} className={labelCls}>{label}
              <Select value={value} onChange={(e) => onChange(e.target.value)}>
                <option value={ALL}>{all}</option>
                {opts.map((o) => <option key={o} value={o}>{o}</option>)}
              </Select>
            </label>
          ))}
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Verification status</legend>
            {[[true, "Verified only"], [false, "Show all"]].map(([v, l]) => (
              <label key={String(l)} className="flex items-center gap-2 text-sm">
                <input type="radio" name="verif" checked={f.verifiedOnly === v} onChange={() => set("verifiedOnly", v as boolean)} className="accent-primary" />{l as string}
              </label>
            ))}
          </fieldset>
        </aside>

        <section aria-live="polite">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">Showing {results.length} {f.verifiedOnly ? "verified " : ""}{results.length === 1 ? "athlete" : "athletes"}</p>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">Sort
              <Select value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
                <option value="rank">Rank</option><option value="performance">Performance</option><option value="consistency">Consistency</option>
              </Select>
            </label>
          </div>

          {results.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed py-14 text-center">
              <UserX className="h-10 w-10 text-muted-foreground" />
              <p className="font-semibold">No athletes match your search</p>
              <p className="max-w-xs text-sm text-muted-foreground">Try a different name or loosen a filter. “Verified only” hides athletes whose results no coach has confirmed.</p>
              <button onClick={reset} className={btn.secondary}>Reset filters</button>
            </div>
          ) : (
            <ul className="grid gap-4 xl:grid-cols-2">
              {results.map((a) => (
                <li key={a.id} className="flex flex-col gap-3 rounded-2xl bg-card p-4 shadow-card">
                  <div className="flex items-start gap-3">
                    <Avatar name={a.name} className="h-16 w-16 text-xl" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2"><h3 className="font-bold">{a.name}</h3><VerifyBadge verified={a.verified} /></div>
                      <p className="text-sm text-muted-foreground">{a.position} • {a.sport}</p>
                      <p className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3 shrink-0" />{a.school} ({a.city}) • {a.year}</p>
                    </div>
                    <button onClick={() => toggleSave(a)} aria-pressed={saved.has(a.id)} className={cn("flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", saved.has(a.id) ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground")}>
                      {saved.has(a.id) ? <BookmarkCheck className="h-3.5 w-3.5" /> : <Bookmark className="h-3.5 w-3.5" />}{saved.has(a.id) ? "Saved" : "Save"}
                    </button>
                  </div>
                  <dl className="grid grid-cols-3 gap-2">
                    {a.chips.map((c) => <div key={c.label} className="rounded-xl bg-muted px-2 py-1.5 text-center"><dd className="font-display text-lg font-bold">{c.value}</dd><dt className="text-[11px] text-muted-foreground">{c.label}</dt></div>)}
                  </dl>
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><Lock className="h-3 w-3" />Public records only (athlete privacy applied)</p>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => setOpenId(a.id)} className={btn.primary}><Eye className="h-4 w-4" />View profile</button>
                    <button onClick={() => toggleCompare(a)} aria-pressed={compare.includes(a.id)} className={cn(btn.secondary, compare.includes(a.id) && "border-primary text-primary")}><Scale className="h-4 w-4" />{compare.includes(a.id) ? "Added" : "Compare"}</button>
                    <button onClick={() => inquire(a)} className={btn.secondary}><Send className="h-4 w-4" />Send inquiry</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {compare.length >= 2 && drawerOpen && (
        <div role="region" aria-label="Athlete comparison" className="fixed inset-x-0 bottom-0 z-40 border-t bg-card shadow-card">
          <div className="mx-auto max-w-5xl p-4">
            {sideBySide && (
              <div className="mb-4 max-h-[50vh] overflow-auto">
                <table className="w-full min-w-[32rem] text-sm">
                  <thead><tr><th className="p-2 text-left" />{picked.map((a) => <th key={a.id} className="p-2 text-left">{a.name}<span className="block text-xs font-normal text-muted-foreground">{a.school}</span></th>)}</tr></thead>
                  <tbody>
                    {([["Sport", (a: DiscoveryAthlete) => a.sport], ["Position", (a: DiscoveryAthlete) => a.position], ["Year", (a: DiscoveryAthlete) => a.year], ["Rank", (a: DiscoveryAthlete) => `#${a.rank}`], ["Performance", (a: DiscoveryAthlete) => `${a.performance}%`], ["Consistency", (a: DiscoveryAthlete) => `${a.consistency}%`], ["Verification", (a: DiscoveryAthlete) => (a.verified ? "Verified" : "Unverified")]] as const).map(([l, fn]) => (
                      <tr key={l} className="border-t"><th className="p-2 text-left font-medium text-muted-foreground">{l}</th>{picked.map((a) => <td key={a.id} className="p-2">{fn(a)}</td>)}</tr>
                    ))}
                  </tbody>
                </table>
                {new Set(picked.map((a) => a.sport)).size > 1 && <p className="mt-2 text-xs text-muted-foreground">These athletes play different sports, so scores and ranks aren't directly comparable.</p>}
              </div>
            )}
            <div className="flex flex-wrap items-center gap-3">
              <p className="font-semibold">Compare athletes ({compare.length} selected)</p>
              <div className="flex flex-wrap gap-2">
                {picked.map((a) => <span key={a.id} className="flex items-center gap-1 rounded-full bg-muted py-1 pl-3 pr-1 text-sm">{a.name} <button aria-label={`Remove ${a.name}`} onClick={() => toggleCompare(a)} className="rounded-full p-1 hover:bg-background"><X className="h-3 w-3" /></button></span>)}
              </div>
              <div className="ml-auto flex gap-2">
                <button onClick={() => setSideBySide((s) => !s)} className={btn.primary}>{sideBySide ? "Hide comparison" : "Compare side-by-side"}</button>
                <button onClick={clearCompare} className={btn.secondary}>Clear</button>
                <button onClick={() => setDrawerOpen(false)} className={btn.secondary}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {open && <ProfileModal a={open} saved={saved.has(open.id)} onSave={() => toggleSave(open)} onInquiry={() => inquire(open)} onClose={() => setOpenId(null)} />}
    </div>
  );
}

export default function DiscoveryPage() {
  return (
    <Page title="Discovery">
      <Discovery />
    </Page>
  );
}
