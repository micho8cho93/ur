import {
  getTournamentCardPrimaryState,
  getTournamentDetailPrimaryState,
  getTournamentChipState,
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
  it('returns the correct card and detail CTA states for joinable, joined, full, and starting soon tournaments', () => {
    const now = Date.parse('2026-03-27T12:00:00.000Z');
    const startingSoon = {
      ...baseTournament,
      startAt: '2026-03-27T14:00:00.000Z',
    };
    const joined = {
      ...baseTournament,
      startAt: '2020-03-27T10:00:00.000Z',
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
    expect(getTournamentCardPrimaryState(joined)).toEqual({
      label: 'Play Tournament Match',
      disabled: false,
      intent: 'play',
    });
    expect(getTournamentCardPrimaryState(startingSoon)).toEqual({
      label: 'Join',
      disabled: false,
      intent: 'join',
    });
    expect(getTournamentCardPrimaryState(full)).toEqual({
      label: 'Full',
      disabled: true,
      intent: 'none',
    });

    expect(getTournamentDetailPrimaryState(joined)).toEqual({
      label: 'Play Tournament Match',
      disabled: false,
      intent: 'play',
    });
    expect(getTournamentDetailPrimaryState({ ...joined, startAt: '2026-03-27T14:00:00.000Z' })).toEqual({
      label: 'Play Tournament Match',
      disabled: true,
      intent: 'none',
    });
    expect(getTournamentChipState(startingSoon, now)).toEqual({
      label: 'Starting soon',
      tone: 'info',
    });
  });
});
