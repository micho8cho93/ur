import {
  buildProgressionSnapshot,
  createDefaultProgressionProfile,
  getRankForXp,
  getXpAwardAmount,
  ProgressionAwardNotificationPayload,
  ProgressionAwardResponse,
  ProgressionProfile,
  ProgressionSnapshot,
  sanitizeTotalXp,
  XP_SOURCE_CONFIG,
  XpSource,
} from "../../shared/progression";

type RuntimeContext = any;
type RuntimeLogger = any;
type RuntimeNakama = any;

export type RuntimeRecord = Record<string, unknown>;
export type RuntimeStorageObject = RuntimeRecord & {
  value?: unknown;
  version?: string;
};

export type XpRewardSource = XpSource | "challenge_completion";

export type StoredXpRewardRecord = {
  userId: string;
  ledgerKey: string;
  source: XpRewardSource;
  sourceId: string;
  matchId: string | null;
  awardedAt: string;
  awardedXp: number;
  previousTotalXp: number;
  newTotalXp: number;
  progression: ProgressionSnapshot;
};

export type XpRewardResult = {
  ledgerKey: string;
  source: XpRewardSource;
  sourceId: string;
  matchId: string | null;
  duplicate: boolean;
  awardedXp: number;
  previousTotalXp: number;
  newTotalXp: number;
  previousRank: string;
  newRank: string;
  rankChanged: boolean;
  progression: ProgressionSnapshot;
};

export type XpRewardGrant = {
  ledgerKey: string;
  source: XpRewardSource;
  sourceId: string;
  matchId?: string | null;
  awardedXp: number;
};

export const PROGRESSION_COLLECTION = "progression";
export const PROGRESSION_PROFILE_KEY = "profile";
export const XP_REWARD_LEDGER_COLLECTION = "xp_reward_ledger";

export const STORAGE_PERMISSION_NONE = 0;
export const MAX_WRITE_ATTEMPTS = 4;
export const GLOBAL_STORAGE_USER_ID = "00000000-0000-0000-0000-000000000000";

export const RPC_GET_PROGRESSION = "get_progression";
export const RPC_GET_USER_XP_PROGRESS = "get_user_xp_progress";

export const asRecord = (value: unknown): RuntimeRecord | null =>
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

export const getStorageObjectValue = (object: RuntimeStorageObject | null): unknown => object?.value ?? null;

export const getStorageObjectVersion = (object: RuntimeStorageObject | null): string | null =>
  readStringField(object, ["version"]);

export const maybeSetStorageVersion = <T extends RuntimeRecord>(
  write: T,
  version: string | null | undefined
): T & { version?: string } =>
  typeof version === "string" && version.length > 0 ? { ...write, version } : write;

export const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

export const findStorageObject = (
  objects: RuntimeStorageObject[],
  collection: string,
  key: string,
  userId?: string
): RuntimeStorageObject | null =>
  objects.find((object) => {
    const collectionName = readStringField(object, ["collection"]);
    const objectKey = readStringField(object, ["key"]);
    const objectUserId = readStringField(object, ["userId", "user_id"]);

    if (collectionName !== collection || objectKey !== key) {
      return false;
    }

    if (typeof userId === "string") {
      return objectUserId === userId;
    }

    return !objectUserId || objectUserId === GLOBAL_STORAGE_USER_ID;
  }) ?? null;

export const normalizeProgressionProfile = (
  rawValue: unknown,
  fallbackUpdatedAt = new Date().toISOString()
): ProgressionProfile => {
  const totalXp = sanitizeTotalXp(readNumberField(rawValue, ["totalXp", "total_xp"]) ?? 0);
  const lastUpdatedAt = readStringField(rawValue, ["lastUpdatedAt", "last_updated_at"]) ?? fallbackUpdatedAt;

  return {
    totalXp,
    currentRankTitle: getRankForXp(totalXp).title,
    lastUpdatedAt,
  };
};

const profileNeedsRepair = (rawValue: unknown, normalized: ProgressionProfile): boolean => {
  const rawRecord = asRecord(rawValue);
  if (!rawRecord) {
    return true;
  }

  const rawTotalXp = readNumberField(rawRecord, ["totalXp", "total_xp"]);
  const rawRankTitle = readStringField(rawRecord, ["currentRankTitle", "current_rank_title"]);
  const rawLastUpdatedAt = readStringField(rawRecord, ["lastUpdatedAt", "last_updated_at"]);

  return (
    rawTotalXp !== normalized.totalXp ||
    rawRankTitle !== normalized.currentRankTitle ||
    rawLastUpdatedAt !== normalized.lastUpdatedAt
  );
};

