import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';

import { HomeStatCard } from '@/components/home/HomeStatCard';
import { urTextColors, urTextVariants } from '@/constants/urTheme';
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
    justifyContent: 'flex-start',
    paddingTop: 10,
    paddingBottom: 10,
  },
  contentCompact: {
    justifyContent: 'flex-start',
    paddingTop: 8,
    paddingBottom: 8,
  },
  metricColumn: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 8,
  },
  valueLabel: {
    textAlign: 'center',
    color: urTextColors.titleOnPanel,
    ...urTextVariants.cardTitle,
  },
  valueLabelDesktop: {
    fontSize: 34,
    lineHeight: 38,
    minHeight: 54,
    marginTop: 30,
  },
  valueLabelCompact: {
    fontSize: 30,
    lineHeight: 34,
    minHeight: 48,
    marginTop: 24,
  },
  valueLabelLocked: {
    color: '#7B5B35',
  },
  helperLabel: {
    textAlign: 'center',
    color: urTextColors.bodyMutedOnPanel,
    ...urTextVariants.body,
  },
  helperLabelDesktop: {
    fontSize: 15,
    lineHeight: 18,
    minHeight: 36,
    marginTop: 2,
  },
  helperLabelCompact: {
    fontSize: 14,
    lineHeight: 17,
    minHeight: 34,
    marginTop: 2,
  },
});
