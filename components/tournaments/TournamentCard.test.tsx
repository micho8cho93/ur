import { act, render, screen } from '@testing-library/react-native';
import React from 'react';

import type { PublicTournamentSummary } from '@/src/tournaments/types';
import { TournamentCard } from './TournamentCard';

jest.mock('@/components/ui/Button', () => ({
  Button: ({
    title,
  }: {
    title: string;
  }) => {
    const React = jest.requireActual('react');
    const { Text } = jest.requireActual('react-native');

    return <Text>{title}</Text>;
  },
}));

const tournament: PublicTournamentSummary = {
  runId: 'spring-open',
  tournamentId: 'spring-open',
  name: 'Spring Open',
  description: 'A public run.',
  lifecycle: 'open',
  startAt: '2026-03-30T10:00:00.000Z',
  endAt: null,
  updatedAt: '2026-03-30T10:00:00.000Z',
  lobbyDeadlineAt: '2026-03-30T10:03:00.000Z',
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

describe('TournamentCard', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-03-30T10:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('shows the live lobby fill countdown on the tournament card', () => {
    render(
      <TournamentCard
        tournament={tournament}
        onJoin={jest.fn()}
        onLaunch={jest.fn()}
        onViewStandings={jest.fn()}
      />,
    );

    expect(screen.getByText('Lobby Autofinalizes In')).toBeTruthy();
    expect(screen.getByText('03:00')).toBeTruthy();

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(screen.getByText('02:59')).toBeTruthy();
  });
});
