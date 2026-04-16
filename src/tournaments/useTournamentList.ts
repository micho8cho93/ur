import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { nakamaService } from '@/services/nakama';
import {
  TOURNAMENT_BRACKET_READY_NOTIFICATION_CODE,
  TOURNAMENT_BRACKET_READY_NOTIFICATION_SUBJECT,
  isTournamentBracketReadyNotificationContent,
} from '@/shared/tournamentNotifications';
import { joinPublicTournament, listPublicTournaments } from '@/services/tournaments';
import {
  isTournamentVisibleForPlay,
  sortPublicTournamentsForPlay,
} from '@/src/tournaments/presentation';
import { useTournamentUiStore } from '@/src/tournaments/store';
import { useTournamentMatchLauncher } from '@/src/tournaments/useTournamentMatchLauncher';
import type { PublicTournamentSummary } from '@/src/tournaments/types';
import type { Notification, Socket } from '@heroiclabs/nakama-js';

type UseTournamentListOptions = {
  featured?: boolean;
  limit?: number;
};

const LIST_POLL_INTERVAL_MS = 10_000;
const TOURNAMENT_SOCKET_NOTIFICATION_RETRY_DELAY_MS = 800;
const NOOP_NOTIFICATION_HANDLER = () => {};
const NOOP_DISCONNECT_HANDLER = () => {};

export const useTournamentList = ({ featured = false, limit = 50 }: UseTournamentListOptions = {}) => {
  const [tournaments, setTournaments] = useState<PublicTournamentSummary[]>([]);
  const [now, setNow] = useState(() => Date.now());
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [joiningRunId, setJoiningRunId] = useState<string | null>(null);
  const [isSocketNotificationAvailable, setIsSocketNotificationAvailable] = useState(false);
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

  useEffect(() => {
    setIsSocketNotificationAvailable(false);

    let isDisposed = false;
    let attachedSocket: Socket | null = null;
    let previousOnNotification: ((notification: Notification) => void) | null = null;
    let previousOnDisconnect: ((event: Event) => void) | null = null;

    const handleTournamentNotification = (notification: Notification) => {
      previousOnNotification?.(notification);

      if (isDisposed) {
        return;
      }

      const isTournamentBracketReadyNotification =
        notification.code === TOURNAMENT_BRACKET_READY_NOTIFICATION_CODE ||
        notification.subject === TOURNAMENT_BRACKET_READY_NOTIFICATION_SUBJECT;

      if (!isTournamentBracketReadyNotification) {
        return;
      }

      if (!isTournamentBracketReadyNotificationContent(notification.content)) {
        return;
      }

      void refresh();
    };

    const handleSocketDisconnect = (event: Event) => {
      previousOnDisconnect?.(event);

      if (isDisposed) {
        return;
      }

      setIsSocketNotificationAvailable(false);
    };

    const attachSocketNotificationListener = async () => {
      try {
        const socket = await nakamaService.connectSocketWithRetry({
          attempts: 2,
          retryDelayMs: TOURNAMENT_SOCKET_NOTIFICATION_RETRY_DELAY_MS,
          createStatus: true,
        });

        if (isDisposed) {
          return;
        }

        attachedSocket = socket;
        previousOnNotification = socket.onnotification ?? null;
        previousOnDisconnect = socket.ondisconnect ?? null;
        socket.onnotification = handleTournamentNotification;
        socket.ondisconnect = handleSocketDisconnect;
        setIsSocketNotificationAvailable(true);
      } catch {
        if (isDisposed) {
          return;
        }
        setIsSocketNotificationAvailable(false);
      }
    };

    void attachSocketNotificationListener();

    return () => {
      isDisposed = true;
      if (!attachedSocket) {
        return;
      }

      if (attachedSocket.onnotification === handleTournamentNotification) {
        attachedSocket.onnotification = previousOnNotification ?? NOOP_NOTIFICATION_HANDLER;
      }

      if (attachedSocket.ondisconnect === handleSocketDisconnect) {
        attachedSocket.ondisconnect = previousOnDisconnect ?? NOOP_DISCONNECT_HANDLER;
      }
    };
  }, [refresh]);

  useFocusEffect(
    useCallback(() => {
      void refresh();

      if (isSocketNotificationAvailable) {
        return undefined;
      }

      const pollId = setInterval(() => {
        void refresh();
      }, LIST_POLL_INTERVAL_MS);

      return () => {
        clearInterval(pollId);
      };
    }, [isSocketNotificationAvailable, refresh]),
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
