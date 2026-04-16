import React, { PropsWithChildren, createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { getStorefront, purchaseItem as purchaseStoreItem } from '@/services/cosmetics';
import type { PurchaseItemResponse, StorefrontResponse } from '@/shared/cosmetics';
import { useAuth } from '@/src/auth/useAuth';
import { useWallet } from '@/src/wallet/useWallet';

export type PurchaseResult =
  | PurchaseItemResponse
  | {
      success: false;
      error: 'ITEM_NOT_FOUND' | 'ALREADY_OWNED' | 'INSUFFICIENT_FUNDS' | 'PURCHASE_FAILED';
    };

type PurchaseErrorCode = Extract<PurchaseResult, { success: false }>['error'];

export type StoreContextValue = {
  storefront: StorefrontResponse | null;
  softCurrency: number;
  loading: boolean;
  errorMessage: string | null;
  purchaseItem: (itemId: string) => Promise<PurchaseResult>;
  refresh: (options?: { silent?: boolean }) => Promise<StorefrontResponse | null>;
};

export const StoreContext = createContext<StoreContextValue | undefined>(undefined);

const normalizePurchaseError = (error: unknown): PurchaseErrorCode => {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes('ITEM_NOT_FOUND')) {
    return 'ITEM_NOT_FOUND';
  }
  if (message.includes('ALREADY_OWNED')) {
    return 'ALREADY_OWNED';
  }
  if (message.includes('INSUFFICIENT_FUNDS')) {
    return 'INSUFFICIENT_FUNDS';
  }
  return 'PURCHASE_FAILED';
};

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : 'Unable to load the store right now.';

export const StoreProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const { user, isLoading: isAuthLoading } = useAuth();
  const wallet = useWallet();
  const [storefront, setStorefront] = useState<StorefrontResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const activeUserIdRef = useRef<string | null>(null);
  const requestIdRef = useRef(0);

  const resetState = useCallback(() => {
    requestIdRef.current += 1;
    activeUserIdRef.current = null;
    setStorefront(null);
    setLoading(false);
    setErrorMessage(null);
  }, []);

  const refresh = useCallback(
    async (options?: { silent?: boolean }): Promise<StorefrontResponse | null> => {
      if (!user) {
        resetState();
        return null;
      }

      requestIdRef.current += 1;
      const requestId = requestIdRef.current;

      setErrorMessage(null);
      if (!options?.silent || !storefront) {
        setLoading(true);
      }

      try {
        const nextStorefront = await getStorefront();
        if (requestIdRef.current !== requestId) {
          return null;
        }

        activeUserIdRef.current = user.id;
        setStorefront(nextStorefront);
        setLoading(false);
        return nextStorefront;
      } catch (error) {
        if (requestIdRef.current !== requestId) {
          return null;
        }

        setErrorMessage(getErrorMessage(error));
        setLoading(false);
        return null;
      }
    },
    [resetState, storefront, user],
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

  const purchaseItem = useCallback(
    async (itemId: string): Promise<PurchaseResult> => {
      try {
        const result = await purchaseStoreItem(itemId);
        setStorefront((current) => {
          if (!current || current.ownedIds.includes(itemId)) {
            return current;
          }

          return {
            ...current,
            ownedIds: [...current.ownedIds, itemId],
          };
        });
        void wallet.refresh({ silent: true });
        return result;
      } catch (error) {
        return {
          success: false,
          error: normalizePurchaseError(error),
        };
      }
    },
    [wallet],
  );

  const value = useMemo<StoreContextValue>(
    () => ({
      storefront,
      softCurrency: wallet.softCurrency,
      loading,
      errorMessage,
      purchaseItem,
      refresh,
    }),
    [errorMessage, loading, purchaseItem, refresh, storefront, wallet.softCurrency],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
};

export const useStore = (): StoreContextValue => {
  const storeContext = useContext(StoreContext);

  if (!storeContext) {
    throw new Error('useStore must be used within a StoreProvider.');
  }

  return storeContext;
};
