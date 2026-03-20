import { boxShadow, textShadow } from '@/constants/styleEffects';
import { urTheme, urTextures, urTypography } from '@/constants/urTheme';
import React, { useCallback } from 'react';
import { Image, StyleProp, StyleSheet, Text, View, ViewStyle, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { AnimatedScoreValue } from './AnimatedScoreValue';

interface EdgeScoreProps {
  side: 'light' | 'dark';
  score: number;
  maxScore: number;
  active?: boolean;
  align?: 'left' | 'right';
  style?: StyleProp<ViewStyle>;
}

const SIDE_ACCENTS = {
  light: {
    accent: '#F0C040',
    glow: 'rgba(232, 104, 40, 0.34)',
    flash: 'rgba(255, 233, 203, 0.8)',
    tint: 'rgba(232, 104, 40, 0.12)',
  },
  dark: {
    accent: '#8AB8FF',
    glow: 'rgba(46, 111, 216, 0.34)',
    flash: 'rgba(210, 228, 255, 0.76)',
    tint: 'rgba(46, 111, 216, 0.14)',
  },
} as const;

export const EdgeScore: React.FC<EdgeScoreProps> = ({
  side,
  score,
  maxScore,
  active = false,
  align = 'left',
  style,
}) => {
  const { width } = useWindowDimensions();
  const isMobile = width < 760;
  const isRightAligned = align === 'right';
  const accent = SIDE_ACCENTS[side];
  const celebration = useSharedValue(0);

  const triggerCelebration = useCallback(() => {
    cancelAnimation(celebration);
    celebration.value = 0;
    celebration.value = withSequence(
      withTiming(1, {
        duration: 180,
        easing: Easing.out(Easing.cubic),
      }),
      withTiming(0, {
        duration: 480,
        easing: Easing.inOut(Easing.quad),
      }),
    );
  }, [celebration]);

  const shellAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + celebration.value * (isMobile ? 0.045 : 0.035) }],
  }));

  const glowAnimatedStyle = useAnimatedStyle(() => ({
    opacity: 0.08 + celebration.value * 0.32,
    transform: [{ scale: 0.92 + celebration.value * 0.14 }],
  }));

  const flashAnimatedStyle = useAnimatedStyle(() => ({
    opacity: celebration.value * 0.2,
  }));

  return (
    <Animated.View
      accessible
      accessibilityLabel={`${side.toUpperCase()} score ${score} of ${maxScore}`}
      style={[
        styles.wrap,
        isMobile && styles.mobileWrap,
        isRightAligned && styles.rightWrap,
        active && styles.activeWrap,
        shellAnimatedStyle,
        style,
      ]}
    >
      <Image source={urTextures.lapisMosaic} resizeMode="cover" style={styles.texture} />
      <View style={[styles.tintOverlay, { backgroundColor: accent.tint }]} />
      <Animated.View pointerEvents="none" style={[styles.scoreGlow, { backgroundColor: accent.glow }, glowAnimatedStyle]} />
      <Animated.View pointerEvents="none" style={[styles.flashOverlay, { backgroundColor: accent.flash }, flashAnimatedStyle]} />
      <View style={styles.topGlow} />
      <View style={[styles.edgeAccent, isRightAligned ? styles.rightAccent : styles.leftAccent, { backgroundColor: accent.accent }]} />
      <View style={[styles.innerBorder, isMobile && styles.mobileInnerBorder]} />

      <View style={[styles.content, isRightAligned && styles.rightContent]}>
        <Text style={[styles.label, isMobile && styles.mobileLabel, isRightAligned && styles.rightText]}>
          {side.toUpperCase()}
        </Text>
        <View style={[styles.scoreRow, isMobile && styles.mobileScoreRow, isRightAligned && styles.rightScoreRow]}>
          <AnimatedScoreValue
            value={score}
            maxValue={maxScore}
            compact={isMobile}
            align={align}
            onScoreIncrease={triggerCelebration}
          />
          <Text style={[styles.divider, isMobile && styles.mobileDivider, isRightAligned && styles.rightText]}>/</Text>
          <Text style={[styles.maxScore, isMobile && styles.mobileMaxScore, isRightAligned && styles.rightText]}>
            {maxScore}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    minWidth: 112,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: urTheme.radii.md,
    borderWidth: 1,
    borderColor: 'rgba(200, 152, 30, 0.76)',
    backgroundColor: 'rgba(9, 13, 20, 0.86)',
    overflow: 'hidden',
    ...urTheme.shadow.soft,
  },
  mobileWrap: {
    minWidth: 74,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: urTheme.radii.sm,
  },
  rightWrap: {
    alignItems: 'flex-end',
  },
  activeWrap: {
    borderColor: 'rgba(240, 192, 64, 0.98)',
    ...boxShadow({
      color: '#F0C040',
      opacity: 0.34,
      blurRadius: 10,
      elevation: 5,
    }),
  },
  texture: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.2,
  },
  tintOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  scoreGlow: {
    position: 'absolute',
    left: -18,
    right: -18,
    top: -18,
    bottom: -18,
    borderRadius: urTheme.radii.lg,
  },
  flashOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  topGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(255, 232, 194, 0.09)',
  },
  edgeAccent: {
    position: 'absolute',
    top: 5,
    bottom: 5,
    width: 3,
    borderRadius: urTheme.radii.pill,
    opacity: 0.94,
  },
  leftAccent: {
    left: 5,
  },
  rightAccent: {
    right: 5,
  },
  innerBorder: {
    ...StyleSheet.absoluteFillObject,
    margin: 4,
    borderRadius: urTheme.radii.sm + 1,
    borderWidth: 1,
    borderColor: 'rgba(248, 228, 188, 0.2)',
  },
  mobileInnerBorder: {
    margin: 3,
    borderRadius: urTheme.radii.xs + 1,
  },
  content: {
    alignItems: 'flex-start',
  },
  rightContent: {
    alignItems: 'flex-end',
  },
  label: {
    ...urTypography.label,
    color: 'rgba(241, 230, 208, 0.86)',
    fontSize: 10,
    letterSpacing: 1.5,
  },
  mobileLabel: {
    fontSize: 7,
    lineHeight: 10,
    letterSpacing: 1.15,
  },
  scoreRow: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
  },
  mobileScoreRow: {
    marginTop: 2,
    gap: 2,
  },
  rightScoreRow: {
    justifyContent: 'flex-end',
  },
  divider: {
    ...urTypography.title,
    color: 'rgba(242, 232, 213, 0.72)',
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    marginBottom: 4,
    ...textShadow({
      color: '#040302',
      offset: { width: 0, height: 1 },
      blurRadius: 2,
    }),
  },
  mobileDivider: {
    fontSize: 12,
    lineHeight: 14,
    marginBottom: 2,
  },
  maxScore: {
    ...urTypography.title,
    color: '#F7E9CD',
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    marginBottom: 4,
    ...textShadow({
      color: '#040302',
      offset: { width: 0, height: 1 },
      blurRadius: 2,
    }),
  },
  mobileMaxScore: {
    fontSize: 12,
    lineHeight: 14,
    marginBottom: 2,
  },
  rightText: {
    textAlign: 'right',
  },
});
