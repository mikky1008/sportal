import { useEffect, useRef, useState, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { Bell, Menu, Search, type LucideIcon } from "lucide-react";
import { Link } from "@/router-compat";
import { toast } from "sonner";
import { MIN_SEARCH_CHARS, searchEverything, sendConnectionRequest, type Relationship, type SearchResults } from "@/lib/searchApi";
import { PersonAvatar } from "@/components/avatar";
import { cn } from "@/lib/utils";

/* ---------------------------------------------------------------------------------------------
   Shared app shell. The Athlete and Coach screens both build their top bar from these pieces, so
   height, spacing, nav links, icon buttons, the profile pill and dropdown menus are identical.
   Colors come from the --shell-* tokens in styles.css (set per role), never from this file.
--------------------------------------------------------------------------------------------- */

/** Page content area under the header. */
export function PageBody({ children }: { children: ReactNode }) {
  return (
    <main className="px-4 pb-12 pt-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">{children}</div>
    </main>
  );
}

/** Sticky top bar: one row (`children`) plus an optional panel underneath (the phone menu). */
export function AppHeader({ children, below }: { children: ReactNode; below?: ReactNode }) {
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-shell pt-[var(--ion-safe-area-top,0px)] text-shell-fg">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4 sm:px-6 md:h-16 md:gap-4 lg:px-8">{children}</div>
      {below}
    </header>
  );
}

export function HeaderBrand({ to, label }: { to: string; label: string }) {
  return (
    <Link to={to} direction="root" className="flex shrink-0 items-center gap-2.5 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-shell-focus" aria-label={label}>
      <img src="/icon-192.png" alt="" aria-hidden="true" className="h-10 w-10 shrink-0 rounded-[22%]" />
      <span className="font-display text-2xl font-bold tracking-wide text-shell-fg">SPORTAL</span>
    </Link>
  );
}

/** Round "back" button shown in the bar on detail screens. */
export function HeaderBack({ to }: { to: string }) {
  return (
    <Link to={to} direction="back" aria-label="Back" className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/15 bg-white/5 text-sm text-shell-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-shell-focus">
      ←
    </Link>
  );
}

/* ---- main navigation (tablet and up) ---- */

export const headerNavClass = (active: boolean) =>
  cn(
    "relative flex h-16 shrink-0 items-center gap-2 whitespace-nowrap px-2.5 text-[15px] font-medium transition-colors lg:px-3 xl:px-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-shell-focus",
    active ? "text-shell-fg" : "text-shell-muted hover:text-shell-fg",
  );

const NavUnderline = () => <span className="absolute inset-x-3 bottom-0 h-[3px] rounded-full bg-shell-underline" />;

interface NavItemProps {
  label: string;
  icon?: LucideIcon;
  active: boolean;
  to?: string;
  /** used when the page doesn't exist yet */
  onClick?: () => void;
}

export function HeaderNavItem({ label, icon: Icon, active, to, onClick }: NavItemProps) {
  const inner = (
    <>
      {/* icons only when there is room (xl); tablets get text-only tabs so the bar never wraps */}
      {Icon && <Icon className="hidden h-5 w-5 xl:block" />}
      {label}
      {active && <NavUnderline />}
    </>
  );
  if (to) {
    return (
      <Link to={to} direction="root" aria-current={active ? "page" : undefined} className={headerNavClass(active)}>
        {inner}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={headerNavClass(active)}>
      {inner}
    </button>
  );
}

/* ---- dropdowns ---- */

/** Open/close state for a header dropdown: closes on outside click, Escape and route change. */
export function useDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { pathname } = useLocation();

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return { open, setOpen, ref };
}

export function DropdownPanel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div role="menu" className={cn("absolute right-0 top-full z-50 mt-2 w-60 rounded-2xl border bg-popover p-2 text-popover-foreground shadow-lg", className)}>
      {children}
    </div>
  );
}

export const dropdownItemClass = (active = false) =>
  cn(
    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    active ? "bg-primary/10 font-medium text-primary" : "hover:bg-muted",
  );

export const DropdownDivider = () => <div className="my-1 h-px bg-border" />;

export const DropdownLabel = ({ children }: { children: ReactNode }) => (
  <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{children}</p>
);

/**
 * Search field in the bar (wide screens only). Same size and look for every role. It searches as
 * you type (after a short pause) and lists scholarships for everyone and athletes for verified
 * coaches; the server decides what each account may see.
 */
