// Unit tests for the numbers the Performance and Profile pages work out from the athlete's sessions.
import { describe, expect, it } from "vitest";
import { buildTrend, summarizeSkills } from "@/lib/performanceStats";
import { shortDate } from "@/lib/sessionStore";
import type { PerformanceSession } from "@/types";

const s = (id: string, iso: string, skill: string, result: number, consistency: number | null): PerformanceSession =>
  ({ id, date: iso, isoDate: iso, skill, result, consistency, status: "AI-Assessed" }) as PerformanceSession;

const today = new Date(2026, 10, 7);
const list = [
  s("1", "2026-09-20", "shooting", 60, 55), s("2", "2026-10-05", "shooting", 70, 65), s("3", "2026-10-20", "shooting", 76, 70),
  s("4", "2026-11-01", "shooting", 82, 78), s("5", "2026-11-03", "vertical", 72, null), s("6", "2026-11-05", "passing", 80, null),
];

describe("buildTrend", () => {
  it("is empty with no sessions", () => expect(buildTrend([], "last10", today)).toEqual([]));
  it("last5 is the five newest sessions, oldest first, and leaves out vertical jump (cm)", () => {
    const t = buildTrend(list, "last5", today);
    expect(t.map((p) => p.score)).toEqual([60, 70, 76, 82, 80]);
    expect(t[4]?.consistency).toBeNull();
    expect(t.map((p) => p.label)).toEqual(["S1", "S2", "S3", "S4", "S5"]);
  });
  it("month averages the last four weeks and skips empty weeks", () => {
    expect(buildTrend(list, "month", today).map((p) => [p.label, p.score])).toEqual([["Wk 2", 76], ["Wk 4", 81]]);
  });
  it("season averages by calendar month", () => {
    expect(buildTrend(list, "season", today).map((p) => [p.label, p.score])).toEqual([["Sep", 60], ["Oct", 73], ["Nov", 81]]);
  });
});

describe("summarizeSkills", () => {
  it("summarizes only the skills with sessions", () => {
    const r = summarizeSkills(list);
    expect(Object.keys(r).sort()).toEqual(["passing", "shooting", "vertical"]);
    expect(r.shooting).toMatchObject({ primaryValue: "82%", improvement: 22, sessions: 4 });
    expect(r.vertical?.primaryValue).toBe("72 cm");
    expect(r.passing?.consistency).toBeNull();
  });
});

describe("shortDate", () => {
  it("formats a calendar day without time zone maths", () => expect(shortDate("2026-10-29")).toBe("Oct 29"));
});
