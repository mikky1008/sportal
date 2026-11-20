// Browser side of the School Representative CSV exports (server/rep-exports.server.ts).
//   GET /api/rep/export/coaches | /athletes | /coach-requests   ?q&sport&status   -> a .csv file of the representative's own school
// The route needs the sign-in token, which a plain download link can't send, so the file is fetched with
// the token and saved from a local object URL. Same storage key the sign-in code uses.

import { Preferences } from "@capacitor/preferences";
import { API_URL } from "@/auth/authClient";

export type ExportKind = "coaches" | "athletes" | "coach-requests";
export interface ExportFilters { q?: string; sport?: string; status?: string }

const TOKEN_KEY = "sportal.session.token";

/** The file name the server chose (Content-Disposition), or a plain fallback. */
function fileNameFrom(res: { headers: { get(name: string): string | null } }, kind: ExportKind): string {
  const m = /filename\*=UTF-8''([^;]+)/i.exec(res.headers.get("content-disposition") ?? "");
  if (m?.[1]) { try { return decodeURIComponent(m[1]); } catch { /* use the fallback */ } }
  return `sportal-${kind}.csv`;
}

export async function downloadRepCsv(kind: ExportKind, f: ExportFilters = {}): Promise<{ ok: true; fileName: string } | { ok: false; message: string }> {
  try {
    const { value } = await Preferences.get({ key: TOKEN_KEY });
    if (!value) return { ok: false, message: "Sign in again to download this." };
    const p = new URLSearchParams();
    if (f.q?.trim()) p.set("q", f.q.trim());
    if (f.sport) p.set("sport", f.sport);
    if (f.status) p.set("status", f.status);
    const qs = p.toString();
    const res = await fetch(`${API_URL}/api/rep/export/${kind}${qs ? `?${qs}` : ""}`, { headers: { Authorization: `Bearer ${value}` } });
    if (!res.ok) {
      let message = "The download didn't work. Try again.";
      try { const j = (await res.json()) as { message?: string }; if (j.message) message = j.message; } catch { /* keep the default */ }
      return { ok: false, message };
    }
    const fileName = fileNameFrom(res, kind);
    const blob = await res.blob();
    const url = URL.createObjectURL(new Blob([blob], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
    return { ok: true, fileName };
  } catch {
    return { ok: false, message: "The download didn't work. Check your connection and try again." };
  }
}
