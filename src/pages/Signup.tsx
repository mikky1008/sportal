import { useLocation } from "react-router-dom";
import { Link } from "@/router-compat";
import { Page } from "@/components/Page";
import { useAuth } from "@/auth/AuthContext";
import { createContext, useContext, useRef, useState, type FormEvent, type ReactNode } from "react";
import type { RegisterDocument } from "@/auth/types";
import { AlertCircle, ArrowLeft, ArrowRight, Building2, CheckCircle2, Eye, EyeOff, FileText, Loader2, Paperclip, Trophy, UserSearch, X } from "lucide-react";
import { toast } from "sonner";
import { btn } from "@/components/common";
import { UniversityCombobox } from "@/components/UniversityCombobox";
import { registerLocalAccount } from "@/lib/accountScope";
import { POST_SIGNUP_PATH } from "@/lib/roles";
import { profileStore } from "@/lib/profileStore";
import { profileExtrasStore } from "@/lib/profileExtrasStore";
import { coachProfileStore, POSITION_TITLES } from "@/lib/coachProfileStore";
import { sports } from "@/lib/sports";
import { cn } from "@/lib/utils";
import court from "@/assets/court.jpg";


const inputBase =
  "h-12 w-full rounded-xl border bg-card px-4 text-sm shadow-sm outline-none transition placeholder:text-muted-foreground/70 hover:border-primary/50 focus:border-primary focus:ring-4 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60";

export type Role = "athlete" | "coach" | "university";
type Field =
  | "firstName" | "lastName" | "email" | "password" | "confirm"
  | "organization" | "position" | "sport" | "designation";
type Errors = Partial<Record<Field, string>>;

export const ROLES: { id: Role; title: string; blurb: string; icon: typeof Trophy }[] = [
  { id: "athlete", title: "Student-Athlete", blurb: "Build your profile and get discovered.", icon: Trophy },
  { id: "coach", title: "Coach / Recruiter", blurb: "Find and follow talented athletes.", icon: UserSearch },
  { id: "university", title: "University Representative", blurb: "Represent your university's athletics.", icon: Building2 },
];

/** Fields shown for each role, in order, after the shared name/email/password fields. */
const EXTRA_FIELDS: Record<Role, Field[]> = {
  athlete: [],
  coach: ["organization", "position", "sport"],
  university: ["organization", "designation"],
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** The existing server rules for the password, checked here first so mistakes show before sending. */
function validate(role: Role, v: Record<Field, string>): Errors {
  const e: Errors = {};
  if (!v.firstName.trim()) e.firstName = "Enter your first name.";
  if (!v.lastName.trim()) e.lastName = "Enter your last name.";
  if (!v.email.trim()) e.email = "Enter your email address.";
  else if (!EMAIL.test(v.email.trim())) e.email = "Enter a valid email address.";
  if (!v.password) e.password = "Enter a password.";
  else if (v.password.length < 10) e.password = "Password must be at least 10 characters.";
  else if (!/[a-zA-Z]/.test(v.password) || !/[0-9]/.test(v.password)) e.password = "Password must contain both letters and numbers.";
  if (!v.confirm) e.confirm = "Confirm your password.";
  else if (v.confirm !== v.password) e.confirm = "Passwords don't match.";
  const extra = EXTRA_FIELDS[role];
  if (extra.includes("organization") && !v.organization.trim())
    e.organization = role === "university" ? "Enter your university name." : "Enter your university or organization.";
  if (extra.includes("position") && !v.position) e.position = "Choose your coaching position.";
  if (extra.includes("sport") && !v.sport) e.sport = "Choose your sport specialization.";
  if (extra.includes("designation") && !v.designation.trim()) e.designation = "Enter your position or designation.";
  return e;
}

/** true inside the dark drawer, so labels, errors and toggles pick the dark colors */
const ToneContext = createContext(false);

function TextField({
  id, label, error, children,
}: { id: string; label: string; error: string | undefined; children: ReactNode }) {
  const dark = useContext(ToneContext);
  return (
    <div>
      <label htmlFor={id} className={cn("mb-1.5 block text-sm font-semibold", dark && "text-slate-200")}>{label}</label>
      {children}
      {error && <p id={`${id}-error`} role="alert" className={cn("mt-1.5 text-xs font-medium", dark ? "text-red-300" : "text-destructive")}>{error}</p>}
    </div>
  );
}

function PasswordToggle({ shown, onToggle }: { shown: boolean; onToggle: () => void }) {
  const dark = useContext(ToneContext);
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={shown ? "Hide password" : "Show password"}
      aria-pressed={shown}
      className={cn("absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg transition focus-visible:outline-none focus-visible:ring-2", dark ? "text-slate-400 hover:bg-slate-700 hover:text-white focus-visible:ring-sky-400" : "text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-primary")}
    >
      {shown ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>
  );
}

/* ---------------------------------------------------------------- school representative documents */

const DOC_KIND_LABEL: Record<RegisterDocument["kind"], string> = {
  staff_id: "Staff / employee ID",
  authorization_letter: "Letter of authorization",
  appointment_letter: "Appointment letter or contract",
  other: "Other proof of affiliation",
};
const DOC_MAX_COUNT = 3;
const DOC_MAX_BYTES = 2 * 1024 * 1024;
const DOC_TOTAL_MAX_BYTES = 3 * 1024 * 1024;
const DOC_TYPES = ["application/pdf", "image/png", "image/jpeg"];

interface PickedDoc { id: number; kind: RegisterDocument["kind"]; name: string; size: number; data: string }

const fmtSize = (n: number) => (n < 1024 * 1024 ? `${Math.max(1, Math.round(n / 1024))} KB` : `${(n / 1024 / 1024).toFixed(1)} MB`);

function readBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(",")[1] ?? "");
    r.onerror = () => reject(new Error("read_failed"));
    r.readAsDataURL(file);
  });
}

