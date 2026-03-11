import React, { useEffect } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  SharedValue,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

const BOARD_IMAGE = require('../../assets/board/board_design.png');

interface BoardFrame {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface BoardDropIntroProps {
  targetFrame: BoardFrame;
  onImpact?: () => void;
  onComplete: () => void;
}

interface DustEmitter {
  x: number;
  y: number;
  dx: number;
  dy: number;
}

const DUST_EMITTERS: DustEmitter[] = [
  { x: 0.12, y: 0.12, dx: -14, dy: -10 },
  { x: 0.88, y: 0.12, dx: 14, dy: -10 },
  { x: 0.12, y: 0.88, dx: -14, dy: 8 },
  { x: 0.88, y: 0.88, dx: 14, dy: 8 },
  { x: 0.02, y: 0.5, dx: -16, dy: 0 },
  { x: 0.98, y: 0.5, dx: 16, dy: 0 },
];

const DustPuff: React.FC<{ emitter: DustEmitter; frame: BoardFrame; progress: SharedValue<number> }> = ({
  emitter,
  frame,
  progress,
}) => {
  const dustStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.15, 1], [0, 0.18, 0]),
    transform: [
      { translateX: interpolate(progress.value, [0, 1], [0, emitter.dx]) },
      { translateY: interpolate(progress.value, [0, 1], [0, emitter.dy]) },
      { scale: interpolate(progress.value, [0, 1], [0.4, 1.25]) },
    ],
  }));

  return (
    <Animated.View
      style={[
        styles.dust,
        dustStyle,
        {
          left: frame.x + frame.width * emitter.x - frame.width * 0.075,
          top: frame.y + frame.height * emitter.y - frame.height * 0.06,
          width: frame.width * 0.15,
          height: frame.height * 0.12,
        },
      ]}
    />
  );
};

export const BoardDropIntro: React.FC<BoardDropIntroProps> = ({ targetFrame, onImpact, onComplete }) => {
  const dropProgress = useSharedValue(0);
  const settleProgress = useSharedValue(0);
  const impactProgress = useSharedValue(0);

  useEffect(() => {
    dropProgress.value = 0;
    settleProgress.value = 0;
    impactProgress.value = 0;

    dropProgress.value = withTiming(1, { duration: 420, easing: Easing.in(Easing.cubic) }, (finished) => {
      if (!finished) return;
      settleProgress.value = withSequence(
        withTiming(1, { duration: 90, easing: Easing.out(Easing.cubic) }, (impactFinished) => {
          if (!impactFinished) return;
          impactProgress.value = withTiming(1, { duration: 320, easing: Easing.out(Easing.cubic) });
          if (onImpact) {
            runOnJS(onImpact)();
          }
        }),
        withSpring(0, { damping: 12, stiffness: 210, mass: 0.5 }, (settled) => {
          if (settled) {
            runOnJS(onComplete)();
          }
        }),
      );
    });
  }, [dropProgress, impactProgress, onComplete, onImpact, settleProgress]);

  const boardStyle = useAnimatedStyle(() => {
    const startY = -targetFrame.y - targetFrame.height - 160;
    const dropY = interpolate(dropProgress.value, [0, 1], [startY, 0]);
    const settleY = interpolate(settleProgress.value, [0, 1], [0, 14]);
    const compression = settleProgress.value;

    return {
      transform: [
        { translateY: dropY + settleY },
        { scaleX: 1 + compression * 0.04 },
        { scaleY: 1 - compression * 0.05 },
        { rotate: `${interpolate(settleProgress.value, [0, 1], [0.6, 0])}deg` },
      ],
    };
  });

  const shadowStyle = useAnimatedStyle(() => {
    const shadowDrop = interpolate(dropProgress.value, [0, 1], [0.2, 0.5]);
    const impactBoost = interpolate(settleProgress.value, [0, 1], [0, 0.2]);
    const dustFade = interpolate(impactProgress.value, [0, 1], [1, 0.7]);

    return {
      opacity: (shadowDrop + impactBoost) * dustFade,
      transform: [
        { scaleX: interpolate(dropProgress.value, [0, 1], [1.38, 1.02]) + settleProgress.value * 0.08 },
        { scaleY: interpolate(dropProgress.value, [0, 1], [1.18, 0.94]) + settleProgress.value * 0.04 },
      ],
    };
  });

  return (
    <View pointerEvents="none" style={styles.overlay}>
      <Animated.View
        style={[
          styles.shadow,
          shadowStyle,
          {
            left: targetFrame.x + targetFrame.width * 0.16,
            top: targetFrame.y + targetFrame.height * 0.83,
            width: targetFrame.width * 0.68,
            height: Math.max(10, targetFrame.height * 0.09),
          },
        ]}
      />

      {DUST_EMITTERS.map((emitter, index) => (
        <DustPuff key={`dust-${index}`} emitter={emitter} frame={targetFrame} progress={impactProgress} />
      ))}

      <Animated.View
        style={[
          styles.boardWrap,
          boardStyle,
          {
            left: targetFrame.x,
            top: targetFrame.y,
            width: targetFrame.width,
            height: targetFrame.height,
          },
        ]}
      >
        <Image source={BOARD_IMAGE} resizeMode="contain" style={styles.boardImage} />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 40,
  },
  boardWrap: {
    position: 'absolute',
  },
  boardImage: {
    width: '100%',
    height: '100%',
  },
  shadow: {
    position: 'absolute',
    backgroundColor: 'rgba(18, 12, 8, 0.42)',
    borderRadius: 999,
  },
  dust: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(224, 212, 188, 0.55)',
  },
});
