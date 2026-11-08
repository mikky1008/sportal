// The signed-in athlete's own profile, scholarship interests, profile showcase (photo + highlight
// video link) and performance records. Everything here is scoped by the user id from the session,
// never from the request, and only student-athlete accounts can use it.
//
// SERVER ONLY. Works on migrations 4 and 6 in db.server.ts.
//
//  - The rules are the SAME functions the forms use (src/lib/athleteProfileRules.ts and
//    athleteExtrasRules.ts), so the browser and the server always agree on what is valid.
//  - rank, performanceScore, consistency, municipality and province are system-owned: they are
//    returned but never accepted from a request.
//  - Partial saves are fine: an empty field is "not done yet", anything filled in must be valid.
//  - There is no moderation service yet, so a photo or video that passes the checks is stored as
//    'approved'. Nothing here lets an athlete change a status once a reviewer exists to set it.

import { randomUUID } from "node:crypto";
import { z } from "zod";
import { getDb, type Db } from "./db.server.ts";
import type { PublicUser } from "./auth.server.ts";
import { ATHLETE_ROLE, ConnectionError } from "./connections.server.ts";
import {
  LIMITS, TEAM_STATUSES, validateProfile, type ProfileDraft,
} from "../src/lib/athleteProfileRules.ts";
import {
  EMPTY_EXTRAS, validatePhotoDataUrl, validateScholarship, validateVideoUrl,
  type ProfileExtras, type ScholarshipInterests,
} from "../src/lib/athleteExtrasRules.ts";
import type { TeamStatus } from "../src/types/index.ts";

const now = () => new Date();

function requireAthlete(actor: Pick<PublicUser, "roles">): void {
  if (!actor.roles.includes(ATHLETE_ROLE))
    throw new ConnectionError(403, "role_not_allowed", "Only student-athlete accounts can use this.");
}

function fail(fieldErrors: Record<string, string>, message = "Please fix the highlighted fields."): ConnectionError {
  return new ConnectionError(400, "validation", message, { fieldErrors });
}

// ---------- the profile ----------

export interface AthleteProfileView {
  id: string;
  firstName: string;
  lastName: string;
  sport: string;
  position: string;
  school: string;
  year: string;
  heightCm: number | null;
  weightKg: number | null;
  teamStatus: TeamStatus | "";
  teamName: string;
  bio: string;
  achievements: { title: string; year: string }[];
  /** system-owned, never accepted from a request */
  rank: number | null;
  performanceScore: number | null;
  consistency: number | null;
  municipality: string;
  province: string;
}

interface ProfileRow {
  first_name: string | null;
  last_name: string | null;
  display_name: string;
  sport: string | null;
  playing_position: string | null;
  school: string | null;
  year_level: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  team_status: string | null;
  team_name: string | null;
  bio: string | null;
  ranking: number | null;
  performance: number | null;
  consistency: number | null;
  municipality: string | null;
  province: string | null;
}

export async function getMyProfile(actor: PublicUser, dbArg?: Db): Promise<AthleteProfileView> {
  requireAthlete(actor);
  const db = dbArg ?? (await getDb());
  const [r] = await db<ProfileRow[]>`
    SELECT up.first_name, up.last_name, u.display_name,
           ap.sport, ap.playing_position, ap.school, ap.year_level,
           ap.height_cm::float8 AS height_cm, ap.weight_kg::float8 AS weight_kg,
           ap.team_status, ap.team_name, ap.bio, ap.ranking,
           ap.performance::float8 AS performance, ap.consistency::float8 AS consistency,
           ap.municipality, ap.province
    FROM users u
    LEFT JOIN user_profiles up ON up.user_id = u.id
    LEFT JOIN athlete_profiles ap ON ap.user_id = u.id
    WHERE u.id = ${actor.id}`;
  if (!r) throw new ConnectionError(404, "profile_not_found", "Profile not found.");
  const achievements = await db<{ title: string; year: string }[]>`
    SELECT title, year FROM athlete_achievements WHERE athlete_id = ${actor.id} ORDER BY position`;
  const [first, ...rest] = r.display_name.trim().split(/\s+/);
  return {
    id: actor.id,
    firstName: r.first_name?.trim() || first || "",
    lastName: r.last_name?.trim() || (r.first_name?.trim() ? "" : rest.join(" ")),
    sport: r.sport ?? "",
    position: r.playing_position ?? "",
    school: r.school ?? "",
    year: r.year_level ?? "",
    heightCm: r.height_cm,
    weightKg: r.weight_kg,
    teamStatus: (r.team_status ?? "") as TeamStatus | "",
    teamName: r.team_name ?? "",
    bio: r.bio ?? "",
    achievements,
    rank: r.ranking,
    performanceScore: r.performance,
    consistency: r.consistency,
    municipality: r.municipality ?? "",
    province: r.province ?? "",
  };
}

