// Browser client for the administrator's pages (server/admin*.server.ts, server/rep-applications.server.ts).

import { apiBlob, apiRequest, type ApiResult } from "@/auth/authClient";

export type { ApiResult };

// ---- School Verification: school / university representative applications ----
export type ApplicationStatus = "pending" | "approved" | "rejected";

export interface ApplicationSummary {
  /** the applicant's user id */
  id: string;
  name: string;
  email: string;
  school: string;
  designation: string;
  photo: string | null;
  status: ApplicationStatus;
  submittedAt: string;
  documentCount: number;
}

export interface ApplicationDocument {
  id: string;
  kind: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: string;
}

export interface ApplicationDetail extends ApplicationSummary {
  username: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
  rejectionReason: string | null;
  documents: ApplicationDocument[];
}

export type ApplicationCounts = Record<ApplicationStatus, number>;

export const fetchApplications = (status: ApplicationStatus | "", limit = 100, offset = 0) =>
  apiRequest<{ items: ApplicationSummary[]; total: number; counts: ApplicationCounts; schoolsWithoutRep: { school: string; waitingCoaches: number }[] }>(
    `/api/admin/school-verifications?${status ? `status=${status}&` : ""}limit=${limit}&offset=${offset}`,
  );

export const fetchApplication = (id: string) =>
  apiRequest<{ application: ApplicationDetail }>(`/api/admin/school-verifications/${encodeURIComponent(id)}`);

export const approveApplication = (id: string) =>
  apiRequest<{ application: ApplicationDetail }>(`/api/admin/school-verifications/${encodeURIComponent(id)}/approve`, { method: "POST", body: {} });

export const rejectApplication = (id: string, reason: string) =>
  apiRequest<{ application: ApplicationDetail }>(`/api/admin/school-verifications/${encodeURIComponent(id)}/reject`, { method: "POST", body: { reason } });

