import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import { useAuth } from './useAuth';
import { AuthProvider } from './AuthProvider';

const mockLoadSession = jest.fn();
const mockSaveSession = jest.fn();
const mockClearSession = jest.fn();
const mockLoginAsGuest = jest.fn();
const mockGoogleLogin = jest.fn();
const mockNakamaClearSession = jest.fn();
const mockNakamaGetClient = jest.fn();
const mockNakamaGetSession = jest.fn();
const mockNakamaRestoreSession = jest.fn();
const mockReset = jest.fn();
const mockUseGameStoreGetState = jest.fn();
const mockStartAuthenticatedPresence = jest.fn();
const mockStopAuthenticatedPresence = jest.fn();
const mockGetUsernameOnboardingStatus = jest.fn();
const mockClaimUsername = jest.fn();
const mockUpdateAccountDisplayName = jest.fn();

jest.mock('./sessionStorage', () => ({
  clearSession: (...args: unknown[]) => mockClearSession(...args),
  loadSession: (...args: unknown[]) => mockLoadSession(...args),
  saveSession: (...args: unknown[]) => mockSaveSession(...args),
}));

jest.mock('@heroiclabs/nakama-js', () => ({
  Session: {
    restore: jest.fn((token: string, refreshToken: string) => ({
      token,
      refresh_token: refreshToken,
      isexpired: jest.fn(() => false),
    })),
  },
}));

jest.mock('./guestAuth', () => ({
  loginAsGuest: (...args: unknown[]) => mockLoginAsGuest(...args),
}));

jest.mock('./googleAuth', () => ({
  useGoogleAuth: () => ({
    isReady: true,
    isProcessing: false,
    login: (...args: unknown[]) => mockGoogleLogin(...args),
    redirectUri: 'https://example.com/oauthredirect',
  }),
}));

jest.mock('@/services/presenceManager', () => ({
  startAuthenticatedPresence: (...args: unknown[]) => mockStartAuthenticatedPresence(...args),
  stopAuthenticatedPresence: (...args: unknown[]) => mockStopAuthenticatedPresence(...args),
}));

jest.mock('@/services/nakama', () => ({
  nakamaService: {
    clearSession: (...args: unknown[]) => mockNakamaClearSession(...args),
    getClient: () => mockNakamaGetClient(),
    getSession: (...args: unknown[]) => mockNakamaGetSession(...args),
    restoreSession: (...args: unknown[]) => mockNakamaRestoreSession(...args),
  },
}));

jest.mock('@/services/usernameOnboarding', () => ({
  getUsernameOnboardingStatus: (...args: unknown[]) => mockGetUsernameOnboardingStatus(...args),
  claimUsername: (...args: unknown[]) => mockClaimUsername(...args),
  updateAccountDisplayName: (...args: unknown[]) => mockUpdateAccountDisplayName(...args),
}));

jest.mock('@/store/useGameStore', () => ({
  useGameStore: {
    getState: (...args: unknown[]) => mockUseGameStoreGetState(...args),
  },
}));

function AuthHarness() {
  const {
    user,
    isLoading,
    isUsernameOnboardingRequired,
    usernameOnboardingError,
    refreshUsernameOnboardingStatus,
    loginAsGuest,
    loginWithGoogle,
    logout,
  } = useAuth();

  return (
    <View>
      <Text testID="auth-state">{isLoading ? 'loading' : user?.username ?? 'none'}</Text>
      <Text testID="onboarding-required">{String(isUsernameOnboardingRequired)}</Text>
      <Text testID="onboarding-error">{usernameOnboardingError ?? 'none'}</Text>
      <TouchableOpacity onPress={() => void loginAsGuest()}>
        <Text>guest-login</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => void loginWithGoogle()}>
        <Text>google-login</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => void refreshUsernameOnboardingStatus()}>
        <Text>refresh-onboarding</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => void logout()}>
        <Text>logout</Text>
      </TouchableOpacity>
    </View>
  );
}

