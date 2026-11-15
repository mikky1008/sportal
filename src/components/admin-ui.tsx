import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Small pieces shared by the administrator pages, so they all look the same. Navy, sky blue and white. */

export const adminCard = "rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(10,31,68,0.04),0_4px_16px_rgba(10,31,68,0.05)]";

export const adminBtn =
  "inline-flex h-9 items-center justify-center gap-1.5 rounded-full px-4 text-sm font-semibold transition disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400";

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

export type PillStatus = "active" | "approved" | "pending" | "suspended" | "rejected";

const PILL: Record<PillStatus, { chip: string; dot: string; label: string }> = {
  active: { chip: "bg-sky-50 text-sky-700 ring-sky-200", dot: "bg-sky-500", label: "Active" },
  approved: { chip: "bg-sky-50 text-sky-700 ring-sky-200", dot: "bg-sky-500", label: "Approved" },
  pending: { chip: "bg-amber-50 text-amber-700 ring-amber-200", dot: "bg-amber-500", label: "Pending" },
  suspended: { chip: "bg-red-50 text-red-700 ring-red-200", dot: "bg-red-500", label: "Suspended" },
  rejected: { chip: "bg-red-50 text-red-700 ring-red-200", dot: "bg-red-500", label: "Rejected" },
};

export function StatusPill({ status }: { status: PillStatus }) {
  const s = PILL[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset", s.chip)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} /> {s.label}
    </span>
  );
}
