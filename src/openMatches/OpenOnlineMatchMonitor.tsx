import { isNakamaEnabled } from '@/config/nakama';
import { getActiveOpenOnlineMatch } from '@/services/matchmaking';
import { resolveGameModeMatchConfig } from '@/services/gameModes';
import { useAuth } from '@/src/auth/useAuth';
import { buildMatchRoutePath } from '@/src/match/buildMatchRoutePath';
import { useScreenTransition } from '@/src/transitions/ScreenTransitionContext';
import { useGameStore } from '@/store/useGameStore';
import { nakamaService } from '@/services/nakama';
import { usePathname, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

const OPEN_ONLINE_MATCH_POLL_INTERVAL_MS = 5_000;

const isAlreadyOnMatchRoute = (pathname: string, matchId: string): boolean =>
  pathname === `/match/${matchId}` || pathname.endsWith(`/match/${matchId}`);

export const OpenOnlineMatchMonitor: React.FC = () => {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const runScreenTransition = useScreenTransition();
  const pathnameRef = useRef(pathname);
  const dispatchInFlightRef = useRef<string | null>(null);
  const lastHandledMatchIdRef = useRef<string | null>(null);
  const disposedRef = useRef(false);

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  const openMatchedGame = useCallback(
    async () => {
      if (disposedRef.current || isLoading || !user || !isNakamaEnabled()) {
        return;
      }

      const activeMatch = await getActiveOpenOnlineMatch();
      if (
        !activeMatch ||
        (!(activeMatch.isCreator || activeMatch.isJoiner)) ||
        activeMatch.status !== 'matched'
      ) {
        lastHandledMatchIdRef.current = null;
        return;
      }

      if (isAlreadyOnMatchRoute(pathnameRef.current, activeMatch.matchId)) {
        lastHandledMatchIdRef.current = activeMatch.matchId;
        return;
      }

      if (
        dispatchInFlightRef.current === activeMatch.matchId ||
        lastHandledMatchIdRef.current === activeMatch.matchId
      ) {
        return;
      }

      const currentGame = useGameStore.getState();
      const isUnfinishedLocalMatch =
        currentGame.onlineMode === 'offline' &&
        currentGame.matchId?.startsWith('local-') &&
        currentGame.gameState.winner === null &&
        currentGame.gameState.phase !== 'ended';

      if (currentGame.onlineMode === 'nakama' && currentGame.matchId !== activeMatch.matchId) {
        return;
      }

      dispatchInFlightRef.current = activeMatch.matchId;

      try {
        const session = await nakamaService.ensureAuthenticatedDevice();
        if (!session.user_id) {
          throw new Error('Authenticated session is missing user ID.');
        }
        const sessionUserId = session.user_id;

        const store = useGameStore.getState();
        if (isUnfinishedLocalMatch) {
          store.reset();
        }

        const matchConfig = await resolveGameModeMatchConfig(activeMatch.modeId, {
          allowsXp: true,
          allowsChallenges: true,
          allowsCoins: true,
          allowsOnline: true,
          allowsRankedStats: true,
          isPracticeMode: false,
        });

        const completeLaunch = () => {
          const nextStore = useGameStore.getState();
          nextStore.setNakamaSession(session);
          nextStore.setUserId(sessionUserId);
          nextStore.setMatchToken(null);
          nextStore.setOnlineMode('nakama');
          nextStore.setPlayerColor(null);
          nextStore.initGame(activeMatch.matchId, {
            matchConfig,
          });
          nextStore.setSocketState('idle');
          router.replace(buildMatchRoutePath({ id: activeMatch.matchId, modeId: activeMatch.modeId }) as never);
        };

        const didStart = await runScreenTransition({
          title:
            activeMatch.isCreator ? 'Opponent Joined' : 'Returning to Table',
          message:
            activeMatch.isCreator
              ? 'Your wager match is ready. Opening the board now.'
              : 'Your wager match is ready. Reopening the board now.',
          variant: 'success',
          preActionDelayMs: 700,
          postActionDelayMs: 180,
          action: completeLaunch,
        });

        if (!didStart) {
          completeLaunch();
        }

        lastHandledMatchIdRef.current = activeMatch.matchId;
      } finally {
        if (dispatchInFlightRef.current === activeMatch.matchId) {
          dispatchInFlightRef.current = null;
        }
      }
    },
    [isLoading, router, runScreenTransition, user],
  );

  useEffect(() => {
    disposedRef.current = false;

    if (isLoading || !user) {
      dispatchInFlightRef.current = null;
      lastHandledMatchIdRef.current = null;
      return undefined;
    }

    void openMatchedGame();
    const intervalId = setInterval(() => {
      void openMatchedGame();
    }, OPEN_ONLINE_MATCH_POLL_INTERVAL_MS);

    return () => {
      clearInterval(intervalId);
    };
  }, [isLoading, openMatchedGame, user]);

  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        void openMatchedGame();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, [openMatchedGame]);

  useEffect(() => {
    return () => {
      disposedRef.current = true;
    };
  }, []);

  return null;
};
