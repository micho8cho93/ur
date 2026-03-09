import { urTheme } from '@/constants/urTheme';
import React, { useEffect, useMemo, useState } from 'react';
import { Image, StyleSheet, View, useWindowDimensions } from 'react-native';
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
  piecePixelSize?: number;
  reserveCount: number;
  totalCount?: number;
  active?: boolean;
}

export const PieceRail: React.FC<PieceRailProps> = ({
  color,
  tokenVariant,
  piecePixelSize,
  reserveCount,
  totalCount = 7,
  active = false,
}) => {
  const { width, height } = useWindowDimensions();
  const glow = useSharedValue(active ? 0.5 : 0);
  const [railWidth, setRailWidth] = useState(0);
  const isMobile = width < 760;
  const isTabletPortrait = width >= 760 && width <= 1024 && height > width;
  const railScale = isMobile ? MOBILE_RAIL_SCALE : isTabletPortrait ? 0.9 : 1;
  const railMinHeight = Math.round(RAIL_MIN_HEIGHT * railScale);
  const railHorizontalPadding = Math.round(RAIL_HORIZONTAL_PADDING * railScale);
  const reserveStackOffsetY = Math.round(RESERVE_STACK_OFFSET_Y * railScale);
  const trayArtScale = TRAY_ART_FIT.scale * (isMobile ? 0.78 : isTabletPortrait ? 0.92 : 1);

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
  const reservePieceSize = piecePixelSize ?? DEFAULT_RESERVE_PIECE_SIZE;

  const pieceLayout = useMemo(() => {
    const minOverlap = Math.max(1, Math.round(reservePieceSize * 0.14));
    const preferredOverlap = Math.max(minOverlap, Math.round(reservePieceSize * 0.24));
    const preferredInset = Math.max(10, Math.round(reservePieceSize * 0.28));

    if (shownCount <= 0) {
      return {
        overlap: preferredOverlap,
        horizontalInset: preferredInset,
      };
    }

    if (railWidth <= 0) {
      return {
        overlap: preferredOverlap,
        horizontalInset: preferredInset,
      };
    }

    const preferredStep = reservePieceSize - preferredOverlap;
    const preferredSpan = reservePieceSize + preferredStep * Math.max(0, shownCount - 1);
    const maxInset = Math.max(0, Math.floor((railWidth - preferredSpan) / 2));
    const horizontalInset = Math.min(preferredInset, maxInset);
    const usableWidth = Math.max(0, railWidth - horizontalInset * 2);

    let overlap = preferredOverlap;
    if (shownCount > 1) {
      const maxStepForFit = Math.floor((usableWidth - reservePieceSize) / (shownCount - 1));
      const stepWithMinOverlap = reservePieceSize - minOverlap;
      const resolvedStep = Math.max(1, Math.min(stepWithMinOverlap, maxStepForFit));
      overlap = Math.max(minOverlap, reservePieceSize - resolvedStep);
    }

    return {
      overlap,
      horizontalInset,
    };
  }, [railWidth, reservePieceSize, shownCount]);

  return (
    <View style={styles.wrap}>
      <View
        style={[
          styles.rail,
          {
            minHeight: railMinHeight,
            paddingHorizontal: railHorizontalPadding,
          },
        ]}
        onLayout={(event) => {
          const nextWidth = Math.round(event.nativeEvent.layout.width);
          setRailWidth((prev) => (prev === nextWidth ? prev : nextWidth));
        }}
      >
        {/*
          Reserve tray artwork is rendered as a background PNG.
          Piece positions and stacking geometry are determined by gameplay layout,
          not by the tray image.
        */}
        <View pointerEvents="none" style={styles.trayArtLayer}>
          <Image
            source={TRAY_ASSETS[color]}
            resizeMode="contain"
            style={[
              styles.trayArt,
              {
                transform: [
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
            {
              paddingHorizontal: pieceLayout.horizontalInset,
              transform: [{ translateY: reserveStackOffsetY }],
            },
          ]}
        >
          {Array.from({ length: shownCount }).map((_, index) => (
            <View
              key={`piece-${index}`}
              style={[
                styles.stackPiece,
                {
                  marginLeft: index === 0 ? 0 : -pieceLayout.overlap,
                  width: reservePieceSize,
                  height: reservePieceSize,
                },
              ]}
            >
              <Piece
                color={color}
                pixelSize={reservePieceSize}
                variant={resolvedVariant}
              />
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
  rail: {
    borderRadius: urTheme.radii.pill,
    borderWidth: 1.2,
    borderColor: 'transparent',
    backgroundColor: 'transparent',
    overflow: 'visible',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 5 },
    elevation: 0,
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
  stackPiece: {
    zIndex: 5,
  },
});
