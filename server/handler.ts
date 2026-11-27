// Sportal API request handler, written against the web-standard Request / Response so the same
// code runs as a Vercel Function (api/index.ts) and as a plain Node server (server/index.ts).
//
//   POST /api/auth/login      { identifier, password, remember }  -> { ok, user, token, expiresAt }
//   POST /api/auth/register   { accountType, ... }                -> { ok, user, role, token, expiresAt }
//   POST /api/admin/auth/login { identifier, password }           -> { ok, user, token, expiresAt }   the ONLY way to sign in as the administrator
//   GET  /api/admin/users     administrator ?q&role=student_athlete|coach|university_representative&status=active|pending|suspended&limit&offset
//                                                                 -> { ok, items, total, summary }    User Management directory
//   GET  /api/admin/users/:id administrator                       -> { ok, user }
//   POST /api/admin/users/:id/suspend|reactivate administrator { reason? } -> { ok, user }
//   GET  /api/admin/school-verifications administrator ?status=pending|approved|rejected&limit&offset -> { ok, items, total, counts }   School Verification (representative applications)
//   GET  /api/admin/school-verifications/:id administrator       -> { ok, application }
//   GET  /api/admin/school-verifications/:id/documents/:docId administrator -> the file itself (PDF/PNG/JPEG)
//   POST /api/admin/school-verifications/:id/approve|reject administrator { reason }  -> { ok, application }   (reject needs a reason the applicant will read)
//   POST /api/reports          signed-in user (not the administrator) { athleteId, contentType: athlete_profile|video|photo, reason, details? } -> { ok, report }
//   GET  /api/admin/monitoring/overview administrator            -> { ok, overview }   Platform Monitoring numbers
//   GET  /api/admin/monitoring/activity administrator ?category&q&limit&offset -> { ok, items, total, counts }   Activity Logs
//   GET  /api/admin/reports    administrator ?status&type&limit&offset -> { ok, items, total, counts }   Reported Content
//   GET  /api/admin/reports/:id administrator                    -> { ok, report }
//   POST /api/admin/reports/:id/investigate | dismiss { note? } | resolve { actions[], note?, message? } -> { ok, report }
//   GET  /api/admin/header     administrator                     -> { ok, header }   top bar: name, photo, bell (honours notification preferences)
//   GET|PUT /api/admin/settings/profile administrator { displayName, firstName?, lastName? } -> { ok, profile }   (email and username are read-only)
//   PUT|DELETE /api/admin/settings/avatar administrator { dataUrl } -> { ok, profile }
//   POST /api/admin/settings/password administrator { currentPassword, newPassword, confirmPassword? } -> { ok, otherSessionsSignedOut }
//   GET  /api/admin/settings/sessions administrator              -> { ok, sessions }  the administrator's own signed-in devices
//   DELETE /api/admin/settings/sessions/:id | POST .../sessions/revoke-others administrator -> { ok }
//   GET|PUT /api/admin/settings/notifications administrator { applications?, reports?, registrations?, security? } -> { ok, preferences }
//   GET  /api/admin/settings/system administrator                -> { ok, system }   read-only platform information
//   GET  /api/admin/overview  administrator                       -> { ok, overview }                 Admin Dashboard numbers
//   GET  /api/universities?q=                                     -> { ok, items: [{ name, location }] }   no sign-in: schools that exist on Sportal, for the coach sign-up (8 at most; 60 searches a minute per address)
//   GET  /api/auth/me         Authorization: Bearer <token>       -> { user }
//   POST /api/auth/logout     Authorization: Bearer <token>       -> { ok }
//   GET  /api/health
//
// Coach-athlete connections (every route needs `Authorization: Bearer <token>` and a coach or
// student-athlete account; a coach must also be verified to send or accept a request):
//   POST /api/connections/requests                 { userId }  -> 201 { ok, connection }   send a request
//   GET  /api/connections/requests/incoming        ?limit&offset -> { ok, items, total }   sent to me
//   GET  /api/connections/requests/outgoing        ?limit&offset -> { ok, items, total }   sent by me
//   POST /api/connections/requests/:id/accept      -> { ok, connection }                   recipient only
//   POST /api/connections/requests/:id/decline     -> { ok, connection }                   recipient only
//   POST /api/connections/requests/:id/cancel      -> { ok, connection }                   sender only
//   GET  /api/connections                          ?limit&offset -> { ok, items, total }   accepted connections
//   POST /api/connections/:id/disconnect           -> { ok, connection }                   either side
// Failures are { ok: false, code, message } with a matching HTTP status (401, 403, 404, 409, 422).
//
// Athlete search (verified coaches only; returns ids and names, never emails):
//   GET  /api/athletes/search                      ?q&limit    -> { ok, items: [{ id, displayName, firstName?, lastName? }] }
//                                                  q needs 2+ characters (shorter gives an empty list); limit 1-20, default 10.
//
// Training plans (coach accounts only; a coach sees and changes only their own plans):
//   POST /api/training-plans                { status: DRAFT|PUBLISHED, title, description, sport, skillFocus,
//                                             startDate, endDate, schedule[], goals[], athleteIds[] }
//                                                                  -> 201 { ok, plan }
//   PUT  /api/training-plans/:id            same body (full replace)  -> { ok, plan }
//   GET  /api/training-plans                ?status&limit&offset      -> { ok, items, total }
//   GET  /api/training-plans/:id                                      -> { ok, plan }
// Athletes in `athleteIds` must have an accepted connection with the coach (403 athlete_not_connected).
// Validation failures are 400 { ok: false, code: "validation", message, fieldErrors }.
//
// Coach dashboard and My Athletes (coach accounts only; a coach only ever sees athletes they are connected to):
//   GET    /api/coach/athletes                     ?limit&offset -> { ok, items: AthleteDetail[], total }   connected athletes with
//                                                    profile, skills, achievements and recent records (the My Athletes page + popup)
//   GET    /api/coach/dashboard                    -> { ok, pendingActions, recruitment, performance }   the dashboard cards
//   PUT    /api/coach/shortlist/:athleteId         -> { ok, athleteId, shortlisted: true }                add to shortlist
//   DELETE /api/coach/shortlist/:athleteId         -> { ok, athleteId, shortlisted: false }               remove from shortlist
//
// The athlete's own data (student-athlete accounts only; always the signed-in athlete's own):
//   GET  /api/athletes/me/profile                  -> { ok, profile }   name, sport, position, school, year, height, weight, team, bio, achievements + system-owned rank/scores
//   PUT  /api/athletes/me/profile                  the Settings form's fields (text) -> { ok, profile }   partial saves allowed, anything filled in must be valid
//   POST /api/athletes/me/records                  { label, value, recordedOn? }  -> 201 { ok, id }
//   GET  /api/athletes/me/extras                   -> { ok, extras }   scholarship interests + showcase photo / video
//   PUT  /api/athletes/me/extras/scholarship       { universities[], coverage, course } -> { ok, extras }
//   PUT / DELETE /api/athletes/me/extras/photo     { dataUrl } (a resized image data URL, up to ~400 KB) -> { ok, extras }
//   PUT / DELETE /api/athletes/me/extras/video     { url } (an https YouTube / Vimeo / Facebook link) -> { ok, extras }
//   GET  /api/athletes/me/sessions                 ?limit -> { ok, items }   newest first
//   POST /api/athletes/me/sessions                 { skill, result, consistency?, source: "ai"|"manual", needsReview?, requestedReview?, simulated?, date? } -> 201 { ok, session }
//                                                  (the server picks the status; a new session is never Coach-Verified)
//   POST /api/athletes/me/sessions/:id/request-review   -> { ok, session }
//
// Session review (verified coaches only; only for athletes they are connected to):
//   GET  /api/coach/sessions                       -> { ok, items }   sessions waiting for review
//   POST /api/coach/sessions/:id/verify            -> { ok, session }
//
// Coach profile and verification (the profile is stored in the database; nothing is browser-only):
//   GET  /api/coach/profile                        coach -> { ok, profile, verification }
//   PUT  /api/coach/profile                        coach, CoachProfile fields as text -> { ok, profile, verification }
//   POST /api/coach/verification/request           coach -> { ok, verification }   send the verification details to the reviewers
//   GET  /api/admin/coach-verifications            reviewer ?status=pending|verified|rejected&limit&offset -> { ok, items, total }
//   POST /api/admin/coach-verifications/:coachId/approve   reviewer { note? } -> { ok, coachId, status }
//   POST /api/admin/coach-verifications/:coachId/reject    reviewer { note }  -> { ok, coachId, status }   (the reason is shown to the coach)
// The administrator is a predefined account from ADMIN_EMAIL / ADMIN_PASSWORD (server/admin-account.server.ts). The
// regular /api/auth/login refuses it and /api/admin/auth/login refuses everyone else; nothing can grant the role.
// A reviewer is an account with the `coaches:review` permission (the `admin` role). Approving grants the
// `verified_coach` role, which carries `sessions:verify`; rejecting removes it.
//
// Training plans assigned to me (student-athlete accounts only; PUBLISHED plans from coaches I'm connected to):
//   GET /api/athletes/me/training-plans            ?limit&offset -> { ok, items, total }
//   GET /api/athletes/me/training-plans/:id        -> { ok, plan }
//
// Scholarships (every route needs a signed-in account):
//   GET  /api/scholarships                          ?sport&q&includeClosed&limit&offset -> { ok, items, total }   open ones by default;
//                                                    each item has myApplication ({ id, status } or null) for the caller
//   POST /api/scholarships                          university representative or admin
//                                                   { name, university?, sport, coverage, details, eligibility[], deadline } -> 201 { ok, scholarship }
//   GET  /api/scholarships/:id/applications         the poster (or an admin) -> { ok, items }   everyone who applied, withdrawn ones last
//   POST /api/scholarships/applications/:appId/status   the poster (or an admin) { status: "under_review" | "accepted" | "rejected" } -> { ok, status }   409 withdrawn; the athlete is notified
//   GET  /api/scholarships/universities            -> { ok, items: string[] }   universities with an open scholarship
//   POST /api/scholarships/:id/open | /close        poster or admin -> { ok, scholarship }
//   PUT  /api/scholarships/:id                      the poster (or an admin) { name, sport, coverage, details, eligibility[], deadline } -> { ok, scholarship }   applicants are told what changed
//   DELETE /api/scholarships/:id                    the poster (or an admin) -> { ok, deleted }   409 has_applications once anyone has applied (close it instead)
//   POST /api/scholarships/:id/apply                student-athlete -> 201 { ok, application }   (409 already_applied | closed)
//   POST /api/scholarships/:id/withdraw             student-athlete -> { ok, application }
//   GET  /api/athletes/me/applications              student-athlete ?limit&offset -> { ok, items, total }
//
// Notifications (the caller's own only; created by the server, never by a client):
//   GET  /api/notifications                         ?category&limit&offset -> { ok, items, total, unread }
//   GET  /api/notifications/unread-count            -> { ok, unread }   the number on the header bell
//   POST /api/notifications/read-all                -> { ok, updated }
//   POST /api/notifications/:id/read                -> { ok, notification }
//
// Header search:
//   GET  /api/search                                ?q&limit -> { ok, athletes, scholarships, coaches }   q needs 2+ characters; athletes (with relationship) only for verified coaches; coaches only for athletes
//
// Rankings (every route needs a signed-in account):
//   GET  /api/rankings                              ?sport&metric&province&municipality&school&category&limit -> { ok, sport, metric, minCountedSessions, rows, total, notEnoughSessions, me?, options }
//                                                    sport defaults to Basketball; me (athletes only) is the caller's own standing in this view
//   GET  /api/rankings/headline                     ?ids=a,b,c (up to 100) -> { ok, me, ranks }   nationwide headline rank per athlete; me.position null = not ranked yet
//   GET  /api/athletes/me/visibility                student-athlete -> { ok, visible }
//   PUT  /api/athletes/me/visibility                student-athlete { visible } -> { ok, visible }   false = hidden from everyone else's rankings
//
// My University (read-only; the university is always the signed-in coach's own, never taken from the request):
//   GET  /api/coach/university                      coach -> { ok, affiliated: true, university } | { ok, affiliated: false, reason: "not_verified" | "no_university" }
//   GET  /api/coach/university/coaches              coach ?q&limit&offset -> { ok, affiliated, items, total }   verified, active coaches of the same university
//   GET  /api/coach/university/athletes             coach ?q&limit&offset -> { ok, affiliated, items, total }   athletes with an accepted connection to a verified coach of it
// School Representative Dashboard (read-only; the school is always the signed-in representative's own approved school):
//   GET  /api/rep/dashboard                         university representative -> { ok, rep, school, stats, pendingRequests, activities, generatedAt }
//   GET  /api/rep/charts                            university representative -> { ok, charts: { athletesBySport, coachesBySport, requestsByMonth } }
// School Representative "My Coaches" (only coaches of the representative's own approved school):
//   GET  /api/rep/coaches                           university representative ?q&sport&status=affiliated|pending|removed&limit&offset -> { ok, school, items, total, sports, counts }
//   GET  /api/rep/coaches/:id                       university representative -> { ok, coach }
//   POST /api/rep/coaches/:id/affiliation           university representative { action: "remove" | "restore" } -> { ok, coach }
// School Representative "Coach Requests" (only requests sent to the representative's own approved school):
//   GET  /api/rep/coach-requests                    university representative ?q&status=pending|approved|rejected&limit&offset -> { ok, school, items, total, counts }
//   GET  /api/rep/coach-requests/:id                university representative -> { ok, request }   (id = the coach's user id)
//   POST /api/rep/coach-requests/:id/decision       university representative { decision: "approve" | "reject", reason? } -> { ok, request }   (reason required to reject)
//   POST /api/rep/coach-requests/:id/remind         university representative -> { ok, remindedAt }   a coach who signed up for the school but hasn't applied (status "incomplete"); once a day per coach
// School Representative "My Athletes" (read-only; only athletes of the representative's own approved school):
//   GET  /api/rep/athletes                          university representative ?q&sport&status=verified|unverified&limit&offset -> { ok, school, items, total, sports, counts }
//   GET  /api/rep/athletes/:id                      university representative -> { ok, athlete }   (profile + recorded achievements)
//   GET  /api/rep/athletes/:id/photo                university representative -> the athlete's approved profile photo (image bytes)
// School Representative top bar and Settings (each acts on the signed-in representative's OWN account only):
//   GET  /api/rep/header                            university representative -> { ok, header: { displayName, avatar, pendingCoachRequests } }
//   GET|PUT /api/rep/settings/profile               university representative { firstName, lastName, designation } -> { ok, profile }   (school, email, username are read-only)
//   PUT|DELETE /api/rep/settings/avatar             university representative { dataUrl } -> { ok, profile }
//   POST /api/rep/settings/password                 university representative { currentPassword, newPassword, confirmPassword? } -> { ok, otherSessionsSignedOut }
// School Representative CSV exports (own school only; same search and filters as the page; every download is audited):
//   GET  /api/rep/export/coaches | /athletes | /coach-requests   university representative ?q&sport&status -> a .csv file
//   GET  /api/rep/report.pdf                        university representative -> a PDF report of the school (numbers, charts as tables, coach and athlete lists; no emails)
// School Representative messages (one-way, to coaches and athletes of the representative's OWN school only):
//   POST /api/rep/messages/preview                  university representative { audience, sport?, recipientId? } -> { ok, preview: { count, coaches, athletes, label } }
//   POST /api/rep/messages                          university representative { audience, sport?, recipientId?, subject, body } -> 201 { ok, message }   (20 an hour, 100 a day)
//   GET  /api/rep/messages                          university representative ?limit&offset -> { ok, items, total }   what this representative has sent
//
// Athlete applications to a coach's program ("show interest"):
//   POST /api/coach-applications                    student-athlete { coachId } -> 201 { ok, application }   409 already_applied | already_connected, 429 rate_limited
//   GET  /api/coach-applications                    verified coach -> { ok, received }   /   student-athlete -> { ok, sent }
//   POST /api/coach-applications/:id/status         verified coach { status: "reviewed" | "dismissed" } -> { ok, status }
//
// Recruiting (every route needs a signed-in account; discovery needs a VERIFIED coach):
//   GET  /api/recruiting/athletes                   verified coach ?q&sport&position&school&skill&verifiedOnly&sort(score|verified|name)&limit&offset
//                                                    -> { ok, items, total, watchlist: ids, options }   hidden showcases never appear
//   GET  /api/recruiting/athletes/:id               verified coach, or the athlete themself -> { ok, athlete, own, watched, note, inquiry }   404 when hidden / missing
//   GET  /api/recruiting/watchlist                  verified coach -> { ok, items: athlete + note }   (add / remove with PUT / DELETE /api/coach/shortlist/:id)
//   PUT  /api/recruiting/watchlist/:id/note         verified coach { note <= 500 } -> { ok, note }   409 not_saved if not on the watchlist
//   GET  /api/recruiting/inquiries                  coach: ones they sent; athlete: ones they received -> { ok, items }
//   POST /api/recruiting/inquiries                  verified coach { athleteId, organization, message } -> 201 { ok, inquiry }
//                                                    409 already_open | showcase_hidden, 429 rate_limited
//   POST /api/recruiting/inquiries/:id/respond      the athlete { decision: "accepted" | "declined" } -> { ok, inquiry }   409 already_answered
//   GET  /api/recruiting/inquiries/:id/messages     the two people in it -> { ok, items }   marks the other side's messages read
//   POST /api/recruiting/inquiries/:id/messages     the two people in it { body <= 2000 } -> 201 { ok, message }   409 not_accepted until the athlete accepts
//
// The session token is returned in the JSON body and sent back as an `Authorization: Bearer`
// header (a native app has no browser cookie jar). Only a SHA-256 hash of it is stored.

