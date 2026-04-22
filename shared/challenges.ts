import { getPathCoord, getPathForColor, getPathLength } from "../logic/pathVariants";
import { isContestedWarTile } from "../logic/rules";
import { GameState, Player, PlayerColor } from "../logic/types";
import { MAX_PROGRESSION_RANK, ProgressionAwardResponse, getRankForXp, isProgressionAwardResponse } from "./progression";

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
  PERFECT_PATH: "perfect_path",
  NO_WASTE: "no_waste",
  DOUBLE_STRIKE: "double_strike",
  LOCKDOWN: "lockdown",
  RELENTLESS_PRESSURE: "relentless_pressure",
  UNBREAKABLE: "unbreakable",
  FROM_THE_BRINK: "from_the_brink",
  MOMENTUM_SHIFT: "momentum_shift",
  SOLO_MASTER: "solo_master",
  MINIMALIST: "minimalist",
  HALF_STRATEGY: "half_strategy",
  FULL_COMMANDER: "full_commander",
  SPEED_RUNNER: "speed_runner",
  DAILY_GRINDER: "daily_grinder",
  WINNING_STREAK_I: "winning_streak_i",
  WINNING_STREAK_II: "winning_streak_ii",
  WINNING_STREAK_III: "winning_streak_iii",
  VETERAN_I: "veteran_i",
  VETERAN_II: "veteran_ii",
  VETERAN_III: "veteran_iii",
  ETERNAL: "eternal",
  PERFECTIONIST: "perfectionist",
  FRIENDLY_RIVALRY: "friendly_rivalry",
  TOURNAMENT_SURVIVOR: "tournament_survivor",
  CLUTCH_TOURNAMENT: "clutch_tournament",
  SILENT_VICTORY: "silent_victory",
  SHADOW_PLAYER: "shadow_player",
  MASTER_OF_UR: "master_of_ur",
} as const;

export type ChallengeId = (typeof CHALLENGE_IDS)[keyof typeof CHALLENGE_IDS];
export type ChallengeType =
  | "milestone"
  | "bot"
  | "match"
  | "mode"
  | "progression"
  | "social"
  | "tournament"
  | "meta";
export type ChallengeCategory = "starter" | "mastery" | "mode" | "grind" | "social" | "tournament" | "meta";
export type OpponentType = "human" | "easy_bot" | "medium_bot" | "hard_bot" | "perfect_bot";
export type OpponentDifficulty = "easy" | "medium" | "hard" | "perfect";

export type ChallengeDefinition = {
  id: ChallengeId;
  name: string;
  description: string;
  type: ChallengeType;
  category: ChallengeCategory;
  rewardXp: number;
  sortOrder: number;
  hidden?: boolean;
};

export type MatchSummaryCheckpointReason = "progress_deficit" | "borne_off_deficit";
export type PositionLeadRelation = "behind" | "tied" | "ahead";

export type CompletedMatchSummary = {
  matchId: string;
  playerUserId: string;
  opponentType: OpponentType;
  opponentDifficulty: OpponentDifficulty | null;
  didWin: boolean;
  totalMoves: number;
  playerMoveCount: number;
  playerTurnCount: number;
  opponentTurnCount: number;
  piecesLost: number;
  maxRollCount: number;
  unusableRollCount: number;
  capturesMade: number;
  capturesSuffered: number;
  captureTurnNumbers: number[];
  maxCaptureTurnStreak: number;
  doubleStrikeAchieved: boolean;
  relentlessPressureAchieved: boolean;
  contestedTilesLandedCount: number;
  opponentStartingAreaExitTurn: number | null;
  lockdownAchieved: boolean;
  borneOffCount: number;
  opponentBorneOffCount: number;
  wasBehindDuringMatch: boolean;
  behindCheckpointCount: number;
  behindReasons: MatchSummaryCheckpointReason[];
  opponentReachedBrink: boolean;
  momentumShiftAchieved: boolean;
  momentumShiftTurnSpan: number | null;
  maxActivePiecesOnBoard: number;
  modeId: string | null;
  pieceCountPerSide: number;
  isPrivateMatch: boolean;
  isFriendMatch: boolean;
  isTournamentMatch: boolean;
  tournamentEliminationRisk: boolean;
  timestamp: string;
};

