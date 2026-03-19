import {
  CompletedBotMatchRewardMode,
  ChallengeCompletionRecord,
  ChallengeDefinition,
  ChallengeDefinitionsRpcResponse,
  ChallengeId,
  CHALLENGE_DEFINITIONS,
  CHALLENGE_IDS,
  CompletedMatchSummary,
  createDefaultUserChallengeProgressSnapshot,
  getChallengeDefinition,
  isChallengeDefinition,
  isCompletedBotMatchRewardMode,
  isCompletedMatchSummary,
  isSubmitCompletedBotMatchRpcRequest,
  UserChallengeProgressRpcResponse,
  UserChallengeProgressSnapshot,
} from "../../shared/challenges";
import { ProgressionProfile, getRankForXp } from "../../shared/progression";
import {
  MAX_WRITE_ATTEMPTS,
  PROGRESSION_COLLECTION,
  PROGRESSION_PROFILE_KEY,
  RuntimeStorageObject,
  STORAGE_PERMISSION_NONE,
  XP_REWARD_LEDGER_COLLECTION,
  awardXpForMatchWin,
  buildXpRewardLedgerRecord,
  ensureProgressionProfile,
  findStorageObject,
  getErrorMessage,
  getStorageObjectValue,
  getStorageObjectVersion,
  normalizeProgressionProfile,
} from "./progression";

type RuntimeContext = any;
type RuntimeLogger = any;
type RuntimeNakama = any;

type ChallengeDefinitionStorageObject = ChallengeDefinition & {
  syncedAt: string;
};

type ProcessedMatchResultRecord = {
  matchId: string;
  playerUserId: string;
  processedAt: string;
  summary: CompletedMatchSummary;
  completedChallengeIds: ChallengeId[];
  awardedXp: number;
};

export type ProcessCompletedMatchResult = {
  duplicate: boolean;
  completedChallengeIds: ChallengeId[];
  awardedXp: number;
  totalXp: number;
  progressionRank: string;
};

const CHALLENGE_DEFINITIONS_COLLECTION = "challenge_definitions";
const USER_CHALLENGE_PROGRESS_COLLECTION = "user_challenge_progress";
const USER_CHALLENGE_PROGRESS_KEY = "progress";
const PROCESSED_MATCH_RESULTS_COLLECTION = "processed_match_results";

export const RPC_GET_CHALLENGE_DEFINITIONS = "get_challenge_definitions";
export const RPC_GET_USER_CHALLENGE_PROGRESS = "get_user_challenge_progress";
export const RPC_SUBMIT_COMPLETED_BOT_MATCH = "submit_completed_bot_match";

const CHALLENGE_EVALUATORS: Readonly<Record<ChallengeId, (summary: CompletedMatchSummary) => boolean>> = {
  [CHALLENGE_IDS.FIRST_VICTORY]: (summary) => summary.didWin,
  [CHALLENGE_IDS.BEAT_EASY_BOT]: (summary) => summary.didWin && summary.opponentType === "easy_bot",
  [CHALLENGE_IDS.FAST_FINISH]: (summary) => summary.didWin && summary.totalMoves < 100,
  [CHALLENGE_IDS.SAFE_PLAY]: (summary) => summary.didWin && summary.piecesLost === 0,
  [CHALLENGE_IDS.LUCKY_ROLL]: (summary) => summary.didWin && summary.maxRollCount >= 3,
  [CHALLENGE_IDS.HOME_STRETCH]: (summary) => summary.didWin && summary.capturesMade === 0,
  // Intentional design decision: the challenge description does not require a win,
  // so any completed match with 3+ captures counts.
  [CHALLENGE_IDS.CAPTURE_MASTER]: (summary) => summary.capturesMade >= 3,
  [CHALLENGE_IDS.COMEBACK_WIN]: (summary) => summary.didWin && summary.wasBehindDuringMatch,
  [CHALLENGE_IDS.RISK_TAKER]: (summary) => summary.didWin && summary.contestedTilesLandedCount >= 3,
  [CHALLENGE_IDS.BEAT_MEDIUM_BOT]: (summary) => summary.didWin && summary.opponentType === "medium_bot",
  [CHALLENGE_IDS.BEAT_HARD_BOT]: (summary) => summary.didWin && summary.opponentType === "hard_bot",
  [CHALLENGE_IDS.BEAT_PERFECT_BOT]: (summary) => summary.didWin && summary.opponentType === "perfect_bot",
};

