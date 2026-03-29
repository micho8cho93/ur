import React from 'react';
import { Image, Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { boxShadow } from '@/constants/styleEffects';
import { urTheme, urTextures, urTypography } from '@/constants/urTheme';
import {
  DEFAULT_ELO_RATING,
  ESTABLISHED_K_FACTOR,
  PROVISIONAL_K_FACTOR,
  PROVISIONAL_RATED_GAMES,
} from '@/shared/elo';
import { useAuth } from '@/src/auth/useAuth';
import { useEloRating } from '@/src/elo/useEloRating';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

interface EloRatingSummaryCardProps {
  style?: StyleProp<ViewStyle>;
}

const ELO_EXPLANATION_LINES = [
  `Everyone starts at ${DEFAULT_ELO_RATING} Elo.`,
  'After each ranked match, the system compares the actual result to the expected result based on both players\' ratings.',
  'Beating a higher-rated opponent earns more points, while losing to a lower-rated opponent costs more.',
  `Your first ${PROVISIONAL_RATED_GAMES} rated games are provisional, so your rating moves faster (${PROVISIONAL_K_FACTOR} K-factor instead of ${ESTABLISHED_K_FACTOR}).`,
  'Your global rank is your place on the live leaderboard by current Elo.',
];

export const EloRatingSummaryCard: React.FC<EloRatingSummaryCardProps> = ({ style }) => {
  const { user, isUsernameOnboardingLoading, isUsernameOnboardingRequired } = useAuth();
  const { ratingProfile, errorMessage, isLoading, isRefreshing, refresh } = useEloRating();
  const [showInfoModal, setShowInfoModal] = React.useState(false);
  const canAccessElo = user?.provider === 'google' && !isUsernameOnboardingLoading && !isUsernameOnboardingRequired;

  return (
    <>
      <View style={[styles.card, style]}>
        <Image source={urTextures.rosette} resizeMode="repeat" style={styles.texture} />
        <View style={styles.cardGlow} />
        <View style={styles.cardBorder} />

        <View style={styles.eyebrowRow}>
          <Text style={styles.eyebrow}>Ranked Elo</Text>
          <Pressable
            onPress={() => setShowInfoModal(true)}
            accessibilityRole="button"
            accessibilityLabel="Explain the Elo rating system"
            hitSlop={8}
            style={({ pressed }) => [styles.infoButton, pressed && styles.infoButtonPressed]}
          >
            <Text style={styles.infoButtonLabel}>i</Text>
          </Pressable>
        </View>

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
            </View>
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

      <Modal
        visible={showInfoModal}
        title="How Elo Works"
        message="Elo estimates your playing strength from ranked results."
        actionLabel="Close"
        onAction={() => setShowInfoModal(false)}
        maxWidth={440}
      >
        <View style={styles.infoBody}>
          {ELO_EXPLANATION_LINES.map((line) => (
            <Text key={line} style={styles.infoLine}>
              {line}
            </Text>
          ))}
        </View>
      </Modal>
    </>
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
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: urTheme.spacing.sm,
  },
  infoButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(238, 206, 149, 0.32)',
    backgroundColor: 'rgba(10, 15, 22, 0.42)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoButtonPressed: {
    backgroundColor: 'rgba(40, 65, 96, 0.54)',
  },
  infoButtonLabel: {
    color: urTheme.colors.parchment,
    fontSize: 15,
    lineHeight: 18,
    fontWeight: '700',
    textAlign: 'center',
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
  infoBody: {
    width: '100%',
    gap: urTheme.spacing.sm,
    marginBottom: urTheme.spacing.lg,
  },
  infoLine: {
    color: 'rgba(247, 229, 203, 0.92)',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'left',
  },
});
