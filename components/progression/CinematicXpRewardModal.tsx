import React from 'react';
import {
  Animated,
  Easing,
  Modal as RNModal,
  Platform,
  StyleSheet,
  Text,
  View,
  type DimensionValue,
  useWindowDimensions,
} from 'react-native';

import { boxShadow } from '@/constants/styleEffects';
import { urTheme, urTypography } from '@/constants/urTheme';
import { buildDisplayedProgressionSnapshot, formatProgressionXp } from '@/src/progression/progressionDisplay';
import { XP_PROGRESS_FILL_COLOR } from '@/src/progression/xpProgressBarTheme';
import { HOME_FREDOKA_FONT_FAMILY, HOME_SUPERCELL_FONT_FAMILY } from '@/src/home/homeTheme';
import { RankBadge } from './RankBadge';

const REVEAL_IN_DURATION_MS = 280;
const REVEAL_STAGGER_DELAY_MS = 170;
const REVEAL_COMPLETE_DELAY_MS = 700;
const SWEEP_DURATION_MS = 800;
const USE_NATIVE_DRIVER = false;

const resolveFillDuration = (deltaXp: number): number =>
  Math.max(1_800, Math.min(3_300, 1_900 + Math.round(deltaXp * 4.5)));

interface CinematicXpRewardModalProps {
  visible: boolean;
  previousTotalXp: number;
  newTotalXp: number;
  onComplete: () => void;
}