export type ChallengeCompletionRecord = {
  challengeId: ChallengeId;
  completedAt: string;
  completedMatchId: string;
  rewardXp: number;
  rewardSoftCurrency: number;
  rewardLedgerKey: string;
};

export type UserChallengeProgressStats = {
  totalGamesPlayed: number;
  totalWins: number;
  currentWinStreak: number;
  currentTournamentWinStreak: number;
  dailyGameBucket: string | null;
  dailyGameCount: number;
};

export type UserChallengeState = {
  challengeId: ChallengeId;
  completed: boolean;
  completedAt: string | null;
  completedMatchId: string | null;
  rewardXp: number;
  progressCurrent: number | null;
  progressTarget: number | null;
  progressLabel: string | null;
};

export type UserChallengeProgressSnapshot = {
  totalCompleted: number;
  totalRewardedXp: number;
  updatedAt: string;
  stats: UserChallengeProgressStats;
  challenges: Record<ChallengeId, UserChallengeState>;
};

export type ChallengeDefinitionsRpcResponse = {
  challenges: ChallengeDefinition[];
};

export type UserChallengeProgressRpcResponse = UserChallengeProgressSnapshot;

export type CompletedBotMatchRewardMode = "standard" | "base_win_only";

export type SubmitCompletedBotMatchRpcRequest = {
  summary: CompletedMatchSummary;
  tutorialId?: string | null;
  modeId?: string | null;
  rewardMode?: CompletedBotMatchRewardMode;
};

export type SubmitCompletedBotMatchRpcResponse = {
  progressionAward: ProgressionAwardResponse | null;
};

export const CHALLENGE_THRESHOLDS = {
  FAST_FINISH_MAX_TOTAL_MOVES: 100,
  LUCKY_ROLL_REQUIRED_MAX_ROLLS: 3,
  CAPTURE_MASTER_REQUIRED_CAPTURES: 3,
  RISK_TAKER_REQUIRED_CONTESTED_LANDINGS: 3,
  DOUBLE_STRIKE_MAX_TURN_SPAN: 3,
  LOCKDOWN_REQUIRED_OPPONENT_TURNS: 10,
  RELENTLESS_PRESSURE_REQUIRED_STREAK: 3,
  MOMENTUM_SHIFT_MAX_TURN_WINDOW: 5,
  SPEED_RUNNER_MAX_PLAYER_TURNS: 10,
  DAILY_GRINDER_REQUIRED_GAMES: 3,
  WINNING_STREAK_I_REQUIRED_WINS: 3,
  WINNING_STREAK_II_REQUIRED_WINS: 5,
  WINNING_STREAK_III_REQUIRED_WINS: 10,
  VETERAN_I_REQUIRED_GAMES: 50,
  VETERAN_II_REQUIRED_GAMES: 100,
  VETERAN_III_REQUIRED_GAMES: 250,
  IMMORTAL_REQUIRED_XP: MAX_PROGRESSION_RANK.threshold,
  TOURNAMENT_SURVIVOR_REQUIRED_WINS: 3,
} as const;

