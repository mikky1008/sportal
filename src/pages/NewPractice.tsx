import { Link, useNavigate, useSearch } from "@/router-compat";
import { Page } from "@/components/Page";
import { useRef, useState } from "react";
import { Camera, Upload, ArrowLeft, Info, Video, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { skills, skillsForSport } from "@/lib/skills";
import { useAthleteProfile } from "@/lib/profileStore";
import { getAssessmentName, setPendingVideo } from "@/services/aiService";
import { sessionStore } from "@/lib/sessionStore";
import type { SkillId } from "@/types";
import { Card, Pill, btn } from "@/components/common";
import { cn } from "@/lib/utils";

const skillIds = skills.map((s) => s.id) as SkillId[];
const parseNewSearch = (s: Record<string, unknown>): { skill?: SkillId | undefined } => ({
  skill: skillIds.includes(s["skill"] as SkillId) ? (s["skill"] as SkillId) : undefined,
});


function NewPractice() {
  const { skill: initial } = useSearch(parseNewSearch);
  const [skill, setSkill] = useState<SkillId | undefined>(initial);
  // Basketball has a drill-and-video flow; other sports go straight to logging a result.
  const [step, setStep] = useState<1 | 2 | 3>(initial ? (skills.find((s) => s.id === initial)?.sport === "Basketball" ? 2 : 3) : 1);
  const profile = useAthleteProfile();
  const sportSkills = skillsForSport(profile.sport);
  const [file, setFile] = useState<File | null>(null);
  const uploadRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const [manual, setManual] = useState("");
  const sel = skills.find((s) => s.id === skill);
  const manualOnly = !!sel && sel.sport !== "Basketball";
  const [askReview, setAskReview] = useState(true);

  const steps = ["Choose skill", "Assessment", "Video"];

  const submit = (video: File | null) => {
    if (!sel) return;
    setPendingVideo(video);
    navigate({ to: "/performance/analysis", search: { skill: sel.id } });
  };

  const manualMax = sel?.max ?? 100;
  const manualMin = sel?.min ?? 0;
  const manualValue = Number(manual);
  const manualOk = manual.trim() !== "" && Number.isFinite(manualValue) && manualValue >= manualMin && manualValue <= manualMax;
  const [saving, setSaving] = useState(false);
  const saveManual = async () => {
    if (!sel || !manualOk || saving) return;
    setSaving(true);
    try {
      const review = manualOnly && askReview;
      await sessionStore.add({ skill: sel.id, result: manualValue, consistency: null, source: "manual", ...(review ? { requestedReview: true } : {}) });
      toast.success(review ? "Sent for verification. It counts in rankings once a coach verifies it." : "Saved as Self-Reported. A coach can verify it later.");
      navigate({ to: "/performance" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save the session. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div className="flex items-center gap-3">
        {step > 1 ? (
          <button onClick={() => setStep((s) => (manualOnly && s === 3 ? 1 : ((s - 1) as 1 | 2)))} className="grid h-10 w-10 place-items-center rounded-xl border bg-card" aria-label="Back"><ArrowLeft className="h-5 w-5" /></button>
        ) : (
          <Link to="/dashboard" className="grid h-10 w-10 place-items-center rounded-xl border bg-card" aria-label="Back"><ArrowLeft className="h-5 w-5" /></Link>
        )}
        <ol className="flex flex-1 gap-2">
          {steps.map((label, i) => (
            <li key={label} className="flex-1">
              <div className={cn("h-1.5 rounded-full bg-muted", i < step && "bg-primary")} />
              <p className={cn("mt-1 text-xs text-muted-foreground", i + 1 === step && "font-semibold text-foreground")}>{label}</p>
            </li>
          ))}
        </ol>
      </div>

      {step === 1 && (
        <>
          <div>
            <h1 className="text-3xl font-bold sm:text-4xl">Choose What You Practiced</h1>
            <p className="mt-1 text-muted-foreground">Select a skill so Sportal can focus its analysis on the correct performance criteria.</p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {sportSkills.map((s) => (
              <button key={s.id} onClick={() => { setSkill(s.id); setStep(s.sport === "Basketball" ? 2 : 3); }}
                className={cn("surface flex flex-col items-start gap-3 p-5 text-left transition hover:-translate-y-0.5 hover:border-primary", skill === s.id && "border-primary ring-2 ring-primary/30")}>
                <span className="text-4xl" aria-hidden>{s.emoji}</span>
                <span className="font-display text-xl font-bold">{s.name}</span>
                {s.aiReady ? <Pill tone="success">AI-assisted</Pill> : s.sport === "Basketball" ? <Pill>Preview (mock)</Pill> : <Pill>Coach-verified</Pill>}
              </button>
            ))}
          </div>
          {sportSkills.length === 0 ? (
            <p className="text-sm text-muted-foreground">{profile.sport} doesn't have practice skills yet. Basketball, Volleyball and Track &amp; Field do.</p>
          ) : (
            <p className="text-xs text-muted-foreground">
              {sportSkills[0]?.sport === "Basketball" ? "AI-assisted analysis currently supports selected basketball skills only." : `${sportSkills[0]?.sport} results are entered by hand and count in rankings once a coach verifies them.`}
            </p>
          )}
        </>
      )}

      {step === 2 && sel && (
        <>
          <div>
            <p className="text-sm font-semibold text-primary">{sel.emoji} {sel.name}</p>
            <h1 className="text-3xl font-bold sm:text-4xl">Choose assessment</h1>
          </div>
          <button onClick={() => setStep(3)} className="surface flex items-center gap-4 p-5 text-left hover:border-primary">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-electric-gradient font-display text-xl font-bold text-primary-foreground">{sel.id === "shooting" ? "10" : "★"}</span>
            <div className="flex-1">
              <p className="font-display text-xl font-bold">{getAssessmentName(sel.id)}</p>
              <p className="text-sm text-muted-foreground">{sel.id === "shooting" ? "Take 10 shots from the free-throw line or mid-range spot. Sportal counts makes and misses." : "Standard drill used to measure this skill across sessions."}</p>
            </div>
            {sel.aiReady ? <Pill tone="success">Supported</Pill> : <Pill>Mock</Pill>}
          </button>
        </>
      )}

      {step === 3 && sel && manualOnly && (
        <>
          <div>
            <p className="text-sm font-semibold text-primary">{sel.emoji} {sel.name} · {sel.assessment}</p>
            <h1 className="text-3xl font-bold sm:text-4xl">Log your result</h1>
          </div>
          <Card title="How to run it">
            <p className="text-sm">{sel.howTo}</p>
            <p className="mt-3 flex items-start gap-2 text-xs text-muted-foreground"><Info className="mt-0.5 h-4 w-4 shrink-0" />{sel.sport} has no AI analysis yet. Your result is entered by hand, and it counts in rankings once a coach has verified it.</p>
          </Card>
          <Card title="Your result">
            <div className="flex flex-col gap-4">
              <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {sel.unit === "s" ? "Time (seconds)" : sel.unit === "cm" ? "Height (cm)" : "Result (%)"}
                <input type="number" inputMode="decimal" step="any" min={manualMin} max={manualMax} value={manual} onChange={(e) => setManual(e.target.value)}
                  className="h-11 rounded-xl border bg-card px-3 text-sm font-normal normal-case tracking-normal text-foreground outline-none focus:ring-2 focus:ring-ring" />
                <span className="text-xs font-normal normal-case tracking-normal">Between {manualMin} and {manualMax}{sel.unit === "%" ? "" : ` ${sel.unit}`}.</span>
              </label>
              <label className="flex items-center gap-2 text-sm font-medium">
                <input type="checkbox" checked={askReview} onChange={(e) => setAskReview(e.target.checked)} className="h-4 w-4 accent-[var(--primary)]" />
                Ask a coach to verify this result
              </label>
              <button disabled={!manualOk || saving} onClick={saveManual} className={btn.primary}>{askReview ? "Save and request verification" : "Save as Self-Reported"}</button>
              <p className="text-xs text-muted-foreground">Self-reported results are labelled as such and never count in rankings until a coach verifies them.</p>
            </div>
          </Card>
        </>
      )}

      {step === 3 && sel && !manualOnly && (
        <>
          <div>
            <p className="text-sm font-semibold text-primary">{sel.name} · {getAssessmentName(sel.id)}</p>
            <h1 className="text-3xl font-bold sm:text-4xl">Record your practice or upload a video.</h1>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <input ref={cameraRef} type="file" accept="video/*" capture="environment" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            <input ref={uploadRef} type="file" accept="video/mp4,video/quicktime,video/webm" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            <button onClick={() => cameraRef.current?.click()} className="flex min-h-36 flex-col items-center justify-center gap-3 rounded-2xl bg-hero p-6 text-navy-foreground">
              <Camera className="h-10 w-10" /><span className="font-display text-xl font-bold">Record Video</span>
            </button>
            <button onClick={() => uploadRef.current?.click()} className="flex min-h-36 flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-primary/40 bg-accent p-6 text-accent-foreground">
              <Upload className="h-10 w-10" /><span className="font-display text-xl font-bold">Upload Video</span>
            </button>
          </div>
          {file && (
            <div className="flex items-center gap-3 rounded-xl border border-success/40 bg-success/10 p-4">
              <CheckCircle2 className="h-5 w-5 text-success" />
              <p className="flex-1 truncate text-sm font-medium">{file.name}</p>
              <span className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(1)} MB</span>
            </div>
          )}
          <Card title="Instructions">
            <ul className="flex flex-col gap-2 text-sm">
              <li className="flex gap-2"><Video className="h-4 w-4 text-primary" />Place the camera to the side so both you and the hoop are visible.</li>
              <li className="flex gap-2"><Video className="h-4 w-4 text-primary" />Record all 10 attempts in one continuous clip.</li>
              <li className="flex gap-2"><Video className="h-4 w-4 text-primary" />Use good lighting and keep the phone steady.</li>
            </ul>
            <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground"><Info className="h-4 w-4" />Supported formats: MP4, MOV, WEBM · Max 200 MB · Up to 3 minutes</p>
          </Card>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button disabled={!file} onClick={() => submit(file)} className={cn(btn.primary, "flex-1 py-4")}>Submit for Analysis</button>
            <button onClick={() => submit(null)} className={btn.secondary}>Use sample video</button>
          </div>
          <Card title="No video? Log a result by hand">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <label className="flex flex-1 flex-col gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {sel.id === "vertical" ? "Jump height (cm)" : "Result (%)"}
                <input type="number" inputMode="decimal" min={0} max={manualMax} value={manual} onChange={(e) => setManual(e.target.value)}
                  className="h-11 rounded-xl border bg-card px-3 text-sm font-normal normal-case tracking-normal text-foreground outline-none focus:ring-2 focus:ring-ring" />
              </label>
              <button disabled={!manualOk || saving} onClick={saveManual} className={btn.secondary}>Save as Self-Reported</button>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">Self-reported results are labelled as such and are not verified.</p>
          </Card>
          <p className="text-xs text-muted-foreground">Submitted sessions are marked <b>AI-Assessed</b> until a coach verifies them. Prototype: results are simulated sample data; a real computer-vision service can be connected later.</p>
        </>
      )}
    </div>
  );
}

export default function NewPracticePage() {
  const sp = useSearch(parseNewSearch);
  return (
    <Page title="New Practice" backTo="/dashboard">
      <NewPractice key={sp.skill ?? "none"} />
    </Page>
  );
}
