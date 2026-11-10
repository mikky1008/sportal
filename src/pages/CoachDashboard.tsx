import {
  BadgeCheck, Clock, Handshake, Inbox, MessageSquare,
  Send, ShieldX, Star, UserCheck, UserPlus, Users, type LucideIcon,
} from "lucide-react";
import { CoachLayout } from "@/layouts/CoachLayout";
import { useCoachProfile, type CoachVerificationStatus } from "@/lib/coachProfileStore";
import { Card, Delta, EmptyState, Pill, ProgressBar, SectionLink, StatTile, btn } from "@/components/common";
import { useAuth } from "@/auth/AuthContext";
import { useNavigate } from "@/router-compat";
import { useCoachConnections, type CoachConnections } from "@/lib/useCoachConnections";
import { useCoachDashboard, type CoachDashboardData, type DashboardPerson } from "@/lib/coachApi";
import { formatDistanceToNow } from "date-fns";
import { AthleteSearchCard, ConnectionRequestsCard, MyAthletesCard } from "@/components/coach-connections";
import { PersonAvatar } from "@/components/avatar";
import { CoachHeroCard } from "@/components/coach-hero-card";
import { CoachCompletionBanner } from "@/components/profile-completion-cards";
import { cn } from "@/lib/utils";

/* ---------------------------------------------------------------------------------------------
   COACH DASHBOARD

   Live data: the coach's name, university, sport, position and verification badge come from the
   coach profile store. Roster, pending and sent-request counts, the incoming/outgoing request
   lists, My Athletes and athlete search come from the connections API (useCoachConnections).
   Everything else (pending actions, Recruitment Overview, Team Performance Snapshot) comes from
   GET /api/coach/dashboard (useCoachDashboard).
--------------------------------------------------------------------------------------------- */

/* ---- helpers ---- */

const personName = (a: DashboardPerson) => `${a.firstName} ${a.lastName}`.trim() || a.displayName;
const ago = (iso: string) => formatDistanceToNow(new Date(iso), { addSuffix: true });
type Dash = ReturnType<typeof useCoachDashboard>;

/** Placeholder / error body for the dashboard cards that load from /api/coach/dashboard. */
function DashState({ dash, rows = 3 }: { dash: Dash; rows?: number }) {
  if (dash.state === "error")
    return (
      <div role="alert" className="flex flex-col items-center gap-3 rounded-2xl border border-dashed px-4 py-8 text-center">
        <p className="text-sm text-muted-foreground">{dash.error ?? "Couldn't load this section."}</p>
        <button type="button" onClick={dash.reload} className={cn(btn.secondary, btn.sm)}>Try again</button>
      </div>
    );
  return (
    <div role="status" aria-label="Loading" className="flex flex-col gap-3">
      {Array.from({ length: rows }, (_, i) => <div key={i} className="h-12 animate-pulse rounded-2xl bg-muted" />)}
    </div>
  );
}

const verification: Record<CoachVerificationStatus, { label: string; tone: "success" | "warning" | "default"; icon: LucideIcon }> = {
  Verified: { label: "Verified", tone: "success", icon: BadgeCheck },
  Pending: { label: "Verification pending", tone: "warning", icon: Clock },
  Rejected: { label: "Verification rejected", tone: "default", icon: ShieldX },
};

/* ---- sections ---- */

const counts = (conn: CoachConnections) =>
  conn.state === "ready"
    ? { roster: conn.accepted.total, pending: conn.incoming.total, sent: conn.outgoing.total }
    : { roster: null, pending: null, sent: null };

function ProfileOverview({ conn }: { conn: CoachConnections }) {
  const { profile, verificationStatus } = useCoachProfile();
  const name = `${profile.firstName} ${profile.lastName}`.trim() || "Coach";
  const v = verification[verificationStatus];
  const c = counts(conn);
  const navigate = useNavigate();

  return (
    <CoachHeroCard
      coachName={name}
      coachingPosition={profile.positionTitle}
      assignedSport={profile.primarySport}
      schoolName={profile.organizationName}
      totalRosterCount={c.roster}
      pendingRequestsCount={c.pending}
      sentRequestsCount={c.sent}
      footerNote="Roster and request counts come from your connections and update as you respond."
      badge={
        <span className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-white",
          verificationStatus === "Verified" ? "bg-success/20" : verificationStatus === "Pending" ? "bg-warning/25" : "bg-white/15",
        )}>
          <v.icon className="h-3.5 w-3.5" /> {v.label}
        </span>
      }
      onCreateTrainingPlan={() => navigate({ to: "/coach/training-plans/new" })}
    />
  );
}

