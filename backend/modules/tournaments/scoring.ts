import type {
  TournamentMatchResult,
  TournamentParticipant,
  TournamentRecord,
  TournamentStanding,
} from "./types";

type MutableStanding = TournamentStanding & {
  opponentIds: string[];
};

const createBaseStanding = (participant: TournamentParticipant): MutableStanding => ({
  rank: 0,
  userId: participant.userId,
  displayName: participant.displayName,
  matchesPlayed: 0,
  wins: 0,
  draws: 0,
  losses: 0,
  points: 0,
  scoreFor: 0,
  scoreAgainst: 0,
  scoreDifference: 0,
  buchholz: 0,
  joinedAt: participant.joinedAt,
  seed: participant.seed,
  rewardTitle: null,
  rewardAmount: null,
  opponentIds: [],
});

const appendOpponent = (standing: MutableStanding, opponentUserId: string): void => {
  if (standing.opponentIds.indexOf(opponentUserId) < 0) {
    standing.opponentIds.push(opponentUserId);
  }
};

export const determineWinnerUserId = (
  tournament: TournamentRecord,
  playerAUserId: string,
  playerBUserId: string,
  scoreA: number,
  scoreB: number,
): string | null => {
  if (scoreA === scoreB) {
    if (!tournament.scoring.allowDraws) {
      throw new Error("Drawn scores are not allowed for this tournament.");
    }

    return null;
  }

  return scoreA > scoreB ? playerAUserId : playerBUserId;
};

export const upsertTournamentResult = (
  tournament: TournamentRecord,
  nextResult: TournamentMatchResult,
): TournamentMatchResult[] => {
  const existingIndex = tournament.results.findIndex((result) => result.matchId === nextResult.matchId);
  const results = tournament.results.slice();

  if (existingIndex >= 0) {
    results[existingIndex] = nextResult;
  } else {
    results.push(nextResult);
  }

  return results.sort((left, right) => {
    if (left.round !== right.round) {
      return left.round - right.round;
    }

    return left.submittedAt.localeCompare(right.submittedAt);
  });
};

export const calculateTournamentStandings = (tournament: TournamentRecord): TournamentStanding[] => {
  const standingsByUserId: Record<string, MutableStanding> = {};

  for (const participant of tournament.participants) {
    standingsByUserId[participant.userId] = createBaseStanding(participant);
  }

  for (const result of tournament.results) {
    const playerA = standingsByUserId[result.playerAUserId];
    const playerB = standingsByUserId[result.playerBUserId];

    if (!playerA || !playerB) {
      continue;
    }

    playerA.matchesPlayed += 1;
    playerB.matchesPlayed += 1;

    playerA.scoreFor += result.scoreA;
    playerA.scoreAgainst += result.scoreB;
    playerB.scoreFor += result.scoreB;
    playerB.scoreAgainst += result.scoreA;

    appendOpponent(playerA, playerB.userId);
    appendOpponent(playerB, playerA.userId);

    if (result.winnerUserId === null) {
      playerA.draws += 1;
      playerB.draws += 1;
      playerA.points += tournament.scoring.drawPoints;
      playerB.points += tournament.scoring.drawPoints;
      continue;
    }

    if (result.winnerUserId === result.playerAUserId) {
      playerA.wins += 1;
      playerB.losses += 1;
      playerA.points += tournament.scoring.winPoints;
      playerB.points += tournament.scoring.lossPoints;
      continue;
    }

    if (result.winnerUserId === result.playerBUserId) {
      playerB.wins += 1;
      playerA.losses += 1;
      playerB.points += tournament.scoring.winPoints;
      playerA.points += tournament.scoring.lossPoints;
    }
  }

  const standings = Object.keys(standingsByUserId).map((userId) => {
    const standing = standingsByUserId[userId];
    standing.scoreDifference = standing.scoreFor - standing.scoreAgainst;
    standing.buchholz = standing.opponentIds.reduce((total, opponentUserId) => {
      const opponent = standingsByUserId[opponentUserId];
      return total + (opponent ? opponent.points : 0);
    }, 0);

    return standing;
  });

  standings.sort((left, right) => {
    if (left.points !== right.points) {
      return right.points - left.points;
    }

    if (left.buchholz !== right.buchholz) {
      return right.buchholz - left.buchholz;
    }

    if (left.scoreDifference !== right.scoreDifference) {
      return right.scoreDifference - left.scoreDifference;
    }

    if (left.wins !== right.wins) {
      return right.wins - left.wins;
    }

    const joinedCompare = left.joinedAt.localeCompare(right.joinedAt);
    if (joinedCompare !== 0) {
      return joinedCompare;
    }

    return left.userId.localeCompare(right.userId);
  });

  let lastTieKey = "";
  let currentRank = 0;

  return standings.map((standing, index) => {
    const tieKey = [
      standing.points,
      standing.buchholz,
      standing.scoreDifference,
      standing.wins,
      standing.losses,
    ].join(":");

    if (tieKey !== lastTieKey) {
      currentRank = index + 1;
      lastTieKey = tieKey;
    }

    return {
      rank: currentRank,
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
      rewardTitle: null,
      rewardAmount: null,
    };
  });
};
