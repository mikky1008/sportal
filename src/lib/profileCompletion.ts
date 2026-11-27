// Profile completion: how much of a profile has been filled in with valid information.
//
// This is NOT a performance score. It never reads sessions, rankings or the Athletic Development /
// performance numbers, and nothing that measures performance reads it.
//
// It is also NOT account verification. A coach's `verificationStatus` is never an input here, so a
// coach can be 100% complete while their organization is still pending review.
//
// Nothing is stored: the percentage is always calculated from the saved profile data, so it updates
// the moment a save succeeds and is identical after logging out and back in.
//
// REQUIRED FIELDS (everything else is optional and never counted):
//   Athlete
//     Basic Information (20%)      first name, last name, athletic bio
//     Athletic Information (25%)   sport, position, height, weight, team status
//     School Information (15%)     school, year level
//     Athletic Achievements (10%)  at least one valid achievement
//     Scholarship Interests (10%)  at least one target university, coverage preference, intended course
//     Profile Showcase (20%)       approved profile photo, approved highlight video link
//   optional / not counted: team name, extra achievements, showcase visibility
//   Coach
//     Basic Information (15%)      first name, last name, email
//     Organization (20%)           organization name, type, location
//     Coaching Position (15%)      position, team or program
//     Sport Specialization (15%)   primary sport, competition level
//     Professional Background (15%) years of experience, background summary
//     Verification Information (20%) official email, credential type, credential reference
//   optional / not counted: certifications

import type { Athlete } from "@/types";
import { toDraft, validateProfile, type ProfileErrors } from "@/lib/profileStore";
import { isMediaUsable, validateScholarship, type ProfileExtras } from "@/lib/profileExtrasStore";
import { validateCoach, type CoachProfile } from "@/lib/coachProfileStore";

export interface CompletionField {
  key: string;
  label: string;
  done: boolean;
}

export interface CompletionSection {
  id: string;
  label: string;
  /** share of the whole profile, in percent; all weights add up to 100 */
  weight: number;
  fields: CompletionField[];
  doneCount: number;
  /** 0–1 */
  fraction: number;
  /** percentage points this section currently contributes (weight × fraction) */
  earned: number;
  complete: boolean;
  /** labels of the required fields still to do */
  missing: string[];
}

export interface CompletionResult {
  /** whole number 0–100. Only 100 when every section is complete. */
  percent: number;
  sections: CompletionSection[];
  /** the first section, in order, that is not complete — what "Continue Setup" opens */
  next: CompletionSection | null;
  complete: boolean;
}

interface SectionDef {
  id: string;
  label: string;
  weight: number;
  fields: CompletionField[];
}

function build(defs: SectionDef[]): CompletionResult {
  const sections: CompletionSection[] = defs.map((d) => {
    const doneCount = d.fields.filter((f) => f.done).length;
    const fraction = d.fields.length ? doneCount / d.fields.length : 0;
    return {
      ...d,
      doneCount,
      fraction,
      earned: d.weight * fraction,
      complete: d.fields.length > 0 && doneCount === d.fields.length,
      missing: d.fields.filter((f) => !f.done).map((f) => f.label),
    };
  });
  const complete = sections.every((s) => s.complete);
  const raw = sections.reduce((sum, s) => sum + s.earned, 0);
  // Rounding must never show 100% while something is still missing.
  const percent = complete ? 100 : Math.min(99, Math.round(raw));
  return { percent, sections, next: sections.find((s) => !s.complete) ?? null, complete };
}

const filled = (v: string | undefined) => (v ?? "").trim().length > 0;

// ---------- athlete ----------

export type AthleteSectionId = "basic" | "athletic" | "school" | "achievements" | "scholarship" | "showcase";

export const ATHLETE_SECTION_IDS: readonly AthleteSectionId[] = [
  "basic", "athletic", "school", "achievements", "scholarship", "showcase",
];

