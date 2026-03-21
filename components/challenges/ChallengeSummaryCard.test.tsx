import { render } from '@testing-library/react-native';
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

jest.mock('../ui/Button', () => ({
  Button: ({ title }: { title: string }) => {
    const React = jest.requireActual('react');
    const { Text } = jest.requireActual('react-native');
    return <Text>{title}</Text>;
  },
}));

describe('ChallengeSummaryCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lists completed challenges without the redundant completion sentence', () => {
    const definitions = CHALLENGE_DEFINITIONS.slice(0, 3);
    const progress = createDefaultUserChallengeProgressSnapshot('2026-03-21T12:00:00.000Z');

    progress.totalCompleted = 2;
    progress.challenges[definitions[0].id] = {
      ...progress.challenges[definitions[0].id],
      completed: true,
      completedAt: '2026-03-20T10:00:00.000Z',
      completedMatchId: 'match-1',
    };
    progress.challenges[definitions[1].id] = {
      ...progress.challenges[definitions[1].id],
      completed: true,
      completedAt: '2026-03-21T09:30:00.000Z',
      completedMatchId: 'match-2',
    };

    mockUseChallenges.mockReturnValue({
      definitions,
      progress,
      errorMessage: null,
      isLoading: false,
      isRefreshing: false,
      refresh: jest.fn(),
    });

    const view = render(<ChallengeSummaryCard />);

    expect(view.getByText('Completed Challenges')).toBeTruthy();
    expect(view.getByText(definitions[0].name)).toBeTruthy();
    expect(view.getByText(definitions[1].name)).toBeTruthy();
    expect(view.queryByText(definitions[2].name)).toBeNull();
    expect(view.queryByText(`You have completed 2 of ${definitions.length} permanent challenges.`)).toBeNull();
  });
});
