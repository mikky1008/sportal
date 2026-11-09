import type {
  Athlete, Skill, PerformanceSession, RankingResult, SessionStatus, SkillId, Scholarship, Notification, Sport,
  DirectoryAthlete, Inquiry, ThreadMessage,
} from "@/types";

export const sports: Sport[] = [
  { id: "basketball", name: "Basketball", aiSupported: true },
  { id: "volleyball", name: "Volleyball", aiSupported: false },
  { id: "athletics", name: "Track & Field", aiSupported: false },
  { id: "football", name: "Football", aiSupported: false },
];

export const currentAthlete: Athlete = {
  id: "a-001",
  role: "athlete",
  firstName: "Juan",
  lastName: "Dela Cruz",
  sport: "Basketball",
  position: "Guard",
  school: "Ateneo de Manila University",
  year: "2nd Year · BS Kinesiology",
  height: "5'11\" (180 cm)",
  weight: "72 kg",
  bio: "Quick, high-IQ combo guard who thrives in transition. Focused on building a consistent mid-range and catch-and-shoot game. Team captain, UAAP juniors alumni.",
  rank: 24,
  performanceScore: 92.5,
  consistency: 87,
  teamStatus: "Varsity",
  teamName: "Blue Eagles Team B",
  municipality: "Quezon City",
  province: "Metro Manila",
  achievements: [
    { title: "UAAP Juniors Mythical Five", year: "2024" },
    { title: "Team Captain — Blue Eagles Team B", year: "2025" },
    { title: "Regional 3-Point Shootout Champion", year: "2025" },
  ],
};

export const skills: Skill[] = [
  { id: "shooting", name: "Shooting", emoji: "🏀", primaryLabel: "Accuracy", primaryValue: "82%", consistency: 78, improvement: 6, aiReady: true },
  { id: "dribbling", name: "Dribbling", emoji: "🏀", primaryLabel: "Consistency", primaryValue: "75%", consistency: 75, improvement: 3, aiReady: false },
  { id: "passing", name: "Passing", emoji: "🏀", primaryLabel: "Accuracy", primaryValue: "80%", consistency: 74, improvement: 4, aiReady: false },
  { id: "layups", name: "Layups", emoji: "🏀", primaryLabel: "Success Rate", primaryValue: "77%", consistency: 72, improvement: -1, aiReady: false },
  { id: "agility", name: "Agility / Footwork", emoji: "⚡", primaryLabel: "Consistency", primaryValue: "85%", consistency: 85, improvement: 5, aiReady: false },
  { id: "vertical", name: "Vertical Jump", emoji: "🦘", primaryLabel: "Height", primaryValue: "72 cm", consistency: 81, improvement: 2, aiReady: false },
];

export const sessions: PerformanceSession[] = [
  { id: "s12", date: "Oct 29", isoDate: "2026-10-29", skill: "shooting", result: 82, consistency: 78, status: "AI-Assessed" },
  { id: "s11", date: "Oct 26", isoDate: "2026-10-26", skill: "shooting", result: 76, consistency: 70, status: "Coach-Verified", verifiedBy: "Coach Reyes" },
  { id: "s10", date: "Oct 22", isoDate: "2026-10-22", skill: "dribbling", result: 75, consistency: 73, status: "AI-Assessed" },
  { id: "s9", date: "Oct 19", isoDate: "2026-10-19", skill: "agility", result: 85, consistency: 84, status: "Coach-Verified", verifiedBy: "Coach Reyes" },
  { id: "s8", date: "Oct 15", isoDate: "2026-10-15", skill: "shooting", result: 74, consistency: 70, status: "AI-Assessed" },
  { id: "s7", date: "Oct 12", isoDate: "2026-10-12", skill: "passing", result: 80, consistency: 74, status: "Pending Review" },
  { id: "s6", date: "Oct 08", isoDate: "2026-10-08", skill: "layups", result: 77, consistency: 72, status: "AI-Assessed" },
  { id: "s5", date: "Oct 04", isoDate: "2026-10-04", skill: "shooting", result: 70, consistency: 66, status: "AI-Assessed" },
  { id: "s4", date: "Sep 30", isoDate: "2026-09-30", skill: "vertical", result: 72, consistency: 80, status: "Self-Reported" },
  { id: "s3", date: "Sep 26", isoDate: "2026-09-26", skill: "shooting", result: 68, consistency: 62, status: "AI-Assessed" },
  { id: "s2", date: "Sep 22", isoDate: "2026-09-22", skill: "shooting", result: 64, consistency: 60, status: "Coach-Verified", verifiedBy: "Coach Reyes" },
  { id: "s1", date: "Sep 18", isoDate: "2026-09-18", skill: "shooting", result: 60, consistency: 58, status: "AI-Assessed" },
];

