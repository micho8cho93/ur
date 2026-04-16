import type { CosmeticDefinition } from './cosmetics';

export type BoardTheme = {
  backgroundColor: string;
  imageAssetKey?: string;
  imageUri?: string;
  normalTileAssetKey?: string;
  normalTileImageUri?: string;
  rosetteTileAssetKey?: string;
  rosetteTileImageUri?: string;
  warTileAssetKey?: string;
  warTileImageUri?: string;
};

export type PiecesTheme = {
  lightPieceAssetKey?: string;
  lightPieceImageUri?: string;
  darkPieceAssetKey?: string;
  darkPieceImageUri?: string;
  reservePieceAssetKey?: string;
  reservePieceImageUri?: string;
};

export type DiceTheme = {
  markedDieAssetKey?: string;
  markedDieImageUri?: string;
  unmarkedDieAssetKey?: string;
  unmarkedDieImageUri?: string;
};

export type MusicTheme = {
  trackAssetKey?: string;
  trackUri?: string;
};

export type SoundEffectsTheme = {
  rollSequenceAssetKey?: string;
  rollSequenceUris?: string[];
  moveAssetKey?: string;
  moveUri?: string;
  scoreAssetKey?: string;
  scoreUri?: string;
  captureAssetKey?: string;
  captureUri?: string;
};

export type CosmeticTheme = {
  board?: Partial<BoardTheme>;
  pieces?: Partial<PiecesTheme>;
  dice?: Partial<DiceTheme>;
  music?: Partial<MusicTheme>;
  soundEffects?: Partial<SoundEffectsTheme>;
};

export const DEFAULT_BOARD_THEME: BoardTheme = {
  backgroundColor: 'transparent',
};

export const DEFAULT_PIECES_THEME: PiecesTheme = {};

export const DEFAULT_DICE_THEME: DiceTheme = {};
export const DEFAULT_MUSIC_THEME: MusicTheme = {};
export const DEFAULT_SOUND_EFFECTS_THEME: SoundEffectsTheme = {};

export const resolveBoardTheme = (override?: Partial<BoardTheme>): BoardTheme => ({
  ...DEFAULT_BOARD_THEME,
  ...override,
});

export const resolvePiecesTheme = (override?: Partial<PiecesTheme>): PiecesTheme => ({
  ...DEFAULT_PIECES_THEME,
  ...override,
});

export const resolveDiceTheme = (override?: Partial<DiceTheme>): DiceTheme => ({
  ...DEFAULT_DICE_THEME,
  ...override,
});

export const resolveMusicTheme = (override?: Partial<MusicTheme>): MusicTheme => ({
  ...DEFAULT_MUSIC_THEME,
  ...override,
});

export const resolveSoundEffectsTheme = (override?: Partial<SoundEffectsTheme>): SoundEffectsTheme => ({
  ...DEFAULT_SOUND_EFFECTS_THEME,
  ...override,
});

