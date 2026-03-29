import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  LayoutChangeEvent,
  StyleSheet,
  View,
} from 'react-native';
import {
  buildSlotDiceFaces,
  DEFAULT_DICE_ROLL_DURATION_MS,
  SLOT_DICE_COUNT,
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

type SlotDiceSceneProps = {
  diceImageScale?: number;
  durationMs?: number;
  onSettled?: () => void;
  orientation?: 'horizontal' | 'vertical';
  playbackId: number;
  presentation?: 'embedded' | 'stage';
  rollValue: number | null;
  size?: number;
  variant?: SlotDiceVariant;
};

type SlotReelProps = {
  boxSize: number;
  durationMs: number;
  imageSize: number;
  index: number;
  onStopComplete?: (index: number) => void;
  playbackId: number;
  presentation: 'embedded' | 'stage';
  spinning: boolean;
  targetMarked: boolean;
  variant: SlotDiceVariant;
};

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
  onStopComplete,
  playbackId,
  presentation,
  spinning,
  targetMarked,
  variant,
}) => {
  const spinSeedMarked = (playbackId + index) % 2 === 0;
  const spinTravelSteps = useMemo(
    () => getContinuousSpinTravelSteps(durationMs, index),
    [durationMs, index],
  );
  const spinStripFaceCount = SPIN_STRIP_START_STEP + spinTravelSteps + SPIN_STRIP_TAIL_STEPS;
  const initialStripStep =
    variant === 'start' ? 0 : getSettledStripStep(targetMarked, spinSeedMarked);
  const initialStripOffset =
    variant === 'start' ? 0 : getSettledStripOffset(targetMarked, spinSeedMarked, boxSize);
  const spinOffset = useRef(new Animated.Value(initialStripOffset)).current;
  const spinOffsetValueRef = useRef(initialStripOffset);
  const settleAnimationRef = useRef<Animated.CompositeAnimation | null>(null);
  const spinAnimationRef = useRef<Animated.CompositeAnimation | null>(null);
  const spinStateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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

  const clearSpinStateTimer = useCallback(() => {
    clearTimer(spinStateTimerRef.current);
    spinStateTimerRef.current = null;
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

  const stopAllAnimations = useCallback(() => {
    stopSpinLoop();
    stopSettleAnimation();
  }, [stopSettleAnimation, stopSpinLoop]);

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
          ? 0
          : -nextStep * boxSize;
      spinOffset.setValue(nextOffset);
      spinOffsetValueRef.current = nextOffset;
    },
    [boxSize, spinOffset, spinSeedMarked, stopAllAnimations],
  );

  const startSpinLoop = useCallback(() => {
    stopSpinLoop();
    stopSettleAnimation();
    setVisibleMarked(false);
    settledStripStepRef.current = null;
    setCurrentStripStep(SPIN_STRIP_START_STEP);
    const startOffset = -SPIN_STRIP_START_STEP * boxSize;
    const stepDuration = getSpinStepDuration(index);
    const loopEndOffset = -(SPIN_STRIP_START_STEP + spinTravelSteps) * boxSize;
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
  ]);

  const getMarkedFaceForOffset = useCallback(
    (offset: number) => {
      const normalizedStep = Math.max(0, Math.round(-offset / Math.max(boxSize, 1)));
      return getStripMarkedForStep(normalizedStep, spinSeedMarked);
    },
    [boxSize, spinSeedMarked],
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

      const currentPosition = Math.max(0, -currentOffset / Math.max(boxSize, 1));
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
      const finalOffset = -finalStep * boxSize;
      const dropPeakStep = Math.min(
        spinStripFaceCount - 1,
        Math.max(finalStep + LANDING_DROP_STEP_OFFSET, currentPosition + 0.72),
      );
      const dropPeakOffset = -dropPeakStep * boxSize;
      const decelerationDurationMs = Math.max(
        140,
        SLOT_DICE_STOP_SETTLE_MS -
          LANDING_DROP_DURATION_MS,
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
  const accessibilityText = visibleMarked ? 'marked' : 'unmarked';

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
        presentation === 'stage' ? styles.reelWindowStage : styles.reelWindowEmbedded,
        {
          borderRadius: Math.max(13, boxSize * 0.24),
          height: boxSize,
          width: boxSize,
        },
      ]}
      testID={`slot-die-${index}`}
    >
      <View style={styles.reelInset} />
      <View
        pointerEvents="none"
        renderToHardwareTextureAndroid
        shouldRasterizeIOS
        style={styles.reelViewport}
        testID={`slot-die-viewport-${index}`}
      >
        {variant === 'start' ? (
          <View pointerEvents="none" style={styles.reelFace} testID={`slot-die-face-${index}`}>
            <Image
              source={DICE_UNMARKED}
              style={[styles.dieImage, { height: imageSize, width: imageSize }]}
              resizeMode="contain"
              testID={`slot-die-image-${index}`}
            />
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
                <Image
                  source={faceMarked ? DICE_MARKED : DICE_UNMARKED}
                  style={[styles.dieImage, { height: imageSize, width: imageSize }]}
                  resizeMode="contain"
                  testID={`slot-die-strip-image-${index}-${faceIndex}`}
                />
              </View>
            ))}
          </Animated.View>
        )}
      </View>
      <View style={styles.reelMaskTop} />
      <View style={styles.reelMaskBottom} />
      <View style={styles.reelHighlight} />
      <View style={styles.reelBorder} />
    </Animated.View>
  );
};

