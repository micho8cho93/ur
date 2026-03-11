import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

type Point = {
  x: number;
  y: number;
};

type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type Viewport = {
  width: number;
  height: number;
};

type AmbientBandKey = 'top' | 'bottom' | 'left' | 'right' | 'center';
type TravelAxis = 'horizontal' | 'vertical';
type BugTravelPattern = TravelAxis | 'diagonal';
type BugKind = 'crawler' | 'beetle' | 'spider';

type AmbientBand = {
  key: AmbientBandKey;
  rect: Rect;
  weight: number;
};

type DustParticleConfig = {
  color: string;
  delayMs: number;
  durationMs: number;
  end: Point;
  height: number;
  opacity: number;
  phase: number;
  scaleEnd: number;
  scaleStart: number;
  start: Point;
  width: number;
  wobbleX: number;
  wobbleY: number;
};

type BugCrawlerConfig = {
  delayMs: number;
  durationMs: number;
  end: Point;
  kind: BugKind;
  opacity: number;
  phase: number;
  renderHeight: number;
  renderWidth: number;
  size: number;
  start: Point;
  tint: string;
  track: [Point, Point];
  wobble: number;
};

type MotionTrack = {
  end: Point;
  start: Point;
  track: [Point, Point];
};

type LeafConfig = {
  delayMs: number;
  durationMs: number;
  end: Point;
  opacity: number;
  phase: number;
  renderHeight: number;
  renderWidth: number;
  rotationTurns: number;
  scaleEnd: number;
  scaleStart: number;
  size: number;
  start: Point;
  stemHeight: number;
  tint: string;
  track: [Point, Point];
  wobble: number;
};

export interface AmbientBackgroundEffectsProps {
  bugEnabled?: boolean;
  centerSafeZone?: Rect | null;
  dustCount?: number;
  dustEnabled?: boolean;
  height: number;
  leafEnabled?: boolean;
  maxVisibleBugs?: number;
  maxVisibleLeaves?: number;
  style?: StyleProp<ViewStyle>;
  width: number;
}

export const AMBIENT_BACKGROUND_DEFAULTS = {
  bugEnabled: true,
  dustEnabled: true,
  leafEnabled: true,
  maxVisibleBugs: 1,
  maxVisibleLeaves: 1,
} as const;

const CENTER_SAFE_ZONE_FALLBACK = {
  xRatio: 0.18,
  yRatio: 0.18,
  widthRatio: 0.64,
  heightRatio: 0.54,
} as const;

const DUST_COUNT_RANGE = {
  min: 4,
  max: 10,
} as const;

const BUG_DURATION_RANGE_MS = {
  min: 12_000,
  max: 25_000,
} as const;

// Keep one bug at a time, but reduce idle gaps so crawls happen more regularly.
const BUG_RESPAWN_DELAY_RANGE_MS = {
  min: 2_000,
  max: 6_000,
} as const;

const LEAF_DURATION_RANGE_MS = {
  min: 8_000,
  max: 14_000,
} as const;

const LEAF_RESPAWN_DELAY_RANGE_MS = {
  min: 14_000,
  max: 28_000,
} as const;

const DUST_DURATION_RANGE_MS = {
  min: 9_000,
  max: 18_000,
} as const;

const DUST_RESPAWN_DELAY_RANGE_MS = {
  min: 0,
  max: 6_000,
} as const;

const DUST_SIZE_RANGE = {
  min: 2,
  max: 5,
} as const;

const BUG_SIZE_RANGE = {
  min: 7,
  max: 10,
} as const;

const LEAF_SIZE_RANGE = {
  min: 14,
  max: 22,
} as const;

const EDGE_MARGIN = 12;

const BUG_TINTS = [
  'rgba(45, 33, 25, 0.96)',
  'rgba(34, 24, 18, 0.96)',
  'rgba(55, 39, 29, 0.94)',
] as const;

const LEAF_TINTS = [
  'rgba(118, 98, 76, 0.9)',
  'rgba(131, 110, 86, 0.88)',
  'rgba(101, 87, 67, 0.9)',
  'rgba(142, 123, 95, 0.86)',
] as const;

const SPIDER_LEG_ANGLES_TOP = [-42, -22, 18, 38] as const;
const SPIDER_LEG_ANGLES_BOTTOM = [42, 22, -18, -38] as const;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const lerp = (start: number, end: number, progress: number) => start + (end - start) * progress;

const randomBetween = (min: number, max: number) => min + Math.random() * (max - min);

const pickRandom = <T,>(values: readonly T[]): T => values[Math.floor(Math.random() * values.length)] ?? values[0];

const isUsableRect = (rect: Rect | null | undefined): rect is Rect =>
  !!rect && rect.width > 0 && rect.height > 0;

