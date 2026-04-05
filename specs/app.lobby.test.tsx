import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import Lobby from '@/app/(game)/lobby';

const mockUseMatchmaking = jest.fn();
const mockUseTournamentList = jest.fn();
const mockReplace = jest.fn();
const mockPush = jest.fn();
const mockBack = jest.fn();
const mockCanGoBack = jest.fn();
const mockJoinPrivateMatchByCode = jest.fn();

jest.mock('@/hooks/useMatchmaking', () => ({
  useMatchmaking: (...args: unknown[]) => mockUseMatchmaking(...args),
}));

jest.mock('@/src/tournaments/useTournamentList', () => ({
  useTournamentList: (...args: unknown[]) => mockUseTournamentList(...args),
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
    expect(view.getAllByText('Find Opponent').length).toBeGreaterThan(0);
    expect(view.getByText('Create Private Game')).toBeTruthy();
    expect(view.getByText('Capture')).toBeTruthy();
    expect(view.getByText('Enter Private Code')).toBeTruthy();
  });

  it('removes the extra create-private copy once a private room has been created', () => {
    mockUseMatchmaking.mockReturnValue({
      startMatch: jest.fn(),
      startPrivateMatch: jest.fn(),
      startCreatedPrivateMatch: jest.fn(),
      joinPrivateMatchByCode: mockJoinPrivateMatchByCode,
      clearCreatedPrivateMatch: jest.fn(),
      status: 'idle',
      errorMessage: null,
      onlineCount: 2,
      activeAction: null,
      pendingPrivateMode: null,
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
    expect(view.getByText('Copy Code')).toBeTruthy();
    expect(view.getByText('Start Game')).toBeTruthy();
    expect(view.getByText('Pick Another Ruleset')).toBeTruthy();
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
