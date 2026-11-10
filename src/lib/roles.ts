// The account roles Sportal recognizes, in one place shared by the server and the browser.
// These names are exactly what is stored in the `roles` table.
//
// `admin` is deliberately NOT here: it can never be chosen or assigned through Sign up.

export const ACCOUNT_ROLES = ["student_athlete", "coach", "university_representative"] as const;
export type AccountRole = (typeof ACCOUNT_ROLES)[number];

export const ROLE_LABELS: Record<AccountRole, string> = {
  student_athlete: "Student-Athlete",
  coach: "Coach / Recruiter",
  university_representative: "University Representative",
};

export function isAccountRole(v: unknown): v is AccountRole {
  return typeof v === "string" && (ACCOUNT_ROLES as readonly string[]).includes(v);
}

/** The first Sportal role in a user's role list (an account made on Sign up has exactly one). */
export function primaryRole(roles: readonly string[]): AccountRole | null {
  return ACCOUNT_ROLES.find((r) => roles.includes(r)) ?? null;
}

/** Where a brand-new account of each role lands right after registering. */
export const POST_SIGNUP_PATH: Record<AccountRole, string> = {
  student_athlete: "/complete-profile",
  coach: "/coach/dashboard",
  university_representative: "/scholarships",
};

/** Where a signed-in user lands by default (no saved redirect): coaches get their own dashboard, university representatives their scholarships. */
export function homePathFor(roles: readonly string[]): string {
  if (roles.includes("admin")) return "/admin/verifications";
  const role = primaryRole(roles);
  return role === "coach" ? "/coach/dashboard" : role === "university_representative" ? "/scholarships" : "/dashboard";
}
