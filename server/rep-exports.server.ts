// School Representative CSV exports: coaches, athletes and coach requests of the representative's OWN school.
//
// SERVER ONLY. Read-only. Each export is exactly what the matching page lists for the same search and
// filters (it calls the same list functions, so the same school limit, the same privacy rules and the
// same statuses apply), but all matching rows instead of one page, up to EXPORT_MAX.
//
// What is NOT exported: athletes' emails (the athletes page never shows them), credential reference
// numbers and review notes of coach requests. Every download is written to the audit log.
//
// CSV safety: a cell that starts with = + - @ (or a tab / carriage return) is prefixed with an apostrophe so
// spreadsheet programs show it as text instead of running it as a formula; quotes, commas and line breaks
// are escaped; the file starts with a byte-order mark so Excel reads non-English names correctly.

import type { Db } from "./db.server.ts";
import { audit, type PublicUser, type RequestMeta } from "./auth.server.ts";
import { AFFILIATION_STATUSES, listRepCoaches, type AffiliationStatus } from "./rep-coaches.server.ts";
import { VERIFICATION_STATUSES, listRepAthletes, type AthleteVerification } from "./rep-athletes.server.ts";
import { REQUEST_STATUSES, listCoachRequests, type RequestStatus } from "./rep-coach-requests.server.ts";
import { RepDashboardError } from "./rep-dashboard.server.ts";

export const EXPORT_MAX = 10_000;

export type ExportKind = "coaches" | "athletes" | "coach-requests";
export const EXPORT_KINDS: readonly ExportKind[] = ["coaches", "athletes", "coach-requests"];

export interface ExportFile { fileName: string; csv: string; rows: number }

/** One CSV cell, made safe for spreadsheets. */
export function csvCell(value: unknown): string {
  let s = value === null || value === undefined ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(header: string[], rows: unknown[][]): string {
  return "\uFEFF" + [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\r\n") + "\r\n";
}

const day = (iso: string | null) => (iso ? iso.slice(0, 10) : "");
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "school";
const fileName = (kind: ExportKind, school: string) => `sportal-${kind}-${slug(school)}-${new Date().toISOString().slice(0, 10)}.csv`;

const COACH_STATUS: Record<AffiliationStatus, string> = { affiliated: "Affiliated", pending: "Pending", removed: "Removed" };
/** A "Not submitted" row shows the date the coach signed up in the date column. */
const REQUEST_STATUS: Record<RequestStatus, string> = { pending: "Pending", approved: "Approved", rejected: "Rejected", incomplete: "Not submitted" };

export interface ExportFilters { q?: string | undefined; sport?: string | undefined; status?: string | undefined }

export async function exportRepData(user: PublicUser, kind: ExportKind, f: ExportFilters, meta: Partial<RequestMeta> = {}, db?: Db): Promise<ExportFile> {
  const allowed: readonly string[] = kind === "coaches" ? AFFILIATION_STATUSES : kind === "athletes" ? VERIFICATION_STATUSES : REQUEST_STATUSES;
  if (f.status && !allowed.includes(f.status)) throw new RepDashboardError(400, "validation", `status must be one of: ${allowed.join(", ")}.`);
  const page = { limit: EXPORT_MAX, offset: 0 };
  let school = "";
  let out: { header: string[]; rows: unknown[][] };

  if (kind === "coaches") {
    const r = await listRepCoaches(user, { q: f.q, sport: f.sport, status: (f.status || undefined) as AffiliationStatus | undefined, ...page }, db);
    school = r.school.name;
    out = {
      header: ["Name", "Email", "Sport", "Position", "Affiliation", "Account"],
      rows: r.items.map((c) => [c.name, c.email, c.sport, c.position, COACH_STATUS[c.status], c.accountActive ? "Active" : "Suspended"]),
    };
  } else if (kind === "athletes") {
    const r = await listRepAthletes(user, { q: f.q, sport: f.sport, status: (f.status || undefined) as AthleteVerification | undefined, ...page }, db);
    school = r.school.name;
    out = {
      header: ["Name", "Sport", "Playing position", "Year level", "Assigned coach", "Verification"],
      rows: r.items.map((a) => [a.name, a.sport, a.position, a.yearLevel, a.coaches.join("; "), a.verification === "verified" ? "Verified" : "Not yet verified"]),
    };
  } else {
    const r = await listCoachRequests(user, { q: f.q, status: (f.status || undefined) as RequestStatus | undefined, ...page }, db);
    school = r.school.name;
    out = {
      header: ["Applicant", "Email", "Sport", "Position", "Credential type", "Application date", "Status", "Decision date", "Reason given"],
      rows: r.items.map((c) => [c.name, c.email, c.sport, c.position, c.credentialType, day(c.appliedAt), REQUEST_STATUS[c.status], day(c.decidedAt), c.reason]),
    };
  }

  await audit("rep.export_downloaded", { userId: user.id, ...meta, detail: { kind, rows: out.rows.length } }, db);
  return { fileName: fileName(kind, school), csv: toCsv(out.header, out.rows), rows: out.rows.length };
}
