import React, { useEffect, useRef } from 'react';
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

export interface ReserveCascadePieceTarget {
  key: string;
  color: 'light' | 'dark';
  x: number;
  y: number;
  size: number;
  order: number;
}

interface ReserveCascadeIntroProps {
  pieceTargets: ReserveCascadePieceTarget[];
  visible: boolean;
  onPieceLand?: (landedCount: number) => void;
  onComplete: () => void;
}

const PIECE_SPRITES: Record<'light' | 'dark', ImageSourcePropType> = {
  light: require('../../assets/pieces/piece_light.png'),
  dark: require('../../assets/pieces/piece_dark.png'),
};

const FALL_STAGGER_MS = 210;

const FallingPiece: React.FC<{
  target: ReserveCascadePieceTarget;
  visible: boolean;
  onLanded: () => void;
}> = ({ target, visible, onLanded }) => {
  const progress = useSharedValue(0);
  const landingBounce = useSharedValue(0);

  useEffect(() => {
    if (!visible) {
      progress.value = 0;
      landingBounce.value = 0;
      return;
    }

    progress.value = withDelay(
      target.order * FALL_STAGGER_MS,
      withTiming(1, { duration: 540, easing: Easing.out(Easing.cubic) }, (finished) => {
        if (!finished) return;
        landingBounce.value = withSequence(
          withTiming(1, { duration: 90, easing: Easing.out(Easing.quad) }),
          withSpring(0, {
            damping: 9,
            stiffness: 190,
            mass: 0.45,
          }),
        );
        runOnJS(onLanded)();
      }),
    );
  }, [landingBounce, onLanded, progress, target.order, visible]);

  const pieceStyle = useAnimatedStyle(() => {
    const startY = -Math.max(260, target.y + target.size + 32);
    const y = interpolate(progress.value, [0, 1], [startY, 0]);
    const rotate = interpolate(progress.value, [0, 1], [-12, 0]);
    const bounceY = interpolate(landingBounce.value, [0, 1], [0, -7]);

    return {
      transform: [{ translateY: y + bounceY }, { rotate: `${rotate}deg` }],
      opacity: interpolate(progress.value, [0, 0.12, 1], [0, 1, 1]),
    };
  });

  const shadowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.65, 1], [0, 0.04, 0.2]),
    transform: [
      { scaleX: interpolate(progress.value, [0, 1], [0.62, 1]) },
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
            height: Math.max(4, target.size * 0.15),
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

export const ReserveCascadeIntro: React.FC<ReserveCascadeIntroProps> = ({
  pieceTargets,
  visible,
  onPieceLand,
  onComplete,
}) => {
  const landedCountRef = useRef(0);

  useEffect(() => {
    landedCountRef.current = 0;
  }, [pieceTargets, visible]);

  if (!visible || pieceTargets.length === 0) {
    return null;
  }

  return (
    <View pointerEvents="none" style={styles.overlay}>
      {pieceTargets.map((target) => (
        <FallingPiece
          key={target.key}
          target={target}
          visible={visible}
          onLanded={() => {
            landedCountRef.current += 1;
            onPieceLand?.(landedCountRef.current);
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