export function computeAthleteCompletion(
  athlete: Athlete,
  extras: ProfileExtras,
  now: Date = new Date(),
): CompletionResult {
  // The same validator the Settings form uses decides what counts as valid.
  const draft = toDraft(athlete);
  const errs: ProfileErrors = validateProfile(draft, now);
  const ok = (key: Exclude<keyof typeof draft, "achievements">, label: string): CompletionField => ({
    key,
    label,
    done: filled(draft[key]) && !errs[key],
  });

  // Achievements: invalid rows are ignored, not counted. One valid row is enough.
  const rowErrors = errs.achievements ?? [];
  const validAchievements = draft.achievements.filter((_, i) => !rowErrors[i]).length;

  const sch = extras.scholarship;
  const schErrs = validateScholarship(sch);

  return build([
    {
      id: "basic", label: "Basic Information", weight: 20,
      fields: [ok("firstName", "First name"), ok("lastName", "Last name"), ok("bio", "Athletic bio")],
    },
    {
      id: "athletic", label: "Athletic Information", weight: 25,
      fields: [
        ok("sport", "Sport"), ok("position", "Position"), ok("heightCm", "Height"), ok("weightKg", "Weight"),
        ok("teamStatus", "Team status"),
      ],
    },
    {
      id: "school", label: "School Information", weight: 15,
      fields: [ok("school", "School"), ok("year", "Year level")],
    },
    {
      id: "achievements", label: "Athletic Achievements", weight: 10,
      fields: [{ key: "achievements", label: "At least one achievement", done: validAchievements >= 1 }],
    },
    {
      id: "scholarship", label: "Scholarship Interests", weight: 10,
      fields: [
        { key: "universities", label: "Target university", done: sch.universities.length >= 1 && !schErrs.universities },
        { key: "coverage", label: "Coverage preference", done: filled(sch.coverage) && !schErrs.coverage },
        { key: "course", label: "Intended course", done: filled(sch.course) && !schErrs.course },
      ],
    },
    {
      id: "showcase", label: "Profile Showcase", weight: 20,
      fields: [
        { key: "photo", label: "Profile photo", done: isMediaUsable("photo", extras.photo) },
        { key: "video", label: "Highlight video", done: isMediaUsable("video", extras.video) },
      ],
    },
  ]);
}

// ---------- coach ----------

export type CoachSectionId = "basic" | "organization" | "position" | "sport" | "background";

export const COACH_SECTION_IDS: readonly CoachSectionId[] = [
  "basic", "organization", "position", "sport", "background",
];

/** Note: there is deliberately no verification-status parameter. See the top of this file. */
export function computeCoachCompletion(coach: CoachProfile): CompletionResult {
  const errs = validateCoach(coach);
  const ok = (key: Exclude<keyof CoachProfile, "certifications">, label: string): CompletionField => ({
    key,
    label,
    done: filled(coach[key]) && !errs[key],
  });
  return build([
    {
      id: "basic", label: "Basic Information", weight: 20,
      fields: [ok("firstName", "First name"), ok("lastName", "Last name"), ok("email", "Email")],
    },
    {
      id: "organization", label: "Organization Information", weight: 20,
      fields: [ok("organizationName", "Organization name"), ok("organizationType", "Organization type"), ok("organizationLocation", "Location")],
    },
    {
      id: "position", label: "Coaching Position", weight: 20,
      fields: [ok("positionTitle", "Position"), ok("programName", "Team or program")],
    },
    {
      id: "sport", label: "Sport Specialization", weight: 20,
      fields: [ok("primarySport", "Primary sport"), ok("competitionLevel", "Competition level")],
    },
    {
      id: "background", label: "Professional Background", weight: 20,
      fields: [ok("yearsExperience", "Years of experience"), ok("background", "Background summary")],
    },
  ]);
}

// ---------- messages ----------

export function athleteMessage(r: CompletionResult): string {
  const p = r.percent;
  if (r.complete) return "Profile complete! Your showcase is ready to be discovered.";
  if (p >= 90) return "So close — just one more step to finish your profile.";
  if (p >= 75) return "Almost there — finish strong!";
  if (p >= 50) return "Over halfway! Keep the streak going.";
  if (p >= 25) return "Great start — every section you finish makes your showcase stronger.";
  return "Let's build your profile — each section only takes a few minutes.";
}

export function coachMessage(r: CompletionResult): string {
  const p = r.percent;
  if (r.complete) return "Profile complete! Athletes can see who you are and who you coach for.";
  if (p >= 90) return "So close — just one more step to finish your profile.";
  if (p >= 75) return "Almost there — finish strong!";
  if (p >= 50) return "Over halfway! Keep going.";
  if (p >= 25) return "Good start — a complete profile helps athletes trust your inquiries.";
  return "Let's set up your coach profile — each section only takes a few minutes.";
}
