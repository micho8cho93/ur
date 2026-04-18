import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import Lobby from '@/app/(game)/lobby';

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

jest.mock('@/hooks/useMatchmaking', () => ({
  useMatchmaking: (...args: unknown[]) => mockUseMatchmaking(...args),
}));

jest.mock('@/src/tournaments/useTournamentList', () => ({
  useTournamentList: (...args: unknown[]) => mockUseTournamentList(...args),
}));

jest.mock('@/services/matchmaking', () => ({
  listOpenOnlineMatches: (...args: unknown[]) => mockListOpenOnlineMatches(...args),
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
  useMobileBackground: () => false,
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
  beforeEach(() => {
    jest.clearAllMocks();
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
  });

  it('renders featured tournaments above the existing matchmaking cards', () => {
    const view = render(<Lobby />);

    expect(view.getByLabelText('See all tournaments')).toBeTruthy();
    expect(view.getByText('Spring Open')).toBeTruthy();
    expect(view.getByText('Create Online Match')).toBeTruthy();
    expect(view.getByText('Capture')).toBeTruthy();
    expect(view.getByText('Enter Private Code')).toBeTruthy();
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
    fireEvent.press(view.getByText('Create Match'));

    expect(mockCreateOpenMatch).toHaveBeenCalledWith(20, 10, 'gameMode_3_pieces');
  });

  it('renders open online matches and joins selected matches', async () => {
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
    mockJoinOpenMatch.mockResolvedValue({
      openMatchId: 'open-join-1',
      matchId: 'match-open-join-1',
      modeId: 'standard',
      creatorUserId: 'creator-1',
      joinedUserId: 'joiner-1',
      wager: 40,
      durationMinutes: 5,
      status: 'matched',
      createdAt: '2026-04-18T10:00:00.000Z',
      expiresAt: '2026-04-18T10:05:00.000Z',
      updatedAt: '2026-04-18T10:01:00.000Z',
      entrants: 2,
      maxEntrants: 2,
      isCreator: false,
      isJoiner: true,
    });

    const view = render(<Lobby />);

    await waitFor(() => expect(view.getByText('Open Wager Match')).toBeTruthy());
    expect(view.getByText('40 coins')).toBeTruthy();

    fireEvent.press(view.getByText('Join Match'));

    await waitFor(() => expect(mockJoinOpenMatch).toHaveBeenCalledWith('open-join-1'));
  });

  it('renders live online matches with a direct spectate action', async () => {
    mockListOpenOnlineMatches.mockResolvedValue([
      {
        openMatchId: 'open-live-1',
        matchId: 'match-live-1',
        modeId: 'gameMode_capture',
        creatorUserId: 'creator-1',
        joinedUserId: 'joiner-1',
        wager: 40,
        durationMinutes: 5,
        status: 'matched',
        createdAt: '2026-04-18T10:00:00.000Z',
        expiresAt: '2026-04-18T10:05:00.000Z',
        updatedAt: '2026-04-18T10:01:00.000Z',
        entrants: 2,
        maxEntrants: 2,
        isCreator: false,
        isJoiner: false,
      },
    ]);

    const view = render(<Lobby />);

    await waitFor(() => expect(view.getByText('Live Wager Match')).toBeTruthy());
    expect(view.getByText('In Progress')).toBeTruthy();

    fireEvent.press(view.getByText('Spectate'));

    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith('/match/match-live-1?modeId=gameMode_capture&spectator=1'),
    );
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
        modeId: 'gameMode_capture',
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
    expect(view.getByText('Start Game')).toBeTruthy();
    expect(view.getByText('Cancel')).toBeTruthy();
  });

  it('renders the tournaments button inside the empty featured state card', () => {
    mockUseTournamentList.mockReturnValue({
      tournaments: [],
      isLoading: false,
      errorMessage: null,
      joinTournament: jest.fn(),
      launchMatch: jest.fn(),
      joiningRunId: null,
      launchingRunId: null,
    });

    const view = render(<Lobby />);

    expect(view.getByText('No featured tournaments yet')).toBeTruthy();
    expect(
      view.getByText('Public tournament runs will appear here as soon as operators open them for play.'),
    ).toBeTruthy();
    expect(view.getByLabelText('See all tournaments')).toBeTruthy();
  });

  it('shows a waiting state for joined tournaments until the lobby fills', () => {
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

    expect(view.getAllByText('Waiting for lobby to fill').length).toBeGreaterThan(0);
  });

  it('falls back to home when back navigation is unavailable', () => {
    mockCanGoBack.mockReturnValue(false);

    const view = render(<Lobby />);

    fireEvent.press(view.getByLabelText('Back'));

    expect(mockBack).not.toHaveBeenCalled();
    expect(mockReplace).toHaveBeenCalledWith('/');
  });
});
