import { PATH_LENGTH } from "../logic/constants";
import { GameState, Player, PlayerColor } from "../logic/types";
import { ProgressionAwardResponse, isProgressionAwardResponse } from "./progression";

export const CHALLENGE_IDS = {
  FIRST_VICTORY: "first_victory",
  BEAT_EASY_BOT: "beat_easy_bot",
  FAST_FINISH: "fast_finish",
  SAFE_PLAY: "safe_play",
  LUCKY_ROLL: "lucky_roll",
  HOME_STRETCH: "home_stretch",
  CAPTURE_MASTER: "capture_master",
  COMEBACK_WIN: "comeback_win",
  RISK_TAKER: "risk_taker",
  BEAT_MEDIUM_BOT: "beat_medium_bot",
  BEAT_HARD_BOT: "beat_hard_bot",
  BEAT_PERFECT_BOT: "beat_perfect_bot",
} as const;

export type ChallengeId = (typeof CHALLENGE_IDS)[keyof typeof CHALLENGE_IDS];
export type ChallengeType = "milestone" | "bot" | "match";
export type OpponentType = "human" | "easy_bot" | "medium_bot" | "hard_bot" | "perfect_bot";

export type ChallengeDefinition = {
  id: ChallengeId;
  name: string;
  description: string;
  type: ChallengeType;
  rewardXp: number;
};

export type MatchSummaryCheckpointReason = "progress_deficit" | "borne_off_deficit";

export type CompletedMatchSummary = {
  matchId: string;
  playerUserId: string;
  opponentType: OpponentType;
  didWin: boolean;
  totalMoves: number;
  playerMoveCount: number;
  piecesLost: number;
  maxRollCount: number;
  capturesMade: number;
  capturesSuffered: number;
  contestedTilesLandedCount: number;
  borneOffCount: number;
  opponentBorneOffCount: number;
  wasBehindDuringMatch: boolean;
  behindCheckpointCount: number;
  behindReasons: MatchSummaryCheckpointReason[];
  timestamp: string;
};

export type ChallengeCompletionRecord = {
  challengeId: ChallengeId;
  completedAt: string;
  completedMatchId: string;
  rewardXp: number;
  rewardLedgerKey: string;
};

export type UserChallengeState = {
  challengeId: ChallengeId;
  completed: boolean;
  completedAt: string | null;
  completedMatchId: string | null;
  rewardXp: number;
};

export type UserChallengeProgressSnapshot = {
  totalCompleted: number;
  totalRewardedXp: number;
  updatedAt: string;
  challenges: Record<ChallengeId, UserChallengeState>;
};

export type ChallengeDefinitionsRpcResponse = {
  challenges: ChallengeDefinition[];
};

export type UserChallengeProgressRpcResponse = UserChallengeProgressSnapshot;

export type SubmitCompletedBotMatchRpcResponse = {
  progressionAward: ProgressionAwardResponse | null;
};

export const CHALLENGE_DEFINITIONS: readonly ChallengeDefinition[] = [
  {
    id: CHALLENGE_IDS.FIRST_VICTORY,
    name: "First Victory",
    description: "Win your first completed game against any opponent.",
    type: "milestone",
    rewardXp: 150,
  },
  {
    id: CHALLENGE_IDS.BEAT_EASY_BOT,
    name: "Beat the Easy Bot",
    description: "Win a completed game against the easy AI opponent.",
    type: "bot",
    rewardXp: 100,
  },
  {
    id: CHALLENGE_IDS.FAST_FINISH,
    name: "Fast Finish",
    description: "Win a completed game in fewer than 100 total applied moves.",
    type: "match",
    rewardXp: 175,
  },
  {
    id: CHALLENGE_IDS.SAFE_PLAY,
    name: "Safe Play",
    description: "Win a completed game without losing any pieces to captures.",
    type: "match",
    rewardXp: 200,
  },
  {
    id: CHALLENGE_IDS.LUCKY_ROLL,
    name: "Lucky Roll",
    description: "Win a completed game after rolling the maximum value at least 3 times.",
    type: "match",
    rewardXp: 175,
  },
  {
    id: CHALLENGE_IDS.HOME_STRETCH,
    name: "Home Stretch",
    description: "Win a completed game while making zero captures across the entire match.",
    type: "match",
    rewardXp: 225,
  },
  {
    id: CHALLENGE_IDS.CAPTURE_MASTER,
    name: "Capture Master",
    description: "Capture at least 3 opponent pieces in a single completed game. Victory is not required.",
    type: "match",
    rewardXp: 200,
  },
  {
    id: CHALLENGE_IDS.COMEBACK_WIN,
    name: "Comeback Win",
    description:
      "Win a completed game after trailing at one or more deterministic progress checkpoints during the match.",
    type: "match",
    rewardXp: 250,
  },
  {
    id: CHALLENGE_IDS.RISK_TAKER,
    name: "Risk Taker",
    description: "Win a completed game after landing on shared contestable tiles at least 3 times.",
    type: "match",
    rewardXp: 200,
  },
  {
    id: CHALLENGE_IDS.BEAT_MEDIUM_BOT,
    name: "Beat the Medium Bot",
    description: "Win a completed game against the medium AI opponent.",
    type: "bot",
    rewardXp: 150,
  },
  {
    id: CHALLENGE_IDS.BEAT_HARD_BOT,
    name: "Beat the Hard Bot",
    description: "Win a completed game against the hard AI opponent.",
    type: "bot",
    rewardXp: 225,
  },
  {
    id: CHALLENGE_IDS.BEAT_PERFECT_BOT,
    name: "Beat the Perfect Bot",
    description: "Win a completed game against the perfect AI opponent.",
    type: "bot",
    rewardXp: 350,
  },
] as const;

