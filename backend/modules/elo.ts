import {
  ELO_LEADERBOARD_ID,
  EloLeaderboardAroundMeRpcResponse,
  EloLeaderboardEntry,
  EloLeaderboardRpcRequest,
  EloLeaderboardRpcResponse,
  EloMatchParticipantRatingView,
  EloProfile,
  EloRatingChangeNotificationPayload,
  EloRatingProfileRpcResponse,
  computeEloRatingUpdate,
  createDefaultEloProfile,
  sanitizeEloRating,
  sanitizeRatedGameCount,
} from "../../shared/elo";
import {
  MAX_WRITE_ATTEMPTS,
  RuntimeStorageObject,
  STORAGE_PERMISSION_NONE,
  asRecord,
  findStorageObject,
  getErrorMessage,
  getStorageObjectValue,
  getStorageObjectVersion,
} from "./progression";
import { getUsernameOnboardingProfile } from "./usernameOnboarding";

type RuntimeContext = any;
type RuntimeLogger = any;
type RuntimeNakama = any;

const SYSTEM_USER_ID = "00000000-0000-0000-0000-000000000000";
const ELO_PROFILE_COLLECTION = "elo_profiles";
const ELO_PROFILE_KEY = "profile";
const ELO_MATCH_RESULT_COLLECTION = "elo_match_results";
const DEFAULT_LEADERBOARD_PAGE_SIZE = 25;
const MAX_LEADERBOARD_PAGE_SIZE = 100;
const DEFAULT_HAYSTACK_SIZE = 11;

export const RPC_GET_MY_RATING_PROFILE = "get_my_rating_profile";
export const RPC_LIST_TOP_ELO_PLAYERS = "list_top_elo_players";
export const RPC_GET_ELO_LEADERBOARD_AROUND_ME = "get_elo_leaderboard_around_me";

type LeaderboardRecordLike = Record<string, unknown>;

type StoredEloMatchParticipantResult = {
  userId: string;
  usernameDisplay: string;
  oldRating: number;
  newRating: number;
  delta: number;
  ratedGames: number;
  ratedWins: number;
  ratedLosses: number;
  provisional: boolean;
  lastRatedMatchId: string;
  lastRatedAt: string;
};

type StoredEloMatchResultRecord = {
  matchId: string;
  leaderboardId: string;
  processedAt: string;
  winnerUserId: string;
  loserUserId: string;
  playerResults: StoredEloMatchParticipantResult[];
};

type ProcessRankedMatchResultParams = {
  matchId: string;
  winnerUserId: string;
  loserUserId: string;
  ranked: boolean;
  privateMatch: boolean;
  botMatch: boolean;
  casualMatch: boolean;
  experimentalMode: boolean;
};

type ProcessRankedMatchResult = {
  duplicate: boolean;
  record: StoredEloMatchResultRecord;
  leaderboardId: string;
  matchId: string;
  playerResults: StoredEloMatchParticipantResult[];
  ranksByUserId: Record<string, number | null>;
};

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

const readBooleanField = (value: unknown, keys: string[]): boolean | null => {
  const record = asRecord(value);
  if (!record) {
    return null;
  }

  for (const key of keys) {
    const field = record[key];
    if (typeof field === "boolean") {
      return field;
    }
  }

  return null;
};

const getRequiredUsernameDisplay = (nk: RuntimeNakama, userId: string): string => {
  const profile = getUsernameOnboardingProfile(nk, userId);

  if (!profile.onboardingComplete || !profile.usernameDisplay) {
    throw new Error("Choose a username before accessing multiplayer or social features.");
  }

  return profile.usernameDisplay;
};

