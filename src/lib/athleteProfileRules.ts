// Athlete profile shapes and validation rules, shared by the API (server/athlete-profile.server.ts)
// and the Settings / Complete Profile forms, so both sides always agree on what is valid.
// Plain TypeScript only (no app or Node imports besides the sports list): it runs in the browser and under Node.

import type { TeamStatus } from "../types/index.ts";
import { sports } from "./sports.ts";

export const TEAM_STATUSES: TeamStatus[] = [
  "Varsity",
  "Junior Varsity",
  "Reserve",
  "Club / Community",
  "Not on a team",
];

/** Every municipality is in this province, so the server fills the province in when one is chosen. */
export const PROVINCE = "Surigao del Norte";

/** The municipalities an athlete can pick (they drive the Municipality filter in Rankings). */
export const MUNICIPALITIES = [
  "Alegria", "Bacuag", "Burgos", "Claver", "Dapa", "Del Carmen", "General Luna", "Gigaquit", "Mainit", "Malimono",
  "Pilar", "Placer", "San Benito", "San Francisco", "San Isidro", "Santa Monica", "Sison", "Socorro", "Tagana-an", "Tubod",
] as const;

/** The ranking categories an athlete can belong to (Rankings has a Category filter). */
export const CATEGORIES = ["Men's Collegiate", "Women's Collegiate", "Juniors"] as const;

export const LIMITS = {
  name: 40,
  position: 40,
  school: 100,
  year: 60,
  teamName: 60,
  bio: 300,
  achievementTitle: 80,
  achievements: 10,
  heightCm: { min: 120, max: 230 },
  weightKg: { min: 30, max: 200 },
  firstAchievementYear: 1990,
} as const;

/** What the Settings form holds: everything as text, exactly as typed. */
export interface ProfileDraft {
  firstName: string;
  lastName: string;
  sport: string;
  position: string;
  school: string;
  /** one of MUNICIPALITIES, or "" when not chosen */
  municipality: string;
  /** one of CATEGORIES, or "" when not chosen */
  category: string;
  year: string;
  heightCm: string;
  weightKg: string;
  teamStatus: TeamStatus;
  teamName: string;
  bio: string;
  achievements: { title: string; year: string }[];
}

export type ProfileErrors = Partial<Record<Exclude<keyof ProfileDraft, "achievements">, string>> & {
  /** one entry per achievement row (empty string = row is fine) */
  achievements?: string[];
  achievementsTotal?: string;
};

export class ProfileValidationError extends Error {
  readonly errors: ProfileErrors;
  constructor(errors: ProfileErrors) {
    super("Profile has errors");
    this.name = "ProfileValidationError";
    this.errors = errors;
  }
}

// ---------- height / weight helpers ----------

export function formatHeight(cm: number): string {
  const totalIn = Math.round(cm / 2.54);
  return `${Math.floor(totalIn / 12)}'${totalIn % 12}" (${Math.round(cm)} cm)`;
}
export function formatWeight(kg: number): string {
  return `${Math.round(kg * 10) / 10} kg`;
}
/** Reads "5'11\" (180 cm)" → 180. Returns null when no cm figure is present. */
export function parseHeightCm(s: string): number | null {
  const m = /(\d+(?:\.\d+)?)\s*cm/i.exec(s);
  return m ? Number(m[1]) : null;
}
export function parseWeightKg(s: string): number | null {
  const m = /(\d+(?:\.\d+)?)\s*kg/i.exec(s);
  return m ? Number(m[1]) : null;
}

// ---------- validation ----------

function parseNumber(s: string): number | null {
  const t = s.trim();
  if (!/^\d+(\.\d+)?$/.test(t)) return null;
  return Number(t);
}

/**
 * `partial` lets a profile be saved one section at a time: an empty field is simply "not done yet",
 * but anything that IS filled in must still be valid. It is on by default because every account
 * starts with a blank profile; pass false to require every field.
 */
export function validateProfile(
  d: ProfileDraft,
  now: Date = new Date(),
  partial: boolean = true,
): ProfileErrors {
  const e: ProfileErrors = {};
  const req = (key: "firstName" | "lastName" | "school" | "sport", label: string, max: number) => {
    const v = d[key].trim();
    if (!v) {
      if (!partial) e[key] = `${label} is required.`;
    } else if (v.length > max) e[key] = `${label} must be ${max} characters or fewer.`;
  };
  req("firstName", "First name", LIMITS.name);
  req("lastName", "Last name", LIMITS.name);
  req("school", "School", LIMITS.school);
  req("sport", "Sport", 60);
  if (!e.sport && !(partial && !d.sport.trim()) && !sports.some((s) => s.name === d.sport))
    e.sport = "Choose a sport from the list.";

  if (d.municipality.trim() && !(MUNICIPALITIES as readonly string[]).includes(d.municipality))
    e.municipality = "Choose a municipality from the list.";

  if (d.category.trim() && !(CATEGORIES as readonly string[]).includes(d.category))
    e.category = "Choose a category from the list.";

  if (d.position.trim().length > LIMITS.position)
    e.position = `Position must be ${LIMITS.position} characters or fewer.`;
  if (d.year.trim().length > LIMITS.year)
    e.year = `Year level must be ${LIMITS.year} characters or fewer.`;
  if (d.bio.length > LIMITS.bio)
    e.bio = `Bio must be ${LIMITS.bio} characters or fewer (${d.bio.length} now).`;

  const h = parseNumber(d.heightCm);
  if (!(partial && !d.heightCm.trim()) && (h === null || h < LIMITS.heightCm.min || h > LIMITS.heightCm.max))
    e.heightCm = `Enter a height between ${LIMITS.heightCm.min} and ${LIMITS.heightCm.max} cm.`;
  const w = parseNumber(d.weightKg);
  if (!(partial && !d.weightKg.trim()) && (w === null || w < LIMITS.weightKg.min || w > LIMITS.weightKg.max))
    e.weightKg = `Enter a weight between ${LIMITS.weightKg.min} and ${LIMITS.weightKg.max} kg.`;

  if (!(partial && !d.teamStatus) && !TEAM_STATUSES.includes(d.teamStatus)) e.teamStatus = "Choose a team status.";
  if (d.teamStatus !== "Not on a team" && d.teamName.trim().length > LIMITS.teamName)
    e.teamName = `Team name must be ${LIMITS.teamName} characters or fewer.`;

  if (d.achievements.length > LIMITS.achievements)
    e.achievementsTotal = `You can list up to ${LIMITS.achievements} achievements.`;
  const maxYear = now.getFullYear() + 1;
  const rows = d.achievements.map((a) => {
    const title = a.title.trim();
    if (!title) return "Give this achievement a title.";
    if (title.length > LIMITS.achievementTitle)
      return `Title must be ${LIMITS.achievementTitle} characters or fewer.`;
    const y = a.year.trim();
    if (!/^\d{4}$/.test(y) || Number(y) < LIMITS.firstAchievementYear || Number(y) > maxYear)
      return `Year must be between ${LIMITS.firstAchievementYear} and ${maxYear}.`;
    return "";
  });
  if (rows.some(Boolean)) e.achievements = rows;
  return e;
}

export function hasErrors(e: ProfileErrors): boolean {
  return Object.keys(e).length > 0;
}

