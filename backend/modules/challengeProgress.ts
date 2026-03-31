import {
  CHALLENGE_DEFINITIONS,
  CHALLENGE_IDS,
  CHALLENGE_IDS_EXCLUDING_PERFECTIONIST,
  CHALLENGE_THRESHOLDS,
  ChallengeId,
  CompletedMatchSummary,
  UserChallengeProgressSnapshot,
  UserChallengeProgressStats,
  createDefaultUserChallengeProgressSnapshot,
  formatUtcDayBucket,
  getChallengeDefinition,
  hasReachedImmortalRank,
} from "../../shared/challenges";
import { getRankForXp } from "../../shared/progression";

type RuntimeRecord = Record<string, unknown>;

type ChallengeEvaluationContext = {
  summary: CompletedMatchSummary;
  stats: UserChallengeProgressStats;
  totalXp: number;
  completedChallengeIds: Set<ChallengeId>;
};

const asRecord = (value: unknown): RuntimeRecord | null =>
  typeof value === "object" && value !== null ? (value as RuntimeRecord) : null;

const readStringField = (value: unknown, keys: string[]): string | null => {
  const record = asRecord(value);
  if (!record) {
    return null;
  }

  for (const key of keys) {
    const field = record[key];
    if (typeof field === "string" && field.length > 0) {
      return field;
    }
  }

  return null;
};

