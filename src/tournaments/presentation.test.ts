import {
  getTournamentCardPrimaryState,
  getTournamentDetailPrimaryState,
  getTournamentChipState,
  hasTournamentEnded,
  isTournamentVisibleForPlay,
} from '@/src/tournaments/presentation';
import type { PublicTournamentSummary } from '@/src/tournaments/types';

const baseTournament: PublicTournamentSummary = {
  runId: 'spring-open',
  tournamentId: 'spring-open',
  name: 'Spring Open',
  description: 'A public run.',
  lifecycle: 'open',
  startAt: '2026-03-27T10:00:00.000Z',
  endAt: null,
  updatedAt: '2026-03-27T10:00:00.000Z',
  entrants: 8,
  maxEntrants: 16,
  gameMode: 'standard',
  region: 'Global',
  buyInLabel: 'Free',
  prizeLabel: 'No prize listed',
  isLocked: false,
  currentRound: null,
  membership: {
    isJoined: false,
    joinedAt: null,
  },
  participation: {
    state: null,
    currentRound: null,
    currentEntryId: null,
    activeMatchId: null,
    finalPlacement: null,
    lastResult: null,
    canLaunch: false,
  },
};

describe('tournament presentation helpers', () => {
  it('returns the correct CTA states for joinable, locked, active, and pre-start tournaments', () => {
    const now = Date.parse('2026-03-27T12:00:00.000Z');
    const joinedWaitingForLobby: PublicTournamentSummary = {
      ...baseTournament,
      membership: {
        isJoined: true,
        joinedAt: '2026-03-27T11:55:00.000Z',
      },
    };
    const joinedReadyForNextRound: PublicTournamentSummary = {
      ...baseTournament,
      entrants: 8,
      maxEntrants: 8,
      isLocked: true,
      currentRound: 2,
      membership: {
        isJoined: true,
        joinedAt: '2026-03-27T11:55:00.000Z',
      },
      participation: {
        state: 'waiting_next_round',
        currentRound: 2,
        currentEntryId: 'round-2-match-1',
        activeMatchId: null,
        finalPlacement: null,
        lastResult: 'win',
        canLaunch: true,
      },
    };
    const joinedInMatch: PublicTournamentSummary = {
      ...joinedReadyForNextRound,
      participation: {
        ...joinedReadyForNextRound.participation,
        state: 'in_match',
        activeMatchId: 'match-123',
        canLaunch: true,
      },
    };
    const joinedWaitingForStart: PublicTournamentSummary = {
      ...baseTournament,
      entrants: 8,
      maxEntrants: 8,
      startAt: '2999-03-27T14:00:00.000Z',
      membership: {
        isJoined: true,
        joinedAt: '2026-03-27T11:55:00.000Z',
      },
    };
    const full: PublicTournamentSummary = {
      ...baseTournament,
      entrants: 8,
      maxEntrants: 8,
    };
    const locked: PublicTournamentSummary = {
      ...full,
      isLocked: true,
    };

    expect(getTournamentCardPrimaryState(baseTournament)).toEqual({
      label: 'Join',
      disabled: false,
      intent: 'join',
    });
    expect(getTournamentCardPrimaryState(joinedWaitingForLobby, now)).toEqual({
      label: 'Waiting for lobby to fill',
      disabled: true,
      intent: 'none',
      loading: true,
      waitReason: 'lobby',
    });
    expect(getTournamentCardPrimaryState(joinedReadyForNextRound, now)).toEqual({
      label: 'Continue Tournament',
      disabled: false,
      intent: 'play',
      loading: false,
      waitReason: null,
    });
    expect(getTournamentCardPrimaryState(joinedInMatch, now)).toEqual({
      label: 'Resume Tournament Match',
      disabled: false,
      intent: 'play',
      loading: false,
      waitReason: null,
    });
    expect(getTournamentCardPrimaryState(locked)).toEqual({
      label: 'Tournament Locked',
      disabled: true,
      intent: 'none',
    });
    expect(getTournamentCardPrimaryState(full)).toEqual({
      label: 'Full',
      disabled: true,
      intent: 'none',
    });

    expect(getTournamentDetailPrimaryState(joinedReadyForNextRound, now)).toEqual({
      label: 'Continue Tournament',
      disabled: false,
      intent: 'play',
      loading: false,
      waitReason: null,
    });
    expect(getTournamentDetailPrimaryState(joinedWaitingForStart, now)).toEqual({
      label: 'Tournament starts soon',
      disabled: true,
      intent: 'none',
      loading: true,
      waitReason: 'start',
    });
    expect(getTournamentChipState(baseTournament, now)).toEqual({
      label: 'Starting soon',
      tone: 'info',
    });
    expect(getTournamentChipState(joinedReadyForNextRound, now)).toEqual({
      label: 'In Progress',
      tone: 'info',
    });
    expect(getTournamentChipState(locked, now)).toEqual({
      label: 'Locked',
      tone: 'warning',
    });
    expect(getTournamentChipState(full, now)).toEqual({
      label: 'Full',
      tone: 'warning',
    });
    expect(getTournamentChipState(joinedWaitingForStart, now)).toEqual({
      label: 'Starting soon',
      tone: 'info',
    });
  });

  it('treats only open, non-expired tournaments as visible in public play', () => {
    const now = Date.parse('2026-03-27T12:00:00.000Z');

    expect(
      hasTournamentEnded(
        {
          endAt: '2026-03-27T11:59:59.000Z',
        },
        now,
      ),
    ).toBe(true);

    expect(
      isTournamentVisibleForPlay(
        {
          lifecycle: 'open',
          endAt: '2026-03-27T12:30:00.000Z',
        },
        now,
      ),
    ).toBe(true);

    expect(
      isTournamentVisibleForPlay(
        {
          lifecycle: 'closed',
          endAt: '2026-03-27T12:30:00.000Z',
        },
        now,
      ),
    ).toBe(false);

    expect(
      isTournamentVisibleForPlay(
        {
          lifecycle: 'open',
          endAt: '2026-03-27T12:00:00.000Z',
        },
        now,
      ),
    ).toBe(false);
  });

  it('does not render resume actions for finalized runs with stale active match state', () => {
    const finalizedTournament: PublicTournamentSummary = {
      ...baseTournament,
      lifecycle: 'finalized',
      membership: {
        isJoined: true,
        joinedAt: '2026-03-27T11:55:00.000Z',
      },
      participation: {
        state: 'in_match',
        currentRound: 1,
        currentEntryId: 'round-1-match-1',
        activeMatchId: 'match-123',
        finalPlacement: null,
        lastResult: null,
        canLaunch: true,
      },
    };

    expect(getTournamentCardPrimaryState(finalizedTournament)).toEqual({
      label: 'Tournament Complete',
      disabled: true,
      intent: 'none',
      loading: false,
      waitReason: null,
    });
    expect(getTournamentDetailPrimaryState(finalizedTournament)).toEqual({
      label: 'Tournament Complete',
      disabled: true,
      intent: 'none',
      loading: false,
      waitReason: null,
    });
  });
});
