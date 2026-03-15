import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, LayoutChangeEvent, Platform, StyleSheet, View } from 'react-native';
import { Canvas } from '@react-three/fiber/native';
import { DICE_ROLL_NATIVE_CAMERA, DiceRollSceneContent, type DiceRollSceneContentProps } from './DiceRollScene.shared';

const CANVAS_READY_TIMEOUT_MS = Platform.OS === 'ios' ? 2200 : 900;
const AnimatedView = Animated.View;

type DiceSceneErrorBoundaryProps = {
  children: React.ReactNode;
  fallback: React.ReactNode;
  onError: (error: Error, info: React.ErrorInfo) => void;
  resetKey: string;
};

class DiceSceneErrorBoundary extends React.Component<DiceSceneErrorBoundaryProps, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    this.props.onError(error, info);
  }

  componentDidUpdate(prevProps: DiceSceneErrorBoundaryProps) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

type FallbackDiceSceneProps = Pick<DiceRollSceneContentProps, 'playbackId' | 'size' | 'variant'>;

const FallbackDiceScene: React.FC<FallbackDiceSceneProps> = ({ playbackId, size = 1, variant = 'animated' }) => {
  const motion = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    motion.stopAnimation();

    if (variant !== 'animated') {
      motion.setValue(1);
      return;
    }

    motion.setValue(0);
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(motion, {
          toValue: 1,
          duration: 520,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(motion, {
          toValue: 0,
          duration: 520,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();

    return () => {
      animation.stop();
      motion.stopAnimation();
    };
  }, [motion, playbackId, variant]);

  const clusterScale = Math.max(0.9, Math.min(1.18, size));

  return (
    <View pointerEvents="none" style={styles.fallbackWrap}>
      <View style={styles.fallbackGround} />
      <AnimatedView
        style={[
          styles.fallbackCluster,
          {
            opacity: variant === 'animated'
              ? motion.interpolate({ inputRange: [0, 1], outputRange: [0.84, 1] })
              : 0.96,
            transform: [
              {
                translateY: variant === 'animated'
                  ? motion.interpolate({ inputRange: [0, 1], outputRange: [3, -2] })
                  : 0,
              },
              {
                scale: variant === 'animated'
                  ? motion.interpolate({ inputRange: [0, 1], outputRange: [clusterScale * 0.98, clusterScale * 1.03] })
                  : clusterScale,
              },
            ],
          },
        ]}
      >
        {[0, 1, 2, 3].map((index) => (
          <AnimatedView
            key={`${playbackId}-${variant}-${index}`}
            style={[
              styles.fallbackDieWrap,
              {
                transform: [
                  { perspective: 220 },
                  {
                    translateY: variant === 'animated'
                      ? motion.interpolate({
                        inputRange: [0, 1],
                        outputRange: [index % 2 === 0 ? 4 : -5, index % 2 === 0 ? -5 : 4],
                      })
                      : 0,
                  },
                  {
                    rotate: variant === 'animated'
                      ? motion.interpolate({
                        inputRange: [0, 1],
                        outputRange: [`${-16 + index * 7}deg`, `${9 - index * 5}deg`],
                      })
                      : `${-10 + index * 5}deg`,
                  },
                  {
                    rotateX: variant === 'animated'
                      ? motion.interpolate({
                        inputRange: [0, 1],
                        outputRange: [`${28 - index * 4}deg`, `${-22 + index * 5}deg`],
                      })
                      : `${16 - index * 3}deg`,
                  },
                  {
                    rotateY: variant === 'animated'
                      ? motion.interpolate({
                        inputRange: [0, 1],
                        outputRange: [`${-18 + index * 6}deg`, `${14 - index * 5}deg`],
                      })
                      : `${-8 + index * 4}deg`,
                  },
                  {
                    scale: variant === 'settled'
                      ? 1.02
                      : variant === 'animated'
                        ? motion.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1.05] })
                        : 1,
                  },
                ],
              },
            ]}
          >
            <View style={styles.fallbackDieFace}>
              <View style={styles.fallbackDieTop} />
              <View style={styles.fallbackDieSide} />
              <View style={styles.fallbackDieInnerShadow} />
              <View style={styles.fallbackDieHighlight} />
              <View style={styles.fallbackPip} />
            </View>
          </AnimatedView>
        ))}
      </AnimatedView>
    </View>
  );
};

