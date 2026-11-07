// Sportal API request handler, written against the web-standard Request / Response so the same
// code runs as a Vercel Function (api/index.ts) and as a plain Node server (server/index.ts).
//
//   POST /api/auth/login      { identifier, password, remember }  -> { ok, user, token, expiresAt }
//   POST /api/auth/register   { accountType, ... }                -> { ok, user, role, token, expiresAt }
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
// A reviewer is an account with the `coaches:review` permission (the `admin` role). Approving grants the
// `verified_coach` role, which carries `sessions:verify`; rejecting removes it.
//
// Training plans assigned to me (student-athlete accounts only; PUBLISHED plans from coaches I'm connected to):
//   GET /api/athletes/me/training-plans            ?limit&offset -> { ok, items, total }
//   GET /api/athletes/me/training-plans/:id        -> { ok, plan }
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
        return send(req, 200, { ok: false, code: "inactive", message: "This account has been deactivated. Contact your administrator." });
      return send(req, 200, { ok: false, code: "invalid_credentials", message: "Incorrect username/email or password." });
    }
    return send(req, 200, { ok: true, user: result.user, token: result.token, expiresAt: result.expiresAt.toISOString() });
  } catch (err) {
    console.error("[api] login failed unexpectedly:", err instanceof Error ? err.message : "unknown error");
    return send(req, 200, { ok: false, code: "server_error", message: "Something went wrong. Please try again." });
  }
}

async function handleRegister(req: Request): Promise<Response> {
  const parsed = parseRegistration(await readJson(req));
  if (!parsed.ok) return send(req, 200, { ok: false, code: "validation", message: parsed.message, fieldErrors: parsed.fieldErrors });
  const input = parsed.data;
  const meta = requestMeta(req);

  let username = "";
  try {
    if (!(await signupAllowed(meta.ip)))
      return send(req, 200, { ok: false, code: "rate_limited", message: "Too many sign ups from this connection. Try again in an hour." });
    username = await deriveUsername(input.email);
    await createUser({
      email: input.email,
      username,
      password: input.password,
      displayName: `${input.firstName} ${input.lastName}`,
      firstName: input.firstName,
      lastName: input.lastName,
      roles: [input.accountType],
      details: parsed.details,
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
    return send(req, 404, { error: "not_found" });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg === "too_large") return send(req, 413, { error: "too_large" });
    if (msg === "bad_json") return send(req, 400, { error: "bad_json" });
    console.error("[api] unhandled error:", msg || "unknown error");
    return send(req, 500, { error: "server_error" });
  }
}
