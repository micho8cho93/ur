import React, { useEffect } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

interface BoardDropIntroProps {
  visible: boolean;
  targetX: number;
  targetY: number;
  targetWidth: number;
  targetHeight: number;
  onComplete: () => void;
}

const BOARD_IMAGE = require('../../assets/board/board_design.png');

export const BoardDropIntro: React.FC<BoardDropIntroProps> = ({
  visible,
  targetX,
  targetY,
  targetWidth,
  targetHeight,
  onComplete,
}) => {
  const dropOffsetY = useSharedValue(0);
  const settlePulse = useSharedValue(0);
  const squash = useSharedValue(0);
  const dustBurst = useSharedValue(0);

  useEffect(() => {
    if (!visible) {
      dropOffsetY.value = 0;
      settlePulse.value = 0;
      squash.value = 0;
      dustBurst.value = 0;
      return;
    }

    const startY = -Math.max(targetY + targetHeight + 180, 380);
    dropOffsetY.value = startY;
    settlePulse.value = 0;
    squash.value = 0;
    dustBurst.value = 0;

    dropOffsetY.value = withTiming(16, {
      duration: 420,
      easing: Easing.bezier(0.18, 0.9, 0.34, 1),
    }, (finished) => {
      if (!finished) return;

      settlePulse.value = withSequence(
        withTiming(1, { duration: 90, easing: Easing.out(Easing.quad) }),
        withSpring(0, { damping: 10, stiffness: 250, mass: 0.55 }),
      );
      squash.value = withSequence(
        withTiming(1, { duration: 85, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: 160, easing: Easing.out(Easing.cubic) }),
      );
      dustBurst.value = withSequence(
        withTiming(1, { duration: 210, easing: Easing.out(Easing.cubic) }),
        withTiming(0, { duration: 180, easing: Easing.in(Easing.quad) }),
      );

      dropOffsetY.value = withSequence(
        withSpring(-9, { damping: 12, stiffness: 310, mass: 0.5 }),
        withSpring(0, { damping: 12, stiffness: 260, mass: 0.6 }, (settled) => {
          if (settled) {
            runOnJS(onComplete)();
          }
        }),
      );
    });
  }, [dropOffsetY, dustBurst, onComplete, settlePulse, squash, targetHeight, targetY, visible]);

  const boardStyle = useAnimatedStyle(() => {
    const settleLift = interpolate(settlePulse.value, [0, 1], [0, -5]);
    const squashY = interpolate(squash.value, [0, 1], [1, 0.93]);
    const squashX = interpolate(squash.value, [0, 1], [1, 1.035]);

    return {
      transform: [
        { translateY: dropOffsetY.value + settleLift },
        { scaleX: squashX },
        { scaleY: squashY },
      ],
      opacity: interpolate(dropOffsetY.value, [-360, -80, 0], [0.2, 1, 1]),
    };
  });

  const shadowStyle = useAnimatedStyle(() => {
    const landingProgress = interpolate(dropOffsetY.value, [-360, 0], [0, 1]);
    const dustLift = interpolate(dustBurst.value, [0, 1], [0, -3]);

    return {
      opacity: interpolate(landingProgress, [0, 1], [0.06, 0.3]),
      transform: [
        { translateY: dustLift },
        { scaleX: interpolate(landingProgress, [0, 1], [1.4, 0.9]) },
        { scaleY: interpolate(landingProgress, [0, 1], [1.12, 0.72]) },
      ],
      backgroundColor: `rgba(18, 13, 10, ${interpolate(landingProgress, [0, 1], [0.18, 0.48])})`,
    };
  });

  const dustStyle = useAnimatedStyle(() => ({
    opacity: interpolate(dustBurst.value, [0, 0.2, 1], [0, 0.75, 0]),
    transform: [
      { translateY: interpolate(dustBurst.value, [0, 1], [2, -10]) },
      { scaleX: interpolate(dustBurst.value, [0, 1], [0.55, 1.14]) },
      { scaleY: interpolate(dustBurst.value, [0, 1], [0.45, 0.92]) },
    ],
  }));

  if (!visible) {
    return null;
  }

  return (
    <View pointerEvents="none" style={styles.overlay}>
      <View
        style={[
          styles.boardAnchor,
          {
            left: targetX,
            top: targetY,
            width: targetWidth,
            height: targetHeight,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.impactShadow,
            shadowStyle,
            {
              width: targetWidth * 0.76,
              height: Math.max(16, targetHeight * 0.08),
              bottom: Math.max(6, targetHeight * 0.02),
            },
          ]}
        />

        <Animated.View
          style={[
            styles.dustBurst,
            dustStyle,
            {
              width: targetWidth * 1.3,
              height: Math.max(22, targetHeight * 0.16),
              bottom: Math.max(4, targetHeight * 0.01),
            },
          ]}
        />

        <Animated.View style={[styles.boardWrap, boardStyle]}>
          <Image source={BOARD_IMAGE} resizeMode="contain" style={styles.boardImage} />
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 60,
  },
  boardAnchor: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  boardWrap: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  boardImage: {
    width: '100%',
    height: '100%',
  },
  impactShadow: {
    position: 'absolute',
    borderRadius: 999,
  },
  dustBurst: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(188, 163, 131, 0.5)',
    borderColor: 'rgba(136, 111, 84, 0.45)',
    borderWidth: 1,
  },
});
