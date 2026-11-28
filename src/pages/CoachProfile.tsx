import { Link } from "@/router-compat";
import { useMemo, useState } from "react";
import { BadgeCheck, Briefcase, Building2, Clock, MapPin, Pencil, Settings, Trophy } from "lucide-react";
import { CoachLayout } from "@/layouts/CoachLayout";
import { useCoachProfile } from "@/lib/coachProfileStore";
import { CoachCompletionCard } from "@/components/profile-completion-cards";
import { PersonAvatar } from "@/components/avatar";
import { CoachProfileSheet } from "@/components/coach-profile-sheet";
import { computeCoachCompletion } from "@/lib/profileCompletion";
import { Card, Pill, btn } from "@/components/common";

/**
 * The coach's own profile. This is where "Edit profile" lives (inside the completion card), and the gear
 * in the corner opens Settings. Everything else on the page just reads the saved profile back.
 */
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium">{value.trim() || <span className="font-normal text-muted-foreground">Not added yet</span>}</dd>
    </div>
  );
}

function CoachProfile() {
  const { profile: p, verification } = useCoachProfile();
  const name = [p.firstName, p.lastName].filter(Boolean).join(" ") || "Coach";
  const verified = verification.status === "Verified";
  const [editing, setEditing] = useState(false);
  // Once the profile is complete and the school's representative has approved it, there is nothing left to
  // track, so the progress card goes away and a plain Edit profile button stays in the header.
  const done = useMemo(() => computeCoachCompletion(p).complete, [p]) && verified;
  return (
    <div className="flex flex-col gap-6">
      <section className="surface relative flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:p-6">
        <Link
          to="/coach/settings"
          aria-label="Settings"
          title="Settings"
          className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full border bg-card text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Settings className="h-5 w-5" />
        </Link>
        <PersonAvatar name={name} size="lg" shape="xl" />
        <div className="min-w-0 flex-1 pr-12">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h1 className="text-3xl font-bold sm:text-4xl">{name}</h1>
            <Pill tone={verified ? "success" : verification.status === "Rejected" ? "default" : "warning"}>
              {verified && <BadgeCheck className="mr-1 inline h-3.5 w-3.5" />}
              {verified ? "Verified coach" : verification.status === "Rejected" ? "Not approved" : "Awaiting approval"}
            </Pill>
          </div>
          <p className="text-muted-foreground">{[p.positionTitle, p.programName].filter(Boolean).join(" · ") || "Add your coaching position"}</p>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {p.organizationName && <span className="flex items-center gap-1.5"><Building2 className="h-4 w-4" />{p.organizationName}</span>}
            {p.organizationLocation && <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" />{p.organizationLocation}</span>}
          </div>
          {done && (
            <button type="button" onClick={() => setEditing(true)} className={`${btn.secondary} mt-4`}>
              <Pencil className="h-4 w-4" /> Edit profile
            </button>
          )}
        </div>
      </section>

      {done ? <CoachProfileSheet open={editing} section={null} onOpenChange={setEditing} /> : <CoachCompletionCard />}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Coaching" className="lg:col-span-2">
          <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
            <Row label="Position" value={p.positionTitle} />
            <Row label="Program / team" value={p.programName} />
            <Row label="Sport" value={p.primarySport} />
            <Row label="Level" value={p.competitionLevel} />
            <Row label="Organization type" value={p.organizationType} />
            <Row label="Email" value={p.email} />
          </dl>
        </Card>
        <div className="flex flex-col gap-6">
          <Card title="Experience">
            <p className="flex items-center gap-2 text-sm"><Clock className="h-4 w-4 text-muted-foreground" />{p.yearsExperience ? `${p.yearsExperience} years coaching` : "Years not added yet"}</p>
          </Card>
          <Card title="Certifications">
            <p className="flex items-start gap-2 text-sm"><Trophy className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />{p.certifications.trim() || <span className="text-muted-foreground">None listed (optional)</span>}</p>
          </Card>
        </div>
        <Card title="Background" className="lg:col-span-3">
          <p className="flex items-start gap-2 text-sm"><Briefcase className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" /><span className="whitespace-pre-line">{p.background.trim() || <span className="text-muted-foreground">Tell athletes about your coaching background.</span>}</span></p>
        </Card>
      </div>
    </div>
  );
}

export default function CoachProfilePage() {
  return <CoachLayout><CoachProfile /></CoachLayout>;
}
