import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { joinPublicTournament, listPublicTournaments } from '@/services/tournaments';
import { sortPublicTournamentsForPlay } from '@/src/tournaments/presentation';
import { useTournamentUiStore } from '@/src/tournaments/store';
import { useTournamentMatchLauncher } from '@/src/tournaments/useTournamentMatchLauncher';
import type { PublicTournamentSummary } from '@/src/tournaments/types';

type UseTournamentListOptions = {
  featured?: boolean;
  limit?: number;
};

export const useTournamentList = ({ featured = false, limit = 50 }: UseTournamentListOptions = {}) => {
  const [tournaments, setTournaments] = useState<PublicTournamentSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [joiningRunId, setJoiningRunId] = useState<string | null>(null);
  const revision = useTournamentUiStore((state) => state.revision);
  const bumpRevision = useTournamentUiStore((state) => state.bumpRevision);
  const { launchingRunId, launchMatch } = useTournamentMatchLauncher();

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    setErrorMessage(null);

    try {
      const nextTournaments = await listPublicTournaments(limit);
      setTournaments(sortPublicTournamentsForPlay(nextTournaments));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to load tournaments.');
    } finally {
      setIsRefreshing(false);
      setIsLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    void refresh();
  }, [refresh, revision]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const joinTournament = useCallback(
    async (runId: string) => {
      setJoiningRunId(runId);
      setErrorMessage(null);

      try {
        const result = await joinPublicTournament(runId);
        setTournaments((current) =>
          current.map((tournament) => (tournament.runId === runId ? result.tournament : tournament)),
        );
        bumpRevision();
        void refresh();
        return result.tournament;
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Unable to join tournament.');
        return null;
      } finally {
        setJoiningRunId((current) => (current === runId ? null : current));
      }
    },
    [bumpRevision, refresh],
  );

  const displayedTournaments = useMemo(
    () => (featured ? tournaments.slice(0, 3) : tournaments),
    [featured, tournaments],
  );

  return {
    tournaments: displayedTournaments,
    isLoading,
    isRefreshing,
    errorMessage,
    joiningRunId,
    launchingRunId,
    refresh,
    joinTournament,
    launchMatch,
  };
};
