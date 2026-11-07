// Fills a coach's account with demo data so My Athletes and the dashboard cards have something to show.
//
//   SPORTAL_NEW_PASSWORD='Some-Strong-Pass-1!' npm run seed:demo -- --coach coach@school.edu
//
// Creates four demo athletes (demo.<name>@sportal.test, all with that password), connects them to the
// coach, and adds profiles, records, practice sessions, a shortlist, inquiries, messages and an application.
// Safe to run twice: athletes that already exist are reused and their data is replaced.

import { randomUUID } from "node:crypto";
import { createUser, UserInputError } from "../server/auth.server.ts";
import { closeDb, getDb } from "../server/db.server.ts";

const coachEmail = process.argv[process.argv.indexOf("--coach") + 1];
const password = process.env["SPORTAL_NEW_PASSWORD"];
if (process.argv.indexOf("--coach") === -1 || !coachEmail || !password) {
  console.error("Usage: SPORTAL_NEW_PASSWORD=... npm run seed:demo -- --coach <coach email>");
  process.exit(2);
}

const day = (ago: number) => new Date(Date.now() - ago * 86_400_000).toISOString().slice(0, 10);
const at = (agoHours: number) => new Date(Date.now() - agoHours * 3_600_000);

const demo = [
  { first: "Juan", last: "Dela Cruz", sport: "Basketball", position: "Point Guard", school: "Ateneo de Manila University", rank: 14, perf: 92.5, cons: 87,
    bio: "Dedicated point guard focusing on high-tempo transition play and jumper efficiency.",
    skills: ["Ball Handling", "Court Vision", "3-Point Shooting", "Perimeter Defense"],
    ach: [["2025 UAAP Season MVP Candidate", "2025"], ["Team Captain - Ateneo Blue Eagles", "2026"]],
    rec: [["Free Throw Precision", "88%", "Shooting", 88, 3], ["10m Sprint Speed", "1.42s", "Agility", 72, 9]] },
  { first: "Kevin", last: "Ramos", sport: "Basketball", position: "Shooting Guard", school: "De La Salle University", rank: 8, perf: 94.1, cons: 91,
    bio: "Catch-and-shoot specialist who spaces the floor and rarely misses from the corners.",
    skills: ["Catch-and-Shoot", "Off-Ball Movement", "Free Throws", "Transition Defense"],
    ach: [["UAAP Season 88 All-Rookie Team", "2025"]],
    rec: [["Three-Point Accuracy", "46%", "Shooting", 84, 2], ["Free Throw Precision", "91%", "Shooting", 91, 8]] },
  { first: "Marco", last: "Villanueva", sport: "Volleyball", position: "Outside Hitter", school: "University of Santo Tomas", rank: 3, perf: 89.8, cons: 84,
    bio: "Powerful outside hitter with a heavy serve. Working on reception under pressure.",
    skills: ["Spike Power", "Jump Serve", "Blocking", "Court Coverage"],
    ach: [["UAAP Juniors Best Outside Hitter", "2024"], ["Team Most Improved Player", "2025"]],
    rec: [["Spike Accuracy", "81%", "Passing", 81, 4], ["Vertical Jump", "74 cm", "Agility", 74, 40]] },
  { first: "Alyssa", last: "Mendoza", sport: "Track & Field", position: "Sprinter (100m / 200m)", school: "University of the Philippines", rank: 1, perf: 96.8, cons: 95,
    bio: "Sprinter with a fast, clean start and the steadiest times on the squad.",
    skills: ["Block Start", "Top-End Speed", "Curve Running", "Recovery"],
    ach: [["UAAP 100m Silver Medalist", "2026"], ["NCR Meet 200m Record Holder", "2025"]],
    rec: [["100m Sprint", "11.84s", "Agility", 93, 1], ["200m Sprint", "24.31s", "Agility", 90, 45]] },
] as const;