export const DiceRollScene: React.FC<DiceRollSceneContentProps> = ({
  durationMs,
  onComplete,
  playbackId,
  size,
  variant = 'animated',
}) => {
  const [showFallback, setShowFallback] = useState(true);
  const [layoutToken, setLayoutToken] = useState(0);
  const canvasReadyRef = useRef(false);
  const canvasFailedRef = useRef(false);
  const layoutReadyRef = useRef(false);
  const lastLayoutRef = useRef({ width: 0, height: 0 });
  const resetKey = `${playbackId}-${variant}`;
  const fallbackNode = <FallbackDiceScene playbackId={playbackId} size={size} variant={variant} />;

  useEffect(() => {
    canvasReadyRef.current = false;
    canvasFailedRef.current = false;
    setShowFallback(true);

    console.log('[DiceRollScene.native] mounting scene', {
      playbackId,
      variant,
    });
  }, [playbackId, variant]);

  useEffect(() => {
    if (!layoutReadyRef.current || canvasReadyRef.current || canvasFailedRef.current) {
      return;
    }

    console.log('[DiceRollScene.native] waiting for canvas ready', {
      playbackId,
      variant,
      width: lastLayoutRef.current.width,
      height: lastLayoutRef.current.height,
      timeoutMs: CANVAS_READY_TIMEOUT_MS,
    });

    const timeoutId = setTimeout(() => {
      if (!canvasReadyRef.current && !canvasFailedRef.current) {
        setShowFallback(true);
        console.warn('[DiceRollScene.native] canvas not ready after layout; rendering fallback', {
          playbackId,
          variant,
          width: lastLayoutRef.current.width,
          height: lastLayoutRef.current.height,
          timeoutMs: CANVAS_READY_TIMEOUT_MS,
        });
      }
    }, CANVAS_READY_TIMEOUT_MS);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [layoutToken, playbackId, variant]);

  const handleLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const { width, height } = event.nativeEvent.layout;
      const nextWidth = Math.round(width);
      const nextHeight = Math.round(height);

      if (nextWidth <= 0 || nextHeight <= 0) {
        return;
      }

      const layoutChanged =
        lastLayoutRef.current.width !== nextWidth || lastLayoutRef.current.height !== nextHeight;

      lastLayoutRef.current = {
        width: nextWidth,
        height: nextHeight,
      };
      layoutReadyRef.current = true;

      if (layoutChanged) {
        console.log('[DiceRollScene.native] layout ready', {
          playbackId,
          variant,
          width: nextWidth,
          height: nextHeight,
        });
        setLayoutToken((current) => current + 1);
      }
    },
    [playbackId, variant],
  );

  const handleCanvasCreated = useCallback(
    ({ gl }: { gl: { setClearColor: (color: number, alpha: number) => void } }) => {
      canvasReadyRef.current = true;
      setShowFallback(false);
      gl.setClearColor(0x000000, 0);
      console.log('[DiceRollScene.native] scene mounted', {
        playbackId,
        variant,
        width: lastLayoutRef.current.width,
        height: lastLayoutRef.current.height,
      });
    },
    [playbackId, variant],
  );

  const handleSceneFailed = useCallback(
    (error: Error, info: React.ErrorInfo) => {
      canvasFailedRef.current = true;
      setShowFallback(true);
      console.warn('[DiceRollScene.native] failed', {
        playbackId,
        variant,
        width: lastLayoutRef.current.width,
        height: lastLayoutRef.current.height,
        error: error.message,
        componentStack: info.componentStack,
      });
    },
    [playbackId, variant],
  );

  const handleSceneComplete = useCallback(() => {
    console.info('[DiceRollScene.native] scene completed', {
      playbackId,
      variant,
    });
    onComplete?.();
  }, [onComplete, playbackId, variant]);

  return (
    <View collapsable={false} onLayout={handleLayout} style={styles.wrap}>
      {showFallback ? <View style={styles.fallbackLayer}>{fallbackNode}</View> : null}

      <DiceSceneErrorBoundary
        fallback={<View style={styles.fallbackLayer}>{fallbackNode}</View>}
        onError={handleSceneFailed}
        resetKey={resetKey}
      >
        <View collapsable={false} onLayout={handleLayout} style={styles.canvasHost}>
          <Canvas
            style={styles.canvas}
            camera={DICE_ROLL_NATIVE_CAMERA}
            gl={{ antialias: true, alpha: true }}
            onCreated={handleCanvasCreated}
          >
            <DiceRollSceneContent
              durationMs={durationMs}
              onComplete={handleSceneComplete}
              playbackId={playbackId}
              renderProfile="native"
              size={size}
              variant={variant}
            />
          </Canvas>
        </View>
      </DiceSceneErrorBoundary>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    position: 'relative',
  },
  canvas: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  canvasHost: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  fallbackLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  fallbackWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  fallbackGround: {
    position: 'absolute',
    bottom: '28%',
    width: '78%',
    height: '22%',
    borderRadius: 999,
    backgroundColor: 'rgba(18, 9, 4, 0.34)',
  },
  fallbackCluster: {
    width: '78%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fallbackDieWrap: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackDieFace: {
    width: 18,
    height: 18,
    borderRadius: 4,
    backgroundColor: '#F2E2C2',
    borderWidth: 1,
    borderColor: '#8E6330',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
    shadowColor: '#140804',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.28,
    shadowRadius: 3,
  },
  fallbackDieTop: {
    position: 'absolute',
    top: -4,
    left: 2,
    width: 13,
    height: 6,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 3,
    backgroundColor: '#FFF2D8',
    borderWidth: 1,
    borderColor: 'rgba(168, 122, 62, 0.55)',
    transform: [{ skewX: '-28deg' }],
  },
  fallbackDieSide: {
    position: 'absolute',
    top: 1,
    right: -4,
    width: 6,
    height: 13,
    borderTopRightRadius: 3,
    borderBottomRightRadius: 4,
    backgroundColor: '#D6B27F',
    borderWidth: 1,
    borderColor: 'rgba(126, 82, 34, 0.6)',
    transform: [{ skewY: '-28deg' }],
  },
  fallbackDieInnerShadow: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '42%',
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    backgroundColor: 'rgba(118, 74, 29, 0.12)',
  },
  fallbackDieHighlight: {
    position: 'absolute',
    top: 1,
    left: 1,
    right: 4,
    height: '42%',
    borderRadius: 4,
    backgroundColor: 'rgba(255, 249, 236, 0.6)',
  },
  fallbackPip: {
    width: 5,
    height: 5,
    borderRadius: 999,
    backgroundColor: '#9A6633',
  },
});