const buildChallengeRewardLedgerKey = (challengeId: ChallengeId): string => `challenge:${challengeId}`;
const buildProcessedMatchResultKey = (matchId: string): string => matchId;
const isBotOpponentType = (opponentType: CompletedMatchSummary["opponentType"]): boolean =>
  opponentType === "easy_bot" ||
  opponentType === "medium_bot" ||
  opponentType === "hard_bot" ||
  opponentType === "perfect_bot";

const readStringField = (value: unknown, keys: string[]): string | null => {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const record = value as Record<string, unknown>;
  for (const key of keys) {
    const field = record[key];
    if (typeof field === "string" && field.length > 0) {
      return field;
    }
  }

  return null;
};

const normalizeChallengeProgress = (
  rawValue: unknown,
  fallbackUpdatedAt = new Date().toISOString()
): UserChallengeProgressSnapshot => {
  const rawRecord = typeof rawValue === "object" && rawValue !== null ? (rawValue as Record<string, unknown>) : null;
  const rawChallenges =
    rawRecord && typeof rawRecord.challenges === "object" && rawRecord.challenges !== null
      ? (rawRecord.challenges as Record<string, unknown>)
      : null;

  const normalizedChallenges = CHALLENGE_DEFINITIONS.reduce(
    (states, definition) => {
      const rawState = rawChallenges?.[definition.id] as Record<string, unknown> | undefined;
      const completed = rawState?.completed === true;
      const completedAt = completed
        ? readStringField(rawState, ["completedAt", "completed_at"]) ?? fallbackUpdatedAt
        : null;
      const completedMatchId = completed ? readStringField(rawState, ["completedMatchId", "completed_match_id"]) : null;

      states[definition.id] = {
        challengeId: definition.id,
        completed,
        completedAt,
        completedMatchId: completedMatchId ?? null,
        rewardXp: definition.rewardXp,
      };
      return states;
    },
    {} as UserChallengeProgressSnapshot["challenges"]
  );

  const totalCompleted = Object.values(normalizedChallenges).filter((challenge) => challenge.completed).length;
  const totalRewardedXp = Object.values(normalizedChallenges)
    .filter((challenge) => challenge.completed)
    .reduce((total, challenge) => total + challenge.rewardXp, 0);

  return {
    totalCompleted,
    totalRewardedXp,
    updatedAt: readStringField(rawRecord, ["updatedAt", "updated_at"]) ?? fallbackUpdatedAt,
    challenges: normalizedChallenges,
  };
};

const challengeProgressNeedsRepair = (
  rawValue: unknown,
  normalized: UserChallengeProgressSnapshot
): boolean => {
  const rawRecord = typeof rawValue === "object" && rawValue !== null ? (rawValue as Record<string, unknown>) : null;
  if (!rawRecord) {
    return true;
  }

  if ((rawRecord.totalCompleted as number | undefined) !== normalized.totalCompleted) {
    return true;
  }

  if ((rawRecord.totalRewardedXp as number | undefined) !== normalized.totalRewardedXp) {
    return true;
  }

  const rawChallenges = rawRecord.challenges as Record<string, unknown> | undefined;
  return CHALLENGE_DEFINITIONS.some((definition) => {
    const rawState = rawChallenges?.[definition.id] as Record<string, unknown> | undefined;
    const normalizedState = normalized.challenges[definition.id];

    return (
      !rawState ||
      rawState.completed !== normalizedState.completed ||
      rawState.completedAt !== normalizedState.completedAt ||
      rawState.completedMatchId !== normalizedState.completedMatchId ||
      rawState.rewardXp !== normalizedState.rewardXp
    );
  });
};

const readChallengeProgressObject = (nk: RuntimeNakama, userId: string): RuntimeStorageObject | null => {
  const objects = nk.storageRead([
    {
      collection: USER_CHALLENGE_PROGRESS_COLLECTION,
      key: USER_CHALLENGE_PROGRESS_KEY,
      userId,
    },
  ]) as RuntimeStorageObject[];

  return findStorageObject(objects, USER_CHALLENGE_PROGRESS_COLLECTION, USER_CHALLENGE_PROGRESS_KEY, userId);
};

