import React, { PropsWithChildren, createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { getUserProgression } from '@/services/progression';
import { useAuth } from '@/src/auth/useAuth';
import { useGameStore } from '@/store/useGameStore';
import type { ProgressionSnapshot } from '@/shared/progression';

export type ProgressionStatus = 'idle' | 'loading' | 'ready' | 'error';

export type ProgressionContextValue = {
  progression: ProgressionSnapshot | null;
  status: ProgressionStatus;
  errorMessage: string | null;
  isLoading: boolean;
  isRefreshing: boolean;
  refresh: (options?: { silent?: boolean }) => Promise<ProgressionSnapshot | null>;
};

export const ProgressionContext = createContext<ProgressionContextValue | undefined>(undefined);

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : 'Unable to load progression right now.';

export const ProgressionProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const { user, isLoading: isAuthLoading } = useAuth();
  const lastProgressionAward = useGameStore((state) => state.lastProgressionAward);
  const lastProgressionSnapshot = useGameStore((state) => state.lastProgressionSnapshot);
  const [progression, setProgression] = useState<ProgressionSnapshot | null>(null);
  const [status, setStatus] = useState<ProgressionStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const activeUserIdRef = useRef<string | null>(null);
  const appliedAwardKeyRef = useRef<string | null>(null);
  const appliedSnapshotKeyRef = useRef<string | null>(null);
  const requestIdRef = useRef(0);

  const resetState = useCallback(() => {
    requestIdRef.current += 1;
    activeUserIdRef.current = null;
    appliedAwardKeyRef.current = null;
    appliedSnapshotKeyRef.current = null;
    setProgression(null);
    setStatus('idle');
    setErrorMessage(null);
  }, []);

  const refresh = useCallback(
    async (options?: { silent?: boolean }): Promise<ProgressionSnapshot | null> => {
      if (!user) {
        resetState();
        return null;
      }

      requestIdRef.current += 1;
      const requestId = requestIdRef.current;

      setErrorMessage(null);
      if (!options?.silent || !progression) {
        setStatus('loading');
      }

      try {
        const nextProgression = await getUserProgression();

        if (requestIdRef.current !== requestId) {
          return null;
        }

        activeUserIdRef.current = user.id;
        setProgression(nextProgression);
        setStatus('ready');
        return nextProgression;
      } catch (error) {
        if (requestIdRef.current !== requestId) {
          return null;
        }

        setErrorMessage(getErrorMessage(error));
        setStatus(progression ? 'ready' : 'error');
        return null;
      }
    },
    [progression, resetState, user],
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
    if (!user || !lastProgressionAward) {
      return;
    }

    const awardKey = `${lastProgressionAward.matchId}:${lastProgressionAward.newTotalXp}`;
    if (appliedAwardKeyRef.current === awardKey) {
      return;
    }

    appliedAwardKeyRef.current = awardKey;
    activeUserIdRef.current = user.id;
    requestIdRef.current += 1;
    setProgression(lastProgressionAward.progression);
    setStatus('ready');
    setErrorMessage(null);
  }, [lastProgressionAward, user]);

  useEffect(() => {
    if (!user || !lastProgressionSnapshot) {
      return;
    }

    const snapshotKey = `${lastProgressionSnapshot.matchId}:${lastProgressionSnapshot.progression.totalXp}`;
    if (appliedSnapshotKeyRef.current === snapshotKey) {
      return;
    }

    appliedSnapshotKeyRef.current = snapshotKey;
    activeUserIdRef.current = user.id;
    requestIdRef.current += 1;
    setProgression(lastProgressionSnapshot.progression);
    setStatus('ready');
    setErrorMessage(null);
  }, [lastProgressionSnapshot, user]);

  const value = useMemo<ProgressionContextValue>(
    () => ({
      progression,
      status,
      errorMessage,
      isLoading: status === 'loading' && !progression,
      isRefreshing: status === 'loading' && Boolean(progression),
      refresh,
    }),
    [errorMessage, progression, refresh, status],
  );

  return <ProgressionContext.Provider value={value}>{children}</ProgressionContext.Provider>;
};
