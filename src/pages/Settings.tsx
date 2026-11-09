import { useSearch } from "@/router-compat";
import { Page } from "@/components/Page";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { sports } from "@/lib/sports";
import { Card, PageHeader, Select, btn } from "@/components/common";
import { Switch } from "@/components/ui/switch";
import { ScholarshipInterestsCard, ShowcaseCard } from "@/components/profile-extras-cards";
import { athleteCompletionNow, toastSaved } from "@/components/profile-completion-cards";
import { ATHLETE_SECTION_IDS, type AthleteSectionId } from "@/lib/profileCompletion";
import { CATEGORIES, MUNICIPALITIES } from "@/lib/athleteProfileRules";
import { getShowcaseVisibility, setShowcaseVisibility } from "@/lib/rankingsApi";
import {
  LIMITS, ProfileValidationError, TEAM_STATUSES, hasErrors, profileStore, toDraft, useAthleteProfile, validateProfile,
  type ProfileDraft,
} from "@/lib/profileStore";

// ?section=<id> opens that section.
const parseSection = (search: Record<string, unknown>): { section?: AthleteSectionId } => {
  const v = search["section"];
  return (ATHLETE_SECTION_IDS as readonly unknown[]).includes(v) ? { section: v as AthleteSectionId } : {};
};


const field = "h-11 w-full rounded-xl border bg-background px-3 text-sm font-normal outline-none focus:ring-2 focus:ring-ring";

function FieldError({ id, msg }: { id: string; msg: string | undefined }) {
  return msg ? <span id={id} role="alert" className="text-xs font-normal text-destructive">{msg}</span> : null;
}

