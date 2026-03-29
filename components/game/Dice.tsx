import { SlotDiceScene } from '@/components/game/SlotDiceScene';
import { boxShadow } from '@/constants/styleEffects';
import { urTheme, urTextures } from '@/constants/urTheme';
import React, { useEffect, useRef, useState } from 'react';
import { Image, Platform, StyleProp, StyleSheet, Text, TouchableOpacity, View, ViewStyle, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { DEFAULT_DICE_ROLL_DURATION_MS } from './slotDiceShared';

const STAGE_ROLL_BUTTON_WIDTH_SCALE = 1.2;
const STAGE_ROLL_BUTTON_HEIGHT_SCALE = 0.8;
const STAGE_ROLL_SCENE_SCALE = 1.08;
const MOBILE_DICE_SCALE = 1.62;
const MOBILE_DICE_VIEWPORT_WIDTH_SCALE = 1.5;
const ROLL_BUTTON_ART = require('../../assets/buttons/roll_button.png');

interface DiceProps {
  animationDurationMs?: number;
  value: number | null;
  rolling: boolean;
  onRoll: () => void;
  canRoll: boolean;
  pressedIn?: boolean;
  mode?: 'panel' | 'stage';
  showNumericResult?: boolean;
  showStatusCopy?: boolean;
  compact?: boolean;
  onResultShown?: () => void;
  showVisual?: boolean;
  visualPlacement?: 'embedded' | 'external';
  artSize?: number;
}

interface DiceStageVisualProps {
  animationDurationMs?: number;
  value: number | null;
  rolling: boolean;
  canRoll: boolean;
  compact?: boolean;
  diceImageScale?: number;
  fitToContainer?: boolean;
  onResultShown?: () => void;
  reelOrientation?: 'horizontal' | 'vertical';
  visible?: boolean;
}

interface DiceSceneStateParams {
  value: number | null;
  rolling: boolean;
  canRoll: boolean;
  showVisual: boolean;
}

const useDiceSceneState = ({
  value,
  rolling,
  canRoll,
  showVisual,
}: DiceSceneStateParams) => {
  const previousShowVisualRef = useRef(showVisual);
  const wasRollingRef = useRef(false);
  const [scenePlaybackId, setScenePlaybackId] = useState(0);
  const [lastResolvedValue, setLastResolvedValue] = useState<number | null>(value);

  useEffect(() => {
    const visualActivatedDuringRoll = showVisual && rolling && !previousShowVisualRef.current;

    if (rolling && (!wasRollingRef.current || visualActivatedDuringRoll)) {
      setLastResolvedValue(null);
      if (showVisual) {
        setScenePlaybackId((current) => current + 1);
      }
    }

    previousShowVisualRef.current = showVisual;
    wasRollingRef.current = rolling;
  }, [rolling, showVisual]);

  useEffect(() => {
    if (value !== null) {
      setLastResolvedValue(value);
    }
  }, [value]);

  useEffect(() => {
    if (!rolling && canRoll && value === null) {
      setLastResolvedValue(null);
    }
  }, [canRoll, rolling, value]);

  const resolvedValue = value ?? lastResolvedValue;
  const isSceneRolling = showVisual && rolling;

  const hasSettledResult = resolvedValue !== null && !rolling;
  const shouldHoldSettledDice = hasSettledResult && showVisual;
  const sceneVariant: 'animated' | 'settled' | 'start' = isSceneRolling
    ? 'animated'
    : shouldHoldSettledDice
      ? 'settled'
      : 'start';
  const renderedPlaybackId = sceneVariant === 'start' ? scenePlaybackId + 1 : Math.max(scenePlaybackId, 1);

  return {
    hasSettledResult,
    isSceneRolling,
    renderedPlaybackId,
    resolvedValue,
    sceneVariant,
  };
};

export const DiceStageVisual: React.FC<DiceStageVisualProps> = ({
  animationDurationMs = DEFAULT_DICE_ROLL_DURATION_MS,
  value,
  rolling,
  canRoll,
  compact = false,
  diceImageScale = 1,
  fitToContainer = false,
  onResultShown,
  reelOrientation = 'horizontal',
  visible = true,
}) => {
  const { width } = useWindowDimensions();
  const isCompactVisual = compact || width < 1280;
  const sceneSize = isCompactVisual ? 1.12 : 1.26;
  const { renderedPlaybackId, resolvedValue, sceneVariant } = useDiceSceneState({
    value,
    rolling,
    canRoll,
    showVisual: visible,
  });

  if (!visible) {
    return null;
  }

  return (
    <View pointerEvents="none" testID="dice-stage-visual" style={styles.externalStageVisualWrap}>
      <View
        pointerEvents="none"
        style={[
          fitToContainer
            ? styles.externalStageVisualViewportFill
            : styles.externalStageVisualViewport,
          !fitToContainer && isCompactVisual && styles.externalStageVisualViewportCompact,
        ]}
      >
        <SlotDiceScene
          diceImageScale={diceImageScale}
          playbackId={renderedPlaybackId}
          durationMs={animationDurationMs}
          onSettled={onResultShown}
          orientation={reelOrientation}
          rollValue={resolvedValue}
          presentation="stage"
          size={sceneSize}
          variant={sceneVariant}
        />
      </View>
    </View>
  );
};

export const Dice: React.FC<DiceProps> = ({
  animationDurationMs = DEFAULT_DICE_ROLL_DURATION_MS,
  value,
  rolling,
  onRoll,
  canRoll,
  pressedIn = false,
  mode = 'panel',
  showNumericResult = true,
  showStatusCopy = true,
  compact = false,
  onResultShown,
  showVisual = true,
  visualPlacement = 'embedded',
  artSize,
}) => {
  const { width } = useWindowDimensions();
  const isMobileWidth = width < 760;
  const isIOS = Platform.OS === 'ios';
  const showEmbeddedVisual = visualPlacement === 'embedded';
  const shouldRenderEmbeddedVisual = showEmbeddedVisual && showVisual;
  const readiness = useSharedValue(canRoll ? 0.4 : 0);
  const {
    hasSettledResult,
    isSceneRolling,
    renderedPlaybackId,
    resolvedValue,
    sceneVariant,
  } = useDiceSceneState({
    value,
    rolling,
    canRoll,
    showVisual: shouldRenderEmbeddedVisual,
  });

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

  const sunkDepth = useSharedValue(pressedIn ? 1 : 0);
  const popPulse = useSharedValue(0);
  const impactPulse = useSharedValue(0);

  useEffect(() => {
    if (pressedIn) {
      sunkDepth.value = withTiming(1, {
        duration: 110,
        easing: Easing.out(Easing.cubic),
      });
      popPulse.value = 0;
      // As the button lands (near the end of its 110ms drop), spike the dark shadow outward then settle it quickly
      impactPulse.value = withSequence(
        withTiming(0, { duration: 80 }),
        withTiming(1, { duration: 40, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: 160, easing: Easing.out(Easing.quad) }),
      );
    } else {
      sunkDepth.value = withTiming(0, {
        duration: 190,
        easing: Easing.out(Easing.quad),
      });
      impactPulse.value = 0;
      // Spike the golden pop pulse then decay — creates the springback burst
      popPulse.value = withSequence(
        withTiming(1, { duration: 80, easing: Easing.out(Easing.cubic) }),
        withTiming(0, { duration: 420, easing: Easing.out(Easing.quad) }),
      );
    }
  }, [pressedIn, sunkDepth, popPulse, impactPulse]);

  const readinessStyle = useAnimatedStyle(() => ({
    opacity: readiness.value,
    transform: [{ scale: 0.98 + readiness.value * 0.06 }],
  }));

  const sunkShellStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: sunkDepth.value * 16 },
      { scaleX: 1 - sunkDepth.value * 0.04 },
      { scaleY: 1 - sunkDepth.value * 0.05 },
    ],
  }));

  const sunkOverlayStyle = useAnimatedStyle(() => ({
    opacity: sunkDepth.value * 0.78,
  }));

  // Inset shadow that darkens the edges when the button is sunken/latched
  const sunkShadowStyle = useAnimatedStyle(() => ({
    boxShadow: [
      {
        // Deep top inset shadow — strong indication of cavity depth
        color: `rgba(15, 5, 0, ${(sunkDepth.value * 0.98).toFixed(3)})`,
        offsetX: 0,
        offsetY: 18,
        blurRadius: 24,
        spreadDistance: 4,
        inset: true,
      },
      {
        // Overall darkening ambient vignette inside the hole (cavernous lack of light)
        color: `rgba(0, 0, 0, ${(sunkDepth.value * 0.75).toFixed(3)})`,
        offsetX: 0,
        offsetY: 4,
        blurRadius: 16,
        spreadDistance: 8,
        inset: true,
      },
      {
        // Bottom inset — blocked light from below
        color: `rgba(10, 3, 0, ${(sunkDepth.value * 0.85).toFixed(3)})`,
        offsetX: 0,
        offsetY: -6,
        blurRadius: 14,
        spreadDistance: 1,
        inset: true,
      },
      {
        // Left side deep inset — thick wall shadow
        color: `rgba(5, 1, 0, ${(sunkDepth.value * 0.8).toFixed(3)})`,
        offsetX: 12,
        offsetY: 0,
        blurRadius: 18,
        spreadDistance: 2,
        inset: true,
      },
      {
        // Right side deep inset — thick wall shadow
        color: `rgba(5, 1, 0, ${(sunkDepth.value * 0.8).toFixed(3)})`,
        offsetX: -12,
        offsetY: 0,
        blurRadius: 18,
        spreadDistance: 2,
        inset: true,
      },
    ],
  }));

  // Outward shadows for both the deep sunk state and the golden pop burst
  const outerShadowStyle = useAnimatedStyle(() => ({
    boxShadow: [
      {
        // Dark external ambient glow pushing outward when button is sunken in, plus sharper, tighter impact spike
        color: `rgba(10, 3, 0, ${Math.min(1, sunkDepth.value * 0.65 + impactPulse.value * 0.2).toFixed(3)})`,
        offsetX: 0,
        offsetY: 0,
        blurRadius: 20 + impactPulse.value * 6,
        spreadDistance: sunkDepth.value * 5 + impactPulse.value * 4,
        inset: false,
      },
      {
        // Warm golden pop burst on release
        color: `rgba(210, 148, 40, ${(popPulse.value * 0.72).toFixed(3)})`,
        offsetX: 0,
        offsetY: 0,
        blurRadius: 18,
        spreadDistance: popPulse.value * 4,
        inset: false,
      },
      {
        // Soft outer lift shadow restore
        color: `rgba(0, 0, 0, ${(popPulse.value * 0.32).toFixed(3)})`,
        offsetX: 0,
        offsetY: 6 + popPulse.value * 6,
        blurRadius: 10 + popPulse.value * 8,
        spreadDistance: 0,
        inset: false,
      },
    ],
  }));

  const title = isSceneRolling ? 'Casting...' : resolvedValue !== null ? `Result: ${resolvedValue}` : 'Cast The Dice';
  const subtitle = isSceneRolling
    ? 'The astragali are in motion'
    : hasSettledResult
      ? 'Result ready'
      : canRoll
        ? 'Tap to roll'
        : 'Wait for your turn';

  const isStage = mode === 'stage';
  const isCompactStage = compact && isStage;
  const isMobileCompactStage = isCompactStage && isMobileWidth;
  const isLaptopUp = width >= 1024;
  const useRollButtonArt = isStage && (isMobileCompactStage || Platform.OS === 'web');
  const rollButtonSize = artSize ?? (
    isMobileCompactStage
      ? Math.min(Math.max(Math.round(width * 0.24), 82), 108)
      : Math.min(Math.max(Math.round(width * (compact ? 0.14 : 0.12)), compact ? 110 : 122), compact ? 136 : 156)
  );
  // The actual stone button occupies ~87.1% of the PNG file (which includes transparent padding)
  const artBoundsScale = 0.89;
  const opaqueSize = Math.round(rollButtonSize * artBoundsScale);
  const imageOffset = Math.round((opaqueSize - rollButtonSize) / 2);

  // Corner radius to match the PNG squircle shape (~24% of the opaque button size)
  const rollButtonBorderRadius = Math.round(opaqueSize * 0.24);
  // Card button outer shell radius — must match the card's own borderRadius
  const cardShellBorderRadius = isStage ? urTheme.radii.pill : urTheme.radii.md;
  const sceneBaseSize = isCompactStage
    ? isMobileCompactStage
      ? isIOS
        ? 0.72
        : 0.64
      : isIOS
        ? 0.84
        : 0.78
    : compact
      ? 1.06
      : 1.32;
  const mobileDiceScale = isIOS ? MOBILE_DICE_SCALE * 1.08 : MOBILE_DICE_SCALE;
  const sceneSize = sceneBaseSize * (isStage ? STAGE_ROLL_SCENE_SCALE : 1) * (isMobileWidth ? mobileDiceScale : 1);
  const compactStageTitle = isSceneRolling ? 'Casting...' : hasSettledResult ? 'Roll Result' : 'Cast Dice';
  const compactStageSubtitle = isSceneRolling ? 'Rolling' : hasSettledResult ? 'Result ready' : canRoll ? 'Tap to roll' : 'Wait turn';
  const isRollDisabled = !canRoll || rolling || pressedIn;

  const renderDiceVisual = (sceneStyle?: StyleProp<ViewStyle>) => (
    <View pointerEvents="none" testID="dice-roll-scene-host" style={[styles.rollSceneViewport, sceneStyle]}>
      <SlotDiceScene
        playbackId={renderedPlaybackId}
        durationMs={animationDurationMs}
        onSettled={onResultShown}
        rollValue={resolvedValue}
        size={sceneSize}
        variant={sceneVariant}
      />
    </View>
  );

  if (useRollButtonArt) {
    return (
      <TouchableOpacity
        onPress={onRoll}
        disabled={isRollDisabled}
        activeOpacity={0.9}
        testID="dice-roll-button"
        style={[styles.touchable, isMobileCompactStage && styles.mobileStageTouchable, styles.artStageTouchable]}
      >
        <View style={styles.mobileArtStack}>
          {shouldRenderEmbeddedVisual ? (
            <View style={styles.mobileArtVisualRow}>
              {renderDiceVisual(styles.mobileArtRollSceneViewport)}
            </View>
          ) : null}

          {/* Outer pop-glow shell: borderRadius makes the burst hug the squircle shape */}
          <Animated.View
            testID="dice-roll-button-shell"
            style={[
              styles.buttonVisualShell,
              styles.mobileArtButtonShell,
              sunkShellStyle,
              outerShadowStyle,
              { borderRadius: rollButtonBorderRadius },
            ]}
          >
            {/* Inner inset-shadow wrap: overflow hidden clips shadows to rounded shape */}
            <Animated.View
              style={[
                styles.mobileArtButtonWrap,
                {
                  width: opaqueSize,
                  height: opaqueSize,
                  borderRadius: rollButtonBorderRadius,
                  overflow: 'hidden',
                },
                !canRoll && styles.mobileArtButtonWrapLocked,
                sunkShadowStyle,
              ]}
            >
              <Image
                testID="dice-roll-art"
                source={ROLL_BUTTON_ART}
                resizeMode="contain"
                style={[
                  styles.mobileArtButtonImage,
                  {
                    position: 'absolute',
                    top: imageOffset,
                    left: imageOffset,
                    width: rollButtonSize,
                    height: rollButtonSize,
                  },
                ]}
              />
            </Animated.View>
          </Animated.View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onRoll}
      disabled={isRollDisabled}
      activeOpacity={0.9}
      testID="dice-roll-button"
      style={[styles.touchable, isStage && styles.stageTouchable, isMobileCompactStage && styles.mobileStageTouchable]}
    >
      <Animated.View testID="dice-roll-button-shell" style={[styles.buttonVisualShell, styles.cardVisualShell, sunkShellStyle, outerShadowStyle, { borderRadius: cardShellBorderRadius }]}>
        <Animated.View
          style={[
            styles.card,
            compact && styles.compactCard,
            isStage ? styles.stageCard : styles.panelCard,
            compact && isStage && styles.compactStageCard,
            canRoll ? styles.cardActive : styles.cardLocked,
            sunkShadowStyle,
          ]}
        >
          <Image source={urTextures.goldInlay} resizeMode="repeat" style={styles.cardTexture} />
          <View style={styles.cardTopGlow} />
          <View style={styles.cardBorder} />
          <Animated.View pointerEvents="none" style={[styles.sunkenOverlay, sunkOverlayStyle]} />
          <Animated.View style={[styles.readyHalo, readinessStyle]} />

          {isCompactStage ? (
            <View style={[styles.compactStageContent, isMobileCompactStage && styles.mobileCompactStageContent]}>
              {shouldRenderEmbeddedVisual ? (
                <View style={[styles.diceRow, styles.compactDiceRow, styles.compactStageDiceRow]}>
                  {renderDiceVisual([
                    styles.compactStageRollSceneViewport,
                    isIOS && styles.iosCompactStageRollSceneViewport,
                    isMobileCompactStage && styles.mobileCompactStageRollSceneViewport,
                    isMobileCompactStage && isIOS && styles.iosMobileCompactStageRollSceneViewport,
                  ])}
                </View>
              ) : null}
              <View
                style={[
                  styles.compactStageTextWrap,
                  !shouldRenderEmbeddedVisual && styles.externalCompactStageTextWrap,
                  isMobileCompactStage && styles.mobileCompactStageTextWrap,
                ]}
              >
                {showStatusCopy && showNumericResult && hasSettledResult ? (
                  <View style={[styles.compactStageResultBadge, isMobileCompactStage && styles.mobileCompactStageResultBadge]}>
                    <Text style={[styles.compactStageResultLabel, isMobileCompactStage && styles.mobileCompactStageResultLabel]}>
                      Roll
                    </Text>
                    <Text style={[styles.compactStageResultValue, isMobileCompactStage && styles.mobileCompactStageResultValue]}>
                      {resolvedValue}
                    </Text>
                  </View>
                ) : showStatusCopy && showNumericResult ? (
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
                ) : null}
                {showStatusCopy ? (
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
                ) : null}
              </View>
            </View>
          ) : (
            <>
              {shouldRenderEmbeddedVisual ? (
                <View style={[styles.diceRow, compact && styles.compactDiceRow]}>
                  {renderDiceVisual(isStage ? styles.stageRollSceneViewport : compact ? styles.compactRollSceneViewport : undefined)}
                </View>
              ) : null}

              {showStatusCopy && showNumericResult && (
                <Text
                  style={[
                    styles.title,
                    compact && styles.compactTitle,
                    isLaptopUp && resolvedValue !== null && !isSceneRolling && styles.resultTitleLarge,
                  ]}
                >
                  {title}
                </Text>
              )}
              {showStatusCopy ? (
                <Text style={[styles.subtitle, compact && styles.compactSubtitle, isStage && styles.stageSubtitle]}>{subtitle}</Text>
              ) : null}
            </>
          )}
        </Animated.View>
      </Animated.View>
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
  artStageTouchable: {
    width: 'auto',
    alignSelf: 'center',
  },
  buttonVisualShell: {
    alignSelf: 'stretch',
  },
  cardVisualShell: {
    width: '100%',
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
  sunkenOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(23, 10, 4, 0.22)',
    opacity: 0,
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
    width: 276,
    height: 122,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactRollSceneViewport: {
    width: 232,
    height: 96,
  },
  stageRollSceneViewport: {
    width: Math.round(262 * STAGE_ROLL_BUTTON_WIDTH_SCALE),
    height: Math.round(112 * STAGE_ROLL_BUTTON_HEIGHT_SCALE),
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
    width: Math.round(150 * STAGE_ROLL_BUTTON_WIDTH_SCALE),
    height: Math.round(64 * STAGE_ROLL_BUTTON_HEIGHT_SCALE),
  },
  iosCompactStageRollSceneViewport: {
    width: Math.round(158 * STAGE_ROLL_BUTTON_WIDTH_SCALE),
    height: Math.round(68 * STAGE_ROLL_BUTTON_HEIGHT_SCALE),
  },
  mobileCompactStageRollSceneViewport: {
    width: Math.round(138 * MOBILE_DICE_VIEWPORT_WIDTH_SCALE),
    height: 58,
  },
  iosMobileCompactStageRollSceneViewport: {
    width: Math.round(148 * MOBILE_DICE_VIEWPORT_WIDTH_SCALE),
    height: 62,
  },
  compactStageTextWrap: {
    marginLeft: 8,
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
  },
  externalCompactStageTextWrap: {
    marginLeft: 0,
    alignItems: 'center',
  },
  mobileCompactStageTextWrap: {
    marginLeft: 4,
  },
  compactStageResultBadge: {
    alignSelf: 'flex-start',
    minWidth: 68,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: urTheme.radii.pill,
    borderWidth: 1,
    borderColor: 'rgba(246, 219, 163, 0.45)',
    backgroundColor: 'rgba(28, 12, 3, 0.72)',
  },
  mobileCompactStageResultBadge: {
    minWidth: 60,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  compactStageResultLabel: {
    color: 'rgba(246, 219, 163, 0.84)',
    fontSize: 8,
    lineHeight: 9,
    fontWeight: '700',
    letterSpacing: 0.85,
    textTransform: 'uppercase',
  },
  mobileCompactStageResultLabel: {
    fontSize: 7,
    lineHeight: 8,
  },
  compactStageResultValue: {
    marginTop: 1,
    color: '#FFF2D8',
    fontSize: 18,
    lineHeight: 18,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  mobileCompactStageResultValue: {
    fontSize: 16,
    lineHeight: 16,
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
  mobileArtStack: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mobileArtVisualRow: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 72,
    marginBottom: 4,
  },
  mobileArtRollSceneViewport: {
    width: Math.round(188 * MOBILE_DICE_VIEWPORT_WIDTH_SCALE),
    height: 90,
  },
  mobileArtButtonWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  mobileArtButtonShell: {
    alignSelf: 'center',
  },
  mobileArtButtonWrapLocked: {
    opacity: 0.62,
  },
  mobileArtButtonImage: {
    alignSelf: 'center',
  },
  externalStageVisualWrap: {
    width: '100%',
    height: '100%',
    alignItems: 'stretch',
    justifyContent: 'center',
  },
  externalStageVisualViewport: {
    width: '100%',
    maxWidth: 264,
    height: 130,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  externalStageVisualViewportCompact: {
    maxWidth: 242,
    height: 112,
  },
  externalStageVisualViewportFill: {
    width: '100%',
    height: '100%',
    maxWidth: '100%',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stageSubtitle: {
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: '600',
  },
});
