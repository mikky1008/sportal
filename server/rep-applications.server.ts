// The administrator's School Verification: school / university representative applications.
//
// A representative who signs up creates a `pending` application (server/rep-documents.server.ts).
// Until an administrator approves it the account cannot sign in and has no usable session
// (server/auth.server.ts). Everything here is administrator-only and re-checks that on every call.
//
//   approve  pending or rejected -> approved   the account works from the next sign-in; the school is
//                                              registered on Sportal (the "Registered Schools" count)
//   reject   pending             -> rejected   needs a reason; the applicant reads it when they try to sign in
//
// Documents are only ever returned by getApplicationDocument, which is administrator-only.

import { randomUUID } from "node:crypto";
import { getDb, type Db } from "./db.server.ts";
import { audit, type PublicUser, type RequestMeta } from "./auth.server.ts";
import { ConnectionError, PAGE_DEFAULT, PAGE_MAX } from "./connections.server.ts";
import { notify } from "./notifications.server.ts";
import { requireAdmin } from "./admin.server.ts";

export type ApplicationStatus = "pending" | "approved" | "rejected";
export const APPLICATION_STATUSES: readonly ApplicationStatus[] = ["pending", "approved", "rejected"];

const REASON_MIN = 3;
const REASON_MAX = 500;

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

interface Row {
  user_id: string; display_name: string; email: string; username: string; avatar_url: string | null;
  university_name: string; designation: string; status: ApplicationStatus; submitted_at: Date;
  reviewed_at: Date | null; rejection_reason: string | null; reviewer_name: string | null; document_count: number;
}