import { z } from "zod";
import { parseRegistration, type RegisterField } from "./registration.ts";
import {
  authenticate,
  createUser,
  deriveUsername,
  destroySession,
  getUserBySessionToken,
  signupAllowed,
  UserInputError,
  type RequestMeta,
} from "./auth.server.ts";
import {
  cancelRequest,
  ConnectionError,
  disconnect,
  listConnections,
  PAGE_DEFAULT,
  PAGE_MAX,
  respondToRequest,
  searchAthletes,
  SEARCH_LIMIT_DEFAULT,
  SEARCH_MAX_CHARS,
  sendRequest,
  type ListKind,
} from "./connections.server.ts";
import { getCoachDashboard, listMyAthletes, setShortlisted } from "./coach-athletes.server.ts";
import {
  addMyRecord, getMyExtras, getMyProfile, removePhoto, removeVideo, saveMyProfile, saveScholarship, setPhoto, setVideo,
} from "./athlete-profile.server.ts";
import { createSession, listMySessions, listSessionsForReview, requestSessionReview, verifySession } from "./practice-sessions.server.ts";
import { createPlan, getAssignedPlan, getPlan, listAssignedPlans, listPlans, PlanError, updatePlan } from "./training-plans.server.ts";
import {
  getCoachProfile,
  listVerificationRequests,
  requestVerification,
  reviewVerification,
  saveCoachProfile,
} from "./coach-profile.server.ts";
import {
  applyToScholarship,
  createScholarship,
  deleteScholarship,
  updateScholarship,
  listApplicants,
  listMyApplications,
  listScholarships,
  setApplicationStatus,
  listUniversities,
  ScholarshipError,
  setScholarshipOpen,
  withdrawApplication,
  SCHOLARSHIP_PAGE_DEFAULT,
  SCHOLARSHIP_PAGE_MAX,
} from "./scholarships.server.ts";
import {
  listNotifications,
  markAllRead,
  markRead,
  NotificationError,
  NOTIF_PAGE_DEFAULT,
  NOTIF_PAGE_MAX,
  unreadCount,
} from "./notifications.server.ts";
import { globalSearch } from "./search.server.ts";
import { ensureAdminAccount } from "./admin-account.server.ts";
import { ACTIVITY_CATEGORIES, getMonitoringOverview, isActivityCategory, listActivity, type ActivityCategory } from "./monitoring.server.ts";
import {
  CONTENT_TYPES, REPORT_STATUSES, dismissReport, fileReport, getReport, investigateReport, listReports, resolveReport,
  type ContentType, type ReportStatus,
} from "./reports.server.ts";
import {
  AVATAR_MAX_CHARS, changeAdminPassword, getAdminHeader, getAdminPreferences, getAdminProfile, listAdminSessions,
  revokeAdminSession, revokeOtherAdminSessions, setAdminAvatar, updateAdminPreferences, updateAdminProfile,
} from "./admin-settings.server.ts";
import { getSystemInfo } from "./system-info.server.ts";
import { REGISTER_WITH_DOCS_MAX_BODY } from "./rep-documents.server.ts";
import { APPLICATION_STATUSES, getApplication, getApplicationDocument, listApplications as listRepApplications, reviewApplication as reviewRepApplication, type ApplicationStatus } from "./rep-applications.server.ts";
import { getAdminOverview } from "./admin.server.ts";
import { DIRECTORY_ROLES, USER_STATUSES, getUserDetail, listUsers, reactivateUser, suspendUser, type DirectoryRole, type UserStatus } from "./admin-users.server.ts";
import {
  getMyUniversity,
  listUniversityAthletes,
  listUniversityCoaches,
  UNIVERSITY_PAGE_DEFAULT,
  UNIVERSITY_PAGE_MAX,
  UniversityError,
} from "./university.server.ts";
import { getRepDashboard, RepDashboardError } from "./rep-dashboard.server.ts";
import { getRepCharts } from "./rep-charts.server.ts";
import { EXPORT_KINDS, exportRepData, type ExportKind } from "./rep-exports.server.ts";
import { buildRepReport } from "./rep-report.server.ts";
import { notifyCoachNextStep, notifyRepsOfCoachSignup } from "./rep-notifications.server.ts";
import { getDb } from "./db.server.ts";
import { allowUniversitySearch, findRepSchool, searchUniversities } from "./university-search.server.ts";
import { HISTORY_PAGE_DEFAULT, HISTORY_PAGE_MAX, listRepMessages, previewRepMessage, sendRepMessage } from "./rep-messages.server.ts";
import {
  AVATAR_MAX_CHARS as REP_AVATAR_MAX_CHARS, changeRepPassword, getRepHeader, getRepProfile, setRepAvatar, updateRepProfile,
} from "./rep-settings.server.ts";
import {
  ATHLETES_PAGE_DEFAULT, ATHLETES_PAGE_MAX, VERIFICATION_STATUSES, getRepAthlete, getRepAthletePhoto, listRepAthletes, type AthleteVerification,
} from "./rep-athletes.server.ts";
import {
  REQUEST_STATUSES, REQUESTS_PAGE_DEFAULT, REQUESTS_PAGE_MAX, decideCoachRequest, getCoachRequest, listCoachRequests, remindCoach, type RequestStatus,
} from "./rep-coach-requests.server.ts";
import {
  AFFILIATION_STATUSES, COACHES_PAGE_DEFAULT, COACHES_PAGE_MAX, getRepCoach, listRepCoaches, setCoachAffiliation, type AffiliationStatus,
} from "./rep-coaches.server.ts";
import {
  applyToCoach,
  CoachApplicationError,
  listApplications,
  setApplicationStatus as setCoachApplicationStatus,
} from "./coach-applications.server.ts";
import {
  DIRECTORY_LIMIT_DEFAULT,
  DIRECTORY_LIMIT_MAX,
  getAthlete,
  listAthletes,
  listInquiries,
  listMessages,
  listWatchlist,
  RecruitingError,
  respondToInquiry,
  sendInquiry,
  sendMessage,
  setNote,
} from "./recruiting.server.ts";
import {
  getHeadline,
  getRankings,
  getShowcaseVisible,
  RankingError,
  RANKINGS_LIMIT_DEFAULT,
  RANKINGS_LIMIT_MAX,
  setShowcaseVisible,
} from "./rankings.server.ts";
import { PLAN_STATUSES, type PlanStatus } from "../src/lib/trainingPlanRules.ts";

