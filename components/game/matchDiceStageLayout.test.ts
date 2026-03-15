import {
  buildMatchDiceStageMotion,
  getMatchDiceStageSettledRightEdgePx,
  sampleMatchDiceStageMotion,
} from './matchDiceStageMotion';
import {
  BOARD_CLEARANCE,
  computeLandingZone,
  getStagePixelPosition,
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
    'clamps settled dice so the rightmost die stays clear of the board for compact=$compact',
    ({ compact, viewportHeight, viewportWidth }) => {
      const landingZone = computeLandingZone({
        boardFrame,
        compact,
        viewportHeight,
        viewportWidth,
      });
      const motion = buildMatchDiceStageMotion({
        playbackId: 17,
        rollValue: 3,
        landingZone,
      });
      const rightEdgePx = getMatchDiceStageSettledRightEdgePx({
        landingZone,
        motion,
      });
      const absoluteRightEdge = landingZone.x + rightEdgePx;

      expect(absoluteRightEdge).toBeLessThanOrEqual(boardFrame.x - BOARD_CLEARANCE);
    },
  );

  it.each([
    { compact: false, viewportHeight: 900, viewportWidth: 1180 },
    { compact: true, viewportHeight: 760, viewportWidth: 820 },
  ])(
    'settles dice across a shared horizontal band with lateral spread for compact=$compact',
    ({ compact, viewportHeight, viewportWidth }) => {
      const landingZone = computeLandingZone({
        boardFrame,
        compact,
        viewportHeight,
        viewportWidth,
      });
      const motion = buildMatchDiceStageMotion({
        playbackId: 17,
        rollValue: 3,
        landingZone,
      });
      const settledPositions = motion.map((config) =>
        getStagePixelPosition({
          landingZone,
          sample: sampleMatchDiceStageMotion(config, 1),
        }),
      );
      const xValues = settledPositions.map((position) => position.x);
      const yValues = settledPositions.map((position) => position.y);
      const xSpread = Math.max(...xValues) - Math.min(...xValues);
      const ySpread = Math.max(...yValues) - Math.min(...yValues);

      expect(xValues[0]).toBeLessThan(xValues[1]);
      expect(xValues[1]).toBeLessThan(xValues[2]);
      expect(xValues[2]).toBeLessThan(xValues[3]);
      expect(xSpread).toBeGreaterThan(40);
      expect(ySpread).toBeLessThan(12);
      expect(xSpread).toBeGreaterThan(ySpread * 4);
    },
  );
});
