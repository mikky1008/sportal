import { Link, useNavigate, useSearch } from "@/router-compat";
import { Page } from "@/components/Page";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Sparkles, CheckCircle2, ShieldAlert, TriangleAlert } from "lucide-react";
import { analyzeSkill, getPendingVideo } from "@/services/aiService";
import { buildAnalysis } from "@/lib/feedback";
import { sessionStore, useSessions } from "@/lib/sessionStore";
import { skills } from "@/lib/skills";
import { sessionStatusMeta, statusForNewSession, TRUST_NOTE } from "@/lib/verification";
import type { AIMeasurement, SkillId } from "@/types";
import { Card, Pill, StatTile, btn } from "@/components/common";
import { ConsistencyTracker, FeedbackCard } from "@/components/performance";

const ids = skills.map((s) => s.id) as SkillId[];
const parseAnalysisSearch = (s: Record<string, unknown>): { skill: SkillId } => ({
  skill: ids.includes(s["skill"] as SkillId) ? (s["skill"] as SkillId) : "shooting",
});


function Analysis() {
  const { skill } = useSearch(parseAnalysisSearch);
  const saved = useSessions();
  const navigate = useNavigate();
  const [measurement, setMeasurement] = useState<AIMeasurement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [wantsReview, setWantsReview] = useState(false);
  const [saving, setSaving] = useState(false);
  const name = skills.find((s) => s.id === skill)?.name;

  useEffect(() => {
    let live = true;
    setMeasurement(null);
    setError(null);
    analyzeSkill(skill, getPendingVideo())
      .then((m) => live && setMeasurement(m))
      .catch((e: unknown) => live && setError(e instanceof Error ? e.message : "Analysis failed."));
    return () => { live = false; };
  }, [skill, attempt]);

  if (error) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 text-center">
        <TriangleAlert className="h-12 w-12 text-destructive" />
        <h1 className="text-2xl font-bold">We couldn't analyze that video</h1>
        <p className="text-sm text-muted-foreground">{error}</p>
        <div className="flex gap-3">
          <button className={btn.primary} onClick={() => setAttempt((n) => n + 1)}>Try again</button>
          <Link to="/performance/new" className={btn.secondary}>Pick another video</Link>
        </div>
      </div>
    );
  }

  if (!measurement) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <h1 className="text-2xl font-bold">Analyzing your {name?.toLowerCase()} session…</h1>
        <p className="max-w-sm text-sm text-muted-foreground">Checking attempts against predefined {name?.toLowerCase()} performance criteria.</p>
      </div>
    );
  }

  const result = buildAnalysis(measurement, saved);
  const status = statusForNewSession({ source: "ai", needsReview: result.needsReview, requestedReview: wantsReview });

  const save = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await sessionStore.add({
        skill: result.skill,
        result: result.accuracy,
        consistency: result.consistency,
        source: "ai",
        needsReview: result.needsReview,
        requestedReview: wantsReview,
        ...(result.isMock ? { simulated: true } : {}),
      });
      navigate({ to: "/performance" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save the session. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-start gap-2">
        <div className="flex flex-wrap gap-2">
          <Pill tone="success"><CheckCircle2 className="mr-1 h-3.5 w-3.5" />AI Analysis Complete</Pill>
          <Pill tone={sessionStatusMeta[status].tone} title={sessionStatusMeta[status].description}>Status: {status} · Not yet verified</Pill>
          {result.isMock && <Pill tone="gold" title="This prototype shows fixed sample numbers, not a real analysis of your video.">Simulated</Pill>}
        </div>
        <h1 className="text-3xl font-bold sm:text-4xl">AI-Assisted Performance Analysis</h1>
        <p className="text-muted-foreground">Skill: <b className="text-foreground">{name}</b> · {result.assessment}</p>
      </div>

      {result.needsReview && (
        <div role="alert" className="flex gap-3 rounded-xl border border-warning/50 bg-warning/15 p-4 text-sm">
          <TriangleAlert className="h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">This result needs a coach's review before anyone relies on it.</p>
            <ul className="mt-1 list-disc pl-5 text-muted-foreground">{result.reviewReasons.map((r) => <li key={r}>{r}</li>)}</ul>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <StatTile label="Attempts" value={String(result.attempts)} />
        <StatTile label="Made" value={String(result.made)} />
        <StatTile label="Missed" value={String(result.missed)} />
        <StatTile label="Accuracy" value={`${result.accuracy}%`} />
        <StatTile label="Consistency" value={`${result.consistency}%`} />
        <StatTile label="Trend" value={result.trend} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ConsistencyTracker history={result.sessionHistory} overall={result.consistency} improvement={result.improvement} />
        <FeedbackCard feedback={result.feedback} />
      </div>

      <Card>
        <div className="flex gap-3">
          <Sparkles className="h-5 w-5 shrink-0 text-primary" />
          <p className="text-sm text-muted-foreground">
            Sportal's AI analyzes the selected skill based on predefined performance criteria. Results support — not replace — coach evaluation.
            {!result.isMock && ` Model confidence: ${Math.round(result.confidence * 100)}%.`}
            {result.isMock && " This prototype displays simulated sample results."}
          </p>
        </div>
      </Card>

      <Card>
        <div className="flex gap-3">
          <ShieldAlert className="h-5 w-5 shrink-0 text-foreground" />
          <p className="text-sm text-foreground">
            <b>Important:</b> {TRUST_NOTE}
          </p>
        </div>
      </Card>

      {!result.needsReview && (
        <label className="flex items-start gap-3 text-sm">
          <input type="checkbox" className="mt-1 h-4 w-4" checked={wantsReview} onChange={(e) => setWantsReview(e.target.checked)} />
          <span>Ask a coach to review this result. It stays <b>Pending Review</b> until they confirm it.</span>
        </label>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <button onClick={save} disabled={saving} className={btn.primary}>{saving ? "Saving…" : "Save to History"}</button>
        <Link to="/rankings" className={btn.secondary}>View Basketball Rankings</Link>
        <Link to="/performance/new" className={btn.secondary}>Practice Again</Link>
      </div>
    </div>
  );
}

export default function AnalysisPage() {
  return (
    <Page title="Analysis" backTo="/performance">
      <Analysis />
    </Page>
  );
}
