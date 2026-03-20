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

// Second +30% size pass requested by design review.
const RAIL_SIZE_SCALE = 1.69;
const TRAY_SIZE_BOOST = 1.3;
const TRAY_SIZE_REDUCTION = 0.85;
const TRAY_SIZE_REGAIN = 1.15;
const DEFAULT_RESERVE_PIECE_SIZE = 34;
const RESERVE_PIECE_SIZE_BOOST = 1.15;

const TRAY_ART_FIT = {
  // Artwork-only fit tuning; does not affect piece coordinates or hitboxes.
  // Increase current tray display size by 15%.
  scale: 1.12 * 1.3 * TRAY_SIZE_BOOST * TRAY_SIZE_REDUCTION * TRAY_SIZE_REGAIN,
  offsetX: 0,
  offsetY: 0,
};

const RESERVE_STACK_OFFSET_Y = Math.round(2 * RAIL_SIZE_SCALE);
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
  const isMobile = width < 760;
  const isMobileWeb = Platform.OS === 'web' && isMobile;
  const isVertical = orientation === 'vertical';
  const isTabletPortrait = width >= 760 && width <= 1024 && height > width;
  const railScale = isMobile ? MOBILE_RAIL_SCALE : isTabletPortrait ? 0.9 : 1;
  const railMinHeight = Math.round(RAIL_MIN_HEIGHT * railScale);
  const railHorizontalPadding = Math.round(RAIL_HORIZONTAL_PADDING * railScale);
  const reserveStackOffsetY = Math.round(RESERVE_STACK_OFFSET_Y * railScale);
  const trayArtScale =
    TRAY_ART_FIT.scale *
    (isVertical ? (isMobile ? 0.92 : 1) : isMobile ? 0.78 : isTabletPortrait ? 0.92 : 1) *
    (isVertical && isMobileWeb ? 2 : 1);

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
      (isMobileWeb ? 0.85 : 1),
    ),
  );
  const slotRefs = useRef<(View | null)[]>([]);
  const railRef = useRef<View | null>(null);
  const reportedSlotsKeyRef = useRef<string>('');
  const reportedRailFrameKeyRef = useRef<string>('');

  const resolveStackLayout = useCallback((slotCount: number) => {
    const minOverlapRatio = isMobile ? 0.5 : 0.22;
    const preferredOverlapRatio = isMobile ? 0.58 : 0.3;
    const minOverlap = Math.max(1, Math.round(reservePieceSize * minOverlapRatio));
    const preferredOverlap = Math.max(minOverlap, Math.round(reservePieceSize * preferredOverlapRatio));
    const preferredInset = Math.max(10, Math.round(reservePieceSize * 0.28));

    if (slotCount <= 0) {
      return {
        overlap: preferredOverlap,
        inset: preferredInset,
      };
    }

    if (railMainAxisSize <= 0) {
      return {
        overlap: preferredOverlap,
        inset: preferredInset,
      };
    }

    const preferredStep = reservePieceSize - preferredOverlap;
    const preferredSpan = reservePieceSize + preferredStep * Math.max(0, slotCount - 1);
    const maxInset = Math.max(0, Math.floor((railMainAxisSize - preferredSpan) / 2));
    const inset = Math.min(preferredInset, maxInset);
    const usableSize = Math.max(0, railMainAxisSize - inset * 2);

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
  }, [isMobile, railMainAxisSize, reservePieceSize]);
  const pieceLayout = useMemo(() => resolveStackLayout(shownCount), [resolveStackLayout, shownCount]);
  const traySlotCount = Math.max(1, totalCount);
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

    requestAnimationFrame(() => {
      const measuredSlots: (ReserveSlotMeasurement | null)[] = Array.from({ length: shownCount }, () => null);
      let pendingMeasurements = shownCount;

      slotRefs.current.slice(0, shownCount).forEach((slotRef, index) => {
        if (!slotRef) {
          pendingMeasurements -= 1;
          return;
        }

        slotRef.measureInWindow((x, y, width, height) => {
          measuredSlots[index] = {
            color,
            index,
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
  }, [color, onReserveSlotsLayout, shownCount]);

  const reportRailFrame = useCallback(() => {
    if (!onRailFrameLayout || !railRef.current) {
      return;
    }

    requestAnimationFrame(() => {
      railRef.current?.measureInWindow((x, y, width, height) => {
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
  }, [reportReserveSlots, reservePieceSize, pieceLayout.inset, pieceLayout.overlap, reserveStackOffsetY, railMainAxisSize]);

  useEffect(() => {
    reportRailFrame();
  }, [reportRailFrame, railMainAxisSize, verticalTrayOffsetY]);

  return (
    <View style={[styles.wrap, isVertical && styles.wrapVertical]}>
      <View
        ref={railRef}
        collapsable={false}
        style={[
          styles.rail,
          isVertical && styles.railVertical,
          {
            minHeight: railMinHeight,
            paddingHorizontal: isVertical ? 0 : railHorizontalPadding,
            paddingVertical: isVertical ? railHorizontalPadding : 0,
          },
        ]}
        onLayout={(event) => {
          const nextMainAxisSize = Math.round(
            isVertical ? event.nativeEvent.layout.height : event.nativeEvent.layout.width,
          );
          setRailMainAxisSize((prev) => (prev === nextMainAxisSize ? prev : nextMainAxisSize));
          reportReserveSlots();
          reportRailFrame();
        }}
      >
        {/*
          Reserve tray artwork is rendered as a background PNG.
          Piece positions and stacking geometry are determined by gameplay layout,
          not by the tray image.
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
          style={[
            styles.pieceStack,
            isVertical && styles.pieceStackVertical,
            {
              paddingHorizontal: isVertical ? 0 : pieceLayout.inset,
              paddingVertical: isVertical ? pieceLayout.inset : 0,
              transform: isVertical ? undefined : [{ translateY: reserveStackOffsetY }],
            },
          ]}
        >
          {Array.from({ length: shownCount }).map((_, index) => (
            <View
              key={`piece-${index}`}
              ref={(node) => {
                slotRefs.current[index] = node;
              }}
              style={[
                styles.stackPiece,
                isVertical && styles.stackPieceVertical,
                {
                  marginLeft: isVertical || index === 0 ? 0 : -pieceLayout.overlap,
                  marginTop: isVertical && index > 0 ? -pieceLayout.overlap : 0,
                  width: reservePieceSize,
                  height: reservePieceSize,
                  zIndex: index + 1,
                },
              ]}
            >
              {!hideReservePieces && (
                <Piece
                  color={color}
                  pixelSize={reservePieceSize}
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
    justifyContent: 'center',
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
});
