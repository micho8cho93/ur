import { fireEvent, render, waitFor, within } from '@testing-library/react-native';
import React from 'react';
import * as ReactNative from 'react-native';

import AuthenticatedHome from './AuthenticatedHome';
import { buildProgressionSnapshot } from '@/shared/progression';
import { CHALLENGE_DEFINITIONS, createDefaultUserChallengeProgressSnapshot } from '@/shared/challenges';

const mockUseAuth = jest.fn();
const mockUseProgression = jest.fn();
const mockUseWallet = jest.fn();
const mockUseEloRating = jest.fn();
const mockUseChallenges = jest.fn();
const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockRunScreenTransition = jest.fn();

const originalPlatform = ReactNative.Platform.OS;

const setPlatform = (platform: typeof ReactNative.Platform.OS) => {
  (ReactNative.Platform as { OS: typeof ReactNative.Platform.OS }).OS = platform;
};

jest.mock('expo-font', () => ({
  useFonts: () => [true],
}));

jest.mock('@/src/auth/useAuth', () => ({
  useAuth: (...args: unknown[]) => mockUseAuth(...args),
}));

jest.mock('@/src/progression/useProgression', () => ({
  useProgression: (...args: unknown[]) => mockUseProgression(...args),
}));

jest.mock('@/src/wallet/useWallet', () => ({
  useWallet: (...args: unknown[]) => mockUseWallet(...args),
}));

jest.mock('@/src/elo/useEloRating', () => ({
  useEloRating: (...args: unknown[]) => mockUseEloRating(...args),
}));

jest.mock('@/src/challenges/useChallenges', () => ({
  useChallenges: (...args: unknown[]) => mockUseChallenges(...args),
}));

jest.mock('expo-router', () => ({
  useFocusEffect: (callback: () => void) => {
    const React = jest.requireActual('react');
    React.useEffect(callback, [callback]);
  },
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
}));

jest.mock('@/src/transitions/ScreenTransitionContext', () => ({
  useScreenTransition: () => mockRunScreenTransition,
}));

jest.mock('@expo/vector-icons/MaterialIcons', () => {
  const React = jest.requireActual('react');
  const { Text } = jest.requireActual('react-native');

  return function MockMaterialIcons(props: { name: string }) {
    return <Text>{props.name}</Text>;
  };
});

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => {
    const React = jest.requireActual('react');
    const { View } = jest.requireActual('react-native');

    return <View>{children}</View>;
  },
  useSafeAreaInsets: () => ({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  }),
}));