export const normalizeStoredXpRewardRecord = (rawValue: unknown): StoredXpRewardRecord | null => {
  const record = asRecord(rawValue);
  if (!record) {
    return null;
  }

  const userId = readStringField(record, ["userId", "user_id"]);
  const ledgerKey = readStringField(record, ["ledgerKey", "ledger_key"]);
  const source = readStringField(record, ["source"]);
  const sourceId = readStringField(record, ["sourceId", "source_id"]);
  const awardedAt = readStringField(record, ["awardedAt", "awarded_at"]);
  const matchId = readStringField(record, ["matchId", "match_id"]);
  const awardedXp = sanitizeTotalXp(readNumberField(record, ["awardedXp", "awarded_xp"]) ?? 0);
  const previousTotalXp = sanitizeTotalXp(readNumberField(record, ["previousTotalXp", "previous_total_xp"]) ?? 0);
  const newTotalXp = sanitizeTotalXp(readNumberField(record, ["newTotalXp", "new_total_xp"]) ?? 0);
  const progression = record.progression as unknown;
  const isKnownRewardSource = (
    candidate: string | null
  ): candidate is XpRewardSource =>
    typeof candidate === "string" && (candidate === "challenge_completion" || candidate in XP_SOURCE_CONFIG);
  const normalizedSource = isKnownRewardSource(source) ? source : null;

  if (
    !userId ||
    !ledgerKey ||
    !sourceId ||
    !awardedAt ||
    !normalizedSource ||
    typeof progression !== "object" ||
    progression === null
  ) {
    return null;
  }

  return {
    userId,
    ledgerKey,
    source: normalizedSource,
    sourceId,
    matchId: matchId ?? null,
    awardedAt,
    awardedXp,
    previousTotalXp,
    newTotalXp,
    progression: progression as ProgressionSnapshot,
  };
};

const readProgressionProfileObject = (nk: RuntimeNakama, userId: string): RuntimeStorageObject | null => {
  const objects = nk.storageRead([
    {
      collection: PROGRESSION_COLLECTION,
      key: PROGRESSION_PROFILE_KEY,
      userId,
    },
  ]) as RuntimeStorageObject[];

  return findStorageObject(objects, PROGRESSION_COLLECTION, PROGRESSION_PROFILE_KEY, userId);
};

const readProgressionProfileAndLedger = (
  nk: RuntimeNakama,
  userId: string,
  ledgerKey: string
): { profileObject: RuntimeStorageObject | null; ledgerObject: RuntimeStorageObject | null } => {
  const objects = nk.storageRead([
    {
      collection: PROGRESSION_COLLECTION,
      key: PROGRESSION_PROFILE_KEY,
      userId,
    },
    {
      collection: XP_REWARD_LEDGER_COLLECTION,
      key: ledgerKey,
      userId,
    },
  ]) as RuntimeStorageObject[];

  return {
    profileObject: findStorageObject(objects, PROGRESSION_COLLECTION, PROGRESSION_PROFILE_KEY, userId),
    ledgerObject: findStorageObject(objects, XP_REWARD_LEDGER_COLLECTION, ledgerKey, userId),
  };
};

export const writeProgressionProfile = (
  nk: RuntimeNakama,
  userId: string,
  profile: ProgressionProfile,
  version: string
): void => {
  nk.storageWrite([
    {
      collection: PROGRESSION_COLLECTION,
      key: PROGRESSION_PROFILE_KEY,
      userId,
      value: profile,
      version,
      permissionRead: STORAGE_PERMISSION_NONE,
      permissionWrite: STORAGE_PERMISSION_NONE,
    },
  ]);
};

const buildDuplicateRewardResult = (
  ledgerObject: RuntimeStorageObject,
  fallbackProgression: ProgressionSnapshot,
  fallback: { ledgerKey: string; source: XpRewardSource; sourceId: string; matchId: string | null }
): XpRewardResult => {
  const normalizedRecord = normalizeStoredXpRewardRecord(getStorageObjectValue(ledgerObject));
  if (normalizedRecord) {
    const previousRank = getRankForXp(normalizedRecord.previousTotalXp).title;
    const newRank = getRankForXp(normalizedRecord.newTotalXp).title;

    return {
      ledgerKey: normalizedRecord.ledgerKey,
      source: normalizedRecord.source,
      sourceId: normalizedRecord.sourceId,
      matchId: normalizedRecord.matchId,
      duplicate: true,
      awardedXp: normalizedRecord.awardedXp,
      previousTotalXp: normalizedRecord.previousTotalXp,
      newTotalXp: normalizedRecord.newTotalXp,
      previousRank,
      newRank,
      rankChanged: previousRank !== newRank,
      progression: normalizedRecord.progression,
    };
  }

  return {
    ledgerKey: fallback.ledgerKey,
    source: fallback.source,
    sourceId: fallback.sourceId,
    matchId: fallback.matchId,
    duplicate: true,
    awardedXp: 0,
    previousTotalXp: fallbackProgression.totalXp,
    newTotalXp: fallbackProgression.totalXp,
    previousRank: fallbackProgression.currentRank,
    newRank: fallbackProgression.currentRank,
    rankChanged: false,
    progression: fallbackProgression,
  };
};

