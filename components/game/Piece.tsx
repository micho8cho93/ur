import { urTheme } from '@/constants/urTheme';
import { PlayerColor } from '@/logic/types';
import { useCosmeticTheme } from '@/src/store/CosmeticThemeContext';
import { getPieceImageSources } from '@/src/cosmetics/pieceAssets';
import React, { useEffect, useMemo } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Animated, {
  Extrapolation,
  Easing,
  cancelAnimation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

// Cosmetic preview regression checklist:
// - Default light piece art remains assets/pieces/piece_light.png with no tintColor.
// - Default dark piece art remains assets/pieces/piece_dark.png with no tintColor.
// - Reserve pieces keep using the owning color's default PNG art.
// - Cosmetic piece previews swap piece PNG sources; they do not apply tint, outline, or color treatments.
type PieceVariant = 'light' | 'dark' | 'reserve';
type PieceHighlightTone = 'gold' | 'deepBlue';

interface PieceProps {
  color: PlayerColor;
  cosmeticPlayerColor?: PlayerColor | null;
  highlight?: boolean;
  highlightTone?: PieceHighlightTone;
  invalidSelectionToken?: number;
  opacity?: number;
  size?: 'sm' | 'md' | 'lg';
  pixelSize?: number;
  artScale?: number;
  artOffsetX?: number;
  artOffsetY?: number;
  variant?: PieceVariant;
  state?: 'idle' | 'active' | 'captured';
}

const arePiecePropsEqual = (prev: PieceProps, next: PieceProps): boolean =>
  prev.color === next.color &&
  prev.cosmeticPlayerColor === next.cosmeticPlayerColor &&
  prev.highlight === next.highlight &&
  prev.highlightTone === next.highlightTone &&
  prev.invalidSelectionToken === next.invalidSelectionToken &&
  prev.opacity === next.opacity &&
  prev.size === next.size &&
  prev.pixelSize === next.pixelSize &&
  prev.artScale === next.artScale &&
  prev.artOffsetX === next.artOffsetX &&
  prev.artOffsetY === next.artOffsetY &&
  prev.variant === next.variant &&
  prev.state === next.state;

const PIECE_SIZE_PRESETS = {
  sm: 34,
  md: 38,
  lg: 46,
} as const;

// The visible token body occupies about 62.5% of the exported PNG frame.
export const PIECE_ART_VISIBLE_COVERAGE = 0.625;
// Match the current dark token center so every token lands on the same gameplay point.
export const PIECE_ART_VISUAL_CENTER_OFFSET_Y_RATIO = -0.031;
const PIECE_ART_VISUAL_CENTER_OFFSET_Y_RATIOS = {
  light: PIECE_ART_VISUAL_CENTER_OFFSET_Y_RATIO,
  dark: PIECE_ART_VISUAL_CENTER_OFFSET_Y_RATIO,
} as const;

const PieceComponent: React.FC<PieceProps> = ({
  color,
  highlight = false,
  highlightTone = 'gold',
  invalidSelectionToken = 0,
  opacity = 1,
  size = 'md',
  pixelSize,
  cosmeticPlayerColor,
  artScale = 1,
  artOffsetX = 0,
  artOffsetY = 0,
  variant,
  state = 'idle',
}) => {
  const { pieceImageSources } = useCosmeticTheme();
  const defaultPieceImageSources = useMemo(() => getPieceImageSources(), []);
  const intro = useSharedValue(0.9);
  const glowPulse = useSharedValue(0);
  const motion = useSharedValue(0);
  const rejectionOffset = useSharedValue(0);
  const rejectionTwist = useSharedValue(0);

  const resolvedVariant: PieceVariant = variant ?? color;
  const sourcePool = cosmeticPlayerColor == null || cosmeticPlayerColor === color
    ? pieceImageSources
    : defaultPieceImageSources;
  const resolvedSource = useMemo(() => {
    if (resolvedVariant === 'reserve') {
      return color === 'dark' ? sourcePool.reserveDark : sourcePool.reserveLight;
    }

    return resolvedVariant === 'dark' ? sourcePool.dark : sourcePool.light;
  }, [
    color,
    resolvedVariant,
    sourcePool.dark,
    sourcePool.light,
    sourcePool.reserveDark,
    sourcePool.reserveLight,
  ]);

  useEffect(() => {
    intro.value = withSpring(1, urTheme.motion.spring.game);
  }, [intro]);

  useEffect(() => {
    if (highlight) {
      glowPulse.value = withRepeat(
        withSequence(
          withTiming(1, { duration: urTheme.motion.duration.base, easing: Easing.inOut(Easing.quad) }),
          withTiming(0.2, { duration: urTheme.motion.duration.base, easing: Easing.inOut(Easing.quad) }),
        ),
        -1,
        true,
      );
      return;
    }

    cancelAnimation(glowPulse);
    glowPulse.value = withTiming(0, { duration: urTheme.motion.duration.fast });
  }, [glowPulse, highlight]);

  useEffect(() => {
    if (state === 'captured') {
      motion.value = withSequence(
        withTiming(1, { duration: 120, easing: Easing.out(Easing.cubic) }),
        withTiming(0, { duration: 260, easing: Easing.in(Easing.cubic) }),
      );
      return;
    }

    if (state === 'active') {
      motion.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 420, easing: Easing.inOut(Easing.quad) }),
          withTiming(0, { duration: 420, easing: Easing.inOut(Easing.quad) }),
        ),
        -1,
        true,
      );
      return;
    }

    cancelAnimation(motion);
    motion.value = withTiming(0, { duration: urTheme.motion.duration.fast });
  }, [motion, state]);

  useEffect(() => {
    cancelAnimation(rejectionOffset);
    cancelAnimation(rejectionTwist);
    rejectionOffset.value = 0;
    rejectionTwist.value = 0;

    if (invalidSelectionToken <= 0) {
      return;
    }

    rejectionOffset.value = withSequence(
      withTiming(-6, { duration: 46, easing: Easing.out(Easing.quad) }),
      withTiming(5, { duration: 58, easing: Easing.inOut(Easing.quad) }),
      withTiming(-4, { duration: 52, easing: Easing.inOut(Easing.quad) }),
      withTiming(3, { duration: 48, easing: Easing.inOut(Easing.quad) }),
      withTiming(0, { duration: 56, easing: Easing.out(Easing.quad) }),
    );
    rejectionTwist.value = withSequence(
      withTiming(-0.04, { duration: 46, easing: Easing.out(Easing.quad) }),
      withTiming(0.035, { duration: 58, easing: Easing.inOut(Easing.quad) }),
      withTiming(-0.024, { duration: 52, easing: Easing.inOut(Easing.quad) }),
      withTiming(0.016, { duration: 48, easing: Easing.inOut(Easing.quad) }),
      withTiming(0, { duration: 56, easing: Easing.out(Easing.quad) }),
    );
  }, [invalidSelectionToken, rejectionOffset, rejectionTwist]);

  const sizePx = useMemo(() => {
    // Gameplay geometry can pass an exact pixel size; presets remain as fallback for rails/cues.
    if (typeof pixelSize === 'number' && Number.isFinite(pixelSize) && pixelSize > 0) {
      return pixelSize;
    }
    return PIECE_SIZE_PRESETS[size];
  }, [pixelSize, size]);

  const artSizePx = useMemo(() => Math.max(1, sizePx * artScale), [artScale, sizePx]);
  const resolvedArtSourceVariant = resolvedVariant === 'reserve' ? color : resolvedVariant;
  const resolvedArtOffsetY = useMemo(
    () =>
      artOffsetY +
      artSizePx * (PIECE_ART_VISUAL_CENTER_OFFSET_Y_RATIOS[resolvedArtSourceVariant] ?? 0),
    [artOffsetY, artSizePx, resolvedArtSourceVariant],
  );
  const glowSizes = useMemo(
    () =>
      highlightTone === 'deepBlue'
        ? {
            outer: Math.max(1, Math.round(sizePx * 1.18)),
            middle: Math.max(1, Math.round(sizePx * 0.94)),
            inner: Math.max(1, Math.round(sizePx * 0.74)),
          }
        : {
            outer: Math.max(1, Math.round(sizePx * 0.82)),
            middle: Math.max(1, Math.round(sizePx * 0.74)),
            inner: Math.max(1, Math.round(sizePx * 0.68)),
          },
    [highlightTone, sizePx],
  );

  const pieceStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: rejectionOffset.value },
      { rotateZ: `${rejectionTwist.value}rad` },
      { scale: intro.value * interpolate(motion.value, [0, 1], [1, 1.045], Extrapolation.CLAMP) },
      { translateY: interpolate(motion.value, [0, 1], [0, -1], Extrapolation.CLAMP) },
    ],
    opacity: state === 'captured' ? interpolate(motion.value, [0, 1], [1, 0.35], Extrapolation.CLAMP) : 1,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: highlightTone === 'deepBlue' ? 0.38 + glowPulse.value * 0.34 : glowPulse.value * 0.9,
    transform: [{ scale: 0.96 + glowPulse.value * (highlightTone === 'deepBlue' ? 0.08 : 0.2) }],
  }));

  const outerGlowStyle = useAnimatedStyle(() => ({
    opacity: highlightTone === 'deepBlue' ? 0.22 + glowPulse.value * 0.22 : glowPulse.value * 0.38,
    transform: [{ scale: 0.98 + glowPulse.value * (highlightTone === 'deepBlue' ? 0.12 : 0.16) }],
  }));

  const highlightPalette = useMemo(
    () =>
      highlightTone === 'deepBlue'
        ? {
            outerBackgroundColor: 'rgba(10, 28, 92, 0.16)',
            middleBackgroundColor: 'rgba(16, 42, 116, 0.26)',
            innerBackgroundColor: 'rgba(18, 56, 146, 0.22)',
            borderColor: 'rgba(54, 108, 224, 0.9)',
            shadowColor: 'rgba(46, 96, 214, 0.95)',
          }
        : {
            outerBackgroundColor: 'rgba(240, 192, 64, 0.14)',
            middleBackgroundColor: 'rgba(240, 192, 64, 0.18)',
            innerBackgroundColor: 'rgba(240, 192, 64, 0.18)',
            borderColor: 'rgba(246, 212, 138, 0.9)',
            shadowColor: 'rgba(240, 192, 64, 0.9)',
          },
    [highlightTone],
  );

  return (
    <Animated.View style={[styles.wrap, { width: sizePx, height: sizePx, opacity }, pieceStyle]}>
      {highlight && (
        <>
          <Animated.View
            style={[
              styles.outerGlow,
              outerGlowStyle,
              {
                width: glowSizes.outer,
                height: glowSizes.outer,
                backgroundColor: highlightPalette.outerBackgroundColor,
                shadowColor: highlightPalette.shadowColor,
              },
            ]}
          />
          <Animated.View
            style={[
              styles.targetGlow,
              glowStyle,
              {
                width: glowSizes.middle,
                height: glowSizes.middle,
                backgroundColor: highlightPalette.middleBackgroundColor,
                borderColor: highlightPalette.borderColor,
                shadowColor: highlightPalette.shadowColor,
              },
            ]}
          />
          <Animated.View
            style={[
              styles.innerAura,
              glowStyle,
              {
                width: glowSizes.inner,
                height: glowSizes.inner,
                backgroundColor: highlightPalette.innerBackgroundColor,
              },
            ]}
          />
        </>
      )}

      <View style={[styles.artFrame, { width: sizePx, height: sizePx }]}>
        <Image
          source={resolvedSource}
          resizeMode="contain"
          style={[
            styles.artImage,
            {
              width: artSizePx,
              height: artSizePx,
              transform: [
                { translateX: artOffsetX },
                { translateY: resolvedArtOffsetY },
              ],
            },
          ]}
        />
      </View>
    </Animated.View>
  );
};

export const Piece = React.memo(PieceComponent, arePiecePropsEqual);
Piece.displayName = 'Piece';

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerGlow: {
    position: 'absolute',
    borderRadius: 999,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 8,
  },
  targetGlow: {
    position: 'absolute',
    borderRadius: urTheme.radii.pill,
    borderWidth: 1.6,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.42,
    shadowRadius: 12,
    elevation: 7,
  },
  innerAura: {
    position: 'absolute',
    borderRadius: 999,
  },
  artFrame: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  artImage: {
    opacity: 0.98,
  },
});
