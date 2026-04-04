import { render, screen } from '@testing-library/react-native';
import React from 'react';

import { EloMatchSummaryPanel } from './EloMatchSummaryPanel';

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

const baseResult = {
  type: 'elo_rating_update' as const,
  leaderboardId: 'elo_global',
  matchId: 'match-1',
  duplicate: false,
  player: {
    userId: 'self-user',
    usernameDisplay: 'Michel',
    oldRating: 1200,
    newRating: 1218,
    delta: 18,
    provisional: false,
    rank: 18,
    ratedGames: 11,
    ratedWins: 7,
    ratedLosses: 4,
  },
  opponent: {
    userId: 'opponent-user',
    usernameDisplay: 'Opponent',
    oldRating: 1220,
    newRating: 1202,
    delta: -18,
    provisional: false,
    rank: 22,
    ratedGames: 15,
    ratedWins: 9,
    ratedLosses: 6,
  },
};

describe('EloMatchSummaryPanel', () => {
  it('shows a green up indicator for positive Elo change', () => {
    render(<EloMatchSummaryPanel result={baseResult} />);

    expect(screen.getByText('+18 Elo')).toBeTruthy();
    expect(screen.getByText('Rating 1218')).toBeTruthy();
    expect(screen.getByLabelText('Elo increased')).toBeTruthy();
  });

  it('shows a red down indicator for negative Elo change', () => {
    render(
      <EloMatchSummaryPanel
        result={{
          ...baseResult,
          player: {
            ...baseResult.player,
            newRating: 1184,
            delta: -16,
          },
        }}
      />,
    );

    expect(screen.getByText('-16 Elo')).toBeTruthy();
    expect(screen.getByText('Rating 1184')).toBeTruthy();
    expect(screen.getByLabelText('Elo decreased')).toBeTruthy();
  });

  it('shows a neutral indicator when the rating is available but unchanged', () => {
    render(
      <EloMatchSummaryPanel
        result={null}
        pending={false}
        unchangedReason="Offline matches do not affect Elo."
        ratingProfile={{
          leaderboardId: 'elo_global',
          userId: 'self-user',
          usernameDisplay: 'Michel',
          eloRating: 1200,
          ratedGames: 11,
          ratedWins: 7,
          ratedLosses: 4,
          provisional: false,
          rank: 18,
          lastRatedMatchId: 'match-0',
          lastRatedAt: '2026-03-27T12:00:00.000Z',
        }}
      />,
    );

    expect(screen.getByText('Elo unchanged')).toBeTruthy();
    expect(screen.getByText('Rating 1200')).toBeTruthy();
    expect(screen.getByLabelText('Elo unchanged')).toBeTruthy();
    expect(screen.getByText('Offline matches do not affect Elo.')).toBeTruthy();
  });
});
