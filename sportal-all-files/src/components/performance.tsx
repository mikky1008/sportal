import { useMemo, useState } from "react";
import { Link } from "@/router-compat";
import { Area, ComposedChart, CartesianGrid, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Sparkles, ThumbsUp, Target, Dumbbell, ShieldCheck, Hourglass, PenLine, TriangleAlert } from "lucide-react";
import { buildTrend, type TrendRange } from "@/lib/performanceStats";
import { sessionStatusMeta, TRUST_NOTE } from "@/lib/verification";
import type { AIAnalysisResult, PerformanceSession, SessionStatus, Skill } from "@/types";
import { Card, Delta, Pill, ProgressBar } from "./common";
import { cn } from "@/lib/utils";

const ranges: { id: TrendRange; label: string }[] = [
  { id: "last5", label: "Last 5" },
  { id: "last10", label: "Last 10" },
  { id: "month", label: "This Month" },
  { id: "season", label: "This Season" },
];

export function PerformanceChart({ sessions }: { sessions: PerformanceSession[] }) {
  const [range, setRange] = useState<TrendRange>("last5");
  const data = useMemo(() => buildTrend(sessions, range), [sessions, range]);
  const first = data[0]?.score ?? 0, last = data[data.length - 1]?.score ?? 0;
  return (
    <Card>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold">Performance Trend</h2>
          <p className="text-sm text-muted-foreground">Score vs. consistency · <Delta value={last - first} suffix=" pts" /></p>
        </div>
        <div role="tablist" className="flex gap-1 overflow-x-auto rounded-xl bg-muted p-1">
          {ranges.map((r) => (
            <button key={r.id} role="tab" aria-selected={range === r.id} onClick={() => setRange(r.id)}
              className={cn("whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold text-muted-foreground transition", range === r.id && "bg-card text-foreground shadow-card")}>
              {r.label}
            </button>
          ))}
        </div>
      </div>
      <div className="h-64 w-full">
        <ResponsiveContainer>
          <ComposedChart data={data} margin={{ left: -20, right: 8, top: 8 }}>
            <defs>
              <linearGradient id="g1" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--border)" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
            <YAxis domain={[40, 100]} tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)" }} />
            <Area type="monotone" dataKey="score" name="Score" stroke="var(--chart-1)" strokeWidth={3} fill="url(#g1)" />
            <Line type="monotone" dataKey="consistency" name="Consistency" stroke="var(--chart-2)" strokeWidth={2} strokeDasharray="5 4" dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5"><span className="h-2 w-4 rounded bg-chart-1" />Performance score</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-4 rounded bg-chart-2" />Consistency</span>
      </div>
    </Card>
  );
}

export function SkillCard({ skill }: { skill: Skill }) {
  return (
    <Link to="/performance/new" search={{ skill: skill.id }}
      className="group surface flex flex-col gap-3 p-4 transition hover:-translate-y-0.5 hover:border-primary/50">
      <div className="flex items-start justify-between">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-accent text-xl" aria-hidden>{skill.emoji}</span>
        <Delta value={skill.improvement} />
      </div>
      <div>
        <p className="font-semibold">{skill.name}</p>
        <p className="font-display text-2xl font-bold">{skill.primaryValue} <span className="text-sm font-medium text-muted-foreground">{skill.primaryLabel}</span></p>
      </div>
      <div>
        <div className="mb-1 flex justify-between text-xs text-muted-foreground"><span>Consistency</span><span>{skill.consistency}%</span></div>
        <ProgressBar value={skill.consistency} />
      </div>
    </Link>
  );
}

const skillName = (id: string) => ({ shooting: "Shooting", dribbling: "Dribbling", passing: "Passing", layups: "Layups", agility: "Agility", vertical: "Vertical Jump" } as Record<string, string>)[id];

const pct = (v: number | null) => (v === null ? "—" : `${v}%`);

function StatusPills({ s }: { s: PerformanceSession }) {
  const m = sessionStatusMeta[s.status];
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <Pill tone={m.tone} title={m.description}>{s.status}</Pill>
      {s.simulated && <Pill tone="gold" title="Generated by the prototype's simulated AI, not a real analysis.">Simulated</Pill>}
    </span>
  );
}

