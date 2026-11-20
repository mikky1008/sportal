import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { Card, EmptyState, btn } from "@/components/common";
import { fetchRepCharts, type RepCharts as Charts } from "@/lib/repDashboardApi";
import { cn } from "@/lib/utils";

/* ---------------------------------------------------------------------------------------------
   The School Representative Dashboard's charts (no chart library: plain bars, so they are light,
   match the navy / sky blue branding, and read well on a phone).
   Numbers come from GET /api/rep/charts, which uses the same rules as the My Athletes, My Coaches and
   Coach Requests pages for the representative's own school. Every chart also has a text version for
   screen readers.
--------------------------------------------------------------------------------------------- */

function Legend({ items }: { items: { label: string; className: string }[] }) {
  return (
    <ul className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground" aria-hidden="true">
      {items.map((i) => (
        <li key={i.label} className="flex items-center gap-1.5"><span className={cn("h-2.5 w-2.5 rounded-sm", i.className)} />{i.label}</li>
      ))}
    </ul>
  );
}

/** One horizontal bar per sport, made of coloured parts. */
function SportBars({ rows, parts, unit }: {
  rows: { label: string; values: number[] }[];
  parts: { name: string; className: string }[];
  unit: string;
}) {
  const max = Math.max(1, ...rows.map((r) => r.values.reduce((a, b) => a + b, 0)));
  return (
    <ul className="flex flex-col gap-3">
      {rows.map((r) => {
        const total = r.values.reduce((a, b) => a + b, 0);
        return (
          <li key={r.label}>
            <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
              <span className="min-w-0 truncate font-medium">{r.label}</span>
              <span className="shrink-0 font-semibold tabular-nums">{total}</span>
            </div>
            <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted" aria-hidden="true">
              {r.values.map((v, i) => v > 0 && <span key={parts[i]!.name} className={parts[i]!.className} style={{ width: `${(v / max) * 100}%` }} />)}
            </div>
            <span className="sr-only">
              {r.label}: {total} {unit}{parts.length > 1 ? ` (${r.values.map((v, i) => `${v} ${parts[i]!.name.toLowerCase()}`).join(", ")})` : ""}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

const monthLabel = (m: string, long = false) => {
  try { return format(parseISO(`${m}-01`), long ? "MMMM yyyy" : "MMM"); } catch { return m; }
};

/** Six columns, one per month, stacked by outcome. */
function MonthColumns({ months }: { months: Charts["requestsByMonth"] }) {
  const totals = months.map((m) => m.approved + m.rejected + m.pending);
  const max = Math.max(1, ...totals);
  return (
    <>
      <ul className="grid h-44 grid-cols-6 items-end gap-2" aria-hidden="true">
        {months.map((m, i) => (
          <li key={m.month} className="flex h-full flex-col items-center justify-end gap-1">
            <span className="text-xs font-semibold tabular-nums">{totals[i] || ""}</span>
            <div className="flex w-full max-w-10 flex-col-reverse overflow-hidden rounded-t-md" style={{ height: `${(totals[i]! / max) * 100}%`, minHeight: totals[i] ? 6 : 0 }}>
              {m.approved > 0 && <span className="bg-success" style={{ flexGrow: m.approved }} />}
              {m.rejected > 0 && <span className="bg-destructive/70" style={{ flexGrow: m.rejected }} />}
              {m.pending > 0 && <span className="bg-warning" style={{ flexGrow: m.pending }} />}
            </div>
          </li>
        ))}
      </ul>
      <ul className="mt-2 grid grid-cols-6 gap-2 text-center text-xs text-muted-foreground" aria-hidden="true">
        {months.map((m) => <li key={m.month}>{monthLabel(m.month)}</li>)}
      </ul>
      <ul className="sr-only">
        {months.map((m, i) => (
          <li key={m.month}>{monthLabel(m.month, true)}: {totals[i]} received ({m.approved} approved, {m.rejected} rejected, {m.pending} pending)</li>
        ))}
      </ul>
    </>
  );
}

type State = { kind: "loading" } | { kind: "error" } | { kind: "ready"; charts: Charts };

export function RepCharts() {
  const [state, setState] = useState<State>({ kind: "loading" });
  const load = () => {
    setState({ kind: "loading" });
    void fetchRepCharts().then((r) => setState(r.ok ? { kind: "ready", charts: r.data.charts } : { kind: "error" }));
  };
  useEffect(load, []);

  if (state.kind === "loading")
    return (
      <div role="status" aria-label="Loading charts" className="grid gap-6 lg:grid-cols-3">
        {[0, 1, 2].map((i) => <div key={i} className="h-64 animate-pulse rounded-2xl bg-muted" />)}
      </div>
    );
  if (state.kind === "error")
    return (
      <div role="alert" className="surface flex flex-col items-center gap-3 px-6 py-8 text-center">
        <p className="text-sm text-muted-foreground">The charts couldn't load.</p>
        <button type="button" className={cn(btn.secondary, btn.sm)} onClick={load}>Try again</button>
      </div>
    );

  const { athletesBySport, coachesBySport, requestsByMonth } = state.charts;
  const noRequests = requestsByMonth.every((m) => m.approved + m.rejected + m.pending === 0);
  return (
    <section aria-label="Charts" className="grid gap-6 lg:grid-cols-3">
      <Card title="Athletes by sport">
        {athletesBySport.length === 0 ? <EmptyState message="No athletes are linked to your school yet." /> : (
          <>
            <Legend items={[{ label: "Verified", className: "bg-primary" }, { label: "Not yet verified", className: "bg-electric" }]} />
            <SportBars
              rows={athletesBySport.map((a) => ({ label: a.sport, values: [a.verified, a.unverified] }))}
              parts={[{ name: "Verified", className: "bg-primary" }, { name: "Not yet verified", className: "bg-electric" }]} unit="athletes"
            />
          </>
        )}
      </Card>
      <Card title="Coaches by sport">
        {coachesBySport.length === 0 ? <EmptyState message="No coaches are affiliated with your school yet." /> : (
          <SportBars rows={coachesBySport.map((c) => ({ label: c.sport, values: [c.count] }))} parts={[{ name: "Coaches", className: "bg-primary" }]} unit="coaches" />
        )}
      </Card>
      <Card title="Coach requests, last 6 months">
        {noRequests ? <EmptyState message="No coach requests in the last six months." /> : (
          <>
            <Legend items={[{ label: "Approved", className: "bg-success" }, { label: "Rejected", className: "bg-destructive/70" }, { label: "Pending", className: "bg-warning" }]} />
            <MonthColumns months={requestsByMonth} />
          </>
        )}
      </Card>
    </section>
  );
}