describe('AuthenticatedHome', () => {
  let useWindowDimensionsSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    setPlatform('web');
    useWindowDimensionsSpy = jest.spyOn(ReactNative, 'useWindowDimensions');
    useWindowDimensionsSpy.mockReturnValue({ width: 1440, height: 900, scale: 1, fontScale: 1 });

    mockRunScreenTransition.mockImplementation(async (request: { action?: () => void | Promise<void> }) => {
      await request.action?.();
      return true;
    });

    mockUseAuth.mockReturnValue({
      user: {
        id: 'google_1',
        username: 'Michel',
        email: 'michel@example.com',
        avatarUrl: null,
        provider: 'google',
        createdAt: '2026-03-15T12:00:00.000Z',
      },
      logout: jest.fn(),
    });

    mockUseProgression.mockReturnValue({
      progression: buildProgressionSnapshot(300),
      errorMessage: null,
      isLoading: false,
    });

    mockUseWallet.mockReturnValue({
      wallet: { soft_currency: 37, premium_currency: 0 },
      softCurrency: 37,
      premiumCurrency: 0,
      prevSoftCurrency: null,
      prevPremiumCurrency: null,
      clearWalletDelta: jest.fn(),
      errorMessage: null,
      isLoading: false,
      isRefreshing: false,
      refresh: jest.fn(),
    });

    mockUseEloRating.mockReturnValue({
      ratingProfile: {
        leaderboardId: 'elo_global',
        userId: 'google_1',
        usernameDisplay: 'Michel',
        eloRating: 1422,
        ratedGames: 18,
        ratedWins: 11,
        ratedLosses: 7,
        provisional: false,
        rank: 18,
        lastRatedMatchId: 'match-1',
        lastRatedAt: '2026-03-21T10:00:00.000Z',
      },
      errorMessage: null,
      isLoading: false,
    });

    const progress = createDefaultUserChallengeProgressSnapshot('2026-03-21T12:00:00.000Z');
    progress.totalCompleted = 24;
    mockUseChallenges.mockReturnValue({
      definitions: CHALLENGE_DEFINITIONS,
      progress,
      errorMessage: null,
      isLoading: false,
    });
  });

  afterEach(() => {
    useWindowDimensionsSpy.mockRestore();
  });

  afterAll(() => {
    setPlatform(originalPlatform);
  });

  it('renders the desktop home with unified cards, internal CTAs, and external actions', async () => {
    const view = render(<AuthenticatedHome />);

    expect(view.getByText('Michel')).toBeTruthy();
    expect(view.getByLabelText('37 coins')).toBeTruthy();
    expect(view.getByLabelText('Current progression rank badge: Apprentice Scribe')).toBeTruthy();
    expect(view.getByLabelText('Logout')).toBeTruthy();
    expect(view.getByLabelText('Open inventory')).toBeTruthy();
    expect(view.getByText('XP & Rank')).toBeTruthy();
    expect(view.getByText('Elo Rating')).toBeTruthy();
    expect(view.getAllByText('Challenges')).toHaveLength(2);
    expect(view.getByText('1422')).toBeTruthy();
    expect(view.getByText('Rank #18')).toBeTruthy();
    expect(view.getByText('24/40')).toBeTruthy();
    expect(view.getByText('Quick Play')).toBeTruthy();
    expect(view.getByText('Play Online')).toBeTruthy();
    expect(view.getByText('Tutorial')).toBeTruthy();
    expect(view.getByText('Status')).toBeTruthy();
    expect(view.getByText('Leaderboard')).toBeTruthy();

    fireEvent.press(view.getByLabelText('Open status details'));
    expect(view.getByText('XP & Ranks')).toBeTruthy();

    fireEvent.press(view.getByLabelText('Open leaderboard'));
    fireEvent.press(view.getByLabelText('Open challenges page'));
    fireEvent.press(view.getByText('Quick Play'));
    fireEvent.press(view.getByText('Play Online'));
    fireEvent.press(view.getByText('Tutorial'));
    fireEvent.press(view.getByLabelText('Open inventory'));

    expect(mockPush).toHaveBeenCalledWith('/leaderboard');
    expect(mockPush).toHaveBeenCalledWith('/challenges');
    expect(mockPush).toHaveBeenCalledWith('/(game)/game-modes');
    expect(mockPush).toHaveBeenCalledWith('/(game)/lobby?mode=online');
    expect(mockPush).toHaveBeenCalledWith('/(game)/inventory');
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('/match/local-'));
    });
  });

  it('opens the shared feedback composer from the floating button', async () => {
    const view = render(<AuthenticatedHome />);

    expect(view.getByText('flag')).toBeTruthy();
    fireEvent.press(view.getByLabelText('Send feedback'));

    await waitFor(() => {
      expect(view.getByText('Send Feedback')).toBeTruthy();
      expect(view.getByText('Home')).toBeTruthy();
    });
  });

  it('renders the guest layout with the locked Elo card and back control', async () => {
    const logout = jest.fn().mockResolvedValue(undefined);

    mockUseAuth.mockReturnValue({
      user: {
        id: 'guest_1',
        username: 'Guest',
        email: null,
        avatarUrl: null,
        provider: 'guest',
        createdAt: '2026-03-15T12:00:00.000Z',
      },
      logout,
    });

    const view = render(<AuthenticatedHome />);

    expect(view.getByText('Guest')).toBeTruthy();
    expect(view.getByLabelText('0 coins')).toBeTruthy();
    expect(view.getByLabelText('Current progression rank badge: Laborer')).toBeTruthy();
    expect(view.getByText('Back')).toBeTruthy();
    expect(view.queryByText('Logout')).toBeNull();
    expect(view.getByText('Locked')).toBeTruthy();
    expect(view.getByText('Google sign-in required')).toBeTruthy();

    fireEvent.press(view.getByText('Back'));

    await waitFor(() => {
      expect(logout).toHaveBeenCalled();
      expect(mockReplace).toHaveBeenCalledWith('/(auth)/login');
    });
  });

  it('renders the stacked compact layout on narrow screens', () => {
    useWindowDimensionsSpy.mockReturnValue({ width: 430, height: 932, scale: 1, fontScale: 1 });

    const view = render(<AuthenticatedHome />);

    expect(view.getByText('XP & Rank')).toBeTruthy();
    expect(view.getByLabelText('37 coins')).toBeTruthy();
    expect(view.getByText('Elo Rating')).toBeTruthy();
    expect(view.getAllByText('Challenges')).toHaveLength(2);
    expect(view.getByText('Status')).toBeTruthy();
    expect(view.getByText('Leaderboard')).toBeTruthy();
    expect(view.getByText('Quick Play')).toBeTruthy();
    expect(view.getByText('Play Online')).toBeTruthy();
    expect(view.getByText('Tutorial')).toBeTruthy();
  });

  it('moves the guest back button to the right on narrow mobile web', () => {
    useWindowDimensionsSpy.mockReturnValue({ width: 430, height: 932, scale: 1, fontScale: 1 });

    mockUseAuth.mockReturnValue({
      user: {
        id: 'guest_1',
        username: 'Guest',
        email: null,
        avatarUrl: null,
        provider: 'guest',
        createdAt: '2026-03-15T12:00:00.000Z',
      },
      logout: jest.fn().mockResolvedValue(undefined),
    });

    const view = render(<AuthenticatedHome />);

    expect(within(view.getByTestId('authenticated-home-utility-left')).getByText('Guest')).toBeTruthy();
    expect(within(view.getByTestId('authenticated-home-utility-left')).queryByText('Back')).toBeNull();
    expect(within(view.getByTestId('authenticated-home-utility-right')).getByText('Back')).toBeTruthy();
  });
});
