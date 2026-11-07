// Scholarship interests and profile showcase rules, shared by the API (server/athlete-profile.server.ts)
// and the profile forms. Plain TypeScript only: it runs in the browser and under Node.

export const COVERAGE_OPTIONS = ["Full tuition", "Partial tuition", "Stipend / allowance", "Open to any"] as const;
export type CoveragePreference = (typeof COVERAGE_OPTIONS)[number];

/**
 * Universities an athlete can say they are interested in. This is the list of universities that offer
 * scholarships; replace it with a database list when scholarships get a backend.
 */
export const UNIVERSITY_OPTIONS: string[] = ["National University", "De La Salle University", "University of Santo Tomas", "UP Diliman"];

export const EXTRAS_LIMITS = {
  course: 80,
  photoDataUrl: 400_000, // characters; a 512px JPEG is far below this
  photoUploadBytes: 5 * 1024 * 1024,
  videoUrl: 300,
} as const;

export const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

/** "approved": passed our checks. "pending": waiting on a review. "rejected": must be replaced. */
export type MediaStatus = "approved" | "pending" | "rejected";

export interface ShowcaseMedia {
  /** photo: a small `data:image/...` URL; video: an https link */
  value: string;
  status: MediaStatus;
}

export interface ScholarshipInterests {
  universities: string[];
  coverage: CoveragePreference | "";
  course: string;
}

export interface ProfileExtras {
  scholarship: ScholarshipInterests;
  photo: ShowcaseMedia | null;
  video: ShowcaseMedia | null;
}

export const EMPTY_EXTRAS: ProfileExtras = {
  scholarship: { universities: [], coverage: "", course: "" },
  photo: null,
  video: null,
};

export type ScholarshipErrors = Partial<Record<keyof ScholarshipInterests, string>>;

export class ExtrasValidationError extends Error {
  readonly errors: Record<string, string>;
  constructor(errors: Record<string, string>) {
    super(Object.values(errors)[0] ?? "Invalid value");
    this.name = "ExtrasValidationError";
    this.errors = errors;
  }
}

// ---------- validation ----------

/**
 * Partial saves are allowed (an empty field is just "not done yet"), but anything that IS filled
 * in must be valid. Completion then counts only fields that are filled in and valid.
 */
export function validateScholarship(s: ScholarshipInterests): ScholarshipErrors {
  const e: ScholarshipErrors = {};
  if (s.universities.some((u) => !UNIVERSITY_OPTIONS.includes(u)) || new Set(s.universities).size !== s.universities.length)
    e.universities = "Choose universities from the list.";
  if (s.coverage !== "" && !(COVERAGE_OPTIONS as readonly string[]).includes(s.coverage))
    e.coverage = "Choose a coverage preference from the list.";
  if (s.course.trim().length > EXTRAS_LIMITS.course)
    e.course = `Course must be ${EXTRAS_LIMITS.course} characters or fewer.`;
  return e;
}

const VIDEO_HOSTS = ["youtube.com", "youtu.be", "vimeo.com", "facebook.com", "fb.watch"];

/** Returns an error message, or null when `raw` is an https link to a supported video site. */
export function validateVideoUrl(raw: string): string | null {
  const t = raw.trim();
  if (t.length > EXTRAS_LIMITS.videoUrl) return "That link is too long.";
  let u: URL;
  try {
    u = new URL(t);
  } catch {
    return "Enter a full link starting with https://";
  }
  if (u.protocol !== "https:") return "Enter a full link starting with https://";
  const host = u.hostname.toLowerCase().replace(/^(www|m)\./, "");
  if (!VIDEO_HOSTS.some((h) => host === h || host.endsWith(`.${h}`)))
    return "Use a YouTube, Vimeo or Facebook video link.";
  if (u.pathname.replace(/\/+$/, "") === "" && !u.search) return "Link to the video itself, not the site's home page.";
  return null;
}

/** Checks a file before it is read. Returns an error message, or null when the file is acceptable. */
export function validatePhotoFile(f: { type: string; size: number }): string | null {
  if (!(PHOTO_TYPES as readonly string[]).includes(f.type)) return "Use a JPG, PNG or WebP image.";
  if (f.size <= 0) return "That file is empty.";
  if (f.size > EXTRAS_LIMITS.photoUploadBytes) return "Photos can be up to 5 MB.";
  return null;
}

const PHOTO_DATA_URL = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/;
export function validatePhotoDataUrl(v: string): string | null {
  if (!PHOTO_DATA_URL.test(v)) return "That doesn't look like a valid image.";
  if (v.length > EXTRAS_LIMITS.photoDataUrl) return "That image is too large after resizing.";
  return null;
}

/** A media entry counts toward completion only when it is approved AND still passes its checks. */
export function isMediaUsable(kind: "photo" | "video", m: ShowcaseMedia | null): boolean {
  if (!m || m.status !== "approved") return false;
  return (kind === "photo" ? validatePhotoDataUrl(m.value) : validateVideoUrl(m.value)) === null;
}

