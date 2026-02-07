import { urTheme, urTextures } from '@/constants/urTheme';
import React, { useEffect } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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

interface DiceProps {
  value: number | null;
  rolling: boolean;
  onRoll: () => void;
  canRoll: boolean;
}

export const Dice: React.FC<DiceProps> = ({ value, rolling, onRoll, canRoll }) => {
  const lift = useSharedValue(0);
  const wobble = useSharedValue(0);
  const readiness = useSharedValue(canRoll ? 0.4 : 0);

  useEffect(() => {
    if (rolling) {
      lift.value = withSequence(
        withTiming(-9, { duration: 100 }),
        withTiming(4, { duration: 90 }),
        withTiming(-6, { duration: 90 }),
        withSpring(0, { damping: 8, stiffness: 190 }),
      );
      wobble.value = withSequence(
        withTiming(1, { duration: 320, easing: Easing.linear }),
        withTiming(0, { duration: 0 }),
      );
    }
  }, [lift, rolling, wobble]);

  useEffect(() => {
    if (canRoll && !rolling) {
      readiness.value = withRepeat(
        withSequence(
          withTiming(0.75, { duration: 900, easing: Easing.inOut(Easing.quad) }),
          withTiming(0.25, { duration: 900, easing: Easing.inOut(Easing.quad) }),
        ),
        -1,
        true,
      );
      return;
    }

    cancelAnimation(readiness);
    readiness.value = withTiming(0, { duration: 180 });
  }, [canRoll, readiness, rolling]);

  const diceRowStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: lift.value },
      { rotate: `${wobble.value * 16}deg` },
      { scale: 1 + wobble.value * 0.08 },
    ],
  }));

  const readinessStyle = useAnimatedStyle(() => ({
    opacity: readiness.value,
    transform: [{ scale: 0.98 + readiness.value * 0.06 }],
  }));

  const title = rolling ? 'Casting...' : value !== null ? `Result: ${value}` : 'Cast The Dice';
  const subtitle = rolling
    ? 'The astragali are in motion'
    : canRoll
      ? 'Tap to roll'
      : 'Wait for your turn';

  return (
    <TouchableOpacity onPress={onRoll} disabled={!canRoll || rolling} activeOpacity={0.9} style={styles.touchable}>
      <View style={[styles.card, canRoll ? styles.cardActive : styles.cardLocked]}>
        <Image source={urTextures.goldInlay} resizeMode="repeat" style={styles.cardTexture} />
        <View style={styles.cardTopGlow} />
        <View style={styles.cardBorder} />
        <Animated.View style={[styles.readyHalo, readinessStyle]} />

        <Animated.View style={[styles.diceRow, diceRowStyle]}>
          {[0, 1, 2, 3].map((index) => {
            const isOn = value !== null && index < value;
            return (
              <View key={index} style={[styles.die, isOn ? styles.dieOn : styles.dieOff]}>
                <View style={[styles.dieFacet, isOn ? styles.dieFacetOn : styles.dieFacetOff]} />
                {isOn && <View style={styles.diePip} />}
              </View>
            );
          })}
        </Animated.View>

        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  touchable: {
    width: '100%',
  },
  card: {
    borderRadius: urTheme.radii.md,
    minHeight: 144,
    paddingHorizontal: urTheme.spacing.md,
    paddingVertical: urTheme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1.3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 8,
  },
  cardActive: {
    backgroundColor: '#5C3622',
    borderColor: 'rgba(230, 193, 121, 0.65)',
  },
  cardLocked: {
    backgroundColor: '#4C4843',
    borderColor: 'rgba(201, 190, 173, 0.35)',
    opacity: 0.75,
  },
  cardTexture: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.2,
  },
  cardTopGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '44%',
    backgroundColor: 'rgba(255, 224, 168, 0.13)',
  },
  cardBorder: {
    ...StyleSheet.absoluteFillObject,
    margin: 6,
    borderRadius: urTheme.radii.sm,
    borderWidth: 1,
    borderColor: 'rgba(246, 219, 163, 0.36)',
  },
  readyHalo: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    bottom: 10,
    borderRadius: urTheme.radii.sm,
    borderWidth: 1.5,
    borderColor: 'rgba(111, 184, 255, 0.8)',
  },
  diceRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: urTheme.spacing.sm,
  },
  die: {
    width: 32,
    height: 32,
    transform: [{ rotate: '45deg' }],
    borderRadius: urTheme.radii.xs,
    borderWidth: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  dieOn: {
    backgroundColor: '#1D518D',
    borderColor: 'rgba(218, 182, 105, 0.9)',
    shadowColor: '#1D518D',
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 4,
  },
  dieOff: {
    backgroundColor: '#DBC6A6',
    borderColor: 'rgba(87, 59, 36, 0.55)',
  },
  dieFacet: {
    position: 'absolute',
    width: 21,
    height: 21,
    borderRadius: urTheme.radii.xs - 2,
    transform: [{ rotate: '-45deg' }],
    top: 2,
    left: 2,
  },
  dieFacetOn: {
    backgroundColor: 'rgba(129, 182, 252, 0.34)',
  },
  dieFacetOff: {
    backgroundColor: 'rgba(255, 240, 204, 0.3)',
  },
  diePip: {
    width: 9,
    height: 9,
    borderRadius: urTheme.radii.pill,
    backgroundColor: urTheme.colors.ivory,
    borderWidth: 0.7,
    borderColor: 'rgba(29, 20, 12, 0.5)',
    transform: [{ rotate: '-45deg' }],
  },
  title: {
    color: '#F6E6CC',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1.05,
    textTransform: 'uppercase',
  },
  subtitle: {
    marginTop: 3,
    color: 'rgba(244, 223, 191, 0.9)',
    fontSize: 11,
    letterSpacing: 0.35,
  },
});