const readNumberField = (value: unknown, keys: string[]): number | null => {
  const record = asRecord(value);
  if (!record) {
    return null;
  }

  for (const key of keys) {
    const field = record[key];
    if (typeof field === "number" && Number.isFinite(field)) {
      return field;
    }
    if (typeof field === "string" && field.trim().length > 0) {
      const parsed = Number(field);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return null;
};

const clampNonNegativeInteger = (value: unknown): number =>
  typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;

const normalizeChallengeStats = (rawValue: unknown): UserChallengeProgressStats => {
  const record = asRecord(rawValue);
  return {
    totalGamesPlayed: clampNonNegativeInteger(
      readNumberField(record, ["totalGamesPlayed", "total_games_played"]) ?? 0
    ),
    totalWins: clampNonNegativeInteger(readNumberField(record, ["totalWins", "total_wins"]) ?? 0),
    currentWinStreak: clampNonNegativeInteger(
      readNumberField(record, ["currentWinStreak", "current_win_streak"]) ?? 0
    ),
    currentTournamentWinStreak: clampNonNegativeInteger(
      readNumberField(record, ["currentTournamentWinStreak", "current_tournament_win_streak"]) ?? 0
    ),
    dailyGameBucket: readStringField(record, ["dailyGameBucket", "daily_game_bucket"]),
    dailyGameCount: clampNonNegativeInteger(readNumberField(record, ["dailyGameCount", "daily_game_count"]) ?? 0),
  };
};

const getRequiredCountForChallenge = (challengeId: ChallengeId): number | null => {
  switch (challengeId) {
    case CHALLENGE_IDS.DAILY_GRINDER:
      return CHALLENGE_THRESHOLDS.DAILY_GRINDER_REQUIRED_GAMES;
    case CHALLENGE_IDS.WINNING_STREAK_I:
      return CHALLENGE_THRESHOLDS.WINNING_STREAK_I_REQUIRED_WINS;
    case CHALLENGE_IDS.WINNING_STREAK_II:
      return CHALLENGE_THRESHOLDS.WINNING_STREAK_II_REQUIRED_WINS;
    case CHALLENGE_IDS.WINNING_STREAK_III:
      return CHALLENGE_THRESHOLDS.WINNING_STREAK_III_REQUIRED_WINS;
    case CHALLENGE_IDS.VETERAN_I:
      return CHALLENGE_THRESHOLDS.VETERAN_I_REQUIRED_GAMES;
    case CHALLENGE_IDS.VETERAN_II:
      return CHALLENGE_THRESHOLDS.VETERAN_II_REQUIRED_GAMES;
    case CHALLENGE_IDS.VETERAN_III:
      return CHALLENGE_THRESHOLDS.VETERAN_III_REQUIRED_GAMES;
    case CHALLENGE_IDS.TOURNAMENT_SURVIVOR:
      return CHALLENGE_THRESHOLDS.TOURNAMENT_SURVIVOR_REQUIRED_WINS;
    default:
      return null;
  }
};

const buildIncompleteChallengeProgress = (
  challengeId: ChallengeId,
  stats: UserChallengeProgressStats,
  totalXp: number,
  completedChallengeIds: Set<ChallengeId>
): { progressCurrent: number | null; progressTarget: number | null; progressLabel: string | null } => {
  const requiredCount = getRequiredCountForChallenge(challengeId);

  if (requiredCount !== null) {
    let current = 0;
    let labelSuffix = "";

    switch (challengeId) {
      case CHALLENGE_IDS.DAILY_GRINDER:
        current = stats.dailyGameCount;
        labelSuffix = "games today";
        break;
      case CHALLENGE_IDS.WINNING_STREAK_I:
      case CHALLENGE_IDS.WINNING_STREAK_II:
      case CHALLENGE_IDS.WINNING_STREAK_III:
        current = stats.currentWinStreak;
        labelSuffix = "wins in a row";
        break;
      case CHALLENGE_IDS.VETERAN_I:
      case CHALLENGE_IDS.VETERAN_II:
      case CHALLENGE_IDS.VETERAN_III:
        current = stats.totalGamesPlayed;
        labelSuffix = "games played";
        break;
      case CHALLENGE_IDS.TOURNAMENT_SURVIVOR:
        current = stats.currentTournamentWinStreak;
        labelSuffix = "tournament wins in a row";
        break;
    }

    return {
      progressCurrent: current,
      progressTarget: requiredCount,
      progressLabel: `${Math.min(current, requiredCount)}/${requiredCount} ${labelSuffix}`,
    };
  }

  if (challengeId === CHALLENGE_IDS.ETERNAL) {
    return {
      progressCurrent: totalXp,
      progressTarget: CHALLENGE_THRESHOLDS.IMMORTAL_REQUIRED_XP,
      progressLabel: `Current rank: ${getRankForXp(totalXp).title}`,
    };
  }

  if (challengeId === CHALLENGE_IDS.PERFECTIONIST) {
    const completedOtherChallenges = CHALLENGE_IDS_EXCLUDING_PERFECTIONIST.filter((id) =>
      completedChallengeIds.has(id)
    ).length;
    const required = CHALLENGE_IDS_EXCLUDING_PERFECTIONIST.length;

    return {
      progressCurrent: completedOtherChallenges,
      progressTarget: required,
      progressLabel: `${completedOtherChallenges}/${required} other challenges completed`,
    };
  }

  return {
    progressCurrent: null,
    progressTarget: null,
    progressLabel: null,
  };
};

export const decorateChallengeProgressSnapshot = (
  snapshot: UserChallengeProgressSnapshot,
  totalXp: number
): UserChallengeProgressSnapshot => {
  const completedChallengeIds = new Set(
    CHALLENGE_DEFINITIONS.filter((definition) => snapshot.challenges[definition.id]?.completed).map(
      (definition) => definition.id
    )
  );

  return {
    ...snapshot,
    challenges: CHALLENGE_DEFINITIONS.reduce(
      (states, definition) => {
        const current = snapshot.challenges[definition.id];
        if (!current) {
          return states;
        }

        const progress = current.completed
          ? { progressCurrent: null, progressTarget: null, progressLabel: null }
          : buildIncompleteChallengeProgress(definition.id, snapshot.stats, totalXp, completedChallengeIds);

        states[definition.id] = {
          ...current,
          rewardXp: definition.rewardXp,
          ...progress,
        };
        return states;
      },
      {} as UserChallengeProgressSnapshot["challenges"]
    ),
  };
};

export const normalizeChallengeProgressSnapshot = (
  rawValue: unknown,
  totalXp: number,
  fallbackUpdatedAt = new Date().toISOString()
): UserChallengeProgressSnapshot => {
  const defaults = createDefaultUserChallengeProgressSnapshot(fallbackUpdatedAt);
  const rawRecord = asRecord(rawValue);
  const rawChallenges =
    rawRecord && typeof rawRecord.challenges === "object" && rawRecord.challenges !== null
      ? (rawRecord.challenges as Record<string, unknown>)
      : null;

  const normalized: UserChallengeProgressSnapshot = {
    ...defaults,
    updatedAt: readStringField(rawRecord, ["updatedAt", "updated_at"]) ?? fallbackUpdatedAt,
    stats: normalizeChallengeStats(rawRecord?.stats),
    challenges: CHALLENGE_DEFINITIONS.reduce(
      (states, definition) => {
        const rawState = asRecord(rawChallenges?.[definition.id]);
        const completed = rawState?.completed === true;
        const completedAt = completed
          ? readStringField(rawState, ["completedAt", "completed_at"]) ?? fallbackUpdatedAt
          : null;
        const completedMatchId = completed
          ? readStringField(rawState, ["completedMatchId", "completed_match_id"])
          : null;

        states[definition.id] = {
          challengeId: definition.id,
          completed,
          completedAt,
          completedMatchId: completedMatchId ?? null,
          rewardXp: definition.rewardXp,
          progressCurrent: null,
          progressTarget: null,
          progressLabel: null,
        };
        return states;
      },
      {} as UserChallengeProgressSnapshot["challenges"]
    ),
  };

  normalized.totalCompleted = Object.values(normalized.challenges).filter((challenge) => challenge.completed).length;
  normalized.totalRewardedXp = Object.values(normalized.challenges)
    .filter((challenge) => challenge.completed)
    .reduce((total, challenge) => total + challenge.rewardXp, 0);

  return decorateChallengeProgressSnapshot(normalized, totalXp);
};

export const challengeProgressNeedsRepair = (
  rawValue: unknown,
  normalized: UserChallengeProgressSnapshot
): boolean => {
  const rawRecord = asRecord(rawValue);
  if (!rawRecord) {
    return true;
  }

  if ((rawRecord.totalCompleted as number | undefined) !== normalized.totalCompleted) {
    return true;
  }

  if ((rawRecord.totalRewardedXp as number | undefined) !== normalized.totalRewardedXp) {
    return true;
  }

  if (rawRecord.updatedAt !== normalized.updatedAt) {
    return true;
  }

  const rawStats = asRecord(rawRecord.stats);
  if (
    readNumberField(rawStats, ["totalGamesPlayed", "total_games_played"]) !== normalized.stats.totalGamesPlayed ||
    readNumberField(rawStats, ["totalWins", "total_wins"]) !== normalized.stats.totalWins ||
    readNumberField(rawStats, ["currentWinStreak", "current_win_streak"]) !== normalized.stats.currentWinStreak ||
    readNumberField(rawStats, ["currentTournamentWinStreak", "current_tournament_win_streak"]) !==
      normalized.stats.currentTournamentWinStreak ||
    readStringField(rawStats, ["dailyGameBucket", "daily_game_bucket"]) !== normalized.stats.dailyGameBucket ||
    readNumberField(rawStats, ["dailyGameCount", "daily_game_count"]) !== normalized.stats.dailyGameCount
  ) {
    return true;
  }

  const rawChallenges = rawRecord.challenges as Record<string, unknown> | undefined;
  return CHALLENGE_DEFINITIONS.some((definition) => {
    const rawState = asRecord(rawChallenges?.[definition.id]);
    const normalizedState = normalized.challenges[definition.id];

    return (
      !rawState ||
      rawState.completed !== normalizedState.completed ||
      rawState.completedAt !== normalizedState.completedAt ||
      rawState.completedMatchId !== normalizedState.completedMatchId ||
      rawState.rewardXp !== normalizedState.rewardXp ||
      rawState.progressCurrent !== normalizedState.progressCurrent ||
      rawState.progressTarget !== normalizedState.progressTarget ||
      rawState.progressLabel !== normalizedState.progressLabel
    );
  });
};

export const applyMatchToChallengeStats = (
  currentStats: UserChallengeProgressStats,
  summary: CompletedMatchSummary
): UserChallengeProgressStats => {
  const dayBucket = formatUtcDayBucket(summary.timestamp);
  const sameDay = currentStats.dailyGameBucket === dayBucket;

  return {
    totalGamesPlayed: currentStats.totalGamesPlayed + 1,
    totalWins: currentStats.totalWins + (summary.didWin ? 1 : 0),
    currentWinStreak: summary.didWin ? currentStats.currentWinStreak + 1 : 0,
    currentTournamentWinStreak: summary.isTournamentMatch
      ? summary.didWin
        ? currentStats.currentTournamentWinStreak + 1
        : 0
      : currentStats.currentTournamentWinStreak,
    dailyGameBucket: dayBucket,
    dailyGameCount: sameDay ? currentStats.dailyGameCount + 1 : 1,
  };
};

const didWinModeWithPieceCount = (summary: CompletedMatchSummary, pieceCountPerSide: number): boolean =>
  summary.didWin && (summary.pieceCountPerSide ?? 0) === pieceCountPerSide;

export const evaluateChallengeCompletion = (
  challengeId: ChallengeId,
  context: ChallengeEvaluationContext
): boolean => {
  const { summary, stats, totalXp, completedChallengeIds } = context;
  const unusableRollCount = summary.unusableRollCount ?? 0;
  const playerTurnCount = summary.playerTurnCount ?? summary.playerMoveCount;
  const opponentTurnCount = summary.opponentTurnCount ?? 0;
  const captureTurnNumbers = Array.isArray(summary.captureTurnNumbers) ? summary.captureTurnNumbers : [];
  const maxCaptureTurnStreak = summary.maxCaptureTurnStreak ?? 0;
  const doubleStrikeAchieved =
    summary.doubleStrikeAchieved ??
    (captureTurnNumbers.length >= 2 &&
      captureTurnNumbers.some(
        (turn, index) =>
          index > 0 && turn - captureTurnNumbers[index - 1] + 1 <= CHALLENGE_THRESHOLDS.DOUBLE_STRIKE_MAX_TURN_SPAN
      ));
  const relentlessPressureAchieved =
    summary.relentlessPressureAchieved ?? maxCaptureTurnStreak >= CHALLENGE_THRESHOLDS.RELENTLESS_PRESSURE_REQUIRED_STREAK;
  const lockdownAchieved =
    summary.lockdownAchieved ??
    (opponentTurnCount >= CHALLENGE_THRESHOLDS.LOCKDOWN_REQUIRED_OPPONENT_TURNS &&
      (summary.opponentStartingAreaExitTurn === null ||
        summary.opponentStartingAreaExitTurn > CHALLENGE_THRESHOLDS.LOCKDOWN_REQUIRED_OPPONENT_TURNS));

  switch (challengeId) {
    case CHALLENGE_IDS.FIRST_VICTORY:
      return summary.didWin;
    case CHALLENGE_IDS.BEAT_EASY_BOT:
      return summary.didWin && summary.opponentType === "easy_bot";
    case CHALLENGE_IDS.FAST_FINISH:
      return summary.didWin && summary.totalMoves < CHALLENGE_THRESHOLDS.FAST_FINISH_MAX_TOTAL_MOVES;
    case CHALLENGE_IDS.SAFE_PLAY:
      return summary.didWin && summary.piecesLost === 0;
    case CHALLENGE_IDS.LUCKY_ROLL:
      return summary.didWin && summary.maxRollCount >= CHALLENGE_THRESHOLDS.LUCKY_ROLL_REQUIRED_MAX_ROLLS;
    case CHALLENGE_IDS.HOME_STRETCH:
      return summary.didWin && summary.capturesMade === 0;
    case CHALLENGE_IDS.CAPTURE_MASTER:
      return summary.capturesMade >= CHALLENGE_THRESHOLDS.CAPTURE_MASTER_REQUIRED_CAPTURES;
    case CHALLENGE_IDS.COMEBACK_WIN:
      return summary.didWin && summary.wasBehindDuringMatch;
    case CHALLENGE_IDS.RISK_TAKER:
      return (
        summary.didWin &&
        summary.contestedTilesLandedCount >= CHALLENGE_THRESHOLDS.RISK_TAKER_REQUIRED_CONTESTED_LANDINGS
      );
    case CHALLENGE_IDS.BEAT_MEDIUM_BOT:
      return summary.didWin && summary.opponentType === "medium_bot";
    case CHALLENGE_IDS.BEAT_HARD_BOT:
      return summary.didWin && summary.opponentType === "hard_bot";
    case CHALLENGE_IDS.BEAT_PERFECT_BOT:
      return summary.didWin && summary.opponentType === "perfect_bot";
    case CHALLENGE_IDS.PERFECT_PATH:
      return summary.didWin && summary.contestedTilesLandedCount === 0;
    case CHALLENGE_IDS.NO_WASTE:
      return unusableRollCount === 0;
    case CHALLENGE_IDS.DOUBLE_STRIKE:
      return doubleStrikeAchieved;
    case CHALLENGE_IDS.LOCKDOWN:
      return lockdownAchieved;
    case CHALLENGE_IDS.RELENTLESS_PRESSURE:
      return relentlessPressureAchieved;
    case CHALLENGE_IDS.UNBREAKABLE:
      return summary.capturesSuffered === 0;
    case CHALLENGE_IDS.FROM_THE_BRINK:
      return summary.didWin && summary.opponentReachedBrink;
    case CHALLENGE_IDS.MOMENTUM_SHIFT:
      return summary.momentumShiftAchieved === true;
    case CHALLENGE_IDS.SOLO_MASTER:
      return summary.didWin && summary.modeId === "gameMode_1_piece";
    case CHALLENGE_IDS.MINIMALIST:
      return didWinModeWithPieceCount(summary, 3);
    case CHALLENGE_IDS.HALF_STRATEGY:
      return didWinModeWithPieceCount(summary, 5);
    case CHALLENGE_IDS.FULL_COMMANDER:
      return didWinModeWithPieceCount(summary, 7);
    case CHALLENGE_IDS.SPEED_RUNNER:
      return (
        summary.didWin &&
        summary.modeId === "gameMode_1_piece" &&
        playerTurnCount < CHALLENGE_THRESHOLDS.SPEED_RUNNER_MAX_PLAYER_TURNS
      );
    case CHALLENGE_IDS.DAILY_GRINDER:
      return stats.dailyGameCount >= CHALLENGE_THRESHOLDS.DAILY_GRINDER_REQUIRED_GAMES;
    case CHALLENGE_IDS.WINNING_STREAK_I:
      return stats.currentWinStreak >= CHALLENGE_THRESHOLDS.WINNING_STREAK_I_REQUIRED_WINS;
    case CHALLENGE_IDS.WINNING_STREAK_II:
      return stats.currentWinStreak >= CHALLENGE_THRESHOLDS.WINNING_STREAK_II_REQUIRED_WINS;
    case CHALLENGE_IDS.WINNING_STREAK_III:
      return stats.currentWinStreak >= CHALLENGE_THRESHOLDS.WINNING_STREAK_III_REQUIRED_WINS;
    case CHALLENGE_IDS.VETERAN_I:
      return stats.totalGamesPlayed >= CHALLENGE_THRESHOLDS.VETERAN_I_REQUIRED_GAMES;
    case CHALLENGE_IDS.VETERAN_II:
      return stats.totalGamesPlayed >= CHALLENGE_THRESHOLDS.VETERAN_II_REQUIRED_GAMES;
    case CHALLENGE_IDS.VETERAN_III:
      return stats.totalGamesPlayed >= CHALLENGE_THRESHOLDS.VETERAN_III_REQUIRED_GAMES;
    case CHALLENGE_IDS.ETERNAL:
      return hasReachedImmortalRank(totalXp);
    case CHALLENGE_IDS.PERFECTIONIST:
      return CHALLENGE_IDS_EXCLUDING_PERFECTIONIST.every((id) => completedChallengeIds.has(id));
    case CHALLENGE_IDS.FRIENDLY_RIVALRY:
      return summary.didWin && summary.isFriendMatch === true;
    case CHALLENGE_IDS.TOURNAMENT_SURVIVOR:
      return stats.currentTournamentWinStreak >= CHALLENGE_THRESHOLDS.TOURNAMENT_SURVIVOR_REQUIRED_WINS;
    case CHALLENGE_IDS.CLUTCH_TOURNAMENT:
      return summary.didWin && summary.isTournamentMatch === true && summary.tournamentEliminationRisk === true;
    case CHALLENGE_IDS.SILENT_VICTORY:
      return summary.didWin && summary.capturesMade === 0;
    case CHALLENGE_IDS.SHADOW_PLAYER:
      return summary.didWin && (summary.maxActivePiecesOnBoard ?? 0) <= 1;
    case CHALLENGE_IDS.MASTER_OF_UR:
      return summary.didWin && summary.opponentType === "perfect_bot" && summary.capturesSuffered === 0;
    default:
      return false;
  }
};

export const evaluateChallengeCompletions = (
  context: ChallengeEvaluationContext
): ChallengeId[] =>
  CHALLENGE_DEFINITIONS.filter(
    (definition) =>
      !context.completedChallengeIds.has(definition.id) &&
      evaluateChallengeCompletion(definition.id, context)
  ).map((definition) => definition.id);

export const createCompletedChallengeState = (
  challengeId: ChallengeId,
  completedAt: string,
  completedMatchId: string
) => {
  const definition = getChallengeDefinition(challengeId);
  return {
    challengeId,
    completed: true,
    completedAt,
    completedMatchId,
    rewardXp: definition.rewardXp,
    progressCurrent: null,
    progressTarget: null,
    progressLabel: null,
  };
};
