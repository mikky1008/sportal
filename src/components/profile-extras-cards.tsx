import { useRef, useState } from "react";
import { toast } from "sonner";
import { Camera, Trash2, Video } from "lucide-react";
import { Card, Pill, Select, btn } from "@/components/common";
import { useUniversityOptions } from "@/lib/useUniversityOptions";
import { athleteCompletionNow, toastSaved } from "@/components/profile-completion-cards";
import {
  COVERAGE_OPTIONS, EXTRAS_LIMITS, ExtrasValidationError, isMediaUsable, profileExtrasStore,
  useProfileExtras, validatePhotoFile, validateScholarship, validateVideoUrl,
  type CoveragePreference, type MediaStatus, type ScholarshipInterests,
} from "@/lib/profileExtrasStore";
import { cn } from "@/lib/utils";

const field = "h-11 w-full rounded-xl border bg-background px-3 text-sm font-normal outline-none focus:ring-2 focus:ring-ring";

const statusLabel: Record<MediaStatus, { text: string; tone: "success" | "warning" | "default" }> = {
  approved: { text: "Accepted", tone: "success" },
  pending: { text: "Pending review", tone: "warning" },
  rejected: { text: "Rejected — replace it", tone: "default" },
};

export function ScholarshipInterestsCard() {
  const saved = useProfileExtras().scholarship;
  // null until something is edited, so the form always shows what is saved
  const [draft, setDraft] = useState<ScholarshipInterests | null>(null);
  const d = draft ?? saved;
  const { options: universityOptions, loading: universitiesLoading } = useUniversityOptions(d.universities);
  const errors = validateScholarship(d);
  const edit = (patch: Partial<ScholarshipInterests>) => setDraft({ ...d, ...patch });
  const toggleUni = (u: string) =>
    edit({ universities: d.universities.includes(u) ? d.universities.filter((x) => x !== u) : [...d.universities, u] });

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    const before = athleteCompletionNow().percent;
    try {
      profileExtrasStore.saveScholarship(d);
      setDraft(null);
      toastSaved("Scholarship interests saved", before);
    } catch (err) {
      if (err instanceof ExtrasValidationError) toast.error("Fix the highlighted fields to save.");
      else throw err;
    }
  };

  return (
    <Card title="Scholarship interests">
      <form id="section-scholarship" className="flex scroll-mt-24 flex-col gap-4" onSubmit={save} noValidate>
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-medium">Universities you're interested in</legend>
          <div className="flex flex-wrap gap-2">
            {universityOptions.map((u) => (
              <button
                key={u} type="button" aria-pressed={d.universities.includes(u)} onClick={() => toggleUni(u)}
                className={cn(
                  "rounded-full border px-3.5 py-2 text-sm font-semibold transition",
                  d.universities.includes(u) ? "border-success bg-success/15 text-foreground" : "bg-card text-muted-foreground hover:text-foreground",
                )}
              >{u}</button>
            ))}
          </div>
          {!universitiesLoading && universityOptions.length === 0 && <span className="text-xs text-muted-foreground">No university has posted a scholarship yet.</span>}
          {errors.universities && <span role="alert" className="text-xs text-destructive">{errors.universities}</span>}
        </fieldset>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-sm font-medium">Coverage you're looking for
            <Select value={d.coverage} placeholder="Choose a preference" onChange={(e) => edit({ coverage: e.target.value as CoveragePreference })}>
              {COVERAGE_OPTIONS.map((c) => <option key={c}>{c}</option>)}
            </Select>
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium">Intended course
            <input className={field} value={d.course} onChange={(e) => edit({ course: e.target.value })} aria-invalid={!!errors.course} placeholder="e.g. BS Kinesiology" />
            {errors.course && <span role="alert" className="text-xs font-normal text-destructive">{errors.course}</span>}
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" className={btn.primary}>Save interests</button>
          <button type="button" className={btn.secondary} onClick={() => setDraft(null)} disabled={draft === null}>Discard changes</button>
        </div>
      </form>
    </Card>
  );
}

