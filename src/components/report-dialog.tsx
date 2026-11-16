import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Flag, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { btn } from "@/components/common";
import { REPORT_CONTENT_OPTIONS, REPORT_REASON_OPTIONS, submitReport, type ReportContentType, type ReportReason } from "@/lib/reportsApi";
import { cn } from "@/lib/utils";

/** "Report this profile": tells the Sportal administrators about a profile, video or photo that breaks the rules. */
export function ReportDialog({ athlete, onClose }: { athlete: { id: string; name: string } | null; onClose: () => void }) {
  const [contentType, setContentType] = useState<ReportContentType>("athlete_profile");
  const [reason, setReason] = useState<ReportReason | "">("");
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setContentType("athlete_profile"); setReason(""); setDetails(""); setError(null); setLoading(false);
  }, [athlete?.id]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!athlete || loading) return;
    if (!reason) return setError("Choose a reason.");
    setLoading(true);
    setError(null);
    const res = await submitReport({ athleteId: athlete.id, contentType, reason, details: details.trim() });
    setLoading(false);
    if (!res.ok) return setError(res.fieldErrors?.["reason"] ?? res.fieldErrors?.["details"] ?? res.message);
    toast.success("Report sent", { description: "Thank you. A Sportal administrator will review it." });
    onClose();
  }

  return (
    <Dialog open={!!athlete} onOpenChange={(o) => { if (!o && !loading) onClose(); }}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Report {athlete?.name}</DialogTitle>
          <DialogDescription>Tell us what's wrong. Reports are private: the athlete is not told who sent it.</DialogDescription>
        </DialogHeader>
        <form onSubmit={(e) => void onSubmit(e)} noValidate className="flex flex-col gap-4">
          <fieldset>
            <legend className="mb-1.5 text-sm font-semibold">What are you reporting?</legend>
            <div className="grid gap-2">
              {REPORT_CONTENT_OPTIONS.map((o) => (
                <label key={o.value} className={cn("flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition", contentType === o.value ? "border-primary bg-primary/5" : "hover:bg-muted")}>
                  <input type="radio" name="report-content" value={o.value} checked={contentType === o.value} onChange={() => setContentType(o.value)} className="mt-1 h-4 w-4 accent-[var(--primary)]" />
                  <span><span className="block text-sm font-semibold">{o.label}</span><span className="block text-xs text-muted-foreground">{o.hint}</span></span>
                </label>
              ))}
            </div>
          </fieldset>

          <div>
            <label htmlFor="report-reason" className="mb-1.5 block text-sm font-semibold">Reason</label>
            <select id="report-reason" value={reason} onChange={(e) => setReason(e.target.value as ReportReason | "")} disabled={loading}
              className="h-11 w-full rounded-xl border bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30">
              <option value="">Choose a reason…</option>
              {REPORT_REASON_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>

          <div>
            <label htmlFor="report-details" className="mb-1.5 block text-sm font-semibold">Details <span className="font-normal text-muted-foreground">(optional)</span></label>
            <textarea id="report-details" value={details} onChange={(e) => setDetails(e.target.value)} maxLength={500} rows={3} disabled={loading}
              placeholder="What did you see?" className="w-full resize-none rounded-xl border bg-card p-3 text-sm outline-none focus:ring-2 focus:ring-primary/30" />
          </div>

          {error && <p role="alert" className="text-sm font-medium text-destructive">{error}</p>}

          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} disabled={loading} className={cn(btn.secondary, btn.sm)}>Cancel</button>
            <button type="submit" disabled={loading} className={cn(btn.primary, btn.sm)}>
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</> : <><Flag className="h-4 w-4" /> Send report</>}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
