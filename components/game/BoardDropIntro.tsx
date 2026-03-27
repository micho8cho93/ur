import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Image,
  ImageSourcePropType,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  runOnJS,
  SharedValue,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

interface BoardDropFrame {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface BoardDropIntroProps {
  targetFrame: BoardDropFrame;
  boardContent?: React.ReactNode;
  boardContentOffset?: {
    x: number;
    y: number;
  };
  boardSource?: ImageSourcePropType;
  onImpactLead?: () => void;
  onImpact?: () => void;
  onComplete: () => void;
}

interface DustPuffConfig {
  anchorX: number;
  anchorY: number;
  dx: number;
  dy: number;
  width: number;
  height: number;
  rotate: string;
  opacity: number;
}

const measureViewInWindow = (
  view: View | null,
  onMeasured: (x: number, y: number, width: number, height: number) => void,
): void => {
  if (!view) {
    return;
  }

  try {
    view.measureInWindow(onMeasured);
  } catch {
    // Ignore stale-node layout probes during fast remounts.
  }
};

const DUST_PUFFS: DustPuffConfig[] = [
  {
    anchorX: 0.06,
    anchorY: 0.04,
    dx: -18,
    dy: -14,
    width: 28,
    height: 16,
    rotate: "-16deg",
    opacity: 0.18,
  },
  {
    anchorX: 0.22,
    anchorY: 0.03,
    dx: -10,
    dy: -16,
    width: 26,
    height: 14,
    rotate: "-8deg",
    opacity: 0.16,
  },
  {
    anchorX: 0.38,
    anchorY: 0.02,
    dx: -4,
    dy: -14,
    width: 24,
    height: 13,
    rotate: "-3deg",
    opacity: 0.14,
  },
  {
    anchorX: 0.5,
    anchorY: 0.015,
    dx: 0,
    dy: -14,
    width: 24,
    height: 12,
    rotate: "0deg",
    opacity: 0.13,
  },
  {
    anchorX: 0.62,
    anchorY: 0.02,
    dx: 4,
    dy: -14,
    width: 24,
    height: 13,
    rotate: "3deg",
    opacity: 0.14,
  },
  {
    anchorX: 0.78,
    anchorY: 0.03,
    dx: 10,
    dy: -16,
    width: 26,
    height: 14,
    rotate: "8deg",
    opacity: 0.16,
  },
  {
    anchorX: 0.94,
    anchorY: 0.04,
    dx: 18,
    dy: -14,
    width: 28,
    height: 16,
    rotate: "16deg",
    opacity: 0.18,
  },
  {
    anchorX: 0.02,
    anchorY: 0.14,
    dx: -16,
    dy: -10,
    width: 22,
    height: 12,
    rotate: "-24deg",
    opacity: 0.14,
  },
  {
    anchorX: 0.01,
    anchorY: 0.32,
    dx: -18,
    dy: -4,
    width: 24,
    height: 13,
    rotate: "-16deg",
    opacity: 0.16,
  },
  {
    anchorX: 0.0,
    anchorY: 0.5,
    dx: -20,
    dy: 0,
    width: 24,
    height: 14,
    rotate: "-2deg",
    opacity: 0.16,
  },
  {
    anchorX: 0.01,
    anchorY: 0.68,
    dx: -18,
    dy: 4,
    width: 24,
    height: 13,
    rotate: "14deg",
    opacity: 0.16,
  },
  {
    anchorX: 0.02,
    anchorY: 0.86,
    dx: -16,
    dy: 10,
    width: 22,
    height: 12,
    rotate: "24deg",
    opacity: 0.14,
  },
  {
    anchorX: 0.98,
    anchorY: 0.14,
    dx: 16,
    dy: -10,
    width: 22,
    height: 12,
    rotate: "24deg",
    opacity: 0.14,
  },
  {
    anchorX: 0.99,
    anchorY: 0.32,
    dx: 18,
    dy: -4,
    width: 24,
    height: 13,
    rotate: "16deg",
    opacity: 0.16,
  },
  {
    anchorX: 1.0,
    anchorY: 0.5,
    dx: 20,
    dy: 0,
    width: 24,
    height: 14,
    rotate: "2deg",
    opacity: 0.16,
  },
  {
    anchorX: 0.99,
    anchorY: 0.68,
    dx: 18,
    dy: 4,
    width: 24,
    height: 13,
    rotate: "-14deg",
    opacity: 0.16,
  },
  {
    anchorX: 0.98,
    anchorY: 0.86,
    dx: 16,
    dy: 10,
    width: 22,
    height: 12,
    rotate: "-24deg",
    opacity: 0.14,
  },
  {
    anchorX: 0.06,
    anchorY: 0.96,
    dx: -18,
    dy: 14,
    width: 30,
    height: 16,
    rotate: "-16deg",
    opacity: 0.22,
  },
  {
    anchorX: 0.22,
    anchorY: 0.98,
    dx: -10,
    dy: 16,
    width: 28,
    height: 15,
    rotate: "-8deg",
    opacity: 0.2,
  },
  {
    anchorX: 0.38,
    anchorY: 0.995,
    dx: -4,
    dy: 14,
    width: 26,
    height: 14,
    rotate: "-3deg",
    opacity: 0.18,
  },
  {
    anchorX: 0.5,
    anchorY: 1.0,
    dx: 0,
    dy: 14,
    width: 24,
    height: 13,
    rotate: "0deg",
    opacity: 0.17,
  },
  {
    anchorX: 0.62,
    anchorY: 0.995,
    dx: 4,
    dy: 14,
    width: 26,
    height: 14,
    rotate: "3deg",
    opacity: 0.18,
  },
  {
    anchorX: 0.78,
    anchorY: 0.98,
    dx: 10,
    dy: 16,
    width: 28,
    height: 15,
    rotate: "8deg",
    opacity: 0.2,
  },
  {
    anchorX: 0.94,
    anchorY: 0.96,
    dx: 18,
    dy: 14,
    width: 30,
    height: 16,
    rotate: "16deg",
    opacity: 0.22,
  },
];

const IMPACT_AUDIO_LEAD_Y = -900;

const DustPuff: React.FC<{
  frame: BoardDropFrame;
  puff: DustPuffConfig;
  progress: SharedValue<number>;
  visible: boolean;
}> = ({ frame, puff, progress, visible }) => {
  const dustStyle = useAnimatedStyle(() => ({
    opacity: visible ? puff.opacity * progress.value : 0,
    transform: [
      { translateX: puff.dx * progress.value },
      { translateY: puff.dy * progress.value },
      { scaleX: 0.64 + progress.value * 0.86 },
      { scaleY: 0.72 + progress.value * 0.72 },
      { rotateZ: puff.rotate },
    ],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.dustPuff,
        {
          left: frame.x + frame.width * puff.anchorX - puff.width / 2,
          top: frame.y + frame.height * puff.anchorY - puff.height / 2,
          width: puff.width,
          height: puff.height,
        },
        dustStyle,
      ]}
    />
  );
};

export const BoardDropIntro: React.FC<BoardDropIntroProps> = ({
  targetFrame,
  boardContent,
  boardContentOffset,
  boardSource,
  onImpactLead,
  onImpact,
  onComplete,
}) => {
  const overlayRef = useRef<View | null>(null);
  const onImpactLeadRef = useRef(onImpactLead);
  const onImpactRef = useRef(onImpact);
  const onCompleteRef = useRef(onComplete);
  const [overlayOrigin, setOverlayOrigin] = useState({ x: 0, y: 0 });
  const [hasMeasuredOverlay, setHasMeasuredOverlay] = useState(false);
  const { height: viewportHeight } = useWindowDimensions();

  const translateY = useSharedValue(0);
  const rotateZ = useSharedValue(-2.6);
  const impactPulse = useSharedValue(0);
  const impactLeadTriggered = useSharedValue(0);
  const impactTriggered = useSharedValue(0);

  useEffect(() => {
    onImpactLeadRef.current = onImpactLead;
  }, [onImpactLead]);

  useEffect(() => {
    onImpactRef.current = onImpact;
  }, [onImpact]);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const triggerImpactLead = React.useCallback(() => {
    onImpactLeadRef.current?.();
  }, []);

  const triggerImpact = React.useCallback(() => {
    onImpactRef.current?.();
  }, []);

  useAnimatedReaction(
    () => translateY.value,
    (current, previous) => {
      if (previous === null) {
        return;
      }

      if (
        !impactLeadTriggered.value &&
        previous < IMPACT_AUDIO_LEAD_Y &&
        current >= IMPACT_AUDIO_LEAD_Y
      ) {
        impactLeadTriggered.value = 1;
        runOnJS(triggerImpactLead)();
      }

      if (!impactTriggered.value && previous < 0 && current >= 0) {
        impactTriggered.value = 1;
        impactPulse.value = withSequence(
          withTiming(1, { duration: 95, easing: Easing.out(Easing.cubic) }),
          withTiming(0, { duration: 240, easing: Easing.in(Easing.quad) }),
        );
        runOnJS(triggerImpact)();
      }
    },
    [triggerImpact, triggerImpactLead],
  );

  const syncOverlayOrigin = () => {
    requestAnimationFrame(() => {
      measureViewInWindow(overlayRef.current, (x, y) => {
        setOverlayOrigin((previous) =>
          previous.x === x && previous.y === y ? previous : { x, y },
        );
        setHasMeasuredOverlay(true);
      });
    });
  };

  const localTargetFrame = useMemo<BoardDropFrame>(
    () => ({
      x: targetFrame.x - overlayOrigin.x,
      y: targetFrame.y - overlayOrigin.y,
      width: targetFrame.width,
      height: targetFrame.height,
    }),
    [
      overlayOrigin.x,
      overlayOrigin.y,
      targetFrame.height,
      targetFrame.width,
      targetFrame.x,
      targetFrame.y,
    ],
  );

  const startOffset = useMemo(
    () =>
      -Math.max(
        viewportHeight + targetFrame.height * 0.35,
        localTargetFrame.y + localTargetFrame.height + 84,
      ),
    [
      localTargetFrame.height,
      localTargetFrame.y,
      targetFrame.height,
      viewportHeight,
    ],
  );

  useEffect(() => {
    if (
      !hasMeasuredOverlay ||
      targetFrame.width <= 0 ||
      targetFrame.height <= 0
    ) {
      return;
    }

    translateY.value = startOffset;
    rotateZ.value = -2.6;
    impactPulse.value = 0;
    impactLeadTriggered.value = 0;
    impactTriggered.value = 0;

    const finishIntro = () => {
      onCompleteRef.current();
    };

    translateY.value = withSequence(
      withTiming(22, {
        duration: 520,
        easing: Easing.bezier(0.12, 0.84, 0.2, 1),
      }),
      withTiming(-8, {
        duration: 110,
        easing: Easing.out(Easing.quad),
      }),
      withSpring(
        0,
        {
          damping: 13,
          stiffness: 190,
          mass: 0.74,
        },
        (finished) => {
          if (!finished) return;
          runOnJS(finishIntro)();
        },
      ),
    );

    rotateZ.value = withSequence(
      withTiming(0.45, {
        duration: 520,
        easing: Easing.out(Easing.cubic),
      }),
      withTiming(-0.2, {
        duration: 110,
        easing: Easing.out(Easing.quad),
      }),
      withSpring(0, {
        damping: 15,
        stiffness: 210,
        mass: 0.8,
      }),
    );

    return () => {
      cancelAnimation(translateY);
      cancelAnimation(rotateZ);
      cancelAnimation(impactPulse);
      cancelAnimation(impactLeadTriggered);
      cancelAnimation(impactTriggered);
    };
  }, [
    hasMeasuredOverlay,
    impactPulse,
    impactLeadTriggered,
    impactTriggered,
    rotateZ,
    startOffset,
    targetFrame.height,
    targetFrame.width,
    translateY,
  ]);

  const boardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { rotateZ: `${rotateZ.value}deg` },
    ],
  }));

  const shadowStyle = useAnimatedStyle(() => {
    const descentProgress =
      1 -
      Math.min(
        1,
        Math.abs(translateY.value) / Math.max(Math.abs(startOffset), 1),
      );

    return {
      opacity: hasMeasuredOverlay
        ? 0.05 + descentProgress * 0.14 + impactPulse.value * 0.2
        : 0,
      transform: [
        { scaleX: 0.82 + descentProgress * 0.18 + impactPulse.value * 0.08 },
        { scaleY: 0.58 + descentProgress * 0.2 + impactPulse.value * 0.04 },
      ],
    };
  });

  return (
    <View
      ref={overlayRef}
      collapsable={false}
      pointerEvents="none"
      onLayout={syncOverlayOrigin}
      style={styles.overlay}
    >
      <Animated.View
        style={[
          styles.impactShadow,
          {
            left: localTargetFrame.x + localTargetFrame.width * 0.07,
            top: localTargetFrame.y + localTargetFrame.height * 0.88,
            width: localTargetFrame.width * 0.86,
            height: Math.max(18, localTargetFrame.height * 0.11),
            opacity: hasMeasuredOverlay ? 1 : 0,
          },
          shadowStyle,
        ]}
      />

      {DUST_PUFFS.map((puff, index) => (
        <DustPuff
          key={`dust-${index}`}
          frame={localTargetFrame}
          puff={puff}
          progress={impactPulse}
          visible={hasMeasuredOverlay}
        />
      ))}

      <Animated.View
        style={[
          styles.boardWrap,
          {
            left: localTargetFrame.x,
            top: localTargetFrame.y,
            width: localTargetFrame.width,
            height: localTargetFrame.height,
            opacity: hasMeasuredOverlay ? 1 : 0,
          },
          boardStyle,
        ]}
      >
        {boardContent ? (
          <View pointerEvents="none" style={styles.boardContentViewport}>
            <View
              pointerEvents="none"
              style={[
                styles.boardContentOffset,
                {
                  transform: [
                    { translateX: -(boardContentOffset?.x ?? 0) },
                    { translateY: -(boardContentOffset?.y ?? 0) },
                  ],
                },
              ]}
            >
              {boardContent}
            </View>
          </View>
        ) : boardSource ? (
          <Image
            source={boardSource}
            resizeMode="stretch"
            style={styles.boardImage}
          />
        ) : null}
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
    position: "absolute",
  },
  boardContentViewport: {
    width: "100%",
    height: "100%",
    overflow: "visible",
  },
  boardContentOffset: {
    position: "absolute",
    left: 0,
    top: 0,
  },
  boardImage: {
    width: "100%",
    height: "100%",
  },
  impactShadow: {
    position: "absolute",
    borderRadius: 999,
    backgroundColor: "rgba(38, 19, 9, 0.3)",
  },
  dustPuff: {
    position: "absolute",
    borderRadius: 999,
    backgroundColor: "rgba(223, 196, 149, 0.85)",
  },
});
