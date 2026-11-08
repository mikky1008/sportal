// Athlete profile data that the Settings form does not hold: scholarship interests and the profile
// showcase (photo + highlight video link). Loaded from and saved to the API (/api/athletes/me/extras).
//
// There is no moderation service yet, so "approved" means "passed the checks in
// athleteExtrasRules.ts" (the same checks the server runs). A reviewer could later mark an item
// "rejected", which never counts toward completion.

import { useSyncExternalStore } from "react";
import { apiRequest, type ApiResult } from "@/auth/authClient";
import {
  EMPTY_EXTRAS, ExtrasValidationError, validatePhotoDataUrl, validateScholarship, validateVideoUrl,
  type ProfileExtras, type ScholarshipInterests,
} from "@/lib/athleteExtrasRules";

export * from "@/lib/athleteExtrasRules";

export type ExtrasLoadState = "idle" | "loading" | "ready" | "error";

type Res = ApiResult<{ extras: ProfileExtras }>;

export interface ExtrasApi {
  get(): Promise<Res>;
  saveScholarship(s: ScholarshipInterests): Promise<Res>;
  setPhoto(dataUrl: string): Promise<Res>;
  removePhoto(): Promise<Res>;
  setVideo(url: string): Promise<Res>;
  removeVideo(): Promise<Res>;
}

const base = "/api/athletes/me/extras";
const httpApi: ExtrasApi = {
  get: () => apiRequest<{ extras: ProfileExtras }>(base),
  saveScholarship: (s) => apiRequest<{ extras: ProfileExtras }>(`${base}/scholarship`, { method: "PUT", body: s }),
  setPhoto: (dataUrl) => apiRequest<{ extras: ProfileExtras }>(`${base}/photo`, { method: "PUT", body: { dataUrl } }),
  removePhoto: () => apiRequest<{ extras: ProfileExtras }>(`${base}/photo`, { method: "DELETE" }),
  setVideo: (url) => apiRequest<{ extras: ProfileExtras }>(`${base}/video`, { method: "PUT", body: { url } }),
  removeVideo: () => apiRequest<{ extras: ProfileExtras }>(`${base}/video`, { method: "DELETE" }),
};

interface State { extras: ProfileExtras; load: ExtrasLoadState; loadError: string | null }

export function createProfileExtrasStore(api: ExtrasApi = httpApi) {
  const listeners = new Set<() => void>();
  let generation = 0;
  const fresh = (): State => ({ extras: EMPTY_EXTRAS, load: "idle", loadError: null });
  let state: State = fresh();
  const set = (next: State) => {
    state = next;
    listeners.forEach((l) => l());
  };

  /** Runs one write. Server field errors become ExtrasValidationError; anything else is a plain Error. */
  async function write(call: () => Promise<Res>): Promise<ProfileExtras> {
    const mine = generation;
    const res = await call();
    if (!res.ok) {
      if (res.fieldErrors) throw new ExtrasValidationError(res.fieldErrors);
      throw new Error(res.message);
    }
    if (mine === generation) set({ extras: res.data.extras, load: "ready", loadError: null });
    return res.data.extras;
  }

  return {
    getSnapshot: () => state.extras,
    getServerSnapshot: () => EMPTY_EXTRAS,
    getLoadSnapshot: () => state.load,
    getServerLoadSnapshot: (): ExtrasLoadState => "idle",
    subscribe(l: () => void) {
      listeners.add(l);
      return () => {
        listeners.delete(l);
      };
    },

    /** Forget everything (sign in, sign out, new account). */
    refresh() {
      generation++;
      set(fresh());
    },

    /** Loads the signed-in athlete's extras. Call it only for student-athlete accounts. */
    async load(): Promise<void> {
      const mine = ++generation;
      set({ ...state, load: "loading", loadError: null });
      const res = await api.get();
      if (mine !== generation) return;
      if (res.ok) set({ extras: res.data.extras, load: "ready", loadError: null });
      else set({ ...state, load: "error", loadError: res.message });
    },

    /** Validates and saves. Throws ExtrasValidationError (nothing is saved) when anything is invalid. */
    async saveScholarship(draft: ScholarshipInterests): Promise<ProfileExtras> {
      const errors = validateScholarship(draft);
      if (Object.keys(errors).length) throw new ExtrasValidationError(errors as Record<string, string>);
      return write(() => api.saveScholarship({ universities: [...draft.universities], coverage: draft.coverage, course: draft.course.trim() }));
    },

    /** `dataUrl` should be the already-resized image. Invalid images are refused and nothing changes. */
    async setPhoto(dataUrl: string): Promise<ProfileExtras> {
      const err = validatePhotoDataUrl(dataUrl);
      if (err) throw new ExtrasValidationError({ photo: err });
      return write(() => api.setPhoto(dataUrl));
    },
    removePhoto: () => write(() => api.removePhoto()),

    async setVideo(url: string): Promise<ProfileExtras> {
      const err = validateVideoUrl(url);
      if (err) throw new ExtrasValidationError({ video: err });
      return write(() => api.setVideo(url.trim()));
    },
    removeVideo: () => write(() => api.removeVideo()),
  };
}

export const profileExtrasStore = createProfileExtrasStore();

export function useProfileExtras(): ProfileExtras {
  return useSyncExternalStore(profileExtrasStore.subscribe, profileExtrasStore.getSnapshot, profileExtrasStore.getServerSnapshot);
}

export function useExtrasLoad(): ExtrasLoadState {
  return useSyncExternalStore(profileExtrasStore.subscribe, profileExtrasStore.getLoadSnapshot, profileExtrasStore.getServerLoadSnapshot);
}
