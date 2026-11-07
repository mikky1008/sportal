import { Link } from "@/router-compat";
import { Page } from "@/components/Page";
import { Award, Ruler, School, Share2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { skills } from "@/lib/skills";
import { summarizeSkills } from "@/lib/performanceStats";
import { useAthleteProfile } from "@/lib/profileStore";
import { useMyHeadlineRank } from "@/lib/useRankings";
import { useSessions } from "@/lib/sessionStore";
import { summarizeTrust } from "@/lib/verification";
import { Card, Pill, ProgressBar, StatTile, btn } from "@/components/common";
import { HistoryList } from "@/components/performance";
import juan from "@/assets/juan.jpg";
import court from "@/assets/court.jpg";


function Profile() {
  const a = useAthleteProfile();
  const myRank = useMyHeadlineRank();
  const sessions = useSessions();
  const skillStats = summarizeSkills(sessions);
  const trust = summarizeTrust(sessions);
  return (
    <div className="flex flex-col gap-6">
      <section className="surface overflow-hidden p-0">
        <img src={court} alt="" className="h-32 w-full object-cover sm:h-44" width={1600} height={640} />
        <div className="flex flex-col gap-4 px-5 pb-6 sm:flex-row sm:items-end sm:px-8">
          <img src={juan} alt={`${a.firstName} ${a.lastName}`} className="-mt-14 h-28 w-28 rounded-3xl border-4 border-card object-cover sm:h-36 sm:w-36" width={816} height={816} />
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <h1 className="text-3xl font-bold sm:text-4xl">{a.firstName} {a.lastName}</h1>
              <Pill tone={a.teamStatus === "Not on a team" ? "default" : "primary"}>{a.teamStatus === "Not on a team" || !a.teamName ? a.teamStatus : `${a.teamStatus} · ${a.teamName}`}</Pill>
            </div>
            <p className="text-muted-foreground">{a.sport} • {a.position} · {a.year}</p>
            <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><School className="h-4 w-4" />{a.school}</span>
              <span className="flex items-center gap-1.5"><Ruler className="h-4 w-4" />{a.height} · {a.weight}</span>
            </div>
          </div>
          <button onClick={() => { navigator.clipboard?.writeText(window.location.href); toast.success("Profile link copied"); }} className={btn.primary}><Share2 className="h-4 w-4" />Share Showcase</button>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Basketball Rank" value={myRank ? `#${myRank}` : "Unranked"} />
        <StatTile label="Performance" value={a.performanceScore ? String(a.performanceScore) : "—"} />
        <StatTile label="Consistency" value={a.consistency ? `${a.consistency}%` : "—"} />
        <StatTile label="Coach-Verified" value={`${trust.verified}/${trust.total}`} hint={<span className="text-muted-foreground">sessions</span>} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card title="Athletic Bio"><p className="text-muted-foreground">{a.bio}</p></Card>
          <Card title="Details">
            <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
              {[
                ["Team status", a.teamStatus],
                ["Team", a.teamStatus === "Not on a team" ? "—" : a.teamName || "—"],
                ["School", a.school],
                ["Year level", a.year || "—"],
                ["Sport · Position", `${a.sport}${a.position ? ` · ${a.position}` : ""}`],
                ["Height · Weight", `${a.height} · ${a.weight}`],
              ].map(([k, v]) => (
                <div key={k}><dt className="text-xs text-muted-foreground">{k}</dt><dd className="font-semibold">{v}</dd></div>
              ))}
            </dl>
          </Card>
          <Card title="Skills">
            <ul className="grid gap-4 sm:grid-cols-2">
              {skills.map((s) => (
                <li key={s.id}>
                  <div className="mb-1 flex justify-between text-sm"><span className="font-semibold">{s.emoji} {s.name}</span><span className="font-display font-bold">{skillStats[s.id]?.primaryValue ?? "—"}</span></div>
                  <ProgressBar value={skillStats[s.id]?.consistency ?? 0} />
                </li>
              ))}
            </ul>
          </Card>
          <Card title="Session Results" action={<Link to="/performance" className="text-sm font-semibold text-primary">All history</Link>}>
            <p className="mb-3 text-sm text-muted-foreground">
              {trust.counts["Coach-Verified"]} coach-verified · {trust.counts["AI-Assessed"]} AI-assessed · {trust.counts["Pending Review"]} pending review · {trust.counts["Self-Reported"]} self-reported
            </p>
            <HistoryList items={sessions.slice(0, 4)} />
            <p className="mt-3 text-xs text-muted-foreground">AI-assessed does not automatically mean verified — results are coach-verified only after a coach reviews them.</p>
          </Card>
        </div>
        <div className="flex flex-col gap-6">
          <Card title="Achievements">
            <ul className="flex flex-col gap-3">
              {a.achievements.length === 0 && <li className="text-sm text-muted-foreground">No achievements listed yet.</li>}
              {a.achievements.map((x, i) => (
                <li key={`${i}-${x.title}`} className="flex gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gold/20"><Award className="h-5 w-5" /></span>
                  <div><p className="text-sm font-semibold">{x.title}</p><p className="text-xs text-muted-foreground">{x.year}</p></div>
                </li>
              ))}
            </ul>
          </Card>
          <div className="rounded-2xl bg-hero p-6 text-navy-foreground">
            <Sparkles className="h-5 w-5 text-gold" />
            <p className="mt-2 font-display text-xl font-bold">Coach view ready</p>
            <p className="mt-1 text-sm text-navy-muted">This showcase is what universities and coaches see when they discover you.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Page title="My Profile">
      <Profile />
    </Page>
  );
}
