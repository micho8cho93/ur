import { urTheme, urTextures, urTypography } from '@/constants/urTheme';
import React, { useEffect } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Polygon } from 'react-native-svg';

interface DiceProps {
  value: number | null;
  rolling: boolean;
  onRoll: () => void;
  canRoll: boolean;
  mode?: 'panel' | 'stage';
  showNumericResult?: boolean;
}

interface TetrahedralDieProps {
  isOn: boolean;
  settleDelay: number;
  rolling: boolean;
}

const TetrahedralDie: React.FC<TetrahedralDieProps> = ({ isOn, settleDelay, rolling }) => {
  const spinY = useSharedValue(0);

  useEffect(() => {
    if (rolling) {
      spinY.value = withSequence(
        withTiming(1, { duration: 360 + settleDelay * 0.5, easing: Easing.linear }),
        withDelay(
          settleDelay,
          withSpring(0, { mass: 0.5, damping: 9, stiffness: 200 }),
        ),
      );
    }
  }, [rolling, settleDelay, spinY]);

  const dieAnimStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 400 },
      { rotateY: `${spinY.value * 360}deg` },
      { rotateZ: `${spinY.value * 18 - 9}deg` },
    ],
  }));

  // Tetrahedron rendered as triangle in perspective
  // Left face (darker) + right face (lighter) meeting at center line
  const size = 36;
  const cx = size / 2;

  // Overall triangle points (isosceles, apex at top)
  const apexX = cx;
  const apexY = 2;
  const baseLeftX = 2;
  const baseLeftY = size - 2;
  const baseRightX = size - 2;
  const baseRightY = size - 2;
  // Center dividing line bottom (for two-face illusion)
  const midBottomX = cx;
  const midBottomY = size - 2;

  const leftFaceColor = isOn ? '#122A5C' : '#8A6E50';
  const rightFaceColor = isOn ? '#1A4A8A' : '#C9B08A';
  const borderColor = isOn ? '#0A1828' : '#1A1208';
  const pipColor = '#F2E8D5';

  return (
    <Animated.View style={[{ width: size, height: size }, dieAnimStyle]}>
      <Svg width={size} height={size} pointerEvents="none">
        {/* Left face — slightly darker */}
        <Polygon
          points={`${apexX},${apexY} ${baseLeftX},${baseLeftY} ${midBottomX},${midBottomY}`}
          fill={leftFaceColor}
          stroke={borderColor}
          strokeWidth={1.2}
        />
        {/* Right face — lighter */}
        <Polygon
          points={`${apexX},${apexY} ${baseRightX},${baseRightY} ${midBottomX},${midBottomY}`}
          fill={rightFaceColor}
          stroke={borderColor}
          strokeWidth={1.2}
        />
        {/* Outer border — full triangle */}
        <Polygon
          points={`${apexX},${apexY} ${baseLeftX},${baseLeftY} ${baseRightX},${baseRightY}`}
          fill="none"
          stroke={borderColor}
          strokeWidth={1.5}
        />
        {/* Apex pip for "on" state */}
        {isOn && (
          <Circle cx={apexX} cy={apexY + 5} r={3.5} fill={pipColor} />
        )}
      </Svg>
    </Animated.View>
  );
};

