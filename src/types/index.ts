// Core domain types — designed so mock data can later be swapped for API/database data.

export type UserRole = "athlete" | "coach" | "admin";

export type SkillId = "shooting" | "dribbling" | "passing" | "layups" | "agility" | "vertical";

export interface Sport {
  id: string;
  name: string;
  aiSupported: boolean;
}

export type TeamStatus = "Varsity" | "Junior Varsity" | "Reserve" | "Club / Community" | "Not on a team";

export interface Athlete {
  id: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  sport: string;
  position: string;
  school: string;
  year: string;
  height: string;
  weight: string;
  bio: string;
  rank: number;
  performanceScore: number;
  consistency: number;
  /** how the athlete is currently rostered — shown on showcase profiles */
  teamStatus: TeamStatus;
  /** where the athlete's school is — used by the Rankings location filters */
  municipality?: string;
  province?: string;
  /** team/program name, e.g. "SNNHS Varsity Boys"; empty string when not on a team */
  teamName?: string;
  achievements: { title: string; year: string }[];
}

export interface Skill {
  id: SkillId;
  name: string;
  emoji: string;
  primaryLabel: string;
  primaryValue: string;
  consistency: number;
  improvement: number; // percentage points vs previous period
  aiReady: boolean;
}

export type SessionStatus = "AI-Assessed" | "Coach-Verified" | "Pending Review" | "Self-Reported";

export interface PerformanceSession {
  id: string;
  date: string;
  /** calendar day as YYYY-MM-DD, used to sort and bucket sessions; `date` is only the label shown */
  isoDate?: string;
  skill: SkillId;
  result: number;
  /** null when the athlete entered the result by hand and no consistency was measured */
  consistency: number | null;
  status: SessionStatus;
  verifiedBy?: string; // coach name, set when status is "Coach-Verified"
  /** true when the numbers came from the simulated prototype AI, not a real model */
  simulated?: boolean;
}

export interface PerformanceMetric {
  label: string;
  value: number;
}

export interface Ranking {
  position: number;
  athleteId?: string;
  athleteName: string;
  school: string;
  municipality?: string;
  province?: string;
  value: number;
  isCurrentUser?: boolean;
  /** how many of this athlete's sessions a coach has verified, out of all counted sessions */
  verifiedSessions?: number;
  totalSessions?: number;
}


/** One counted result for a ranking metric (e.g. a shooting session's accuracy). */
export interface RankingResult {
  metric: string;
  value: number;
  status: SessionStatus;
}

export interface Scholarship {
  id: string;
  name: string;
  university: string;
  sport: string;
  eligibility: string[];
  deadline: string;
  coverage: string;
  details: string;
}

export type NotificationCategory =
  | "analysis"
  | "ranking"
  | "recruitment"
  | "scholarship"
  | "application"
  | "verification";

export interface Notification {
  id: string;
  category: NotificationCategory;
  title: string;
  message: string;
  time: string;
  read: boolean;
}

/** What the AI actually measured from one video. Nothing here depends on past sessions. */
export interface AIMeasurement {
  skill: SkillId;
  assessment: string;
  attempts: number;
  made: number;
  missed: number;
  accuracy: number;
  /** how steady accuracy stays through the set (0-100) */
  consistency: number;
  /** model's own confidence in this reading, 0-1 */
  confidence: number;
  /** true when the result should go to a coach before anyone relies on it */
  needsReview: boolean;
  reviewReasons: string[];
  isMock: boolean;
}

/** A measurement plus the history-derived parts the analysis screen shows. */
export interface AIAnalysisResult extends AIMeasurement {
  trend: "Improving" | "Stable" | "Declining" | "Baseline";
  sessionHistory: { label: string; value: number }[];
  improvement: number;
  feedback: { positive: string; improvement: string; suggestion: string };
}

// ============= Recruitment & talent discovery =============

/** A public showcase entry in the athlete directory recruiters search. */
export interface DirectoryAthlete {
  id: string;
  firstName: string;
  lastName: string;
  sport: string;
  position: string;
  school: string;
  year: string;
  height: string;
  bio: string;
  teamStatus: TeamStatus;
  teamName?: string;
  /** city/municipality and province of the athlete's school */
  municipality: string;
  province: string;
  performanceScore: number;
  rank: number;
  /** sessions a coach has verified, out of all sessions counted for this athlete */
  verifiedSessions: number;
  totalSessions: number;
  skills: { name: string; value: string }[];
  achievements: { title: string; year: string }[];
  /** athletes can hide their showcase from discovery entirely */
  visible: boolean;
}

export type InquiryStatus = "Pending" | "Accepted" | "Declined";

/**
 * A recruiter's request for contact. The conversation stays closed until the
 * athlete accepts — controlled messaging, not open DMs.
 */
export interface Inquiry {
  id: string;
  athleteId: string;
  recruiterName: string;
  organization: string;
  message: string;
  status: InquiryStatus;
  createdAt: string;
}

export interface ThreadMessage {
  id: string;
  inquiryId: string;
  from: "recruiter" | "athlete";
  body: string;
  time: string;
}

