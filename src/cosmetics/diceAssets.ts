import type { ImageSourcePropType } from 'react-native';

export type DiceImageSources = {
  marked: ImageSourcePropType;
  unmarked: ImageSourcePropType;
};

export const DEFAULT_MARKED_DIE_IMAGE_SOURCE = require('../../assets/dice/dice_marked.png') as ImageSourcePropType;
export const DEFAULT_UNMARKED_DIE_IMAGE_SOURCE = require('../../assets/dice/dice_unmarked.png') as ImageSourcePropType;

const MARKED_DIE_IMAGE_SOURCES: Record<string, ImageSourcePropType> = {
  dice_clay_001: DEFAULT_MARKED_DIE_IMAGE_SOURCE,
  dice_copper_001: DEFAULT_MARKED_DIE_IMAGE_SOURCE,
  dice_lapis_001: DEFAULT_MARKED_DIE_IMAGE_SOURCE,
};

const UNMARKED_DIE_IMAGE_SOURCES: Record<string, ImageSourcePropType> = {
  dice_clay_001: DEFAULT_UNMARKED_DIE_IMAGE_SOURCE,
  dice_copper_001: DEFAULT_UNMARKED_DIE_IMAGE_SOURCE,
  dice_lapis_001: DEFAULT_UNMARKED_DIE_IMAGE_SOURCE,
};

export const getDiceImageSources = (assetKeys?: {
  markedDieAssetKey?: string | null;
  markedDieImageUri?: string | null;
  unmarkedDieAssetKey?: string | null;
  unmarkedDieImageUri?: string | null;
}): DiceImageSources => ({
  marked: assetKeys?.markedDieImageUri
    ? { uri: assetKeys.markedDieImageUri }
    : assetKeys?.markedDieAssetKey
    ? MARKED_DIE_IMAGE_SOURCES[assetKeys.markedDieAssetKey] ?? DEFAULT_MARKED_DIE_IMAGE_SOURCE
    : DEFAULT_MARKED_DIE_IMAGE_SOURCE,
  unmarked: assetKeys?.unmarkedDieImageUri
    ? { uri: assetKeys.unmarkedDieImageUri }
    : assetKeys?.unmarkedDieAssetKey
    ? UNMARKED_DIE_IMAGE_SOURCES[assetKeys.unmarkedDieAssetKey] ?? DEFAULT_UNMARKED_DIE_IMAGE_SOURCE
    : DEFAULT_UNMARKED_DIE_IMAGE_SOURCE,
});