const normalizeEloProfile = (
  rawValue: unknown,
  userId: string,
  usernameDisplay: string,
  fallbackTimestamp = new Date().toISOString(),
): EloProfile => {
  const defaults = createDefaultEloProfile(userId, usernameDisplay, fallbackTimestamp);
  const eloRating = sanitizeEloRating(readNumberField(rawValue, ["eloRating", "elo_rating"]) ?? defaults.eloRating);
  const ratedGames = sanitizeRatedGameCount(
    readNumberField(rawValue, ["ratedGames", "rated_games"]) ?? defaults.ratedGames,
  );
  const ratedWins = Math.min(
    ratedGames,
    sanitizeRatedGameCount(readNumberField(rawValue, ["ratedWins", "rated_wins"]) ?? defaults.ratedWins),
  );
  const ratedLosses = Math.min(
    ratedGames,
    sanitizeRatedGameCount(readNumberField(rawValue, ["ratedLosses", "rated_losses"]) ?? defaults.ratedLosses),
  );
  const createdAt = readStringField(rawValue, ["createdAt", "created_at"]) ?? defaults.createdAt;
  const updatedAt = readStringField(rawValue, ["updatedAt", "updated_at"]) ?? fallbackTimestamp;
  const lastRatedMatchId = readStringField(rawValue, ["lastRatedMatchId", "last_rated_match_id"]);
  const lastRatedAt = readStringField(rawValue, ["lastRatedAt", "last_rated_at"]);
  const sanitizedLosses = Math.min(ratedGames - ratedWins, ratedLosses);

  return {
    userId,
    usernameDisplay,
    eloRating,
    ratedGames,
    ratedWins,
    ratedLosses: sanitizedLosses,
    provisional: ratedGames < 10,
    lastRatedMatchId: lastRatedMatchId ?? null,
    lastRatedAt: lastRatedAt ?? null,
    createdAt,
    updatedAt,
  };
};

const normalizeStoredEloProfile = (rawValue: unknown, userId: string): EloProfile | null => {
  const usernameDisplay = readStringField(rawValue, ["usernameDisplay", "username_display"]);
  if (!usernameDisplay) {
    return null;
  }

  return normalizeEloProfile(rawValue, userId, usernameDisplay);
};

const eloProfileNeedsRepair = (rawValue: unknown, normalized: EloProfile): boolean => {
  const rawRecord = asRecord(rawValue);
  if (!rawRecord) {
    return true;
  }

  return (
    readStringField(rawRecord, ["userId", "user_id"]) !== normalized.userId ||
    readStringField(rawRecord, ["usernameDisplay", "username_display"]) !== normalized.usernameDisplay ||
    sanitizeEloRating(readNumberField(rawRecord, ["eloRating", "elo_rating"]) ?? normalized.eloRating) !==
      normalized.eloRating ||
    sanitizeRatedGameCount(readNumberField(rawRecord, ["ratedGames", "rated_games"]) ?? normalized.ratedGames) !==
      normalized.ratedGames ||
    sanitizeRatedGameCount(readNumberField(rawRecord, ["ratedWins", "rated_wins"]) ?? normalized.ratedWins) !==
      normalized.ratedWins ||
    sanitizeRatedGameCount(readNumberField(rawRecord, ["ratedLosses", "rated_losses"]) ?? normalized.ratedLosses) !==
      normalized.ratedLosses ||
    readBooleanField(rawRecord, ["provisional"]) !== normalized.provisional ||
    (readStringField(rawRecord, ["lastRatedMatchId", "last_rated_match_id"]) ?? null) !== normalized.lastRatedMatchId ||
    (readStringField(rawRecord, ["lastRatedAt", "last_rated_at"]) ?? null) !== normalized.lastRatedAt ||
    readStringField(rawRecord, ["createdAt", "created_at"]) !== normalized.createdAt ||
    readStringField(rawRecord, ["updatedAt", "updated_at"]) !== normalized.updatedAt
  );
};

const writeEloProfile = (
  nk: RuntimeNakama,
  userId: string,
  profile: EloProfile,
  version: string,
): void => {
  nk.storageWrite([
    {
      collection: ELO_PROFILE_COLLECTION,
      key: ELO_PROFILE_KEY,
      userId,
      value: profile,
      version,
      permissionRead: STORAGE_PERMISSION_NONE,
      permissionWrite: STORAGE_PERMISSION_NONE,
    },
  ]);
};

const readEloProfileObject = (nk: RuntimeNakama, userId: string): RuntimeStorageObject | null => {
  const objects = nk.storageRead([
    {
      collection: ELO_PROFILE_COLLECTION,
      key: ELO_PROFILE_KEY,
      userId,
    },
  ]) as RuntimeStorageObject[];

  return findStorageObject(objects, ELO_PROFILE_COLLECTION, ELO_PROFILE_KEY, userId);
};

