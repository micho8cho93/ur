import { resolveMatchScoreRankTitles } from './scoreRankTitles';

describe('resolveMatchScoreRankTitles', () => {
  it('uses the player rank for the authenticated online side and laborer for guest opponents', () => {
    expect(
      resolveMatchScoreRankTitles({
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

  it('falls back to laborer for both sides in offline local PvP', () => {
    expect(
      resolveMatchScoreRankTitles({
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
