// Reference list of the skills an athlete can practise and be assessed on, per sport. Static app
// configuration, not user data. The per-athlete numbers (accuracy, consistency, improvement)
// are NOT here: they have to come from the athlete's recorded sessions.
//
// Shared by the browser and the server, so both agree on what each skill is, which sport it
// belongs to, its unit and the range of results that make sense.
import type { SkillId } from "@/types";

/** "%" = a rate out of 100, "cm" = a height, "s" = a time (lower is better). */
export type SkillUnit = "%" | "cm" | "s";

export interface SkillDefinition {
  id: SkillId;
  name: string;
  /** which sport this skill belongs to (matches the athlete's profile sport) */
  sport: string;
  emoji: string;
  primaryLabel: string;
  /** AI video analysis is available for this skill (shooting only, and only Basketball has any) */
  aiReady: boolean;
  unit: SkillUnit;
  /** the lowest and highest result that is accepted */
  min: number;
  max: number;
  /** the drill used to measure it */
  assessment: string;
  /** one line on how to run the drill and read the result */
  howTo: string;
}

/** An athlete who has not picked a sport yet sees the Basketball skills, as before. */
export const DEFAULT_SPORT = "Basketball";

export const skills: SkillDefinition[] = [
  { id: "shooting", name: "Shooting", sport: "Basketball", emoji: "🏀", primaryLabel: "Accuracy", aiReady: true, unit: "%", min: 0, max: 100, assessment: "10-Shot Challenge", howTo: "Take 10 shots from the free-throw line or mid-range spot. Sportal counts makes and misses." },
  { id: "dribbling", name: "Dribbling", sport: "Basketball", emoji: "🏀", primaryLabel: "Consistency", aiReady: false, unit: "%", min: 0, max: 100, assessment: "Cone Weave Drill", howTo: "Standard drill used to measure this skill across sessions." },
  { id: "passing", name: "Passing", sport: "Basketball", emoji: "🏀", primaryLabel: "Accuracy", aiReady: false, unit: "%", min: 0, max: 100, assessment: "Target Passing Drill", howTo: "Standard drill used to measure this skill across sessions." },
  { id: "layups", name: "Layups", sport: "Basketball", emoji: "🏀", primaryLabel: "Success Rate", aiReady: false, unit: "%", min: 0, max: 100, assessment: "Alternating Layup Drill", howTo: "Standard drill used to measure this skill across sessions." },
  { id: "agility", name: "Agility / Footwork", sport: "Basketball", emoji: "⚡", primaryLabel: "Consistency", aiReady: false, unit: "%", min: 0, max: 100, assessment: "Lane Agility Test", howTo: "Standard drill used to measure this skill across sessions." },
  { id: "vertical", name: "Vertical Jump", sport: "Basketball", emoji: "🦘", primaryLabel: "Height", aiReady: false, unit: "cm", min: 0, max: 300, assessment: "Standing Vertical Test", howTo: "Standard drill used to measure this skill across sessions." },
  { id: "spiking", name: "Spiking", sport: "Volleyball", emoji: "🏐", primaryLabel: "Accuracy", aiReady: false, unit: "%", min: 0, max: 100, assessment: "10-Spike Accuracy Drill", howTo: "Take 10 spikes at a marked target zone. Your result is the share that land in the zone (7 of 10 = 70%)." },
  { id: "serving", name: "Serving", sport: "Volleyball", emoji: "🏐", primaryLabel: "Accuracy", aiReady: false, unit: "%", min: 0, max: 100, assessment: "10-Serve Accuracy Drill", howTo: "Take 10 serves at a marked target zone. Your result is the share that land in the zone (8 of 10 = 80%)." },
  { id: "sprint100", name: "100m Sprint", sport: "Track & Field", emoji: "🏃", primaryLabel: "Time", aiReady: false, unit: "s", min: 5, max: 60, assessment: "100m Timed Sprint", howTo: "Run 100 metres on a measured track, timed by a coach or a stopwatch. Enter your time in seconds (a lower time is better)." },
];

export const skillById = (id: string): SkillDefinition | undefined => skills.find((s) => s.id === id);

/** The skills for a sport; an empty sport means the default (Basketball). Sports with no skills yet return []. */
export const skillsForSport = (sport: string | undefined): SkillDefinition[] =>
  skills.filter((s) => s.sport === (sport?.trim() ? sport : DEFAULT_SPORT));

/** Percentage skills can be charted and averaged together; heights and times cannot. */
export const isPercentSkill = (id: string): boolean => skillById(id)?.unit === "%";

/** "82%", "72 cm", "10.6 s" */
export function formatResult(id: string, value: number): string {
  const unit = skillById(id)?.unit ?? "%";
  return unit === "%" ? `${value}%` : `${value} ${unit}`;
}