export type TrendRange = "last5" | "last10" | "month" | "season";

export const trendData: Record<TrendRange, { label: string; score: number; consistency: number }[]> = {
  last5: [
    { label: "S1", score: 70, consistency: 60 },
    { label: "S2", score: 74, consistency: 70 },
    { label: "S3", score: 76, consistency: 70 },
    { label: "S4", score: 79, consistency: 80 },
    { label: "S5", score: 82, consistency: 80 },
  ],
  last10: [
    { label: "S1", score: 60, consistency: 55 }, { label: "S2", score: 64, consistency: 58 },
    { label: "S3", score: 63, consistency: 61 }, { label: "S4", score: 68, consistency: 62 },
    { label: "S5", score: 70, consistency: 60 }, { label: "S6", score: 74, consistency: 70 },
    { label: "S7", score: 73, consistency: 71 }, { label: "S8", score: 76, consistency: 70 },
    { label: "S9", score: 79, consistency: 80 }, { label: "S10", score: 82, consistency: 80 },
  ],
  month: [
    { label: "Wk 1", score: 72, consistency: 66 }, { label: "Wk 2", score: 75, consistency: 70 },
    { label: "Wk 3", score: 78, consistency: 74 }, { label: "Wk 4", score: 82, consistency: 78 },
  ],
  season: [
    { label: "Jun", score: 58, consistency: 52 }, { label: "Jul", score: 63, consistency: 57 },
    { label: "Aug", score: 67, consistency: 63 }, { label: "Sep", score: 72, consistency: 68 },
    { label: "Oct", score: 82, consistency: 78 },
  ],
};

export const scholarships: Scholarship[] = [
  { id: "sc1", name: "Athletic Excellence Scholarship", university: "National University", sport: "Basketball", eligibility: ["Top 50 sport ranking", "GPA 2.5+", "Incoming or current student"], deadline: "Dec 15, 2026", coverage: "Full tuition + stipend", details: "Covers full tuition, monthly allowance, and dormitory housing for varsity athletes." },
  { id: "sc2", name: "Green Archers Sports Grant", university: "De La Salle University", sport: "Basketball", eligibility: ["Varsity tryout passer", "Good academic standing"], deadline: "Jan 05, 2027", coverage: "75% tuition", details: "Partial grant for athletes selected after official tryouts." },
  { id: "sc3", name: "Tiger Varsity Scholarship", university: "University of Santo Tomas", sport: "Basketball", eligibility: ["Transferee or incoming student", "Coach endorsement"], deadline: "Nov 28, 2026", coverage: "Full tuition", details: "Renewable each semester subject to performance and academic standing." },
  { id: "sc4", name: "Fighting Maroons Athlete Fund", university: "UP Diliman", sport: "Basketball", eligibility: ["UPCAT passer", "Verified performance record"], deadline: "Feb 01, 2027", coverage: "Stipend + equipment", details: "Monthly stipend and training gear allowance." },
];

export const notifications: Notification[] = [
  { id: "n1", category: "analysis", title: "Analysis complete", message: "Your 10-Shot Challenge from Oct 29 has been analyzed: 80% accuracy.", time: "2h ago", read: false },
  { id: "n2", category: "ranking", title: "Ranking updated", message: "Your Basketball Shooting Accuracy ranking was recalculated from your latest session.", time: "5h ago", read: false },
  { id: "n3", category: "recruitment", title: "Message from FEU", message: "Coach Reyes invited you for a campus visit.", time: "1d ago", read: false },
  { id: "n4", category: "scholarship", title: "New scholarship match", message: "You meet the eligibility for Athletic Excellence Scholarship (NU).", time: "2d ago", read: true },
  { id: "n5", category: "application", title: "Application received", message: "Tiger Varsity Scholarship application is under review.", time: "3d ago", read: true },
  { id: "n6", category: "verification", title: "Session under review", message: "Your Oct 12 passing session is pending coach verification.", time: "4d ago", read: true },
];

