// What the Sign up form is allowed to send, and what each role saves.
// Server copy: it has no browser/app imports so it runs under plain Node. KEEP THE TWO LISTS BELOW
// IN SYNC with `sports` in src/data/mock.ts and POSITION_TITLES in src/lib/coachProfileStore.ts.

import { z } from "zod";
import type { RoleDetails } from "./auth.server.ts";
import { DOC_MAX_COUNT, parseDocuments } from "./rep-documents.server.ts";

const SPORT_NAMES = ["Basketball", "Volleyball", "Track & Field", "Football"] as [string, ...string[]];
const POSITION_TITLES = [
  "Head coach", "Assistant coach", "Athletic director", "Recruiter / Scout", "Trainer / Coordinator",
] as const;

const name = (label: string) =>
  z.string().trim().min(1, `Enter your ${label}.`).max(40, `${label[0]!.toUpperCase()}${label.slice(1)} is too long.`);

const common = {
  firstName: name("first name"),
  lastName: name("last name"),
  email: z.string().trim().min(1, "Enter your email.").max(254, "Email is too long."),
  password: z.string().min(1, "Choose a password.").max(128, "Password is too long."),
  confirmPassword: z.string().min(1, "Confirm your password.").max(128),
};

// The account type is one of exactly three values, so "admin" (or anything else) can never be
// requested from the Sign up form.
export const registerSchema = z
  .discriminatedUnion(
    "accountType",
    [
      z.object({ accountType: z.literal("student_athlete"), ...common }),
      z.object({
        accountType: z.literal("coach"),
        ...common,
        organization: z.string().trim().min(1, "Enter your university or organization.").max(100, "Name is too long."),
        position: z.enum(POSITION_TITLES, { errorMap: () => ({ message: "Choose your coaching position." }) }),
        sport: z.enum(SPORT_NAMES, { errorMap: () => ({ message: "Choose your sport specialization." }) }),
      }),
      z.object({
        accountType: z.literal("university_representative"),
        ...common,
        university: z.string().trim().min(1, "Enter your university name.").max(100, "Name is too long."),
        designation: z.string().trim().min(1, "Enter your position or designation.").max(80, "Designation is too long."),
        // base64 file contents; the real checks (type from the bytes, size, count) are in parseDocuments
        documents: z
          .array(z.object({ kind: z.string().max(40), fileName: z.string().max(200), data: z.string().max(2_900_000) }))
          .max(DOC_MAX_COUNT, `You can upload up to ${DOC_MAX_COUNT} documents.`)
          .default([]),
      }),
    ],
    { errorMap: () => ({ message: "Choose a valid account type." }) },
  )
  .superRefine((v, ctx) => {
    if (v.password && v.confirmPassword && v.password !== v.confirmPassword)
      ctx.addIssue({ code: "custom", path: ["confirmPassword"], message: "Passwords don't match." });
  });

export type RegisterInput = z.input<typeof registerSchema>;
export type RegisterField =
  | "firstName" | "lastName" | "email" | "password" | "confirmPassword"
  | "organization" | "position" | "sport" | "university" | "designation" | "documents";
const REGISTER_FIELDS: RegisterField[] = [
  "firstName", "lastName", "email", "password", "confirmPassword",
  "organization", "position", "sport", "university", "designation", "documents",
];

export type ParsedRegistration =
  | { ok: true; data: z.output<typeof registerSchema>; details: RoleDetails }
  | { ok: false; message: string; fieldErrors: Partial<Record<RegisterField, string>> };

export function parseRegistration(input: unknown): ParsedRegistration {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Partial<Record<RegisterField, string>> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && (REGISTER_FIELDS as string[]).includes(key) && !fieldErrors[key as RegisterField])
        fieldErrors[key as RegisterField] = issue.message;
    }
    const typeIssue = parsed.error.issues.find((i) => i.path[0] === "accountType");
    return {
      ok: false,
      message: typeIssue ? "Choose a valid account type." : "Please fix the highlighted fields.",
      fieldErrors,
    };
  }
  const d = parsed.data;
  if (d.accountType === "university_representative") {
    // A representative applies with documents; the account stays locked until an administrator approves it.
    const docs = parseDocuments(d.documents);
    if (!docs.ok) return { ok: false, message: docs.message, fieldErrors: { documents: docs.message } };
    return {
      ok: true,
      data: d,
      details: { kind: "university_representative", universityName: d.university, designation: d.designation, documents: docs.documents },
    };
  }
  const details: RoleDetails =
    d.accountType === "coach"
      ? { kind: "coach", organization: d.organization, coachingPosition: d.position, sportSpecialization: d.sport }
      : { kind: "student_athlete" };
  return { ok: true, data: d, details };
}
