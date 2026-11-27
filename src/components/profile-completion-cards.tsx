import { useMemo, useState } from "react";
import { Link } from "@/router-compat";
import { toast } from "sonner";
import { AnimatedBar, CompletionCard } from "@/components/profile-completion";
import { CoachProfileSheet } from "@/components/coach-profile-sheet";
import { Pill, btn } from "@/components/common";
import { cn } from "@/lib/utils";
import { profileStore, useAthleteProfile } from "@/lib/profileStore";
import { profileExtrasStore, useProfileExtras } from "@/lib/profileExtrasStore";
import {
  coachProfileStore, CoachValidationError, useCoachProfile,
  type CoachVerification, type CoachVerificationStatus,
} from "@/lib/coachProfileStore";
import {
  athleteMessage, coachMessage, computeAthleteCompletion, computeCoachCompletion,
  type AthleteSectionId, type CoachSectionId,
} from "@/lib/profileCompletion";

/** Live completion for the signed-in athlete, recalculated whenever a profile save lands. */
export function useAthleteCompletion() {
  const athlete = useAthleteProfile();
  const extras = useProfileExtras();
  return useMemo(() => computeAthleteCompletion(athlete, extras), [athlete, extras]);
}

export function AthleteCompletionCard() {
  const result = useAthleteCompletion();
  return (
    <CompletionCard
      testId="athlete-completion"
      title="Complete Your Athlete Profile"
      result={result}
      message={athleteMessage(result)}
      note="Profile completion only shows how much of your profile is filled in. It is not a performance score and doesn't change your rank."
      completeText={<Link to="/profile" className={btn.secondary}>View my showcase</Link>}
      renderAction={(s, className, children) => (
        <Link to="/complete-profile" search={{ section: s.id as AthleteSectionId }} className={className}>{children}</Link>
      )}
    />
  );
}

/** One-line completion banner for the athlete dashboard: percent, thin bar, and a single button to the full profile form. */
export function AthleteCompletionBanner() {
  const { percent, next, complete } = useAthleteCompletion();
  if (complete) return null;
  return (
    <section
      data-testid="athlete-completion-banner"
      aria-label="Profile completion"
      className="surface flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:gap-4"
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <p className="shrink-0 text-sm font-semibold">
          Profile <span data-testid="completion-percent">{percent}</span>% complete
        </p>
        <div className="min-w-0 flex-1">
          <AnimatedBar percent={percent} label="Profile completion" />
        </div>
      </div>
      <Link
        to="/complete-profile"
        search={next ? { section: next.id as AthleteSectionId } : undefined}
        className={cn(btn.primary, btn.sm, "w-full whitespace-nowrap sm:w-auto")}
      >
        Complete Profile
      </Link>
    </section>
  );
}

const verificationTone: Record<CoachVerificationStatus, "warning" | "success" | "default"> = {
  Pending: "warning",
  Verified: "success",
  Rejected: "default",
};

function verificationLabel(v: CoachVerification): string {
  if (v.status === "Verified") return "Verified";
  if (v.status === "Rejected") return "Not approved";
  return v.requested ? "Pending review" : "Not requested yet";
}

/** Organization verification is reported next to — never inside — profile completion. */
function VerificationStatus({ verification }: { verification: CoachVerification }) {
  const [sending, setSending] = useState(false);
  const request = async () => {
    setSending(true);
    try {
      await coachProfileStore.requestVerification();
      toast.success("Verification request sent", { description: "Your school's representative will review it." });
    } catch (err) {
      if (err instanceof CoachValidationError) toast.error("Enter your organization name in your profile first.");
      else toast.error(err instanceof Error ? err.message : "Couldn't send the request. Please try again.");
    } finally {
      setSending(false);
    }
  };
  const sent = verification.submittedAt ? new Date(verification.submittedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : null;

  return (
    <div className="flex flex-col gap-2 text-sm" data-testid="coach-verification">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="font-semibold">Organization verification</span>
        <Pill tone={verificationTone[verification.status]}>{verificationLabel(verification)}</Pill>
        {verification.requested && sent && <span className="text-xs text-muted-foreground">Sent {sent}</span>}
        {verification.canRequest && (
          <button type="button" className={cn(btn.secondary, btn.sm)} onClick={request} disabled={sending}>
            {sending ? "Sending…" : verification.status === "Rejected" ? "Request again" : "Request verification"}
          </button>
        )}
      </div>
      {verification.status === "Rejected" && verification.note && (
        <p role="note" className="rounded-xl bg-muted px-3 py-2 text-xs text-foreground">Reviewer's note: {verification.note}</p>
      )}
      <span className="text-xs text-muted-foreground">
        Reviewed by the representative of the school you picked at sign-up. It doesn't change your profile completion.
      </span>
    </div>
  );
}

export function CoachCompletionCard() {
  const { profile, verification } = useCoachProfile();
  const result = useMemo(() => computeCoachCompletion(profile), [profile]);
  const [open, setOpen] = useState(false);
  const [section, setSection] = useState<CoachSectionId | null>(null);
  const openAt = (id: CoachSectionId) => {
    setSection(id);
    setOpen(true);
  };
  return (
    <>
      <CompletionCard
        testId="coach-completion"
        title="Complete Your Coach Profile"
        result={result}
        message={coachMessage(result)}
        footer={<VerificationStatus verification={verification} />}
        completeText={<button type="button" className={btn.secondary} onClick={() => openAt("basic")}>Edit profile</button>}
        renderAction={(s, className, children) => (
          <button type="button" className={className} onClick={() => openAt(s.id as CoachSectionId)}>{children}</button>
        )}
      />
      <CoachProfileSheet open={open} section={section} onOpenChange={setOpen} />
    </>
  );
}

/** One-line completion banner for the coach dashboard; the button opens the profile sheet at the next unfinished section. */
export function CoachCompletionBanner() {
  const { profile } = useCoachProfile();
  const { percent, next, complete } = useMemo(() => computeCoachCompletion(profile), [profile]);
  const [open, setOpen] = useState(false);
  const [section, setSection] = useState<CoachSectionId | null>(null);
  return (
    <>
      {!complete && (
        <section
          data-testid="coach-completion-banner"
          aria-label="Profile completion"
          className="surface flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:gap-4"
        >
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <p className="shrink-0 text-sm font-semibold">
              Profile <span data-testid="completion-percent">{percent}</span>% complete
            </p>
            <div className="min-w-0 flex-1">
              <AnimatedBar percent={percent} label="Profile completion" />
            </div>
          </div>
          <button
            type="button"
            className={cn(btn.primary, btn.sm, "w-full whitespace-nowrap sm:w-auto")}
            onClick={() => {
              setSection((next?.id as CoachSectionId | undefined) ?? "basic");
              setOpen(true);
            }}
          >
            Complete Profile
          </button>
        </section>
      )}
      <CoachProfileSheet open={open} section={section} onOpenChange={setOpen} />
    </>
  );
}

// ---------- helpers for the pages that save profile data ----------

/** Completion of the signed-in athlete right now, read straight from the stores. */
export function athleteCompletionNow() {
  return computeAthleteCompletion(profileStore.getSnapshot(), profileExtrasStore.getSnapshot());
}

/** Call after a successful save, passing the percent from before it, so the toast shows the gain. */
export function toastSaved(what: string, before: number) {
  const after = athleteCompletionNow().percent;
  toast.success(after > before ? `${what} · ${after}% complete (+${after - before}%)` : after === 100 ? `${what} · profile complete!` : what);
}