export function HeaderSearch({ placeholder }: { placeholder: string }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const { pathname } = useLocation();
  const term = q.trim();

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (term.length < MIN_SEARCH_CHARS) {
      setResults(null);
      setState("idle");
      return;
    }
    setState("loading");
    const ctrl = new AbortController();
    // Wait for a pause in typing, and cancel the request if a newer one replaces it.
    const t = setTimeout(async () => {
      const r = await searchEverything(term, ctrl.signal);
      if (ctrl.signal.aborted) return;
      if (r.ok) { setResults(r.data); setState("idle"); } else setState("error");
    }, 300);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [term]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => { if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("pointerdown", onPointer); document.removeEventListener("keydown", onKey); };
  }, [open]);

  const empty = !!results && !results.athletes.length && !results.scholarships.length;
  const showPanel = open && term.length >= MIN_SEARCH_CHARS;
  const rowClass = "block rounded-xl px-3 py-2.5 text-sm hover:bg-muted";
  const [connecting, setConnecting] = useState<string | null>(null);

  const connect = async (id: string, name: string) => {
    setConnecting(id);
    const r = await sendConnectionRequest(id);
    setConnecting(null);
    if (!r.ok) {
      toast.error(r.message || "Could not send the request.");
      return;
    }
    setResults((cur) => (cur ? { ...cur, athletes: cur.athletes.map((a) => (a.id === id ? { ...a, relationship: "request_sent" as Relationship } : a)) } : cur));
    toast.success("Request sent", { description: `${name} will see it and can accept.` });
  };
  const relationshipLabel: Record<Relationship, string | null> = {
    connected: "In My Athletes",
    request_sent: "Request sent",
    request_received: "Wants to connect",
    none: null,
  };

  return (
    <div ref={boxRef} className="relative ml-2 hidden max-w-xl flex-1 xl:block">
      <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-shell-icon" />
      <input
        type="search"
        value={q}
        onChange={(e) => { setQ(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        aria-label="Search"
        className="h-11 w-full rounded-full border border-white/15 bg-black/20 pl-12 pr-12 text-sm text-shell-fg outline-none placeholder:text-shell-muted focus:border-shell-focus focus:ring-4 focus:ring-shell-focus/20"
      />
      {showPanel && (
        <div className="absolute left-0 right-0 top-full z-40 mt-2 max-h-96 overflow-y-auto rounded-2xl border bg-card p-2 text-foreground shadow-lg">
          {state === "loading" && !results && <p className="px-3 py-2.5 text-sm text-muted-foreground">Searching…</p>}
          {state === "error" && <p className="px-3 py-2.5 text-sm text-muted-foreground">Search isn't available right now.</p>}
          {empty && state !== "error" && <p className="px-3 py-2.5 text-sm text-muted-foreground">No results for “{term}”.</p>}
          {!!results?.scholarships.length && (
            <div>
              <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Scholarships</p>
              {results.scholarships.map((s) => (
                <Link key={s.id} to="/scholarships" search={{ highlight: s.id }} className={rowClass}>
                  <span className="block font-semibold">{s.name}</span>
                  <span className="block text-xs text-muted-foreground">{s.university} · {s.sport}</span>
                </Link>
              ))}
            </div>
          )}
          {!!results?.athletes.length && (
            <div>
              <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Athletes</p>
              {results.athletes.map((a) => (
                <div key={a.id} className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm hover:bg-muted">
                  <Link to={a.hasShowcase ? `/recruiting/${a.id}` : "/coach/athletes"} className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{a.displayName}</span>
                    <span className="block truncate text-xs text-muted-foreground">{[a.sport, a.school].filter(Boolean).join(" · ") || "No profile yet"}</span>
                  </Link>
                  {relationshipLabel[a.relationship] && (
                    <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">{relationshipLabel[a.relationship]}</span>
                  )}
                  {a.relationship === "none" && (
                    <button
                      type="button"
                      disabled={connecting === a.id}
                      onClick={() => void connect(a.id, a.displayName)}
                      className="shrink-0 rounded-full border border-primary px-3 py-1 text-xs font-semibold text-primary hover:bg-primary hover:text-primary-foreground disabled:opacity-60"
                    >{connecting === a.id ? "Sending…" : "Connect"}</button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ---- right-hand side of the bar ---- */

const iconButtonClass =
  "relative grid h-11 w-11 place-items-center rounded-full bg-white/5 text-shell-icon transition hover:bg-white/10 hover:text-shell-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-shell-focus";

/** Bell with an unread-count badge. Renders a link when `to` is given, otherwise a button (dropdown trigger). */
export function NotificationBell({ count, to, onClick, expanded }: { count: number; to?: string; onClick?: () => void; expanded?: boolean }) {
  const badge = count > 0 && (
    <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-red-600 px-1 text-[11px] font-semibold leading-none text-white">{count}</span>
  );
  const label = `Notifications, ${count} unread`;
  if (to) {
    return (
      <Link to={to} direction="root" aria-label={label} className={iconButtonClass}>
        <Bell className="h-5 w-5" />
        {badge}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} aria-label={label} aria-haspopup="menu" aria-expanded={expanded} className={iconButtonClass}>
      <Bell className="h-5 w-5" />
      {badge}
    </button>
  );
}

/** The rounded container that holds the signed-in user's avatar, name and menu. */
export function HeaderPill({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("flex items-center gap-2 rounded-full border border-white/15 bg-white/5 py-1 pl-1 pr-2", className)}>{children}</div>;
}

/** Avatar with status dot, plus the first name (hidden on very small screens). */
export function HeaderUser({ name, shortName, src }: { name: string; shortName?: string; src?: string }) {
  return (
    <span className="flex items-center gap-2">
      <span className="relative">
        <PersonAvatar name={name} src={src} size="header" tone="onDark" className="ring-2 ring-shell-ring" />
        <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-shell-dot-border bg-emerald-400" />
      </span>
      <span className="hidden max-w-[9rem] truncate text-sm font-medium text-shell-fg lg:inline">{shortName ?? name}</span>
    </span>
  );
}

export const HeaderPillDivider = () => <span className="h-5 w-px bg-white/20" aria-hidden="true" />;

/** Hamburger, the visual for "open the menu". Same in the athlete and coach pills. */
export function MenuGlyph({ open: _open }: { open: boolean }) {
  return (
    <span className="flex items-center text-shell-icon">
      <Menu className="h-5 w-5" />
    </span>
  );
}
