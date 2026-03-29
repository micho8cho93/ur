import React, { PropsWithChildren, createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { getChallengeDefinitions, getUserChallengeProgress } from '@/services/challenges';
import type { ChallengeDefinition, UserChallengeProgressRpcResponse } from '@/shared/challenges';
import { useAuth } from '@/src/auth/useAuth';
import { useGameStore } from '@/store/useGameStore';

export type ChallengesStatus = 'idle' | 'loading' | 'ready' | 'error';

export type ChallengesContextValue = {
  definitions: ChallengeDefinition[];
  progress: UserChallengeProgressRpcResponse | null;
  status: ChallengesStatus;
  errorMessage: string | null;
  isLoading: boolean;
  isRefreshing: boolean;
  refresh: (options?: { silent?: boolean }) => Promise<{
    definitions: ChallengeDefinition[];
    progress: UserChallengeProgressRpcResponse | null;
  } | null>;
};

export const ChallengesContext = createContext<ChallengesContextValue | undefined>(undefined);

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : 'Unable to load challenges right now.';

export const ChallengesProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const { user, isLoading: isAuthLoading } = useAuth();
  const lastChallengeProgressSnapshot = useGameStore((state) => state.lastChallengeProgressSnapshot);
  const [definitions, setDefinitions] = useState<ChallengeDefinition[]>([]);
  const [progress, setProgress] = useState<UserChallengeProgressRpcResponse | null>(null);
  const [status, setStatus] = useState<ChallengesStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const activeUserIdRef = useRef<string | null>(null);
  const appliedSnapshotKeyRef = useRef<string | null>(null);
  const requestIdRef = useRef(0);

  const resetState = useCallback(() => {
    requestIdRef.current += 1;
    activeUserIdRef.current = null;
    appliedSnapshotKeyRef.current = null;
    setDefinitions([]);
    setProgress(null);
    setStatus('idle');
    setErrorMessage(null);
  }, []);

  const refresh = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!user) {
        resetState();
        return null;
      }

      requestIdRef.current += 1;
      const requestId = requestIdRef.current;

      setErrorMessage(null);
      if (!options?.silent || (definitions.length === 0 && !progress)) {
        setStatus('loading');
      }

      try {
        const [nextDefinitions, nextProgress] = await Promise.all([
          getChallengeDefinitions(),
          getUserChallengeProgress(),
        ]);

        if (requestIdRef.current !== requestId) {
          return null;
        }

        activeUserIdRef.current = user.id;
        setDefinitions(nextDefinitions.challenges);
        setProgress(nextProgress);
        setStatus('ready');

        return {
          definitions: nextDefinitions.challenges,
          progress: nextProgress,
        };
      } catch (error) {
        if (requestIdRef.current !== requestId) {
          return null;
        }

        setErrorMessage(getErrorMessage(error));
        setStatus(definitions.length > 0 || progress ? 'ready' : 'error');
        return null;
      }
    },
    [definitions.length, progress, resetState, user],
  );

  useEffect(() => {
    if (isAuthLoading) {
      return;
    }

    if (!user) {
      resetState();
      return;
    }

    if (activeUserIdRef.current !== user.id) {
      void refresh();
    }
  }, [isAuthLoading, refresh, resetState, user]);

  useEffect(() => {
    if (!user || !lastChallengeProgressSnapshot) {
      return;
    }

    const snapshotKey = `${lastChallengeProgressSnapshot.matchId}:${lastChallengeProgressSnapshot.progress.updatedAt}:${lastChallengeProgressSnapshot.progress.totalCompleted}`;
    if (appliedSnapshotKeyRef.current === snapshotKey) {
      return;
    }

    appliedSnapshotKeyRef.current = snapshotKey;
    activeUserIdRef.current = user.id;
    requestIdRef.current += 1;
    setProgress(lastChallengeProgressSnapshot.progress);
    setStatus('ready');
    setErrorMessage(null);
  }, [lastChallengeProgressSnapshot, user]);

  const value = useMemo<ChallengesContextValue>(
    () => ({
      definitions,
      progress,
      status,
      errorMessage,
      isLoading: status === 'loading' && definitions.length === 0 && !progress,
      isRefreshing: status === 'loading' && (definitions.length > 0 || Boolean(progress)),
      refresh,
    }),
    [definitions, errorMessage, progress, refresh, status],
  );

  return <ChallengesContext.Provider value={value}>{children}</ChallengesContext.Provider>;
};
