import {
  resolveMatchStageSideColumnWidth,
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

  it('shrinks tablet-landscape tray columns by about 20 percent', () => {
    expect(
      resolveMatchStageSideColumnWidth({
        isTabletLandscape: true,
        stageContentWidth: 1024,
        viewportWidth: 1024,
      }),
    ).toBe(196);
  });
});

