import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import { EloRatingSummaryCard } from './EloRatingSummaryCard';

const mockUseAuth = jest.fn();
const mockUseEloRating = jest.fn();
const mockPush = jest.fn();

jest.mock('@/src/auth/useAuth', () => ({
  useAuth: (...args: unknown[]) => mockUseAuth(...args),
}));

jest.mock('@/src/elo/useEloRating', () => ({
  useEloRating: (...args: unknown[]) => mockUseEloRating(...args),
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

jest.mock('../ui/Button', () => ({
  Button: ({ title, onPress }: { title: string; onPress?: () => void }) => {
    const React = jest.requireActual('react');
    const { Text, TouchableOpacity } = jest.requireActual('react-native');

    return (
      <TouchableOpacity accessibilityRole="button" onPress={onPress}>
        <Text>{title}</Text>
      </TouchableOpacity>
    );
  },
}));

describe('EloRatingSummaryCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockUseAuth.mockReturnValue({
      user: {
        provider: 'google',
      },
      isUsernameOnboardingLoading: false,
      isUsernameOnboardingRequired: false,
    });

    mockUseEloRating.mockReturnValue({
      ratingProfile: {
        leaderboardId: 'elo_global',
        userId: 'user-1',
        usernameDisplay: 'Player One',
        eloRating: 1234,
        ratedGames: 12,
        ratedWins: 7,
        ratedLosses: 5,
        provisional: false,
        rank: 42,
        lastRatedMatchId: 'match-1',
        lastRatedAt: '2026-03-21T10:00:00.000Z',
      },
      errorMessage: null,
      isLoading: false,
      isRefreshing: false,
      refresh: jest.fn(),
    });
  });

  it('opens and closes the Elo explanation modal', () => {
    render(<EloRatingSummaryCard />);

    expect(screen.queryByText('How Elo Works')).toBeNull();

    fireEvent.press(screen.getByLabelText('Explain the Elo rating system'));

    expect(screen.getByText('How Elo Works')).toBeTruthy();
    expect(screen.getByText('Everyone starts at 1200 Elo.')).toBeTruthy();
    expect(
      screen.getByText('Your first 10 rated games are provisional, so your rating moves faster (40 K-factor instead of 24).'),
    ).toBeTruthy();

    fireEvent.press(screen.getByRole('button', { name: 'Close' }));

    expect(screen.queryByText('How Elo Works')).toBeNull();
  });
});
