import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import * as ReactNative from 'react-native';
import Lobby from '@/app/(game)/lobby';
import { getMatchConfig } from '@/logic/matchConfigs';

const mockUseMatchmaking = jest.fn();
const mockUseTournamentList = jest.fn();
const mockUseStore = jest.fn();
const mockUseWallet = jest.fn();
const mockReplace = jest.fn();
const mockPush = jest.fn();
const mockBack = jest.fn();
const mockCanGoBack = jest.fn();
const mockJoinPrivateMatchByCode = jest.fn();
const mockCreateOpenMatch = jest.fn();
const mockJoinOpenMatch = jest.fn();
const mockRefreshCreatedOpenMatch = jest.fn();
const mockListOpenOnlineMatches = jest.fn();
const mockEnsureAuthenticatedDevice = jest.fn();
const mockGetPublicGameModes = jest.fn();
const mockResolveGameModeMatchConfig = jest.fn();
const mockUseMobileBackground = jest.fn();
const originalPlatform = ReactNative.Platform.OS;

jest.mock('@/hooks/useMatchmaking', () => ({
  useMatchmaking: (...args: unknown[]) => mockUseMatchmaking(...args),
}));

jest.mock('@/src/tournaments/useTournamentList', () => ({
  useTournamentList: (...args: unknown[]) => mockUseTournamentList(...args),
}));

jest.mock('@/services/matchmaking', () => ({
  listOpenOnlineMatches: (...args: unknown[]) => mockListOpenOnlineMatches(...args),
}));

jest.mock('@/services/gameModes', () => ({
  getPublicGameModes: (...args: unknown[]) => mockGetPublicGameModes(...args),
  resolveGameModeMatchConfig: (...args: unknown[]) => mockResolveGameModeMatchConfig(...args),
}));

jest.mock('@/services/nakama', () => ({
  nakamaService: {
    ensureAuthenticatedDevice: (...args: unknown[]) => mockEnsureAuthenticatedDevice(...args),
  },
}));

jest.mock('@/src/store/StoreProvider', () => ({
  useStore: () => mockUseStore(),
}));

jest.mock('@/src/wallet/useWallet', () => ({
  useWallet: () => mockUseWallet(),
}));

jest.mock('expo-router', () => ({
  Stack: {
    Screen: () => null,
  },
  useLocalSearchParams: () => ({ mode: 'online' }),
  useRouter: () => ({
    back: mockBack,
    canGoBack: mockCanGoBack,
    replace: mockReplace,
    push: mockPush,
  }),
}));

jest.mock('expo-font', () => ({
  useFonts: () => [true],
}));

jest.mock('@expo/vector-icons/MaterialIcons', () => {
  const React = jest.requireActual('react');
  const { Text } = jest.requireActual('react-native');

  function MockMaterialIcons({ name }: { name: string }) {
    return <Text>{name}</Text>;
  }

  return MockMaterialIcons;
});

jest.mock('@/components/ui/MobileBackground', () => ({
  MobileBackground: () => null,
  useMobileBackground: () => mockUseMobileBackground(),
}));

jest.mock('@/components/ui/WideScreenBackground', () => ({
  MIN_WIDE_WEB_BACKGROUND_WIDTH: 768,
  WideScreenBackground: () => null,
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  }),
}));

jest.mock('@/components/ui/Button', () => ({
  Button: ({
    title,
    onPress,
    disabled,
  }: {
    title: string;
    onPress?: () => void;
    disabled?: boolean;
  }) => {
    const React = jest.requireActual('react');
    const { Text, TouchableOpacity } = jest.requireActual('react-native');

    return (
      <TouchableOpacity accessibilityState={{ disabled }} disabled={disabled} onPress={onPress}>
        <Text>{title}</Text>
      </TouchableOpacity>
    );
  },
}));

