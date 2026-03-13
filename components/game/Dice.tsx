import { DiceRollScene } from '@/components/3d/DiceRollScene';
import { DEFAULT_DICE_ROLL_DURATION_MS } from '@/components/3d/DiceRollScene.shared';
import { boxShadow } from '@/constants/styleEffects';
import { urTheme, urTextures } from '@/constants/urTheme';
import React, { useEffect, useRef, useState } from 'react';
import { Image, StyleProp, StyleSheet, Text, TouchableOpacity, View, ViewStyle, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

const STAGE_ROLL_BUTTON_WIDTH_SCALE = 1.2;
const STAGE_ROLL_BUTTON_HEIGHT_SCALE = 0.8;
const STAGE_ROLL_SCENE_SCALE = 0.92;
const MOBILE_DICE_SCALE = 1.44;

interface DiceProps {
  value: number | null;
  rolling: boolean;
  onRoll: () => void;
  canRoll: boolean;
  mode?: 'panel' | 'stage';
  showNumericResult?: boolean;
  compact?: boolean;
  onResultShown?: () => void;
}

export const Dice: React.FC<DiceProps> = ({
  value,
  rolling,
  onRoll,
  canRoll,
  mode = 'panel',
  showNumericResult = true,
  compact = false,
  onResultShown,
}) => {
  const { width } = useWindowDimensions();
  const isMobileWidth = width < 760;
  const readiness = useSharedValue(canRoll ? 0.4 : 0);
  const wasRollingRef = useRef(false);
  const [showThreeRollScene, setShowThreeRollScene] = useState(false);
  const [scenePlaybackId, setScenePlaybackId] = useState(0);

  useEffect(() => {
    // Replay the decorative 3D cast every time the existing roll state starts.
    if (rolling && !wasRollingRef.current) {
      setShowThreeRollScene(true);
      setScenePlaybackId((current) => current + 1);
    }

    wasRollingRef.current = rolling;
  }, [rolling]);

  useEffect(() => {
    if (canRoll && !rolling) {
      readiness.value = withRepeat(
        withSequence(
          withTiming(0.82, { duration: 850, easing: Easing.inOut(Easing.quad) }),
          withTiming(0.22, { duration: 850, easing: Easing.inOut(Easing.quad) }),
        ),
        -1,
        true,
      );
      return;
    }

    cancelAnimation(readiness);
    readiness.value = withTiming(0, { duration: 180 });
  }, [canRoll, readiness, rolling]);

  const readinessStyle = useAnimatedStyle(() => ({
    opacity: readiness.value,
    transform: [{ scale: 0.98 + readiness.value * 0.06 }],
  }));

  const isSceneRolling = showThreeRollScene && scenePlaybackId > 0;

  const reportedResultPlaybackRef = useRef<number>(0);

  useEffect(() => {
    if (!showThreeRollScene) {
      return;
    }

    // Reset result reporting for the active cast so we can notify exactly once once it settles.
    reportedResultPlaybackRef.current = 0;
  }, [showThreeRollScene]);

  useEffect(() => {
    if (!onResultShown || value === null || isSceneRolling) {
      return;
    }

    if (reportedResultPlaybackRef.current === scenePlaybackId) {
      return;
    }

    reportedResultPlaybackRef.current = scenePlaybackId;
    onResultShown();
  }, [isSceneRolling, onResultShown, scenePlaybackId, value]);
  const shouldHoldSettledDice = value !== null && !isSceneRolling;
  const sceneVariant = isSceneRolling ? 'animated' : shouldHoldSettledDice ? 'settled' : 'start';
  const renderedPlaybackId = sceneVariant === 'start' ? scenePlaybackId + 1 : Math.max(scenePlaybackId, 1);
  const title = isSceneRolling ? 'Casting...' : value !== null ? `Result: ${value}` : 'Cast The Dice';
  const subtitle = isSceneRolling
    ? 'The astragali are in motion'
    : canRoll
      ? 'Tap to roll'
      : 'Wait for your turn';

  const isStage = mode === 'stage';
  const isCompactStage = compact && isStage;
  const isMobileCompactStage = isCompactStage && isMobileWidth;
  const isLaptopUp = width >= 1024;
  const sceneBaseSize = isCompactStage ? (isMobileCompactStage ? 0.64 : 0.78) : compact ? 1.06 : 1.32;
  const sceneSize = sceneBaseSize * (isStage ? STAGE_ROLL_SCENE_SCALE : 1) * (isMobileWidth ? MOBILE_DICE_SCALE : 1);
  const compactStageTitle = isSceneRolling ? 'Casting...' : value !== null ? `Result ${value}` : 'Cast Dice';
  const compactStageSubtitle = isSceneRolling ? 'Rolling' : canRoll ? 'Tap to roll' : 'Wait turn';

  const renderDiceVisual = (sceneStyle?: StyleProp<ViewStyle>) => (
    <View pointerEvents="none" style={[styles.rollSceneViewport, sceneStyle]}>
      <DiceRollScene
        playbackId={renderedPlaybackId}
        durationMs={DEFAULT_DICE_ROLL_DURATION_MS}
        size={sceneSize}
        variant={sceneVariant}
        onComplete={() => {
          setShowThreeRollScene(false);
        }}
      />
    </View>
  );

  return (
    <TouchableOpacity
      onPress={onRoll}
      disabled={!canRoll || rolling}
      activeOpacity={0.9}
      style={[styles.touchable, isStage && styles.stageTouchable, isMobileCompactStage && styles.mobileStageTouchable]}
    >
      <View
        style={[
          styles.card,
          compact && styles.compactCard,
          isStage ? styles.stageCard : styles.panelCard,
          compact && isStage && styles.compactStageCard,
          canRoll ? styles.cardActive : styles.cardLocked,
        ]}
      >
        <Image source={urTextures.goldInlay} resizeMode="repeat" style={styles.cardTexture} />
        <View style={styles.cardTopGlow} />
        <View style={styles.cardBorder} />
        <Animated.View style={[styles.readyHalo, readinessStyle]} />

        {isCompactStage ? (
          <View style={[styles.compactStageContent, isMobileCompactStage && styles.mobileCompactStageContent]}>
            <View style={[styles.diceRow, styles.compactDiceRow, styles.compactStageDiceRow]}>
              {renderDiceVisual([
                styles.compactStageRollSceneViewport,
                isMobileCompactStage && styles.mobileCompactStageRollSceneViewport,
              ])}
            </View>
            <View style={[styles.compactStageTextWrap, isMobileCompactStage && styles.mobileCompactStageTextWrap]}>
              {showNumericResult && (
                <Text
                  numberOfLines={1}
                  style={[
                    styles.title,
                    styles.compactTitle,
                    styles.compactStageTitle,
                    isMobileCompactStage && styles.mobileCompactStageTitle,
                  ]}
                >
                  {compactStageTitle}
                </Text>
              )}
              <Text
                numberOfLines={1}
                style={[
                  styles.subtitle,
                  styles.compactSubtitle,
                  styles.compactStageSubtitle,
                  isMobileCompactStage && styles.mobileCompactStageSubtitle,
                ]}
              >
                {compactStageSubtitle}
              </Text>
            </View>
          </View>
        ) : (
          <>
            <View style={[styles.diceRow, compact && styles.compactDiceRow]}>
              {renderDiceVisual(isStage ? styles.stageRollSceneViewport : compact ? styles.compactRollSceneViewport : undefined)}
            </View>

            {showNumericResult && (
              <Text
                style={[
                  styles.title,
                  compact && styles.compactTitle,
                  isLaptopUp && value !== null && !isSceneRolling && styles.resultTitleLarge,
                ]}
              >
                {title}
              </Text>
            )}
            <Text style={[styles.subtitle, compact && styles.compactSubtitle, isStage && styles.stageSubtitle]}>{subtitle}</Text>
          </>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  touchable: {
    width: '100%',
  },
  stageTouchable: {
    width: '120%',
    alignSelf: 'center',
  },
  mobileStageTouchable: {
    width: '100%',
    alignSelf: 'stretch',
  },
  card: {
    borderRadius: urTheme.radii.md,
    paddingHorizontal: urTheme.spacing.md,
    paddingVertical: urTheme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1.3,
    ...boxShadow({
      color: '#000',
      opacity: 0.28,
      offset: { width: 0, height: 6 },
      blurRadius: 8,
      elevation: 8,
    }),
  },
  panelCard: {
    minHeight: 144,
  },
  stageCard: {
    minHeight: Math.round(143 * STAGE_ROLL_BUTTON_HEIGHT_SCALE),
    borderRadius: urTheme.radii.pill,
    paddingHorizontal: Math.round(urTheme.spacing.md * STAGE_ROLL_BUTTON_WIDTH_SCALE),
    paddingVertical: Math.round(urTheme.spacing.md * STAGE_ROLL_BUTTON_HEIGHT_SCALE),
  },
  compactCard: {
    paddingHorizontal: urTheme.spacing.sm,
    paddingVertical: urTheme.spacing.sm,
  },
  compactStageCard: {
    minHeight: Math.round(56 * STAGE_ROLL_BUTTON_HEIGHT_SCALE),
    paddingHorizontal: Math.round(urTheme.spacing.sm * STAGE_ROLL_BUTTON_WIDTH_SCALE),
    paddingVertical: Math.round(7 * STAGE_ROLL_BUTTON_HEIGHT_SCALE),
  },
  cardActive: {
    backgroundColor: '#5A2E10',
    borderColor: 'rgba(200, 152, 30, 0.78)',
  },
  cardLocked: {
    backgroundColor: '#3A3228',
    borderColor: 'rgba(180, 160, 100, 0.32)',
    opacity: 0.72,
  },
  cardTexture: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.2,
  },
  cardTopGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '44%',
    backgroundColor: 'rgba(255, 224, 168, 0.14)',
  },
  cardBorder: {
    ...StyleSheet.absoluteFillObject,
    margin: 6,
    borderRadius: urTheme.radii.sm,
    borderWidth: 1,
    borderColor: 'rgba(246, 219, 163, 0.36)',
  },
  readyHalo: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    bottom: 10,
    borderRadius: urTheme.radii.sm,
    borderWidth: 1.5,
    borderColor: 'rgba(111, 184, 255, 0.8)',
  },
  diceRow: {
    marginBottom: urTheme.spacing.sm,
    marginTop: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactDiceRow: {
    marginBottom: urTheme.spacing.xs,
  },
  rollSceneViewport: {
    width: 244,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactRollSceneViewport: {
    width: 204,
    height: 78,
  },
  stageRollSceneViewport: {
    width: Math.round(244 * STAGE_ROLL_BUTTON_WIDTH_SCALE),
    height: Math.round(100 * STAGE_ROLL_BUTTON_HEIGHT_SCALE),
  },
  compactStageContent: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 0,
  },
  mobileCompactStageContent: {
    justifyContent: 'flex-start',
  },
  compactStageDiceRow: {
    marginTop: 0,
    marginBottom: 0,
    flexShrink: 0,
  },
  compactStageRollSceneViewport: {
    width: Math.round(118 * STAGE_ROLL_BUTTON_WIDTH_SCALE),
    height: Math.round(48 * STAGE_ROLL_BUTTON_HEIGHT_SCALE),
  },
  mobileCompactStageRollSceneViewport: {
    width: 108,
    height: 42,
  },
  compactStageTextWrap: {
    marginLeft: 8,
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
  },
  mobileCompactStageTextWrap: {
    marginLeft: 4,
  },
  title: {
    color: '#F6E6CC',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1.05,
    textTransform: 'uppercase',
  },
  compactTitle: {
    fontSize: 12,
    letterSpacing: 0.8,
  },
  resultTitleLarge: {
    fontSize: 18,
    lineHeight: 22,
  },
  compactStageTitle: {
    fontSize: 10,
    lineHeight: 11,
    letterSpacing: 0.65,
    textAlign: 'left',
  },
  mobileCompactStageTitle: {
    fontSize: 9,
    lineHeight: 10,
    letterSpacing: 0.5,
  },
  subtitle: {
    marginTop: 3,
    color: 'rgba(244, 223, 191, 0.9)',
    fontSize: 11,
    letterSpacing: 0.35,
  },
  compactSubtitle: {
    fontSize: 10,
    marginTop: 2,
  },
  compactStageSubtitle: {
    fontSize: 8,
    lineHeight: 10,
    letterSpacing: 0.4,
    marginTop: 1,
    textAlign: 'left',
  },
  mobileCompactStageSubtitle: {
    fontSize: 7,
    lineHeight: 9,
    letterSpacing: 0.3,
  },
  stageSubtitle: {
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: '600',
  },
});
