import {
  buildMatchDiceStageMotion,
  getMatchDiceStageSettledRightEdgePx,
  sampleMatchDiceStageMotion,
} from './matchDiceStageMotion';
import {
  BOARD_CLEARANCE,
  COMPACT_STAGE_MIN_X,
  COMPACT_STAGE_LEFT_NUDGE,
  MOBILE_DICE_STAGE_WIDTH_SCALE,
  STAGE_MARGIN,
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
});
