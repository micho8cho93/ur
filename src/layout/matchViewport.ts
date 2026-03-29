export interface ViewportSize {
  width: number;
  height: number;
}

export interface ViewportMeasurementLike {
  width?: number | null;
  height?: number | null;
}

export interface ViewportDeviceProfile {
  isMobileWidth: boolean;
  isTabletLandscape: boolean;
  isTabletPortrait: boolean;
  isTabletViewport: boolean;
}

export const MOBILE_VIEWPORT_MAX_WIDTH = 759;
export const TABLET_VIEWPORT_MIN_EDGE = 760;
export const TABLET_VIEWPORT_MAX_EDGE = 1366;

const coercePositiveDimension = (candidate: number | null | undefined, fallback: number) => {
  if (typeof candidate !== 'number' || !Number.isFinite(candidate) || candidate <= 0) {
    return Math.max(0, Math.round(fallback));
  }

  return Math.max(0, Math.round(candidate));
};

export const resolveVisibleViewportSize = (
  windowSize: ViewportSize,
  visualViewport?: ViewportMeasurementLike | null,
): ViewportSize => ({
  width: coercePositiveDimension(visualViewport?.width, windowSize.width),
  height: coercePositiveDimension(visualViewport?.height, windowSize.height),
});

export const resolveViewportDeviceProfile = ({ width, height }: ViewportSize): ViewportDeviceProfile => {
  const shorterEdge = Math.min(width, height);
  const longerEdge = Math.max(width, height);
  const isMobileWidth = width <= MOBILE_VIEWPORT_MAX_WIDTH;
  const isTabletViewport =
    shorterEdge >= TABLET_VIEWPORT_MIN_EDGE &&
    longerEdge <= TABLET_VIEWPORT_MAX_EDGE;
  const isTabletPortrait = isTabletViewport && height >= width;
  const isTabletLandscape = isTabletViewport && width > height;

  return {
    isMobileWidth,
    isTabletLandscape,
    isTabletPortrait,
    isTabletViewport,
  };
};
