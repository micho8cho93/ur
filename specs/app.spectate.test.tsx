import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import SpectateScreen from '@/app/(game)/spectate';
import { DEFAULT_MATCH_CONFIG } from '@/logic/matchConfigs';

const mockPush = jest.fn();
const mockDismissTo = jest.fn();
const mockListOpenOnlineMatches = jest.fn();
const mockJoinOpenOnlineMatch = jest.fn();
const mockResolveGameModeMatchConfig = jest.fn();
const mockEnsureAuthenticatedDevice = jest.fn();
const mockGameStore = {
  initGame: jest.fn(),
  setNakamaSession: jest.fn(),
  setUserId: jest.fn(),
  setMatchToken: jest.fn(),
  setOnlineMode: jest.fn(),
  setPlayerColor: jest.fn(),
  setSocketState: jest.fn(),
  setSpectatorPlayerLabels: jest.fn(),
};

jest.mock('@/components/home/HomeActionButton', () => ({
  HomeActionButton: ({
    title,
    onPress,
  }: {
    title: string;
    onPress?: () => void;
  }) => {
    const React = jest.requireActual('react');
    const { Text, TouchableOpacity } = jest.requireActual('react-native');

    return (
      <TouchableOpacity onPress={onPress}>
        <Text>{title}</Text>
      </TouchableOpacity>
    );
  },
}));

jest.mock('@/components/ui/SketchButton', () => ({
  SketchButton: ({
    label,
    accessibilityLabel,
    onPress,
  }: {
    label: string;
    accessibilityLabel?: string;
    onPress?: () => void;
  }) => {
    const React = jest.requireActual('react');
    const { Text, TouchableOpacity } = jest.requireActual('react-native');

    return (
      <TouchableOpacity accessibilityLabel={accessibilityLabel} onPress={onPress}>
        <Text>{label}</Text>
      </TouchableOpacity>
    );
  },
}));

jest.mock('@/components/ui/MobileBackground', () => ({
  MobileBackground: () => null,
  useMobileBackground: () => false,
}));

jest.mock('@/components/ui/WideScreenBackground', () => ({
  MIN_WIDE_WEB_BACKGROUND_WIDTH: 768,
  WideScreenBackground: () => null,
}));

jest.mock('@/services/matchmaking', () => ({
  listOpenOnlineMatches: (...args: unknown[]) => mockListOpenOnlineMatches(...args),
  joinOpenOnlineMatch: (...args: unknown[]) => mockJoinOpenOnlineMatch(...args),
}));

jest.mock('@/services/gameModes', () => ({
  resolveGameModeMatchConfig: (...args: unknown[]) => mockResolveGameModeMatchConfig(...args),
}));

jest.mock('@/services/nakama', () => ({
  nakamaService: {
    ensureAuthenticatedDevice: (...args: unknown[]) => mockEnsureAuthenticatedDevice(...args),
  },
}));

jest.mock('@/store/useGameStore', () => ({
  useGameStore: (selector: (state: typeof mockGameStore) => unknown) => selector(mockGameStore),
}));

jest.mock('expo-router', () => ({
  Stack: {
    Screen: () => null,
  },
  useRouter: () => ({
    dismissTo: mockDismissTo,
    push: mockPush,
  }),
}));

jest.mock('expo-font', () => ({
  useFonts: () => [true],
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  }),
}));

const openMatch = {
  openMatchId: 'open-1',
  matchId: 'match-open-1',
  modeId: 'gameMode_3_pieces',
  creatorUserId: 'creator-1',
  joinedUserId: null,
  wager: 40,
  durationMinutes: 5,
  status: 'open',
  createdAt: '2026-04-18T10:00:00.000Z',
  expiresAt: '2026-04-18T10:05:00.000Z',
  updatedAt: '2026-04-18T10:00:00.000Z',
  entrants: 1,
  maxEntrants: 2,
  isCreator: false,
  isJoiner: false,
} as const;

describe('SpectateScreen online matches list', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockResolveGameModeMatchConfig.mockResolvedValue(DEFAULT_MATCH_CONFIG);
    mockEnsureAuthenticatedDevice.mockResolvedValue({
      user_id: 'viewer-1',
      token: 'token',
      refresh_token: 'refresh',
    });
  });

  it('loads created open online matches instead of only in-progress spectatable games', async () => {
    mockListOpenOnlineMatches.mockResolvedValue([openMatch]);

    const view = render(<SpectateScreen />);

    await waitFor(() => expect(view.getByText('Open wager table')).toBeTruthy());

    expect(mockListOpenOnlineMatches).toHaveBeenCalledTimes(1);
    expect(view.getByText('Race · 40 coin wager · 1/2 seats')).toBeTruthy();
    expect(view.getByText('Waiting')).toBeTruthy();
  });

  it('joins an open online match from the matches list', async () => {
    mockListOpenOnlineMatches.mockResolvedValue([openMatch]);
    mockJoinOpenOnlineMatch.mockResolvedValue({
      match: {
        ...openMatch,
        joinedUserId: 'viewer-1',
        status: 'matched',
        entrants: 2,
        isJoiner: true,
      },
      session: {
        user_id: 'viewer-1',
        token: 'token',
        refresh_token: 'refresh',
      },
      userId: 'viewer-1',
    });

    const view = render(<SpectateScreen />);

    await waitFor(() => expect(view.getByText('Open wager table')).toBeTruthy());
    fireEvent.press(view.getByLabelText(/^Join match match-/));

    await waitFor(() => expect(mockJoinOpenOnlineMatch).toHaveBeenCalledWith('open-1'));
    expect(mockGameStore.initGame).toHaveBeenCalledWith('match-open-1', {
      matchConfig: DEFAULT_MATCH_CONFIG,
    });
    expect(mockPush).toHaveBeenCalledWith('/match/match-open-1?modeId=gameMode_3_pieces');
  });
});
