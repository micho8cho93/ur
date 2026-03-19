import {
  buildProgressionSnapshot,
  createDefaultProgressionProfile,
  getRankForXp,
  getXpAwardAmount,
  isProgressionAwardResponse,
  ProgressionAwardNotificationPayload,
  ProgressionAwardResponse,
  ProgressionProfile,
  ProgressionSnapshot,
  sanitizeTotalXp,
  XpSource,
} from "../../shared/progression";

type RuntimeContext = any;
type RuntimeLogger = any;
type RuntimeNakama = any;

type RuntimeRecord = Record<string, unknown>;
type RuntimeStorageObject = RuntimeRecord & {
  value?: unknown;
  version?: string;
};

type StoredAwardRecord = {
  userId: string;
  awardedAt: string;
  response: ProgressionAwardResponse;
};

const PROGRESSION_COLLECTION = "progression";
const PROGRESSION_PROFILE_KEY = "profile";
const PROGRESSION_AWARD_COLLECTION = "progression_awards";

const STORAGE_PERMISSION_NONE = 0;
const MAX_WRITE_ATTEMPTS = 4;

export const RPC_GET_PROGRESSION = "get_progression";

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

const getStorageObjectValue = (object: RuntimeStorageObject | null): unknown => object?.value ?? null;

const getStorageObjectVersion = (object: RuntimeStorageObject | null): string | null =>
  readStringField(object, ["version"]);

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

const buildAwardRecordKey = (matchId: string, source: XpSource): string => `${source}:${matchId}`;

const normalizeProgressionProfile = (
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

const normalizeStoredAwardRecord = (rawValue: unknown): StoredAwardRecord | null => {
  const record = asRecord(rawValue);
  if (!record) {
    return null;
  }

  const userId = readStringField(record, ["userId", "user_id"]);
  const awardedAt = readStringField(record, ["awardedAt", "awarded_at"]);
  const response = (record.response ?? null) as unknown;

  if (!userId || !awardedAt || !isProgressionAwardResponse(response)) {
    return null;
  }

  return {
    userId,
    awardedAt,
    response,
  };
};

const findStorageObject = (
  objects: RuntimeStorageObject[],
  collection: string,
  key: string,
  userId: string
): RuntimeStorageObject | null =>
  objects.find((object) => {
    const collectionName = readStringField(object, ["collection"]);
    const objectKey = readStringField(object, ["key"]);
    const objectUserId = readStringField(object, ["userId", "user_id"]);

    return collectionName === collection && objectKey === key && objectUserId === userId;
  }) ?? null;

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

const readProgressionProfileAndAward = (
  nk: RuntimeNakama,
  userId: string,
  matchId: string,
  source: XpSource
): { profileObject: RuntimeStorageObject | null; awardObject: RuntimeStorageObject | null } => {
  const awardKey = buildAwardRecordKey(matchId, source);
  const objects = nk.storageRead([
    {
      collection: PROGRESSION_COLLECTION,
      key: PROGRESSION_PROFILE_KEY,
      userId,
    },
    {
      collection: PROGRESSION_AWARD_COLLECTION,
      key: awardKey,
      userId,
    },
  ]) as RuntimeStorageObject[];

  return {
    profileObject: findStorageObject(objects, PROGRESSION_COLLECTION, PROGRESSION_PROFILE_KEY, userId),
    awardObject: findStorageObject(objects, PROGRESSION_AWARD_COLLECTION, awardKey, userId),
  };
};

const writeProgressionProfile = (
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

const buildDuplicateAwardResponse = (
  storedAwardObject: RuntimeStorageObject,
  fallbackProgression: ProgressionSnapshot,
  matchId: string,
  source: XpSource
): ProgressionAwardResponse => {
  const normalizedRecord = normalizeStoredAwardRecord(getStorageObjectValue(storedAwardObject));
  if (normalizedRecord) {
    return {
      ...normalizedRecord.response,
      duplicate: true,
    };
  }

  return {
    matchId,
    source,
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

export const awardXpForMatchWin = (
  nk: RuntimeNakama,
  logger: RuntimeLogger,
  params: {
    userId: string;
    matchId: string;
    source?: XpSource;
  }
): ProgressionAwardResponse => {
  const userId = params.userId?.trim();
  const matchId = params.matchId?.trim();
  const source = params.source ?? "pvp_win";

  if (!userId) {
    throw new Error("Cannot award progression without a user ID.");
  }

  if (!matchId) {
    throw new Error("Cannot award progression without a match ID.");
  }

  const awardedXp = sanitizeTotalXp(getXpAwardAmount(source));
  if (awardedXp <= 0) {
    throw new Error(`Configured XP award for source "${source}" must be positive.`);
  }

  for (let attempt = 1; attempt <= MAX_WRITE_ATTEMPTS; attempt += 1) {
    const now = new Date().toISOString();
    const { profileObject, awardObject } = readProgressionProfileAndAward(nk, userId, matchId, source);
    const currentProfile = profileObject
      ? normalizeProgressionProfile(getStorageObjectValue(profileObject), now)
      : createDefaultProgressionProfile(0, now);
    const currentSnapshot = buildProgressionSnapshot(currentProfile.totalXp);

    if (awardObject) {
      return buildDuplicateAwardResponse(awardObject, currentSnapshot, matchId, source);
    }

    const previousTotalXp = currentProfile.totalXp;
    const newTotalXp = sanitizeTotalXp(previousTotalXp + awardedXp);
    const previousRank = getRankForXp(previousTotalXp).title;
    const newRank = getRankForXp(newTotalXp).title;

    const response: ProgressionAwardResponse = {
      matchId,
      source,
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

    const awardRecord: StoredAwardRecord = {
      userId,
      awardedAt: now,
      response,
    };

    try {
      // Keep the XP increment and the "match already processed" marker in the same
      // Nakama storage transaction so retries cannot double-award the same win.
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
          collection: PROGRESSION_AWARD_COLLECTION,
          key: buildAwardRecordKey(matchId, source),
          userId,
          value: awardRecord,
          version: "*",
          permissionRead: STORAGE_PERMISSION_NONE,
          permissionWrite: STORAGE_PERMISSION_NONE,
        },
      ]);

      logger.info(
        "Awarded %d XP to user %s for %s on match %s (total=%d).",
        awardedXp,
        userId,
        source,
        matchId,
        newTotalXp
      );

      return response;
    } catch (error) {
      const refreshed = readProgressionProfileAndAward(nk, userId, matchId, source);
      if (refreshed.awardObject) {
        return buildDuplicateAwardResponse(
          refreshed.awardObject,
          buildProgressionSnapshot(
            normalizeProgressionProfile(getStorageObjectValue(refreshed.profileObject), now).totalXp
          ),
          matchId,
          source
        );
      }

      logger.warn(
        "Award write attempt %d/%d failed for user %s on match %s: %s",
        attempt,
        MAX_WRITE_ATTEMPTS,
        userId,
        matchId,
        getErrorMessage(error)
      );
    }
  }

  throw new Error(`Unable to persist progression award for user ${userId} on match ${matchId}.`);
};

export const createProgressionAwardNotification = (
  response: ProgressionAwardResponse
): ProgressionAwardNotificationPayload => ({
  type: "progression_award",
  ...response,
});

export const rpcGetProgression = (
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
