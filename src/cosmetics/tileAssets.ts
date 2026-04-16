import type { ImageSourcePropType } from 'react-native';

export type TileImageSources = {
  normal: ImageSourcePropType;
  rosette: ImageSourcePropType;
  war: ImageSourcePropType;
};

export const DEFAULT_NORMAL_TILE_IMAGE_SOURCE = require('../../assets/textures/texture-wood-grain.png') as ImageSourcePropType;
export const DEFAULT_ROSETTE_TILE_IMAGE_SOURCE = require('../../assets/textures/texture-rosette-pattern.png') as ImageSourcePropType;
export const DEFAULT_WAR_TILE_IMAGE_SOURCE = require('../../assets/textures/texture-wood-grain-dark.png') as ImageSourcePropType;

const NORMAL_TILE_IMAGE_SOURCES: Record<string, ImageSourcePropType> = {
  board_cedar_001: DEFAULT_NORMAL_TILE_IMAGE_SOURCE,
  board_alabaster_001: DEFAULT_NORMAL_TILE_IMAGE_SOURCE,
  board_lapis_001: DEFAULT_NORMAL_TILE_IMAGE_SOURCE,
  board_obsidian_001: DEFAULT_NORMAL_TILE_IMAGE_SOURCE,
  board_gold_001: DEFAULT_NORMAL_TILE_IMAGE_SOURCE,
};

const ROSETTE_TILE_IMAGE_SOURCES: Record<string, ImageSourcePropType> = {
  board_cedar_001: DEFAULT_ROSETTE_TILE_IMAGE_SOURCE,
  board_alabaster_001: DEFAULT_ROSETTE_TILE_IMAGE_SOURCE,
  board_lapis_001: DEFAULT_ROSETTE_TILE_IMAGE_SOURCE,
  board_obsidian_001: DEFAULT_ROSETTE_TILE_IMAGE_SOURCE,
  board_gold_001: DEFAULT_ROSETTE_TILE_IMAGE_SOURCE,
};

const WAR_TILE_IMAGE_SOURCES: Record<string, ImageSourcePropType> = {
  board_cedar_001: DEFAULT_WAR_TILE_IMAGE_SOURCE,
  board_alabaster_001: DEFAULT_WAR_TILE_IMAGE_SOURCE,
  board_lapis_001: DEFAULT_WAR_TILE_IMAGE_SOURCE,
  board_obsidian_001: DEFAULT_WAR_TILE_IMAGE_SOURCE,
  board_gold_001: DEFAULT_WAR_TILE_IMAGE_SOURCE,
};

export const getTileImageSources = (assetKeys?: {
  normalTileAssetKey?: string | null;
  rosetteTileAssetKey?: string | null;
  warTileAssetKey?: string | null;
}): TileImageSources => ({
  normal: assetKeys?.normalTileAssetKey
    ? NORMAL_TILE_IMAGE_SOURCES[assetKeys.normalTileAssetKey] ?? DEFAULT_NORMAL_TILE_IMAGE_SOURCE
    : DEFAULT_NORMAL_TILE_IMAGE_SOURCE,
  rosette: assetKeys?.rosetteTileAssetKey
    ? ROSETTE_TILE_IMAGE_SOURCES[assetKeys.rosetteTileAssetKey] ?? DEFAULT_ROSETTE_TILE_IMAGE_SOURCE
    : DEFAULT_ROSETTE_TILE_IMAGE_SOURCE,
  war: assetKeys?.warTileAssetKey
    ? WAR_TILE_IMAGE_SOURCES[assetKeys.warTileAssetKey] ?? DEFAULT_WAR_TILE_IMAGE_SOURCE
    : DEFAULT_WAR_TILE_IMAGE_SOURCE,
});
