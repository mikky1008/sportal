/**
 * AI service.
 *
 * Two modes:
 *  - REAL: set VITE_AI_API_URL (e.g. http://localhost:8000) and run the service in /ai.
 *    Shooting videos are sent to POST {url}/analyze/shooting and the response is validated.
 *  - SIMULATED (default): returns fixed sample numbers, clearly flagged `isMock: true`.
 *
 * If the real service is configured and fails, this THROWS. It never silently falls back to
 * simulated numbers, because fake results must not be mistaken for a real analysis.
 */
import type { AIMeasurement, SkillId } from "@/types";
import { skillById } from "@/lib/skills";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const getAssessmentName = (skill: SkillId): string => skillById(skill)?.assessment ?? "";

/** Results below this confidence are never trusted on their own; they go to a coach. */
export const MIN_CONFIDENCE = 0.7;

const apiUrl = (): string | undefined => {
  const v = (import.meta.env?.["VITE_AI_API_URL"] as string | undefined)?.trim();
  return v ? v.replace(/\/+$/, "") : undefined;
};

export const isRealAiConfigured = () => apiUrl() !== undefined;

// The video picked on the "new practice" screen, handed to the analysis screen.
let pendingVideo: File | null = null;
export const setPendingVideo = (f: File | null) => { pendingVideo = f; };
export const getPendingVideo = () => pendingVideo;

const isNum = (x: unknown): x is number => typeof x === "number" && Number.isFinite(x);

/** Validates untrusted JSON from the AI service. Throws with a readable reason. */
export function parseMeasurement(skill: SkillId, json: unknown): AIMeasurement {
  if (!json || typeof json !== "object") throw new Error("AI service returned an unreadable response.");
  const j = json as Record<string, unknown>;
  const { attempts, made, missed, accuracy, consistency, confidence } = j;
  if (!isNum(attempts) || !isNum(made) || !isNum(missed) || !isNum(accuracy) || !isNum(consistency) || !isNum(confidence)) {
    throw new Error("AI service response is missing numeric fields.");
  }
  if (attempts < 0 || made < 0 || missed < 0 || made + missed !== attempts) {
    throw new Error("AI service returned inconsistent attempt counts.");
  }
  if (accuracy < 0 || accuracy > 100 || consistency < 0 || consistency > 100 || confidence < 0 || confidence > 1) {
    throw new Error("AI service returned out-of-range values.");
  }
  const reasons = Array.isArray(j["reviewReasons"]) ? j["reviewReasons"].filter((r): r is string => typeof r === "string") : [];
  const lowConfidence = confidence < MIN_CONFIDENCE;
  if (lowConfidence && !reasons.length) reasons.push(`Model confidence is only ${Math.round(confidence * 100)}%.`);
  return {
    skill,
    assessment: getAssessmentName(skill),
    attempts, made, missed, accuracy, consistency, confidence,
    // The server may ask for review; we also enforce the confidence floor here so a
    // misconfigured server can't mark a shaky result as trustworthy.
    needsReview: j["needsReview"] === true || lowConfidence || attempts === 0,
    reviewReasons: reasons,
    isMock: false,
  };
}

async function analyzeRemote(skill: SkillId, video: File): Promise<AIMeasurement> {
  const url = apiUrl()!;
  const body = new FormData();
  body.append("video", video);
  let res: Response;
  try {
    res = await fetch(`${url}/analyze/${skill}`, { method: "POST", body });
  } catch {
    throw new Error("Couldn't reach the AI service. Check that it is running and try again.");
  }
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`AI service error (${res.status}). ${detail.slice(0, 200)}`.trim());
  }
  return parseMeasurement(skill, await res.json());
}

async function analyzeSimulated(skill: SkillId): Promise<AIMeasurement> {
  await delay(1800);
  return {
    skill,
    assessment: getAssessmentName(skill),
    attempts: 10, made: 8, missed: 2, accuracy: 80, consistency: 76,
    confidence: 1,
    needsReview: false,
    reviewReasons: [],
    isMock: true,
  };
}

/** Only shooting has a real model so far; everything else stays simulated and labelled as such. */
export function analyzeSkill(skill: SkillId, video?: File | null): Promise<AIMeasurement> {
  if (isRealAiConfigured() && video && skill === "shooting") return analyzeRemote(skill, video);
  return analyzeSimulated(skill);
}

export const analyzeShootingVideo = (video?: File | null) => analyzeSkill("shooting", video);
export const analyzeDribblingVideo = (video?: File | null) => analyzeSkill("dribbling", video);
export const analyzePassingVideo = (video?: File | null) => analyzeSkill("passing", video);
export const analyzeLayupVideo = (video?: File | null) => analyzeSkill("layups", video);
export const analyzeAgilityVideo = (video?: File | null) => analyzeSkill("agility", video);
export const analyzeVerticalVideo = (video?: File | null) => analyzeSkill("vertical", video);
