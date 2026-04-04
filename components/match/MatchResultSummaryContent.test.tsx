import { render, screen } from '@testing-library/react-native';
import React from 'react';

import { createDefaultUserChallengeProgressSnapshot } from '@/shared/challenges';
import { MatchResultSummaryContent } from './MatchResultSummaryContent';

jest.mock('@expo/vector-icons/MaterialIcons', () => {
  const React = require('react');
  const { Text } = require('react-native');

  const MockMaterialIcons = ({ name, color }: { name: string; color: string }) => (
    <Text accessibilityRole="image" style={{ color }}>
      {name}
    </Text>
  );

  MockMaterialIcons.glyphMap = {
    'arrow-upward': 'arrow-upward',
    remove: 'remove',
    'arrow-downward': 'arrow-downward',
  };

  return MockMaterialIcons;
});

describe('MatchResultSummaryContent', () => {
  it('shows the Elo indicator next to the tournament rating number', () => {
    const challengeProgress = createDefaultUserChallengeProgressSnapshot('2026-03-27T12:00:00.000Z');

    render(
      <MatchResultSummaryContent
        didPlayerWin
        isPracticeModeMatch={false}
        isPrivateMatch={false}
        canSyncOfflineBotRewards={false}
        practiceModeRewardLabel={null}
        isPlaythroughTutorialMatch={false}
        isRankedHumanMatch={false}
        lastEloRatingChange={null}
        eloRatingProfile={null}
        eloUnchangedReason={null}
        shouldShowAccountRewards={false}
        progression={null}
        isRefreshingMatchRewards={false}
        progressionError={null}
        lastProgressionAward={null}
        shouldShowChallengeRewards={false}
        matchChallengeSummary={null}
        matchRewardsErrorMessage={null}
        tournamentRewardSummary={{
          type: 'tournament_match_reward_summary',
          matchId: 'match-1',
          tournamentRunId: 'run-1',
          tournamentId: 'tournament-1',
          round: 2,
          playerUserId: 'self-user',
          didWin: true,
          tournamentOutcome: 'champion',
          eloProfile: {
            leaderboardId: 'elo_global',
            userId: 'self-user',
            usernameDisplay: 'Michel',
            eloRating: 1216,
            ratedGames: 12,
            ratedWins: 8,
            ratedLosses: 4,
            provisional: false,
            rank: 9,
            lastRatedMatchId: 'match-1',
            lastRatedAt: '2026-03-27T12:00:00.000Z',
          },
          eloOld: 1234,
          eloNew: 1216,
          eloDelta: -18,
          totalXpOld: 500,
          totalXpNew: 650,
          totalXpDelta: 150,
          challengeCompletionCount: 1,
          challengeXpDelta: 50,
          shouldEnterWaitingRoom: false,
          progression: {
            totalXp: 650,
            currentRank: 'Scribe',
            currentRankThreshold: 475,
            nextRank: 'Merchant',
            nextRankThreshold: 800,
            xpIntoCurrentRank: 175,
            xpNeededForNextRank: 150,
            progressPercent: 53.85,
          },
          challengeProgress,
        }}
        resultCountdownLabel={null}
      />,
    );

    expect(screen.getByText('1216')).toBeTruthy();
    expect(screen.getByLabelText('Elo decreased')).toBeTruthy();
    expect(screen.getByText('-18 from 1234')).toBeTruthy();
  });
});