const writeChallengeProgressObject = (
  nk: RuntimeNakama,
  userId: string,
  progress: UserChallengeProgressSnapshot,
  version: string
): void => {
  nk.storageWrite([
    {
      collection: USER_CHALLENGE_PROGRESS_COLLECTION,
      key: USER_CHALLENGE_PROGRESS_KEY,
      userId,
      value: progress,
      version,
      permissionRead: STORAGE_PERMISSION_NONE,
      permissionWrite: STORAGE_PERMISSION_NONE,
    },
  ]);
};

export const ensureChallengeDefinitions = (nk: RuntimeNakama, logger: RuntimeLogger): void => {
  for (let attempt = 1; attempt <= MAX_WRITE_ATTEMPTS; attempt += 1) {
    const existingObjects = nk.storageRead(
      CHALLENGE_DEFINITIONS.map((definition) => ({
        collection: CHALLENGE_DEFINITIONS_COLLECTION,
        key: definition.id,
      }))
    ) as RuntimeStorageObject[];

    const writes = CHALLENGE_DEFINITIONS.flatMap((definition) => {
      const existing = findStorageObject(existingObjects, CHALLENGE_DEFINITIONS_COLLECTION, definition.id);
      const stored = getStorageObjectValue(existing);
      if (stored && isChallengeDefinition(stored)) {
        const storedDefinition = stored as ChallengeDefinition;
        if (
          storedDefinition.name === definition.name &&
          storedDefinition.description === definition.description &&
          storedDefinition.type === definition.type &&
          storedDefinition.rewardXp === definition.rewardXp
        ) {
          return [];
        }
      }

      const value: ChallengeDefinitionStorageObject = {
        ...definition,
        syncedAt: new Date().toISOString(),
      };

      return [
        {
          collection: CHALLENGE_DEFINITIONS_COLLECTION,
          key: definition.id,
          value,
          version: existing ? (getStorageObjectVersion(existing) ?? "") : "*",
          permissionRead: STORAGE_PERMISSION_NONE,
          permissionWrite: STORAGE_PERMISSION_NONE,
        },
      ];
    });

    if (writes.length === 0) {
      return;
    }

    try {
      nk.storageWrite(writes);
      logger.info("Synchronized %d challenge definitions into Nakama storage.", writes.length);
      return;
    } catch (error) {
      logger.warn(
        "Challenge definition sync attempt %d/%d failed: %s",
        attempt,
        MAX_WRITE_ATTEMPTS,
        getErrorMessage(error)
      );
    }
  }

  throw new Error("Unable to synchronize challenge definitions into Nakama storage.");
};

export const ensureUserChallengeProgress = (
  nk: RuntimeNakama,
  logger: RuntimeLogger,
  userId: string
): UserChallengeProgressSnapshot => {
  for (let attempt = 1; attempt <= MAX_WRITE_ATTEMPTS; attempt += 1) {
    const existingObject = readChallengeProgressObject(nk, userId);

    if (existingObject) {
      const normalized = normalizeChallengeProgress(getStorageObjectValue(existingObject));
      if (!challengeProgressNeedsRepair(getStorageObjectValue(existingObject), normalized)) {
        return normalized;
      }

      try {
        writeChallengeProgressObject(nk, userId, normalized, getStorageObjectVersion(existingObject) ?? "");
        return normalized;
      } catch (error) {
        logger.warn(
          "Challenge progress repair attempt %d/%d failed for user %s: %s",
          attempt,
          MAX_WRITE_ATTEMPTS,
          userId,
          getErrorMessage(error)
        );
      }

      continue;
    }

    const defaults = createDefaultUserChallengeProgressSnapshot();
    try {
      writeChallengeProgressObject(nk, userId, defaults, "*");
      return defaults;
    } catch (error) {
      logger.warn(
        "Challenge progress init attempt %d/%d failed for user %s: %s",
        attempt,
        MAX_WRITE_ATTEMPTS,
        userId,
        getErrorMessage(error)
      );
    }
  }

  throw new Error(`Unable to initialize challenge progress for user ${userId}.`);
};

export const getChallengeDefinitionsResponse = (): ChallengeDefinitionsRpcResponse => ({
  challenges: [...CHALLENGE_DEFINITIONS],
});

export const getUserChallengeProgress = (
  nk: RuntimeNakama,
  logger: RuntimeLogger,
  userId: string
): UserChallengeProgressRpcResponse => ensureUserChallengeProgress(nk, logger, userId);

export const evaluateChallengesForMatchSummary = (summary: CompletedMatchSummary): ChallengeId[] =>
  CHALLENGE_DEFINITIONS.filter((definition) => CHALLENGE_EVALUATORS[definition.id](summary)).map(
    (definition) => definition.id
  );

