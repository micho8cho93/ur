import { getPathVariantDefinition } from '@/logic/pathVariants';
import {
  getBoardPieceRenderMetrics,
  getBoardScoreExitLogicalCoord,
  getBoardTileFocusFrame,
  getBoardTileLandingOffset,
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

  it('derives landing anchors from non-uniform focus frames on the vertical board', () => {
    const offsets = Array.from({ length: 8 }, (_, col) =>
      getBoardTileLandingOffset({
        cellSize: 100,
        col,
        orientation: 'vertical',
        row: 1,
      }).y,
    );

    expect(new Set(offsets).size).toBeGreaterThan(6);
    expect(offsets[0]).toBeGreaterThan(offsets[3]);
    expect(offsets[3]).toBeGreaterThan(offsets[6]);
    expect(offsets[7]).toBeLessThan(0);
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

    expect(leftOuter.width).not.toBe(centerLane.width);
    expect(leftOuter.height).not.toBe(centerLane.height);
    expect(leftOuter.centerX).toBeGreaterThan(centerLane.centerX);
    expect(centerLane.centerY).toBeGreaterThan(50);
    expect(bottomOuter.centerX).toBeGreaterThan(50);
    expect(bottomOuter.centerY).toBeLessThan(50);
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
