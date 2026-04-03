import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';

import { HomeStatCard } from '@/components/home/HomeStatCard';
import { urTextColors, urTextVariants } from '@/constants/urTheme';
import { CHALLENGE_DEFINITIONS } from '@/shared/challenges';
import { useChallenges } from '@/src/challenges/useChallenges';
import {
  HomeLayoutVariant,
  resolveHomeFredokaFontFamily,
} from '@/src/home/homeTheme';

interface ChallengeSummaryCardProps {
  style?: StyleProp<ViewStyle>;
  layoutVariant?: HomeLayoutVariant;
  fontLoaded?: boolean;
}

export const ChallengeSummaryCard: React.FC<ChallengeSummaryCardProps> = ({
  style,
  layoutVariant = 'desktop',
  fontLoaded = false,
}) => {
  const router = useRouter();
  const { definitions, progress, errorMessage, isLoading } = useChallenges();
  const isCompact = layoutVariant === 'compact';
  const fontFamily = resolveHomeFredokaFontFamily(fontLoaded);

  const challengeCount = definitions.length || CHALLENGE_DEFINITIONS.length;
  const completedCount = progress?.totalCompleted;
  const completedLabel =
    isLoading && completedCount == null
      ? '--'
      : errorMessage && completedCount == null
        ? '--'
        : String(completedCount ?? 0);

  return (
    <HomeStatCard
      title="Challenges"
      ctaLabel="Challenges"
      ctaAccessibilityLabel="Open challenges page"
      onCtaPress={() => router.push('/challenges')}
      layoutVariant={layoutVariant}
      fontLoaded={fontLoaded}
      style={style}
      contentContainerStyle={isCompact ? styles.contentCompact : styles.contentDesktop}
    >
      <View style={styles.metricColumn}>
        <Text
          accessibilityLabel={`Challenges completed ${completedLabel} of ${challengeCount}`}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.7}
          style={[
            styles.ratioLabel,
            isCompact ? styles.ratioLabelCompact : styles.ratioLabelDesktop,
            { fontFamily },
          ]}
        >
          {completedLabel}/{challengeCount}
        </Text>

        <Text
          numberOfLines={1}
          style={[
            styles.helperLabel,
            isCompact ? styles.helperLabelCompact : styles.helperLabelDesktop,
            { fontFamily },
          ]}
        >
          Completed
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
  ratioLabel: {
    textAlign: 'center',
    color: urTextColors.titleOnPanel,
    ...urTextVariants.cardTitle,
  },
  ratioLabelDesktop: {
    fontSize: 32,
    lineHeight: 36,
    marginTop: 34,
  },
  ratioLabelCompact: {
    fontSize: 28,
    lineHeight: 32,
    marginTop: 28,
  },
  helperLabel: {
    textAlign: 'center',
    color: urTextColors.captionOnPanel,
    ...urTextVariants.caption,
  },
  helperLabelDesktop: {
    fontSize: 16,
    lineHeight: 19,
    marginTop: 2,
  },
  helperLabelCompact: {
    fontSize: 15,
    lineHeight: 18,
    marginTop: 2,
  },
});