const normalizeRect = (rect: Rect, viewport: Viewport): Rect => {
  const x = clamp(rect.x, 0, viewport.width);
  const y = clamp(rect.y, 0, viewport.height);
  const width = clamp(rect.width, 0, viewport.width - x);
  const height = clamp(rect.height, 0, viewport.height - y);

  return { x, y, width, height };
};

const getCenterSafeZone = (viewport: Viewport, safeZone?: Rect | null): Rect => {
  const padding = clamp(Math.round(Math.min(viewport.width, viewport.height) * 0.055), 28, 56);
  const baseZone = isUsableRect(safeZone)
    ? safeZone
    : {
      x: viewport.width * CENTER_SAFE_ZONE_FALLBACK.xRatio,
      y: viewport.height * CENTER_SAFE_ZONE_FALLBACK.yRatio,
      width: viewport.width * CENTER_SAFE_ZONE_FALLBACK.widthRatio,
      height: viewport.height * CENTER_SAFE_ZONE_FALLBACK.heightRatio,
    };

  return normalizeRect(
    {
      x: baseZone.x - padding,
      y: baseZone.y - padding,
      width: baseZone.width + padding * 2,
      height: baseZone.height + padding * 2,
    },
    viewport,
  );
};

const getAutoDustCount = (viewport: Viewport) =>
  clamp(
    Math.round((viewport.width * viewport.height) / 180_000) + 3,
    DUST_COUNT_RANGE.min,
    DUST_COUNT_RANGE.max,
  );

const getAmbientBands = (viewport: Viewport, safeZone: Rect): AmbientBand[] => {
  const rightStart = safeZone.x + safeZone.width;
  const bottomStart = safeZone.y + safeZone.height;
  const sideBandTop = clamp(safeZone.y - 36, 0, viewport.height);
  const sideBandBottom = clamp(bottomStart + 36, 0, viewport.height);
  const sideBandHeight = Math.max(0, sideBandBottom - sideBandTop);

  const bands: AmbientBand[] = [
    {
      key: 'top',
      rect: { x: 0, y: 0, width: viewport.width, height: Math.max(0, safeZone.y) },
      weight: Math.max(0, safeZone.y) * viewport.width * 1.18,
    },
    {
      key: 'bottom',
      rect: {
        x: 0,
        y: bottomStart,
        width: viewport.width,
        height: Math.max(0, viewport.height - bottomStart),
      },
      weight: Math.max(0, viewport.height - bottomStart) * viewport.width * 1.18,
    },
    {
      key: 'left',
      rect: { x: 0, y: sideBandTop, width: Math.max(0, safeZone.x), height: sideBandHeight },
      weight: Math.max(0, safeZone.x) * sideBandHeight,
    },
    {
      key: 'right',
      rect: {
        x: rightStart,
        y: sideBandTop,
        width: Math.max(0, viewport.width - rightStart),
        height: sideBandHeight,
      },
      weight: Math.max(0, viewport.width - rightStart) * sideBandHeight,
    },
  ];

  return bands.filter((band) => band.rect.width > 18 && band.rect.height > 18);
};

const pickWeightedBand = (bands: AmbientBand[], fallback: AmbientBand): AmbientBand => {
  const totalWeight = bands.reduce((sum, band) => sum + band.weight, 0);

  if (!bands.length || totalWeight <= 0) {
    return fallback;
  }

  let cursor = Math.random() * totalWeight;
  for (const band of bands) {
    cursor -= band.weight;
    if (cursor <= 0) {
      return band;
    }
  }

  return bands[bands.length - 1] ?? fallback;
};

const getPointInRect = (rect: Rect, inset = EDGE_MARGIN): Point => {
  const safeInsetX = Math.min(inset, Math.max(2, rect.width / 4));
  const safeInsetY = Math.min(inset, Math.max(2, rect.height / 4));
  const minX = rect.x + safeInsetX;
  const maxX = rect.x + rect.width - safeInsetX;
  const minY = rect.y + safeInsetY;
  const maxY = rect.y + rect.height - safeInsetY;

  return {
    x: randomBetween(Math.min(minX, maxX), Math.max(minX, maxX)),
    y: randomBetween(Math.min(minY, maxY), Math.max(minY, maxY)),
  };
};

const getAxisForBand = (bandKey: AmbientBandKey): TravelAxis =>
  bandKey === 'left' || bandKey === 'right' ? 'vertical' : 'horizontal';