/** Opens a submitted document in a new tab (or saves it, if the browser blocks the tab). Returns an error message, or null. */
export async function openApplicationDocument(applicationId: string, doc: ApplicationDocument, mode: "view" | "download" = "view"): Promise<string | null> {
  // Open the tab before the download starts, so the browser treats it as the click's own action.
  const tab = mode === "view" ? window.open("", "_blank") : null;
  const res = await apiBlob(`/api/admin/school-verifications/${encodeURIComponent(applicationId)}/documents/${encodeURIComponent(doc.id)}`);
  if (!res.ok) {
    tab?.close();
    return res.message;
  }
  const url = URL.createObjectURL(res.blob);
  if (tab) {
    tab.location.href = url;
  } else {
    const a = document.createElement("a");
    a.href = url;
    a.download = doc.fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
  return null;
}

export interface AdminOverview {
  totals: { users: number; athletes: number; schools: number; pending: number; usersThisWeek: number; athletesThisWeek: number };
  registrations: { month: string; athletes: number; coaches: number; schoolReps: number }[];
  users: { students: number; coaches: number; verifiedCoaches: number; universityReps: number; inactive: number };
  pendingVerifications: number;
  /** content reports nobody has looked at yet */
  pendingReports: number;
  signIns24h: { succeeded: number; failed: number };
  recentActivity: { event: string; identifier: string | null; roles: string[] | null; at: string }[];
}

/**
 * The top bar (bell badge) and the dashboard both want the overview. Asking twice within a few
 * seconds shares one request; `fresh` forces a new one (after approving someone, say).
 */
let shared: { at: number; promise: Promise<ApiResult<{ overview: AdminOverview }>> } | null = null;
export function fetchAdminOverview(fresh = false): Promise<ApiResult<{ overview: AdminOverview }>> {
  if (!fresh && shared && Date.now() - shared.at < 3000) return shared.promise;
  const promise = apiRequest<{ overview: AdminOverview }>("/api/admin/overview");
  shared = { at: Date.now(), promise };
  return promise;
}

// ---- User Management (server/admin-users.server.ts) ----
export type DirectoryRole = "student_athlete" | "coach" | "university_representative";
export type UserStatus = "active" | "pending" | "suspended" | "rejected";

export interface DirectoryUser {
  id: string;
  name: string;
  email: string;
  photo: string | null;
  role: DirectoryRole | null;
  school: string | null;
  status: UserStatus;
  registeredAt: string;
}

export interface UserDetail extends DirectoryUser {
  username: string;
  roles: string[];
  verifiedCoach: boolean;
  sport: string | null;
  position: string | null;
  lastLoginAt: string | null;
  emailVerified: boolean;
  history: { event: "registered" | "suspended" | "reactivated"; at: string; reason: string | null }[];
}

export interface DirectorySummary { total: number; active: number; pending: number; suspended: number; rejected: number }

export const fetchUsers = (
  p: { q: string; role: DirectoryRole | ""; status: UserStatus | ""; limit: number; offset: number },
  signal?: AbortSignal,
) => {
  const qs = new URLSearchParams();
  if (p.q.trim()) qs.set("q", p.q.trim());
  if (p.role) qs.set("role", p.role);
  if (p.status) qs.set("status", p.status);
  qs.set("limit", String(p.limit));
  qs.set("offset", String(p.offset));
  return apiRequest<{ items: DirectoryUser[]; total: number; summary: DirectorySummary }>(`/api/admin/users?${qs}`, signal ? { signal } : {});
};

export const fetchUserDetail = (id: string) => apiRequest<{ user: UserDetail }>(`/api/admin/users/${encodeURIComponent(id)}`);

export const suspendUser = (id: string, reason: string) =>
  apiRequest<{ user: UserDetail }>(`/api/admin/users/${encodeURIComponent(id)}/suspend`, { method: "POST", body: { reason } });

export const reactivateUser = (id: string) =>
  apiRequest<{ user: UserDetail }>(`/api/admin/users/${encodeURIComponent(id)}/reactivate`, { method: "POST", body: {} });

// ---- Platform Monitoring (server/monitoring.server.ts, server/reports.server.ts) ----
export type ActivityCategory = "signins" | "security" | "accounts" | "administration" | "platform" | "moderation";
export type ReportStatus = "pending" | "investigating" | "resolved" | "dismissed";
export type ReportContentType = "athlete_profile" | "video" | "photo";
export type ReportReason = "inappropriate" | "impersonation" | "harassment" | "spam" | "false_information" | "other";
export type ModerationAction = "remove_content" | "warn_user" | "suspend_account";

export interface MonitoringOverview {
  activities: { total: number; last24h: number };
  reports: { pending: number; investigating: number; resolved: number; dismissed: number };
  flaggedContent: number;
}

export interface ActivityItem {
  id: string;
  at: string;
  category: ActivityCategory;
  user: { id: string | null; name: string };
  description: string;
}

export interface ReportSummary {
  id: string;
  contentType: ReportContentType;
  reason: ReportReason;
  status: ReportStatus;
  createdAt: string;
  details: string;
  reporter: { id: string; name: string } | null;
  target: { id: string; name: string; suspended: boolean };
}

export type ReportContent =
  | { kind: "athlete_profile"; bio: string; sport: string; position: string; school: string }
  | { kind: "video"; url: string | null; status: string | null }
  | { kind: "photo"; dataUrl: string | null; status: string | null };

export interface ReportDetail extends ReportSummary {
  snapshot: string | null;
  content: ReportContent;
  reporterEmail: string | null;
  targetEmail: string;
  otherReports: { total: number; open: number };
  investigatedBy: string | null;
  investigatedAt: string | null;
  resolvedBy: string | null;
  resolvedAt: string | null;
  actions: ModerationAction[];
  resolutionNote: string;
}

export const fetchMonitoringOverview = () => apiRequest<{ overview: MonitoringOverview }>("/api/admin/monitoring/overview");

export const fetchActivity = (p: { category: ActivityCategory | ""; q: string; limit: number; offset: number }, signal?: AbortSignal) => {
  const qs = new URLSearchParams();
  if (p.category) qs.set("category", p.category);
  if (p.q.trim()) qs.set("q", p.q.trim());
  qs.set("limit", String(p.limit));
  qs.set("offset", String(p.offset));
  return apiRequest<{ items: ActivityItem[]; total: number; counts: Record<ActivityCategory, number> }>(`/api/admin/monitoring/activity?${qs}`, signal ? { signal } : {});
};

export const fetchReports = (p: { status: ReportStatus | ""; type: ReportContentType | ""; limit: number; offset: number }) => {
  const qs = new URLSearchParams();
  if (p.status) qs.set("status", p.status);
  if (p.type) qs.set("type", p.type);
  qs.set("limit", String(p.limit));
  qs.set("offset", String(p.offset));
  return apiRequest<{ items: ReportSummary[]; total: number; counts: Record<ReportStatus, number> }>(`/api/admin/reports?${qs}`);
};

const reportPath = (id: string, tail = "") => `/api/admin/reports/${encodeURIComponent(id)}${tail}`;
export const fetchReport = (id: string) => apiRequest<{ report: ReportDetail }>(reportPath(id));
export const investigateReport = (id: string) => apiRequest<{ report: ReportDetail }>(reportPath(id, "/investigate"), { method: "POST", body: {} });
export const dismissReport = (id: string, note: string) => apiRequest<{ report: ReportDetail }>(reportPath(id, "/dismiss"), { method: "POST", body: { note } });
export const resolveReport = (id: string, body: { actions: ModerationAction[]; note: string; message: string }) =>
  apiRequest<{ report: ReportDetail; effects: string[] }>(reportPath(id, "/resolve"), { method: "POST", body });

// ---- Settings (server/admin-settings.server.ts, server/system-info.server.ts) ----
export interface AdminProfile {
  displayName: string;
  firstName: string;
  lastName: string;
  /** read-only: set by ADMIN_EMAIL on the server */
  email: string;
  /** read-only: set by ADMIN_USERNAME on the server */
  username: string;
  avatar: string | null;
  createdAt: string;
  lastLoginAt: string | null;
  passwordChangedAt: string | null;
}

export interface AdminSession {
  id: string;
  current: boolean;
  device: string;
  browser: string;
  os: string;
  ip: string | null;
  signedInAt: string;
  lastActiveAt: string;
  expiresAt: string;
}

export interface AdminPreferences { applications: boolean; reports: boolean; registrations: boolean; security: boolean }

/** What the top bar shows. A bell number is null when the administrator switched that notification off. */
export interface AdminHeader {
  displayName: string;
  avatar: string | null;
  bell: { applications: number | null; reports: number | null; registrations: number | null; securityAlerts: number | null };
}

export interface SystemInfo {
  application: { name: string; version: string; environment: string; runtime: string; region: string | null; serverTime: string; startedAt: string; uptimeSeconds: number };
  database: { engine: string; reachable: boolean; latencyMs: number; sizeBytes: number | null; schemaVersion: number; migrationsApplied: number };
  platform: {
    users: number; athletes: number; coaches: number; schoolRepresentatives: number; suspendedAccounts: number; schools: number;
    scholarships: number; openReports: number; activeSessions: number; activityEvents: number;
  };
  security: {
    adminSessionHours: number; userSessionHours: number; rememberDays: number; adminPasswordMinLength: number; userPasswordMinLength: number;
    lockoutAttempts: number; lockoutMinutes: number; adminAccountSource: string;
  };
}

export const fetchAdminHeader = () => apiRequest<{ header: AdminHeader }>("/api/admin/header");
export const fetchAdminProfile = () => apiRequest<{ profile: AdminProfile }>("/api/admin/settings/profile");
export const saveAdminProfile = (b: { displayName: string; firstName: string; lastName: string }) =>
  apiRequest<{ profile: AdminProfile }>("/api/admin/settings/profile", { method: "PUT", body: b });
export const saveAdminAvatar = (dataUrl: string) => apiRequest<{ profile: AdminProfile }>("/api/admin/settings/avatar", { method: "PUT", body: { dataUrl } });
export const removeAdminAvatar = () => apiRequest<{ profile: AdminProfile }>("/api/admin/settings/avatar", { method: "DELETE" });
export const changeAdminPassword = (b: { currentPassword: string; newPassword: string; confirmPassword: string }) =>
  apiRequest<{ otherSessionsSignedOut: number }>("/api/admin/settings/password", { method: "POST", body: b });
export const fetchAdminSessions = () => apiRequest<{ sessions: AdminSession[] }>("/api/admin/settings/sessions");
export const revokeAdminSession = (id: string) => apiRequest<Record<string, never>>(`/api/admin/settings/sessions/${encodeURIComponent(id)}`, { method: "DELETE" });
export const revokeOtherAdminSessions = () => apiRequest<{ revoked: number }>("/api/admin/settings/sessions/revoke-others", { method: "POST", body: {} });
export const fetchAdminPreferences = () => apiRequest<{ preferences: AdminPreferences }>("/api/admin/settings/notifications");
export const saveAdminPreferences = (b: Partial<AdminPreferences>) => apiRequest<{ preferences: AdminPreferences }>("/api/admin/settings/notifications", { method: "PUT", body: b });
export const fetchSystemInfo = () => apiRequest<{ system: SystemInfo }>("/api/admin/settings/system");

// The top bar listens for this: after Settings saves a name, a photo or a notification preference, it reloads.
const headerListeners = new Set<() => void>();
export const onAdminHeaderChange = (fn: () => void) => { headerListeners.add(fn); return () => { headerListeners.delete(fn); }; };
export const notifyAdminHeaderChanged = () => headerListeners.forEach((fn) => fn());