export const CHALLENGE_DEFINITIONS: readonly ChallengeDefinition[] = [
  {
    id: CHALLENGE_IDS.FIRST_VICTORY,
    name: "First Victory",
    description: "Win your first completed game against any opponent.",
    type: "milestone",
    category: "starter",
    rewardXp: 50,
    sortOrder: 10,
  },
  {
    id: CHALLENGE_IDS.BEAT_EASY_BOT,
    name: "Beat the Easy Bot",
    description: "Win a completed game against the easy AI opponent.",
    type: "bot",
    category: "starter",
    rewardXp: 30,
    sortOrder: 20,
  },
  {
    id: CHALLENGE_IDS.BEAT_MEDIUM_BOT,
    name: "Beat the Medium Bot",
    description: "Win a completed game against the medium AI opponent.",
    type: "bot",
    category: "mastery",
    rewardXp: 100,
    sortOrder: 30,
  },
  {
    id: CHALLENGE_IDS.BEAT_HARD_BOT,
    name: "Beat the Hard Bot",
    description: "Win a completed game against the hard AI opponent.",
    type: "bot",
    category: "mastery",
    rewardXp: 150,
    sortOrder: 40,
  },
  {
    id: CHALLENGE_IDS.BEAT_PERFECT_BOT,
    name: "Beat the Perfect Bot",
    description: "Win a completed game against the perfect AI opponent.",
    type: "bot",
    category: "mastery",
    rewardXp: 250,
    sortOrder: 50,
  },
  {
    id: CHALLENGE_IDS.MASTER_OF_UR,
    name: "Master of Ur",
    description: "Win against the perfect bot without losing a piece.",
    type: "bot",
    category: "mastery",
    rewardXp: 350,
    sortOrder: 60,
  },
  {
    id: CHALLENGE_IDS.FAST_FINISH,
    name: "Fast Finish",
    description: "Win a completed game in fewer than 100 total applied moves.",
    type: "match",
    category: "mastery",
    rewardXp: 150,
    sortOrder: 70,
  },
  {
    id: CHALLENGE_IDS.SAFE_PLAY,
    name: "Safe Play",
    description: "Win a completed game without losing any pieces to captures.",
    type: "match",
    category: "mastery",
    rewardXp: 150,
    sortOrder: 80,
  },
  {
    id: CHALLENGE_IDS.UNBREAKABLE,
    name: "Unbreakable",
    description: "Complete a game without any of your pieces being captured.",
    type: "match",
    category: "mastery",
    rewardXp: 120,
    sortOrder: 90,
  },
  {
    id: CHALLENGE_IDS.LUCKY_ROLL,
    name: "Lucky Roll",
    description: "Win a completed game after rolling the maximum value at least 3 times.",
    type: "match",
    category: "mastery",
    rewardXp: 100,
    sortOrder: 100,
  },
  {
    id: CHALLENGE_IDS.HOME_STRETCH,
    name: "Home Stretch",
    description: "Win a completed game while making zero captures across the entire match.",
    type: "match",
    category: "mastery",
    rewardXp: 150,
    sortOrder: 110,
  },
  {
    id: CHALLENGE_IDS.SILENT_VICTORY,
    name: "Silent Victory",
    description: "Win without capturing any opponent pieces.",
    type: "match",
    category: "mastery",
    rewardXp: 150,
    sortOrder: 120,
  },
  {
    id: CHALLENGE_IDS.CAPTURE_MASTER,
    name: "Capture Master",
    description: "Capture at least 3 opponent pieces in a single completed game. Victory is not required.",
    type: "match",
    category: "mastery",
    rewardXp: 150,
    sortOrder: 130,
  },
  {
    id: CHALLENGE_IDS.DOUBLE_STRIKE,
    name: "Double Strike",
    description: "Capture two opponent pieces within 3 of your own turns.",
    type: "match",
    category: "mastery",
    rewardXp: 150,
    sortOrder: 140,
  },
  {
    id: CHALLENGE_IDS.RELENTLESS_PRESSURE,
    name: "Relentless Pressure",
    description: "Capture at least one piece in 3 consecutive turns of your own.",
    type: "match",
    category: "mastery",
    rewardXp: 180,
    sortOrder: 150,
  },
  {
    id: CHALLENGE_IDS.PERFECT_PATH,
    name: "Perfect Path",
    description: "Win without landing on a contested tile.",
    type: "match",
    category: "mastery",
    rewardXp: 120,
    sortOrder: 160,
  },
  {
    id: CHALLENGE_IDS.RISK_TAKER,
    name: "Risk Taker",
    description: "Win a completed game after landing on shared contestable tiles at least 3 times.",
    type: "match",
    category: "mastery",
    rewardXp: 200,
    sortOrder: 170,
  },
  {
    id: CHALLENGE_IDS.NO_WASTE,
    name: "No Waste",
    description: "Complete a game with zero unusable rolls.",
    type: "match",
    category: "mastery",
    rewardXp: 120,
    sortOrder: 180,
  },
  {
    id: CHALLENGE_IDS.LOCKDOWN,
    name: "Lockdown",
    description: "Keep the opponent from leaving their starting area for 10 turns.",
    type: "match",
    category: "mastery",
    rewardXp: 180,
    sortOrder: 190,
  },
  {
    id: CHALLENGE_IDS.COMEBACK_WIN,
    name: "Comeback Win",
    description: "Win a completed game after trailing at one or more deterministic progress checkpoints during the match.",
    type: "match",
    category: "mastery",
    rewardXp: 250,
    sortOrder: 200,
  },
  {
    id: CHALLENGE_IDS.FROM_THE_BRINK,
    name: "From the Brink",
    description: "Win after the opponent reaches a state where they are one successful move from victory.",
    type: "match",
    category: "mastery",
    rewardXp: 220,
    sortOrder: 210,
  },
  {
    id: CHALLENGE_IDS.MOMENTUM_SHIFT,
    name: "Momentum Shift",
    description: "Go from behind to ahead within a 5-turn window.",
    type: "match",
    category: "mastery",
    rewardXp: 200,
    sortOrder: 220,
  },
  {
    id: CHALLENGE_IDS.SHADOW_PLAYER,
    name: "Shadow Player",
    description: "Win while never having more than one of your own pieces on the board at the same time.",
    type: "match",
    category: "mastery",
    rewardXp: 250,
    sortOrder: 230,
  },
  {
    id: CHALLENGE_IDS.SOLO_MASTER,
    name: "Solo Master",
    description: "Win a Pure Luck game.",
    type: "mode",
    category: "mode",
    rewardXp: 80,
    sortOrder: 240,
  },
  {
    id: CHALLENGE_IDS.SPEED_RUNNER,
    name: "Speed Runner",
    description: "Win a Pure Luck game in under 10 turns.",
    type: "mode",
    category: "mode",
    rewardXp: 200,
    sortOrder: 250,
  },
  {
    id: CHALLENGE_IDS.MINIMALIST,
    name: "Minimalist",
    description: "Win with 3 pieces.",
    type: "mode",
    category: "mode",
    rewardXp: 100,
    sortOrder: 260,
  },
  {
    id: CHALLENGE_IDS.HALF_STRATEGY,
    name: "Half Strategy",
    description: "Win with 5 pieces.",
    type: "mode",
    category: "mode",
    rewardXp: 120,
    sortOrder: 270,
  },
  {
    id: CHALLENGE_IDS.FULL_COMMANDER,
    name: "Full Commander",
    description: "Win a full 7-piece match.",
    type: "mode",
    category: "mode",
    rewardXp: 100,
    sortOrder: 280,
  },
  {
    id: CHALLENGE_IDS.DAILY_GRINDER,
    name: "Daily Grinder",
    description: "Complete 3 games in one UTC day.",
    type: "progression",
    category: "grind",
    rewardXp: 100,
    sortOrder: 290,
  },
  {
    id: CHALLENGE_IDS.WINNING_STREAK_I,
    name: "Winning Streak I",
    description: "Win 3 games in a row.",
    type: "progression",
    category: "grind",
    rewardXp: 100,
    sortOrder: 300,
  },
  {
    id: CHALLENGE_IDS.WINNING_STREAK_II,
    name: "Winning Streak II",
    description: "Win 5 games in a row.",
    type: "progression",
    category: "grind",
    rewardXp: 180,
    sortOrder: 310,
  },
  {
    id: CHALLENGE_IDS.WINNING_STREAK_III,
    name: "Winning Streak III",
    description: "Win 10 games in a row.",
    type: "progression",
    category: "grind",
    rewardXp: 320,
    sortOrder: 320,
  },
  {
    id: CHALLENGE_IDS.VETERAN_I,
    name: "Veteran I",
    description: "Play 50 games.",
    type: "progression",
    category: "grind",
    rewardXp: 120,
    sortOrder: 330,
  },
  {
    id: CHALLENGE_IDS.VETERAN_II,
    name: "Veteran II",
    description: "Play 100 games.",
    type: "progression",
    category: "grind",
    rewardXp: 220,
    sortOrder: 340,
  },
  {
    id: CHALLENGE_IDS.VETERAN_III,
    name: "Veteran III",
    description: "Play 250 games.",
    type: "progression",
    category: "grind",
    rewardXp: 400,
    sortOrder: 350,
  },
  {
    id: CHALLENGE_IDS.ETERNAL,
    name: "Eternal",
    description: "Reach the Immortal rank.",
    type: "progression",
    category: "grind",
    rewardXp: 300,
    sortOrder: 360,
  },
  {
    id: CHALLENGE_IDS.FRIENDLY_RIVALRY,
    name: "Friendly Rivalry",
    description: "Win against a friend.",
    type: "social",
    category: "social",
    rewardXp: 120,
    sortOrder: 370,
  },
  {
    id: CHALLENGE_IDS.TOURNAMENT_SURVIVOR,
    name: "Tournament Survivor",
    description: "Win 3 consecutive tournament matches.",
    type: "tournament",
    category: "tournament",
    rewardXp: 220,
    sortOrder: 380,
  },
  {
    id: CHALLENGE_IDS.CLUTCH_TOURNAMENT,
    name: "Clutch Tournament",
    description: "Win a tournament match while at risk of elimination.",
    type: "tournament",
    category: "tournament",
    rewardXp: 220,
    sortOrder: 390,
  },
  {
    id: CHALLENGE_IDS.PERFECTIONIST,
    name: "Perfectionist",
    description: "Complete every other challenge.",
    type: "meta",
    category: "meta",
    rewardXp: 500,
    sortOrder: 400,
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

export const CHALLENGE_IDS_EXCLUDING_PERFECTIONIST = CHALLENGE_DEFINITIONS.filter(
  (definition) => definition.id !== CHALLENGE_IDS.PERFECTIONIST
).map((definition) => definition.id) as ChallengeId[];

export const getChallengeDefinition = (challengeId: ChallengeId): ChallengeDefinition => {
  const definition = CHALLENGE_DEFINITION_BY_ID[challengeId];
  if (!definition) {
    throw new Error(`Unknown challenge definition: ${challengeId}`);
  }

  return definition;
};

export const createDefaultChallengeProgressStats = (): UserChallengeProgressStats => ({
  totalGamesPlayed: 0,
  totalWins: 0,
  currentWinStreak: 0,
  currentTournamentWinStreak: 0,
  dailyGameBucket: null,
  dailyGameCount: 0,
});

export const createDefaultUserChallengeProgressSnapshot = (
  updatedAt = new Date().toISOString()
): UserChallengeProgressSnapshot => ({
  totalCompleted: 0,
  totalRewardedXp: 0,
  updatedAt,
  stats: createDefaultChallengeProgressStats(),
  challenges: CHALLENGE_DEFINITIONS.reduce(
    (states, definition) => {
      states[definition.id] = {
        challengeId: definition.id,
        completed: false,
        completedAt: null,
        completedMatchId: null,
        rewardXp: definition.rewardXp,
        progressCurrent: null,
        progressTarget: null,
        progressLabel: null,
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

export const isOpponentDifficulty = (value: unknown): value is OpponentDifficulty =>
  value === "easy" || value === "medium" || value === "hard" || value === "perfect";

export const getOpponentDifficultyFromType = (opponentType: OpponentType): OpponentDifficulty | null => {
  if (opponentType === "human") {
    return null;
  }

  return opponentType.replace("_bot", "") as OpponentDifficulty;
};

export const isChallengeDefinition = (value: unknown): value is ChallengeDefinition => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const definition = value as ChallengeDefinition;
  return (
    isChallengeId(definition.id) &&
    typeof definition.name === "string" &&
    typeof definition.description === "string" &&
    typeof definition.type === "string" &&
    typeof definition.category === "string" &&
    typeof definition.rewardXp === "number" &&
    typeof definition.sortOrder === "number" &&
    (typeof definition.hidden === "undefined" || typeof definition.hidden === "boolean")
  );
};

export const isUserChallengeState = (value: unknown): value is UserChallengeState => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const state = value as UserChallengeState;
  return (
    isChallengeId(state.challengeId) &&
    typeof state.completed === "boolean" &&
    (typeof state.completedAt === "string" || state.completedAt === null) &&
    (typeof state.completedMatchId === "string" || state.completedMatchId === null) &&
    typeof state.rewardXp === "number" &&
    (typeof state.progressCurrent === "number" || state.progressCurrent === null) &&
    (typeof state.progressTarget === "number" || state.progressTarget === null) &&
    (typeof state.progressLabel === "string" || state.progressLabel === null)
  );
};

export const isUserChallengeProgressStats = (value: unknown): value is UserChallengeProgressStats => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const stats = value as UserChallengeProgressStats;
  return (
    typeof stats.totalGamesPlayed === "number" &&
    typeof stats.totalWins === "number" &&
    typeof stats.currentWinStreak === "number" &&
    typeof stats.currentTournamentWinStreak === "number" &&
    (typeof stats.dailyGameBucket === "string" || stats.dailyGameBucket === null) &&
    typeof stats.dailyGameCount === "number"
  );
};

export const isUserChallengeProgressSnapshot = (
  value: unknown
): value is UserChallengeProgressSnapshot => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const snapshot = value as UserChallengeProgressSnapshot;
  if (
    typeof snapshot.totalCompleted !== "number" ||
    typeof snapshot.totalRewardedXp !== "number" ||
    typeof snapshot.updatedAt !== "string" ||
    !isUserChallengeProgressStats(snapshot.stats) ||
    typeof snapshot.challenges !== "object" ||
    snapshot.challenges === null
  ) {
    return false;
  }

  return CHALLENGE_DEFINITIONS.every((definition) =>
    isUserChallengeState(snapshot.challenges[definition.id])
  );
};

export const isUserChallengeProgressRpcResponse = (
  value: unknown
): value is UserChallengeProgressRpcResponse => isUserChallengeProgressSnapshot(value);

export const isSubmitCompletedBotMatchRpcResponse = (
  value: unknown
): value is SubmitCompletedBotMatchRpcResponse => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const response = value as SubmitCompletedBotMatchRpcResponse;
  return response.progressionAward === null || isProgressionAwardResponse(response.progressionAward);
};

const isOptionalNonNegativeNumber = (value: unknown): boolean =>
  typeof value === "undefined" || (typeof value === "number" && Number.isFinite(value) && value >= 0);

const isOptionalBoolean = (value: unknown): boolean =>
  typeof value === "undefined" || typeof value === "boolean";

export const isCompletedMatchSummary = (value: unknown): value is CompletedMatchSummary => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const summary = value as CompletedMatchSummary;
  return (
    typeof summary.matchId === "string" &&
    typeof summary.playerUserId === "string" &&
    isOpponentType(summary.opponentType) &&
    (summary.opponentDifficulty === null ||
      typeof summary.opponentDifficulty === "undefined" ||
      isOpponentDifficulty(summary.opponentDifficulty)) &&
    typeof summary.didWin === "boolean" &&
    typeof summary.totalMoves === "number" &&
    typeof summary.playerMoveCount === "number" &&
    isOptionalNonNegativeNumber(summary.playerTurnCount) &&
    isOptionalNonNegativeNumber(summary.opponentTurnCount) &&
    typeof summary.piecesLost === "number" &&
    typeof summary.maxRollCount === "number" &&
    isOptionalNonNegativeNumber(summary.unusableRollCount) &&
    typeof summary.capturesMade === "number" &&
    typeof summary.capturesSuffered === "number" &&
    (typeof summary.captureTurnNumbers === "undefined" ||
      (Array.isArray(summary.captureTurnNumbers) &&
        summary.captureTurnNumbers.every((turn) => typeof turn === "number" && turn >= 0))) &&
    isOptionalNonNegativeNumber(summary.maxCaptureTurnStreak) &&
    isOptionalBoolean(summary.doubleStrikeAchieved) &&
    isOptionalBoolean(summary.relentlessPressureAchieved) &&
    typeof summary.contestedTilesLandedCount === "number" &&
    (typeof summary.opponentStartingAreaExitTurn === "undefined" ||
      summary.opponentStartingAreaExitTurn === null ||
      (typeof summary.opponentStartingAreaExitTurn === "number" && summary.opponentStartingAreaExitTurn >= 0)) &&
    isOptionalBoolean(summary.lockdownAchieved) &&
    typeof summary.borneOffCount === "number" &&
    typeof summary.opponentBorneOffCount === "number" &&
    typeof summary.wasBehindDuringMatch === "boolean" &&
    typeof summary.behindCheckpointCount === "number" &&
    Array.isArray(summary.behindReasons) &&
    summary.behindReasons.every(
      (reason) => reason === "progress_deficit" || reason === "borne_off_deficit"
    ) &&
    isOptionalBoolean(summary.opponentReachedBrink) &&
    isOptionalBoolean(summary.momentumShiftAchieved) &&
    (typeof summary.momentumShiftTurnSpan === "undefined" ||
      summary.momentumShiftTurnSpan === null ||
      (typeof summary.momentumShiftTurnSpan === "number" && summary.momentumShiftTurnSpan >= 0)) &&
    isOptionalNonNegativeNumber(summary.maxActivePiecesOnBoard) &&
    (typeof summary.modeId === "undefined" || summary.modeId === null || typeof summary.modeId === "string") &&
    isOptionalNonNegativeNumber(summary.pieceCountPerSide) &&
    isOptionalBoolean(summary.isPrivateMatch) &&
    isOptionalBoolean(summary.isFriendMatch) &&
    isOptionalBoolean(summary.isTournamentMatch) &&
    isOptionalBoolean(summary.tournamentEliminationRisk) &&
    typeof summary.timestamp === "string"
  );
};

export const isCompletedBotMatchRewardMode = (value: unknown): value is CompletedBotMatchRewardMode =>
  value === "standard" || value === "base_win_only";

export const isSubmitCompletedBotMatchRpcRequest = (
  value: unknown
): value is SubmitCompletedBotMatchRpcRequest => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const payload = value as SubmitCompletedBotMatchRpcRequest;
  return (
    isCompletedMatchSummary(payload.summary) &&
    (typeof payload.tutorialId === "string" || payload.tutorialId === null || typeof payload.tutorialId === "undefined") &&
    (typeof payload.modeId === "undefined" || payload.modeId === null || typeof payload.modeId === "string") &&
    (typeof payload.rewardMode === "undefined" || isCompletedBotMatchRewardMode(payload.rewardMode))
  );
};