const TRUST_PROXY = process.env["TRUST_PROXY"] === "true" || !!process.env["VERCEL"];
const MAX_BODY_BYTES = 16 * 1024;

// The web app is served from the same origin as the API on Vercel, so it needs no CORS entry.
// These are for the native app's web view (Capacitor) and for local development. Add your own
// with CORS_ORIGINS=a,b,c.
const ALLOWED_ORIGINS = new Set([
  "capacitor://localhost",
  "ionic://localhost",
  "http://localhost",
  "https://localhost",
  "http://localhost:5173",
  "http://localhost:8100",
  ...(process.env["CORS_ORIGINS"] ?? "").split(",").map((s) => s.trim()).filter(Boolean),
]);

/** Header the local Node adapter uses to pass the socket address (always overwritten there). */
export const SOCKET_IP_HEADER = "x-sportal-socket-ip";

const loginSchema = z.object({
  identifier: z.string().trim().min(1, "Enter your username or email.").max(254),
  password: z.string().min(1, "Enter your password.").max(128),
  remember: z.boolean().default(false),
});

function requestMeta(req: Request): RequestMeta {
  let ip: string | null;
  if (TRUST_PROXY) {
    // On Vercel the platform sets x-forwarded-for itself, so the first entry is the real client.
    const first = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    ip = first ?? req.headers.get("x-real-ip");
  } else {
    ip = req.headers.get(SOCKET_IP_HEADER);
  }
  return { ip: ip || null, userAgent: req.headers.get("user-agent") };
}

function bearer(req: Request): string | undefined {
  const h = req.headers.get("authorization");
  return (h ? /^Bearer\s+(\S+)$/i.exec(h) : null)?.[1];
}

function send(req: Request, status: number, body: unknown): Response {
  const headers = new Headers({
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    vary: "Origin",
  });
  const origin = req.headers.get("origin");
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    headers.set("access-control-allow-origin", origin);
    headers.set("access-control-allow-headers", "authorization, content-type");
    headers.set("access-control-allow-methods", "GET, POST, PUT, DELETE, OPTIONS");
    headers.set("access-control-max-age", "600");
  }
  return new Response(status === 204 ? null : JSON.stringify(body), { status, headers });
}

/** A profile photo is sent as a data URL of up to ~400 KB, so that one route gets a bigger limit. */
const PHOTO_BODY_BYTES = 450 * 1024;

async function readJson(req: Request, maxBytes: number = MAX_BODY_BYTES): Promise<unknown> {
  const declared = Number(req.headers.get("content-length") ?? 0);
  if (declared > maxBytes) throw new Error("too_large");
  const text = await req.text();
  if (text.length > maxBytes) throw new Error("too_large");
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    throw new Error("bad_json");
  }
}

async function handleLogin(req: Request): Promise<Response> {
  const parsed = loginSchema.safeParse(await readJson(req));
  if (!parsed.success) {
    const flat = parsed.error.flatten().fieldErrors;
    return send(req, 200, {
      ok: false,
      code: "validation",
      message: "Please fix the highlighted fields.",
      fieldErrors: {
        ...(flat.identifier?.[0] ? { identifier: flat.identifier[0] } : {}),
        ...(flat.password?.[0] ? { password: flat.password[0] } : {}),
      },
    });
  }
  try {
    const result = await authenticate(parsed.data, requestMeta(req));
    if (!result.ok) {
      if (result.code === "rate_limited") {
        const mins = Math.ceil((result.retryAfterSec ?? 60) / 60);
        return send(req, 200, {
          ok: false,
          code: "rate_limited",
          message: `Too many failed attempts. Try again in about ${mins} minute${mins === 1 ? "" : "s"}.`,
          retryAfterSec: result.retryAfterSec ?? 60,
        });
      }
      if (result.code === "inactive")
        return send(req, 200, { ok: false, code: "inactive", message: "This account has been suspended. Contact your administrator." });
      // Shown only after the password was right, so it tells nobody anything they could not already do.
      if (result.code === "pending_approval")
        return send(req, 200, {
          ok: false, code: "pending_approval",
          message: "Your application is still being reviewed. You'll be able to sign in once a Sportal administrator approves your school representative account.",
        });
      if (result.code === "application_rejected")
        return send(req, 200, {
          ok: false, code: "application_rejected",
          message: result.reason
            ? `Your school representative application wasn't approved. Reason: ${result.reason}`
            : "Your school representative application wasn't approved.",
        });
      return send(req, 200, { ok: false, code: "invalid_credentials", message: "Incorrect username/email or password." });
    }
    return send(req, 200, { ok: true, user: result.user, token: result.token, expiresAt: result.expiresAt.toISOString() });
  } catch (err) {
    console.error("[api] login failed unexpectedly:", err instanceof Error ? err.message : "unknown error");
    return send(req, 200, { ok: false, code: "server_error", message: "Something went wrong. Please try again." });
  }
}

const adminLoginSchema = z.object({
  identifier: z.string().trim().min(1, "Enter the administrator email or username.").max(254),
  password: z.string().min(1, "Enter your password.").max(128),
});

/** The administrator's own sign-in. Same failure messages as the regular one, never a hint about roles. */
async function handleAdminLogin(req: Request): Promise<Response> {
  const parsed = adminLoginSchema.safeParse(await readJson(req));
  if (!parsed.success) {
    const flat = parsed.error.flatten().fieldErrors;
    return send(req, 200, {
      ok: false,
      code: "validation",
      message: "Please fix the highlighted fields.",
      fieldErrors: {
        ...(flat.identifier?.[0] ? { identifier: flat.identifier[0] } : {}),
        ...(flat.password?.[0] ? { password: flat.password[0] } : {}),
      },
    });
  }
  try {
    const result = await authenticate({ ...parsed.data, remember: false, scope: "admin" }, requestMeta(req));
    if (!result.ok) {
      if (result.code === "rate_limited") {
        const mins = Math.ceil((result.retryAfterSec ?? 60) / 60);
        return send(req, 200, {
          ok: false, code: "rate_limited",
          message: `Too many failed attempts. Try again in about ${mins} minute${mins === 1 ? "" : "s"}.`,
          retryAfterSec: result.retryAfterSec ?? 60,
        });
      }
      return send(req, 200, { ok: false, code: "invalid_credentials", message: "Incorrect administrator credentials." });
    }
    return send(req, 200, { ok: true, user: result.user, token: result.token, expiresAt: result.expiresAt.toISOString() });
  } catch (err) {
    console.error("[api] admin login failed unexpectedly:", err instanceof Error ? err.message : "unknown error");
    return send(req, 200, { ok: false, code: "server_error", message: "Something went wrong. Please try again." });
  }
}

async function handleAdminOverview(req: Request): Promise<Response> {
  const user = await getUserBySessionToken(bearer(req));
  if (!user) return send(req, 401, { ok: false, code: "unauthenticated", message: "Sign in to continue." });
  try {
    return send(req, 200, { ok: true, overview: await getAdminOverview(user) });
  } catch (err) {
    if (err instanceof ConnectionError) return send(req, err.httpStatus, { ok: false, code: err.code, message: err.message });
    throw err;
  }
}

/** The administrator's User Management endpoints. Returns null for any other path. */
async function handleAdminUsers(req: Request, path: string): Promise<Response | null> {
  const isList = req.method === "GET" && path === "/api/admin/users";
  const one = /^\/api\/admin\/users\/([^/]+)(?:\/(suspend|reactivate))?$/.exec(path);
  const isOne = req.method === "GET" && !!one && !one[2];
  const isAction = req.method === "POST" && !!one && !!one[2];
  if (!isList && !isOne && !isAction) return null;

  const user = await getUserBySessionToken(bearer(req));
  if (!user) return send(req, 401, { ok: false, code: "unauthenticated", message: "Sign in to continue." });
  try {
    if (isList) {
      const sp = new URL(req.url).searchParams;
      const role = sp.get("role");
      const status = sp.get("status");
      if (role && !(DIRECTORY_ROLES as readonly string[]).includes(role))
        return send(req, 400, { ok: false, code: "validation", message: "role must be student_athlete, coach or university_representative." });
      if (status && !(USER_STATUSES as readonly string[]).includes(status))
        return send(req, 400, { ok: false, code: "validation", message: "status must be active, pending or suspended." });
      const paging = pagingFrom(req);
      const result = await listUsers(user, {
        q: sp.get("q") ?? "",
        ...(role ? { role: role as DirectoryRole } : {}),
        ...(status ? { status: status as UserStatus } : {}),
        ...paging,
      });
      return send(req, 200, { ok: true, ...result });
    }
    const id = decodeURIComponent(one![1]!);
    if (isOne) return send(req, 200, { ok: true, user: await getUserDetail(user, id) });
    const body = (await readJson(req)) as Record<string, unknown> | null;
    const reason = body && typeof body === "object" ? body["reason"] : undefined;
    const meta = requestMeta(req);
    const detail = one![2] === "suspend" ? await suspendUser(user, id, reason, meta) : await reactivateUser(user, id, reason, meta);
    return send(req, 200, { ok: true, user: detail });
  } catch (err) {
    if (err instanceof ConnectionError) return send(req, err.httpStatus, { ok: false, code: err.code, message: err.message, ...err.extra });
    throw err;
  }
}

/** A file download. Same CORS rules as send(); never cached, never sniffed, never run as a page. */
function sendFile(req: Request, file: { fileName: string; mimeType: string; data: Buffer }): Response {
  const headers = new Headers({
    "content-type": file.mimeType,
    "content-length": String(file.data.length),
    "cache-control": "private, no-store",
    "x-content-type-options": "nosniff",
    "content-security-policy": "default-src 'none'; sandbox",
    "content-disposition": `inline; filename*=UTF-8''${encodeURIComponent(file.fileName)}`,
    vary: "Origin",
  });
  const origin = req.headers.get("origin");
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    headers.set("access-control-allow-origin", origin);
    headers.set("access-control-allow-headers", "authorization, content-type");
  }
  return new Response(new Uint8Array(file.data), { status: 200, headers });
}

/** School Verification: the administrator reviews school representative applications. Returns null for any other path. */
async function handleSchoolVerification(req: Request, path: string): Promise<Response | null> {
  const isList = req.method === "GET" && path === "/api/admin/school-verifications";
  const m = /^\/api\/admin\/school-verifications\/([^/]+)(?:\/(approve|reject)|\/documents\/([^/]+))?$/.exec(path);
  const isOne = req.method === "GET" && !!m && !m[2] && !m[3];
  const isDoc = req.method === "GET" && !!m && !!m[3];
  const isDecision = req.method === "POST" && !!m && !!m[2];
  if (!isList && !isOne && !isDoc && !isDecision) return null;

  const user = await getUserBySessionToken(bearer(req));
  if (!user) return send(req, 401, { ok: false, code: "unauthenticated", message: "Sign in to continue." });
  try {
    if (isList) {
      const status = new URL(req.url).searchParams.get("status");
      if (status && !(APPLICATION_STATUSES as readonly string[]).includes(status))
        return send(req, 400, { ok: false, code: "validation", message: "status must be pending, approved, rejected or incomplete." });
      const result = await listRepApplications(user, { ...(status ? { status: status as ApplicationStatus } : {}), ...pagingFrom(req) });
      return send(req, 200, { ok: true, ...result });
    }
    const id = decodeURIComponent(m![1]!);
    if (isOne) return send(req, 200, { ok: true, application: await getApplication(user, id) });
    if (isDoc) return sendFile(req, await getApplicationDocument(user, id, decodeURIComponent(m![3]!)));
    const body = (await readJson(req)) as Record<string, unknown> | null;
    const reason = body && typeof body === "object" ? body["reason"] : undefined;
    const application = await reviewRepApplication(user, id, m![2] === "approve" ? "approve" : "reject", reason, requestMeta(req));
    return send(req, 200, { ok: true, application });
  } catch (err) {
    if (err instanceof ConnectionError) return send(req, err.httpStatus, { ok: false, code: err.code, message: err.message, ...err.extra });
    throw err;
  }
}

