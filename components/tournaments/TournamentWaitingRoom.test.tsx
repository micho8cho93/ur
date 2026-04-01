import { act, fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import * as ReactNative from 'react-native';
import { Platform, StyleSheet } from 'react-native';

import { createDefaultUserChallengeProgressSnapshot } from '@/shared/challenges';
import { buildProgressionSnapshot } from '@/shared/progression';
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
];

const rewardSummary = {
  type: 'tournament_match_reward_summary' as const,
  matchId: 'match-1',
  tournamentRunId: 'run-1',
  tournamentId: 'tournament-1',
  round: 3,
  playerUserId: 'user-1',
  didWin: true,
  tournamentOutcome: 'advancing' as const,
  eloProfile: {
    leaderboardId: 'elo_global',
    userId: 'user-1',
    usernameDisplay: 'Michel',
    eloRating: 1224,
    ratedGames: 11,
    ratedWins: 7,
    ratedLosses: 4,
    provisional: false,
    rank: 18,
    lastRatedMatchId: 'match-1',
    lastRatedAt: '2026-03-27T10:00:00.000Z',
  },
  eloOld: 1200,
  eloNew: 1224,
  eloDelta: 24,
  totalXpOld: 500,
  totalXpNew: 690,
  totalXpDelta: 190,
  challengeCompletionCount: 2,
  challengeXpDelta: 90,
  shouldEnterWaitingRoom: true,
  progression: buildProgressionSnapshot(690),
  challengeProgress: createDefaultUserChallengeProgressSnapshot('2026-03-27T10:00:00.000Z'),
};

