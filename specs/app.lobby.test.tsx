import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import Lobby from '@/app/(game)/lobby';

const mockUseMatchmaking = jest.fn();
const mockUseTournamentList = jest.fn();
const mockReplace = jest.fn();
const mockPush = jest.fn();
const mockJoinPrivateMatchByCode = jest.fn();

jest.mock('@/hooks/useMatchmaking', () => ({
  useMatchmaking: (...args: unknown[]) => mockUseMatchmaking(...args),
}));

jest.mock('@/src/tournaments/useTournamentList', () => ({
  useTournamentList: (...args: unknown[]) => mockUseTournamentList(...args),
}));

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ mode: 'online' }),
  useRouter: () => ({
    replace: mockReplace,
    push: mockPush,
  }),
}));

jest.mock('@/components/ui/MobileBackground', () => ({
  MobileBackground: () => null,
  useMobileBackground: () => false,
}));

jest.mock('@/components/ui/WideScreenBackground', () => ({
  MIN_WIDE_WEB_BACKGROUND_WIDTH: 768,
  WideScreenBackground: () => null,
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
          membership: {
            isJoined: false,
            joinedAt: null,
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
    const joinButton = view.getByText('Join Private Game');

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

    expect(view.getByText('Featured Tournaments')).toBeTruthy();
    expect(view.getByText('Spring Open')).toBeTruthy();
    expect(view.getAllByText('Find Opponent').length).toBeGreaterThan(0);
    expect(view.getByText('Create Private Game')).toBeTruthy();
    expect(view.getByText('Capture')).toBeTruthy();
    expect(view.getByText('Enter Private Game Code')).toBeTruthy();
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
          membership: {
            isJoined: true,
            joinedAt: '2026-03-27T10:05:00.000Z',
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

    expect(view.getByText('Waiting for lobby to fill')).toBeTruthy();
  });
});