const getCubicTrack = (
  axis: TravelAxis,
  viewport: Viewport,
  band: AmbientBand,
  overscan: number,
  lateralDrift: number,
): MotionTrack => {
  if (axis === 'horizontal') {
    const fromLeadingEdge = Math.random() < 0.5;
    const laneInset = Math.min(18, Math.max(6, band.rect.height * 0.22));
    const minY = band.rect.y + laneInset;
    const maxY = band.rect.y + Math.max(laneInset, band.rect.height - laneInset);
    const startY = randomBetween(Math.min(minY, maxY), Math.max(minY, maxY));
    const endY = clamp(
      startY + randomBetween(-lateralDrift, lateralDrift),
      Math.min(minY, maxY),
      Math.max(minY, maxY),
    );
    const startX = fromLeadingEdge ? -overscan : viewport.width + overscan;
    const endX = fromLeadingEdge ? viewport.width + overscan : -overscan;
    const curveBias = band.key === 'top' ? 1 : -1;

    return {
      end: { x: endX, y: endY },
      start: { x: startX, y: startY },
      track: [
        {
          x: lerp(startX, endX, 0.28) + randomBetween(-26, 26),
          y: clamp(startY + curveBias * randomBetween(8, lateralDrift) + randomBetween(-6, 6), minY, maxY),
        },
        {
          x: lerp(startX, endX, 0.72) + randomBetween(-26, 26),
          y: clamp(endY + curveBias * randomBetween(8, lateralDrift) + randomBetween(-6, 6), minY, maxY),
        },
      ],
    };
  }

  const fromTopEdge = Math.random() < 0.5;
  const laneInset = Math.min(18, Math.max(6, band.rect.width * 0.22));
  const minX = band.rect.x + laneInset;
  const maxX = band.rect.x + Math.max(laneInset, band.rect.width - laneInset);
  const startX = randomBetween(Math.min(minX, maxX), Math.max(minX, maxX));
  const endX = clamp(
    startX + randomBetween(-lateralDrift, lateralDrift),
    Math.min(minX, maxX),
    Math.max(minX, maxX),
  );
  const startY = fromTopEdge ? -overscan : viewport.height + overscan;
  const endY = fromTopEdge ? viewport.height + overscan : -overscan;
  const curveBias = band.key === 'left' ? 1 : -1;

  return {
    end: { x: endX, y: endY },
    start: { x: startX, y: startY },
    track: [
      {
        x: clamp(startX + curveBias * randomBetween(8, lateralDrift) + randomBetween(-5, 5), minX, maxX),
        y: lerp(startY, endY, 0.28) + randomBetween(-26, 26),
      },
      {
        x: clamp(endX + curveBias * randomBetween(8, lateralDrift) + randomBetween(-5, 5), minX, maxX),
        y: lerp(startY, endY, 0.72) + randomBetween(-26, 26),
      },
    ],
  };
};

const getDiagonalTrack = (
  viewport: Viewport,
  safeZone: Rect,
  overscan: number,
): MotionTrack | null => {
  const rightStart = safeZone.x + safeZone.width;
  const bottomStart = safeZone.y + safeZone.height;
  const inset = Math.max(EDGE_MARGIN, 16);
  const routes: MotionTrack[] = [];

  if (safeZone.x > inset * 2 && safeZone.y > inset * 2) {
    const start = {
      x: randomBetween(inset, safeZone.x - inset),
      y: -overscan,
    };
    const end = {
      x: -overscan,
      y: randomBetween(inset, safeZone.y - inset),
    };

    routes.push({
      end,
      start,
      track: [
        {
          x: start.x * 0.5,
          y: randomBetween(-overscan * 0.12, safeZone.y * 0.2),
        },
        {
          x: randomBetween(-overscan * 0.12, safeZone.x * 0.2),
          y: end.y * 0.5,
        },
      ],
    });
  }

  if (viewport.width - rightStart > inset * 2 && safeZone.y > inset * 2) {
    const start = {
      x: randomBetween(rightStart + inset, viewport.width - inset),
      y: -overscan,
    };
    const end = {
      x: viewport.width + overscan,
      y: randomBetween(inset, safeZone.y - inset),
    };

    routes.push({
      end,
      start,
      track: [
        {
          x: lerp(start.x, viewport.width, 0.52),
          y: randomBetween(-overscan * 0.12, safeZone.y * 0.2),
        },
        {
          x: viewport.width + randomBetween(-overscan * 0.08, overscan * 0.1),
          y: end.y * 0.5,
        },
      ],
    });
  }

  if (safeZone.x > inset * 2 && viewport.height - bottomStart > inset * 2) {
    const start = {
      x: -overscan,
      y: randomBetween(bottomStart + inset, viewport.height - inset),
    };
    const end = {
      x: randomBetween(inset, safeZone.x - inset),
      y: viewport.height + overscan,
    };

    routes.push({
      end,
      start,
      track: [
        {
          x: randomBetween(-overscan * 0.12, safeZone.x * 0.2),
          y: lerp(start.y, viewport.height, 0.52),
        },
        {
          x: end.x * 0.5,
          y: viewport.height + randomBetween(-overscan * 0.08, overscan * 0.1),
        },
      ],
    });
  }

  if (viewport.width - rightStart > inset * 2 && viewport.height - bottomStart > inset * 2) {
    const start = {
      x: viewport.width + overscan,
      y: randomBetween(bottomStart + inset, viewport.height - inset),
    };
    const end = {
      x: randomBetween(rightStart + inset, viewport.width - inset),
      y: viewport.height + overscan,
    };

    routes.push({
      end,
      start,
      track: [
        {
          x: viewport.width + randomBetween(-overscan * 0.08, overscan * 0.1),
          y: lerp(start.y, viewport.height, 0.52),
        },
        {
          x: lerp(end.x, viewport.width, 0.52),
          y: viewport.height + randomBetween(-overscan * 0.08, overscan * 0.1),
        },
      ],
    });
  }

  if (!routes.length) {
    return null;
  }

  const selected = pickRandom(routes);

  if (Math.random() < 0.5) {
    return selected;
  }

  return {
    end: selected.start,
    start: selected.end,
    track: [selected.track[1], selected.track[0]],
  };
};