export function HistoryList({ items }: { items: PerformanceSession[] }) {
  const meta = (s: PerformanceSession["status"]) => sessionStatusMeta[s];
  return (
    <>
      <div className="hidden overflow-hidden rounded-xl border md:block">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>{["Date", "Skill", "Result", "Consistency", "Status"].map((h) => <th key={h} className="px-4 py-3 font-semibold">{h}</th>)}</tr>
          </thead>
          <tbody>
            {items.map((s) => (
              <tr key={s.id} className="border-t bg-card">
                <td className="px-4 py-3 font-medium">{s.date}</td>
                <td className="px-4 py-3">{skillName(s.skill)}</td>
                <td className="px-4 py-3 font-display text-lg font-bold">{s.skill === "vertical" ? `${s.result} cm` : `${s.result}%`}</td>
                <td className="px-4 py-3">{pct(s.consistency)}</td>
                <td className="px-4 py-3"><StatusPills s={s} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="flex flex-col gap-3 md:hidden">
        {items.map((s) => (
          <li key={s.id} className="flex items-center justify-between rounded-xl border bg-card p-4">
            <div>
              <p className="font-semibold">{skillName(s.skill)}</p>
              <p className="text-xs text-muted-foreground">{s.date} · Consistency {pct(s.consistency)}{meta(s.status).verified && s.verifiedBy ? ` · Verified by ${s.verifiedBy}` : ""}</p>
              <div className="mt-2"><StatusPills s={s} /></div>
            </div>
            <p className="font-display text-3xl font-bold">{s.skill === "vertical" ? `${s.result}cm` : `${s.result}%`}</p>
          </li>
        ))}
      </ul>
    </>
  );
}

export function ConsistencyTracker({ history, overall, improvement }: { history: { label: string; value: number }[]; overall: number; improvement: number }) {
  return (
    <Card title="Consistency Tracking">
      <p className="-mt-2 mb-4 text-sm text-muted-foreground">Sportal looks at performance across multiple sessions — not just one result.</p>
      <ul className="flex flex-col gap-3">
        {history.map((h) => (
          <li key={h.label} className="grid grid-cols-[90px_1fr_44px] items-center gap-3 text-sm">
            <span className="text-muted-foreground">{h.label}</span>
            <ProgressBar value={h.value} />
            <span className="text-right font-semibold">{h.value}%</span>
          </li>
        ))}
      </ul>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-accent p-3"><p className="text-xs text-accent-foreground">Overall Consistency</p><p className="font-display text-2xl font-bold">{overall}%</p></div>
        <div className="rounded-xl bg-success/10 p-3"><p className="text-xs text-success">Improvement</p><p className="font-display text-2xl font-bold text-success">+{improvement}%</p></div>
      </div>
    </Card>
  );
}

export function FeedbackCard({ feedback }: { feedback: AIAnalysisResult["feedback"] }) {
  const rows = [
    { icon: ThumbsUp, label: "What's going well", text: feedback.positive, tone: "text-success bg-success/10" },
    { icon: Target, label: "Area to improve", text: feedback.improvement, tone: "text-foreground bg-gold/20" },
    { icon: Dumbbell, label: "Suggested practice", text: feedback.suggestion, tone: "text-primary bg-accent" },
  ];
  return (
    <Card title="AI Feedback" action={<Sparkles className="h-5 w-5 text-primary" />}>
      <ul className="flex flex-col gap-4">
        {rows.map(({ icon: Icon, label, text, tone }) => (
          <li key={label} className="flex gap-3">
            <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-lg", tone)}><Icon className="h-4 w-4" /></span>
            <div><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p><p className="text-sm">{text}</p></div>
          </li>
        ))}
      </ul>
    </Card>
  );
}

const statusIcons: Record<SessionStatus, typeof ShieldCheck> = {
  "Coach-Verified": ShieldCheck,
  "AI-Assessed": Sparkles,
  "Pending Review": Hourglass,
  "Self-Reported": PenLine,
};

const statusIconTone: Record<string, string> = {
  success: "bg-success/15 text-success",
  primary: "bg-accent text-primary",
  warning: "bg-warning/20 text-foreground",
  default: "bg-muted text-muted-foreground",
  gold: "bg-gold/20 text-foreground",
};

export function TrustLegend() {
  return (
    <Card title="How results are trusted">
      <ul className="flex flex-col gap-3">
        {(Object.keys(sessionStatusMeta) as SessionStatus[]).map((s) => {
          const m = sessionStatusMeta[s];
          const Icon = statusIcons[s];
          return (
            <li key={s} className="flex gap-3">
              <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-lg", statusIconTone[m.tone])}><Icon className="h-4 w-4" /></span>
              <div>
                <p className="flex items-center gap-2 text-sm font-semibold">{m.label} {!m.verified && <Pill tone={m.tone}>Not verified</Pill>}</p>
                <p className="text-sm text-muted-foreground">{m.description}</p>
              </div>
            </li>
          );
        })}
      </ul>
      <p className="mt-4 flex gap-2 rounded-xl bg-gold/10 p-3 text-xs text-foreground">
        <TriangleAlert className="h-4 w-4 shrink-0 text-foreground" />
        <span><b>Important:</b> {TRUST_NOTE}</span>
      </p>
    </Card>
  );
}
