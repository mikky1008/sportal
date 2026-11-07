import { Link } from "@/router-compat";
import { Page } from "@/components/Page";
import { useState } from "react";
import { Plus } from "lucide-react";
import { skills } from "@/data/mock";
import { useSessions } from "@/lib/sessionStore";
import { Card, PageHeader, btn } from "@/components/common";
import { HistoryList, PerformanceChart, TrustLegend } from "@/components/performance";
import { cn } from "@/lib/utils";


function Performance() {
  const sessions = useSessions();
  const [filter, setFilter] = useState<string>("all");
  const items = filter === "all" ? sessions : sessions.filter((s) => s.skill === filter);
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Performance" subtitle="Track progress across every session." action={<Link to="/performance/new" className={btn.primary}><Plus className="h-4 w-4" />Start New Practice</Link>} />
      <TrustLegend />
      <PerformanceChart sessions={sessions} />
      <Card title="Performance History">
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
          {[{ id: "all", name: "All" }, ...skills].map((s) => (
            <button key={s.id} onClick={() => setFilter(s.id)} className={cn("whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold", filter === s.id ? "border-primary bg-primary text-primary-foreground" : "bg-card text-muted-foreground")}>
              {s.name}
            </button>
          ))}
        </div>
        {items.length ? <HistoryList items={items} /> : <p className="py-8 text-center text-sm text-muted-foreground">No sessions for this skill yet.</p>}
      </Card>
    </div>
  );
}

export default function PerformancePage() {
  return (
    <Page title="Performance">
      <Performance />
    </Page>
  );
}
