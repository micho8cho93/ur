import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { boxShadow } from '@/constants/styleEffects';
import {
  urPanelColors,
  urTextColors,
  urTextVariants,
  urTheme,
  urTypography,
} from '@/constants/urTheme';
import type { ProgressionSnapshot } from '@/shared/progression';
import { formatProgressionXp, getProgressionDisplayTitle } from '@/src/progression/progressionDisplay';

interface XPDisplayProps {
  progression: ProgressionSnapshot | null;
  isLoading?: boolean;
  errorMessage?: string | null;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const XPDisplay: React.FC<XPDisplayProps> = ({
  progression,
  isLoading = false,
  errorMessage = null,
  compact = false,
  style,
}) => {
  const rankTitle = getProgressionDisplayTitle(progression?.currentRank) ?? progression?.currentRank ?? 'No title yet';

  return (
    <View style={[styles.card, compact && styles.cardCompact, style]}>
      <View style={styles.row}>
        <View style={styles.badge}>
          <Text style={styles.badgeLabel}>XP</Text>
        </View>
        <Text style={styles.title}>Royal Record</Text>
      </View>

      {progression ? (
        <>
          <Text style={[styles.totalXp, compact && styles.totalXpCompact]}>{formatProgressionXp(progression.totalXp)} XP</Text>
          <Text style={styles.subtitle}>{rankTitle}</Text>
          <Text style={styles.metaText}>
            {progression.nextRank
              ? `${formatProgressionXp(progression.xpNeededForNextRank)} XP until ${getProgressionDisplayTitle(progression.nextRank) ?? progression.nextRank}`
              : 'Maximum title reached in the current progression ladder.'}
          </Text>
        </>
      ) : isLoading ? (
        <>
          <Text style={[styles.totalXp, compact && styles.totalXpCompact]}>Loading…</Text>
          <Text style={styles.metaText}>Fetching your current XP from Nakama.</Text>
        </>
      ) : errorMessage ? (
        <>
          <Text style={[styles.totalXp, compact && styles.totalXpCompact]}>XP unavailable</Text>
          <Text style={styles.metaText}>{errorMessage}</Text>
        </>
      ) : (
        <>
          <Text style={[styles.totalXp, compact && styles.totalXpCompact]}>No XP yet</Text>
          <Text style={styles.metaText}>Your confirmed XP total will appear here after the server loads it.</Text>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: urTheme.radii.md,
    padding: urTheme.spacing.md,
    backgroundColor: urPanelColors.darkSurfaceSoft,
    borderWidth: 1,
    borderColor: urPanelColors.darkBorder,
    gap: urTheme.spacing.xs,
    ...boxShadow({
      color: urTheme.colors.deepShadow,
      opacity: 0.24,
      offset: { width: 0, height: 10 },
      blurRadius: 16,
      elevation: 6,
    }),
  },
  cardCompact: {
    paddingVertical: urTheme.spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: urTheme.spacing.sm,
  },
  badge: {
    borderRadius: urTheme.radii.pill,
    paddingHorizontal: urTheme.spacing.sm,
    paddingVertical: 4,
    backgroundColor: 'rgba(45, 156, 219, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(45, 156, 219, 0.28)',
  },
  badgeLabel: {
    ...urTypography.label,
    color: urTextColors.titleOnScene,
    fontSize: 10,
  },
  title: {
    ...urTextVariants.caption,
    color: urTextColors.captionOnScene,
    fontSize: 10,
  },
  totalXp: {
    ...urTextVariants.sectionTitle,
    color: urTextColors.titleOnScene,
    fontSize: 28,
    lineHeight: 34,
  },
  totalXpCompact: {
    fontSize: 24,
    lineHeight: 30,
  },
  subtitle: {
    ...urTextVariants.cardTitle,
    color: urTextColors.jewel,
    fontSize: 16,
    lineHeight: 22,
  },
  metaText: {
    color: 'rgba(230, 211, 163, 0.78)',
    fontSize: 13,
    lineHeight: 18,
    ...urTextVariants.body,
  },
});
