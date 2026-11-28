import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Link } from "@/router-compat";
import { CoachLayout } from "@/layouts/CoachLayout";
import { useCoachProfile } from "@/lib/coachProfileStore";
import { changeCoachPassword } from "@/lib/coachSettingsApi";
import { Card, PageHeader, btn } from "@/components/common";
import { cn } from "@/lib/utils";

const field = "h-11 w-full rounded-xl border bg-background px-3 text-sm font-normal outline-none focus:ring-2 focus:ring-ring";

function PasswordCard() {
  const empty = { currentPassword: "", newPassword: "", confirmPassword: "" };
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState("");
  const type = show ? "text" : "password";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true); setErrors({}); setDone("");
    const r = await changeCoachPassword(form);
    setSaving(false);
    if (!r.ok) {
      const fe = (r as { fieldErrors?: Record<string, string> }).fieldErrors;
      if (fe && Object.keys(fe).length) setErrors(fe); else toast.error(r.message || "Could not change your password.");
      return;
    }
    setForm(empty);
    const n = r.data.otherSessionsSignedOut;
    setDone(n > 0 ? `Password changed. ${n} other device${n === 1 ? " was" : "s were"} signed out.` : "Password changed.");
    toast.success("Password changed");
  };

  const input = (key: keyof typeof form, label: string, auto: string) => (
    <label className="flex flex-col gap-1.5 text-sm font-medium">
      {label}
      <input type={type} autoComplete={auto} maxLength={128} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        aria-invalid={errors[key] ? true : undefined} className={cn(field, errors[key] && "border-destructive")} />
      {errors[key] && <span role="alert" className="text-xs font-normal text-destructive">{errors[key]}</span>}
    </label>
  );

  return (
    <Card title="Password">
      <p className="text-sm text-muted-foreground">Use at least 10 characters with letters and numbers. Changing it signs you out on your other devices.</p>
      <form onSubmit={(e) => void submit(e)} className="mt-4 flex max-w-md flex-col gap-4" noValidate>
        {input("currentPassword", "Current password", "current-password")}
        {input("newPassword", "New password", "new-password")}
        {input("confirmPassword", "Confirm new password", "new-password")}
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} /> Show passwords</label>
        {done && <p role="status" className="text-sm text-success">{done}</p>}
        <div><button type="submit" className={btn.primary} disabled={saving || !form.currentPassword || !form.newPassword || !form.confirmPassword}>{saving ? "Changing…" : "Change password"}</button></div>
      </form>
    </Card>
  );
}

function CoachSettings() {
  const { profile } = useCoachProfile();
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <Link to="/coach/profile" className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to profile
      </Link>
      <PageHeader title="Settings" subtitle="Your account and password" />
      <Card title="Account">
        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          <div><dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Email</dt><dd className="mt-0.5 font-medium">{profile.email || "—"}</dd></div>
          <div><dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">School</dt><dd className="mt-0.5 font-medium">{profile.organizationName || "—"}</dd></div>
        </dl>
        <p className="mt-3 text-xs text-muted-foreground">Your school was chosen at sign-up and is reviewed by its representative, so it can't be changed here. Edit your other details from your profile.</p>
      </Card>
      <PasswordCard />
    </div>
  );
}

export default function CoachSettingsPage() {
  return <CoachLayout><CoachSettings /></CoachLayout>;
}