/** Reads the request body as the form's draft. Every field must be text (numbers are allowed for height and weight). */
function readDraft(raw: unknown): ProfileDraft {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw fail({}, "Send the profile as an object.");
  const r = raw as Record<string, unknown>;
  const bad: Record<string, string> = {};
  const text = (k: string): string => {
    const v = r[k];
    if (v === undefined || v === null) return "";
    if (typeof v !== "string") { bad[k] = "Must be text."; return ""; }
    return v;
  };
  const numText = (k: string): string => {
    const v = r[k];
    if (typeof v === "number" && Number.isFinite(v)) return String(v);
    return text(k);
  };
  const ach = r["achievements"];
  let achievements: { title: string; year: string }[] = [];
  if (ach !== undefined) {
    if (!Array.isArray(ach)) bad["achievements"] = "Must be a list.";
    else
      achievements = ach.slice(0, LIMITS.achievements + 1).map((x) => {
        const o = (x && typeof x === "object" ? x : {}) as Record<string, unknown>;
        return { title: typeof o["title"] === "string" ? o["title"] : "", year: typeof o["year"] === "string" ? o["year"] : "" };
      });
  }
  const draft: ProfileDraft = {
    firstName: text("firstName"), lastName: text("lastName"), sport: text("sport"), position: text("position"),
    school: text("school"), year: text("year"), heightCm: numText("heightCm"), weightKg: numText("weightKg"),
    teamStatus: text("teamStatus") as TeamStatus, teamName: text("teamName"), bio: text("bio"), achievements,
  };
  if (Object.keys(bad).length > 0) throw fail(bad);
  return draft;
}

/** Flattens the form's error shape into { "field": "message", "achievements.0": "message" }. */
function flatten(errors: ReturnType<typeof validateProfile>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(errors)) {
    if (k === "achievements" && Array.isArray(v)) v.forEach((m, i) => { if (m) out[`achievements.${i}`] = m; });
    else if (typeof v === "string") out[k] = v;
  }
  return out;
}

/** Replaces the athlete's profile and achievements. Skills, rank and scores are left alone. */
export async function saveMyProfile(actor: PublicUser, raw: unknown, dbArg?: Db): Promise<AthleteProfileView> {
  requireAthlete(actor);
  const d = readDraft(raw);
  const errors = validateProfile(d, now(), true);
  if (Object.keys(errors).length > 0) throw fail(flatten(errors));
  const db = dbArg ?? (await getDb());
  const ts = now();
  const first = d.firstName.trim();
  const last = d.lastName.trim();
  const teamName = d.teamStatus === "Not on a team" ? "" : d.teamName.trim();
  const status = (TEAM_STATUSES as string[]).includes(d.teamStatus) ? d.teamStatus : "";

  await db.begin(async (tx) => {
    await tx`
      UPDATE user_profiles SET first_name = ${first || null}, last_name = ${last || null}, updated_at = ${ts}
      WHERE user_id = ${actor.id}`;
    const display = `${first} ${last}`.trim();
    if (display) await tx`UPDATE users SET display_name = ${display.slice(0, 80)}, updated_at = ${ts} WHERE id = ${actor.id}`;
    await tx`
      INSERT INTO athlete_profiles
        (user_id, sport, playing_position, school, year_level, height_cm, weight_kg, team_status, team_name, bio, created_at, updated_at)
      VALUES
        (${actor.id}, ${d.sport}, ${d.position.trim()}, ${d.school.trim()}, ${d.year.trim()},
         ${d.heightCm.trim() ? Number(d.heightCm) : null}, ${d.weightKg.trim() ? Number(d.weightKg) : null},
         ${status}, ${teamName}, ${d.bio.trim()}, ${ts}, ${ts})
      ON CONFLICT (user_id) DO UPDATE SET
        sport = EXCLUDED.sport, playing_position = EXCLUDED.playing_position, school = EXCLUDED.school,
        year_level = EXCLUDED.year_level, height_cm = EXCLUDED.height_cm, weight_kg = EXCLUDED.weight_kg,
        team_status = EXCLUDED.team_status, team_name = EXCLUDED.team_name, bio = EXCLUDED.bio,
        updated_at = EXCLUDED.updated_at`;
    await tx`DELETE FROM athlete_achievements WHERE athlete_id = ${actor.id}`;
    for (const [i, a] of d.achievements.entries())
      await tx`INSERT INTO athlete_achievements (id, athlete_id, position, title, year)
               VALUES (${randomUUID()}, ${actor.id}, ${i}, ${a.title.trim()}, ${a.year.trim()})`;
  });
  return getMyProfile(actor, db);
}

