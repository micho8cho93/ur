export interface ViewportSize {
  width: number;
  height: number;
}

export interface ViewportMeasurementLike {
  width?: number | null;
  height?: number | null;
}

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