const ensureEloProfileObject = (
  nk: RuntimeNakama,
  logger: RuntimeLogger,
  userId: string,
): { object: RuntimeStorageObject | null; profile: EloProfile } => {
  const usernameDisplay = getRequiredUsernameDisplay(nk, userId);

  for (let attempt = 1; attempt <= MAX_WRITE_ATTEMPTS; attempt += 1) {
    const existingObject = readEloProfileObject(nk, userId);

    if (existingObject) {
      const normalized = normalizeEloProfile(getStorageObjectValue(existingObject), userId, usernameDisplay);
      if (!eloProfileNeedsRepair(getStorageObjectValue(existingObject), normalized)) {
        return {
          object: existingObject,
          profile: normalized,
        };
      }

      try {
        writeEloProfile(nk, userId, normalized, getStorageObjectVersion(existingObject) ?? "");
        return {
          object: readEloProfileObject(nk, userId),
          profile: normalized,
        };
      } catch (error) {
        logger.warn(
          "Elo profile repair attempt %d/%d failed for user %s: %s",
          attempt,
          MAX_WRITE_ATTEMPTS,
          userId,
          getErrorMessage(error),
        );
      }

      continue;
    }

    const nextProfile = createDefaultEloProfile(userId, usernameDisplay);

    try {
      writeEloProfile(nk, userId, nextProfile, "*");
      return {
        object: readEloProfileObject(nk, userId),
        profile: nextProfile,
      };
    } catch (error) {
      logger.warn(
        "Elo profile init attempt %d/%d failed for user %s: %s",
        attempt,
        MAX_WRITE_ATTEMPTS,
        userId,
        getErrorMessage(error),
      );
    }
  }

  throw new Error(`Unable to initialize Elo rating profile for user ${userId}.`);
};

const buildEloLeaderboardMetadata = (profile: EloProfile): Record<string, unknown> => ({
  usernameDisplay: profile.usernameDisplay,
  ratedGames: profile.ratedGames,
  ratedWins: profile.ratedWins,
  ratedLosses: profile.ratedLosses,
  provisional: profile.provisional,
});

const buildLeaderboardEntryFromProfile = (profile: EloProfile, rank: number | null): EloLeaderboardEntry => ({
  userId: profile.userId,
  usernameDisplay: profile.usernameDisplay,
  eloRating: profile.eloRating,
  ratedGames: profile.ratedGames,
  ratedWins: profile.ratedWins,
  ratedLosses: profile.ratedLosses,
  provisional: profile.provisional,
  rank,
});

export const getEloRatingProfileForUser = (
  nk: RuntimeNakama,
  logger: RuntimeLogger,
  userId: string,
): EloRatingProfileRpcResponse => {
  const profileState = ensureEloProfileObject(nk, logger, userId);
  const rank = syncEloLeaderboardRecords(nk, logger, [profileState.profile])[userId] ?? null;

  return {
    leaderboardId: ELO_LEADERBOARD_ID,
    ...buildLeaderboardEntryFromProfile(profileState.profile, rank),
    lastRatedMatchId: profileState.profile.lastRatedMatchId,
    lastRatedAt: profileState.profile.lastRatedAt,
  };
};

const getLeaderboardRecordRank = (record: unknown): number | null => {
  const rank = readNumberField(record, ["rank"]);
  return typeof rank === "number" ? rank : null;
};

const getLeaderboardRecordOwnerId = (record: unknown): string | null =>
  readStringField(record, ["ownerId", "owner_id"]);

const getLeaderboardRecordScore = (record: unknown): number | null =>
  readNumberField(record, ["score"]);

const getLeaderboardRecordMetadata = (record: unknown): Record<string, unknown> | null => {
  const data = asRecord(record);
  return asRecord(data?.metadata);
};

const getLeaderboardRecordUsername = (record: unknown): string | null =>
  readStringField(record, ["username"]);

const syncEloLeaderboardRecord = (
  nk: RuntimeNakama,
  logger: RuntimeLogger,
  profile: EloProfile,
): number | null => {
  try {
    const record = nk.leaderboardRecordWrite(
      ELO_LEADERBOARD_ID,
      profile.userId,
      profile.usernameDisplay,
      profile.eloRating,
      profile.ratedWins,
      buildEloLeaderboardMetadata(profile),
    );

    return getLeaderboardRecordRank(record);
  } catch (error) {
    logger.error(
      "Failed to write Elo leaderboard record for user %s: %s",
      profile.userId,
      getErrorMessage(error),
    );
    return null;
  }
};

const syncEloLeaderboardRecords = (
  nk: RuntimeNakama,
  logger: RuntimeLogger,
  profiles: EloProfile[],
): Record<string, number | null> =>
  profiles.reduce(
    (entries, profile) => {
      entries[profile.userId] = syncEloLeaderboardRecord(nk, logger, profile);
      return entries;
    },
    {} as Record<string, number | null>,
  );

