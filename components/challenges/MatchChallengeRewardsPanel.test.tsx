import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import type { MatchChallengeRewardSummary } from '@/src/challenges/challengeUi';
import { CHALLENGE_IDS } from '@/shared/challenges';
import { MatchChallengeRewardsPanel } from './MatchChallengeRewardsPanel';

const buildSummary = (
  overrides?: Partial<MatchChallengeRewardSummary>,
): MatchChallengeRewardSummary => ({
  xpAwardedTotal: 40,
  newlyCompletedChallenges: [
    {
      challengeId: CHALLENGE_IDS.FIRST_VICTORY,
      name: 'First Victory',
      description: 'Win your first completed game.',
      rewardXp: 10,
      completedAt: '2026-03-28T12:00:00.000Z',
    },
    {
      challengeId: CHALLENGE_IDS.BEAT_EASY_BOT,
      name: 'Bot Tactician',
      description: 'Beat the easy bot.',
      rewardXp: 30,
      completedAt: '2026-03-28T12:00:00.000Z',
    },
  ],
  ...overrides,
});

describe('MatchChallengeRewardsPanel', () => {
  it('renders newly completed challenges collapsed by default', () => {
    render(<MatchChallengeRewardsPanel summary={buildSummary()} />);

    expect(screen.getByText('+40 XP from challenges')).toBeTruthy();
    expect(screen.getByText('2 completed challenges')).toBeTruthy();
    expect(screen.getByText('Show 2 completed challenges')).toBeTruthy();
    expect(screen.queryByText('First Victory')).toBeNull();
    expect(screen.queryByText('Bot Tactician')).toBeNull();
  });

  it('expands and collapses the compact completed challenge list', () => {
    render(<MatchChallengeRewardsPanel summary={buildSummary()} />);

    fireEvent.press(screen.getByText('Show 2 completed challenges'));

    expect(screen.getByText('Hide completed challenges')).toBeTruthy();
    expect(screen.getByText('First Victory')).toBeTruthy();
    expect(screen.getByText('Bot Tactician')).toBeTruthy();
    expect(screen.getByText('+10 XP')).toBeTruthy();
    expect(screen.getByText('+30 XP')).toBeTruthy();
    expect(screen.getAllByText('Just completed')).toHaveLength(2);

    fireEvent.press(screen.getByText('Hide completed challenges'));

    expect(screen.queryByText('First Victory')).toBeNull();
    expect(screen.queryByText('Bot Tactician')).toBeNull();
  });

  it('resets back to collapsed when a new summary arrives', () => {
    const view = render(<MatchChallengeRewardsPanel summary={buildSummary()} />);

    fireEvent.press(screen.getByText('Show 2 completed challenges'));
    expect(screen.getByText('First Victory')).toBeTruthy();

    view.rerender(
      <MatchChallengeRewardsPanel
        summary={buildSummary({
          xpAwardedTotal: 70,
          newlyCompletedChallenges: [
            {
              challengeId: CHALLENGE_IDS.BEAT_MEDIUM_BOT,
              name: 'Medium Mastery',
              description: 'Beat the medium bot.',
              rewardXp: 70,
              completedAt: '2026-03-28T12:10:00.000Z',
            },
          ],
        })}
      />,
    );

    expect(screen.getByText('+70 XP from challenges')).toBeTruthy();
    expect(screen.getByText('1 completed challenge')).toBeTruthy();
    expect(screen.getByText('Show 1 completed challenge')).toBeTruthy();
    expect(screen.queryByText('Medium Mastery')).toBeNull();
  });

  it('returns to the empty state when rewards clear after the list was expanded', () => {
    const view = render(<MatchChallengeRewardsPanel summary={buildSummary()} />);

    fireEvent.press(screen.getByText('Show 2 completed challenges'));
    expect(screen.getByText('First Victory')).toBeTruthy();

    view.rerender(<MatchChallengeRewardsPanel summary={{ newlyCompletedChallenges: [], xpAwardedTotal: 0 }} />);

    expect(screen.getByText('No new challenge rewards')).toBeTruthy();
    expect(screen.queryByText('First Victory')).toBeNull();
  });

  it('shows unchanged loading, error, and empty states', () => {
    const view = render(<MatchChallengeRewardsPanel summary={null} loading />);

    expect(screen.getByText('Confirming match rewards…')).toBeTruthy();
    expect(screen.getByText('Waiting for the archive to return your updated challenge record.')).toBeTruthy();

    view.rerender(<MatchChallengeRewardsPanel summary={null} errorMessage="Archive unavailable" />);

    expect(screen.getByText('Challenge rewards unavailable')).toBeTruthy();
    expect(screen.getByText('Archive unavailable')).toBeTruthy();

    view.rerender(<MatchChallengeRewardsPanel summary={{ newlyCompletedChallenges: [], xpAwardedTotal: 0 }} />);

    expect(screen.getByText('No new challenge rewards')).toBeTruthy();
    expect(screen.getByText('This match did not unlock any new permanent challenge completions.')).toBeTruthy();
  });
});
