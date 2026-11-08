import { useEffect, useState } from "react";
import { listUniversities } from "@/lib/scholarshipsApi";

/**
 * Universities an athlete can pick: the ones that currently have an open scholarship. Anything the
 * athlete already picked stays in the list, so a saved choice never disappears from the form.
 */
export function useUniversityOptions(selected: readonly string[]): { options: string[]; loading: boolean } {
  const [fetched, setFetched] = useState<string[] | null>(null);
  useEffect(() => {
    const ctrl = new AbortController();
    void listUniversities(ctrl.signal).then((r) => {
      if (!ctrl.signal.aborted) setFetched(r.ok ? r.data.items : []);
    });
    return () => ctrl.abort();
  }, []);
  const options = [...new Set([...(fetched ?? []), ...selected])].sort((a, b) => a.localeCompare(b));
  return { options, loading: fetched === null };
}
