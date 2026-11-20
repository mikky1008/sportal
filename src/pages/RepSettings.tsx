import { useEffect, useRef, useState } from "react";
import { Redirect } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { CircleAlert, Lock, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Page } from "@/components/Page";
import { Card, PageHeader, btn } from "@/components/common";
import { PersonAvatar } from "@/components/avatar";
import { useAuth } from "@/auth/AuthContext";
import { homePathFor, primaryRole } from "@/lib/roles";
import {
  changeRepPassword, fetchRepProfile, notifyRepHeaderChanged, removeRepAvatar, saveRepAvatar, saveRepProfile, type RepProfile,
} from "@/lib/repSettingsApi";
import { cn } from "@/lib/utils";

/* ---------------------------------------------------------------------------------------------
   SCHOOL REPRESENTATIVE: SETTINGS  (route: /rep/settings)

   Profile (name, position, photo) and password for the signed-in representative's OWN account.
   The school, email and username are shown but can't be edited here: an administrator approved
   the school, and the email and username are how the account signs in.
--------------------------------------------------------------------------------------------- */

const field = "w-full rounded-xl border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary disabled:opacity-60";
const invalid = "border-destructive focus:border-destructive";

const prettyDate = (iso: string | null) => {
  if (!iso) return "Never";
  try { return format(parseISO(iso), "MMM d, yyyy 'at' h:mm a"); } catch { return iso; }
};

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

