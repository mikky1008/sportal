// School Representative messages and announcements: a one-way message from the representative to the
// coaches and athletes of their OWN school.
//
// SERVER ONLY. The school is ALWAYS the signed-in representative's own approved school. Who can be reached
// is exactly who the representative can already see on their pages, found with the same functions:
//   - coaches   affiliated coaches with an active account (the My Coaches list, "Affiliated")
//   - athletes  everyone on the My Athletes list (visible showcase, active account);
//               "verified_athletes" is the part a verified coach of the school has confirmed
//   - everyone  coaches and athletes together
//   - person    ONE coach or athlete of the school, picked by id (anyone else is "not found")
// Each can be narrowed to one sport. Hidden showcases, suspended accounts, pending applicants and other
// schools' people can never be reached.
//
// Delivery is one notification per recipient (category "system"), saved in a single transaction with a row
// in rep_messages (the sender's history) and an audit entry. The notification names the sender, their
// position and the school, so the recipient knows who it is from. It is plain text, one way: recipients
// cannot reply here. A representative can send 20 messages an hour and 100 a day.

import { randomUUID } from "node:crypto";
import { getDb, type Db } from "./db.server.ts";
import { audit, type PublicUser, type RequestMeta } from "./auth.server.ts";
import { ConnectionError } from "./connections.server.ts";
import { RepDashboardError, resolveSchool } from "./rep-dashboard.server.ts";
import { getRepCoach, listRepCoaches } from "./rep-coaches.server.ts";
import { getRepAthlete, listRepAthletes } from "./rep-athletes.server.ts";

export type Audience = "coaches" | "athletes" | "verified_athletes" | "everyone" | "person";
export const AUDIENCES: readonly Audience[] = ["coaches", "athletes", "verified_athletes", "everyone", "person"];

export const SUBJECT_MIN = 3;
export const SUBJECT_MAX = 100;
export const BODY_MAX = 1000;
export const MAX_RECIPIENTS = 2000;
export const HOURLY_LIMIT = 20;
export const DAILY_LIMIT = 100;
export const HISTORY_PAGE_DEFAULT = 20;
export const HISTORY_PAGE_MAX = 50;

export interface AudienceInput { audience?: unknown; sport?: unknown; recipientId?: unknown }
export interface Preview { count: number; coaches: number; athletes: number; label: string }
export interface SentMessage {
  id: string;
  audience: Audience;
  /** the audience in words, e.g. "All Basketball athletes" or the person's name */
  label: string;
  subject: string;
  body: string;
  recipientCount: number;
  createdAt: string;
}

const bad = (message: string, fieldErrors?: Record<string, string>) =>
  new ConnectionError(400, "validation", message, fieldErrors ? { fieldErrors } : undefined);

interface Resolved { ids: string[]; coaches: number; athletes: number; label: string; audience: Audience; sport: string; recipientId: string | null; recipientName: string }

/** Describes an audience in words. */
export function audienceLabel(audience: Audience, sport: string, personName: string): string {
  if (audience === "person") return personName;
  const s = sport ? `${sport} ` : "";
  switch (audience) {
    case "coaches": return `All ${s}coaches`;
    case "athletes": return `All ${s}athletes`;
    case "verified_athletes": return `Verified ${s}athletes`;
    default: return sport ? `All coaches and athletes (${sport})` : "All coaches and athletes";
  }
}

async function resolveAudience(user: PublicUser, input: AudienceInput, db: Db): Promise<Resolved> {
  const audience = input.audience;
  if (typeof audience !== "string" || !(AUDIENCES as readonly string[]).includes(audience)) throw bad("Choose who to send this to.", { audience: "Choose who to send this to." });
  const a = audience as Audience;
  const sport = typeof input.sport === "string" ? input.sport.trim().slice(0, 80) : "";

  if (a === "person") {
    const id = typeof input.recipientId === "string" ? input.recipientId.trim().slice(0, 100) : "";
    if (!id) throw bad("Choose the person to message.", { recipientId: "Choose the person to message." });
    // A coach of the school first, then an athlete of the school; anything else is "not found".
    try {
      const c = await getRepCoach(user, id, db);
      if (c.status !== "affiliated") throw bad("Only affiliated coaches can be messaged.", { recipientId: "That coach isn't affiliated with your school yet." });
      if (!c.accountActive) throw bad("That coach's account is suspended.", { recipientId: "That coach's account is suspended." });
      return { ids: [c.id], coaches: 1, athletes: 0, label: c.name, audience: a, sport: "", recipientId: c.id, recipientName: c.name };
    } catch (err) {
      if (!(err instanceof RepDashboardError && err.httpStatus === 404)) throw err;
    }
    try {
      const t = await getRepAthlete(user, id, db);
      return { ids: [t.id], coaches: 0, athletes: 1, label: t.name, audience: a, sport: "", recipientId: t.id, recipientName: t.name };
    } catch (err) {
      if (err instanceof RepDashboardError && err.httpStatus === 404) throw new RepDashboardError(404, "recipient_not_found", "That person isn't a coach or athlete of your school.");
      throw err;
    }
  }

  const page = { limit: MAX_RECIPIENTS + 1, offset: 0, ...(sport ? { sport } : {}) };
  const ids = new Set<string>();
  let coaches = 0, athletes = 0;
  if (a === "coaches" || a === "everyone") {
    const r = await listRepCoaches(user, { ...page, status: "affiliated" }, db);
    for (const c of r.items) if (c.accountActive && !ids.has(c.id)) { ids.add(c.id); coaches++; }
  }
  if (a === "athletes" || a === "verified_athletes" || a === "everyone") {
    const r = await listRepAthletes(user, { ...page, ...(a === "verified_athletes" ? { status: "verified" as const } : {}) }, db);
    for (const t of r.items) if (!ids.has(t.id)) { ids.add(t.id); athletes++; }
  }
  if (ids.size > MAX_RECIPIENTS) throw bad(`That is more than ${MAX_RECIPIENTS} people. Narrow it by sport.`, { audience: "Too many people. Narrow it by sport." });
  return { ids: [...ids], coaches, athletes, label: audienceLabel(a, sport, ""), audience: a, sport, recipientId: null, recipientName: "" };
}

