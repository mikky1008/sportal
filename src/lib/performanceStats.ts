// Numbers the Performance and Profile pages show, worked out from the athlete's own sessions.
// Pure functions: nothing here stores or fetches anything.

import type { PerformanceSession, SkillId } from "@/types";
import { formatResult, isPercentSkill } from "@/lib/skills";

export type TrendRange = "last5" | "last10" | "month" | "season";
export interface TrendPoint { label: string; score: number; consistency: number | null }

const DAY_MS = 86_400_000;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Sessions with a calendar date, oldest first. Heights (cm) and times (s) can't share a % chart. */
function chartable(sessions: PerformanceSession[]): (PerformanceSession & { isoDate: string })[] {
  return sessions
    .filter((s): s is PerformanceSession & { isoDate: string } => !!s.isoDate && isPercentSkill(s.skill))
    .sort((a, b) => (a.isoDate < b.isoDate ? -1 : a.isoDate > b.isoDate ? 1 : 0));
}

const avg = (xs: number[]): number => Math.round(xs.reduce((a, b) => a + b, 0) / xs.length);

function bucket(label: string, group: PerformanceSession[]): TrendPoint | null {
  if (group.length === 0) return null;
  const cons = group.map((s) => s.consistency).filter((c): c is number => c !== null);
  return { label, score: avg(group.map((s) => s.result)), consistency: cons.length ? avg(cons) : null };
}

const dayNumber = (iso: string) => Math.floor(Date.parse(`${iso}T00:00:00Z`) / DAY_MS);

/**
 * last5 / last10: one point per session. month: the last four weeks, one point per week that has
 * sessions. season: the last five calendar months, one point per month that has sessions.
 */
export function buildTrend(sessions: PerformanceSession[], range: TrendRange, today: Date = new Date()): TrendPoint[] {
  const list = chartable(sessions);
  if (range === "last5" || range === "last10") {
    const n = range === "last5" ? 5 : 10;
    return list.slice(-n).map((s, i) => ({ label: `S${i + 1}`, score: s.result, consistency: s.consistency }));
  }
  const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  if (range === "month") {
    const end = dayNumber(todayIso);
    const out: TrendPoint[] = [];
    for (let w = 0; w < 4; w++) {
      const from = end - 27 + w * 7;
      const to = from + 6;
      const p = bucket(`Wk ${w + 1}`, list.filter((s) => { const d = dayNumber(s.isoDate); return d >= from && d <= to; }));
      if (p) out.push(p);
    }
    return out;
  }
  const out: TrendPoint[] = [];
  for (let back = 4; back >= 0; back--) {
    const d = new Date(today.getFullYear(), today.getMonth() - back, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const p = bucket(MONTHS[d.getMonth()] ?? key, list.filter((s) => s.isoDate.startsWith(key)));
    if (p) out.push(p);
  }
  return out;
}

export interface SkillSummary {
  /** the latest result, e.g. "82%", "72 cm" or "10.6 s" */
  primaryValue: string;
  /** average consistency of the latest sessions that measured it, or null when none did */
  consistency: number | null;
  /** latest result minus the oldest of the last five, in points (0 with a single session) */
  improvement: number;
  sessions: number;
}

/** One summary per skill the athlete has at least one session for. */
export function summarizeSkills(sessions: PerformanceSession[]): Partial<Record<SkillId, SkillSummary>> {
  const bySkill = new Map<SkillId, PerformanceSession[]>();
  for (const s of sessions) bySkill.set(s.skill, [...(bySkill.get(s.skill) ?? []), s]);
  const out: Partial<Record<SkillId, SkillSummary>> = {};
  for (const [skill, all] of bySkill) {
    // newest first; sessions without a date keep the order they came in
    const list = [...all].sort((a, b) => ((b.isoDate ?? "") < (a.isoDate ?? "") ? -1 : (b.isoDate ?? "") > (a.isoDate ?? "") ? 1 : 0));
    const latest = list[0];
    if (!latest) continue;
    const recent = list.slice(0, 5);
    const oldest = recent[recent.length - 1] ?? latest;
    const cons = recent.map((s) => s.consistency).filter((c): c is number => c !== null);
    out[skill] = {
      primaryValue: formatResult(skill, latest.result),
      consistency: cons.length ? avg(cons) : null,
      improvement: Math.round(latest.result - oldest.result),
      sessions: all.length,
    };
  }
  return out;
}
