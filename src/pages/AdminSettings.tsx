import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { useHistory, useLocation } from "react-router-dom";
import { toast } from "sonner";
import {
  Bell, Camera, Check, CircleAlert, ClipboardCheck, Database, Eye, EyeOff, Flag, KeyRound, Loader2, Lock, Monitor, RefreshCw,
  Server, ShieldAlert, ShieldCheck, Smartphone, Terminal, Trash2, UserPlus, UserRound, X, type LucideIcon,
} from "lucide-react";
import { AdminLayout } from "@/layouts/AdminLayout";
import { useAuth } from "@/auth/AuthContext";
import { PersonAvatar } from "@/components/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { adminBtn, adminCard, fmtDate, fmtDateTime } from "@/components/admin-ui";
import {
  changeAdminPassword, fetchAdminPreferences, fetchAdminProfile, fetchAdminSessions, fetchSystemInfo, notifyAdminHeaderChanged,
  removeAdminAvatar, revokeAdminSession, revokeOtherAdminSessions, saveAdminAvatar, saveAdminPreferences, saveAdminProfile,
  type AdminPreferences, type AdminProfile, type AdminSession, type SystemInfo,
} from "@/lib/adminApi";
import { cn } from "@/lib/utils";

type TabKey = "profile" | "security" | "notifications" | "system";
const TABS: { key: TabKey; label: string; icon: LucideIcon }[] = [
  { key: "profile", label: "Admin Profile", icon: UserRound },
  { key: "security", label: "Account Security", icon: ShieldCheck },
  { key: "notifications", label: "Notification Preferences", icon: Bell },
  { key: "system", label: "System Information", icon: Server },
];

const input =
  "h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm text-[#0a1f44] outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-400/20 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500";

/* ------------------------------------------------------------------ small helpers */

function timeAgo(iso: string): string {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return fmtDate(iso);
}

function fmtUptime(total: number): string {
  const d = Math.floor(total / 86400), h = Math.floor((total % 86400) / 3600), m = Math.floor((total % 3600) / 60);
  if (d) return `${d}d ${h}h`;
  if (h) return `${h}h ${m}m`;
  return `${m}m ${total % 60}s`;
}

