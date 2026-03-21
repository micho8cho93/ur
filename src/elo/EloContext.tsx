import React, { PropsWithChildren, createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { EloRatingProfileRpcResponse } from '@/shared/elo';
import { getMyRatingProfile } from '@/services/elo';
import { useGameStore } from '@/store/useGameStore';
import { useAuth } from '@/src/auth/useAuth';

export type EloRatingStatus = 'idle' | 'loading' | 'ready' | 'error';

export type EloContextValue = {
  ratingProfile: EloRatingProfileRpcResponse | null;
  status: EloRatingStatus;
  errorMessage: string | null;
  isLoading: boolean;
  isRefreshing: boolean;
  refresh: (options?: { silent?: boolean }) => Promise<EloRatingProfileRpcResponse | null>;
};

export const EloContext = createContext<EloContextValue | undefined>(undefined);

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : 'Unable to load your Elo rating right now.';

export const EloRatingProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const { user, isLoading: isAuthLoading, isUsernameOnboardingLoading, isUsernameOnboardingRequired } = useAuth();
  const lastEloRatingChange = useGameStore((state) => state.lastEloRatingChange);
  const [ratingProfile, setRatingProfile] = useState<EloRatingProfileRpcResponse | null>(null);
  const [status, setStatus] = useState<EloRatingStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const activeUserIdRef = useRef<string | null>(null);
  const appliedUpdateKeyRef = useRef<string | null>(null);
  const requestIdRef = useRef(0);

  const resetState = useCallback(() => {
    requestIdRef.current += 1;
    activeUserIdRef.current = null;
    appliedUpdateKeyRef.current = null;
    setRatingProfile(null);
    setStatus('idle');
    setErrorMessage(null);
  }, []);

  const canAccessElo =
    Boolean(user) &&
    user?.provider === 'google' &&
    !isUsernameOnboardingLoading &&
    !isUsernameOnboardingRequired;

  const refresh = useCallback(
    async (options?: { silent?: boolean }): Promise<EloRatingProfileRpcResponse | null> => {
      if (!canAccessElo || !user) {
        resetState();
        return null;
      }

      requestIdRef.current += 1;
      const requestId = requestIdRef.current;

      setErrorMessage(null);
      if (!options?.silent || !ratingProfile) {
        setStatus('loading');
      }

      try {
        const nextProfile = await getMyRatingProfile();

        if (requestIdRef.current !== requestId) {
          return null;
        }

        activeUserIdRef.current = user.id;
        setRatingProfile(nextProfile);
        setStatus('ready');
        return nextProfile;
      } catch (error) {
        if (requestIdRef.current !== requestId) {
          return null;
        }

        setErrorMessage(getErrorMessage(error));
        setStatus(ratingProfile ? 'ready' : 'error');
        return null;
      }
    },
    [canAccessElo, ratingProfile, resetState, user],
  );

  useEffect(() => {
    if (isAuthLoading || isUsernameOnboardingLoading) {
      return;
    }

    if (!canAccessElo || !user) {
      resetState();
      return;
    }

    if (activeUserIdRef.current !== user.id) {
      void refresh();
    }
  }, [canAccessElo, isAuthLoading, isUsernameOnboardingLoading, refresh, resetState, user]);

  useEffect(() => {
    if (!user || !lastEloRatingChange || lastEloRatingChange.player.userId !== user.id) {
      return;
    }

    const updateKey = `${lastEloRatingChange.matchId}:${lastEloRatingChange.player.newRating}:${lastEloRatingChange.player.ratedGames}`;
    if (appliedUpdateKeyRef.current === updateKey) {
      return;
    }

    appliedUpdateKeyRef.current = updateKey;
    activeUserIdRef.current = user.id;
    requestIdRef.current += 1;
    setRatingProfile({
      leaderboardId: lastEloRatingChange.leaderboardId,
      userId: lastEloRatingChange.player.userId,
      usernameDisplay: lastEloRatingChange.player.usernameDisplay,
      eloRating: lastEloRatingChange.player.newRating,
      ratedGames: lastEloRatingChange.player.ratedGames,
      ratedWins: lastEloRatingChange.player.ratedWins,
      ratedLosses: lastEloRatingChange.player.ratedLosses,
      provisional: lastEloRatingChange.player.provisional,
      rank: lastEloRatingChange.player.rank,
      lastRatedMatchId: lastEloRatingChange.matchId,
      lastRatedAt: ratingProfile?.lastRatedAt ?? null,
    });
    setStatus('ready');
    setErrorMessage(null);
  }, [lastEloRatingChange, ratingProfile?.lastRatedAt, user]);

  const value = useMemo<EloContextValue>(
    () => ({
      ratingProfile,
      status,
      errorMessage,
      isLoading: status === 'loading' && !ratingProfile,
      isRefreshing: status === 'loading' && Boolean(ratingProfile),
      refresh,
    }),
    [errorMessage, ratingProfile, refresh, status],
  );

  return <EloContext.Provider value={value}>{children}</EloContext.Provider>;
};
