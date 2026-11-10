import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Bookmark, BookmarkCheck, Ruler, School, Send } from "lucide-react";
import { Link } from "@/router-compat";
import { useAuth } from "@/auth/AuthContext";
import { Page } from "@/components/Page";
import { CoachLayout } from "@/layouts/CoachLayout";
import { useCoachProfile } from "@/lib/coachProfileStore";
import { fetchAthlete, postInquiry, setWatched, type AthleteDetail } from "@/lib/recruitingApi";
import { TRUST_NOTE } from "@/lib/verification";
import { Card, Pill, StatTile, btn } from "@/components/common";
import { AthleteAvatar, InquiryModal } from "@/components/recruiting";

function AthleteShowcase({ detail, onChange }: { detail: AthleteDetail; onChange: (d: AthleteDetail) => void }) {
  const { profile: coach } = useCoachProfile();
  const { athlete: a, own, applicant, watched, inquiry } = detail;
  const canAct = !own && !applicant;
  const [modal, setModal] = useState(false);
  const [busy, setBusy] = useState(false);
  const rank = a.rank > 0 ? a.rank : undefined;

  const toggleWatch = async () => {
    const r = await setWatched(a.id, !watched);
    if (!r.ok) return void toast.error(r.message || "Could not update the watchlist.");
    onChange({ ...detail, watched: !watched, note: watched ? "" : detail.note });
  };

  const sendInquiry = async (message: string, organization: string) => {
    setBusy(true);
    const r = await postInquiry({ athleteId: a.id, organization, message });
    setBusy(false);
    if (!r.ok) return void toast.error(r.message || "Could not send the inquiry.");
    setModal(false);
    onChange({ ...detail, inquiry: { id: r.data.id, status: r.data.status } });
    toast.success("Inquiry sent", { description: `${a.firstName} will decide whether to accept — a conversation only opens after they do.` });
  };

  return (
    <div className="flex flex-col gap-6">
      <Link to={applicant ? "/scholarships" : "/recruiting"} search={{ tab: undefined, thread: undefined }} className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> {applicant ? "Back to scholarships" : "Back to recruiting"}
      </Link>

      <section className="surface flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:p-6">
        <AthleteAvatar name={`${a.firstName} ${a.lastName}`} className="h-24 w-24 text-3xl" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h1 className="text-3xl font-bold sm:text-4xl">{a.firstName} {a.lastName}</h1>
            {a.teamStatus && <Pill tone={a.teamStatus === "Not on a team" ? "default" : "primary"}>{a.teamStatus === "Not on a team" || !a.teamName ? a.teamStatus : `${a.teamStatus} · ${a.teamName}`}</Pill>}
          </div>
          <p className="text-muted-foreground">{[a.sport, a.position].filter(Boolean).join(" • ")}{a.year ? ` · ${a.year}` : ""}</p>
          <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
            {a.school && <span className="flex items-center gap-1.5"><School className="h-4 w-4" />{a.school}</span>}
            {a.height && <span className="flex items-center gap-1.5"><Ruler className="h-4 w-4" />{a.height}</span>}
          </div>
        </div>
        {canAct && (
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => void toggleWatch()} aria-pressed={watched} className={btn.secondary}>
              {watched ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
              {watched ? "On watchlist" : "Save to watchlist"}
            </button>
            {inquiry ? (
              inquiry.status === "Accepted" ? (
                <Link to="/recruiting" search={{ tab: "messages", thread: inquiry.id }} className={btn.secondary}><Send className="h-4 w-4" /> Open conversation</Link>
              ) : (
                <Pill tone="warning">Inquiry pending — awaiting athlete approval</Pill>
              )
            ) : (
              <button onClick={() => setModal(true)} className={btn.primary}><Send className="h-4 w-4" /> Send inquiry</button>
            )}
          </div>
        )}
      </section>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Performance" value={a.totalSessions ? String(a.performanceScore) : "—"} />
        <StatTile label={`${a.sport} Rank`} value={rank ? `#${rank}` : "Unranked"} />
        <StatTile label="Coach-Verified" value={`${a.verifiedSessions}/${a.totalSessions}`} hint={<span className="text-muted-foreground">sessions</span>} />
        <StatTile label="Position" value={a.position || "—"} hint={<span className="text-muted-foreground">{a.sport}</span>} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card title="Athletic Bio"><p className="text-muted-foreground">{a.bio || "No bio yet."}</p></Card>
          <Card title="Skills">
            {a.skills.length ? (
              <ul className="grid gap-4 sm:grid-cols-2">
                {a.skills.map((s) => (
                  <li key={s.name} className="flex items-center justify-between rounded-xl border bg-card px-4 py-3">
                    <span className="text-sm font-semibold">{s.name}</span>
                    <span className="font-display text-lg font-bold">{s.value}</span>
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-muted-foreground">No assessed sessions yet.</p>}
          </Card>
          <Card title="About these results"><p className="text-sm text-muted-foreground">{TRUST_NOTE}</p></Card>
        </div>
        <div className="flex flex-col gap-6">
          <Card title="Achievements">
            {a.achievements.length ? (
              <ul className="flex flex-col gap-3">
                {a.achievements.map((x) => (
                  <li key={`${x.title}-${x.year}`} className="text-sm"><p className="font-semibold">{x.title}</p><p className="text-xs text-muted-foreground">{x.year}</p></li>
                ))}
              </ul>
            ) : <p className="text-sm text-muted-foreground">None listed yet.</p>}
          </Card>
          <div className="rounded-2xl bg-hero p-6 text-navy-foreground">
            <p className="font-display text-lg font-bold">Controlled messaging</p>
            <p className="mt-1 text-sm text-navy-muted">
              {own
                ? "Coaches send an inquiry first. You review it and only accepting opens a conversation."
                : `Your inquiry is a request, not a direct message. ${a.firstName} reviews it first and only accepting opens a conversation.`}
            </p>
          </div>
        </div>
      </div>

      {applicant && (
        <p className="text-xs text-muted-foreground">This athlete applied to one of your scholarships, so their showcase is shared with you for that application.</p>
      )}
      {own && (
        <p className="text-xs text-muted-foreground">
          This is your own showcase — verified coaches find it exactly like this when "Visible to coaches &amp; universities" is on in Settings.
          {!a.visible && " It is hidden right now."}
        </p>
      )}

      {canAct && <InquiryModal athlete={a} open={modal} busy={busy} defaultOrganization={coach.organizationName} onClose={() => setModal(false)} onSend={(m, o) => void sendInquiry(m, o)} />}
    </div>
  );
}

type Load = { kind: "loading" } | { kind: "missing"; message: string } | { kind: "ready"; detail: AthleteDetail };

function Loaded() {
  const { athleteId } = useParams<{ athleteId: string }>();
  const [load, setLoad] = useState<Load>({ kind: "loading" });

  useEffect(() => {
    if (!athleteId) { setLoad({ kind: "missing", message: "This showcase doesn't exist or has been removed." }); return; }
    const ctrl = new AbortController();
    setLoad({ kind: "loading" });
    void fetchAthlete(athleteId, ctrl.signal).then((r) => {
      if (ctrl.signal.aborted) return;
      setLoad(r.ok ? { kind: "ready", detail: r.data } : { kind: "missing", message: r.status === 404 ? "This showcase doesn't exist, has been removed, or the athlete has hidden it." : r.message });
    });
    return () => ctrl.abort();
  }, [athleteId]);

  if (load.kind === "loading") return <p className="py-16 text-center text-sm text-muted-foreground">Loading showcase…</p>;
  if (load.kind === "missing")
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <h1 className="text-2xl font-bold">Athlete not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">{load.message}</p>
        <Link to="/recruiting" direction="back" className="mt-6 inline-flex rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Back to recruiting</Link>
      </div>
    );
  return <AthleteShowcase key={load.detail.athlete.id} detail={load.detail} onChange={(d) => setLoad({ kind: "ready", detail: d })} />;
}

export default function AthleteShowcasePage() {
  const { user } = useAuth();
  return user?.roles.includes("coach") ? (
    <CoachLayout><Loaded /></CoachLayout>
  ) : (
    <Page title="Athlete Showcase" backTo="/recruiting"><Loaded /></Page>
  );
}
