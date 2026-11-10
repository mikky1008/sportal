import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";
import { AdminLayout } from "@/layouts/AdminLayout";
import { Card, PageHeader, Pill, btn } from "@/components/common";
import { approveCoach, fetchVerifications, rejectCoach, type VerificationRequest, type VerificationStatus } from "@/lib/adminApi";
import { cn } from "@/lib/utils";

type State = { kind: "loading" } | { kind: "error"; message: string } | { kind: "ready"; items: VerificationRequest[] };
const TABS: { id: VerificationStatus; label: string }[] = [
  { id: "pending", label: "Pending" },
  { id: "verified", label: "Approved" },
  { id: "rejected", label: "Rejected" },
];

function Row({ r, onDone }: { r: VerificationRequest; onDone: () => void }) {
  const [rejecting, setRejecting] = useState(false);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const field = "w-full rounded-xl border bg-card px-3 py-2 text-sm outline-none focus:border-primary";

  const approve = async () => {
    setBusy(true);
    const res = await approveCoach(r.coachId);
    setBusy(false);
    if (!res.ok) return void toast.error(res.message || "Could not approve.");
    toast.success(`${r.displayName} is now a verified coach`);
    onDone();
  };
  const reject = async () => {
    if (!note.trim()) return void toast.error("Write the reason. The coach will see it.");
    setBusy(true);
    const res = await rejectCoach(r.coachId, note.trim());
    setBusy(false);
    if (!res.ok) return void toast.error(res.message || "Could not reject.");
    toast.success("Request rejected. The coach was told why.");
    onDone();
  };

  const detail = (label: string, value: string) => (
    <div><dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</dt><dd className="text-sm">{value || "—"}</dd></div>
  );
  return (
    <li className="surface flex flex-col gap-3 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-semibold">{r.displayName}</p>
          <p className="text-xs text-muted-foreground">{r.email} · submitted {new Date(r.submittedAt).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })}</p>
        </div>
        <Pill tone={r.status === "verified" ? "success" : r.status === "rejected" ? "gold" : "warning"}>{r.status === "verified" ? "Approved" : r.status === "rejected" ? "Rejected" : "Pending"}</Pill>
      </div>
      <dl className="grid gap-3 sm:grid-cols-3">
        {detail("Organization", r.organization)}
        {detail("Organization type", r.organizationType)}
        {detail("Position", r.position)}
        {detail("Sport", r.sport)}
        {detail("Official email", r.officialEmail)}
        {detail("Credential", `${r.credentialType}${r.credentialReference ? ` · ${r.credentialReference}` : ""}`)}
      </dl>
      {r.status !== "pending" && r.note && <p className="text-sm text-muted-foreground"><span className="font-semibold text-foreground">Reason shown to the coach:</span> {r.note}</p>}
      {r.status === "pending" && (
        rejecting ? (
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Reason (the coach will see this)
              <textarea className={cn(field, "mt-1")} rows={3} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} />
            </label>
            <div className="flex gap-2">
              <button disabled={busy} onClick={() => void reject()} className={cn(btn.primary, "px-4 py-2")}>{busy ? "Rejecting…" : "Confirm rejection"}</button>
              <button disabled={busy} onClick={() => setRejecting(false)} className={cn(btn.secondary, "px-4 py-2")}>Cancel</button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <button disabled={busy} onClick={() => void approve()} className={cn(btn.primary, "px-4 py-2")}>{busy ? "Approving…" : "Approve"}</button>
            <button disabled={busy} onClick={() => setRejecting(true)} className={cn(btn.secondary, "px-4 py-2")}>Reject…</button>
          </div>
        )
      )}
    </li>
  );
}

function Verifications() {
  const [tab, setTab] = useState<VerificationStatus>("pending");
  const [state, setState] = useState<State>({ kind: "loading" });
  const load = useCallback(async () => {
    const r = await fetchVerifications(tab);
    setState(r.ok ? { kind: "ready", items: r.data.items } : { kind: "error", message: r.message });
  }, [tab]);
  useEffect(() => { setState({ kind: "loading" }); void load(); }, [load]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Coach Verification" subtitle="Review the credentials coaches submitted. Only verified coaches can recruit athletes and verify results." />
      <div className="flex gap-2">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} aria-pressed={tab === t.id}
            className={cn("rounded-full border px-4 py-2 text-sm font-semibold", tab === t.id ? "border-primary bg-primary text-primary-foreground" : "bg-card text-muted-foreground")}>{t.label}</button>
        ))}
      </div>
      {state.kind === "loading" && <p className="py-8 text-center text-sm text-muted-foreground">Loading…</p>}
      {state.kind === "error" && <p className="py-8 text-center text-sm text-muted-foreground">{state.message}</p>}
      {state.kind === "ready" && state.items.length === 0 && (
        <Card><p className="flex items-center gap-2 text-sm text-muted-foreground"><ShieldCheck className="h-5 w-5" /> Nothing here.</p></Card>
      )}
      {state.kind === "ready" && state.items.length > 0 && (
        <ul className="flex flex-col gap-3">{state.items.map((r) => <Row key={r.coachId} r={r} onDone={() => void load()} />)}</ul>
      )}
    </div>
  );
}

export default function AdminVerificationsPage() {
  return <AdminLayout><Verifications /></AdminLayout>;
}