const normalizeProcessedMatchResult = (rawValue: unknown): ProcessedMatchResultRecord | null => {
  if (typeof rawValue !== "object" || rawValue === null) {
    return null;
  }

  const record = rawValue as Record<string, unknown>;
  const matchId = readStringField(record, ["matchId", "match_id"]);
  const playerUserId = readStringField(record, ["playerUserId", "player_user_id"]);
  const processedAt = readStringField(record, ["processedAt", "processed_at"]);
  const summary = record.summary as unknown;
  const completedChallengeIds = Array.isArray(record.completedChallengeIds)
    ? (record.completedChallengeIds.filter((challengeId): challengeId is ChallengeId => typeof challengeId === "string") as ChallengeId[])
    : [];
  const awardedXp = typeof record.awardedXp === "number" ? record.awardedXp : 0;

  if (!matchId || !playerUserId || !processedAt || !isCompletedMatchSummary(summary)) {
    return null;
  }

  return {
    matchId,
    playerUserId,
    processedAt,
    summary,
    completedChallengeIds,
    awardedXp,
  };
};

const readMatchProcessingObjects = (
  nk: RuntimeNakama,
  userId: string,
  matchId: string,
  candidateChallengeIds: ChallengeId[]
): {
  profileObject: RuntimeStorageObject | null;
  challengeProgressObject: RuntimeStorageObject | null;
  processedMatchObject: RuntimeStorageObject | null;
  rewardLedgerObjectsByChallengeId: Partial<Record<ChallengeId, RuntimeStorageObject>>;
} => {
  const objectIds = [
    {
      collection: PROGRESSION_COLLECTION,
      key: PROGRESSION_PROFILE_KEY,
      userId,
    },
    {
      collection: USER_CHALLENGE_PROGRESS_COLLECTION,
      key: USER_CHALLENGE_PROGRESS_KEY,
      userId,
    },
    {
      collection: PROCESSED_MATCH_RESULTS_COLLECTION,
      key: buildProcessedMatchResultKey(matchId),
      userId,
    },
    ...candidateChallengeIds.map((challengeId) => ({
      collection: XP_REWARD_LEDGER_COLLECTION,
      key: buildChallengeRewardLedgerKey(challengeId),
      userId,
    })),
  ];

  const objects = nk.storageRead(objectIds) as RuntimeStorageObject[];
  const rewardLedgerObjectsByChallengeId = candidateChallengeIds.reduce(
    (entries, challengeId) => {
      const rewardObject = findStorageObject(
        objects,
        XP_REWARD_LEDGER_COLLECTION,
        buildChallengeRewardLedgerKey(challengeId),
        userId
      );
      if (rewardObject) {
        entries[challengeId] = rewardObject;
      }
      return entries;
    },
    {} as Partial<Record<ChallengeId, RuntimeStorageObject>>
  );

  return {
    profileObject: findStorageObject(objects, PROGRESSION_COLLECTION, PROGRESSION_PROFILE_KEY, userId),
    challengeProgressObject: findStorageObject(
      objects,
      USER_CHALLENGE_PROGRESS_COLLECTION,
      USER_CHALLENGE_PROGRESS_KEY,
      userId
    ),
    processedMatchObject: findStorageObject(
      objects,
      PROCESSED_MATCH_RESULTS_COLLECTION,
      buildProcessedMatchResultKey(matchId),
      userId
    ),
    rewardLedgerObjectsByChallengeId,
  };
};

