import { useCallback, useEffect, useState } from "react";
import { Redirect } from "react-router-dom";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import {
  BadgeCheck, Building2, Clock, FileText, GraduationCap, Handshake, MapPin, Send, ShieldCheck, ShieldX, UserCheck, UserPlus, Users,
  type LucideIcon,
} from "lucide-react";
import { Page } from "@/components/Page";
import { Card, EmptyState, Pill, StatTile, btn } from "@/components/common";
import { PersonAvatar } from "@/components/avatar";
import { Modal } from "@/components/listings";
import { useAuth } from "@/auth/AuthContext";
import { homePathFor, primaryRole } from "@/lib/roles";
import {
  fetchRepDashboard, type ActivityKind, type PendingCoachRequest, type RepActivity, type RepDashboardData,
} from "@/lib/repDashboardApi";
import { cn } from "@/lib/utils";

/* ---------------------------------------------------------------------------------------------
   SCHOOL REPRESENTATIVE DASHBOARD  (route: /rep/dashboard)

   Every number, row and sentence on this page comes from GET /api/rep/dashboard. The server takes
   the school from the signed-in representative's own approved account, so this page can only ever
   show that one institution. Nothing here changes data.
--------------------------------------------------------------------------------------------- */

const prettyDate = (iso: string) => {
  try { return format(parseISO(iso), "MMM d, yyyy"); } catch { return iso; }
};
const ago = (iso: string) => {
  try { return formatDistanceToNow(parseISO(iso), { addSuffix: true }); } catch { return ""; }
};

type State = { kind: "loading" } | { kind: "error"; message: string } | { kind: "ready"; data: RepDashboardData };

function useRepDashboard() {
  const [state, setState] = useState<State>({ kind: "loading" });
  const load = useCallback(async (signal?: AbortSignal) => {
    setState({ kind: "loading" });
    const r = await fetchRepDashboard(signal);
    if (!r.ok) {
      if (r.code === "aborted") return;
      setState({ kind: "error", message: r.message });
      return;
    }
    setState({ kind: "ready", data: r.data });
  }, []);
  useEffect(() => {
    const ctrl = new AbortController();
    void load(ctrl.signal);
    return () => ctrl.abort();
  }, [load]);
  return { state, reload: () => void load() };
}

/* ---- welcome ---- */

