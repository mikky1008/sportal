import { Link } from "@/router-compat";
import { Page } from "@/components/Page";
import { Plus, Trophy, Gauge, Repeat, CalendarCheck } from "lucide-react";
import { isPercentSkill, skillsForSport } from "@/lib/skills";
import { summarizeSkills } from "@/lib/performanceStats";
import { useAthleteProfile } from "@/lib/profileStore";
import { useMyHeadlineRank } from "@/lib/useRankings";
import { useSessions } from "@/lib/sessionStore";
import { useProfileExtras, isMediaUsable } from "@/lib/profileExtrasStore";
import { StatTile, Delta, btn } from "@/components/common";
import { PerformanceChart, SkillCard } from "@/components/performance";
import { AthleteCompletionCard } from "@/components/profile-completion-cards";
import type { PerformanceSession, Skill } from "@/types";
import juan from "@/assets/juan.jpg";
import court from "@/assets/court.jpg";

const avg = (xs: number[]): number => Math.round(xs.reduce((a, b) => a + b, 0) / xs.length);

/**
 * The four numbers under the hero, worked out from the athlete's own sessions: the average of the
 * last five sessions, and how that moved from the five before. Vertical jump is in centimetres, so
 * heights and times are left out of these percentages. With no sessions every value is null and the tiles show "—".
 */
function recentOverview(sessions: PerformanceSession[]) {
  const list = sessions
    .filter((s) => isPercentSkill(s.skill))
    .sort((a, b) => ((b.isoDate ?? "") < (a.isoDate ?? "") ? -1 : (b.isoDate ?? "") > (a.isoDate ?? "") ? 1 : 0));
  const last = list.slice(0, 5);
  const before = list.slice(5, 10);
  const cons = (xs: PerformanceSession[]) => xs.map((s) => s.consistency).filter((c): c is number => c !== null);
  const accuracy = last.length ? avg(last.map((s) => s.result)) : null;
  const consistency = cons(last).length ? avg(cons(last)) : null;
  const prevAccuracy = before.length ? avg(before.map((s) => s.result)) : null;
  const prevConsistency = cons(before).length ? avg(cons(before)) : null;
  return {
    accuracy,
    consistency,
    accuracyDelta: accuracy !== null && prevAccuracy !== null ? accuracy - prevAccuracy : null,
    consistencyDelta: consistency !== null && prevConsistency !== null ? consistency - prevConsistency : null,
  };
}

function Dashboard() {
  const a = useAthleteProfile();
  const sessions = useSessions();
  const extras = useProfileExtras();
  const myRank = useMyHeadlineRank();
  const overview = recentOverview(sessions);
  const stats = summarizeSkills(sessions);
  const skillCards: Skill[] = skillsForSport(a.sport).map((s) => ({
    ...s,
    primaryValue: stats[s.id]?.primaryValue ?? "—",
    consistency: stats[s.id]?.consistency ?? 0,
    improvement: stats[s.id]?.improvement ?? 0,
  }));
  const photo = isMediaUsable("photo", extras.photo) ? extras.photo!.value : juan;
  const none = <span className="text-muted-foreground">no earlier sessions to compare</span>;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold sm:text-4xl">Good morning, {a.firstName}!</h1>
        <p className="text-muted-foreground">Keep pushing. Every practice gets you closer to your goals.</p>
      </div>

      <section className="relative overflow-hidden rounded-3xl bg-hero text-navy-foreground shadow-card">
        <img src={court} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30" width={1600} height={640} />
        <div className="relative flex flex-col gap-6 p-5 sm:p-8 lg:flex-row lg:items-center">
          <div className="flex items-center gap-4">
            <img src={photo} alt={`${a.firstName} ${a.lastName}`} className="h-20 w-20 rounded-2xl object-cover ring-2 ring-electric sm:h-24 sm:w-24" width={816} height={816} />
            <div>
              <h2 className="text-2xl font-bold sm:text-3xl">{a.firstName} {a.lastName}</h2>
              <p className="text-navy-muted">{[a.sport, a.position].filter(Boolean).join(" • ")}</p>
              <p className="text-sm text-navy-muted">{a.school}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 lg:ml-auto">
            {[
              { label: "Basketball Rank", value: myRank ? `#${myRank}` : "Unranked", icon: Trophy },
              { label: "Performance", value: a.performanceScore ? a.performanceScore.toString() : "—", icon: Gauge },
              { label: "Consistency", value: a.consistency ? `${a.consistency}%` : "—", icon: Repeat },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="rounded-2xl bg-navy-foreground/10 p-3 backdrop-blur sm:p-4">
                <Icon className="h-4 w-4 text-gold" />
                <p className="mt-1 font-display text-2xl font-bold sm:text-3xl">{value}</p>
                <p className="text-[11px] text-navy-muted sm:text-xs">{label}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="relative flex flex-col gap-3 border-t border-navy-foreground/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p className="text-sm text-navy-muted">Rankings are sport-specific — you're compared only with basketball players.</p>
          <Link to="/performance/new" className={btn.primary}><Plus className="h-4 w-4" />Start New Practice</Link>
        </div>
      </section>

      <AthleteCompletionCard />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Accuracy" value={overview.accuracy === null ? "—" : `${overview.accuracy}%`} hint={overview.accuracyDelta === null ? none : <Delta value={overview.accuracyDelta} />} />
        <StatTile label="Consistency" value={overview.consistency === null ? "—" : `${overview.consistency}%`} hint={overview.consistencyDelta === null ? none : <Delta value={overview.consistencyDelta} />} />
        <StatTile label="Improvement" value={overview.accuracyDelta === null ? "—" : `${overview.accuracyDelta >= 0 ? "+" : ""}${overview.accuracyDelta}%`} hint={<span className="text-muted-foreground">last 5 sessions</span>} />
        <StatTile label="Sessions" value={String(sessions.length)} icon={<CalendarCheck className="h-4 w-4" />} hint={<span className="text-muted-foreground">logged so far</span>} />
      </div>

      <PerformanceChart sessions={sessions} />

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Your Skills</h2>
          <Link to="/performance" className="text-sm font-semibold text-primary">View history</Link>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {skillCards.map((s) => <SkillCard key={s.id} skill={s} />)}
        </div>
      </section>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Page title="Dashboard">
      <Dashboard />
    </Page>
  );
}
