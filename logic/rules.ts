import { isRosette, isWarZone } from './constants';
import type { MatchConfig, RulesVariant } from './matchConfigs';
import type { Coordinates } from './types';

type CaptureRuleConfig = Pick<MatchConfig, 'rulesVariant' | 'rosetteSafetyMode'>;

const resolveRulesVariant = (
  matchConfigOrVariant?: CaptureRuleConfig | RulesVariant,
): RulesVariant =>
  typeof matchConfigOrVariant === 'string'
    ? matchConfigOrVariant
    : matchConfigOrVariant?.rulesVariant ?? 'standard';

const resolveRosetteSafetyMode = (
  matchConfigOrVariant?: CaptureRuleConfig | RulesVariant,
): MatchConfig['rosetteSafetyMode'] => {
  if (typeof matchConfigOrVariant === 'string') {
    return matchConfigOrVariant === 'capture' ? 'open' : 'standard';
  }

  return matchConfigOrVariant?.rosetteSafetyMode ?? 'standard';
};

export const isSharedRosetteCoord = (coord: Coordinates | null | undefined): boolean =>
  Boolean(coord && isWarZone(coord.row, coord.col) && isRosette(coord.row, coord.col));

const canCaptureOnWarTile = (
  matchConfigOrVariant: CaptureRuleConfig | RulesVariant,
  coord: Coordinates | null | undefined,
): boolean => {
  if (!coord || !isWarZone(coord.row, coord.col)) {
    return false;
  }

  const rulesVariant = resolveRulesVariant(matchConfigOrVariant);
  if (rulesVariant === 'no-capture') {
    return false;
  }

  if (isSharedRosetteCoord(coord) && resolveRosetteSafetyMode(matchConfigOrVariant) !== 'open') {
    return false;
  }

  return true;
};

export const isProtectedFromCapture = (
  matchConfigOrVariant: CaptureRuleConfig | RulesVariant,
  coord: Coordinates | null | undefined,
): boolean => Boolean(coord && isWarZone(coord.row, coord.col) && !canCaptureOnWarTile(matchConfigOrVariant, coord));

export const isContestedWarTile = (
  matchConfigOrVariant: CaptureRuleConfig | RulesVariant,
  coord: Coordinates | null | undefined,
): boolean => canCaptureOnWarTile(matchConfigOrVariant, coord);

export const shouldGrantExtraTurn = (
  matchConfig: Pick<MatchConfig, 'bonusTurnOnRosette' | 'bonusTurnOnCapture'>,
  options: { didCapture: boolean; landedOnRosette: boolean; bonusThrow: boolean },
): boolean => {
  const bonusTurnOnRosette = matchConfig.bonusTurnOnRosette ?? true;
  const bonusTurnOnCapture = matchConfig.bonusTurnOnCapture ?? false;

  return options.bonusThrow || (bonusTurnOnRosette && options.landedOnRosette) || (bonusTurnOnCapture && options.didCapture);
};