const getBugRenderMetrics = (kind: BugKind, size: number) => {
  switch (kind) {
    case 'beetle':
      return {
        renderHeight: size * 0.86,
        renderWidth: size * 1.46,
      };
    case 'spider':
      return {
        renderHeight: size * 1.06,
        renderWidth: size * 1.72,
      };
    default:
      return {
        renderHeight: size * 0.74,
        renderWidth: size * 1.34,
      };
  }
};

const buildDustConfig = (viewport: Viewport, safeZone: Rect): DustParticleConfig => {
  const outerBands = getAmbientBands(viewport, safeZone);
  const fallbackBand: AmbientBand = {
    key: 'center',
    rect: {
      x: viewport.width * 0.15,
      y: viewport.height * 0.12,
      width: viewport.width * 0.7,
      height: viewport.height * 0.76,
    },
    weight: 1,
  };
  const allowCenterPass = Math.random() < 0.16;
  const band = allowCenterPass
    ? {
      key: 'center' as const,
      rect: safeZone,
      weight: 1,
    }
    : pickWeightedBand(outerBands, fallbackBand);
  const start = getPointInRect(band.rect, band.key === 'center' ? 22 : 12);
  const angle = randomBetween(-Math.PI * 0.42, Math.PI * 0.42);
  const distance = randomBetween(18, 52);
  const driftX = Math.cos(angle) * distance;
  const driftY = Math.sin(angle) * distance * 0.8;
  const size = randomBetween(DUST_SIZE_RANGE.min, DUST_SIZE_RANGE.max);
  const centerPass = band.key === 'center';
  const opacity = centerPass ? randomBetween(0.02, 0.05) : randomBetween(0.05, 0.12);

  return {
    color: centerPass ? 'rgba(196, 188, 173, 0.72)' : 'rgba(216, 206, 190, 0.88)',
    delayMs: randomBetween(DUST_RESPAWN_DELAY_RANGE_MS.min, DUST_RESPAWN_DELAY_RANGE_MS.max),
    durationMs: randomBetween(DUST_DURATION_RANGE_MS.min, DUST_DURATION_RANGE_MS.max),
    end: {
      x: clamp(start.x + driftX, -16, viewport.width + 16),
      y: clamp(start.y + driftY, -16, viewport.height + 16),
    },
    height: size,
    opacity,
    phase: randomBetween(0, Math.PI * 2),
    scaleEnd: randomBetween(0.98, 1.08),
    scaleStart: randomBetween(0.88, 1),
    start,
    width: size * randomBetween(1.1, 1.8),
    wobbleX: randomBetween(1, 6),
    wobbleY: randomBetween(1, 4),
  };
};

