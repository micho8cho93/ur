import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';

import { urTheme, urTypography } from '@/constants/urTheme';
import type { ProgressionAwardResponse, ProgressionSnapshot } from '@/shared/progression';
import {
  buildDisplayedProgressionSnapshot,
  formatProgressionXp,
} from '@/src/progression/progressionDisplay';
import { RankBadge } from './RankBadge';

interface XpProgressBarProps {
  snapshot: ProgressionSnapshot | null;
  award?: ProgressionAwardResponse | null;
  showInfoButton?: boolean;
  onInfoPress?: () => void;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
}

const resolveAnimationDuration = (deltaXp: number): number =>
  Math.max(700, Math.min(1_400, 760 + deltaXp * 5));

export const XpProgressBar: React.FC<XpProgressBarProps> = ({
  snapshot,
  award,
  showInfoButton = false,
  onInfoPress,
  compact = false,
  style,
}) => {
  const animatedXpRef = React.useRef(new Animated.Value(snapshot?.totalXp ?? 0));
  const lastAwardKeyRef = React.useRef<string | null>(null);
  const [displayedXp, setDisplayedXp] = React.useState(snapshot?.totalXp ?? 0);

  React.useEffect(() => {
    const animatedXp = animatedXpRef.current;
    const listenerId = animatedXp.addListener(({ value }) => {
      const roundedXp = Math.max(0, Math.round(value));
      setDisplayedXp((current) => (current === roundedXp ? current : roundedXp));
    });

    return () => {
      animatedXp.removeListener(listenerId);
    };
  }, []);

  React.useEffect(() => {
    return () => {
      animatedXpRef.current.stopAnimation();
    };
  }, []);

  const awardKey = award ? `${award.matchId}:${award.previousTotalXp}:${award.newTotalXp}` : null;

  React.useEffect(() => {
    const animatedXp = animatedXpRef.current;
    const targetXp = snapshot?.totalXp ?? 0;

    animatedXp.stopAnimation();

    if (award && awardKey && awardKey !== lastAwardKeyRef.current && award.newTotalXp === targetXp) {
      lastAwardKeyRef.current = awardKey;
      animatedXp.setValue(award.previousTotalXp);
      setDisplayedXp(award.previousTotalXp);

      Animated.timing(animatedXp, {
        toValue: award.newTotalXp,
        duration: resolveAnimationDuration(Math.abs(award.newTotalXp - award.previousTotalXp)),
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: false,
      }).start();

      return;
    }

    animatedXp.setValue(targetXp);
    setDisplayedXp(targetXp);
  }, [award, awardKey, snapshot?.totalXp]);

  if (!snapshot) {
    return (
      <View style={[styles.emptyWrap, style]}>
        <Text style={styles.progressSubtext}>Progression data is unavailable right now.</Text>
      </View>
    );
  }

  const liveSnapshot = buildDisplayedProgressionSnapshot(displayedXp);
  const isMaxRank = liveSnapshot.nextRank === null || liveSnapshot.nextRankThreshold === null;
  const progressWidth = `${Math.max(0, Math.min(100, liveSnapshot.progressPercent))}%` as ViewStyle['width'];
  const progressLabel = isMaxRank
    ? `${formatProgressionXp(displayedXp)} XP total`
    : `${formatProgressionXp(displayedXp)} / ${formatProgressionXp(
        liveSnapshot.nextRankThreshold ?? displayedXp,
      )} XP toward ${liveSnapshot.nextRank}`;
  const progressSubtext = isMaxRank
    ? 'Maximum title attained.'
    : `${formatProgressionXp(liveSnapshot.xpNeededForNextRank)} XP until ${liveSnapshot.nextRank}`;

  return (
    <View style={[styles.wrap, compact && styles.compactWrap, style]}>
      <View style={styles.headerRow}>
        <View style={styles.rankColumn}>
          <Text style={styles.eyebrow}>Current Rank</Text>
          <RankBadge
            title={liveSnapshot.currentRank}
            tone={isMaxRank ? 'max' : 'current'}
            size={compact ? 'sm' : 'md'}
          />
        </View>

        <View style={styles.metaColumn}>
          <Text style={styles.eyebrow}>Total XP</Text>
          <View style={styles.metaRow}>
            <Text style={[styles.totalXpValue, compact && styles.totalXpValueCompact]}>
              {formatProgressionXp(displayedXp)}
            </Text>
            {showInfoButton ? (
              <Pressable
                onPress={onInfoPress}
                accessibilityRole="button"
                accessibilityLabel="Open progression details"
                hitSlop={8}
                style={({ pressed }) => [styles.infoButton, pressed && styles.infoButtonPressed]}
              >
                <MaterialIcons name="info-outline" size={compact ? 16 : 18} color={urTheme.colors.parchment} />
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>

      <View style={[styles.track, compact && styles.trackCompact]}>
        <View style={[styles.fill, isMaxRank && styles.fillMax, { width: progressWidth }]}>
          <View style={styles.fillGloss} />
          <View style={styles.fillEdge} />
        </View>
      </View>

      <Text style={[styles.progressLabel, compact && styles.progressLabelCompact]}>{progressLabel}</Text>
      <Text style={styles.progressSubtext}>{progressSubtext}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    gap: urTheme.spacing.sm,
  },
  compactWrap: {
    gap: urTheme.spacing.xs,
  },
  emptyWrap: {
    minHeight: 64,
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: urTheme.spacing.sm,
  },
  rankColumn: {
    flex: 1,
    gap: 6,
  },
  metaColumn: {
    alignItems: 'flex-end',
    gap: 6,
  },
  eyebrow: {
    ...urTypography.label,
    color: 'rgba(240, 224, 196, 0.68)',
    fontSize: 10,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: urTheme.spacing.xs,
  },
  totalXpValue: {
    ...urTypography.title,
    color: '#FAEDD7',
    fontSize: 26,
    lineHeight: 30,
  },
  totalXpValueCompact: {
    fontSize: 22,
    lineHeight: 26,
  },
  infoButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(238, 206, 149, 0.32)',
    backgroundColor: 'rgba(10, 15, 22, 0.42)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoButtonPressed: {
    backgroundColor: 'rgba(40, 65, 96, 0.54)',
  },
  track: {
    height: 14,
    borderRadius: urTheme.radii.pill,
    overflow: 'hidden',
    backgroundColor: 'rgba(6, 11, 18, 0.56)',
    borderWidth: 1,
    borderColor: 'rgba(240, 224, 196, 0.14)',
  },
  trackCompact: {
    height: 12,
  },
  fill: {
    height: '100%',
    borderRadius: urTheme.radii.pill,
    backgroundColor: '#2F6CC8',
    overflow: 'hidden',
  },
  fillMax: {
    backgroundColor: urTheme.colors.gold,
  },
  fillGloss: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '54%',
    backgroundColor: 'rgba(255, 239, 203, 0.2)',
  },
  fillEdge: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: 10,
    backgroundColor: 'rgba(247, 230, 195, 0.12)',
  },
  progressLabel: {
    color: 'rgba(250, 238, 214, 0.94)',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  progressLabelCompact: {
    fontSize: 13,
    lineHeight: 18,
  },
  progressSubtext: {
    color: 'rgba(236, 223, 197, 0.7)',
    fontSize: 12,
    lineHeight: 17,
  },
});