export const sanitizeNonNegativeInteger = (value: unknown): number => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.floor(value));
};

const getPieceProgressScore = (position: number, pathLength: number): number => {
  if (position < 0) {
    return 0;
  }

  if (position >= pathLength) {
    return pathLength + 1;
  }

  return position + 1;
};

export const calculateBoardProgressScore = (player: Player, pathLength: number): number =>
  player.pieces.reduce((total, piece) => total + getPieceProgressScore(piece.position, pathLength), 0);

export const getPositionLeadRelation = (
  state: GameState,
  playerColor: PlayerColor
): PositionLeadRelation => {
  const opponentColor: PlayerColor = playerColor === "light" ? "dark" : "light";
  const pathLength = getPathLength(state.matchConfig.pathVariant);
  const playerScore = calculateBoardProgressScore(state[playerColor], pathLength);
  const opponentScore = calculateBoardProgressScore(state[opponentColor], pathLength);

  if (playerScore > opponentScore) {
    return "ahead";
  }

  if (playerScore < opponentScore) {
    return "behind";
  }

  return "tied";
};

export const calculateComebackCheckpoint = (
  state: GameState,
  playerColor: PlayerColor
): { wasBehind: boolean; reasons: MatchSummaryCheckpointReason[] } => {
  const opponentColor: PlayerColor = playerColor === "light" ? "dark" : "light";
  const player = state[playerColor];
  const opponent = state[opponentColor];
  const reasons: MatchSummaryCheckpointReason[] = [];
  const pathLength = getPathLength(state.matchConfig.pathVariant);

  const playerProgress = calculateBoardProgressScore(player, pathLength);
  const opponentProgress = calculateBoardProgressScore(opponent, pathLength);

  if (opponent.finishedCount > player.finishedCount) {
    reasons.push("borne_off_deficit");
  }

  if (opponentProgress - playerProgress >= 4) {
    reasons.push("progress_deficit");
  }

  return {
    wasBehind: reasons.length > 0,
    reasons,
  };
};

