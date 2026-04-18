import { getActiveTournamentFlow } from '@/services/tournaments';
import { nakamaService } from '@/services/nakama';
import { useAuth } from '@/src/auth/useAuth';
import { useTournamentMatchLauncher } from '@/src/tournaments/useTournamentMatchLauncher';
import type { ActiveTournamentFlow } from '@/src/tournaments/types';
import { useGameStore } from '@/store/useGameStore';
import { usePathname, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

const TOURNAMENT_FLOW_POLL_INTERVAL_MS = 5_000;

const getDestinationKey = (flow: ActiveTournamentFlow | null): string | null => {
  const destination = flow?.pendingDestination;
  if (!flow || !destination) {
    return null;
  }

  if (destination.type === 'match') {
    return `match:${flow.runId}:${destination.matchId}`;
  }

  return `waiting_room:${flow.runId}:${destination.round ?? 'unknown'}`;
};

const isAlreadyOnMatchRoute = (pathname: string, matchId: string): boolean =>
  pathname === `/match/${matchId}` || pathname.endsWith(`/match/${matchId}`);

export const TournamentFlowMonitor: React.FC = () => {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { finalizeMatchLaunch } = useTournamentMatchLauncher();
  const lastHandledDestinationRef = useRef<string | null>(null);
  const dispatchInFlightRef = useRef<string | null>(null);
  const disposedRef = useRef(false);
  const pathnameRef = useRef(pathname);

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  const handleFlow = useCallback(
    async (flow: ActiveTournamentFlow | null) => {
      const destinationKey = getDestinationKey(flow);

      if (!flow || !flow.pendingDestination || !destinationKey) {
        lastHandledDestinationRef.current = null;
        return;
      }

      if (dispatchInFlightRef.current === destinationKey) {
        return;
      }

      const destination = flow.pendingDestination;

      if (destination.type === 'waiting_room') {
        const currentPathname = pathnameRef.current;
        const isOnWaitingRoom = currentPathname === '/tournaments/waiting' || currentPathname.endsWith('/tournaments/waiting');
        // The old flow only redirected from tournament screens. This monitor treats
        // the backend destination as authoritative no matter where the user wandered.
        if (lastHandledDestinationRef.current === destinationKey && isOnWaitingRoom) {
          return;
        }

        if (!isOnWaitingRoom) {
          router.replace({
            pathname: '/tournaments/waiting',
            params: {
              runId: flow.runId,
              tournamentId: flow.tournamentId,
              round: destination.round == null ? undefined : String(destination.round),
            },
          } as never);
        }

        lastHandledDestinationRef.current = destinationKey;
        return;
      }

      if (isAlreadyOnMatchRoute(pathnameRef.current, destination.matchId)) {
        lastHandledDestinationRef.current = destinationKey;
        return;
      }

      dispatchInFlightRef.current = destinationKey;

      try {
        const session = await nakamaService.ensureAuthenticatedDevice();
        if (!session.user_id) {
          throw new Error('Authenticated session is missing user ID.');
        }

        const currentGame = useGameStore.getState();
        if (
          currentGame.onlineMode === 'offline' &&
          currentGame.matchId?.startsWith('local-') &&
          currentGame.gameState.winner === null &&
          currentGame.gameState.phase !== 'ended'
        ) {
          currentGame.reset();
        }

        await finalizeMatchLaunch(
          {
            runId: flow.runId,
            tournamentId: flow.tournamentId,
            gameMode: flow.gameMode,
            name: flow.tournamentName,
          },
          {
            matchId: destination.matchId,
            matchToken: null,
            tournamentRunId: flow.runId,
            tournamentId: flow.tournamentId,
            tournamentRound: destination.round ?? flow.currentRound,
            tournamentEntryId: null,
            playerState: flow.state,
            nextRoundReady: true,
            statusMessage: 'Tournament match ready.',
            queueStatus: 'active_match',
            statusMetadata: {
              source: 'active_tournament_flow',
            },
            session,
            userId: session.user_id,
          },
          {
            navigationMode: 'replace',
            returnTarget: 'waiting_room',
          },
        );

        lastHandledDestinationRef.current = destinationKey;
      } finally {
        if (dispatchInFlightRef.current === destinationKey) {
          dispatchInFlightRef.current = null;
        }
      }
    },
    [finalizeMatchLaunch, router],
  );

  const refreshFlow = useCallback(async () => {
    if (disposedRef.current || isLoading || !user) {
      return;
    }

    try {
      const flow = await getActiveTournamentFlow();
      if (disposedRef.current) {
        return;
      }

      await handleFlow(flow);
    } catch {
      // The monitor is a recovery loop. A failed tick should not interrupt normal app flow.
    }
  }, [handleFlow, isLoading, user]);

  useEffect(() => {
    disposedRef.current = false;

    if (isLoading || !user) {
      lastHandledDestinationRef.current = null;
      dispatchInFlightRef.current = null;
      return undefined;
    }

    void refreshFlow();
    const interval = setInterval(() => {
      void refreshFlow();
    }, TOURNAMENT_FLOW_POLL_INTERVAL_MS);

    return () => {
      clearInterval(interval);
    };
  }, [isLoading, refreshFlow, user]);

  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        void refreshFlow();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, [refreshFlow]);

  useEffect(() => {
    return () => {
      disposedRef.current = true;
    };
  }, []);

  return null;
};
