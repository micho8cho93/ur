import { urTheme } from '@/constants/urTheme';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Image, Platform, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Piece } from './Piece';

const TRAY_ASSETS = {
  light: require('../../assets/trays/tray_light.png'),
  dark: require('../../assets/trays/tray_dark.png'),
};
const TRAY_ART_SOURCE_SIZE = {
  width: 640,
  height: 427,
} as const;
const HORIZONTAL_TRAY_INTERIOR_BOUNDS = {
  startX: 0.13,
  endX: 0.87,
  startY: 0.28,
  endY: 0.67,
} as const;

// Second +30% size pass requested by design review.
const RAIL_SIZE_SCALE = 1.69;
const TRAY_SIZE_BOOST = 1.3;
const TRAY_SIZE_REDUCTION = 0.85;
const TRAY_SIZE_REGAIN = 1.15;
const DEFAULT_RESERVE_PIECE_SIZE = 34;
const RESERVE_PIECE_SIZE_BOOST = 1;
const MOBILE_VERTICAL_TRAY_ART_SCALE = 2;
const MOBILE_VERTICAL_RESERVE_PIECE_FIT = 0.74;

const measureViewInWindow = (
  view: View | null,
  onMeasured: (x: number, y: number, width: number, height: number) => void,
): void => {
  if (!view) {
    return;
  }

  try {
    view.measureInWindow(onMeasured);
  } catch {
    // Ignore stale-node layout probes during fast remounts.
  }
};

const TRAY_ART_FIT = {
  // Artwork-only fit tuning; does not affect piece coordinates or hitboxes.
  // Increase current tray display size by 15%.
  scale: 1.12 * 1.3 * TRAY_SIZE_BOOST * TRAY_SIZE_REDUCTION * TRAY_SIZE_REGAIN,
  offsetX: 0,
  offsetY: 0,
};

const RAIL_MIN_HEIGHT = Math.round(
  76 * RAIL_SIZE_SCALE * TRAY_SIZE_BOOST * TRAY_SIZE_REDUCTION * TRAY_SIZE_REGAIN,
);
const RAIL_HORIZONTAL_PADDING = Math.round(12 * RAIL_SIZE_SCALE);
const MOBILE_RAIL_SCALE = 0.62;

interface PieceRailProps {
  label?: string;
  color: 'light' | 'dark';
  tokenVariant?: 'light' | 'dark' | 'reserve';
  orientation?: 'horizontal' | 'vertical';
  piecePixelSize?: number;
  reserveCount: number;
  totalCount?: number;
  active?: boolean;
  hideReservePieces?: boolean;
  onReserveSlotsLayout?: (slots: ReserveSlotMeasurement[]) => void;
  onRailFrameLayout?: (frame: PieceRailFrameMeasurement) => void;
}

export interface ReserveSlotMeasurement {
  color: 'light' | 'dark';
  index: number;
  x: number;
  y: number;
  size: number;
}

export interface PieceRailFrameMeasurement {
  color: 'light' | 'dark';
  x: number;
  y: number;
  width: number;
  height: number;
}

interface RailSize {
  width: number;
  height: number;
}

interface ReserveRailPieceProps {
  animateOnMount?: boolean;
  color: 'light' | 'dark';
  pixelSize: number;
  slotIndex: number;
  variant: 'light' | 'dark' | 'reserve';
}

export const getNewlyVisibleReserveSlotIndices = (
  previousVisibleSlotIndices: readonly number[],
  nextVisibleSlotIndices: readonly number[],
): number[] => {
  const previousIndices = new Set(previousVisibleSlotIndices);
  return nextVisibleSlotIndices.filter((slotIndex) => !previousIndices.has(slotIndex));
};

