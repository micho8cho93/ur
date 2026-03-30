import { act, fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import * as ReactNative from 'react-native';
import { Platform, StyleSheet } from 'react-native';

import {
  CHALLENGE_DEFINITIONS,
  createDefaultUserChallengeProgressSnapshot,
} from '@/shared/challenges';
import type { EloRatingProfileRpcResponse } from '@/shared/elo';
import { buildProgressionSnapshot } from '@/shared/progression';
import type { PublicTournamentDetail } from '@/src/tournaments/types';
import { TournamentStartWaitingRoom } from './TournamentStartWaitingRoom';

const tournament: PublicTournamentDetail = {
  runId: 'run-1',
  tournamentId: 'tournament-1',
  name: 'Spring Open',
  description: 'A public royal court run.',
  lifecycle: 'open',
  startAt: '2026-03-30T10:00:00.000Z',
  endAt: null,
  updatedAt: '2026-03-30T10:00:00.000Z',
  entrants: 3,
  maxEntrants: 8,
  gameMode: 'standard',
  region: 'Global',
  buyInLabel: 'Free',
  prizeLabel: 'No prize listed',
  isLocked: false,
  currentRound: 1,
  membership: {
    isJoined: true,
    joinedAt: '2026-03-30T10:00:00.000Z',
  },
  participation: {
    state: 'lobby',
    currentRound: 1,
    currentEntryId: null,
    activeMatchId: null,
    finalPlacement: null,
    lastResult: null,
    canLaunch: false,
  },
};

const eloProfile: EloRatingProfileRpcResponse = {
  leaderboardId: 'elo_global',
  userId: 'user-1',
  usernameDisplay: 'Michel',
  eloRating: 1486,
  ratedGames: 24,
  ratedWins: 15,
  ratedLosses: 9,
  provisional: false,
  rank: 18,
  lastRatedMatchId: 'match-1',
  lastRatedAt: '2026-03-29T18:30:00.000Z',
};

describe('TournamentStartWaitingRoom', () => {
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

  it('renders the pre-start waiting room and rotates shuffled cards every 15 seconds', () => {
    const challengeProgress = createDefaultUserChallengeProgressSnapshot('2026-03-30T10:00:00.000Z');
    challengeProgress.totalCompleted = 6;
    challengeProgress.stats.totalGamesPlayed = 21;
    challengeProgress.stats.totalWins = 13;

    render(
      <TournamentStartWaitingRoom
        tournament={tournament}
        eloProfile={eloProfile}
        progression={buildProgressionSnapshot(3120)}
        challengeDefinitions={CHALLENGE_DEFINITIONS.slice(0, 6)}
        challengeProgress={challengeProgress}
        isRefreshing={false}
        isLaunching={false}
        errorMessage={null}
        onRefresh={jest.fn()}
      />,
    );

    expect(screen.getByTestId('tournament-start-waiting-room')).toBeTruthy();
    expect(screen.getByText('Tournament Waiting Room')).toBeTruthy();
    expect(screen.getByText('Spring Open')).toBeTruthy();
    expect(screen.getByText('Lobby 3/8')).toBeTruthy();
    expect(screen.getByText('1486 Elo')).toBeTruthy();

    act(() => {
      jest.advanceTimersByTime(15_000);
    });

    expect(
      screen.getByText(
        'The best-known Royal Game of Ur boards were excavated from the Royal Tombs of Ur in southern Iraq.',
      ),
    ).toBeTruthy();
  });

  it('lets the player refresh the lobby manually', () => {
    const onRefresh = jest.fn();

    render(
      <TournamentStartWaitingRoom
        tournament={tournament}
        eloProfile={eloProfile}
        progression={buildProgressionSnapshot(3120)}
        challengeDefinitions={CHALLENGE_DEFINITIONS.slice(0, 6)}
        challengeProgress={createDefaultUserChallengeProgressSnapshot('2026-03-30T10:00:00.000Z')}
        isRefreshing={false}
        isLaunching={false}
        errorMessage="Lobby sync delayed."
        onRefresh={onRefresh}
      />,
    );

    fireEvent.press(screen.getByText('Refresh Lobby'));

    expect(screen.getByText('Lobby sync delayed.')).toBeTruthy();
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it('switches to the compact scroll-safe layout on narrow mobile web viewports', () => {
    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      get: () => 'web',
    });
    useWindowDimensionsSpy.mockReturnValue({ width: 390, height: 740, scale: 1, fontScale: 1 });

    render(
      <TournamentStartWaitingRoom
        tournament={tournament}
        eloProfile={eloProfile}
        progression={buildProgressionSnapshot(3120)}
        challengeDefinitions={CHALLENGE_DEFINITIONS.slice(0, 6)}
        challengeProgress={createDefaultUserChallengeProgressSnapshot('2026-03-30T10:00:00.000Z')}
        isRefreshing={false}
        isLaunching={false}
        errorMessage={null}
        onRefresh={jest.fn()}
      />,
    );

    expect(screen.getByTestId('tournament-start-waiting-room-scroll')).toBeTruthy();
    expect(StyleSheet.flatten(screen.getByText('Spring Open').props.style).fontSize).toBe(30);
    expect(StyleSheet.flatten(screen.getByText('1486 Elo').props.style).fontSize).toBe(26);
  });
});
