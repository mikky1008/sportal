// Public search of the schools that already exist on Sportal, for the coach sign-up's university field.
//
// SERVER ONLY. No sign-in (the person is creating their account). It returns only a school's NAME and city:
//   - every registered university (the universities table, made when a representative or a coach of it
//     was approved), and
//   - the school of every approved, active school representative (so a school is suggested as soon as its
//     representative is approved, even before it has a university row).
// A school that is only an unapproved application is never suggested, and nothing else (no people, emails
// or counts) is returned. At most 8 names come back, matched without caring about case, and every word you
// type must appear in the name in any order ("philippines univ" finds "University of the Philippines").
//
// The field stays free text: a coach whose school isn't listed just types it. Suggested names are matched
// the same way the rest of Sportal matches a school (without case or edge spaces), so picking one links the
// coach to that school's representative.
//
// It can be called without an account, so each address is limited to SEARCH_PER_MINUTE searches a minute.

import { getDb, type Db } from "./db.server.ts";

export const SEARCH_LIMIT = 8;
export const SEARCH_QUERY_MAX = 60;
export const SEARCH_PER_MINUTE = 60;

export interface UniversitySuggestion { name: string; location: string }

const likeLiteral = (t: string) => t.replace(/[\\%_]/g, (c) => `\\${c}`);

export async function searchUniversities(rawQuery: string, dbArg?: Db): Promise<UniversitySuggestion[]> {
  const db = dbArg ?? (await getDb());
  const q = rawQuery.replace(/\s+/g, " ").trim().slice(0, SEARCH_QUERY_MAX);
  const words = q ? q.split(" ").map((w) => `%${likeLiteral(w)}%`) : [];
  const prefix = `${likeLiteral(q)}%`;
  const rows = await db<{ name: string; location: string }[]>`
    WITH names AS (
      SELECT u.name AS name, u.name_key AS key, COALESCE(u.location, '') AS location, 0 AS pri FROM universities u
      UNION ALL
      SELECT btrim(rp.university_name), lower(btrim(rp.university_name)), '', 1
      FROM university_representative_profiles rp
      JOIN users us ON us.id = rp.user_id AND us.is_active = TRUE AND us.deleted_at IS NULL
      LEFT JOIN rep_applications ra ON ra.user_id = rp.user_id
      WHERE (ra.status IS NULL OR ra.status = 'approved') AND length(btrim(rp.university_name)) >= 2
    ), best AS (
      SELECT DISTINCT ON (key) name, key, location FROM names ORDER BY key, pri, name
    )
    SELECT name, location FROM best
    WHERE NOT EXISTS (SELECT 1 FROM unnest(${words}::text[]) w WHERE best.name NOT ILIKE w)
    ORDER BY (best.name ILIKE ${prefix}) DESC, best.name
    LIMIT ${SEARCH_LIMIT}`;
  return rows.map((r) => ({ name: r.name, location: r.location }));
}

/* ---- a small per-address limit (kept in memory, so it is per server instance) ---- */

const hits = new Map<string, number[]>();

/** true when this address may search now. */
export function allowUniversitySearch(ip: string | null, now = Date.now()): boolean {
  const key = ip ?? "unknown";
  const recent = (hits.get(key) ?? []).filter((t) => now - t < 60_000);
  if (recent.length >= SEARCH_PER_MINUTE) { hits.set(key, recent); return false; }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) for (const [k, v] of hits) if (v.every((t) => now - t >= 60_000)) hits.delete(k);   // keep the map small
  return true;
}

/** For tests. */
export const resetUniversitySearchLimit = () => hits.clear();
