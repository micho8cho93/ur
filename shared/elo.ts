export const DEFAULT_ELO_RATING = 1200;
export const PROVISIONAL_RATED_GAMES = 10;
export const PROVISIONAL_K_FACTOR = 40;
export const ESTABLISHED_K_FACTOR = 24;
export const ELO_LEADERBOARD_ID = "elo_global";

export type EloMatchOutcome = "win" | "loss";

export type EloRatedRecord = {
  ratedGames: number;
  ratedWins: number;
  ratedLosses: number;
};

export type EloProfile = EloRatedRecord & {
  userId: string;
  usernameDisplay: string;
  eloRating: number;
  provisional: boolean;
  lastRatedMatchId: string | null;
  lastRatedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type EloLeaderboardEntry = EloRatedRecord & {
  userId: string;
  usernameDisplay: string;
  eloRating: number;
  provisional: boolean;
  rank: number | null;
};

export type EloRatingProfileRpcResponse = EloLeaderboardEntry & {
  leaderboardId: string;
  lastRatedMatchId: string | null;
  lastRatedAt: string | null;
};

export type EloLeaderboardRpcRequest = {
  limit?: number | null;
  cursor?: string | null;
};

export type EloLeaderboardAroundMeRpcRequest = {
  limit?: number | null;
};

export type EloLeaderboardRpcResponse = {
  leaderboardId: string;
  records: EloLeaderboardEntry[];
  nextCursor: string | null;
  prevCursor: string | null;
};

export type EloLeaderboardAroundMeRpcResponse = {
  leaderboardId: string;
  records: EloLeaderboardEntry[];
};

export type EloMatchParticipantRatingView = EloRatedRecord & {
  userId: string;
  usernameDisplay: string;
  oldRating: number;
  newRating: number;
  delta: number;
  provisional: boolean;
  rank: number | null;
};

export type EloRatingChangeNotificationPayload = {
  type: "elo_rating_update";
  leaderboardId: string;
  matchId: string;
  duplicate: boolean;
  player: EloMatchParticipantRatingView;
  opponent: EloMatchParticipantRatingView;
};

export type EloComputationPlayerResult = EloRatedRecord & {
  oldRating: number;
  newRating: number;
  delta: number;
  expectedScore: number;
  actualScore: 0 | 1;
  kFactor: number;
  previousProvisional: boolean;
  provisional: boolean;
};

export type EloComputationResult = {
  playerA: EloComputationPlayerResult;
  playerB: EloComputationPlayerResult;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

export const sanitizeRatedGameCount = (value: number): number => {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.floor(value));
};

export const sanitizeEloRating = (value: number): number => {
  if (!Number.isFinite(value)) {
    return DEFAULT_ELO_RATING;
  }

  return Math.round(value);
};

export const isProvisionalEloPlayer = (ratedGames: number): boolean =>
  sanitizeRatedGameCount(ratedGames) < PROVISIONAL_RATED_GAMES;

export const getEloKFactor = (ratedGames: number): number =>
  isProvisionalEloPlayer(ratedGames) ? PROVISIONAL_K_FACTOR : ESTABLISHED_K_FACTOR;

export const createDefaultEloProfile = (
  userId: string,
  usernameDisplay: string,
  timestamp = new Date().toISOString(),
): EloProfile => ({
  userId,
  usernameDisplay,
  eloRating: DEFAULT_ELO_RATING,
  ratedGames: 0,
  ratedWins: 0,
  ratedLosses: 0,
  provisional: true,
  lastRatedMatchId: null,
  lastRatedAt: null,
  createdAt: timestamp,
  updatedAt: timestamp,
});

export const calculateExpectedEloScore = (playerRating: number, opponentRating: number): number =>
  1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));