function fmtBytes(n: number | null): string {
  if (n === null) return "Unknown";
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`;
  if (n < 1024 ** 3) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  return `${(n / 1024 ** 3).toFixed(2)} GB`;
}

function Section({ title, description, icon: Icon, children, action }: { title: string; description?: string; icon?: LucideIcon; children: ReactNode; action?: ReactNode }) {
  return (
    <section className={cn(adminCard, "p-5 sm:p-6")} aria-labelledby={`sec-${title.replace(/\W+/g, "-")}`}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          {Icon && <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-sky-50 text-sky-600"><Icon className="h-5 w-5" /></span>}
          <div>
            <h3 id={`sec-${title.replace(/\W+/g, "-")}`} className="font-display text-xl font-bold text-[#0a1f44]">{title}</h3>
            {description && <p className="text-sm text-slate-500">{description}</p>}
          </div>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function Field({ id, label, hint, error, children }: { id: string; label: string; hint?: string; error?: string | undefined; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-[#0a1f44]">{label}</label>
      {children}
      {error ? <p id={`${id}-error`} role="alert" className="mt-1.5 text-xs font-medium text-red-600">{error}</p> : hint ? <p className="mt-1.5 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

/* ------------------------------------------------------------------ 1. Admin Profile */

/** Crops the picture to a square and shrinks it to a small JPEG, so it is quick to send and to show. */
async function squareJpeg(file: File, size = 256): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => { img.onload = () => resolve(); img.onerror = () => reject(new Error("unreadable")); img.src = url; });
    const side = Math.min(img.naturalWidth, img.naturalHeight);
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("no canvas");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, size, size);
    ctx.drawImage(img, (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side, 0, 0, size, size);
    return canvas.toDataURL("image/jpeg", 0.85);
  } finally {
    URL.revokeObjectURL(url);
  }
}

function ProfilePanel() {
  const { refreshUser } = useAuth();
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [form, setForm] = useState({ displayName: "", firstName: "", lastName: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const apply = (p: AdminProfile) => {
    setProfile(p);
    setForm({ displayName: p.displayName, firstName: p.firstName, lastName: p.lastName });
  };

  useEffect(() => {
    let live = true;
    void fetchAdminProfile().then((r) => {
      if (!live) return;
      if (r.ok) apply(r.data.profile);
      else setLoadError(r.message);
    });
    return () => { live = false; };
  }, []);

  const dirty = !!profile && (form.displayName !== profile.displayName || form.firstName !== profile.firstName || form.lastName !== profile.lastName);
  const valid = form.displayName.trim().length >= 2;

  async function onSave(e: FormEvent) {
    e.preventDefault();
    if (!dirty || !valid || saving) return;
    setSaving(true); setErrors({}); setFormError(null);
    const r = await saveAdminProfile({ displayName: form.displayName, firstName: form.firstName, lastName: form.lastName });
    setSaving(false);
    if (!r.ok) {
      setErrors(r.fieldErrors ?? {});
      setFormError(r.fieldErrors && Object.keys(r.fieldErrors).length ? null : r.message);
      return;
    }
    apply(r.data.profile);
    toast.success("Profile updated");
    notifyAdminHeaderChanged();
    void refreshUser();
  }

  async function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) return void toast.error("Choose a PNG, JPG or WebP picture.");
    if (file.size > 8 * 1024 * 1024) return void toast.error("That picture is too large. Choose one under 8 MB.");
    setPhotoBusy(true);
    try {
      const r = await saveAdminAvatar(await squareJpeg(file));
      if (!r.ok) return void toast.error(r.fieldErrors?.["avatar"] ?? r.message);
      apply({ ...r.data.profile, displayName: form.displayName, firstName: form.firstName, lastName: form.lastName });
      toast.success("Photo updated");
      notifyAdminHeaderChanged();
    } catch {
      toast.error("That picture couldn't be read. Try another one.");
    } finally {
      setPhotoBusy(false);
    }
  }

  async function onRemovePhoto() {
    setPhotoBusy(true);
    const r = await removeAdminAvatar();
    setPhotoBusy(false);
    if (!r.ok) return void toast.error(r.message);
    setProfile((p) => (p ? { ...p, avatar: null } : p));
    toast.success("Photo removed");
    notifyAdminHeaderChanged();
  }

  if (loadError) return <p role="alert" className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"><CircleAlert className="h-4 w-4" /> {loadError}</p>;
  if (!profile) return <div className="space-y-4"><Skeleton className="h-40 w-full rounded-2xl" /><Skeleton className="h-72 w-full rounded-2xl" /></div>;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="flex flex-col gap-6">
        <Section title="Profile photo" description="Shown next to your name at the top of every admin page." icon={Camera}>
          <div className="flex flex-wrap items-center gap-5">
            <PersonAvatar name={form.displayName || profile.displayName} {...(profile.avatar ? { src: profile.avatar } : {})} size="lg" />
            <div className="flex flex-col gap-2">
              <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" tabIndex={-1} aria-label="Choose a profile picture" onChange={(e) => void onPhoto(e)} />
              <div className="flex flex-wrap gap-2">
                <button type="button" disabled={photoBusy} onClick={() => fileRef.current?.click()} className={cn(adminBtn, "bg-[#0a1f44] text-white hover:bg-[#0f3160]")}>
                  {photoBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />} {profile.avatar ? "Change photo" : "Upload photo"}
                </button>
                {profile.avatar && (
                  <button type="button" disabled={photoBusy} onClick={() => void onRemovePhoto()} className={cn(adminBtn, "border border-slate-300 bg-white text-slate-700 hover:border-red-300 hover:bg-red-50 hover:text-red-700")}>
                    <Trash2 className="h-4 w-4" /> Remove
                  </button>
                )}
              </div>
              <p className="text-xs text-slate-500">PNG, JPG or WebP. It is cropped to a square and shrunk automatically.</p>
            </div>
          </div>
        </Section>

        <form onSubmit={(e) => void onSave(e)} noValidate>
          <Section title="Personal information" description="How your name appears across Sportal and in the activity log." icon={UserRound}>
            {formError && <p role="alert" className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"><CircleAlert className="h-4 w-4 shrink-0" /> {formError}</p>}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field id="displayName" label="Display name" error={errors["displayName"]} hint="2 to 80 characters.">
                  <input id="displayName" className={cn(input, errors["displayName"] && "border-red-400")} value={form.displayName} maxLength={80} autoComplete="name" disabled={saving}
                    aria-invalid={!!errors["displayName"]} onChange={(e) => setForm({ ...form, displayName: e.target.value })} />
                </Field>
              </div>
              <Field id="firstName" label="First name" error={errors["firstName"]}>
                <input id="firstName" className={cn(input, errors["firstName"] && "border-red-400")} value={form.firstName} maxLength={40} autoComplete="given-name" disabled={saving} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
              </Field>
              <Field id="lastName" label="Last name" error={errors["lastName"]}>
                <input id="lastName" className={cn(input, errors["lastName"] && "border-red-400")} value={form.lastName} maxLength={40} autoComplete="family-name" disabled={saving} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
              </Field>
              <Field id="email" label="Email" hint="Set by the server (ADMIN_EMAIL). It is what you sign in with, so it can't be changed here.">
                <div className="relative"><Lock className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input id="email" className={cn(input, "pr-10")} value={profile.email} readOnly disabled /></div>
              </Field>
              <Field id="username" label="Username" hint="Set by the server (ADMIN_USERNAME).">
                <div className="relative"><Lock className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input id="username" className={cn(input, "pr-10")} value={profile.username} readOnly disabled /></div>
              </Field>
            </div>
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button type="button" disabled={!dirty || saving} onClick={() => { apply(profile); setErrors({}); setFormError(null); }} className={cn(adminBtn, "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50")}>Reset</button>
              <button type="submit" disabled={!dirty || !valid || saving} className={cn(adminBtn, "bg-[#0a1f44] text-white hover:bg-[#0f3160]")}>
                {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : <><Check className="h-4 w-4" /> Save changes</>}
              </button>
            </div>
          </Section>
        </form>
      </div>

      <aside aria-label="Account details" className="flex flex-col gap-6 lg:sticky lg:top-24 lg:self-start">
        <Section title="Account" icon={KeyRound}>
          <dl className="divide-y divide-slate-100 text-sm">
            {[
              ["Role", "Administrator"],
              ["Member since", fmtDate(profile.createdAt)],
              ["Last sign-in", profile.lastLoginAt ? fmtDateTime(profile.lastLoginAt) : "Never"],
              ["Password changed", profile.passwordChangedAt ? fmtDate(profile.passwordChangedAt) : "Never"],
            ].map(([k, v]) => (
              <div key={k} className="flex items-baseline justify-between gap-3 py-2.5"><dt className="text-slate-500">{k}</dt><dd className="text-right font-semibold text-[#0a1f44]">{v}</dd></div>
            ))}
          </dl>
        </Section>
      </aside>
    </div>
  );
}

/* ------------------------------------------------------------------ 2. Account Security */

function PasswordInput({ id, value, onChange, show, onToggle, autoComplete, invalid, disabled }: {
  id: string; value: string; onChange: (v: string) => void; show: boolean; onToggle: () => void; autoComplete: string; invalid: boolean; disabled: boolean;
}) {
  return (
    <div className="relative">
      <input id={id} type={show ? "text" : "password"} value={value} onChange={(e) => onChange(e.target.value)} autoComplete={autoComplete} maxLength={128} disabled={disabled}
        aria-invalid={invalid} className={cn(input, "pr-11", invalid && "border-red-400")} />
      <button type="button" onClick={onToggle} aria-label={show ? "Hide password" : "Show password"} className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700">
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

function PasswordSection({ minLength, onChanged }: { minLength: number; onChanged: () => void }) {
  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  const [again, setAgain] = useState("");
  const [show, setShow] = useState({ cur: false, next: false, again: false });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const rules = [
    { ok: next.length >= minLength, label: `At least ${minLength} characters` },
    { ok: /[A-Za-z]/.test(next) && /\d/.test(next), label: "Letters and numbers" },
    { ok: next.length > 0 && next === again, label: "Both new passwords match" },
    { ok: next.length > 0 && next !== cur, label: "Different from your current password" },
  ];
  const ready = !!cur && rules.every((r) => r.ok);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!ready || loading) return;
    setLoading(true); setErrors({}); setFormError(null);
    const r = await changeAdminPassword({ currentPassword: cur, newPassword: next, confirmPassword: again });
    setLoading(false);
    if (!r.ok) {
      const fe = r.fieldErrors ?? {};
      setErrors(fe);
      setFormError(Object.keys(fe).length ? null : r.message);
      if (fe["currentPassword"]) setCur("");
      return;
    }
    setCur(""); setNext(""); setAgain("");
    const n = r.data.otherSessionsSignedOut;
    toast.success("Password changed", { description: n ? `${n} other device${n === 1 ? " was" : "s were"} signed out.` : "No other devices were signed in." });
    onChanged();
  }

  return (
    <Section title="Change password" description="You stay signed in here. Every other device is signed out." icon={KeyRound}>
      <form onSubmit={(e) => void onSubmit(e)} noValidate className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_17rem]">
        <div className="flex flex-col gap-4">
          {formError && <p role="alert" className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"><CircleAlert className="h-4 w-4 shrink-0" /> {formError}</p>}
          <Field id="cur-pw" label="Current password" error={errors["currentPassword"]}>
            <PasswordInput id="cur-pw" value={cur} onChange={setCur} show={show.cur} onToggle={() => setShow({ ...show, cur: !show.cur })} autoComplete="current-password" invalid={!!errors["currentPassword"]} disabled={loading} />
          </Field>
          <Field id="new-pw" label="New password" error={errors["newPassword"]}>
            <PasswordInput id="new-pw" value={next} onChange={setNext} show={show.next} onToggle={() => setShow({ ...show, next: !show.next })} autoComplete="new-password" invalid={!!errors["newPassword"]} disabled={loading} />
          </Field>
          <Field id="again-pw" label="Confirm new password" error={errors["confirmPassword"]}>
            <PasswordInput id="again-pw" value={again} onChange={setAgain} show={show.again} onToggle={() => setShow({ ...show, again: !show.again })} autoComplete="new-password" invalid={!!errors["confirmPassword"]} disabled={loading} />
          </Field>
          <div><button type="submit" disabled={!ready || loading} className={cn(adminBtn, "bg-[#0a1f44] text-white hover:bg-[#0f3160]")}>
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Changing…</> : <><KeyRound className="h-4 w-4" /> Change password</>}
          </button></div>
        </div>
        <div className="rounded-xl bg-slate-50 p-4 text-sm" aria-live="polite">
          <p className="mb-2 font-semibold text-[#0a1f44]">Your new password needs</p>
          <ul className="space-y-1.5">
            {rules.map((r) => (
              <li key={r.label} className={cn("flex items-start gap-2", r.ok ? "text-sky-700" : "text-slate-500")}>
                {r.ok ? <Check className="mt-0.5 h-4 w-4 shrink-0" /> : <span className="mt-1.5 ml-1 mr-1 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300" />} {r.label}
              </li>
            ))}
          </ul>
        </div>
      </form>
    </Section>
  );
}

function deviceIcon(s: AdminSession): LucideIcon {
  if (s.os === "iOS" || s.os === "Android") return Smartphone;
  if (s.browser === "API client") return Terminal;
  return Monitor;
}

function SessionsSection({ reloadKey, adminHours }: { reloadKey: number; adminHours: number }) {
  const [sessions, setSessions] = useState<AdminSession[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let live = true;
    setError(null);
    void fetchAdminSessions().then((r) => {
      if (!live) return;
      if (r.ok) setSessions(r.data.sessions);
      else setError(r.message);
    });
    return () => { live = false; };
  }, [reload, reloadKey]);

  const others = sessions?.filter((s) => !s.current).length ?? 0;

  async function revoke(s: AdminSession) {
    setBusy(s.id);
    const r = await revokeAdminSession(s.id);
    setBusy(null);
    if (!r.ok && r.code !== "session_not_found") return void toast.error(r.message);
    toast.success(`${s.device} was signed out`);
    setReload((k) => k + 1);
  }

  async function revokeAll() {
    setBusy("all");
    const r = await revokeOtherAdminSessions();
    setBusy(null);
    setConfirming(false);
    if (!r.ok) return void toast.error(r.message);
    toast.success(r.data.revoked ? `${r.data.revoked} other device${r.data.revoked === 1 ? "" : "s"} signed out` : "No other devices were signed in");
    setReload((k) => k + 1);
  }

  return (
    <Section
      title="Active sessions"
      description={`Where you're signed in. Admin sessions end on their own after ${adminHours} hours.`}
      icon={Monitor}
      action={
        <div className="flex gap-2">
          <button type="button" onClick={() => setReload((k) => k + 1)} aria-label="Refresh sessions" className={cn(adminBtn, "w-9 border border-slate-300 bg-white px-0 text-slate-600 hover:bg-slate-50")}><RefreshCw className="h-4 w-4" /></button>
          <button type="button" disabled={others === 0 || busy !== null} onClick={() => setConfirming(true)} className={cn(adminBtn, "border border-slate-300 bg-white text-slate-700 hover:border-red-300 hover:bg-red-50 hover:text-red-700")}>
            Sign out all other devices
          </button>
        </div>
      }
    >
      {error && <p role="alert" className="mb-3 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"><CircleAlert className="h-4 w-4" /> {error}</p>}
      {sessions === null && !error ? (
        <div className="space-y-2">{[0, 1].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
      ) : (
        <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
          {sessions?.map((s) => {
            const Icon = deviceIcon(s);
            return (
              <li key={s.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 p-4">
                <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl", s.current ? "bg-sky-50 text-sky-600" : "bg-slate-100 text-slate-500")}><Icon className="h-5 w-5" /></span>
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 font-semibold text-[#0a1f44]">
                    {s.device}
                    {s.current && <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-sky-800">This device</span>}
                  </p>
                  <p className="text-xs text-slate-500">
                    {s.ip ? `${s.ip} · ` : ""}Signed in {fmtDateTime(s.signedInAt)} · Active {timeAgo(s.lastActiveAt)}
                  </p>
                </div>
                {!s.current && (
                  <button type="button" disabled={busy !== null} onClick={() => void revoke(s)} aria-label={`Sign out ${s.device}`} className={cn(adminBtn, "h-8 border border-slate-300 bg-white px-3 text-xs text-slate-700 hover:border-red-300 hover:bg-red-50 hover:text-red-700")}>
                    {busy === s.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />} Sign out
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <Dialog open={confirming} onOpenChange={(o) => !o && busy === null && setConfirming(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sign out {others} other device{others === 1 ? "" : "s"}?</DialogTitle>
            <DialogDescription>They'll be signed out right away and will need the password to sign in again. This device stays signed in.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <button type="button" onClick={() => setConfirming(false)} disabled={busy !== null} className={cn(adminBtn, "border border-slate-300 text-slate-700 hover:bg-slate-50")}>Cancel</button>
            <button type="button" onClick={() => void revokeAll()} disabled={busy !== null} className={cn(adminBtn, "bg-red-600 text-white hover:bg-red-700")}>{busy === "all" ? "Signing out…" : "Sign them out"}</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Section>
  );
}

function SecurityPanel() {
  const [key, setKey] = useState(0);
  const [policy, setPolicy] = useState<{ min: number; hours: number }>({ min: 12, hours: 4 });
  useEffect(() => {
    void fetchSystemInfo().then((r) => { if (r.ok) setPolicy({ min: r.data.system.security.adminPasswordMinLength, hours: r.data.system.security.adminSessionHours }); });
  }, []);
  return (
    <div className="flex flex-col gap-6">
      <PasswordSection minLength={policy.min} onChanged={() => setKey((k) => k + 1)} />
      <SessionsSection reloadKey={key} adminHours={policy.hours} />
    </div>
  );
}

/* ------------------------------------------------------------------ 3. Notification Preferences */

const PREF_ROWS: { key: keyof AdminPreferences; title: string; text: string; icon: LucideIcon }[] = [
  { key: "applications", title: "School representative applications", text: "Count applications that are waiting for your review.", icon: ClipboardCheck },
  { key: "reports", title: "Reported content", text: "Count reports about profiles, videos and photos that nobody has looked at yet.", icon: Flag },
  { key: "security", title: "Security alerts", text: "Failed or locked administrator sign-in attempts in the last 24 hours.", icon: ShieldAlert },
  { key: "registrations", title: "New registrations", text: "How many new accounts joined in the last 7 days.", icon: UserPlus },
];

function NotificationsPanel() {
  const [prefs, setPrefs] = useState<AdminPreferences | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<keyof AdminPreferences | null>(null);

  useEffect(() => {
    let live = true;
    void fetchAdminPreferences().then((r) => {
      if (!live) return;
      if (r.ok) setPrefs(r.data.preferences);
      else setError(r.message);
    });
    return () => { live = false; };
  }, []);

  async function toggle(key: keyof AdminPreferences, value: boolean) {
    if (!prefs) return;
    const before = prefs;
    setPrefs({ ...prefs, [key]: value });   // shown at once, put back if the server says no
    setSaving(key);
    const r = await saveAdminPreferences({ [key]: value });
    setSaving(null);
    if (!r.ok) {
      setPrefs(before);
      return void toast.error(r.message);
    }
    setPrefs(r.data.preferences);
    notifyAdminHeaderChanged();   // the bell at the top changes straight away
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <Section title="Notification preferences" description="Choose what the bell at the top of every admin page tells you about." icon={Bell}>
        {error && <p role="alert" className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"><CircleAlert className="h-4 w-4" /> {error}</p>}
        {!prefs && !error ? (
          <div className="space-y-2">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
        ) : prefs && (
          <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
            {PREF_ROWS.map((row) => {
              const id = `pref-${row.key}`;
              return (
                <li key={row.key} className="flex items-center gap-4 p-4">
                  <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl", prefs[row.key] ? "bg-sky-50 text-sky-600" : "bg-slate-100 text-slate-400")}><row.icon className="h-5 w-5" /></span>
                  <div className="min-w-0 flex-1">
                    <label htmlFor={id} className="block cursor-pointer font-semibold text-[#0a1f44]">{row.title}</label>
                    <p className="text-sm text-slate-500">{row.text}</p>
                  </div>
                  <Switch id={id} checked={prefs[row.key]} disabled={saving === row.key} onCheckedChange={(v) => void toggle(row.key, v)} className="data-[state=checked]:bg-[#0a1f44]" />
                </li>
              );
            })}
          </ul>
        )}
        <p className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-xs text-slate-500">
          These settings are saved to your account and apply to the notification bell. Email notifications aren't set up for Sportal yet. Your dashboard numbers are not affected by these switches.
        </p>
      </Section>
    </div>
  );
}

/* ------------------------------------------------------------------ 4. System Information */

function InfoCard({ title, icon, rows }: { title: string; icon: LucideIcon; rows: [string, ReactNode][] }) {
  return (
    <Section title={title} icon={icon}>
      <dl className="divide-y divide-slate-100 text-sm">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-baseline justify-between gap-4 py-2.5"><dt className="text-slate-500">{k}</dt><dd className="text-right font-semibold text-[#0a1f44]">{v}</dd></div>
        ))}
      </dl>
    </Section>
  );
}

function SystemPanel() {
  const [info, setInfo] = useState<SystemInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetchSystemInfo();
    setLoading(false);
    if (r.ok) { setInfo(r.data.system); setError(null); }
    else setError(r.message);
  }, []);
  useEffect(() => { void load(); }, [load]);

  if (error && !info) return <p role="alert" className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"><CircleAlert className="h-4 w-4" /> {error}<button type="button" onClick={() => void load()} className="ml-auto font-semibold underline">Retry</button></p>;
  if (!info) return <div className="grid gap-6 md:grid-cols-2">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-60 w-full rounded-2xl" />)}</div>;

  const a = info.application, d = info.database, p = info.platform, s = info.security;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">Measured live, {fmtDateTime(a.serverTime)}. Read-only.</p>
        <button type="button" onClick={() => void load()} disabled={loading} className={cn(adminBtn, "border border-slate-300 bg-white text-slate-700 hover:border-sky-300 hover:bg-sky-50")}>
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} /> Refresh
        </button>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <InfoCard title="Application" icon={Server} rows={[
          ["Name", a.name],
          ["Version", <span key="v" className="rounded-full bg-sky-50 px-2.5 py-0.5 text-sky-800">v{a.version}</span>],
          ["Environment", <span key="e" className="capitalize">{a.environment}</span>],
          ["Runtime", a.runtime],
          ["Region", a.region ?? "Not set"],
          ["Running for", fmtUptime(a.uptimeSeconds)],
        ]} />
        <InfoCard title="Database" icon={Database} rows={[
          ["Engine", d.engine],
          ["Status", <span key="s" className="inline-flex items-center gap-1.5"><span className={cn("h-2 w-2 rounded-full", d.reachable ? "bg-sky-500" : "bg-red-500")} />{d.reachable ? "Connected" : "Unreachable"}</span>],
          ["Response time", `${d.latencyMs} ms`],
          ["Size", fmtBytes(d.sizeBytes)],
          ["Schema version", `v${d.schemaVersion} (${d.migrationsApplied} updates applied)`],
        ]} />
        <InfoCard title="Platform" icon={ShieldCheck} rows={[
          ["Users", p.users.toLocaleString()],
          ["Student-athletes", p.athletes.toLocaleString()],
          ["Coaches", p.coaches.toLocaleString()],
          ["School representatives", p.schoolRepresentatives.toLocaleString()],
          ["Suspended accounts", p.suspendedAccounts.toLocaleString()],
          ["Registered schools", p.schools.toLocaleString()],
          ["Scholarships", p.scholarships.toLocaleString()],
          ["Open reports", p.openReports.toLocaleString()],
          ["Signed-in sessions", p.activeSessions.toLocaleString()],
          ["Logged activities", p.activityEvents.toLocaleString()],
        ]} />
        <InfoCard title="Security policy" icon={Lock} rows={[
          ["Admin session length", `${s.adminSessionHours} hours`],
          ["User session length", `${s.userSessionHours} hours`],
          ["\u201CRemember me\u201D", `${s.rememberDays} days`],
          ["Admin password minimum", `${s.adminPasswordMinLength} characters`],
          ["User password minimum", `${s.userPasswordMinLength} characters`],
          ["Sign-in lockout", `${s.lockoutAttempts} failures in ${s.lockoutMinutes} min`],
          ["Admin account set by", <span key="src" className="text-xs">{s.adminAccountSource}</span>],
        ]} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ page */

const parseTab = (hash: string): TabKey => {
  const k = hash.replace(/^#/, "");
  return TABS.some((t) => t.key === k) ? (k as TabKey) : "profile";
};

export default function AdminSettings() {
  const { hash } = useLocation();
  const history = useHistory();
  const tab = parseTab(hash);
  const go = (k: TabKey) => history.replace({ pathname: "/admin/settings", hash: `#${k}` });

  return (
    <AdminLayout title="Settings">
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="font-display text-3xl font-bold leading-tight text-[#0a1f44] sm:text-4xl">Settings</h2>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">Your profile, your sign-in security, what you get notified about, and how the platform is doing.</p>
        </div>

        <div role="tablist" aria-label="Settings sections" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {TABS.map((t) => {
            const on = t.key === tab;
            return (
              <button
                key={t.key} type="button" role="tab" id={`tab-${t.key}`} aria-selected={on} aria-controls={`panel-${t.key}`} tabIndex={on ? 0 : -1}
                onClick={() => go(t.key)}
                className={cn(
                  "inline-flex h-10 shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-4 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400",
                  on ? "bg-[#0a1f44] text-white shadow-sm" : "border border-slate-200 bg-white text-slate-600 hover:border-sky-300 hover:text-[#0a1f44]",
                )}
              >
                <t.icon className="h-4 w-4" /> {t.label}
              </button>
            );
          })}
        </div>

        <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} tabIndex={0} className="outline-none">
          {tab === "profile" && <ProfilePanel />}
          {tab === "security" && <SecurityPanel />}
          {tab === "notifications" && <NotificationsPanel />}
          {tab === "system" && <SystemPanel />}
        </div>
      </div>
    </AdminLayout>
  );
}
