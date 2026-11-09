import { useEffect, useState } from "react";
import { useSessions } from "@/lib/sessionStore";
import { fetchHeadline } from "@/lib/rankingsApi";

/**
 * The signed-in athlete's own nationwide rank in their sport's headline metric, from the server
 * (real sessions, same rules as the Rankings page). Undefined until loaded or when not ranked yet.
 * It is fetched again whenever the athlete's sessions change.
 */
export function useMyHeadlineRank(): number | undefined {
  const sessions = useSessions();
  const [rank, setRank] = useState<number | undefined>(undefined);
  useEffect(() => {
    const ctrl = new AbortController();
    void fetchHeadline([], ctrl.signal).then((r) => {
      if (!ctrl.signal.aborted) setRank(r.ok ? (r.data.me?.position ?? undefined) : undefined);
    });
    return () => ctrl.abort();
  }, [sessions]);
  return rank;
}
