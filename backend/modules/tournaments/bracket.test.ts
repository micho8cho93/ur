import {
  completeTournamentBracketMatch,
  createSingleEliminationBracket,
  getSingleEliminationRoundCount,
  getTournamentBracketCurrentRound,
  getTournamentBracketEntry,
  getTournamentBracketParticipant,
} from './bracket';

const startedAt = '2026-03-29T18:00:00.000Z';

const buildRegistrations = (size: number) =>
  Array.from({ length: size }, (_, index) => ({
    userId: `user-${index + 1}`,
    displayName: `Player ${index + 1}`,
    joinedAt: startedAt,
    seed: index + 1,
  }));

describe('tournament bracket helpers', () => {
  it('counts the expected number of rounds for supported bracket sizes', () => {
    expect(getSingleEliminationRoundCount(2)).toBe(1);
    expect(getSingleEliminationRoundCount(4)).toBe(2);
    expect(getSingleEliminationRoundCount(8)).toBe(3);
  });

  it('treats a two-player tournament as a one-round final', () => {
    const bracket = createSingleEliminationBracket(buildRegistrations(2), startedAt);

    expect(bracket.totalRounds).toBe(1);
    expect(getTournamentBracketCurrentRound(bracket)).toBe(1);
    expect(bracket.entries).toHaveLength(1);
    expect(bracket.entries[0]).toEqual(
      expect.objectContaining({
        entryId: 'round-1-match-1',
        round: 1,
        status: 'ready',
        playerAUserId: 'user-1',
        playerBUserId: 'user-2',
      }),
    );
    expect(getTournamentBracketParticipant(bracket, 'user-1')).toEqual(
      expect.objectContaining({
        state: 'waiting_next_round',
        currentRound: 1,
        currentEntryId: 'round-1-match-1',
      }),
    );
  });

  it('advances semifinal winners into the next round without finalizing the tournament', () => {
    const bracket = createSingleEliminationBracket(buildRegistrations(4), startedAt);

    const updatedBracket = completeTournamentBracketMatch(bracket, {
      entryId: 'round-1-match-1',
      matchId: 'match-semi-1',
      winnerUserId: 'user-1',
      loserUserId: 'user-2',
      completedAt: '2026-03-29T18:10:00.000Z',
    });

    expect(updatedBracket.finalizedAt).toBeNull();
    expect(updatedBracket.winnerUserId).toBeNull();
    expect(updatedBracket.runnerUpUserId).toBeNull();
    expect(getTournamentBracketCurrentRound(updatedBracket)).toBe(1);
    expect(getTournamentBracketParticipant(updatedBracket, 'user-1')).toEqual(
      expect.objectContaining({
        state: 'waiting_next_round',
        currentRound: 2,
        currentEntryId: 'round-2-match-1',
        finalPlacement: null,
        lastResult: 'win',
      }),
    );
    expect(getTournamentBracketParticipant(updatedBracket, 'user-2')).toEqual(
      expect.objectContaining({
        state: 'eliminated',
        currentRound: 1,
        currentEntryId: 'round-1-match-1',
        finalPlacement: 3,
        lastResult: 'loss',
      }),
    );
    expect(getTournamentBracketEntry(updatedBracket, 'round-2-match-1')).toEqual(
      expect.objectContaining({
        playerAUserId: 'user-1',
        playerBUserId: null,
        status: 'pending',
      }),
    );
  });

  it('finalizes the bracket when the last round completes', () => {
    const bracket = createSingleEliminationBracket(buildRegistrations(4), startedAt);

    const afterFirstSemi = completeTournamentBracketMatch(bracket, {
      entryId: 'round-1-match-1',
      matchId: 'match-semi-1',
      winnerUserId: 'user-1',
      loserUserId: 'user-2',
      completedAt: '2026-03-29T18:10:00.000Z',
    });
    const afterSecondSemi = completeTournamentBracketMatch(afterFirstSemi, {
      entryId: 'round-1-match-2',
      matchId: 'match-semi-2',
      winnerUserId: 'user-3',
      loserUserId: 'user-4',
      completedAt: '2026-03-29T18:11:00.000Z',
    });
    const finalizedBracket = completeTournamentBracketMatch(afterSecondSemi, {
      entryId: 'round-2-match-1',
      matchId: 'match-final',
      winnerUserId: 'user-3',
      loserUserId: 'user-1',
      completedAt: '2026-03-29T18:20:00.000Z',
    });

    expect(finalizedBracket.finalizedAt).toBe('2026-03-29T18:20:00.000Z');
    expect(finalizedBracket.winnerUserId).toBe('user-3');
    expect(finalizedBracket.runnerUpUserId).toBe('user-1');
    expect(getTournamentBracketCurrentRound(finalizedBracket)).toBeNull();
    expect(getTournamentBracketParticipant(finalizedBracket, 'user-3')).toEqual(
      expect.objectContaining({
        state: 'champion',
        currentRound: 2,
        currentEntryId: 'round-2-match-1',
        finalPlacement: 1,
        lastResult: 'win',
      }),
    );
    expect(getTournamentBracketParticipant(finalizedBracket, 'user-1')).toEqual(
      expect.objectContaining({
        state: 'runner_up',
        currentRound: 2,
        currentEntryId: 'round-2-match-1',
        finalPlacement: 2,
        lastResult: 'loss',
      }),
    );
  });
});
