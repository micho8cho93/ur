import {
  BOARD_CLEARANCE,
  COMPACT_STAGE_LEFT_NUDGE,
  COMPACT_STAGE_MIN_X,
  MOBILE_DICE_STAGE_WIDTH_SCALE,
  STAGE_MARGIN,
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
});
