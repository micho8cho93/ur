import { boxShadow } from '@/constants/styleEffects';
import { urTheme } from '@/constants/urTheme';
import React, { memo, useEffect, useMemo, useRef } from 'react';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  interpolate,
  runOnJS,
  useAnimatedProps,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, {
  ClipPath,
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Path,
  Rect,
  Stop,
} from 'react-native-svg';

const AnimatedRect = Animated.createAnimatedComponent(Rect);
const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);

const VIEWBOX_WIDTH = 100;
const VIEWBOX_HEIGHT = 156;
const TOP_FILL_BOUNDS = { x: 28, y: 24, width: 44, height: 45 };
const BOTTOM_FILL_BOUNDS = { x: 28, y: 91, width: 44, height: 44 };
const STREAM_FRAME = { x: 49, y: 69, width: 2, height: 22 };
const COMPLETE_EPSILON = 0.999;

const clamp = (value: number) => Math.min(Math.max(value, 0), 1);

export interface HourglassTimerProps {
  durationMs: number;
  remainingMs?: number;
  isRunning?: boolean;
  progress?: number;
  onComplete?: () => void;
  size?: number;
  style?: StyleProp<ViewStyle>;
  warningThreshold?: number;
}

const HourglassTimerComponent: React.FC<HourglassTimerProps> = ({
  durationMs,
  remainingMs,
  isRunning = true,
  progress,
  onComplete,
  size = 56,
  style,
  warningThreshold = 0.22,
}) => {
  // Prefer controlled mode when the match layer already knows true remaining time.
  const controlledProgress = useMemo(() => {
    if (typeof progress === 'number') {
      return clamp(progress);
    }

    if (typeof remainingMs === 'number' && durationMs > 0) {
      return clamp(1 - remainingMs / durationMs);
    }

    return null;
  }, [durationMs, progress, remainingMs]);
  const height = size * (VIEWBOX_HEIGHT / VIEWBOX_WIDTH);
  const completionRef = useRef(false);

  const progressValue = useSharedValue(controlledProgress ?? 0);
  const runningValue = useSharedValue(isRunning ? 1 : 0);
  const warningPulse = useSharedValue(0);
  const streamPulse = useSharedValue(0.35);

  useEffect(() => {
    runningValue.value = isRunning ? 1 : 0;
  }, [isRunning, runningValue]);

  useEffect(() => {
    if (controlledProgress !== null) {
      if (controlledProgress < COMPLETE_EPSILON) {
        completionRef.current = false;
      }

      const delta = Math.abs(controlledProgress - progressValue.value);
      progressValue.value = withTiming(controlledProgress, {
        duration: Math.max(90, Math.min(320, Math.round(delta * durationMs || 180))),
        easing: Easing.out(Easing.cubic),
      });
      return;
    }

    // Uncontrolled mode is a simple local visual cycle: animate from the current fill level to empty.
    cancelAnimation(progressValue);
    if (!isRunning) {
      return;
    }

    if (progressValue.value < COMPLETE_EPSILON) {
      completionRef.current = false;
    }

    progressValue.value = withTiming(1, {
      duration: Math.max(0, Math.round((1 - progressValue.value) * durationMs)),
      easing: Easing.linear,
    });

    return () => {
      cancelAnimation(progressValue);
    };
  }, [controlledProgress, durationMs, isRunning, progressValue]);

  useEffect(() => {
    if (!isRunning) {
      cancelAnimation(streamPulse);
      streamPulse.value = withTiming(0.25, { duration: 120 });
      return;
    }

    streamPulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 280, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.35, { duration: 280, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      true,
    );

    return () => {
      cancelAnimation(streamPulse);
    };
  }, [isRunning, streamPulse]);

  const handleComplete = React.useCallback(() => {
    if (completionRef.current) {
      return;
    }

    completionRef.current = true;
    onComplete?.();
  }, [onComplete]);

  useAnimatedReaction(
    () => progressValue.value >= COMPLETE_EPSILON,
    (isComplete, wasComplete) => {
      if (isComplete && !wasComplete) {
        runOnJS(handleComplete)();
      }
    },
    [handleComplete],
  );

  useAnimatedReaction(
    () => runningValue.value > 0.5 && progressValue.value < COMPLETE_EPSILON && 1 - progressValue.value <= warningThreshold,
    (isWarning, wasWarning) => {
      if (isWarning === wasWarning) {
        return;
      }

      if (isWarning) {
        warningPulse.value = withRepeat(
          withSequence(
            withTiming(1, { duration: 620, easing: Easing.inOut(Easing.quad) }),
            withTiming(0, { duration: 620, easing: Easing.inOut(Easing.quad) }),
          ),
          -1,
          false,
        );
        return;
      }

      cancelAnimation(warningPulse);
      warningPulse.value = withTiming(0, { duration: 180 });
    },
    [warningThreshold],
  );

  // Progress maps directly to sand transfer: 0 = full top chamber, 1 = full bottom chamber.
  const topSandAnimatedProps = useAnimatedProps(() => {
    const fill = TOP_FILL_BOUNDS.height * (1 - progressValue.value);
    return {
      y: TOP_FILL_BOUNDS.y + TOP_FILL_BOUNDS.height - fill,
      height: Math.max(fill, 0),
      opacity: fill <= 0.5 ? 0 : 1,
    };
  });

  const bottomSandAnimatedProps = useAnimatedProps(() => {
    const fill = BOTTOM_FILL_BOUNDS.height * progressValue.value;
    return {
      y: BOTTOM_FILL_BOUNDS.y + BOTTOM_FILL_BOUNDS.height - fill,
      height: Math.max(fill, 0),
      opacity: fill <= 0.5 ? 0 : 1,
    };
  });

  const topSurfaceAnimatedProps = useAnimatedProps(() => {
    const fill = TOP_FILL_BOUNDS.height * (1 - progressValue.value);
    return {
      cy: TOP_FILL_BOUNDS.y + TOP_FILL_BOUNDS.height - fill + 1.25,
      ry: fill <= 1 ? 0 : 2.1,
      opacity: fill <= 1 ? 0 : 0.52,
    };
  });

  const bottomSurfaceAnimatedProps = useAnimatedProps(() => {
    const fill = BOTTOM_FILL_BOUNDS.height * progressValue.value;
    return {
      cy: BOTTOM_FILL_BOUNDS.y + BOTTOM_FILL_BOUNDS.height - Math.min(fill, 5),
      ry: fill <= 1 ? 0 : Math.min(4.8, 1.2 + fill * 0.08),
      opacity: fill <= 1 ? 0 : 0.58,
    };
  });

  const streamAnimatedProps = useAnimatedProps(() => {
    const hasSand = progressValue.value < 0.985;
    const active = runningValue.value > 0.5 && hasSand;
    const shimmer = 0.82 + streamPulse.value * 0.18;
    return {
      y: STREAM_FRAME.y + (1 - streamPulse.value) * 1.2,
      height: STREAM_FRAME.height * shimmer,
      opacity: active ? 0.38 + streamPulse.value * 0.42 : 0,
    };
  });

  const streamSplashAnimatedProps = useAnimatedProps(() => {
    const hasSand = progressValue.value < 0.985;
    const active = runningValue.value > 0.5 && hasSand;
    return {
      cy: 92 + streamPulse.value * 1.4,
      ry: active ? 1.1 + streamPulse.value * 1.2 : 0,
      opacity: active ? 0.28 + streamPulse.value * 0.24 : 0,
    };
  });

  const wrapperAnimatedStyle = useAnimatedStyle(() => {
    const warningAmount =
      runningValue.value > 0.5 && progressValue.value < COMPLETE_EPSILON && 1 - progressValue.value <= warningThreshold
        ? warningPulse.value
        : 0;

    return {
      transform: [
        { scale: 1 + warningAmount * 0.035 },
        { rotateZ: `${interpolate(warningAmount, [0, 0.5, 1], [0, -0.7, 0.7])}deg` },
      ],
    };
  });

  const glowAnimatedStyle = useAnimatedStyle(() => {
    const warningAmount =
      runningValue.value > 0.5 && progressValue.value < COMPLETE_EPSILON && 1 - progressValue.value <= warningThreshold
        ? warningPulse.value
        : 0;

    return {
      opacity: 0.1 + warningAmount * 0.22,
      transform: [{ scale: 0.92 + warningAmount * 0.12 }],
    };
  });

  const shadowAnimatedStyle = useAnimatedStyle(() => ({
    opacity: 0.16 + (1 - progressValue.value) * 0.08,
  }));

  return (
    <Animated.View
      style={[
        styles.root,
        { width: size, height },
        wrapperAnimatedStyle,
        style,
      ]}
      accessibilityRole="image"
      accessibilityLabel="Turn timer hourglass"
    >
      <Animated.View
        pointerEvents="none"
        style={[
          styles.shadowHalo,
          {
            left: size * 0.18,
            right: size * 0.18,
            top: height * 0.24,
            bottom: height * 0.16,
          },
          shadowAnimatedStyle,
        ]}
      />
      <Animated.View
        pointerEvents="none"
        style={[
          styles.warningGlow,
          {
            left: size * 0.12,
            right: size * 0.12,
            top: height * 0.15,
            bottom: height * 0.08,
          },
          glowAnimatedStyle,
        ]}
      />

      <Svg width={size} height={height} viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}>
        <Defs>
          <LinearGradient id="hourglassFrameGold" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#F6D37A" />
            <Stop offset="0.46" stopColor={urTheme.colors.gold} />
            <Stop offset="1" stopColor={urTheme.colors.amber} />
          </LinearGradient>
          <LinearGradient id="hourglassWood" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#80512F" />
            <Stop offset="1" stopColor="#4F2A15" />
          </LinearGradient>
          <LinearGradient id="hourglassGlass" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="rgba(255,255,255,0.42)" />
            <Stop offset="0.65" stopColor="rgba(224,232,236,0.18)" />
            <Stop offset="1" stopColor="rgba(194,208,214,0.28)" />
          </LinearGradient>
          <LinearGradient id="hourglassSand" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#F7E0A5" />
            <Stop offset="0.52" stopColor={urTheme.colors.sand} />
            <Stop offset="1" stopColor="#B7873A" />
          </LinearGradient>
          <ClipPath id="topChamberClip">
            <Path d="M50 23 C69 23 73 42 64 55 C59 62 55 66 50 72 C45 66 41 62 36 55 C27 42 31 23 50 23 Z" />
          </ClipPath>
          <ClipPath id="bottomChamberClip">
            <Path d="M50 84 C55 90 59 95 64 102 C73 115 69 136 50 136 C31 136 27 115 36 102 C41 95 45 90 50 84 Z" />
          </ClipPath>
        </Defs>

        <Path
          d="M50 18 C72 18 79 39 69 56 C63 65 57 71 50 80 C43 71 37 65 31 56 C21 39 28 18 50 18 Z M50 80 C57 89 63 95 69 104 C79 121 72 142 50 142 C28 142 21 121 31 104 C37 95 43 89 50 80 Z"
          fill="url(#hourglassGlass)"
          stroke="rgba(241, 246, 247, 0.82)"
          strokeWidth="2.2"
        />

        <G clipPath="url(#topChamberClip)">
          <AnimatedRect
            x={TOP_FILL_BOUNDS.x}
            width={TOP_FILL_BOUNDS.width}
            fill="url(#hourglassSand)"
            animatedProps={topSandAnimatedProps}
          />
          <AnimatedEllipse
            cx={50}
            rx={17}
            fill="rgba(255, 241, 205, 0.86)"
            animatedProps={topSurfaceAnimatedProps}
          />
        </G>

        <G clipPath="url(#bottomChamberClip)">
          <AnimatedRect
            x={BOTTOM_FILL_BOUNDS.x}
            width={BOTTOM_FILL_BOUNDS.width}
            fill="url(#hourglassSand)"
            animatedProps={bottomSandAnimatedProps}
          />
          <AnimatedEllipse
            cx={50}
            rx={16}
            fill="rgba(255, 241, 205, 0.82)"
            animatedProps={bottomSurfaceAnimatedProps}
          />
        </G>

        <AnimatedRect
          x={STREAM_FRAME.x}
          width={STREAM_FRAME.width}
          rx={1}
          fill="#F7E0A5"
          animatedProps={streamAnimatedProps}
        />
        <AnimatedEllipse
          cx={50}
          rx={4.8}
          fill="rgba(247, 224, 165, 0.9)"
          animatedProps={streamSplashAnimatedProps}
        />

        <Path
          d="M39 26 C30 40 35 57 50 72 M61 26 C70 40 65 57 50 72 M39 132 C30 118 35 101 50 84 M61 132 C70 118 65 101 50 84"
          stroke="rgba(255,255,255,0.38)"
          strokeWidth="1.8"
          strokeLinecap="round"
          fill="none"
        />
        <Ellipse cx={41} cy={42} rx={6} ry={12} fill="rgba(255,255,255,0.16)" transform="rotate(18 41 42)" />
        <Ellipse cx={59} cy={106} rx={6} ry={14} fill="rgba(255,255,255,0.14)" transform="rotate(-16 59 106)" />

        {/* Swap these SVG shapes if bespoke frame art lands later; the sand layers can stay unchanged. */}
        <G>
          <Path
            d="M13 18 C11 24 11 34 13 40 L13 118 C11 124 11 134 13 140 L22 140 C24 134 24 124 22 118 L22 40 C24 34 24 24 22 18 Z"
            fill="url(#hourglassFrameGold)"
            stroke={urTheme.colors.cedar}
            strokeWidth="1.4"
          />
          <Rect x={16} y={18} width={3.2} height={122} rx={1.6} fill="rgba(255, 241, 205, 0.42)" />
          <Path d="M14.5 29 C19 33 19 43 14.5 47 M14.5 58 C19 62 19 72 14.5 76 M14.5 88 C19 92 19 102 14.5 106" stroke="rgba(91, 43, 18, 0.42)" strokeWidth="1.4" strokeLinecap="round" fill="none" />

          <Path
            d="M78 18 C76 24 76 34 78 40 L78 118 C76 124 76 134 78 140 L87 140 C89 134 89 124 87 118 L87 40 C89 34 89 24 87 18 Z"
            fill="url(#hourglassFrameGold)"
            stroke={urTheme.colors.cedar}
            strokeWidth="1.4"
          />
          <Rect x={81} y={18} width={3.2} height={122} rx={1.6} fill="rgba(255, 241, 205, 0.42)" />
          <Path d="M79.5 29 C84 33 84 43 79.5 47 M79.5 58 C84 62 84 72 79.5 76 M79.5 88 C84 92 84 102 79.5 106" stroke="rgba(91, 43, 18, 0.42)" strokeWidth="1.4" strokeLinecap="round" fill="none" />

          <Ellipse cx={17.5} cy={15.5} rx={6} ry={4.5} fill="url(#hourglassFrameGold)" stroke={urTheme.colors.cedar} strokeWidth="1.1" />
          <Ellipse cx={82.5} cy={15.5} rx={6} ry={4.5} fill="url(#hourglassFrameGold)" stroke={urTheme.colors.cedar} strokeWidth="1.1" />
          <Ellipse cx={17.5} cy={141} rx={6} ry={4.5} fill="url(#hourglassFrameGold)" stroke={urTheme.colors.cedar} strokeWidth="1.1" />
          <Ellipse cx={82.5} cy={141} rx={6} ry={4.5} fill="url(#hourglassFrameGold)" stroke={urTheme.colors.cedar} strokeWidth="1.1" />

          <Path d="M16 9 H84 C90 9 94 13 94 18 V20 C94 25 90 29 84 29 H16 C10 29 6 25 6 20 V18 C6 13 10 9 16 9 Z" fill="url(#hourglassFrameGold)" stroke={urTheme.colors.cedar} strokeWidth="1.5" />
          <Rect x={12} y={13.5} width={76} height={4.8} rx={2.4} fill="rgba(255, 244, 215, 0.36)" />
          <Rect x={11} y={21.5} width={78} height={3.2} rx={1.6} fill="url(#hourglassWood)" opacity={0.74} />
          <Path d="M18 23 C22 20 26 26 30 23 S38 20 42 23 S50 26 54 23 S62 20 66 23 S74 26 78 23" stroke="rgba(255, 217, 132, 0.66)" strokeWidth="1.2" fill="none" strokeLinecap="round" />

          <Path d="M16 127 H84 C90 127 94 131 94 136 V138 C94 143 90 147 84 147 H16 C10 147 6 143 6 138 V136 C6 131 10 127 16 127 Z" fill="url(#hourglassFrameGold)" stroke={urTheme.colors.cedar} strokeWidth="1.5" />
          <Rect x={12} y={131.5} width={76} height={4.8} rx={2.4} fill="rgba(255, 244, 215, 0.36)" />
          <Rect x={11} y={139.5} width={78} height={3.2} rx={1.6} fill="url(#hourglassWood)" opacity={0.74} />
          <Path d="M18 141 C22 138 26 144 30 141 S38 138 42 141 S50 144 54 141 S62 138 66 141 S74 144 78 141" stroke="rgba(255, 217, 132, 0.66)" strokeWidth="1.2" fill="none" strokeLinecap="round" />
        </G>
      </Svg>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  shadowHalo: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(44, 21, 10, 0.28)',
    ...boxShadow({
      color: '#2A1208',
      opacity: 0.22,
      blurRadius: 12,
      elevation: 4,
    }),
  },
  warningGlow: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(240, 192, 64, 0.18)',
    ...boxShadow({
      color: urTheme.colors.goldGlow,
      opacity: 0.26,
      blurRadius: 14,
      elevation: 5,
    }),
  },
});

export const HourglassTimer = memo(HourglassTimerComponent);
