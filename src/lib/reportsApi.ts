// Filing a report about an athlete (server/reports.server.ts). Any signed-in user except the
// administrator can do this; the administrator reviews them under Platform Monitoring.

import { apiRequest } from "@/auth/authClient";

export type ReportContentType = "athlete_profile" | "video" | "photo";
export type ReportReason = "inappropriate" | "impersonation" | "harassment" | "spam" | "false_information" | "other";

export const REPORT_CONTENT_OPTIONS: { value: ReportContentType; label: string; hint: string }[] = [
  { value: "athlete_profile", label: "Profile", hint: "Biography, skills and achievements" },
  { value: "video", label: "Highlight video", hint: "The video link on their profile" },
  { value: "photo", label: "Profile photo", hint: "Their profile picture" },
];

export const REPORT_REASON_OPTIONS: { value: ReportReason; label: string }[] = [
  { value: "inappropriate", label: "Inappropriate content" },
  { value: "impersonation", label: "Impersonation or a fake profile" },
  { value: "harassment", label: "Harassment or abuse" },
  { value: "false_information", label: "False information" },
  { value: "spam", label: "Spam" },
  { value: "other", label: "Something else" },
];

export const submitReport = (body: { athleteId: string; contentType: ReportContentType; reason: ReportReason; details: string }) =>
  apiRequest<{ report: { id: string; status: "pending" } }>("/api/reports", { method: "POST", body });