const safePhoto = (url: string | null): string | null => (url && /^https?:\/\//i.test(url) && url.length <= 500 ? url : null);

const toSummary = (r: Row): ApplicationSummary => ({
  id: r.user_id,
  name: r.display_name,
  email: r.email,
  school: r.university_name,
  designation: r.designation,
  photo: safePhoto(r.avatar_url),
  status: r.status,
  submittedAt: r.submitted_at.toISOString(),
  documentCount: r.document_count,
});

const SELECT = (db: Db) => db`
  SELECT ra.user_id, u.display_name, u.email, u.username, up.avatar_url, rp.university_name, rp.designation,
         ra.status, ra.submitted_at, ra.reviewed_at, ra.rejection_reason, rv.display_name AS reviewer_name,
         (SELECT COUNT(*)::int FROM rep_application_documents d WHERE d.user_id = ra.user_id) AS document_count
  FROM rep_applications ra
  JOIN users u ON u.id = ra.user_id AND u.deleted_at IS NULL
  JOIN university_representative_profiles rp ON rp.user_id = ra.user_id
  LEFT JOIN user_profiles up ON up.user_id = ra.user_id
  LEFT JOIN users rv ON rv.id = ra.reviewed_by`;

const notFound = () => new ConnectionError(404, "application_not_found", "That application could not be found.");

export async function listApplications(
  actor: Pick<PublicUser, "roles">,
  opts: { status?: ApplicationStatus; limit?: number; offset?: number } = {},
): Promise<{ items: ApplicationSummary[]; total: number; counts: Record<ApplicationStatus, number> }> {
  requireAdmin(actor);
  const db = await getDb();
  const limit = Math.min(Math.max(Math.trunc(opts.limit ?? PAGE_DEFAULT), 1), PAGE_MAX);
  const offset = Math.max(Math.trunc(opts.offset ?? 0), 0);
  const statusF = opts.status ? db`WHERE ra.status = ${opts.status}` : db``;
  // Pending first (oldest waiting longest at the top), everything else newest first.
  const rows = await db<Row[]>`
    ${SELECT(db)} ${statusF}
    ORDER BY (ra.status = 'pending') DESC,
             CASE WHEN ra.status = 'pending' THEN ra.submitted_at END ASC,
             ra.submitted_at DESC, ra.user_id
    LIMIT ${limit} OFFSET ${offset}`;
  const counted = await db<{ status: ApplicationStatus; n: number }[]>`
    SELECT ra.status, COUNT(*)::int AS n FROM rep_applications ra
    JOIN users u ON u.id = ra.user_id AND u.deleted_at IS NULL GROUP BY ra.status`;
  const counts: Record<ApplicationStatus, number> = { pending: 0, approved: 0, rejected: 0 };
  for (const c of counted) counts[c.status] = c.n;
  return { items: rows.map(toSummary), total: opts.status ? counts[opts.status] : counts.pending + counts.approved + counts.rejected, counts };
}

export async function getApplication(actor: Pick<PublicUser, "roles">, id: string): Promise<ApplicationDetail> {
  requireAdmin(actor);
  const db = await getDb();
  const [row] = await db<Row[]>`${SELECT(db)} WHERE ra.user_id = ${id}`;
  if (!row) throw notFound();
  const [account] = await db<{ username: string }[]>`SELECT username FROM users WHERE id = ${id}`;
  const docs = await db<{ id: string; kind: string; file_name: string; mime_type: string; size_bytes: number; uploaded_at: Date }[]>`
    SELECT id, kind, file_name, mime_type, size_bytes, uploaded_at FROM rep_application_documents
    WHERE user_id = ${id} ORDER BY uploaded_at, id`;
  return {
    ...toSummary(row),
    username: account?.username ?? "",
    reviewedAt: row.reviewed_at ? row.reviewed_at.toISOString() : null,
    reviewedBy: row.reviewer_name,
    rejectionReason: row.rejection_reason,
    documents: docs.map((d) => ({
      id: d.id, kind: d.kind, fileName: d.file_name, mimeType: d.mime_type, sizeBytes: d.size_bytes, uploadedAt: d.uploaded_at.toISOString(),
    })),
  };
}

/** The raw file. Administrator-only; the application id in the path must own the document. */
export async function getApplicationDocument(
  actor: Pick<PublicUser, "roles">,
  applicationId: string,
  documentId: string,
): Promise<{ fileName: string; mimeType: string; data: Buffer }> {
  requireAdmin(actor);
  const db = await getDb();
  const [d] = await db<{ file_name: string; mime_type: string; data: Buffer }[]>`
    SELECT file_name, mime_type, data FROM rep_application_documents WHERE id = ${documentId} AND user_id = ${applicationId}`;
  if (!d) throw new ConnectionError(404, "document_not_found", "That document could not be found.");
  return { fileName: d.file_name, mimeType: d.mime_type, data: d.data };
}

export async function reviewApplication(
  actor: Pick<PublicUser, "id" | "roles">,
  id: string,
  decision: "approve" | "reject",
  reasonInput: unknown,
  meta: RequestMeta,
): Promise<ApplicationDetail> {
  requireAdmin(actor);
  const db = await getDb();

  let reason = "";
  if (decision === "reject") {
    reason = typeof reasonInput === "string" ? reasonInput.trim() : "";
    if (reason.length < REASON_MIN || reason.length > REASON_MAX)
      throw new ConnectionError(400, "validation", `Give a reason of ${REASON_MIN} to ${REASON_MAX} characters. The applicant will read it.`, { fieldErrors: { reason: "A rejection reason is required." } });
  }

  const ts = new Date();
  await db.begin(async (tx) => {
    const [row] = await tx<{ status: ApplicationStatus; university_name: string }[]>`
      SELECT ra.status, rp.university_name FROM rep_applications ra
      JOIN university_representative_profiles rp ON rp.user_id = ra.user_id
      WHERE ra.user_id = ${id} FOR UPDATE OF ra`;
    if (!row) throw notFound();
    if (decision === "approve" && row.status === "approved") throw new ConnectionError(409, "already_approved", "This application is already approved.");
    if (decision === "reject" && row.status !== "pending")
      throw new ConnectionError(409, "not_pending", row.status === "approved" ? "Approved accounts are managed from User Management." : "This application was already rejected.");

    if (decision === "approve") {
      await tx`
        UPDATE rep_applications SET status = 'approved', reviewed_at = ${ts}, reviewed_by = ${actor.id}, rejection_reason = NULL
        WHERE user_id = ${id}`;
      // The school becomes a registered school the first time one of its representatives is approved.
      const school = row.university_name.trim();
      if (school.length >= 2 && school.length <= 120) {
        await tx`
          INSERT INTO universities (id, name, name_key, created_at, updated_at)
          VALUES (${randomUUID()}, ${school}, ${school.toLowerCase()}, ${ts}, ${ts})
          ON CONFLICT (name_key) DO NOTHING`;
      }
    } else {
      await tx`
        UPDATE rep_applications SET status = 'rejected', reviewed_at = ${ts}, reviewed_by = ${actor.id}, rejection_reason = ${reason}
        WHERE user_id = ${id}`;
    }
    // Nobody keeps a session from before the decision.
    await tx`DELETE FROM sessions WHERE user_id = ${id}`;
    await audit(
      decision === "approve" ? "admin.rep_approved" : "admin.rep_rejected",
      { userId: id, ...meta, detail: { by: actor.id, ...(reason ? { reason } : {}) } },
      tx as unknown as Db,
    );
  });

  if (decision === "approve") {
    // First thing they see after signing in.
    await notify(id, { category: "verification", title: "Your account is approved", message: "A Sportal administrator approved your school representative account. Welcome aboard.", link: "/rep/dashboard" }, db);
  }
  return getApplication(actor, id);
}
