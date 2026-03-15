import {
  DICE_RENDER_PROFILES,
  clamp,
  createSeededRandom,
  randomBetween,
  sampleDiceMotion,
  type DiceMotionConfig,
  type DiceMotionSample,
} from '@/components/3d/diceShared';
import {
  MATCH_DICE_STAGE_PROJECTION,
  getLandingZoneRightEdgeLimitPx,
  getStageDieFootprintRadiusPx,
  getStagePixelPosition,
  type LandingZone,
} from './matchDiceStageLayout';

export type MatchDiceStageMotionConfig = DiceMotionConfig;
export type MatchDiceStageSample = DiceMotionSample;

export const MATCH_DICE_STAGE_ENTRY_DURATION_MS = 630;
export const MATCH_DICE_STAGE_FADE_MS = 420;
export const MATCH_DICE_STAGE_HOLD_MS = 460;
export const MATCH_DICE_STAGE_MODEL_SCALE = 0.62;

const GROUND_Y = -0.84;
const MATCH_DICE_STAGE_BOARD_APPROACH_BUFFER_PX = 6;
const BASE_DICE_LAYOUT = [
  {
    arcHeight: 0.9,
    bounceHeight: 0.28,
    delay: 0,
    finalRotation: [0.46, 0.14, -0.34] as [number, number, number],
    landing: [-1.02, GROUND_Y, -0.1] as [number, number, number],
    spinTurns: [3.55, 4.2, 3.12] as [number, number, number],
    start: [-1.74, 1.12, -1.02] as [number, number, number],
  },
  {
    arcHeight: 0.96,
    bounceHeight: 0.27,
    delay: 0.06,
    finalRotation: [0.28, 0.9, 0.24] as [number, number, number],
    landing: [-0.32, GROUND_Y, 0.06] as [number, number, number],
    spinTurns: [3.88, 3.62, 3.36] as [number, number, number],
    start: [-1.2, 1.06, -0.84] as [number, number, number],
  },
  {
    arcHeight: 0.88,
    bounceHeight: 0.25,
    delay: 0.12,
    finalRotation: [0.64, -0.54, 0.18] as [number, number, number],
    landing: [0.38, GROUND_Y, -0.04] as [number, number, number],
    spinTurns: [3.62, 4.18, 3.18] as [number, number, number],
    start: [-0.62, 1.14, -0.68] as [number, number, number],
  },
  {
    arcHeight: 0.92,
    bounceHeight: 0.29,
    delay: 0.18,
    finalRotation: [0.18, -0.24, -0.48] as [number, number, number],
    landing: [1.02, GROUND_Y, 0.12] as [number, number, number],
    spinTurns: [4.05, 3.74, 4.22] as [number, number, number],
    start: [-0.04, 1.08, -0.52] as [number, number, number],
  },
] as const;

const MATCH_STAGE_PROFILE = DICE_RENDER_PROFILES.matchStage;

const shiftMotionConfigX = (
  config: MatchDiceStageMotionConfig,
  deltaX: number,
): MatchDiceStageMotionConfig => ({
  ...config,
  landing: [config.landing[0] + deltaX, config.landing[1], config.landing[2]],
  start: [config.start[0] + deltaX, config.start[1], config.start[2]],
});

export const sampleMatchDiceStageMotion = (
  config: MatchDiceStageMotionConfig,
  progress: number,
  scaleMultiplier = 1,
): MatchDiceStageSample => {
  const localProgress = clamp((progress - config.delay) / Math.max(0.18, 1 - config.delay), 0, 1);

  return sampleDiceMotion(config, localProgress, {
    dieScale: MATCH_DICE_STAGE_MODEL_SCALE * scaleMultiplier,
    impactProgress: 0.8,
    bounceEndProgress: 0.96,
    shadowHeightDivisor: 1.1,
    shadowOpacityDrop: MATCH_STAGE_PROFILE.shadowOpacityDrop,
    shadowOpacityStart: MATCH_STAGE_PROFILE.shadowOpacityStart,
    shadowScaleBase: MATCH_STAGE_PROFILE.shadowScaleBase,
    shadowScaleHeightBoost: MATCH_STAGE_PROFILE.shadowScaleHeightBoost,
  });
};

export const getMatchDiceStageSettledRightEdgePx = ({
  landingZone,
  motion,
}: {
  landingZone: Pick<LandingZone, 'height' | 'width'>;
  motion: MatchDiceStageMotionConfig[];
}) => {
  const dieRadius = getStageDieFootprintRadiusPx(landingZone);

  return motion.reduce((currentRightEdge, config) => {
    const sample = sampleMatchDiceStageMotion(config, 1);
    const position = getStagePixelPosition({ landingZone, sample });
    return Math.max(currentRightEdge, position.x + dieRadius);
  }, 0);
};

