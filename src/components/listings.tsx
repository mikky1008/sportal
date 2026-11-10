import { useState } from "react";
import { Bell, Calendar, Check, X, BarChart3, Trophy, Mail, GraduationCap, FileCheck, ShieldCheck, Users } from "lucide-react";
import { toast } from "sonner";
import type { Notification, Ranking } from "@/types";
import { formatDeadline, type ApplicationStatus, type ScholarshipView } from "@/lib/scholarshipsApi";
import { Pill, btn } from "./common";
import { cn } from "@/lib/utils";

export function RankingItem({ r, unit = "%" }: { r: Ranking; unit?: string }) {
  return (
    <li className={cn("flex items-center gap-4 rounded-xl border bg-card p-4", r.isCurrentUser && "border-primary bg-accent ring-1 ring-primary/30")}>
      <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-muted font-display text-lg font-bold", r.position <= 3 && "bg-gold/25")}>#{r.position}</span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{r.athleteName} {r.isCurrentUser && <Pill tone="primary">You</Pill>}</p>
        <p className="truncate text-xs text-muted-foreground">{[r.school, r.municipality, r.province].filter(Boolean).join(" · ")}</p>
        {r.totalSessions !== undefined && r.verifiedSessions !== undefined && (
          <div className="mt-1">
            <Pill tone={r.verifiedSessions > 0 ? "success" : "warning"} title="Sessions a coach has reviewed, out of all sessions counted for this ranking.">
              {r.verifiedSessions > 0 ? `${r.verifiedSessions}/${r.totalSessions} coach-verified` : `0/${r.totalSessions} coach-verified`}
            </Pill>
          </div>
        )}
      </div>
      <span className="font-display text-2xl font-bold">{r.value}{unit}</span>
    </li>
  );
}

export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label={title}>
      <button className="absolute inset-0 bg-navy/60" aria-label="Close" onClick={onClose} />
      <div className="relative max-h-[90vh] w-full overflow-y-auto rounded-t-3xl bg-card p-6 animate-in slide-in-from-bottom sm:max-w-lg sm:rounded-3xl sm:zoom-in-95">
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="text-2xl font-bold">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="rounded-lg p-1 hover:bg-muted"><X className="h-5 w-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}


const APPLICATION_LABEL: Record<ApplicationStatus, { text: string; tone: "success" | "warning" | "gold" | "primary" }> = {
  submitted: { text: "Applied", tone: "success" },
  under_review: { text: "Under review", tone: "warning" },
  accepted: { text: "Accepted", tone: "success" },
  rejected: { text: "Not selected", tone: "gold" },
  withdrawn: { text: "Withdrawn", tone: "gold" },
};

/**
 * One scholarship. `onApply` / `onWithdraw` talk to the API and resolve to an error message (or
 * null on success), so the card only has to show the result. `canApply` is false for accounts that
 * are not student-athletes, so they never see an Apply button that can only fail.
 */