const buildBugConfig = (viewport: Viewport, safeZone: Rect): BugCrawlerConfig => {
  const bugBands = getAmbientBands(viewport, safeZone).filter((band) =>
    getAxisForBand(band.key) === 'horizontal' ? band.rect.height >= 42 : band.rect.width >= 42,
  );
  const fallbackBand: AmbientBand = {
    key: viewport.width >= viewport.height ? 'bottom' : 'right',
    rect:
      viewport.width >= viewport.height
        ? {
          x: 0,
          y: viewport.height * 0.75,
          width: viewport.width,
          height: viewport.height * 0.16,
        }
        : {
          x: viewport.width * 0.78,
          y: safeZone.y,
          width: viewport.width * 0.16,
          height: safeZone.height,
        },
    weight: 1,
  };
  const band = pickWeightedBand(bugBands, fallbackBand);
  const kindRoll = Math.random();
  const kind: BugKind = kindRoll < 0.36 ? 'crawler' : kindRoll < 0.71 ? 'beetle' : 'spider';
  const size = randomBetween(BUG_SIZE_RANGE.min, BUG_SIZE_RANGE.max);
  const metrics = getBugRenderMetrics(kind, size);
  const overscan = size * 4;
  const diagonalTrack = getDiagonalTrack(viewport, safeZone, overscan);
  const patternRoll = Math.random();
  const pattern: BugTravelPattern =
    diagonalTrack && patternRoll > 0.68
      ? 'diagonal'
      : patternRoll > 0.36
        ? 'vertical'
        : 'horizontal';
  const resolvedAxis: TravelAxis = pattern === 'vertical' ? 'vertical' : 'horizontal';
  const resolvedBand = (() => {
    if (pattern === 'diagonal') {
      return band;
    }

    const axisBands = bugBands.filter((candidate) => getAxisForBand(candidate.key) === resolvedAxis);
    if (axisBands.length > 0) {
      return pickWeightedBand(axisBands, fallbackBand);
    }

    return band;
  })();
  const track =
    pattern === 'diagonal' && diagonalTrack
      ? diagonalTrack
      : getCubicTrack(
        resolvedAxis,
        viewport,
        resolvedBand,
        overscan,
        resolvedAxis === 'horizontal' ? 38 : 30,
      );

  return {
    delayMs: randomBetween(BUG_RESPAWN_DELAY_RANGE_MS.min, BUG_RESPAWN_DELAY_RANGE_MS.max),
    durationMs: randomBetween(BUG_DURATION_RANGE_MS.min, BUG_DURATION_RANGE_MS.max),
    end: track.end,
    kind,
    opacity: randomBetween(0.24, 0.4),
    phase: randomBetween(0, Math.PI * 2),
    renderHeight: metrics.renderHeight,
    renderWidth: metrics.renderWidth,
    size,
    start: track.start,
    tint: pickRandom(BUG_TINTS),
    track: track.track,
    wobble: randomBetween(0.2, 0.95),
  };
};

const buildLeafConfig = (viewport: Viewport, safeZone: Rect): LeafConfig => {
  const leafBands = getAmbientBands(viewport, safeZone).filter((band) =>
    getAxisForBand(band.key) === 'horizontal' ? band.rect.height >= 44 : band.rect.width >= 44,
  );
  const fallbackBand: AmbientBand = {
    key: 'bottom',
    rect: {
      x: 0,
      y: viewport.height * 0.78,
      width: viewport.width,
      height: viewport.height * 0.15,
    },
    weight: 1,
  };
  const band = pickWeightedBand(leafBands, fallbackBand);
  const axis = getAxisForBand(band.key);
  const size = randomBetween(LEAF_SIZE_RANGE.min, LEAF_SIZE_RANGE.max);
  const overscan = size * 5;
  const track = getCubicTrack(axis, viewport, band, overscan, axis === 'horizontal' ? 54 : 42);
  const primaryDirection =
    axis === 'horizontal'
      ? track.end.x > track.start.x
        ? 1
        : -1
      : track.end.y > track.start.y
        ? 1
        : -1;

  return {
    delayMs: randomBetween(LEAF_RESPAWN_DELAY_RANGE_MS.min, LEAF_RESPAWN_DELAY_RANGE_MS.max),
    durationMs: randomBetween(LEAF_DURATION_RANGE_MS.min, LEAF_DURATION_RANGE_MS.max),
    end: track.end,
    opacity: randomBetween(0.13, 0.22),
    phase: randomBetween(0, Math.PI * 2),
    renderHeight: size * 0.78,
    renderWidth: size * 1.06,
    rotationTurns: randomBetween(1.8, 4.2) * primaryDirection,
    scaleEnd: randomBetween(0.96, 1.08),
    scaleStart: randomBetween(0.86, 0.96),
    size,
    start: track.start,
    stemHeight: size * 0.22,
    tint: pickRandom(LEAF_TINTS),
    track: track.track,
    wobble: randomBetween(1.8, 5.8),
  };
};

const getBezierPoint = (start: Point, controlA: Point, controlB: Point, end: Point, t: number): Point => {
  'worklet';

  const inverse = 1 - t;
  const inverseSquared = inverse * inverse;
  const tSquared = t * t;

  return {
    x:
      inverseSquared * inverse * start.x +
      3 * inverseSquared * t * controlA.x +
      3 * inverse * tSquared * controlB.x +
      tSquared * t * end.x,
    y:
      inverseSquared * inverse * start.y +
      3 * inverseSquared * t * controlA.y +
      3 * inverse * tSquared * controlB.y +
      tSquared * t * end.y,
  };
};

const getBezierAngle = (start: Point, controlA: Point, controlB: Point, end: Point, t: number) => {
  'worklet';

  const inverse = 1 - t;
  const dx =
    3 * inverse * inverse * (controlA.x - start.x) +
    6 * inverse * t * (controlB.x - controlA.x) +
    3 * t * t * (end.x - controlB.x);
  const dy =
    3 * inverse * inverse * (controlA.y - start.y) +
    6 * inverse * t * (controlB.y - controlA.y) +
    3 * t * t * (end.y - controlB.y);

  return Math.atan2(dy, dx);
};

