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

export type BoardGapControlFrame = {
  height: number;
  width: number;
  x: number;
  y: number;
};

export type BoardGapControlLayout = {
  diceFrame: BoardGapControlFrame;
  rollFrame: BoardGapControlFrame;
  laneHeight: number;
  laneWidth: number;
};

export type MobileBoardGapControlMetrics = {
  diceImageScale: number;
  diceOffsetX: number;
  diceOrientation: 'horizontal' | 'vertical';
  diceTranslateY: number;
  diceViewportHeight: number;
  diceViewportWidth: number;
  rollArtSize: number;
  rollTranslateY: number;
};

export const STAGE_MARGIN = 16;
export const BOARD_CLEARANCE = 12;
export const COMPACT_STAGE_LEFT_NUDGE = 16;
export const COMPACT_STAGE_MIN_X = -28;
export const MOBILE_DICE_STAGE_WIDTH_SCALE = 1.5;
export const VERTICAL_BOARD_GAP_ROW_START = 4;
export const VERTICAL_BOARD_GAP_ROW_SPAN = 2;
export const VERTICAL_BOARD_GAP_GRID_ROWS = 8;
export const VERTICAL_BOARD_GAP_GRID_COLS = 3;
const VERTICAL_BOARD_ART_SOURCE_HEIGHT = 1024;
const VERTICAL_BOARD_ART_GRID_TOP_PX = 47;
const VERTICAL_BOARD_ART_GRID_BOTTOM_PX = 996;
export const VERTICAL_BOARD_ART_INSETS = {
  top: VERTICAL_BOARD_ART_GRID_TOP_PX / VERTICAL_BOARD_ART_SOURCE_HEIGHT,
  right: 0.385,
  bottom: (VERTICAL_BOARD_ART_SOURCE_HEIGHT - VERTICAL_BOARD_ART_GRID_BOTTOM_PX) / VERTICAL_BOARD_ART_SOURCE_HEIGHT,
  left: 0.36,
} as const;
const VERTICAL_BOARD_ART_ROW_BOUNDARIES_PX = [
  47,
  170,
  294,
  413,
  533,
  644,
  759,
  862,
  996,
] as const;
const VERTICAL_BOARD_ART_GRID_HEIGHT_PX =
  VERTICAL_BOARD_ART_ROW_BOUNDARIES_PX[VERTICAL_BOARD_ART_ROW_BOUNDARIES_PX.length - 1] -
  VERTICAL_BOARD_ART_ROW_BOUNDARIES_PX[0];
export const VERTICAL_BOARD_DISPLAY_ROW_HEIGHT_RATIOS: readonly number[] =
  VERTICAL_BOARD_ART_ROW_BOUNDARIES_PX.slice(0, -1).map((rowTop, index) => {
    const rowBottom = VERTICAL_BOARD_ART_ROW_BOUNDARIES_PX[index + 1];

    return ((rowBottom - rowTop) / VERTICAL_BOARD_ART_GRID_HEIGHT_PX) * VERTICAL_BOARD_GAP_GRID_ROWS;
  });

const clamp = (value: number, min: number, max: number): number => Math.min(Math.max(value, min), max);
const sum = (values: readonly number[]): number => values.reduce((total, value) => total + value, 0);

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
  const isMobileViewport = viewportWidth < 760;
  const leftBoundary = compact ? COMPACT_STAGE_MIN_X : STAGE_MARGIN;
  const boardGap = BOARD_CLEARANCE + (compact ? COMPACT_STAGE_LEFT_NUDGE : 0);
  const availableLeftGutter = Math.max(96, boardFrame.x - leftBoundary - boardGap);
  const targetWidth = compact
    ? Math.min(252, Math.max(174, availableLeftGutter * 0.92))
    : Math.min(344, Math.max(228, availableLeftGutter * 0.86));
  const baseWidth = Math.min(targetWidth, availableLeftGutter);
  const width =
    compact && isMobileViewport
      ? Math.min(availableLeftGutter, baseWidth * MOBILE_DICE_STAGE_WIDTH_SCALE)
      : baseWidth;
  const height = compact ? Math.max(138, baseWidth * 0.68) : Math.max(162, width * 0.64);
  const x = Math.max(leftBoundary, boardFrame.x - boardGap - width);
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

