// The School Representative's PDF report: one document with the school's numbers, the three charts as
// tables with bars, the pending coach requests, and the full coach and athlete lists.
//
// SERVER ONLY. Read-only. The school is ALWAYS the signed-in representative's own approved school. Every
// figure and name comes from the same functions as the Dashboard and the list pages (so the same school
// limit, the same privacy rules and the same statuses apply). It leaves out emails, credential numbers
// and review notes, and every download is written to the audit log.
//
// Built with pdf-lib (pure JavaScript, no files or native code, so it bundles into the API as is) using
// the PDF standard fonts. Those fonts only cover Latin text, so any other character is shown as "?"
// rather than failing the whole report. Each list is capped (REPORT_MAX_ROWS) and says so when it is.

import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type { Db } from "./db.server.ts";
import { audit, type PublicUser, type RequestMeta } from "./auth.server.ts";
import { getRepDashboard } from "./rep-dashboard.server.ts";
import { getRepCharts } from "./rep-charts.server.ts";
import { listRepCoaches } from "./rep-coaches.server.ts";
import { listRepAthletes } from "./rep-athletes.server.ts";
import { listCoachRequests } from "./rep-coach-requests.server.ts";

export const REPORT_MAX_ROWS = 500;

export interface ReportFile { fileName: string; bytes: Uint8Array; pages: number }

/* ------------------------------------------------------------------ text helpers */

const SOFT: Record<string, string> = { "\u2018": "'", "\u2019": "'", "\u201C": '"', "\u201D": '"', "\u2013": "-", "\u2014": "-", "\u2026": "...", "\u2022": "*", "\u00A0": " " };

