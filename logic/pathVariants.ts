import type { Coordinates, PlayerColor } from './types';

export type PathVariant = 'default' | 'masters' | 'murray' | 'skiryuk' | 'full-path';

export type PathVariantDefinition = {
  id: PathVariant;
  dark: Coordinates[];
  light: Coordinates[];
  pathLength: number;
};

const DEFAULT_PATH_LIGHT: Coordinates[] = [
  { row: 2, col: 3 },
  { row: 2, col: 2 },
  { row: 2, col: 1 },
  { row: 2, col: 0 },
  { row: 1, col: 0 },
  { row: 1, col: 1 },
  { row: 1, col: 2 },
  { row: 1, col: 3 },
  { row: 1, col: 4 },
  { row: 1, col: 5 },
  { row: 1, col: 6 },
  { row: 1, col: 7 },
  { row: 2, col: 7 },
  { row: 2, col: 6 },
];

const DEFAULT_PATH_DARK: Coordinates[] = [
  { row: 0, col: 3 },
  { row: 0, col: 2 },
  { row: 0, col: 1 },
  { row: 0, col: 0 },
  { row: 1, col: 0 },
  { row: 1, col: 1 },
  { row: 1, col: 2 },
  { row: 1, col: 3 },
  { row: 1, col: 4 },
  { row: 1, col: 5 },
  { row: 1, col: 6 },
  { row: 1, col: 7 },
  { row: 0, col: 7 },
  { row: 0, col: 6 },
];

const MASTERS_PATH_LIGHT: Coordinates[] = [
  { row: 2, col: 3 },
  { row: 2, col: 2 },
  { row: 2, col: 1 },
  { row: 2, col: 0 },
  { row: 1, col: 0 },
  { row: 1, col: 1 },
  { row: 1, col: 2 },
  { row: 1, col: 3 },
  { row: 1, col: 4 },
  { row: 1, col: 5 },
  { row: 1, col: 6 },
  { row: 0, col: 6 },
  { row: 0, col: 7 },
  { row: 1, col: 7 },
  { row: 2, col: 7 },
  { row: 2, col: 6 },
];

const MASTERS_PATH_DARK: Coordinates[] = [
  { row: 0, col: 3 },
  { row: 0, col: 2 },
  { row: 0, col: 1 },
  { row: 0, col: 0 },
  { row: 1, col: 0 },
  { row: 1, col: 1 },
  { row: 1, col: 2 },
  { row: 1, col: 3 },
  { row: 1, col: 4 },
  { row: 1, col: 5 },
  { row: 1, col: 6 },
  { row: 2, col: 6 },
  { row: 2, col: 7 },
  { row: 1, col: 7 },
  { row: 0, col: 7 },
  { row: 0, col: 6 },
];

const MURRAY_PATH_LIGHT: Coordinates[] = [
  { row: 2, col: 3 },
  { row: 2, col: 2 },
  { row: 2, col: 1 },
  { row: 2, col: 0 },
  { row: 1, col: 0 },
  { row: 1, col: 1 },
  { row: 1, col: 2 },
  { row: 1, col: 3 },
  { row: 1, col: 4 },
  { row: 1, col: 5 },
  { row: 1, col: 6 },
  { row: 0, col: 6 },
  { row: 0, col: 7 },
  { row: 1, col: 7 },
  { row: 2, col: 7 },
  { row: 2, col: 6 },
  { row: 1, col: 6 },
  { row: 1, col: 5 },
  { row: 1, col: 4 },
  { row: 1, col: 3 },
  { row: 1, col: 2 },
  { row: 1, col: 1 },
  { row: 1, col: 0 },
  { row: 2, col: 0 },
  { row: 2, col: 1 },
  { row: 2, col: 2 },
  { row: 2, col: 3 },
];

const MURRAY_PATH_DARK: Coordinates[] = [
  { row: 0, col: 3 },
  { row: 0, col: 2 },
  { row: 0, col: 1 },
  { row: 0, col: 0 },
  { row: 1, col: 0 },
  { row: 1, col: 1 },
  { row: 1, col: 2 },
  { row: 1, col: 3 },
  { row: 1, col: 4 },
  { row: 1, col: 5 },
  { row: 1, col: 6 },
  { row: 2, col: 6 },
  { row: 2, col: 7 },
  { row: 1, col: 7 },
  { row: 0, col: 7 },
  { row: 0, col: 6 },
  { row: 1, col: 6 },
  { row: 1, col: 5 },
  { row: 1, col: 4 },
  { row: 1, col: 3 },
  { row: 1, col: 2 },
  { row: 1, col: 1 },
  { row: 1, col: 0 },
  { row: 0, col: 0 },
  { row: 0, col: 1 },
  { row: 0, col: 2 },
  { row: 0, col: 3 },
];

