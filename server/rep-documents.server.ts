// Documents a school/university representative submits with their application.
//
// Rules (also enforced again by CHECK constraints in the database):
//  - 1 to 3 files, 2 MB each, 3 MB in total. (The total keeps the JSON request under the 4.5 MB
//    body limit of Vercel's serverless functions once it is base64 encoded.)
//  - PDF, PNG or JPEG only. The type is decided from the file's own first bytes, never from the
//    file name or the type the browser claims, so a renamed script or web page is refused.
//
// This file imports nothing from the auth code so sign up can use it without an import cycle.

import { randomUUID } from "node:crypto";
import type { Db } from "./db.server.ts";

export const DOC_KINDS = ["staff_id", "authorization_letter", "appointment_letter", "other"] as const;
export type DocKind = (typeof DOC_KINDS)[number];

export const DOC_MAX_COUNT = 3;
export const DOC_MAX_BYTES = 2 * 1024 * 1024;
export const DOC_TOTAL_MAX_BYTES = 3 * 1024 * 1024;
/** Room for 3 MB of files as base64 plus the rest of the sign-up form. */
export const REGISTER_WITH_DOCS_MAX_BODY = 4.4 * 1024 * 1024;

export type DocMime = "application/pdf" | "image/png" | "image/jpeg";

export interface ParsedDocument {
  kind: DocKind;
  fileName: string;
  mimeType: DocMime;
  data: Buffer;
}

export type DocumentsResult = { ok: true; documents: ParsedDocument[] } | { ok: false; message: string };

/** What a file really is, from its first bytes. */
export function sniffMime(b: Buffer): DocMime | null {
  if (b.length >= 5 && b.subarray(0, 5).toString("latin1") === "%PDF-") return "application/pdf";
  if (b.length >= 8 && b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  return null;
}

/** Keeps the name readable and harmless: no path parts or control characters. */
function cleanFileName(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? "";
  // eslint-disable-next-line no-control-regex
  const cleaned = base.replace(/[\u0000-\u001f\u007f<>:"|?*]/g, "").trim().slice(0, 120);
  return cleaned;
}

const BASE64 = /^[A-Za-z0-9+/]+={0,2}$/;

/** Checks the `documents` array from the sign-up form. `raw` has already been shaped by zod. */
export function parseDocuments(raw: { kind: string; fileName: string; data: string }[]): DocumentsResult {
  if (raw.length < 1) return { ok: false, message: "Upload at least one document." };
  if (raw.length > DOC_MAX_COUNT) return { ok: false, message: `You can upload up to ${DOC_MAX_COUNT} documents.` };

  const out: ParsedDocument[] = [];
  let total = 0;
  for (const item of raw) {
    if (!(DOC_KINDS as readonly string[]).includes(item.kind)) return { ok: false, message: "Choose what each document is." };
    const fileName = cleanFileName(item.fileName);
    if (!fileName) return { ok: false, message: "Each document needs a file name." };
    // Refuse before decoding: base64 is 4/3 the size of the file.
    if (item.data.length > Math.ceil((DOC_MAX_BYTES * 4) / 3) + 8)
      return { ok: false, message: `"${fileName}" is larger than 2 MB.` };
    if (!BASE64.test(item.data) || item.data.length % 4 !== 0) return { ok: false, message: `"${fileName}" couldn't be read. Try uploading it again.` };
    const data = Buffer.from(item.data, "base64");
    if (data.length < 1) return { ok: false, message: `"${fileName}" is empty.` };
    if (data.length > DOC_MAX_BYTES) return { ok: false, message: `"${fileName}" is larger than 2 MB.` };
    const mimeType = sniffMime(data);
    if (!mimeType) return { ok: false, message: `"${fileName}" must be a PDF, PNG or JPEG file.` };
    total += data.length;
    if (total > DOC_TOTAL_MAX_BYTES) return { ok: false, message: "Your documents are too large together. Keep them under 3 MB in total." };
    out.push({ kind: item.kind as DocKind, fileName, mimeType, data });
  }
  return { ok: true, documents: out };
}

/** Creates the pending application and its documents. Call inside the same transaction as the account. */
export async function insertRepApplication(tx: Db, userId: string, documents: ParsedDocument[], at: Date): Promise<void> {
  await tx`INSERT INTO rep_applications (user_id, status, submitted_at) VALUES (${userId}, 'pending', ${at})`;
  for (const d of documents) {
    await tx`
      INSERT INTO rep_application_documents (id, user_id, kind, file_name, mime_type, size_bytes, data, uploaded_at)
      VALUES (${randomUUID()}, ${userId}, ${d.kind}, ${d.fileName}, ${d.mimeType}, ${d.data.length}, ${d.data}, ${at})`;
  }
}