// ---------- scholarship interests and the profile showcase ----------

interface ExtrasRow {
  universities: string[];
  coverage: string;
  course: string;
  photo_data: string | null;
  photo_status: "approved" | "pending" | "rejected" | null;
  video_url: string | null;
  video_status: "approved" | "pending" | "rejected" | null;
}

export async function getMyExtras(actor: PublicUser, dbArg?: Db): Promise<ProfileExtras> {
  requireAthlete(actor);
  const db = dbArg ?? (await getDb());
  const [r] = await db<ExtrasRow[]>`
    SELECT universities, coverage, course, photo_data, photo_status, video_url, video_status
    FROM athlete_extras WHERE user_id = ${actor.id}`;
  if (!r) return EMPTY_EXTRAS;
  return {
    scholarship: { universities: r.universities, coverage: r.coverage as ScholarshipInterests["coverage"], course: r.course },
    photo: r.photo_data && r.photo_status ? { value: r.photo_data, status: r.photo_status } : null,
    video: r.video_url && r.video_status ? { value: r.video_url, status: r.video_status } : null,
  };
}

export async function saveScholarship(actor: PublicUser, raw: unknown, dbArg?: Db): Promise<ProfileExtras> {
  requireAthlete(actor);
  const o = (raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {}) as Record<string, unknown>;
  const unis = o["universities"];
  if (unis !== undefined && !(Array.isArray(unis) && unis.every((u) => typeof u === "string"))) throw fail({ universities: "Choose universities from the list." });
  if (o["coverage"] !== undefined && typeof o["coverage"] !== "string") throw fail({ coverage: "Choose a coverage preference from the list." });
  if (o["course"] !== undefined && typeof o["course"] !== "string") throw fail({ course: "Must be text." });
  const s: ScholarshipInterests = {
    universities: (unis as string[] | undefined) ?? [],
    coverage: ((o["coverage"] as string | undefined) ?? "") as ScholarshipInterests["coverage"],
    course: ((o["course"] as string | undefined) ?? "").trim(),
  };
  const errors = validateScholarship(s);
  if (Object.keys(errors).length > 0) throw fail(errors as Record<string, string>);
  const db = dbArg ?? (await getDb());
  if (s.universities.length > 0) {
    // Only universities that have posted a scholarship can be picked (open or not, so an old pick still saves).
    const known = await db<{ university: string }[]>`SELECT DISTINCT university FROM scholarships WHERE university = ANY(${s.universities}::text[])`;
    if (known.length !== s.universities.length) throw fail({ universities: "Choose universities from the list." });
  }
  await db`
    INSERT INTO athlete_extras (user_id, universities, coverage, course, updated_at)
    VALUES (${actor.id}, ${s.universities}::text[], ${s.coverage}, ${s.course}, ${now()})
    ON CONFLICT (user_id) DO UPDATE SET universities = EXCLUDED.universities, coverage = EXCLUDED.coverage,
      course = EXCLUDED.course, updated_at = EXCLUDED.updated_at`;
  return getMyExtras(actor, db);
}