function SummaryStats({ conn }: { conn: CoachConnections }) {
  const c = counts(conn);
  const show = (n: number | null) => (n === null ? "—" : String(n));
  return (
    <section aria-label="Team and request summary">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatTile label="Total Athletes" value={show(c.roster)} icon={<Users />} hint={<span className="text-muted-foreground">Connected to you</span>} />
        <StatTile label="Pending Requests" value={show(c.pending)} icon={<UserCheck />} hint={<span className="text-muted-foreground">Athlete requests to review</span>} />
        <StatTile label="Sent Requests" value={show(c.sent)} icon={<Send />} hint={<span className="text-muted-foreground">Waiting for an athlete to answer</span>} />
      </div>
    </section>
  );
}

function PendingActions({ conn, dash }: { conn: CoachConnections; dash: Dash }) {
  const live = conn.state === "ready" ? conn.incoming.total : null;
  const p = dash.data?.pendingActions;
  const total = (live ?? 0) + (p ? p.unansweredInquiries + p.unreadMessages + p.newApplications : 0);
  const navigate = useNavigate();
  const goToRequests = () => document.getElementById("connection-requests")?.scrollIntoView({ behavior: "smooth", block: "start" });
  const row = "flex w-full items-center gap-3 rounded-2xl border bg-card p-3 text-left transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
  const iconBox = "grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground";
  const badge = "grid h-7 min-w-7 place-items-center rounded-full bg-primary px-2 text-xs font-bold text-primary-foreground";
  const others: { label: string; detail: string; count: number | null; icon: LucideIcon; to: string }[] = [
    { label: "Unanswered recruitment inquiries", detail: "Waiting for your reply", count: p?.unansweredInquiries ?? null, icon: Inbox, to: "/recruiting?tab=messages" },
    { label: "Unread messages", detail: "From athletes and recruiters", count: p?.unreadMessages ?? null, icon: MessageSquare, to: "/recruiting?tab=messages" },
    { label: "New athlete applications", detail: "Athletes showing interest in your program", count: p?.newApplications ?? null, icon: UserPlus, to: "/coach/applications" },
  ];

  return (
    <Card title="Pending Actions" action={total > 0 ? <Pill tone="warning">{total} need attention</Pill> : undefined}>
      <ul className="flex flex-col gap-2">
        <li>
          <button type="button" onClick={goToRequests} className={row}>
            <span className={iconBox}><UserCheck className="h-5 w-5" /></span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold">New connection requests</span>
              <span className="block truncate text-xs text-muted-foreground">
                {conn.state === "error" ? "Couldn't load, open to retry" : "Athletes asking to connect with you"}
              </span>
            </span>
            <span className={badge}>{live === null ? "—" : live}</span>
          </button>
        </li>
        {others.map(({ label, detail, count, icon: Icon, to }) => (
          <li key={label}>
            <button type="button" onClick={() => (dash.state === "error" ? dash.reload() : navigate({ to }))} className={row}>
              <span className={iconBox}><Icon className="h-5 w-5" /></span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{label}</span>
                <span className="block truncate text-xs text-muted-foreground">{dash.state === "error" ? "Couldn't load, tap to retry" : detail}</span>
              </span>
              <span className={badge}>{count === null ? "—" : count}</span>
            </button>
          </li>
        ))}
      </ul>
    </Card>
  );
}

const inquiryTones = { awaiting: "warning", replied: "primary", accepted: "success", declined: "default" } as const;
const inquiryLabels = { awaiting: "Awaiting response", replied: "Replied", accepted: "Accepted", declined: "Declined" } as const;

