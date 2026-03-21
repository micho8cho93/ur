import React from 'react';
import { Image, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { boxShadow } from '@/constants/styleEffects';
import { urTheme, urTextures, urTypography } from '@/constants/urTheme';
import { useAuth } from '@/src/auth/useAuth';
import { useEloRating } from '@/src/elo/useEloRating';
import { useRouter } from 'expo-router';
import { Button } from '../ui/Button';

interface EloRatingSummaryCardProps {
  style?: StyleProp<ViewStyle>;
}

export const EloRatingSummaryCard: React.FC<EloRatingSummaryCardProps> = ({ style }) => {
  const router = useRouter();
  const { user, isUsernameOnboardingLoading, isUsernameOnboardingRequired } = useAuth();
  const { ratingProfile, errorMessage, isLoading, isRefreshing, refresh } = useEloRating();
  const canAccessElo = user?.provider === 'google' && !isUsernameOnboardingLoading && !isUsernameOnboardingRequired;

  return (
    <View style={[styles.card, style]}>
      <Image source={urTextures.rosette} resizeMode="repeat" style={styles.texture} />
      <View style={styles.cardGlow} />
      <View style={styles.cardBorder} />

      <Text style={styles.eyebrow}>Ranked Elo</Text>

      {canAccessElo && ratingProfile ? (
        <>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.ratingLabel}>Current Rating</Text>
              <Text style={styles.ratingValue}>{ratingProfile.eloRating}</Text>
            </View>
            {ratingProfile.provisional ? (
              <View style={styles.provisionalBadge}>
                <Text style={styles.provisionalBadgeText}>Provisional</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.statRow}>
            <View style={styles.statChip}>
              <Text style={styles.statLabel}>Global Rank</Text>
              <Text style={styles.statValue}>{ratingProfile.rank ? `#${ratingProfile.rank}` : 'Seeding'}</Text>
            </View>
            <View style={styles.statChip}>
              <Text style={styles.statLabel}>Record</Text>
              <Text style={styles.statValue}>
                {ratingProfile.ratedWins}-{ratingProfile.ratedLosses}
              </Text>
            </View>
            <View style={styles.statChip}>
              <Text style={styles.statLabel}>Rated Games</Text>
              <Text style={styles.statValue}>{ratingProfile.ratedGames}</Text>
            </View>
          </View>

          <Button
            title="View Leaderboard"
            variant="outline"
            onPress={() => router.push('/leaderboard')}
            style={styles.actionButton}
          />
        </>
      ) : isLoading ? (
        <View style={styles.stateBlock}>
          <Text style={styles.stateTitle}>Consulting the royal ladder...</Text>
          <Text style={styles.stateText}>Loading your current Elo rating, record, and rank.</Text>
        </View>
      ) : canAccessElo && errorMessage ? (
        <View style={styles.stateBlock}>
          <Text style={styles.stateTitle}>Elo unavailable</Text>
          <Text style={styles.stateText}>{errorMessage}</Text>
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
        <View style={styles.stateBlock}>
          <Text style={styles.stateTitle}>Ranked Elo is locked</Text>
          <Text style={styles.stateText}>
            {user?.provider === 'guest'
              ? 'Sign in with Google and claim a public username to unlock ranked matchmaking and leaderboards.'
              : 'Choose your public username to unlock ranked matchmaking and the global Elo leaderboard.'}
          </Text>
        </View>
      )}

      {ratingProfile && isRefreshing ? (
        <Text style={styles.metaText}>Refreshing your latest rating...</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: urTheme.radii.md,
    overflow: 'hidden',
    backgroundColor: 'rgba(10, 16, 24, 0.56)',
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
  texture: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.08,
  },
  cardGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '42%',
    backgroundColor: 'rgba(240, 192, 64, 0.14)',
  },
  cardBorder: {
    ...StyleSheet.absoluteFillObject,
    margin: urTheme.spacing.xs,
    borderRadius: urTheme.radii.sm + 2,
    borderWidth: 1,
    borderColor: 'rgba(248, 230, 192, 0.12)',
  },
  eyebrow: {
    ...urTypography.label,
    color: 'rgba(240, 224, 196, 0.68)',
    fontSize: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: urTheme.spacing.sm,
  },
  ratingLabel: {
    color: 'rgba(243, 230, 206, 0.76)',
    fontSize: 12,
    lineHeight: 16,
  },
  ratingValue: {
    ...urTypography.title,
    color: '#F8ECD6',
    fontSize: 36,
    lineHeight: 40,
  },
  provisionalBadge: {
    borderRadius: urTheme.radii.pill,
    paddingHorizontal: urTheme.spacing.sm,
    paddingVertical: 6,
    backgroundColor: 'rgba(29, 79, 140, 0.32)',
    borderWidth: 1,
    borderColor: 'rgba(140, 186, 255, 0.32)',
  },
  provisionalBadgeText: {
    ...urTypography.label,
    color: '#D7E9FF',
    fontSize: 10,
  },
  statRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: urTheme.spacing.sm,
  },
  statChip: {
    minWidth: 92,
    borderRadius: urTheme.radii.sm,
    paddingHorizontal: urTheme.spacing.sm,
    paddingVertical: urTheme.spacing.sm,
    backgroundColor: 'rgba(11, 18, 27, 0.58)',
    borderWidth: 1,
    borderColor: 'rgba(236, 205, 152, 0.16)',
  },
  statLabel: {
    color: 'rgba(243, 230, 206, 0.62)',
    fontSize: 11,
    lineHeight: 15,
    marginBottom: 4,
  },
  statValue: {
    ...urTypography.subtitle,
    color: '#F8ECD6',
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '700',
  },
  actionButton: {
    marginTop: urTheme.spacing.xs,
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
  retryButton: {
    marginTop: urTheme.spacing.xs,
    alignSelf: 'flex-start',
    minWidth: 120,
  },
  metaText: {
    color: 'rgba(236, 223, 197, 0.62)',
    fontSize: 12,
    lineHeight: 17,
  },
});
