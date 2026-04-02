import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';

import { HomeStatCard } from '@/components/home/HomeStatCard';
import { useAuth } from '@/src/auth/useAuth';
import { useEloRating } from '@/src/elo/useEloRating';
import {
  HomeLayoutVariant,
  resolveHomeFredokaFontFamily,
} from '@/src/home/homeTheme';

interface EloRatingSummaryCardProps {
  style?: StyleProp<ViewStyle>;
  layoutVariant?: HomeLayoutVariant;
  fontLoaded?: boolean;
}

export const EloRatingSummaryCard: React.FC<EloRatingSummaryCardProps> = ({
  style,
  layoutVariant = 'desktop',
  fontLoaded = false,
}) => {
  const router = useRouter();
  const { user, isUsernameOnboardingLoading, isUsernameOnboardingRequired } = useAuth();
  const { ratingProfile, errorMessage, isLoading } = useEloRating();
  const isCompact = layoutVariant === 'compact';
  const fontFamily = resolveHomeFredokaFontFamily(fontLoaded);
  const canAccessElo = user?.provider === 'google' && !isUsernameOnboardingLoading && !isUsernameOnboardingRequired;

  let valueLabel = 'Locked';
  let helperLabel = 'Google sign-in required';

  if (canAccessElo && ratingProfile) {
    valueLabel = String(ratingProfile.eloRating);
    helperLabel = ratingProfile.provisional ? 'Provisional' : ratingProfile.rank ? `Rank #${ratingProfile.rank}` : 'Placement pending';
  } else if (isLoading) {
    valueLabel = 'Syncing...';
    helperLabel = 'Fetching ranked profile';
  } else if (canAccessElo && errorMessage) {
    valueLabel = 'Unavailable';
    helperLabel = 'Try again later';
  }

  return (
    <HomeStatCard
      title="Elo Rating"
      ctaLabel="Leaderboard"
      ctaAccessibilityLabel="Open leaderboard"
      onCtaPress={() => router.push('/leaderboard')}
      layoutVariant={layoutVariant}
      fontLoaded={fontLoaded}
      style={style}
      contentContainerStyle={isCompact ? styles.contentCompact : styles.contentDesktop}
    >
      <View style={styles.metricColumn}>
        <Text
          accessibilityLabel={canAccessElo && ratingProfile ? `Elo rating ${ratingProfile.eloRating}` : 'Elo locked'}
          numberOfLines={2}
          adjustsFontSizeToFit
          minimumFontScale={0.66}
          style={[
            styles.valueLabel,
            isCompact ? styles.valueLabelCompact : styles.valueLabelDesktop,
            !canAccessElo && styles.valueLabelLocked,
            { fontFamily },
          ]}
        >
          {valueLabel}
        </Text>

        <Text
          numberOfLines={2}
          adjustsFontSizeToFit
          minimumFontScale={0.72}
          style={[
            styles.helperLabel,
            isCompact ? styles.helperLabelCompact : styles.helperLabelDesktop,
            { fontFamily },
          ]}
        >
          {helperLabel}
        </Text>
      </View>
    </HomeStatCard>
  );
};

const styles = StyleSheet.create({
  contentDesktop: {
    paddingTop: 10,
    paddingBottom: 22,
  },
  contentCompact: {
    paddingTop: 8,
    paddingBottom: 18,
  },
  metricColumn: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  valueLabel: {
    textAlign: 'center',
    color: '#82511E',
  },
  valueLabelDesktop: {
    fontSize: 34,
    lineHeight: 38,
    minHeight: 72,
  },
  valueLabelCompact: {
    fontSize: 30,
    lineHeight: 34,
    minHeight: 64,
  },
  valueLabelLocked: {
    color: '#75563A',
  },
  helperLabel: {
    textAlign: 'center',
    color: '#6B4926',
  },
  helperLabelDesktop: {
    fontSize: 15,
    lineHeight: 18,
    minHeight: 36,
  },
  helperLabelCompact: {
    fontSize: 14,
    lineHeight: 17,
    minHeight: 34,
  },
});