export const computeBoardGapControlLayout = ({
  boardFrame,
  gapRowSpan = VERTICAL_BOARD_GAP_ROW_SPAN,
  gapRowStart = VERTICAL_BOARD_GAP_ROW_START,
  gridCols = VERTICAL_BOARD_GAP_GRID_COLS,
  gridRows = VERTICAL_BOARD_GAP_GRID_ROWS,
  insets = VERTICAL_BOARD_ART_INSETS,
}: {
  boardFrame: BoardFrame;
  gapRowSpan?: number;
  gapRowStart?: number;
  gridCols?: number;
  gridRows?: number;
  insets?: {
    bottom: number;
    left: number;
    right: number;
    top: number;
  };
}): BoardGapControlLayout => {
  const gridLeft = boardFrame.x + boardFrame.width * insets.left;
  const gridWidth = boardFrame.width * (1 - insets.left - insets.right);
  const gridTop = boardFrame.y + boardFrame.height * insets.top;
  const gridHeight = boardFrame.height * (1 - insets.top - insets.bottom);
  const laneWidth = gridWidth / gridCols;
  const rowHeightRatios =
    gridRows === VERTICAL_BOARD_DISPLAY_ROW_HEIGHT_RATIOS.length
      ? VERTICAL_BOARD_DISPLAY_ROW_HEIGHT_RATIOS
      : Array.from({ length: gridRows }, () => 1);
  const rowHeightRatioTotal = sum(rowHeightRatios);
  const laneTopRatio = sum(rowHeightRatios.slice(0, gapRowStart)) / rowHeightRatioTotal;
  const laneHeightRatio = sum(rowHeightRatios.slice(gapRowStart, gapRowStart + gapRowSpan)) / rowHeightRatioTotal;
  const laneHeight = gridHeight * laneHeightRatio;
  const laneTop = gridTop + gridHeight * laneTopRatio;

  return {
    diceFrame: {
      x: Math.round(gridLeft),
      y: Math.round(laneTop),
      width: Math.round(laneWidth),
      height: Math.round(laneHeight),
    },
    rollFrame: {
      x: Math.round(gridLeft + laneWidth * (gridCols - 1)),
      y: Math.round(laneTop),
      width: Math.round(laneWidth),
      height: Math.round(laneHeight),
    },
    laneWidth: Math.round(laneWidth),
    laneHeight: Math.round(laneHeight),
  };
};

export const computeMobileWebTrayColumnControlLayout = ({
  boardFrame,
  diceRailFrame,
  referenceLayout,
  rollRailFrame,
}: {
  boardFrame: BoardFrame;
  diceRailFrame: BoardFrame;
  referenceLayout: BoardGapControlLayout;
  rollRailFrame: BoardFrame;
}): BoardGapControlLayout => {
  const resolveRailControlFrame = (
    railFrame: BoardFrame,
    referenceFrame: BoardGapControlFrame,
  ): BoardGapControlFrame => {
    const controlHeight = Math.round(referenceFrame.height);
    const minY = Math.round(railFrame.y);
    const maxY = Math.max(minY, Math.round(railFrame.y + railFrame.height - controlHeight));
    const anchoredY = Math.round(boardFrame.y + boardFrame.height - controlHeight);

    return {
      x: Math.round(railFrame.x),
      y: clamp(anchoredY, minY, maxY),
      width: Math.round(railFrame.width),
      height: controlHeight,
    };
  };

  return {
    diceFrame: resolveRailControlFrame(diceRailFrame, referenceLayout.diceFrame),
    rollFrame: resolveRailControlFrame(rollRailFrame, referenceLayout.rollFrame),
    laneWidth: referenceLayout.laneWidth,
    laneHeight: referenceLayout.laneHeight,
  };
};

export const computeMobileBoardGapControlMetrics = ({
  boardGapControlScale,
  controlLayout,
  reelBoxScale,
  reelDiceImageScale,
  reelRightShiftRatio,
  rollButtonScale,
  rollButtonSizeBoost,
  useMobileWebVerticalDiceReels,
}: {
  boardGapControlScale: number;
  controlLayout: BoardGapControlLayout;
  reelBoxScale: number;
  reelDiceImageScale: number;
  reelRightShiftRatio: number;
  rollButtonScale: number;
  rollButtonSizeBoost: number;
  useMobileWebVerticalDiceReels: boolean;
}): MobileBoardGapControlMetrics => {
  const diceInset = Math.max(
    4,
    Math.round(Math.min(controlLayout.diceFrame.width, controlLayout.diceFrame.height) * 0.08),
  );
  const diceViewportHeight = Math.round(
    Math.max(
      0,
      (useMobileWebVerticalDiceReels ? controlLayout.diceFrame.height : controlLayout.diceFrame.width) -
        diceInset * 2,
    ) *
      boardGapControlScale *
      (useMobileWebVerticalDiceReels ? reelBoxScale : 1),
  );
  const diceViewportWidth = Math.round(
    Math.max(
      0,
      (useMobileWebVerticalDiceReels ? controlLayout.diceFrame.width : controlLayout.diceFrame.height) -
        diceInset * 2,
    ) *
      boardGapControlScale *
      (useMobileWebVerticalDiceReels ? reelBoxScale : 1),
  );
  const rollArtSize = Math.max(
    44,
    Math.round(
      Math.min(controlLayout.rollFrame.width, controlLayout.rollFrame.height) *
        0.82 *
        boardGapControlScale *
        (useMobileWebVerticalDiceReels ? rollButtonScale : 1) *
        rollButtonSizeBoost,
    ),
  );

  return {
    diceViewportHeight,
    diceViewportWidth,
    diceImageScale: useMobileWebVerticalDiceReels ? reelDiceImageScale : 1,
    diceOrientation: useMobileWebVerticalDiceReels ? 'vertical' : 'horizontal',
    diceOffsetX: useMobileWebVerticalDiceReels
      ? Math.max(8, Math.round(controlLayout.diceFrame.width * reelRightShiftRatio))
      : 0,
    diceTranslateY: useMobileWebVerticalDiceReels
      ? Math.round((controlLayout.diceFrame.height - diceViewportHeight) / 2)
      : 0,
    rollArtSize,
    rollTranslateY: useMobileWebVerticalDiceReels
      ? Math.max(0, Math.round((controlLayout.rollFrame.height - rollArtSize) / 2))
      : 0,
  };
};