const DustParticle = ({ safeZone, viewport }: { safeZone: Rect; viewport: Viewport }) => {
  const [config, setConfig] = React.useState(() => buildDustConfig(viewport, safeZone));
  const isMountedRef = React.useRef(true);
  const progress = useSharedValue(0);

  const cycle = React.useCallback(() => {
    if (!isMountedRef.current) {
      return;
    }
    setConfig(buildDustConfig(viewport, safeZone));
  }, [safeZone, viewport]);

  React.useEffect(() => {
    progress.value = 0;
    progress.value = withDelay(
      config.delayMs,
      withTiming(
        1,
        { duration: config.durationMs, easing: Easing.linear },
        (finished) => {
          if (finished) {
            runOnJS(cycle)();
          }
        },
      ),
    );

    return () => {
      cancelAnimation(progress);
    };
  }, [config, cycle, progress]);

  React.useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const t = progress.value;
    const driftX =
      lerp(config.start.x, config.end.x, t) + Math.sin(t * Math.PI * 2 + config.phase) * config.wobbleX;
    const driftY =
      lerp(config.start.y, config.end.y, t) + Math.cos(t * Math.PI * 2 + config.phase) * config.wobbleY;
    const opacity = interpolate(t, [0, 0.18, 0.84, 1], [0, config.opacity, config.opacity * 0.88, 0]);
    const scale = lerp(config.scaleStart, config.scaleEnd, t);

    return {
      opacity,
      transform: [{ translateX: driftX }, { translateY: driftY }, { scale }],
    };
  });

  return (
    <Animated.View
      style={[
        styles.dustParticle,
        {
          width: config.width,
          height: config.height,
          borderRadius: config.height / 2,
          backgroundColor: config.color,
        },
        animatedStyle,
      ]}
    />
  );
};

const DustParticles = ({
  count,
  safeZone,
  viewport,
}: {
  count: number;
  safeZone: Rect;
  viewport: Viewport;
}) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <DustParticle key={index} safeZone={safeZone} viewport={viewport} />
      ))}
    </>
  );
};

const CrawlerBugShape = ({ size, tint }: { size: number; tint: string }) => {
  const bodyWidth = size;
  const bodyHeight = size * 0.56;
  const headSize = size * 0.28;

  return (
    <>
      <View
        style={[
          styles.bugBody,
          {
            width: bodyWidth,
            height: bodyHeight,
            borderRadius: bodyHeight / 2,
            backgroundColor: tint,
          },
        ]}
      />
      <View
        style={[
          styles.bugHead,
          {
            width: headSize,
            height: headSize,
            borderRadius: headSize / 2,
            left: bodyWidth - headSize * 0.1,
            top: (bodyHeight - headSize) / 2,
            backgroundColor: 'rgba(27, 20, 15, 0.96)',
          },
        ]}
      />
    </>
  );
};

const BeetleBugShape = ({ size, tint }: { size: number; tint: string }) => {
  const shellWidth = size * 1.02;
  const shellHeight = size * 0.64;
  const headSize = size * 0.28;

  return (
    <>
      <View
        style={[
          styles.bugBody,
          {
            width: shellWidth,
            height: shellHeight,
            borderRadius: shellHeight * 0.5,
            backgroundColor: tint,
          },
        ]}
      />
      <View
        style={[
          styles.bugShellSeam,
          {
            height: shellHeight * 0.84,
            left: shellWidth * 0.47,
            top: shellHeight * 0.08,
          },
        ]}
      />
      <View
        style={[
          styles.bugHead,
          {
            width: headSize,
            height: headSize * 0.9,
            borderRadius: headSize / 2,
            left: shellWidth - headSize * 0.04,
            top: (shellHeight - headSize * 0.9) / 2,
            backgroundColor: 'rgba(31, 23, 17, 0.96)',
          },
        ]}
      />
    </>
  );
};

const SpiderBugShape = ({ size, tint }: { size: number; tint: string }) => {
  const abdomenSize = size * 0.56;
  const thoraxSize = size * 0.34;
  const headSize = size * 0.18;
  const legLength = size * 0.62;
  const centerTop = size * 0.18;

  return (
    <>
      {SPIDER_LEG_ANGLES_TOP.map((rotation, index) => (
        <View
          key={`top-${rotation}`}
          style={[
            styles.spiderLeg,
            {
              width: legLength,
              left: index < 2 ? 0 : size * 0.18,
              top: centerTop + index * 0.02,
              transform: [{ rotateZ: `${rotation}deg` }],
            },
          ]}
        />
      ))}
      {SPIDER_LEG_ANGLES_BOTTOM.map((rotation, index) => (
        <View
          key={`bottom-${rotation}`}
          style={[
            styles.spiderLeg,
            {
              width: legLength,
              left: index < 2 ? 0 : size * 0.18,
              top: centerTop + abdomenSize * 0.34,
              transform: [{ rotateZ: `${rotation}deg` }],
            },
          ]}
        />
      ))}

      <View
        style={[
          styles.bugBody,
          {
            width: abdomenSize,
            height: abdomenSize * 0.8,
            borderRadius: abdomenSize / 2,
            left: size * 0.32,
            top: size * 0.16,
            backgroundColor: tint,
          },
        ]}
      />
      <View
        style={[
          styles.bugHead,
          {
            width: thoraxSize,
            height: thoraxSize * 0.86,
            borderRadius: thoraxSize / 2,
            left: size * 0.12,
            top: size * 0.2,
            backgroundColor: 'rgba(37, 27, 20, 0.96)',
          },
        ]}
      />
      <View
        style={[
          styles.bugHead,
          {
            width: headSize,
            height: headSize,
            borderRadius: headSize / 2,
            left: size * 0.04,
            top: size * 0.29,
            backgroundColor: 'rgba(25, 18, 14, 0.94)',
          },
        ]}
      />
    </>
  );
};

