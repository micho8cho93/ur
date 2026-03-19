import { DEFAULT_DICE_ROLL_DURATION_MS } from '@/components/3d/DiceRollScene.shared';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  Extrapolation,
  cancelAnimation,
  interpolate,
  runOnJS,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import type { MatchDiceRollStageRendererProps } from './MatchDiceRollStageRenderer.shared';
import { MatchDiceRollStageThree } from './MatchDiceRollStageThree';
import {
  buildMatchDiceStageMotion,
  MATCH_DICE_STAGE_ENTRY_DURATION_MS,
  MATCH_DICE_STAGE_FADE_MS,
  MATCH_DICE_STAGE_HOLD_MS,
  sampleMatchDiceStageMotion,
} from './matchDiceStageMotion';
import {
  computeLandingZone,
  getStagePixelPosition,
  type BoardFrame,
  type LandingZone,
} from './matchDiceStageLayout';

interface MatchDiceRollStageProps {
  boardFrame: BoardFrame | null;
  compact: boolean;
  durationMs?: number;
  playbackId: number;
  rollValue: number | null;
  viewportHeight: number;
  viewportWidth: number;
  visible: boolean;
}

type StageErrorBoundaryProps = {
  children: React.ReactNode;
  onError: (error: Error, info: React.ErrorInfo) => void;
  resetKey: string;
};

class StageErrorBoundary extends React.Component<StageErrorBoundaryProps, { hasError: boolean }> {
  state = {
    hasError: false,
  };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    this.props.onError(error, info);
  }

  componentDidUpdate(prevProps: StageErrorBoundaryProps) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (this.state.hasError) {
      return null;
    }

    return this.props.children;
  }
}

const PlaceholderDie: React.FC<{
  index: number;
  landingZone: LandingZone;
  motionConfig: ReturnType<typeof buildMatchDiceStageMotion>[number];
  progress: SharedValue<number>;
}> = ({ index, landingZone, motionConfig, progress }) => {
  const dieSize = Math.max(26, Math.min(landingZone.width * 0.18, landingZone.height * 0.44));
  const dieStyle = useAnimatedStyle(() => {
    const sample = sampleMatchDiceStageMotion(motionConfig, progress.value, 1.02);
    const pixelPosition = getStagePixelPosition({
      landingZone,
      sample,
    });

    return {
      left: pixelPosition.x - dieSize / 2,
      opacity: progress.value < 0.02 ? 0 : 0.96,
      top: pixelPosition.y - dieSize / 2,
      transform: [
        { rotateZ: `${sample.rotate[2] * 57.2958}deg` },
        { scale: 0.92 + sample.scale * 0.84 },
        { rotateX: `${sample.rotate[0] * 28}deg` },
      ],
    };
  }, [dieSize, landingZone, motionConfig, progress]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.placeholderDieWrap,
        dieStyle,
        { zIndex: index + 1 },
      ]}
    >
      <View style={styles.placeholderDieFace}>
        <View style={styles.placeholderDieHighlight} />
        <View style={styles.placeholderDieCore} />
        <View style={styles.placeholderPip} />
      </View>
    </Animated.View>
  );
};

const EmergencyPlaceholderStage: React.FC<{
  landingZone: LandingZone;
  playbackId: number;
  progress: SharedValue<number>;
  rollValue: number | null;
}> = ({ landingZone, playbackId, progress, rollValue }) => {
  const motion = useMemo(
    () =>
      buildMatchDiceStageMotion({
        playbackId,
        rollValue,
        landingZone,
      }),
    [landingZone, playbackId, rollValue],
  );

  return (
    <View pointerEvents="none" style={styles.placeholderLayer}>
      {motion.map((config, index) => (
        <PlaceholderDie
          key={`${playbackId}-${index}`}
          index={index}
          landingZone={landingZone}
          motionConfig={config}
          progress={progress}
        />
      ))}
    </View>
  );
};

