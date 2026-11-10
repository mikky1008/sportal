import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import { CoachLayout } from "@/layouts/CoachLayout";
import { Card, PageHeader, Pill, btn } from "@/components/common";
import { fetchReviewQueue, verifySession, type ReviewItem } from "@/lib/sessionReviewApi";
import { formatResult, skillById } from "@/lib/skills";
import { cn } from "@/lib/utils";

type State = { kind: "loading" } | { kind: "error"; message: string } | { kind: "ready"; items: ReviewItem[] };

const dateLabel = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });

function Reviews() {
  const [state, setState] = useState<State>({ kind: "loading" });
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    const r = await fetchReviewQueue();
    setState(r.ok ? { kind: "ready", items: r.data } : { kind: "error", message: r.message });
  }, []);
  useEffect(() => { void load(); }, [load]);

  const verify = async (item: ReviewItem) => {
    setBusy(item.id);
    const r = await verifySession(item.id);
    setBusy(null);
    if (!r.ok) {
      toast.error(r.message || "Could not verify this result.");
      if (r.code === "already_verified" || r.code === "session_not_found") void load();
      return;
    }
    setState((s) => (s.kind === "ready" ? { kind: "ready", items: s.items.filter((i) => i.id !== item.id) } : s));
    toast.success("Result verified", { description: `${item.athlete.displayName}'s ${skillById(item.skill)?.name ?? "result"} now counts in rankings.` });
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Session Reviews" subtitle="Results your athletes asked you to verify. Only verified results count in rankings for sports without AI analysis." />
      {state.kind === "loading" && <p className="py-8 text-center text-sm text-muted-foreground">Loading…</p>}
      {state.kind === "error" && (
        <div className="py-8 text-center">
          <p className="text-sm text-muted-foreground">{state.message}</p>
          <button className={cn(btn.secondary, "mt-3")} onClick={() => { setState({ kind: "loading" }); void load(); }}>Try again</button>
        </div>
      )}
      {state.kind === "ready" && state.items.length === 0 && (
        <Card><p className="flex items-center gap-2 text-sm text-muted-foreground"><CheckCircle2 className="h-5 w-5 text-success" /> Nothing is waiting for review. Athletes you are connected to can ask you to verify a result.</p></Card>
      )}
      {state.kind === "ready" && state.items.length > 0 && (
        <ul className="flex flex-col gap-3">
          {state.items.map((i) => (
            <li key={i.id} className="surface flex flex-wrap items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{i.athlete.displayName}</p>
                <p className="text-sm text-muted-foreground">
                  {skillById(i.skill)?.name ?? i.skill} · <span className="font-semibold text-foreground">{formatResult(i.skill, i.result)}</span> · {dateLabel(i.date)}
                </p>
              </div>
              <Pill tone="warning">Pending review</Pill>
              <button disabled={busy === i.id} onClick={() => void verify(i)} className={cn(btn.primary, "px-4 py-2")}>{busy === i.id ? "Verifying…" : "Verify"}</button>
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs text-muted-foreground">Verify only results you have seen or can vouch for. You can only review athletes you are connected to.</p>
    </div>
  );
}

export default function SessionReviewsPage() {
  return <CoachLayout><Reviews /></CoachLayout>;
}