const readOwnerLeaderboardRecord = (nk: RuntimeNakama, userId: string): LeaderboardRecordLike | null => {
  const result = nk.leaderboardRecordsList(ELO_LEADERBOARD_ID, [userId], 1, "", 0) as Record<string, unknown>;
  const ownerRecords = Array.isArray(result.ownerRecords)
    ? result.ownerRecords
    : Array.isArray(result.owner_records)
      ? result.owner_records
      : [];

  return ownerRecords.length > 0 ? (ownerRecords[0] as LeaderboardRecordLike) : null;
};

const clampLimit = (value: unknown, fallback: number): number => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }

  return Math.max(1, Math.min(MAX_LEADERBOARD_PAGE_SIZE, Math.floor(value)));
};

const parseLeaderboardRequest = (payload: string): EloLeaderboardRpcRequest => {
  if (!payload) {
    return {};
  }

  const data = asRecord(JSON.parse(payload));
  return {
    limit: typeof data?.limit === "number" ? data.limit : null,
    cursor: typeof data?.cursor === "string" ? data.cursor : null,
  };
};

const parseAroundMeRequest = (payload: string): { limit?: number | null } => {
  if (!payload) {
    return {};
  }

  const data = asRecord(JSON.parse(payload));
  return {
    limit: typeof data?.limit === "number" ? data.limit : null,
  };
};

const normalizeStoredEloMatchParticipantResult = (value: unknown): StoredEloMatchParticipantResult | null => {
  const userId = readStringField(value, ["userId", "user_id"]);
  const usernameDisplay = readStringField(value, ["usernameDisplay", "username_display"]);
  const oldRating = readNumberField(value, ["oldRating", "old_rating"]);
  const newRating = readNumberField(value, ["newRating", "new_rating"]);
  const delta = readNumberField(value, ["delta"]);
  const ratedGames = readNumberField(value, ["ratedGames", "rated_games"]);
  const ratedWins = readNumberField(value, ["ratedWins", "rated_wins"]);
  const ratedLosses = readNumberField(value, ["ratedLosses", "rated_losses"]);
  const provisional = readBooleanField(value, ["provisional"]);
  const lastRatedMatchId = readStringField(value, ["lastRatedMatchId", "last_rated_match_id"]);
  const lastRatedAt = readStringField(value, ["lastRatedAt", "last_rated_at"]);

  if (
    !userId ||
    !usernameDisplay ||
    oldRating === null ||
    newRating === null ||
    delta === null ||
    ratedGames === null ||
    ratedWins === null ||
    ratedLosses === null ||
    provisional === null ||
    !lastRatedMatchId ||
    !lastRatedAt
  ) {
    return null;
  }

  return {
    userId,
    usernameDisplay,
    oldRating: sanitizeEloRating(oldRating),
    newRating: sanitizeEloRating(newRating),
    delta: sanitizeEloRating(delta),
    ratedGames: sanitizeRatedGameCount(ratedGames),
    ratedWins: sanitizeRatedGameCount(ratedWins),
    ratedLosses: sanitizeRatedGameCount(ratedLosses),
    provisional,
    lastRatedMatchId,
    lastRatedAt,
  };
};

const normalizeStoredEloMatchResultRecord = (value: unknown): StoredEloMatchResultRecord | null => {
  const record = asRecord(value);
  if (!record) {
    return null;
  }

  const matchId = readStringField(record, ["matchId", "match_id"]);
  const leaderboardId = readStringField(record, ["leaderboardId", "leaderboard_id"]);
  const processedAt = readStringField(record, ["processedAt", "processed_at"]);
  const winnerUserId = readStringField(record, ["winnerUserId", "winner_user_id"]);
  const loserUserId = readStringField(record, ["loserUserId", "loser_user_id"]);
  const rawPlayerResults = Array.isArray(record.playerResults)
    ? record.playerResults
    : Array.isArray(record.player_results)
      ? record.player_results
      : [];
  const playerResults = rawPlayerResults
    .map((playerResult) => normalizeStoredEloMatchParticipantResult(playerResult))
    .filter((playerResult): playerResult is StoredEloMatchParticipantResult => Boolean(playerResult));

  if (!matchId || !leaderboardId || !processedAt || !winnerUserId || !loserUserId || playerResults.length !== 2) {
    return null;
  }

  return {
    matchId,
    leaderboardId,
    processedAt,
    winnerUserId,
    loserUserId,
    playerResults,
  };
};

const readProcessedMatchResultObject = (nk: RuntimeNakama, matchId: string): RuntimeStorageObject | null => {
  const objects = nk.storageRead([
    {
      collection: ELO_MATCH_RESULT_COLLECTION,
      key: matchId,
      userId: SYSTEM_USER_ID,
    },
  ]) as RuntimeStorageObject[];

  return findStorageObject(objects, ELO_MATCH_RESULT_COLLECTION, matchId, SYSTEM_USER_ID);
};