export const CinematicXpRewardModal: React.FC<CinematicXpRewardModalProps> = ({
  visible,
  previousTotalXp,
  newTotalXp,
  onComplete,
}) => {
  const { width, height } = useWindowDimensions();
  const backdropOpacity = React.useRef(new Animated.Value(0)).current;
  const cardOpacity = React.useRef(new Animated.Value(0)).current;
  const cardScale = React.useRef(new Animated.Value(0.9)).current;
  const xpValue = React.useRef(new Animated.Value(previousTotalXp)).current;
  const sweepProgress = React.useRef(new Animated.Value(0)).current;
  const flashOpacity = React.useRef(new Animated.Value(0)).current;
  const badgePulse = React.useRef(new Animated.Value(0)).current;
  const rankBurst = React.useRef(new Animated.Value(0)).current;
  const completionTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const sweepLoopRef = React.useRef<Animated.CompositeAnimation | null>(null);
  const previousPresentationKeyRef = React.useRef<string | null>(null);
  const previousLiveRankRef = React.useRef<string>(
    buildDisplayedProgressionSnapshot(previousTotalXp).currentRank,
  );
  const [displayedXp, setDisplayedXp] = React.useState(previousTotalXp);
  const isMobileWeb = Platform.OS === 'web' && width < 760;
  const resolvedMaxWidth = Math.min(520, Math.max(300, width - (isMobileWeb ? 20 : 32)));
  const resolvedMaxHeight = Math.max(
    320,
    Math.min(height - (isMobileWeb ? 20 : 32), Math.round(height * (isMobileWeb ? 0.88 : 0.82))),
  );

  React.useEffect(() => {
    const listenerId = xpValue.addListener(({ value }) => {
      const roundedXp = Math.max(0, Math.round(value));
      setDisplayedXp((current) => (current === roundedXp ? current : roundedXp));
    });

    return () => {
      xpValue.removeListener(listenerId);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- xpValue is a stable ref-backed Animated.Value

  React.useEffect(() => {
    return () => {
      backdropOpacity.stopAnimation();
      cardOpacity.stopAnimation();
      cardScale.stopAnimation();
      xpValue.stopAnimation();
      sweepProgress.stopAnimation();
      flashOpacity.stopAnimation();
      badgePulse.stopAnimation();
      rankBurst.stopAnimation();
      sweepLoopRef.current?.stop();
      if (completionTimerRef.current) {
        clearTimeout(completionTimerRef.current);
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- cleanup-only effect with stable refs

  const liveSnapshot = buildDisplayedProgressionSnapshot(displayedXp);
  const previousSnapshot = buildDisplayedProgressionSnapshot(previousTotalXp);
  const awardedXp = Math.max(0, newTotalXp - previousTotalXp);
  const rankChanged = previousSnapshot.currentRank !== liveSnapshot.currentRank;
  const isMaxRank = liveSnapshot.nextRank === null || liveSnapshot.nextRankThreshold === null;
  const progressWidth = `${Math.max(0, Math.min(100, liveSnapshot.progressPercent))}%` as DimensionValue;
  const progressLabel = isMaxRank
    ? `${formatProgressionXp(displayedXp)} XP total`
    : `${formatProgressionXp(displayedXp)} / ${formatProgressionXp(
        liveSnapshot.nextRankThreshold ?? displayedXp,
      )} XP toward ${liveSnapshot.nextRank}`;
  const progressSubtext = isMaxRank
    ? 'Maximum title attained.'
    : `${formatProgressionXp(liveSnapshot.xpNeededForNextRank)} XP until ${liveSnapshot.nextRank}`;

  React.useEffect(() => {
    if (!visible) {
      previousLiveRankRef.current = previousSnapshot.currentRank;
      return;
    }

    if (liveSnapshot.currentRank === previousLiveRankRef.current) {
      return;
    }

    previousLiveRankRef.current = liveSnapshot.currentRank;
    badgePulse.stopAnimation();
    badgePulse.setValue(0);
    rankBurst.stopAnimation();
    rankBurst.setValue(0);

    Animated.parallel([
      Animated.sequence([
        Animated.timing(badgePulse, {
          toValue: 1,
          duration: 180,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
        Animated.spring(badgePulse, {
          toValue: 0,
          stiffness: 150,
          damping: 12,
          mass: 0.8,
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
      ]),
      Animated.sequence([
        Animated.timing(rankBurst, {
          toValue: 1,
          duration: 260,
          easing: Easing.out(Easing.quad),
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
        Animated.timing(rankBurst, {
          toValue: 0,
          duration: 260,
          easing: Easing.in(Easing.quad),
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
      ]),
    ]).start();
  }, [badgePulse, liveSnapshot.currentRank, previousSnapshot.currentRank, rankBurst, visible]);

  React.useEffect(() => {
    if (!visible) {
      return;
    }

    const presentationKey = `${previousTotalXp}:${newTotalXp}`;
    if (previousPresentationKeyRef.current === presentationKey) {
      return;
    }

    previousPresentationKeyRef.current = presentationKey;
    previousLiveRankRef.current = previousSnapshot.currentRank;

    if (completionTimerRef.current) {
      clearTimeout(completionTimerRef.current);
    }

    sweepLoopRef.current?.stop();
    sweepLoopRef.current = null;
    backdropOpacity.stopAnimation();
    cardOpacity.stopAnimation();
    cardScale.stopAnimation();
    xpValue.stopAnimation();
    sweepProgress.stopAnimation();
    flashOpacity.stopAnimation();
    badgePulse.stopAnimation();
    rankBurst.stopAnimation();

    backdropOpacity.setValue(0);
    cardOpacity.setValue(0);
    cardScale.setValue(0.9);
    xpValue.setValue(previousTotalXp);
    setDisplayedXp(previousTotalXp);
    sweepProgress.setValue(0);
    flashOpacity.setValue(0);
    badgePulse.setValue(0);
    rankBurst.setValue(0);

    const fillDuration = resolveFillDuration(awardedXp);
    sweepLoopRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(sweepProgress, {
          toValue: 1,
          duration: SWEEP_DURATION_MS,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
        Animated.timing(sweepProgress, {
          toValue: 0,
          duration: 0,
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
      ]),
    );

    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: REVEAL_IN_DURATION_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: REVEAL_IN_DURATION_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
      Animated.spring(cardScale, {
        toValue: 1,
        stiffness: 140,
        damping: 15,
        mass: 0.95,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
    ]).start(() => {
      sweepLoopRef.current?.start();

      Animated.sequence([
        Animated.delay(REVEAL_STAGGER_DELAY_MS),
        Animated.parallel([
          Animated.timing(xpValue, {
            toValue: newTotalXp,
            duration: fillDuration,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
          }),
          Animated.sequence([
            Animated.delay(Math.max(0, fillDuration - 260)),
            Animated.timing(flashOpacity, {
              toValue: 1,
              duration: 160,
              easing: Easing.out(Easing.quad),
              useNativeDriver: USE_NATIVE_DRIVER,
            }),
            Animated.timing(flashOpacity, {
              toValue: 0,
              duration: 260,
              easing: Easing.in(Easing.quad),
              useNativeDriver: USE_NATIVE_DRIVER,
            }),
          ]),
          Animated.sequence([
            Animated.delay(Math.max(0, fillDuration - 220)),
            Animated.timing(cardScale, {
              toValue: 1.035,
              duration: 160,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: USE_NATIVE_DRIVER,
            }),
            Animated.spring(cardScale, {
              toValue: 1,
              stiffness: 160,
              damping: 13,
              mass: 0.85,
              useNativeDriver: USE_NATIVE_DRIVER,
            }),
          ]),
        ]),
      ]).start(() => {
        sweepLoopRef.current?.stop();
        completionTimerRef.current = setTimeout(() => {
          completionTimerRef.current = null;
          onComplete();
        }, REVEAL_COMPLETE_DELAY_MS);
      });
    });
  }, [
    awardedXp,
    backdropOpacity,
    cardOpacity,
    cardScale,
    flashOpacity,
    newTotalXp,
    onComplete,
    previousSnapshot.currentRank,
    previousTotalXp,
    rankBurst,
    sweepProgress,
    visible,
    xpValue,
    badgePulse,
  ]);

  if (!visible) {
    return null;
  }

  const overlay = (
    <Animated.View
      testID="cinematic-xp-modal"
      style={[
        styles.backdrop,
        isMobileWeb && styles.backdropMobileWeb,
        {
          opacity: backdropOpacity,
        },
      ]}
    >
      <Animated.View
        style={[
          styles.sheet,
          isMobileWeb && styles.sheetMobileWeb,
          {
            maxWidth: resolvedMaxWidth,
            maxHeight: resolvedMaxHeight,
            opacity: cardOpacity,
            transform: [{ scale: cardScale }],
          },
        ]}
      >
        <Animated.View
          pointerEvents="none"
          style={[
            styles.sheetFlash,
            {
              opacity: flashOpacity,
            },
          ]}
        />
        <View style={styles.sheetInner}>
          <View style={styles.headerBlock}>
            <Text style={styles.eyebrow}>Victory Reward</Text>
            <Text style={styles.title}>XP Unleashed</Text>
            <Text style={styles.subtitle}>Your royal record rises in real time.</Text>
          </View>

          <View style={styles.rewardHero}>
            <Text style={styles.rewardLabel}>Match XP</Text>
            <Text style={styles.rewardValue}>{`+${formatProgressionXp(displayedXp - previousTotalXp)}`}</Text>
            <Text style={styles.rewardCaption}>{`${formatProgressionXp(previousTotalXp)} -> ${formatProgressionXp(
              displayedXp,
            )} total XP`}</Text>
          </View>

          <View style={styles.rankRow}>
            <View style={styles.rankColumn}>
              <Text style={styles.rankLabel}>Current Title</Text>
              <Animated.View
                style={{
                  transform: [
                    {
                      scale: badgePulse.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 1.12],
                      }),
                    },
                  ],
                }}
              >
                <RankBadge title={liveSnapshot.currentRank} tone={isMaxRank ? 'max' : 'current'} />
              </Animated.View>
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.rankBurst,
                  {
                    opacity: rankBurst.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 0.9],
                    }),
                    transform: [
                      {
                        scale: rankBurst.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.75, 1.5],
                        }),
                      },
                    ],
                  },
                ]}
              />
            </View>
            <View style={styles.rankMeta}>
              <Text style={styles.rankMetaLabel}>Reward Total</Text>
              <Text style={styles.rankMetaValue}>{`${formatProgressionXp(awardedXp)} XP`}</Text>
              <Text style={styles.rankMetaCaption}>{rankChanged ? 'Title advanced' : 'Title held'}</Text>
            </View>
          </View>

          <View style={styles.trackWrap}>
            <View style={styles.track}>
              <View style={[styles.fill, isMaxRank && styles.fillMax, { width: progressWidth }]} />
            </View>
          </View>

          <View style={styles.progressCopy}>
            <Text style={styles.progressLabel}>{progressLabel}</Text>
            <Text style={styles.progressSubtext}>{progressSubtext}</Text>
          </View>
        </View>
      </Animated.View>
    </Animated.View>
  );

  if (Platform.OS === 'web') {
    return <View style={styles.webOverlay}>{overlay}</View>;
  }

  return (
    <RNModal transparent visible animationType="none" presentationStyle="overFullScreen">
      {overlay}
    </RNModal>
  );
};

const styles = StyleSheet.create({
  webOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 130,
    elevation: 48,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(3, 7, 12, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: urTheme.spacing.md,
  },
  backdropMobileWeb: {
    justifyContent: 'flex-start',
    paddingTop: urTheme.spacing.lg,
    paddingBottom: urTheme.spacing.sm,
  },
  sheet: {
    width: '100%',
    borderRadius: urTheme.radii.lg,
    overflow: 'hidden',
    backgroundColor: '#22140D',
    borderWidth: 1.5,
    borderColor: 'rgba(244, 201, 116, 0.78)',
    ...boxShadow({
      color: '#000',
      opacity: 0.4,
      offset: { width: 0, height: 16 },
      blurRadius: 24,
      elevation: 18,
    }),
  },
  sheetMobileWeb: {
    maxHeight: '92%',
  },
  sheetFlash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 226, 168, 0.16)',
  },
  sheetInner: {
    paddingHorizontal: urTheme.spacing.lg,
    paddingVertical: urTheme.spacing.lg,
    gap: urTheme.spacing.md,
  },
  headerBlock: {
    alignItems: 'center',
    gap: 6,
  },
  eyebrow: {
    ...urTypography.label,
    color: '#F3D28B',
    fontSize: 11,
    letterSpacing: 1,
  },
  title: {
    ...urTypography.title,
    color: '#FFF0C8',
    fontSize: 34,
    lineHeight: 40,
    fontFamily: HOME_SUPERCELL_FONT_FAMILY,
    textAlign: 'center',
  },
  subtitle: {
    color: 'rgba(255, 236, 198, 0.82)',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  rewardHero: {
    borderRadius: urTheme.radii.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 216, 141, 0.28)',
    backgroundColor: 'rgba(74, 36, 18, 0.74)',
    paddingHorizontal: urTheme.spacing.md,
    paddingVertical: urTheme.spacing.md,
    alignItems: 'center',
    gap: 6,
  },
  rewardLabel: {
    ...urTypography.label,
    color: 'rgba(255, 236, 198, 0.76)',
    fontSize: 10,
  },
  rewardValue: {
    color: '#FFE6A9',
    fontSize: 44,
    lineHeight: 48,
    fontFamily: HOME_SUPERCELL_FONT_FAMILY,
  },
  rewardCaption: {
    color: 'rgba(255, 237, 208, 0.82)',
    fontSize: 13,
    lineHeight: 18,
    fontFamily: HOME_FREDOKA_FONT_FAMILY,
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: urTheme.spacing.md,
  },
  rankColumn: {
    flex: 1,
    gap: urTheme.spacing.xs,
    position: 'relative',
  },
  rankLabel: {
    ...urTypography.label,
    color: 'rgba(255, 232, 184, 0.7)',
    fontSize: 10,
  },
  rankBurst: {
    position: 'absolute',
    top: 28,
    left: 8,
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: 'rgba(255, 221, 149, 0.6)',
    backgroundColor: 'rgba(255, 204, 109, 0.08)',
  },
  rankMeta: {
    alignItems: 'flex-end',
    gap: 3,
  },
  rankMetaLabel: {
    ...urTypography.label,
    color: 'rgba(255, 232, 184, 0.7)',
    fontSize: 10,
  },
  rankMetaValue: {
    color: '#FFF0C8',
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '800',
    fontFamily: HOME_FREDOKA_FONT_FAMILY,
  },
  rankMetaCaption: {
    color: 'rgba(255, 237, 208, 0.72)',
    fontSize: 12,
    lineHeight: 17,
  },
  trackWrap: {
    gap: urTheme.spacing.sm,
  },
  track: {
    height: 22,
    borderRadius: urTheme.radii.pill,
    overflow: 'hidden',
    backgroundColor: 'rgba(9, 14, 20, 0.84)',
    borderWidth: 1,
    borderColor: 'rgba(255, 226, 168, 0.2)',
  },
  fill: {
    height: '100%',
    borderRadius: urTheme.radii.pill,
    overflow: 'hidden',
    backgroundColor: XP_PROGRESS_FILL_COLOR,
  },
  fillMax: {
    backgroundColor: XP_PROGRESS_FILL_COLOR,
  },
  progressCopy: {
    gap: 4,
  },
  progressLabel: {
    color: '#FFF0C8',
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
  },
  progressSubtext: {
    color: 'rgba(255, 237, 208, 0.74)',
    fontSize: 13,
    lineHeight: 18,
  },
});
