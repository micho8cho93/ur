import { getPathVariantDefinition } from '@/logic/pathVariants';
import { getBoardPieceRenderMetrics, getBoardScoreExitLogicalCoord, getBoardTileLandingOffset } from './Board';
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

  it('applies row-aware landing offsets for the vertical board', () => {
    const offsets = Array.from({ length: 8 }, (_, col) =>
      getBoardTileLandingOffset({
        cellSize: 100,
        col,
        orientation: 'vertical',
        row: 1,
      }).y,
    );

    expect(new Set(offsets).size).toBeGreaterThan(4);
    expect(offsets[0]).toBeLessThan(offsets[3]);
    expect(offsets[4]).toBeGreaterThan(offsets[7]);
    expect(offsets[7]).toBeLessThan(0);
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