export const COSMETIC_ASSET_MAP: Record<string, CosmeticTheme> = {
  board_cedar_001: {
    board: {
      imageAssetKey: 'board_cedar_001',
      normalTileAssetKey: 'board_cedar_001',
      rosetteTileAssetKey: 'board_cedar_001',
      warTileAssetKey: 'board_cedar_001',
      backgroundColor: '#3a2010',
    },
  },
  board_alabaster_001: {
    board: {
      imageAssetKey: 'board_alabaster_001',
      normalTileAssetKey: 'board_alabaster_001',
      rosetteTileAssetKey: 'board_alabaster_001',
      warTileAssetKey: 'board_alabaster_001',
      backgroundColor: '#c8beae',
    },
  },
  board_lapis_001: {
    board: {
      imageAssetKey: 'board_lapis_001',
      normalTileAssetKey: 'board_lapis_001',
      rosetteTileAssetKey: 'board_lapis_001',
      warTileAssetKey: 'board_lapis_001',
      backgroundColor: '#122840',
    },
  },
  board_obsidian_001: {
    board: {
      imageAssetKey: 'board_obsidian_001',
      normalTileAssetKey: 'board_obsidian_001',
      rosetteTileAssetKey: 'board_obsidian_001',
      warTileAssetKey: 'board_obsidian_001',
      backgroundColor: '#111111',
    },
  },
  board_gold_001: {
    board: {
      imageAssetKey: 'board_gold_001',
      normalTileAssetKey: 'board_gold_001',
      rosetteTileAssetKey: 'board_gold_001',
      warTileAssetKey: 'board_gold_001',
      backgroundColor: '#4a3a00',
    },
  },
  pieces_ivory_001: {
    pieces: {
      lightPieceAssetKey: 'pieces_ivory_001',
      darkPieceAssetKey: 'pieces_ivory_001',
      reservePieceAssetKey: 'pieces_ivory_001',
    },
  },
  pieces_bronze_001: {
    pieces: {
      lightPieceAssetKey: 'pieces_bronze_001',
      darkPieceAssetKey: 'pieces_bronze_001',
      reservePieceAssetKey: 'pieces_bronze_001',
    },
  },
  pieces_carnelian_001: {
    pieces: {
      lightPieceAssetKey: 'pieces_carnelian_001',
      darkPieceAssetKey: 'pieces_carnelian_001',
      reservePieceAssetKey: 'pieces_carnelian_001',
    },
  },
  pieces_lapis_001: {
    pieces: {
      lightPieceAssetKey: 'pieces_lapis_001',
      darkPieceAssetKey: 'pieces_lapis_001',
      reservePieceAssetKey: 'pieces_lapis_001',
    },
  },
  pieces_gold_001: {
    pieces: {
      lightPieceAssetKey: 'pieces_gold_001',
      darkPieceAssetKey: 'pieces_gold_001',
      reservePieceAssetKey: 'pieces_gold_001',
    },
  },
  dice_clay_001: {
    dice: {
      markedDieAssetKey: 'dice_clay_001',
      unmarkedDieAssetKey: 'dice_clay_001',
    },
  },
  dice_copper_001: {
    dice: {
      markedDieAssetKey: 'dice_copper_001',
      unmarkedDieAssetKey: 'dice_copper_001',
    },
  },
  dice_lapis_001: {
    dice: {
      markedDieAssetKey: 'dice_lapis_001',
      unmarkedDieAssetKey: 'dice_lapis_001',
    },
  },
  music_ancient_001: {
    music: {
      trackAssetKey: 'music_ancient_001',
    },
  },
  music_procession_001: {
    music: {
      trackAssetKey: 'music_procession_001',
    },
  },
  sfx_stone_001: {
    soundEffects: {
      rollSequenceAssetKey: 'sfx_stone_001',
      moveAssetKey: 'sfx_stone_001',
      scoreAssetKey: 'sfx_stone_001',
      captureAssetKey: 'sfx_stone_001',
    },
  },
  sfx_bronze_001: {
    soundEffects: {
      rollSequenceAssetKey: 'sfx_bronze_001',
      moveAssetKey: 'sfx_bronze_001',
      scoreAssetKey: 'sfx_bronze_001',
      captureAssetKey: 'sfx_bronze_001',
    },
  },
  emote_scribe_001: {},
  emote_lyre_001: {},
  emote_king_001: {},
};

const uploadedAssetToTheme = (cosmetic: CosmeticDefinition): CosmeticTheme => {
  const dataUrl = cosmetic.uploadedAsset?.dataUrl;
  if (!dataUrl) {
    return {};
  }

  if (cosmetic.type === 'board') {
    return {
      board: {
        imageUri: dataUrl,
      },
    };
  }

  if (cosmetic.type === 'pieces') {
    return {
      pieces: {
        lightPieceImageUri: dataUrl,
        darkPieceImageUri: dataUrl,
        reservePieceImageUri: dataUrl,
      },
    };
  }

  if (cosmetic.type === 'dice_animation') {
    return {
      dice: {
        markedDieImageUri: dataUrl,
        unmarkedDieImageUri: dataUrl,
      },
    };
  }

  if (cosmetic.type === 'music') {
    return {
      music: {
        trackUri: dataUrl,
      },
    };
  }

  if (cosmetic.type === 'sound_effect') {
    return {
      soundEffects: {
        rollSequenceUris: [dataUrl],
        moveUri: dataUrl,
        scoreUri: dataUrl,
        captureUri: dataUrl,
      },
    };
  }

  return {};
};

const mergeCosmeticThemes = (base: CosmeticTheme, override: CosmeticTheme): CosmeticTheme => ({
  ...(base.board || override.board ? { board: { ...base.board, ...override.board } } : {}),
  ...(base.pieces || override.pieces ? { pieces: { ...base.pieces, ...override.pieces } } : {}),
  ...(base.dice || override.dice ? { dice: { ...base.dice, ...override.dice } } : {}),
  ...(base.music || override.music ? { music: { ...base.music, ...override.music } } : {}),
  ...(base.soundEffects || override.soundEffects
    ? { soundEffects: { ...base.soundEffects, ...override.soundEffects } }
    : {}),
});

export const cosmeticDefinitionToTheme = (cosmetic: CosmeticDefinition): CosmeticTheme =>
  mergeCosmeticThemes(COSMETIC_ASSET_MAP[cosmetic.assetKey] ?? {}, uploadedAssetToTheme(cosmetic));