const getProcessedMatchPlayerResult = (
  result: StoredEloMatchResultRecord,
  userId: string,
): StoredEloMatchParticipantResult | null =>
  result.playerResults.find((playerResult) => playerResult.userId === userId) ?? null;

const createMatchParticipantView = (
  playerResult: StoredEloMatchParticipantResult,
  rank: number | null,
): EloMatchParticipantRatingView => ({
  userId: playerResult.userId,
  usernameDisplay: playerResult.usernameDisplay,
  oldRating: playerResult.oldRating,
  newRating: playerResult.newRating,
  delta: playerResult.delta,
  ratedGames: playerResult.ratedGames,
  ratedWins: playerResult.ratedWins,
  ratedLosses: playerResult.ratedLosses,
  provisional: playerResult.provisional,
  rank,
});

export const createEloRatingChangeNotification = (
  result: StoredEloMatchResultRecord,
  userId: string,
  ranksByUserId: Record<string, number | null>,
  duplicate = false,
): EloRatingChangeNotificationPayload => {
  const playerResult = getProcessedMatchPlayerResult(result, userId);
  if (!playerResult) {
    throw new Error(`Unable to build Elo notification for missing player ${userId} on match ${result.matchId}.`);
  }

  const opponentResult = result.playerResults.find((entry) => entry.userId !== userId);
  if (!opponentResult) {
    throw new Error(`Unable to build Elo notification without opponent result on match ${result.matchId}.`);
  }

  return {
    type: "elo_rating_update",
    leaderboardId: result.leaderboardId,
    matchId: result.matchId,
    duplicate,
    player: createMatchParticipantView(playerResult, ranksByUserId[playerResult.userId] ?? null),
    opponent: createMatchParticipantView(opponentResult, ranksByUserId[opponentResult.userId] ?? null),
  };
};

const syncLeaderboardFromProcessedMatch = (
  nk: RuntimeNakama,
  logger: RuntimeLogger,
  result: StoredEloMatchResultRecord,
): Record<string, number | null> =>
  syncEloLeaderboardRecords(
    nk,
    logger,
    result.playerResults.map((playerResult) => ({
      userId: playerResult.userId,
      usernameDisplay: playerResult.usernameDisplay,
      eloRating: playerResult.newRating,
      ratedGames: playerResult.ratedGames,
      ratedWins: playerResult.ratedWins,
      ratedLosses: playerResult.ratedLosses,
      provisional: playerResult.provisional,
      lastRatedMatchId: playerResult.lastRatedMatchId,
      lastRatedAt: playerResult.lastRatedAt,
      createdAt: playerResult.lastRatedAt,
      updatedAt: playerResult.lastRatedAt,
    })),
  );

export const ensureEloLeaderboard = (nk: RuntimeNakama, logger: RuntimeLogger): void => {
  try {
    nk.leaderboardCreate(
      ELO_LEADERBOARD_ID,
      true,
      "desc",
      "set",
      "",
      {
        ratingSystem: "elo",
        scope: "global",
        version: 1,
      },
      true,
    );
  } catch (error) {
    logger.warn("Unable to ensure Elo leaderboard exists: %s", getErrorMessage(error));
  }
};

