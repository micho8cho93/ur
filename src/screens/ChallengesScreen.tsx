import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack } from 'expo-router';

import { ChallengeList } from '@/components/challenges/ChallengeList';
import { XPDisplay } from '@/components/challenges/XPDisplay';
import { boxShadow } from '@/constants/styleEffects';
import {
  urPanelColors,
  urTextColors,
  urTextVariants,
  urTheme,
} from '@/constants/urTheme';
import { useAuth } from '@/src/auth/useAuth';
import { buildChallengeViewModels } from '@/src/challenges/challengeUi';
import { useChallenges } from '@/src/challenges/useChallenges';
import { useProgression } from '@/src/progression/useProgression';

export default function ChallengesScreen() {
  const { user } = useAuth();
  const {
    definitions,
    progress,
    errorMessage: challengeError,
    isLoading: isChallengeLoading,
    isRefreshing: isChallengeRefreshing,
    refresh: refreshChallenges,
  } = useChallenges();
  const {
    progression,
    errorMessage: progressionError,
    isLoading: isProgressionLoading,
    isRefreshing: isProgressionRefreshing,
    refresh: refreshProgression,
  } = useProgression();

  const challengeRows = buildChallengeViewModels(definitions, progress);
  const isRefreshing = isChallengeRefreshing || isProgressionRefreshing;

  const handleRefresh = async () => {
    await Promise.all([
      refreshChallenges(),
      refreshProgression({ silent: true }),
    ]);
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Challenges' }} />
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => void handleRefresh()}
            tintColor="#F0C040"
          />
        }
      >
        <View style={styles.hero}>
          <Text style={styles.title}>Challenges & XP</Text>
          <Text style={styles.subtitle}>
            Permanent objectives that carry over across all your sessions.
          </Text>
        </View>

        {!user ? (
          <View style={styles.stateCard}>
            <Text style={styles.stateTitle}>Sign in required</Text>
            <Text style={styles.stateText}>Sign in to view your personal challenges and XP total.</Text>
          </View>
        ) : (
          <>
            <XPDisplay
              progression={progression}
              isLoading={isProgressionLoading}
              errorMessage={progressionError}
              style={styles.xpDisplay}
            />

            <View style={styles.sectionCard}>
              <View style={styles.sectionTitleWrap}>
                <Text style={styles.sectionTitle}>Challenges</Text>
                <Text style={styles.sectionSubtitle}>
                  {progress
                    ? `${progress.totalCompleted} of ${definitions.length} completed`
                    : 'Loading your challenge record.'}
                </Text>
              </View>

              {challengeError && challengeRows.length > 0 ? (
                <Text style={styles.refreshText}>Showing the most recently synced challenge data.</Text>
              ) : null}

              {isChallengeLoading && challengeRows.length === 0 ? (
                <View style={styles.stateCardInline}>
                  <Text style={styles.stateTitle}>Opening the archive…</Text>
                  <Text style={styles.stateText}>Fetching your challenge progress from the server.</Text>
                </View>
              ) : challengeError && challengeRows.length === 0 ? (
                <View style={styles.stateCardInline}>
                  <Text style={styles.stateTitle}>Challenge data unavailable</Text>
                  <Text style={styles.stateText}>{challengeError}</Text>
                </View>
              ) : (
                <ChallengeList challenges={challengeRows} />
              )}
            </View>
          </>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: urTheme.colors.night,
  },
  content: {
    paddingTop: 120,
    paddingHorizontal: urTheme.spacing.md,
    paddingBottom: urTheme.spacing.xl,
    gap: urTheme.spacing.md,
  },
  hero: {
    gap: urTheme.spacing.xs,
  },
  title: {
    ...urTextVariants.displayTitle,
    color: urTextColors.titleOnScene,
    fontSize: 34,
    lineHeight: 42,
  },
  subtitle: {
    color: 'rgba(230, 211, 163, 0.84)',
    fontSize: 15,
    lineHeight: 22,
    maxWidth: 700,
    ...urTextVariants.body,
  },
  xpDisplay: {
    maxWidth: 760,
  },
  sectionCard: {
    borderRadius: urTheme.radii.lg,
    backgroundColor: urPanelColors.darkSurface,
    borderWidth: 1,
    borderColor: urPanelColors.darkBorder,
    padding: urTheme.spacing.md,
    gap: urTheme.spacing.sm,
    ...boxShadow({
      color: urTheme.colors.deepShadow,
      opacity: 0.3,
      offset: { width: 0, height: 10 },
      blurRadius: 16,
      elevation: 8,
    }),
  },
  sectionTitleWrap: {
    gap: 4,
  },
  sectionTitle: {
    ...urTextVariants.sectionTitle,
    color: urTextColors.titleOnScene,
    fontSize: 18,
    lineHeight: 24,
  },
  sectionSubtitle: {
    color: 'rgba(230, 211, 163, 0.78)',
    fontSize: 13,
    lineHeight: 19,
    ...urTextVariants.body,
  },
  refreshText: {
    color: 'rgba(230, 211, 163, 0.68)',
    fontSize: 12,
    lineHeight: 17,
    ...urTextVariants.body,
  },
  stateCard: {
    borderRadius: urTheme.radii.md,
    backgroundColor: urPanelColors.darkSurface,
    borderWidth: 1,
    borderColor: urPanelColors.darkBorder,
    padding: urTheme.spacing.lg,
    gap: urTheme.spacing.sm,
  },
  stateCardInline: {
    borderRadius: urTheme.radii.md,
    backgroundColor: urPanelColors.darkSurfaceSoft,
    borderWidth: 1,
    borderColor: urPanelColors.darkBorder,
    padding: urTheme.spacing.md,
    gap: urTheme.spacing.xs,
  },
  stateTitle: {
    ...urTextVariants.sectionTitle,
    color: urTextColors.titleOnScene,
    fontSize: 16,
    lineHeight: 22,
  },
  stateText: {
    color: 'rgba(230, 211, 163, 0.82)',
    fontSize: 13,
    lineHeight: 19,
    ...urTextVariants.body,
  },
});
