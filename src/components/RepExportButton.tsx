import { useState } from "react";
import { Download, FileText } from "lucide-react";
import { toast } from "sonner";
import { btn } from "@/components/common";
import { downloadRepCsv, downloadRepReport, type ExportFilters, type ExportKind } from "@/lib/repExportApi";
import { cn } from "@/lib/utils";

/** "Export CSV": downloads everything the page lists for the current search and filters (not just the visible page). */
export function RepExportButton({ kind, filters, noun }: { kind: ExportKind; filters: ExportFilters; noun: string }) {
  const [busy, setBusy] = useState(false);
  async function go() {
    setBusy(true);
    const r = await downloadRepCsv(kind, filters);
    setBusy(false);
    if (r.ok) toast.success(`Downloaded ${r.fileName}`);
    else toast.error(r.message);
  }
  return (
    <button
      type="button" onClick={() => void go()} disabled={busy}
      title={`Download the ${noun} matching your current search and filters as a CSV file`}
      className={cn(btn.secondary, btn.sm, "inline-flex items-center gap-2 self-start sm:self-auto")}
    >
      <Download className="h-4 w-4" aria-hidden="true" />
      {busy ? "Preparing…" : "Export CSV"}
    </button>
  );
}

/** "Download PDF report": the school's numbers, charts as tables, and the coach and athlete lists. Made for the navy Dashboard banner. */
export function RepReportButton({ className }: { className?: string }) {
  const [busy, setBusy] = useState(false);
  async function go() {
    setBusy(true);
    const r = await downloadRepReport();
    setBusy(false);
    if (r.ok) toast.success(`Downloaded ${r.fileName}`);
    else toast.error(r.message);
  }
  return (
    <button
      type="button" onClick={() => void go()} disabled={busy}
      title="Download a PDF report of your school: numbers, charts, coaches and athletes"
      className={cn("inline-flex items-center gap-2 rounded-xl bg-white/10 px-3.5 py-2 text-sm font-semibold text-white ring-1 ring-white/25 transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-60", className)}
    >
      <FileText className="h-4 w-4" aria-hidden="true" />
      {busy ? "Preparing report…" : "Download PDF report"}
    </button>
  );
}
