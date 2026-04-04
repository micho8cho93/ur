import { resolveMatchScoreRankTitles } from './scoreRankTitles';

describe('resolveMatchScoreRankTitles', () => {
  it('uses the player rank for the authenticated online side and laborer for guest opponents', () => {
    expect(
      resolveMatchScoreRankTitles({
        authoritativePlayers: {
          light: {
            userId: 'self-user',
            title: 'Michel',
            rankTitle: 'Diviner',
          },
          dark: {
            userId: 'opponent-user',
            title: 'Guest',
            rankTitle: 'Laborer',
          },
        },
        isOffline: false,
        isOfflineLocalPvPMatch: false,
        humanScoreTitle: 'Michel',
        playerRankTitle: 'Diviner',
        resolvedPlayerColor: 'light',
        scoreTitles: {
          light: 'Michel',
          dark: 'Guest',
        },
      }),
    ).toEqual({
      light: 'Diviner',
      dark: 'Laborer',
    });
  });

  it('uses both snapshot rank titles for authenticated online players', () => {
    expect(
      resolveMatchScoreRankTitles({
        authoritativePlayers: {
          light: {
            userId: 'self-user',
            title: 'Michel',
            rankTitle: 'Diviner',
          },
          dark: {
            userId: 'opponent-user',
            title: 'Opponent',
            rankTitle: 'Governor',
          },
        },
        isOffline: false,
        isOfflineLocalPvPMatch: false,
        humanScoreTitle: 'Michel',
        playerRankTitle: 'Diviner',
        resolvedPlayerColor: 'light',
        scoreTitles: {
          light: 'Michel',
          dark: 'Opponent',
        },
      }),
    ).toEqual({
      light: 'Diviner',
      dark: 'Governor',
    });
  });

  it('falls back to laborer for both sides in offline local PvP', () => {
    expect(
      resolveMatchScoreRankTitles({
        authoritativePlayers: null,
        isOffline: true,
        isOfflineLocalPvPMatch: true,
        humanScoreTitle: 'Michel',
        playerRankTitle: 'High Priest',
        resolvedPlayerColor: null,
        scoreTitles: {
          light: 'Player 1',
          dark: 'Player 2',
        },
      }),
    ).toEqual({
      light: 'Laborer',
      dark: 'Laborer',
    });
  });

  it('shows only the local player rank in offline bot matches', () => {
    expect(
      resolveMatchScoreRankTitles({
        authoritativePlayers: null,
        isOffline: true,
        isOfflineLocalPvPMatch: false,
        humanScoreTitle: 'Michel',
        playerRankTitle: 'Merchant',
        resolvedPlayerColor: 'light',
        scoreTitles: {
          light: 'Michel',
          dark: 'Hard Bot',
        },
      }),
    ).toEqual({
      light: 'Merchant',
      dark: null,
    });
  });
});
