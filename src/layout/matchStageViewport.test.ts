import {
  resolveMatchStageBoardScale,
  resolveMobileBoardRowInset,
  resolveMobileBoardViewportSafetyInsets,
  resolveMobileReserveRailTopOffset,
  resolveMobileWebHeaderLift,
  resolveMobileWebBoardTrayAlignmentCorrection,
  resolveMatchStageReserveTrayScale,
  resolveMatchStageSideColumnWidth,
  resolveMatchStageTabletPortraitTuning,
  resolveMatchStageViewportHorizontalPadding,
  resolveMatchStageViewportMode,
} from './matchStageViewport';

describe('resolveMatchStageViewportMode', () => {
  it('keeps phones on the mobile layout', () => {
    expect(resolveMatchStageViewportMode({ width: 390, height: 844 })).toEqual({
      isMobileHandset: true,
      isTabletLandscape: false,
      isTabletPortrait: false,
      isTabletViewport: false,
      useMobileLayout: true,
      useMobileSideReserveRails: true,
      useSideColumns: false,
    });
  });

  it('routes tablet portrait through the mobile layout path', () => {
    expect(resolveMatchStageViewportMode({ width: 834, height: 1194 })).toEqual({
      isMobileHandset: false,
      isTabletLandscape: false,
      isTabletPortrait: true,
      isTabletViewport: true,
      useMobileLayout: true,
      useMobileSideReserveRails: true,
      useSideColumns: false,
    });
  });

  it('keeps tablet landscape on the wide layout path', () => {
    expect(resolveMatchStageViewportMode({ width: 1194, height: 834 })).toEqual({
      isMobileHandset: false,
      isTabletLandscape: true,
      isTabletPortrait: false,
      isTabletViewport: true,
      useMobileLayout: false,
      useMobileSideReserveRails: false,
      useSideColumns: true,
    });
  });

  it('treats desktop viewports as wide layouts without tablet overrides', () => {
    expect(resolveMatchStageViewportMode({ width: 1440, height: 900 })).toEqual({
      isMobileHandset: false,
      isTabletLandscape: false,
      isTabletPortrait: false,
      isTabletViewport: false,
      useMobileLayout: false,
      useMobileSideReserveRails: false,
      useSideColumns: true,
    });
  });
});

describe('resolveMatchStageSideColumnWidth', () => {
  it('preserves the existing wide-column sizing outside tablet landscape', () => {
    expect(
      resolveMatchStageSideColumnWidth({
        isTabletLandscape: false,
        stageContentWidth: 1024,
        viewportWidth: 1024,
      }),
    ).toBe(245);
  });

  it('shrinks tablet-landscape tray columns by about 36 percent', () => {
    expect(
      resolveMatchStageSideColumnWidth({
        isTabletLandscape: true,
        stageContentWidth: 1024,
        viewportWidth: 1024,
      }),
    ).toBe(221);
  });
});

describe('resolveMatchStageViewportHorizontalPadding', () => {
  it('adds side breathing room on tablet landscape', () => {
    expect(resolveMatchStageViewportHorizontalPadding({ isTabletLandscape: true, viewportWidth: 1194 })).toBe(131);
  });

  it('keeps other layouts flush with the existing viewport padding logic', () => {
    expect(resolveMatchStageViewportHorizontalPadding({ isTabletLandscape: false, viewportWidth: 1194 })).toBe(0);
  });
});

describe('resolveMatchStageReserveTrayScale', () => {
  it('applies the reduced tablet-landscape reserve tray fit', () => {
    expect(resolveMatchStageReserveTrayScale({ defaultTrayScale: 0.94, isTabletLandscape: true })).toBe(0.68);
  });

  it('preserves the default tray scale outside tablet landscape', () => {
    expect(resolveMatchStageReserveTrayScale({ defaultTrayScale: 1.08, isTabletLandscape: false })).toBe(1.08);
  });
});

describe('resolveMatchStageTabletPortraitTuning', () => {
  it('keeps the current mobile-side-rail sizing for non-tablet-portrait layouts', () => {
    expect(resolveMatchStageTabletPortraitTuning(false)).toEqual({
      boardLiftViewportRatio: 0.042,
      boardGapControlScale: 1,
      mobileSideBoardScaleMultiplier: 0.8,
      reserveColumnMaxWidth: 80,
      reserveColumnMinWidth: 52,
      reserveColumnWidthRatio: 0.16,
      reservePieceScale: 0.84,
      rollButtonMaxSize: 102,
      rollButtonMinSize: 84,
      rollButtonWidthRatio: 0.22,
      trayScale: 1,
    });
  });

  it('upscales the board-adjacent controls for tablet portrait web', () => {
    expect(resolveMatchStageTabletPortraitTuning(true)).toEqual({
      boardLiftViewportRatio: 0.052,
      boardGapControlScale: 1.1,
      mobileSideBoardScaleMultiplier: 0.78,
      reserveColumnMaxWidth: 68,
      reserveColumnMinWidth: 48,
      reserveColumnWidthRatio: 0.13,
      reservePieceScale: 0.96,
      rollButtonMaxSize: 116,
      rollButtonMinSize: 90,
      rollButtonWidthRatio: 0.235,
      trayScale: 1.08,
    });
  });
});

