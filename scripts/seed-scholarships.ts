// Adds the starter scholarships (the four that used to be hardcoded in the app) to the database.
//
//   npm run seed:scholarships
//
// They have no poster, so only an admin can close them. Safe to run twice: a scholarship with the
// same name and university is skipped. University representatives post their own from the
// Scholarships page.

import { randomUUID } from "node:crypto";
import { closeDb, getDb } from "../server/db.server.ts";

const rows = [
  { name: "Athletic Excellence Scholarship", university: "National University", sport: "Basketball", coverage: "Full tuition + stipend", deadline: "2026-12-15",
    eligibility: ["Top 50 sport ranking", "GPA 2.5+", "Incoming or current student"], details: "Covers full tuition, monthly allowance, and dormitory housing for varsity athletes." },
  { name: "Green Archers Sports Grant", university: "De La Salle University", sport: "Basketball", coverage: "75% tuition", deadline: "2027-01-05",
    eligibility: ["Varsity tryout passer", "Good academic standing"], details: "Partial grant for athletes selected after official tryouts." },
  { name: "Tiger Varsity Scholarship", university: "University of Santo Tomas", sport: "Basketball", coverage: "Full tuition", deadline: "2026-11-28",
    eligibility: ["Transferee or incoming student", "Coach endorsement"], details: "Renewable each semester subject to performance and academic standing." },
  { name: "Fighting Maroons Athlete Fund", university: "UP Diliman", sport: "Basketball", coverage: "Stipend + equipment", deadline: "2027-02-01",
    eligibility: ["UPCAT passer", "Verified performance record"], details: "Monthly stipend and training gear allowance." },
];

const db = await getDb();
let added = 0;
for (const r of rows) {
  const now = new Date();
  const out = await db`
    INSERT INTO scholarships (id, posted_by, university, name, sport, coverage, details, eligibility, deadline, created_at, updated_at)
    SELECT ${randomUUID()}, NULL, ${r.university}, ${r.name}, ${r.sport}, ${r.coverage}, ${r.details}, ${db.json(r.eligibility)}, ${r.deadline}::date, ${now}, ${now}
    WHERE NOT EXISTS (SELECT 1 FROM scholarships WHERE name = ${r.name} AND university = ${r.university})
    RETURNING id`;
  added += out.length;
}
console.log(`Added ${added} scholarship(s); ${rows.length - added} already existed.`);
await closeDb();