describe('AuthProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseGameStoreGetState.mockReturnValue({ reset: mockReset });
    mockNakamaClearSession.mockResolvedValue(undefined);
    mockNakamaRestoreSession.mockImplementation(async (token: string, refreshToken: string) => ({
      token,
      refresh_token: refreshToken,
      isexpired: jest.fn(() => false),
    }));
    mockSaveSession.mockResolvedValue(undefined);
    mockClearSession.mockResolvedValue(undefined);
    mockNakamaGetClient.mockReturnValue({
      sessionRefresh: jest.fn(),
    });
    mockNakamaGetSession.mockReturnValue(null);
    mockGetUsernameOnboardingStatus.mockResolvedValue({
      onboardingComplete: false,
      currentUsername: null,
      suggestedUsername: 'SuggestedUser',
    });
    mockClaimUsername.mockResolvedValue({
      success: true,
      usernameDisplay: 'RoyalMichel',
      onboardingComplete: true,
    });
    mockUpdateAccountDisplayName.mockResolvedValue(undefined);
  });

  it('restores a stored session on mount', async () => {
    mockLoadSession.mockResolvedValue({
      user: {
        id: 'user-1',
        username: 'Stored User',
        email: 'stored@example.com',
        avatarUrl: null,
        provider: 'google',
        createdAt: '2026-03-15T09:00:00.000Z',
      },
      nakamaSessionToken: 'stored-token',
      nakamaRefreshToken: 'stored-refresh',
    });

    const view = render(
      <AuthProvider>
        <AuthHarness />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(view.getByTestId('auth-state').props.children).toBe('Stored User');
    });

    expect(mockNakamaRestoreSession).toHaveBeenCalledWith('stored-token', 'stored-refresh');
  });

  it('clears both stored auth layers when Nakama session refresh fails', async () => {
    mockNakamaRestoreSession.mockRejectedValueOnce(Object.assign(new Error('401'), { status: 401 }));
    mockLoadSession.mockResolvedValue({
      user: {
        id: 'user-1',
        username: 'Stored User',
        email: 'stored@example.com',
        avatarUrl: null,
        provider: 'guest',
        createdAt: '2026-03-20T09:00:00.000Z',
      },
      nakamaSessionToken: 'expired-token',
      nakamaRefreshToken: 'expired-refresh',
    });

    const view = render(
      <AuthProvider>
        <AuthHarness />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(view.getByTestId('auth-state').props.children).toBe('none');
    });

    expect(mockClearSession).toHaveBeenCalledTimes(1);
    expect(mockNakamaClearSession).toHaveBeenCalledTimes(1);
  });

  it('persists guest login', async () => {
    const guestUser = {
      id: 'guest_abc123',
      username: 'Guest',
      email: null,
      avatarUrl: null,
      provider: 'guest' as const,
      createdAt: '2026-03-15T09:30:00.000Z',
    };

    const mockSession = {
      token: 'guest-token',
      refresh_token: 'guest-refresh',
    };

    mockLoadSession.mockResolvedValue(null);
    mockLoginAsGuest.mockResolvedValue({ user: guestUser, session: mockSession });

    const view = render(
      <AuthProvider>
        <AuthHarness />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(view.getByTestId('auth-state').props.children).toBe('none');
    });

    fireEvent.press(view.getByText('guest-login'));

    await waitFor(() => {
      expect(mockSaveSession).toHaveBeenCalledWith(guestUser, 'guest-token', 'guest-refresh');
      expect(mockStartAuthenticatedPresence).toHaveBeenCalledTimes(1);
      expect(view.getByTestId('auth-state').props.children).toBe('Guest');
    });
  });

  it('persists localhost guest login without Nakama tokens', async () => {
    const guestUser = {
      id: 'guest_local_abc123',
      username: 'Guest',
      email: null,
      avatarUrl: null,
      provider: 'guest' as const,
      createdAt: '2026-03-19T09:30:00.000Z',
    };

    mockLoadSession.mockResolvedValue(null);
    mockLoginAsGuest.mockResolvedValue({ user: guestUser, session: null });

    const view = render(
      <AuthProvider>
        <AuthHarness />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(view.getByTestId('auth-state').props.children).toBe('none');
    });

    fireEvent.press(view.getByText('guest-login'));

    await waitFor(() => {
      expect(mockSaveSession).toHaveBeenCalledWith(guestUser, undefined, undefined);
      expect(mockStopAuthenticatedPresence).toHaveBeenCalled();
      expect(view.getByTestId('auth-state').props.children).toBe('Guest');
    });
  });

  it('persists Google login results', async () => {
    const googleUser = {
      id: 'google-1',
      username: 'Google User',
      email: 'google@example.com',
      avatarUrl: 'https://example.com/google.png',
      provider: 'google' as const,
      createdAt: '2026-03-15T10:30:00.000Z',
    };

    const mockNakamaSession = {
      token: 'google-token',
      refresh_token: 'google-refresh',
    };

    mockLoadSession.mockResolvedValue(null);
    mockGoogleLogin.mockResolvedValue({
      user: googleUser,
      accessToken: 'access-token',
      nakamaSession: mockNakamaSession,
    });

    const view = render(
      <AuthProvider>
        <AuthHarness />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(view.getByTestId('auth-state').props.children).toBe('none');
    });

    fireEvent.press(view.getByText('google-login'));

    await waitFor(() => {
      expect(mockGoogleLogin).toHaveBeenCalledTimes(1);
      expect(mockSaveSession).toHaveBeenCalledWith(googleUser, 'google-token', 'google-refresh');
      expect(mockStartAuthenticatedPresence).not.toHaveBeenCalled();
      expect(mockStopAuthenticatedPresence).toHaveBeenCalled();
      expect(view.getByTestId('auth-state').props.children).toBe('Google User');
    });
  });

  it('clears stored auth, Nakama session, and game state on logout', async () => {
    mockLoadSession.mockResolvedValue({
      user: {
        id: 'user-2',
        username: 'Ready User',
        email: 'ready@example.com',
        avatarUrl: null,
        provider: 'google',
        createdAt: '2026-03-15T11:00:00.000Z',
      },
      nakamaSessionToken: 'ready-token',
      nakamaRefreshToken: 'ready-refresh',
    });

    const view = render(
      <AuthProvider>
        <AuthHarness />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(view.getByTestId('auth-state').props.children).toBe('Ready User');
    });

    fireEvent.press(view.getByText('logout'));

    await waitFor(() => {
      expect(mockClearSession).toHaveBeenCalledTimes(1);
      expect(mockNakamaClearSession).toHaveBeenCalledTimes(1);
      expect(mockReset).toHaveBeenCalledTimes(1);
      expect(view.getByTestId('auth-state').props.children).toBe('none');
    });
  });

  it('keeps completed Google onboarding cached when a later refresh fails', async () => {
    mockLoadSession.mockResolvedValue({
      user: {
        id: 'google-1',
        username: 'RoyalMichel',
        email: 'royal@example.com',
        avatarUrl: null,
        provider: 'google',
        createdAt: '2026-03-29T12:00:00.000Z',
      },
      nakamaSessionToken: 'google-token',
      nakamaRefreshToken: 'google-refresh',
    });
    mockGetUsernameOnboardingStatus
      .mockResolvedValueOnce({
        onboardingComplete: true,
        currentUsername: 'RoyalMichel',
        suggestedUsername: null,
      })
      .mockRejectedValueOnce(new Error('Network error'));

    const view = render(
      <AuthProvider>
        <AuthHarness />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(view.getByTestId('auth-state').props.children).toBe('RoyalMichel');
      expect(view.getByTestId('onboarding-required').props.children).toBe('false');
    });

    fireEvent.press(view.getByText('refresh-onboarding'));

    await waitFor(() => {
      expect(view.getByTestId('onboarding-error').props.children).toBe('Network error');
      expect(view.getByTestId('onboarding-required').props.children).toBe('false');
    });
  });
});