const ReserveRailPiece: React.FC<ReserveRailPieceProps> = ({
  animateOnMount = false,
  color,
  pixelSize,
  slotIndex,
  variant,
}) => {
  const entryScale = useSharedValue(1);
  const entryTranslateY = useSharedValue(0);
  const entryOpacity = useSharedValue(1);

  useEffect(() => {
    if (!animateOnMount) {
      entryScale.value = 1;
      entryTranslateY.value = 0;
      entryOpacity.value = 1;
      return;
    }

    cancelAnimation(entryScale);
    cancelAnimation(entryTranslateY);
    cancelAnimation(entryOpacity);

    entryScale.value = 0.72;
    entryTranslateY.value = 10;
    entryOpacity.value = 0.24;
    entryOpacity.value = withTiming(1, {
      duration: 110,
      easing: Easing.out(Easing.quad),
    });
    entryScale.value = withSequence(
      withTiming(1.2, {
        duration: 150,
        easing: Easing.out(Easing.cubic),
      }),
      withTiming(1, {
        duration: 190,
        easing: Easing.out(Easing.back(1.35)),
      }),
    );
    entryTranslateY.value = withSequence(
      withTiming(-5, {
        duration: 150,
        easing: Easing.out(Easing.cubic),
      }),
      withTiming(0, {
        duration: 190,
        easing: Easing.out(Easing.back(1.2)),
      }),
    );
  }, [animateOnMount, entryOpacity, entryScale, entryTranslateY]);

  const arrivalStyle = useAnimatedStyle(() => ({
    opacity: entryOpacity.value,
    transform: [
      { translateY: entryTranslateY.value },
      { scale: entryScale.value },
    ],
  }));

  return (
    <Animated.View testID={`piece-rail-piece-shell-${slotIndex}`} style={[styles.reservePieceArrival, arrivalStyle]}>
      <Piece
        color={color}
        pixelSize={pixelSize}
        variant={variant}
      />
    </Animated.View>
  );
};

