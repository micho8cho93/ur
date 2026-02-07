import { urTheme } from '@/constants/urTheme';
import { PlayerColor } from '@/logic/types';
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

interface PieceProps {
  color: PlayerColor;
  highlight?: boolean;
}

export const Piece: React.FC<PieceProps> = ({ color, highlight = false }) => {
  const intro = useSharedValue(0.9);
  const glowPulse = useSharedValue(0);

  useEffect(() => {
    intro.value = withSpring(1, {
      mass: 0.4,
      damping: 9,
      stiffness: 180,
    });
  }, [intro]);

  useEffect(() => {
    if (highlight) {
      glowPulse.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 520, easing: Easing.inOut(Easing.quad) }),
          withTiming(0.2, { duration: 520, easing: Easing.inOut(Easing.quad) }),
        ),
        -1,
        true,
      );
      return;
    }

    cancelAnimation(glowPulse);
    glowPulse.value = withTiming(0, { duration: 180 });
  }, [glowPulse, highlight]);

  const pieceStyle = useAnimatedStyle(() => ({
    transform: [{ scale: intro.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowPulse.value * 0.9,
    transform: [{ scale: 0.95 + glowPulse.value * 0.2 }],
  }));

  const palette =
    color === 'light'
      ? {
          shell: '#1F5CAD',
          rim: '#E3BF6E',
          core: '#79AFFF',
          center: '#D6E9FF',
          specular: 'rgba(228, 243, 255, 0.7)',
          shadow: '#0A1A2E',
        }
      : {
          shell: '#141820',
          rim: '#CA9A42',
          core: '#765528',
          center: '#E6D7BF',
          specular: 'rgba(255, 229, 189, 0.36)',
          shadow: '#06070A',
        };

  return (
    <Animated.View style={[styles.wrap, pieceStyle]}>
      {highlight && <Animated.View style={[styles.targetGlow, glowStyle]} />}

      <View style={[styles.base, { backgroundColor: palette.shell, borderColor: palette.rim, shadowColor: palette.shadow }]}>
        <View style={[styles.innerRim, { borderColor: 'rgba(241, 230, 208, 0.45)' }]} />
        <View style={[styles.core, { backgroundColor: palette.core, borderColor: palette.rim }]}>
          <View style={[styles.coreCenter, { backgroundColor: palette.center }]} />
        </View>
        <View style={[styles.specular, { backgroundColor: palette.specular }]} />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  targetGlow: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: urTheme.radii.pill,
    backgroundColor: 'rgba(111, 184, 255, 0.24)',
  },
  base: {
    width: 34,
    height: 34,
    borderRadius: urTheme.radii.pill,
    borderWidth: 1.8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 6,
  },
  innerRim: {
    ...StyleSheet.absoluteFillObject,
    margin: 2.4,
    borderRadius: urTheme.radii.pill,
    borderWidth: 0.8,
  },
  core: {
    width: 18,
    height: 18,
    borderRadius: urTheme.radii.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coreCenter: {
    width: 8,
    height: 8,
    borderRadius: urTheme.radii.pill,
    opacity: 0.9,
  },
  specular: {
    position: 'absolute',
    top: 4,
    left: 6,
    width: 10,
    height: 6,
    borderRadius: urTheme.radii.pill,
    transform: [{ rotate: '-24deg' }],
  },
});