export const processRankedMatchResult = (
  nk: RuntimeNakama,
  logger: RuntimeLogger,
  params: ProcessRankedMatchResultParams,
): ProcessRankedMatchResult | null => {
  if (!params.ranked || params.botMatch || params.casualMatch || params.experimentalMode) {
    return null;
  }

  const matchId = params.matchId.trim();
  const winnerUserId = params.winnerUserId.trim();
  const loserUserId = params.loserUserId.trim();

  if (!matchId || !winnerUserId || !loserUserId) {
    throw new Error("Ranked Elo processing requires non-empty match and player IDs.");
  }

  if (winnerUserId === loserUserId) {
    throw new Error("Ranked Elo processing requires distinct winner and loser users.");
  }

  for (let attempt = 1; attempt <= MAX_WRITE_ATTEMPTS; attempt += 1) {
    const existingProcessedObject = readProcessedMatchResultObject(nk, matchId);
    const existingProcessed = normalizeStoredEloMatchResultRecord(getStorageObjectValue(existingProcessedObject));
    if (existingProcessed) {
      return {
        duplicate: true,
        record: existingProcessed,
        leaderboardId: existingProcessed.leaderboardId,
        matchId: existingProcessed.matchId,
        playerResults: existingProcessed.playerResults,
        ranksByUserId: syncLeaderboardFromProcessedMatch(nk, logger, existingProcessed),
      };
    }

    const winnerProfileState = ensureEloProfileObject(nk, logger, winnerUserId);
    const loserProfileState = ensureEloProfileObject(nk, logger, loserUserId);
    const now = new Date().toISOString();
    const computation = computeEloRatingUpdate({
      playerARating: winnerProfileState.profile.eloRating,
      playerBRating: loserProfileState.profile.eloRating,
      playerAOutcome: "win",
      playerARatedGames: winnerProfileState.profile.ratedGames,
      playerBRatedGames: loserProfileState.profile.ratedGames,
      playerARatedWins: winnerProfileState.profile.ratedWins,
      playerARatedLosses: winnerProfileState.profile.ratedLosses,
      playerBRatedWins: loserProfileState.profile.ratedWins,
      playerBRatedLosses: loserProfileState.profile.ratedLosses,
    });

    const nextWinnerProfile: EloProfile = {
      ...winnerProfileState.profile,
      eloRating: computation.playerA.newRating,
      ratedGames: computation.playerA.ratedGames,
      ratedWins: computation.playerA.ratedWins,
      ratedLosses: computation.playerA.ratedLosses,
      provisional: computation.playerA.provisional,
      lastRatedMatchId: matchId,
      lastRatedAt: now,
      updatedAt: now,
    };
    const nextLoserProfile: EloProfile = {
      ...loserProfileState.profile,
      eloRating: computation.playerB.newRating,
      ratedGames: computation.playerB.ratedGames,
      ratedWins: computation.playerB.ratedWins,
      ratedLosses: computation.playerB.ratedLosses,
      provisional: computation.playerB.provisional,
      lastRatedMatchId: matchId,
      lastRatedAt: now,
      updatedAt: now,
    };

    const processedRecord: StoredEloMatchResultRecord = {
      matchId,
      leaderboardId: ELO_LEADERBOARD_ID,
      processedAt: now,
      winnerUserId,
      loserUserId,
      playerResults: [
        {
          userId: nextWinnerProfile.userId,
          usernameDisplay: nextWinnerProfile.usernameDisplay,
          oldRating: winnerProfileState.profile.eloRating,
          newRating: nextWinnerProfile.eloRating,
          delta: nextWinnerProfile.eloRating - winnerProfileState.profile.eloRating,
          ratedGames: nextWinnerProfile.ratedGames,
          ratedWins: nextWinnerProfile.ratedWins,
          ratedLosses: nextWinnerProfile.ratedLosses,
          provisional: nextWinnerProfile.provisional,
          lastRatedMatchId: matchId,
          lastRatedAt: now,
        },
        {
          userId: nextLoserProfile.userId,
          usernameDisplay: nextLoserProfile.usernameDisplay,
          oldRating: loserProfileState.profile.eloRating,
          newRating: nextLoserProfile.eloRating,
          delta: nextLoserProfile.eloRating - loserProfileState.profile.eloRating,
          ratedGames: nextLoserProfile.ratedGames,
          ratedWins: nextLoserProfile.ratedWins,
          ratedLosses: nextLoserProfile.ratedLosses,
          provisional: nextLoserProfile.provisional,
          lastRatedMatchId: matchId,
          lastRatedAt: now,
        },
      ],
    };

    try {
      nk.storageWrite([
        {
          collection: ELO_PROFILE_COLLECTION,
          key: ELO_PROFILE_KEY,
          userId: nextWinnerProfile.userId,
          value: nextWinnerProfile,
          version: winnerProfileState.object ? (getStorageObjectVersion(winnerProfileState.object) ?? "") : "*",
          permissionRead: STORAGE_PERMISSION_NONE,
          permissionWrite: STORAGE_PERMISSION_NONE,
        },
        {
          collection: ELO_PROFILE_COLLECTION,
          key: ELO_PROFILE_KEY,
          userId: nextLoserProfile.userId,
          value: nextLoserProfile,
          version: loserProfileState.object ? (getStorageObjectVersion(loserProfileState.object) ?? "") : "*",
          permissionRead: STORAGE_PERMISSION_NONE,
          permissionWrite: STORAGE_PERMISSION_NONE,
        },
        {
          collection: ELO_MATCH_RESULT_COLLECTION,
          key: matchId,
          userId: SYSTEM_USER_ID,
          value: processedRecord,
          version: "*",
          permissionRead: STORAGE_PERMISSION_NONE,
          permissionWrite: STORAGE_PERMISSION_NONE,
        },
      ]);

      logger.info(
        "Processed ranked Elo result for match %s (%s beat %s).",
        matchId,
        winnerUserId,
        loserUserId,
      );

      return {
        duplicate: false,
        record: processedRecord,
        leaderboardId: ELO_LEADERBOARD_ID,
        matchId,
        playerResults: processedRecord.playerResults,
        ranksByUserId: syncEloLeaderboardRecords(nk, logger, [nextWinnerProfile, nextLoserProfile]),
      };
    } catch (error) {
      const refreshedProcessedObject = readProcessedMatchResultObject(nk, matchId);
      const refreshedProcessed = normalizeStoredEloMatchResultRecord(getStorageObjectValue(refreshedProcessedObject));
      if (refreshedProcessed) {
        return {
          duplicate: true,
          record: refreshedProcessed,
          leaderboardId: refreshedProcessed.leaderboardId,
          matchId: refreshedProcessed.matchId,
          playerResults: refreshedProcessed.playerResults,
          ranksByUserId: syncLeaderboardFromProcessedMatch(nk, logger, refreshedProcessed),
        };
      }

      logger.warn(
        "Ranked Elo processing attempt %d/%d failed for match %s: %s",
        attempt,
        MAX_WRITE_ATTEMPTS,
        matchId,
        getErrorMessage(error),
      );
    }
  }

  throw new Error(`Unable to process ranked Elo result for match ${matchId}.`);
};