const db = await getDb();
try {
  const [coach] = await db<{ id: string }[]>`
    SELECT u.id FROM users u JOIN user_roles ur ON ur.user_id = u.id JOIN roles r ON r.id = ur.role_id
    WHERE lower(u.email) = ${coachEmail.toLowerCase()} AND r.name = 'coach'`;
  if (!coach) throw new Error(`No coach account with email ${coachEmail}.`);

  const ids: string[] = [];
  for (const d of demo) {
    const email = `demo.${d.first.toLowerCase()}@sportal.test`;
    let [row] = await db<{ id: string }[]>`SELECT id FROM users WHERE lower(email) = ${email}`;
    if (!row) {
      try {
        const u = await createUser({ email, username: `demo_${d.first.toLowerCase()}`, password, displayName: `${d.first} ${d.last}`, firstName: d.first, lastName: d.last, roles: ["student_athlete"], details: { kind: "student_athlete" } }, db);
        row = { id: u.id };
      } catch (err) {
        if (err instanceof UserInputError) throw new Error(err.message);
        throw err;
      }
    }
    const id = row.id;
    ids.push(id);
    const ts = new Date();
    await db.begin(async (tx) => {
      await tx`
        INSERT INTO athlete_profiles (user_id, sport, playing_position, school, bio, ranking, performance, consistency, created_at, updated_at)
        VALUES (${id}, ${d.sport}, ${d.position}, ${d.school}, ${d.bio}, ${d.rank}, ${d.perf}, ${d.cons}, ${ts}, ${ts})
        ON CONFLICT (user_id) DO UPDATE SET sport = EXCLUDED.sport, playing_position = EXCLUDED.playing_position, school = EXCLUDED.school,
          bio = EXCLUDED.bio, ranking = EXCLUDED.ranking, performance = EXCLUDED.performance, consistency = EXCLUDED.consistency, updated_at = EXCLUDED.updated_at`;
      await tx`DELETE FROM athlete_skills WHERE athlete_id = ${id}`;
      for (const [i, name] of d.skills.entries()) await tx`INSERT INTO athlete_skills (id, athlete_id, position, name) VALUES (${randomUUID()}, ${id}, ${i}, ${name})`;
      await tx`DELETE FROM athlete_achievements WHERE athlete_id = ${id}`;
      for (const [i, a] of d.ach.entries()) await tx`INSERT INTO athlete_achievements (id, athlete_id, position, title, year) VALUES (${randomUUID()}, ${id}, ${i}, ${a[0]}, ${a[1]})`;
      await tx`DELETE FROM athlete_records WHERE athlete_id = ${id}`;
      for (const [label, value, skill, score, ago] of d.rec)
        await tx`INSERT INTO athlete_records (id, athlete_id, label, value, skill, score, recorded_on, created_at) VALUES (${randomUUID()}, ${id}, ${label}, ${value}, ${skill}, ${score}, ${day(ago)}::date, ${ts})`;
      // Practice sessions: a recent one and an earlier, lower one per skill, so the dashboard's
      // "progress by skill" has something to compare.
      await tx`DELETE FROM practice_sessions WHERE athlete_id = ${id}`;
      for (const [, , skill, score, ago] of d.rec) {
        for (const [daysAgo, delta] of [[ago, 0], [ago + 35, -6]] as const)
          await tx`
            INSERT INTO practice_sessions (id, athlete_id, skill, result, consistency, status, simulated, session_date, created_at)
            VALUES (${randomUUID()}, ${id}, ${skill.toLowerCase()}, ${score + delta}, ${score + delta - 5}, 'ai_assessed', TRUE, ${day(daysAgo)}::date, ${ts})`;
      }
      // accepted connection (one row per pair; reuse it if it exists)
      await tx`
        INSERT INTO coach_athlete_connections (id, coach_id, athlete_id, requested_by, status, requested_at, responded_at, created_at, updated_at)
        VALUES (${randomUUID()}, ${coach.id}, ${id}, ${id}, 'accepted', ${at(72)}, ${at(70)}, ${ts}, ${ts})
        ON CONFLICT (coach_id, athlete_id) DO UPDATE SET status = 'accepted', responded_at = COALESCE(coach_athlete_connections.responded_at, ${at(70)}), updated_at = ${ts}`;
    });
  }

  const [juan, kevin, marco, alyssa] = ids as [string, string, string, string];
  const ts = new Date();
  await db.begin(async (tx) => {
    await tx`DELETE FROM coach_shortlist WHERE coach_id = ${coach.id}`;
    for (const id of [kevin, marco, alyssa]) await tx`INSERT INTO coach_shortlist (coach_id, athlete_id, created_at) VALUES (${coach.id}, ${id}, ${ts})`;
    await tx`DELETE FROM recruitment_inquiries WHERE coach_id = ${coach.id}`;
    for (const [athlete, status] of [[juan, "awaiting"], [marco, "awaiting"], [alyssa, "awaiting"], [kevin, "replied"], [marco, "replied"], [kevin, "accepted"], [juan, "declined"]] as const)
      await tx`INSERT INTO recruitment_inquiries (id, coach_id, athlete_id, status, created_at, updated_at) VALUES (${randomUUID()}, ${coach.id}, ${athlete}, ${status}, ${ts}, ${ts})`;
    await tx`DELETE FROM coach_messages WHERE coach_id = ${coach.id}`;
    const msg = (athlete: string, body: string, hoursAgo: number, unread: boolean) =>
      tx`INSERT INTO coach_messages (id, coach_id, athlete_id, sender_id, body, created_at, read_at)
         VALUES (${randomUUID()}, ${coach.id}, ${athlete}, ${athlete}, ${body}, ${at(hoursAgo)}, ${unread ? null : at(hoursAgo)})`;
    await msg(kevin, "Thanks coach, I'd love to visit the campus.", 1, true);
    await msg(marco, "Can you share the tryout schedule?", 26, true);
    await msg(juan, "Appreciate the feedback on my free throws.", 50, true);
    await tx`DELETE FROM athlete_applications WHERE coach_id = ${coach.id}`;
    for (const id of [juan, kevin]) await tx`INSERT INTO athlete_applications (id, coach_id, athlete_id, status, created_at, updated_at) VALUES (${randomUUID()}, ${coach.id}, ${id}, 'new', ${ts}, ${ts})`;
  });
  console.log(`Seeded ${ids.length} demo athletes and recruitment data for ${coachEmail}.`);
} finally {
  await closeDb();
}
