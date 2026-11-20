// Tells a school's representative(s) when a coach asks to join their school.
//
// SERVER ONLY. Called by requestVerification (coach-profile.server.ts) right after a request is
// recorded. It uses the same match as the representative's Coach Requests page: the request's
// organization equals the representative's registered school (without case or edge spaces) and the
// coach's organization type is University or College. Only representatives whose school is approved
// (or who were made by the operator's tool, so have no application) and whose account is active are told.
// One notification per representative per request; the bell on every page shows the count, and the
// notification links to /rep/requests.

import type { Db } from "./db.server.ts";
import { notify } from "./notifications.server.ts";

/** Returns how many representatives were told. Never throws for "nobody to tell". */
export async function notifyRepsOfCoachRequest(db: Db, coachId: string): Promise<number> {
  const rows = await db<{ rep_id: string; school: string; coach_name: string; sport: string }[]>`
    SELECT rp.user_id AS rep_id, rp.university_name AS school,
           COALESCE(NULLIF(btrim(concat_ws(' ', cup.first_name, cup.last_name)), ''), cu.display_name) AS coach_name,
           COALESCE(cp.sport_specialization, '') AS sport
    FROM coach_verifications v
    JOIN coach_profiles cp ON cp.user_id = v.coach_id AND cp.organization_type IN ('University', 'College')
    JOIN users cu ON cu.id = v.coach_id
    LEFT JOIN user_profiles cup ON cup.user_id = cu.id
    JOIN university_representative_profiles rp ON lower(btrim(rp.university_name)) = lower(btrim(v.organization))
    JOIN users ru ON ru.id = rp.user_id AND ru.is_active = TRUE AND ru.deleted_at IS NULL
    LEFT JOIN rep_applications ra ON ra.user_id = rp.user_id
    WHERE v.coach_id = ${coachId} AND v.status = 'pending' AND (ra.status IS NULL OR ra.status = 'approved')`;
  for (const r of rows) {
    await notify(
      r.rep_id,
      {
        category: "verification",
        title: "New coach request",
        message: `${r.coach_name}${r.sport ? ` (${r.sport})` : ""} asked to join ${r.school.trim()}. Review the request to approve or reject it.`,
        link: "/rep/requests",
      },
      db,
    );
  }
  return rows.length;
}
