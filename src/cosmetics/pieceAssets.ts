import type { ImageSourcePropType } from 'react-native';

export type PieceImageSources = {
  light: ImageSourcePropType;
  dark: ImageSourcePropType;
  reserveLight: ImageSourcePropType;
  reserveDark: ImageSourcePropType;
};

export const DEFAULT_LIGHT_PIECE_IMAGE_SOURCE = require('../../assets/pieces/piece_light.png') as ImageSourcePropType;
export const DEFAULT_DARK_PIECE_IMAGE_SOURCE = require('../../assets/pieces/piece_dark.png') as ImageSourcePropType;

const LIGHT_PIECE_IMAGE_SOURCES: Record<string, ImageSourcePropType> = {
  pieces_ivory_001: DEFAULT_LIGHT_PIECE_IMAGE_SOURCE,
  pieces_bronze_001: DEFAULT_LIGHT_PIECE_IMAGE_SOURCE,
  pieces_carnelian_001: DEFAULT_LIGHT_PIECE_IMAGE_SOURCE,
  pieces_lapis_001: DEFAULT_LIGHT_PIECE_IMAGE_SOURCE,
  pieces_gold_001: DEFAULT_LIGHT_PIECE_IMAGE_SOURCE,
};

const DARK_PIECE_IMAGE_SOURCES: Record<string, ImageSourcePropType> = {
  pieces_ivory_001: DEFAULT_DARK_PIECE_IMAGE_SOURCE,
  pieces_bronze_001: DEFAULT_DARK_PIECE_IMAGE_SOURCE,
  pieces_carnelian_001: DEFAULT_DARK_PIECE_IMAGE_SOURCE,
  pieces_lapis_001: DEFAULT_DARK_PIECE_IMAGE_SOURCE,
  pieces_gold_001: DEFAULT_DARK_PIECE_IMAGE_SOURCE,
};

export const getPieceImageSources = (assetKeys?: {
  lightPieceAssetKey?: string | null;
  lightPieceImageUri?: string | null;
  darkPieceAssetKey?: string | null;
  darkPieceImageUri?: string | null;
  reservePieceAssetKey?: string | null;
  reservePieceImageUri?: string | null;
}): PieceImageSources => {
  const reserveLightAssetKey = assetKeys?.reservePieceAssetKey ?? assetKeys?.lightPieceAssetKey;
  const reserveDarkAssetKey = assetKeys?.reservePieceAssetKey ?? assetKeys?.darkPieceAssetKey;
  const reserveLightImageUri = assetKeys?.reservePieceImageUri ?? assetKeys?.lightPieceImageUri;
  const reserveDarkImageUri = assetKeys?.reservePieceImageUri ?? assetKeys?.darkPieceImageUri;

  return {
    light: assetKeys?.lightPieceImageUri
      ? { uri: assetKeys.lightPieceImageUri }
      : assetKeys?.lightPieceAssetKey
      ? LIGHT_PIECE_IMAGE_SOURCES[assetKeys.lightPieceAssetKey] ?? DEFAULT_LIGHT_PIECE_IMAGE_SOURCE
      : DEFAULT_LIGHT_PIECE_IMAGE_SOURCE,
    dark: assetKeys?.darkPieceImageUri
      ? { uri: assetKeys.darkPieceImageUri }
      : assetKeys?.darkPieceAssetKey
      ? DARK_PIECE_IMAGE_SOURCES[assetKeys.darkPieceAssetKey] ?? DEFAULT_DARK_PIECE_IMAGE_SOURCE
      : DEFAULT_DARK_PIECE_IMAGE_SOURCE,
    reserveLight: reserveLightImageUri
      ? { uri: reserveLightImageUri }
      : reserveLightAssetKey
      ? LIGHT_PIECE_IMAGE_SOURCES[reserveLightAssetKey] ?? DEFAULT_LIGHT_PIECE_IMAGE_SOURCE
      : DEFAULT_LIGHT_PIECE_IMAGE_SOURCE,
    reserveDark: reserveDarkImageUri
      ? { uri: reserveDarkImageUri }
      : reserveDarkAssetKey
      ? DARK_PIECE_IMAGE_SOURCES[reserveDarkAssetKey] ?? DEFAULT_DARK_PIECE_IMAGE_SOURCE
      : DEFAULT_DARK_PIECE_IMAGE_SOURCE,
  };
};