function RecruitmentBody({ data }: { data: CoachDashboardData["recruitment"] }) {
  const { shortlist, conversations, inquiryStatuses } = data;
  const keys = ["awaiting", "replied", "accepted", "declined"] as const;
  const total = keys.reduce((n, k) => n + inquiryStatuses[k], 0);
  const sub = "text-xs font-semibold uppercase tracking-wider text-muted-foreground";

  return (
    <div className="grid grid-cols-1 gap-6">
      <div>
        <h3 className={cn(sub, "mb-2 flex items-center gap-1.5")}><Star className="h-3.5 w-3.5" /> Shortlisted athletes</h3>
        {shortlist.length === 0 ? <EmptyState message="No shortlisted athletes yet." /> : (
          <ul className="flex flex-wrap gap-2">
            {shortlist.map((a) => (
              <li key={a.id} className="flex items-center gap-2 rounded-full border bg-card py-1 pl-1 pr-3">
                <PersonAvatar name={personName(a)} {...(a.photo ? { src: a.photo } : {})} size="sm" className="ring-2 ring-accent" />
                <span className="text-sm font-medium">{personName(a)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h3 className={cn(sub, "mb-2 flex items-center gap-1.5")}><MessageSquare className="h-3.5 w-3.5" /> Ongoing conversations</h3>
        {conversations.length === 0 ? <EmptyState message="No ongoing conversations." /> : (
          <ul className="divide-y">
            {conversations.map(({ athlete, last, at }) => (
              <li key={athlete.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                <PersonAvatar name={personName(athlete)} {...(athlete.photo ? { src: athlete.photo } : {})} size="sm" className="ring-2 ring-accent" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{personName(athlete)}</p>
                  <p className="truncate text-sm text-muted-foreground">{last}</p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">{ago(at)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h3 className={cn(sub, "mb-2 flex items-center gap-1.5")}><Handshake className="h-3.5 w-3.5" /> Inquiry status ({total})</h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {keys.map((k) => (
            <div key={k} className="rounded-2xl border bg-card p-3">
              <p className="font-display text-2xl font-bold text-primary">{inquiryStatuses[k]}</p>
              <div className="mt-1"><Pill tone={inquiryTones[k]}>{inquiryLabels[k]}</Pill></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RecruitmentOverview({ dash }: { dash: Dash }) {
  const navigate = useNavigate();
  return (
    <Card title="Recruitment Overview" action={<SectionLink label="Open" onClick={() => navigate({ to: "/recruiting?tab=messages" })} />}>
      {dash.data ? <RecruitmentBody data={dash.data.recruitment} /> : <DashState dash={dash} />}
    </Card>
  );
}

function PerformanceSnapshot({ dash }: { dash: Dash }) {
  const perf = dash.data?.performance;
  const pct = perf && perf.athletesTotal ? Math.round((perf.athletesUpdated / perf.athletesTotal) * 100) : 0;
  return (
    <Card title="Team Performance Snapshot">
      {!perf ? <DashState dash={dash} /> : perf.athletesUpdated === 0 ? (
        <EmptyState message="No performance records shared yet. Trends will appear once athletes share their records." />
      ) : (
        <div className="grid grid-cols-1 gap-6">
          <div>
            <div className="mb-2 flex items-baseline justify-between gap-3">
              <p className="text-sm text-muted-foreground">Athletes with updated records</p>
              <p className="font-display text-xl font-bold text-primary">{perf.athletesUpdated}<span className="text-sm font-medium text-muted-foreground"> / {perf.athletesTotal}</span></p>
            </div>
            <ProgressBar value={pct} />
            <p className="mt-1.5 text-xs text-muted-foreground">{pct}% of your team has shared records in the last 30 days.</p>
          </div>

          {perf.skills.length > 0 && (
            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Recent progress by skill</h3>
              <ul className="flex flex-col gap-3">
                {perf.skills.map((s) => (
                  <li key={s.name}>
                    <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                      <span className="font-medium">{s.name}</span>
                      <span className="flex items-center gap-2">
                        <span className="text-muted-foreground">{s.avg}% avg</span>
                        <Delta value={s.change} />
                      </span>
                    </div>
                    <ProgressBar value={s.avg} />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

/* ---- page ---- */

function CoachDashboard() {
  const conn = useCoachConnections();
  const dash = useCoachDashboard();
  const { user } = useAuth();
  const { verificationStatus } = useCoachProfile();
  // The API only lets a verified coach send or accept requests. The session carries the permission,
  // and the profile store learns about an approval as soon as it loads, so either one is enough.
  const canAct = verificationStatus === "Verified" || !!user?.permissions.includes("sessions:verify");

  return (
    <div className="flex flex-col gap-6">
      <ProfileOverview conn={conn} />
      <CoachCompletionBanner />
      <SummaryStats conn={conn} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <MyAthletesCard conn={conn} />
        <PendingActions conn={conn} dash={dash} />
      </div>
      <div id="connection-requests" className="grid scroll-mt-4 grid-cols-1 gap-6 lg:grid-cols-2">
        <ConnectionRequestsCard conn={conn} canAct={canAct} />
        <AthleteSearchCard conn={conn} canAct={canAct} />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RecruitmentOverview dash={dash} />
        <PerformanceSnapshot dash={dash} />
      </div>
    </div>
  );
}

export default function CoachDashboardPage() {
  return (
    <CoachLayout>
      <CoachDashboard />
    </CoachLayout>
  );
}
