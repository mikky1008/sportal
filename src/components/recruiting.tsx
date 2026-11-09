import { useState, type ReactNode } from "react";
import { Link } from "@/router-compat";
import { ArrowLeft, Bookmark, BookmarkCheck, Send, X } from "lucide-react";
import type { DirectoryAthlete, Inquiry, InquiryStatus, ThreadMessage } from "@/types";
import { Pill, btn } from "@/components/common";
import { NOTE_MAX } from "@/lib/recruitingApi";
import { cn } from "@/lib/utils";

const avatarTones = [
  "bg-primary/15 text-primary",
  "bg-gold/25 text-foreground",
  "bg-success/15 text-success",
  "bg-warning/20 text-foreground",
  "bg-accent text-accent-foreground",
];

export function AthleteAvatar({ name, className }: { name: string; className?: string }) {
  const hash = [...name].reduce((a, c) => a + c.charCodeAt(0), 0);
  return (
    <span
      aria-hidden="true"
      className={cn("grid shrink-0 place-items-center rounded-2xl font-display font-bold", avatarTones[hash % avatarTones.length], className)}
    >
      {name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join("")}
    </span>
  );
}

export function inquiryTone(status: InquiryStatus) {
  return status === "Accepted" ? "success" : status === "Pending" ? "warning" : "default";
}

export function AthleteCard({ a, watched, onToggleWatch, footer }: { a: DirectoryAthlete; watched: boolean; onToggleWatch: () => void; footer?: ReactNode }) {
  const rank = a.rank > 0 ? a.rank : undefined;
  return (
    <article className="surface flex flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <AthleteAvatar name={`${a.firstName} ${a.lastName}`} className="h-12 w-12 text-lg" />
        <button
          onClick={onToggleWatch}
          aria-pressed={watched}
          aria-label={watched ? "Remove from watchlist" : "Save to watchlist"}
          title={watched ? "Remove from watchlist" : "Save to watchlist"}
          className={cn("rounded-lg p-2 transition", watched ? "bg-gold/20 text-foreground" : "text-muted-foreground hover:bg-muted")}
        >
          {watched ? <BookmarkCheck className="h-5 w-5" /> : <Bookmark className="h-5 w-5" />}
        </button>
      </div>
      <h3 className="mt-2 text-lg font-bold leading-tight">
        <Link to="/recruiting/$athleteId" search={{ tab: undefined, thread: undefined }} params={{ athleteId: a.id }} className="hover:underline">
          {a.firstName} {a.lastName}
        </Link>
      </h3>
      <p className="text-sm text-muted-foreground">{a.sport} · {a.position} · {a.school}</p>
      <p className="mt-0.5 text-xs text-muted-foreground" data-testid="team-line">{a.teamStatus === "Not on a team" || !a.teamName ? a.teamStatus : `${a.teamStatus} · ${a.teamName}`}</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {a.skills.map((s) => <Pill key={s.name} tone="primary">{s.name} {s.value}</Pill>)}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span>Score <b className="font-display text-base text-foreground">{a.performanceScore}</b></span>
        <Pill
          tone={a.verifiedSessions > 0 ? "success" : "warning"}
          title="Sessions a coach has reviewed, out of all sessions counted for this athlete."
        >
          {a.verifiedSessions}/{a.totalSessions} coach-verified
        </Pill>
      </div>
      <div className="mt-auto flex items-center justify-between pt-4">
        <span className="text-xs font-medium text-muted-foreground">{rank ? `Rank #${rank}` : "Unranked"}</span>
        <Link to="/recruiting/$athleteId" search={{ tab: undefined, thread: undefined }} params={{ athleteId: a.id }} className={cn(btn.primary, "px-4 py-2")}>View showcase</Link>
      </div>
      {footer}
    </article>
  );
}

export function InquiryRow({ inquiry, title, subtitle, onClick, actions }: {
  inquiry: Inquiry;
  title: string;
  subtitle: string;
  onClick: () => void;
  actions?: ReactNode;
}) {
  return (
    <li className="flex items-center gap-4 rounded-xl border bg-card p-4">
      <button onClick={onClick} className="flex min-w-0 flex-1 items-center gap-4 text-left">
        <AthleteAvatar name={title} className="h-10 w-10 text-sm" />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold">{title}</span>
          <span className="block truncate text-sm text-muted-foreground">{inquiry.message}</span>
          <span className="mt-1 block text-xs text-muted-foreground">{subtitle} · {inquiry.createdAt}</span>
        </span>
      </button>
      <Pill tone={inquiryTone(inquiry.status)}>{inquiry.status}</Pill>
      {actions}
    </li>
  );
}

