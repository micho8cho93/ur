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

export const STAGE_MARGIN = 16;
export const BOARD_CLEARANCE = 12;
export const COMPACT_STAGE_LEFT_NUDGE = 16;
export const COMPACT_STAGE_MIN_X = -28;
export const MOBILE_DICE_STAGE_WIDTH_SCALE = 1.5;
export const VERTICAL_BOARD_GAP_ROW_START = 4;
export const VERTICAL_BOARD_GAP_ROW_SPAN = 2;
export const VERTICAL_BOARD_GAP_GRID_ROWS = 8;
export const VERTICAL_BOARD_GAP_GRID_COLS = 3;
export const VERTICAL_BOARD_ART_INSETS = {
  top: 0.024,
  right: 0.385,
  bottom: 0.018,
  left: 0.36,
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
  const rowHeight = gridHeight / gridRows;
  const laneHeight = rowHeight * gapRowSpan;
  const laneTop = gridTop + rowHeight * gapRowStart;

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
