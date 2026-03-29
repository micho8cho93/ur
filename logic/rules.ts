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

export const isProtectedFromCapture = (
  matchConfigOrVariant: Pick<MatchConfig, 'rulesVariant'> | RulesVariant,
  coord: Coordinates | null | undefined,
): boolean => resolveRulesVariant(matchConfigOrVariant) !== 'capture' && isSharedRosetteCoord(coord);

export const isContestedWarTile = (
  matchConfigOrVariant: Pick<MatchConfig, 'rulesVariant'> | RulesVariant,
  coord: Coordinates | null | undefined,
): boolean => Boolean(coord && isWarZone(coord.row, coord.col) && !isProtectedFromCapture(matchConfigOrVariant, coord));

export const shouldGrantExtraTurn = (
  matchConfigOrVariant: Pick<MatchConfig, 'rulesVariant'> | RulesVariant,
  options: { didCapture: boolean; landedOnRosette: boolean },
): boolean =>
  options.landedOnRosette ||
  (resolveRulesVariant(matchConfigOrVariant) === 'capture' && options.didCapture);
