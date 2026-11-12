// Command-line tool for university details. Coaches can only READ them (My University page), and there
// is no admin screen for this yet, so an administrator fills in the logo, location, description and
// website here. A university row is also created automatically the first time a coach from it is
// approved, with only the name (and the coach's location) filled in.
//
//   npm run university:set -- list
//   npm run university:set -- set "Ateneo de Manila University" --logo https://example.edu/logo.png \
//       --location "Quezon City" --description "About the university..." --website https://example.edu
//
// Only the options you pass are changed. Use --logo "" to remove a logo. Logo and website must be
// http(s) links. The name is matched without case or edge spaces, and is created if it is new.

import { randomUUID } from "node:crypto";
import { closeDb, getDb } from "../server/db.server.ts";

const [command, nameArg] = process.argv.slice(2);
const opt = (flag: string): string | undefined => {
  const i = process.argv.indexOf(flag);
  return i === -1 ? undefined : (process.argv[i + 1] ?? "");
};

function usage(): never {
  console.error('Usage:\n  university:set list\n  university:set set "<university name>" [--logo <https url>] [--location <text>] [--description <text>] [--website <https url>]');
  process.exit(2);
}
function httpUrl(label: string, v: string | undefined, max: number): string | undefined {
  if (v === undefined) return undefined;
  if (v === "") return "";
  let ok = false;
  try { ok = /^https?:$/.test(new URL(v).protocol); } catch { /* not a URL */ }
  if (!ok || v.length > max) { console.error(`${label} must be an http(s) link of at most ${max} characters.`); process.exit(2); }
  return v;
}

const db = await getDb();
try {
  if (command === "list") {
    const rows = await db<{ name: string; location: string; logo_url: string; description: string; coaches: number }[]>`
      SELECT u.name, u.location, u.logo_url, u.description,
             (SELECT count(*)::int FROM coach_profiles cp WHERE cp.university_id = u.id) AS coaches
      FROM universities u ORDER BY u.name`;
    if (rows.length === 0) console.log("No universities yet. One is created when the first coach from it is approved.");
    for (const r of rows) console.log(`${r.name} | ${r.location || "no location"} | logo: ${r.logo_url ? "yes" : "no"} | description: ${r.description ? "yes" : "no"} | coaches: ${r.coaches}`);
  } else if (command === "set" && nameArg && !nameArg.startsWith("--")) {
    const name = nameArg.trim();
    if (name.length < 2 || name.length > 120) { console.error("The name must be 2-120 characters."); process.exit(2); }
    const logo = httpUrl("--logo", opt("--logo"), 500);
    const website = httpUrl("--website", opt("--website"), 300);
    const location = opt("--location")?.trim();
    const description = opt("--description")?.trim();
    if (location !== undefined && location.length > 200) { console.error("--location is limited to 200 characters."); process.exit(2); }
    if (description !== undefined && description.length > 2000) { console.error("--description is limited to 2000 characters."); process.exit(2); }

    const now = new Date();
    const key = name.toLowerCase();
    // Create it if it is new (with whatever was passed), otherwise leave the row alone here.
    await db`
      INSERT INTO universities (id, name, name_key, logo_url, location, description, website, created_at, updated_at)
      VALUES (${randomUUID()}, ${name}, ${key}, ${logo ?? ""}, ${location ?? ""}, ${description ?? ""}, ${website ?? ""}, ${now}, ${now})
      ON CONFLICT (name_key) DO NOTHING`;
    // Update only what was passed (kept simple and explicit rather than one clever statement).
    if (logo !== undefined) await db`UPDATE universities SET logo_url = ${logo}, updated_at = ${now} WHERE name_key = ${key}`;
    if (location !== undefined) await db`UPDATE universities SET location = ${location}, updated_at = ${now} WHERE name_key = ${key}`;
    if (description !== undefined) await db`UPDATE universities SET description = ${description}, updated_at = ${now} WHERE name_key = ${key}`;
    if (website !== undefined) await db`UPDATE universities SET website = ${website}, updated_at = ${now} WHERE name_key = ${key}`;
    const [u] = await db<{ name: string }[]>`SELECT name FROM universities WHERE name_key = ${key}`;
    console.log(u ? `Saved: ${u.name}` : "Nothing saved.");
  } else {
    usage();
  }
} finally {
  await closeDb();
}
