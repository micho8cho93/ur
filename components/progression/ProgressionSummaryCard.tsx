import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { HomeStatCard } from '@/components/home/HomeStatCard';
import { ProgressionRankIcon } from '@/components/progression/ProgressionRankIcon';
import { urRoyalButtonColors, urTextColors, urTextVariants } from '@/constants/urTheme';
import { useAuth } from '@/src/auth/useAuth';
import { useProgression } from '@/src/progression/useProgression';
import {
  buildDisplayedProgressionSnapshot,
  formatProgressionXp,
} from '@/src/progression/progressionDisplay';
import {
  HomeLayoutVariant,
  resolveHomeFredokaFontFamily,
} from '@/src/home/homeTheme';

interface ProgressionSummaryCardProps {
  style?: StyleProp<ViewStyle>;
  layoutVariant?: HomeLayoutVariant;
  fontLoaded?: boolean;
  onOpenRank?: () => void;
}

export const ProgressionSummaryCard: React.FC<ProgressionSummaryCardProps> = ({
  style,
  layoutVariant = 'desktop',
  fontLoaded = false,
  onOpenRank,
}) => {
  const { user } = useAuth();
  const { progression, errorMessage, isLoading } = useProgression();
  const isCompact = layoutVariant === 'compact';
  const fontFamily = resolveHomeFredokaFontFamily(fontLoaded);
  const snapshot =
    user?.provider === 'guest'
      ? buildDisplayedProgressionSnapshot(0)
      : progression
        ? buildDisplayedProgressionSnapshot(progression.totalXp)
        : null;
  const progressWidth = `${Math.max(0, Math.min(100, snapshot?.progressPercent ?? 0))}%` as ViewStyle['width'];

  let statusLabel = 'Start your climb';
  if (isLoading) {
    statusLabel = 'Loading progression';
  } else if (errorMessage) {
    statusLabel = 'Progress unavailable';
  }

  const helperLabel = snapshot
    ? snapshot.nextRank
      ? `${formatProgressionXp(snapshot.xpNeededForNextRank)} XP to ${snapshot.nextRank}`
      : 'Maximum rank reached'
    : statusLabel;

  return (
    <HomeStatCard
      title="XP & Rank"
      ctaLabel="Status"
      ctaAccessibilityLabel="Open status details"
      onCtaPress={onOpenRank ?? (() => undefined)}
      layoutVariant={layoutVariant}
      fontLoaded={fontLoaded}
      style={style}
      contentContainerStyle={isCompact ? styles.contentCompact : styles.contentDesktop}
      ctaStyle={isCompact ? styles.progressionCtaCompact : styles.progressionCtaDesktop}
    >
      {snapshot ? (
        <View
          accessibilityLabel={`XP progress ${Math.round(snapshot.progressPercent)} percent, rank ${snapshot.currentRank}`}
          style={styles.metricColumn}
        >
          <View style={styles.rankRow}>
            <Text
              numberOfLines={2}
              adjustsFontSizeToFit
              minimumFontScale={0.72}
              style={[
                styles.rankLabel,
                isCompact ? styles.rankLabelCompact : styles.rankLabelDesktop,
                { fontFamily },
              ]}
            >
              {snapshot.currentRank}
            </Text>

            <ProgressionRankIcon
              title={snapshot.currentRank}
              size={isCompact ? 54 : 60}
              accessibilityLabel={`Current progression rank badge: ${snapshot.currentRank}`}
              testID="progression-summary-rank-icon"
              style={styles.rankIcon}
            />
          </View>

          <View style={styles.trackShell}>
            <View style={[styles.trackFill, { width: progressWidth }]}>
              <View style={styles.trackGloss} />
            </View>
          </View>

          <Text
            numberOfLines={1}
            style={[
              styles.xpValue,
              isCompact ? styles.xpValueCompact : styles.xpValueDesktop,
              { fontFamily },
            ]}
          >
            {formatProgressionXp(snapshot.totalXp)} XP
          </Text>

          <Text
            numberOfLines={2}
            adjustsFontSizeToFit
            minimumFontScale={0.72}
            style={[
              styles.helperLabel,
              isCompact ? styles.helperLabelCompact : styles.helperLabelDesktop,
              { fontFamily },
            ]}
          >
            {helperLabel}
          </Text>
        </View>
      ) : (
        <View style={styles.stateContainer}>
          <Text
            numberOfLines={2}
            adjustsFontSizeToFit
            minimumFontScale={0.8}
            style={[
              styles.stateLabel,
              isCompact ? styles.stateLabelCompact : styles.stateLabelDesktop,
              { fontFamily },
            ]}
          >
            {statusLabel}
          </Text>
        </View>
      )}
    </HomeStatCard>
  );
};

const styles = StyleSheet.create({
  contentDesktop: {
    justifyContent: 'flex-start',
    paddingTop: 4,
    paddingBottom: 4,
  },
  contentCompact: {
    justifyContent: 'flex-start',
    paddingTop: 2,
    paddingBottom: 2,
  },
  progressionCtaDesktop: {
    top: -6,
  },
  progressionCtaCompact: {
    top: -16,
  },
  metricColumn: {
    width: '100%',
    alignItems: 'center',
    gap: 6,
  },
  rankRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  rankIcon: {
    flexShrink: 0,
  },
  rankLabel: {
    textAlign: 'right',
    color: urTextColors.titleOnPanel,
    ...urTextVariants.cardTitle,
    flexShrink: 1,
  },
  rankLabelDesktop: {
    fontSize: 21,
    lineHeight: 24,
    minHeight: 0,
    maxWidth: '58%',
  },
  rankLabelCompact: {
    fontSize: 20,
    lineHeight: 23,
    minHeight: 0,
    maxWidth: '56%',
  },
  trackShell: {
    width: '100%',
    height: 14,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: 'rgba(123, 79, 38, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(184, 134, 11, 0.26)',
    marginTop: -2,
  },
  trackFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: urRoyalButtonColors.mainFace,
    overflow: 'hidden',
  },
  trackGloss: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '56%',
    backgroundColor: urRoyalButtonColors.capGloss,
  },
  xpValue: {
    textAlign: 'center',
    color: urTextColors.titleOnPanel,
    ...urTextVariants.cardTitle,
  },
  xpValueDesktop: {
    fontSize: 24,
    lineHeight: 28,
    marginTop: -2,
  },
  xpValueCompact: {
    fontSize: 23,
    lineHeight: 27,
    marginTop: -2,
  },
  helperLabel: {
    textAlign: 'center',
    color: urTextColors.bodyMutedOnPanel,
    ...urTextVariants.body,
  },
  helperLabelDesktop: {
    fontSize: 13,
    lineHeight: 16,
    minHeight: 32,
  },
  helperLabelCompact: {
    fontSize: 12,
    lineHeight: 15,
    minHeight: 30,
  },
  stateContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  stateLabel: {
    textAlign: 'center',
    color: urTextColors.titleOnPanel,
    ...urTextVariants.cardTitle,
  },
  stateLabelDesktop: {
    fontSize: 20,
    lineHeight: 24,
  },
  stateLabelCompact: {
    fontSize: 18,
    lineHeight: 22,
  },
});