describe('TournamentWaitingRoom', () => {
  let useWindowDimensionsSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.useFakeTimers();
    useWindowDimensionsSpy = jest.spyOn(ReactNative, 'useWindowDimensions');
    useWindowDimensionsSpy.mockReturnValue({ width: 1024, height: 768, scale: 1, fontScale: 1 });
    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      get: () => 'ios',
    });
  });

  afterEach(() => {
    jest.useRealTimers();
    useWindowDimensionsSpy.mockRestore();
  });

  it('renders the full-screen intermission state with the start-room visual shell and reward cards', () => {
    render(
      <TournamentWaitingRoom
        visible
        phase="waiting"
        tournamentName="Spring Open"
        derivedRound={3}
        statusText="Another match is still in progress."
        subtleStatusText="The next board will launch automatically when both winners arrive."
        retryMessage={null}
        standings={standings}
        currentStanding={standings[0]}
        highlightOwnerId="user-1"
        finalPlacement={null}
        isChampion={false}
        rewardSummary={rewardSummary}
        onReturnToMainPage={jest.fn()}
      />,
    );

    expect(screen.getByTestId('tournament-waiting-room')).toBeTruthy();
    expect(screen.getByText('Tournament Waiting Room')).toBeTruthy();
    expect(screen.getByText('Spring Open')).toBeTruthy();
    expect(screen.getByText('Round 3')).toBeTruthy();
    expect(screen.getByText('Another match is still in progress.')).toBeTruthy();
    expect(screen.getByText('Challenges Locked')).toBeTruthy();
    expect(screen.getByText('2 challenges completed')).toBeTruthy();
    expect(screen.queryByText('Return to Home Page')).toBeNull();
  });

  it('rotates to the next card every 15 seconds while the bracket is still waiting', () => {
    render(
      <TournamentWaitingRoom
        visible
        phase="waiting"
        tournamentName="Spring Open"
        derivedRound={3}
        statusText="Another match is still in progress."
        subtleStatusText="The next board will launch automatically when both winners arrive."
        retryMessage={null}
        standings={standings}
        currentStanding={standings[0]}
        highlightOwnerId="user-1"
        finalPlacement={null}
        isChampion={false}
        rewardSummary={rewardSummary}
        onReturnToMainPage={jest.fn()}
      />,
    );

    expect(screen.getByText('Challenges Locked')).toBeTruthy();

    act(() => {
      jest.advanceTimersByTime(15_000);
    });

    expect(screen.getByText('XP Locked')).toBeTruthy();

    act(() => {
      jest.advanceTimersByTime(15_000);
    });

    expect(
      screen.getByText(
        'Mesopotamia grew between the Tigris and Euphrates, where cities like Ur became major centers of trade and ritual.',
      ),
    ).toBeTruthy();
  });

  it('shows a 3 second ready countdown before launching the next round', () => {
    const handleLaunch = jest.fn();

    render(
      <TournamentWaitingRoom
        visible
        phase="ready"
        tournamentName="Spring Open"
        derivedRound={3}
        statusText="Match found"
        subtleStatusText="The next board will launch on the current card boundary."
        retryMessage={null}
        standings={standings}
        currentStanding={standings[0]}
        highlightOwnerId="user-1"
        finalPlacement={null}
        isChampion={false}
        rewardSummary={rewardSummary}
        onReturnToMainPage={jest.fn()}
        onLaunchNextMatch={handleLaunch}
      />,
    );

    expect(screen.getByText('Next round starts in 3s')).toBeTruthy();
    expect(handleLaunch).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(1_000);
    });

    expect(screen.getByText('Next round starts in 2s')).toBeTruthy();
    expect(handleLaunch).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(1_000);
    });

    expect(screen.getByText('Next round starts in 1s')).toBeTruthy();
    expect(handleLaunch).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(1_000);
    });

    expect(handleLaunch).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Opening next round...')).toBeTruthy();
  });

  it('renders finalized champion copy when the tournament is complete', () => {
    const handleExit = jest.fn();

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
        rewardSummary={rewardSummary}
        onReturnToMainPage={handleExit}
      />,
    );

    fireEvent.press(screen.getByText('Return to Home Page'));

    expect(screen.getByText('Final placement: Champion')).toBeTruthy();
    expect(screen.getAllByText('Tournament Won').length).toBeGreaterThan(0);
    expect(screen.getByText('Champion')).toBeTruthy();
    expect(screen.getByText('Return to Home Page')).toBeTruthy();
    expect(handleExit).toHaveBeenCalledTimes(1);
  });

  it('renders eliminated actions for a finished run', () => {
    const handleExit = jest.fn();

    render(
      <TournamentWaitingRoom
        visible
        phase="eliminated"
        tournamentName="Spring Open"
        derivedRound={3}
        statusText="Your tournament run has ended."
        subtleStatusText="Your final result is locked in."
        retryMessage={null}
        standings={standings}
        currentStanding={standings[0]}
        highlightOwnerId="user-1"
        finalPlacement={4}
        isChampion={false}
        rewardSummary={null}
        onReturnToMainPage={handleExit}
      />,
    );

    fireEvent.press(screen.getByText('Return to Home Page'));

    expect(screen.getByText('Your tournament run has ended.')).toBeTruthy();
    expect(screen.getByText('Return to Home Page')).toBeTruthy();
    expect(handleExit).toHaveBeenCalledTimes(1);
  });

  it('switches to the compact scroll-safe layout on narrow mobile web viewports', () => {
    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      get: () => 'web',
    });
    useWindowDimensionsSpy.mockReturnValue({ width: 390, height: 740, scale: 1, fontScale: 1 });

    render(
      <TournamentWaitingRoom
        visible
        phase="waiting"
        tournamentName="Spring Open"
        derivedRound={3}
        statusText="Another match is still in progress."
        subtleStatusText="The next board will launch automatically when both winners arrive."
        retryMessage={null}
        standings={standings}
        currentStanding={standings[0]}
        highlightOwnerId="user-1"
        finalPlacement={null}
        isChampion={false}
        rewardSummary={rewardSummary}
        onReturnToMainPage={jest.fn()}
      />,
    );

    expect(screen.getByTestId('tournament-waiting-room-scroll')).toBeTruthy();
    expect(StyleSheet.flatten(screen.getByText('Spring Open').props.style).fontSize).toBe(30);
    expect(StyleSheet.flatten(screen.getByText('2 challenges completed').props.style).fontSize).toBe(26);
  });
});
