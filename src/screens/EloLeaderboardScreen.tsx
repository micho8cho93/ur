import React from 'react';
import { Image, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { boxShadow } from '@/constants/styleEffects';
import { urTheme, urTextures, urTypography } from '@/constants/urTheme';
import { EloLeaderboardEntry } from '@/shared/elo';
import { useAuth } from '@/src/auth/useAuth';
import { useEloLeaderboard } from '@/src/elo/useEloLeaderboard';

const rowKey = (entry: EloLeaderboardEntry) => `${entry.userId}:${entry.rank ?? 'na'}`;

const LeaderboardSection: React.FC<{
  title: string;
  description: string;
  entries: EloLeaderboardEntry[];
  currentUserId: string | null;
}> = ({ title, description, entries, currentUserId }) => (
  <View style={styles.sectionCard}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <Text style={styles.sectionDescription}>{description}</Text>

    <View style={styles.tableHeader}>
      <Text style={[styles.tableHeaderText, styles.rankColumn]}>Rank</Text>
      <Text style={[styles.tableHeaderText, styles.nameColumn]}>Player</Text>
      <Text style={[styles.tableHeaderText, styles.ratingColumn]}>Elo</Text>
      <Text style={[styles.tableHeaderText, styles.recordColumn]}>Record</Text>
    </View>

    <View style={styles.rows}>
      {entries.map((entry) => {
        const isCurrentUser = currentUserId === entry.userId;

        return (
          <View key={rowKey(entry)} style={[styles.row, isCurrentUser && styles.rowCurrentUser]}>
            <Text style={[styles.rankValue, styles.rankColumn]}>{entry.rank ? `#${entry.rank}` : '...'}</Text>
            <View style={styles.nameColumn}>
              <Text style={styles.nameValue}>{entry.usernameDisplay}</Text>
              {entry.provisional ? <Text style={styles.provisionalText}>Provisional</Text> : null}
            </View>
            <Text style={[styles.ratingValue, styles.ratingColumn]}>{entry.eloRating}</Text>
            <Text style={[styles.recordValue, styles.recordColumn]}>
              {entry.ratedWins}-{entry.ratedLosses}
            </Text>
          </View>
        );
      })}
    </View>
  </View>
);

export default function EloLeaderboardScreen() {
  const { user, isUsernameOnboardingLoading, isUsernameOnboardingRequired } = useAuth();
  const { topLeaderboard, aroundMeLeaderboard, myProfile, errorMessage, isLoading, isRefreshing, refresh } =
    useEloLeaderboard();
  const canAccessElo =
    Boolean(user) &&
    user?.provider === 'google' &&
    !isUsernameOnboardingLoading &&
    !isUsernameOnboardingRequired;

  return (
    <View style={styles.screen}>
      <Image source={urTextures.woodDark} resizeMode="repeat" style={styles.texture} />
      <View style={styles.topGlow} />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => void refresh()} tintColor="#F0C040" />}
      >
        <View style={styles.heroCard}>
          <Text style={styles.eyebrow}>Global Ladder</Text>
          <Text style={styles.heroTitle}>Elo Leaderboard</Text>
          <Text style={styles.heroText}>
            Ranked public matches update this ladder after the backend verifies the winner and writes the authoritative
            Elo result.
          </Text>

          {canAccessElo && myProfile ? (
            <View style={styles.summaryRow}>
              <View style={styles.summaryChip}>
                <Text style={styles.summaryLabel}>Your Elo</Text>
                <Text style={styles.summaryValue}>{myProfile.eloRating}</Text>
              </View>
              <View style={styles.summaryChip}>
                <Text style={styles.summaryLabel}>Global Rank</Text>
                <Text style={styles.summaryValue}>{myProfile.rank ? `#${myProfile.rank}` : 'Seeding'}</Text>
              </View>
              <View style={styles.summaryChip}>
                <Text style={styles.summaryLabel}>Rated Record</Text>
                <Text style={styles.summaryValue}>
                  {myProfile.ratedWins}-{myProfile.ratedLosses}
                </Text>
              </View>
            </View>
          ) : null}
        </View>

        {!canAccessElo ? (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Leaderboard Locked</Text>
            <Text style={styles.sectionDescription}>
              {user?.provider === 'guest'
                ? 'Sign in with Google and claim a public username to access the ranked Elo leaderboard.'
                : 'Choose your public username to unlock the ranked Elo leaderboard.'}
            </Text>
          </View>
        ) : isLoading ? (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Loading leaderboard...</Text>
            <Text style={styles.sectionDescription}>Fetching the top players and your position on the ladder.</Text>
          </View>
        ) : errorMessage ? (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Leaderboard unavailable</Text>
            <Text style={styles.sectionDescription}>{errorMessage}</Text>
            <Button
              title="Retry"
              variant="outline"
              onPress={() => {
                void refresh();
              }}
              style={styles.retryButton}
            />
          </View>
        ) : (
          <>
            <LeaderboardSection
              title="Top Players"
              description="The current global Elo standings for ranked Royal Game of Ur."
              entries={topLeaderboard?.records ?? []}
              currentUserId={user?.id ?? null}
            />
            <LeaderboardSection
              title="Around You"
              description="Your neighborhood on the ladder, centered on your current rank."
              entries={aroundMeLeaderboard?.records ?? []}
              currentUserId={user?.id ?? null}
            />
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: urTheme.colors.night,
  },
  texture: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.14,
  },
  topGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '24%',
    backgroundColor: 'rgba(240, 192, 64, 0.12)',
  },
  content: {
    paddingTop: urTheme.spacing.xl * 2,
    paddingBottom: urTheme.spacing.xl,
    paddingHorizontal: urTheme.spacing.md,
    gap: urTheme.spacing.md,
  },
  heroCard: {
    borderRadius: urTheme.radii.lg,
    padding: urTheme.spacing.lg,
    gap: urTheme.spacing.sm,
    backgroundColor: 'rgba(17, 23, 31, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(236, 205, 152, 0.22)',
    ...boxShadow({
      color: '#000',
      opacity: 0.2,
      offset: { width: 0, height: 10 },
      blurRadius: 18,
      elevation: 8,
    }),
  },
  eyebrow: {
    ...urTypography.label,
    color: 'rgba(240, 224, 196, 0.7)',
    fontSize: 11,
  },
  heroTitle: {
    ...urTypography.title,
    color: '#F8ECD6',
    fontSize: 34,
    lineHeight: 38,
  },
  heroText: {
    color: 'rgba(243, 230, 206, 0.78)',
    fontSize: 14,
    lineHeight: 21,
  },
  summaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: urTheme.spacing.sm,
    marginTop: urTheme.spacing.xs,
  },
  summaryChip: {
    minWidth: 110,
    borderRadius: urTheme.radii.sm,
    paddingHorizontal: urTheme.spacing.sm,
    paddingVertical: urTheme.spacing.sm,
    backgroundColor: 'rgba(8, 13, 18, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(236, 205, 152, 0.14)',
  },
  summaryLabel: {
    color: 'rgba(243, 230, 206, 0.6)',
    fontSize: 11,
    lineHeight: 15,
    marginBottom: 4,
  },
  summaryValue: {
    ...urTypography.subtitle,
    color: '#F8ECD6',
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '700',
  },
  sectionCard: {
    borderRadius: urTheme.radii.md,
    padding: urTheme.spacing.md,
    gap: urTheme.spacing.sm,
    backgroundColor: 'rgba(17, 23, 31, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(236, 205, 152, 0.18)',
  },
  sectionTitle: {
    ...urTypography.subtitle,
    color: '#F8ECD6',
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '700',
  },
  sectionDescription: {
    color: 'rgba(243, 230, 206, 0.76)',
    fontSize: 13,
    lineHeight: 19,
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: urTheme.spacing.sm,
    paddingTop: urTheme.spacing.xs,
    paddingBottom: 6,
  },
  tableHeaderText: {
    color: 'rgba(243, 230, 206, 0.56)',
    fontSize: 11,
    lineHeight: 15,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  rows: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: urTheme.spacing.sm,
    borderRadius: urTheme.radii.sm,
    paddingHorizontal: urTheme.spacing.sm,
    paddingVertical: urTheme.spacing.sm,
    backgroundColor: 'rgba(8, 13, 18, 0.74)',
    borderWidth: 1,
    borderColor: 'rgba(236, 205, 152, 0.1)',
  },
  rowCurrentUser: {
    borderColor: 'rgba(240, 192, 64, 0.48)',
    backgroundColor: 'rgba(48, 34, 12, 0.52)',
  },
  rankColumn: {
    width: 64,
  },
  nameColumn: {
    flex: 1,
  },
  ratingColumn: {
    width: 64,
    textAlign: 'right',
  },
  recordColumn: {
    width: 74,
    textAlign: 'right',
  },
  rankValue: {
    color: '#F8ECD6',
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '700',
  },
  nameValue: {
    color: '#F8ECD6',
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '600',
  },
  provisionalText: {
    color: '#D7E9FF',
    fontSize: 11,
    lineHeight: 15,
    marginTop: 2,
  },
  ratingValue: {
    color: '#F0C040',
    fontSize: 15,
    lineHeight: 19,
    fontWeight: '700',
  },
  recordValue: {
    color: '#F8ECD6',
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '600',
  },
  retryButton: {
    marginTop: urTheme.spacing.xs,
    alignSelf: 'flex-start',
  },
});
