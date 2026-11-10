import { useLocation } from "react-router-dom";
import { Link } from "@/router-compat";
import { Page } from "@/components/Page";
import { useAuth } from "@/auth/AuthContext";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { AlertCircle, ChevronDown, Eye, EyeOff, Loader2, Lock, Menu, User } from "lucide-react";
import { toast } from "sonner";
import { safeRedirectPath } from "@/lib/auth-redirect";
import { homePathFor } from "@/lib/roles";
import { btn } from "@/components/common";
import { cn } from "@/lib/utils";


const inputBase =
  "h-12 w-full rounded-xl border bg-card pl-11 text-sm shadow-sm outline-none transition placeholder:text-muted-foreground/70 hover:border-primary/40 focus:border-primary focus:ring-4 focus:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-60";

const menuLinks = ["About Sportal", "University Profiles", "AI Features", "Contact Support", "Terms & Privacy"];

function TopNav() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const soon = (label: string) => {
    setOpen(false);
    toast.info(`${label} isn't available yet.`);
  };

  return (
    <header className="sticky top-0 z-30 border-b bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-8">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-electric-gradient font-display text-lg font-bold text-primary-foreground shadow-glow">S</span>
          <span className="font-display text-xl font-bold tracking-wide text-foreground">SPORTAL</span>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <button type="button" onClick={() => soon("Help")} className="rounded-full px-3 py-2 text-sm font-medium text-foreground transition hover:bg-muted">
            Help
          </button>
          <div ref={ref} className="relative">
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={open}
              className="flex items-center gap-1.5 rounded-full border bg-card px-3 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
            >
              <Menu className="h-4 w-4" />
              <span className="hidden sm:inline">Menu</span>
              <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
            </button>
            {open && (
              <div role="menu" className="absolute right-0 top-full mt-2 w-60 rounded-2xl border bg-white p-2 shadow-lg">
                {menuLinks.map((label) => (
                  <button
                    key={label}
                    type="button"
                    role="menuitem"
                    onClick={() => soon(label)}
                    className="block w-full rounded-xl px-3 py-2.5 text-left text-sm text-foreground transition hover:bg-muted"
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

/** The sign-in card on its own, so it can sit on the login page or inside the landing page popup. */
export function LoginForm() {
  const location = useLocation();
  const redirect = new URLSearchParams(location.search).get("redirect") ?? undefined;
  const { signIn, accept } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ identifier?: string; password?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (loading) return;

    const errs: { identifier?: string; password?: string } = {};
    if (!identifier.trim()) errs.identifier = "Enter your username or email.";
    if (!password) errs.password = "Enter your password.";
    setFieldErrors(errs);
    setFormError(null);
    if (errs.identifier || errs.password) return;

    setLoading(true);
    try {
      const res = await signIn({ identifier, password, remember });
      if (res.ok) {
        toast.success(`Welcome back, ${res.user.displayName}!`);
        accept(res.user, safeRedirectPath(redirect, homePathFor(res.user.roles)));
        return;
      }
      setFieldErrors(res.fieldErrors ?? {});
      setFormError(res.code === "validation" ? null : res.message);
      toast.error(res.message);
      if (res.code === "invalid_credentials") setPassword("");
    } catch {
      const message = "We couldn't reach the server. Check your connection and try again.";
      setFormError(message);
      toast.error(message);
    }
    setLoading(false);
  }

  return (
        <div className="w-full max-w-md">
          <div className="surface p-6 sm:p-8">
            <h1 className="m-0! font-sans text-3xl! font-normal! tracking-tight">Welcome back</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Sign in to continue to your dashboard.</p>

            {formError && (
              <div role="alert" className="mt-5 flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={onSubmit} noValidate className="mt-6 flex flex-col gap-5">
              <div>
                <label htmlFor="identifier" className="mb-1.5 block text-sm font-semibold">Username or email</label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="identifier"
                    name="identifier"
                    type="text"
                    inputMode="email"
                    autoComplete="username"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    required
                    maxLength={254}
                    value={identifier}
                    disabled={loading}
                    onChange={(e) => setIdentifier(e.target.value)}
                    aria-invalid={!!fieldErrors.identifier}
                    aria-describedby={fieldErrors.identifier ? "identifier-error" : undefined}
                    placeholder="you@university.edu"
                    className={cn(inputBase, "pr-4", fieldErrors.identifier && "border-destructive focus:border-destructive focus:ring-destructive/20")}
                  />
                </div>
                {fieldErrors.identifier && <p id="identifier-error" className="mt-1.5 text-xs font-medium text-destructive">{fieldErrors.identifier}</p>}
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label htmlFor="password" className="block text-sm font-semibold">Password</label>
                  <button
                    type="button"
                    onClick={() => toast.info("Password reset isn't available yet. Please contact your administrator.")}
                    className="rounded text-xs font-semibold text-primary transition hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    maxLength={128}
                    value={password}
                    disabled={loading}
                    onChange={(e) => setPassword(e.target.value)}
                    aria-invalid={!!fieldErrors.password}
                    aria-describedby={fieldErrors.password ? "password-error" : undefined}
                    placeholder="Enter your password"
                    className={cn(inputBase, "pr-12", fieldErrors.password && "border-destructive focus:border-destructive focus:ring-destructive/20")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    aria-pressed={showPassword}
                    className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {fieldErrors.password && <p id="password-error" className="mt-1.5 text-xs font-medium text-destructive">{fieldErrors.password}</p>}
              </div>

              <label className="flex cursor-pointer select-none items-center gap-2.5 text-sm">
                <input
                  type="checkbox"
                  checked={remember}
                  disabled={loading}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-4 w-4 cursor-pointer rounded border-input accent-[var(--primary)]"
                />
                <span>Remember me for 30 days</span>
              </label>

              <button type="submit" disabled={loading} className={cn(btn.primary, "h-12 w-full rounded-full text-base")}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Signing in…
                  </>
                ) : (
                  "Sign in"
                )}
              </button>
            </form>
          </div>
          <p className="mt-5 text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/signup" direction="none" className="font-semibold text-primary hover:underline">Create one</Link>
          </p>
        </div>
  );
}

function LoginScreen() {
  return (
    <div className="min-h-[100dvh]" style={{ background: "linear-gradient(180deg, oklch(0.985 0.004 250) 0%, oklch(0.95 0.016 250) 100%)" }}>
      <TopNav />
      <main className="grid min-h-[calc(100dvh-4rem)] place-items-center px-4 py-10 sm:px-8">
        <LoginForm />
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Page shell={false}>
      <LoginScreen />
    </Page>
  );
}
