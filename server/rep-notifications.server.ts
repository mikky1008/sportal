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

/**
 * Tells a school's representative(s) that a coach SIGNED UP for their school, before any application exists.
 * Signing up only creates the account; the coach still has to complete their profile and send a verification
 * request, so this says so. Matched on the school name the coach chose at sign-up (without case or edge
 * spaces); only approved (or operator-made), active representatives are told. Links to /rep/requests, where
 * the coach appears under "Not submitted" until they apply.
 */
export async function notifyRepsOfCoachSignup(db: Db, coachId: string): Promise<number> {
  const rows = await db<{ rep_id: string; school: string; coach_name: string; sport: string }[]>`
    SELECT rp.user_id AS rep_id, rp.university_name AS school,
           COALESCE(NULLIF(btrim(concat_ws(' ', cup.first_name, cup.last_name)), ''), cu.display_name) AS coach_name,
           COALESCE(cp.sport_specialization, '') AS sport
    FROM coach_profiles cp
    JOIN users cu ON cu.id = cp.user_id
    LEFT JOIN user_profiles cup ON cup.user_id = cu.id
    JOIN university_representative_profiles rp ON lower(btrim(rp.university_name)) = lower(btrim(cp.organization))
    JOIN users ru ON ru.id = rp.user_id AND ru.is_active = TRUE AND ru.deleted_at IS NULL
    LEFT JOIN rep_applications ra ON ra.user_id = rp.user_id
    WHERE cp.user_id = ${coachId} AND (ra.status IS NULL OR ra.status = 'approved')`;
  for (const r of rows) {
    await notify(
      r.rep_id,
      {
        category: "verification",
        title: "A coach signed up for your school",
        message: `${r.coach_name}${r.sport ? ` (${r.sport})` : ""} signed up as a coach for ${r.school.trim()}. They haven't sent their application yet; you'll be asked to review it once they do.`,
        link: "/rep/requests",
      },
      db,
    );
  }
  return rows.length;
}

/** Tells a coach who just signed up what to do next (their profile page, where they request verification). */
export async function notifyCoachNextStep(db: Db, coachId: string): Promise<void> {
  const [c] = await db<{ school: string }[]>`SELECT organization AS school FROM coach_profiles WHERE user_id = ${coachId}`;
  if (!c) return;
  await notify(
    coachId,
    {
      category: "verification",
      title: "Finish your coach application",
      message: `Welcome to Sportal! To be verified at ${c.school.trim()}, complete your coach profile and send your verification request. The school's representative can review it once you do.`,
      link: "/profile",
    },
    db,
  );
}

// ---------- a school with no active representative ----------
//
// Coaches pick a school that has an approved representative, and that representative approves them. If the
// school's last active representative is suspended, the coaches still waiting for a decision would wait for
// nobody, so they are told, and told again when a representative is active once more. Nothing is lost: the
// coach's school and request stay saved and are matched by school name, so a new representative sees them
// straight away. Coaches who are already verified are not affected and not notified.

/** Coaches of a school who are still waiting for a decision (signed up or applied, not yet approved or rejected). */
const WAITING_COACHES = (db: Db, key: string) => db`
  FROM coach_profiles cp
  JOIN users cu ON cu.id = cp.user_id AND cu.is_active = TRUE AND cu.deleted_at IS NULL
  WHERE lower(btrim(cp.organization)) = ${key}
    AND NOT EXISTS (SELECT 1 FROM coach_verifications v WHERE v.coach_id = cp.user_id AND v.status IN ('verified', 'rejected'))`;

/** Active, approved (or operator-made) representatives of a school. */
const ACTIVE_REPS = (db: Db, key: string) => db`
  FROM university_representative_profiles rp
  JOIN users ru ON ru.id = rp.user_id AND ru.is_active = TRUE AND ru.deleted_at IS NULL
  LEFT JOIN rep_applications ra ON ra.user_id = rp.user_id
  WHERE lower(btrim(rp.university_name)) = ${key} AND (ra.status IS NULL OR ra.status = 'approved')`;

async function schoolOf(db: Db, repId: string): Promise<{ key: string; name: string } | null> {
  const [r] = await db<{ key: string; name: string }[]>`
    SELECT lower(btrim(university_name)) AS key, btrim(university_name) AS name FROM university_representative_profiles WHERE user_id = ${repId}`;
  return r ?? null;
}

/** Call after a representative was suspended. Tells the school's waiting coaches when no one else is left to review them. */
export async function notifyCoachesSchoolLostRep(db: Db, repId: string): Promise<number> {
  const school = await schoolOf(db, repId);
  if (!school) return 0;
  const [others] = await db<{ n: number }[]>`SELECT count(*)::int AS n ${ACTIVE_REPS(db, school.key)}`;
  if ((others?.n ?? 0) > 0) return 0;
  const coaches = await db<{ id: string }[]>`SELECT cp.user_id AS id ${WAITING_COACHES(db, school.key)}`;
  for (const c of coaches)
    await notify(c.id, {
      category: "verification",
      title: "Your school has no active representative",
      message: `${school.name} has no active representative on Sportal right now. Your request is saved and will be reviewed as soon as a representative for the school is active again. You don't need to do anything.`,
      link: "/profile",
    }, db);
  return coaches.length;
}

/** Call after a representative became active (approved, or reactivated). Tells the waiting coaches if they were the first one back. */
export async function notifyCoachesSchoolHasRep(db: Db, repId: string): Promise<number> {
  const school = await schoolOf(db, repId);
  if (!school) return 0;
  const [reps] = await db<{ n: number }[]>`SELECT count(*)::int AS n ${ACTIVE_REPS(db, school.key)}`;
  if ((reps?.n ?? 0) !== 1) return 0; // others were already there, so the coaches were never left without one
  const coaches = await db<{ id: string }[]>`SELECT cp.user_id AS id ${WAITING_COACHES(db, school.key)}`;
  for (const c of coaches)
    await notify(c.id, {
      category: "verification",
      title: "Your school has a representative again",
      message: `${school.name} has an active representative again. Make sure your profile is complete and your verification request is sent so they can review you.`,
      link: "/profile",
    }, db);
  return coaches.length;
}

/** Schools with coaches waiting and no active representative (for the administrator's School Verification page). */
export async function schoolsWithoutRep(db: Db): Promise<{ school: string; waitingCoaches: number }[]> {
  return db<{ school: string; waitingCoaches: number }[]>`
    SELECT min(btrim(cp.organization)) AS school, count(*)::int AS "waitingCoaches"
    FROM coach_profiles cp
    JOIN users cu ON cu.id = cp.user_id AND cu.is_active = TRUE AND cu.deleted_at IS NULL
    WHERE length(btrim(cp.organization)) > 0
      AND NOT EXISTS (SELECT 1 FROM coach_verifications v WHERE v.coach_id = cp.user_id AND v.status IN ('verified', 'rejected'))
      AND NOT EXISTS (
        SELECT 1 FROM university_representative_profiles rp
        JOIN users ru ON ru.id = rp.user_id AND ru.is_active = TRUE AND ru.deleted_at IS NULL
        LEFT JOIN rep_applications ra ON ra.user_id = rp.user_id
        WHERE lower(btrim(rp.university_name)) = lower(btrim(cp.organization)) AND (ra.status IS NULL OR ra.status = 'approved'))
    GROUP BY lower(btrim(cp.organization))
    ORDER BY count(*) DESC, 1`;
}