export const processCompletedMatch = (
  nk: RuntimeNakama,
  logger: RuntimeLogger,
  summary: CompletedMatchSummary
): ProcessCompletedMatchResult => {
  if (!isCompletedMatchSummary(summary)) {
    throw new Error("Completed match summary payload is invalid.");
  }

  const userId = summary.playerUserId.trim();
  const matchId = summary.matchId.trim();
  if (!userId || !matchId) {
    throw new Error("Completed match summary must include non-empty match and user IDs.");
  }

  const satisfiedChallengeIds = evaluateChallengesForMatchSummary(summary);

  for (let attempt = 1; attempt <= MAX_WRITE_ATTEMPTS; attempt += 1) {
    const now = new Date().toISOString();
    const {
      profileObject,
      challengeProgressObject,
      processedMatchObject,
      rewardLedgerObjectsByChallengeId,
    } = readMatchProcessingObjects(nk, userId, matchId, satisfiedChallengeIds);

    const currentProfile = profileObject
      ? normalizeProgressionProfile(getStorageObjectValue(profileObject), now)
      : ensureProgressionProfile(nk, logger, userId);
    const currentProgress = challengeProgressObject
      ? normalizeChallengeProgress(getStorageObjectValue(challengeProgressObject), now)
      : createDefaultUserChallengeProgressSnapshot(now);

    const existingProcessedMatch = normalizeProcessedMatchResult(getStorageObjectValue(processedMatchObject));
    if (existingProcessedMatch) {
      return {
        duplicate: true,
        completedChallengeIds: existingProcessedMatch.completedChallengeIds,
        awardedXp: existingProcessedMatch.awardedXp,
        totalXp: currentProfile.totalXp,
        progressionRank: getRankForXp(currentProfile.totalXp).title,
      };
    }

    const completedChallengeIds: ChallengeId[] = [];
    const completionWrites: ChallengeCompletionRecord[] = [];
    let totalAwardedXp = 0;

    const nextProgress: UserChallengeProgressSnapshot = {
      ...currentProgress,
      updatedAt: now,
      challenges: { ...currentProgress.challenges },
    };

    for (const challengeId of satisfiedChallengeIds) {
      const definition = getChallengeDefinition(challengeId);
      const existingState = nextProgress.challenges[challengeId];
      if (existingState.completed) {
        continue;
      }

      completedChallengeIds.push(challengeId);
      nextProgress.challenges[challengeId] = {
        challengeId,
        completed: true,
        completedAt: now,
        completedMatchId: matchId,
        rewardXp: definition.rewardXp,
      };

      if (!rewardLedgerObjectsByChallengeId[challengeId]) {
        totalAwardedXp += definition.rewardXp;
        completionWrites.push({
          challengeId,
          completedAt: now,
          completedMatchId: matchId,
          rewardXp: definition.rewardXp,
          rewardLedgerKey: buildChallengeRewardLedgerKey(challengeId),
        });
      }
    }

    nextProgress.totalCompleted = Object.values(nextProgress.challenges).filter((challenge) => challenge.completed).length;
    nextProgress.totalRewardedXp = Object.values(nextProgress.challenges)
      .filter((challenge) => challenge.completed)
      .reduce((total, challenge) => total + challenge.rewardXp, 0);

    const nextTotalXp = currentProfile.totalXp + totalAwardedXp;
    const nextProfile: ProgressionProfile = {
      totalXp: nextTotalXp,
      currentRankTitle: getRankForXp(nextTotalXp).title,
      lastUpdatedAt: now,
    };

    const processedRecord: ProcessedMatchResultRecord = {
      matchId,
      playerUserId: userId,
      processedAt: now,
      summary,
      completedChallengeIds,
      awardedXp: totalAwardedXp,
    };

    let ledgerRunningTotal = currentProfile.totalXp;
    const challengeRewardWrites = completionWrites.map((completion) => {
      const previousTotal = ledgerRunningTotal;
      const nextLedgerTotal = previousTotal + completion.rewardXp;
      ledgerRunningTotal = nextLedgerTotal;

      return {
        collection: XP_REWARD_LEDGER_COLLECTION,
        key: completion.rewardLedgerKey,
        userId,
        value: buildXpRewardLedgerRecord(
          userId,
          {
            ledgerKey: completion.rewardLedgerKey,
            source: "challenge_completion",
            sourceId: completion.challengeId,
            matchId,
            awardedXp: completion.rewardXp,
          },
          previousTotal,
          nextLedgerTotal,
          now
        ),
        version: "*",
        permissionRead: STORAGE_PERMISSION_NONE,
        permissionWrite: STORAGE_PERMISSION_NONE,
      };
    });

    const writes = [
      {
        collection: PROGRESSION_COLLECTION,
        key: PROGRESSION_PROFILE_KEY,
        userId,
        value: nextProfile,
        version: profileObject ? (getStorageObjectVersion(profileObject) ?? "") : "*",
        permissionRead: STORAGE_PERMISSION_NONE,
        permissionWrite: STORAGE_PERMISSION_NONE,
      },
      {
        collection: USER_CHALLENGE_PROGRESS_COLLECTION,
        key: USER_CHALLENGE_PROGRESS_KEY,
        userId,
        value: nextProgress,
        version: challengeProgressObject ? (getStorageObjectVersion(challengeProgressObject) ?? "") : "*",
        permissionRead: STORAGE_PERMISSION_NONE,
        permissionWrite: STORAGE_PERMISSION_NONE,
      },
      {
        collection: PROCESSED_MATCH_RESULTS_COLLECTION,
        key: buildProcessedMatchResultKey(matchId),
        userId,
        value: processedRecord,
        version: processedMatchObject ? (getStorageObjectVersion(processedMatchObject) ?? "") : "*",
        permissionRead: STORAGE_PERMISSION_NONE,
        permissionWrite: STORAGE_PERMISSION_NONE,
      },
      ...challengeRewardWrites,
    ];

    try {
      nk.storageWrite(writes);
      logger.info(
        "Processed completed match %s for user %s: %d challenge completions, %d XP awarded.",
        matchId,
        userId,
        completedChallengeIds.length,
        totalAwardedXp
      );

      return {
        duplicate: false,
        completedChallengeIds,
        awardedXp: totalAwardedXp,
        totalXp: nextTotalXp,
        progressionRank: nextProfile.currentRankTitle,
      };
    } catch (error) {
      const refreshed = readMatchProcessingObjects(nk, userId, matchId, satisfiedChallengeIds);
      const refreshedProcessed = normalizeProcessedMatchResult(getStorageObjectValue(refreshed.processedMatchObject));
      if (refreshedProcessed) {
        const refreshedProfile = refreshed.profileObject
          ? normalizeProgressionProfile(getStorageObjectValue(refreshed.profileObject), now)
          : currentProfile;
        return {
          duplicate: true,
          completedChallengeIds: refreshedProcessed.completedChallengeIds,
          awardedXp: refreshedProcessed.awardedXp,
          totalXp: refreshedProfile.totalXp,
          progressionRank: getRankForXp(refreshedProfile.totalXp).title,
        };
      }

      logger.warn(
        "Completed-match processing attempt %d/%d failed for user %s on match %s: %s",
        attempt,
        MAX_WRITE_ATTEMPTS,
        userId,
        matchId,
        getErrorMessage(error)
      );
    }
  }

  throw new Error(`Unable to process completed match ${matchId} for user ${userId}.`);
};