export const formatUtcDayBucket = (isoTimestamp: string): string => isoTimestamp.slice(0, 10);

export const getSharedPathStartIndex = (
  modeIdOrVariant: GameState["matchConfig"]["pathVariant"]
): number => {
  const path = getPathForColor(modeIdOrVariant, "light");
  const sharedIndex = path.findIndex((coord) => coord.row === 1);
  return sharedIndex >= 0 ? sharedIndex : path.length;
};

export const isContestedLanding = (
  matchConfig: Pick<GameState["matchConfig"], "pathVariant" | "rulesVariant" | "rosetteSafetyMode">,
  playerColor: PlayerColor,
  targetIndex: number
): boolean => {
  const coord = getPathCoord(matchConfig.pathVariant, playerColor, targetIndex);
  return isContestedWarTile(matchConfig, coord);
};

export const countActivePiecesOnBoard = (
  player: Player,
  pathLength: number
): number =>
  player.pieces.filter((piece) => piece.position >= 0 && piece.position < pathLength && !piece.isFinished).length;

export const hasPlayerExitedStartingArea = (
  player: Player,
  variant: GameState["matchConfig"]["pathVariant"]
): boolean => {
  const sharedPathStartIndex = getSharedPathStartIndex(variant);
  return player.pieces.some((piece) => piece.isFinished || piece.position >= sharedPathStartIndex);
};

