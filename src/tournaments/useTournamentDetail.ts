import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useRef, useState } from 'react';

import {
  getPublicTournamentStatus,
  joinPublicTournament,
} from '@/services/tournaments';
import { nakamaService } from '@/services/nakama';
import {
  TOURNAMENT_BRACKET_READY_NOTIFICATION_CODE,
  TOURNAMENT_BRACKET_READY_NOTIFICATION_SUBJECT,
  isTournamentBracketReadyNotificationContent,
} from '@/shared/tournamentNotifications';
import { useTournamentUiStore } from '@/src/tournaments/store';
import { useTournamentMatchLauncher } from '@/src/tournaments/useTournamentMatchLauncher';
import type { PublicTournamentDetail, PublicTournamentStanding } from '@/src/tournaments/types';
import type { Notification, Socket } from '@heroiclabs/nakama-js';

const DETAIL_POLL_INTERVAL_MS = 4_000;
const TOURNAMENT_SOCKET_NOTIFICATION_RETRY_DELAY_MS = 800;
const NOOP_NOTIFICATION_HANDLER = () => {};

export const useTournamentDetail = (runId: string | null) => {
  const [tournament, setTournament] = useState<PublicTournamentDetail | null>(null);
  const [standings, setStandings] = useState<PublicTournamentStanding[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [joiningRunId, setJoiningRunId] = useState<string | null>(null);
  const isMountedRef = useRef(true);
  const refreshSequenceRef = useRef(0);
  const revision = useTournamentUiStore((state) => state.revision);
  const bumpRevision = useTournamentUiStore((state) => state.bumpRevision);
  const { launchingRunId, launchMatch } = useTournamentMatchLauncher();

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    const refreshSequence = refreshSequenceRef.current + 1;
    refreshSequenceRef.current = refreshSequence;

    if (!runId) {
      if (!isMountedRef.current || refreshSequence !== refreshSequenceRef.current) {
        return;
      }
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
      if (!isMountedRef.current || refreshSequence !== refreshSequenceRef.current) {
        return;
      }
      setTournament(snapshot.tournament);
      setStandings(snapshot.standings);
    } catch (error) {
      if (!isMountedRef.current || refreshSequence !== refreshSequenceRef.current) {
        return;
      }
      setErrorMessage(error instanceof Error ? error.message : 'Unable to load tournament detail.');
    } finally {
      if (!isMountedRef.current || refreshSequence !== refreshSequenceRef.current) {
        return;
      }
      setIsRefreshing(false);
      setIsLoading(false);
    }
  }, [runId]);

  useEffect(() => {
    void refresh();
  }, [refresh, revision]);

  useEffect(() => {
    if (!runId) {
      return;
    }

    let isDisposed = false;
    let attachedSocket: Socket | null = null;
    let previousOnNotification: ((notification: Notification) => void) | null = null;

    const handleTournamentNotification = (notification: Notification) => {
      previousOnNotification?.(notification);

      const isTournamentBracketReadyNotification =
        notification.code === TOURNAMENT_BRACKET_READY_NOTIFICATION_CODE ||
        notification.subject === TOURNAMENT_BRACKET_READY_NOTIFICATION_SUBJECT;

      if (!isTournamentBracketReadyNotification) {
        return;
      }

      if (!isTournamentBracketReadyNotificationContent(notification.content)) {
        return;
      }

      if (notification.content.runId !== runId) {
        return;
      }

      void refresh();
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
        socket.onnotification = handleTournamentNotification;
      } catch {
        // Tournament detail should still function through polling when socket notifications are unavailable.
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
    };
  }, [refresh, runId]);

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