describe('resolveMobileWebHeaderLift', () => {
  it('keeps non-web mobile layouts aligned to the board lift', () => {
    expect(
      resolveMobileWebHeaderLift({
        boardLift: 18,
        isMobileLayout: true,
        isMobileWebLayout: false,
      }),
    ).toBe(18);
  });

  it('reduces the mobile web header lift so top chrome stays visible', () => {
    expect(
      resolveMobileWebHeaderLift({
        boardLift: 18,
        isMobileLayout: true,
        isMobileWebLayout: true,
      }),
    ).toBe(10);
  });
});

describe('resolveMobileReserveRailTopOffset', () => {
  it('keeps the default tray top offset outside the online mobile web path', () => {
    expect(
      resolveMobileReserveRailTopOffset({
        isMobileWebLayout: false,
        isOnlineMatch: true,
        reserveColumnWidth: 56,
        useMobileSideReserveRails: true,
      }),
    ).toBe(8);
  });

  it('adds extra tray drop for online mobile web layouts', () => {
    expect(
      resolveMobileReserveRailTopOffset({
        isMobileWebLayout: true,
        isOnlineMatch: true,
        reserveColumnWidth: 56,
        useMobileSideReserveRails: true,
      }),
    ).toBe(16);
  });
});

describe('resolveMobileBoardRowInset', () => {
  it('keeps the compact mobile web side-rail inset locked to the tight edge padding', () => {
    expect(
      resolveMobileBoardRowInset({
        isMobileWebLayout: true,
        useMobileSideReserveRails: true,
        viewportWidth: 390,
      }),
    ).toBe(6);
  });

  it('scales the inset with viewport width outside the compact mobile web rail layout', () => {
    expect(
      resolveMobileBoardRowInset({
        isMobileWebLayout: false,
        useMobileSideReserveRails: false,
        viewportWidth: 520,
      }),
    ).toBe(8);
  });
});

describe('resolveMobileBoardViewportSafetyInsets', () => {
  it('adds extra mobile web breathing room so board art and controls stay inside the viewport', () => {
    expect(
      resolveMobileBoardViewportSafetyInsets({
        isMobileLayout: true,
        isMobileWebLayout: true,
        viewportHeight: 844,
        viewportWidth: 390,
      }),
    ).toEqual({
      horizontal: 8,
      vertical: 12,
    });
  });

  it('stays disabled for non-mobile layouts', () => {
    expect(
      resolveMobileBoardViewportSafetyInsets({
        isMobileLayout: false,
        isMobileWebLayout: false,
        viewportHeight: 900,
        viewportWidth: 1440,
      }),
    ).toEqual({
      horizontal: 0,
      vertical: 0,
    });
  });
});

describe('resolveMatchStageBoardScale', () => {
  it('reduces the mobile web board multiplier by 10 percent before the viewport clamp', () => {
    expect(
      resolveMatchStageBoardScale({
        isMobileLayout: true,
        isMobileWebLayout: true,
        layoutBoardScale: 1,
        viewportFitBoardScale: 2,
      }),
    ).toBeCloseTo(1.104345, 6);
  });

  it('still honors the viewport fit cap on mobile layouts', () => {
    expect(
      resolveMatchStageBoardScale({
        isMobileLayout: true,
        isMobileWebLayout: true,
        layoutBoardScale: 1,
        viewportFitBoardScale: 1.02,
      }),
    ).toBe(1.02);
  });
});

describe('resolveMobileWebBoardTrayAlignmentCorrection', () => {
  it('adds lift when the measured board top sits below the tray tops', () => {
    expect(
      resolveMobileWebBoardTrayAlignmentCorrection({
        boardFrame: { y: 220 },
        currentCorrection: 8,
        darkTrayFrame: { y: 196 },
        lightTrayFrame: { y: 198 },
      }),
    ).toBe(32);
  });

  it('holds the current lift once the board is aligned within tolerance', () => {
    expect(
      resolveMobileWebBoardTrayAlignmentCorrection({
        boardFrame: { y: 198 },
        currentCorrection: 24,
        darkTrayFrame: { y: 198 },
        lightTrayFrame: { y: 197 },
      }),
    ).toBe(24);
  });

  it('resets when a measurement is missing', () => {
    expect(
      resolveMobileWebBoardTrayAlignmentCorrection({
        boardFrame: null,
        currentCorrection: 24,
        darkTrayFrame: { y: 198 },
        lightTrayFrame: { y: 197 },
      }),
    ).toBe(0);
  });
});
