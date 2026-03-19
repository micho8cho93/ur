var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));

// logic/constants.ts
var ROSETTES = [
  { row: 0, col: 0 },
  { row: 2, col: 0 },
  { row: 1, col: 3 },
  // The central war rosette
  { row: 0, col: 6 },
  { row: 2, col: 6 }
];
var PATH_LIGHT = [
  { row: 2, col: 3 },
  { row: 2, col: 2 },
  { row: 2, col: 1 },
  { row: 2, col: 0 },
  // 0-3
  { row: 1, col: 0 },
  { row: 1, col: 1 },
  { row: 1, col: 2 },
  { row: 1, col: 3 },
  // 4-7
  { row: 1, col: 4 },
  { row: 1, col: 5 },
  { row: 1, col: 6 },
  { row: 1, col: 7 },
  // 8-11
  { row: 2, col: 7 },
  { row: 2, col: 6 }
  // 12-13
  // 14 is "off board" finish
];
var PATH_DARK = [
  { row: 0, col: 3 },
  { row: 0, col: 2 },
  { row: 0, col: 1 },
  { row: 0, col: 0 },
  // 0-3
  { row: 1, col: 0 },
  { row: 1, col: 1 },
  { row: 1, col: 2 },
  { row: 1, col: 3 },
  // 4-7
  { row: 1, col: 4 },
  { row: 1, col: 5 },
  { row: 1, col: 6 },
  { row: 1, col: 7 },
  // 8-11
  { row: 0, col: 7 },
  { row: 0, col: 6 }
  // 12-13
];
var PATH_LENGTH = 14;
var isRosette = (r, c) => ROSETTES.some((coord) => coord.row === r && coord.col === c);
var isWarZone = (r, c) => r === 1;

// logic/engine.ts
var INITIAL_PIECE_COUNT = 7;
var createPlayer = (color) => ({
  id: color,
  color,
  pieces: Array.from({ length: INITIAL_PIECE_COUNT }).map((_, i) => ({
    id: `${color}-${i}`,
    owner: color,
    position: -1,
    isFinished: false
  })),
  capturedCount: 0,
  finishedCount: 0
});
var createInitialState = () => ({
  currentTurn: "light",
  rollValue: null,
  phase: "rolling",
  light: createPlayer("light"),
  dark: createPlayer("dark"),
  winner: null,
  history: []
});
var rollDice = () => {
  let sum = 0;
  for (let i = 0; i < 4; i++) {
    if (Math.random() > 0.5) sum++;
  }
  return sum;
};
var getPathCoord = (color, index) => {
  const path = color === "light" ? PATH_LIGHT : PATH_DARK;
  return path[index];
};
var getValidMoves = (state, roll) => {
  if (roll === 0) return [];
  const player = state[state.currentTurn];
  const opponent = state[state.currentTurn === "light" ? "dark" : "light"];
  const moves = [];
  const processedPositions = /* @__PURE__ */ new Set();
  for (const piece of player.pieces) {
    if (piece.isFinished) continue;
    if (piece.position === -1 && processedPositions.has(-1)) continue;
    if (piece.position === -1) processedPositions.add(-1);
    const targetIndex = piece.position + roll;
    if (targetIndex > PATH_LENGTH) continue;
    if (targetIndex === PATH_LENGTH) {
      moves.push({ pieceId: piece.id, fromIndex: piece.position, toIndex: targetIndex });
      continue;
    }
    const myPieceAtTarget = player.pieces.find((p) => p.position === targetIndex && !p.isFinished);
    if (myPieceAtTarget) continue;
    const targetCoord = getPathCoord(player.color, targetIndex);
    const isShared = isWarZone(targetCoord.row, targetCoord.col);
    const opponentPiece = opponent.pieces.find((p) => {
      if (p.isFinished || p.position === -1) return false;
      const opCoord = getPathCoord(opponent.color, p.position);
      return opCoord.row === targetCoord.row && opCoord.col === targetCoord.col;
    });
    if (opponentPiece) {
      const targetIsRosette = isRosette(targetCoord.row, targetCoord.col);
      if (targetIsRosette && isShared) {
        continue;
      }
    }
    moves.push({ pieceId: piece.id, fromIndex: piece.position, toIndex: targetIndex });
  }
  return moves;
};
var applyMove = (state, move) => {
  const newState = JSON.parse(JSON.stringify(state));
  const player = newState[newState.currentTurn];
  const opponent = newState[newState.currentTurn === "light" ? "dark" : "light"];
  const piece = player.pieces.find((p) => p.id === move.pieceId);
  piece.position = move.toIndex;
  if (move.toIndex === PATH_LENGTH) {
    piece.isFinished = true;
    player.finishedCount++;
  }
  if (move.toIndex < PATH_LENGTH) {
    const targetCoord = getPathCoord(player.color, move.toIndex);
    const opponentPiece = opponent.pieces.find((p) => {
      if (p.isFinished || p.position === -1) return false;
      const opCoord = getPathCoord(opponent.color, p.position);
      return opCoord.row === targetCoord.row && opCoord.col === targetCoord.col;
    });
    if (opponentPiece) {
      opponentPiece.position = -1;
      player.capturedCount++;
      newState.history.push(`${player.color} captured ${opponent.color}`);
    }
  }
  let isRosetteLanding = false;
  if (move.toIndex < PATH_LENGTH) {
    const coord = getPathCoord(player.color, move.toIndex);
    if (isRosette(coord.row, coord.col)) {
      isRosetteLanding = true;
    }
  }
  newState.history.push(`${player.color} moved to ${move.toIndex}. Rosette: ${isRosetteLanding}`);
  if (isRosetteLanding) {
    newState.phase = "rolling";
    newState.rollValue = null;
  } else {
    newState.currentTurn = newState.currentTurn === "light" ? "dark" : "light";
    newState.phase = "rolling";
    newState.rollValue = null;
  }
  if (player.finishedCount >= INITIAL_PIECE_COUNT) {
    newState.winner = player.color;
    newState.phase = "ended";
  }
  return newState;
};

// shared/progression.ts
var PROGRESSION_RANKS = [
  { index: 1, title: "Laborer", threshold: 0 },
  { index: 2, title: "Servant of the Temple", threshold: 100 },
  { index: 3, title: "Apprentice Scribe", threshold: 250 },
  { index: 4, title: "Scribe", threshold: 475 },
  { index: 5, title: "Merchant", threshold: 800 },
  { index: 6, title: "Artisan", threshold: 1275 },
  { index: 7, title: "Priest", threshold: 1975 },
  { index: 8, title: "Diviner", threshold: 2975 },
  { index: 9, title: "Royal Guard", threshold: 4375 },
  { index: 10, title: "Noble of the Court", threshold: 6375 },
  { index: 11, title: "Governor", threshold: 9175 },
  { index: 12, title: "Royalty", threshold: 13175 },
  { index: 13, title: "High Priest", threshold: 19175 },
  { index: 14, title: "Emperor of Sumer & Akkad", threshold: 28175 },
  { index: 15, title: "Immortal", threshold: 4e4 }
];
var XP_SOURCE_CONFIG = {
  pvp_win: {
    amount: 100,
    description: "Authoritative PvP win reward."
  },
  bot_win: {
    amount: 100,
    description: "Authenticated bot win reward."
  }
};
var MAX_RANK = PROGRESSION_RANKS[PROGRESSION_RANKS.length - 1];
var roundProgressPercent = (value) => Math.round(value * 100) / 100;
var sanitizeTotalXp = (value) => {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.floor(value));
};
var getXpAwardAmount = (source) => XP_SOURCE_CONFIG[source].amount;
var createDefaultProgressionProfile = (totalXp = 0, lastUpdatedAt = (/* @__PURE__ */ new Date()).toISOString()) => {
  const sanitizedXp = sanitizeTotalXp(totalXp);
  const currentRank = getRankForXp(sanitizedXp);
  return {
    totalXp: sanitizedXp,
    currentRankTitle: currentRank.title,
    lastUpdatedAt
  };
};
var getRankForXp = (totalXp) => {
  const sanitizedXp = sanitizeTotalXp(totalXp);
  for (let index = PROGRESSION_RANKS.length - 1; index >= 0; index -= 1) {
    const rank = PROGRESSION_RANKS[index];
    if (sanitizedXp >= rank.threshold) {
      return rank;
    }
  }
  return PROGRESSION_RANKS[0];
};
var getNextRankForXp = (totalXp) => {
  var _a;
  const currentRank = getRankForXp(totalXp);
  const nextRankIndex = currentRank.index;
  return (_a = PROGRESSION_RANKS[nextRankIndex]) != null ? _a : null;
};
var getProgressWithinCurrentRank = (totalXp) => {
  const sanitizedXp = sanitizeTotalXp(totalXp);
  const currentRank = getRankForXp(sanitizedXp);
  const nextRank = getNextRankForXp(sanitizedXp);
  if (!nextRank) {
    return {
      currentRank,
      nextRank: null,
      xpIntoCurrentRank: Math.max(0, sanitizedXp - currentRank.threshold),
      progressPercent: 100
    };
  }
  const xpIntoCurrentRank = Math.max(0, sanitizedXp - currentRank.threshold);
  const rankSpan = Math.max(1, nextRank.threshold - currentRank.threshold);
  const progressPercent = roundProgressPercent(Math.min(100, xpIntoCurrentRank / rankSpan * 100));
  return {
    currentRank,
    nextRank,
    xpIntoCurrentRank,
    progressPercent
  };
};
var getXpRequiredForNextRank = (totalXp) => {
  const sanitizedXp = sanitizeTotalXp(totalXp);
  const nextRank = getNextRankForXp(sanitizedXp);
  if (!nextRank) {
    return 0;
  }
  return Math.max(0, nextRank.threshold - sanitizedXp);
};
var buildProgressionSnapshot = (totalXp) => {
  var _a, _b;
  const sanitizedXp = sanitizeTotalXp(totalXp);
  const { currentRank, nextRank, xpIntoCurrentRank, progressPercent } = getProgressWithinCurrentRank(sanitizedXp);
  return {
    totalXp: sanitizedXp,
    currentRank: currentRank.title,
    currentRankThreshold: currentRank.threshold,
    nextRank: (_a = nextRank == null ? void 0 : nextRank.title) != null ? _a : null,
    nextRankThreshold: (_b = nextRank == null ? void 0 : nextRank.threshold) != null ? _b : null,
    xpIntoCurrentRank,
    xpNeededForNextRank: getXpRequiredForNextRank(sanitizedXp),
    progressPercent: nextRank ? progressPercent : 100
  };
};

