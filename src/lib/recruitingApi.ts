// Browser client for the recruiting API (server/recruiting.server.ts). Every function resolves to an
// ApiResult and never throws. The server enforces every rule (verified coaches only, hidden
// showcases, accept-before-messaging, who can read a thread); this file only talks to it and
// reshapes the answers into the types the Recruiting screens already use.
//
// Routes used:
//   GET  /api/recruiting/athletes            ?q&sport&position&school&skill&verifiedOnly&sort
//   GET  /api/recruiting/athletes/:id
//   GET  /api/recruiting/watchlist           PUT /api/recruiting/watchlist/:id/note
//   PUT / DELETE /api/coach/shortlist/:id    (save / unsave on the watchlist)
//   GET / POST /api/recruiting/inquiries     POST /api/recruiting/inquiries/:id/respond
//   GET / POST /api/recruiting/inquiries/:id/messages

import { apiRequest, type ApiResult } from "@/auth/authClient";
import type { DirectoryAthlete, Inquiry, InquiryStatus, ThreadMessage } from "@/types";

export type { ApiResult };

export const NOTE_MAX = 500;
export const MESSAGE_MAX = 2000;

/** An inquiry as the screens use it, plus what the server adds (athlete name, unread count). */
export interface InquiryItem extends Inquiry {
  athleteName: string;
  recruiterId: string;
  /** messages in this conversation the signed-in user has not read yet */
  unread: number;
  updatedAt: string;
}

export interface DirectoryFilters {
  q: string;
  /** "All sports", "All positions", ... mean no filter */
  sport: string;
  position: string;
  school: string;
  skill: string;
  verifiedOnly: boolean;
  sort: "score" | "verified" | "name";
}

export interface DirectoryPage {
  items: DirectoryAthlete[];
  total: number;
  /** ids the coach has saved */
  watchlist: string[];
  options: { sports: string[]; positions: string[]; schools: string[]; skills: string[] };
}

export interface AthleteDetail {
  athlete: DirectoryAthlete;
  /** the signed-in athlete is looking at their own showcase */
  own: boolean;
  /** a university is looking at the showcase of someone who applied to its scholarship */
  applicant: boolean;
  watched: boolean;
  note: string;
  inquiry: { id: string; status: InquiryStatus } | null;
}

const dayLabel = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "2-digit" });
const timeLabel = (iso: string) => new Date(iso).toLocaleString("en-US", { month: "short", day: "2-digit", hour: "numeric", minute: "2-digit" });

const mapResult = <A, B>(r: ApiResult<A>, f: (a: A) => B): ApiResult<B> => (r.ok ? { ...r, data: f(r.data) } : r);

interface RawInquiry {
  id: string;
  athleteId: string;
  athleteName: string;
  recruiterId: string;
  recruiterName: string;
  organization: string;
  message: string;
  status: InquiryStatus;
  createdAt: string;
  updatedAt: string;
  unread: number;
}
const toInquiry = (r: RawInquiry): InquiryItem => ({ ...r, createdAt: dayLabel(r.createdAt) });

interface RawMessage {
  id: string;
  inquiryId: string;
  from: "recruiter" | "athlete";
  body: string;
  createdAt: string;
}
const toMessage = (m: RawMessage): ThreadMessage => ({ id: m.id, inquiryId: m.inquiryId, from: m.from, body: m.body, time: timeLabel(m.createdAt) });

const omitAll = (v: string) => (v === "" || v.startsWith("All ") ? undefined : v);

export const fetchDirectory = (f: DirectoryFilters, signal?: AbortSignal): Promise<ApiResult<DirectoryPage>> => {
  const p = new URLSearchParams({ sort: f.sort, limit: "100" });
  if (f.q.trim()) p.set("q", f.q.trim());
  for (const [k, v] of [["sport", f.sport], ["position", f.position], ["school", f.school], ["skill", f.skill]] as const) {
    const x = omitAll(v);
    if (x) p.set(k, x);
  }
  if (f.verifiedOnly) p.set("verifiedOnly", "true");
  return apiRequest<DirectoryPage>(`/api/recruiting/athletes?${p}`, signal ? { signal } : {});
};

export const fetchAthlete = (id: string, signal?: AbortSignal): Promise<ApiResult<AthleteDetail>> =>
  apiRequest<AthleteDetail>(`/api/recruiting/athletes/${encodeURIComponent(id)}`, signal ? { signal } : {});

export const fetchWatchlist = async (): Promise<ApiResult<(DirectoryAthlete & { note: string })[]>> =>
  mapResult(await apiRequest<{ items: (DirectoryAthlete & { note: string })[] }>("/api/recruiting/watchlist"), (d) => d.items);

export const setWatched = (athleteId: string, on: boolean) =>
  apiRequest<{ shortlisted: boolean }>(`/api/coach/shortlist/${encodeURIComponent(athleteId)}`, { method: on ? "PUT" : "DELETE" });

export const saveNote = (athleteId: string, note: string) =>
  apiRequest<{ note: string }>(`/api/recruiting/watchlist/${encodeURIComponent(athleteId)}/note`, { method: "PUT", body: { note } });

export const fetchInquiries = async (): Promise<ApiResult<InquiryItem[]>> =>
  mapResult(await apiRequest<{ items: RawInquiry[] }>("/api/recruiting/inquiries"), (d) => d.items.map(toInquiry));

export const postInquiry = async (i: { athleteId: string; organization: string; message: string }): Promise<ApiResult<InquiryItem>> =>
  mapResult(await apiRequest<{ inquiry: RawInquiry }>("/api/recruiting/inquiries", { method: "POST", body: i }), (d) => toInquiry(d.inquiry));

export const answerInquiry = async (id: string, decision: "Accepted" | "Declined"): Promise<ApiResult<InquiryItem>> =>
  mapResult(
    await apiRequest<{ inquiry: RawInquiry }>(`/api/recruiting/inquiries/${encodeURIComponent(id)}/respond`, {
      method: "POST",
      body: { decision: decision === "Accepted" ? "accepted" : "declined" },
    }),
    (d) => toInquiry(d.inquiry),
  );

export const fetchMessages = async (inquiryId: string): Promise<ApiResult<ThreadMessage[]>> =>
  mapResult(await apiRequest<{ items: RawMessage[] }>(`/api/recruiting/inquiries/${encodeURIComponent(inquiryId)}/messages`), (d) => d.items.map(toMessage));

export const postMessage = async (inquiryId: string, body: string): Promise<ApiResult<ThreadMessage>> =>
  mapResult(
    await apiRequest<{ message: RawMessage }>(`/api/recruiting/inquiries/${encodeURIComponent(inquiryId)}/messages`, { method: "POST", body: { body } }),
    (d) => toMessage(d.message),
  );
