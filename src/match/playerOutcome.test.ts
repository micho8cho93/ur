import { resolveDidPlayerWin, resolveMatchPlayerColor } from '@/src/match/playerOutcome';

describe('playerOutcome helpers', () => {
  it('prefers the resolved player color when deciding the winner', () => {
    expect(
      resolveDidPlayerWin({
        winnerColor: 'light',
        resolvedPlayerColor: 'light',
        authoritativeMatchEnd: null,
        userId: 'user-1',
      }),
    ).toBe(true);

    expect(
      resolveDidPlayerWin({
        winnerColor: 'light',
        resolvedPlayerColor: 'dark',
        authoritativeMatchEnd: null,
        userId: 'user-1',
      }),
    ).toBe(false);
  });

  it('falls back to authoritative match-end user ids when player color is missing', () => {
    expect(
      resolveDidPlayerWin({
        winnerColor: 'light',
        resolvedPlayerColor: null,
        authoritativeMatchEnd: {
          reason: 'completed',
          winnerUserId: 'winner-user',
          loserUserId: 'loser-user',
          forfeitingUserId: null,
          message: null,
        },
        userId: 'loser-user',
      }),
    ).toBe(false);
  });

  it('infers the missing player color from authoritative snapshot players', () => {
    expect(
      resolveMatchPlayerColor({
        playerColor: null,
        authoritativePlayers: {
          light: {
            userId: 'winner-user',
            title: 'Winner',
          },
          dark: {
            userId: 'loser-user',
            title: 'Loser',
          },
        },
        userId: 'loser-user',
      }),
    ).toBe('dark');
  });
});
