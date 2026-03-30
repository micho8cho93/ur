import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { joinPublicTournament, listPublicTournaments } from '@/services/tournaments';
import {
  isTournamentVisibleForPlay,
  sortPublicTournamentsForPlay,
} from '@/src/tournaments/presentation';
import { useTournamentUiStore } from '@/src/tournaments/store';
import { useTournamentMatchLauncher } from '@/src/tournaments/useTournamentMatchLauncher';
import type { PublicTournamentSummary } from '@/src/tournaments/types';

type UseTournamentListOptions = {
  featured?: boolean;
  limit?: number;
};

const LIST_POLL_INTERVAL_MS = 10_000;

export const useTournamentList = ({ featured = false, limit = 50 }: UseTournamentListOptions = {}) => {
  const [tournaments, setTournaments] = useState<PublicTournamentSummary[]>([]);
  const [now, setNow] = useState(() => Date.now());
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
      setNow(Date.now());
      setTournaments(nextTournaments);
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

      const pollId = setInterval(() => {
        void refresh();
      }, LIST_POLL_INTERVAL_MS);

      return () => {
        clearInterval(pollId);
      };
    }, [refresh]),
  );

  useEffect(() => {
    const nextExpiry = tournaments
      .map((tournament) => {
        if (tournament.lifecycle !== 'open') {
          return null;
        }

        const candidateTimes = [tournament.endAt, tournament.lobbyDeadlineAt]
          .filter((value): value is string => typeof value === 'string' && value.length > 0)
          .map((value) => Date.parse(value))
          .filter((value) => Number.isFinite(value))
          .map((value) => (value > now ? value : Date.now()));

        if (candidateTimes.length === 0) {
          return null;
        }

        return Math.min(...candidateTimes);
      })
      .reduce<number | null>((soonest, current) => {
        if (current === null) {
          return soonest;
        }

        if (soonest === null) {
          return current;
        }

        return Math.min(soonest, current);
      }, null);

    if (nextExpiry === null) {
      return undefined;
    }

    const timeoutId = setTimeout(() => {
      setNow(Date.now());
      void refresh();
    }, Math.max(0, nextExpiry - Date.now() + 250));

    return () => {
      clearTimeout(timeoutId);
    };
  }, [now, refresh, tournaments]);

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
    () => {
      const visibleTournaments = sortPublicTournamentsForPlay(
        tournaments.filter((tournament) => isTournamentVisibleForPlay(tournament, now)),
      );
      return featured ? visibleTournaments.slice(0, 3) : visibleTournaments;
    },
    [featured, now, tournaments],
  );

  const launchTournament = useCallback(
    async (tournament: PublicTournamentSummary) => {
      setErrorMessage(null);

      try {
        await launchMatch(tournament);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Unable to launch tournament match.');
      }
    },
    [launchMatch],
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
    launchMatch: launchTournament,
  };
};
