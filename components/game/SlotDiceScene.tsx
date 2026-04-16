import { boxShadow } from '@/constants/styleEffects';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  ImageSourcePropType,
  LayoutChangeEvent,
  StyleSheet,
  View,
} from 'react-native';
import Svg, {
  Defs,
  Ellipse,
  LinearGradient,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';
import {
  buildJackpotPulseOrder,
  buildSlotDiceFaces,
  DEFAULT_DICE_ROLL_DURATION_MS,
  SLOT_DICE_COUNT,
  SLOT_DICE_JACKPOT_VALUE,
  SLOT_DICE_SPIN_STEP_MS,
  SLOT_DICE_SPIN_STEP_VARIANCE_MS,
  SLOT_DICE_STOP_SETTLE_MS,
  SLOT_DICE_STOP_STAGGER_MS,
  SLOT_DICE_TIMING_SCALE,
  SLOT_DICE_TOTAL_STOP_MS,
  type SlotDiceVariant,
} from './slotDiceShared';

const DICE_MARKED = require('../../assets/dice/dice_marked.png');
const DICE_UNMARKED = require('../../assets/dice/dice_unmarked.png');

const ALL_REELS_SPINNING = Array.from({ length: SLOT_DICE_COUNT }, () => true);
const ALL_REELS_STOPPED = Array.from({ length: SLOT_DICE_COUNT }, () => false);
const SLOT_REEL_DECELERATE_EASING = Easing.bezier(0.14, 0.78, 0.2, 1);
const SLOT_REEL_LANDING_EASING = Easing.out(Easing.quad);
const scaleDuration = (durationMs: number) => Math.round(durationMs * SLOT_DICE_TIMING_SCALE);
const SPIN_STRIP_LEAD_STEPS = 12;
const SPIN_STRIP_TAIL_STEPS = 12;
const SPIN_LOOP_TRAVEL_STEPS = 5;
const SPIN_STRIP_START_STEP = SPIN_STRIP_LEAD_STEPS;
const SETTLED_STRIP_STEP = SPIN_STRIP_START_STEP + SPIN_LOOP_TRAVEL_STEPS + 2;
const MIN_STOP_TRAVEL_STEPS = 3.4;
const LANDING_DROP_STEP_OFFSET = 0.2;
const LANDING_DROP_DURATION_MS = scaleDuration(108);
const SPIN_PHASE_TRIM_MS = scaleDuration(96);
const CONTINUOUS_SPIN_BUFFER_MS = scaleDuration(140);
const STOP_COMPLETION_BUFFER_MS = scaleDuration(140);
const MIN_REEL_BOX_SIZE = 28;
const FRAME_MIN_PADDING = 6;
const JACKPOT_PULSE_LEAD_MS = scaleDuration(72);
const JACKPOT_PULSE_STAGGER_MS = scaleDuration(124);
const JACKPOT_PULSE_RISE_MS = scaleDuration(168);
const JACKPOT_PULSE_FALL_MS = scaleDuration(236);

type SlotDiceSceneProps = {
  diceImageScale?: number;
  durationMs?: number;
  markedDieSource?: ImageSourcePropType;
  onSettled?: () => void;
  orientation?: 'horizontal' | 'vertical';
  playbackId: number;
  presentation?: 'embedded' | 'stage';
  rollValue: number | null;
  size?: number;
  unmarkedDieSource?: ImageSourcePropType;
  variant?: SlotDiceVariant;
};

type SlotReelProps = {
  boxSize: number;
  durationMs: number;
  imageSize: number;
  index: number;
  jackpotPulseDelayMs: number;
  jackpotPulseToken: number;
  markedDieSource: ImageSourcePropType;
  onStopComplete?: (index: number) => void;
  playbackId: number;
  presentation: 'embedded' | 'stage';
  spinning: boolean;
  targetMarked: boolean;
  unmarkedDieSource: ImageSourcePropType;
  variant: SlotDiceVariant;
};

const getStripAlignmentOffset = (viewportInset: number) => -viewportInset;

const clearTimer = (timer: ReturnType<typeof setTimeout> | null) => {
  if (timer !== null) {
    clearTimeout(timer);
  }
};

const getStripMarkedForStep = (step: number, spinSeedMarked: boolean) =>
  step % 2 === 0 ? spinSeedMarked : !spinSeedMarked;

const getSettledStripStep = (targetMarked: boolean, spinSeedMarked: boolean) => {
  const targetParity = targetMarked === spinSeedMarked ? 0 : 1;
  return SETTLED_STRIP_STEP % 2 === targetParity ? SETTLED_STRIP_STEP : SETTLED_STRIP_STEP + 1;
};

const getSettledStripOffset = (targetMarked: boolean, spinSeedMarked: boolean, boxSize: number) =>
  -getSettledStripStep(targetMarked, spinSeedMarked) * boxSize;

const getSpinStepDuration = (index: number) =>
  SLOT_DICE_SPIN_STEP_MS + index * SLOT_DICE_SPIN_STEP_VARIANCE_MS;

const getContinuousSpinTravelSteps = (durationMs: number, index: number) => {
  const stepDuration = getSpinStepDuration(index);
  const spinWindowMs = Math.max(
    stepDuration,
    durationMs - SLOT_DICE_STOP_SETTLE_MS - SPIN_PHASE_TRIM_MS + CONTINUOUS_SPIN_BUFFER_MS,
  );

  return Math.max(
    SPIN_LOOP_TRAVEL_STEPS,
    Math.ceil(spinWindowMs / Math.max(stepDuration, 1)) + 4,
  );
};

const SlotReel: React.FC<SlotReelProps> = ({
  boxSize,
  durationMs,
  imageSize,
  index,
  jackpotPulseDelayMs,
  jackpotPulseToken,
  markedDieSource,
  onStopComplete,
  playbackId,
  presentation,
  spinning,
  targetMarked,
  unmarkedDieSource,
  variant,
}) => {
  const spinSeedMarked = (playbackId + index) % 2 === 0;
  const reelBorderRadius = Math.max(14, boxSize * 0.28);
  const reelViewportInset = Math.max(3, Math.round(boxSize * 0.08));
  const reelViewportRadius = Math.max(10, reelBorderRadius - reelViewportInset * 1.28);
  const stripAlignmentOffset = getStripAlignmentOffset(reelViewportInset);
  const spinTravelSteps = useMemo(
    () => getContinuousSpinTravelSteps(durationMs, index),
    [durationMs, index],
  );
  const spinStripFaceCount = SPIN_STRIP_START_STEP + spinTravelSteps + SPIN_STRIP_TAIL_STEPS;
  const initialStripStep =
    variant === 'start' ? 0 : getSettledStripStep(targetMarked, spinSeedMarked);
  const initialStripOffset =
    variant === 'start'
      ? stripAlignmentOffset
      : getSettledStripOffset(targetMarked, spinSeedMarked, boxSize) + stripAlignmentOffset;
  const spinOffset = useRef(new Animated.Value(initialStripOffset)).current;
  const jackpotGlow = useRef(new Animated.Value(0)).current;
  const spinOffsetValueRef = useRef(initialStripOffset);
  const settleAnimationRef = useRef<Animated.CompositeAnimation | null>(null);
  const spinAnimationRef = useRef<Animated.CompositeAnimation | null>(null);
  const jackpotAnimationRef = useRef<Animated.CompositeAnimation | null>(null);
  const spinStateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const jackpotTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previousSpinningRef = useRef(spinning);
  const latestSpinningRef = useRef(spinning);
  const settledStripStepRef = useRef<number | null>(variant === 'start' ? null : initialStripStep);
  const [currentStripStep, setCurrentStripStep] = useState(initialStripStep);
  const [visibleMarked, setVisibleMarked] = useState(variant === 'start' ? false : targetMarked);
  latestSpinningRef.current = spinning;

  useEffect(() => {
    const listenerId = spinOffset.addListener(({ value }) => {
      spinOffsetValueRef.current = value;
    });

    return () => {
      spinOffset.removeListener(listenerId);
    };
  }, [spinOffset]);

  const spinStripFaces = useMemo(
    () =>
      Array.from({ length: spinStripFaceCount }, (_, faceIndex) =>
        getStripMarkedForStep(faceIndex, spinSeedMarked),
      ),
    [spinSeedMarked, spinStripFaceCount],
  );

  const dieArtStyle = useMemo(
    () => ({
      height: imageSize,
      width: imageSize,
      ...boxShadow({
        color: '#000000',
        opacity: presentation === 'stage' ? 0.3 : 0.22,
        offset: { width: 0, height: Math.max(2, Math.round(imageSize * 0.05)) },
        blurRadius: Math.max(4, Math.round(imageSize * 0.14)),
        elevation: 3,
      }),
    }),
    [boxSize, imageSize, presentation],
  );

  const clearSpinStateTimer = useCallback(() => {
    clearTimer(spinStateTimerRef.current);
    spinStateTimerRef.current = null;
  }, []);

  const clearJackpotTimer = useCallback(() => {
    clearTimer(jackpotTimerRef.current);
    jackpotTimerRef.current = null;
  }, []);

  const stopSpinLoop = useCallback(() => {
    clearSpinStateTimer();
    spinAnimationRef.current?.stop();
    spinAnimationRef.current = null;
    spinOffset.stopAnimation();
  }, [clearSpinStateTimer, spinOffset]);

  const stopSettleAnimation = useCallback(() => {
    settleAnimationRef.current?.stop();
    settleAnimationRef.current = null;
  }, []);

  const stopJackpotAnimation = useCallback(() => {
    clearJackpotTimer();
    jackpotAnimationRef.current?.stop();
    jackpotAnimationRef.current = null;
    jackpotGlow.stopAnimation();
    jackpotGlow.setValue(0);
  }, [clearJackpotTimer, jackpotGlow]);

  const stopAllAnimations = useCallback(() => {
    stopSpinLoop();
    stopSettleAnimation();
    stopJackpotAnimation();
  }, [stopJackpotAnimation, stopSettleAnimation, stopSpinLoop]);

  const syncReel = useCallback(
    (nextMarked: boolean, nextVariant: SlotDiceVariant) => {
      stopAllAnimations();
      setVisibleMarked(nextMarked);
      const nextStep =
        nextVariant === 'start'
          ? 0
          : settledStripStepRef.current ?? getSettledStripStep(nextMarked, spinSeedMarked);
      settledStripStepRef.current = nextVariant === 'start' ? null : nextStep;
      setCurrentStripStep(nextStep);
      const nextOffset =
        nextVariant === 'start'
          ? stripAlignmentOffset
          : -nextStep * boxSize + stripAlignmentOffset;
      spinOffset.setValue(nextOffset);
      spinOffsetValueRef.current = nextOffset;
    },
    [boxSize, spinOffset, spinSeedMarked, stopAllAnimations, stripAlignmentOffset],
  );

  const startSpinLoop = useCallback(() => {
    stopSpinLoop();
    stopSettleAnimation();
    setVisibleMarked(false);
    settledStripStepRef.current = null;
    setCurrentStripStep(SPIN_STRIP_START_STEP);
    const startOffset = -SPIN_STRIP_START_STEP * boxSize + stripAlignmentOffset;
    const stepDuration = getSpinStepDuration(index);
    const loopEndOffset = -(SPIN_STRIP_START_STEP + spinTravelSteps) * boxSize + stripAlignmentOffset;
    spinOffset.setValue(startOffset);
    spinOffsetValueRef.current = startOffset;

    spinStateTimerRef.current = setTimeout(() => {
      setVisibleMarked(getStripMarkedForStep(SPIN_STRIP_START_STEP + 1, spinSeedMarked));
      setCurrentStripStep(SPIN_STRIP_START_STEP + 1);
      spinStateTimerRef.current = null;
    }, Math.max(28, stepDuration));

    const animation = Animated.timing(spinOffset, {
      toValue: loopEndOffset,
      duration: stepDuration * spinTravelSteps,
      easing: Easing.linear,
      useNativeDriver: true,
    });

    spinAnimationRef.current = animation;
    animation.start();
  }, [
    boxSize,
    index,
    spinTravelSteps,
    stopSpinLoop,
    spinOffset,
    spinSeedMarked,
    stopSettleAnimation,
    stripAlignmentOffset,
  ]);

  const getMarkedFaceForOffset = useCallback(
    (offset: number) => {
      const normalizedStep = Math.max(
        0,
        Math.round(-(offset - stripAlignmentOffset) / Math.max(boxSize, 1)),
      );
      return getStripMarkedForStep(normalizedStep, spinSeedMarked);
    },
    [boxSize, spinSeedMarked, stripAlignmentOffset],
  );

  const settleFromSpin = useCallback(
    (nextMarked: boolean) => {
      stopSettleAnimation();
      spinAnimationRef.current?.stop();
      spinAnimationRef.current = null;
      clearSpinStateTimer();
      spinOffset.stopAnimation();
      const currentOffset = spinOffsetValueRef.current;
      spinOffset.setValue(currentOffset);
      spinOffsetValueRef.current = currentOffset;

      const currentPosition = Math.max(
        0,
        -(currentOffset - stripAlignmentOffset) / Math.max(boxSize, 1),
      );
      const canonicalFinalStep = getSettledStripStep(nextMarked, spinSeedMarked);
      const maxFinalStep =
        spinStripFaceCount - 1 - ((spinStripFaceCount - 1 - canonicalFinalStep) % 2);
      let finalStep = Math.ceil(Math.max(canonicalFinalStep, currentPosition + MIN_STOP_TRAVEL_STEPS));

      if ((finalStep - canonicalFinalStep) % 2 !== 0) {
        finalStep += 1;
      }

      finalStep = Math.min(finalStep, maxFinalStep);
      settledStripStepRef.current = finalStep;
      setCurrentStripStep(finalStep);
      const finalOffset = -finalStep * boxSize + stripAlignmentOffset;
      const dropPeakStep = Math.min(
        spinStripFaceCount - 1,
        Math.max(finalStep + LANDING_DROP_STEP_OFFSET, currentPosition + 0.72),
      );
      const dropPeakOffset = -dropPeakStep * boxSize + stripAlignmentOffset;
      const decelerationDurationMs = Math.max(
        140,
        SLOT_DICE_STOP_SETTLE_MS - LANDING_DROP_DURATION_MS,
      );
      const settleAnimation = Animated.sequence([
        Animated.timing(spinOffset, {
          toValue: dropPeakOffset,
          duration: decelerationDurationMs,
          easing: SLOT_REEL_DECELERATE_EASING,
          useNativeDriver: true,
        }),
        Animated.timing(spinOffset, {
          toValue: finalOffset,
          duration: LANDING_DROP_DURATION_MS,
          easing: SLOT_REEL_LANDING_EASING,
          useNativeDriver: true,
        }),
      ]);

      settleAnimationRef.current = settleAnimation;
      settleAnimation.start(({ finished }) => {
        settleAnimationRef.current = null;

        if (!finished) {
          return;
        }

        spinOffset.setValue(finalOffset);
        spinOffsetValueRef.current = finalOffset;
        setVisibleMarked(getMarkedFaceForOffset(finalOffset));
        onStopComplete?.(index);
      });
    },
    [
      boxSize,
      clearSpinStateTimer,
      getMarkedFaceForOffset,
      index,
      onStopComplete,
      spinStripFaceCount,
      spinOffset,
      spinSeedMarked,
      stopSettleAnimation,
      stripAlignmentOffset,
    ],
  );

  useEffect(() => {
    if (variant !== 'animated') {
      return;
    }

    const initialSpinning = latestSpinningRef.current;

    if (initialSpinning) {
      startSpinLoop();
    } else {
      syncReel(false, 'start');
    }
    previousSpinningRef.current = initialSpinning;
  }, [playbackId, startSpinLoop, syncReel, variant]);

  useEffect(() => {
    if (variant === 'animated') {
      return;
    }

    syncReel(targetMarked, variant);
  }, [syncReel, targetMarked, variant]);

  useEffect(() => {
    if (variant !== 'animated') {
      previousSpinningRef.current = spinning;
      return;
    }

    const previousSpinning = previousSpinningRef.current;
    previousSpinningRef.current = spinning;

    if (previousSpinning === spinning) {
      return;
    }

    if (spinning) {
      startSpinLoop();
      return;
    }

    settleFromSpin(targetMarked);
  }, [settleFromSpin, spinning, startSpinLoop, targetMarked, variant]);

  useEffect(() => stopAllAnimations, [stopAllAnimations]);

  useEffect(() => {
    if (jackpotPulseToken <= 0) {
      stopJackpotAnimation();
      return;
    }

    stopJackpotAnimation();
    jackpotTimerRef.current = setTimeout(() => {
      const animation = Animated.sequence([
        Animated.timing(jackpotGlow, {
          toValue: 1,
          duration: JACKPOT_PULSE_RISE_MS,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.timing(jackpotGlow, {
          toValue: 0,
          duration: JACKPOT_PULSE_FALL_MS,
          easing: Easing.out(Easing.quad),
          useNativeDriver: false,
        }),
      ]);

      jackpotAnimationRef.current = animation;
      animation.start(({ finished }) => {
        jackpotAnimationRef.current = null;
        if (finished) {
          jackpotGlow.setValue(0);
        }
      });
      jackpotTimerRef.current = null;
    }, jackpotPulseDelayMs);

    return stopJackpotAnimation;
  }, [jackpotGlow, jackpotPulseDelayMs, jackpotPulseToken, stopJackpotAnimation]);

  const accessibilityText = visibleMarked ? 'marked' : 'unmarked';
  const interiorBaseGradientId = `slot-die-base-${index}`;
  const interiorCenterGradientId = `slot-die-center-${index}`;
  const interiorSideGradientId = `slot-die-side-${index}`;
  const topMaskGradientId = `slot-die-top-mask-${index}`;
  const bottomMaskGradientId = `slot-die-bottom-mask-${index}`;
  const sheenGradientId = `slot-die-sheen-${index}`;

  return (
    <Animated.View
      accessibilityRole="image"
      accessibilityValue={{
        text: accessibilityText,
        min: 0,
        max: spinStripFaceCount - 1,
        now: currentStripStep,
      }}
      renderToHardwareTextureAndroid
      shouldRasterizeIOS
      style={[
        styles.reelWindow,
        {
          borderRadius: reelBorderRadius,
          height: boxSize,
          width: boxSize,
        },
      ]}
      testID={`slot-die-${index}`}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          styles.jackpotOuterGlowAura,
          {
            borderRadius: reelBorderRadius + 4,
            opacity: jackpotGlow,
            transform: [
              {
                scale: jackpotGlow.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.06],
                }),
              },
            ],
          },
        ]}
        testID={`slot-die-jackpot-glow-${index}`}
      />
      <Animated.View
        pointerEvents="none"
        style={[
          styles.jackpotOuterGlowRing,
          {
            borderRadius: reelBorderRadius + 2,
            opacity: jackpotGlow.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.98],
            }),
            transform: [
              {
                scale: jackpotGlow.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.04],
                }),
              },
            ],
          },
        ]}
      />
      <View
        style={[
          styles.reelWindowShell,
          presentation === 'stage' ? styles.reelWindowShellStage : styles.reelWindowShellEmbedded,
          {
            borderRadius: reelBorderRadius,
          },
        ]}
        testID={`slot-die-window-shell-${index}`}
      >
        <View style={[styles.reelWindowStone, { borderRadius: reelBorderRadius }]} />
        <View style={[styles.reelWindowStoneShade, { borderRadius: reelBorderRadius }]} />
        <View style={[styles.reelWindowStoneHighlight, { borderRadius: reelBorderRadius - 1 }]} />
        <View style={[styles.reelWindowGoldRim, { borderRadius: reelBorderRadius - 1 }]} />
        <View
          pointerEvents="none"
          style={[
            styles.reelWindowInsetShadow,
            {
              top: reelViewportInset - 1,
              right: reelViewportInset - 1,
              bottom: reelViewportInset - 1,
              left: reelViewportInset - 1,
              borderRadius: reelViewportRadius + 2,
            },
          ]}
        />
        <View
          style={[
            styles.reelViewportShell,
            {
              top: reelViewportInset,
              right: reelViewportInset,
              bottom: reelViewportInset,
              left: reelViewportInset,
              borderRadius: reelViewportRadius,
            },
          ]}
          testID={`slot-die-viewport-shell-${index}`}
        >
          <Svg
            height="100%"
            pointerEvents="none"
            preserveAspectRatio="none"
            style={styles.reelInteriorArt}
            testID={`slot-die-interior-${index}`}
            viewBox="0 0 100 100"
            width="100%"
          >
            <Defs>
              <LinearGradient id={interiorBaseGradientId} x1="0" x2="0" y1="0" y2="1">
                <Stop offset="0%" stopColor="#160F08" />
                <Stop offset="46%" stopColor="#2A1E12" />
                <Stop offset="100%" stopColor="#120B06" />
              </LinearGradient>
              <RadialGradient id={interiorCenterGradientId} cx="50%" cy="48%" fx="50%" fy="48%" r="70%">
                <Stop offset="0%" stopColor="rgba(255, 214, 146, 0.3)" />
                <Stop offset="38%" stopColor="rgba(124, 82, 38, 0.18)" />
                <Stop offset="100%" stopColor="rgba(0, 0, 0, 0)" />
              </RadialGradient>
              <LinearGradient id={interiorSideGradientId} x1="0" x2="1" y1="0" y2="0">
                <Stop offset="0%" stopColor="rgba(4, 2, 1, 0.34)" />
                <Stop offset="18%" stopColor="rgba(4, 2, 1, 0.04)" />
                <Stop offset="82%" stopColor="rgba(4, 2, 1, 0.04)" />
                <Stop offset="100%" stopColor="rgba(4, 2, 1, 0.34)" />
              </LinearGradient>
            </Defs>
            <Rect fill={`url(#${interiorBaseGradientId})`} height="100" width="100" x="0" y="0" />
            <Rect fill={`url(#${interiorCenterGradientId})`} height="100" width="100" x="0" y="0" />
            <Rect fill={`url(#${interiorSideGradientId})`} height="100" width="100" x="0" y="0" />
          </Svg>
          <View
            pointerEvents="none"
            renderToHardwareTextureAndroid
            shouldRasterizeIOS
            style={styles.reelViewport}
            testID={`slot-die-viewport-${index}`}
          >
            {variant === 'start' ? (
              <View pointerEvents="none" style={styles.reelFace} testID={`slot-die-face-${index}`}>
                <View style={[styles.dieArtWrap, dieArtStyle]}>
                  <Image
                    source={unmarkedDieSource}
                    style={[styles.dieImage, { height: imageSize, width: imageSize }]}
                    resizeMode="contain"
                    testID={`slot-die-image-${index}`}
                  />
                </View>
              </View>
            ) : (
              <Animated.View
                pointerEvents="none"
                renderToHardwareTextureAndroid
                shouldRasterizeIOS
                testID={`slot-die-strip-${index}`}
                style={[
                  styles.spinStrip,
                  {
                    height: boxSize * spinStripFaces.length,
                    transform: [{ translateY: spinOffset }],
                  },
                ]}
              >
                {spinStripFaces.map((faceMarked, faceIndex) => (
                  <View
                    key={`${index}-${faceIndex}-${faceMarked ? 'marked' : 'unmarked'}`}
                    style={[styles.spinStripCell, { height: boxSize }]}
                    testID={`slot-die-strip-cell-${index}-${faceIndex}`}
                  >
                    <View style={[styles.dieArtWrap, dieArtStyle]}>
                      <Image
                        source={faceMarked ? markedDieSource : unmarkedDieSource}
                        style={[styles.dieImage, { height: imageSize, width: imageSize }]}
                        resizeMode="contain"
                        testID={`slot-die-strip-image-${index}-${faceIndex}`}
                      />
                    </View>
                  </View>
                ))}
              </Animated.View>
            )}
          </View>
          <Svg
            height="100%"
            pointerEvents="none"
            preserveAspectRatio="none"
            style={styles.reelOverlayArt}
            testID={`slot-die-sheen-${index}`}
            viewBox="0 0 100 100"
            width="100%"
          >
            <Defs>
              <LinearGradient id={topMaskGradientId} x1="0" x2="0" y1="0" y2="1">
                <Stop offset="0%" stopColor="rgba(6, 4, 2, 0.86)" />
                <Stop offset="100%" stopColor="rgba(6, 4, 2, 0)" />
              </LinearGradient>
              <LinearGradient id={bottomMaskGradientId} x1="0" x2="0" y1="0" y2="1">
                <Stop offset="0%" stopColor="rgba(6, 4, 2, 0)" />
                <Stop offset="100%" stopColor="rgba(6, 4, 2, 0.88)" />
              </LinearGradient>
              <LinearGradient id={sheenGradientId} x1="0" x2="1" y1="0" y2="1">
                <Stop offset="0%" stopColor="rgba(255, 255, 255, 0)" />
                <Stop offset="48%" stopColor="rgba(255, 247, 218, 0.26)" />
                <Stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
              </LinearGradient>
            </Defs>
            <Rect fill={`url(#${topMaskGradientId})`} height="28" width="100" x="0" y="0" />
            <Rect fill={`url(#${bottomMaskGradientId})`} height="30" width="100" x="0" y="70" />
            <Ellipse
              cx="22"
              cy="24"
              fill={`url(#${sheenGradientId})`}
              rx="34"
              ry="18"
              transform="rotate(-18 22 24)"
            />
          </Svg>
          <Animated.View
            pointerEvents="none"
            style={[
              styles.jackpotInnerGlowRing,
              {
                borderRadius: Math.max(10, reelViewportRadius - 1),
                opacity: jackpotGlow.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 1],
                }),
                transform: [
                  {
                    scale: jackpotGlow.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.03],
                    }),
                  },
                ],
              },
            ]}
          />
          <Animated.View
            pointerEvents="none"
            style={[
              styles.jackpotInnerEdgeGlow,
              {
                borderRadius: Math.max(8, reelViewportRadius - 4),
                opacity: jackpotGlow.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 1],
                }),
              },
            ]}
          />
          <View style={[styles.reelViewportBorder, { borderRadius: reelViewportRadius }]} />
        </View>
      </View>
    </Animated.View>
  );
};

