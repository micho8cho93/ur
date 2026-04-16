import {
  DEFAULT_BOARD_THEME,
  DEFAULT_DICE_THEME,
  DEFAULT_PIECES_THEME,
  cosmeticDefinitionToTheme,
  resolveBoardTheme,
  resolveDiceTheme,
  resolvePiecesTheme,
} from './cosmeticTheme';
import type { CosmeticDefinition } from './cosmetics';

const createCosmetic = (id: string, type: CosmeticDefinition['type']): CosmeticDefinition => ({
  id,
  name: id,
  tier: 'common',
  type,
  price: { currency: 'soft', amount: 100 },
  rotationPools: ['daily'],
  rarityWeight: 1,
  releasedDate: '2026-04-15T00:00:00.000Z',
  assetKey: id,
});

describe('cosmeticTheme', () => {
  it('resolves board, pieces, and dice defaults with overrides', () => {
    expect(resolveBoardTheme({ backgroundColor: '#123456' })).toEqual({
      ...DEFAULT_BOARD_THEME,
      backgroundColor: '#123456',
    });
    expect(resolvePiecesTheme({ lightPieceAssetKey: 'pieces_gold_001' })).toEqual({
      ...DEFAULT_PIECES_THEME,
      lightPieceAssetKey: 'pieces_gold_001',
    });
    expect(resolveDiceTheme({ markedDieAssetKey: 'dice_lapis_001' })).toEqual({
      ...DEFAULT_DICE_THEME,
      markedDieAssetKey: 'dice_lapis_001',
    });
  });

  it('maps board cosmetics to board and tile image asset keys', () => {
    expect(cosmeticDefinitionToTheme(createCosmetic('board_lapis_001', 'board'))).toEqual(
      expect.objectContaining({
        board: expect.objectContaining({
          imageAssetKey: 'board_lapis_001',
          normalTileAssetKey: 'board_lapis_001',
          rosetteTileAssetKey: 'board_lapis_001',
          warTileAssetKey: 'board_lapis_001',
        }),
      }),
    );
  });

  it('maps piece and dice cosmetics to their preview asset keys', () => {
    expect(cosmeticDefinitionToTheme(createCosmetic('pieces_gold_001', 'pieces'))).toEqual(
      expect.objectContaining({
        pieces: expect.objectContaining({
          lightPieceAssetKey: 'pieces_gold_001',
          darkPieceAssetKey: 'pieces_gold_001',
        }),
      }),
    );
    expect(cosmeticDefinitionToTheme(createCosmetic('dice_lapis_001', 'dice_animation'))).toEqual(
      expect.objectContaining({
        dice: expect.objectContaining({
          markedDieAssetKey: 'dice_lapis_001',
          unmarkedDieAssetKey: 'dice_lapis_001',
        }),
      }),
    );
  });

  it('maps music and sound effect cosmetics to their preview asset keys', () => {
    expect(cosmeticDefinitionToTheme(createCosmetic('music_procession_001', 'music'))).toEqual(
      expect.objectContaining({
        music: expect.objectContaining({
          trackAssetKey: 'music_procession_001',
        }),
      }),
    );
    expect(cosmeticDefinitionToTheme(createCosmetic('sfx_bronze_001', 'sound_effect'))).toEqual(
      expect.objectContaining({
        soundEffects: expect.objectContaining({
          rollSequenceAssetKey: 'sfx_bronze_001',
          moveAssetKey: 'sfx_bronze_001',
        }),
      }),
    );
  });

  it('returns no override for emotes and unknown asset keys', () => {
    expect(cosmeticDefinitionToTheme(createCosmetic('emote_scribe_001', 'emote'))).toEqual({});
    expect(cosmeticDefinitionToTheme(createCosmetic('missing_cosmetic', 'board'))).toEqual({});
  });
});
