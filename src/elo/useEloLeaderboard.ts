import { useCallback, useEffect, useState } from 'react';

import {
  EloLeaderboardAroundMeRpcResponse,
  EloLeaderboardRpcResponse,
  EloRatingProfileRpcResponse,
} from '@/shared/elo';
import { getEloLeaderboardAroundMe, getMyRatingProfile, listTopEloPlayers } from '@/services/elo';
import { useAuth } from '@/src/auth/useAuth';

export type EloLeaderboardStatus = 'idle' | 'loading' | 'ready' | 'error';

type UseEloLeaderboardOptions = {
  topLimit?: number;
  aroundMeLimit?: number;
};

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : 'Unable to load the Elo leaderboard right now.';

export const useEloLeaderboard = (options: UseEloLeaderboardOptions = {}) => {
  const { user, isLoading: isAuthLoading, isUsernameOnboardingLoading, isUsernameOnboardingRequired } = useAuth();
  const [topLeaderboard, setTopLeaderboard] = useState<EloLeaderboardRpcResponse | null>(null);
  const [aroundMeLeaderboard, setAroundMeLeaderboard] = useState<EloLeaderboardAroundMeRpcResponse | null>(null);
  const [myProfile, setMyProfile] = useState<EloRatingProfileRpcResponse | null>(null);
  const [status, setStatus] = useState<EloLeaderboardStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const canAccessElo =
    Boolean(user) &&
    user?.provider === 'google' &&
    !isUsernameOnboardingLoading &&
    !isUsernameOnboardingRequired;

  const refresh = useCallback(async (): Promise<void> => {
    if (!canAccessElo) {
      setTopLeaderboard(null);
      setAroundMeLeaderboard(null);
      setMyProfile(null);
      setStatus('idle');
      setErrorMessage(null);
      return;
    }

    setStatus('loading');
    setErrorMessage(null);

    try {
      const [nextMyProfile, nextTopLeaderboard, nextAroundMeLeaderboard] = await Promise.all([
        getMyRatingProfile(),
        listTopEloPlayers({ limit: options.topLimit ?? 25 }),
        getEloLeaderboardAroundMe({ limit: options.aroundMeLimit ?? 11 }),
      ]);

      setMyProfile(nextMyProfile);
      setTopLeaderboard(nextTopLeaderboard);
      setAroundMeLeaderboard(nextAroundMeLeaderboard);
      setStatus('ready');
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
      setStatus('error');
    }
  }, [canAccessElo, options.aroundMeLimit, options.topLimit]);

  useEffect(() => {
    if (isAuthLoading || isUsernameOnboardingLoading) {
      return;
    }

    void refresh();
  }, [isAuthLoading, isUsernameOnboardingLoading, refresh, user?.id]);

  return {
    topLeaderboard,
    aroundMeLeaderboard,
    myProfile,
    status,
    errorMessage,
    isLoading: status === 'loading' && !topLeaderboard,
    isRefreshing: status === 'loading' && Boolean(topLeaderboard),
    refresh,
  };
};
