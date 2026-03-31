import { isRosette, isWarZone } from './constants';
import type { MatchConfig, RulesVariant } from './matchConfigs';
import type { Coordinates } from './types';

const resolveRulesVariant = (
  matchConfigOrVariant?: Pick<MatchConfig, 'rulesVariant'> | RulesVariant,
): RulesVariant =>
  typeof matchConfigOrVariant === 'string'
    ? matchConfigOrVariant
    : matchConfigOrVariant?.rulesVariant ?? 'standard';

export const isSharedRosetteCoord = (coord: Coordinates | null | undefined): boolean =>
  Boolean(coord && isWarZone(coord.row, coord.col) && isRosette(coord.row, coord.col));

const canCaptureOnWarTile = (
  matchConfigOrVariant: Pick<MatchConfig, 'rulesVariant'> | RulesVariant,
  coord: Coordinates | null | undefined,
): boolean => {
  if (!coord || !isWarZone(coord.row, coord.col)) {
    return false;
  }

  const rulesVariant = resolveRulesVariant(matchConfigOrVariant);
  if (rulesVariant === 'no-capture') {
    return false;
  }

  if (rulesVariant !== 'capture' && isSharedRosetteCoord(coord)) {
    return false;
  }

  return true;
};

export const isProtectedFromCapture = (
  matchConfigOrVariant: Pick<MatchConfig, 'rulesVariant'> | RulesVariant,
  coord: Coordinates | null | undefined,
): boolean => Boolean(coord && isWarZone(coord.row, coord.col) && !canCaptureOnWarTile(matchConfigOrVariant, coord));

export const isContestedWarTile = (
  matchConfigOrVariant: Pick<MatchConfig, 'rulesVariant'> | RulesVariant,
  coord: Coordinates | null | undefined,
): boolean => canCaptureOnWarTile(matchConfigOrVariant, coord);

export const shouldGrantExtraTurn = (
  matchConfigOrVariant: Pick<MatchConfig, 'rulesVariant'> | RulesVariant,
  options: { didCapture: boolean; landedOnRosette: boolean },
): boolean =>
  options.landedOnRosette ||
  (resolveRulesVariant(matchConfigOrVariant) === 'capture' && options.didCapture);