export const computeEloRatingUpdate = (params: {
  playerARating: number;
  playerBRating: number;
  playerAOutcome: EloMatchOutcome;
  playerARatedGames: number;
  playerBRatedGames: number;
  playerARatedWins?: number;
  playerARatedLosses?: number;
  playerBRatedWins?: number;
  playerBRatedLosses?: number;
}): EloComputationResult => {
  const playerAOldRating = sanitizeEloRating(params.playerARating);
  const playerBOldRating = sanitizeEloRating(params.playerBRating);
  const playerAOldRatedGames = sanitizeRatedGameCount(params.playerARatedGames);
  const playerBOldRatedGames = sanitizeRatedGameCount(params.playerBRatedGames);
  const playerAOldRatedWins = sanitizeRatedGameCount(params.playerARatedWins ?? 0);
  const playerAOldRatedLosses = sanitizeRatedGameCount(params.playerARatedLosses ?? 0);
  const playerBOldRatedWins = sanitizeRatedGameCount(params.playerBRatedWins ?? 0);
  const playerBOldRatedLosses = sanitizeRatedGameCount(params.playerBRatedLosses ?? 0);
  const playerAKFactor = getEloKFactor(playerAOldRatedGames);
  const playerBKFactor = getEloKFactor(playerBOldRatedGames);
  const playerAExpectedScore = calculateExpectedEloScore(playerAOldRating, playerBOldRating);
  const playerBExpectedScore = calculateExpectedEloScore(playerBOldRating, playerAOldRating);
  const playerAActualScore = params.playerAOutcome === "win" ? 1 : 0;
  const playerBActualScore = playerAActualScore === 1 ? 0 : 1;
  const playerANewRating = sanitizeEloRating(
    playerAOldRating + playerAKFactor * (playerAActualScore - playerAExpectedScore),
  );
  const playerBNewRating = sanitizeEloRating(
    playerBOldRating + playerBKFactor * (playerBActualScore - playerBExpectedScore),
  );
  const playerANewRatedGames = playerAOldRatedGames + 1;
  const playerBNewRatedGames = playerBOldRatedGames + 1;
  const playerANewRatedWins = playerAOldRatedWins + (playerAActualScore === 1 ? 1 : 0);
  const playerANewRatedLosses = playerAOldRatedLosses + (playerAActualScore === 0 ? 1 : 0);
  const playerBNewRatedWins = playerBOldRatedWins + (playerBActualScore === 1 ? 1 : 0);
  const playerBNewRatedLosses = playerBOldRatedLosses + (playerBActualScore === 0 ? 1 : 0);

  return {
    playerA: {
      oldRating: playerAOldRating,
      newRating: playerANewRating,
      delta: playerANewRating - playerAOldRating,
      expectedScore: playerAExpectedScore,
      actualScore: playerAActualScore,
      kFactor: playerAKFactor,
      ratedGames: playerANewRatedGames,
      ratedWins: playerANewRatedWins,
      ratedLosses: playerANewRatedLosses,
      previousProvisional: isProvisionalEloPlayer(playerAOldRatedGames),
      provisional: isProvisionalEloPlayer(playerANewRatedGames),
    },
    playerB: {
      oldRating: playerBOldRating,
      newRating: playerBNewRating,
      delta: playerBNewRating - playerBOldRating,
      expectedScore: playerBExpectedScore,
      actualScore: playerBActualScore,
      kFactor: playerBKFactor,
      ratedGames: playerBNewRatedGames,
      ratedWins: playerBNewRatedWins,
      ratedLosses: playerBNewRatedLosses,
      previousProvisional: isProvisionalEloPlayer(playerBOldRatedGames),
      provisional: isProvisionalEloPlayer(playerBNewRatedGames),
    },
  };
};

const isEloRatedRecord = (value: unknown): value is EloRatedRecord =>
  isRecord(value) &&
  typeof value.ratedGames === "number" &&
  typeof value.ratedWins === "number" &&
  typeof value.ratedLosses === "number";

export const isEloLeaderboardEntry = (value: unknown): value is EloLeaderboardEntry =>
  isRecord(value) &&
  typeof value.userId === "string" &&
  typeof value.usernameDisplay === "string" &&
  typeof value.eloRating === "number" &&
  typeof value.provisional === "boolean" &&
  (typeof value.rank === "number" || value.rank === null) &&
  isEloRatedRecord(value);

export const isEloRatingProfileRpcResponse = (value: unknown): value is EloRatingProfileRpcResponse => {
  if (!isEloLeaderboardEntry(value)) {
    return false;
  }

  const candidate = value as Partial<EloRatingProfileRpcResponse>;
  return (
    typeof candidate.leaderboardId === "string" &&
    (typeof candidate.lastRatedMatchId === "string" || candidate.lastRatedMatchId === null) &&
    (typeof candidate.lastRatedAt === "string" || candidate.lastRatedAt === null)
  );
};

export const isEloLeaderboardRpcResponse = (value: unknown): value is EloLeaderboardRpcResponse =>
  isRecord(value) &&
  typeof value.leaderboardId === "string" &&
  Array.isArray(value.records) &&
  value.records.every((record) => isEloLeaderboardEntry(record)) &&
  (typeof value.nextCursor === "string" || value.nextCursor === null) &&
  (typeof value.prevCursor === "string" || value.prevCursor === null);

export const isEloLeaderboardAroundMeRpcResponse = (
  value: unknown,
): value is EloLeaderboardAroundMeRpcResponse =>
  isRecord(value) &&
  typeof value.leaderboardId === "string" &&
  Array.isArray(value.records) &&
  value.records.every((record) => isEloLeaderboardEntry(record));

const isEloMatchParticipantRatingView = (value: unknown): value is EloMatchParticipantRatingView =>
  isRecord(value) &&
  typeof value.userId === "string" &&
  typeof value.usernameDisplay === "string" &&
  typeof value.oldRating === "number" &&
  typeof value.newRating === "number" &&
  typeof value.delta === "number" &&
  typeof value.provisional === "boolean" &&
  (typeof value.rank === "number" || value.rank === null) &&
  isEloRatedRecord(value);

export const isEloRatingChangeNotificationPayload = (
  value: unknown,
): value is EloRatingChangeNotificationPayload =>
  isRecord(value) &&
  value.type === "elo_rating_update" &&
  typeof value.leaderboardId === "string" &&
  typeof value.matchId === "string" &&
  typeof value.duplicate === "boolean" &&
  isEloMatchParticipantRatingView(value.player) &&
  isEloMatchParticipantRatingView(value.opponent);
