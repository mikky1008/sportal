import { Link } from "@/router-compat";
import { Page } from "@/components/Page";
import { useAuth } from "@/auth/AuthContext";
import { useState, type FormEvent, type ReactNode } from "react";
import { AlertCircle, ArrowLeft, ArrowRight, Building2, Eye, EyeOff, Loader2, Trophy, UserSearch } from "lucide-react";
import { toast } from "sonner";
import { btn } from "@/components/common";
import { registerLocalAccount } from "@/lib/accountScope";
import { POST_SIGNUP_PATH } from "@/lib/roles";
import { profileStore } from "@/lib/profileStore";
import { profileExtrasStore } from "@/lib/profileExtrasStore";
import { coachProfileStore, POSITION_TITLES } from "@/lib/coachProfileStore";
import { sports } from "@/lib/sports";
import { cn } from "@/lib/utils";
import court from "@/assets/court.jpg";


const inputBase =
  "h-12 w-full rounded-xl border bg-card px-4 text-sm shadow-sm outline-none transition placeholder:text-muted-foreground/70 hover:border-success/50 focus:border-success focus:ring-4 focus:ring-success/20 disabled:cursor-not-allowed disabled:opacity-60";

type Role = "athlete" | "coach" | "university";
type Field =
  | "firstName" | "lastName" | "email" | "password" | "confirm"
  | "organization" | "position" | "sport" | "designation";
type Errors = Partial<Record<Field, string>>;

const ROLES: { id: Role; title: string; blurb: string; icon: typeof Trophy }[] = [
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

function TextField({
  id, label, error, children,
}: { id: string; label: string; error: string | undefined; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold">{label}</label>
      {children}
      {error && <p id={`${id}-error`} role="alert" className="mt-1.5 text-xs font-medium text-destructive">{error}</p>}
    </div>
  );
}

function PasswordToggle({ shown, onToggle }: { shown: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={shown ? "Hide password" : "Show password"}
      aria-pressed={shown}
      className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-success"
    >
      {shown ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>
  );
}

const EMPTY: Record<Field, string> = {
  firstName: "", lastName: "", email: "", password: "", confirm: "",
  organization: "", position: "", sport: "", designation: "",
};

function SignupScreen() {
  const { signUp, accept } = useAuth();
  // null = still choosing an account type
  const [role, setRole] = useState<Role | null>(null);
  const [values, setValues] = useState<Record<Field, string>>(EMPTY);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  // true once the account exists and the browser is on its way to the role's first page
  const [redirecting, setRedirecting] = useState(false);

  const set = (k: Field) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setValues((v) => ({ ...v, [k]: e.target.value }));
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
    className: cn(inputBase, errors[k] && "border-destructive focus:border-destructive focus:ring-destructive/20"),
  });

  function choose(r: Role) {
    setRole(r);
    setErrors({});
    setFormError(null);
    window.scrollTo({ top: 0 });
  }
  function back() {
    setRole(null);
    setErrors({});
    setFormError(null);
    setValues(EMPTY);
    setShowPassword(false);
    setShowConfirm(false);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (loading || !role) return;
    const errs = validate(role, values);
    setErrors(errs);
    setFormError(null);
    if (Object.keys(errs).length) return;

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
                }
              : {
                  accountType: "student_athlete",
                  firstName: values.firstName, lastName: values.lastName, email: values.email,
                  password: values.password, confirmPassword: values.confirm,
                },
      );
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
      const { confirmPassword, university, ...rest } = res.fieldErrors ?? {};
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
  const extra = role ? EXTRA_FIELDS[role] : [];

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
                    className="group flex items-center gap-4 rounded-xl border bg-card p-4 text-left shadow-sm transition hover:border-success hover:bg-success/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-success"
                  >
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-success/10 text-success transition group-hover:bg-success group-hover:text-white">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold">{title}</span>
                      <span className="block text-xs text-muted-foreground">{blurb}</span>
                    </span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-success" aria-hidden="true" />
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
          <div className="w-full max-w-md">
            <div className="surface p-6 sm:p-8">
              <div className="flex items-center gap-3">
                {current && (
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-success/10 text-success">
                    <current.icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                )}
                <div>
                  <h1 className="text-2xl font-bold sm:text-3xl">{current?.title}</h1>
                  <p className="text-sm text-muted-foreground">Create your account.</p>
                </div>
              </div>

              {formError && (
                <div role="alert" className="mt-5 flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
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
                    <input {...bind("organization")} type="text" autoComplete="organization" maxLength={100} />
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

                <button type="submit" disabled={loading || redirecting} className={cn(btn.primary, "mt-1 h-12 w-full bg-success bg-none text-base text-white shadow-none")}>
                  {redirecting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Account created — redirecting…
                    </>
                  ) : loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Creating account…
                    </>
                  ) : (
                    <>
                      Create account <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <button type="button" onClick={back} disabled={loading || redirecting} className={cn(btn.secondary, "flex-1")}>
                    <ArrowLeft className="h-4 w-4" /> Back
                  </button>
                  <Link to="/login" search={{ signin: 1 }} direction="none" className={cn(btn.secondary, "flex-1")}>Login</Link>
                </div>
              </form>
            </div>
          </div>
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
