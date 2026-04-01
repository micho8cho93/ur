import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Session } from '@heroiclabs/nakama-js';

import { getMatchConfig } from '@/logic/matchConfigs';
import { launchTournamentMatch } from '@/services/tournaments';
import { useScreenTransition } from '@/src/transitions/ScreenTransitionContext';
import type { PublicTournamentSummary, TournamentMatchLaunchResult } from '@/src/tournaments/types';
import { useGameStore } from '@/store/useGameStore';

type TournamentLaunchable = Pick<
  PublicTournamentSummary,
  'runId' | 'tournamentId' | 'gameMode' | 'name'
>;

type TournamentLaunchNavigationMode = 'push' | 'replace';

type FinalizeMatchLaunchOptions = {
  navigationMode?: TournamentLaunchNavigationMode;
  returnTarget?: string;
};

const MATCH_ENTRY_PRE_DELAY_MS = 980;
const MATCH_ENTRY_POST_DELAY_MS = 260;

export const useTournamentMatchLauncher = () => {
  const router = useRouter();
  const [launchingRunId, setLaunchingRunId] = useState<string | null>(null);
  const initGame = useGameStore((state) => state.initGame);
  const setNakamaSession = useGameStore((state) => state.setNakamaSession);
  const setUserId = useGameStore((state) => state.setUserId);
  const setMatchToken = useGameStore((state) => state.setMatchToken);
  const setSocketState = useGameStore((state) => state.setSocketState);
  const setOnlineMode = useGameStore((state) => state.setOnlineMode);
  const setPlayerColor = useGameStore((state) => state.setPlayerColor);
  const runScreenTransition = useScreenTransition();

  const finalizeMatchLaunch = useCallback(
    async (
      tournament: TournamentLaunchable,
      result: TournamentMatchLaunchResult & { session: Session; userId: string },
      options?: FinalizeMatchLaunchOptions,
    ) => {
      const navigationMode = options?.navigationMode ?? 'push';
      const navigate = navigationMode === 'replace' ? router.replace : router.push;
      const completeLaunch = () => {
        setNakamaSession(result.session);
        setUserId(result.userId);
        setMatchToken(result.matchToken ?? null);
        setOnlineMode('nakama');
        setPlayerColor(null);
        initGame(result.matchId, {
          matchConfig: getMatchConfig(tournament.gameMode),
        });
        setSocketState('idle');

        navigate({
          pathname: '/match/[id]',
          params: {
            id: result.matchId,
            modeId: tournament.gameMode,
            tournamentRunId: result.tournamentRunId,
            tournamentId: result.tournamentId,
            tournamentName: tournament.name,
            tournamentReturnTarget: options?.returnTarget ?? 'detail',
            ...(typeof result.tournamentRound === 'number' ? { tournamentRound: String(result.tournamentRound) } : {}),
            ...(result.tournamentEntryId ? { tournamentEntryId: result.tournamentEntryId } : {}),
          },
        });
      };

      const didStart = await runScreenTransition({
        title: 'Preparing Next Board',
        message: 'Carrying your tournament seat into the next match.',
        variant: 'success',
        preActionDelayMs: MATCH_ENTRY_PRE_DELAY_MS,
        postActionDelayMs: MATCH_ENTRY_POST_DELAY_MS,
        action: completeLaunch,
      });

      if (!didStart) {
        completeLaunch();
      }
    },
    [
      initGame,
      router.push,
      router.replace,
      runScreenTransition,
      setMatchToken,
      setNakamaSession,
      setOnlineMode,
      setPlayerColor,
      setSocketState,
      setUserId,
    ],
  );

  const launchMatch = useCallback(
    async (tournament: TournamentLaunchable) => {
      setLaunchingRunId(tournament.runId);

      try {
        const result = await launchTournamentMatch(tournament.runId);
        if (!result.matchId) {
          throw new Error(result.statusMessage ?? 'Tournament match is not ready yet.');
        }
        await finalizeMatchLaunch(tournament, result, {
          navigationMode: 'push',
          returnTarget: 'detail',
        });
        return result;
      } finally {
        setLaunchingRunId((current) => (current === tournament.runId ? null : current));
      }
    },
    [finalizeMatchLaunch],
  );

  return {
    launchingRunId,
    finalizeMatchLaunch,
    launchMatch,
  };
};
