import {
  BOARD_CLEARANCE,
  COMPACT_STAGE_LEFT_NUDGE,
  COMPACT_STAGE_MIN_X,
  MOBILE_DICE_STAGE_WIDTH_SCALE,
  STAGE_MARGIN,
  VERTICAL_BOARD_ART_INSETS,
  VERTICAL_BOARD_GAP_GRID_COLS,
  VERTICAL_BOARD_GAP_GRID_ROWS,
  VERTICAL_BOARD_GAP_ROW_SPAN,
  VERTICAL_BOARD_GAP_ROW_START,
  computeBoardGapControlLayout,
  computeLandingZone,
  type BoardFrame,
} from './matchDiceStageLayout';

describe('matchDiceStageLayout', () => {
  const boardFrame: BoardFrame = {
    x: 324,
    y: 164,
    width: 286,
    height: 478,
  };

  it.each([
    { compact: false, viewportHeight: 900, viewportWidth: 1180 },
    { compact: true, viewportHeight: 760, viewportWidth: 820 },
  ])(
    'keeps the slot stage clear of the board for compact=$compact',
    ({ compact, viewportHeight, viewportWidth }) => {
      const landingZone = computeLandingZone({
        boardFrame,
        compact,
        viewportHeight,
        viewportWidth,
      });

      expect(landingZone.x + landingZone.width).toBeLessThanOrEqual(
        boardFrame.x - (BOARD_CLEARANCE + (compact ? COMPACT_STAGE_LEFT_NUDGE : 0)),
      );
      expect(landingZone.height).toBeGreaterThan(120);
      expect(landingZone.width).toBeGreaterThan(160);
    },
  );

  it('shifts compact mobile stages farther left when the board leaves a tight gutter', () => {
    const compactBoardFrame: BoardFrame = {
      x: 100,
      y: 164,
      width: 286,
      height: 478,
    };

    const landingZone = computeLandingZone({
      boardFrame: compactBoardFrame,
      compact: true,
      viewportHeight: 760,
      viewportWidth: 420,
    });

    expect(landingZone.x).toBeLessThan(STAGE_MARGIN);
    expect(landingZone.x + landingZone.width).toBeLessThanOrEqual(
      compactBoardFrame.x - (BOARD_CLEARANCE + COMPACT_STAGE_LEFT_NUDGE),
    );
  });

  it('widens the compact mobile stage viewport by 50% unless the left gutter cap stops it', () => {
    const tabletLandingZone = computeLandingZone({
      boardFrame,
      compact: true,
      viewportHeight: 760,
      viewportWidth: 820,
    });
    const mobileLandingZone = computeLandingZone({
      boardFrame,
      compact: true,
      viewportHeight: 760,
      viewportWidth: 420,
    });
    const availableLeftGutter =
      boardFrame.x - COMPACT_STAGE_MIN_X - (BOARD_CLEARANCE + COMPACT_STAGE_LEFT_NUDGE);

    expect(mobileLandingZone.width).toBeCloseTo(
      Math.min(availableLeftGutter, tabletLandingZone.width * MOBILE_DICE_STAGE_WIDTH_SCALE),
      5,
    );
    expect(mobileLandingZone.height).toBeCloseTo(tabletLandingZone.height, 5);
  });

  it('anchors the mobile board-gap controls to rows 5 and 6 beside the board lane', () => {
    const boardGapLayout = computeBoardGapControlLayout({ boardFrame });
    const renderedGridWidth =
      boardFrame.width * (1 - VERTICAL_BOARD_ART_INSETS.left - VERTICAL_BOARD_ART_INSETS.right);
    const renderedGridHeight =
      boardFrame.height * (1 - VERTICAL_BOARD_ART_INSETS.top - VERTICAL_BOARD_ART_INSETS.bottom);
    const expectedLaneWidth = Math.round(renderedGridWidth / VERTICAL_BOARD_GAP_GRID_COLS);
    const expectedLaneHeight = Math.round(
      (renderedGridHeight * VERTICAL_BOARD_GAP_ROW_SPAN) / VERTICAL_BOARD_GAP_GRID_ROWS,
    );
    const expectedGapTop = Math.round(
      boardFrame.y +
        boardFrame.height * VERTICAL_BOARD_ART_INSETS.top +
        (renderedGridHeight / VERTICAL_BOARD_GAP_GRID_ROWS) * VERTICAL_BOARD_GAP_ROW_START,
    );

    expect(boardGapLayout.diceFrame.width).toBe(expectedLaneWidth);
    expect(boardGapLayout.rollFrame.width).toBe(expectedLaneWidth);
    expect(boardGapLayout.diceFrame.height).toBe(expectedLaneHeight);
    expect(boardGapLayout.rollFrame.height).toBe(expectedLaneHeight);
    expect(boardGapLayout.diceFrame.y).toBe(expectedGapTop);
    expect(boardGapLayout.rollFrame.y).toBe(expectedGapTop);
    expect(boardGapLayout.rollFrame.x).toBeGreaterThan(boardGapLayout.diceFrame.x);
  });

  it('keeps the gap controls inside the rendered board art bounds', () => {
    const boardGapLayout = computeBoardGapControlLayout({ boardFrame });
    const artLeft = boardFrame.x;
    const artTop = boardFrame.y;
    const artRight = boardFrame.x + boardFrame.width;
    const artBottom = boardFrame.y + boardFrame.height;

    expect(boardGapLayout.diceFrame.x).toBeGreaterThanOrEqual(artLeft);
    expect(boardGapLayout.diceFrame.y).toBeGreaterThanOrEqual(artTop);
    expect(boardGapLayout.rollFrame.x + boardGapLayout.rollFrame.width).toBeLessThanOrEqual(artRight);
    expect(boardGapLayout.rollFrame.y + boardGapLayout.rollFrame.height).toBeLessThanOrEqual(artBottom);
  });
});
