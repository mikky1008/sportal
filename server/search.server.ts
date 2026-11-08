// Header search: one query across what the signed-in user is allowed to find.
//
//  - Scholarships: open ones, for everyone signed in.
//  - Athletes: only for verified coaches (the existing athlete search rules apply, so ids and
//    names only, never emails). Anyone else simply gets an empty athletes list.

import { getDb, type Db } from "./db.server.ts";
import type { PublicUser } from "./auth.server.ts";
import { ConnectionError, searchAthletes, type AthleteSearchResult } from "./connections.server.ts";
import { listScholarships, type ScholarshipView } from "./scholarships.server.ts";

export const GLOBAL_SEARCH_MIN_CHARS = 2;
export const GLOBAL_SEARCH_MAX_CHARS = 80;

export async function globalSearch(
  user: PublicUser,
  rawQuery: string,
  rawLimit = 5,
  dbArg?: Db,
): Promise<{ athletes: AthleteSearchResult[]; scholarships: ScholarshipView[] }> {
  const q = rawQuery.trim().slice(0, GLOBAL_SEARCH_MAX_CHARS);
  if (q.length < GLOBAL_SEARCH_MIN_CHARS) return { athletes: [], scholarships: [] };
  const limit = Math.min(Math.max(Math.trunc(Number.isFinite(rawLimit) ? rawLimit : 5), 1), 10);
  const db = dbArg ?? (await getDb());

  const [scholarships, athletes] = await Promise.all([
    listScholarships(user, { q, limit, offset: 0 }, db).then((r) => r.items),
    searchAthletes(user, q, limit, {}, db).then(
      (r) => r.items,
      (err: unknown) => {
        // Not a verified coach: no athlete results, but the search itself still works.
        if (err instanceof ConnectionError) return [] as AthleteSearchResult[];
        throw err;
      },
    ),
  ]);
  return { athletes, scholarships };
}