export function ScholarshipCard({
  s, canApply, onApply, onWithdraw, onToggleOpen, onApplicants, highlighted,
}: {
  s: ScholarshipView;
  canApply: boolean;
  onApply: (id: string) => Promise<string | null>;
  onWithdraw: (id: string) => Promise<string | null>;
  /** Only used when the signed-in user posted this scholarship. */
  onToggleOpen?: (id: string, open: boolean) => Promise<string | null>;
  /** Only used when the signed-in user posted this scholarship: opens the list of applicants. */
  onApplicants?: (s: ScholarshipView) => void;
  /** the card a search result pointed at */
  highlighted?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const status = s.myApplication?.status;
  const active = !!status && status !== "withdrawn";
  const label = status ? APPLICATION_LABEL[status] : null;
  const canWithdraw = status === "submitted" || status === "under_review";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const err = await onApply(s.id);
    setBusy(false);
    if (err) {
      toast.error(err);
      return;
    }
    setOpen(false);
    toast.success("Application submitted", { description: "The scholarship committee will review it." });
  };
  const withdraw = async () => {
    setBusy(true);
    const err = await onWithdraw(s.id);
    setBusy(false);
    if (err) toast.error(err);
    else toast.success("Application withdrawn");
  };

  return (
    <article id={`scholarship-${s.id}`} className={cn("surface flex flex-col p-5", highlighted && "ring-2 ring-primary")}>
      <div className="mb-3 flex items-center justify-between">
        <Pill tone="gold">{s.coverage || "Scholarship"}</Pill>
        {!s.isOpen ? <Pill tone="gold">Closed</Pill> : label && active && <Pill tone={label.tone}>{label.text}</Pill>}
      </div>
      <h3 className="text-xl font-bold leading-tight">{s.name}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{s.university} · {s.sport}</p>
      {s.details && <p className="mt-3 text-sm">{s.details}</p>}
      {s.eligibility.length > 0 && (
        <>
          <h4 className="mt-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Eligibility</h4>
          <ul className="mt-1 flex flex-col gap-1 text-sm">{s.eligibility.map((e) => <li key={e} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 text-success" />{e}</li>)}</ul>
        </>
      )}
      <div className="mt-auto flex items-center justify-between gap-3 pt-4">
        <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"><Calendar className="h-4 w-4" />Due {formatDeadline(s.deadline)}</span>
        {s.postedByMe && onApplicants && (
          <button onClick={() => onApplicants(s)} className={cn(btn.secondary, "px-4 py-2")}>Applicants</button>
        )}
        {s.postedByMe && onToggleOpen && (
          <button
            disabled={busy}
            onClick={async () => { setBusy(true); const err = await onToggleOpen(s.id, !s.isOpen); setBusy(false); if (err) toast.error(err); }}
            className={cn(btn.secondary, "px-4 py-2")}
          >{s.isOpen ? "Close applications" : "Reopen"}</button>
        )}
        {canApply && (canWithdraw ? (
          <button disabled={busy} onClick={withdraw} className={cn(btn.secondary, "px-4 py-2")}>{busy ? "Withdrawing…" : "Withdraw"}</button>
        ) : (
          <button disabled={active} onClick={() => setOpen(true)} className={cn(btn.primary, "px-4 py-2")}>{active ? "Submitted" : status === "withdrawn" ? "Apply again" : "Apply"}</button>
        ))}
      </div>
      <Modal open={open} onClose={() => !busy && setOpen(false)} title={`Apply: ${s.name}`}>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">Your Sportal showcase profile and AI-assessed results will be attached.</p>
          <p className="rounded-xl bg-muted p-3 text-xs text-muted-foreground">Sportal manages the application. The university decides who receives the scholarship.</p>
          <button type="submit" disabled={busy} className={btn.primary}>{busy ? "Submitting…" : "Submit Application"}</button>
        </form>
      </Modal>
    </article>
  );
}

const catMeta: Record<Notification["category"], { icon: typeof Mail; label: string; tone: string }> = {
  analysis: { icon: BarChart3, label: "Analysis", tone: "bg-accent text-primary" },
  ranking: { icon: Trophy, label: "Ranking", tone: "bg-gold/20 text-foreground" },
  recruitment: { icon: Mail, label: "Recruitment", tone: "bg-success/15 text-success" },
  scholarship: { icon: GraduationCap, label: "Scholarship", tone: "bg-gold/20 text-foreground" },
  application: { icon: FileCheck, label: "Application", tone: "bg-accent text-primary" },
  verification: { icon: ShieldCheck, label: "Verification", tone: "bg-warning/20 text-foreground" },
  connection: { icon: Users, label: "Connection", tone: "bg-accent text-primary" },
  system: { icon: Bell, label: "Update", tone: "bg-muted text-foreground" },
};
export const notificationCategories = catMeta;

export function NotificationItem({ n, onRead }: { n: Notification; onRead: () => void }) {
  const m = catMeta[n.category];
  const Icon = m.icon;
  return (
    <li>
      <button onClick={onRead} className={cn("flex w-full items-start gap-4 rounded-xl border bg-card p-4 text-left transition hover:bg-muted", !n.read && "border-primary/40")}>
        <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-lg", m.tone)}><Icon className="h-5 w-5" /></span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2"><p className="font-semibold">{n.title}</p>{!n.read && <span className="h-2 w-2 rounded-full bg-primary" aria-label="Unread" />}</div>
          <p className="text-sm text-muted-foreground">{n.message}</p>
          <p className="mt-1 text-xs text-muted-foreground">{m.label} · {n.time}</p>
        </div>
      </button>
    </li>
  );
}
