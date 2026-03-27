import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';

import { getMatchConfig } from '@/logic/matchConfigs';
import { launchTournamentMatch } from '@/services/tournaments';
import type { PublicTournamentSummary } from '@/src/tournaments/types';
import { useGameStore } from '@/store/useGameStore';

type TournamentLaunchable = Pick<
  PublicTournamentSummary,
  'runId' | 'tournamentId' | 'gameMode' | 'name'
>;

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

  const launchMatch = useCallback(
    async (tournament: TournamentLaunchable) => {
      setLaunchingRunId(tournament.runId);

      try {
        const result = await launchTournamentMatch(tournament.runId);

        setNakamaSession(result.session);
        setUserId(result.userId);
        setMatchToken(result.matchToken ?? null);
        setOnlineMode('nakama');
        setPlayerColor(null);
        initGame(result.matchId, {
          matchConfig: getMatchConfig(tournament.gameMode),
        });
        setSocketState('idle');

        router.push({
          pathname: '/match/[id]',
          params: {
            id: result.matchId,
            modeId: tournament.gameMode,
            tournamentRunId: result.tournamentRunId,
            tournamentId: result.tournamentId,
            tournamentName: tournament.name,
            tournamentReturnTarget: 'detail',
          },
        });
      } finally {
        setLaunchingRunId((current) => (current === tournament.runId ? null : current));
      }
    },
    [
      initGame,
      router,
      setMatchToken,
      setNakamaSession,
      setOnlineMode,
      setPlayerColor,
      setSocketState,
      setUserId,
    ],
  );

  return {
    launchingRunId,
    launchMatch,
  };
};
