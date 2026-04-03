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

        <View style={[styles.statusBadge, isCompleted && styles.statusBadgeCompleted]}>
          <Text style={styles.statusLabel}>{STATUS_LABELS[challenge.status]}</Text>
        </View>
      </View>

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
    backgroundColor: 'rgba(45, 156, 219, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(45, 156, 219, 0.26)',
  },
  statusBadgeCompleted: {
    backgroundColor: 'rgba(127, 191, 62, 0.18)',
    borderColor: 'rgba(127, 191, 62, 0.26)',
  },
  statusLabel: {
    ...urTypography.label,
    color: urTextColors.titleOnScene,
    fontSize: 10,
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
