import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { PageHeader, btn } from "@/components/common";
import { Modal, ScholarshipCard } from "@/components/listings";
import { Page } from "@/components/Page";
import { useAuth } from "@/auth/AuthContext";
import { sports } from "@/data/mock";
import {
  applyToScholarship, createScholarship, listScholarships, setScholarshipOpen, withdrawApplication,
  type ScholarshipDraft, type ScholarshipView,
} from "@/lib/scholarshipsApi";
import { cn } from "@/lib/utils";

type State = { kind: "loading" } | { kind: "error"; message: string } | { kind: "ready"; items: ScholarshipView[] };

const field = "w-full rounded-xl border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary";
const EMPTY: ScholarshipDraft = { name: "", sport: sports[0]?.name ?? "", coverage: "", details: "", eligibility: [], deadline: "" };

/** The form a university representative uses to post a scholarship. The server adds their university. */
function PostScholarshipModal({ open, onClose, onPosted }: { open: boolean; onClose: () => void; onPosted: () => void }) {
  const [d, setD] = useState<ScholarshipDraft>(EMPTY);
  const [eligibilityText, setEligibilityText] = useState("");
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const today = new Date().toISOString().slice(0, 10);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const r = await createScholarship({ ...d, eligibility: eligibilityText.split("\n").map((x) => x.trim()).filter(Boolean) });
    setBusy(false);
    if (!r.ok) {
      const fe = (r as { fieldErrors?: Record<string, string[]> }).fieldErrors;
      setErrors(fe ? Object.fromEntries(Object.entries(fe).map(([k, v]) => [k, v[0] ?? "Invalid"])) : { form: r.message });
      return;
    }
    toast.success("Scholarship posted");
    setD(EMPTY);
    setEligibilityText("");
    setErrors({});
    onPosted();
    onClose();
  };

  const err = (k: string) => errors[k] && <span role="alert" className="text-xs text-destructive">{errors[k]}</span>;
  return (
    <Modal open={open} onClose={() => !busy && onClose()} title="Post a scholarship">
      <form onSubmit={submit} className="flex flex-col gap-3" noValidate>
        <label className="flex flex-col gap-1 text-sm font-medium">Name
          <input className={field} value={d.name} maxLength={120} onChange={(e) => setD({ ...d, name: e.target.value })} placeholder="Athletic Excellence Scholarship" />
          {err("name")}
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1 text-sm font-medium">Sport
            <select className={field} value={d.sport} onChange={(e) => setD({ ...d, sport: e.target.value })}>
              {sports.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
            </select>
            {err("sport")}
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium">Deadline
            <input type="date" min={today} className={field} value={d.deadline} onChange={(e) => setD({ ...d, deadline: e.target.value })} />
            {err("deadline")}
          </label>
        </div>
        <label className="flex flex-col gap-1 text-sm font-medium">Coverage
          <input className={field} value={d.coverage} maxLength={120} onChange={(e) => setD({ ...d, coverage: e.target.value })} placeholder="Full tuition + stipend" />
          {err("coverage")}
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">Details
          <textarea className={field} rows={3} maxLength={2000} value={d.details} onChange={(e) => setD({ ...d, details: e.target.value })} />
          {err("details")}
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">Eligibility <span className="font-normal text-muted-foreground">(one requirement per line, up to 10)</span>
          <textarea className={field} rows={3} value={eligibilityText} onChange={(e) => setEligibilityText(e.target.value)} />
          {err("eligibility")}
        </label>
        {err("form")}
        <button type="submit" disabled={busy} className={btn.primary}>{busy ? "Posting…" : "Post scholarship"}</button>
      </form>
    </Modal>
  );
}

export default function ScholarshipsPage() {
  const { user } = useAuth();
  const canApply = !!user?.roles.includes("student_athlete");
  const canPost = !!user?.roles.some((r) => r === "university_representative" || r === "admin");
  const [state, setState] = useState<State>({ kind: "loading" });
  const [sport, setSport] = useState("all");
  const [posting, setPosting] = useState(false);

  const load = useCallback(async (signal?: AbortSignal) => {
    // Posters also see their own closed scholarships, so they can reopen them.
    const r = await listScholarships(signal ? { signal, includeClosed: canPost } : { includeClosed: canPost });
    if (signal?.aborted) return;
    setState(r.ok ? { kind: "ready", items: r.data.items } : { kind: "error", message: r.message });
  }, [canPost]);

  useEffect(() => {
    const ctrl = new AbortController();
    void load(ctrl.signal);
    return () => ctrl.abort();
  }, [load]);

  // Each action hits the API, then reloads so the card shows what the server actually saved.
  const act = <A extends unknown[]>(fn: (...a: A) => Promise<{ ok: boolean; code?: string; message?: string }>) =>
    async (...a: A): Promise<string | null> => {
      const r = await fn(...a);
      if (!r.ok) {
        if (r.code === "already_applied" || r.code === "closed") void load();
        return r.message ?? "Something went wrong.";
      }
      await load();
      return null;
    };

  const sports_ = useMemo(() => (state.kind === "ready" ? [...new Set(state.items.map((s) => s.sport))].sort() : []), [state]);
  const shown = state.kind === "ready" ? state.items.filter((s) => sport === "all" || s.sport === sport) : [];

  return (
    <Page title="Scholarships">
      <PageHeader
        title="Scholarships"
        subtitle="Apply with your showcase profile. Universities decide who receives each scholarship."
        action={canPost ? <button className={btn.primary} onClick={() => setPosting(true)}>Post a scholarship</button> : undefined}
      />

      {sports_.length > 1 && (
        <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
          {["all", ...sports_].map((x) => (
            <button key={x} onClick={() => setSport(x)} className={cn("whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold", sport === x ? "border-primary bg-primary text-primary-foreground" : "bg-card text-muted-foreground")}>
              {x === "all" ? "All sports" : x}
            </button>
          ))}
        </div>
      )}

      {state.kind === "loading" && <p className="py-8 text-center text-sm text-muted-foreground">Loading scholarships…</p>}
      {state.kind === "error" && (
        <div className="py-8 text-center">
          <p className="text-sm text-muted-foreground">{state.message}</p>
          <button className={cn(btn.secondary, "mt-3")} onClick={() => { setState({ kind: "loading" }); void load(); }}>Try again</button>
        </div>
      )}
      {state.kind === "ready" && shown.length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">{canPost ? "You haven't posted a scholarship yet." : "No open scholarships right now."}</p>
      )}
      {state.kind === "ready" && shown.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {shown.map((s) => (
            <ScholarshipCard key={s.id} s={s} canApply={canApply} onApply={act(applyToScholarship)} onWithdraw={act(withdrawApplication)} onToggleOpen={act(setScholarshipOpen)} />
          ))}
        </div>
      )}
      {canPost && <PostScholarshipModal open={posting} onClose={() => setPosting(false)} onPosted={() => void load()} />}
    </Page>
  );
}