export const buildXpRewardLedgerRecord = (
  userId: string,
  reward: XpRewardGrant,
  previousTotalXp: number,
  newTotalXp: number,
  awardedAt: string
): StoredXpRewardRecord => ({
  userId,
  ledgerKey: reward.ledgerKey,
  source: reward.source,
  sourceId: reward.sourceId,
  matchId: reward.matchId ?? null,
  awardedAt,
  awardedXp: sanitizeTotalXp(reward.awardedXp),
  previousTotalXp,
  newTotalXp,
  progression: buildProgressionSnapshot(newTotalXp),
});

export const ensureProgressionProfile = (
  nk: RuntimeNakama,
  logger: RuntimeLogger,
  userId: string
): ProgressionProfile => {
  for (let attempt = 1; attempt <= MAX_WRITE_ATTEMPTS; attempt += 1) {
    const existingObject = readProgressionProfileObject(nk, userId);

    if (existingObject) {
      const normalizedProfile = normalizeProgressionProfile(getStorageObjectValue(existingObject));
      if (!profileNeedsRepair(getStorageObjectValue(existingObject), normalizedProfile)) {
        return normalizedProfile;
      }

      try {
        writeProgressionProfile(nk, userId, normalizedProfile, getStorageObjectVersion(existingObject) ?? "");
        return normalizedProfile;
      } catch (error) {
        logger.warn(
          "Progression profile repair attempt %d/%d failed for user %s: %s",
          attempt,
          MAX_WRITE_ATTEMPTS,
          userId,
          getErrorMessage(error)
        );
      }

      continue;
    }

    const defaultProfile = createDefaultProgressionProfile(0);

    try {
      writeProgressionProfile(nk, userId, defaultProfile, "*");
      return defaultProfile;
    } catch (error) {
      logger.warn(
        "Progression profile init attempt %d/%d failed for user %s: %s",
        attempt,
        MAX_WRITE_ATTEMPTS,
        userId,
        getErrorMessage(error)
      );
    }
  }

  throw new Error(`Unable to initialize progression for user ${userId}.`);
};

export const getProgressionForUser = (
  nk: RuntimeNakama,
  logger: RuntimeLogger,
  userId: string
): ProgressionSnapshot => buildProgressionSnapshot(ensureProgressionProfile(nk, logger, userId).totalXp);