export const Dice: React.FC<DiceProps> = ({
  value,
  rolling,
  onRoll,
  canRoll,
  mode = 'panel',
  showNumericResult = true,
}) => {
  const lift = useSharedValue(0);
  const tilt = useSharedValue(0);
  const readiness = useSharedValue(canRoll ? 0.4 : 0);
  const resultPulse = useSharedValue(0);

  useEffect(() => {
    if (rolling) {
      lift.value = withSequence(
        withTiming(-18, { duration: 110, easing: Easing.out(Easing.cubic) }),
        withTiming(9, { duration: 120, easing: Easing.inOut(Easing.quad) }),
        withTiming(-7, { duration: 100, easing: Easing.inOut(Easing.quad) }),
        withSpring(0, urTheme.motion.spring.settle),
      );

      tilt.value = withSequence(
        withTiming(1, { duration: 280, easing: Easing.linear }),
        withTiming(0, { duration: 190, easing: Easing.out(Easing.cubic) }),
      );
    }
  }, [lift, rolling, tilt]);

  useEffect(() => {
    if (canRoll && !rolling) {
      readiness.value = withRepeat(
        withSequence(
          withTiming(0.82, { duration: 850, easing: Easing.inOut(Easing.quad) }),
          withTiming(0.22, { duration: 850, easing: Easing.inOut(Easing.quad) }),
        ),
        -1,
        true,
      );
      return;
    }

    cancelAnimation(readiness);
    readiness.value = withTiming(0, { duration: 180 });
  }, [canRoll, readiness, rolling]);

  useEffect(() => {
    if (value === null || rolling) return;

    resultPulse.value = withSequence(
      withTiming(1, { duration: 170, easing: Easing.out(Easing.cubic) }),
      withTiming(0, { duration: 320, easing: Easing.inOut(Easing.quad) }),
    );
  }, [resultPulse, rolling, value]);

  const diceRowStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: lift.value },
      { perspective: 850 },
      { rotateX: `${tilt.value * 22}deg` },
      { rotateZ: `${tilt.value * 8 - 4}deg` },
      { scale: 1 + resultPulse.value * 0.08 },
    ],
  }));

  const readinessStyle = useAnimatedStyle(() => ({
    opacity: readiness.value,
    transform: [{ scale: 0.98 + readiness.value * 0.06 }],
  }));

  const groundShadowStyle = useAnimatedStyle(() => ({
    opacity: 0.22 + (1 - Math.min(Math.abs(lift.value) / 18, 1)) * 0.35,
    transform: [{ scaleX: 0.92 + Math.min(Math.abs(lift.value) / 18, 1) * 0.16 }],
  }));

  const title = rolling ? 'Casting...' : value !== null ? `Result: ${value}` : 'Cast The Dice';
  const subtitle = rolling
    ? 'The astragali are in motion'
    : canRoll
      ? 'Tap to roll'
      : 'Wait for your turn';

  const isStage = mode === 'stage';

  return (
    <TouchableOpacity onPress={onRoll} disabled={!canRoll || rolling} activeOpacity={0.9} style={styles.touchable}>
      <View
        style={[
          styles.card,
          isStage ? styles.stageCard : styles.panelCard,
          canRoll ? styles.cardActive : styles.cardLocked,
        ]}
      >
        <Image source={urTextures.goldInlay} resizeMode="repeat" style={styles.cardTexture} />
        <View style={styles.cardTopGlow} />
        <View style={styles.cardBorder} />
        <Animated.View style={[styles.readyHalo, readinessStyle]} />

        <Animated.View style={[styles.groundShadow, groundShadowStyle]} />

        <Animated.View style={[styles.diceRow, diceRowStyle]}>
          {[0, 1, 2, 3].map((index) => {
            const isOn = value !== null && index < value;
            return (
              <TetrahedralDie
                key={index}
                isOn={isOn}
                rolling={rolling}
                settleDelay={index * 80}
              />
            );
          })}
        </Animated.View>

        {showNumericResult && <Text style={styles.title}>{title}</Text>}
        <Text style={[styles.subtitle, isStage && styles.stageSubtitle]}>{subtitle}</Text>
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
  panelCard: {
    minHeight: 144,
  },
  stageCard: {
    minHeight: 124,
    borderRadius: urTheme.radii.pill,
  },
  cardActive: {
    backgroundColor: '#6B2E14',
    borderColor: 'rgba(200, 152, 30, 0.75)',
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
    backgroundColor: 'rgba(255, 200, 120, 0.12)',
  },
  cardBorder: {
    ...StyleSheet.absoluteFillObject,
    margin: 6,
    borderRadius: urTheme.radii.sm,
    borderWidth: 1,
    borderColor: 'rgba(240, 192, 64, 0.28)',
  },
  readyHalo: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    bottom: 10,
    borderRadius: urTheme.radii.sm,
    borderWidth: 1.5,
    borderColor: 'rgba(240, 192, 64, 0.7)',
  },
  groundShadow: {
    position: 'absolute',
    width: 136,
    height: 24,
    borderRadius: urTheme.radii.pill,
    backgroundColor: 'rgba(5, 10, 17, 0.4)',
    top: 58,
  },
  diceRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: urTheme.spacing.sm,
    marginTop: 2,
  },
  title: {
    ...urTypography.title,
    color: '#F6E6CC',
    fontSize: 14,
    letterSpacing: 1.05,
    textTransform: 'uppercase',
  },
  subtitle: {
    marginTop: 3,
    color: 'rgba(244, 223, 191, 0.9)',
    fontSize: 11,
    letterSpacing: 0.35,
  },
  stageSubtitle: {
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: '600',
  },
});
