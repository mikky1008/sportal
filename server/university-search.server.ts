// Public search of the schools a coach can sign up for, for the coach sign-up's school field.
//
// SERVER ONLY. No sign-in (the person is creating their account). It returns only a school's NAME and city,
// and ONLY schools that have an approved, active school representative: a coach's verification request is
// decided by that representative, so a school without one cannot be chosen. A school that is only an
// unapproved application is never suggested, and nothing else (no people, emails or counts) is returned.
// At most 8 names come back, matched without caring about case, and every word you type must appear in the
// name in any order ("philippines univ" finds "University of the Philippines").
//
// The sign-up does NOT trust the browser: `findRepSchool` checks the chosen school again on the server and
// saves its exact registered name, so a coach is always linked to the representative who will review them.
//
// It can be called without an account, so each address is limited to SEARCH_PER_MINUTE searches a minute.

import { getDb, type Db } from "./db.server.ts";

export const SEARCH_LIMIT = 8;
export const SEARCH_QUERY_MAX = 60;
export const SEARCH_PER_MINUTE = 60;

export interface UniversitySuggestion { name: string; location: string }

const likeLiteral = (t: string) => t.replace(/[\\%_]/g, (c) => `\\${c}`);

/**
 * The schools a coach may belong to: one row per approved, active school representative. The name is the
 * registered one (the universities table) when the school has a row there, otherwise what the representative
 * applied with. `key` is matched exactly like the rest of Sportal matches a school (lower case, edge spaces off).
 */
const REP_SCHOOLS = (db: Db) => db`
  SELECT COALESCE(u.name, btrim(rp.university_name)) AS name,
         lower(btrim(rp.university_name)) AS key,
         COALESCE(u.location, '') AS location
  FROM university_representative_profiles rp
  JOIN users us ON us.id = rp.user_id AND us.is_active = TRUE AND us.deleted_at IS NULL
  LEFT JOIN rep_applications ra ON ra.user_id = rp.user_id
  LEFT JOIN universities u ON u.name_key = lower(btrim(rp.university_name))
  WHERE (ra.status IS NULL OR ra.status = 'approved') AND length(btrim(rp.university_name)) >= 2`;

/**
 * The school a coach is allowed to sign up for: the approved representative's school whose name matches
 * `rawName` (case and edge spaces ignored). Returns its exact registered name, which is what must be saved
 * so the coach's requests always reach that representative. null when no representative has this school.
 */
export async function findRepSchool(rawName: string, dbArg?: Db): Promise<UniversitySuggestion | null> {
  const key = rawName.trim().toLowerCase();
  if (key.length < 2) return null;
  const db = dbArg ?? (await getDb());
  const [row] = await db<{ name: string; location: string }[]>`
    SELECT name, location FROM (${REP_SCHOOLS(db)}) s WHERE s.key = ${key} ORDER BY name LIMIT 1`;
  return row ?? null;
}

export async function searchUniversities(rawQuery: string, dbArg?: Db): Promise<UniversitySuggestion[]> {
  const db = dbArg ?? (await getDb());
  const q = rawQuery.replace(/\s+/g, " ").trim().slice(0, SEARCH_QUERY_MAX);
  const words = q ? q.split(" ").map((w) => `%${likeLiteral(w)}%`) : [];
  const prefix = `${likeLiteral(q)}%`;
  const rows = await db<{ name: string; location: string }[]>`
    WITH names AS (${REP_SCHOOLS(db)}),
    best AS (
      SELECT DISTINCT ON (key) name, key, location FROM names ORDER BY key, name
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
