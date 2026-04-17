import React, { PropsWithChildren, createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { getWallet } from '@/services/wallet';
import type { WalletRpcResponse } from '@/shared/wallet';
import { useAuth } from '@/src/auth/useAuth';

export type WalletStatus = 'idle' | 'loading' | 'ready' | 'error';

export type WalletContextValue = {
  wallet: WalletRpcResponse['wallet'] | null;
  softCurrency: number;
  premiumCurrency: number;
  status: WalletStatus;
  errorMessage: string | null;
  isLoading: boolean;
  isRefreshing: boolean;
  refresh: (options?: { silent?: boolean }) => Promise<WalletRpcResponse | null>;
};

export const WalletContext = createContext<WalletContextValue | undefined>(undefined);

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : 'Unable to load wallet right now.';

export const WalletProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [wallet, setWallet] = useState<WalletRpcResponse['wallet'] | null>(null);
  const [softCurrency, setSoftCurrency] = useState(0);
  const [premiumCurrency, setPremiumCurrency] = useState(0);
  const [status, setStatus] = useState<WalletStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const activeUserIdRef = useRef<string | null>(null);
  const requestIdRef = useRef(0);
  const canAccessWallet = Boolean(user) && user?.provider !== 'guest';

  const resetState = useCallback(() => {
    requestIdRef.current += 1;
    activeUserIdRef.current = null;
    setWallet(null);
    setSoftCurrency(0);
    setPremiumCurrency(0);
    setStatus('idle');
    setErrorMessage(null);
  }, []);

  const refresh = useCallback(
    async (options?: { silent?: boolean }): Promise<WalletRpcResponse | null> => {
      if (!canAccessWallet || !user) {
        resetState();
        return null;
      }

      requestIdRef.current += 1;
      const requestId = requestIdRef.current;

      setErrorMessage(null);
      if (!options?.silent || !wallet) {
        setStatus('loading');
      }

      try {
        const nextWallet = await getWallet();

        if (requestIdRef.current !== requestId) {
          return null;
        }

        activeUserIdRef.current = user.id;
        setWallet(nextWallet.wallet);
        setSoftCurrency(nextWallet.softCurrency);
        setPremiumCurrency(nextWallet.premiumCurrency);
        setStatus('ready');
        return nextWallet;
      } catch (error) {
        if (requestIdRef.current !== requestId) {
          return null;
        }

        setErrorMessage(getErrorMessage(error));
        setStatus(wallet ? 'ready' : 'error');
        return null;
      }
    },
    [canAccessWallet, resetState, user, wallet],
  );

  useEffect(() => {
    if (isAuthLoading) {
      return;
    }

    if (!canAccessWallet || !user) {
      resetState();
      return;
    }

    if (activeUserIdRef.current !== user.id) {
      void refresh();
    }
  }, [canAccessWallet, isAuthLoading, refresh, resetState, user]);

  const value = useMemo<WalletContextValue>(
    () => ({
      wallet,
      softCurrency,
      premiumCurrency,
      status,
      errorMessage,
      isLoading: status === 'loading' && !wallet,
      isRefreshing: status === 'loading' && Boolean(wallet),
      refresh,
    }),
    [errorMessage, premiumCurrency, refresh, softCurrency, status, wallet],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
};
