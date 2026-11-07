// Single source of truth for how much a session result can be trusted.
// AI-assessed does NOT automatically mean verified — the AI may make mistakes.

import type { SessionStatus } from "@/types";

export type PillTone = "default" | "primary" | "gold" | "success" | "warning";

export interface StatusMeta {
  label: SessionStatus;
  tone: PillTone;
  /** true only when an authorized coach has reviewed the result */
  verified: boolean;
  description: string;
}

export const sessionStatusMeta: Record<SessionStatus, StatusMeta> = {
  "Coach-Verified": {
    label: "Coach-Verified",
    tone: "success",
    verified: true,
    description: "An authorized coach reviewed and confirmed this result.",
  },
  "AI-Assessed": {
    label: "AI-Assessed",
    tone: "primary",
    verified: false,
    description: "Generated from a submitted video by AI analysis. Not verified — the AI may make mistakes.",
  },
  "Pending Review": {
    label: "Pending Review",
    tone: "warning",
    verified: false,
    description: "Waiting for verification by a coach.",
  },
  "Self-Reported": {
    label: "Self-Reported",
    tone: "default",
    verified: false,
    description: "Entered manually by the athlete — not verified.",
  },
};

export const TRUST_NOTE = "AI-assessed does not automatically mean verified. The AI may make mistakes — only Coach-Verified results have been reviewed by a coach.";

export type SessionSource = "ai" | "manual";

/**
 * Decides the status a brand-new session starts with. Nothing here ever returns
 * "Coach-Verified": only an authorized coach can set that (see verifySession in server/practice-sessions.server.ts).
 */
export function statusForNewSession(opts: {
  source: SessionSource;
  needsReview?: boolean;
  requestedReview?: boolean;
}): SessionStatus {
  if (opts.source === "manual") return opts.requestedReview ? "Pending Review" : "Self-Reported";
  return opts.needsReview || opts.requestedReview ? "Pending Review" : "AI-Assessed";
}

export interface TrustSummary {
  total: number;
  counts: Record<SessionStatus, number>;
  verified: number;
  /** 0-1; share of sessions that a coach has verified */
  verifiedShare: number;
}

export function summarizeTrust(list: { status: SessionStatus }[]): TrustSummary {
  const counts: Record<SessionStatus, number> = {
    "Coach-Verified": 0,
    "AI-Assessed": 0,
    "Pending Review": 0,
    "Self-Reported": 0,
  };
  for (const s of list) counts[s.status] += 1;
  const total = list.length;
  const verified = counts["Coach-Verified"];
  return { total, counts, verified, verifiedShare: total ? verified / total : 0 };
}