function Settings() {
  const a = useAthleteProfile();
  const { section } = useSearch(parseSection);
  useEffect(() => {
    if (!section) return;
    const el = document.getElementById(`section-${section}`);
    if (!el) return;
    el.scrollIntoView({ block: "start", behavior: window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    el.querySelector<HTMLElement>("input,select,textarea,button")?.focus({ preventScroll: true });
  }, [section]);
  // `draft` is null until the athlete edits something, so the form always shows the saved profile.
  const [draft, setDraft] = useState<ProfileDraft | null>(null);
  const [tried, setTried] = useState(false);
  const [saving, setSaving] = useState(false);
  const d = draft ?? toDraft(a);
  const errors = validateProfile(d);
  const shown = tried ? errors : {};
  const edit = (patch: Partial<ProfileDraft>) => setDraft({ ...d, ...patch });
  const setAch = (i: number, patch: Partial<{ title: string; year: string }>) =>
    edit({ achievements: d.achievements.map((x, j) => (j === i ? { ...x, ...patch } : x)) });
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setTried(true);
    if (saving) return;
    const before = athleteCompletionNow().percent;
    setSaving(true);
    try {
      await profileStore.save(d);
      setDraft(null);
      setTried(false);
      toastSaved("Profile saved", before);
    } catch (err) {
      if (err instanceof ProfileValidationError) toast.error("Fix the highlighted fields to save.");
      else toast.error(err instanceof Error ? err.message : "Couldn't save your profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };
  const discard = () => { setDraft(null); setTried(false); };
  const [prefs, setPrefs] = useState({ analysis: true, recruitment: true, scholarships: true });
  // Showcase visibility is real shared state: it controls whether recruiters can find you.
  // Whether verified coaches can find this athlete, and whether they appear in other people's
  // rankings. It is saved on the server (that is what recruiting and rankings read).
  const [visible, setVisible] = useState<boolean | null>(null);
  const showcaseVisible = visible !== false;
  useEffect(() => {
    let live = true;
    void getShowcaseVisibility().then((r) => { if (live && r.ok) setVisible(r.data.visible); });
    return () => { live = false; };
  }, []);
  const toggles: { key: keyof typeof prefs; label: string; desc: string }[] = [
    { key: "analysis", label: "Analysis notifications", desc: "Get notified when a practice analysis is complete." },
    { key: "recruitment", label: "Recruitment messages", desc: "Messages and invitations from coaches." },
    { key: "scholarships", label: "Scholarship matches", desc: "Alerts for scholarships you're eligible for." },
  ];
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <PageHeader title="Settings" />
      <Card title="Profile">
        <form className="grid gap-4 sm:grid-cols-2" onSubmit={save} noValidate>
          <h3 id="section-basic" className="scroll-mt-24 font-display text-base font-bold sm:col-span-2">Basic information</h3>
          <label className="flex flex-col gap-1.5 text-sm font-medium">First name
            <input className={field} value={d.firstName} onChange={(e) => edit({ firstName: e.target.value })} aria-invalid={!!shown.firstName} aria-describedby="e-first" />
            <FieldError id="e-first" msg={shown.firstName} />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium">Last name
            <input className={field} value={d.lastName} onChange={(e) => edit({ lastName: e.target.value })} aria-invalid={!!shown.lastName} aria-describedby="e-last" />
            <FieldError id="e-last" msg={shown.lastName} />
          </label>
          <h3 id="section-athletic" className="scroll-mt-24 border-t pt-4 font-display text-base font-bold sm:col-span-2">Athletic information</h3>
          <label className="flex flex-col gap-1.5 text-sm font-medium">Sport
            <Select value={d.sport} placeholder="Choose a sport" onChange={(e) => edit({ sport: e.target.value })} aria-invalid={!!shown.sport}>{sports.map((s) => <option key={s.id}>{s.name}</option>)}</Select>
            <FieldError id="e-sport" msg={shown.sport} />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium">Position
            <input className={field} value={d.position} onChange={(e) => edit({ position: e.target.value })} aria-invalid={!!shown.position} />
            <FieldError id="e-pos" msg={shown.position} />
          </label>
          <h3 id="section-school" className="scroll-mt-24 border-t pt-4 font-display text-base font-bold sm:col-span-2">School information</h3>
          <label className="flex flex-col gap-1.5 text-sm font-medium sm:col-span-2">School
            <input className={field} value={d.school} onChange={(e) => edit({ school: e.target.value })} aria-invalid={!!shown.school} aria-describedby="e-school" />
            <FieldError id="e-school" msg={shown.school} />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium sm:col-span-2">Municipality
            <Select value={d.municipality} onChange={(e) => edit({ municipality: e.target.value })} aria-describedby="e-muni">
              <option value="">Not set</option>
              {MUNICIPALITIES.map((m) => <option key={m} value={m}>{m}</option>)}
            </Select>
            <span id="e-muni" className="text-xs font-normal text-muted-foreground">Where your school is. It puts you in the Municipality filter on Rankings.</span>
            <FieldError id="e-muni-err" msg={shown.municipality} />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium sm:col-span-2">Ranking category
            <Select value={d.category} onChange={(e) => edit({ category: e.target.value })} aria-describedby="e-cat">
              <option value="">Not set</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
            <span id="e-cat" className="text-xs font-normal text-muted-foreground">Used by the Category filter on Rankings.</span>
            <FieldError id="e-cat-err" msg={shown.category} />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium sm:col-span-2">Year level
            <input className={field} value={d.year} onChange={(e) => edit({ year: e.target.value })} aria-invalid={!!shown.year} placeholder="e.g. Grade 12 · STEM" />
            <FieldError id="e-year" msg={shown.year} />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium">Height (cm)
            <input className={field} inputMode="decimal" value={d.heightCm} onChange={(e) => edit({ heightCm: e.target.value })} aria-invalid={!!shown.heightCm} aria-describedby="e-height" />
            <FieldError id="e-height" msg={shown.heightCm} />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium">Weight (kg)
            <input className={field} inputMode="decimal" value={d.weightKg} onChange={(e) => edit({ weightKg: e.target.value })} aria-invalid={!!shown.weightKg} aria-describedby="e-weight" />
            <FieldError id="e-weight" msg={shown.weightKg} />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium">Team status
            <Select value={d.teamStatus} placeholder="Choose a status" onChange={(e) => edit({ teamStatus: e.target.value as ProfileDraft["teamStatus"] })}>
              {TEAM_STATUSES.map((t) => <option key={t}>{t}</option>)}
            </Select>
          </label>
          {d.teamStatus !== "Not on a team" && (
            <label className="flex flex-col gap-1.5 text-sm font-medium">Team name
              <input className={field} value={d.teamName} onChange={(e) => edit({ teamName: e.target.value })} aria-invalid={!!shown.teamName} placeholder="e.g. SNNHS Varsity Boys" />
              <FieldError id="e-team" msg={shown.teamName} />
            </label>
          )}
          <label className="flex flex-col gap-1.5 text-sm font-medium sm:col-span-2">Athletic bio
            <textarea rows={3} className="rounded-xl border bg-background p-3 text-sm font-normal outline-none focus:ring-2 focus:ring-ring" value={d.bio} onChange={(e) => edit({ bio: e.target.value })} aria-invalid={!!shown.bio} aria-describedby="e-bio" />
            <span className="flex justify-between gap-2">
              <FieldError id="e-bio" msg={shown.bio} />
              <span data-testid="bio-count" className={`ml-auto text-xs font-normal ${d.bio.length > LIMITS.bio ? "text-destructive" : "text-muted-foreground"}`}>{d.bio.length}/{LIMITS.bio}</span>
            </span>
          </label>

          <fieldset id="section-achievements" className="flex scroll-mt-24 flex-col gap-3 border-t pt-4 sm:col-span-2">
            <legend className="mb-1 text-sm font-medium">Achievements</legend>
            {d.achievements.length === 0 && <p className="text-sm text-muted-foreground">No achievements yet.</p>}
            {d.achievements.map((x, i) => (
              <div key={i} className="flex flex-col gap-1">
                <div className="flex gap-2">
                  <input aria-label={`Achievement ${i + 1} title`} className={field} placeholder="Title" value={x.title} onChange={(e) => setAch(i, { title: e.target.value })} />
                  <input aria-label={`Achievement ${i + 1} year`} className={`${field} !w-24 shrink-0`} inputMode="numeric" placeholder="Year" value={x.year} onChange={(e) => setAch(i, { year: e.target.value })} />
                  <button type="button" aria-label={`Remove achievement ${i + 1}`} className={btn.secondary} onClick={() => edit({ achievements: d.achievements.filter((_, j) => j !== i) })}>Remove</button>
                </div>
                <FieldError id={`e-ach-${i}`} msg={shown.achievements?.[i]} />
              </div>
            ))}
            <FieldError id="e-ach-total" msg={shown.achievementsTotal} />
            <button type="button" className={`${btn.secondary} self-start`} disabled={d.achievements.length >= LIMITS.achievements} onClick={() => edit({ achievements: [...d.achievements, { title: "", year: String(new Date().getFullYear()) }] })}>Add achievement</button>
          </fieldset>

          <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
            <button type="submit" className={btn.primary} disabled={saving}>{saving ? "Saving…" : "Save changes"}</button>
            <button type="button" className={btn.secondary} onClick={discard} disabled={draft === null}>Discard changes</button>
            {tried && hasErrors(errors) && <span role="alert" className="text-sm text-destructive">Some fields need attention.</span>}
          </div>
        </form>
      </Card>
      <ScholarshipInterestsCard />
      <ShowcaseCard />
      <Card title="Privacy & Notifications">
        <ul className="flex flex-col divide-y">
          <li className="flex items-center justify-between gap-4 py-3">
            <div>
              <p className="font-medium">Visible to coaches &amp; universities</p>
              <p className="text-sm text-muted-foreground">
                {showcaseVisible
                  ? "Verified coaches can discover your showcase and send you inquiries, and you appear in rankings."
                  : "Your showcase is hidden from search and from other people's rankings, and new inquiries are closed. Existing conversations stay open."}
              </p>
            </div>
            <Switch
              aria-label="Visible to coaches and universities"
              checked={showcaseVisible}
              disabled={visible === null}
              onCheckedChange={async (v) => {
                const r = await setShowcaseVisibility(v);
                if (!r.ok) {
                  toast.error(r.message || "Couldn't change your visibility. Please try again.");
                  return;
                }
                setVisible(v);
                toast.success(v ? "Showcase is visible to coaches and in rankings" : "Showcase hidden from coaches and from others' rankings");
              }}
            />
          </li>
          {toggles.map((t) => (
            <li key={t.key} className="flex items-center justify-between gap-4 py-3">
              <div><p className="font-medium">{t.label}</p><p className="text-sm text-muted-foreground">{t.desc}</p></div>
              <Switch aria-label={t.label} checked={prefs[t.key]} onCheckedChange={(v) => setPrefs((p) => ({ ...p, [t.key]: v }))} />
            </li>
          ))}
        </ul>
      </Card>
      <Card title="Account type">
        <p className="text-sm text-muted-foreground">
          Signed in as <b className="text-foreground">Student-Athlete</b>. Coach/University and Administrator accounts are coming soon — coaches who find your showcase can send you inquiries under <b className="text-foreground">Recruiting</b>. Those stay locked until you accept them.
        </p>
      </Card>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Page title="Settings">
      <Settings />
    </Page>
  );
}
