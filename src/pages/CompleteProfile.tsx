import { Link, useNavigate, useSearch } from "@/router-compat";
import { Page } from "@/components/Page";
import { useRef, useState, type FormEvent, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, Check, Save } from "lucide-react";
import { toast } from "sonner";
import { sports } from "@/lib/sports";
import { Select } from "@/components/common";
import { AnimatedBar } from "@/components/profile-completion";
import { useUniversityOptions } from "@/lib/useUniversityOptions";
import { ShowcaseCard } from "@/components/profile-extras-cards";
import { athleteCompletionNow, toastSaved, useAthleteCompletion } from "@/components/profile-completion-cards";
import {
  LIMITS, ProfileValidationError, TEAM_STATUSES, profileStore, toDraft, useAthleteProfile, validateProfile,
  type ProfileDraft, type ProfileErrors,
} from "@/lib/profileStore";
import {
  COVERAGE_OPTIONS, ExtrasValidationError, profileExtrasStore, useProfileExtras, validateScholarship,
  type CoveragePreference, type ScholarshipInterests,
} from "@/lib/profileExtrasStore";
import { ATHLETE_SECTION_IDS, type AthleteSectionId } from "@/lib/profileCompletion";
import { cn } from "@/lib/utils";
import court from "@/assets/court.jpg";

// ?section=<id> opens that section.
const parseSection = (search: Record<string, unknown>): { section?: AthleteSectionId } => {
  const v = search["section"];
  return (ATHLETE_SECTION_IDS as readonly unknown[]).includes(v) ? { section: v as AthleteSectionId } : {};
};

// Initial profile setup for newly registered student-athletes. It reads and writes the same stores
// and uses the same validation as Settings, but it is its own page: Settings stays the place where
// existing users manage their profile afterwards.


const input =
  "h-11 w-full rounded-xl border bg-card px-3 text-sm font-normal outline-none transition hover:border-success/50 focus:border-success focus:ring-4 focus:ring-success/20";
const greenBtn =
  "inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-success px-5 text-sm font-semibold text-white transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-success disabled:opacity-60";
const plainBtn =
  "inline-flex h-11 items-center justify-center gap-2 rounded-xl border bg-card px-5 text-sm font-semibold transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-success disabled:cursor-not-allowed disabled:opacity-50";

const SECTION_INFO: Record<AthleteSectionId, { title: string; hint: string }> = {
  basic: { title: "Basic information", hint: "Tell recruiters who you are." },
  athletic: { title: "Athletic information", hint: "Your sport, position and body measurements." },
  school: { title: "School information", hint: "Where you study." },
  achievements: { title: "Athletic achievements", hint: "Add at least one award or recognition." },
  scholarship: { title: "Scholarship interests", hint: "What kind of scholarship you're looking for." },
  showcase: { title: "Profile showcase", hint: "A profile photo and a highlight video link." },
};

/** The profile-form fields each section edits, so only that section's errors are shown. */
const SECTION_FIELDS: Partial<Record<AthleteSectionId, (keyof ProfileErrors)[]>> = {
  basic: ["firstName", "lastName", "bio"],
  athletic: ["sport", "position", "heightCm", "weightKg", "teamStatus", "teamName"],
  school: ["school", "year"],
  achievements: ["achievements", "achievementsTotal"],
};

function Field({ label, error, className, children }: { label: string; error?: string | undefined; className?: string; children: ReactNode }) {
  return (
    <label className={cn("flex flex-col gap-1.5 text-sm font-medium", className)}>
      {label}
      {children}
      {error && <span role="alert" className="text-xs font-normal text-destructive">{error}</span>}
    </label>
  );
}

