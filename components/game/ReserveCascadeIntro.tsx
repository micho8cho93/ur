import React, { useEffect, useMemo, useRef } from 'react';
import { Image, ImageSourcePropType, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { ReserveSlotMeasurement } from './PieceRail';

interface ReserveCascadeIntroProps {
  lightSlots: ReserveSlotMeasurement[];
  darkSlots: ReserveSlotMeasurement[];
  onComplete: () => void;
}

interface FallingTarget extends ReserveSlotMeasurement {
  key: string;
  order: number;
}

const PIECE_SPRITES: Record<'light' | 'dark', ImageSourcePropType> = {
  light: require('../../assets/pieces/piece_light.png'),
  dark: require('../../assets/pieces/piece_dark.png'),
};

const FALL_STAGGER_MS = 75;

const FallingPiece: React.FC<{
  target: FallingTarget;
  onLanded: () => void;
}> = ({ target, onLanded }) => {
  const progress = useSharedValue(0);
  const landingBounce = useSharedValue(0);

  useEffect(() => {
    progress.value = 0;
    landingBounce.value = 0;

    progress.value = withDelay(
      target.order * FALL_STAGGER_MS,
      withTiming(1, { duration: 440, easing: Easing.out(Easing.cubic) }, (finished) => {
        if (!finished) return;
        landingBounce.value = withSequence(
          withTiming(1, { duration: 90, easing: Easing.out(Easing.quad) }),
          withSpring(0, {
            damping: 10,
            stiffness: 220,
            mass: 0.45,
          }),
        );
        runOnJS(onLanded)();
      }),
    );
  }, [landingBounce, onLanded, progress, target.order]);

  const pieceStyle = useAnimatedStyle(() => {
    const startY = -Math.max(220, target.y + target.size + 30);
    const horizontalDrift = target.color === 'light' ? -6 : 6;
    const y = interpolate(progress.value, [0, 1], [startY, 0]);
    const x = interpolate(progress.value, [0, 1], [horizontalDrift, 0]);
    const rotate = interpolate(progress.value, [0, 1], [target.color === 'light' ? -8 : 8, 0]);
    const bounceY = interpolate(landingBounce.value, [0, 1], [0, -6]);

    return {
      transform: [
        { translateX: x },
        { translateY: y + bounceY },
        { rotate: `${rotate}deg` },
        { scale: interpolate(progress.value, [0, 1], [0.96, 1]) },
      ],
      opacity: interpolate(progress.value, [0, 0.15, 1], [0, 1, 1]),
    };
  });

  const shadowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.65, 1], [0, 0.05, 0.22]),
    transform: [
      { scaleX: interpolate(progress.value, [0, 1], [0.58, 1]) },
      { scaleY: interpolate(progress.value, [0, 1], [0.5, 1]) },
    ],
  }));

  return (
    <View
      pointerEvents="none"
      style={[
        styles.pieceAnchor,
        {
          left: target.x,
          top: target.y,
          width: target.size,
          height: target.size,
        },
      ]}
    >
      <Animated.View
        style={[
          styles.contactShadow,
          shadowStyle,
          {
            width: target.size * 0.62,
            height: Math.max(4, target.size * 0.14),
            bottom: Math.max(1, target.size * 0.06),
          },
        ]}
      />
      <Animated.View style={[styles.pieceWrap, pieceStyle]}>
        <Image source={PIECE_SPRITES[target.color]} resizeMode="contain" style={styles.pieceImage} />
      </Animated.View>
    </View>
  );
};

export const ReserveCascadeIntro: React.FC<ReserveCascadeIntroProps> = ({ lightSlots, darkSlots, onComplete }) => {
  const landedCountRef = useRef(0);

  const pieceTargets = useMemo<FallingTarget[]>(() => {
    const orderedLight = [...lightSlots].sort((a, b) => a.index - b.index);
    const orderedDark = [...darkSlots].sort((a, b) => a.index - b.index);

    return [...orderedLight, ...orderedDark].map((slot, index) => ({
      ...slot,
      key: `${slot.color}-${slot.index}`,
      order: index,
    }));
  }, [darkSlots, lightSlots]);

  useEffect(() => {
    landedCountRef.current = 0;
  }, [pieceTargets.length]);

  if (pieceTargets.length === 0) {
    return null;
  }

  return (
    <View pointerEvents="none" style={styles.overlay}>
      {pieceTargets.map((target) => (
        <FallingPiece
          key={target.key}
          target={target}
          onLanded={() => {
            landedCountRef.current += 1;
            if (landedCountRef.current >= pieceTargets.length) {
              onComplete();
            }
          }}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 50,
  },
  pieceAnchor: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pieceWrap: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pieceImage: {
    width: '100%',
    height: '100%',
  },
  contactShadow: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(5, 8, 11, 0.3)',
  },
});
