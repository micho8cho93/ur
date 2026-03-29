import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { boxShadow } from '@/constants/styleEffects';
import { urTheme, urTypography } from '@/constants/urTheme';
import type { MatchChallengeRewardSummary } from '@/src/challenges/challengeUi';

interface MatchChallengeRewardsPanelProps {
  summary: MatchChallengeRewardSummary | null;
  loading?: boolean;
  errorMessage?: string | null;
}

export const MatchChallengeRewardsPanel: React.FC<MatchChallengeRewardsPanelProps> = ({
  summary,
  loading = false,
  errorMessage = null,
}) => {
  const pulseValue = useRef(new Animated.Value(1)).current;
  const [isExpanded, setIsExpanded] = useState(false);
  const completedCount = summary?.newlyCompletedChallenges.length ?? 0;
  const completedLabel = `${completedCount} completed ${completedCount === 1 ? 'challenge' : 'challenges'}`;

  useEffect(() => {
    if (!summary || summary.newlyCompletedChallenges.length === 0) {
      pulseValue.setValue(1);
      return;
    }

    const animation = Animated.sequence([
      Animated.timing(pulseValue, {
        toValue: 1.03,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(pulseValue, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
    ]);

    animation.start();

    return () => {
      animation.stop();
      pulseValue.setValue(1);
    };
  }, [pulseValue, summary]);

  useEffect(() => {
    setIsExpanded(false);
  }, [summary]);

  return (
    <View style={styles.panel}>
      <Text style={styles.eyebrow}>Challenge Rewards</Text>

      {loading ? (
        <View style={styles.stateBlock}>
          <Text style={styles.stateTitle}>Confirming match rewards…</Text>
          <Text style={styles.stateText}>Waiting for the archive to return your updated challenge record.</Text>
        </View>
      ) : errorMessage ? (
        <View style={styles.stateBlock}>
          <Text style={styles.stateTitle}>Challenge rewards unavailable</Text>
          <Text style={styles.stateText}>{errorMessage}</Text>
        </View>
      ) : summary && summary.newlyCompletedChallenges.length > 0 ? (
        <Animated.View style={[styles.summaryBlock, { transform: [{ scale: pulseValue }] }]}>
          <View style={styles.summaryHeader}>
            <View style={styles.summaryCopy}>
              <View style={styles.totalBadge}>
                <Text style={styles.totalBadgeLabel}>+{summary.xpAwardedTotal} XP from challenges</Text>
              </View>
              <Text style={styles.summaryTitle}>{completedLabel}</Text>
              <Text style={styles.summaryText}>
                Expand the list to review everything this match unlocked.
              </Text>
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: isExpanded }}
            onPress={() => setIsExpanded((value) => !value)}
            style={({ pressed }) => [
              styles.toggleButton,
              pressed && styles.toggleButtonPressed,
            ]}
            testID="match-challenge-toggle"
          >
            <Text style={styles.toggleLabel}>
              {isExpanded ? 'Hide completed challenges' : `Show ${completedLabel}`}
            </Text>
            <Text style={styles.toggleChevron}>{isExpanded ? 'v' : '>'}</Text>
          </Pressable>

          {isExpanded ? (
            <View style={styles.dropdownPanel}>
              <ScrollView
                nestedScrollEnabled
                showsVerticalScrollIndicator={false}
                style={styles.challengeList}
                contentContainerStyle={styles.challengeListContent}
                testID="match-challenge-list"
              >
                {summary.newlyCompletedChallenges.map((challenge) => (
                  <View key={challenge.challengeId} style={styles.challengeRow}>
                    <View style={styles.challengeRowCopy}>
                      <Text style={styles.challengeName}>{challenge.name}</Text>
                      <Text style={styles.challengeMeta}>Just completed</Text>
                    </View>
                    <Text style={styles.challengeXp}>+{challenge.rewardXp} XP</Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          ) : null}
        </Animated.View>
      ) : (
        <View style={styles.stateBlock}>
          <Text style={styles.stateTitle}>No new challenge rewards</Text>
          <Text style={styles.stateText}>This match did not unlock any new permanent challenge completions.</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  panel: {
    width: '100%',
    borderRadius: urTheme.radii.md,
    padding: urTheme.spacing.md,
    backgroundColor: 'rgba(10, 15, 20, 0.42)',
    borderWidth: 1,
    borderColor: 'rgba(240, 208, 152, 0.22)',
    gap: urTheme.spacing.sm,
    ...boxShadow({
      color: '#000',
      opacity: 0.16,
      offset: { width: 0, height: 8 },
      blurRadius: 14,
      elevation: 5,
    }),
  },
  eyebrow: {
    ...urTypography.label,
    color: 'rgba(240, 224, 196, 0.68)',
    fontSize: 10,
  },
  summaryBlock: {
    gap: urTheme.spacing.sm,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: urTheme.spacing.sm,
  },
  summaryCopy: {
    flex: 1,
    gap: 6,
  },
  totalBadge: {
    alignSelf: 'flex-start',
    borderRadius: urTheme.radii.pill,
    paddingHorizontal: urTheme.spacing.md,
    paddingVertical: urTheme.spacing.xs,
    backgroundColor: 'rgba(104, 74, 20, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255, 223, 154, 0.48)',
  },
  totalBadgeLabel: {
    ...urTypography.label,
    color: '#FFE6B8',
    fontSize: 11,
  },
  summaryTitle: {
    ...urTypography.subtitle,
    color: '#F8ECD6',
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
  },
  summaryText: {
    color: 'rgba(243, 230, 206, 0.78)',
    fontSize: 13,
    lineHeight: 19,
  },
  toggleButton: {
    borderRadius: urTheme.radii.md,
    borderWidth: 1,
    borderColor: 'rgba(240, 208, 152, 0.24)',
    backgroundColor: 'rgba(16, 24, 32, 0.58)',
    paddingHorizontal: urTheme.spacing.md,
    paddingVertical: urTheme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: urTheme.spacing.sm,
  },
  toggleButtonPressed: {
    opacity: 0.88,
  },
  toggleLabel: {
    ...urTypography.label,
    color: '#F8ECD6',
    fontSize: 12,
    flex: 1,
  },
  toggleChevron: {
    ...urTypography.label,
    color: '#FFE6B8',
    fontSize: 16,
  },
  dropdownPanel: {
    borderRadius: urTheme.radii.md,
    borderWidth: 1,
    borderColor: 'rgba(240, 208, 152, 0.2)',
    backgroundColor: 'rgba(8, 14, 20, 0.5)',
    overflow: 'hidden',
  },
  challengeList: {
    maxHeight: 216,
  },
  challengeListContent: {
    padding: urTheme.spacing.sm,
    gap: urTheme.spacing.sm,
  },
  challengeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: urTheme.spacing.md,
    borderRadius: urTheme.radii.md,
    borderWidth: 1,
    borderColor: 'rgba(159, 214, 119, 0.2)',
    backgroundColor: 'rgba(24, 39, 23, 0.52)',
    paddingHorizontal: urTheme.spacing.md,
    paddingVertical: urTheme.spacing.sm,
  },
  challengeRowCopy: {
    flex: 1,
    gap: 4,
  },
  challengeName: {
    ...urTypography.label,
    color: '#F8ECD6',
    fontSize: 13,
  },
  challengeMeta: {
    color: 'rgba(236, 223, 197, 0.66)',
    fontSize: 12,
    lineHeight: 16,
  },
  challengeXp: {
    ...urTypography.label,
    color: urTheme.colors.goldBright,
    fontSize: 12,
    textAlign: 'right',
  },
  stateBlock: {
    gap: 6,
  },
  stateTitle: {
    ...urTypography.subtitle,
    color: '#F8ECD6',
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
  },
  stateText: {
    color: 'rgba(243, 230, 206, 0.78)',
    fontSize: 13,
    lineHeight: 19,
  },
});