function Field({ id, label, error, hint, children }: { id: string; label: string; error?: string | undefined; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium">{label}</label>
      <div className="mt-1.5">{children}</div>
      {error ? <p id={`${id}-error`} role="alert" className="mt-1 text-xs text-destructive">{error}</p> : hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function ReadOnly({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div>
      <p className="text-sm font-medium">{label}</p>
      <p className="mt-1.5 flex items-center gap-2 rounded-xl border bg-muted/50 px-3 py-2.5 text-sm text-muted-foreground">
        <Lock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /><span className="min-w-0 break-words">{value || "Not set"}</span>
      </p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

/* ---- profile ---- */

function ProfileCard({ profile, onChange }: { profile: RepProfile; onChange: (p: RepProfile) => void }) {
  const { refreshUser } = useAuth();
  const [form, setForm] = useState({ firstName: profile.firstName, lastName: profile.lastName, designation: profile.designation });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const dirty = form.firstName !== profile.firstName || form.lastName !== profile.lastName || form.designation !== profile.designation;
  const shownName = `${form.firstName} ${form.lastName}`.trim() || profile.displayName;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setErrors({});
    const r = await saveRepProfile(form);
    setSaving(false);
    if (!r.ok) {
      if (r.fieldErrors) setErrors(r.fieldErrors as Record<string, string>);
      toast.error(r.fieldErrors ? "Please fix the highlighted fields." : r.message);
      return;
    }
    onChange(r.data.profile);
    setForm({ firstName: r.data.profile.firstName, lastName: r.data.profile.lastName, designation: r.data.profile.designation });
    toast.success("Profile saved");
    void refreshUser();
    notifyRepHeaderChanged();
  }

  async function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) return void toast.error("Choose a PNG, JPG or WebP picture.");
    if (file.size > 8 * 1024 * 1024) return void toast.error("That picture is too large. Choose one under 8 MB.");
    setPhotoBusy(true);
    try {
      const r = await saveRepAvatar(await squareJpeg(file));
      if (!r.ok) return void toast.error((r.fieldErrors as Record<string, string> | undefined)?.["avatar"] ?? r.message);
      onChange(r.data.profile);
      toast.success("Photo updated");
      notifyRepHeaderChanged();
    } catch {
      toast.error("That picture couldn't be read. Try another one.");
    } finally {
      setPhotoBusy(false);
    }
  }

  async function onRemovePhoto() {
    setPhotoBusy(true);
    const r = await removeRepAvatar();
    setPhotoBusy(false);
    if (!r.ok) return void toast.error(r.message);
    onChange(r.data.profile);
    toast.success("Photo removed");
    notifyRepHeaderChanged();
  }

  return (
    <Card title="Profile">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <PersonAvatar name={shownName} {...(profile.avatar ? { src: profile.avatar } : {})} size="lg" />
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold">{profile.displayName}</p>
          <p className="truncate text-sm text-muted-foreground">{profile.designation}{profile.school ? ` · ${profile.school}` : ""}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" aria-label="Choose a profile photo" onChange={(e) => void onPhoto(e)} />
            <button type="button" className={cn(btn.secondary, btn.sm)} disabled={photoBusy} onClick={() => fileRef.current?.click()}>
              {photoBusy ? "Working…" : profile.avatar ? "Change photo" : "Upload photo"}
            </button>
            {profile.avatar && <button type="button" className={cn(btn.secondary, btn.sm)} disabled={photoBusy} onClick={() => void onRemovePhoto()}>Remove photo</button>}
          </div>
        </div>
      </div>

      <form onSubmit={(e) => void save(e)} noValidate className="mt-6 grid gap-4 sm:grid-cols-2">
        <Field id="rep-first" label="First name" error={errors["firstName"]}>
          <input id="rep-first" className={cn(field, errors["firstName"] && invalid)} value={form.firstName} maxLength={40} autoComplete="given-name" aria-invalid={errors["firstName"] ? true : undefined} aria-describedby={errors["firstName"] ? "rep-first-error" : undefined}
            onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
        </Field>
        <Field id="rep-last" label="Last name" error={errors["lastName"]}>
          <input id="rep-last" className={cn(field, errors["lastName"] && invalid)} value={form.lastName} maxLength={40} autoComplete="family-name" aria-invalid={errors["lastName"] ? true : undefined} aria-describedby={errors["lastName"] ? "rep-last-error" : undefined}
            onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
        </Field>
        <div className="sm:col-span-2">
          <Field id="rep-designation" label="Position / designation" error={errors["designation"]}>
            <input id="rep-designation" className={cn(field, errors["designation"] && invalid)} value={form.designation} maxLength={80} aria-invalid={errors["designation"] ? true : undefined} aria-describedby={errors["designation"] ? "rep-designation-error" : undefined}
              onChange={(e) => setForm({ ...form, designation: e.target.value })} />
          </Field>
        </div>
        <ReadOnly label="School" value={profile.school} hint="Approved by a Sportal administrator. Contact support to change it." />
        <div className="grid gap-4">
          <ReadOnly label="Email" value={profile.email} />
          <ReadOnly label="Username" value={profile.username} />
        </div>
        <div className="flex justify-end sm:col-span-2">
          <button type="submit" className={btn.primary} disabled={!dirty || saving}>{saving ? "Saving…" : "Save changes"}</button>
        </div>
      </form>
    </Card>
  );
}

/* ---- password ---- */

function PasswordCard({ profile, onChanged }: { profile: RepProfile; onChanged: () => void }) {
  const empty = { currentPassword: "", newPassword: "", confirmPassword: "" };
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const type = show ? "text" : "password";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setErrors({}); setDone(null);
    const r = await changeRepPassword(form);
    setSaving(false);
    if (!r.ok) {
      setErrors({ ...((r.fieldErrors as Record<string, string> | undefined) ?? {}), ...(r.fieldErrors ? {} : { form: r.message }) });
      return;
    }
    setForm(empty);
    const n = r.data.otherSessionsSignedOut;
    setDone(n > 0 ? `Password changed. ${n} other device${n === 1 ? " was" : "s were"} signed out.` : "Password changed.");
    toast.success("Password changed");
    onChanged();
  }

  return (
    <Card title="Password">
      <p className="text-sm text-muted-foreground">Use at least 10 characters with letters and numbers. Changing it signs you out on your other devices. Last changed: {prettyDate(profile.passwordChangedAt)}.</p>
      <form onSubmit={(e) => void submit(e)} noValidate className="mt-4 grid max-w-md gap-4">
        <Field id="rep-current" label="Current password" error={errors["currentPassword"]}>
          <input id="rep-current" type={type} autoComplete="current-password" className={cn(field, errors["currentPassword"] && invalid)} value={form.currentPassword} maxLength={128}
            aria-invalid={errors["currentPassword"] ? true : undefined} aria-describedby={errors["currentPassword"] ? "rep-current-error" : undefined}
            onChange={(e) => setForm({ ...form, currentPassword: e.target.value })} />
        </Field>
        <Field id="rep-new" label="New password" error={errors["newPassword"]}>
          <input id="rep-new" type={type} autoComplete="new-password" className={cn(field, errors["newPassword"] && invalid)} value={form.newPassword} maxLength={128}
            aria-invalid={errors["newPassword"] ? true : undefined} aria-describedby={errors["newPassword"] ? "rep-new-error" : undefined}
            onChange={(e) => setForm({ ...form, newPassword: e.target.value })} />
        </Field>
        <Field id="rep-confirm" label="Confirm new password" error={errors["confirmPassword"]}>
          <input id="rep-confirm" type={type} autoComplete="new-password" className={cn(field, errors["confirmPassword"] && invalid)} value={form.confirmPassword} maxLength={128}
            aria-invalid={errors["confirmPassword"] ? true : undefined} aria-describedby={errors["confirmPassword"] ? "rep-confirm-error" : undefined}
            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} />
        </Field>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} /> Show passwords</label>
        {errors["form"] && <p role="alert" className="flex items-center gap-2 text-sm text-destructive"><CircleAlert className="h-4 w-4" aria-hidden="true" />{errors["form"]}</p>}
        {done && <p role="status" className="flex items-center gap-2 rounded-xl bg-accent px-3 py-2.5 text-sm text-accent-foreground"><ShieldCheck className="h-4 w-4 shrink-0" aria-hidden="true" />{done}</p>}
        <div>
          <button type="submit" className={btn.primary} disabled={saving || !form.currentPassword || !form.newPassword || !form.confirmPassword}>{saving ? "Changing…" : "Change password"}</button>
        </div>
      </form>
    </Card>
  );
}

