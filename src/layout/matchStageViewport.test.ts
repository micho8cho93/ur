import {
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
    expect(resolveMatchStageViewportHorizontalPadding({ isTabletLandscape: true, viewportWidth: 1194 })).toBe(119);
  });

  it('keeps other layouts flush with the existing viewport padding logic', () => {
    expect(resolveMatchStageViewportHorizontalPadding({ isTabletLandscape: false, viewportWidth: 1194 })).toBe(0);
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
