import { resolveViewportDeviceProfile, resolveVisibleViewportSize } from './matchViewport';

describe('resolveVisibleViewportSize', () => {
  it('falls back to the window dimensions when no visual viewport is available', () => {
    expect(resolveVisibleViewportSize({ width: 390, height: 844 })).toEqual({ width: 390, height: 844 });
  });

  it('prefers positive visual viewport dimensions when they are available', () => {
    expect(
      resolveVisibleViewportSize(
        { width: 390, height: 844 },
        { width: 372.4, height: 662.7 },
      ),
    ).toEqual({ width: 372, height: 663 });
  });

  it('ignores invalid visual viewport values', () => {
    expect(
      resolveVisibleViewportSize(
        { width: 390, height: 844 },
        { width: 0, height: Number.NaN },
      ),
    ).toEqual({ width: 390, height: 844 });
  });
});

describe('resolveViewportDeviceProfile', () => {
  it('treats narrow phone viewports as mobile width layouts', () => {
    expect(resolveViewportDeviceProfile({ width: 390, height: 844 })).toEqual({
      isMobileWidth: true,
      isTabletLandscape: false,
      isTabletPortrait: false,
      isTabletViewport: false,
    });
  });

  it('treats portrait tablets as tablet portrait viewports', () => {
    expect(resolveViewportDeviceProfile({ width: 834, height: 1194 })).toEqual({
      isMobileWidth: false,
      isTabletLandscape: false,
      isTabletPortrait: true,
      isTabletViewport: true,
    });
  });

  it('treats landscape tablets as tablet landscape viewports', () => {
    expect(resolveViewportDeviceProfile({ width: 1194, height: 834 })).toEqual({
      isMobileWidth: false,
      isTabletLandscape: true,
      isTabletPortrait: false,
      isTabletViewport: true,
    });
  });
});
