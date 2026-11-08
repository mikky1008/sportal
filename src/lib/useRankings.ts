import { useMemo } from "react";
import {
  competitorResults,
  competitorSessions,
  directoryAthletes,
  currentAthlete,
} from "@/data/mock";
import { useSessions } from "@/lib/sessionStore";
import { useAthleteProfile, withProfile } from "@/lib/profileStore";
import { buildCandidates, headlineRanks, type RankingCandidate } from "@/lib/rankings";

/** Every athlete that can appear in rankings, with the signed-in athlete's live sessions and profile. */
export function useRankingCandidates(): RankingCandidate[] {
  const sessions = useSessions();
  const profile = useAthleteProfile();
  return useMemo(
    () =>
      buildCandidates({
        directory: directoryAthletes.map((a) => withProfile(a, profile)),
        currentUserId: currentAthlete.id,
        currentUserSessions: sessions,
        sessionsByAthlete: competitorSessions,
        resultsByAthlete: competitorResults,
      }),
    [sessions, profile],
  );
}

/** The signed-in athlete's own nationwide rank. They appear in the sample pool as the entry `currentAthlete.id` until the directory comes from the API. */
export function useMyHeadlineRank(): number | undefined {
  return useHeadlineRanks().get(currentAthlete.id);
}

/** Nationwide headline rank for an athlete, or null when they don't have enough counted sessions. */
export function useHeadlineRanks(): Map<string, number> {
  const candidates = useRankingCandidates();
  return useMemo(() => headlineRanks(candidates), [candidates]);
}
