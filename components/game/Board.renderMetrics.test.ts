import { getPathVariantDefinition } from '@/logic/pathVariants';
import {
  getBoardPieceRenderMetrics,
  getBoardScoreExitLogicalCoord,
  getBoardTileFocusFrame,
  getBoardTileLandingOffset,
  getVerticalBoardDisplayRowCenterRatio,
  VERTICAL_BOARD_ART_INSETS,
  VERTICAL_BOARD_DISPLAY_ROW_HEIGHT_RATIOS,
} from './Board';
import { PIECE_ART_VISIBLE_COVERAGE } from './Piece';

describe('getBoardPieceRenderMetrics', () => {
  it.each([
    { viewportWidth: 390, boardScale: 1, orientation: 'vertical' as const },
    { viewportWidth: 768, boardScale: 1, orientation: 'vertical' as const },
    { viewportWidth: 1280, boardScale: 0.94, orientation: 'vertical' as const },
    { viewportWidth: 1024, boardScale: 1, orientation: 'horizontal' as const },
  ])(
    'targets 75% visible tile coverage for %o',
    ({ viewportWidth, boardScale, orientation }) => {
      const metrics = getBoardPieceRenderMetrics({ viewportWidth, boardScale, orientation });

      expect(metrics.pixelSize).toBeGreaterThanOrEqual(18);
      expect(metrics.artScale * PIECE_ART_VISIBLE_COVERAGE).toBeCloseTo(0.75, 5);
      expect(metrics.artOffsetY).toBe(0);
    },
  );

  it('derives landing anchors from the calibrated vertical board art focus frames', () => {
    const offsets = Array.from({ length: 8 }, (_, col) =>
      getBoardTileLandingOffset({
        cellSize: 100,
        col,
        orientation: 'vertical',
        row: 1,
      }).y,
    );

    expect(offsets).toEqual([-2, -2, -1, -1, 0, 0, 0, -8]);
    expect(Math.max(...offsets)).toBeLessThanOrEqual(0);
    expect(Math.min(...offsets)).toBeGreaterThanOrEqual(-8);
    expect(offsets[7]).toBeLessThan(offsets[6]);
  });

  it('aligns every vertical lane to the right-lane baseline anchor in both axes', () => {
    const displayRows = Array.from({ length: 8 }, (_, col) => col);

    displayRows.forEach((col) => {
      const leftLaneOffset = getBoardTileLandingOffset({
        cellSize: 100,
        col,
        orientation: 'vertical',
        row: 2,
      });
      const centerLaneOffset = getBoardTileLandingOffset({
        cellSize: 100,
        col,
        orientation: 'vertical',
        row: 1,
      });
      const rightLaneOffset = getBoardTileLandingOffset({
        cellSize: 100,
        col,
        orientation: 'vertical',
        row: 0,
      });

      expect(leftLaneOffset).toEqual(rightLaneOffset);
      expect(centerLaneOffset).toEqual(rightLaneOffset);
    });
  });

  it('keeps vertical focus frames inside each cell while varying their size and anchor', () => {
    const leftOuter = getBoardTileFocusFrame({
      cellSize: 100,
      col: 0,
      orientation: 'vertical',
      row: 2,
    });
    const centerLane = getBoardTileFocusFrame({
      cellSize: 100,
      col: 3,
      orientation: 'vertical',
      row: 1,
    });
    const bottomOuter = getBoardTileFocusFrame({
      cellSize: 100,
      col: 7,
      orientation: 'vertical',
      row: 0,
    });

    expect(leftOuter.left).toBeGreaterThanOrEqual(0);
    expect(leftOuter.top).toBeGreaterThanOrEqual(0);
    expect(leftOuter.left + leftOuter.width).toBeLessThanOrEqual(100);
    expect(leftOuter.top + leftOuter.height).toBeLessThanOrEqual(100);

    expect(centerLane.left).toBeGreaterThanOrEqual(0);
    expect(centerLane.top).toBeGreaterThanOrEqual(0);
    expect(centerLane.left + centerLane.width).toBeLessThanOrEqual(100);
    expect(centerLane.top + centerLane.height).toBeLessThanOrEqual(100);

    expect(leftOuter.width).toBeGreaterThan(centerLane.width);
    expect(bottomOuter.height).not.toBe(centerLane.height);
    expect(leftOuter.centerX).toBe(50);
    expect(centerLane.centerX).toBe(51);
    expect(bottomOuter.centerX).toBe(51);
    expect(leftOuter.centerY).toBe(48);
    expect(centerLane.centerY).toBe(49);
    expect(bottomOuter.centerY).toBe(42);
    expect(bottomOuter.top).toBeLessThanOrEqual(2);
  });

  it('exports the vertical board art insets used by layout consumers', () => {
    expect(VERTICAL_BOARD_ART_INSETS.top).toBeCloseTo(47 / 1024, 6);
    expect(VERTICAL_BOARD_ART_INSETS.right).toBe(0.385);
    expect(VERTICAL_BOARD_ART_INSETS.bottom).toBeCloseTo(28 / 1024, 6);
    expect(VERTICAL_BOARD_ART_INSETS.left).toBe(0.36);
  });

  it('calibrates vertical row heights to the non-uniform board art bands', () => {
    expect(VERTICAL_BOARD_DISPLAY_ROW_HEIGHT_RATIOS).toHaveLength(8);
    expect(VERTICAL_BOARD_DISPLAY_ROW_HEIGHT_RATIOS.reduce((total, ratio) => total + ratio, 0)).toBeCloseTo(8, 5);
    expect(VERTICAL_BOARD_DISPLAY_ROW_HEIGHT_RATIOS[1]).toBeGreaterThan(
      VERTICAL_BOARD_DISPLAY_ROW_HEIGHT_RATIOS[6],
    );
    expect(getVerticalBoardDisplayRowCenterRatio(2) - 2.5).toBeGreaterThan(0.08);
    expect(getVerticalBoardDisplayRowCenterRatio(6) - 6.5).toBeLessThan(-0.06);
  });

  it('keeps vertical focus-frame ratios stable across mobile-web and desktop-web tile sizes', () => {
    const sampleTiles = [
      { row: 2, col: 0 },
      { row: 1, col: 3 },
      { row: 0, col: 7 },
    ] as const;
    const baselineCellSize = 100;
    const baselineFrames = sampleTiles.map(({ row, col }) =>
      getBoardTileFocusFrame({
        cellSize: baselineCellSize,
        col,
        orientation: 'vertical',
        row,
      }),
    );

    [42, 58, 86, 132].forEach((cellSize) => {
      sampleTiles.forEach(({ row, col }, index) => {
        const frame = getBoardTileFocusFrame({
          cellSize,
          col,
          orientation: 'vertical',
          row,
        });
        const baselineFrame = baselineFrames[index];

        expect(frame.left / cellSize).toBeCloseTo(baselineFrame.left / baselineCellSize, 2);
        expect(frame.top / cellSize).toBeCloseTo(baselineFrame.top / baselineCellSize, 2);
        expect(frame.width / cellSize).toBeCloseTo(baselineFrame.width / baselineCellSize, 2);
        expect(frame.height / cellSize).toBeCloseTo(baselineFrame.height / baselineCellSize, 2);
        expect(frame.centerX / cellSize).toBeCloseTo(baselineFrame.centerX / baselineCellSize, 2);
        expect(frame.centerY / cellSize).toBeCloseTo(baselineFrame.centerY / baselineCellSize, 2);
      });
    });
  });

  it('keeps landing offsets proportional across handset, tablet, and desktop board sizes', () => {
    const baselineCellSize = 100;
    const baselineOffset = getBoardTileLandingOffset({
      cellSize: baselineCellSize,
      col: 3,
      orientation: 'vertical',
      row: 1,
    });

    [42, 58, 86, 132].forEach((cellSize) => {
      const offset = getBoardTileLandingOffset({
        cellSize,
        col: 3,
        orientation: 'vertical',
        row: 1,
      });

      expect(offset.x / cellSize).toBeCloseTo(baselineOffset.x / baselineCellSize, 2);
      expect(offset.y / cellSize).toBeCloseTo(baselineOffset.y / baselineCellSize, 2);
    });
  });

  it('keeps horizontal boards on the legacy centered landing point', () => {
    expect(
      getBoardTileLandingOffset({
        cellSize: 100,
        col: 3,
        orientation: 'horizontal',
        row: 1,
      }),
    ).toEqual({ x: 0, y: 0 });
  });

  it('keeps horizontal focus frames as full-cell centered boxes', () => {
    expect(
      getBoardTileFocusFrame({
        cellSize: 100,
        col: 3,
        orientation: 'horizontal',
        row: 1,
      }),
    ).toEqual({
      centerX: 50,
      centerY: 50,
      height: 100,
      left: 0,
      top: 0,
      width: 100,
    });
  });

  it.each([
    ['default', 'light'],
    ['default', 'dark'],
    ['full-path', 'light'],
    ['full-path', 'dark'],
  ] as const)('extends the score exit forward for the %s %s path', (variant, color) => {
    const pathDefinition = getPathVariantDefinition(variant);
    const path = pathDefinition[color];
    const finalCoord = path[path.length - 1];
    const previousCoord = path[path.length - 2];

    expect(getBoardScoreExitLogicalCoord(path)).toEqual({
      row: finalCoord.row + (finalCoord.row - previousCoord.row),
      col: finalCoord.col + (finalCoord.col - previousCoord.col),
    });
  });
});