/* ---- page ---- */

function RepSettings() {
  const [profile, setProfile] = useState<RepProfile | null>(null);
  const [loadError, setLoadError] = useState("");

  const load = () => {
    setLoadError("");
    void fetchRepProfile().then((r) => { if (r.ok) setProfile(r.data.profile); else setLoadError(r.message); });
  };
  useEffect(load, []);

  if (loadError)
    return (
      <div role="alert" className="surface mx-auto flex max-w-lg flex-col items-center gap-3 px-6 py-10 text-center">
        <p className="text-sm text-muted-foreground">{loadError}</p>
        <button type="button" className={cn(btn.secondary, btn.sm)} onClick={load}>Try again</button>
      </div>
    );
  if (!profile)
    return (
      <div role="status" aria-label="Loading settings" className="flex max-w-3xl flex-col gap-4">
        <div className="h-64 animate-pulse rounded-2xl bg-muted" /><div className="h-72 animate-pulse rounded-2xl bg-muted" />
      </div>
    );

  return (
    <div className="max-w-3xl">
      <PageHeader title="Settings" subtitle="Your profile and password" />
      <div className="flex flex-col gap-6">
        <ProfileCard profile={profile} onChange={setProfile} />
        <PasswordCard profile={profile} onChanged={load} />
        <Card title="Account">
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div><dt className="text-muted-foreground">Account created</dt><dd className="font-medium">{prettyDate(profile.createdAt)}</dd></div>
            <div><dt className="text-muted-foreground">Last sign-in</dt><dd className="font-medium">{prettyDate(profile.lastLoginAt)}</dd></div>
          </dl>
        </Card>
      </div>
    </div>
  );
}

export default function RepSettingsPage() {
  const { user } = useAuth();
  // Only school representatives have this page; anyone else goes to their own home.
  if (user && primaryRole(user.roles) !== "university_representative") return <Redirect to={homePathFor(user.roles)} />;
  return (
    <Page title="Settings">
      <RepSettings />
    </Page>
  );
}