function CompleteProfileBody() {
  const navigate = useNavigate();
  const { section } = useSearch(parseSection);
  const athlete = useAthleteProfile();
  const extras = useProfileExtras();
  const result = useAthleteCompletion();

  // The section that opens when no ?section is given is decided once, so it doesn't jump while saving.
  const initial = useRef<AthleteSectionId>((result.next?.id as AthleteSectionId | undefined) ?? "basic");
  const current: AthleteSectionId = section ?? initial.current;
  const index = ATHLETE_SECTION_IDS.indexOf(current);
  const isFirst = index === 0;
  const isLast = index === ATHLETE_SECTION_IDS.length - 1;

  // null until something is edited, so the form always shows what is saved.
  const [draft, setDraft] = useState<ProfileDraft | null>(null);
  const [schDraft, setSchDraft] = useState<ScholarshipInterests | null>(null);
  const [tried, setTried] = useState(false);
  const [saving, setSaving] = useState(false);

  const d = draft ?? toDraft(athlete);
  const errors = validateProfile(d);
  const sch = schDraft ?? extras.scholarship;
  const { options: universityOptions, loading: universitiesLoading } = useUniversityOptions(sch.universities);
  const schErrors = validateScholarship(sch);
  const edit = (patch: Partial<ProfileDraft>) => setDraft({ ...d, ...patch });
  const editSch = (patch: Partial<ScholarshipInterests>) => setSchDraft({ ...sch, ...patch });
  const shown = (k: keyof ProfileErrors): string | undefined => {
    const v = tried ? errors[k] : undefined;
    return typeof v === "string" ? v : undefined;
  };
  const setAch = (i: number, patch: Partial<{ title: string; year: string }>) =>
    edit({ achievements: d.achievements.map((x, j) => (j === i ? { ...x, ...patch } : x)) });

  const goTo = (id: AthleteSectionId) => {
    setTried(false);
    void navigate({ search: { section: id }, replace: true });
    window.scrollTo({ top: 0 });
  };

  /** Saves what is on screen. Returns false (and shows the problems) when something is invalid. */
  async function saveCurrent(): Promise<boolean> {
    setTried(true);
    if (saving) return false;
    const before = athleteCompletionNow().percent;
    setSaving(true);
    try {
      if (current === "scholarship") {
        await profileExtrasStore.saveScholarship(sch);
        setSchDraft(null);
      } else if (current !== "showcase") {
        await profileStore.save(d);
        setDraft(null);
      } else {
        return true; // photo and video link save from their own buttons
      }
      setTried(false);
      toastSaved("Progress saved", before);
      return true;
    } catch (err) {
      if (err instanceof ProfileValidationError || err instanceof ExtrasValidationError) {
        toast.error("Fix the highlighted fields to save.");
        return false;
      }
      toast.error(err instanceof Error ? err.message : "Couldn't save. Please try again.");
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function onNext(e?: FormEvent) {
    e?.preventDefault();
    if (!(await saveCurrent())) return;
    if (isLast) {
      toast.success("Profile setup finished");
      void navigate({ to: "/dashboard" });
      return;
    }
    goTo(ATHLETE_SECTION_IDS[index + 1] as AthleteSectionId);
  }

  const info = SECTION_INFO[current];
  const sectionErrors = (SECTION_FIELDS[current] ?? []).filter((k) => tried && errors[k]);

  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      {/* Brand panel — same as the Sign up page; stays in view on desktop while the setup scrolls */}
      <aside className="relative overflow-hidden bg-hero text-navy-foreground lg:sticky lg:top-0 lg:h-screen lg:self-start">
        <img src={court} alt="" className="absolute inset-0 h-full w-full object-cover opacity-25" />
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-electric/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-primary/30 blur-3xl" />
        <div className="relative flex h-full flex-col justify-between gap-10 px-6 py-8 sm:px-10 lg:min-h-screen lg:px-14 lg:py-12">
          <div className="flex items-center gap-2.5">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-electric-gradient font-display text-xl font-bold text-primary-foreground shadow-glow">S</span>
            <span className="font-display text-2xl font-bold tracking-wide">SPORTAL</span>
          </div>
          <div className="hidden lg:block">
            <p className="font-display text-5xl font-bold uppercase leading-tight tracking-wide">
              Build your profile.
              <br />
              <span className="text-electric">Get discovered.</span>
            </p>
            <p className="mt-5 max-w-md text-navy-muted">
              Create your account, then watch your profile fill up one section at a time.
            </p>
          </div>
          <p className="hidden text-xs text-navy-muted lg:block">© {new Date().getFullYear()} Sportal</p>
          <p className="font-display text-lg font-semibold uppercase tracking-wider lg:hidden">
            Build your profile. <span className="text-electric">Get discovered.</span>
          </p>
        </div>
      </aside>

      {/* Profile setup */}
      <main className="flex justify-center px-4 py-8 sm:px-8 lg:py-12">
        <div className="flex w-full max-w-2xl flex-col gap-5" data-testid="complete-profile">
        <div className="flex justify-end">
          <Link to="/dashboard" className="text-sm font-semibold text-muted-foreground hover:text-foreground">
            Skip for now, go to dashboard
          </Link>
        </div>
        <div>
          <h1 className="text-3xl font-bold sm:text-4xl">Complete your profile</h1>
          <p className="mt-1 text-sm text-muted-foreground">Fill in one section at a time. Your progress is saved, so you can leave and come back.</p>
        </div>

        {/* Progress */}
        <section className="surface p-4 sm:p-5" aria-label="Profile progress">
          <div className="flex items-end justify-between gap-4">
            <p className="text-sm font-semibold">Step {index + 1} of {ATHLETE_SECTION_IDS.length}</p>
            <p className="font-display text-3xl font-bold leading-none text-success" aria-live="polite">
              <span data-testid="completion-percent">{result.percent}</span><span className="text-xl">%</span>
              <span className="ml-1.5 text-xs font-medium text-muted-foreground">complete</span>
            </p>
          </div>
          <div className="mt-3"><AnimatedBar percent={result.percent} label="Profile completion" /></div>
          <ol className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {result.sections.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => goTo(s.id as AthleteSectionId)}
                  aria-current={s.id === current ? "step" : undefined}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-left text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-success",
                    s.id === current ? "border-success bg-success/10" : s.complete ? "border-success/30 bg-success/5 hover:bg-success/10" : "bg-card hover:bg-muted",
                  )}
                >
                  {s.complete ? (
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-success text-white"><Check className="h-3 w-3" strokeWidth={3} aria-hidden="true" /></span>
                  ) : (
                    <span className="h-5 w-5 shrink-0 rounded-full border-2 border-muted-foreground/40" aria-hidden="true" />
                  )}
                  <span className="min-w-0 truncate">{s.label}</span>
                  <span className="sr-only">{s.complete ? "Completed" : "Not completed"}</span>
                </button>
              </li>
            ))}
          </ol>
        </section>

        {/* Current section */}
        <section className="surface p-5 sm:p-6" aria-labelledby="section-title">
          <h2 id="section-title" className="text-xl font-bold">{info.title}</h2>
          <p className="mb-5 text-sm text-muted-foreground">{info.hint}</p>

          <form onSubmit={onNext} noValidate className="flex flex-col gap-5">
            {current === "basic" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="First name" error={shown("firstName")}>
                  <input className={input} value={d.firstName} onChange={(e) => edit({ firstName: e.target.value })} aria-invalid={!!shown("firstName")} autoComplete="given-name" />
                </Field>
                <Field label="Last name" error={shown("lastName")}>
                  <input className={input} value={d.lastName} onChange={(e) => edit({ lastName: e.target.value })} aria-invalid={!!shown("lastName")} autoComplete="family-name" />
                </Field>
                <Field label="Athletic bio" error={shown("bio")} className="sm:col-span-2">
                  <textarea rows={4} className="rounded-xl border bg-card p-3 text-sm font-normal outline-none transition hover:border-success/50 focus:border-success focus:ring-4 focus:ring-success/20" value={d.bio} onChange={(e) => edit({ bio: e.target.value })} aria-invalid={!!shown("bio")} />
                  <span className={cn("ml-auto text-xs font-normal", d.bio.length > LIMITS.bio ? "text-destructive" : "text-muted-foreground")}>{d.bio.length}/{LIMITS.bio}</span>
                </Field>
              </div>
            )}

            {current === "athletic" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Sport" error={shown("sport")}>
                  <Select value={d.sport} placeholder="Choose a sport" onChange={(e) => edit({ sport: e.target.value })} aria-invalid={!!shown("sport")}>
                    {sports.map((s) => <option key={s.id}>{s.name}</option>)}
                  </Select>
                </Field>
                <Field label="Position" error={shown("position")}>
                  <input className={input} value={d.position} onChange={(e) => edit({ position: e.target.value })} aria-invalid={!!shown("position")} />
                </Field>
                <Field label="Height (cm)" error={shown("heightCm")}>
                  <input className={input} inputMode="decimal" value={d.heightCm} onChange={(e) => edit({ heightCm: e.target.value })} aria-invalid={!!shown("heightCm")} />
                </Field>
                <Field label="Weight (kg)" error={shown("weightKg")}>
                  <input className={input} inputMode="decimal" value={d.weightKg} onChange={(e) => edit({ weightKg: e.target.value })} aria-invalid={!!shown("weightKg")} />
                </Field>
                <Field label="Team status" error={shown("teamStatus")}>
                  <Select value={d.teamStatus} placeholder="Choose a status" onChange={(e) => edit({ teamStatus: e.target.value as ProfileDraft["teamStatus"] })}>
                    {TEAM_STATUSES.map((t) => <option key={t}>{t}</option>)}
                  </Select>
                </Field>
                {d.teamStatus !== "Not on a team" && (
                  <Field label="Team name" error={shown("teamName")}>
                    <input className={input} value={d.teamName} onChange={(e) => edit({ teamName: e.target.value })} aria-invalid={!!shown("teamName")} placeholder="e.g. SNNHS Varsity Boys" />
                  </Field>
                )}
              </div>
            )}

            {current === "school" && (
              <div className="grid gap-4">
                <Field label="School" error={shown("school")}>
                  <input className={input} value={d.school} onChange={(e) => edit({ school: e.target.value })} aria-invalid={!!shown("school")} />
                </Field>
                <Field label="Year level" error={shown("year")}>
                  <input className={input} value={d.year} onChange={(e) => edit({ year: e.target.value })} aria-invalid={!!shown("year")} placeholder="e.g. Grade 12 · STEM" />
                </Field>
              </div>
            )}

            {current === "achievements" && (
              <div className="flex flex-col gap-3">
                {d.achievements.length === 0 && <p className="text-sm text-muted-foreground">No achievements yet.</p>}
                {d.achievements.map((x, i) => (
                  <div key={i} className="flex flex-col gap-1">
                    <div className="flex gap-2">
                      <input aria-label={`Achievement ${i + 1} title`} className={input} placeholder="Title" value={x.title} onChange={(e) => setAch(i, { title: e.target.value })} />
                      <input aria-label={`Achievement ${i + 1} year`} className={cn(input, "!w-24 shrink-0")} inputMode="numeric" placeholder="Year" value={x.year} onChange={(e) => setAch(i, { year: e.target.value })} />
                      <button type="button" aria-label={`Remove achievement ${i + 1}`} className={plainBtn} onClick={() => edit({ achievements: d.achievements.filter((_, j) => j !== i) })}>Remove</button>
                    </div>
                    {tried && errors.achievements?.[i] && <span role="alert" className="text-xs text-destructive">{errors.achievements[i]}</span>}
                  </div>
                ))}
                {shown("achievementsTotal") && <span role="alert" className="text-xs text-destructive">{shown("achievementsTotal")}</span>}
                <button
                  type="button" className={cn(plainBtn, "self-start")} disabled={d.achievements.length >= LIMITS.achievements}
                  onClick={() => edit({ achievements: [...d.achievements, { title: "", year: String(new Date().getFullYear()) }] })}
                >Add achievement</button>
              </div>
            )}

            {current === "scholarship" && (
              <div className="flex flex-col gap-4">
                <fieldset className="flex flex-col gap-2">
                  <legend className="mb-1 text-sm font-medium">Universities you're interested in</legend>
                  <div className="flex flex-wrap gap-2">
                    {universityOptions.map((u) => (
                      <button
                        key={u} type="button" aria-pressed={sch.universities.includes(u)}
                        onClick={() => editSch({ universities: sch.universities.includes(u) ? sch.universities.filter((x) => x !== u) : [...sch.universities, u] })}
                        className={cn(
                          "rounded-full border px-3.5 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-success",
                          sch.universities.includes(u) ? "border-success bg-success/15 text-foreground" : "bg-card text-muted-foreground hover:text-foreground",
                        )}
                      >{u}</button>
                    ))}
                  </div>
                  {!universitiesLoading && universityOptions.length === 0 && <span className="text-xs text-muted-foreground">No university has posted a scholarship yet.</span>}
                  {tried && schErrors.universities && <span role="alert" className="text-xs text-destructive">{schErrors.universities}</span>}
                </fieldset>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Coverage you're looking for" error={tried ? schErrors.coverage : undefined}>
                    <Select value={sch.coverage} placeholder="Choose a preference" onChange={(e) => editSch({ coverage: e.target.value as CoveragePreference })}>
                      {COVERAGE_OPTIONS.map((c) => <option key={c}>{c}</option>)}
                    </Select>
                  </Field>
                  <Field label="Intended course" error={tried ? schErrors.course : undefined}>
                    <input className={input} value={sch.course} onChange={(e) => editSch({ course: e.target.value })} aria-invalid={tried && !!schErrors.course} placeholder="e.g. BS Kinesiology" />
                  </Field>
                </div>
              </div>
            )}

            {current === "showcase" && <ShowcaseCard />}

            {sectionErrors.length > 0 && <p role="alert" className="text-sm text-destructive">Some fields need attention.</p>}

            <div className="flex flex-col-reverse gap-2 border-t pt-5 sm:flex-row sm:items-center">
              <button type="button" className={plainBtn} disabled={isFirst} onClick={() => goTo(ATHLETE_SECTION_IDS[index - 1] as AthleteSectionId)}>
                <ArrowLeft className="h-4 w-4" /> Previous
              </button>
              <div className="flex flex-col gap-2 sm:ml-auto sm:flex-row">
                {current !== "showcase" && (
                  <button type="button" className={plainBtn} onClick={() => void saveCurrent()}>
                    <Save className="h-4 w-4" /> Save progress
                  </button>
                )}
                <button type="submit" className={greenBtn}>
                  {isLast ? "Finish" : "Save & Next"} {isLast ? <Check className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </form>
        </section>
        </div>
      </main>
    </div>
  );
}

export default function CompleteProfilePage() {
  return (
    <Page shell={false}>
      <CompleteProfileBody />
    </Page>
  );
}