export async function setPhoto(actor: PublicUser, raw: unknown, dbArg?: Db): Promise<ProfileExtras> {
  requireAthlete(actor);
  const v = (raw && typeof raw === "object" ? (raw as Record<string, unknown>)["dataUrl"] : undefined);
  if (typeof v !== "string") throw fail({ photo: "Send the photo as an image data URL." });
  const problem = validatePhotoDataUrl(v);
  if (problem) throw fail({ photo: problem });
  const db = dbArg ?? (await getDb());
  await db`
    INSERT INTO athlete_extras (user_id, photo_data, photo_status, updated_at) VALUES (${actor.id}, ${v}, 'approved', ${now()})
    ON CONFLICT (user_id) DO UPDATE SET photo_data = EXCLUDED.photo_data, photo_status = 'approved', updated_at = EXCLUDED.updated_at`;
  return getMyExtras(actor, db);
}

export async function removePhoto(actor: PublicUser, dbArg?: Db): Promise<ProfileExtras> {
  requireAthlete(actor);
  const db = dbArg ?? (await getDb());
  await db`UPDATE athlete_extras SET photo_data = NULL, photo_status = NULL, updated_at = ${now()} WHERE user_id = ${actor.id}`;
  return getMyExtras(actor, db);
}

export async function setVideo(actor: PublicUser, raw: unknown, dbArg?: Db): Promise<ProfileExtras> {
  requireAthlete(actor);
  const v = (raw && typeof raw === "object" ? (raw as Record<string, unknown>)["url"] : undefined);
  if (typeof v !== "string") throw fail({ video: "Enter a full link starting with https://" });
  const problem = validateVideoUrl(v);
  if (problem) throw fail({ video: problem });
  const db = dbArg ?? (await getDb());
  await db`
    INSERT INTO athlete_extras (user_id, video_url, video_status, updated_at) VALUES (${actor.id}, ${v.trim()}, 'approved', ${now()})
    ON CONFLICT (user_id) DO UPDATE SET video_url = EXCLUDED.video_url, video_status = 'approved', updated_at = EXCLUDED.updated_at`;
  return getMyExtras(actor, db);
}

export async function removeVideo(actor: PublicUser, dbArg?: Db): Promise<ProfileExtras> {
  requireAthlete(actor);
  const db = dbArg ?? (await getDb());
  await db`UPDATE athlete_extras SET video_url = NULL, video_status = NULL, updated_at = ${now()} WHERE user_id = ${actor.id}`;
  return getMyExtras(actor, db);
}

// ---------- performance records (shown to connected coaches in the athlete popup) ----------

const recordSchema = z.object({
  label: z.string().trim().min(1, "Enter what was measured.").max(80),
  value: z.string().trim().min(1, "Enter the result.").max(40),
  recordedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use the date format YYYY-MM-DD.").optional(),
});

const DAY_MS = 24 * 60 * 60 * 1000;
const isoDay = (d: Date) => d.toISOString().slice(0, 10);

/** Logs one performance record for the signed-in athlete. */
export async function addMyRecord(actor: PublicUser, body: unknown, dbArg?: Db): Promise<{ id: string }> {
  requireAthlete(actor);
  const parsed = recordSchema.safeParse(body);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "body");
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    throw fail(fieldErrors);
  }
  const r = parsed.data;
  const ts = now();
  const recordedOn = r.recordedOn ?? isoDay(ts);
  const asDate = new Date(`${recordedOn}T00:00:00Z`);
  if (Number.isNaN(asDate.getTime()) || isoDay(asDate) !== recordedOn) throw fail({ recordedOn: "Enter a real date." });
  if (recordedOn > isoDay(new Date(ts.getTime() + DAY_MS))) throw fail({ recordedOn: "A record can't be dated in the future." });
  const db = dbArg ?? (await getDb());
  const id = randomUUID();
  await db`
    INSERT INTO athlete_records (id, athlete_id, label, value, recorded_on, created_at)
    VALUES (${id}, ${actor.id}, ${r.label}, ${r.value}, ${recordedOn}::date, ${ts})`;
  return { id };
}
