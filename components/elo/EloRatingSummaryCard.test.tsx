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
    });
  });

  it('shows the titled rating card with the leaderboard CTA', () => {
    render(<EloRatingSummaryCard fontLoaded />);

    expect(screen.getByText('Elo Rating')).toBeTruthy();
    expect(screen.getByText('1234')).toBeTruthy();
    expect(screen.getByText('Rank #42')).toBeTruthy();

    fireEvent.press(screen.getByLabelText('Open leaderboard'));

    expect(mockPush).toHaveBeenCalledWith('/leaderboard');
  });

  it('shows the locked state copy for guest users', () => {
    mockUseAuth.mockReturnValue({
      user: {
        provider: 'guest',
      },
      isUsernameOnboardingLoading: false,
      isUsernameOnboardingRequired: false,
    });

    render(<EloRatingSummaryCard fontLoaded />);

    expect(screen.getByText('Locked')).toBeTruthy();
    expect(screen.getByText('Google sign-in required')).toBeTruthy();
    expect(screen.getByText('Leaderboard')).toBeTruthy();
  });

  it('keeps the internal leaderboard CTA visible on compact layouts', () => {
    render(<EloRatingSummaryCard layoutVariant="compact" fontLoaded />);

    expect(screen.getByText('1234')).toBeTruthy();
    expect(screen.getByText('Rank #42')).toBeTruthy();
    expect(screen.getByText('Leaderboard')).toBeTruthy();
  });
});
