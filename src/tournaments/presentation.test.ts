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
  membership: {
    isJoined: false,
    joinedAt: null,
  },
};

describe('tournament presentation helpers', () => {
  it('returns the correct card and detail CTA states for joinable, waiting, ready, and full tournaments', () => {
    const now = Date.parse('2026-03-27T12:00:00.000Z');
    const joinedWaitingForLobby = {
      ...baseTournament,
      membership: {
        isJoined: true,
        joinedAt: '2026-03-27T11:55:00.000Z',
      },
    };
    const joinedReady = {
      ...baseTournament,
      entrants: 16,
      maxEntrants: 16,
      membership: {
        isJoined: true,
        joinedAt: '2026-03-27T11:55:00.000Z',
      },
    };
    const joinedWaitingForStart = {
      ...baseTournament,
      entrants: 16,
      maxEntrants: 16,
      startAt: '2999-03-27T14:00:00.000Z',
      membership: {
        isJoined: true,
        joinedAt: '2026-03-27T11:55:00.000Z',
      },
    };
    const full = {
      ...baseTournament,
      entrants: 16,
      maxEntrants: 16,
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
    expect(getTournamentCardPrimaryState(joinedReady, now)).toEqual({
      label: 'Play Tournament Match',
      disabled: false,
      intent: 'play',
      loading: false,
      waitReason: null,
    });
    expect(getTournamentCardPrimaryState(full)).toEqual({
      label: 'Full',
      disabled: true,
      intent: 'none',
    });

    expect(getTournamentDetailPrimaryState(joinedReady, now)).toEqual({
      label: 'Play Tournament Match',
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
    expect(getTournamentChipState(joinedReady, now)).toEqual({
      label: 'Open',
      tone: 'success',
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
});