/** How many people a message to this audience would reach, before sending. */
export async function previewRepMessage(user: PublicUser, input: AudienceInput, dbArg?: Db): Promise<Preview> {
  const db = dbArg ?? (await getDb());
  await resolveSchool(db, user);
  const r = await resolveAudience(user, input, db);
  return { count: r.ids.length, coaches: r.coaches, athletes: r.athletes, label: r.label };
}

// eslint-disable-next-line no-control-regex
const oneLine = (s: string) => s.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim();
// eslint-disable-next-line no-control-regex
const multiLine = (s: string) => s.replace(/\r\n?/g, "\n").replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, "").replace(/\n{3,}/g, "\n\n").trim();

export async function sendRepMessage(user: PublicUser, input: AudienceInput & { subject?: unknown; body?: unknown }, meta: Partial<RequestMeta> = {}, dbArg?: Db): Promise<SentMessage & { coaches: number; athletes: number }> {
  const db = dbArg ?? (await getDb());
  const school = await resolveSchool(db, user);

  const subject = typeof input.subject === "string" ? oneLine(input.subject) : "";
  const body = typeof input.body === "string" ? multiLine(input.body) : "";
  const errors: Record<string, string> = {};
  if (subject.length < SUBJECT_MIN || subject.length > SUBJECT_MAX) errors["subject"] = `Give it a subject (${SUBJECT_MIN} to ${SUBJECT_MAX} characters).`;
  if (body.length < 1 || body.length > BODY_MAX) errors["body"] = `Write a message (up to ${BODY_MAX} characters).`;
  if (Object.keys(errors).length > 0) throw bad("Please fix the highlighted fields.", errors);

  // A cap on how much one representative can send, so a mistake or a stolen session can't flood people.
  const [sent] = await db<{ hour: number; day: number }[]>`
    SELECT (count(*) FILTER (WHERE created_at > now() - interval '1 hour'))::int AS hour,
           (count(*) FILTER (WHERE created_at > now() - interval '1 day'))::int AS day
    FROM rep_messages WHERE sender_id = ${user.id}`;
  if ((sent?.hour ?? 0) >= HOURLY_LIMIT) throw new ConnectionError(429, "rate_limited", `You can send ${HOURLY_LIMIT} messages an hour. Try again later.`);
  if ((sent?.day ?? 0) >= DAILY_LIMIT) throw new ConnectionError(429, "rate_limited", `You can send ${DAILY_LIMIT} messages a day. Try again tomorrow.`);

  const r = await resolveAudience(user, input, db);
  if (r.ids.length === 0) throw bad("No one matches that choice, so nothing was sent.", { audience: "No one matches that choice." });

  const id = randomUUID();
  const ts = new Date();
  const from = `From ${oneLine(user.displayName)}${school.designation ? `, ${oneLine(school.designation)}` : ""}, ${oneLine(school.name)}`;
  const message = `${from}\n\n${body}`;
  await db.begin(async (txRaw) => {
    const tx = txRaw as unknown as Db;
    await tx`
      INSERT INTO rep_messages (id, sender_id, school_key, audience, sport, recipient_id, recipient_name, subject, body, recipient_count, created_at)
      VALUES (${id}, ${user.id}, ${school.key}, ${r.audience}, ${r.sport}, ${r.recipientId}, ${r.recipientName}, ${subject}, ${body}, ${r.ids.length}, ${ts})`;
    const rows = r.ids.map((uid) => ({ id: randomUUID(), user_id: uid, category: "system", title: subject, message, link: null as string | null, created_at: ts }));
    await tx`INSERT INTO notifications ${tx(rows, "id", "user_id", "category", "title", "message", "link", "created_at")}`;
    await audit("rep.message_sent", { userId: user.id, ...meta, detail: { audience: r.audience, sport: r.sport, recipients: r.ids.length } }, tx);
  });
  return { id, audience: r.audience, label: r.label, subject, body, recipientCount: r.ids.length, createdAt: ts.toISOString(), coaches: r.coaches, athletes: r.athletes };
}

/** What this representative has sent, newest first. Only their own. */
export async function listRepMessages(user: PublicUser, opts: { limit: number; offset: number }, dbArg?: Db): Promise<{ items: SentMessage[]; total: number }> {
  const db = dbArg ?? (await getDb());
  await resolveSchool(db, user);
  const rows = await db<{ id: string; audience: Audience; sport: string; recipient_name: string; subject: string; body: string; recipient_count: number; created_at: Date; total: number }[]>`
    SELECT id, audience, sport, recipient_name, subject, body, recipient_count, created_at, count(*) OVER ()::int AS total
    FROM rep_messages WHERE sender_id = ${user.id}
    ORDER BY created_at DESC, id LIMIT ${opts.limit} OFFSET ${opts.offset}`;
  return {
    total: rows[0]?.total ?? 0,
    items: rows.map((m) => ({ id: m.id, audience: m.audience, label: audienceLabel(m.audience, m.sport, m.recipient_name), subject: m.subject, body: m.body, recipientCount: m.recipient_count, createdAt: m.created_at.toISOString() })),
  };
}