export const rpcGetChallengeDefinitions = (
  ctx: RuntimeContext,
  _logger: RuntimeLogger,
  _nk: RuntimeNakama,
  _payload: string
): string => {
  if (!ctx.userId) {
    throw new Error("Authentication required.");
  }

  return JSON.stringify(getChallengeDefinitionsResponse());
};

export const rpcSubmitCompletedBotMatch = (
  ctx: RuntimeContext,
  logger: RuntimeLogger,
  nk: RuntimeNakama,
  payload: string
): string => {
  if (!ctx.userId) {
    throw new Error("Authentication required.");
  }

  const parsed = payload ? JSON.parse(payload) : {};
  const requestPayload = isSubmitCompletedBotMatchRpcRequest(parsed)
    ? parsed
    : isCompletedMatchSummary(parsed)
      ? { summary: parsed }
      : null;

  if (!requestPayload) {
    throw new Error("Completed bot match summary payload is invalid.");
  }

  if (!requestPayload.summary.matchId.startsWith("local-")) {
    throw new Error("Completed bot match summary must use a local match ID.");
  }

  if (!isBotOpponentType(requestPayload.summary.opponentType)) {
    throw new Error("Completed bot match summary must reference a bot opponent.");
  }

  const rewardMode: CompletedBotMatchRewardMode = isCompletedBotMatchRewardMode(requestPayload.rewardMode)
    ? requestPayload.rewardMode
    : "standard";

  const summary: CompletedMatchSummary = {
    ...requestPayload.summary,
    playerUserId: ctx.userId,
  };

  const progressionAward = summary.didWin
    ? awardXpForMatchWin(nk, logger, {
        userId: ctx.userId,
        matchId: summary.matchId,
        source: "bot_win",
      })
    : null;

  if (rewardMode !== "base_win_only") {
    processCompletedMatch(nk, logger, summary);
  }

  return JSON.stringify({ progressionAward });
};

export const rpcGetUserChallengeProgress = (
  ctx: RuntimeContext,
  logger: RuntimeLogger,
  nk: RuntimeNakama,
  _payload: string
): string => {
  if (!ctx.userId) {
    throw new Error("Authentication required.");
  }

  return JSON.stringify(getUserChallengeProgress(nk, logger, ctx.userId));
};
