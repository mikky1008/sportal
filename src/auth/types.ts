// Shapes shared between the app and the API (see server/index.ts). Plain types only.

export interface PublicUser {
  id: string;
  email: string;
  username: string;
  displayName: string;
  /** from the Sign up form; absent for accounts created without names (e.g. by the admin script) */
  firstName?: string;
  lastName?: string;
  roles: string[];
  permissions: string[];
}

export type RegisterField =
  | "firstName" | "lastName" | "email" | "password" | "confirmPassword"
  | "organization" | "position" | "sport" | "university" | "designation" | "documents";

interface RegisterCommon {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export type RegisterInput =
  | ({ accountType: "student_athlete" } & RegisterCommon)
  | ({ accountType: "coach"; organization: string; position: string; sport: string } & RegisterCommon)
  | ({ accountType: "university_representative"; university: string; designation: string; documents: RegisterDocument[] } & RegisterCommon);

/** A file a school representative attaches to their application (base64 contents). */
export interface RegisterDocument {
  kind: "staff_id" | "authorization_letter" | "appointment_letter" | "other";
  fileName: string;
  data: string;
}

export type LoginResponse =
  | { ok: true; user: PublicUser }
  | {
      ok: false;
      code: "validation" | "invalid_credentials" | "inactive" | "pending_approval" | "application_rejected" | "rate_limited" | "server_error" | "network";
      message: string;
      fieldErrors?: { identifier?: string; password?: string };
      retryAfterSec?: number;
    };

export type RegisterResponse =
  | { ok: true; pendingApproval?: false; user: PublicUser; role: "student_athlete" | "coach" | "university_representative" }
  // A school representative has applied. There is no account to use until an administrator approves it.
  | { ok: true; pendingApproval: true; role: "university_representative"; message: string }
  | {
      ok: false;
      code: "validation" | "taken" | "rate_limited" | "server_error" | "network";
      message: string;
      fieldErrors?: Partial<Record<RegisterField, string>>;
    };
