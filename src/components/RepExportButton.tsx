import { useState } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { btn } from "@/components/common";
import { downloadRepCsv, type ExportFilters, type ExportKind } from "@/lib/repExportApi";
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