const clampMotionToLandingZone = ({
  landingZone,
  motion,
}: {
  landingZone: Pick<LandingZone, 'height' | 'width'>;
  motion: MatchDiceStageMotionConfig[];
}) => {
  const rightEdgeLimit = getLandingZoneRightEdgeLimitPx(landingZone);
  const rightmostEdge = getMatchDiceStageSettledRightEdgePx({ landingZone, motion });
  const overflowPx = Math.max(0, rightmostEdge - rightEdgeLimit);

  if (overflowPx <= 0) {
    return motion;
  }

  const worldUnitsPerPx = landingZone.width * MATCH_DICE_STAGE_PROJECTION.horizontalScaleRatio;
  const leftShift = worldUnitsPerPx > 0 ? overflowPx / worldUnitsPerPx : 0;

  return motion.map((config) => shiftMotionConfigX(config, -leftShift));
};

const pullMotionTowardBoard = ({
  landingZone,
  motion,
}: {
  landingZone: Pick<LandingZone, 'height' | 'width'>;
  motion: MatchDiceStageMotionConfig[];
}) => {
  const rightEdgeLimit = getLandingZoneRightEdgeLimitPx(landingZone);
  const rightmostEdge = getMatchDiceStageSettledRightEdgePx({ landingZone, motion });
  const boardApproachGapPx = Math.max(0, rightEdgeLimit - rightmostEdge);

  if (boardApproachGapPx <= MATCH_DICE_STAGE_BOARD_APPROACH_BUFFER_PX) {
    return motion;
  }

  // Keep the final rest state reading as "just before the board" without crossing the safe limit.
  const pixelsPerWorldUnit = landingZone.width * MATCH_DICE_STAGE_PROJECTION.horizontalScaleRatio;
  const rightShift =
    pixelsPerWorldUnit > 0
      ? (boardApproachGapPx - MATCH_DICE_STAGE_BOARD_APPROACH_BUFFER_PX) / pixelsPerWorldUnit
      : 0;

  return motion.map((config) => shiftMotionConfigX(config, rightShift));
};
export const buildMatchDiceStageMotion = ({
  playbackId,
  rollValue,
  landingZone,
}: {
  playbackId: number;
  rollValue: number | null;
  landingZone: Pick<LandingZone, 'height' | 'width'>;
}): MatchDiceStageMotionConfig[] => {
  const next = createSeededRandom(playbackId * 131 + (rollValue ?? 0) * 17 + 7);

  const motion: MatchDiceStageMotionConfig[] = BASE_DICE_LAYOUT.map((config) => ({
    arcHeight: config.arcHeight + randomBetween(next, -0.08, 0.08),
    bounceHeight: config.bounceHeight + randomBetween(next, -0.03, 0.03),
    delay: config.delay,
    finalRotation: [
      config.finalRotation[0] + randomBetween(next, -0.12, 0.12),
      config.finalRotation[1] + randomBetween(next, -0.12, 0.12),
      config.finalRotation[2] + randomBetween(next, -0.12, 0.12),
    ] as [number, number, number],
    initialRotation: [
      randomBetween(next, -0.92, 0.92),
      randomBetween(next, -1.18, 1.18),
      randomBetween(next, -0.72, 0.72),
    ] as [number, number, number],
    landing: [
      config.landing[0] + randomBetween(next, -0.06, 0.06),
      config.landing[1],
      config.landing[2] + randomBetween(next, -0.04, 0.04),
    ] as [number, number, number],
    shadowScale: randomBetween(next, 0.72, 0.88),
    settleLift: randomBetween(next, 0.06, 0.09),
    settleTwist: randomBetween(next, 0.18, 0.3),
    spinTurns: [
      config.spinTurns[0] + randomBetween(next, -0.22, 0.22),
      config.spinTurns[1] + randomBetween(next, -0.28, 0.28),
      config.spinTurns[2] + randomBetween(next, -0.22, 0.22),
    ] as [number, number, number],
    start: [
      config.start[0] + randomBetween(next, -0.08, 0.08),
      config.start[1] + randomBetween(next, -0.08, 0.08),
      config.start[2] + randomBetween(next, -0.08, 0.08),
    ] as [number, number, number],
  }));

  const clampedMotion = clampMotionToLandingZone({
    landingZone,
    motion,
  });

  return pullMotionTowardBoard({
    landingZone,
    motion: clampedMotion,
  });
};