export const MatchDiceRollStage: React.FC<MatchDiceRollStageProps> = ({
  boardFrame,
  compact,
  durationMs = DEFAULT_DICE_ROLL_DURATION_MS,
  playbackId,
  rollValue,
  viewportHeight,
  viewportWidth,
  visible,
}) => {
  const [activePlaybackId, setActivePlaybackId] = useState(0);
  const [latchedRollValue, setLatchedRollValue] = useState<number | null>(null);
  const [rendererFailed, setRendererFailed] = useState(false);
  const [rendererReady, setRendererReady] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const latestPlaybackIdRef = useRef(0);
  const motionProgress = useSharedValue(0);
  const overlayOpacity = useSharedValue(0);
  const rendererOpacity = useSharedValue(0);
  const travelProgress = useSharedValue(0);

  const landingZone = useMemo(() => {
    if (!boardFrame) {
      return null;
    }

    return computeLandingZone({
      boardFrame,
      compact,
      viewportHeight,
      viewportWidth,
    });
  }, [boardFrame, compact, viewportHeight, viewportWidth]);

  useEffect(() => {
    if (!shouldRender || activePlaybackId <= 0 || rollValue === null) {
      return;
    }

    setLatchedRollValue((current) => (current === null ? rollValue : current));
  }, [activePlaybackId, rollValue, shouldRender]);

  const stageMotionStyle = useAnimatedStyle(() => {
    if (!landingZone) {
      return {
        opacity: 0,
      };
    }

    const startX = landingZone.x - Math.min(18, landingZone.width * 0.08);
    const startY = landingZone.y - Math.min(6, landingZone.height * 0.04);
    const x = interpolate(
      travelProgress.value,
      [0, 0.44, 1],
      [startX, landingZone.x + Math.min(4, landingZone.width * 0.014), landingZone.x],
      Extrapolation.CLAMP,
    );
    const y = interpolate(
      travelProgress.value,
      [0, 0.42, 0.78, 1],
      [startY, landingZone.y - 2, landingZone.y + 1.5, landingZone.y],
      Extrapolation.CLAMP,
    );
    const rotateZ = interpolate(travelProgress.value, [0, 0.5, 1], [-2.2, 0.4, 0], Extrapolation.CLAMP);
    const scale = interpolate(travelProgress.value, [0, 0.45, 1], [0.992, 1.006, 1], Extrapolation.CLAMP);

    return {
      height: landingZone.height,
      opacity: overlayOpacity.value,
      transform: [{ translateX: x }, { translateY: y }, { rotateZ: `${rotateZ}deg` }, { scale }],
      width: landingZone.width,
    };
  }, [landingZone, overlayOpacity, travelProgress]);

  const rendererLayerStyle = useAnimatedStyle(() => ({
    opacity: rendererOpacity.value,
  }));

  const handleSequenceFinished = React.useCallback((completedPlaybackId: number) => {
    if (latestPlaybackIdRef.current !== completedPlaybackId) {
      return;
    }

    setShouldRender(false);
  }, []);

  const handleRendererReady = React.useCallback(() => {
    setRendererReady(true);
  }, []);

  const handleRendererError = React.useCallback<MatchDiceRollStageRendererProps['onError']>((error) => {
    console.warn('[MatchDiceRollStage] Three renderer failed; using emergency placeholder', {
      message: error.message,
    });
    setRendererFailed(true);
  }, []);

  const handleBoundaryError = React.useCallback((error: Error, info: React.ErrorInfo) => {
    console.warn('[MatchDiceRollStage] Three renderer boundary caught an error; using emergency placeholder', {
      componentStack: info.componentStack,
      message: error.message,
    });
    setRendererFailed(true);
  }, []);

  useEffect(() => {
    if (!visible || playbackId <= 0 || !landingZone) {
      return;
    }

    latestPlaybackIdRef.current = playbackId;
    setActivePlaybackId(playbackId);
    setLatchedRollValue(rollValue);
    setRendererFailed(false);
    setRendererReady(false);
    setShouldRender(true);

    cancelAnimation(motionProgress);
    cancelAnimation(overlayOpacity);
    cancelAnimation(rendererOpacity);
    cancelAnimation(travelProgress);

    motionProgress.value = 0;
    overlayOpacity.value = 1;
    rendererOpacity.value = 0;
    travelProgress.value = 0;

    travelProgress.value = withTiming(1, {
      duration: MATCH_DICE_STAGE_ENTRY_DURATION_MS,
      easing: Easing.out(Easing.cubic),
    });
    motionProgress.value = withTiming(1, {
      duration: durationMs,
      easing: Easing.linear,
    });
    overlayOpacity.value = withDelay(
      durationMs + MATCH_DICE_STAGE_HOLD_MS,
      withTiming(
        0,
        {
          duration: MATCH_DICE_STAGE_FADE_MS,
          easing: Easing.out(Easing.quad),
        },
        (finished) => {
          if (finished) {
            runOnJS(handleSequenceFinished)(playbackId);
          }
        },
      ),
    );

    return () => {
      cancelAnimation(motionProgress);
      cancelAnimation(overlayOpacity);
      cancelAnimation(rendererOpacity);
      cancelAnimation(travelProgress);
    };
  }, [
    handleSequenceFinished,
    landingZone,
    motionProgress,
    overlayOpacity,
    durationMs,
    playbackId,
    rendererOpacity,
    rollValue,
    travelProgress,
    visible,
  ]);

  useEffect(() => {
    rendererOpacity.value = withTiming(rendererReady && !rendererFailed ? 1 : 0, {
      duration: 120,
      easing: Easing.out(Easing.quad),
    });
  }, [rendererFailed, rendererOpacity, rendererReady]);

  if (!shouldRender || !landingZone || activePlaybackId <= 0) {
    return null;
  }

  const resetKey = `${activePlaybackId}-${Math.round(landingZone.width)}-${Math.round(landingZone.height)}`;

  return (
    <View pointerEvents="none" style={styles.overlay}>
      <Animated.View pointerEvents="none" style={[styles.stageHost, stageMotionStyle]}>
        {rendererFailed ? (
          <EmergencyPlaceholderStage
            landingZone={landingZone}
            playbackId={activePlaybackId}
            progress={motionProgress}
            rollValue={latchedRollValue}
          />
        ) : (
          <StageErrorBoundary onError={handleBoundaryError} resetKey={resetKey}>
            <Animated.View pointerEvents="none" style={[styles.rendererLayer, rendererLayerStyle]}>
              <MatchDiceRollStageThree
                key={resetKey}
                durationMs={durationMs}
                onError={handleRendererError}
                onReady={handleRendererReady}
                playbackId={activePlaybackId}
                rollValue={latchedRollValue}
              />
            </Animated.View>
          </StageErrorBoundary>
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  placeholderDieCore: {
    ...StyleSheet.absoluteFillObject,
    margin: 3,
    borderRadius: 8,
    backgroundColor: 'rgba(228, 202, 161, 0.96)',
  },
  placeholderDieFace: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1.1,
    borderColor: 'rgba(111, 67, 26, 0.58)',
    backgroundColor: '#F1E0BF',
    overflow: 'hidden',
    shadowColor: '#1F0D04',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 6,
  },
  placeholderDieHighlight: {
    position: 'absolute',
    top: 1.5,
    left: 1.5,
    right: 1.5,
    height: '42%',
    borderRadius: 10,
    backgroundColor: 'rgba(255, 247, 228, 0.62)',
  },
  placeholderDieWrap: {
    position: 'absolute',
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  placeholderPip: {
    position: 'absolute',
    top: '42%',
    left: '42%',
    width: 7,
    height: 7,
    borderRadius: 999,
    backgroundColor: '#5C3618',
  },
  rendererLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  stageHost: {
    position: 'absolute',
  },
});
