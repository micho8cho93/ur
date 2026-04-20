import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { urTheme, urTypography } from '@/constants/urTheme';
import type { ChallengeVisualStatus, ChallengeViewModel } from '@/src/challenges/challengeUi';
import { ChallengeCard } from './ChallengeCard';

interface ChallengeListProps {
  challenges: ChallengeViewModel[];
  emptyTitle?: string;
  emptyMessage?: string;
  highlightedChallengeIds?: string[];
}

const STATUS_ORDER: ChallengeVisualStatus[] = ['in_progress', 'available', 'locked', 'completed'];

const STATUS_SECTION_LABELS: Record<ChallengeVisualStatus, string> = {
  in_progress: 'In Progress',
  available: 'Available',
  locked: 'Locked',
  completed: 'Completed',
};

export const ChallengeList: React.FC<ChallengeListProps> = ({
  challenges,
  emptyTitle = 'No challenges available',
  emptyMessage = 'Challenge definitions will appear here once the server archive is available.',
  highlightedChallengeIds = [],
}) => {
  if (challenges.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>{emptyTitle}</Text>
        <Text style={styles.emptyMessage}>{emptyMessage}</Text>
      </View>
    );
  }

  const grouped = STATUS_ORDER.map((status) => ({
    status,
    items: challenges.filter((c) => c.status === status),
  })).filter(({ items }) => items.length > 0);

  return (
    <View style={styles.list}>
      {grouped.map(({ status, items }) => (
        <View key={status} style={styles.group}>
          <Text style={styles.groupLabel}>{STATUS_SECTION_LABELS[status]}</Text>
          <View style={styles.groupItems}>
            {items.map((challenge) => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                highlight={highlightedChallengeIds.includes(challenge.id)}
              />
            ))}
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  list: {
    gap: urTheme.spacing.md,
  },
  group: {
    gap: urTheme.spacing.xs,
  },
  groupLabel: {
    ...urTypography.label,
    color: 'rgba(242, 230, 209, 0.52)',
    fontSize: 10,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    paddingHorizontal: 2,
  },
  groupItems: {
    gap: urTheme.spacing.sm,
  },
  emptyState: {
    borderRadius: urTheme.radii.md,
    padding: urTheme.spacing.lg,
    backgroundColor: 'rgba(10, 15, 20, 0.46)',
    borderWidth: 1,
    borderColor: 'rgba(255, 225, 178, 0.18)',
    gap: 8,
  },
  emptyTitle: {
    ...urTypography.subtitle,
    color: '#F8ECD6',
    fontSize: 17,
    lineHeight: 22,
  },
  emptyMessage: {
    color: 'rgba(242, 230, 209, 0.76)',
    fontSize: 13,
    lineHeight: 19,
  },
});