const BugShape = ({ kind, size, tint }: { kind: BugKind; size: number; tint: string }) => {
  if (kind === 'spider') {
    return <SpiderBugShape size={size} tint={tint} />;
  }

  if (kind === 'beetle') {
    return <BeetleBugShape size={size} tint={tint} />;
  }

  return <CrawlerBugShape size={size} tint={tint} />;
};

const BugCrawler = ({ safeZone, viewport }: { safeZone: Rect; viewport: Viewport }) => {
  const [config, setConfig] = React.useState(() => buildBugConfig(viewport, safeZone));
  const isMountedRef = React.useRef(true);
  const progress = useSharedValue(0);

  const cycle = React.useCallback(() => {
    if (!isMountedRef.current) {
      return;
    }
    setConfig(buildBugConfig(viewport, safeZone));
  }, [safeZone, viewport]);

  React.useEffect(() => {
    progress.value = 0;
    progress.value = withDelay(
      config.delayMs,
      withTiming(
        1,
        { duration: config.durationMs, easing: Easing.linear },
        (finished) => {
          if (finished) {
            runOnJS(cycle)();
          }
        },
      ),
    );

    return () => {
      cancelAnimation(progress);
    };
  }, [config, cycle, progress]);

  React.useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const t = progress.value;
    const point = getBezierPoint(config.start, config.track[0], config.track[1], config.end, t);
    const angle = getBezierAngle(config.start, config.track[0], config.track[1], config.end, t);
    const bodyWiggle = Math.sin(t * Math.PI * 12 + config.phase) * config.wobble;
    const opacity = interpolate(t, [0, 0.08, 0.92, 1], [0, config.opacity, config.opacity, 0]);

    return {
      opacity,
      transform: [
        { translateX: point.x - config.renderWidth / 2 },
        { translateY: point.y - config.renderHeight / 2 + bodyWiggle },
        { rotateZ: `${angle + Math.sin(t * Math.PI * 10 + config.phase) * 0.07}rad` },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        styles.bugWrap,
        {
          width: config.renderWidth,
          height: config.renderHeight,
        },
        animatedStyle,
      ]}
    >
      <BugShape kind={config.kind} size={config.size} tint={config.tint} />
    </Animated.View>
  );
};

const LeafShape = ({ config }: { config: LeafConfig }) => {
  return (
    <>
      <View
        style={[
          styles.leafBody,
          {
            width: config.size,
            height: config.size * 0.62,
            borderRadius: config.size * 0.36,
            backgroundColor: config.tint,
          },
        ]}
      />
      <View
        style={[
          styles.leafVein,
          {
            height: config.size * 0.5,
            top: config.size * 0.06,
          },
        ]}
      />
      <View
        style={[
          styles.leafStem,
          {
            height: config.stemHeight,
            left: config.size * 0.06,
            top: config.size * 0.22,
          },
        ]}
      />
    </>
  );
};

const RollingLeaf = ({ safeZone, viewport }: { safeZone: Rect; viewport: Viewport }) => {
  const [config, setConfig] = React.useState(() => buildLeafConfig(viewport, safeZone));
  const isMountedRef = React.useRef(true);
  const progress = useSharedValue(0);

  const cycle = React.useCallback(() => {
    if (!isMountedRef.current) {
      return;
    }
    setConfig(buildLeafConfig(viewport, safeZone));
  }, [safeZone, viewport]);

  React.useEffect(() => {
    progress.value = 0;
    progress.value = withDelay(
      config.delayMs,
      withTiming(
        1,
        { duration: config.durationMs, easing: Easing.linear },
        (finished) => {
          if (finished) {
            runOnJS(cycle)();
          }
        },
      ),
    );

    return () => {
      cancelAnimation(progress);
    };
  }, [config, cycle, progress]);

  React.useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const t = progress.value;
    const point = getBezierPoint(config.start, config.track[0], config.track[1], config.end, t);
    const angle = getBezierAngle(config.start, config.track[0], config.track[1], config.end, t);
    const wobbleX = Math.sin(t * Math.PI * 4 + config.phase) * config.wobble;
    const wobbleY = Math.cos(t * Math.PI * 3.5 + config.phase) * (config.wobble * 0.55);
    const opacity = interpolate(t, [0, 0.12, 0.86, 1], [0, config.opacity, config.opacity * 0.92, 0]);
    const scale = lerp(config.scaleStart, config.scaleEnd, t);

    return {
      opacity,
      transform: [
        { translateX: point.x - config.renderWidth / 2 + wobbleX },
        { translateY: point.y - config.renderHeight / 2 + wobbleY },
        { rotateZ: `${angle + t * config.rotationTurns * Math.PI * 2}rad` },
        { scale },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        styles.leafWrap,
        {
          width: config.renderWidth,
          height: config.renderHeight,
        },
        animatedStyle,
      ]}
    >
      <LeafShape config={config} />
    </Animated.View>
  );
};

