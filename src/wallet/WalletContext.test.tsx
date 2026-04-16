import { act, renderHook, waitFor } from '@testing-library/react-native';
import React from 'react';

import { SOFT_CURRENCY_KEY } from '@/shared/wallet';
import { WalletProvider } from './WalletContext';
import { useWallet } from './useWallet';

const mockGetWallet = jest.fn();
const mockUseAuth = jest.fn();

jest.mock('@/services/wallet', () => ({
  getWallet: (...args: unknown[]) => mockGetWallet(...args),
}));

jest.mock('@/src/auth/useAuth', () => ({
  useAuth: (...args: unknown[]) => mockUseAuth(...args),
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <WalletProvider>{children}</WalletProvider>
);

describe('WalletProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: { id: 'user-1', provider: 'google' },
      isLoading: false,
    });
    mockGetWallet.mockResolvedValue({
      wallet: { [SOFT_CURRENCY_KEY]: 88 },
      softCurrency: 88,
    });
  });

  it('loads the current wallet when a user is authenticated', async () => {
    const { result } = renderHook(() => useWallet(), { wrapper });

    await waitFor(() => {
      expect(result.current.softCurrency).toBe(88);
    });

    expect(result.current.wallet).toEqual({ [SOFT_CURRENCY_KEY]: 88 });
    expect(result.current.status).toBe('ready');
  });

  it('refreshes silently and preserves the last known balance while loading', async () => {
    const { result } = renderHook(() => useWallet(), { wrapper });

    await waitFor(() => {
      expect(result.current.softCurrency).toBe(88);
    });

    mockGetWallet.mockResolvedValueOnce({
      wallet: { [SOFT_CURRENCY_KEY]: 91 },
      softCurrency: 91,
    });

    await act(async () => {
      await result.current.refresh({ silent: true });
    });

    expect(result.current.softCurrency).toBe(91);
  });

  it('resets when there is no authenticated user', async () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isLoading: false,
    });

    const { result } = renderHook(() => useWallet(), { wrapper });

    expect(result.current.softCurrency).toBe(0);
    expect(result.current.wallet).toBeNull();
    expect(result.current.status).toBe('idle');
    expect(mockGetWallet).not.toHaveBeenCalled();
  });
});