export function ThreadView({ inquiry, title, subtitle, messages, side, onBack, onSend }: {
  inquiry: Inquiry;
  title: string;
  subtitle: string;
  messages: ThreadMessage[];
  side: "recruiter" | "athlete";
  onBack: () => void;
  onSend: (body: string) => void;
}) {
  const [draft, setDraft] = useState("");
  const locked = inquiry.status !== "Accepted";
  return (
    <section className="surface flex flex-col gap-4 p-5 sm:p-6">
      <div className="flex items-center gap-3">
        <button onClick={onBack} aria-label="Back to list" className="rounded-lg p-2 hover:bg-muted"><ArrowLeft className="h-5 w-5" /></button>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{title}</p>
          <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
        </div>
        <Pill tone={inquiryTone(inquiry.status)}>{inquiry.status}</Pill>
      </div>
      <div className="flex flex-col gap-3">
        {messages.length ? messages.map((m) => (
          <div key={m.id} className={cn("max-w-[85%] rounded-2xl px-4 py-2.5 text-sm", m.from === side ? "ml-auto bg-primary text-primary-foreground" : "bg-muted")}>
            <p>{m.body}</p>
            <p className={cn("mt-1 text-[11px]", m.from === side ? "text-primary-foreground/70" : "text-muted-foreground")}>
              {m.from === "recruiter" ? "Recruiter" : "Athlete"} · {m.time}
            </p>
          </div>
        )) : <p className="text-sm text-muted-foreground">No messages yet.</p>}
      </div>
      {locked ? (
        <p className="rounded-xl bg-muted p-3 text-xs text-muted-foreground">
          {inquiry.status === "Pending"
            ? "Messaging is locked while the inquiry is pending — the athlete has not accepted yet."
            : "Messaging is locked because the athlete declined this inquiry."}
          {" "}Only accepted inquiries open a conversation.
        </p>
      ) : (
        <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (!draft.trim()) return; onSend(draft.trim()); setDraft(""); }}>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Write a message…"
            aria-label="Message"
            className="h-11 flex-1 rounded-xl border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <button type="submit" className={cn(btn.primary, "px-4")} aria-label="Send message"><Send className="h-4 w-4" /></button>
        </form>
      )}
    </section>
  );
}

export function InquiryModal({ athlete, open, onClose, onSend, defaultOrganization = "", busy = false }: {
  athlete: DirectoryAthlete;
  open: boolean;
  onClose: () => void;
  onSend: (message: string, organization: string) => void;
  /** pre-filled from the coach's profile */
  defaultOrganization?: string;
  busy?: boolean;
}) {
  const [org, setOrg] = useState(defaultOrganization);
  const [msg, setMsg] = useState("");
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label={`Send inquiry to ${athlete.firstName} ${athlete.lastName}`}>
      <button className="absolute inset-0 bg-navy/60" aria-label="Close" onClick={onClose} />
      <div className="relative max-h-[90vh] w-full overflow-y-auto rounded-t-3xl bg-card p-6 animate-in slide-in-from-bottom sm:max-w-lg sm:rounded-3xl sm:zoom-in-95">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Recruitment Inquiry</h2>
            <p className="text-sm text-muted-foreground">To {athlete.firstName} {athlete.lastName} · {athlete.sport}, {athlete.school}</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="rounded-lg p-1 hover:bg-muted"><X className="h-5 w-5" /></button>
        </div>
        <form
          onSubmit={(e) => { e.preventDefault(); onSend(msg, org); }}
          className="flex flex-col gap-4"
        >
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Your organization / program
            <input required maxLength={120} value={org} onChange={(e) => setOrg(e.target.value)} className="h-11 rounded-xl border bg-background px-3 font-normal outline-none focus:ring-2 focus:ring-ring" />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Message
            <textarea required rows={4} maxLength={1000} value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Introduce your program and why this athlete fits it…" className="rounded-xl border bg-background p-3 font-normal outline-none focus:ring-2 focus:ring-ring" />
          </label>
          <p className="rounded-xl bg-muted p-3 text-xs text-muted-foreground">
            Controlled messaging: the athlete reviews your inquiry first. A conversation only opens after they accept, and they can decline at any time.
          </p>
          <button type="submit" disabled={busy} className={btn.primary}>{busy ? "Sending…" : "Send Inquiry"}</button>
        </form>
      </div>
    </div>
  );
}

/** Private recruiter note on a watchlisted athlete. Saves when the field loses focus. */
export function WatchNote({ athleteId, value, onSave }: { athleteId: string; value: string; onSave: (note: string) => void }) {
  const [draft, setDraft] = useState(value);
  const id = `note-${athleteId}`;
  return (
    <div className="mt-4 border-t pt-3">
      <label htmlFor={id} className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Private note</label>
      <textarea
        id={id}
        rows={2}
        maxLength={NOTE_MAX}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => { if (draft.trim() !== value) onSave(draft); }}
        placeholder="Only you can see this…"
        className="mt-1 w-full rounded-xl border bg-background p-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
      />
    </div>
  );
}
