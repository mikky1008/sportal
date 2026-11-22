// Browser client for the School Representative's Messages page (server/rep-messages.server.ts).
// One-way messages to the coaches and athletes of the representative's OWN school. Routes used:
//   POST /api/rep/messages/preview   { audience, sport?, recipientId? }          how many people it would reach
//   POST /api/rep/messages           { audience, sport?, recipientId?, subject, body }   send (20 an hour, 100 a day)
//   GET  /api/rep/messages           ?limit&offset                                what this representative has sent

import { apiRequest, type ApiResult } from "@/auth/authClient";

export type { ApiResult };

export type Audience = "coaches" | "athletes" | "verified_athletes" | "everyone" | "person";

export interface AudienceChoice { audience: Audience; sport?: string; recipientId?: string }
export interface Preview { count: number; coaches: number; athletes: number; label: string }
export interface SentMessage { id: string; audience: Audience; label: string; subject: string; body: string; recipientCount: number; createdAt: string }

export const SUBJECT_MAX = 100;
export const BODY_MAX = 1000;
export const HISTORY_PAGE = 20;

const clean = (c: AudienceChoice) => ({ audience: c.audience, ...(c.sport ? { sport: c.sport } : {}), ...(c.recipientId ? { recipientId: c.recipientId } : {}) });

export const previewMessage = (c: AudienceChoice, signal?: AbortSignal): Promise<ApiResult<{ preview: Preview }>> =>
  apiRequest<{ preview: Preview }>("/api/rep/messages/preview", { method: "POST", body: clean(c), ...(signal ? { signal } : {}) });

export const sendMessage = (c: AudienceChoice, m: { subject: string; body: string }): Promise<ApiResult<{ message: SentMessage & { coaches: number; athletes: number } }>> =>
  apiRequest<{ message: SentMessage & { coaches: number; athletes: number } }>("/api/rep/messages", { method: "POST", body: { ...clean(c), ...m } });

export const fetchSentMessages = (offset = 0): Promise<ApiResult<{ items: SentMessage[]; total: number }>> =>
  apiRequest<{ items: SentMessage[]; total: number }>(`/api/rep/messages?limit=${HISTORY_PAGE}&offset=${offset}`);