export const PieceRail: React.FC<PieceRailProps> = ({
  color,
  tokenVariant,
  orientation = 'horizontal',
  piecePixelSize,
  reserveCount,
  totalCount = 7,
  active = false,
  hideReservePieces = false,
  onReserveSlotsLayout,
  onRailFrameLayout,
}) => {
  const { width, height } = useWindowDimensions();
  const glow = useSharedValue(active ? 0.5 : 0);
  const [railMainAxisSize, setRailMainAxisSize] = useState(0);
  const [railSize, setRailSize] = useState<RailSize>({ width: 0, height: 0 });
  const isMobile = width < 760;
  const isMobileWeb = Platform.OS === 'web' && isMobile;
  const isVertical = orientation === 'vertical';
  const isCompactVerticalRail = isVertical && isMobile;
  const isLargeWebHorizontalRail = Platform.OS === 'web' && width >= 1200 && !isVertical;
  const isTabletPortrait = width >= 760 && width <= 1024 && height > width;
  const railScale = isMobile ? MOBILE_RAIL_SCALE : isTabletPortrait ? 0.9 : 1;
  const railMinHeight = Math.round(RAIL_MIN_HEIGHT * railScale);
  const railHorizontalPadding = Math.round(RAIL_HORIZONTAL_PADDING * railScale);
  const trayArtScale =
    TRAY_ART_FIT.scale *
    (isVertical ? (isMobile ? 0.92 : 1) : isMobile ? 0.78 : isTabletPortrait ? 0.92 : 1) *
    (isCompactVerticalRail ? MOBILE_VERTICAL_TRAY_ART_SCALE : 1);

  useEffect(() => {
    if (active) {
      glow.value = withRepeat(
        withSequence(
          withTiming(0.82, { duration: 700, easing: Easing.inOut(Easing.quad) }),
          withTiming(0.25, { duration: 700, easing: Easing.inOut(Easing.quad) }),
        ),
        -1,
        true,
      );
      return;
    }

    cancelAnimation(glow);
    glow.value = withTiming(0, { duration: 180 });
  }, [active, glow]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value,
    transform: [{ scale: 0.96 + glow.value * 0.06 }],
  }));

  const shownCount = Math.min(totalCount, reserveCount);
  const resolvedVariant = tokenVariant ?? color;
  const reservePieceSize = Math.max(
    1,
    Math.round(
      (piecePixelSize ?? DEFAULT_RESERVE_PIECE_SIZE) *
      RESERVE_PIECE_SIZE_BOOST *
      (isCompactVerticalRail ? MOBILE_VERTICAL_RESERVE_PIECE_FIT : isMobileWeb ? 0.85 : 1),
    ),
  );
  const reserveStackOffsetY = isVertical ? 0 : -Math.max(1, Math.round(reservePieceSize * 0.035));
  const horizontalEdgeInset = Math.max(6, Math.round(reservePieceSize * 0.08));
  const horizontalBottomInset = Math.max(2, Math.round(reservePieceSize * 0.06));
  const slotRefs = useRef<(View | null)[]>([]);
  const railRef = useRef<View | null>(null);
  const reportedSlotsKeyRef = useRef<string>('');
  const reportedRailFrameKeyRef = useRef<string>('');
  const hasCommittedVisibleSlotsRef = useRef(false);
  const previousVisibleSlotIndicesRef = useRef<readonly number[]>([]);
  const traySlotCount = Math.max(1, totalCount);
  const visibleSlotIndices = useMemo(
    () =>
      color === 'dark' && !isVertical
        ? Array.from({ length: shownCount }, (_, index) => traySlotCount - shownCount + index)
        : Array.from({ length: shownCount }, (_, index) => index),
    [color, isVertical, shownCount, traySlotCount],
  );
  const arrivingSlotIndices = useMemo(
    () =>
      hideReservePieces || !hasCommittedVisibleSlotsRef.current
        ? []
        : getNewlyVisibleReserveSlotIndices(previousVisibleSlotIndicesRef.current, visibleSlotIndices),
    [hideReservePieces, visibleSlotIndices],
  );

  const horizontalTrayInteriorBounds = useMemo(() => {
    if (isVertical || railSize.width <= 0 || railSize.height <= 0) {
      return null;
    }

    const artAspectRatio = TRAY_ART_SOURCE_SIZE.width / TRAY_ART_SOURCE_SIZE.height;
    const containerAspectRatio = railSize.width / railSize.height;
    const containWidth =
      containerAspectRatio > artAspectRatio ? railSize.height * artAspectRatio : railSize.width;
    const containHeight =
      containerAspectRatio > artAspectRatio ? railSize.height : railSize.width / artAspectRatio;
    const artWidth = containWidth * trayArtScale;
    const artHeight = containHeight * trayArtScale;
    const artLeft = (railSize.width - artWidth) / 2 + TRAY_ART_FIT.offsetX;
    const artTop = (railSize.height - artHeight) / 2 + TRAY_ART_FIT.offsetY;
    const left = Math.round(artLeft + artWidth * HORIZONTAL_TRAY_INTERIOR_BOUNDS.startX);
    const right = Math.round(artLeft + artWidth * HORIZONTAL_TRAY_INTERIOR_BOUNDS.endX);
    const top = Math.round(artTop + artHeight * HORIZONTAL_TRAY_INTERIOR_BOUNDS.startY);
    const bottom = Math.round(artTop + artHeight * HORIZONTAL_TRAY_INTERIOR_BOUNDS.endY);

    return {
      left,
      top,
      width: Math.max(reservePieceSize, right - left),
      height: Math.max(reservePieceSize, bottom - top),
    };
  }, [isVertical, railSize.height, railSize.width, reservePieceSize, trayArtScale]);
  const stackMainAxisSize = isVertical
    ? railMainAxisSize
    : horizontalTrayInteriorBounds?.width ?? railMainAxisSize;

  const resolveStackLayout = useCallback((slotCount: number) => {
    const minOverlapRatio = isVertical
      ? isMobile
        ? 0.5
        : isLargeWebHorizontalRail
          ? 0.25
          : 0.22
      : isMobile
        ? 0.04
        : isLargeWebHorizontalRail
          ? 0.02
          : 0.03;
    const preferredOverlapRatio = isVertical
      ? isMobile
        ? 0.58
        : isLargeWebHorizontalRail
          ? 0.25
          : 0.3
      : isMobile
        ? 0.08
        : isLargeWebHorizontalRail
          ? 0.03
          : 0.05;
    const minOverlap = Math.max(1, Math.round(reservePieceSize * minOverlapRatio));
    const preferredOverlap = Math.max(minOverlap, Math.round(reservePieceSize * preferredOverlapRatio));
    const preferredInset = isCompactVerticalRail
      ? Math.max(14, Math.round(reservePieceSize * 0.42))
      : isVertical
        ? Math.max(10, Math.round(reservePieceSize * 0.28))
        : horizontalEdgeInset;

    if (slotCount <= 0) {
      return {
        overlap: preferredOverlap,
        inset: preferredInset,
      };
    }

    if (stackMainAxisSize <= 0) {
      return {
        overlap: preferredOverlap,
        inset: preferredInset,
      };
    }

    const preferredStep = reservePieceSize - preferredOverlap;
    const preferredSpan = reservePieceSize + preferredStep * Math.max(0, slotCount - 1);
    const maxInset = Math.max(0, Math.floor((stackMainAxisSize - preferredSpan) / 2));
    const inset = Math.min(preferredInset, maxInset);
    const usableSize = Math.max(0, stackMainAxisSize - inset * 2);

    let overlap = preferredOverlap;
    if (slotCount > 1) {
      const maxStepForFit = Math.floor((usableSize - reservePieceSize) / (slotCount - 1));
      const maxStepWithMinOverlap = reservePieceSize - minOverlap;
      const resolvedStep = Math.max(1, Math.min(preferredStep, maxStepForFit, maxStepWithMinOverlap));
      overlap = Math.max(minOverlap, reservePieceSize - resolvedStep);
    }

    return {
      overlap,
      inset,
    };
  }, [
    horizontalEdgeInset,
    isCompactVerticalRail,
    isLargeWebHorizontalRail,
    isMobile,
    isVertical,
    reservePieceSize,
    stackMainAxisSize,
  ]);
  const pieceLayout = useMemo(() => resolveStackLayout(traySlotCount), [resolveStackLayout, traySlotCount]);
  const trayArtLayout = useMemo(() => resolveStackLayout(traySlotCount), [resolveStackLayout, traySlotCount]);
  const trayArtSpan = useMemo(() => {
    if (traySlotCount <= 0) {
      return 0;
    }

    const step = reservePieceSize - trayArtLayout.overlap;
    return reservePieceSize + step * Math.max(0, traySlotCount - 1);
  }, [reservePieceSize, trayArtLayout.overlap, traySlotCount]);
  const verticalTrayOffsetY = useMemo(() => {
    if (!isVertical || railMainAxisSize <= 0 || trayArtSpan <= 0) {
      return 0;
    }

    const stackCenterY = trayArtLayout.inset + trayArtSpan / 2;
    const columnCenterY = railMainAxisSize / 2;

    return Math.round(stackCenterY - columnCenterY);
  }, [isVertical, railMainAxisSize, trayArtLayout.inset, trayArtSpan]);

  const reportReserveSlots = useCallback(() => {
    if (!onReserveSlotsLayout) return;

    if (shownCount <= 0) {
      reportedSlotsKeyRef.current = 'empty';
      onReserveSlotsLayout([]);
      return;
    }

    // Horizontal trays begin with a provisional fallback stack position before the tray art
    // bounds are resolved. Only report coordinates once the final tray-well geometry exists so
    // intro animations land on the same coordinates the reserve pieces will actually occupy.
    if (!isVertical && !horizontalTrayInteriorBounds) {
      return;
    }

    requestAnimationFrame(() => {
      const measuredSlots: (ReserveSlotMeasurement | null)[] = Array.from(
        { length: visibleSlotIndices.length },
        () => null,
      );
      let pendingMeasurements = visibleSlotIndices.length;

      visibleSlotIndices.forEach((slotIndex, renderIndex) => {
        const slotRef = slotRefs.current[renderIndex];
        if (!slotRef) {
          pendingMeasurements -= 1;
          return;
        }

        measureViewInWindow(slotRef, (x, y, width, height) => {
          measuredSlots[renderIndex] = {
            color,
            index: slotIndex,
            x,
            y,
            size: Math.min(width, height),
          };

          pendingMeasurements -= 1;
          if (pendingMeasurements === 0) {
            const completeSlots = measuredSlots.filter(
              (slot): slot is ReserveSlotMeasurement => slot !== null,
            );
            const nextKey = JSON.stringify(completeSlots);
            if (nextKey !== reportedSlotsKeyRef.current) {
              reportedSlotsKeyRef.current = nextKey;
              onReserveSlotsLayout(completeSlots);
            }
          }
        });
      });
    });
  }, [color, horizontalTrayInteriorBounds, isVertical, onReserveSlotsLayout, shownCount, visibleSlotIndices]);

  const reportRailFrame = useCallback(() => {
    if (!onRailFrameLayout || !railRef.current) {
      return;
    }

    requestAnimationFrame(() => {
      measureViewInWindow(railRef.current, (x, y, width, height) => {
        const nextFrame = {
          color,
          x,
          y,
          width,
          height,
        };
        const nextKey = JSON.stringify(nextFrame);
        if (nextKey !== reportedRailFrameKeyRef.current) {
          reportedRailFrameKeyRef.current = nextKey;
          onRailFrameLayout(nextFrame);
        }
      });
    });
  }, [color, onRailFrameLayout]);

  useEffect(() => {
    reportReserveSlots();
  }, [
    horizontalTrayInteriorBounds?.height,
    horizontalTrayInteriorBounds?.left,
    horizontalTrayInteriorBounds?.top,
    horizontalTrayInteriorBounds?.width,
    pieceLayout.inset,
    pieceLayout.overlap,
    railMainAxisSize,
    reportReserveSlots,
    reservePieceSize,
    reserveStackOffsetY,
  ]);

  useEffect(() => {
    reportRailFrame();
  }, [reportRailFrame, railMainAxisSize, verticalTrayOffsetY]);

  useEffect(() => {
    previousVisibleSlotIndicesRef.current = visibleSlotIndices;
    hasCommittedVisibleSlotsRef.current = true;
  }, [visibleSlotIndices]);

  return (
    <View style={[styles.wrap, isVertical && styles.wrapVertical]}>
      <View
        ref={railRef}
        collapsable={false}
        testID="piece-rail-root"
        style={[
          styles.rail,
          isVertical && styles.railVertical,
          {
            minHeight: railMinHeight,
            paddingHorizontal: isVertical ? 0 : railHorizontalPadding,
            paddingTop: isVertical ? railHorizontalPadding : 0,
            paddingBottom: isVertical ? railHorizontalPadding : horizontalBottomInset,
            justifyContent: isVertical ? 'center' : 'flex-end',
          },
        ]}
        onLayout={(event) => {
          const {
            height: layoutHeight,
            width: layoutWidth,
          } = event.nativeEvent.layout;
          const nextMainAxisSize = Math.round(isVertical ? layoutHeight : layoutWidth);
          setRailMainAxisSize((prev) => (prev === nextMainAxisSize ? prev : nextMainAxisSize));
          setRailSize((prev) =>
            prev.width === layoutWidth && prev.height === layoutHeight
              ? prev
              : {
                width: layoutWidth,
                height: layoutHeight,
              },
          );
          reportReserveSlots();
          reportRailFrame();
        }}
      >
        {/*
          Reserve tray artwork is rendered as a background PNG.
          Horizontal reserve stacks align to a safe lane derived from the tray art
          so pieces stay inside the recessed tray well instead of drifting onto the rim.
        */}
        <View
          pointerEvents="none"
          style={[
            styles.trayArtLayer,
            isVertical && {
              transform: [{ translateY: verticalTrayOffsetY }],
            },
          ]}
        >
          <Image
            source={TRAY_ASSETS[color]}
            resizeMode="contain"
            style={[
              styles.trayArt,
              {
                transform: [
                  ...(isVertical ? [{ rotate: '90deg' as const }] : []),
                  { translateX: TRAY_ART_FIT.offsetX },
                  { translateY: TRAY_ART_FIT.offsetY },
                  { scale: trayArtScale },
                ],
              },
            ]}
          />
        </View>
        <Animated.View style={[styles.activeGlow, glowStyle]} />

        <View
          testID="piece-rail-stack"
          style={[
            styles.pieceStack,
            isVertical && styles.pieceStackVertical,
            isVertical
              ? {
                paddingVertical: pieceLayout.inset,
                justifyContent: 'flex-start',
              }
              : horizontalTrayInteriorBounds
                ? {
                  position: 'absolute',
                  left: horizontalTrayInteriorBounds.left,
                  top: horizontalTrayInteriorBounds.top,
                  width: horizontalTrayInteriorBounds.width,
                  height: horizontalTrayInteriorBounds.height,
                  paddingLeft: color === 'light' ? pieceLayout.inset : 0,
                  paddingRight: color === 'dark' ? pieceLayout.inset : 0,
                  justifyContent: color === 'dark' ? 'flex-end' : 'flex-start',
                }
                : {
                  paddingLeft: color === 'light' ? pieceLayout.inset : 0,
                  paddingRight: color === 'dark' ? pieceLayout.inset : 0,
                  justifyContent: color === 'dark' ? 'flex-end' : 'flex-start',
                  transform: [{ translateY: reserveStackOffsetY }],
                },
          ]}
        >
          {visibleSlotIndices.map((slotIndex, renderIndex) => (
            <View
              key={`piece-${slotIndex}`}
              ref={(node) => {
                slotRefs.current[renderIndex] = node;
              }}
              testID={`piece-rail-slot-${slotIndex}`}
              style={[
                styles.stackPiece,
                isVertical && styles.stackPieceVertical,
                {
                  marginLeft: isVertical || renderIndex === 0 ? 0 : -pieceLayout.overlap,
                  marginTop: isVertical && renderIndex > 0 ? -pieceLayout.overlap : 0,
                  width: reservePieceSize,
                  height: reservePieceSize,
                  zIndex: renderIndex + 1,
                },
              ]}
            >
              {!hideReservePieces && (
                <ReserveRailPiece
                  animateOnMount={arrivingSlotIndices.includes(slotIndex)}
                  color={color}
                  pixelSize={reservePieceSize}
                  slotIndex={slotIndex}
                  variant={resolvedVariant}
                />
              )}
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
  },
  wrapVertical: {
    flex: 1,
  },
  rail: {
    borderRadius: urTheme.radii.pill,
    borderWidth: 1.2,
    borderColor: 'transparent',
    backgroundColor: 'transparent',
    overflow: 'visible',
    justifyContent: 'center',
  },
  railVertical: {
    flex: 1,
  },
  trayArtLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  trayArt: {
    width: '100%',
    height: '100%',
  },
  activeGlow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    zIndex: 1,
  },
  pieceStack: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    justifyContent: 'flex-start',
    alignItems: 'center',
    zIndex: 2,
  },
  pieceStackVertical: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'flex-start',
  },
  stackPiece: {
    zIndex: 5,
  },
  stackPieceVertical: {
    alignSelf: 'center',
  },
  reservePieceArrival: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