export const isOneSuccessfulMoveFromVictory = (
  state: GameState,
  playerColor: PlayerColor
): boolean => {
  const player = state[playerColor];
  const pathLength = getPathLength(state.matchConfig.pathVariant);
  const remainingPieces = player.pieces.filter((piece) => !piece.isFinished);

  if (remainingPieces.length !== 1) {
    return false;
  }

  const finalPiece = remainingPieces[0];
  if (finalPiece.position < 0) {
    return false;
  }

  const distanceToFinish = pathLength - finalPiece.position;
  return distanceToFinish >= 1 && distanceToFinish <= 4;
};

export const calculateMaxConsecutiveCaptureTurns = (captureTurnNumbers: number[]): number => {
  if (captureTurnNumbers.length === 0) {
    return 0;
  }

  let best = 1;
  let current = 1;

  for (let index = 1; index < captureTurnNumbers.length; index += 1) {
    if (captureTurnNumbers[index] === captureTurnNumbers[index - 1] + 1) {
      current += 1;
      best = Math.max(best, current);
      continue;
    }

    current = 1;
  }

  return best;
};

export const calculateDoubleStrikeTurnSpan = (
  captureTurnNumbers: number[],
  maxInclusiveTurnSpan = CHALLENGE_THRESHOLDS.DOUBLE_STRIKE_MAX_TURN_SPAN
): number | null => {
  if (captureTurnNumbers.length < 2) {
    return null;
  }

  let bestSpan: number | null = null;

  for (let index = 1; index < captureTurnNumbers.length; index += 1) {
    const span = captureTurnNumbers[index] - captureTurnNumbers[index - 1] + 1;
    if (span <= maxInclusiveTurnSpan) {
      bestSpan = bestSpan === null ? span : Math.min(bestSpan, span);
    }
  }

  return bestSpan;
};

export const calculateMomentumShiftTurnSpan = (
  checkpoints: { turn: number; relation: PositionLeadRelation }[],
  maxTurnWindow = CHALLENGE_THRESHOLDS.MOMENTUM_SHIFT_MAX_TURN_WINDOW
): number | null => {
  let latestBehindTurn: number | null = null;
  let bestSpan: number | null = null;

  checkpoints.forEach((checkpoint) => {
    if (checkpoint.relation === "behind") {
      latestBehindTurn = checkpoint.turn;
      return;
    }

    if (checkpoint.relation !== "ahead" || latestBehindTurn === null) {
      return;
    }

    const span = checkpoint.turn - latestBehindTurn;
    if (span <= maxTurnWindow) {
      bestSpan = bestSpan === null ? span : Math.min(bestSpan, span);
    }
  });

  return bestSpan;
};

export const hasReachedImmortalRank = (totalXp: number): boolean =>
  getRankForXp(totalXp).title === MAX_PROGRESSION_RANK.title;
