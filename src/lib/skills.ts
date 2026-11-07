// Reference list of the skills an athlete can practise and be assessed on. Static app
// configuration, not user data. The per-athlete numbers (accuracy, consistency, improvement)
// are NOT here: they have to come from the athlete's recorded sessions.
import type { SkillId } from "@/types";

export interface SkillDefinition {
  id: SkillId;
  name: string;
  emoji: string;
  primaryLabel: string;
  /** AI video analysis is available for this skill */
  aiReady: boolean;
}

export const skills: SkillDefinition[] = [
  { id: "shooting", name: "Shooting", emoji: "🏀", primaryLabel: "Accuracy", aiReady: true },
  { id: "dribbling", name: "Dribbling", emoji: "🏀", primaryLabel: "Consistency", aiReady: false },
  { id: "passing", name: "Passing", emoji: "🏀", primaryLabel: "Accuracy", aiReady: false },
  { id: "layups", name: "Layups", emoji: "🏀", primaryLabel: "Success Rate", aiReady: false },
  { id: "agility", name: "Agility / Footwork", emoji: "⚡", primaryLabel: "Consistency", aiReady: false },
  { id: "vertical", name: "Vertical Jump", emoji: "🦘", primaryLabel: "Height", aiReady: false },
];
