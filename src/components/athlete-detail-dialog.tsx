import { useState } from "react";
import { Award, Flag, Medal, Zap } from "lucide-react";
import { ReportDialog } from "@/components/report-dialog";
import { PersonAvatar } from "@/components/avatar";
import { Pill, btn } from "@/components/common";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { ConnectedAthlete } from "@/lib/coachApi";
import { cn } from "@/lib/utils";

function Section({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="mt-5">
      <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-foreground [&_svg]:h-4 [&_svg]:w-4 [&_svg]:text-primary">
        {icon}
        {title}
      </h3>
      {children}
    </section>
  );
}

/** Popup with one connected athlete's profile: bio, skills, achievements and recent records. */
export function AthleteDetailDialog({ athlete, onClose }: { athlete: ConnectedAthlete | null; onClose: () => void }) {
  const [reporting, setReporting] = useState(false);
  return (
    <Dialog open={athlete !== null} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-xl">
        {athlete && (
          <>
            <DialogHeader>
              <DialogTitle>Athlete Profile Details</DialogTitle>
              <DialogDescription className="sr-only">
                Profile, skills, achievements and recent records for {athlete.firstName} {athlete.lastName}.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-2 flex items-center gap-4 rounded-2xl bg-muted p-4">
              <PersonAvatar name={`${athlete.firstName} ${athlete.lastName}`} {...(athlete.photo ? { src: athlete.photo } : {})} size="md" />
              <div className="min-w-0">
                <p className="truncate text-lg font-bold">{athlete.firstName} {athlete.lastName}</p>
                <p className="text-sm text-muted-foreground">{[athlete.sport, athlete.position].filter(Boolean).join(" • ") || "Sport not set"}</p>
                {athlete.school && <p className="truncate text-sm text-muted-foreground">{athlete.school}</p>}
              </div>
            </div>

            <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
              {[["Rank", athlete.rank === null ? "—" : `#${athlete.rank}`], ["Performance", athlete.performance === null ? "—" : `${athlete.performance}%`], ["Consistency", athlete.consistency === null ? "—" : `${athlete.consistency}%`]].map(([k, v]) => (
                <div key={k} className="rounded-xl border px-2 py-2">
                  <dt className="text-xs text-muted-foreground">{k}</dt>
                  <dd className="font-display text-lg font-bold">{v}</dd>
                </div>
              ))}
            </dl>

            <Section title="Biography">
              <p className="text-sm text-muted-foreground">{athlete.bio || "No biography added yet."}</p>
            </Section>

            <Section title="Evaluated Skills">
              {athlete.skills.length === 0 ? (
                <p className="text-sm text-muted-foreground">No skills evaluated yet.</p>
              ) : (
                <ul className="flex flex-wrap gap-2" aria-label="Evaluated skills">
                  {athlete.skills.map((s) => <li key={s}><Pill tone="primary">{s}</Pill></li>)}
                </ul>
              )}
            </Section>

            <Section title="Career Achievements" icon={<Award />}>
              {athlete.achievements.length === 0 ? (
                <p className="text-sm text-muted-foreground">No achievements added yet.</p>
              ) : (
                <ul className="space-y-1.5">
                  {athlete.achievements.map((a) => (
                    <li key={a.title} className="flex items-start gap-2 text-sm">
                      <Medal className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden="true" />
                      <span>{a.title}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            <Section title="Recent Logged Records" icon={<Zap />}>
              {athlete.records.length === 0 ? (
                <p className="text-sm text-muted-foreground">No records logged yet.</p>
              ) : (
                <ul className="divide-y rounded-xl border">
                  {athlete.records.map((r) => (
                    <li key={`${r.label}-${r.date}`} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                      <span className="min-w-0">
                        <span className="font-medium">{r.label}</span>
                        <span className="ml-2 text-xs text-muted-foreground">({r.date})</span>
                      </span>
                      <span className="shrink-0 font-semibold">{r.value}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            <div className="mt-6 flex items-center justify-between gap-3">
              <button type="button" onClick={() => setReporting(true)} className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground">
                <Flag className="h-3.5 w-3.5" aria-hidden="true" /> Report this profile
              </button>
              <DialogClose className={cn(btn.secondary, btn.sm)}>Close Profile</DialogClose>
            </div>
          </>
        )}
      </DialogContent>
      <ReportDialog athlete={reporting && athlete ? { id: athlete.id, name: `${athlete.firstName} ${athlete.lastName}` } : null} onClose={() => setReporting(false)} />
    </Dialog>
  );
}
