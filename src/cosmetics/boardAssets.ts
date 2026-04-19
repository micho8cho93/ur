import type { ImageSourcePropType } from 'react-native';

export const DEFAULT_BOARD_IMAGE_SOURCE = require('../../assets/board/board_design.png') as ImageSourcePropType;

const BOARD_IMAGE_SOURCES: Record<string, ImageSourcePropType> = {
  board_design: DEFAULT_BOARD_IMAGE_SOURCE,
  board_single_exit: require('../../assets/board/board_single_exit.png') as ImageSourcePropType,
  board_cedar_001: DEFAULT_BOARD_IMAGE_SOURCE,
  board_alabaster_001: DEFAULT_BOARD_IMAGE_SOURCE,
  board_lapis_001: DEFAULT_BOARD_IMAGE_SOURCE,
  board_obsidian_001: DEFAULT_BOARD_IMAGE_SOURCE,
  board_gold_001: DEFAULT_BOARD_IMAGE_SOURCE,
};

export const getBoardImageSource = (
  assetKey?: string | null,
  imageUri?: string | null,
): ImageSourcePropType =>
  imageUri
    ? { uri: imageUri }
    : assetKey
      ? BOARD_IMAGE_SOURCES[assetKey] ?? DEFAULT_BOARD_IMAGE_SOURCE
      : DEFAULT_BOARD_IMAGE_SOURCE;