/** Shrinks a chosen photo to at most 512px and returns it as a JPEG data URL. */
async function resizePhoto(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error("That image couldn't be read. Try a different file."));
      i.src = url;
    });
    const scale = Math.min(1, 512 / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Your browser can't process images.");
    ctx.drawImage(img, 0, 0, w, h);
    return canvas.toDataURL("image/jpeg", 0.85);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function ShowcaseCard() {
  const { photo, video } = useProfileExtras();
  const fileRef = useRef<HTMLInputElement>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [link, setLink] = useState<string | null>(null);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const problem = validatePhotoFile(file);
    if (problem) return setPhotoError(problem);
    setBusy(true);
    setPhotoError(null);
    const before = athleteCompletionNow().percent;
    try {
      profileExtrasStore.setPhoto(await resizePhoto(file));
      toastSaved("Profile photo saved", before);
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : "Couldn't save that photo.");
    } finally {
      setBusy(false);
    }
  };

  const saveLink = (e: React.FormEvent) => {
    e.preventDefault();
    const value = link ?? video?.value ?? "";
    const problem = validateVideoUrl(value);
    if (problem) return setLinkError(problem);
    const before = athleteCompletionNow().percent;
    profileExtrasStore.setVideo(value);
    setLink(null);
    setLinkError(null);
    toastSaved("Highlight video saved", before);
  };

  return (
    <Card title="Profile showcase">
      <div id="section-showcase" className="flex scroll-mt-24 flex-col gap-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-2xl border bg-muted">
            {photo && photo.status !== "rejected" && isMediaUsable("photo", photo)
              ? <img src={photo.value} alt="Your profile photo" className="h-full w-full object-cover" />
              : <Camera className="h-7 w-7 text-muted-foreground" aria-hidden="true" />}
          </div>
          <div className="flex flex-1 flex-col gap-2">
            <p className="flex flex-wrap items-center gap-2 text-sm font-medium">Profile photo
              {photo && <Pill tone={statusLabel[photo.status].tone}>{statusLabel[photo.status].text}</Pill>}
            </p>
            <p className="text-xs text-muted-foreground">JPG, PNG or WebP up to 5 MB. We resize it for you.</p>
            <div className="flex flex-wrap gap-2">
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" aria-label="Upload profile photo" onChange={onFile} />
              <button type="button" className={btn.secondary} disabled={busy} onClick={() => fileRef.current?.click()}>
                <Camera className="h-4 w-4" />{photo ? "Replace photo" : "Upload photo"}
              </button>
              {photo && <button type="button" className={btn.secondary} onClick={() => { profileExtrasStore.removePhoto(); setPhotoError(null); }}><Trash2 className="h-4 w-4" />Remove</button>}
            </div>
            {photoError && <span role="alert" className="text-xs text-destructive">{photoError}</span>}
          </div>
        </div>

        <form className="flex flex-col gap-2" onSubmit={saveLink} noValidate>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            <span className="flex flex-wrap items-center gap-2">Highlight video link
              {video && <Pill tone={statusLabel[video.status].tone}>{statusLabel[video.status].text}</Pill>}
            </span>
            <input
              className={field} inputMode="url" value={link ?? video?.value ?? ""} maxLength={EXTRAS_LIMITS.videoUrl}
              onChange={(e) => { setLink(e.target.value); setLinkError(null); }}
              aria-invalid={!!linkError} placeholder="https://www.youtube.com/watch?v=…"
            />
            {linkError && <span role="alert" className="text-xs font-normal text-destructive">{linkError}</span>}
          </label>
          <p className="text-xs text-muted-foreground">YouTube, Vimeo or Facebook. Rejected or invalid items don't count toward your profile completion.</p>
          <div className="flex flex-wrap gap-2">
            <button type="submit" className={btn.primary}><Video className="h-4 w-4" />Save link</button>
            {video && <button type="button" className={btn.secondary} onClick={() => { profileExtrasStore.removeVideo(); setLink(null); setLinkError(null); }}><Trash2 className="h-4 w-4" />Remove</button>}
          </div>
        </form>
      </div>
    </Card>
  );
}