export const SlotDiceScene: React.FC<SlotDiceSceneProps> = ({
  diceImageScale = 1,
  durationMs = DEFAULT_DICE_ROLL_DURATION_MS,
  markedDieSource = DICE_MARKED,
  onSettled,
  orientation = 'horizontal',
  playbackId,
  presentation = 'embedded',
  rollValue,
  size = 1,
  unmarkedDieSource = DICE_UNMARKED,
  variant = 'animated',
}) => {
  const [layout, setLayout] = useState({ height: 0, width: 0 });
  const [spinningReels, setSpinningReels] = useState<boolean[]>(() =>
    variant === 'animated' ? [...ALL_REELS_SPINNING] : [...ALL_REELS_STOPPED],
  );
  const startedAtRef = useRef(Date.now());
  const kickoffTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stopTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const stopSequenceStartedRef = useRef(false);
  const completedReelsRef = useRef(new Set<number>());
  const settledPlaybackRef = useRef<number | null>(null);
  const onSettledRef = useRef(onSettled);
  const jackpotPulseSignatureRef = useRef<string | null>(null);
  const [jackpotPulseToken, setJackpotPulseToken] = useState(0);

  const targetFaces = useMemo(
    () => buildSlotDiceFaces({ playbackId, rollValue }),
    [playbackId, rollValue],
  );
  const jackpotPulseDelayByReel = useMemo(() => {
    const pulseOrder = buildJackpotPulseOrder(playbackId);
    const delays = Array.from({ length: SLOT_DICE_COUNT }, () => JACKPOT_PULSE_LEAD_MS);

    pulseOrder.forEach((reelIndex, pulseIndex) => {
      delays[reelIndex] = JACKPOT_PULSE_LEAD_MS + pulseIndex * JACKPOT_PULSE_STAGGER_MS;
    });

    return delays;
  }, [playbackId]);

  useEffect(() => {
    onSettledRef.current = onSettled;
  }, [onSettled]);

  const clearTimers = useCallback(() => {
    clearTimer(kickoffTimerRef.current);
    kickoffTimerRef.current = null;
    stopTimersRef.current.forEach((timer) => clearTimeout(timer));
    stopTimersRef.current = [];
  }, []);

  useEffect(() => {
    clearTimers();
    startedAtRef.current = Date.now();
    stopSequenceStartedRef.current = false;
    completedReelsRef.current = new Set<number>();
    settledPlaybackRef.current = null;
    jackpotPulseSignatureRef.current = null;
    setJackpotPulseToken(0);
    setSpinningReels(variant === 'animated' ? [...ALL_REELS_SPINNING] : [...ALL_REELS_STOPPED]);
  }, [clearTimers, playbackId, variant]);

  const completePlayback = useCallback(() => {
    if (settledPlaybackRef.current === playbackId) {
      return;
    }

    settledPlaybackRef.current = playbackId;
    onSettledRef.current?.();
  }, [playbackId]);

  const handleReelStopComplete = useCallback(
    (index: number) => {
      if (variant !== 'animated' || rollValue === null) {
        return;
      }

      completedReelsRef.current.add(index);

      if (
        completedReelsRef.current.size !== SLOT_DICE_COUNT ||
        settledPlaybackRef.current === playbackId
      ) {
        return;
      }

      completePlayback();
    },
    [completePlayback, playbackId, rollValue, variant],
  );

  useEffect(() => {
    if (variant !== 'animated' || rollValue === null || stopSequenceStartedRef.current) {
      return;
    }

    const kickOffStopSequence = () => {
      if (stopSequenceStartedRef.current) {
        return;
      }

      stopSequenceStartedRef.current = true;
      stopTimersRef.current = Array.from({ length: SLOT_DICE_COUNT }, (_, index) =>
        setTimeout(() => {
          setSpinningReels((current) =>
            current.map((value, reelIndex) => (reelIndex === index ? false : value)),
          );
        }, index * SLOT_DICE_STOP_STAGGER_MS),
      );
      stopTimersRef.current.push(
        setTimeout(() => {
          completePlayback();
        }, SLOT_DICE_TOTAL_STOP_MS + STOP_COMPLETION_BUFFER_MS),
      );
    };

    const elapsedMs = Date.now() - startedAtRef.current;
    const kickOffDelayMs = Math.max(
      0,
      durationMs - SLOT_DICE_TOTAL_STOP_MS - SPIN_PHASE_TRIM_MS - elapsedMs,
    );

    if (kickOffDelayMs === 0) {
      kickOffStopSequence();
      return;
    }

    kickoffTimerRef.current = setTimeout(kickOffStopSequence, kickOffDelayMs);

    return clearTimers;
  }, [clearTimers, completePlayback, durationMs, rollValue, variant]);

  useEffect(() => clearTimers, [clearTimers]);

  useEffect(() => {
    const jackpotSignature =
      variant === 'settled' && rollValue === SLOT_DICE_JACKPOT_VALUE
        ? `${playbackId}:${variant}:${rollValue}`
        : null;

    if (jackpotSignature === null || jackpotPulseSignatureRef.current === jackpotSignature) {
      return;
    }

    jackpotPulseSignatureRef.current = jackpotSignature;
    setJackpotPulseToken((current) => current + 1);
  }, [playbackId, rollValue, variant]);

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const { height, width } = event.nativeEvent.layout;
    const nextHeight = Math.round(height);
    const nextWidth = Math.round(width);

    if (nextHeight <= 0 || nextWidth <= 0) {
      return;
    }

    setLayout((current) =>
      current.height === nextHeight && current.width === nextWidth
        ? current
        : { height: nextHeight, width: nextWidth },
    );
  }, []);

  const defaultSceneWidth = (presentation === 'stage' ? 274 : 246) * size;
  const defaultSceneHeight = (presentation === 'stage' ? 138 : 122) * size;
  const baseWidth = orientation === 'vertical' ? defaultSceneHeight : defaultSceneWidth;
  const baseHeight = orientation === 'vertical' ? defaultSceneWidth : defaultSceneHeight;
  const availableWidth = layout.width > 0 ? layout.width : baseWidth;
  const availableHeight = layout.height > 0 ? layout.height : baseHeight;
  const framePaddingBase = Math.max(
    FRAME_MIN_PADDING,
    Math.round(Math.min(availableWidth, availableHeight) * 0.08),
  );
  const framePaddingHorizontal = Math.max(
    FRAME_MIN_PADDING,
    Math.round(framePaddingBase * (orientation === 'vertical' ? 0.95 : 1.08)),
  );
  const framePaddingVertical = Math.max(FRAME_MIN_PADDING, Math.round(framePaddingBase * 0.88));
  const reelGap = Math.max(3, Math.round(framePaddingBase * 0.55));
  const boxSize = Math.max(
    MIN_REEL_BOX_SIZE,
    Math.min(
      orientation === 'vertical'
        ? availableWidth - framePaddingHorizontal * 2
        : (availableWidth - framePaddingHorizontal * 2 - reelGap * (SLOT_DICE_COUNT - 1)) /
            SLOT_DICE_COUNT,
      orientation === 'vertical'
        ? (availableHeight - framePaddingVertical * 2 - reelGap * (SLOT_DICE_COUNT - 1)) /
            SLOT_DICE_COUNT
        : availableHeight - framePaddingVertical * 2,
    ),
  );
  const imageScaleBase = presentation === 'stage' ? 0.92 : 0.88;
  const defaultImageSize = presentation === 'stage' ? 76 : 68;
  const imageSize = Math.max(
    34,
    Math.min(defaultImageSize, Math.round(boxSize * imageScaleBase * diceImageScale)),
  );
  const trackWidth =
    orientation === 'vertical'
      ? boxSize
      : boxSize * SLOT_DICE_COUNT + reelGap * (SLOT_DICE_COUNT - 1);
  const trackHeight =
    orientation === 'vertical'
      ? boxSize * SLOT_DICE_COUNT + reelGap * (SLOT_DICE_COUNT - 1)
      : boxSize;
  const rowWidth = Math.min(availableWidth, trackWidth + framePaddingHorizontal * 2);
  const rowHeight = Math.min(availableHeight, trackHeight + framePaddingVertical * 2);
  const frameRadius = Math.max(
    18,
    Math.round(Math.min(rowWidth, rowHeight) * (presentation === 'stage' ? 0.22 : 0.2)),
  );
  const frameGoldInset = Math.max(2, Math.round(framePaddingBase * 0.28));
  const frameCarveInsetX = Math.max(frameGoldInset + 1, Math.round(framePaddingHorizontal * 0.48));
  const frameCarveInsetY = Math.max(frameGoldInset + 1, Math.round(framePaddingVertical * 0.44));

  return (
    <View testID="slot-dice-scene-root" onLayout={handleLayout} pointerEvents="none" style={styles.root}>
      <View
        style={[
          styles.reelRowFrame,
          {
            borderRadius: frameRadius,
            height: rowHeight,
            width: rowWidth,
          },
        ]}
        testID="slot-dice-scene-frame"
      >
        <View
          style={[
            styles.machineFrameShell,
            presentation === 'stage' ? styles.machineFrameShellStage : styles.machineFrameShellEmbedded,
            {
              borderRadius: frameRadius,
            },
          ]}
          testID="slot-dice-scene-frame-shell"
        >
          <View style={[styles.machineStoneFace, { borderRadius: frameRadius }]} />
          <View style={[styles.machineStoneHighlight, { borderRadius: frameRadius - 1 }]} />
          <View
            style={[
              styles.machineGoldTrim,
              {
                top: frameGoldInset,
                right: frameGoldInset,
                bottom: frameGoldInset,
                left: frameGoldInset,
                borderRadius: Math.max(14, frameRadius - frameGoldInset),
              },
            ]}
          />
          <View
            style={[
              styles.machineGoldEdge,
              {
                top: frameGoldInset + 1,
                right: frameGoldInset + 1,
                bottom: frameGoldInset + 1,
                left: frameGoldInset + 1,
                borderRadius: Math.max(12, frameRadius - frameGoldInset - 1),
              },
            ]}
          />
          <View
            style={[
              styles.machineCarvedInset,
              {
                top: frameCarveInsetY,
                right: frameCarveInsetX,
                bottom: frameCarveInsetY,
                left: frameCarveInsetX,
                borderRadius: Math.max(12, frameRadius - Math.max(frameCarveInsetX, frameCarveInsetY)),
              },
            ]}
          />
          <View
            style={[
              styles.machineCarvedInsetShade,
              {
                top: frameCarveInsetY,
                right: frameCarveInsetX,
                bottom: frameCarveInsetY,
                left: frameCarveInsetX,
                borderRadius: Math.max(12, frameRadius - Math.max(frameCarveInsetX, frameCarveInsetY)),
              },
            ]}
          />
          <View
            style={[
              styles.machineFrameSheen,
              {
                borderRadius: Math.max(12, frameRadius - frameGoldInset - 1),
              },
            ]}
          />
        </View>

        <View
          style={[
            styles.reelTrack,
            {
              paddingHorizontal: framePaddingHorizontal,
              paddingVertical: framePaddingVertical,
            },
          ]}
        >
          <View style={[styles.reelTrackInner, { height: trackHeight, width: trackWidth }]}>
            <View
              testID="slot-dice-scene-reel-stack"
              style={[
                styles.reelRow,
                orientation === 'vertical' && styles.reelColumn,
                { gap: reelGap },
              ]}
            >
              {Array.from({ length: SLOT_DICE_COUNT }, (_, index) => (
                <SlotReel
                  key={`${playbackId}-${index}`}
                  boxSize={boxSize}
                  durationMs={durationMs}
                  imageSize={imageSize}
                  index={index}
                  jackpotPulseDelayMs={jackpotPulseDelayByReel[index] ?? JACKPOT_PULSE_LEAD_MS}
                  jackpotPulseToken={jackpotPulseToken}
                  markedDieSource={markedDieSource}
                  onStopComplete={handleReelStopComplete}
                  playbackId={playbackId}
                  presentation={presentation}
                  spinning={variant === 'animated' ? spinningReels[index] : false}
                  targetMarked={variant === 'start' ? false : targetFaces[index]}
                  unmarkedDieSource={unmarkedDieSource}
                  variant={variant}
                />
              ))}
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reelRowFrame: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  machineFrameShell: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  machineFrameShellStage: {
    ...boxShadow({
      color: '#201307',
      opacity: 0.28,
      offset: { width: 0, height: 8 },
      blurRadius: 16,
      elevation: 8,
    }),
  },
  machineFrameShellEmbedded: {
    ...boxShadow({
      color: '#201307',
      opacity: 0.2,
      offset: { width: 0, height: 6 },
      blurRadius: 12,
      elevation: 5,
    }),
  },
  machineStoneFace: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#6A5A49',
    borderWidth: 3,
    borderColor: '#3B2716',
  },
  machineStoneHighlight: {
    position: 'absolute',
    top: 0,
    right: 0,
    left: 0,
    height: '45%',
    backgroundColor: 'rgba(255, 245, 221, 0.08)',
  },
  machineGoldTrim: {
    position: 'absolute',
    borderWidth: 3,
    borderColor: '#D3A74D',
    backgroundColor: 'rgba(178, 120, 34, 0.14)',
  },
  machineGoldEdge: {
    position: 'absolute',
    borderWidth: 1.4,
    borderColor: 'rgba(255, 229, 155, 0.32)',
  },
  machineCarvedInset: {
    position: 'absolute',
    backgroundColor: 'rgba(52, 36, 21, 0.7)',
    borderWidth: 1.2,
    borderColor: 'rgba(244, 206, 121, 0.16)',
  },
  machineCarvedInsetShade: {
    position: 'absolute',
    top: '40%',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(16, 10, 6, 0.2)',
  },
  machineFrameSheen: {
    position: 'absolute',
    top: 2,
    left: 6,
    right: 6,
    height: '42%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  reelTrack: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reelTrackInner: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  reelColumn: {
    flexDirection: 'column',
  },
  reelWindow: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    overflow: 'visible',
  },
  reelWindowShell: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  reelWindowShellStage: {
    ...boxShadow({
      color: '#241308',
      opacity: 0.18,
      offset: { width: 0, height: 3 },
      blurRadius: 7,
      elevation: 4,
    }),
  },
  reelWindowShellEmbedded: {
    ...boxShadow({
      color: '#241308',
      opacity: 0.14,
      offset: { width: 0, height: 2 },
      blurRadius: 5,
      elevation: 2,
    }),
  },
  reelWindowStone: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#64503A',
    borderWidth: 1.8,
    borderColor: '#3B2919',
  },
  reelWindowStoneShade: {
    position: 'absolute',
    top: '42%',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(12, 7, 4, 0.18)',
  },
  reelWindowStoneHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '42%',
    backgroundColor: 'rgba(255, 244, 219, 0.06)',
  },
  reelWindowGoldRim: {
    position: 'absolute',
    top: 1,
    right: 1,
    bottom: 1,
    left: 1,
    borderWidth: 1.8,
    borderColor: 'rgba(228, 188, 92, 0.9)',
  },
  reelWindowInsetShadow: {
    position: 'absolute',
    borderWidth: 1.4,
    borderColor: 'rgba(27, 16, 8, 0.45)',
    opacity: 0.9,
  },
  reelViewportShell: {
    position: 'absolute',
    overflow: 'hidden',
    backgroundColor: '#140C05',
  },
  reelInteriorArt: {
    ...StyleSheet.absoluteFillObject,
  },
  reelOverlayArt: {
    ...StyleSheet.absoluteFillObject,
  },
  reelViewport: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reelFace: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinStrip: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    width: '100%',
  },
  spinStripCell: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  dieArtWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  reelViewportBorder: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 229, 178, 0.16)',
  },
  jackpotOuterGlowAura: {
    position: 'absolute',
    top: -4,
    right: -4,
    bottom: -4,
    left: -4,
    borderWidth: 3,
    borderColor: 'rgba(236, 206, 78, 0.96)',
    backgroundColor: 'transparent',
    shadowColor: '#E8BF42',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.95,
    shadowRadius: 13,
    elevation: 11,
  },
  jackpotOuterGlowRing: {
    position: 'absolute',
    top: -1,
    right: -1,
    bottom: -1,
    left: -1,
    borderWidth: 2.4,
    borderColor: 'rgba(246, 222, 120, 0.98)',
    backgroundColor: 'transparent',
    shadowColor: '#F0CF72',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 7,
    elevation: 8,
  },
  jackpotInnerGlowRing: {
    position: 'absolute',
    top: 2,
    right: 2,
    bottom: 2,
    left: 2,
    borderWidth: 2,
    borderColor: 'rgba(234, 194, 72, 1)',
    backgroundColor: 'transparent',
    shadowColor: '#E4B84A',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.86,
    shadowRadius: 5,
    elevation: 6,
  },
  jackpotInnerEdgeGlow: {
    position: 'absolute',
    top: 5,
    right: 5,
    bottom: 5,
    left: 5,
    borderWidth: 1.2,
    borderColor: 'rgba(246, 228, 164, 0.96)',
    backgroundColor: 'transparent',
  },
  dieImage: {
    alignSelf: 'center',
  },
});