function Welcome({ data }: { data: RepDashboardData }) {
  const { rep, school } = data;
  const [logoBroken, setLogoBroken] = useState(false);
  return (
    <section aria-label="Welcome" className="relative overflow-hidden rounded-3xl bg-hero p-6 text-navy-foreground shadow-card sm:p-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        {school.logoUrl && !logoBroken ? (
          <img src={school.logoUrl} alt={`${school.name} logo`} onError={() => setLogoBroken(true)} className="h-20 w-20 shrink-0 rounded-2xl bg-white object-contain p-1.5" />
        ) : (
          <span aria-hidden="true" className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-white/10 text-electric ring-1 ring-white/15">
            <Building2 className="h-9 w-9" />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-electric">School Representative Dashboard</p>
          <h1 className="mt-1 text-2xl font-bold leading-tight sm:text-3xl">Welcome back, {rep.firstName}</h1>
          <p className="mt-1 flex items-start gap-2 text-base font-semibold sm:text-lg">
            <GraduationCap className="mt-0.5 h-5 w-5 shrink-0 text-electric" aria-hidden="true" />
            <span className="min-w-0 break-words">{school.name}</span>
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-navy-muted">
            {rep.designation && <span>{rep.designation}</span>}
            {school.location && <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4" aria-hidden="true" />{school.location}</span>}
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-semibold text-navy-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-electric" aria-hidden="true" /> Approved institution
            </span>
          </div>
        </div>
      </div>
      <p className="mt-5 border-t border-white/10 pt-4 text-sm text-navy-muted">
        You're viewing coaches, athletes and requests for {school.name} only.
      </p>
    </section>
  );
}

/* ---- summary cards ---- */

function Summary({ data }: { data: RepDashboardData }) {
  const s = data.stats;
  const muted = (t: string) => <span className="text-muted-foreground">{t}</span>;
  return (
    <section aria-label="Summary" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatTile label="Total Coaches" value={String(s.totalCoaches)} icon={<Users />} hint={muted("Verified at your school")} />
      <StatTile label="Total Athletes" value={String(s.totalAthletes)} icon={<GraduationCap />} hint={muted("Connected to your coaches")} />
      <StatTile
        label="Pending Coach Requests"
        value={String(s.pendingCoachRequests)}
        icon={<Clock />}
        hint={s.pendingCoachRequests > 0 ? <span className="font-semibold text-primary">Waiting for review</span> : muted("Nothing waiting")}
      />
      <StatTile label="Active Coaches" value={String(s.activeCoaches)} icon={<UserCheck />} hint={muted("Verified, account active")} />
    </section>
  );
}

/* ---- recent activities ---- */

const ACTIVITY_ICON: Record<ActivityKind, LucideIcon> = {
  coach_requested: UserPlus,
  coach_approved: BadgeCheck,
  coach_rejected: ShieldX,
  athlete_connected: Handshake,
  athlete_applied_coach: Send,
  scholarship_posted: GraduationCap,
  scholarship_applied: FileText,
};

function RecentActivities({ items }: { items: RepActivity[] }) {
  return (
    <Card title="Recent Activities" className="lg:col-span-2">
      {items.length === 0 ? (
        <EmptyState message="No activity at your school yet. Coach requests, athlete connections and scholarship activity will show up here." />
      ) : (
        <ul className="flex flex-col">
          {items.map((a) => {
            const Icon = ACTIVITY_ICON[a.kind];
            return (
              <li key={a.id} className="flex items-start gap-3 border-b py-3 last:border-b-0 last:pb-0 first:pt-0">
                <span aria-hidden="true" className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground">
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="break-words text-sm">{a.text}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground"><time dateTime={a.at} title={prettyDate(a.at)}>{ago(a.at)}</time></p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

/* ---- pending coach requests ---- */

const subline = (r: PendingCoachRequest) => [r.position, r.programName].filter(Boolean).join(" · ");

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 border-b py-2.5 last:border-b-0 sm:flex-row sm:gap-4">
      <dt className="text-sm text-muted-foreground sm:w-40 sm:shrink-0">{label}</dt>
      <dd className="min-w-0 break-words text-sm font-medium">{value || "Not provided"}</dd>
    </div>
  );
}

function ReviewModal({ request, school, onClose }: { request: PendingCoachRequest | null; school: string; onClose: () => void }) {
  return (
    <Modal open={request !== null} onClose={onClose} title="Review coach request">
      {request && (
        <>
          <div className="mb-3 flex items-center gap-3">
            <PersonAvatar name={request.name} size="sm" />
            <div className="min-w-0">
              <p className="truncate font-semibold">{request.name}</p>
              <Pill tone="warning">Pending review</Pill>
            </div>
          </div>
          <dl>
            <Detail label="Requested school" value={school} />
            <Detail label="Sport" value={request.sport} />
            <Detail label="Position" value={request.position} />
            <Detail label="Program" value={request.programName} />
            <Detail label="Credential type" value={request.credentialType} />
            <Detail label="Application date" value={prettyDate(request.appliedAt)} />
          </dl>
          <p className="mt-4 rounded-xl bg-accent px-3 py-2.5 text-sm text-accent-foreground">
            A Sportal administrator makes the final decision on coach verification. Once approved, this coach appears in your Total and Active Coaches.
          </p>
          <div className="mt-5 flex justify-end">
            <button type="button" className={btn.secondary} onClick={onClose}>Close</button>
          </div>
        </>
      )}
    </Modal>
  );
}

function PendingRequests({ data }: { data: RepDashboardData }) {
  const { items, total } = data.pendingRequests;
  const [reviewing, setReviewing] = useState<PendingCoachRequest | null>(null);
  const reviewBtn = (r: PendingCoachRequest) => (
    <button type="button" className={cn(btn.primary, btn.sm)} aria-label={`Review request from ${r.name}`} onClick={() => setReviewing(r)}>
      Review
    </button>
  );

  return (
    <Card
      title={`Pending Coach Requests${total > 0 ? ` (${total})` : ""}`}
      className="lg:col-span-3"
    >
      {items.length === 0 ? (
        <EmptyState message="No coach requests are waiting for your school right now." />
      ) : (
        <>
          {/* tablet and up: a real table */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  <th scope="col" className="pb-2.5 pr-3 font-medium">Coach</th>
                  <th scope="col" className="pb-2.5 pr-3 font-medium">Sport</th>
                  <th scope="col" className="pb-2.5 pr-3 font-medium">Application date</th>
                  <th scope="col" className="pb-2.5 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map((r) => (
                  <tr key={r.id} className="border-b last:border-b-0">
                    <td className="py-3 pr-3">
                      <div className="flex items-center gap-3">
                        <PersonAvatar name={r.name} size="header" />
                        <div className="min-w-0">
                          <p className="truncate font-semibold">{r.name}</p>
                          {subline(r) && <p className="truncate text-xs text-muted-foreground">{subline(r)}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 pr-3">{r.sport || <span className="text-muted-foreground">Not set</span>}</td>
                    <td className="whitespace-nowrap py-3 pr-3">{prettyDate(r.appliedAt)}</td>
                    <td className="py-3 text-right">{reviewBtn(r)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* phones: one card per request */}
          <ul className="flex flex-col gap-3 md:hidden">
            {items.map((r) => (
              <li key={r.id} className="rounded-2xl border bg-card p-3">
                <div className="flex items-center gap-3">
                  <PersonAvatar name={r.name} size="header" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{r.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{r.sport || "Sport not set"}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <p className="text-xs text-muted-foreground">Applied {prettyDate(r.appliedAt)}</p>
                  {reviewBtn(r)}
                </div>
              </li>
            ))}
          </ul>

          {total > items.length && (
            <p className="mt-4 text-center text-xs text-muted-foreground">Showing the {items.length} oldest of {total} requests.</p>
          )}
        </>
      )}
      <ReviewModal request={reviewing} school={data.school.name} onClose={() => setReviewing(null)} />
    </Card>
  );
}

/* ---- page ---- */

function Skeleton() {
  return (
    <div role="status" aria-label="Loading dashboard" className="flex flex-col gap-6">
      <div className="h-44 animate-pulse rounded-3xl bg-muted" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-muted" />)}
      </div>
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="h-72 animate-pulse rounded-2xl bg-muted lg:col-span-2" />
        <div className="h-72 animate-pulse rounded-2xl bg-muted lg:col-span-3" />
      </div>
    </div>
  );
}

function RepDashboard() {
  const { state, reload } = useRepDashboard();

  if (state.kind === "loading") return <Skeleton />;
  if (state.kind === "error")
    return (
      <div role="alert" className="surface mx-auto flex max-w-lg flex-col items-center gap-3 px-6 py-10 text-center">
        <p className="text-sm text-muted-foreground">{state.message}</p>
        <button type="button" className={cn(btn.secondary, btn.sm)} onClick={reload}>Try again</button>
      </div>
    );

  const { data } = state;
  return (
    <div className="flex flex-col gap-6">
      <Welcome data={data} />
      <Summary data={data} />
      <div className="grid gap-6 lg:grid-cols-5">
        <RecentActivities items={data.activities} />
        <PendingRequests data={data} />
      </div>
    </div>
  );
}

export default function RepDashboardPage() {
  const { user } = useAuth();
  // Only school representatives have this dashboard; anyone else goes to their own home.
  if (user && primaryRole(user.roles) !== "university_representative") return <Redirect to={homePathFor(user.roles)} />;
  return (
    <Page title="School Representative Dashboard">
      <RepDashboard />
    </Page>
  );
}