// backend/modules/progression.ts
var PROGRESSION_COLLECTION = "progression";
var PROGRESSION_PROFILE_KEY = "profile";
var XP_REWARD_LEDGER_COLLECTION = "xp_reward_ledger";
var STORAGE_PERMISSION_NONE = 0;
var MAX_WRITE_ATTEMPTS = 4;
var RPC_GET_PROGRESSION = "get_progression";
var RPC_GET_USER_XP_PROGRESS = "get_user_xp_progress";
var asRecord = (value) => typeof value === "object" && value !== null ? value : null;
var readStringField = (value, keys) => {
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
var readNumberField = (value, keys) => {
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
var getStorageObjectValue = (object) => {
  var _a;
  return (_a = object == null ? void 0 : object.value) != null ? _a : null;
};
var getStorageObjectVersion = (object) => readStringField(object, ["version"]);
var getErrorMessage = (error) => error instanceof Error ? error.message : String(error);
var findStorageObject = (objects, collection, key, userId) => {
  var _a;
  return (_a = objects.find((object) => {
    const collectionName = readStringField(object, ["collection"]);
    const objectKey = readStringField(object, ["key"]);
    const objectUserId = readStringField(object, ["userId", "user_id"]);
    if (collectionName !== collection || objectKey !== key) {
      return false;
    }
    if (typeof userId === "string") {
      return objectUserId === userId;
    }
    return !objectUserId;
  })) != null ? _a : null;
};
var normalizeProgressionProfile = (rawValue, fallbackUpdatedAt = (/* @__PURE__ */ new Date()).toISOString()) => {
  var _a, _b;
  const totalXp = sanitizeTotalXp((_a = readNumberField(rawValue, ["totalXp", "total_xp"])) != null ? _a : 0);
  const lastUpdatedAt = (_b = readStringField(rawValue, ["lastUpdatedAt", "last_updated_at"])) != null ? _b : fallbackUpdatedAt;
  return {
    totalXp,
    currentRankTitle: getRankForXp(totalXp).title,
    lastUpdatedAt
  };
};
var profileNeedsRepair = (rawValue, normalized) => {
  const rawRecord = asRecord(rawValue);
  if (!rawRecord) {
    return true;
  }
  const rawTotalXp = readNumberField(rawRecord, ["totalXp", "total_xp"]);
  const rawRankTitle = readStringField(rawRecord, ["currentRankTitle", "current_rank_title"]);
  const rawLastUpdatedAt = readStringField(rawRecord, ["lastUpdatedAt", "last_updated_at"]);
  return rawTotalXp !== normalized.totalXp || rawRankTitle !== normalized.currentRankTitle || rawLastUpdatedAt !== normalized.lastUpdatedAt;
};
var normalizeStoredXpRewardRecord = (rawValue) => {
  var _a, _b, _c;
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
  const awardedXp = sanitizeTotalXp((_a = readNumberField(record, ["awardedXp", "awarded_xp"])) != null ? _a : 0);
  const previousTotalXp = sanitizeTotalXp((_b = readNumberField(record, ["previousTotalXp", "previous_total_xp"])) != null ? _b : 0);
  const newTotalXp = sanitizeTotalXp((_c = readNumberField(record, ["newTotalXp", "new_total_xp"])) != null ? _c : 0);
  const progression = record.progression;
  if (!userId || !ledgerKey || !sourceId || !awardedAt || source !== "pvp_win" && source !== "bot_win" && source !== "challenge_completion" || typeof progression !== "object" || progression === null) {
    return null;
  }
  return {
    userId,
    ledgerKey,
    source,
    sourceId,
    matchId: matchId != null ? matchId : null,
    awardedAt,
    awardedXp,
    previousTotalXp,
    newTotalXp,
    progression
  };
};
var readProgressionProfileObject = (nk, userId) => {
  const objects = nk.storageRead([
    {
      collection: PROGRESSION_COLLECTION,
      key: PROGRESSION_PROFILE_KEY,
      userId
    }
  ]);
  return findStorageObject(objects, PROGRESSION_COLLECTION, PROGRESSION_PROFILE_KEY, userId);
};
var readProgressionProfileAndLedger = (nk, userId, ledgerKey) => {
  const objects = nk.storageRead([
    {
      collection: PROGRESSION_COLLECTION,
      key: PROGRESSION_PROFILE_KEY,
      userId
    },
    {
      collection: XP_REWARD_LEDGER_COLLECTION,
      key: ledgerKey,
      userId
    }
  ]);
  return {
    profileObject: findStorageObject(objects, PROGRESSION_COLLECTION, PROGRESSION_PROFILE_KEY, userId),
    ledgerObject: findStorageObject(objects, XP_REWARD_LEDGER_COLLECTION, ledgerKey, userId)
  };
};
var writeProgressionProfile = (nk, userId, profile, version) => {
  nk.storageWrite([
    {
      collection: PROGRESSION_COLLECTION,
      key: PROGRESSION_PROFILE_KEY,
      userId,
      value: profile,
      version,
      permissionRead: STORAGE_PERMISSION_NONE,
      permissionWrite: STORAGE_PERMISSION_NONE
    }
  ]);
};
var buildDuplicateRewardResult = (ledgerObject, fallbackProgression, fallback) => {
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
      progression: normalizedRecord.progression
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
    progression: fallbackProgression
  };
};
var buildXpRewardLedgerRecord = (userId, reward, previousTotalXp, newTotalXp, awardedAt) => {
  var _a;
  return {
    userId,
    ledgerKey: reward.ledgerKey,
    source: reward.source,
    sourceId: reward.sourceId,
    matchId: (_a = reward.matchId) != null ? _a : null,
    awardedAt,
    awardedXp: sanitizeTotalXp(reward.awardedXp),
    previousTotalXp,
    newTotalXp,
    progression: buildProgressionSnapshot(newTotalXp)
  };
};
var ensureProgressionProfile = (nk, logger, userId) => {
  var _a;
  for (let attempt = 1; attempt <= MAX_WRITE_ATTEMPTS; attempt += 1) {
    const existingObject = readProgressionProfileObject(nk, userId);
    if (existingObject) {
      const normalizedProfile = normalizeProgressionProfile(getStorageObjectValue(existingObject));
      if (!profileNeedsRepair(getStorageObjectValue(existingObject), normalizedProfile)) {
        return normalizedProfile;
      }
      try {
        writeProgressionProfile(nk, userId, normalizedProfile, (_a = getStorageObjectVersion(existingObject)) != null ? _a : "");
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
var getProgressionForUser = (nk, logger, userId) => buildProgressionSnapshot(ensureProgressionProfile(nk, logger, userId).totalXp);
var awardXp = (nk, logger, params) => {
  var _a, _b, _c, _d, _e, _f, _g, _h;
  const userId = (_a = params.userId) == null ? void 0 : _a.trim();
  const ledgerKey = (_b = params.ledgerKey) == null ? void 0 : _b.trim();
  const sourceId = (_c = params.sourceId) == null ? void 0 : _c.trim();
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
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const { profileObject, ledgerObject } = readProgressionProfileAndLedger(nk, userId, ledgerKey);
    const currentProfile = profileObject ? normalizeProgressionProfile(getStorageObjectValue(profileObject), now) : createDefaultProgressionProfile(0, now);
    const currentSnapshot = buildProgressionSnapshot(currentProfile.totalXp);
    if (ledgerObject) {
      return buildDuplicateRewardResult(ledgerObject, currentSnapshot, {
        ledgerKey,
        source: params.source,
        sourceId,
        matchId: (_d = params.matchId) != null ? _d : null
      });
    }
    const previousTotalXp = currentProfile.totalXp;
    const newTotalXp = sanitizeTotalXp(previousTotalXp + awardedXp);
    const previousRank = getRankForXp(previousTotalXp).title;
    const newRank = getRankForXp(newTotalXp).title;
    const response = {
      ledgerKey,
      source: params.source,
      sourceId,
      matchId: (_e = params.matchId) != null ? _e : null,
      duplicate: false,
      awardedXp,
      previousTotalXp,
      newTotalXp,
      previousRank,
      newRank,
      rankChanged: previousRank !== newRank,
      progression: buildProgressionSnapshot(newTotalXp)
    };
    const nextProfile = {
      totalXp: newTotalXp,
      currentRankTitle: newRank,
      lastUpdatedAt: now
    };
    const rewardRecord = buildXpRewardLedgerRecord(
      userId,
      {
        ledgerKey,
        source: params.source,
        sourceId,
        matchId: (_f = params.matchId) != null ? _f : null,
        awardedXp
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
          version: profileObject ? (_g = getStorageObjectVersion(profileObject)) != null ? _g : "" : "*",
          permissionRead: STORAGE_PERMISSION_NONE,
          permissionWrite: STORAGE_PERMISSION_NONE
        },
        {
          collection: XP_REWARD_LEDGER_COLLECTION,
          key: ledgerKey,
          userId,
          value: rewardRecord,
          version: "*",
          permissionRead: STORAGE_PERMISSION_NONE,
          permissionWrite: STORAGE_PERMISSION_NONE
        }
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
            matchId: (_h = params.matchId) != null ? _h : null
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
var buildMatchWinAwardResponse = (result) => {
  var _a;
  return {
    matchId: (_a = result.matchId) != null ? _a : result.sourceId,
    source: result.source,
    duplicate: result.duplicate,
    awardedXp: result.awardedXp,
    previousTotalXp: result.previousTotalXp,
    newTotalXp: result.newTotalXp,
    previousRank: result.previousRank,
    newRank: result.newRank,
    rankChanged: result.rankChanged,
    progression: result.progression
  };
};
var awardXpForMatchWin = (nk, logger, params) => {
  var _a;
  const source = (_a = params.source) != null ? _a : "pvp_win";
  return buildMatchWinAwardResponse(
    awardXp(nk, logger, {
      userId: params.userId,
      ledgerKey: `${source}:${params.matchId}`,
      source,
      sourceId: params.matchId,
      matchId: params.matchId,
      awardedXp: getXpAwardAmount(source)
    })
  );
};
var createProgressionAwardNotification = (response) => __spreadValues({
  type: "progression_award"
}, response);
var rpcGetXpProgress = (ctx, logger, nk, _payload) => {
  if (!ctx.userId) {
    throw new Error("Authentication required.");
  }
  return JSON.stringify(getProgressionForUser(nk, logger, ctx.userId));
};
var rpcGetProgression = rpcGetXpProgress;
var rpcGetUserXpProgress = rpcGetXpProgress;

// shared/challenges.ts
var CHALLENGE_IDS = {
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
  BEAT_PERFECT_BOT: "beat_perfect_bot"
};
var CHALLENGE_DEFINITIONS = [
  {
    id: CHALLENGE_IDS.FIRST_VICTORY,
    name: "First Victory",
    description: "Win your first completed game against any opponent.",
    type: "milestone",
    rewardXp: 150
  },
  {
    id: CHALLENGE_IDS.BEAT_EASY_BOT,
    name: "Beat the Easy Bot",
    description: "Win a completed game against the easy AI opponent.",
    type: "bot",
    rewardXp: 100
  },
  {
    id: CHALLENGE_IDS.FAST_FINISH,
    name: "Fast Finish",
    description: "Win a completed game in fewer than 100 total applied moves.",
    type: "match",
    rewardXp: 175
  },
  {
    id: CHALLENGE_IDS.SAFE_PLAY,
    name: "Safe Play",
    description: "Win a completed game without losing any pieces to captures.",
    type: "match",
    rewardXp: 200
  },
  {
    id: CHALLENGE_IDS.LUCKY_ROLL,
    name: "Lucky Roll",
    description: "Win a completed game after rolling the maximum value at least 3 times.",
    type: "match",
    rewardXp: 175
  },
  {
    id: CHALLENGE_IDS.HOME_STRETCH,
    name: "Home Stretch",
    description: "Win a completed game while making zero captures across the entire match.",
    type: "match",
    rewardXp: 225
  },
  {
    id: CHALLENGE_IDS.CAPTURE_MASTER,
    name: "Capture Master",
    description: "Capture at least 3 opponent pieces in a single completed game. Victory is not required.",
    type: "match",
    rewardXp: 200
  },
  {
    id: CHALLENGE_IDS.COMEBACK_WIN,
    name: "Comeback Win",
    description: "Win a completed game after trailing at one or more deterministic progress checkpoints during the match.",
    type: "match",
    rewardXp: 250
  },
  {
    id: CHALLENGE_IDS.RISK_TAKER,
    name: "Risk Taker",
    description: "Win a completed game after landing on shared contestable tiles at least 3 times.",
    type: "match",
    rewardXp: 200
  },
  {
    id: CHALLENGE_IDS.BEAT_MEDIUM_BOT,
    name: "Beat the Medium Bot",
    description: "Win a completed game against the medium AI opponent.",
    type: "bot",
    rewardXp: 150
  },
  {
    id: CHALLENGE_IDS.BEAT_HARD_BOT,
    name: "Beat the Hard Bot",
    description: "Win a completed game against the hard AI opponent.",
    type: "bot",
    rewardXp: 225
  },
  {
    id: CHALLENGE_IDS.BEAT_PERFECT_BOT,
    name: "Beat the Perfect Bot",
    description: "Win a completed game against the perfect AI opponent.",
    type: "bot",
    rewardXp: 350
  }
];
var CHALLENGE_DEFINITION_BY_ID = CHALLENGE_DEFINITIONS.reduce(
  (definitions, definition) => {
    definitions[definition.id] = definition;
    return definitions;
  },
  {}
);
var getChallengeDefinition = (challengeId) => {
  const definition = CHALLENGE_DEFINITION_BY_ID[challengeId];
  if (!definition) {
    throw new Error(`Unknown challenge definition: ${challengeId}`);
  }
  return definition;
};
var createDefaultUserChallengeProgressSnapshot = (updatedAt = (/* @__PURE__ */ new Date()).toISOString()) => ({
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
        rewardXp: definition.rewardXp
      };
      return states;
    },
    {}
  )
});
var isChallengeId = (value) => typeof value === "string" && value in CHALLENGE_DEFINITION_BY_ID;
var isOpponentType = (value) => value === "human" || value === "easy_bot" || value === "medium_bot" || value === "hard_bot" || value === "perfect_bot";
var isChallengeDefinition = (value) => {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const definition = value;
  return isChallengeId(definition.id) && typeof definition.name === "string" && typeof definition.description === "string" && (definition.type === "milestone" || definition.type === "bot" || definition.type === "match") && typeof definition.rewardXp === "number";
};
var isCompletedMatchSummary = (value) => {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const summary = value;
  return typeof summary.matchId === "string" && typeof summary.playerUserId === "string" && isOpponentType(summary.opponentType) && typeof summary.didWin === "boolean" && typeof summary.totalMoves === "number" && typeof summary.playerMoveCount === "number" && typeof summary.piecesLost === "number" && typeof summary.maxRollCount === "number" && typeof summary.capturesMade === "number" && typeof summary.capturesSuffered === "number" && typeof summary.contestedTilesLandedCount === "number" && typeof summary.borneOffCount === "number" && typeof summary.opponentBorneOffCount === "number" && typeof summary.wasBehindDuringMatch === "boolean" && typeof summary.behindCheckpointCount === "number" && Array.isArray(summary.behindReasons) && summary.behindReasons.every(
    (reason) => reason === "progress_deficit" || reason === "borne_off_deficit"
  ) && typeof summary.timestamp === "string";
};
var isCompletedBotMatchRewardMode = (value) => value === "standard" || value === "base_win_only";
var isSubmitCompletedBotMatchRpcRequest = (value) => {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const payload = value;
  return isCompletedMatchSummary(payload.summary) && (typeof payload.tutorialId === "string" || payload.tutorialId === null || typeof payload.tutorialId === "undefined") && (typeof payload.rewardMode === "undefined" || isCompletedBotMatchRewardMode(payload.rewardMode));
};
var getPieceProgressScore = (position) => {
  if (position < 0) {
    return 0;
  }
  if (position >= PATH_LENGTH) {
    return PATH_LENGTH + 1;
  }
  return position + 1;
};
var calculateBoardProgressScore = (player) => player.pieces.reduce((total, piece) => total + getPieceProgressScore(piece.position), 0);
var calculateComebackCheckpoint = (state, playerColor) => {
  const opponentColor = playerColor === "light" ? "dark" : "light";
  const player = state[playerColor];
  const opponent = state[opponentColor];
  const reasons = [];
  const playerProgress = calculateBoardProgressScore(player);
  const opponentProgress = calculateBoardProgressScore(opponent);
  if (opponent.finishedCount > player.finishedCount) {
    reasons.push("borne_off_deficit");
  }
  if (opponentProgress - playerProgress >= 4) {
    reasons.push("progress_deficit");
  }
  return {
    wasBehind: reasons.length > 0,
    reasons
  };
};

// backend/modules/challenges.ts
var CHALLENGE_DEFINITIONS_COLLECTION = "challenge_definitions";
var USER_CHALLENGE_PROGRESS_COLLECTION = "user_challenge_progress";
var USER_CHALLENGE_PROGRESS_KEY = "progress";
var PROCESSED_MATCH_RESULTS_COLLECTION = "processed_match_results";
var RPC_GET_CHALLENGE_DEFINITIONS = "get_challenge_definitions";
var RPC_GET_USER_CHALLENGE_PROGRESS = "get_user_challenge_progress";
var RPC_SUBMIT_COMPLETED_BOT_MATCH = "submit_completed_bot_match";
var CHALLENGE_EVALUATORS = {
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
  [CHALLENGE_IDS.BEAT_PERFECT_BOT]: (summary) => summary.didWin && summary.opponentType === "perfect_bot"
};
var buildChallengeRewardLedgerKey = (challengeId) => `challenge:${challengeId}`;
var buildProcessedMatchResultKey = (matchId) => matchId;
var isBotOpponentType = (opponentType) => opponentType === "easy_bot" || opponentType === "medium_bot" || opponentType === "hard_bot" || opponentType === "perfect_bot";
var readStringField2 = (value, keys) => {
  if (typeof value !== "object" || value === null) {
    return null;
  }
  const record = value;
  for (const key of keys) {
    const field = record[key];
    if (typeof field === "string" && field.length > 0) {
      return field;
    }
  }
  return null;
};
var normalizeChallengeProgress = (rawValue, fallbackUpdatedAt = (/* @__PURE__ */ new Date()).toISOString()) => {
  var _a;
  const rawRecord = typeof rawValue === "object" && rawValue !== null ? rawValue : null;
  const rawChallenges = rawRecord && typeof rawRecord.challenges === "object" && rawRecord.challenges !== null ? rawRecord.challenges : null;
  const normalizedChallenges = CHALLENGE_DEFINITIONS.reduce(
    (states, definition) => {
      var _a2;
      const rawState = rawChallenges == null ? void 0 : rawChallenges[definition.id];
      const completed = (rawState == null ? void 0 : rawState.completed) === true;
      const completedAt = completed ? (_a2 = readStringField2(rawState, ["completedAt", "completed_at"])) != null ? _a2 : fallbackUpdatedAt : null;
      const completedMatchId = completed ? readStringField2(rawState, ["completedMatchId", "completed_match_id"]) : null;
      states[definition.id] = {
        challengeId: definition.id,
        completed,
        completedAt,
        completedMatchId: completedMatchId != null ? completedMatchId : null,
        rewardXp: definition.rewardXp
      };
      return states;
    },
    {}
  );
  const totalCompleted = Object.values(normalizedChallenges).filter((challenge) => challenge.completed).length;
  const totalRewardedXp = Object.values(normalizedChallenges).filter((challenge) => challenge.completed).reduce((total, challenge) => total + challenge.rewardXp, 0);
  return {
    totalCompleted,
    totalRewardedXp,
    updatedAt: (_a = readStringField2(rawRecord, ["updatedAt", "updated_at"])) != null ? _a : fallbackUpdatedAt,
    challenges: normalizedChallenges
  };
};
var challengeProgressNeedsRepair = (rawValue, normalized) => {
  const rawRecord = typeof rawValue === "object" && rawValue !== null ? rawValue : null;
  if (!rawRecord) {
    return true;
  }
  if (rawRecord.totalCompleted !== normalized.totalCompleted) {
    return true;
  }
  if (rawRecord.totalRewardedXp !== normalized.totalRewardedXp) {
    return true;
  }
  const rawChallenges = rawRecord.challenges;
  return CHALLENGE_DEFINITIONS.some((definition) => {
    const rawState = rawChallenges == null ? void 0 : rawChallenges[definition.id];
    const normalizedState = normalized.challenges[definition.id];
    return !rawState || rawState.completed !== normalizedState.completed || rawState.completedAt !== normalizedState.completedAt || rawState.completedMatchId !== normalizedState.completedMatchId || rawState.rewardXp !== normalizedState.rewardXp;
  });
};
var readChallengeProgressObject = (nk, userId) => {
  const objects = nk.storageRead([
    {
      collection: USER_CHALLENGE_PROGRESS_COLLECTION,
      key: USER_CHALLENGE_PROGRESS_KEY,
      userId
    }
  ]);
  return findStorageObject(objects, USER_CHALLENGE_PROGRESS_COLLECTION, USER_CHALLENGE_PROGRESS_KEY, userId);
};
var writeChallengeProgressObject = (nk, userId, progress, version) => {
  nk.storageWrite([
    {
      collection: USER_CHALLENGE_PROGRESS_COLLECTION,
      key: USER_CHALLENGE_PROGRESS_KEY,
      userId,
      value: progress,
      version,
      permissionRead: STORAGE_PERMISSION_NONE,
      permissionWrite: STORAGE_PERMISSION_NONE
    }
  ]);
};
var ensureChallengeDefinitions = (nk, logger) => {
  for (let attempt = 1; attempt <= MAX_WRITE_ATTEMPTS; attempt += 1) {
    const existingObjects = nk.storageRead(
      CHALLENGE_DEFINITIONS.map((definition) => ({
        collection: CHALLENGE_DEFINITIONS_COLLECTION,
        key: definition.id
      }))
    );
    const writes = CHALLENGE_DEFINITIONS.flatMap((definition) => {
      var _a;
      const existing = findStorageObject(existingObjects, CHALLENGE_DEFINITIONS_COLLECTION, definition.id);
      const stored = getStorageObjectValue(existing);
      if (stored && isChallengeDefinition(stored)) {
        const storedDefinition = stored;
        if (storedDefinition.name === definition.name && storedDefinition.description === definition.description && storedDefinition.type === definition.type && storedDefinition.rewardXp === definition.rewardXp) {
          return [];
        }
      }
      const value = __spreadProps(__spreadValues({}, definition), {
        syncedAt: (/* @__PURE__ */ new Date()).toISOString()
      });
      return [
        {
          collection: CHALLENGE_DEFINITIONS_COLLECTION,
          key: definition.id,
          value,
          version: existing ? (_a = getStorageObjectVersion(existing)) != null ? _a : "" : "*",
          permissionRead: STORAGE_PERMISSION_NONE,
          permissionWrite: STORAGE_PERMISSION_NONE
        }
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
var ensureUserChallengeProgress = (nk, logger, userId) => {
  var _a;
  for (let attempt = 1; attempt <= MAX_WRITE_ATTEMPTS; attempt += 1) {
    const existingObject = readChallengeProgressObject(nk, userId);
    if (existingObject) {
      const normalized = normalizeChallengeProgress(getStorageObjectValue(existingObject));
      if (!challengeProgressNeedsRepair(getStorageObjectValue(existingObject), normalized)) {
        return normalized;
      }
      try {
        writeChallengeProgressObject(nk, userId, normalized, (_a = getStorageObjectVersion(existingObject)) != null ? _a : "");
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
var getChallengeDefinitionsResponse = () => ({
  challenges: [...CHALLENGE_DEFINITIONS]
});
var getUserChallengeProgress = (nk, logger, userId) => ensureUserChallengeProgress(nk, logger, userId);
var evaluateChallengesForMatchSummary = (summary) => CHALLENGE_DEFINITIONS.filter((definition) => CHALLENGE_EVALUATORS[definition.id](summary)).map(
  (definition) => definition.id
);
var normalizeProcessedMatchResult = (rawValue) => {
  if (typeof rawValue !== "object" || rawValue === null) {
    return null;
  }
  const record = rawValue;
  const matchId = readStringField2(record, ["matchId", "match_id"]);
  const playerUserId = readStringField2(record, ["playerUserId", "player_user_id"]);
  const processedAt = readStringField2(record, ["processedAt", "processed_at"]);
  const summary = record.summary;
  const completedChallengeIds = Array.isArray(record.completedChallengeIds) ? record.completedChallengeIds.filter((challengeId) => typeof challengeId === "string") : [];
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
    awardedXp
  };
};
var readMatchProcessingObjects = (nk, userId, matchId, candidateChallengeIds) => {
  const objectIds = [
    {
      collection: PROGRESSION_COLLECTION,
      key: PROGRESSION_PROFILE_KEY,
      userId
    },
    {
      collection: USER_CHALLENGE_PROGRESS_COLLECTION,
      key: USER_CHALLENGE_PROGRESS_KEY,
      userId
    },
    {
      collection: PROCESSED_MATCH_RESULTS_COLLECTION,
      key: buildProcessedMatchResultKey(matchId),
      userId
    },
    ...candidateChallengeIds.map((challengeId) => ({
      collection: XP_REWARD_LEDGER_COLLECTION,
      key: buildChallengeRewardLedgerKey(challengeId),
      userId
    }))
  ];
  const objects = nk.storageRead(objectIds);
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
    {}
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
    rewardLedgerObjectsByChallengeId
  };
};
var processCompletedMatch = (nk, logger, summary) => {
  var _a, _b, _c;
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
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const {
      profileObject,
      challengeProgressObject,
      processedMatchObject,
      rewardLedgerObjectsByChallengeId
    } = readMatchProcessingObjects(nk, userId, matchId, satisfiedChallengeIds);
    const currentProfile = profileObject ? normalizeProgressionProfile(getStorageObjectValue(profileObject), now) : ensureProgressionProfile(nk, logger, userId);
    const currentProgress = challengeProgressObject ? normalizeChallengeProgress(getStorageObjectValue(challengeProgressObject), now) : createDefaultUserChallengeProgressSnapshot(now);
    const existingProcessedMatch = normalizeProcessedMatchResult(getStorageObjectValue(processedMatchObject));
    if (existingProcessedMatch) {
      return {
        duplicate: true,
        completedChallengeIds: existingProcessedMatch.completedChallengeIds,
        awardedXp: existingProcessedMatch.awardedXp,
        totalXp: currentProfile.totalXp,
        progressionRank: getRankForXp(currentProfile.totalXp).title
      };
    }
    const completedChallengeIds = [];
    const completionWrites = [];
    let totalAwardedXp = 0;
    const nextProgress = __spreadProps(__spreadValues({}, currentProgress), {
      updatedAt: now,
      challenges: __spreadValues({}, currentProgress.challenges)
    });
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
        rewardXp: definition.rewardXp
      };
      if (!rewardLedgerObjectsByChallengeId[challengeId]) {
        totalAwardedXp += definition.rewardXp;
        completionWrites.push({
          challengeId,
          completedAt: now,
          completedMatchId: matchId,
          rewardXp: definition.rewardXp,
          rewardLedgerKey: buildChallengeRewardLedgerKey(challengeId)
        });
      }
    }
    nextProgress.totalCompleted = Object.values(nextProgress.challenges).filter((challenge) => challenge.completed).length;
    nextProgress.totalRewardedXp = Object.values(nextProgress.challenges).filter((challenge) => challenge.completed).reduce((total, challenge) => total + challenge.rewardXp, 0);
    const nextTotalXp = currentProfile.totalXp + totalAwardedXp;
    const nextProfile = {
      totalXp: nextTotalXp,
      currentRankTitle: getRankForXp(nextTotalXp).title,
      lastUpdatedAt: now
    };
    const processedRecord = {
      matchId,
      playerUserId: userId,
      processedAt: now,
      summary,
      completedChallengeIds,
      awardedXp: totalAwardedXp
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
            awardedXp: completion.rewardXp
          },
          previousTotal,
          nextLedgerTotal,
          now
        ),
        version: "*",
        permissionRead: STORAGE_PERMISSION_NONE,
        permissionWrite: STORAGE_PERMISSION_NONE
      };
    });
    const writes = [
      {
        collection: PROGRESSION_COLLECTION,
        key: PROGRESSION_PROFILE_KEY,
        userId,
        value: nextProfile,
        version: profileObject ? (_a = getStorageObjectVersion(profileObject)) != null ? _a : "" : "*",
        permissionRead: STORAGE_PERMISSION_NONE,
        permissionWrite: STORAGE_PERMISSION_NONE
      },
      {
        collection: USER_CHALLENGE_PROGRESS_COLLECTION,
        key: USER_CHALLENGE_PROGRESS_KEY,
        userId,
        value: nextProgress,
        version: challengeProgressObject ? (_b = getStorageObjectVersion(challengeProgressObject)) != null ? _b : "" : "*",
        permissionRead: STORAGE_PERMISSION_NONE,
        permissionWrite: STORAGE_PERMISSION_NONE
      },
      {
        collection: PROCESSED_MATCH_RESULTS_COLLECTION,
        key: buildProcessedMatchResultKey(matchId),
        userId,
        value: processedRecord,
        version: processedMatchObject ? (_c = getStorageObjectVersion(processedMatchObject)) != null ? _c : "" : "*",
        permissionRead: STORAGE_PERMISSION_NONE,
        permissionWrite: STORAGE_PERMISSION_NONE
      },
      ...challengeRewardWrites
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
        progressionRank: nextProfile.currentRankTitle
      };
    } catch (error) {
      const refreshed = readMatchProcessingObjects(nk, userId, matchId, satisfiedChallengeIds);
      const refreshedProcessed = normalizeProcessedMatchResult(getStorageObjectValue(refreshed.processedMatchObject));
      if (refreshedProcessed) {
        const refreshedProfile = refreshed.profileObject ? normalizeProgressionProfile(getStorageObjectValue(refreshed.profileObject), now) : currentProfile;
        return {
          duplicate: true,
          completedChallengeIds: refreshedProcessed.completedChallengeIds,
          awardedXp: refreshedProcessed.awardedXp,
          totalXp: refreshedProfile.totalXp,
          progressionRank: getRankForXp(refreshedProfile.totalXp).title
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
var rpcGetChallengeDefinitions = (ctx, _logger, _nk, _payload) => {
  if (!ctx.userId) {
    throw new Error("Authentication required.");
  }
  return JSON.stringify(getChallengeDefinitionsResponse());
};
var rpcSubmitCompletedBotMatch = (ctx, logger, nk, payload) => {
  if (!ctx.userId) {
    throw new Error("Authentication required.");
  }
  const parsed = payload ? JSON.parse(payload) : {};
  const requestPayload = isSubmitCompletedBotMatchRpcRequest(parsed) ? parsed : isCompletedMatchSummary(parsed) ? { summary: parsed } : null;
  if (!requestPayload) {
    throw new Error("Completed bot match summary payload is invalid.");
  }
  if (!requestPayload.summary.matchId.startsWith("local-")) {
    throw new Error("Completed bot match summary must use a local match ID.");
  }
  if (!isBotOpponentType(requestPayload.summary.opponentType)) {
    throw new Error("Completed bot match summary must reference a bot opponent.");
  }
  const rewardMode = isCompletedBotMatchRewardMode(requestPayload.rewardMode) ? requestPayload.rewardMode : "standard";
  const summary = __spreadProps(__spreadValues({}, requestPayload.summary), {
    playerUserId: ctx.userId
  });
  const progressionAward = summary.didWin ? awardXpForMatchWin(nk, logger, {
    userId: ctx.userId,
    matchId: summary.matchId,
    source: "bot_win"
  }) : null;
  if (rewardMode !== "base_win_only") {
    processCompletedMatch(nk, logger, summary);
  }
  return JSON.stringify({ progressionAward });
};
var rpcGetUserChallengeProgress = (ctx, logger, nk, _payload) => {
  if (!ctx.userId) {
    throw new Error("Authentication required.");
  }
  return JSON.stringify(getUserChallengeProgress(nk, logger, ctx.userId));
};

// shared/urMatchProtocol.ts
var MatchOpCode = {
  ROLL_REQUEST: 1,
  MOVE_REQUEST: 2,
  STATE_SNAPSHOT: 100,
  SERVER_ERROR: 101,
  PROGRESSION_AWARD: 102
};
var isRecord = (value) => typeof value === "object" && value !== null;
var isMoveAction = (value) => {
  if (!isRecord(value)) {
    return false;
  }
  return typeof value.pieceId === "string" && typeof value.fromIndex === "number" && Number.isInteger(value.fromIndex) && typeof value.toIndex === "number" && Number.isInteger(value.toIndex);
};
var isRollRequestPayload = (value) => isRecord(value) && value.type === "roll_request";
var isMoveRequestPayload = (value) => isRecord(value) && value.type === "move_request" && isMoveAction(value.move);
var encodePayload = (payload) => JSON.stringify(payload);
var decodePayload = (raw) => {
  try {
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
};

// backend/modules/index.ts
var TICK_RATE = 10;
var MAX_PLAYERS = 2;
var ONLINE_TTL_MS = 3e4;
var RPC_AUTH_LINK_CUSTOM = "auth_link_custom";
var RPC_GET_PROGRESSION_NAME = RPC_GET_PROGRESSION;
var RPC_GET_USER_XP_PROGRESS_NAME = RPC_GET_USER_XP_PROGRESS;
var RPC_GET_CHALLENGE_DEFINITIONS_NAME = RPC_GET_CHALLENGE_DEFINITIONS;
var RPC_GET_USER_CHALLENGE_PROGRESS_NAME = RPC_GET_USER_CHALLENGE_PROGRESS;
var RPC_SUBMIT_COMPLETED_BOT_MATCH_NAME = RPC_SUBMIT_COMPLETED_BOT_MATCH;
var RPC_MATCHMAKER_ADD = "matchmaker_add";
var RPC_PRESENCE_HEARTBEAT = "presence_heartbeat";
var RPC_PRESENCE_COUNT = "presence_count";
var MATCH_HANDLER = "authoritative_match";
var onlinePresenceByDevice = /* @__PURE__ */ new Map();
var asRecord2 = (value) => typeof value === "object" && value !== null ? value : null;
var readStringField3 = (value, keys) => {
  const record = asRecord2(value);
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
var readNumberField2 = (value, keys) => {
  const record = asRecord2(value);
  if (!record) {
    return null;
  }
  for (const key of keys) {
    const field = record[key];
    if (typeof field === "number" && Number.isFinite(field)) {
      return field;
    }
  }
  return null;
};
var encodeBytesToString = (bytes) => {
  if (typeof TextDecoder !== "undefined") {
    try {
      return new TextDecoder().decode(bytes);
    } catch (e) {
    }
  }
  let output = "";
  for (let i = 0; i < bytes.length; i += 1) {
    output += String.fromCharCode(bytes[i]);
  }
  return output;
};
var decodeMessageData = (data, nk) => {
  var _a;
  if (typeof data === "string") {
    return data;
  }
  const binaryToString = (_a = asRecord2(nk)) == null ? void 0 : _a.binaryToString;
  if (typeof binaryToString === "function") {
    try {
      return String(binaryToString(data));
    } catch (e) {
    }
  }
  if (typeof ArrayBuffer !== "undefined" && data instanceof ArrayBuffer) {
    return encodeBytesToString(new Uint8Array(data));
  }
  if (typeof Uint8Array !== "undefined" && data instanceof Uint8Array) {
    return encodeBytesToString(data);
  }
  if (Array.isArray(data) && data.every((value) => typeof value === "number")) {
    return encodeBytesToString(Uint8Array.from(data));
  }
  return String(data != null ? data : "");
};
var getPresenceUserId = (presence) => readStringField3(presence, ["userId", "user_id"]);
var getSenderUserId = (sender) => readStringField3(sender, ["userId", "user_id"]);
var getMatchId = (ctx) => {
  var _a;
  return (_a = readStringField3(ctx, ["matchId", "match_id"])) != null ? _a : "";
};
var getMessageOpCode = (message) => readNumberField2(message, ["opCode", "op_code"]);
var getContextUserId = (ctx) => readStringField3(ctx, ["userId", "user_id"]);
var pruneOnlinePresence = (nowMs) => {
  onlinePresenceByDevice.forEach((lastSeenMs, deviceKey) => {
    if (nowMs - lastSeenMs > ONLINE_TTL_MS) {
      onlinePresenceByDevice.delete(deviceKey);
    }
  });
};
var encodeOnlinePresencePayload = (nowMs) => JSON.stringify({
  onlineCount: onlinePresenceByDevice.size,
  onlineTtlMs: ONLINE_TTL_MS,
  serverTimeMs: nowMs
});
var createPlayerTelemetry = () => ({
  playerMoveCount: 0,
  maxRollCount: 0,
  capturesMade: 0,
  capturesSuffered: 0,
  contestedTilesLandedCount: 0,
  wasBehindDuringMatch: false,
  behindCheckpointCount: 0,
  behindReasons: /* @__PURE__ */ new Set()
});
var createMatchTelemetry = () => ({
  totalMoves: 0,
  players: {
    light: createPlayerTelemetry(),
    dark: createPlayerTelemetry()
  }
});
var getPathCoord2 = (color, index) => {
  var _a, _b;
  if (index < 0 || index >= PATH_LENGTH) {
    return null;
  }
  return color === "light" ? (_a = PATH_LIGHT[index]) != null ? _a : null : (_b = PATH_DARK[index]) != null ? _b : null;
};
var detectCaptureOnMove = (state, move) => {
  const moverColor = state.currentTurn;
  const opponentColor = moverColor === "light" ? "dark" : "light";
  const targetCoord = getPathCoord2(moverColor, move.toIndex);
  if (!targetCoord) {
    return false;
  }
  return state[opponentColor].pieces.some((piece) => {
    if (piece.position < 0 || piece.isFinished) {
      return false;
    }
    const pieceCoord = getPathCoord2(opponentColor, piece.position);
    return Boolean(pieceCoord && pieceCoord.row === targetCoord.row && pieceCoord.col === targetCoord.col);
  });
};
var updateComebackTelemetry = (state) => {
  ["light", "dark"].forEach((playerColor) => {
    const checkpoint = calculateComebackCheckpoint(state.gameState, playerColor);
    if (!checkpoint.wasBehind) {
      return;
    }
    const playerTelemetry = state.telemetry.players[playerColor];
    playerTelemetry.wasBehindDuringMatch = true;
    playerTelemetry.behindCheckpointCount += 1;
    checkpoint.reasons.forEach((reason) => playerTelemetry.behindReasons.add(reason));
  });
};
var buildPlayerMatchSummary = (state, matchId, playerUserId, playerColor) => {
  const opponentColor = playerColor === "light" ? "dark" : "light";
  const playerTelemetry = state.telemetry.players[playerColor];
  return {
    matchId,
    playerUserId,
    opponentType: state.opponentType,
    didWin: state.gameState.winner === playerColor,
    totalMoves: state.telemetry.totalMoves,
    playerMoveCount: playerTelemetry.playerMoveCount,
    piecesLost: playerTelemetry.capturesSuffered,
    maxRollCount: playerTelemetry.maxRollCount,
    capturesMade: playerTelemetry.capturesMade,
    capturesSuffered: playerTelemetry.capturesSuffered,
    contestedTilesLandedCount: playerTelemetry.contestedTilesLandedCount,
    borneOffCount: state.gameState[playerColor].finishedCount,
    opponentBorneOffCount: state.gameState[opponentColor].finishedCount,
    wasBehindDuringMatch: playerTelemetry.wasBehindDuringMatch,
    behindCheckpointCount: playerTelemetry.behindCheckpointCount,
    behindReasons: Array.from(playerTelemetry.behindReasons),
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  };
};
var matchInitHandler = matchInit;
var matchJoinAttemptHandler = matchJoinAttempt;
var matchJoinHandler = matchJoin;
var matchLeaveHandler = matchLeave;
var matchLoopHandler = matchLoop;
var matchTerminateHandler = matchTerminate;
var matchSignalHandler = matchSignal;
function InitModule(_ctx, logger, nk, initializer) {
  initializer.registerRpc(RPC_AUTH_LINK_CUSTOM, rpcAuthLinkCustom);
  initializer.registerRpc(RPC_GET_PROGRESSION_NAME, rpcGetProgression);
  initializer.registerRpc(RPC_GET_USER_XP_PROGRESS_NAME, rpcGetUserXpProgress);
  initializer.registerRpc(RPC_GET_CHALLENGE_DEFINITIONS_NAME, rpcGetChallengeDefinitions);
  initializer.registerRpc(RPC_GET_USER_CHALLENGE_PROGRESS_NAME, rpcGetUserChallengeProgress);
  initializer.registerRpc(RPC_SUBMIT_COMPLETED_BOT_MATCH_NAME, rpcSubmitCompletedBotMatch);
  initializer.registerRpc(RPC_MATCHMAKER_ADD, rpcMatchmakerAdd);
  initializer.registerRpc(RPC_PRESENCE_HEARTBEAT, rpcPresenceHeartbeat);
  initializer.registerRpc(RPC_PRESENCE_COUNT, rpcPresenceCount);
  initializer.registerMatch(MATCH_HANDLER, {
    matchInit: matchInitHandler,
    matchJoinAttempt: matchJoinAttemptHandler,
    matchJoin: matchJoinHandler,
    matchLeave: matchLeaveHandler,
    matchLoop: matchLoopHandler,
    matchTerminate: matchTerminateHandler,
    matchSignal: matchSignalHandler
  });
  initializer.registerMatchmakerMatched(matchmakerMatched);
  try {
    ensureChallengeDefinitions(nk, logger);
  } catch (error) {
    logger.warn(
      "Skipping challenge definition sync on startup: %s",
      error instanceof Error ? error.message : String(error)
    );
  }
  logger.info("Nakama runtime module loaded.");
}
function rpcPresenceHeartbeat(ctx, _logger, _nk, _payload) {
  const userId = getContextUserId(ctx);
  if (!userId) {
    throw new Error("Authentication required.");
  }
  const nowMs = Date.now();
  onlinePresenceByDevice.set(userId, nowMs);
  pruneOnlinePresence(nowMs);
  return encodeOnlinePresencePayload(nowMs);
}
function rpcPresenceCount(ctx, _logger, _nk, _payload) {
  const userId = getContextUserId(ctx);
  if (!userId) {
    throw new Error("Authentication required.");
  }
  const nowMs = Date.now();
  pruneOnlinePresence(nowMs);
  return encodeOnlinePresencePayload(nowMs);
}
function rpcAuthLinkCustom(ctx, logger, nk, payload) {
  if (!ctx.userId) {
    throw new Error("Authentication required.");
  }
  const data = payload ? JSON.parse(payload) : {};
  const customId = data.customId;
  const username = data.username;
  if (!customId) {
    throw new Error("customId is required.");
  }
  nk.linkCustom(ctx.userId, customId, username);
  logger.info("Linked custom ID to user %s", ctx.userId);
  return JSON.stringify({
    userId: ctx.userId,
    customId
  });
}
function rpcMatchmakerAdd(ctx, _logger, nk, payload) {
  if (!ctx.userId || !ctx.sessionId) {
    throw new Error("Authentication required.");
  }
  const data = payload ? JSON.parse(payload) : {};
  const minCount = Number.isInteger(data.minCount) ? data.minCount : 2;
  const maxCount = Number.isInteger(data.maxCount) ? data.maxCount : 2;
  const query = typeof data.query === "string" ? data.query : "*";
  const stringProperties = typeof data.stringProperties === "object" ? data.stringProperties : {};
  const numericProperties = typeof data.numericProperties === "object" ? data.numericProperties : {};
  const ticket = nk.matchmakerAdd(
    ctx.userId,
    ctx.sessionId,
    query,
    minCount,
    maxCount,
    stringProperties,
    numericProperties
  );
  return JSON.stringify({ ticket });
}
function matchmakerMatched(_ctx, logger, nk, matched) {
  const users = Array.isArray(matched.users) ? matched.users : [];
  const playerIds = users.map((user) => getPresenceUserId(user == null ? void 0 : user.presence)).filter((userId) => Boolean(userId)).slice(0, MAX_PLAYERS);
  logger.info("Matchmaker matched %s players", playerIds.length);
  return nk.matchCreate(MATCH_HANDLER, { playerIds });
}
function matchInit(_ctx, _logger, _nk, params) {
  const playerIds = Array.isArray(params.playerIds) ? params.playerIds : [];
  const assignments = {};
  if (playerIds[0]) {
    assignments[playerIds[0]] = "light";
  }
  if (playerIds[1]) {
    assignments[playerIds[1]] = "dark";
  }
  const state = {
    presences: {},
    assignments,
    gameState: createInitialState(),
    revision: 0,
    opponentType: "human",
    telemetry: createMatchTelemetry()
  };
  return { state, tickRate: TICK_RATE, label: MATCH_HANDLER };
}
function matchJoinAttempt(_ctx, logger, _nk, _dispatcher, _tick, state, presence) {
  const userId = getPresenceUserId(presence);
  if (!userId) {
    logger.warn("Rejecting join attempt with missing user ID.");
    return { state, accept: false, rejectMessage: "Unable to identify player." };
  }
  const activeCount = Object.keys(state.presences).length;
  const hasExistingAssignment = Boolean(state.assignments[userId]);
  if (activeCount >= MAX_PLAYERS && !hasExistingAssignment) {
    return { state, accept: false, rejectMessage: "Match is full." };
  }
  state.presences[userId] = presence;
  ensureAssignment(state, userId);
  return { state, accept: true };
}
function matchJoin(ctx, logger, _nk, dispatcher, _tick, state, presences) {
  presences.forEach((presence) => {
    const userId = getPresenceUserId(presence);
    if (!userId) {
      logger.warn("Skipping join presence with missing user ID.");
      return;
    }
    state.presences[userId] = presence;
    ensureAssignment(state, userId);
  });
  broadcastSnapshot(dispatcher, state, getMatchId(ctx));
  return { state };
}
function matchLeave(_ctx, logger, _nk, _dispatcher, _tick, state, presences) {
  presences.forEach((presence) => {
    const userId = getPresenceUserId(presence);
    if (!userId) {
      logger.warn("Skipping leave presence with missing user ID.");
      return;
    }
    delete state.presences[userId];
  });
  return { state };
}
function matchLoop(ctx, logger, nk, dispatcher, _tick, state, messages) {
  const matchId = getMatchId(ctx);
  messages.forEach((message) => {
    const senderUserId = getSenderUserId(message.sender);
    if (!senderUserId) {
      logger.warn("Ignoring message with missing sender user ID.");
      return;
    }
    const senderPresence = state.presences[senderUserId];
    const senderColor = state.assignments[senderUserId];
    if (!senderPresence || !senderColor) {
      sendError(
        dispatcher,
        state,
        senderUserId,
        "UNAUTHORIZED_PLAYER",
        "Only assigned players can send match commands."
      );
      return;
    }
    const opCode = getMessageOpCode(message);
    if (opCode === null) {
      sendError(dispatcher, state, senderUserId, "UNKNOWN_OP", "Message opcode is missing.");
      return;
    }
    const rawPayload = decodeMessageData(message.data, nk);
    const decodedPayload = decodePayload(rawPayload);
    if (opCode === MatchOpCode.ROLL_REQUEST) {
      if (!isRollRequestPayload(decodedPayload)) {
        sendError(dispatcher, state, senderUserId, "INVALID_PAYLOAD", "Roll payload is invalid.");
        return;
      }
      applyRollRequest(logger, dispatcher, state, senderUserId, senderColor, decodedPayload, matchId);
      return;
    }
    if (opCode === MatchOpCode.MOVE_REQUEST) {
      if (!isMoveRequestPayload(decodedPayload)) {
        sendError(dispatcher, state, senderUserId, "INVALID_PAYLOAD", "Move payload is invalid.");
        return;
      }
      applyMoveRequest(logger, nk, dispatcher, state, senderUserId, senderColor, decodedPayload, matchId);
      return;
    }
    sendError(dispatcher, state, senderUserId, "UNKNOWN_OP", `Unsupported opcode ${opCode}.`);
  });
  return { state };
}
function matchTerminate(_ctx, _logger, _nk, _dispatcher, _tick, state, _graceSeconds) {
  return { state };
}
function matchSignal(ctx, _logger, _nk, dispatcher, _tick, state, data) {
  if (data === "snapshot") {
    broadcastSnapshot(dispatcher, state, getMatchId(ctx));
  }
  return { state };
}
function ensureAssignment(state, userId) {
  if (state.assignments[userId]) {
    return;
  }
  const assignedColors = Object.values(state.assignments);
  if (!assignedColors.includes("light")) {
    state.assignments[userId] = "light";
    return;
  }
  if (!assignedColors.includes("dark")) {
    state.assignments[userId] = "dark";
  }
}
function applyRollRequest(logger, dispatcher, state, userId, playerColor, _payload, matchId) {
  if (state.gameState.winner) {
    sendError(dispatcher, state, userId, "INVALID_PHASE", "The match has already ended.");
    return;
  }
  if (state.gameState.currentTurn !== playerColor) {
    sendError(dispatcher, state, userId, "INVALID_TURN", "It is not your turn to roll.");
    return;
  }
  if (state.gameState.phase !== "rolling") {
    sendError(dispatcher, state, userId, "INVALID_PHASE", "Roll is only valid during rolling phase.");
    return;
  }
  const rollValue = rollDice();
  if (rollValue === 4) {
    state.telemetry.players[playerColor].maxRollCount += 1;
  }
  const rollingState = __spreadProps(__spreadValues({}, state.gameState), {
    rollValue,
    phase: "moving"
  });
  const validMoves = getValidMoves(rollingState, rollValue);
  if (validMoves.length === 0) {
    state.gameState = __spreadProps(__spreadValues({}, rollingState), {
      currentTurn: rollingState.currentTurn === "light" ? "dark" : "light",
      phase: "rolling",
      rollValue: null,
      history: [...rollingState.history, `${rollingState.currentTurn} rolled ${rollValue} but had no moves.`]
    });
    updateComebackTelemetry(state);
  } else {
    state.gameState = rollingState;
  }
  state.revision += 1;
  logger.debug("Applied roll for %s (revision %d)", userId, state.revision);
  broadcastSnapshot(dispatcher, state, matchId);
}
function applyMoveRequest(logger, nk, dispatcher, state, userId, playerColor, payload, matchId) {
  if (state.gameState.winner) {
    sendError(dispatcher, state, userId, "INVALID_PHASE", "The match has already ended.");
    return;
  }
  if (state.gameState.currentTurn !== playerColor) {
    sendError(dispatcher, state, userId, "INVALID_TURN", "It is not your turn to move.");
    return;
  }
  if (state.gameState.phase !== "moving" || state.gameState.rollValue === null) {
    sendError(dispatcher, state, userId, "INVALID_PHASE", "Move is only valid during moving phase.");
    return;
  }
  const validMoves = getValidMoves(state.gameState, state.gameState.rollValue);
  const moveIsValid = validMoves.some(
    (validMove) => validMove.pieceId === payload.move.pieceId && validMove.fromIndex === payload.move.fromIndex && validMove.toIndex === payload.move.toIndex
  );
  if (!moveIsValid) {
    sendError(dispatcher, state, userId, "INVALID_MOVE", "Move is not valid for current state.");
    return;
  }
  const didCapture = detectCaptureOnMove(state.gameState, payload.move);
  const targetCoord = getPathCoord2(playerColor, payload.move.toIndex);
  state.gameState = applyMove(state.gameState, payload.move);
  state.telemetry.totalMoves += 1;
  state.telemetry.players[playerColor].playerMoveCount += 1;
  if (didCapture) {
    const opponentColor = playerColor === "light" ? "dark" : "light";
    state.telemetry.players[playerColor].capturesMade += 1;
    state.telemetry.players[opponentColor].capturesSuffered += 1;
  }
  if (targetCoord && isWarZone(targetCoord.row, targetCoord.col)) {
    state.telemetry.players[playerColor].contestedTilesLandedCount += 1;
  }
  updateComebackTelemetry(state);
  state.revision += 1;
  logger.debug("Applied move for %s (revision %d)", userId, state.revision);
  broadcastSnapshot(dispatcher, state, matchId);
  if (state.gameState.winner) {
    awardWinnerProgression(logger, nk, dispatcher, state, matchId);
    processCompletedMatchSummaries(logger, nk, state, matchId);
  }
}
function awardWinnerProgression(logger, nk, dispatcher, state, matchId) {
  const winnerColor = state.gameState.winner;
  if (!winnerColor) {
    return;
  }
  const winnerEntry = Object.entries(state.assignments).find(([, color]) => color === winnerColor);
  if (!winnerEntry) {
    logger.warn("Match %s ended with winner color %s but no assigned user was found.", matchId, winnerColor);
    return;
  }
  const [winnerUserId] = winnerEntry;
  try {
    const awardResponse = awardXpForMatchWin(nk, logger, {
      userId: winnerUserId,
      matchId,
      source: "pvp_win"
    });
    if (awardResponse.duplicate) {
      return;
    }
    const winnerPresence = state.presences[winnerUserId];
    if (!winnerPresence) {
      logger.info(
        "Progression updated for winner %s on match %s, but no live presence was available for notification.",
        winnerUserId,
        matchId
      );
      return;
    }
    dispatcher.broadcastMessage(
      MatchOpCode.PROGRESSION_AWARD,
      encodePayload(createProgressionAwardNotification(awardResponse)),
      [winnerPresence]
    );
  } catch (error) {
    logger.error(
      "Failed to award progression for winner %s on match %s: %s",
      winnerUserId,
      matchId,
      error instanceof Error ? error.message : String(error)
    );
  }
}
function processCompletedMatchSummaries(logger, nk, state, matchId) {
  Object.entries(state.assignments).forEach(([playerUserId, playerColor]) => {
    try {
      const summary = buildPlayerMatchSummary(state, matchId, playerUserId, playerColor);
      processCompletedMatch(nk, logger, summary);
    } catch (error) {
      logger.error(
        "Failed to process challenge summary for user %s on match %s: %s",
        playerUserId,
        matchId,
        error instanceof Error ? error.message : String(error)
      );
    }
  });
}
function sendError(dispatcher, state, userId, code, message) {
  const target = state.presences[userId];
  if (!target) {
    return;
  }
  dispatcher.broadcastMessage(
    MatchOpCode.SERVER_ERROR,
    encodePayload({
      type: "server_error",
      code,
      message,
      revision: state.revision
    }),
    [target]
  );
}
function broadcastSnapshot(dispatcher, state, matchId) {
  const payload = {
    type: "state_snapshot",
    matchId,
    revision: state.revision,
    gameState: state.gameState,
    assignments: state.assignments
  };
  dispatcher.broadcastMessage(MatchOpCode.STATE_SNAPSHOT, encodePayload(payload));
}
var runtimeGlobals = {
  InitModule,
  rpcAuthLinkCustom,
  rpcMatchmakerAdd,
  rpcPresenceHeartbeat,
  rpcPresenceCount,
  matchmakerMatched,
  matchInit,
  matchJoinAttempt,
  matchJoin,
  matchLeave,
  matchLoop,
  matchTerminate,
  matchSignal
};
Object.assign(globalThis, runtimeGlobals);
