import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useState } from 'react';

import {
  getPublicTournamentStatus,
  joinPublicTournament,
} from '@/services/tournaments';
import { useTournamentUiStore } from '@/src/tournaments/store';
import { useTournamentMatchLauncher } from '@/src/tournaments/useTournamentMatchLauncher';
import type { PublicTournamentDetail, PublicTournamentStanding } from '@/src/tournaments/types';

const DETAIL_POLL_INTERVAL_MS = 4_000;

export const useTournamentDetail = (runId: string | null) => {
  const [tournament, setTournament] = useState<PublicTournamentDetail | null>(null);
  const [standings, setStandings] = useState<PublicTournamentStanding[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [joiningRunId, setJoiningRunId] = useState<string | null>(null);
  const revision = useTournamentUiStore((state) => state.revision);
  const bumpRevision = useTournamentUiStore((state) => state.bumpRevision);
  const { launchingRunId, launchMatch } = useTournamentMatchLauncher();

  const refresh = useCallback(async () => {
    if (!runId) {
      setTournament(null);
      setStandings([]);
      setIsLoading(false);
      setIsRefreshing(false);
      setErrorMessage('Missing tournament id.');
      return;
    }

    setIsRefreshing(true);
    setErrorMessage(null);

    try {
      const snapshot = await getPublicTournamentStatus(runId);
      setTournament(snapshot.tournament);
      setStandings(snapshot.standings);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to load tournament detail.');
    } finally {
      setIsRefreshing(false);
      setIsLoading(false);
    }
  }, [runId]);

  useEffect(() => {
    void refresh();
  }, [refresh, revision]);

  useFocusEffect(
    useCallback(() => {
      void refresh();

      const pollId = setInterval(() => {
        void refresh();
      }, DETAIL_POLL_INTERVAL_MS);

      return () => {
        clearInterval(pollId);
      };
    }, [refresh]),
  );

  const joinTournament = useCallback(async () => {
    if (!runId) {
      return null;
    }

    setJoiningRunId(runId);
    setErrorMessage(null);

    try {
      const result = await joinPublicTournament(runId);
      setTournament(result.tournament);
      bumpRevision();
      void refresh();
      return result.tournament;
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to join tournament.');
      return null;
    } finally {
      setJoiningRunId((current) => (current === runId ? null : current));
    }
  }, [bumpRevision, refresh, runId]);

  const launchTournament = useCallback(
    async (selectedTournament: PublicTournamentDetail) => {
      setErrorMessage(null);

      try {
        await launchMatch(selectedTournament);
        return true;
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Unable to launch tournament match.');
        return false;
      }
    },
    [launchMatch],
  );

  return {
    tournament,
    standings,
    isLoading,
    isRefreshing,
    errorMessage,
    joiningRunId,
    launchingRunId,
    refresh,
    joinTournament,
    launchMatch: launchTournament,
  };
};