export const SlotDiceScene: React.FC<SlotDiceSceneProps> = ({
  diceImageScale = 1,
  durationMs = DEFAULT_DICE_ROLL_DURATION_MS,
  onSettled,
  orientation = 'horizontal',
  playbackId,
  presentation = 'embedded',
  rollValue,
  size = 1,
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

  const targetFaces = useMemo(
    () => buildSlotDiceFaces({ playbackId, rollValue }),
    [playbackId, rollValue],
  );

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
  const rowHorizontalPadding = Math.max(0, Math.round(availableWidth * 0.004));
  const rowVerticalPadding = Math.max(2, Math.round(availableHeight * 0.02));
  const reelGap = Math.max(
    2,
    Math.round((orientation === 'vertical' ? availableHeight : availableWidth) * 0.012),
  );
  const boxSize = Math.max(
    MIN_REEL_BOX_SIZE,
    Math.min(
      orientation === 'vertical'
        ? availableWidth - rowHorizontalPadding * 2
        : (availableWidth - rowHorizontalPadding * 2 - reelGap * (SLOT_DICE_COUNT - 1)) /
            SLOT_DICE_COUNT,
      orientation === 'vertical'
        ? (availableHeight - rowVerticalPadding * 2 - reelGap * (SLOT_DICE_COUNT - 1)) /
            SLOT_DICE_COUNT
        : availableHeight - rowVerticalPadding * 2,
    ),
  );
  const defaultImageSize = presentation === 'stage' ? 80 : 72;
  const imageSize = Math.max(
    38,
    Math.min(defaultImageSize, Math.round(boxSize * 1.22 * diceImageScale)),
  );
  const rowWidth =
    orientation === 'vertical'
      ? Math.min(availableWidth, boxSize + rowHorizontalPadding * 2)
      : Math.min(
          availableWidth,
          boxSize * SLOT_DICE_COUNT + reelGap * (SLOT_DICE_COUNT - 1) + rowHorizontalPadding * 2,
        );
  const rowHeight =
    orientation === 'vertical'
      ? Math.min(
          availableHeight,
          boxSize * SLOT_DICE_COUNT + reelGap * (SLOT_DICE_COUNT - 1) + rowVerticalPadding * 2,
        )
      : Math.min(availableHeight, boxSize + rowVerticalPadding * 2);
  return (
    <View testID="slot-dice-scene-root" onLayout={handleLayout} pointerEvents="none" style={styles.root}>
      <View
        style={[
          styles.reelRowFrame,
          {
            height: rowHeight,
            width: rowWidth,
            paddingHorizontal: rowHorizontalPadding,
            paddingVertical: rowVerticalPadding,
          },
        ]}
      >
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
              onStopComplete={handleReelStopComplete}
              playbackId={playbackId}
              presentation={presentation}
              spinning={variant === 'animated' ? spinningReels[index] : false}
              targetMarked={variant === 'start' ? false : targetFaces[index]}
              variant={variant}
            />
          ))}
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  reelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reelColumn: {
    flexDirection: 'column',
  },
  reelWindow: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3.2,
  },
  reelWindowEmbedded: {
    borderColor: '#86562A',
    backgroundColor: 'transparent',
  },
  reelWindowStage: {
    borderColor: '#75481F',
    backgroundColor: 'transparent',
  },
  reelInset: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
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
  reelMaskTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '20%',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  reelMaskBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '20%',
    backgroundColor: 'rgba(29, 18, 9, 0.08)',
  },
  reelHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '34%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  reelBorder: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 2,
    borderColor: 'rgba(84, 51, 24, 0.26)',
  },
  dieImage: {
    alignSelf: 'center',
  },
});
