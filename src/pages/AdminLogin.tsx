import { useState, type FormEvent } from "react";
import { IonContent, IonPage } from "@ionic/react";
import { Redirect } from "react-router-dom";
import { AlertCircle, Eye, EyeOff, Loader2, Lock, ShieldCheck, User } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/auth/AuthContext";
import { ADMIN_HOME_PATH, homePathFor } from "@/lib/roles";
import { cn } from "@/lib/utils";

const input =
  "h-12 w-full rounded-xl border border-slate-700 bg-slate-800 pl-11 text-sm text-white shadow-sm outline-none transition placeholder:text-slate-500 hover:border-slate-500 focus:border-sky-400 focus:ring-4 focus:ring-sky-400/20 disabled:cursor-not-allowed disabled:opacity-60";

/**
 * Administrator sign-in at /admin/login. It is not linked from the public pages, has no sign up and
 * no "remember me", and only the administrator configured on the server can get through. Anyone
 * else, including a regular user signed in elsewhere, is told the credentials are wrong.
 */
export default function AdminLogin() {
  const { user, signInAdmin, accept } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ identifier?: string; password?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);

  // Already signed in: administrators go straight to the dashboard, everyone else to their own home.
  if (user) return <Redirect to={user.roles.includes("admin") ? ADMIN_HOME_PATH : homePathFor(user.roles)} />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (loading) return;
    const errs: typeof errors = {};
    if (!identifier.trim()) errs.identifier = "Enter the administrator email or username.";
    if (!password) errs.password = "Enter your password.";
    setErrors(errs);
    setFormError(null);
    if (errs.identifier || errs.password) return;

    setLoading(true);
    try {
      const res = await signInAdmin({ identifier, password });
      if (res.ok) {
        // Belt and braces: the server only issues this session to the administrator.
        if (!res.user.roles.includes("admin")) {
          setFormError("Incorrect administrator credentials.");
          setLoading(false);
          return;
        }
        toast.success("Signed in as administrator");
        accept(res.user, ADMIN_HOME_PATH);
        return;
      }
      setErrors(res.fieldErrors ?? {});
      setFormError(res.code === "validation" ? null : res.message);
      if (res.code === "invalid_credentials") setPassword("");
    } catch {
      setFormError("We couldn't reach the server. Check your connection and try again.");
    }
    setLoading(false);
  }

  return (
    <IonPage>
      <IonContent fullscreen>
        <div className="grid min-h-full place-items-center px-4 py-10" style={{ backgroundColor: "#0d2340" }}>
          <div className="w-full max-w-md">
            <div className="mb-6 flex items-center justify-center gap-2.5">
              <img src="/icon-192.png" alt="" aria-hidden="true" className="h-10 w-10 shrink-0 rounded-[22%]" />
              <span className="font-display text-2xl font-bold tracking-wide text-white">SPORTAL</span>
            </div>
            <form onSubmit={(e) => void onSubmit(e)} noValidate className="rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-xl sm:p-8">
              <div className="mb-6 flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-sky-400/15 text-sky-300"><ShieldCheck className="h-5 w-5" /></span>
                <div>
                  <h1 className="text-xl font-bold text-white">Administrator sign in</h1>
                  <p className="text-sm text-slate-400">Authorized personnel only.</p>
                </div>
              </div>

              {formError && (
                <div role="alert" className="mb-4 flex items-start gap-2 rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> <span>{formError}</span>
                </div>
              )}

              <label className="block text-sm font-medium text-slate-200" htmlFor="admin-identifier">Email or username</label>
              <div className="relative mt-1.5">
                <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input id="admin-identifier" className={cn(input, errors.identifier && "border-red-400")} autoComplete="username" autoCapitalize="none" spellCheck={false}
                  value={identifier} onChange={(e) => setIdentifier(e.target.value)} disabled={loading} aria-invalid={!!errors.identifier} />
              </div>
              {errors.identifier && <p className="mt-1 text-xs text-red-300">{errors.identifier}</p>}

              <label className="mt-4 block text-sm font-medium text-slate-200" htmlFor="admin-password">Password</label>
              <div className="relative mt-1.5">
                <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input id="admin-password" type={show ? "text" : "password"} className={cn(input, "pr-11", errors.password && "border-red-400")} autoComplete="current-password"
                  value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading} aria-invalid={!!errors.password} />
                <button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:text-white">
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-300">{errors.password}</p>}

              <button type="submit" disabled={loading}
                className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-sky-400 text-sm font-semibold text-[#0d2340] transition hover:bg-sky-300 disabled:opacity-60">
                {loading && <Loader2 className="h-4 w-4 animate-spin" />} {loading ? "Signing in…" : "Sign in"}
              </button>
              <p className="mt-4 text-center text-xs text-slate-500">Administrator access is configured on the server. There is no sign up.</p>
            </form>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
}