/** The administrator's own Settings. Everything here acts on the signed-in administrator's account only. Returns null for any other path. */
async function handleAdminSettings(req: Request, path: string): Promise<Response | null> {
  const m = req.method;
  const sess = /^\/api\/admin\/settings\/sessions\/([^/]+)$/.exec(path);
  const known =
    (m === "GET" && (path === "/api/admin/header" || path === "/api/admin/settings/profile" || path === "/api/admin/settings/sessions" ||
      path === "/api/admin/settings/notifications" || path === "/api/admin/settings/system")) ||
    (m === "PUT" && (path === "/api/admin/settings/profile" || path === "/api/admin/settings/avatar" || path === "/api/admin/settings/notifications")) ||
    (m === "DELETE" && (path === "/api/admin/settings/avatar" || (!!sess && sess[1] !== "revoke-others"))) ||
    (m === "POST" && (path === "/api/admin/settings/password" || path === "/api/admin/settings/sessions/revoke-others"));
  if (!known) return null;

  const token = bearer(req);
  const user = await getUserBySessionToken(token);
  if (!user) return send(req, 401, { ok: false, code: "unauthenticated", message: "Sign in to continue." });
  const meta = requestMeta(req);
  try {
    if (path === "/api/admin/header") return send(req, 200, { ok: true, header: await getAdminHeader(user) });
    if (path === "/api/admin/settings/profile")
      return send(req, 200, { ok: true, profile: m === "GET" ? await getAdminProfile(user) : await updateAdminProfile(user, await readJson(req), meta) });
    if (path === "/api/admin/settings/avatar") {
      if (m === "DELETE") return send(req, 200, { ok: true, profile: await setAdminAvatar(user, null, meta) });
      const body = (await readJson(req, AVATAR_MAX_CHARS + 2000)) as Record<string, unknown> | null;
      return send(req, 200, { ok: true, profile: await setAdminAvatar(user, body && typeof body === "object" ? body["dataUrl"] : undefined, meta) });
    }
    if (path === "/api/admin/settings/password") return send(req, 200, { ok: true, ...(await changeAdminPassword(user, await readJson(req), token, meta)) });
    if (path === "/api/admin/settings/sessions") return send(req, 200, { ok: true, sessions: await listAdminSessions(user, token) });
    if (path === "/api/admin/settings/sessions/revoke-others") return send(req, 200, { ok: true, ...(await revokeOtherAdminSessions(user, token, meta)) });
    if (sess) {
      await revokeAdminSession(user, decodeURIComponent(sess[1]!), token, meta);
      return send(req, 200, { ok: true });
    }
    if (path === "/api/admin/settings/notifications")
      return send(req, 200, { ok: true, preferences: m === "GET" ? await getAdminPreferences(user) : await updateAdminPreferences(user, await readJson(req)) });
    return send(req, 200, { ok: true, system: await getSystemInfo(user) });
  } catch (err) {
    if (err instanceof ConnectionError) return send(req, err.httpStatus, { ok: false, code: err.code, message: err.message, ...err.extra });
    throw err;
  }
}

/** A signed-in user reports an athlete's profile, video or photo. */
async function handleFileReport(req: Request): Promise<Response> {
  const user = await getUserBySessionToken(bearer(req));
  if (!user) return send(req, 401, { ok: false, code: "unauthenticated", message: "Sign in to continue." });
  try {
    const report = await fileReport(user, await readJson(req), requestMeta(req));
    return send(req, 200, { ok: true, report });
  } catch (err) {
    if (err instanceof ConnectionError) return send(req, err.httpStatus, { ok: false, code: err.code, message: err.message, ...err.extra });
    throw err;
  }
}

/** Platform Monitoring: overview, activity logs, and the moderation of reports. Returns null for any other path. */
async function handleMonitoring(req: Request, path: string): Promise<Response | null> {
  const m = /^\/api\/admin\/reports\/([^/]+)(?:\/(investigate|dismiss|resolve))?$/.exec(path);
  const isOverview = req.method === "GET" && path === "/api/admin/monitoring/overview";
  const isActivity = req.method === "GET" && path === "/api/admin/monitoring/activity";
  const isList = req.method === "GET" && path === "/api/admin/reports";
  const isOne = req.method === "GET" && !!m && !m[2];
  const isAction = req.method === "POST" && !!m && !!m[2];
  if (!isOverview && !isActivity && !isList && !isOne && !isAction) return null;

  const user = await getUserBySessionToken(bearer(req));
  if (!user) return send(req, 401, { ok: false, code: "unauthenticated", message: "Sign in to continue." });
  const invalid = (message: string) => send(req, 400, { ok: false, code: "validation", message });
  try {
    const sp = new URL(req.url).searchParams;
    if (isOverview) return send(req, 200, { ok: true, overview: await getMonitoringOverview(user) });
    if (isActivity) {
      const category = sp.get("category");
      if (category && !isActivityCategory(category)) return invalid(`category must be one of ${ACTIVITY_CATEGORIES.join(", ")}.`);
      const result = await listActivity(user, { q: sp.get("q") ?? "", ...(category ? { category: category as ActivityCategory } : {}), ...pagingFrom(req) });
      return send(req, 200, { ok: true, ...result });
    }
    if (isList) {
      const status = sp.get("status");
      const type = sp.get("type");
      if (status && !(REPORT_STATUSES as readonly string[]).includes(status)) return invalid("status must be pending, investigating, resolved or dismissed.");
      if (type && !(CONTENT_TYPES as readonly string[]).includes(type)) return invalid("type must be athlete_profile, video or photo.");
      const result = await listReports(user, { ...(status ? { status: status as ReportStatus } : {}), ...(type ? { type: type as ContentType } : {}), ...pagingFrom(req) });
      return send(req, 200, { ok: true, ...result });
    }
    const id = decodeURIComponent(m![1]!);
    if (isOne) return send(req, 200, { ok: true, report: await getReport(user, id) });
    const meta = requestMeta(req);
    const action = m![2];
    if (action === "investigate") return send(req, 200, { ok: true, report: await investigateReport(user, id, meta) });
    const body = (await readJson(req)) as Record<string, unknown> | null;
    if (action === "dismiss") return send(req, 200, { ok: true, report: await dismissReport(user, id, body && typeof body === "object" ? body["note"] : undefined, meta) });
    const resolved = await resolveReport(user, id, body, meta);
    return send(req, 200, { ok: true, ...resolved });
  } catch (err) {
    if (err instanceof ConnectionError) return send(req, err.httpStatus, { ok: false, code: err.code, message: err.message, ...err.extra });
    throw err;
  }
}

async function handleRegister(req: Request): Promise<Response> {
  // Larger limit only so a representative's documents fit; everything else is still validated by the schema.
  const parsed = parseRegistration(await readJson(req, REGISTER_WITH_DOCS_MAX_BODY));
  if (!parsed.ok) return send(req, 200, { ok: false, code: "validation", message: parsed.message, fieldErrors: parsed.fieldErrors });
  const input = parsed.data;
  const meta = requestMeta(req);

  let username = "";
  let createdUser: { id: string } | null = null;
  try {
    if (!(await signupAllowed(meta.ip)))
      return send(req, 200, { ok: false, code: "rate_limited", message: "Too many sign ups from this connection. Try again in an hour." });
    // A coach must belong to a school that has an approved representative, because that representative decides
    // the coach's verification. Checked here (not only in the form) and saved under the school's exact registered
    // name, so the request can never miss its representative because of a typo or a different spelling.
    let details = parsed.details;
    if (details.kind === "coach") {
      const school = await findRepSchool(details.organization);
      if (!school) {
        const message = "Choose your school from the list. Only schools with a registered representative on Sportal can be selected.";
        return send(req, 200, { ok: false, code: "validation", message, fieldErrors: { organization: message } });
      }
      details = { ...details, organization: school.name };
    }
    username = await deriveUsername(input.email);
    createdUser = await createUser({
      email: input.email,
      username,
      password: input.password,
      displayName: `${input.firstName} ${input.lastName}`,
      firstName: input.firstName,
      lastName: input.lastName,
      roles: [input.accountType],
      details,
    });
  } catch (err) {
    if (err instanceof UserInputError) {
      const field: RegisterField = err.field === "email" || err.field === "password" ? err.field : "email";
      if (err.field === "email" && /already registered/i.test(err.message))
        return send(req, 200, { ok: false, code: "taken", message: err.message, fieldErrors: { email: err.message } });
      return send(req, 200, { ok: false, code: "validation", message: err.message, fieldErrors: { [field]: err.message } });
    }
    console.error("[api] sign up failed unexpectedly:", err instanceof Error ? err.message : "unknown error");
    return send(req, 200, { ok: false, code: "server_error", message: "Something went wrong. Please try again." });
  }
  // A coach who has signed up for a school: tell that school's representative(s), and tell the coach what to do
  // next (finish the profile and request verification). Never allowed to fail the sign-up itself.
  if (input.accountType === "coach" && createdUser) {
    try {
      const db = await getDb();
      await notifyRepsOfCoachSignup(db, createdUser.id);
      await notifyCoachNextStep(db, createdUser.id);
    } catch (err) {
      console.error("[api] sign-up notifications failed:", err instanceof Error ? err.message : "unknown error");
    }
  }
  // A school representative has applied, not signed up: no session until an administrator approves.
  if (input.accountType === "university_representative")
    return send(req, 200, {
      ok: true, pendingApproval: true, role: input.accountType,
      message: "Application received. A Sportal administrator will review your documents, and you'll be able to sign in once you're approved.",
    });
  try {
    const result = await authenticate({ identifier: username, password: input.password, remember: false }, meta);
    if (!result.ok) return send(req, 200, { ok: false, code: "server_error", message: "Your account was created. Sign in to continue." });
    return send(req, 200, {
      ok: true, user: result.user, role: input.accountType, token: result.token, expiresAt: result.expiresAt.toISOString(),
    });
  } catch (err) {
    console.error("[api] sign in after sign up failed:", err instanceof Error ? err.message : "unknown error");
    return send(req, 200, { ok: false, code: "server_error", message: "Your account was created. Sign in to continue." });
  }
}

const sendRequestSchema = z.object({
  userId: z.string({ required_error: "Choose who to connect with." }).trim().uuid("Choose who to connect with."),
});

/** ?limit and ?offset for the list endpoints; anything invalid falls back to the defaults. */
function pagingFrom(req: Request): { limit: number; offset: number } {
  const params = new URL(req.url).searchParams;
  const limit = Number(params.get("limit") ?? PAGE_DEFAULT);
  const offset = Number(params.get("offset") ?? 0);
  return {
    limit: Number.isInteger(limit) && limit >= 1 ? Math.min(limit, PAGE_MAX) : PAGE_DEFAULT,
    offset: Number.isInteger(offset) && offset >= 0 ? offset : 0,
  };
}