/** Text the standard PDF fonts can draw: Latin letters stay, smart punctuation is simplified, anything else becomes "?". */
export function pdfText(s: string): string {
  return s.normalize("NFC")
    .replace(/[\u2018\u2019\u201C\u201D\u2013\u2014\u2026\u2022\u00A0]/g, (c) => SOFT[c] ?? c)
    .replace(/[\r\n\t]+/g, " ")
    .replace(/[^\x20-\x7E\xA1-\xFF]/g, "?");
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const longDate = (d: Date) => `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
const isoDay = (iso: string | null) => (iso ? iso.slice(0, 10) : "");
const monthName = (ym: string) => { const [y, m] = ym.split("-"); return `${MONTHS[Number(m) - 1]?.slice(0, 3) ?? ym} ${y}`; };
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "school";

/* ------------------------------------------------------------------ drawing */

const PAGE_W = 595.28, PAGE_H = 841.89, MARGIN = 40, TOP_BAND = 28, FOOTER = 34;
const NAVY = rgb(0.043, 0.137, 0.329), SKY = rgb(0.18, 0.61, 1), INK = rgb(0.1, 0.12, 0.16), MUTED = rgb(0.4, 0.44, 0.5);
const LINE = rgb(0.86, 0.88, 0.92), ZEBRA = rgb(0.955, 0.965, 0.99), WHITE = rgb(1, 1, 1);
const GREEN = rgb(0.13, 0.6, 0.36), RED = rgb(0.78, 0.22, 0.22), AMBER = rgb(0.9, 0.62, 0.1);
const CONTENT_W = PAGE_W - MARGIN * 2;

interface Column { title: string; width: number; align?: "right" }

class Doc {
  readonly pdf: PDFDocument;
  readonly font: PDFFont;
  readonly bold: PDFFont;
  page!: PDFPage;
  y = 0;
  readonly runningTitle: string;
  constructor(pdf: PDFDocument, font: PDFFont, bold: PDFFont, runningTitle: string) { this.pdf = pdf; this.font = font; this.bold = bold; this.runningTitle = runningTitle; }

  newPage(): void {
    this.page = this.pdf.addPage([PAGE_W, PAGE_H]);
    this.page.drawRectangle({ x: 0, y: PAGE_H - 8, width: PAGE_W, height: 8, color: NAVY });
    this.page.drawText(pdfText(this.runningTitle), { x: MARGIN, y: PAGE_H - TOP_BAND, size: 8, font: this.font, color: MUTED });
    this.y = PAGE_H - TOP_BAND - 18;
  }
  ensure(h: number): void { if (this.y - h < MARGIN + FOOTER) this.newPage(); }

  wrap(text: string, font: PDFFont, size: number, maxW: number): string[] {
    const out: string[] = [];
    for (const para of pdfText(text).split("\n")) {
      let line = "";
      for (const word of para.split(" ")) {
        let w = word;
        // a single word wider than the column is broken so it never overflows
        while (font.widthOfTextAtSize(w, size) > maxW && w.length > 1) {
          let cut = w.length - 1;
          while (cut > 1 && font.widthOfTextAtSize(w.slice(0, cut), size) > maxW) cut--;
          if (line) { out.push(line); line = ""; }
          out.push(w.slice(0, cut)); w = w.slice(cut);
        }
        const next = line ? `${line} ${w}` : w;
        if (line && font.widthOfTextAtSize(next, size) > maxW) { out.push(line); line = w; } else line = next;
      }
      out.push(line);
    }
    return out.length ? out : [""];
  }

  heading(title: string, note?: string): void {
    this.ensure(52);
    this.y -= 16;
    this.page.drawText(pdfText(title), { x: MARGIN, y: this.y, size: 13, font: this.bold, color: NAVY });
    this.y -= 6;
    this.page.drawLine({ start: { x: MARGIN, y: this.y }, end: { x: MARGIN + CONTENT_W, y: this.y }, thickness: 1.2, color: SKY });
    this.y -= 14;
    if (note) { for (const l of this.wrap(note, this.font, 8.5, CONTENT_W)) { this.ensure(12); this.page.drawText(l, { x: MARGIN, y: this.y, size: 8.5, font: this.font, color: MUTED }); this.y -= 11; } this.y -= 2; }
  }

  empty(message: string): void {
    this.ensure(18);
    this.page.drawText(pdfText(message), { x: MARGIN, y: this.y, size: 9, font: this.font, color: MUTED });
    this.y -= 18;
  }

  /** A table that continues across pages with its header repeated. `bars` draws a bar after the last column's numbers. */
  table(cols: Column[], rows: string[][], opts: { bar?: { width: number; segments: (row: number) => { value: number; color: ReturnType<typeof rgb> }[]; max: number }; colour?: (row: number, col: number) => ReturnType<typeof rgb> | undefined } = {}): void {
    const size = 9, lead = 11, pad = 5;
    const barW = opts.bar?.width ?? 0;
    const drawHeader = () => {
      this.page.drawRectangle({ x: MARGIN, y: this.y - 16, width: CONTENT_W, height: 18, color: NAVY });
      let x = MARGIN;
      for (const c of cols) {
        const w = this.bold.widthOfTextAtSize(pdfText(c.title), 8.5);
        this.page.drawText(pdfText(c.title), { x: c.align === "right" ? x + c.width - pad - w : x + pad, y: this.y - 11, size: 8.5, font: this.bold, color: WHITE });
        x += c.width;
      }
      this.y -= 18;
    };
    this.ensure(18 + 24);
    drawHeader();
    rows.forEach((row, ri) => {
      const lines = row.map((cell, ci) => this.wrap(cell, this.font, size, cols[ci]!.width - pad * 2));
      const h = Math.max(...lines.map((l) => l.length)) * lead + 8;
      if (this.y - h < MARGIN + FOOTER) { this.newPage(); drawHeader(); }
      if (ri % 2 === 1) this.page.drawRectangle({ x: MARGIN, y: this.y - h + 2, width: CONTENT_W, height: h, color: ZEBRA });
      let x = MARGIN;
      lines.forEach((ls, ci) => {
        const c = cols[ci]!;
        ls.forEach((l, li) => {
          const w = this.font.widthOfTextAtSize(l, size);
          this.page.drawText(l, { x: c.align === "right" ? x + c.width - pad - w : x + pad, y: this.y - 10 - li * lead, size, font: this.font, color: opts.colour?.(ri, ci) ?? INK });
        });
        x += c.width;
      });
      if (opts.bar) {
        let bx = MARGIN + CONTENT_W - barW + 4;
        for (const seg of opts.bar.segments(ri)) {
          const w = (seg.value / opts.bar.max) * (barW - 12);
          if (w > 0) { this.page.drawRectangle({ x: bx, y: this.y - 9, width: w, height: 7, color: seg.color }); bx += w; }
        }
      }
      this.y -= h;
      this.page.drawLine({ start: { x: MARGIN, y: this.y + 2 }, end: { x: MARGIN + CONTENT_W, y: this.y + 2 }, thickness: 0.4, color: LINE });
    });
    this.y -= 6;
  }
}

/* ------------------------------------------------------------------ the report */

export async function buildRepReport(user: PublicUser, meta: Partial<RequestMeta> = {}, dbArg?: Db, opts: { maxRows?: number } = {}): Promise<ReportFile> {
  const max = opts.maxRows ?? REPORT_MAX_ROWS;
  const page = { limit: max, offset: 0 };
  const dash = await getRepDashboard(user, dbArg);
  const [charts, coaches, athletes, pending] = await Promise.all([
    getRepCharts(user, dbArg),
    listRepCoaches(user, { status: "affiliated", ...page }, dbArg),   // the same coaches as the "Total coaches" card; pending applicants have their own section
    listRepAthletes(user, page, dbArg),
    listCoachRequests(user, { status: "pending", ...page }, dbArg),
  ]);

  const now = new Date();
  const school = dash.school.name;
  const pdf = await PDFDocument.create();
  pdf.setTitle(pdfText(`${school} - School report`));
  pdf.setAuthor("Sportal");
  pdf.setSubject("School representative report");
  pdf.setCreationDate(now);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const d = new Doc(pdf, font, bold, `Sportal  |  ${school}  |  School report`);

  // ---- title block
  d.newPage();
  d.page.drawRectangle({ x: 0, y: PAGE_H - 118, width: PAGE_W, height: 118, color: NAVY });
  d.page.drawText("SPORTAL", { x: MARGIN, y: PAGE_H - 44, size: 11, font: bold, color: SKY });
  d.page.drawText("School report", { x: MARGIN, y: PAGE_H - 78, size: 26, font: bold, color: WHITE });
  d.y = PAGE_H - 150;
  for (const l of d.wrap(school, bold, 17, CONTENT_W)) { d.page.drawText(l, { x: MARGIN, y: d.y, size: 17, font: bold, color: NAVY }); d.y -= 21; }
  const sub = [dash.school.location, `Prepared for ${dash.rep.name}${dash.rep.designation ? `, ${dash.rep.designation}` : ""}`, `Generated on ${longDate(now)}`].filter(Boolean);
  for (const s of sub) { d.page.drawText(pdfText(s), { x: MARGIN, y: d.y, size: 9.5, font, color: MUTED }); d.y -= 14; }
  d.y -= 6;

  // ---- overview
  d.heading("Overview");
  const boxes: [string, number][] = [["Total coaches", dash.stats.totalCoaches], ["Total athletes", dash.stats.totalAthletes], ["Pending coach requests", dash.stats.pendingCoachRequests], ["Active coaches", dash.stats.activeCoaches]];
  const gap = 10, bw = (CONTENT_W - gap * 3) / 4;
  d.ensure(66);
  boxes.forEach(([label, value], i) => {
    const x = MARGIN + i * (bw + gap);
    d.page.drawRectangle({ x, y: d.y - 54, width: bw, height: 54, color: ZEBRA, borderColor: LINE, borderWidth: 0.8 });
    d.page.drawText(String(value), { x: x + 10, y: d.y - 30, size: 22, font: bold, color: NAVY });
    d.page.drawText(pdfText(label), { x: x + 10, y: d.y - 46, size: 8, font, color: MUTED });
  });
  d.y -= 66;
  for (const l of d.wrap("Total athletes counts athletes confirmed by a verified coach of your school. The athletes list below also includes athletes who named your school on their profile but are not yet verified.", font, 8, CONTENT_W)) { d.page.drawText(l, { x: MARGIN, y: d.y, size: 8, font, color: MUTED }); d.y -= 10; }

  // ---- charts, as tables with bars
  d.heading("Athletes by sport");
  if (charts.athletesBySport.length === 0) d.empty("No athletes are linked to your school yet.");
  else {
    const top = Math.max(1, ...charts.athletesBySport.map((a) => a.verified + a.unverified));
    d.table([{ title: "Sport", width: 150 }, { title: "Verified", width: 62, align: "right" }, { title: "Not yet verified", width: 90, align: "right" }, { title: "Total", width: 52, align: "right" }, { title: "", width: CONTENT_W - 354 }],
      charts.athletesBySport.map((a) => [a.sport, String(a.verified), String(a.unverified), String(a.verified + a.unverified), ""]),
      { bar: { width: CONTENT_W - 354, max: top, segments: (i) => [{ value: charts.athletesBySport[i]!.verified, color: NAVY }, { value: charts.athletesBySport[i]!.unverified, color: SKY }] } });
  }
  d.heading("Coaches by sport");
  if (charts.coachesBySport.length === 0) d.empty("No coaches are affiliated with your school yet.");
  else {
    const top = Math.max(1, ...charts.coachesBySport.map((c) => c.count));
    d.table([{ title: "Sport", width: 150 }, { title: "Coaches", width: 62, align: "right" }, { title: "", width: CONTENT_W - 212 }],
      charts.coachesBySport.map((c) => [c.sport, String(c.count), ""]),
      { bar: { width: CONTENT_W - 212, max: top, segments: (i) => [{ value: charts.coachesBySport[i]!.count, color: NAVY }] } });
  }
  d.heading("Coach requests, last 6 months");
  const months = charts.requestsByMonth;
  d.table([{ title: "Month", width: 150 }, { title: "Approved", width: 70, align: "right" }, { title: "Rejected", width: 70, align: "right" }, { title: "Pending", width: 70, align: "right" }, { title: "Received", width: 70, align: "right" }],
    months.map((m) => [monthName(m.month), String(m.approved), String(m.rejected), String(m.pending), String(m.approved + m.rejected + m.pending)]));

  // ---- lists
  const capNote = (shown: number, total: number) => (total > shown ? `Showing the first ${shown} of ${total}.` : undefined);
  d.heading(`Pending coach requests (${pending.total})`, capNote(pending.items.length, pending.total));
  if (pending.items.length === 0) d.empty("No coach requests are waiting for your school.");
  else d.table([{ title: "Applicant", width: 170 }, { title: "Sport", width: 110 }, { title: "Position", width: 140 }, { title: "Applied", width: CONTENT_W - 420, align: "right" }],
    pending.items.map((r) => [r.name, r.sport || "-", r.position || "-", isoDay(r.appliedAt)]));

  const STATUS = { affiliated: "Affiliated", pending: "Pending", removed: "Removed" } as const;   // every coach listed here is affiliated; "(suspended)" marks a suspended account
  d.heading(`Coaches (${coaches.total})`, capNote(coaches.items.length, coaches.total));
  if (coaches.items.length === 0) d.empty("No coaches are linked to your school yet.");
  else d.table([{ title: "Name", width: 160 }, { title: "Sport", width: 95 }, { title: "Position", width: 115 }, { title: "Affiliation", width: CONTENT_W - 370 }],
    coaches.items.map((c) => [c.name, c.sport || "-", c.position || "-", STATUS[c.status] + (c.accountActive ? "" : " (suspended)")]),
    { colour: (ri, ci) => (ci === 3 ? (coaches.items[ri]!.status === "affiliated" ? GREEN : coaches.items[ri]!.status === "pending" ? AMBER : MUTED) : undefined) });

  d.heading(`Athletes (${athletes.total})`, capNote(athletes.items.length, athletes.total));
  if (athletes.items.length === 0) d.empty("No student-athletes are linked to your school yet.");
  else d.table([{ title: "Name", width: 125 }, { title: "Sport", width: 72 }, { title: "Position", width: 78 }, { title: "Year level", width: 52 }, { title: "Assigned coach", width: 90 }, { title: "Verification", width: CONTENT_W - 417 }],
    athletes.items.map((a) => [a.name, a.sport || "-", a.position || "-", a.yearLevel || "-", a.coaches.join(", ") || "Unassigned", a.verification === "verified" ? "Verified" : "Not yet verified"]),
    { colour: (ri, ci) => (ci === 5 ? (athletes.items[ri]!.verification === "verified" ? GREEN : AMBER) : undefined) });

  // ---- footer on every page, now that the page count is known
  const pages = pdf.getPages();
  pages.forEach((p, i) => {
    p.drawLine({ start: { x: MARGIN, y: MARGIN + 14 }, end: { x: PAGE_W - MARGIN, y: MARGIN + 14 }, thickness: 0.5, color: LINE });
    p.drawText("Confidential: contains personal information about students and coaches. Share only with people who need it.", { x: MARGIN, y: MARGIN + 2, size: 7, font, color: MUTED });
    const label = `Page ${i + 1} of ${pages.length}`;
    p.drawText(label, { x: PAGE_W - MARGIN - font.widthOfTextAtSize(label, 8), y: MARGIN + 2, size: 8, font, color: MUTED });
  });

  const bytes = await pdf.save();
  await audit("rep.report_generated", { userId: user.id, ...meta, detail: { coaches: coaches.items.length, athletes: athletes.items.length, pendingRequests: pending.items.length } }, dbArg);
  return { fileName: `sportal-report-${slug(school)}-${now.toISOString().slice(0, 10)}.pdf`, bytes, pages: pages.length };
}
