import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import type { PublicTournamentStanding } from '@/src/tournaments/types';
import { TournamentWaitingRoom } from './TournamentWaitingRoom';

const standings: PublicTournamentStanding[] = [
  {
    rank: 1,
    ownerId: 'user-1',
    username: 'Michel',
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
    username: 'Opponent',
    score: 8,
    subscore: 2,
    attempts: 3,
    maxAttempts: 3,
    matchId: 'match-2',
    round: 3,
    result: 'win',
    updatedAt: '2026-03-27T10:01:00.000Z',
    metadata: {},
  },
];

describe('TournamentWaitingRoom', () => {
  it('renders the waiting state with the current player highlighted', () => {
    render(
      <TournamentWaitingRoom
        visible
        phase="waiting"
        tournamentName="Spring Open"
        derivedRound={3}
        statusText="Another match is still in progress."
        subtleStatusText="Standings stay live here while the next pairing settles."
        retryMessage={null}
        standings={standings}
        currentStanding={standings[0]}
        highlightOwnerId="user-1"
        finalPlacement={null}
        isChampion={false}
        onBackToStandings={jest.fn()}
        onReturnToMainPage={jest.fn()}
      />,
    );

    expect(screen.getByTestId('tournament-waiting-room')).toBeTruthy();
    expect(screen.getByText('Spring Open')).toBeTruthy();
    expect(screen.getByText('Another match is still in progress.')).toBeTruthy();
    expect(screen.getByText('YOU')).toBeTruthy();
  });

  it('shows the ready state and calls the fallback action', () => {
    const handleBack = jest.fn();

    render(
      <TournamentWaitingRoom
        visible
        phase="ready"
        tournamentName="Spring Open"
        derivedRound={3}
        statusText="Next round ready"
        subtleStatusText="Opponent found."
        retryMessage="The next match was not ready yet."
        standings={standings}
        currentStanding={standings[0]}
        highlightOwnerId="user-1"
        finalPlacement={null}
        isChampion={false}
        onBackToStandings={handleBack}
        onReturnToMainPage={jest.fn()}
      />,
    );

    fireEvent.press(screen.getByText('Back to Standings'));

    expect(screen.getByText('Next round ready')).toBeTruthy();
    expect(screen.getByText('The next match was not ready yet.')).toBeTruthy();
    expect(handleBack).toHaveBeenCalledTimes(1);
  });

  it('renders finalized champion copy when the tournament is complete', () => {
    render(
      <TournamentWaitingRoom
        visible
        phase="finalized"
        tournamentName="Spring Open"
        derivedRound={3}
        statusText="You claimed the tournament crown."
        subtleStatusText="Your run is complete and the final standings are locked."
        retryMessage={null}
        standings={standings}
        currentStanding={standings[0]}
        highlightOwnerId="user-1"
        finalPlacement={1}
        isChampion
        onBackToStandings={jest.fn()}
        onReturnToMainPage={jest.fn()}
      />,
    );

    expect(screen.getByText('Champion Crowned')).toBeTruthy();
    expect(screen.getByText('Final placement: Champion')).toBeTruthy();
    expect(screen.getByText('Return to Main Page')).toBeTruthy();
  });

  it('renders eliminated actions for a finished run', () => {
    const handleBack = jest.fn();
    const handleExit = jest.fn();

    render(
      <TournamentWaitingRoom
        visible
        phase="eliminated"
        tournamentName="Spring Open"
        derivedRound={3}
        statusText="Your tournament run has ended."
        subtleStatusText="Return to the standings to review the final board."
        retryMessage={null}
        standings={standings}
        currentStanding={standings[0]}
        highlightOwnerId="user-1"
        finalPlacement={4}
        isChampion={false}
        onBackToStandings={handleBack}
        onReturnToMainPage={handleExit}
      />,
    );

    fireEvent.press(screen.getByText('Back to Standings'));
    fireEvent.press(screen.getByText('Return to Main Page'));

    expect(screen.getByText('Tournament Run Ended')).toBeTruthy();
    expect(handleBack).toHaveBeenCalledTimes(1);
    expect(handleExit).toHaveBeenCalledTimes(1);
  });
});