export const AmbientBackgroundEffects = ({
  bugEnabled = AMBIENT_BACKGROUND_DEFAULTS.bugEnabled,
  centerSafeZone,
  dustCount,
  dustEnabled = AMBIENT_BACKGROUND_DEFAULTS.dustEnabled,
  height,
  leafEnabled = AMBIENT_BACKGROUND_DEFAULTS.leafEnabled,
  maxVisibleBugs = AMBIENT_BACKGROUND_DEFAULTS.maxVisibleBugs,
  maxVisibleLeaves = AMBIENT_BACKGROUND_DEFAULTS.maxVisibleLeaves,
  style,
  width,
}: AmbientBackgroundEffectsProps) => {
  const viewport = React.useMemo(() => ({ width, height }), [height, width]);
  const safeZone = React.useMemo(() => getCenterSafeZone(viewport, centerSafeZone), [centerSafeZone, viewport]);
  const resolvedDustCount = React.useMemo(
    () => clamp(dustCount ?? getAutoDustCount(viewport), DUST_COUNT_RANGE.min, DUST_COUNT_RANGE.max),
    [dustCount, viewport],
  );
  const visibleBugCount = bugEnabled ? clamp(maxVisibleBugs, 0, 1) : 0;
  const visibleLeafCount = leafEnabled ? clamp(maxVisibleLeaves, 0, 1) : 0;
  const layoutKey = React.useMemo(
    () =>
      [
        Math.round(width),
        Math.round(height),
        Math.round(safeZone.x),
        Math.round(safeZone.y),
        Math.round(safeZone.width),
        Math.round(safeZone.height),
        resolvedDustCount,
        visibleBugCount,
        visibleLeafCount,
      ].join('-'),
    [
      height,
      resolvedDustCount,
      safeZone.height,
      safeZone.width,
      safeZone.x,
      safeZone.y,
      visibleBugCount,
      visibleLeafCount,
      width,
    ],
  );

  if (width <= 0 || height <= 0 || (!dustEnabled && visibleBugCount === 0 && visibleLeafCount === 0)) {
    return null;
  }

  return (
    <View pointerEvents="none" style={[styles.container, style]}>
      {/* Keep motion in the slab margins so the board remains the visual anchor. */}
      {dustEnabled ? (
        <DustParticles
          key={`dust-${layoutKey}`}
          count={resolvedDustCount}
          safeZone={safeZone}
          viewport={viewport}
        />
      ) : null}

      {/* Bugs stay sparse and low-contrast, but now choose both horizontal and vertical edge paths. */}
      {Array.from({ length: visibleBugCount }).map((_, index) => (
        <BugCrawler key={`bug-${layoutKey}-${index}`} safeZone={safeZone} viewport={viewport} />
      ))}

      {/* Leaves roll through less often than insects so they read like rare environmental accents. */}
      {Array.from({ length: visibleLeafCount }).map((_, index) => (
        <RollingLeaf key={`leaf-${layoutKey}-${index}`} safeZone={safeZone} viewport={viewport} />
      ))}
    </View>
  );
};

export default AmbientBackgroundEffects;

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  dustParticle: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  bugWrap: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  bugBody: {
    position: 'absolute',
  },
  bugHead: {
    position: 'absolute',
  },
  bugShellSeam: {
    position: 'absolute',
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  spiderLeg: {
    position: 'absolute',
    height: 1,
    borderRadius: 999,
    backgroundColor: 'rgba(46, 34, 24, 0.6)',
  },
  leafWrap: {
    position: 'absolute',
    left: 0,
    top: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leafBody: {
    position: 'absolute',
  },
  leafVein: {
    position: 'absolute',
    width: 1,
    left: '50%',
    marginLeft: -0.5,
    backgroundColor: 'rgba(252, 243, 225, 0.18)',
  },
  leafStem: {
    position: 'absolute',
    width: 1,
    backgroundColor: 'rgba(76, 56, 39, 0.55)',
    transform: [{ rotateZ: '-28deg' }],
  },
});
