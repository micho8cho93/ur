import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import { ChallengeSummaryCard } from './ChallengeSummaryCard';
import { CHALLENGE_DEFINITIONS, createDefaultUserChallengeProgressSnapshot } from '@/shared/challenges';

const mockUseChallenges = jest.fn();
const mockPush = jest.fn();

jest.mock('@/src/challenges/useChallenges', () => ({
  useChallenges: (...args: unknown[]) => mockUseChallenges(...args),
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('ChallengeSummaryCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows the titled challenge card with completed progress and CTA', () => {
    const definitions = CHALLENGE_DEFINITIONS.slice(0, 3);
    const progress = createDefaultUserChallengeProgressSnapshot('2026-03-21T12:00:00.000Z');
    progress.totalCompleted = 2;

    mockUseChallenges.mockReturnValue({
      definitions,
      progress,
      errorMessage: null,
      isLoading: false,
    });

    render(<ChallengeSummaryCard fontLoaded />);

    expect(screen.getAllByText('Challenges')).toHaveLength(2);
    expect(screen.getByText('2/3')).toBeTruthy();
    expect(screen.getByText('Completed')).toBeTruthy();

    fireEvent.press(screen.getByLabelText('Open challenges page'));

    expect(mockPush).toHaveBeenCalledWith('/challenges');
  });

  it('keeps the internal CTA visible on compact layouts', () => {
    const definitions = CHALLENGE_DEFINITIONS.slice(0, 3);
    const progress = createDefaultUserChallengeProgressSnapshot('2026-03-21T12:00:00.000Z');
    progress.totalCompleted = 2;

    mockUseChallenges.mockReturnValue({
      definitions,
      progress,
      errorMessage: null,
      isLoading: false,
    });

    render(<ChallengeSummaryCard layoutVariant="compact" fontLoaded />);

    expect(screen.getByText('2/3')).toBeTruthy();
    expect(screen.getAllByText('Challenges')).toHaveLength(2);
  });
});
