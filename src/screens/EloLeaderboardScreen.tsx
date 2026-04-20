import React from 'react';
import { Image, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { boxShadow } from '@/constants/styleEffects';
import { urTheme, urTextures, urTypography } from '@/constants/urTheme';
import { EloLeaderboardEntry } from '@/shared/elo';
import { useAuth } from '@/src/auth/useAuth';
import { useEloLeaderboard } from '@/src/elo/useEloLeaderboard';

const rowKey = (entry: EloLeaderboardEntry) => `${entry.userId}:${entry.rank ?? 'na'}`;

const MEDAL_COLORS: Record<number, string> = {
  1: '#F0C040',
  2: '#C0C8D4',
  3: '#C88A50',
};

const winRate = (wins: number, losses: number): string => {
  const total = wins + losses;
  if (total === 0) return '—';
  return `${Math.round((wins / total) * 100)}%`;
};

const SkeletonRow: React.FC = () => (
  <View style={styles.skeletonRow}>
    <View style={[styles.skeletonBlock, styles.rankColumn, { width: 36, height: 14, borderRadius: 4 }]} />
    <View style={[styles.skeletonBlock, { flex: 1, height: 14, borderRadius: 4 }]} />
    <View style={[styles.skeletonBlock, { width: 48, height: 14, borderRadius: 4 }]} />
    <View style={[styles.skeletonBlock, { width: 44, height: 14, borderRadius: 4 }]} />
  </View>
);

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
      <Text style={[styles.tableHeaderText, styles.recordColumn]}>Win %</Text>
    </View>

    <View style={styles.rows}>
      {entries.map((entry) => {
        const isCurrentUser = currentUserId === entry.userId;
        const medalColor = entry.rank != null ? MEDAL_COLORS[entry.rank] : undefined;

        return (
          <View key={rowKey(entry)} style={[styles.row, isCurrentUser && styles.rowCurrentUser]}>
            <Text
              style={[
                styles.rankValue,
                styles.rankColumn,
                medalColor ? { color: medalColor } : null,
              ]}
            >
              {entry.rank ? `#${entry.rank}` : '...'}
            </Text>
            <View style={styles.nameColumn}>
              <Text style={styles.nameValue}>{entry.usernameDisplay}</Text>
              {entry.provisional ? (
                <View style={styles.provisionalBadge}>
                  <Text style={styles.provisionalText}>Placement</Text>
                </View>
              ) : null}
            </View>
            <Text style={[styles.ratingValue, styles.ratingColumn]}>{entry.eloRating}</Text>
            <View style={[styles.recordColumn, styles.recordCell]}>
              <Text style={styles.winRateValue}>
                {winRate(entry.ratedWins, entry.ratedLosses)}
              </Text>
              <Text style={styles.recordSubtext}>
                {entry.ratedWins}-{entry.ratedLosses}
              </Text>
            </View>
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
            Ranked records update after each verified online match. Pull to refresh.
          </Text>

          {canAccessElo && myProfile ? (
            <View style={styles.summaryRow}>
              <View style={styles.summaryChip}>
                <Text style={styles.summaryLabel}>Your Elo</Text>
                <Text style={styles.summaryValue}>{myProfile.eloRating}</Text>
              </View>
              <View style={styles.summaryChip}>
                <Text style={styles.summaryLabel}>Global Rank</Text>
                <Text style={styles.summaryValue}>
                  {myProfile.rank ? `#${myProfile.rank}` : 'Unranked'}
                </Text>
              </View>
              <View style={styles.summaryChip}>
                <Text style={styles.summaryLabel}>Win Rate</Text>
                <Text style={styles.summaryValue}>
                  {winRate(myProfile.ratedWins, myProfile.ratedLosses)}
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
            <Text style={styles.sectionTitle}>Top Players</Text>
            <Text style={styles.sectionDescription}>Loading the current standings…</Text>
            <View style={styles.rows}>
              {Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)}
            </View>
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
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: urTheme.spacing.sm,
    borderRadius: urTheme.radii.sm,
    paddingHorizontal: urTheme.spacing.sm,
    paddingVertical: urTheme.spacing.sm,
    backgroundColor: 'rgba(8, 13, 18, 0.74)',
    borderWidth: 1,
    borderColor: 'rgba(236, 205, 152, 0.08)',
  },
  skeletonBlock: {
    backgroundColor: 'rgba(240, 224, 196, 0.08)',
  },
  rankColumn: {
    width: 48,
  },
  nameColumn: {
    flex: 1,
    gap: 4,
  },
  ratingColumn: {
    width: 56,
    textAlign: 'right',
  },
  recordColumn: {
    width: 64,
  },
  recordCell: {
    alignItems: 'flex-end',
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
  provisionalBadge: {
    alignSelf: 'flex-start',
    borderRadius: urTheme.radii.pill,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: 'rgba(140, 180, 220, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(140, 180, 220, 0.28)',
  },
  provisionalText: {
    color: '#A8C8E8',
    fontSize: 10,
    lineHeight: 14,
    ...urTypography.label,
  },
  ratingValue: {
    color: '#F0C040',
    fontSize: 15,
    lineHeight: 19,
    fontWeight: '700',
    textAlign: 'right',
  },
  winRateValue: {
    color: '#F8ECD6',
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '600',
  },
  recordSubtext: {
    color: 'rgba(243, 230, 206, 0.48)',
    fontSize: 10,
    lineHeight: 13,
  },
  retryButton: {
    marginTop: urTheme.spacing.xs,
    alignSelf: 'flex-start',
  },
});
