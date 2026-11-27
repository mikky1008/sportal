import { useState } from "react";
import { toast } from "sonner";
import { Select, btn } from "@/components/common";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { sports } from "@/lib/sports";
import {
  COACH_LIMITS, COMPETITION_LEVELS, CoachValidationError, ORGANIZATION_TYPES, POSITION_TITLES,
  coachProfileStore, hasCoachErrors, useCoachProfile, validateCoach, type CoachErrors, type CoachProfile,
} from "@/lib/coachProfileStore";
import { computeCoachCompletion, type CoachSectionId } from "@/lib/profileCompletion";

const field = "h-11 w-full rounded-xl border bg-background px-3 text-sm font-normal outline-none focus:ring-2 focus:ring-ring";

function Err({ msg }: { msg: string | undefined }) {
  return msg ? <span role="alert" className="text-xs font-normal text-destructive">{msg}</span> : null;
}

function Group({ id, title, hint, children }: { id: CoachSectionId; title: string; hint?: string; children: React.ReactNode }) {
  return (
    <fieldset id={`coach-section-${id}`} className="flex scroll-mt-4 flex-col gap-3 rounded-2xl border p-4">
      <legend className="px-1 font-display text-base font-bold">{title}</legend>
      {hint && <p className="-mt-1 text-xs text-muted-foreground">{hint}</p>}
      {children}
    </fieldset>
  );
}

function CoachForm({ onDone }: { onDone: () => void }) {
  const saved = useCoachProfile().profile;
  const [draft, setDraft] = useState<CoachProfile>(saved);
  const [tried, setTried] = useState(false);
  const [saving, setSaving] = useState(false);
  const errors: CoachErrors = validateCoach(draft);
  const shown: CoachErrors = tried ? errors : {};
  const set = (patch: Partial<CoachProfile>) => setDraft((d) => ({ ...d, ...patch }));

  const text = (k: keyof CoachProfile, label: string, extra?: { placeholder?: string; type?: string; inputMode?: "numeric" | "email"; readOnly?: boolean }) => (
    <label className="flex flex-col gap-1.5 text-sm font-medium">{label}
      <input
        className={field} value={draft[k]} onChange={(e) => set({ [k]: e.target.value })}
        aria-invalid={!!shown[k]} placeholder={extra?.placeholder} type={extra?.type} inputMode={extra?.inputMode} readOnly={extra?.readOnly}
      />
      <Err msg={shown[k]} />
    </label>
  );
  const pick = (k: keyof CoachProfile, label: string, options: readonly string[], placeholder: string) => (
    <label className="flex flex-col gap-1.5 text-sm font-medium">{label}
      <Select value={draft[k]} onChange={(e) => set({ [k]: e.target.value })} placeholder={placeholder} aria-invalid={!!shown[k]}>
        {options.map((o) => <option key={o}>{o}</option>)}
      </Select>
      <Err msg={shown[k]} />
    </label>
  );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTried(true);
    if (saving) return;
    const before = computeCoachCompletion(saved).percent;
    setSaving(true);
    try {
      const next = await coachProfileStore.save(draft);
      const after = computeCoachCompletion(next.profile).percent;
      toast.success(after > before ? `Coach profile saved · ${after}% complete (+${after - before}%)` : `Coach profile saved · ${after}% complete`);
      onDone();
    } catch (err) {
      if (err instanceof CoachValidationError) toast.error("Fix the highlighted fields to save.");
      else toast.error(err instanceof Error ? err.message : "Couldn't save your profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="mt-4 flex flex-col gap-4 pb-6">
      <Group id="basic" title="Basic Information">
        <div className="grid gap-3 sm:grid-cols-2">
          {text("firstName", "First name")}
          {text("lastName", "Last name")}
        </div>
        {text("email", "Sign-in email", { type: "email", inputMode: "email", readOnly: true })}
      </Group>
      <Group id="organization" title="Organization Information">
        {text("organizationName", "Organization name", { placeholder: "e.g. FEU Tamaraws" })}
        {pick("organizationType", "Organization type", ORGANIZATION_TYPES, "Choose a type")}
        {text("organizationLocation", "Location", { placeholder: "City or municipality" })}
      </Group>
      <Group id="position" title="Coaching Position">
        {pick("positionTitle", "Position", POSITION_TITLES, "Choose your role")}
        {text("programName", "Team or program", { placeholder: "e.g. Men's Basketball" })}
      </Group>
      <Group id="sport" title="Sport Specialization">
        {pick("primarySport", "Primary sport", sports.map((s) => s.name), "Choose a sport")}
        {pick("competitionLevel", "Competition level", COMPETITION_LEVELS, "Choose a level")}
      </Group>
      <Group id="background" title="Professional Background">
        {text("yearsExperience", "Years of experience", { inputMode: "numeric", placeholder: "e.g. 8" })}
        <label className="flex flex-col gap-1.5 text-sm font-medium">Background summary
          <textarea
            rows={4} value={draft.background} onChange={(e) => set({ background: e.target.value })}
            aria-invalid={!!shown.background}
            className="rounded-xl border bg-background p-3 text-sm font-normal outline-none focus:ring-2 focus:ring-ring"
            placeholder="Teams you've coached, level, notable results…"
          />
          <span className="flex justify-between gap-2">
            <Err msg={shown.background} />
            <span className="ml-auto text-xs font-normal text-muted-foreground">{draft.background.length}/{COACH_LIMITS.background.max}</span>
          </span>
        </label>
        {text("certifications", "Certifications (optional)", { placeholder: "e.g. FIBA Level 1" })}
      </Group>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" className={btn.primary} disabled={saving}>{saving ? "Saving…" : "Save changes"}</button>
        <button type="button" className={btn.secondary} onClick={onDone}>Cancel</button>
        {tried && hasCoachErrors(errors) && <span role="alert" className="text-sm text-destructive">Some fields need attention.</span>}
      </div>
    </form>
  );
}

/** Slide-over editor for the coach profile. Opens scrolled to the section the coach picked. */
export function CoachProfileSheet({
  open, section, onOpenChange,
}: { open: boolean; section: CoachSectionId | null; onOpenChange: (open: boolean) => void }) {
  const { load } = useCoachProfile();
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full overflow-y-auto sm:max-w-lg"
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          const el = section ? document.getElementById(`coach-section-${section}`) : null;
          el?.scrollIntoView({ block: "start" });
          el?.querySelector<HTMLElement>("input,select,textarea")?.focus({ preventScroll: true });
        }}
      >
        <SheetHeader>
          <SheetTitle>Coach profile</SheetTitle>
          <SheetDescription>Fill in each section at your own pace — you can save part-way and come back.</SheetDescription>
        </SheetHeader>
        {/* keyed by the load state so the form starts from the saved profile once it has arrived */}
        <CoachForm key={load} onDone={() => onOpenChange(false)} />
      </SheetContent>
    </Sheet>
  );
}