// ============= Recruitment & talent discovery =============

/** The recruiter previewing the prototype console. */
export const currentRecruiter = {
  name: "Coach Miguel Reyes",
  organization: "FEU Tamaraws — Men's Basketball",
  role: "coach" as const,
};

export const athleteById = (id: string) => directoryAthletes.find((a) => a.id === id);

export const directoryAthletes: DirectoryAthlete[] = [
  {
    id: "a-001", firstName: "Juan", lastName: "Dela Cruz", sport: "Basketball", position: "Guard",
    school: "Ateneo de Manila University", year: "2nd Year · BS Kinesiology", height: "5'11\" (180 cm)",
    bio: currentAthlete.bio, performanceScore: 92.5, rank: 24, verifiedSessions: 3, totalSessions: 12,
    skills: [{ name: "Shooting", value: "82%" }, { name: "Dribbling", value: "75%" }, { name: "Passing", value: "80%" }],
    teamStatus: "Varsity", teamName: "Blue Eagles Team B", achievements: currentAthlete.achievements, municipality: "Quezon City", province: "Metro Manila", visible: true,
  },
  {
    id: "a-002", firstName: "Kevin", lastName: "Ramos", sport: "Basketball", position: "Guard",
    school: "De La Salle University", year: "3rd Year · BS Psychology", height: "6'0\" (183 cm)",
    bio: "Crafty lead guard with elite court vision. Runs the pick-and-roll at a college level already and rarely turns the ball over under pressure.",
    performanceScore: 93.4, rank: 22, verifiedSessions: 8, totalSessions: 10,
    skills: [{ name: "Passing", value: "88%" }, { name: "Dribbling", value: "85%" }, { name: "Shooting", value: "78%" }],
    teamStatus: "Varsity", teamName: "Green Archers Team A", achievements: [{ title: "UAAP Season 88 All-Rookie Team", year: "2025" }], municipality: "Manila", province: "Metro Manila", visible: true,
  },
  {
    id: "a-003", firstName: "Marco", lastName: "Villanueva", sport: "Basketball", position: "Forward",
    school: "University of Santo Tomas", year: "4th Year · BS Marketing", height: "6'3\" (190 cm)",
    bio: "Two-way forward who defends four positions. Strong finisher in transition with a developing corner-three game.",
    performanceScore: 93.0, rank: 23, verifiedSessions: 6, totalSessions: 9,
    skills: [{ name: "Shooting", value: "86%" }, { name: "Layups", value: "83%" }, { name: "Agility", value: "81%" }],
    teamStatus: "Varsity", teamName: "Growling Tigers Team B", achievements: [{ title: "UAAP Juniors Best Forward", year: "2024" }], municipality: "Manila", province: "Metro Manila", visible: true,
  },
  {
    id: "a-004", firstName: "Paolo", lastName: "Santos", sport: "Basketball", position: "Center",
    school: "UP Diliman", year: "2nd Year · BS Sports Science", height: "6'5\" (196 cm)",
    bio: "Traditional rim protector with soft touch from the free-throw line. Averaged 2.8 blocks in juniors play.",
    performanceScore: 92.1, rank: 25, verifiedSessions: 2, totalSessions: 9,
    skills: [{ name: "Layups", value: "84%" }, { name: "Vertical", value: "68 cm" }],
    teamStatus: "Junior Varsity", teamName: "Maroons Team B", achievements: [{ title: "NCR Juniors Blocking Leader", year: "2025" }], municipality: "Quezon City", province: "Metro Manila", visible: true,
  },
  {
    id: "a-005", firstName: "Rafael", lastName: "Cruz", sport: "Basketball", position: "Guard",
    school: "FEU", year: "3rd Year · BS Accountancy", height: "6'1\" (185 cm)",
    bio: "Combo guard and the most consistent scorer in this class — 89% session consistency across the season.",
    performanceScore: 91.7, rank: 26, verifiedSessions: 5, totalSessions: 8,
    skills: [{ name: "Shooting", value: "81%" }, { name: "Agility", value: "89%" }],
    teamStatus: "Varsity", teamName: "Tamaraws Team B", achievements: [{ title: "FEU Team B Captain", year: "2025" }], municipality: "Manila", province: "Metro Manila", visible: true,
  },
  {
    id: "a-006", firstName: "Bea", lastName: "Mendoza", sport: "Volleyball", position: "Opposite Hitter",
    school: "Ateneo de Manila University", year: "3rd Year · BS Management", height: "5'9\" (175 cm)",
    bio: "High-point opposite hitter with a reliable serve. Leads the league in spike accuracy this season.",
    performanceScore: 88.0, rank: 1, verifiedSessions: 7, totalSessions: 11,
    skills: [{ name: "Spike Accuracy", value: "88%" }, { name: "Serve Consistency", value: "84%" }],
    teamStatus: "Varsity", teamName: "Lady Eagles", achievements: [{ title: "UAAP Season 88 Spike Accuracy Leader", year: "2026" }], municipality: "Quezon City", province: "Metro Manila", visible: true,
  },
  {
    id: "a-007", firstName: "Alyssa", lastName: "Reyes", sport: "Volleyball", position: "Setter",
    school: "De La Salle University", year: "2nd Year · BS Biology", height: "5'7\" (170 cm)",
    bio: "Floor-general setter with quick hands and sharp decision-making in transition.",
    performanceScore: 86.4, rank: 2, verifiedSessions: 4, totalSessions: 9,
    skills: [{ name: "Spike Accuracy", value: "86%" }, { name: "Setting Consistency", value: "90%" }],
    teamStatus: "Varsity", teamName: "Lady Spikers", achievements: [{ title: "PNVF Club Nationals Best Setter", year: "2025" }], municipality: "Manila", province: "Metro Manila", visible: true,
  },
  {
    id: "a-008", firstName: "Eric", lastName: "Cray Jr.", sport: "Track & Field", position: "Sprinter",
    school: "UP Diliman", year: "3rd Year · BS Mechanical Engineering", height: "5'10\" (178 cm)",
    bio: "Collegiate 100m leader. Explosive starter with national junior finals experience.",
    performanceScore: 95.1, rank: 1, verifiedSessions: 9, totalSessions: 12,
    skills: [{ name: "100m Sprint", value: "10.6s" }, { name: "Reaction Time", value: "0.14s" }],
    teamStatus: "Club / Community", teamName: "NCR Sprint Club", achievements: [{ title: "UAAP 100m Champion", year: "2026" }], municipality: "Quezon City", province: "Metro Manila", visible: true,
  },
  {
    id: "a-009", firstName: "Jerome", lastName: "Pacaña", sport: "Basketball", position: "Guard",
    school: "Xavier University – Ateneo de Cagayan", year: "2nd Year · BS Information Technology", height: "5'10\" (178 cm)",
    bio: "Fearless shooting guard from Cagayan de Oro. Lives for catch-and-shoot threes off screens.",
    performanceScore: 81.4, rank: 0, verifiedSessions: 3, totalSessions: 7,
    skills: [{ name: "Shooting", value: "84%" }, { name: "Dribbling", value: "78%" }],
    teamStatus: "Varsity", teamName: "Crusaders Team A", municipality: "Cagayan de Oro City", province: "Misamis Oriental", achievements: [{ title: "Northern Mindanao Collegiate MVP", year: "2025" }], visible: true,
  },
  {
    id: "a-010", firstName: "Dennis", lastName: "Abellanosa", sport: "Basketball", position: "Forward",
    school: "Liceo de Cagayan University", year: "3rd Year · BS Criminology", height: "6'2\" (188 cm)",
    bio: "Physical forward who rebounds in traffic and finishes through contact.",
    performanceScore: 79.8, rank: 0, verifiedSessions: 2, totalSessions: 6,
    skills: [{ name: "Layups", value: "82%" }, { name: "Shooting", value: "76%" }],
    teamStatus: "Varsity", teamName: "Liceo Hawks", municipality: "Cagayan de Oro City", province: "Misamis Oriental", achievements: [{ title: "CDO City Meet Rebounding Leader", year: "2025" }], visible: true,
  },
  {
    id: "a-011", firstName: "Christian", lastName: "Lumapas", sport: "Basketball", position: "Center",
    school: "Capitol University", year: "1st Year · BS Civil Engineering", height: "6'4\" (193 cm)",
    bio: "Rim protector with quick feet for his size. Still developing a mid-range touch.",
    performanceScore: 74.2, rank: 0, verifiedSessions: 1, totalSessions: 5,
    skills: [{ name: "Layups", value: "79%" }, { name: "Shooting", value: "71%" }],
    teamStatus: "Junior Varsity", teamName: "Capitol Team B", municipality: "Cagayan de Oro City", province: "Misamis Oriental", achievements: [], visible: true,
  },
  {
    id: "a-012", firstName: "Ryan", lastName: "Tabuada", sport: "Basketball", position: "Guard",
    school: "MSU – Iligan Institute of Technology", year: "3rd Year · BS Electrical Engineering", height: "5'9\" (175 cm)",
    bio: "Pass-first guard who sets the tempo. Strong free-throw shooter.",
    performanceScore: 80.1, rank: 0, verifiedSessions: 4, totalSessions: 6,
    skills: [{ name: "Shooting", value: "80%" }, { name: "Passing", value: "83%" }],
    teamStatus: "Varsity", teamName: "MSU-IIT Team A", municipality: "Iligan City", province: "Lanao del Norte", achievements: [{ title: "Lanao Collegiate Assist Leader", year: "2025" }], visible: true,
  },
  {
    id: "a-013", firstName: "Bianca", lastName: "Ladera", sport: "Volleyball", position: "Outside Hitter",
    school: "Xavier University – Ateneo de Cagayan", year: "2nd Year · BS Nursing", height: "5'8\" (173 cm)",
    bio: "Aggressive outside hitter with a high swing and a reliable jump serve.",
    performanceScore: 82.0, rank: 0, verifiedSessions: 3, totalSessions: 5,
    skills: [{ name: "Spike Accuracy", value: "82%" }],
    teamStatus: "Varsity", teamName: "Lady Crusaders", municipality: "Cagayan de Oro City", province: "Misamis Oriental", achievements: [], visible: true,
  },
  {
    id: "a-014", firstName: "Mark", lastName: "Gimena", sport: "Track & Field", position: "Sprinter",
    school: "Liceo de Cagayan University", year: "1st Year · BS Sports Science", height: "5'11\" (180 cm)",
    bio: "Rising sprinter from Cagayan de Oro with a strong second half of the race.",
    performanceScore: 84.0, rank: 0, verifiedSessions: 2, totalSessions: 5,
    skills: [{ name: "100m Sprint", value: "11.2s" }],
    teamStatus: "Club / Community", teamName: "CDO Athletics Club", municipality: "Cagayan de Oro City", province: "Misamis Oriental", achievements: [{ title: "Regional Meet 100m Finalist", year: "2026" }], visible: true,
  },
  {
    id: "a-015", firstName: "Joel", lastName: "Barrientos", sport: "Basketball", position: "Guard",
    school: "SNSU – Mainit Campus", year: "2nd Year", height: "5'10\" (178 cm)",
    bio: "Sample athlete. Quick guard who pushes the pace.",
    performanceScore: 78.0, rank: 0, verifiedSessions: 2, totalSessions: 5,
    skills: [{ name: "Shooting", value: "83%" }],
    teamStatus: "Varsity", teamName: "Mainit Team A", municipality: "Mainit", province: "Surigao del Norte", achievements: [], visible: true,
  },
  {
    id: "a-016", firstName: "Ramil", lastName: "Pecson", sport: "Basketball", position: "Forward",
    school: "SNSU – Mainit Campus", year: "2nd Year", height: "5'10\" (178 cm)",
    bio: "Sample athlete. Hard-working forward and a strong rebounder.",
    performanceScore: 78.0, rank: 0, verifiedSessions: 2, totalSessions: 5,
    skills: [{ name: "Shooting", value: "77%" }],
    teamStatus: "Varsity", teamName: "Mainit Team A", municipality: "Mainit", province: "Surigao del Norte", achievements: [], visible: true,
  },
  {
    id: "a-017", firstName: "Kent", lastName: "Oyao", sport: "Basketball", position: "Guard",
    school: "SNSU – Malimono Campus", year: "2nd Year", height: "5'10\" (178 cm)",
    bio: "Sample athlete. Catch-and-shoot specialist.",
    performanceScore: 78.0, rank: 0, verifiedSessions: 2, totalSessions: 5,
    skills: [{ name: "Shooting", value: "80%" }],
    teamStatus: "Varsity", teamName: "Malimono Team A", municipality: "Malimono", province: "Surigao del Norte", achievements: [], visible: true,
  },
  {
    id: "a-018", firstName: "Allan", lastName: "Gonzaga", sport: "Basketball", position: "Center",
    school: "SNSU – Del Carmen Campus", year: "2nd Year", height: "5'10\" (178 cm)",
    bio: "Sample athlete. Rim protector with good timing.",
    performanceScore: 78.0, rank: 0, verifiedSessions: 2, totalSessions: 5,
    skills: [{ name: "Shooting", value: "72%" }],
    teamStatus: "Varsity", teamName: "Del Carmen Team A", municipality: "Del Carmen", province: "Surigao del Norte", achievements: [], visible: true,
  },
  {
    id: "a-019", firstName: "Noel", lastName: "Bayron", sport: "Basketball", position: "Guard",
    school: "Dapa National High School", year: "2nd Year", height: "5'10\" (178 cm)",
    bio: "Sample athlete. Pass-first point guard.",
    performanceScore: 78.0, rank: 0, verifiedSessions: 2, totalSessions: 5,
    skills: [{ name: "Shooting", value: "79%" }],
    teamStatus: "Varsity", teamName: "Dapa Varsity", municipality: "Dapa", province: "Surigao del Norte", achievements: [], visible: true,
  },
  {
    id: "a-020", firstName: "Rey", lastName: "Cañete", sport: "Basketball", position: "Forward",
    school: "Placer National High School", year: "2nd Year", height: "5'10\" (178 cm)",
    bio: "Sample athlete. Athletic wing who finishes in transition.",
    performanceScore: 78.0, rank: 0, verifiedSessions: 2, totalSessions: 5,
    skills: [{ name: "Shooting", value: "75%" }],
    teamStatus: "Varsity", teamName: "Placer Varsity", municipality: "Placer", province: "Surigao del Norte", achievements: [], visible: true,
  },
  {
    id: "a-021", firstName: "Maricel", lastName: "Ayuban", sport: "Volleyball", position: "Outside Hitter",
    school: "Dapa National High School", year: "2nd Year", height: "5'10\" (178 cm)",
    bio: "Sample athlete. Consistent attacker with a reliable serve.",
    performanceScore: 78.0, rank: 0, verifiedSessions: 2, totalSessions: 5,
    skills: [{ name: "Spike Accuracy", value: "81%" }],
    teamStatus: "Varsity", teamName: "Dapa Lady Spikers", municipality: "Dapa", province: "Surigao del Norte", achievements: [], visible: true,
  },
];