const SKYRIUK_PATH_LIGHT: Coordinates[] = [
  { row: 2, col: 3 },
  { row: 2, col: 2 },
  { row: 2, col: 1 },
  { row: 2, col: 0 },
  { row: 1, col: 0 },
  { row: 1, col: 1 },
  { row: 1, col: 2 },
  { row: 1, col: 3 },
  { row: 1, col: 4 },
  { row: 1, col: 5 },
  { row: 1, col: 6 },
  { row: 0, col: 6 },
  { row: 0, col: 7 },
  { row: 1, col: 7 },
  { row: 2, col: 7 },
  { row: 2, col: 6 },
  { row: 1, col: 6 },
  { row: 1, col: 5 },
  { row: 1, col: 4 },
  { row: 1, col: 3 },
  { row: 1, col: 2 },
  { row: 1, col: 1 },
  { row: 1, col: 0 },
];

const SKYRIUK_PATH_DARK: Coordinates[] = [
  { row: 0, col: 3 },
  { row: 0, col: 2 },
  { row: 0, col: 1 },
  { row: 0, col: 0 },
  { row: 1, col: 0 },
  { row: 1, col: 1 },
  { row: 1, col: 2 },
  { row: 1, col: 3 },
  { row: 1, col: 4 },
  { row: 1, col: 5 },
  { row: 1, col: 6 },
  { row: 2, col: 6 },
  { row: 2, col: 7 },
  { row: 1, col: 7 },
  { row: 0, col: 7 },
  { row: 0, col: 6 },
  { row: 1, col: 6 },
  { row: 1, col: 5 },
  { row: 1, col: 4 },
  { row: 1, col: 3 },
  { row: 1, col: 2 },
  { row: 1, col: 1 },
  { row: 1, col: 0 },
];

export const DEFAULT_PATH_VARIANT: PathVariant = 'default';

export const PATH_VARIANT_DEFINITIONS: Record<PathVariant, PathVariantDefinition> = {
  default: {
    id: 'default',
    light: DEFAULT_PATH_LIGHT,
    dark: DEFAULT_PATH_DARK,
    pathLength: DEFAULT_PATH_LIGHT.length,
  },
  masters: {
    id: 'masters',
    light: MASTERS_PATH_LIGHT,
    dark: MASTERS_PATH_DARK,
    pathLength: MASTERS_PATH_LIGHT.length,
  },
  murray: {
    id: 'murray',
    light: MURRAY_PATH_LIGHT,
    dark: MURRAY_PATH_DARK,
    pathLength: MURRAY_PATH_LIGHT.length,
  },
  skiryuk: {
    id: 'skiryuk',
    light: SKYRIUK_PATH_LIGHT,
    dark: SKYRIUK_PATH_DARK,
    pathLength: SKYRIUK_PATH_LIGHT.length,
  },
  'full-path': {
    id: 'full-path',
    light: MASTERS_PATH_LIGHT,
    dark: MASTERS_PATH_DARK,
    pathLength: MASTERS_PATH_LIGHT.length,
  },
};

export const getPathVariantDefinition = (
  variant: PathVariant = DEFAULT_PATH_VARIANT,
): PathVariantDefinition => PATH_VARIANT_DEFINITIONS[variant];

export const getPathForColor = (
  variant: PathVariant = DEFAULT_PATH_VARIANT,
  color: PlayerColor,
): Coordinates[] => (color === 'light' ? PATH_VARIANT_DEFINITIONS[variant].light : PATH_VARIANT_DEFINITIONS[variant].dark);

export const getPathLength = (variant: PathVariant = DEFAULT_PATH_VARIANT): number =>
  PATH_VARIANT_DEFINITIONS[variant].pathLength;

export const getPathCoord = (
  variant: PathVariant = DEFAULT_PATH_VARIANT,
  color: PlayerColor,
  index: number,
): Coordinates | null => {
  if (index < 0 || index >= getPathLength(variant)) {
    return null;
  }

  return getPathForColor(variant, color)[index] ?? null;
};