export const CHALLENGE_DEFINITION_BY_ID: Readonly<Record<ChallengeId, ChallengeDefinition>> =
  CHALLENGE_DEFINITIONS.reduce(
    (definitions, definition) => {
      definitions[definition.id] = definition;
      return definitions;
    },
    {} as Record<ChallengeId, ChallengeDefinition>
  );

export const getChallengeDefinition = (challengeId: ChallengeId): ChallengeDefinition => {
  const definition = CHALLENGE_DEFINITION_BY_ID[challengeId];
  if (!definition) {
    throw new Error(`Unknown challenge definition: ${challengeId}`);
  }

  return definition;
};

export const createDefaultUserChallengeProgressSnapshot = (
  updatedAt = new Date().toISOString()
): UserChallengeProgressSnapshot => ({
  totalCompleted: 0,
  totalRewardedXp: 0,
  updatedAt,
  challenges: CHALLENGE_DEFINITIONS.reduce(
    (states, definition) => {
      states[definition.id] = {
        challengeId: definition.id,
        completed: false,
        completedAt: null,
        completedMatchId: null,
        rewardXp: definition.rewardXp,
      };
      return states;
    },
    {} as Record<ChallengeId, UserChallengeState>
  ),
});

export const isChallengeId = (value: unknown): value is ChallengeId =>
  typeof value === "string" && value in CHALLENGE_DEFINITION_BY_ID;

export const isOpponentType = (value: unknown): value is OpponentType =>
  value === "human" ||
  value === "easy_bot" ||
  value === "medium_bot" ||
  value === "hard_bot" ||
  value === "perfect_bot";

export const isChallengeDefinition = (value: unknown): value is ChallengeDefinition => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const definition = value as ChallengeDefinition;
  return (
    isChallengeId(definition.id) &&
    typeof definition.name === "string" &&
    typeof definition.description === "string" &&
    (definition.type === "milestone" || definition.type === "bot" || definition.type === "match") &&
    typeof definition.rewardXp === "number"
  );
};

export const isSubmitCompletedBotMatchRpcResponse = (
  value: unknown
): value is SubmitCompletedBotMatchRpcResponse => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const response = value as SubmitCompletedBotMatchRpcResponse;
  return response.progressionAward === null || isProgressionAwardResponse(response.progressionAward);
};

export const isCompletedMatchSummary = (value: unknown): value is CompletedMatchSummary => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const summary = value as CompletedMatchSummary;
  return (
    typeof summary.matchId === "string" &&
    typeof summary.playerUserId === "string" &&
    isOpponentType(summary.opponentType) &&
    typeof summary.didWin === "boolean" &&
    typeof summary.totalMoves === "number" &&
    typeof summary.playerMoveCount === "number" &&
    typeof summary.piecesLost === "number" &&
    typeof summary.maxRollCount === "number" &&
    typeof summary.capturesMade === "number" &&
    typeof summary.capturesSuffered === "number" &&
    typeof summary.contestedTilesLandedCount === "number" &&
    typeof summary.borneOffCount === "number" &&
    typeof summary.opponentBorneOffCount === "number" &&
    typeof summary.wasBehindDuringMatch === "boolean" &&
    typeof summary.behindCheckpointCount === "number" &&
    Array.isArray(summary.behindReasons) &&
    summary.behindReasons.every(
      (reason) => reason === "progress_deficit" || reason === "borne_off_deficit"
    ) &&
    typeof summary.timestamp === "string"
  );
};

export const sanitizeNonNegativeInteger = (value: unknown): number => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.floor(value));
};

const getPieceProgressScore = (position: number): number => {
  if (position < 0) {
    return 0;
  }

  if (position >= PATH_LENGTH) {
    return PATH_LENGTH + 1;
  }

  return position + 1;
};

export const calculateBoardProgressScore = (player: Player): number =>
  player.pieces.reduce((total, piece) => total + getPieceProgressScore(piece.position), 0);

export const calculateComebackCheckpoint = (
  state: GameState,
  playerColor: PlayerColor
): { wasBehind: boolean; reasons: MatchSummaryCheckpointReason[] } => {
  const opponentColor: PlayerColor = playerColor === "light" ? "dark" : "light";
  const player = state[playerColor];
  const opponent = state[opponentColor];
  const reasons: MatchSummaryCheckpointReason[] = [];

  const playerProgress = calculateBoardProgressScore(player);
  const opponentProgress = calculateBoardProgressScore(opponent);

  if (opponent.finishedCount > player.finishedCount) {
    reasons.push("borne_off_deficit");
  }

  // Require at least one full roll's worth of board-progress deficit so the comeback flag
  // only trips on meaningful trailing states instead of tiny opening variance.
  if (opponentProgress - playerProgress >= 4) {
    reasons.push("progress_deficit");
  }

  return {
    wasBehind: reasons.length > 0,
    reasons,
  };
};