// ============= Ranking inputs for athletes other than the signed-in one =============
// Sample data. Rankings are computed from these results by src/lib/rankings.ts — no rank number
// is stored. Real accounts would supply each athlete's sessions from the server.

type S = [skill: SkillId, result: number, consistency: number, status: SessionStatus];
const mk = (id: string, rows: S[]): PerformanceSession[] =>
  rows.map(([skill, result, consistency, status], i) => ({
    id: `${id}-s${i + 1}`,
    date: "Oct 20", isoDate: "2026-10-20",
    skill,
    result,
    consistency,
    status,
    ...(status === "Coach-Verified" ? { verifiedBy: "Coach Reyes" } : {}),
  }));

export const competitorSessions: Record<string, PerformanceSession[]> = {
  "a-002": mk("a-002", [["shooting", 78, 84, "Coach-Verified"], ["shooting", 80, 85, "AI-Assessed"], ["shooting", 76, 83, "Coach-Verified"], ["shooting", 79, 84, "AI-Assessed"], ["passing", 88, 86, "Coach-Verified"], ["dribbling", 85, 84, "Coach-Verified"]]),
  "a-003": mk("a-003", [["shooting", 86, 82, "Coach-Verified"], ["shooting", 85, 80, "AI-Assessed"], ["shooting", 87, 83, "AI-Assessed"], ["shooting", 84, 81, "Coach-Verified"], ["layups", 83, 80, "AI-Assessed"], ["agility", 81, 79, "Coach-Verified"]]),
  "a-004": mk("a-004", [["shooting", 70, 74, "AI-Assessed"], ["shooting", 72, 75, "AI-Assessed"], ["shooting", 69, 73, "AI-Assessed"], ["layups", 84, 78, "AI-Assessed"], ["layups", 85, 79, "Coach-Verified"], ["vertical", 68, 80, "Self-Reported"], ["passing", 74, 70, "Pending Review"]]),
  "a-005": mk("a-005", [["shooting", 81, 89, "Coach-Verified"], ["shooting", 80, 90, "Coach-Verified"], ["shooting", 82, 88, "AI-Assessed"], ["shooting", 81, 89, "AI-Assessed"], ["agility", 89, 90, "Coach-Verified"]]),
  "a-009": mk("a-009", [["shooting", 84, 80, "Coach-Verified"], ["shooting", 83, 79, "AI-Assessed"], ["shooting", 85, 82, "AI-Assessed"], ["shooting", 82, 78, "Coach-Verified"], ["dribbling", 78, 76, "AI-Assessed"]]),
  "a-010": mk("a-010", [["shooting", 76, 72, "AI-Assessed"], ["shooting", 75, 70, "Coach-Verified"], ["shooting", 77, 73, "AI-Assessed"], ["layups", 82, 77, "AI-Assessed"]]),
  "a-011": mk("a-011", [["shooting", 71, 68, "AI-Assessed"], ["shooting", 70, 66, "AI-Assessed"], ["layups", 79, 72, "Coach-Verified"]]),
  "a-012": mk("a-012", [["shooting", 80, 78, "Coach-Verified"], ["shooting", 79, 77, "Coach-Verified"], ["shooting", 81, 79, "AI-Assessed"], ["passing", 83, 80, "AI-Assessed"]]),
  "a-015": mk("a-015", [["shooting", 83, 80, "Coach-Verified"], ["shooting", 82, 79, "AI-Assessed"], ["shooting", 84, 81, "AI-Assessed"], ["shooting", 83, 80, "Coach-Verified"]]),
  "a-016": mk("a-016", [["shooting", 77, 74, "AI-Assessed"], ["shooting", 76, 73, "AI-Assessed"], ["shooting", 78, 75, "Coach-Verified"]]),
  "a-017": mk("a-017", [["shooting", 80, 77, "Coach-Verified"], ["shooting", 81, 78, "AI-Assessed"], ["shooting", 79, 76, "AI-Assessed"]]),
  "a-018": mk("a-018", [["shooting", 72, 70, "AI-Assessed"], ["shooting", 71, 69, "AI-Assessed"], ["shooting", 73, 71, "AI-Assessed"]]),
  "a-019": mk("a-019", [["shooting", 79, 76, "Coach-Verified"], ["shooting", 78, 75, "Coach-Verified"], ["shooting", 80, 77, "AI-Assessed"]]),
  "a-020": mk("a-020", [["shooting", 75, 72, "AI-Assessed"], ["shooting", 74, 71, "AI-Assessed"], ["shooting", 76, 73, "AI-Assessed"]]),
};

const sessionsOf = (metric: string, vals: [number, SessionStatus][]): RankingResult[] =>
  vals.map(([value, status]) => ({ metric, value, status }));

export const competitorResults: Record<string, RankingResult[]> = {
  "a-006": sessionsOf("Spike Accuracy", [[88, "Coach-Verified"], [87, "AI-Assessed"], [89, "Coach-Verified"], [88, "AI-Assessed"]]),
  "a-007": sessionsOf("Spike Accuracy", [[86, "AI-Assessed"], [85, "Coach-Verified"], [87, "AI-Assessed"]]),
  "a-013": sessionsOf("Spike Accuracy", [[82, "Coach-Verified"], [81, "AI-Assessed"], [83, "AI-Assessed"]]),
  "a-008": sessionsOf("100m Sprint (s)", [[10.6, "Coach-Verified"], [10.7, "Coach-Verified"], [10.5, "AI-Assessed"]]),
  "a-014": sessionsOf("100m Sprint (s)", [[11.2, "AI-Assessed"], [11.3, "AI-Assessed"], [11.1, "Coach-Verified"]]),
  "a-021": sessionsOf("Spike Accuracy", [[81, "Coach-Verified"], [80, "AI-Assessed"], [82, "AI-Assessed"]]),
};

