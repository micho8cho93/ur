import { MatchChallengeRewardsPanel } from '@/components/challenges/MatchChallengeRewardsPanel';
import { EloMatchSummaryPanel } from '@/components/elo/EloMatchSummaryPanel';
import { ProgressionAwardSummary } from '@/components/progression/ProgressionAwardSummary';
import { XPDisplay } from '@/components/challenges/XPDisplay';
import { urTheme, urTypography } from '@/constants/urTheme';
import type { MatchChallengeRewardSummary } from '@/src/challenges/challengeUi';
import type { EloRatingChangeNotificationPayload } from '@/shared/elo';
import type { ProgressionAwardResponse, ProgressionSnapshot } from '@/shared/progression';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type MatchResultSummaryContentProps = {
  didPlayerWin: boolean;
  isPracticeModeMatch: boolean;
  isPrivateMatch: boolean;
  canSyncOfflineBotRewards: boolean;
  practiceModeRewardLabel: string | null;
  isPlaythroughTutorialMatch: boolean;
  isRankedHumanMatch: boolean;
  lastEloRatingChange: EloRatingChangeNotificationPayload | null;
  eloUnchangedReason: string | null;
  shouldShowAccountRewards: boolean;
  progression: ProgressionSnapshot | null;
  isRefreshingMatchRewards: boolean;
  progressionError: string | null;
  lastProgressionAward: ProgressionAwardResponse | null;
  shouldShowChallengeRewards: boolean;
  matchChallengeSummary: MatchChallengeRewardSummary | null;
  matchRewardsErrorMessage: string | null;
};

export const MatchResultSummaryContent: React.FC<MatchResultSummaryContentProps> = ({
  didPlayerWin,
  isPracticeModeMatch,
  isPrivateMatch,
  canSyncOfflineBotRewards,
  practiceModeRewardLabel,
  isPlaythroughTutorialMatch,
  isRankedHumanMatch,
  lastEloRatingChange,
  eloUnchangedReason,
  shouldShowAccountRewards,
  progression,
  isRefreshingMatchRewards,
  progressionError,
  lastProgressionAward,
  shouldShowChallengeRewards,
  matchChallengeSummary,
  matchRewardsErrorMessage,
}) => {
  return (
    <>
      {didPlayerWin && isPracticeModeMatch && !isPrivateMatch && canSyncOfflineBotRewards && practiceModeRewardLabel ? (
        <View style={styles.practiceRewardLabel}>
          <Text style={styles.practiceRewardLabelText}>{practiceModeRewardLabel}</Text>
        </View>
      ) : null}
      {didPlayerWin && isPrivateMatch ? (
        <View style={styles.privateRewardLabel}>
          <Text style={styles.privateRewardLabelText}>Private Match: Reduced XP Reward</Text>
        </View>
      ) : null}
      {!isPlaythroughTutorialMatch ? (
        <EloMatchSummaryPanel
          result={isRankedHumanMatch ? lastEloRatingChange : null}
          pending={isRankedHumanMatch && !lastEloRatingChange}
          unchangedReason={!isRankedHumanMatch ? eloUnchangedReason : null}
        />
      ) : null}
      {shouldShowAccountRewards ? (
        <>
          <XPDisplay
            progression={progression}
            isLoading={isRefreshingMatchRewards && !progression}
            errorMessage={progressionError}
            compact
            style={styles.matchRewardsXpDisplay}
          />
          {didPlayerWin ? (
            <ProgressionAwardSummary
              progression={progression}
              award={lastProgressionAward}
              pending={!lastProgressionAward}
            />
          ) : null}
          {shouldShowChallengeRewards ? (
            <MatchChallengeRewardsPanel
              summary={matchChallengeSummary}
              loading={isRefreshingMatchRewards && !matchChallengeSummary}
              errorMessage={matchRewardsErrorMessage}
            />
          ) : null}
        </>
      ) : null}
    </>
  );
};

const styles = StyleSheet.create({
  matchRewardsXpDisplay: {
    width: '100%',
    marginBottom: urTheme.spacing.sm,
  },
  practiceRewardLabel: {
    marginBottom: urTheme.spacing.sm,
    paddingHorizontal: urTheme.spacing.md,
    paddingVertical: urTheme.spacing.sm,
    borderRadius: urTheme.radii.md,
    borderWidth: 1,
    borderColor: 'rgba(217, 164, 65, 0.44)',
    backgroundColor: 'rgba(13, 15, 18, 0.54)',
  },
  practiceRewardLabelText: {
    ...urTypography.label,
    color: urTheme.colors.parchment,
    fontSize: 11,
    textAlign: 'center',
  },
  privateRewardLabel: {
    marginBottom: urTheme.spacing.sm,
    paddingHorizontal: urTheme.spacing.md,
    paddingVertical: urTheme.spacing.sm,
    borderRadius: urTheme.radii.md,
    borderWidth: 1,
    borderColor: 'rgba(137, 193, 255, 0.34)',
    backgroundColor: 'rgba(10, 25, 42, 0.56)',
  },
  privateRewardLabelText: {
    ...urTypography.label,
    color: 'rgba(216, 232, 251, 0.96)',
    fontSize: 11,
    textAlign: 'center',
  },
});
