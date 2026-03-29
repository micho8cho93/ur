import { MatchChallengeRewardsPanel } from '@/components/challenges/MatchChallengeRewardsPanel';
import { EloMatchSummaryPanel } from '@/components/elo/EloMatchSummaryPanel';
import { ProgressionAwardSummary } from '@/components/progression/ProgressionAwardSummary';
import { XPDisplay } from '@/components/challenges/XPDisplay';
import { urTheme, urTypography } from '@/constants/urTheme';
import { formatProgressionXp } from '@/src/progression/progressionDisplay';
import type { MatchChallengeRewardSummary } from '@/src/challenges/challengeUi';
import type { EloRatingChangeNotificationPayload } from '@/shared/elo';
import type { ProgressionAwardResponse, ProgressionSnapshot } from '@/shared/progression';
import type { TournamentMatchRewardSummaryPayload } from '@/shared/urMatchProtocol';
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
  tournamentRewardSummary?: TournamentMatchRewardSummaryPayload | null;
  tournamentCountdownLabel?: string | null;
};

const formatSignedValue = (value: number) => `${value >= 0 ? '+' : ''}${Math.trunc(value)}`;

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
  tournamentRewardSummary = null,
  tournamentCountdownLabel = null,
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
      {tournamentRewardSummary ? (
        <View style={styles.tournamentRewardCard}>
          <Text style={styles.tournamentRewardEyebrow}>Tournament Rewards Locked</Text>
          <View style={styles.tournamentRewardStats}>
            <View style={styles.tournamentRewardStat}>
              <Text style={styles.tournamentRewardStatLabel}>Elo</Text>
              <Text style={styles.tournamentRewardStatValue}>{formatSignedValue(tournamentRewardSummary.eloDelta)}</Text>
              <Text style={styles.tournamentRewardStatDetail}>
                {`${tournamentRewardSummary.eloOld} -> ${tournamentRewardSummary.eloNew}`}
              </Text>
            </View>
            <View style={styles.tournamentRewardStat}>
              <Text style={styles.tournamentRewardStatLabel}>XP</Text>
              <Text style={styles.tournamentRewardStatValue}>
                {`${tournamentRewardSummary.totalXpDelta >= 0 ? '+' : ''}${formatProgressionXp(
                  Math.abs(tournamentRewardSummary.totalXpDelta),
                )}`}
              </Text>
              <Text style={styles.tournamentRewardStatDetail}>
                {`${formatProgressionXp(tournamentRewardSummary.totalXpOld)} -> ${formatProgressionXp(
                  tournamentRewardSummary.totalXpNew,
                )}`}
              </Text>
            </View>
            <View style={styles.tournamentRewardStat}>
              <Text style={styles.tournamentRewardStatLabel}>Challenges</Text>
              <Text style={styles.tournamentRewardStatValue}>{String(tournamentRewardSummary.challengeCompletionCount)}</Text>
              <Text style={styles.tournamentRewardStatDetail}>
                {tournamentRewardSummary.challengeXpDelta > 0
                  ? `+${formatProgressionXp(tournamentRewardSummary.challengeXpDelta)} XP`
                  : 'No bonus XP'}
              </Text>
            </View>
          </View>
          {tournamentCountdownLabel ? (
            <Text style={styles.tournamentCountdownText}>{tournamentCountdownLabel}</Text>
          ) : null}
        </View>
      ) : null}
      {!isPlaythroughTutorialMatch && !tournamentRewardSummary ? (
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
          {didPlayerWin && !tournamentRewardSummary ? (
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
  tournamentRewardCard: {
    width: '100%',
    marginBottom: urTheme.spacing.sm,
    borderRadius: urTheme.radii.md,
    borderWidth: 1,
    borderColor: 'rgba(240, 201, 101, 0.32)',
    backgroundColor: 'rgba(16, 25, 36, 0.82)',
    padding: urTheme.spacing.md,
    gap: urTheme.spacing.sm,
  },
  tournamentRewardEyebrow: {
    ...urTypography.label,
    color: '#F4D9A8',
    fontSize: 10,
  },
  tournamentRewardStats: {
    flexDirection: 'row',
    gap: urTheme.spacing.sm,
  },
  tournamentRewardStat: {
    flex: 1,
    borderRadius: urTheme.radii.md,
    backgroundColor: 'rgba(7, 12, 18, 0.48)',
    borderWidth: 1,
    borderColor: 'rgba(216, 232, 251, 0.12)',
    paddingHorizontal: urTheme.spacing.sm,
    paddingVertical: urTheme.spacing.sm,
    gap: 4,
  },
  tournamentRewardStatLabel: {
    ...urTypography.label,
    color: 'rgba(216, 232, 251, 0.74)',
    fontSize: 10,
  },
  tournamentRewardStatValue: {
    ...urTypography.subtitle,
    color: '#F8ECD6',
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '700',
  },
  tournamentRewardStatDetail: {
    color: 'rgba(247, 229, 203, 0.72)',
    fontSize: 11,
    lineHeight: 15,
  },
  tournamentCountdownText: {
    color: 'rgba(216, 232, 251, 0.86)',
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
  },
});