/** Returns null when the path is not a connections route, so the caller can keep matching. */
async function handleConnections(req: Request, path: string): Promise<Response | null> {
  if (path !== "/api/connections" && !path.startsWith("/api/connections/")) return null;
  const get = req.method === "GET";
  const post = req.method === "POST";

  const listKind: ListKind | null =
    get && path === "/api/connections" ? "accepted"
    : get && path === "/api/connections/requests/incoming" ? "incoming"
    : get && path === "/api/connections/requests/outgoing" ? "outgoing"
    : null;
  const isSend = post && path === "/api/connections/requests";
  const answer = post ? /^\/api\/connections\/requests\/([^/]+)\/(accept|decline|cancel)$/.exec(path) : null;
  const leave = post ? /^\/api\/connections\/([^/]+)\/disconnect$/.exec(path) : null;
  if (!listKind && !isSend && !answer && !leave) return null;

  // Authentication comes first: nothing below runs, and no body is read, for an anonymous caller.
  const user = await getUserBySessionToken(bearer(req));
  if (!user) return send(req, 401, { ok: false, code: "unauthenticated", message: "Sign in to continue." });

  const meta = requestMeta(req);
  try {
    if (listKind) return send(req, 200, { ok: true, ...(await listConnections(user, listKind, pagingFrom(req))) });

    if (isSend) {
      const parsed = sendRequestSchema.safeParse(await readJson(req));
      if (!parsed.success)
        return send(req, 400, {
          ok: false,
          code: "validation",
          message: "Please fix the highlighted fields.",
          fieldErrors: { userId: parsed.error.flatten().fieldErrors.userId?.[0] ?? "Choose who to connect with." },
        });
      const result = await sendRequest(user, parsed.data.userId, meta);
      return send(req, 201, { ok: true, connection: result.connection });
    }

    if (answer) {
      const id = answer[1] ?? "";
      const action = answer[2];
      const connection =
        action === "accept" ? await respondToRequest(user, id, "accepted", meta)
        : action === "decline" ? await respondToRequest(user, id, "declined", meta)
        : await cancelRequest(user, id, meta);
      return send(req, 200, { ok: true, connection });
    }

    return send(req, 200, { ok: true, connection: await disconnect(user, leave?.[1] ?? "", meta) });
  } catch (err) {
    if (err instanceof ConnectionError)
      return send(req, err.httpStatus, { ok: false, code: err.code, message: err.message, ...err.extra });
    throw err;
  }
}

/** Returns null when the path is not the athlete search route, so the caller can keep matching. */
async function handleAthleteSearch(req: Request, path: string): Promise<Response | null> {
  if (req.method !== "GET" || path !== "/api/athletes/search") return null;

  // Authentication comes first: nothing below runs for an anonymous caller.
  const user = await getUserBySessionToken(bearer(req));
  if (!user) return send(req, 401, { ok: false, code: "unauthenticated", message: "Sign in to continue." });

  const params = new URL(req.url).searchParams;
  const q = params.get("q") ?? "";
  if (q.length > SEARCH_MAX_CHARS * 2)
    return send(req, 400, { ok: false, code: "validation", message: "Search text is too long." });
  const limit = Number(params.get("limit") ?? SEARCH_LIMIT_DEFAULT);
  try {
    return send(req, 200, { ok: true, ...(await searchAthletes(user, q, limit, requestMeta(req))) });
  } catch (err) {
    if (err instanceof ConnectionError)
      return send(req, err.httpStatus, { ok: false, code: err.code, message: err.message, ...err.extra });
    throw err;
  }
}

