import { act, renderHook, waitFor } from '@testing-library/react-native';
import React from 'react';

import { PREMIUM_CURRENCY_KEY, SOFT_CURRENCY_KEY } from '@/shared/wallet';
import { StoreProvider, useStore } from './StoreProvider';

const mockGetStorefront = jest.fn();
const mockPurchaseItem = jest.fn();
const mockUseAuth = jest.fn();
const mockWalletRefresh = jest.fn();

jest.mock('@/services/cosmetics', () => ({
  getStorefront: (...args: unknown[]) => mockGetStorefront(...args),
  purchaseItem: (...args: unknown[]) => mockPurchaseItem(...args),
}));

jest.mock('@/src/auth/useAuth', () => ({
  useAuth: (...args: unknown[]) => mockUseAuth(...args),
}));

jest.mock('@/src/wallet/useWallet', () => ({
  useWallet: () => ({
    refresh: mockWalletRefresh,
  }),
}));

const storefront = {
  dailyRotation: [],
  featured: [],
  limitedTime: [],
  bundles: [],
  ownedIds: [],
  rotationExpiresAt: '2026-04-16T00:00:00.000Z',
};

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <StoreProvider>{children}</StoreProvider>
);

describe('StoreProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: { id: 'user-1', provider: 'google' },
      isLoading: false,
    });
    mockGetStorefront.mockResolvedValue(storefront);
    mockPurchaseItem.mockResolvedValue({
      success: true,
      cosmeticId: 'board_cedar_001',
      updatedWallet: {
        [SOFT_CURRENCY_KEY]: 700,
        [PREMIUM_CURRENCY_KEY]: 0,
      },
    });
    mockWalletRefresh.mockResolvedValue(null);
  });

  it('loads the storefront when authenticated', async () => {
    const { result } = renderHook(() => useStore(), { wrapper });

    await waitFor(() => {
      expect(result.current.storefront).toEqual(storefront);
    });

    expect(result.current.loading).toBe(false);
  });

  it('updates owned IDs and refreshes wallet after a successful purchase', async () => {
    const { result } = renderHook(() => useStore(), { wrapper });

    await waitFor(() => {
      expect(result.current.storefront).toEqual(storefront);
    });

    await act(async () => {
      await expect(result.current.purchaseItem('board_cedar_001')).resolves.toEqual(
        expect.objectContaining({
          success: true,
          cosmeticId: 'board_cedar_001',
        }),
      );
    });

    expect(result.current.storefront?.ownedIds).toEqual(['board_cedar_001']);
    expect(mockWalletRefresh).toHaveBeenCalledWith({ silent: true });
  });

  it('normalizes known purchase failures', async () => {
    mockPurchaseItem.mockRejectedValueOnce(new Error('INSUFFICIENT_FUNDS'));
    const { result } = renderHook(() => useStore(), { wrapper });

    await waitFor(() => {
      expect(result.current.storefront).toEqual(storefront);
    });

    await expect(result.current.purchaseItem('board_cedar_001')).resolves.toEqual({
      success: false,
      error: 'INSUFFICIENT_FUNDS',
    });
  });

  it('resets when unauthenticated', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isLoading: false,
    });

    const { result } = renderHook(() => useStore(), { wrapper });

    expect(result.current.storefront).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(mockGetStorefront).not.toHaveBeenCalled();
  });
});
