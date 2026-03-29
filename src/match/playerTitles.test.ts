import {
  getBotScoreTitle,
  getHumanScoreTitle,
  getPlayerColorForUserId,
  getSnapshotScoreTitle,
} from './playerTitles';

describe('playerTitles', () => {
  it('prefers the signed-in username for non-guest humans', () => {
    expect(getHumanScoreTitle({ username: 'Michel', provider: 'google' })).toBe('Michel');
  });

  it('normalizes guest humans to the Guest title', () => {
    expect(getHumanScoreTitle({ username: 'some-random-device-name', provider: 'guest' })).toBe('Guest');
  });

  it('falls back to generic player copy when there is no authenticated user', () => {
    expect(getHumanScoreTitle(null)).toBe('Player');
  });

  it('returns the expected bot title for each difficulty', () => {
    expect(getBotScoreTitle('easy')).toBe('Easy Bot');
    expect(getBotScoreTitle('medium')).toBe('Medium Bot');
    expect(getBotScoreTitle('hard')).toBe('Hard Bot');
    expect(getBotScoreTitle('perfect')).toBe('Perfect Bot');
  });

  it('maps snapshot player metadata back to a player color', () => {
    const players = {
      light: { userId: 'light-user', title: 'Michel' },
      dark: { userId: 'dark-user', title: 'Guest' },
    } as const;

    expect(getPlayerColorForUserId(players, 'light-user')).toBe('light');
    expect(getPlayerColorForUserId(players, 'dark-user')).toBe('dark');
    expect(getPlayerColorForUserId(players, 'spectator')).toBeNull();
  });

  it('reads authoritative score titles from the snapshot payload', () => {
    const players = {
      light: { userId: 'light-user', title: 'Michel' },
      dark: { userId: 'dark-user', title: 'Guest' },
    } as const;

    expect(getSnapshotScoreTitle(players, 'light')).toBe('Michel');
    expect(getSnapshotScoreTitle(players, 'dark')).toBe('Guest');
    expect(
      getSnapshotScoreTitle(
        {
          light: { userId: 'light-user', title: null },
          dark: { userId: 'dark-user', title: 'Opponent' },
        },
        'light',
      ),
    ).toBeNull();
  });
});