const scholarshipSchema = z.object({
  name: z.string().trim().min(3).max(120),
  university: z.string().trim().min(2).max(120).optional(),
  sport: z.string().trim().min(1).max(40),
  coverage: z.string().trim().max(120).default(""),
  details: z.string().max(2000).default(""),
  eligibility: z.array(z.string().max(120)).max(10).default([]),
  deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

function pageFrom(req: Request, def: number, max: number): { limit: number; offset: number } {
  const params = new URL(req.url).searchParams;
  const limit = Number(params.get("limit") ?? def);
  const offset = Number(params.get("offset") ?? 0);
  return {
    limit: Number.isInteger(limit) && limit >= 1 ? Math.min(limit, max) : def,
    offset: Number.isInteger(offset) && offset >= 0 ? offset : 0,
  };
}

/** Returns null when the path is not a scholarships route, so the caller can keep matching. */
async function handleScholarships(req: Request, path: string): Promise<Response | null> {
  const isList = path === "/api/scholarships";
  const action = /^\/api\/scholarships\/([^/]+)\/(open|close|apply|withdraw)$/.exec(path);
  const isMine = path === "/api/athletes/me/applications";
  const isUnis = path === "/api/scholarships/universities";
  const applicants = /^\/api\/scholarships\/([^/]+)\/applications$/.exec(path);
  const setStatus = /^\/api\/scholarships\/applications\/([^/]+)\/status$/.exec(path);
  const one = /^\/api\/scholarships\/([^/]+)$/.exec(path);
  if (!isList && !action && !isMine && !isUnis && !applicants && !setStatus && !one) return null;
  const get = req.method === "GET";
  const post = req.method === "POST";
  const put = req.method === "PUT";
  const del = req.method === "DELETE";
  if (!((isList && (get || post)) || (action && post) || ((isMine || isUnis || applicants) && get) || (setStatus && post) || (one && !isUnis && (put || del)))) return null;

  const user = await getUserBySessionToken(bearer(req));
  if (!user) return send(req, 401, { ok: false, code: "unauthenticated", message: "Sign in to continue." });
  const meta = requestMeta(req);
  try {
    if (isList && get) {
      const params = new URL(req.url).searchParams;
      return send(req, 200, {
        ok: true,
        ...(await listScholarships(user, {
          sport: params.get("sport") ?? undefined,
          q: params.get("q") ?? undefined,
          includeClosed: params.get("includeClosed") === "true",
          ...pageFrom(req, SCHOLARSHIP_PAGE_DEFAULT, SCHOLARSHIP_PAGE_MAX),
        })),
      });
    }
    if (isUnis) return send(req, 200, { ok: true, items: await listUniversities() });
    if (applicants) return send(req, 200, { ok: true, ...(await listApplicants(user, applicants[1] ?? "")) });
    if (setStatus) {
      const parsed = z.object({ status: z.enum(["under_review", "accepted", "rejected"]) }).safeParse(await readJson(req));
      if (!parsed.success) return send(req, 400, { ok: false, code: "validation", message: 'Send { status: "under_review" | "accepted" | "rejected" }.' });
      return send(req, 200, { ok: true, status: await setApplicationStatus(user, setStatus[1] ?? "", parsed.data.status, meta) });
    }
    if (isMine) {
      const { limit, offset } = pageFrom(req, SCHOLARSHIP_PAGE_DEFAULT, SCHOLARSHIP_PAGE_MAX);
      return send(req, 200, { ok: true, ...(await listMyApplications(user, limit, offset)) });
    }
    if (one && !isUnis && (put || del)) {
      const id = decodeURIComponent(one[1] ?? "").slice(0, 100);
      if (del) return send(req, 200, { ok: true, ...(await deleteScholarship(user, id, meta)) });
      const parsed = scholarshipSchema.safeParse(await readJson(req));
      if (!parsed.success)
        return send(req, 400, { ok: false, code: "validation", message: "Please fix the highlighted fields.", fieldErrors: parsed.error.flatten().fieldErrors });
      return send(req, 200, { ok: true, scholarship: await updateScholarship(user, id, parsed.data, meta) });
    }
    if (isList && post) {
      const parsed = scholarshipSchema.safeParse(await readJson(req));
      if (!parsed.success)
        return send(req, 400, { ok: false, code: "validation", message: "Please fix the highlighted fields.", fieldErrors: parsed.error.flatten().fieldErrors });
      return send(req, 201, { ok: true, scholarship: await createScholarship(user, parsed.data, meta) });
    }
    const [, id, verb] = action as RegExpExecArray;
    if (verb === "open" || verb === "close")
      return send(req, 200, { ok: true, scholarship: await setScholarshipOpen(user, id as string, verb === "open", meta) });
    if (verb === "apply") return send(req, 201, { ok: true, application: await applyToScholarship(user, id as string, meta) });
    return send(req, 200, { ok: true, application: await withdrawApplication(user, id as string, meta) });
  } catch (err) {
    if (err instanceof ScholarshipError) return send(req, err.httpStatus, { ok: false, code: err.code, message: err.message });
    throw err;
  }
}

/** Returns null when the path is not a notifications route, so the caller can keep matching. */
async function handleNotifications(req: Request, path: string): Promise<Response | null> {
  const one = /^\/api\/notifications\/([^/]+)\/read$/.exec(path);
  const isList = req.method === "GET" && path === "/api/notifications";
  const isCount = req.method === "GET" && path === "/api/notifications/unread-count";
  const isAll = req.method === "POST" && path === "/api/notifications/read-all";
  const isOne = req.method === "POST" && !!one && one[1] !== "read-all";
  if (!isList && !isCount && !isAll && !isOne) return null;

  const user = await getUserBySessionToken(bearer(req));
  if (!user) return send(req, 401, { ok: false, code: "unauthenticated", message: "Sign in to continue." });
  try {
    if (isList)
      return send(req, 200, {
        ok: true,
        ...(await listNotifications(user, { category: new URL(req.url).searchParams.get("category") ?? undefined, ...pageFrom(req, NOTIF_PAGE_DEFAULT, NOTIF_PAGE_MAX) })),
      });
    if (isCount) return send(req, 200, { ok: true, unread: await unreadCount(user) });
    if (isAll) return send(req, 200, { ok: true, updated: await markAllRead(user) });
    return send(req, 200, { ok: true, notification: await markRead(user, (one as RegExpExecArray)[1] as string) });
  } catch (err) {
    if (err instanceof NotificationError) return send(req, err.httpStatus, { ok: false, code: err.code, message: err.message });
    throw err;
  }
}

/** Returns null when the path is not the header search route, so the caller can keep matching. */
async function handleGlobalSearch(req: Request, path: string): Promise<Response | null> {
  if (req.method !== "GET" || path !== "/api/search") return null;
  const user = await getUserBySessionToken(bearer(req));
  if (!user) return send(req, 401, { ok: false, code: "unauthenticated", message: "Sign in to continue." });
  const params = new URL(req.url).searchParams;
  const q = params.get("q") ?? "";
  if (q.length > 160) return send(req, 400, { ok: false, code: "validation", message: "Search text is too long." });
  return send(req, 200, { ok: true, ...(await globalSearch(user, q, Number(params.get("limit") ?? 5))) });
}

/** Returns null when the path is not a rankings route, so the caller can keep matching. */
async function handleRankings(req: Request, path: string): Promise<Response | null> {
  const isList = req.method === "GET" && path === "/api/rankings";
  const isHeadline = req.method === "GET" && path === "/api/rankings/headline";
  const isVisibility = (req.method === "GET" || req.method === "PUT") && path === "/api/athletes/me/visibility";
  if (!isList && !isHeadline && !isVisibility) return null;

  const user = await getUserBySessionToken(bearer(req));
  if (!user) return send(req, 401, { ok: false, code: "unauthenticated", message: "Sign in to continue." });
  const params = new URL(req.url).searchParams;
  try {
    if (isList) {
      const limit = Number(params.get("limit") ?? RANKINGS_LIMIT_DEFAULT);
      return send(req, 200, {
        ok: true,
        ...(await getRankings(user, {
          sport: params.get("sport") ?? "Basketball",
          metric: params.get("metric") ?? undefined,
          province: params.get("province") ?? undefined,
          municipality: params.get("municipality") ?? undefined,
          school: params.get("school") ?? undefined,
          category: params.get("category") ?? undefined,
          limit: Number.isInteger(limit) && limit >= 1 ? Math.min(limit, RANKINGS_LIMIT_MAX) : RANKINGS_LIMIT_DEFAULT,
        })),
      });
    }
    if (isHeadline) {
      const ids = (params.get("ids") ?? "").split(",").map((x) => x.trim()).filter(Boolean);
      return send(req, 200, { ok: true, ...(await getHeadline(user, ids)) });
    }
    if (req.method === "GET") return send(req, 200, { ok: true, visible: await getShowcaseVisible(user) });
    const parsed = z.object({ visible: z.boolean() }).safeParse(await readJson(req));
    if (!parsed.success) return send(req, 400, { ok: false, code: "validation", message: "Send { visible: true | false }." });
    return send(req, 200, { ok: true, visible: await setShowcaseVisible(user, parsed.data.visible) });
  } catch (err) {
    if (err instanceof RankingError) return send(req, err.httpStatus, { ok: false, code: err.code, message: err.message });
    throw err;
  }
}

/** Returns null when the path is not a My University route (or not a GET: nothing here can change data). */
async function handleUniversity(req: Request, path: string): Promise<Response | null> {
  if (req.method !== "GET") return null;
  const isInfo = path === "/api/coach/university";
  const isCoaches = path === "/api/coach/university/coaches";
  const isAthletes = path === "/api/coach/university/athletes";
  if (!isInfo && !isCoaches && !isAthletes) return null;
  const user = await getUserBySessionToken(bearer(req));
  if (!user) return send(req, 401, { ok: false, code: "unauthenticated", message: "Sign in to continue." });
  const params = new URL(req.url).searchParams;
  const limit = Number(params.get("limit") ?? UNIVERSITY_PAGE_DEFAULT);
  const offset = Number(params.get("offset") ?? 0);
  const page = {
    limit: Number.isInteger(limit) && limit >= 1 ? Math.min(limit, UNIVERSITY_PAGE_MAX) : UNIVERSITY_PAGE_DEFAULT,
    offset: Number.isInteger(offset) && offset >= 0 ? offset : 0,
    q: params.get("q") ?? undefined,
  };
  try {
    if (isInfo) return send(req, 200, { ok: true, ...(await getMyUniversity(user)) });
    if (isCoaches) return send(req, 200, { ok: true, ...(await listUniversityCoaches(user, page)) });
    return send(req, 200, { ok: true, ...(await listUniversityAthletes(user, page)) });
  } catch (err) {
    if (err instanceof UniversityError) return send(req, err.httpStatus, { ok: false, code: err.code, message: err.message });
    throw err;
  }
}

/** School Representative Dashboard. Read-only. Returns null for any other path. */
async function handleRepDashboard(req: Request, path: string): Promise<Response | null> {
  if (req.method !== "GET" || (path !== "/api/rep/dashboard" && path !== "/api/rep/charts")) return null;
  const user = await getUserBySessionToken(bearer(req));
  if (!user) return send(req, 401, { ok: false, code: "unauthenticated", message: "Sign in to continue." });
  try {
    if (path === "/api/rep/charts") return send(req, 200, { ok: true, charts: await getRepCharts(user) });
    return send(req, 200, { ok: true, ...(await getRepDashboard(user)) });
  } catch (err) {
    if (err instanceof RepDashboardError) return send(req, err.httpStatus, { ok: false, code: err.code, message: err.message });
    throw err;
  }
}

/** School Representative "My Coaches". Returns null for any other path. */
async function handleRepCoaches(req: Request, path: string): Promise<Response | null> {
  const one = /^\/api\/rep\/coaches\/([^/]+)(\/affiliation)?$/.exec(path);
  const isList = req.method === "GET" && path === "/api/rep/coaches";
  const isOne = req.method === "GET" && !!one && !one[2];
  const isAffiliation = req.method === "POST" && !!one && !!one[2];
  if (!isList && !isOne && !isAffiliation) return null;
  const user = await getUserBySessionToken(bearer(req));
  if (!user) return send(req, 401, { ok: false, code: "unauthenticated", message: "Sign in to continue." });
  try {
    if (isList) {
      const params = new URL(req.url).searchParams;
      const limit = Number(params.get("limit") ?? COACHES_PAGE_DEFAULT);
      const offset = Number(params.get("offset") ?? 0);
      const status = params.get("status");
      if (status !== null && status !== "" && !(AFFILIATION_STATUSES as readonly string[]).includes(status))
        return send(req, 400, { ok: false, code: "validation", message: "status must be affiliated, pending or removed." });
      return send(req, 200, {
        ok: true,
        ...(await listRepCoaches(user, {
          q: params.get("q") ?? undefined,
          sport: params.get("sport") ?? undefined,
          status: (status || undefined) as AffiliationStatus | undefined,
          limit: Number.isInteger(limit) && limit >= 1 ? Math.min(limit, COACHES_PAGE_MAX) : COACHES_PAGE_DEFAULT,
          offset: Number.isInteger(offset) && offset >= 0 ? offset : 0,
        })),
      });
    }
    const id = decodeURIComponent((one as RegExpExecArray)[1] ?? "").slice(0, 100);
    if (isOne) return send(req, 200, { ok: true, coach: await getRepCoach(user, id) });
    const parsed = z.object({ action: z.enum(["remove", "restore"]) }).safeParse(await readJson(req));
    if (!parsed.success) return send(req, 400, { ok: false, code: "validation", message: 'Send { action: "remove" | "restore" }.' });
    return send(req, 200, { ok: true, coach: await setCoachAffiliation(user, id, parsed.data.action, requestMeta(req)) });
  } catch (err) {
    if (err instanceof RepDashboardError) return send(req, err.httpStatus, { ok: false, code: err.code, message: err.message });
    throw err;
  }
}

/** School Representative "Coach Requests". Returns null for any other path. */
async function handleRepCoachRequests(req: Request, path: string): Promise<Response | null> {
  const one = /^\/api\/rep\/coach-requests\/([^/]+)(\/decision|\/remind)?$/.exec(path);
  const isList = req.method === "GET" && path === "/api/rep/coach-requests";
  const isOne = req.method === "GET" && !!one && !one[2];
  const isDecision = req.method === "POST" && !!one && one[2] === "/decision";
  const isRemind = req.method === "POST" && !!one && one[2] === "/remind";
  if (!isList && !isOne && !isDecision && !isRemind) return null;
  const user = await getUserBySessionToken(bearer(req));
  if (!user) return send(req, 401, { ok: false, code: "unauthenticated", message: "Sign in to continue." });
  try {
    if (isList) {
      const params = new URL(req.url).searchParams;
      const limit = Number(params.get("limit") ?? REQUESTS_PAGE_DEFAULT);
      const offset = Number(params.get("offset") ?? 0);
      const status = params.get("status");
      if (status !== null && status !== "" && !(REQUEST_STATUSES as readonly string[]).includes(status))
        return send(req, 400, { ok: false, code: "validation", message: "status must be pending, approved or rejected." });
      return send(req, 200, {
        ok: true,
        ...(await listCoachRequests(user, {
          q: params.get("q") ?? undefined,
          status: (status || undefined) as RequestStatus | undefined,
          limit: Number.isInteger(limit) && limit >= 1 ? Math.min(limit, REQUESTS_PAGE_MAX) : REQUESTS_PAGE_DEFAULT,
          offset: Number.isInteger(offset) && offset >= 0 ? offset : 0,
        })),
      });
    }
    const id = decodeURIComponent((one as RegExpExecArray)[1] ?? "").slice(0, 100);
    if (isOne) return send(req, 200, { ok: true, request: await getCoachRequest(user, id) });
    if (isRemind) return send(req, 200, { ok: true, ...(await remindCoach(user, id, requestMeta(req))) });
    const body = await readJson(req);
    const parsed = z.object({ decision: z.enum(["approve", "reject"]), reason: z.unknown().optional() }).safeParse(body);
    if (!parsed.success) return send(req, 400, { ok: false, code: "validation", message: 'Send { decision: "approve" | "reject", reason }.' });
    return send(req, 200, { ok: true, request: await decideCoachRequest(user, id, parsed.data.decision, parsed.data.reason, requestMeta(req)) });
  } catch (err) {
    if (err instanceof RepDashboardError) return send(req, err.httpStatus, { ok: false, code: err.code, message: err.message });
    if (err instanceof ConnectionError) return send(req, err.httpStatus, { ok: false, code: err.code, message: err.message, ...err.extra });
    throw err;
  }
}

/** School Representative "My Athletes". Read-only. Returns null for any other path. */
async function handleRepAthletes(req: Request, path: string): Promise<Response | null> {
  const one = /^\/api\/rep\/athletes\/([^/]+)(\/photo)?$/.exec(path);
  const isList = req.method === "GET" && path === "/api/rep/athletes";
  const isOne = req.method === "GET" && !!one && !one[2];
  const isPhoto = req.method === "GET" && !!one && !!one[2];
  if (!isList && !isOne && !isPhoto) return null;
  const user = await getUserBySessionToken(bearer(req));
  if (!user) return send(req, 401, { ok: false, code: "unauthenticated", message: "Sign in to continue." });
  try {
    if (isList) {
      const params = new URL(req.url).searchParams;
      const limit = Number(params.get("limit") ?? ATHLETES_PAGE_DEFAULT);
      const offset = Number(params.get("offset") ?? 0);
      const status = params.get("status");
      if (status !== null && status !== "" && !(VERIFICATION_STATUSES as readonly string[]).includes(status))
        return send(req, 400, { ok: false, code: "validation", message: "status must be verified or unverified." });
      return send(req, 200, {
        ok: true,
        ...(await listRepAthletes(user, {
          q: params.get("q") ?? undefined,
          sport: params.get("sport") ?? undefined,
          status: (status || undefined) as AthleteVerification | undefined,
          limit: Number.isInteger(limit) && limit >= 1 ? Math.min(limit, ATHLETES_PAGE_MAX) : ATHLETES_PAGE_DEFAULT,
          offset: Number.isInteger(offset) && offset >= 0 ? offset : 0,
        })),
      });
    }
    const id = decodeURIComponent((one as RegExpExecArray)[1] ?? "").slice(0, 100);
    if (isPhoto) {
      const photo = await getRepAthletePhoto(user, id);
      return sendFile(req, { fileName: "profile-photo", mimeType: photo.mimeType, data: photo.data });
    }
    return send(req, 200, { ok: true, athlete: await getRepAthlete(user, id) });
  } catch (err) {
    if (err instanceof RepDashboardError) return send(req, err.httpStatus, { ok: false, code: err.code, message: err.message });
    throw err;
  }
}

/** School Representative top bar summary and Settings. Returns null for any other path. */
async function handleRepSettings(req: Request, path: string): Promise<Response | null> {
  const m = req.method;
  const known =
    (m === "GET" && (path === "/api/rep/header" || path === "/api/rep/settings/profile")) ||
    (m === "PUT" && (path === "/api/rep/settings/profile" || path === "/api/rep/settings/avatar")) ||
    (m === "DELETE" && path === "/api/rep/settings/avatar") ||
    (m === "POST" && path === "/api/rep/settings/password");
  if (!known) return null;
  const token = bearer(req);
  const user = await getUserBySessionToken(token);
  if (!user) return send(req, 401, { ok: false, code: "unauthenticated", message: "Sign in to continue." });
  const meta = requestMeta(req);
  try {
    if (path === "/api/rep/header") return send(req, 200, { ok: true, header: await getRepHeader(user) });
    if (path === "/api/rep/settings/profile")
      return send(req, 200, { ok: true, profile: m === "GET" ? await getRepProfile(user) : await updateRepProfile(user, await readJson(req), meta) });
    if (path === "/api/rep/settings/avatar") {
      if (m === "DELETE") return send(req, 200, { ok: true, profile: await setRepAvatar(user, null, meta) });
      const body = (await readJson(req, REP_AVATAR_MAX_CHARS + 2000)) as Record<string, unknown> | null;
      return send(req, 200, { ok: true, profile: await setRepAvatar(user, body && typeof body === "object" ? body["dataUrl"] : undefined, meta) });
    }
    return send(req, 200, { ok: true, ...(await changeRepPassword(user, await readJson(req), token, meta)) });
  } catch (err) {
    if (err instanceof RepDashboardError) return send(req, err.httpStatus, { ok: false, code: err.code, message: err.message });
    if (err instanceof ConnectionError) return send(req, err.httpStatus, { ok: false, code: err.code, message: err.message, ...err.extra });
    throw err;
  }
}

/** School Representative CSV exports. Returns null for any other path. */
async function handleRepExports(req: Request, path: string): Promise<Response | null> {
  if (req.method === "GET" && path === "/api/rep/report.pdf") {
    const user = await getUserBySessionToken(bearer(req));
    if (!user) return send(req, 401, { ok: false, code: "unauthenticated", message: "Sign in to continue." });
    try {
      const file = await buildRepReport(user, requestMeta(req));
      return sendFile(req, { fileName: file.fileName, mimeType: "application/pdf", data: Buffer.from(file.bytes) });
    } catch (err) {
      if (err instanceof RepDashboardError) return send(req, err.httpStatus, { ok: false, code: err.code, message: err.message });
      throw err;
    }
  }
  const m = /^\/api\/rep\/export\/([a-z-]+)$/.exec(path);
  if (req.method !== "GET" || !m) return null;
  const kind = m[1] as ExportKind;
  if (!(EXPORT_KINDS as readonly string[]).includes(kind)) return null;
  const user = await getUserBySessionToken(bearer(req));
  if (!user) return send(req, 401, { ok: false, code: "unauthenticated", message: "Sign in to continue." });
  const params = new URL(req.url).searchParams;
  try {
    const file = await exportRepData(user, kind, { q: params.get("q") ?? undefined, sport: params.get("sport") ?? undefined, status: params.get("status") ?? undefined }, requestMeta(req));
    return sendFile(req, { fileName: file.fileName, mimeType: "text/csv; charset=utf-8", data: Buffer.from(file.csv, "utf8") });
  } catch (err) {
    if (err instanceof RepDashboardError) return send(req, err.httpStatus, { ok: false, code: err.code, message: err.message });
    throw err;
  }
}

/** School Representative messages. Returns null for any other path. */
async function handleRepMessages(req: Request, path: string): Promise<Response | null> {
  const isPreview = req.method === "POST" && path === "/api/rep/messages/preview";
  const isSend = req.method === "POST" && path === "/api/rep/messages";
  const isList = req.method === "GET" && path === "/api/rep/messages";
  if (!isPreview && !isSend && !isList) return null;
  const user = await getUserBySessionToken(bearer(req));
  if (!user) return send(req, 401, { ok: false, code: "unauthenticated", message: "Sign in to continue." });
  try {
    if (isList) {
      const params = new URL(req.url).searchParams;
      const limit = Number(params.get("limit") ?? HISTORY_PAGE_DEFAULT);
      const offset = Number(params.get("offset") ?? 0);
      return send(req, 200, {
        ok: true,
        ...(await listRepMessages(user, {
          limit: Number.isInteger(limit) && limit >= 1 ? Math.min(limit, HISTORY_PAGE_MAX) : HISTORY_PAGE_DEFAULT,
          offset: Number.isInteger(offset) && offset >= 0 ? offset : 0,
        })),
      });
    }
    const body = await readJson(req);
    const input = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
    if (isPreview) return send(req, 200, { ok: true, preview: await previewRepMessage(user, input) });
    return send(req, 201, { ok: true, message: await sendRepMessage(user, input, requestMeta(req)) });
  } catch (err) {
    if (err instanceof RepDashboardError) return send(req, err.httpStatus, { ok: false, code: err.code, message: err.message });
    if (err instanceof ConnectionError) return send(req, err.httpStatus, { ok: false, code: err.code, message: err.message, ...err.extra });
    throw err;
  }
}

/** Returns null when the path is not a coach-applications route, so the caller can keep matching. */
async function handleCoachApplications(req: Request, path: string): Promise<Response | null> {
  const statusRoute = /^\/api\/coach-applications\/([^/]+)\/status$/.exec(path);
  const isRoot = path === "/api/coach-applications";
  if (!(isRoot && (req.method === "GET" || req.method === "POST")) && !(statusRoute && req.method === "POST")) return null;
  const user = await getUserBySessionToken(bearer(req));
  if (!user) return send(req, 401, { ok: false, code: "unauthenticated", message: "Sign in to continue." });
  try {
    if (isRoot && req.method === "GET") return send(req, 200, { ok: true, ...(await listApplications(user)) });
    if (isRoot) {
      const parsed = z.object({ coachId: z.string() }).safeParse(await readJson(req));
      if (!parsed.success) return send(req, 400, { ok: false, code: "validation", message: "Send { coachId }." });
      return send(req, 201, { ok: true, application: await applyToCoach(user, parsed.data.coachId, requestMeta(req)) });
    }
    const parsed = z.object({ status: z.enum(["reviewed", "dismissed"]) }).safeParse(await readJson(req));
    if (!parsed.success) return send(req, 400, { ok: false, code: "validation", message: 'Send { status: "reviewed" | "dismissed" }.' });
    return send(req, 200, { ok: true, status: await setCoachApplicationStatus(user, (statusRoute as RegExpExecArray)[1] ?? "", parsed.data.status) });
  } catch (err) {
    if (err instanceof CoachApplicationError) return send(req, err.httpStatus, { ok: false, code: err.code, message: err.message });
    throw err;
  }
}

/** Returns null when the path is not a recruiting route, so the caller can keep matching. */
async function handleRecruiting(req: Request, path: string): Promise<Response | null> {
  if (!path.startsWith("/api/recruiting/")) return null;
  const m = req.method;
  const athleteOne = /^\/api\/recruiting\/athletes\/([^/]+)$/.exec(path);
  const noteRoute = /^\/api\/recruiting\/watchlist\/([^/]+)\/note$/.exec(path);
  const respondRoute = /^\/api\/recruiting\/inquiries\/([^/]+)\/respond$/.exec(path);
  const messagesRoute = /^\/api\/recruiting\/inquiries\/([^/]+)\/messages$/.exec(path);
  const known =
    (m === "GET" && (path === "/api/recruiting/athletes" || !!athleteOne || path === "/api/recruiting/watchlist" || path === "/api/recruiting/inquiries" || !!messagesRoute)) ||
    (m === "PUT" && !!noteRoute) ||
    (m === "POST" && (path === "/api/recruiting/inquiries" || !!respondRoute || !!messagesRoute));
  if (!known) return null;

  const user = await getUserBySessionToken(bearer(req));
  if (!user) return send(req, 401, { ok: false, code: "unauthenticated", message: "Sign in to continue." });
  const meta = requestMeta(req);
  const params = new URL(req.url).searchParams;
  const bad = (message: string) => send(req, 400, { ok: false, code: "validation", message });
  try {
    if (m === "GET" && path === "/api/recruiting/athletes") {
      const limit = Number(params.get("limit") ?? DIRECTORY_LIMIT_DEFAULT);
      const offset = Number(params.get("offset") ?? 0);
      const sort = params.get("sort");
      return send(req, 200, {
        ok: true,
        ...(await listAthletes(user, {
          q: params.get("q") ?? undefined,
          sport: params.get("sport") || undefined,
          position: params.get("position") || undefined,
          school: params.get("school") || undefined,
          skill: params.get("skill") || undefined,
          verifiedOnly: params.get("verifiedOnly") === "true",
          sort: sort === "verified" || sort === "name" || sort === "score" ? sort : undefined,
          limit: Number.isInteger(limit) && limit >= 1 ? Math.min(limit, DIRECTORY_LIMIT_MAX) : DIRECTORY_LIMIT_DEFAULT,
          offset: Number.isInteger(offset) && offset >= 0 ? offset : 0,
        })),
      });
    }
    if (athleteOne) return send(req, 200, { ok: true, ...(await getAthlete(user, athleteOne[1] ?? "")) });
    if (m === "GET" && path === "/api/recruiting/watchlist") return send(req, 200, { ok: true, ...(await listWatchlist(user)) });
    if (noteRoute) {
      const parsed = z.object({ note: z.string() }).safeParse(await readJson(req));
      if (!parsed.success) return bad("Send { note: text }.");
      return send(req, 200, { ok: true, ...(await setNote(user, noteRoute[1] ?? "", parsed.data.note)) });
    }
    if (m === "GET" && path === "/api/recruiting/inquiries") return send(req, 200, { ok: true, ...(await listInquiries(user)) });
    if (m === "POST" && path === "/api/recruiting/inquiries") {
      const parsed = z.object({ athleteId: z.string(), organization: z.string(), message: z.string() }).safeParse(await readJson(req));
      if (!parsed.success) return bad("Send { athleteId, organization, message }.");
      return send(req, 201, { ok: true, inquiry: await sendInquiry(user, parsed.data, meta) });
    }
    if (respondRoute) {
      const parsed = z.object({ decision: z.enum(["accepted", "declined"]) }).safeParse(await readJson(req));
      if (!parsed.success) return bad('Send { decision: "accepted" | "declined" }.');
      return send(req, 200, { ok: true, inquiry: await respondToInquiry(user, respondRoute[1] ?? "", parsed.data.decision, meta) });
    }
    if (m === "GET") return send(req, 200, { ok: true, ...(await listMessages(user, (messagesRoute as RegExpExecArray)[1] ?? "")) });
    const parsed = z.object({ body: z.string() }).safeParse(await readJson(req));
    if (!parsed.success) return bad("Send { body: text }.");
    return send(req, 201, { ok: true, message: await sendMessage(user, (messagesRoute as RegExpExecArray)[1] ?? "", parsed.data.body) });
  } catch (err) {
    if (err instanceof RecruitingError) return send(req, err.httpStatus, { ok: false, code: err.code, message: err.message });
    throw err;
  }
}

/** Returns null when the path is not a training-plans route, so the caller can keep matching. */
async function handleTrainingPlans(req: Request, path: string): Promise<Response | null> {
  if (path !== "/api/training-plans" && !path.startsWith("/api/training-plans/")) return null;
  const m = /^\/api\/training-plans(?:\/([^/]+))?$/.exec(path);
  if (!m) return null;
  const id = m[1];
  const isList = req.method === "GET" && !id;
  const isGet = req.method === "GET" && !!id;
  const isCreate = req.method === "POST" && !id;
  const isUpdate = req.method === "PUT" && !!id;
  if (!isList && !isGet && !isCreate && !isUpdate) return null;

  // Authentication comes first: nothing below runs, and no body is read, for an anonymous caller.
  const user = await getUserBySessionToken(bearer(req));
  if (!user) return send(req, 401, { ok: false, code: "unauthenticated", message: "Sign in to continue." });

  const meta = requestMeta(req);
  try {
    if (isList) {
      const status = new URL(req.url).searchParams.get("status");
      if (status !== null && !(PLAN_STATUSES as readonly string[]).includes(status))
        return send(req, 400, { ok: false, code: "validation", message: "status must be DRAFT or PUBLISHED." });
      const paging = pagingFrom(req);
      return send(req, 200, { ok: true, ...(await listPlans(user, { ...paging, ...(status ? { status: status as PlanStatus } : {}) })) });
    }
    if (isGet) return send(req, 200, { ok: true, plan: await getPlan(user, id ?? "") });
    const body = await readJson(req);
    if (isCreate) return send(req, 201, { ok: true, plan: await createPlan(user, body, meta) });
    return send(req, 200, { ok: true, plan: await updatePlan(user, id ?? "", body, meta) });
  } catch (err) {
    if (err instanceof PlanError) return send(req, err.httpStatus, { ok: false, code: err.code, message: err.message, ...err.extra });
    throw err;
  }
}

/** Returns null when the path is not a coach-dashboard route, so the caller can keep matching. */
async function handleCoachAndProfile(req: Request, path: string): Promise<Response | null> {
  const m = req.method;
  const isCoachAthletes = m === "GET" && path === "/api/coach/athletes";
  const isDashboard = m === "GET" && path === "/api/coach/dashboard";
  const shortlist = m === "PUT" || m === "DELETE" ? /^\/api\/coach\/shortlist\/([^/]+)$/.exec(path) : null;
  if (!isCoachAthletes && !isDashboard && !shortlist) return null;

  // Authentication comes first: nothing below runs, and no body is read, for an anonymous caller.
  const user = await getUserBySessionToken(bearer(req));
  if (!user) return send(req, 401, { ok: false, code: "unauthenticated", message: "Sign in to continue." });

  try {
    if (isCoachAthletes) return send(req, 200, { ok: true, ...(await listMyAthletes(user, pagingFrom(req))) });
    if (isDashboard) return send(req, 200, { ok: true, ...(await getCoachDashboard(user)) });
    if (shortlist) return send(req, 200, { ok: true, ...(await setShortlisted(user, shortlist[1] ?? "", m === "PUT")) });
    return null;
  } catch (err) {
    if (err instanceof ConnectionError)
      return send(req, err.httpStatus, { ok: false, code: err.code, message: err.message, ...err.extra });
    throw err;
  }
}

/** Coach profile, verification request, and the reviewer's endpoints. Returns null for any other path. */
async function handleCoachProfileAndReview(req: Request, path: string): Promise<Response | null> {
  const m = req.method;
  const isGet = m === "GET" && path === "/api/coach/profile";
  const isPut = m === "PUT" && path === "/api/coach/profile";
  const isRequest = m === "POST" && path === "/api/coach/verification/request";
  const isList = m === "GET" && path === "/api/admin/coach-verifications";
  const decide = m === "POST" ? /^\/api\/admin\/coach-verifications\/([^/]+)\/(approve|reject)$/.exec(path) : null;
  if (!isGet && !isPut && !isRequest && !isList && !decide) return null;

  const user = await getUserBySessionToken(bearer(req));
  if (!user) return send(req, 401, { ok: false, code: "unauthenticated", message: "Sign in to continue." });
  const meta = requestMeta(req);

  try {
    if (isGet) return send(req, 200, { ok: true, ...(await getCoachProfile(user)) });
    if (isPut) return send(req, 200, { ok: true, ...(await saveCoachProfile(user, await readJson(req), meta)) });
    if (isRequest) return send(req, 200, { ok: true, verification: await requestVerification(user, meta) });
    if (isList) {
      const status = new URL(req.url).searchParams.get("status");
      if (status !== null && !["pending", "verified", "rejected"].includes(status))
        return send(req, 400, { ok: false, code: "validation", message: "status must be pending, verified or rejected." });
      const paging = pagingFrom(req);
      return send(req, 200, { ok: true, ...(await listVerificationRequests(user, { ...paging, ...(status ? { status: status as "pending" | "verified" | "rejected" } : {}) })) });
    }
    const body = (await readJson(req)) as Record<string, unknown> | null;
    const result = await reviewVerification(user, decide?.[1] ?? "", decide?.[2] === "approve" ? "approve" : "reject", body && typeof body === "object" ? body["note"] : undefined, meta);
    return send(req, 200, { ok: true, ...result });
  } catch (err) {
    if (err instanceof ConnectionError)
      return send(req, err.httpStatus, { ok: false, code: err.code, message: err.message, ...err.extra });
    throw err;
  }
}

/** The athlete's own assigned training plans. Returns null for any other path. */
async function handleAssignedPlans(req: Request, path: string): Promise<Response | null> {
  if (req.method !== "GET") return null;
  const m = /^\/api\/athletes\/me\/training-plans(?:\/([^/]+))?$/.exec(path);
  if (!m) return null;
  const user = await getUserBySessionToken(bearer(req));
  if (!user) return send(req, 401, { ok: false, code: "unauthenticated", message: "Sign in to continue." });
  try {
    if (m[1]) return send(req, 200, { ok: true, plan: await getAssignedPlan(user, m[1]) });
    return send(req, 200, { ok: true, ...(await listAssignedPlans(user, pagingFrom(req))) });
  } catch (err) {
    if (err instanceof PlanError) return send(req, err.httpStatus, { ok: false, code: err.code, message: err.message, ...err.extra });
    throw err;
  }
}

/** The athlete's own profile, showcase, records and practice sessions; plus a coach's session review. Returns null for any other path. */
async function handleAthleteSelfService(req: Request, path: string): Promise<Response | null> {
  const m = req.method;
  const extras = /^\/api\/athletes\/me\/extras(?:\/(scholarship|photo|video))?$/.exec(path);
  const sessions = /^\/api\/athletes\/me\/sessions(?:\/([^/]+)\/request-review)?$/.exec(path);
  const verify = m === "POST" ? /^\/api\/coach\/sessions\/([^/]+)\/verify$/.exec(path) : null;
  const routes = {
    getProfile: m === "GET" && path === "/api/athletes/me/profile",
    putProfile: m === "PUT" && path === "/api/athletes/me/profile",
    addRecord: m === "POST" && path === "/api/athletes/me/records",
    getExtras: m === "GET" && !!extras && !extras[1],
    putScholarship: m === "PUT" && extras?.[1] === "scholarship",
    putPhoto: m === "PUT" && extras?.[1] === "photo",
    delPhoto: m === "DELETE" && extras?.[1] === "photo",
    putVideo: m === "PUT" && extras?.[1] === "video",
    delVideo: m === "DELETE" && extras?.[1] === "video",
    listSessions: m === "GET" && !!sessions && !sessions[1],
    addSession: m === "POST" && !!sessions && !sessions[1],
    requestReview: m === "POST" && !!sessions?.[1],
    pendingSessions: m === "GET" && path === "/api/coach/sessions",
    verify: !!verify,
  };
  if (!Object.values(routes).some(Boolean)) return null;

  const user = await getUserBySessionToken(bearer(req));
  if (!user) return send(req, 401, { ok: false, code: "unauthenticated", message: "Sign in to continue." });
  const meta = requestMeta(req);

  try {
    if (routes.getProfile) return send(req, 200, { ok: true, profile: await getMyProfile(user) });
    if (routes.putProfile) return send(req, 200, { ok: true, profile: await saveMyProfile(user, await readJson(req)) });
    if (routes.addRecord) return send(req, 201, { ok: true, ...(await addMyRecord(user, await readJson(req))) });

    if (routes.getExtras) return send(req, 200, { ok: true, extras: await getMyExtras(user) });
    if (routes.putScholarship) return send(req, 200, { ok: true, extras: await saveScholarship(user, await readJson(req)) });
    if (routes.putPhoto) return send(req, 200, { ok: true, extras: await setPhoto(user, await readJson(req, PHOTO_BODY_BYTES)) });
    if (routes.delPhoto) return send(req, 200, { ok: true, extras: await removePhoto(user) });
    if (routes.putVideo) return send(req, 200, { ok: true, extras: await setVideo(user, await readJson(req)) });
    if (routes.delVideo) return send(req, 200, { ok: true, extras: await removeVideo(user) });

    if (routes.listSessions) {
      const limit = Number(new URL(req.url).searchParams.get("limit") ?? "");
      return send(req, 200, { ok: true, ...(await listMySessions(user, Number.isFinite(limit) && limit > 0 ? { limit } : {})) });
    }
    if (routes.addSession) return send(req, 201, { ok: true, session: await createSession(user, await readJson(req)) });
    if (routes.requestReview) return send(req, 200, { ok: true, session: await requestSessionReview(user, sessions?.[1] ?? "") });
    if (routes.pendingSessions) return send(req, 200, { ok: true, ...(await listSessionsForReview(user)) });
    return send(req, 200, { ok: true, session: await verifySession(user, verify?.[1] ?? "", meta) });
  } catch (err) {
    if (err instanceof ConnectionError)
      return send(req, err.httpStatus, { ok: false, code: err.code, message: err.message, ...err.extra });
    throw err;
  }
}

export async function handle(req: Request): Promise<Response> {
  try {
    const path = new URL(req.url).pathname.replace(/\/+$/, "") || "/";
    if (req.method === "OPTIONS") return send(req, 204, null);

    if (req.method === "GET" && path === "/api/health") return send(req, 200, { ok: true });
    // Provision the predefined administrator once per process, before any sign in or sign up runs.
    await ensureAdminAccount();
    if (req.method === "POST" && path === "/api/admin/auth/login") return await handleAdminLogin(req);
    if (req.method === "GET" && path === "/api/admin/overview") return await handleAdminOverview(req);
    const adminUsers = await handleAdminUsers(req, path);
    if (adminUsers) return adminUsers;
    const schoolVerification = await handleSchoolVerification(req, path);
    if (schoolVerification) return schoolVerification;
    const monitoring = await handleMonitoring(req, path);
    if (monitoring) return monitoring;
    const adminSettings = await handleAdminSettings(req, path);
    if (adminSettings) return adminSettings;
    if (req.method === "POST" && path === "/api/reports") return await handleFileReport(req);
    if (req.method === "GET" && path === "/api/universities") {
      if (!allowUniversitySearch(requestMeta(req).ip)) return send(req, 429, { ok: false, code: "rate_limited", message: "Too many searches. Wait a moment and try again." });
      return send(req, 200, { ok: true, items: await searchUniversities(new URL(req.url).searchParams.get("q") ?? "") });
    }
    if (req.method === "POST" && path === "/api/auth/login") return await handleLogin(req);
    if (req.method === "POST" && path === "/api/auth/register") return await handleRegister(req);
    if (req.method === "GET" && path === "/api/auth/me") {
      const user = await getUserBySessionToken(bearer(req));
      return send(req, user ? 200 : 401, { user });
    }
    if (req.method === "POST" && path === "/api/auth/logout") {
      await destroySession(bearer(req), requestMeta(req));
      return send(req, 200, { ok: true });
    }
    const connections = await handleConnections(req, path);
    if (connections) return connections;
    const athletes = await handleAthleteSearch(req, path);
    if (athletes) return athletes;
    const plans = await handleTrainingPlans(req, path);
    if (plans) return plans;
    const coachAndProfile = await handleCoachAndProfile(req, path);
    if (coachAndProfile) return coachAndProfile;
    const coachReview = await handleCoachProfileAndReview(req, path);
    if (coachReview) return coachReview;
    const assigned = await handleAssignedPlans(req, path);
    if (assigned) return assigned;
    const selfService = await handleAthleteSelfService(req, path);
    if (selfService) return selfService;
    const scholarships = await handleScholarships(req, path);
    if (scholarships) return scholarships;
    const notifications = await handleNotifications(req, path);
    if (notifications) return notifications;
    const search = await handleGlobalSearch(req, path);
    if (search) return search;
    const rankings = await handleRankings(req, path);
    if (rankings) return rankings;
    const recruiting = await handleRecruiting(req, path);
    if (recruiting) return recruiting;
    const coachApps = await handleCoachApplications(req, path);
    if (coachApps) return coachApps;
    const university = await handleUniversity(req, path);
    if (university) return university;
    const repDashboard = await handleRepDashboard(req, path);
    if (repDashboard) return repDashboard;
    const repCoaches = await handleRepCoaches(req, path);
    if (repCoaches) return repCoaches;
    const repCoachRequests = await handleRepCoachRequests(req, path);
    if (repCoachRequests) return repCoachRequests;
    const repAthletes = await handleRepAthletes(req, path);
    if (repAthletes) return repAthletes;
    const repSettings = await handleRepSettings(req, path);
    if (repSettings) return repSettings;
    const repExports = await handleRepExports(req, path);
    if (repExports) return repExports;
    const repMessages = await handleRepMessages(req, path);
    if (repMessages) return repMessages;
    return send(req, 404, { error: "not_found" });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg === "too_large") return send(req, 413, { error: "too_large" });
    if (msg === "bad_json") return send(req, 400, { error: "bad_json" });
    console.error("[api] unhandled error:", msg || "unknown error");
    return send(req, 500, { error: "server_error" });
  }
}
