import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";
import { Link } from "@/router-compat";
import { CoachLayout } from "@/layouts/CoachLayout";
import { Card, PageHeader, Pill, btn } from "@/components/common";
import { fetchReceivedApplications, setCoachApplicationStatus, type ReceivedApplication } from "@/lib/coachApplicationsApi";
import { sendConnectionRequest } from "@/lib/searchApi";
import { cn } from "@/lib/utils";

type State = { kind: "loading" } | { kind: "error"; message: string } | { kind: "ready"; items: ReceivedApplication[] };

const RELATIONSHIP: Record<ReceivedApplication["relationship"], string | null> = {
  connected: "In My Athletes",
  request_sent: "Request sent",
  request_received: "Wants to connect",
  none: null,
};

function Applications() {
  const [state, setState] = useState<State>({ kind: "loading" });
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    const r = await fetchReceivedApplications();
    setState(r.ok ? { kind: "ready", items: r.data } : { kind: "error", message: r.message });
  }, []);
  useEffect(() => { void load(); }, [load]);

  const mark = async (a: ReceivedApplication, status: "reviewed" | "dismissed") => {
    setBusy(a.id);
    const r = await setCoachApplicationStatus(a.id, status);
    setBusy(null);
    if (!r.ok) toast.error(r.message || "Could not update this application.");
    void load();
  };
  const connect = async (a: ReceivedApplication) => {
    setBusy(a.id);
    const r = await sendConnectionRequest(a.athlete.id);
    setBusy(null);
    if (!r.ok) return void toast.error(r.message || "Could not send the request.");
    toast.success("Request sent", { description: `${a.athlete.displayName} will see it and can accept.` });
    void load();
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Athlete Applications" subtitle="Athletes who showed interest in your program. Open their showcase, connect with them, or set the application aside." />
      {state.kind === "loading" && <p className="py-8 text-center text-sm text-muted-foreground">Loading…</p>}
      {state.kind === "error" && (
        <div className="py-8 text-center">
          <p className="text-sm text-muted-foreground">{state.message}</p>
          <button className={cn(btn.secondary, "mt-3")} onClick={() => { setState({ kind: "loading" }); void load(); }}>Try again</button>
        </div>
      )}
      {state.kind === "ready" && state.items.length === 0 && (
        <Card><p className="flex items-center gap-2 text-sm text-muted-foreground"><UserPlus className="h-5 w-5" /> No applications yet. Athletes can find you from the search bar and show interest.</p></Card>
      )}
      {state.kind === "ready" && state.items.length > 0 && (
        <ul className="flex flex-col gap-3">
          {state.items.map((a) => (
            <li key={a.id} className={cn("surface flex flex-wrap items-center gap-3 p-4", a.status === "dismissed" && "opacity-60")}>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{a.athlete.displayName}</p>
                <p className="text-sm text-muted-foreground">
                  {[a.athlete.sport, a.athlete.school].filter(Boolean).join(" · ") || "No profile yet"} · applied {new Date(a.createdAt).toLocaleDateString("en-US", { month: "short", day: "2-digit" })}
                </p>
              </div>
              {a.status === "new" && <Pill tone="warning">New</Pill>}
              {a.status === "reviewed" && <Pill>Reviewed</Pill>}
              {a.status === "dismissed" && <Pill>Dismissed</Pill>}
              {RELATIONSHIP[a.relationship] && <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">{RELATIONSHIP[a.relationship]}</span>}
              <div className="flex flex-wrap gap-2">
                {a.hasShowcase && <Link to={`/recruiting/${a.athlete.id}`} className={cn(btn.secondary, "px-3 py-1.5 text-xs")}>View showcase</Link>}
                {a.relationship === "none" && <button disabled={busy === a.id} onClick={() => void connect(a)} className={cn(btn.primary, "px-3 py-1.5 text-xs")}>Connect</button>}
                {a.status === "new" && <button disabled={busy === a.id} onClick={() => void mark(a, "reviewed")} className={cn(btn.secondary, "px-3 py-1.5 text-xs")}>Mark reviewed</button>}
                {a.status !== "dismissed" && <button disabled={busy === a.id} onClick={() => void mark(a, "dismissed")} className={cn(btn.secondary, "px-3 py-1.5 text-xs")}>Dismiss</button>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function CoachApplicationsPage() {
  return <CoachLayout><Applications /></CoachLayout>;
}
