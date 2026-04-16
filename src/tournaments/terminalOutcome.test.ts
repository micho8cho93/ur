import {
  deriveServerConfirmedTournamentOutcome,
  isServerConfirmedTournamentTerminal,
} from '@/src/tournaments/terminalOutcome';
import type { PublicTournamentDetail } from '@/src/tournaments/types';

const createTournament = (overrides: Partial<PublicTournamentDetail> = {}): PublicTournamentDetail => ({
  runId: 'run-1',
  tournamentId: 'tournament-1',
  name: 'Spring Open',
  description: 'A public run.',
  lifecycle: 'open',
  startAt: '2026-03-27T09:00:00.000Z',
  endAt: null,
  updatedAt: '2026-03-27T10:00:00.000Z',
  entrants: 2,
  maxEntrants: 2,
  gameMode: 'standard',
  region: 'Global',
  buyInLabel: 'Free',
  prizeLabel: 'No prize listed',
  bots: {
    autoAdd: false,
    difficulty: null,
    count: 0,
  },
  isLocked: true,
  currentRound: 1,
  membership: {
    isJoined: true,
    joinedAt: '2026-03-27T09:00:00.000Z',
  },
  participation: {
    state: 'waiting_next_round',
    currentRound: 1,
    currentEntryId: 'round-1-match-1',
    activeMatchId: null,
    finalPlacement: null,
    lastResult: null,
    canLaunch: false,
  },
  ...overrides,
});

describe('terminalOutcome helpers', () => {
  it('does not treat a stale final-round snapshot as server-confirmed terminal state', () => {
    expect(isServerConfirmedTournamentTerminal(createTournament())).toBe(false);
    expect(deriveServerConfirmedTournamentOutcome(createTournament())).toBeNull();
  });

  it('treats explicit champion and eliminated states as terminal', () => {
    expect(
      deriveServerConfirmedTournamentOutcome(
        createTournament({
          participation: {
            state: 'champion',
            currentRound: 1,
            currentEntryId: 'round-1-match-1',
            activeMatchId: null,
            finalPlacement: 1,
            lastResult: 'win',
            canLaunch: false,
          },
        }),
      ),
    ).toBe('champion');

    expect(
      deriveServerConfirmedTournamentOutcome(
        createTournament({
          participation: {
            state: 'eliminated',
            currentRound: 1,
            currentEntryId: 'round-1-match-1',
            activeMatchId: null,
            finalPlacement: 4,
            lastResult: 'loss',
            canLaunch: false,
          },
        }),
      ),
    ).toBe('eliminated');
  });
});
