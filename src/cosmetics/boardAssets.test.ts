import { DEFAULT_BOARD_IMAGE_SOURCE, getBoardImageSource } from './boardAssets';
import {
  DEFAULT_CAPTURE_SOUND_SOURCE,
  DEFAULT_MUSIC_TRACK_SOURCE,
  DEFAULT_MOVE_SOUND_SOURCE,
  DEFAULT_ROLL_SEQUENCE_SOURCES,
  DEFAULT_SCORE_SOUND_SOURCE,
  getMusicTrackSource,
  getSoundEffectPreviewSources,
} from './audioAssets';
import { DEFAULT_MARKED_DIE_IMAGE_SOURCE, DEFAULT_UNMARKED_DIE_IMAGE_SOURCE, getDiceImageSources } from './diceAssets';
import { DEFAULT_DARK_PIECE_IMAGE_SOURCE, DEFAULT_LIGHT_PIECE_IMAGE_SOURCE, getPieceImageSources } from './pieceAssets';
import {
  DEFAULT_NORMAL_TILE_IMAGE_SOURCE,
  DEFAULT_ROSETTE_TILE_IMAGE_SOURCE,
  DEFAULT_WAR_TILE_IMAGE_SOURCE,
  getTileImageSources,
} from './tileAssets';

const BOARD_ASSET_KEYS = [
  'board_cedar_001',
  'board_alabaster_001',
  'board_lapis_001',
  'board_obsidian_001',
  'board_gold_001',
] as const;

describe('boardAssets', () => {
  it('falls back to the default board image for every current board cosmetic', () => {
    BOARD_ASSET_KEYS.forEach((assetKey) => {
      expect(getBoardImageSource(assetKey)).toBe(DEFAULT_BOARD_IMAGE_SOURCE);
    });
  });

  it('falls back to the default board image for missing or unknown asset keys', () => {
    expect(getBoardImageSource()).toBe(DEFAULT_BOARD_IMAGE_SOURCE);
    expect(getBoardImageSource(null)).toBe(DEFAULT_BOARD_IMAGE_SOURCE);
    expect(getBoardImageSource('unknown_board')).toBe(DEFAULT_BOARD_IMAGE_SOURCE);
  });

  it('falls back to default tile images for current board asset keys', () => {
    BOARD_ASSET_KEYS.forEach((assetKey) => {
      expect(getTileImageSources({
        normalTileAssetKey: assetKey,
        rosetteTileAssetKey: assetKey,
        warTileAssetKey: assetKey,
      })).toEqual({
        normal: DEFAULT_NORMAL_TILE_IMAGE_SOURCE,
        rosette: DEFAULT_ROSETTE_TILE_IMAGE_SOURCE,
        war: DEFAULT_WAR_TILE_IMAGE_SOURCE,
      });
    });
  });

  it('falls back to default piece images for current piece asset keys', () => {
    expect(getPieceImageSources({
      lightPieceAssetKey: 'pieces_gold_001',
      darkPieceAssetKey: 'pieces_gold_001',
      reservePieceAssetKey: 'pieces_gold_001',
    })).toEqual({
      light: DEFAULT_LIGHT_PIECE_IMAGE_SOURCE,
      dark: DEFAULT_DARK_PIECE_IMAGE_SOURCE,
      reserveLight: DEFAULT_LIGHT_PIECE_IMAGE_SOURCE,
      reserveDark: DEFAULT_DARK_PIECE_IMAGE_SOURCE,
    });
  });

  it('falls back to default dice images for current dice asset keys', () => {
    expect(getDiceImageSources({
      markedDieAssetKey: 'dice_lapis_001',
      unmarkedDieAssetKey: 'dice_lapis_001',
    })).toEqual({
      marked: DEFAULT_MARKED_DIE_IMAGE_SOURCE,
      unmarked: DEFAULT_UNMARKED_DIE_IMAGE_SOURCE,
    });
  });

  it('resolves music and sound effect cosmetic asset keys to audio sources', () => {
    expect(getMusicTrackSource('music_ancient_001')).toBe(DEFAULT_MUSIC_TRACK_SOURCE);
    expect(getSoundEffectPreviewSources({
      rollSequenceAssetKey: 'sfx_bronze_001',
      moveAssetKey: 'sfx_bronze_001',
      scoreAssetKey: 'sfx_bronze_001',
      captureAssetKey: 'sfx_bronze_001',
    })).toEqual({
      roll: DEFAULT_ROLL_SEQUENCE_SOURCES,
      move: DEFAULT_MOVE_SOUND_SOURCE,
      score: DEFAULT_SCORE_SOUND_SOURCE,
      capture: DEFAULT_CAPTURE_SOUND_SOURCE,
    });
  });
});