function DocumentPicker({ docs, setDocs, error, setError, disabled }: {
  docs: PickedDoc[]; setDocs: (d: PickedDoc[]) => void; error: string | undefined; setError: (m: string | undefined) => void; disabled: boolean;
}) {
  const dark = useContext(ToneContext);
  const input = useRef<HTMLInputElement>(null);
  const nextId = useRef(1);
  const total = docs.reduce((n, d) => n + d.size, 0);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!DOC_TYPES.includes(file.type) && !/\.(pdf|png|jpe?g)$/i.test(file.name)) return setError(`"${file.name}" must be a PDF, PNG or JPG file.`);
    if (file.size > DOC_MAX_BYTES) return setError(`"${file.name}" is larger than 2 MB.`);
    if (total + file.size > DOC_TOTAL_MAX_BYTES) return setError("Your documents are over 3 MB together. Remove one or use a smaller file.");
    try {
      const data = await readBase64(file);
      const kind: RegisterDocument["kind"] = docs.length === 0 ? "staff_id" : docs.length === 1 ? "authorization_letter" : "other";
      setDocs([...docs, { id: nextId.current++, kind, name: file.name, size: file.size, data }]);
      setError(undefined);
    } catch {
      setError(`"${file.name}" couldn't be read. Try again.`);
    }
  }

  const muted = dark ? "text-slate-400" : "text-muted-foreground";
  return (
    <fieldset className="flex flex-col gap-2" aria-describedby={error ? "documents-error" : "documents-help"}>
      <legend className={cn("mb-1.5 block text-sm font-semibold", dark && "text-slate-200")}>Verification documents</legend>
      <p id="documents-help" className={cn("text-xs leading-relaxed", muted)}>
        Upload proof that you represent this school, such as a staff ID or a signed letter of authorization. PDF, PNG or JPG, up to 2 MB each. An administrator reviews them before your account is activated.
      </p>

      {docs.map((d) => (
        <div key={d.id} className={cn("flex items-center gap-3 rounded-xl border p-3", dark ? "border-slate-700 bg-slate-800/60" : "bg-card")}>
          <FileText className={cn("h-5 w-5 shrink-0", dark ? "text-sky-400" : "text-primary")} aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className={cn("truncate text-sm font-medium", dark && "text-white")}>{d.name}</p>
            <div className="mt-1 flex items-center gap-2">
              <select
                aria-label={`What is ${d.name}?`}
                value={d.kind}
                disabled={disabled}
                onChange={(e) => setDocs(docs.map((x) => (x.id === d.id ? { ...x, kind: e.target.value as RegisterDocument["kind"] } : x)))}
                className={cn("h-8 max-w-full rounded-lg border px-2 text-xs outline-none", dark ? "border-slate-600 bg-slate-800 text-slate-200 [&>option]:bg-slate-800" : "bg-card")}
              >
                {(Object.keys(DOC_KIND_LABEL) as RegisterDocument["kind"][]).map((k) => <option key={k} value={k}>{DOC_KIND_LABEL[k]}</option>)}
              </select>
              <span className={cn("shrink-0 text-xs", muted)}>{fmtSize(d.size)}</span>
            </div>
          </div>
          <button type="button" disabled={disabled} onClick={() => setDocs(docs.filter((x) => x.id !== d.id))} aria-label={`Remove ${d.name}`}
            className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-lg transition", dark ? "text-slate-400 hover:bg-slate-700 hover:text-white" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}

      {docs.length < DOC_MAX_COUNT && (
        <>
          <input ref={input} type="file" accept="application/pdf,image/png,image/jpeg,.pdf,.png,.jpg,.jpeg" className="sr-only" tabIndex={-1} onChange={(e) => void onPick(e)} aria-label="Choose a document" />
          <button type="button" disabled={disabled} onClick={() => input.current?.click()}
            className={cn("inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-dashed text-sm font-semibold transition",
              dark ? "border-slate-600 text-slate-200 hover:border-sky-400 hover:text-sky-300" : "border-primary/40 text-primary hover:bg-primary/5")}>
            <Paperclip className="h-4 w-4" /> {docs.length === 0 ? "Add a document" : "Add another document"}
          </button>
        </>
      )}
      {error && <p id="documents-error" role="alert" className={cn("text-xs font-medium", dark ? "text-red-300" : "text-destructive")}>{error}</p>}
    </fieldset>
  );
}

const EMPTY: Record<Field, string> = {
  firstName: "", lastName: "", email: "", password: "", confirm: "",
  organization: "", position: "", sport: "", designation: "",
};

const inputDark =
  "h-12 w-full rounded-xl border border-slate-700 bg-slate-800 px-4 text-sm text-white shadow-sm outline-none transition placeholder:text-slate-500 hover:border-slate-500 focus:border-sky-400 focus:ring-4 focus:ring-sky-400/20 disabled:cursor-not-allowed disabled:opacity-60 [&>option]:bg-slate-800 [&>option]:text-white";

interface SignupFormProps {
  role: Role;
  /** "dark" is the navy look used in the landing page drawer */
  tone?: "light" | "dark";
  onBack: () => void;
  /** when given, "Login" switches views instead of leaving the page */
  onSwitchToLogin?: () => void;
}

/** The account form for one role. Used on the sign up page and inside the landing page drawer. */
export function SignupForm({ role, tone = "light", onBack, onSwitchToLogin }: SignupFormProps) {
  const dark = tone === "dark";
  const secondaryBtn = dark
    ? "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800/60 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 disabled:pointer-events-none disabled:opacity-60"
    : btn.secondary;
  const { signUp, accept } = useAuth();
  const [values, setValues] = useState<Record<Field, string>>(EMPTY);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  // true once the account exists and the browser is on its way to the role's first page
  const [redirecting, setRedirecting] = useState(false);
  // must tick the box to agree to the Terms and Privacy Policy before the account is created
  const [agreed, setAgreed] = useState(false);
  const [agreeError, setAgreeError] = useState(false);
  // school representatives apply with documents; once sent there is no account yet, only an application
  const [docs, setDocs] = useState<PickedDoc[]>([]);
  const [docsError, setDocsError] = useState<string | undefined>();
  const [applied, setApplied] = useState<string | null>(null);

  const set = (k: Field) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setValues((v) => ({ ...v, [k]: e.target.value }));
    if (errors[k]) setErrors((x) => ({ ...x, [k]: undefined }));
  };
  // For fields that choose a value (not just type one), like the university suggestions.
  const setField = (k: Field, v: string) => {
    setValues((x) => ({ ...x, [k]: v }));
    if (errors[k]) setErrors((x) => ({ ...x, [k]: undefined }));
  };
  const bind = (k: Field) => ({
    id: k,
    name: k,
    value: values[k],
    onChange: set(k),
    disabled: loading || redirecting,
    "aria-invalid": !!errors[k],
    "aria-describedby": errors[k] ? `${k}-error` : undefined,
    className: cn(dark ? inputDark : inputBase, errors[k] && (dark ? "border-red-400 focus:border-red-400 focus:ring-red-400/20" : "border-destructive focus:border-destructive focus:ring-destructive/20")),
  });

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (loading || !role) return;
    const errs = validate(role, values);
    setErrors(errs);
    setFormError(null);
    setAgreeError(!agreed);
    const needsDocs = role === "university" && docs.length === 0;
    if (needsDocs) setDocsError("Upload at least one document so we can verify you.");
    if (Object.keys(errs).length || !agreed || needsDocs || (role === "university" && docsError)) return;

    setLoading(true);
    try {
      const res = await signUp(
          role === "coach"
            ? {
                accountType: "coach",
                firstName: values.firstName, lastName: values.lastName, email: values.email,
                password: values.password, confirmPassword: values.confirm,
                organization: values.organization, position: values.position as (typeof POSITION_TITLES)[number], sport: values.sport,
              }
            : role === "university"
              ? {
                  accountType: "university_representative",
                  firstName: values.firstName, lastName: values.lastName, email: values.email,
                  password: values.password, confirmPassword: values.confirm,
                  university: values.organization, designation: values.designation,
                  documents: docs.map((d) => ({ kind: d.kind, fileName: d.name, data: d.data })),
                }
              : {
                  accountType: "student_athlete",
                  firstName: values.firstName, lastName: values.lastName, email: values.email,
                  password: values.password, confirmPassword: values.confirm,
                },
      );
      if (res.ok && res.pendingApproval) {
        // No account to use yet: an administrator has to approve the application first.
        setApplied(res.message);
        setLoading(false);
        return;
      }
      if (res.ok) {
        // This account gets its own, blank browser-side profile (the profile pages read from it).
        registerLocalAccount(res.user.id, {
          type: res.role === "student_athlete" ? "athlete" : "coach",
          firstName: values.firstName.trim(),
          lastName: values.lastName.trim(),
          email: values.email.trim().toLowerCase(),
        });
        profileStore.refresh();
        profileExtrasStore.refresh();
        coachProfileStore.refresh();
        toast.success("Account created", { description: "Taking you to your Sportal home…" });
        setRedirecting(true);
        setTimeout(() => accept(res.user, POST_SIGNUP_PATH[res.role]), 900);
        return;
      }
      // The server names two fields differently from this form.
      const { confirmPassword, university, documents, ...rest } = res.fieldErrors ?? {};
      if (documents) setDocsError(documents);
      setErrors({ ...rest, ...(confirmPassword ? { confirm: confirmPassword } : {}), ...(university ? { organization: university } : {}) } as Errors);
      setFormError(res.code === "validation" ? null : res.message);
      toast.error(res.message);
    } catch {
      const message = "We couldn't reach the server. Check your connection and try again.";
      setFormError(message);
      toast.error(message);
    }
    setLoading(false);
  }

  const current = ROLES.find((r) => r.id === role);
  const extra = EXTRA_FIELDS[role];

  if (applied) {
    return (
      <ToneContext.Provider value={dark}>
        <div className="w-full max-w-md">
          <div className={cn("text-center", dark ? undefined : "surface p-6 sm:p-8")}>
            <span className={cn("mx-auto grid h-14 w-14 place-items-center rounded-full", dark ? "bg-sky-400/10 text-sky-400" : "bg-primary/10 text-primary")}>
              <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
            </span>
            <h1 role="status" className={cn("mt-5", dark ? "font-sans text-2xl font-normal tracking-tight text-white" : "text-2xl font-bold sm:text-3xl")}>Application submitted</h1>
            <p className={cn("mt-2 text-sm leading-relaxed", dark ? "text-slate-300" : "text-muted-foreground")}>{applied}</p>
            <ol className={cn("mx-auto mt-5 max-w-xs space-y-2 text-left text-sm", dark ? "text-slate-300" : "text-muted-foreground")}>
              <li className="flex gap-2"><span className={cn("font-bold", dark ? "text-sky-400" : "text-primary")}>1.</span> An administrator reviews your documents.</li>
              <li className="flex gap-2"><span className={cn("font-bold", dark ? "text-sky-400" : "text-primary")}>2.</span> Once approved, sign in with the email and password you just chose.</li>
              <li className="flex gap-2"><span className={cn("font-bold", dark ? "text-sky-400" : "text-primary")}>3.</span> If something is missing, the reason is shown when you try to sign in.</li>
            </ol>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <button type="button" onClick={onBack} className={cn(secondaryBtn, "flex-1")}>Done</button>
              {onSwitchToLogin ? (
                <button type="button" onClick={onSwitchToLogin} className={cn(secondaryBtn, "flex-1")}>Go to login</button>
              ) : (
                <Link to="/login" search={{ signin: 1 }} direction="none" className={cn(secondaryBtn, "flex-1")}>Go to login</Link>
              )}
            </div>
          </div>
        </div>
      </ToneContext.Provider>
    );
  }

  return (
    <ToneContext.Provider value={dark}>
          <div className="w-full max-w-md">
            <div className={dark ? undefined : "surface p-6 sm:p-8"}>
              <div className="flex items-center gap-3">
                {current && (
                  <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl", dark ? "bg-sky-400/10 text-sky-400" : "bg-primary/10 text-primary")}>
                    <current.icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                )}
                <div>
                  <h1 className={dark ? "font-sans text-2xl font-normal tracking-tight text-white" : "text-2xl font-bold sm:text-3xl"}>{current?.title}</h1>
                  <p className={cn("text-sm", dark ? "text-slate-400" : "text-muted-foreground")}>{role === "university" ? "Apply for your account." : "Create your account."}</p>
                </div>
              </div>

              {formError && (
                <div role="alert" className={cn("mt-5 flex items-start gap-2.5 rounded-xl border p-3 text-sm", dark ? "border-red-400/30 bg-red-500/10 text-red-300" : "border-destructive/30 bg-destructive/10 text-destructive")}>
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={onSubmit} noValidate className="mt-6 flex flex-col gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField id="firstName" label="First name" error={errors.firstName}>
                    <input {...bind("firstName")} type="text" autoComplete="given-name" maxLength={40} autoFocus />
                  </TextField>
                  <TextField id="lastName" label="Last name" error={errors.lastName}>
                    <input {...bind("lastName")} type="text" autoComplete="family-name" maxLength={40} />
                  </TextField>
                </div>

                <TextField id="email" label="Email address" error={errors.email}>
                  <input {...bind("email")} type="email" inputMode="email" autoComplete="email" autoCapitalize="none" spellCheck={false} maxLength={254} placeholder="you@example.com" />
                </TextField>

                {extra.includes("organization") && (
                  <TextField id="organization" label={role === "university" ? "University name" : "University / Organization"} error={errors.organization}>
                    {role === "coach" ? (
                      // Coaches pick their school from the ones already on Sportal as they type, or type their own.
                      <>
                        <UniversityCombobox
                          id="organization" name="organization" value={values.organization} onValue={(v) => setField("organization", v)}
                          className={bind("organization").className} disabled={loading || redirecting} invalid={!!errors.organization}
                          describedBy={errors.organization ? "organization-error" : undefined} dark={dark} maxLength={100} placeholder="Start typing your university"
                        />
                        {!errors.organization && <p className={cn("mt-1.5 text-xs", dark ? "text-slate-400" : "text-muted-foreground")}>Choose your school from the list, or type it if it isn't there.</p>}
                      </>
                    ) : (
                      <input {...bind("organization")} type="text" autoComplete="organization" maxLength={100} />
                    )}
                  </TextField>
                )}
                {extra.includes("position") && (
                  <TextField id="position" label="Coaching position" error={errors.position}>
                    <select {...bind("position")}>
                      <option value="">Select a position</option>
                      {POSITION_TITLES.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </TextField>
                )}
                {extra.includes("sport") && (
                  <TextField id="sport" label="Sport specialization" error={errors.sport}>
                    <select {...bind("sport")}>
                      <option value="">Select a sport</option>
                      {sports.map((sp) => <option key={sp.name} value={sp.name}>{sp.name}</option>)}
                    </select>
                  </TextField>
                )}
                {extra.includes("designation") && (
                  <TextField id="designation" label="Position / Designation" error={errors.designation}>
                    <input {...bind("designation")} type="text" autoComplete="organization-title" maxLength={80} />
                  </TextField>
                )}
                {role === "university" && <DocumentPicker docs={docs} setDocs={setDocs} error={docsError} setError={setDocsError} disabled={loading || redirecting} />}

                <TextField id="password" label="Password" error={errors.password}>
                  <div className="relative">
                    <input {...bind("password")} type={showPassword ? "text" : "password"} autoComplete="new-password" maxLength={128} placeholder="At least 10 characters, letters and numbers" className={cn(bind("password").className, "pr-12")} />
                    <PasswordToggle shown={showPassword} onToggle={() => setShowPassword((v) => !v)} />
                  </div>
                </TextField>

                <TextField id="confirm" label="Confirm password" error={errors.confirm}>
                  <div className="relative">
                    <input {...bind("confirm")} type={showConfirm ? "text" : "password"} autoComplete="new-password" maxLength={128} placeholder="Type it again" className={cn(bind("confirm").className, "pr-12")} />
                    <PasswordToggle shown={showConfirm} onToggle={() => setShowConfirm((v) => !v)} />
                  </div>
                </TextField>

                <div>
                  <label className={cn("flex items-start gap-3 text-sm leading-relaxed", dark ? "text-slate-300" : "text-muted-foreground")}>
                    <input
                      type="checkbox"
                      checked={agreed}
                      onChange={(e) => { setAgreed(e.target.checked); if (e.target.checked) setAgreeError(false); }}
                      disabled={loading || redirecting}
                      aria-invalid={agreeError}
                      aria-describedby={agreeError ? "agree-error" : undefined}
                      className="mt-1 h-4 w-4 shrink-0 cursor-pointer accent-sky-400"
                    />
                    <span>
                      I agree to the{" "}
                      <a href="/terms" target="_blank" rel="noopener noreferrer" className={cn("font-semibold underline-offset-4 hover:underline", dark ? "text-sky-400" : "text-primary")}>Terms and Conditions</a>
                      {" "}and the{" "}
                      <a href="/privacy" target="_blank" rel="noopener noreferrer" className={cn("font-semibold underline-offset-4 hover:underline", dark ? "text-sky-400" : "text-primary")}>Privacy Policy</a>.
                    </span>
                  </label>
                  {agreeError && (
                    <p id="agree-error" role="alert" className={cn("mt-1.5 text-xs font-medium", dark ? "text-red-300" : "text-destructive")}>
                      Please agree to the Terms and Conditions and Privacy Policy to continue.
                    </p>
                  )}
                </div>

                <button type="submit" disabled={loading || redirecting} className={dark ? "mt-1 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-sky-400 text-base font-semibold text-slate-900 outline-none transition hover:bg-sky-300 focus-visible:ring-4 focus-visible:ring-sky-400/40 active:translate-y-px disabled:pointer-events-none disabled:opacity-60" : cn(btn.primary, "mt-1 h-12 w-full bg-primary bg-none text-base text-white shadow-none")}>
                  {redirecting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Account created — redirecting…
                    </>
                  ) : loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> {role === "university" ? "Submitting application…" : "Creating account…"}
                    </>
                  ) : (
                    <>
                      {role === "university" ? "Submit application" : "Create account"} <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <button type="button" onClick={onBack} disabled={loading || redirecting} className={cn(secondaryBtn, "flex-1")}>
                    <ArrowLeft className="h-4 w-4" /> Back
                  </button>
                  {onSwitchToLogin ? (
                    <button type="button" onClick={onSwitchToLogin} disabled={loading || redirecting} className={cn(secondaryBtn, "flex-1")}>Login</button>
                  ) : (
                    <Link to="/login" search={{ signin: 1 }} direction="none" className={cn(secondaryBtn, "flex-1")}>Login</Link>
                  )}
                </div>
              </form>
            </div>
          </div>
    </ToneContext.Provider>
  );
}

function SignupScreen() {
  const location = useLocation();
  // null = still choosing an account type
  const [role, setRole] = useState<Role | null>(() => {
    // the landing page can pass ?role=... when it already asked
    const r = new URLSearchParams(location.search).get("role");
    return r === "athlete" || r === "coach" || r === "university" ? r : null;
  });

  function choose(r: Role) {
    setRole(r);
    window.scrollTo({ top: 0 });
  }

  return (
    <div className="grid min-h-[100dvh] bg-background lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      {/* Brand panel */}
      <aside className="relative overflow-hidden bg-hero text-navy-foreground">
        <img src={court} alt="" className="absolute inset-0 h-full w-full object-cover opacity-25" />
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-electric/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-primary/30 blur-3xl" />
        <div className="relative flex h-full flex-col justify-between gap-10 px-6 py-8 sm:px-10 lg:min-h-screen lg:px-14 lg:py-12">
          <div className="flex items-center gap-2.5">
            <img src="/icon-192.png" alt="" aria-hidden="true" className="h-10 w-10 shrink-0 rounded-[22%]" />
            <span className="font-display text-2xl font-bold tracking-wide">SPORTAL</span>
          </div>
          <div className="hidden lg:block">
            <p className="font-display text-5xl font-bold uppercase leading-tight tracking-wide">
              Build your profile.
              <br />
              <span className="text-electric">Get discovered.</span>
            </p>
            <p className="mt-5 max-w-md text-navy-muted">
              Create your account, then watch your profile fill up one section at a time.
            </p>
          </div>
          <p className="hidden text-xs text-navy-muted lg:block">© {new Date().getFullYear()} Sportal</p>
          <p className="font-display text-lg font-semibold uppercase tracking-wider lg:hidden">
            Build your profile. <span className="text-electric">Get discovered.</span>
          </p>
        </div>
      </aside>

      {/* Form / setup panel */}
      <main className="flex items-start justify-center px-4 py-10 sm:px-8 lg:items-center">
        {!role ? (
          <div className="w-full max-w-md" data-testid="signup-roles">
            <div className="surface p-6 sm:p-8">
              <h1 className="text-3xl font-bold sm:text-4xl">Create your account</h1>
              <p className="mt-1 text-sm text-muted-foreground">Choose how you'll use Sportal.</p>

              <div className="mt-6 flex flex-col gap-3" role="group" aria-label="Account type">
                {ROLES.map(({ id, title, blurb, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => choose(id)}
                    className="group flex items-center gap-4 rounded-xl border bg-card p-4 text-left shadow-sm transition hover:border-primary hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-white">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold">{title}</span>
                      <span className="block text-xs text-muted-foreground">{blurb}</span>
                    </span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" aria-hidden="true" />
                  </button>
                ))}
              </div>

              <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                <Link to="/login" direction="none" className={cn(btn.secondary, "flex-1")}>
                  <ArrowLeft className="h-4 w-4" /> Back
                </Link>
                <Link to="/login" search={{ signin: 1 }} direction="none" className={cn(btn.secondary, "flex-1")}>Login</Link>
              </div>
            </div>
          </div>
        ) : (
          <SignupForm role={role} onBack={() => setRole(null)} />
        )}
      </main>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Page shell={false}>
      <SignupScreen />
    </Page>
  );
}
