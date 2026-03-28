import type {
  ChallengeDefinition,
  ChallengeId,
  UserChallengeProgressRpcResponse,
  UserChallengeState,
} from '@/shared/challenges';

export type ChallengeVisualStatus = 'locked' | 'available' | 'in_progress' | 'completed';

export type ChallengeViewModel = {
  id: ChallengeId;
  name: string;
  description: string;
  rewardXp: number;
  status: ChallengeVisualStatus;
  completed: boolean;
  completedAt: string | null;
  completedMatchId: string | null;
  progressLabel: string | null;
};

export type MatchChallengeRewardItem = {
  challengeId: ChallengeId;
  name: string;
  description: string;
  rewardXp: number;
  completedAt: string | null;
};

export type MatchChallengeRewardSummary = {
  newlyCompletedChallenges: MatchChallengeRewardItem[];
  xpAwardedTotal: number;
};

const getVisualStatus = (challenge: UserChallengeState | null | undefined): ChallengeVisualStatus => {
  if (challenge?.completed) {
    return 'completed';
  }

  if (!challenge) {
    return 'locked';
  }

  if (
    typeof challenge.progressCurrent === 'number' &&
    typeof challenge.progressTarget === 'number' &&
    challenge.progressCurrent > 0 &&
    challenge.progressCurrent < challenge.progressTarget
  ) {
    return 'in_progress';
  }

  return 'available';
};

const getProgressLabel = (challenge: UserChallengeState | null | undefined): string | null => {
  if (!challenge) {
    return 'Awaiting archive sync';
  }

  if (challenge.completed) {
    return challenge.completedAt ? 'Completed' : 'Reward claimed';
  }

  if (challenge.progressLabel) {
    return challenge.progressLabel;
  }

  return 'Awaiting completion';
};

export const buildChallengeViewModels = (
  definitions: ChallengeDefinition[],
  progress: UserChallengeProgressRpcResponse | null
): ChallengeViewModel[] =>
  definitions.map((definition) => {
    const challengeState = progress?.challenges?.[definition.id];

    return {
      id: definition.id,
      name: definition.name,
      description: definition.description,
      rewardXp: definition.rewardXp,
      status: getVisualStatus(challengeState),
      completed: challengeState?.completed ?? false,
      completedAt: challengeState?.completedAt ?? null,
      completedMatchId: challengeState?.completedMatchId ?? null,
      progressLabel: getProgressLabel(challengeState),
    };
  });

export const buildMatchChallengeRewardSummary = (
  matchId: string,
  definitions: ChallengeDefinition[],
  progress: UserChallengeProgressRpcResponse | null
): MatchChallengeRewardSummary => {
  if (!progress) {
    return {
      newlyCompletedChallenges: [],
      xpAwardedTotal: 0,
    };
  }

  const newlyCompletedChallenges = definitions
    .map((definition) => {
      const challengeState = progress.challenges?.[definition.id];
      if (!challengeState?.completed || challengeState.completedMatchId !== matchId) {
        return null;
      }

      return {
        challengeId: definition.id,
        name: definition.name,
        description: definition.description,
        rewardXp: challengeState.rewardXp,
        completedAt: challengeState.completedAt,
      } satisfies MatchChallengeRewardItem;
    })
    .filter((challenge): challenge is MatchChallengeRewardItem => Boolean(challenge));

  return {
    newlyCompletedChallenges,
    xpAwardedTotal: newlyCompletedChallenges.reduce((total, challenge) => total + challenge.rewardXp, 0),
  };
};
