// The School Representative Dashboard's charts: athletes per sport, coaches per sport, and coach requests
// per month. Read-only, school taken from the signed-in representative's own approved account.
//
// Each series comes from the same functions (and so the same school limit and privacy rules) as the
// My Athletes, My Coaches and Coach Requests pages, so a chart can never show a person or a number those
// pages would not.

import { getDb, type Db } from "./db.server.ts";
import type { PublicUser } from "./auth.server.ts";
import { athleteSportBreakdown } from "./rep-athletes.server.ts";
import { coachSportBreakdown } from "./rep-coaches.server.ts";
import { requestMonthBreakdown } from "./rep-coach-requests.server.ts";
import { resolveSchool } from "./rep-dashboard.server.ts";

export interface RepCharts {
  athletesBySport: { sport: string; verified: number; unverified: number }[];
  coachesBySport: { sport: string; count: number }[];
  /** the last six months, oldest first, `month` as YYYY-MM */
  requestsByMonth: { month: string; pending: number; approved: number; rejected: number }[];
}

export async function getRepCharts(user: PublicUser, dbArg?: Db): Promise<RepCharts> {
  const db = dbArg ?? (await getDb());
  const school = await resolveSchool(db, user);
  const [athletesBySport, coachesBySport, requestsByMonth] = await Promise.all([
    athleteSportBreakdown(db, school), coachSportBreakdown(db, school), requestMonthBreakdown(db, school),
  ]);
  return { athletesBySport, coachesBySport, requestsByMonth };
}
