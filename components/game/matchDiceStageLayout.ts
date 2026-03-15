import type { DiceMotionSample } from '@/components/3d/diceShared';

export type BoardFrame = {
  height: number;
  width: number;
  x: number;
  y: number;
};

export type LandingZone = {
  height: number;
  width: number;
  x: number;
  y: number;
};

export const STAGE_MARGIN = 16;
export const BOARD_CLEARANCE = 12;
export const MATCH_DICE_STAGE_RIGHT_PADDING_RATIO = 0.08;
export const MATCH_DICE_STAGE_PROJECTION = {
  horizontalCenterRatio: 0.47,
  horizontalScaleRatio: 0.148,
  verticalAnchorRatio: 0.77,
  verticalYScaleRatio: 0.18,
  verticalZScaleRatio: 0.09,
  dieRadiusWidthRatio: 0.09,
  dieRadiusHeightRatio: 0.17,
} as const;

export const computeLandingZone = ({
  boardFrame,
  compact,
  viewportHeight,
  viewportWidth,
}: {
  boardFrame: BoardFrame;
  compact: boolean;
  viewportHeight: number;
  viewportWidth: number;
}): LandingZone => {
  const availableLeftGutter = Math.max(96, boardFrame.x - STAGE_MARGIN - BOARD_CLEARANCE);
  const targetWidth = compact
    ? Math.min(252, Math.max(174, availableLeftGutter * 0.92))
    : Math.min(344, Math.max(228, availableLeftGutter * 0.86));
  const width = Math.min(targetWidth, availableLeftGutter);
  const height = compact ? Math.max(138, width * 0.68) : Math.max(162, width * 0.64);
  const x = Math.max(STAGE_MARGIN, boardFrame.x - BOARD_CLEARANCE - width);
  const minY = Math.max(84, Math.round(viewportHeight * 0.09));
  const bottomClearance = Math.max(182, Math.round(viewportHeight * 0.14));
  const maxY = Math.max(minY, viewportHeight - height - bottomClearance);
  const basePreferredY = compact
    ? boardFrame.y + boardFrame.height * 0.42
    : boardFrame.y + boardFrame.height * 0.38;
  const preferredY = basePreferredY + height * 0.2;

  return {
    height,
    width,
    x,
    y: Math.min(Math.max(preferredY, minY), maxY),
  };
};

export const getStagePixelPosition = ({
  landingZone,
  sample,
}: {
  landingZone: Pick<LandingZone, 'height' | 'width'>;
  sample: DiceMotionSample;
}) => {
  const { height, width } = landingZone;

  return {
    x:
      width * MATCH_DICE_STAGE_PROJECTION.horizontalCenterRatio +
      sample.translate[0] * width * MATCH_DICE_STAGE_PROJECTION.horizontalScaleRatio,
    y:
      height * MATCH_DICE_STAGE_PROJECTION.verticalAnchorRatio +
      sample.translate[2] * height * MATCH_DICE_STAGE_PROJECTION.verticalZScaleRatio -
      sample.translate[1] * height * MATCH_DICE_STAGE_PROJECTION.verticalYScaleRatio,
  };
};

export const getStageDieFootprintRadiusPx = (landingZone: Pick<LandingZone, 'height' | 'width'>) =>
  Math.max(
    16,
    Math.min(
      landingZone.width * MATCH_DICE_STAGE_PROJECTION.dieRadiusWidthRatio,
      landingZone.height * MATCH_DICE_STAGE_PROJECTION.dieRadiusHeightRatio,
    ),
  );

export const getLandingZoneRightEdgeLimitPx = (landingZone: Pick<LandingZone, 'width'>) =>
  landingZone.width - Math.max(14, landingZone.width * MATCH_DICE_STAGE_RIGHT_PADDING_RATIO);
