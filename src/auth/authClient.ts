// Talks to the Sportal API (server/index.ts). The session token is kept in Capacitor Preferences
// (UserDefaults on iOS, SharedPreferences on Android, localStorage in a plain browser) and sent as
// `Authorization: Bearer <token>`.

import { Preferences } from "@capacitor/preferences";
import type { LoginResponse, PublicUser, RegisterInput, RegisterResponse } from "./types";

const TOKEN_KEY = "sportal.session.token";
const EXPIRES_KEY = "sportal.session.expires";

/**
 * Base URL of the API. On the web (Vercel) the API lives on the same origin under /api, so leave
 * VITE_API_URL unset and requests stay relative. For the native Capacitor app, or when the API is
 * hosted elsewhere, set VITE_API_URL (see .env.example). In `npm run dev` it defaults to the local API.
 */
export const API_URL = (
  (import.meta.env["VITE_API_URL"] as string | undefined) ?? (import.meta.env.PROD ? "" : "http://localhost:8787")
).replace(/\/+$/, "");

async function getToken(): Promise<string | null> {
  const { value } = await Preferences.get({ key: TOKEN_KEY });
  if (!value) return null;
  const exp = (await Preferences.get({ key: EXPIRES_KEY })).value;
  if (exp && new Date(exp).getTime() <= Date.now()) {
    await clearSession();
    return null;
  }
  return value;
}

async function saveSession(token: string, expiresAt: string): Promise<void> {
  await Preferences.set({ key: TOKEN_KEY, value: token });
  await Preferences.set({ key: EXPIRES_KEY, value: expiresAt });
}

export async function clearSession(): Promise<void> {
  await Preferences.remove({ key: TOKEN_KEY });
  await Preferences.remove({ key: EXPIRES_KEY });
}

async function call(
  path: string,
  init: { method: "GET" | "POST" | "PUT" | "DELETE"; body?: unknown; token?: string | null; signal?: AbortSignal },
): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15_000);
  // A caller can cancel too (e.g. a search that was replaced by a newer one).
  init.signal?.addEventListener("abort", () => ctrl.abort(), { once: true });
  try {
    return await fetch(`${API_URL}${path}`, {
      method: init.method,
      headers: {
        ...(init.body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(init.token ? { Authorization: `Bearer ${init.token}` } : {}),
      },
      ...(init.body !== undefined ? { body: JSON.stringify(init.body) } : {}),
      signal: ctrl.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

const NETWORK_MESSAGE = "We couldn't reach the server. Check your connection and try again.";

export async function login(data: { identifier: string; password: string; remember: boolean }): Promise<LoginResponse> {
  try {
    const res = await call("/api/auth/login", { method: "POST", body: data });
    const json = (await res.json()) as LoginResponse & { token?: string; expiresAt?: string };
    if (json.ok && json.token && json.expiresAt) await saveSession(json.token, json.expiresAt);
    if (json.ok) delete json.token;
    return json;
  } catch {
    return { ok: false, code: "network", message: NETWORK_MESSAGE };
  }
}

/** The administrator's own sign-in (POST /api/admin/auth/login). The regular login refuses administrator accounts. */
export async function adminLogin(data: { identifier: string; password: string }): Promise<LoginResponse> {
  try {
    const res = await call("/api/admin/auth/login", { method: "POST", body: data });
    const json = (await res.json()) as LoginResponse & { token?: string; expiresAt?: string };
    if (json.ok && json.token && json.expiresAt) await saveSession(json.token, json.expiresAt);
    if (json.ok) delete json.token;
    return json;
  } catch {
    return { ok: false, code: "network", message: NETWORK_MESSAGE };
  }
}

export async function register(data: RegisterInput): Promise<RegisterResponse> {
  try {
    const res = await call("/api/auth/register", { method: "POST", body: data });
    const json = (await res.json()) as RegisterResponse & { token?: string; expiresAt?: string };
    if (json.ok && json.token && json.expiresAt) await saveSession(json.token, json.expiresAt);
    if (json.ok) delete json.token;
    return json;
  } catch {
    return { ok: false, code: "network", message: NETWORK_MESSAGE };
  }
}

/** The signed-in user, or null when there is no valid session. Throws only when the server can't be reached. */
export async function fetchCurrentUser(): Promise<PublicUser | null> {
  const token = await getToken();
  if (!token) return null;
  const res = await call("/api/auth/me", { method: "GET", token });
  if (res.status === 401) {
    await clearSession();
    return null;
  }
  if (!res.ok) throw new Error("me_failed");
  return ((await res.json()) as { user: PublicUser | null }).user;
}

export async function logout(): Promise<void> {
  const token = await getToken();
  try {
    if (token) await call("/api/auth/logout", { method: "POST", token });
  } catch {
    // offline: the token is still removed from this device below
  } finally {
    await clearSession();
  }
}

/** Result of a call made with the saved session: the parsed JSON, or why there isn't any. */
export type ApiResult<T> =
  | { ok: true; status: number; data: T }
  | { ok: false; status: number; code: string; message: string; fieldErrors?: Record<string, string> };

/**
 * An authenticated JSON request for features that sit on top of the signed-in session (the
 * coach-athlete connections, for one). It never throws: a missing/expired session, an unreachable
 * server and an API error all come back as `{ ok: false, code, message }`.
 */
export async function apiRequest<T>(
  path: string,
  init: { method?: "GET" | "POST" | "PUT" | "DELETE"; body?: unknown; signal?: AbortSignal } = {},
): Promise<ApiResult<T>> {
  const token = await getToken();
  if (!token) return { ok: false, status: 401, code: "unauthenticated", message: "Your session has expired. Sign in again." };
  try {
    const res = await call(path, { method: init.method ?? "GET", token, ...(init.body !== undefined ? { body: init.body } : {}), ...(init.signal ? { signal: init.signal } : {}) });
    let json: Record<string, unknown> | null = null;
    try {
      json = (await res.json()) as Record<string, unknown>;
    } catch {
      json = null;
    }
    if (res.status === 401) {
      await clearSession();
      return { ok: false, status: 401, code: "unauthenticated", message: "Your session has expired. Sign in again." };
    }
    if (res.ok && json && json["ok"] !== false) return { ok: true, status: res.status, data: json as T };
    const code = typeof json?.["code"] === "string" ? (json["code"] as string) : typeof json?.["error"] === "string" ? (json["error"] as string) : "server_error";
    const message = typeof json?.["message"] === "string" ? (json["message"] as string) : "Something went wrong. Please try again.";
    const fe = json?.["fieldErrors"];
    const fieldErrors = fe && typeof fe === "object" ? (fe as Record<string, string>) : undefined;
    return { ok: false, status: res.status, code, message, ...(fieldErrors ? { fieldErrors } : {}) };
  } catch (err) {
    if (init.signal?.aborted) return { ok: false, status: 0, code: "aborted", message: "Request cancelled." };
    return { ok: false, status: 0, code: "network", message: NETWORK_MESSAGE };
  }
}
