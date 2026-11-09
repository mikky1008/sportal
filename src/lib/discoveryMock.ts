// Mock cross-university athletes for the Athlete Discovery screen. Frontend-only: nothing here
// touches the API or the database. Swap `DISCOVERY_ATHLETES` for a fetch when the backend is ready.
import type { SessionStatus } from "@/types";

export const YEAR_LEVELS = ["1st Year", "2nd Year", "3rd Year", "4th Year"] as const;

export interface DiscoveryAthlete {
  id: string;
  name: string;
  sport: string;
  position: string;
  school: string;
  city: string;
  year: (typeof YEAR_LEVELS)[number];
  /** Coach-verified results. AI-assessed or self-reported results do not make an athlete verified. */
  verified: boolean;
  rank: number;
  performance: number; // %
  consistency: number; // %
  /** the three numbers shown on the card */
  chips: { label: string; value: string }[];
  /** 0-100 bars in the profile modal */
  skills: { name: string; value: number }[];
  achievements: { icon: string; title: string }[];
  logged: { date: string; label: string; result: string; status: SessionStatus }[];
  videos: { title: string; length: string }[];
}

type Seed = Omit<DiscoveryAthlete, "achievements" | "logged" | "videos"> & {
  ach: string[];
  log: [string, string, string, SessionStatus][];
  vids: [string, string][];
};