describe('Lobby private game join input', () => {
  let useWindowDimensionsSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseMobileBackground.mockReturnValue(false);
    useWindowDimensionsSpy = jest.spyOn(ReactNative, 'useWindowDimensions');
    useWindowDimensionsSpy.mockReturnValue({ width: 430, height: 932, scale: 1, fontScale: 1 });
    mockCanGoBack.mockReturnValue(true);
    mockUseMatchmaking.mockReturnValue({
      startMatch: jest.fn(),
      createOpenMatch: mockCreateOpenMatch,
      joinOpenMatch: mockJoinOpenMatch,
      refreshCreatedOpenMatch: mockRefreshCreatedOpenMatch,
      startPrivateMatch: jest.fn(),
      startCreatedPrivateMatch: jest.fn(),
      joinPrivateMatchByCode: mockJoinPrivateMatchByCode,
      clearCreatedPrivateMatch: jest.fn(),
      status: 'idle',
      errorMessage: null,
      onlineCount: 2,
      activeAction: null,
      pendingPrivateMode: null,
      createdPrivateMatch: null,
      createdOpenOnlineMatch: null,
    });
    mockRefreshCreatedOpenMatch.mockResolvedValue(null);
    mockListOpenOnlineMatches.mockResolvedValue([]);
    mockEnsureAuthenticatedDevice.mockResolvedValue({
      user_id: 'viewer-1',
      token: 'token',
      refresh_token: 'refresh',
    });
    mockGetPublicGameModes.mockResolvedValue({
      featuredMode: null,
      activeModes: [],
    });
    mockResolveGameModeMatchConfig.mockImplementation(async (modeId?: string | null) =>
      getMatchConfig(modeId ?? 'standard'),
    );
    mockUseStore.mockReturnValue({
      softCurrency: 1234,
    });
    mockUseWallet.mockReturnValue({
      softCurrency: 1234,
      premiumCurrency: 9,
      refresh: jest.fn(),
    });
    mockUseTournamentList.mockReturnValue({
      tournaments: [
        {
          runId: 'spring-open',
          tournamentId: 'spring-open',
          name: 'Spring Open',
          description: 'A live public bracket with full standings.',
          lifecycle: 'open',
          startAt: '2026-03-27T10:00:00.000Z',
          endAt: null,
          updatedAt: '2026-03-27T10:00:00.000Z',
          entrants: 8,
          maxEntrants: 16,
          gameMode: 'standard',
          region: 'Global',
          buyInLabel: 'Free',
          prizeLabel: 'No prize listed',
          bots: {
            autoAdd: false,
            difficulty: null,
            count: 0,
          },
          isLocked: false,
          currentRound: null,
          membership: {
            isJoined: false,
            joinedAt: null,
          },
          participation: {
            state: null,
            currentRound: null,
            currentEntryId: null,
            activeMatchId: null,
            finalPlacement: null,
            lastResult: null,
            canLaunch: false,
          },
        },
      ],
      isLoading: false,
      errorMessage: null,
      joinTournament: jest.fn(),
      launchMatch: jest.fn(),
      joiningRunId: null,
      launchingRunId: null,
    });
  });

  afterEach(() => {
    useWindowDimensionsSpy.mockRestore();
    Object.defineProperty(ReactNative.Platform, 'OS', {
      configurable: true,
      value: originalPlatform,
    });
  });

  it('accepts a private code and joins with the normalized value', () => {
    const view = render(<Lobby />);

    const input = view.getByPlaceholderText('Enter code');
    const joinButton = view.getByText('Join Game');

    fireEvent.press(joinButton);

    expect(mockJoinPrivateMatchByCode).not.toHaveBeenCalled();

    fireEvent.changeText(input, 'ab23-cd45');

    expect(input.props.value).toBe('AB23CD45');

    fireEvent.press(joinButton);

    expect(mockJoinPrivateMatchByCode).toHaveBeenCalledWith('AB23CD45');
  });

  it('hides the idle helper status copy on the online cards', () => {
    const view = render(<Lobby />);

    expect(view.queryByText('Quick-match into a live public game.')).toBeNull();
    expect(
      view.queryByText('Choose a ruleset, generate a short code, and invite a friend. Private wins award reduced XP.'),
    ).toBeNull();
    expect(view.queryByText('Enter the short code your friend shared with you.')).toBeNull();
    expect(view.queryByText('Paste the short code your friend sent you to enter their private table.')).toBeNull();
    expect(view.queryByText('Choose your game mode.')).toBeNull();
  });

  it('renders the tournament and match summary cards above the existing matchmaking cards', () => {
    const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(Date.parse('2026-03-27T08:00:00.000Z'));
    const view = render(<Lobby />);

    expect(view.getByLabelText('See List')).toBeTruthy();
    expect(view.getByLabelText('Matches')).toBeTruthy();
    expect(view.getByText('1 public tournament open')).toBeTruthy();
    expect(view.getByText('2h 0m until next tournament')).toBeTruthy();
    expect(view.getByText('Create Match')).toBeTruthy();
    expect(view.getByText('Enter Code')).toBeTruthy();

    nowSpy.mockRestore();
  });

  it('renders the store action and opens the store route', () => {
    const view = render(<Lobby />);

    expect(view.getByText('shopping-cart')).toBeTruthy();
    expect(view.getByLabelText('1,234 coins')).toBeTruthy();
    expect(view.getByLabelText('9 gems')).toBeTruthy();

    fireEvent.press(view.getByLabelText('Store'));

    expect(mockPush).toHaveBeenCalledWith('/store');
  });

  it('clamps wager controls and creates an open match with the selected duration', () => {
    mockCreateOpenMatch.mockResolvedValue({
      openMatchId: 'open-1',
      matchId: 'match-open-1',
      modeId: 'standard',
      creatorUserId: 'user-1',
      joinedUserId: null,
      wager: 20,
      durationMinutes: 10,
      status: 'open',
      createdAt: '2026-04-18T10:00:00.000Z',
      expiresAt: '2026-04-18T10:10:00.000Z',
      updatedAt: '2026-04-18T10:00:00.000Z',
      entrants: 1,
      maxEntrants: 2,
      isCreator: true,
      isJoiner: false,
    });

    const view = render(<Lobby />);

    fireEvent.press(view.getByText('Race'));
    fireEvent.press(view.getByLabelText('Decrease wager'));
    fireEvent.press(view.getByLabelText('Increase wager'));
    fireEvent.press(view.getByText('Set'));
    fireEvent.press(view.getByText('Online'));
    fireEvent.press(view.getByText('10 min'));
    fireEvent.press(view.getAllByText('Create Match')[1]);

    expect(mockCreateOpenMatch).toHaveBeenCalledWith(20, 10, 'gameMode_3_pieces');
  });

  it('shows the wait time prompt lower on the card with all duration options visible', () => {
    const view = render(<Lobby />);

    fireEvent.press(view.getByText('Race'));
    fireEvent.press(view.getByText('Set'));
    fireEvent.press(view.getByText('Online'));

    expect(view.getByText('How long to wait for an opponent?')).toBeTruthy();
    expect(view.getByLabelText('3 minute open match')).toBeTruthy();
    expect(view.getByLabelText('5 minute open match')).toBeTruthy();
    expect(view.getByLabelText('10 minute open match')).toBeTruthy();
    expect(view.queryByText('Set your coin wager.')).toBeNull();
    expect(view.queryByText('Online or private match?')).toBeNull();
  });

  it('shows the open match count in the summary card and opens the live matches list', async () => {
    mockListOpenOnlineMatches.mockResolvedValue([
      {
        openMatchId: 'open-join-1',
        matchId: 'match-open-join-1',
        modeId: 'standard',
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
      },
    ]);

    const view = render(<Lobby />);

    await waitFor(() => expect(view.getByText('1 online match open')).toBeTruthy());
    fireEvent.press(view.getByLabelText('Matches'));

    expect(mockPush).toHaveBeenCalledWith('/(game)/spectate');
  });

  it('keeps the open-table waiting card uncluttered and hides the shortcut buttons', () => {
    mockUseMatchmaking.mockReturnValue({
      startMatch: jest.fn(),
      createOpenMatch: mockCreateOpenMatch,
      joinOpenMatch: mockJoinOpenMatch,
      refreshCreatedOpenMatch: mockRefreshCreatedOpenMatch,
      startPrivateMatch: jest.fn(),
      startCreatedPrivateMatch: jest.fn(),
      joinPrivateMatchByCode: mockJoinPrivateMatchByCode,
      clearCreatedPrivateMatch: jest.fn(),
      status: 'idle',
      errorMessage: null,
      onlineCount: 2,
      activeAction: null,
      pendingPrivateMode: null,
      createdPrivateMatch: null,
      createdOpenOnlineMatch: {
        openMatchId: 'open-1',
        matchId: 'match-open-1',
        modeId: 'gameMode_3_pieces',
        creatorUserId: 'user-1',
        joinedUserId: null,
        wager: 20,
        durationMinutes: 5,
        status: 'open',
        createdAt: '2026-04-18T10:00:00.000Z',
        expiresAt: '2026-04-18T10:05:00.000Z',
        updatedAt: '2026-04-18T10:00:00.000Z',
        entrants: 1,
        maxEntrants: 2,
        isCreator: true,
        isJoiner: false,
      },
    });

    const view = render(<Lobby />);

    expect(view.getByText('Waiting for an opponent · 20 coins')).toBeTruthy();
    expect(view.queryByLabelText('Play bot while waiting')).toBeNull();
    expect(view.queryByLabelText('Go to inventory while waiting')).toBeNull();
    expect(view.queryByLabelText('Go to store while waiting')).toBeNull();
  });

  it('removes the extra create-private copy once a private room has been created', () => {
    mockUseMatchmaking.mockReturnValue({
      startMatch: jest.fn(),
      createOpenMatch: mockCreateOpenMatch,
      joinOpenMatch: mockJoinOpenMatch,
      refreshCreatedOpenMatch: mockRefreshCreatedOpenMatch,
      startPrivateMatch: jest.fn(),
      startCreatedPrivateMatch: jest.fn(),
      joinPrivateMatchByCode: mockJoinPrivateMatchByCode,
      clearCreatedPrivateMatch: jest.fn(),
      status: 'idle',
      errorMessage: null,
      onlineCount: 2,
      activeAction: null,
      pendingPrivateMode: null,
      createdOpenOnlineMatch: null,
      createdPrivateMatch: {
        matchId: 'private-1',
        modeId: 'gameMode_3_pieces',
        code: 'CAPTURE1',
        session: { user_id: 'host-1' },
        userId: 'host-1',
        hasGuestJoined: false,
      },
    });

    const view = render(<Lobby />);

    expect(view.queryByText('Make a shareable room code for a friend.')).toBeNull();
    expect(
      view.queryByText(
        'Your code is ready. Share it now, then start the game whenever you want. The board stays locked until your friend arrives.',
      ),
    ).toBeNull();
    expect(view.queryByText('Copy Code')).toBeNull();
    expect(view.getByLabelText('Waiting for friend to join').props.accessibilityState.disabled).toBe(true);
    expect(view.getByText('Cancel')).toBeTruthy();
  });

  it('shows the game mode of the month under Finkel Rules when one is featured', async () => {
    mockGetPublicGameModes.mockResolvedValueOnce({
      featuredMode: {
        id: 'gameMode_monthly',
        name: 'Game Mode of the Month',
        description: 'This month\'s featured rules.',
      },
      activeModes: [],
    });

    const view = render(<Lobby />);

    await waitFor(() => expect(view.getByText('Game Mode of the Month')).toBeTruthy());
    expect(view.getByText('Finkel Rules')).toBeTruthy();
  });

  it('enables scrolling on native mobile viewports', () => {
    Object.defineProperty(ReactNative.Platform, 'OS', {
      configurable: true,
      value: 'ios',
    });

    const view = render(<Lobby />);

    expect(view.getByTestId('lobby-scroll-view').props.scrollEnabled).toBe(true);
  });

  it('enables scrolling on narrow mobile web viewports', () => {
    Object.defineProperty(ReactNative.Platform, 'OS', {
      configurable: true,
      value: 'web',
    });
    mockUseMobileBackground.mockReturnValue(true);
    useWindowDimensionsSpy.mockReturnValue({ width: 390, height: 740, scale: 1, fontScale: 1 });

    const view = render(<Lobby />);

    expect(view.getByTestId('lobby-scroll-view').props.scrollEnabled).toBe(true);
  });

  it('renders the tournament summary card in the empty state', () => {
    mockUseTournamentList.mockReturnValue({
      tournaments: [],
      isLoading: false,
      errorMessage: null,
    });

    const view = render(<Lobby />);

    expect(view.getByText('0 public tournaments open')).toBeTruthy();
    expect(view.getByLabelText('See List')).toBeTruthy();
  });

  it('opens the live matches page from the match summary card', () => {
    const view = render(<Lobby />);

    fireEvent.press(view.getByLabelText('Matches'));

    expect(mockPush).toHaveBeenCalledWith('/(game)/spectate');
  });

  it('keeps the tournament summary card visible for joined tournaments', () => {
    mockUseTournamentList.mockReturnValue({
      tournaments: [
        {
          runId: 'spring-open',
          tournamentId: 'spring-open',
          name: 'Spring Open',
          description: 'A live public bracket with full standings.',
          lifecycle: 'open',
          startAt: '2026-03-27T10:00:00.000Z',
          endAt: null,
          updatedAt: '2026-03-27T10:00:00.000Z',
          entrants: 8,
          maxEntrants: 16,
          gameMode: 'standard',
          region: 'Global',
          buyInLabel: 'Free',
          prizeLabel: 'No prize listed',
          bots: {
            autoAdd: false,
            difficulty: null,
            count: 0,
          },
          isLocked: false,
          currentRound: null,
          membership: {
            isJoined: true,
            joinedAt: '2026-03-27T10:05:00.000Z',
          },
          participation: {
            state: 'lobby',
            currentRound: null,
            currentEntryId: null,
            activeMatchId: null,
            finalPlacement: null,
            lastResult: null,
            canLaunch: false,
          },
        },
      ],
      isLoading: false,
      errorMessage: null,
      joinTournament: jest.fn(),
      launchMatch: jest.fn(),
      joiningRunId: null,
      launchingRunId: null,
    });

    const view = render(<Lobby />);

    expect(view.getByText('1 public tournament open')).toBeTruthy();
    expect(view.getByLabelText('See List')).toBeTruthy();
  });

  it('falls back to home when back navigation is unavailable', () => {
    mockCanGoBack.mockReturnValue(false);

    const view = render(<Lobby />);

    fireEvent.press(view.getByLabelText('Back'));

    expect(mockBack).not.toHaveBeenCalled();
    expect(mockReplace).toHaveBeenCalledWith('/');
  });
});
