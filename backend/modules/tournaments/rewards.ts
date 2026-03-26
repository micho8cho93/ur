import { DEFAULT_REWARD_TIERS } from "./definitions";
import type {
  TournamentRecord,
  TournamentRewardAllocation,
  TournamentRewardPlan,
  TournamentStanding,
} from "./types";

const roundCurrencyAmount = (value: number): number => Math.round(value * 100) / 100;

export const buildTournamentRewardPlan = (
  tournament: TournamentRecord,
  standings: TournamentStanding[],
  generatedAt = new Date().toISOString(),
): TournamentRewardPlan => {
  const allocations: TournamentRewardAllocation[] = DEFAULT_REWARD_TIERS.map((tier) => {
    const standing = standings.find((entry) => entry.rank === tier.rank) ?? null;
    const amount =
      typeof tournament.rewardPoolAmount === "number"
        ? roundCurrencyAmount(tournament.rewardPoolAmount * tier.percentage)
        : null;

    return {
      rank: tier.rank,
      userId: standing?.userId ?? null,
      displayName: standing?.displayName ?? null,
      title: tier.title,
      amount,
      currency: tournament.rewardCurrency,
    };
  });

  return {
    generatedAt,
    poolAmount: tournament.rewardPoolAmount,
    currency: tournament.rewardCurrency,
    notes: tournament.rewardNotes,
    allocations,
  };
};

export const applyRewardPlanToStandings = (
  standings: TournamentStanding[],
  rewardPlan: TournamentRewardPlan,
): TournamentStanding[] =>
  standings.map((standing) => {
    const allocation = rewardPlan.allocations.find((entry) => entry.rank === standing.rank) ?? null;

    return {
      rank: standing.rank,
      userId: standing.userId,
      displayName: standing.displayName,
      matchesPlayed: standing.matchesPlayed,
      wins: standing.wins,
      draws: standing.draws,
      losses: standing.losses,
      points: standing.points,
      scoreFor: standing.scoreFor,
      scoreAgainst: standing.scoreAgainst,
      scoreDifference: standing.scoreDifference,
      buchholz: standing.buchholz,
      joinedAt: standing.joinedAt,
      seed: standing.seed,
      rewardTitle: allocation?.title ?? null,
      rewardAmount: allocation?.amount ?? null,
    };
  });
