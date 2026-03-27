import { render, screen } from '@testing-library/react-native';
import React from 'react';

import type { PublicTournamentStanding } from '@/src/tournaments/types';
import { TournamentStandingsTable } from './TournamentStandingsTable';

const standings: PublicTournamentStanding[] = [
  {
    rank: 1,
    ownerId: 'user-1',
    username: 'Royal One',
    score: 9,
    subscore: 3,
    attempts: 3,
    maxAttempts: 3,
    matchId: 'match-1',
    round: 3,
    result: 'win',
    updatedAt: '2026-03-27T10:00:00.000Z',
    metadata: {},
  },
  {
    rank: 2,
    ownerId: 'user-2',
    username: 'Royal Two',
    score: 7,
    subscore: 2,
    attempts: 3,
    maxAttempts: 3,
    matchId: 'match-2',
    round: 3,
    result: 'win',
    updatedAt: '2026-03-27T10:01:00.000Z',
    metadata: {},
  },
  {
    rank: 6,
    ownerId: 'user-6',
    username: 'Michel',
    score: 3,
    subscore: 1,
    attempts: 2,
    maxAttempts: 3,
    matchId: 'match-6',
    round: 2,
    result: 'win',
    updatedAt: '2026-03-27T10:03:00.000Z',
    metadata: {},
  },
];

describe('TournamentStandingsTable', () => {
  it('includes the highlighted player in preview mode even when they are outside the top preview rows', () => {
    render(
      <TournamentStandingsTable
        entries={standings}
        emptyMessage="No standings"
        highlightOwnerId="user-6"
        presentation="preview"
        previewLimit={2}
      />,
    );

    expect(screen.getByText('Michel')).toBeTruthy();
    expect(screen.getByText('YOU')).toBeTruthy();
    expect(screen.queryByText('LIVE')).toBeNull();
  });
});
