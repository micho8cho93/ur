import {
  computeEloRatingUpdate,
  createDefaultEloProfile,
  getEloKFactor,
  PROVISIONAL_K_FACTOR,
  ESTABLISHED_K_FACTOR,
} from './elo';

describe('shared Elo helpers', () => {
  it('uses the provisional K-factor for players with fewer than ten rated games', () => {
    expect(getEloKFactor(0)).toBe(PROVISIONAL_K_FACTOR);
    expect(getEloKFactor(9)).toBe(PROVISIONAL_K_FACTOR);
  });

  it('uses the established K-factor once a player reaches ten rated games', () => {
    expect(getEloKFactor(10)).toBe(ESTABLISHED_K_FACTOR);
    expect(getEloKFactor(24)).toBe(ESTABLISHED_K_FACTOR);
  });

  it('computes symmetric provisional Elo changes for an even matchup', () => {
    const result = computeEloRatingUpdate({
      playerARating: 1200,
      playerBRating: 1200,
      playerAOutcome: 'win',
      playerARatedGames: 0,
      playerBRatedGames: 0,
    });

    expect(result.playerA.oldRating).toBe(1200);
    expect(result.playerA.newRating).toBe(1220);
    expect(result.playerA.delta).toBe(20);
    expect(result.playerA.ratedGames).toBe(1);
    expect(result.playerA.ratedWins).toBe(1);
    expect(result.playerA.ratedLosses).toBe(0);
    expect(result.playerA.provisional).toBe(true);

    expect(result.playerB.oldRating).toBe(1200);
    expect(result.playerB.newRating).toBe(1180);
    expect(result.playerB.delta).toBe(-20);
    expect(result.playerB.ratedGames).toBe(1);
    expect(result.playerB.ratedWins).toBe(0);
    expect(result.playerB.ratedLosses).toBe(1);
    expect(result.playerB.provisional).toBe(true);
  });

  it('marks the player as established after their tenth rated game is applied', () => {
    const result = computeEloRatingUpdate({
      playerARating: 1260,
      playerBRating: 1240,
      playerAOutcome: 'win',
      playerARatedGames: 9,
      playerBRatedGames: 9,
      playerARatedWins: 6,
      playerARatedLosses: 3,
      playerBRatedWins: 5,
      playerBRatedLosses: 4,
    });

    expect(result.playerA.previousProvisional).toBe(true);
    expect(result.playerA.provisional).toBe(false);
    expect(result.playerA.ratedGames).toBe(10);
    expect(result.playerB.previousProvisional).toBe(true);
    expect(result.playerB.provisional).toBe(false);
    expect(result.playerB.ratedGames).toBe(10);
  });

  it('creates default Elo profiles at 1200 with a provisional record', () => {
    expect(createDefaultEloProfile('user-1', 'Michel')).toEqual(
      expect.objectContaining({
        userId: 'user-1',
        usernameDisplay: 'Michel',
        eloRating: 1200,
        ratedGames: 0,
        ratedWins: 0,
        ratedLosses: 0,
        provisional: true,
      }),
    );
  });
});