const readEloProfilesByUserId = (
  nk: RuntimeNakama,
  userIds: string[],
): Record<string, EloProfile> => {
  if (userIds.length === 0) {
    return {};
  }

  const objects = nk.storageRead(
    userIds.map((userId) => ({
      collection: ELO_PROFILE_COLLECTION,
      key: ELO_PROFILE_KEY,
      userId,
    })),
  ) as RuntimeStorageObject[];

  return userIds.reduce(
    (entries, userId) => {
      const object = findStorageObject(objects, ELO_PROFILE_COLLECTION, ELO_PROFILE_KEY, userId);
      const profile = normalizeStoredEloProfile(getStorageObjectValue(object), userId);
      if (profile) {
        entries[userId] = profile;
      }
      return entries;
    },
    {} as Record<string, EloProfile>,
  );
};

const buildLeaderboardEntryFromRecord = (
  record: LeaderboardRecordLike,
  profile: EloProfile | null,
): EloLeaderboardEntry | null => {
  const userId = getLeaderboardRecordOwnerId(record);
  if (!userId) {
    return null;
  }

  if (profile) {
    return buildLeaderboardEntryFromProfile(profile, getLeaderboardRecordRank(record));
  }

  const metadata = getLeaderboardRecordMetadata(record);
  const usernameDisplay =
    readStringField(metadata, ["usernameDisplay", "username_display"]) ??
    getLeaderboardRecordUsername(record) ??
    "Unknown";
  const ratedGames = sanitizeRatedGameCount(readNumberField(metadata, ["ratedGames", "rated_games"]) ?? 0);
  const ratedWins = sanitizeRatedGameCount(readNumberField(metadata, ["ratedWins", "rated_wins"]) ?? 0);
  const ratedLosses = sanitizeRatedGameCount(readNumberField(metadata, ["ratedLosses", "rated_losses"]) ?? 0);
  const provisional = readBooleanField(metadata, ["provisional"]);

  return {
    userId,
    usernameDisplay,
    eloRating: sanitizeEloRating(getLeaderboardRecordScore(record) ?? 1200),
    ratedGames,
    ratedWins,
    ratedLosses,
    provisional: typeof provisional === "boolean" ? provisional : ratedGames < 10,
    rank: getLeaderboardRecordRank(record),
  };
};

const normalizeLeaderboardListResponse = (
  result: unknown,
): { records: LeaderboardRecordLike[]; nextCursor: string | null; prevCursor: string | null } => {
  const response = asRecord(result);
  const records = Array.isArray(response?.records) ? (response.records as LeaderboardRecordLike[]) : [];
  const nextCursor = readStringField(response, ["nextCursor", "next_cursor"]);
  const prevCursor = readStringField(response, ["prevCursor", "prev_cursor"]);

  return {
    records,
    nextCursor: nextCursor ?? null,
    prevCursor: prevCursor ?? null,
  };
};

