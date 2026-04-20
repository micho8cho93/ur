import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { boxShadow } from '@/constants/styleEffects';
import {
  urPanelColors,
  urTextColors,
  urTextVariants,
  urTheme,
  urTypography,
} from '@/constants/urTheme';
import type { ChallengeViewModel } from '@/src/challenges/challengeUi';

interface ChallengeCardProps {
  challenge: ChallengeViewModel;
  highlight?: boolean;
}

const STATUS_LABELS: Record<ChallengeViewModel['status'], string> = {
  locked: 'Locked',
  available: 'Available',
  in_progress: 'In Progress',
  completed: 'Completed',
};

export const ChallengeCard: React.FC<ChallengeCardProps> = ({ challenge, highlight = false }) => {
  const isCompleted = challenge.status === 'completed';
  const isInProgress = challenge.status === 'in_progress';
  const hasProgress =
    isInProgress &&
    challenge.progressCurrent != null &&
    challenge.progressTarget != null &&
    challenge.progressTarget > 0;
  const progressPercent = hasProgress
    ? Math.min(100, (challenge.progressCurrent! / challenge.progressTarget!) * 100)
    : 0;

  return (
    <View
      style={[
        styles.card,
        isCompleted && styles.cardCompleted,
        highlight && styles.cardHighlight,
      ]}
    >
      <View style={styles.headerRow}>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>{challenge.name}</Text>
          <Text style={styles.description}>{challenge.description}</Text>
        </View>

        <View style={[styles.statusBadge, styles[`statusBadge_${challenge.status}`]]}>
          <Text style={[styles.statusLabel, styles[`statusLabel_${challenge.status}`]]}>
            {STATUS_LABELS[challenge.status]}
          </Text>
        </View>
      </View>

      {hasProgress ? (
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progressPercent}%` as `${number}%` }]} />
        </View>
      ) : null}

      <View style={styles.footerRow}>
        <Text style={styles.rewardText}>+{challenge.rewardXp} XP</Text>
        <Text style={styles.metaText}>
          {challenge.progressLabel ?? (challenge.completed ? 'Completed' : 'Awaiting completion')}
        </Text>
      </View>
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
    gap: urTheme.spacing.sm,
    ...boxShadow({
      color: urTheme.colors.deepShadow,
      opacity: 0.22,
      offset: { width: 0, height: 10 },
      blurRadius: 16,
      elevation: 6,
    }),
  },
  cardCompleted: {
    backgroundColor: 'rgba(44, 56, 27, 0.7)',
    borderColor: 'rgba(127, 191, 62, 0.34)',
  },
  cardHighlight: {
    borderColor: 'rgba(255, 226, 122, 0.72)',
    backgroundColor: 'rgba(82, 53, 20, 0.82)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: urTheme.spacing.sm,
  },
  headerCopy: {
    flex: 1,
    gap: 4,
  },
  title: {
    ...urTextVariants.cardTitle,
    color: urTextColors.titleOnScene,
    fontSize: 17,
    lineHeight: 22,
  },
  description: {
    color: 'rgba(230, 211, 163, 0.9)',
    fontSize: 13,
    lineHeight: 19,
    ...urTextVariants.body,
  },
  statusBadge: {
    borderRadius: urTheme.radii.pill,
    paddingHorizontal: urTheme.spacing.sm,
    paddingVertical: 5,
    borderWidth: 1,
  },
  statusBadge_locked: {
    backgroundColor: 'rgba(100, 100, 110, 0.16)',
    borderColor: 'rgba(140, 140, 150, 0.28)',
  },
  statusBadge_available: {
    backgroundColor: 'rgba(240, 192, 64, 0.16)',
    borderColor: 'rgba(240, 192, 64, 0.36)',
  },
  statusBadge_in_progress: {
    backgroundColor: 'rgba(45, 156, 219, 0.18)',
    borderColor: 'rgba(45, 156, 219, 0.36)',
  },
  statusBadge_completed: {
    backgroundColor: 'rgba(127, 191, 62, 0.18)',
    borderColor: 'rgba(127, 191, 62, 0.34)',
  },
  statusLabel: {
    ...urTypography.label,
    fontSize: 10,
  },
  statusLabel_locked: {
    color: 'rgba(190, 190, 200, 0.82)',
  },
  statusLabel_available: {
    color: '#F0D580',
  },
  statusLabel_in_progress: {
    color: '#8ACFEE',
  },
  statusLabel_completed: {
    color: '#A3D96A',
  },
  progressTrack: {
    height: 5,
    borderRadius: urTheme.radii.pill,
    backgroundColor: 'rgba(6, 11, 18, 0.48)',
    overflow: 'hidden',
    marginTop: -2,
  },
  progressFill: {
    height: '100%',
    borderRadius: urTheme.radii.pill,
    backgroundColor: 'rgba(45, 156, 219, 0.72)',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: urTheme.spacing.sm,
  },
  rewardText: {
    ...urTextVariants.caption,
    color: urTheme.colors.goldBright,
    fontSize: 12,
  },
  metaText: {
    color: 'rgba(230, 211, 163, 0.74)',
    fontSize: 12,
    lineHeight: 16,
    flexShrink: 1,
    textAlign: 'right',
    ...urTextVariants.body,
  },
});
