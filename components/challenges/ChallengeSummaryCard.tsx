import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';

import { boxShadow } from '@/constants/styleEffects';
import { urTheme, urTypography } from '@/constants/urTheme';
import { useChallenges } from '@/src/challenges/useChallenges';
import { buildChallengeViewModels } from '@/src/challenges/challengeUi';
import { Button } from '../ui/Button';

interface ChallengeSummaryCardProps {
  style?: StyleProp<ViewStyle>;
}

export const ChallengeSummaryCard: React.FC<ChallengeSummaryCardProps> = ({ style }) => {
  const router = useRouter();
  const { definitions, progress, errorMessage, isLoading, isRefreshing, refresh } = useChallenges();

  const challengeCount = definitions.length;
  const completedCount = progress?.totalCompleted ?? 0;
  const challengeRows = buildChallengeViewModels(definitions, progress);
  const completedChallenges = [...challengeRows]
    .filter((challenge) => challenge.completed)
    .sort((left, right) => {
      const leftTime = left.completedAt ? Date.parse(left.completedAt) : 0;
      const rightTime = right.completedAt ? Date.parse(right.completedAt) : 0;
      if (leftTime === rightTime) {
        return left.name.localeCompare(right.name);
      }

      return rightTime - leftTime;
    });

  return (
    <View style={[styles.card, style]}>
      <Text style={styles.eyebrow}>Permanent Challenges</Text>

      {isLoading ? (
        <View style={styles.copyBlock}>
          <Text style={styles.title}>Opening the archive…</Text>
          <Text style={styles.body}>Fetching your available challenges and confirmed completion record.</Text>
        </View>
      ) : errorMessage && definitions.length === 0 ? (
        <View style={styles.copyBlock}>
          <Text style={styles.title}>Challenges unavailable</Text>
          <Text style={styles.body}>{errorMessage}</Text>
          <Button title="Retry" variant="outline" onPress={() => void refresh()} style={styles.retryButton} />
        </View>
      ) : (
        <>
          <View style={styles.statsRow}>
            <View style={styles.statPill}>
              <Text style={styles.statValue}>{completedCount}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={styles.statPill}>
              <Text style={styles.statValue}>{challengeCount}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
          </View>

          {completedChallenges.length > 0 ? (
            <View style={styles.previewList}>
              <Text style={styles.listHeading}>Completed Challenges</Text>
              {completedChallenges.map((challenge) => (
                <View key={challenge.id} style={styles.previewRow}>
                  <Text style={styles.previewName}>{challenge.name}</Text>
                  <Text style={styles.previewReward}>+{challenge.rewardXp} XP</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.body}>
              No completed challenges yet. Your confirmed completions will appear here as the backend records them.
            </Text>
          )}

          {isRefreshing ? <Text style={styles.metaText}>Refreshing your latest challenge record…</Text> : null}
          {errorMessage && definitions.length > 0 ? (
            <Text style={styles.metaText}>Showing the most recently synced challenge archive.</Text>
          ) : null}

          <Button title="View Challenges" variant="outline" onPress={() => router.push('/challenges')} />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: urTheme.radii.md,
    overflow: 'hidden',
    backgroundColor: 'rgba(10, 16, 24, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(236, 205, 152, 0.24)',
    padding: urTheme.spacing.md,
    gap: urTheme.spacing.sm,
    ...boxShadow({
      color: '#000',
      opacity: 0.16,
      offset: { width: 0, height: 8 },
      blurRadius: 14,
      elevation: 6,
    }),
  },
  eyebrow: {
    ...urTypography.label,
    color: 'rgba(240, 224, 196, 0.68)',
    fontSize: 10,
  },
  copyBlock: {
    gap: 6,
  },
  title: {
    ...urTypography.subtitle,
    color: '#F8ECD6',
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
  },
  body: {
    color: 'rgba(243, 230, 206, 0.78)',
    fontSize: 13,
    lineHeight: 19,
  },
  retryButton: {
    marginTop: urTheme.spacing.xs,
    alignSelf: 'flex-start',
    minWidth: 120,
  },
  statsRow: {
    flexDirection: 'row',
    gap: urTheme.spacing.sm,
  },
  statPill: {
    flex: 1,
    borderRadius: urTheme.radii.md,
    paddingVertical: urTheme.spacing.sm,
    paddingHorizontal: urTheme.spacing.sm,
    backgroundColor: 'rgba(22, 29, 39, 0.62)',
    borderWidth: 1,
    borderColor: 'rgba(130, 167, 220, 0.2)',
    gap: 4,
  },
  statValue: {
    ...urTypography.title,
    color: '#F7E9D2',
    fontSize: 24,
    lineHeight: 28,
  },
  statLabel: {
    ...urTypography.label,
    color: 'rgba(232, 210, 176, 0.74)',
    fontSize: 10,
  },
  previewList: {
    gap: 6,
  },
  listHeading: {
    ...urTypography.label,
    color: 'rgba(240, 224, 196, 0.72)',
    fontSize: 10,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: urTheme.spacing.sm,
  },
  previewName: {
    color: '#F8ECD6',
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
  previewReward: {
    ...urTypography.label,
    color: urTheme.colors.goldBright,
    fontSize: 10,
  },
  metaText: {
    color: 'rgba(236, 223, 197, 0.62)',
    fontSize: 12,
    lineHeight: 17,
  },
});