const seeds: Seed[] = [
  { id: "a1", name: "Juan Dela Cruz", sport: "Basketball", position: "Point Guard", school: "Ateneo de Manila", city: "Quezon City", year: "3rd Year", verified: true, rank: 1, performance: 92.5, consistency: 87,
    chips: [{ label: "Perf", value: "92.5%" }, { label: "Consistency", value: "87%" }, { label: "Vert", value: "34.5 in" }],
    skills: [{ name: "Shooting accuracy", value: 82 }, { name: "Speed & agility", value: 95 }, { name: "Vertical jump", value: 78 }, { name: "Defensive rating", value: 88 }],
    ach: ["2025 UAAP Season MVP candidate", "National Collegiate Youth Games, gold"],
    log: [["Nov 2", "10-Shot Challenge", "84%", "Coach-Verified"], ["Oct 26", "Lane Agility Test", "93%", "Coach-Verified"], ["Oct 19", "Standing Vertical", "87.6 cm", "AI-Assessed"]],
    vids: [["Season highlight reel", "3:45"], ["Shooting form assessment", "1:30"]] },
  { id: "a2", name: "Kevin Ramos", sport: "Basketball", position: "Shooting Guard", school: "De La Salle University", city: "Manila", year: "2nd Year", verified: true, rank: 2, performance: 94.1, consistency: 91,
    chips: [{ label: "Perf", value: "94.1%" }, { label: "Consistency", value: "91%" }, { label: "3PT", value: "42%" }],
    skills: [{ name: "Shooting accuracy", value: 91 }, { name: "Speed & agility", value: 80 }, { name: "Vertical jump", value: 72 }, { name: "Defensive rating", value: 76 }],
    ach: ["UAAP Rookie of the Year finalist", "Top 3-point shooter, Season 87"],
    log: [["Nov 5", "10-Shot Challenge", "92%", "Coach-Verified"], ["Oct 30", "10-Shot Challenge", "90%", "Coach-Verified"], ["Oct 22", "Cone Weave Drill", "85%", "Self-Reported"]],
    vids: [["Catch-and-shoot clips", "2:10"], ["Game film, vs. UST", "4:20"]] },
  { id: "a3", name: "Marco Villanueva", sport: "Basketball", position: "Center", school: "University of Santo Tomas", city: "Manila", year: "4th Year", verified: true, rank: 3, performance: 88.4, consistency: 83,
    chips: [{ label: "Perf", value: "88.4%" }, { label: "Consistency", value: "83%" }, { label: "Vert", value: "31.0 in" }],
    skills: [{ name: "Shooting accuracy", value: 70 }, { name: "Speed & agility", value: 68 }, { name: "Vertical jump", value: 85 }, { name: "Defensive rating", value: 93 }],
    ach: ["UAAP Defensive Player of the Year, 2024"],
    log: [["Nov 1", "Standing Vertical", "78.7 cm", "Coach-Verified"], ["Oct 25", "Layup Drill", "88%", "AI-Assessed"]],
    vids: [["Rim protection reel", "2:40"]] },
  { id: "a4", name: "Paolo Mercado", sport: "Basketball", position: "Point Guard", school: "Far Eastern University", city: "Manila", year: "3rd Year", verified: false, rank: 6, performance: 85.2, consistency: 79,
    chips: [{ label: "Perf", value: "85.2%" }, { label: "Consistency", value: "79%" }, { label: "Vert", value: "29.5 in" }],
    skills: [{ name: "Shooting accuracy", value: 74 }, { name: "Speed & agility", value: 89 }, { name: "Vertical jump", value: 66 }, { name: "Defensive rating", value: 71 }],
    ach: ["FEU Tamaraws team captain, 2025"],
    log: [["Nov 3", "10-Shot Challenge", "76%", "Pending Review"], ["Oct 28", "Lane Agility Test", "90%", "Self-Reported"]],
    vids: [["Pick-and-roll clips", "1:55"]] },
  { id: "a5", name: "Bea Santos", sport: "Volleyball", position: "Outside Hitter", school: "De La Salle University", city: "Manila", year: "3rd Year", verified: true, rank: 1, performance: 90.3, consistency: 88,
    chips: [{ label: "Spike", value: "61%" }, { label: "Serve", value: "89%" }, { label: "Consistency", value: "88%" }],
    skills: [{ name: "Spiking", value: 87 }, { name: "Serving accuracy", value: 89 }, { name: "Blocking", value: 74 }, { name: "Reception", value: 81 }],
    ach: ["Best Outside Spiker, UAAP Season 86", "Philippine University Games, silver"],
    log: [["Nov 4", "Serving Drill", "90%", "Coach-Verified"], ["Oct 27", "Spiking Drill", "62%", "Coach-Verified"]],
    vids: [["Attack highlights", "3:05"], ["Serve receive breakdown", "1:45"]] },
  { id: "a6", name: "Camille Reyes", sport: "Volleyball", position: "Setter", school: "Ateneo de Manila", city: "Quezon City", year: "2nd Year", verified: true, rank: 2, performance: 87.9, consistency: 90,
    chips: [{ label: "Assist", value: "92%" }, { label: "Serve", value: "84%" }, { label: "Consistency", value: "90%" }],
    skills: [{ name: "Setting accuracy", value: 92 }, { name: "Serving accuracy", value: 84 }, { name: "Blocking", value: 69 }, { name: "Reception", value: 77 }],
    ach: ["Best Setter, Collegiate Invitational 2025"],
    log: [["Nov 6", "Serving Drill", "85%", "Coach-Verified"], ["Oct 29", "Target Setting Drill", "93%", "Coach-Verified"]],
    vids: [["Setting mechanics", "2:20"]] },
  { id: "a7", name: "Jasmine Cortez", sport: "Volleyball", position: "Libero", school: "University of Santo Tomas", city: "Manila", year: "1st Year", verified: false, rank: 5, performance: 82.0, consistency: 76,
    chips: [{ label: "Dig", value: "78%" }, { label: "Reception", value: "83%" }, { label: "Consistency", value: "76%" }],
    skills: [{ name: "Digging", value: 78 }, { name: "Reception", value: 83 }, { name: "Serving accuracy", value: 70 }, { name: "Court coverage", value: 86 }],
    ach: ["Junior national pool, 2023"],
    log: [["Nov 2", "Reception Drill", "83%", "Self-Reported"]],
    vids: [["Defense reel", "2:00"]] },
  { id: "a8", name: "Rico Aquino", sport: "Track & Field", position: "Sprinter (100m)", school: "University of the Philippines Diliman", city: "Quezon City", year: "4th Year", verified: true, rank: 1, performance: 91.7, consistency: 94,
    chips: [{ label: "100m", value: "10.78 s" }, { label: "Consistency", value: "94%" }, { label: "Perf", value: "91.7%" }],
    skills: [{ name: "Start reaction", value: 90 }, { name: "Top speed", value: 93 }, { name: "Acceleration", value: 88 }, { name: "Endurance", value: 72 }],
    ach: ["UAAP 100m champion, 2025", "PH National Games, bronze"],
    log: [["Nov 5", "100m Sprint", "10.78 s", "Coach-Verified"], ["Oct 24", "100m Sprint", "10.84 s", "Coach-Verified"]],
    vids: [["Race footage, UAAP finals", "1:10"], ["Start block technique", "0:55"]] },
  { id: "a9", name: "Dana Lim", sport: "Track & Field", position: "Sprinter (100m)", school: "Mapúa University", city: "Manila", year: "2nd Year", verified: false, rank: 4, performance: 84.6, consistency: 81,
    chips: [{ label: "100m", value: "12.31 s" }, { label: "Consistency", value: "81%" }, { label: "Perf", value: "84.6%" }],
    skills: [{ name: "Start reaction", value: 78 }, { name: "Top speed", value: 82 }, { name: "Acceleration", value: 80 }, { name: "Endurance", value: 70 }],
    ach: ["NCAA Season 100 finalist, 100m"],
    log: [["Nov 1", "100m Sprint", "12.31 s", "Pending Review"], ["Oct 20", "100m Sprint", "12.40 s", "Self-Reported"]],
    vids: [["Heat 2 footage", "0:50"]] },
  { id: "a10", name: "Gabriel Tan", sport: "Basketball", position: "Small Forward", school: "University of the Philippines Diliman", city: "Quezon City", year: "1st Year", verified: false, rank: 9, performance: 79.8, consistency: 74,
    chips: [{ label: "Perf", value: "79.8%" }, { label: "Consistency", value: "74%" }, { label: "Vert", value: "30.2 in" }],
    skills: [{ name: "Shooting accuracy", value: 68 }, { name: "Speed & agility", value: 77 }, { name: "Vertical jump", value: 74 }, { name: "Defensive rating", value: 70 }],
    ach: ["High school MVP, 2024"],
    log: [["Nov 3", "Layup Drill", "81%", "AI-Assessed"]],
    vids: [["Freshman mixtape", "2:30"]] },
];

export const DISCOVERY_ATHLETES: DiscoveryAthlete[] = seeds.map(({ ach, log, vids, ...a }) => ({
  ...a,
  achievements: ach.map((title, i) => ({ icon: i === 0 ? "🏆" : "🥇", title })),
  logged: log.map(([date, label, result, status]) => ({ date, label, result, status })),
  videos: vids.map(([title, length]) => ({ title, length })),
}));
