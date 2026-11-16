import type { ReactNode } from "react";
import { TrendingUp, type LucideIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/** Small pieces shared by the administrator pages, so they all look the same. Navy, sky blue and white. */

export const adminCard = "rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(10,31,68,0.04),0_4px_16px_rgba(10,31,68,0.05)]";

export const adminBtn =
  "inline-flex h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-4 text-sm font-semibold transition disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400";

export const fmtDate = (iso: string) => new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
export const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });

export function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "h-9 whitespace-nowrap rounded-full px-4 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400",
        active ? "bg-[#0a1f44] text-white shadow-sm" : "border border-slate-200 bg-white text-slate-600 hover:border-sky-300 hover:text-[#0a1f44]",
      )}
    >
      {children}
    </button>
  );
}

export type PillStatus = "active" | "approved" | "pending" | "suspended" | "rejected" | "investigating" | "resolved" | "dismissed";

const PILL: Record<PillStatus, { chip: string; dot: string; label: string }> = {
  active: { chip: "bg-sky-50 text-sky-700 ring-sky-200", dot: "bg-sky-500", label: "Active" },
  approved: { chip: "bg-sky-50 text-sky-700 ring-sky-200", dot: "bg-sky-500", label: "Approved" },
  pending: { chip: "bg-amber-50 text-amber-700 ring-amber-200", dot: "bg-amber-500", label: "Pending" },
  suspended: { chip: "bg-red-50 text-red-700 ring-red-200", dot: "bg-red-500", label: "Suspended" },
  rejected: { chip: "bg-red-50 text-red-700 ring-red-200", dot: "bg-red-500", label: "Rejected" },
  investigating: { chip: "bg-sky-100 text-[#0a1f44] ring-sky-300", dot: "bg-[#0f3160]", label: "Investigating" },
  resolved: { chip: "bg-sky-50 text-sky-700 ring-sky-200", dot: "bg-sky-500", label: "Resolved" },
  dismissed: { chip: "bg-slate-100 text-slate-600 ring-slate-200", dot: "bg-slate-400", label: "Dismissed" },
};

export function StatusPill({ status }: { status: PillStatus }) {
  const s = PILL[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset", s.chip)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} /> {s.label}
    </span>
  );
}

/** A headline number. `featured` fills it navy so the one thing that needs attention stands out. */
export function AdminStatCard({ label, value, hint, icon: Icon, featured = false }: {
  label: string; value: number | null; hint?: string; icon: LucideIcon; featured?: boolean;
}) {
  return (
    <div className={cn(adminCard, "relative overflow-hidden p-5 transition-shadow hover:shadow-[0_8px_24px_rgba(10,31,68,0.12)]", featured && "border-transparent bg-gradient-to-br from-[#0a1f44] to-[#0f3160] text-white")}>
      <div className="flex items-start justify-between gap-3">
        <p className={cn("text-xs font-semibold uppercase tracking-[0.14em]", featured ? "text-sky-300" : "text-slate-500")}>{label}</p>
        <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl", featured ? "bg-white/10 text-sky-300" : "bg-sky-50 text-sky-600")}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
      {value === null ? (
        <Skeleton className="mt-3 h-10 w-24" />
      ) : (
        <p className={cn("mt-2 font-display text-4xl font-bold tabular-nums leading-none", featured ? "text-white" : "text-[#0a1f44]")}>{value.toLocaleString()}</p>
      )}
      {hint && value !== null && (
        <p className={cn("mt-3 flex items-center gap-1.5 text-xs font-medium", featured ? "text-sky-200" : "text-slate-500")}>
          <TrendingUp className={cn("h-3.5 w-3.5", featured ? "text-sky-300" : "text-sky-500")} /> {hint}
        </p>
      )}
    </div>
  );
}