const requireLeaderboardAccess = (nk: RuntimeNakama, userId: string): void => {
  getRequiredUsernameDisplay(nk, userId);
};

export const rpcGetMyRatingProfile = (
  ctx: RuntimeContext,
  logger: RuntimeLogger,
  nk: RuntimeNakama,
  _payload: string,
): string => {
  if (!ctx.userId) {
    throw new Error("Authentication required.");
  }

  requireLeaderboardAccess(nk, ctx.userId);
  const profileState = ensureEloProfileObject(nk, logger, ctx.userId);
  let ownerRecord = readOwnerLeaderboardRecord(nk, ctx.userId);
  let rank = getLeaderboardRecordRank(ownerRecord);

  if (!ownerRecord) {
    rank = syncEloLeaderboardRecord(nk, logger, profileState.profile);
    ownerRecord = readOwnerLeaderboardRecord(nk, ctx.userId);
    rank = rank ?? getLeaderboardRecordRank(ownerRecord);
  }

  const response: EloRatingProfileRpcResponse = {
    leaderboardId: ELO_LEADERBOARD_ID,
    ...buildLeaderboardEntryFromProfile(profileState.profile, rank),
    lastRatedMatchId: profileState.profile.lastRatedMatchId,
    lastRatedAt: profileState.profile.lastRatedAt,
  };

  return JSON.stringify(response);
};

export const rpcListTopEloPlayers = (
  ctx: RuntimeContext,
  _logger: RuntimeLogger,
  nk: RuntimeNakama,
  payload: string,
): string => {
  if (!ctx.userId) {
    throw new Error("Authentication required.");
  }

  requireLeaderboardAccess(nk, ctx.userId);
  const request = parseLeaderboardRequest(payload);
  const limit = clampLimit(request.limit, DEFAULT_LEADERBOARD_PAGE_SIZE);
  const cursor = typeof request.cursor === "string" ? request.cursor : "";
  const rawResult = nk.leaderboardRecordsList(ELO_LEADERBOARD_ID, [], limit, cursor, 0);
  const { records, nextCursor, prevCursor } = normalizeLeaderboardListResponse(rawResult);
  const profilesByUserId = readEloProfilesByUserId(
    nk,
    records
      .map((record) => getLeaderboardRecordOwnerId(record))
      .filter((ownerId): ownerId is string => Boolean(ownerId)),
  );

  const response: EloLeaderboardRpcResponse = {
    leaderboardId: ELO_LEADERBOARD_ID,
    records: records
      .map((record) => {
        const userId = getLeaderboardRecordOwnerId(record);
        return buildLeaderboardEntryFromRecord(record, userId ? (profilesByUserId[userId] ?? null) : null);
      })
      .filter((record): record is EloLeaderboardEntry => Boolean(record)),
    nextCursor,
    prevCursor,
  };

  return JSON.stringify(response);
};

export const rpcGetEloLeaderboardAroundMe = (
  ctx: RuntimeContext,
  logger: RuntimeLogger,
  nk: RuntimeNakama,
  payload: string,
): string => {
  if (!ctx.userId) {
    throw new Error("Authentication required.");
  }

  requireLeaderboardAccess(nk, ctx.userId);
  const request = parseAroundMeRequest(payload);
  const limit = clampLimit(request.limit, DEFAULT_HAYSTACK_SIZE);
  const profileState = ensureEloProfileObject(nk, logger, ctx.userId);
  let ownerRecord = readOwnerLeaderboardRecord(nk, ctx.userId);

  if (!ownerRecord) {
    syncEloLeaderboardRecord(nk, logger, profileState.profile);
    ownerRecord = readOwnerLeaderboardRecord(nk, ctx.userId);
  }

  const rawResult = nk.leaderboardRecordsHaystack(ELO_LEADERBOARD_ID, ctx.userId, limit, "", 0);
  const { records } = normalizeLeaderboardListResponse(rawResult);
  const profilesByUserId = readEloProfilesByUserId(
    nk,
    records
      .map((record) => getLeaderboardRecordOwnerId(record))
      .filter((ownerId): ownerId is string => Boolean(ownerId)),
  );

  const response: EloLeaderboardAroundMeRpcResponse = {
    leaderboardId: ELO_LEADERBOARD_ID,
    records: records
      .map((record) => {
        const userId = getLeaderboardRecordOwnerId(record);
        return buildLeaderboardEntryFromRecord(record, userId ? (profilesByUserId[userId] ?? null) : null);
      })
      .filter((record): record is EloLeaderboardEntry => Boolean(record)),
  };

  return JSON.stringify(response);
};