export const awardXp = (
  nk: RuntimeNakama,
  logger: RuntimeLogger,
  params: XpRewardGrant & { userId: string }
): XpRewardResult => {
  const userId = params.userId?.trim();
  const ledgerKey = params.ledgerKey?.trim();
  const sourceId = params.sourceId?.trim();

  if (!userId) {
    throw new Error("Cannot award progression without a user ID.");
  }

  if (!ledgerKey) {
    throw new Error("Cannot award progression without an XP ledger key.");
  }

  if (!sourceId) {
    throw new Error("Cannot award progression without a source ID.");
  }

  const awardedXp = sanitizeTotalXp(params.awardedXp);
  if (awardedXp <= 0) {
    throw new Error(`Configured XP award for ledger key "${ledgerKey}" must be positive.`);
  }

  for (let attempt = 1; attempt <= MAX_WRITE_ATTEMPTS; attempt += 1) {
    const now = new Date().toISOString();
    const { profileObject, ledgerObject } = readProgressionProfileAndLedger(nk, userId, ledgerKey);
    const currentProfile = profileObject
      ? normalizeProgressionProfile(getStorageObjectValue(profileObject), now)
      : createDefaultProgressionProfile(0, now);
    const currentSnapshot = buildProgressionSnapshot(currentProfile.totalXp);

    if (ledgerObject) {
      return buildDuplicateRewardResult(ledgerObject, currentSnapshot, {
        ledgerKey,
        source: params.source,
        sourceId,
        matchId: params.matchId ?? null,
      });
    }

    const previousTotalXp = currentProfile.totalXp;
    const newTotalXp = sanitizeTotalXp(previousTotalXp + awardedXp);
    const previousRank = getRankForXp(previousTotalXp).title;
    const newRank = getRankForXp(newTotalXp).title;

    const response: XpRewardResult = {
      ledgerKey,
      source: params.source,
      sourceId,
      matchId: params.matchId ?? null,
      duplicate: false,
      awardedXp,
      previousTotalXp,
      newTotalXp,
      previousRank,
      newRank,
      rankChanged: previousRank !== newRank,
      progression: buildProgressionSnapshot(newTotalXp),
    };

    const nextProfile: ProgressionProfile = {
      totalXp: newTotalXp,
      currentRankTitle: newRank,
      lastUpdatedAt: now,
    };

    const rewardRecord = buildXpRewardLedgerRecord(
      userId,
      {
        ledgerKey,
        source: params.source,
        sourceId,
        matchId: params.matchId ?? null,
        awardedXp,
      },
      previousTotalXp,
      newTotalXp,
      now
    );

    try {
      nk.storageWrite([
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
          collection: XP_REWARD_LEDGER_COLLECTION,
          key: ledgerKey,
          userId,
          value: rewardRecord,
          version: "*",
          permissionRead: STORAGE_PERMISSION_NONE,
          permissionWrite: STORAGE_PERMISSION_NONE,
        },
      ]);

      logger.info(
        "Awarded %d XP to user %s for %s (%s). total=%d",
        awardedXp,
        userId,
        params.source,
        sourceId,
        newTotalXp
      );

      return response;
    } catch (error) {
      const refreshed = readProgressionProfileAndLedger(nk, userId, ledgerKey);
      if (refreshed.ledgerObject) {
        return buildDuplicateRewardResult(
          refreshed.ledgerObject,
          buildProgressionSnapshot(
            normalizeProgressionProfile(getStorageObjectValue(refreshed.profileObject), now).totalXp
          ),
          {
            ledgerKey,
            source: params.source,
            sourceId,
            matchId: params.matchId ?? null,
          }
        );
      }

      logger.warn(
        "XP award write attempt %d/%d failed for user %s (%s/%s): %s",
        attempt,
        MAX_WRITE_ATTEMPTS,
        userId,
        params.source,
        sourceId,
        getErrorMessage(error)
      );
    }
  }

  throw new Error(`Unable to persist progression award for user ${userId} on ledger ${ledgerKey}.`);
};

const buildMatchWinAwardResponse = (
  result: XpRewardResult & { source: XpSource }
): ProgressionAwardResponse => ({
  matchId: result.matchId ?? result.sourceId,
  source: result.source,
  duplicate: result.duplicate,
  awardedXp: result.awardedXp,
  previousTotalXp: result.previousTotalXp,
  newTotalXp: result.newTotalXp,
  previousRank: result.previousRank,
  newRank: result.newRank,
  rankChanged: result.rankChanged,
  progression: result.progression,
});

export const awardXpForMatchWin = (
  nk: RuntimeNakama,
  logger: RuntimeLogger,
  params: {
    userId: string;
    matchId: string;
    source?: XpSource;
  }
): ProgressionAwardResponse => {
  const source = params.source ?? "pvp_win";

  return buildMatchWinAwardResponse(
    awardXp(nk, logger, {
      userId: params.userId,
      ledgerKey: `${source}:${params.matchId}`,
      source,
      sourceId: params.matchId,
      matchId: params.matchId,
      awardedXp: getXpAwardAmount(source),
    }) as XpRewardResult & { source: XpSource }
  );
};

export const awardXpForTournamentChampion = (
  nk: RuntimeNakama,
  logger: RuntimeLogger,
  params: {
    userId: string;
    runId: string;
  }
): XpRewardResult & { source: "tournament_champion" } => {
  const runId = params.runId?.trim();

  if (!runId) {
    throw new Error("Cannot award tournament champion XP without a run ID.");
  }

  return awardXp(nk, logger, {
    userId: params.userId,
    ledgerKey: `tournament_champion:${runId}`,
    source: "tournament_champion",
    sourceId: runId,
    awardedXp: getXpAwardAmount("tournament_champion"),
  }) as XpRewardResult & { source: "tournament_champion" };
};

export const createProgressionAwardNotification = (
  response: ProgressionAwardResponse
): ProgressionAwardNotificationPayload => ({
  type: "progression_award",
  ...response,
});

const rpcGetXpProgress = (
  ctx: RuntimeContext,
  logger: RuntimeLogger,
  nk: RuntimeNakama,
  _payload: string
): string => {
  if (!ctx.userId) {
    throw new Error("Authentication required.");
  }

  return JSON.stringify(getProgressionForUser(nk, logger, ctx.userId));
};

export const rpcGetProgression = rpcGetXpProgress;
export const rpcGetUserXpProgress = rpcGetXpProgress;
