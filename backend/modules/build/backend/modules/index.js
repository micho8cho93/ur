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

// logic/pathVariants.ts
var DEFAULT_PATH_LIGHT = [
  { row: 2, col: 3 },
  { row: 2, col: 2 },
  { row: 2, col: 1 },
  { row: 2, col: 0 },
  { row: 1, col: 0 },
  { row: 1, col: 1 },
  { row: 1, col: 2 },
  { row: 1, col: 3 },
  { row: 1, col: 4 },
  { row: 1, col: 5 },
  { row: 1, col: 6 },
  { row: 1, col: 7 },
  { row: 2, col: 7 },
  { row: 2, col: 6 }
];
var DEFAULT_PATH_DARK = [
  { row: 0, col: 3 },
  { row: 0, col: 2 },
  { row: 0, col: 1 },
  { row: 0, col: 0 },
  { row: 1, col: 0 },
  { row: 1, col: 1 },
  { row: 1, col: 2 },
  { row: 1, col: 3 },
  { row: 1, col: 4 },
  { row: 1, col: 5 },
  { row: 1, col: 6 },
  { row: 1, col: 7 },
  { row: 0, col: 7 },
  { row: 0, col: 6 }
];
var FULL_PATH_LIGHT = [
  { row: 2, col: 3 },
  { row: 2, col: 2 },
  { row: 2, col: 1 },
  { row: 2, col: 0 },
  { row: 1, col: 0 },
  { row: 1, col: 1 },
  { row: 1, col: 2 },
  { row: 1, col: 3 },
  { row: 1, col: 4 },
  { row: 1, col: 5 },
  { row: 1, col: 6 },
  { row: 0, col: 6 },
  { row: 0, col: 7 },
  { row: 1, col: 7 },
  { row: 2, col: 7 },
  { row: 2, col: 6 }
];
var FULL_PATH_DARK = [
  { row: 0, col: 3 },
  { row: 0, col: 2 },
  { row: 0, col: 1 },
  { row: 0, col: 0 },
  { row: 1, col: 0 },
  { row: 1, col: 1 },
  { row: 1, col: 2 },
  { row: 1, col: 3 },
  { row: 1, col: 4 },
  { row: 1, col: 5 },
  { row: 1, col: 6 },
  { row: 2, col: 6 },
  { row: 2, col: 7 },
  { row: 1, col: 7 },
  { row: 0, col: 7 },
  { row: 0, col: 6 }
];
var DEFAULT_PATH_VARIANT = "default";
var PATH_VARIANT_DEFINITIONS = {
  default: {
    id: "default",
    light: DEFAULT_PATH_LIGHT,
    dark: DEFAULT_PATH_DARK,
    pathLength: DEFAULT_PATH_LIGHT.length
  },
  "full-path": {
    id: "full-path",
    light: FULL_PATH_LIGHT,
    dark: FULL_PATH_DARK,
    pathLength: FULL_PATH_LIGHT.length
  }
};
var getPathVariantDefinition = (variant = DEFAULT_PATH_VARIANT) => PATH_VARIANT_DEFINITIONS[variant];
var getPathForColor = (variant = DEFAULT_PATH_VARIANT, color) => color === "light" ? PATH_VARIANT_DEFINITIONS[variant].light : PATH_VARIANT_DEFINITIONS[variant].dark;
var getPathLength = (variant = DEFAULT_PATH_VARIANT) => PATH_VARIANT_DEFINITIONS[variant].pathLength;
var getPathCoord = (variant = DEFAULT_PATH_VARIANT, color, index) => {
  var _a;
  if (index < 0 || index >= getPathLength(variant)) {
    return null;
  }
  return (_a = getPathForColor(variant, color)[index]) != null ? _a : null;
};

// logic/constants.ts
var ROSETTES = [
  { row: 0, col: 0 },
  { row: 2, col: 0 },
  { row: 1, col: 3 },
  // The central war rosette
  { row: 0, col: 6 },
  { row: 2, col: 6 }
];
var DEFAULT_PATH_DEFINITION = getPathVariantDefinition(DEFAULT_PATH_VARIANT);
var PATH_LIGHT = DEFAULT_PATH_DEFINITION.light;
var PATH_DARK = DEFAULT_PATH_DEFINITION.dark;
var PATH_LENGTH = DEFAULT_PATH_DEFINITION.pathLength;
var isRosette = (r, c) => ROSETTES.some((coord) => coord.row === r && coord.col === c);
var isWarZone = (r, c) => r === 1;

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
  private_pvp_win: {
    amount: 25,
    description: "Private PvP win reward."
  },
  bot_win: {
    amount: 50,
    description: "Authenticated standard bot win reward."
  },
  practice_1_piece_win: {
    amount: 10,
    description: "Authenticated 1-piece practice win reward."
  },
  practice_3_pieces_win: {
    amount: 20,
    description: "Authenticated 3-piece practice win reward."
  },
  practice_5_pieces_win: {
    amount: 30,
    description: "Authenticated 5-piece practice win reward."
  },
  practice_extended_path_win: {
    amount: 60,
    description: "Authenticated extended-path practice win reward."
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

// logic/matchConfigs.ts
var STANDARD_MATCH_CONFIG = {
  modeId: "standard",
  displayName: "Quick Play",
  pieceCountPerSide: 7,
  rulesVariant: "standard",
  allowsXp: true,
  allowsOnline: true,
  allowsChallenges: true,
  allowsCoins: true,
  allowsRankedStats: true,
  offlineWinRewardSource: "bot_win",
  opponentType: "bot",
  pathVariant: "default",
  isPracticeMode: false
};
var GAME_MODE_MATCH_CONFIGS = [
  {
    modeId: "gameMode_1_piece",
    displayName: "1 Piece",
    pieceCountPerSide: 1,
    rulesVariant: "standard",
    allowsXp: true,
    allowsOnline: false,
    allowsChallenges: false,
    allowsCoins: false,
    allowsRankedStats: false,
    offlineWinRewardSource: "practice_1_piece_win",
    opponentType: "bot",
    pathVariant: "default",
    isPracticeMode: true,
    selectionSubtitle: "Bot match with 1 piece each"
  },
  {
    modeId: "gameMode_3_pieces",
    displayName: "3 Pieces",
    pieceCountPerSide: 3,
    rulesVariant: "standard",
    allowsXp: true,
    allowsOnline: false,
    allowsChallenges: false,
    allowsCoins: false,
    allowsRankedStats: false,
    offlineWinRewardSource: "practice_3_pieces_win",
    opponentType: "bot",
    pathVariant: "default",
    isPracticeMode: true,
    selectionSubtitle: "Bot match with 3 pieces each"
  },
  {
    modeId: "gameMode_5_pieces",
    displayName: "5 Pieces",
    pieceCountPerSide: 5,
    rulesVariant: "standard",
    allowsXp: true,
    allowsOnline: false,
    allowsChallenges: false,
    allowsCoins: false,
    allowsRankedStats: false,
    offlineWinRewardSource: "practice_5_pieces_win",
    opponentType: "bot",
    pathVariant: "default",
    isPracticeMode: true,
    selectionSubtitle: "Bot match with 5 pieces each"
  },
  {
    modeId: "gameMode_full_path",
    displayName: "Extended Path",
    pieceCountPerSide: 7,
    rulesVariant: "standard",
    allowsXp: true,
    allowsOnline: false,
    allowsChallenges: false,
    allowsCoins: false,
    allowsRankedStats: false,
    offlineWinRewardSource: "practice_extended_path_win",
    opponentType: "bot",
    pathVariant: "full-path",
    isPracticeMode: true,
    selectionSubtitle: "Bot match with 7 pieces each using the extended-path rules"
  }
];
var MATCH_CONFIGS = {
  standard: STANDARD_MATCH_CONFIG,
  gameMode_1_piece: GAME_MODE_MATCH_CONFIGS[0],
  gameMode_3_pieces: GAME_MODE_MATCH_CONFIGS[1],
  gameMode_5_pieces: GAME_MODE_MATCH_CONFIGS[2],
  gameMode_full_path: GAME_MODE_MATCH_CONFIGS[3]
};
var DEFAULT_MATCH_CONFIG = STANDARD_MATCH_CONFIG;
var isMatchModeId = (value) => typeof value === "string" && value in MATCH_CONFIGS;
var getMatchConfig = (modeId) => modeId && isMatchModeId(modeId) ? MATCH_CONFIGS[modeId] : DEFAULT_MATCH_CONFIG;

// logic/engine.ts
var INITIAL_PIECE_COUNT = DEFAULT_MATCH_CONFIG.pieceCountPerSide;
var createPlayer = (color, pieceCountPerSide) => ({
  id: color,
  color,
  pieces: Array.from({ length: pieceCountPerSide }).map((_, i) => ({
    id: `${color}-${i}`,
    owner: color,
    position: -1,
    isFinished: false
  })),
  capturedCount: 0,
  finishedCount: 0
});
var createInitialState = (matchConfig = DEFAULT_MATCH_CONFIG) => ({
  currentTurn: "light",
  rollValue: null,
  phase: "rolling",
  matchConfig,
  light: createPlayer("light", matchConfig.pieceCountPerSide),
  dark: createPlayer("dark", matchConfig.pieceCountPerSide),
  winner: null,
  history: []
});
var rollDice = () => {
  let sum = 0;
  for (let i = 0; i < 4; i++) {
    if (Math.random() >= 0.5) sum++;
  }
  return sum;
};
var getValidMoves = (state, roll) => {
  if (roll === 0) return [];
  const player = state[state.currentTurn];
  const opponent = state[state.currentTurn === "light" ? "dark" : "light"];
  const moves = [];
  const processedPositions = /* @__PURE__ */ new Set();
  const pathLength = getPathLength(state.matchConfig.pathVariant);
  for (const piece of player.pieces) {
    if (piece.isFinished) continue;
    if (piece.position === -1 && processedPositions.has(-1)) continue;
    if (piece.position === -1) processedPositions.add(-1);
    const targetIndex = piece.position + roll;
    if (targetIndex > pathLength) continue;
    if (targetIndex === pathLength) {
      moves.push({ pieceId: piece.id, fromIndex: piece.position, toIndex: targetIndex });
      continue;
    }
    const myPieceAtTarget = player.pieces.find((p) => p.position === targetIndex && !p.isFinished);
    if (myPieceAtTarget) continue;
    const targetCoord = getPathCoord(state.matchConfig.pathVariant, player.color, targetIndex);
    if (!targetCoord) continue;
    const isShared = isWarZone(targetCoord.row, targetCoord.col);
    const opponentPiece = opponent.pieces.find((p) => {
      if (p.isFinished || p.position === -1) return false;
      const opCoord = getPathCoord(state.matchConfig.pathVariant, opponent.color, p.position);
      if (!opCoord) return false;
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
  const pathLength = getPathLength(newState.matchConfig.pathVariant);
  const piece = player.pieces.find((p) => p.id === move.pieceId);
  piece.position = move.toIndex;
  if (move.toIndex === pathLength) {
    piece.isFinished = true;
    player.finishedCount++;
  }
  if (move.toIndex < pathLength) {
    const targetCoord = getPathCoord(newState.matchConfig.pathVariant, player.color, move.toIndex);
    if (!targetCoord) {
      throw new Error(`Missing path coordinate for ${player.color} at index ${move.toIndex}.`);
    }
    const opponentPiece = opponent.pieces.find((p) => {
      if (p.isFinished || p.position === -1) return false;
      const opCoord = getPathCoord(newState.matchConfig.pathVariant, opponent.color, p.position);
      if (!opCoord) return false;
      return opCoord.row === targetCoord.row && opCoord.col === targetCoord.col;
    });
    if (opponentPiece) {
      opponentPiece.position = -1;
      player.capturedCount++;
      newState.history.push(`${player.color} captured ${opponent.color}`);
    }
  }
  let isRosetteLanding = false;
  if (move.toIndex < pathLength) {
    const coord = getPathCoord(newState.matchConfig.pathVariant, player.color, move.toIndex);
    if (coord && isRosette(coord.row, coord.col)) {
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
  if (player.finishedCount >= newState.matchConfig.pieceCountPerSide) {
    newState.winner = player.color;
    newState.phase = "ended";
  }
  return newState;
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
  const isKnownRewardSource = (candidate) => typeof candidate === "string" && (candidate === "challenge_completion" || candidate in XP_SOURCE_CONFIG);
  const normalizedSource = isKnownRewardSource(source) ? source : null;
  if (!userId || !ledgerKey || !sourceId || !awardedAt || !normalizedSource || typeof progression !== "object" || progression === null) {
    return null;
  }
  return {
    userId,
    ledgerKey,
    source: normalizedSource,
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

// shared/elo.ts
var DEFAULT_ELO_RATING = 1200;
var PROVISIONAL_RATED_GAMES = 10;
var PROVISIONAL_K_FACTOR = 40;
var ESTABLISHED_K_FACTOR = 24;
var ELO_LEADERBOARD_ID = "elo_global";
var sanitizeRatedGameCount = (value) => {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.floor(value));
};
var sanitizeEloRating = (value) => {
  if (!Number.isFinite(value)) {
    return DEFAULT_ELO_RATING;
  }
  return Math.round(value);
};
var isProvisionalEloPlayer = (ratedGames) => sanitizeRatedGameCount(ratedGames) < PROVISIONAL_RATED_GAMES;
var getEloKFactor = (ratedGames) => isProvisionalEloPlayer(ratedGames) ? PROVISIONAL_K_FACTOR : ESTABLISHED_K_FACTOR;
var createDefaultEloProfile = (userId, usernameDisplay, timestamp = (/* @__PURE__ */ new Date()).toISOString()) => ({
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
  updatedAt: timestamp
});
var calculateExpectedEloScore = (playerRating, opponentRating) => 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
var computeEloRatingUpdate = (params) => {
  var _a, _b, _c, _d;
  const playerAOldRating = sanitizeEloRating(params.playerARating);
  const playerBOldRating = sanitizeEloRating(params.playerBRating);
  const playerAOldRatedGames = sanitizeRatedGameCount(params.playerARatedGames);
  const playerBOldRatedGames = sanitizeRatedGameCount(params.playerBRatedGames);
  const playerAOldRatedWins = sanitizeRatedGameCount((_a = params.playerARatedWins) != null ? _a : 0);
  const playerAOldRatedLosses = sanitizeRatedGameCount((_b = params.playerARatedLosses) != null ? _b : 0);
  const playerBOldRatedWins = sanitizeRatedGameCount((_c = params.playerBRatedWins) != null ? _c : 0);
  const playerBOldRatedLosses = sanitizeRatedGameCount((_d = params.playerBRatedLosses) != null ? _d : 0);
  const playerAKFactor = getEloKFactor(playerAOldRatedGames);
  const playerBKFactor = getEloKFactor(playerBOldRatedGames);
  const playerAExpectedScore = calculateExpectedEloScore(playerAOldRating, playerBOldRating);
  const playerBExpectedScore = calculateExpectedEloScore(playerBOldRating, playerAOldRating);
  const playerAActualScore = params.playerAOutcome === "win" ? 1 : 0;
  const playerBActualScore = playerAActualScore === 1 ? 0 : 1;
  const playerANewRating = sanitizeEloRating(
    playerAOldRating + playerAKFactor * (playerAActualScore - playerAExpectedScore)
  );
  const playerBNewRating = sanitizeEloRating(
    playerBOldRating + playerBKFactor * (playerBActualScore - playerBExpectedScore)
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
      provisional: isProvisionalEloPlayer(playerANewRatedGames)
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
      provisional: isProvisionalEloPlayer(playerBNewRatedGames)
    }
  };
};

// shared/usernameOnboarding.ts
var USERNAME_MIN_LENGTH = 3;
var USERNAME_MAX_LENGTH = 16;
var USERNAME_ALLOWED_PATTERN = /^[A-Za-z0-9_]+$/;
var normalizeUsernameInput = (input) => {
  const trimmed = input.trim();
  return {
    input,
    trimmed,
    display: trimmed,
    canonical: trimmed.toLowerCase()
  };
};
var validateUsername = (input) => {
  const normalized = normalizeUsernameInput(input);
  if (normalized.trimmed.length === 0) {
    return __spreadProps(__spreadValues({}, normalized), {
      isValid: false,
      errorMessage: "Username is required."
    });
  }
  if (normalized.trimmed.length < USERNAME_MIN_LENGTH || normalized.trimmed.length > USERNAME_MAX_LENGTH) {
    return __spreadProps(__spreadValues({}, normalized), {
      isValid: false,
      errorMessage: "Username must be 3-16 characters long."
    });
  }
  if (!USERNAME_ALLOWED_PATTERN.test(normalized.trimmed)) {
    return __spreadProps(__spreadValues({}, normalized), {
      isValid: false,
      errorMessage: "Username can only contain letters, numbers, and underscores."
    });
  }
  return __spreadProps(__spreadValues({}, normalized), {
    isValid: true,
    errorMessage: null
  });
};
var sanitizeUsernameSuggestionBase = (input) => {
  const trimmed = input.trim();
  if (!trimmed) {
    return "";
  }
  return trimmed.replace(/[\s-]+/g, "_").replace(/[^A-Za-z0-9_]/g, "").replace(/_+/g, "_").replace(/^_+|_+$/g, "").slice(0, USERNAME_MAX_LENGTH);
};

// backend/modules/usernameOnboarding.ts
var SYSTEM_USER_ID = "00000000-0000-0000-0000-000000000000";
var RPC_GET_USERNAME_ONBOARDING_STATUS = "get_username_onboarding_status";
var RPC_CLAIM_USERNAME = "claim_username";
var USERNAME_PROFILE_COLLECTION = "user_profile";
var USERNAME_PROFILE_KEY = "profile";
var USERNAME_CANONICAL_INDEX_COLLECTION = "username_canonical_index";
var FALLBACK_SUGGESTION_BASES = ["Rosette", "Lapis", "Sumer", "Reed", "RoyalUr"];
var readStringField2 = (value, keys) => {
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
var readBooleanField = (value, keys) => {
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
var createDefaultUsernameProfile = (userId, now) => ({
  userId,
  usernameDisplay: null,
  usernameCanonical: null,
  onboardingComplete: false,
  authProvider: "google",
  createdAt: now,
  updatedAt: now
});
var normalizeUsernameProfile = (rawValue, userId, fallbackTimestamp = (/* @__PURE__ */ new Date()).toISOString()) => {
  var _a, _b;
  const defaults = createDefaultUsernameProfile(userId, fallbackTimestamp);
  const usernameDisplay = readStringField2(rawValue, ["usernameDisplay", "username_display"]);
  const usernameCanonical = readStringField2(rawValue, ["usernameCanonical", "username_canonical"]);
  const createdAt = (_a = readStringField2(rawValue, ["createdAt", "created_at"])) != null ? _a : defaults.createdAt;
  const updatedAt = (_b = readStringField2(rawValue, ["updatedAt", "updated_at"])) != null ? _b : defaults.updatedAt;
  const onboardingComplete = readBooleanField(rawValue, ["onboardingComplete", "onboarding_complete"]);
  const hasValidUsername = Boolean(usernameDisplay && usernameCanonical);
  return {
    userId,
    usernameDisplay: usernameDisplay != null ? usernameDisplay : null,
    usernameCanonical: usernameCanonical ? usernameCanonical.toLowerCase() : null,
    onboardingComplete: Boolean(onboardingComplete && hasValidUsername),
    authProvider: "google",
    createdAt,
    updatedAt
  };
};
var normalizeUsernameClaimIndexRecord = (rawValue) => {
  const record = asRecord(rawValue);
  if (!record) {
    return null;
  }
  const userId = readStringField2(record, ["userId", "user_id"]);
  const usernameDisplay = readStringField2(record, ["usernameDisplay", "username_display"]);
  const usernameCanonical = readStringField2(record, ["usernameCanonical", "username_canonical"]);
  const claimedAt = readStringField2(record, ["claimedAt", "claimed_at"]);
  const updatedAt = readStringField2(record, ["updatedAt", "updated_at"]);
  if (!userId || !usernameDisplay || !usernameCanonical || !claimedAt || !updatedAt) {
    return null;
  }
  return {
    userId,
    usernameDisplay,
    usernameCanonical: usernameCanonical.toLowerCase(),
    claimedAt,
    updatedAt
  };
};
var readUsernameProfileObject = (nk, userId) => {
  const objects = nk.storageRead([
    {
      collection: USERNAME_PROFILE_COLLECTION,
      key: USERNAME_PROFILE_KEY,
      userId
    }
  ]);
  return findStorageObject(objects, USERNAME_PROFILE_COLLECTION, USERNAME_PROFILE_KEY, userId);
};
var readUsernameProfile = (nk, userId) => {
  const object = readUsernameProfileObject(nk, userId);
  return {
    object,
    profile: normalizeUsernameProfile(object == null ? void 0 : object.value, userId)
  };
};
var readUsernameCanonicalIndex = (nk, usernameCanonical) => {
  const objects = nk.storageRead([
    {
      collection: USERNAME_CANONICAL_INDEX_COLLECTION,
      key: usernameCanonical,
      userId: SYSTEM_USER_ID
    }
  ]);
  const object = findStorageObject(
    objects,
    USERNAME_CANONICAL_INDEX_COLLECTION,
    usernameCanonical,
    SYSTEM_USER_ID
  );
  return {
    object,
    record: normalizeUsernameClaimIndexRecord(object == null ? void 0 : object.value)
  };
};
var buildClaimUsernameError = (errorCode, errorMessage) => ({
  success: false,
  errorCode,
  errorMessage
});
var buildClaimUsernameSuccess = (usernameDisplay) => ({
  success: true,
  usernameDisplay,
  onboardingComplete: true
});
var parseStatusRequest = (payload) => {
  if (!payload) {
    return {};
  }
  const data = asRecord(JSON.parse(payload));
  if (!data) {
    return {};
  }
  return {
    displayNameHint: typeof data.displayNameHint === "string" ? data.displayNameHint : null,
    emailHint: typeof data.emailHint === "string" ? data.emailHint : null
  };
};
var parseClaimUsernameRequest = (payload) => {
  if (!payload) {
    return {
      username: ""
    };
  }
  const data = asRecord(JSON.parse(payload));
  return {
    username: typeof (data == null ? void 0 : data.username) === "string" ? data.username : ""
  };
};
var ensureUsernameProfile = (nk, userId) => {
  const existing = readUsernameProfile(nk, userId);
  if (existing.object) {
    return existing;
  }
  const createdAt = (/* @__PURE__ */ new Date()).toISOString();
  const nextProfile = createDefaultUsernameProfile(userId, createdAt);
  try {
    nk.storageWrite([
      {
        collection: USERNAME_PROFILE_COLLECTION,
        key: USERNAME_PROFILE_KEY,
        userId,
        value: nextProfile,
        version: "*",
        permissionRead: STORAGE_PERMISSION_NONE,
        permissionWrite: STORAGE_PERMISSION_NONE
      }
    ]);
  } catch (e) {
  }
  return readUsernameProfile(nk, userId);
};
var createDeterministicNumber = (input, digits = 3) => {
  let total = 0;
  for (let index = 0; index < input.length; index += 1) {
    total = (total * 33 + input.charCodeAt(index)) % 1e5;
  }
  const lowerBound = Math.pow(10, Math.max(1, digits) - 1);
  const range = Math.pow(10, Math.max(1, digits)) - lowerBound;
  const value = lowerBound + (range > 0 ? total % range : total % 10);
  return String(value);
};
var appendNumericSuffix = (base, suffix) => {
  const suffixValue = suffix.replace(/[^0-9]/g, "");
  if (!suffixValue) {
    return base.slice(0, USERNAME_MAX_LENGTH);
  }
  const trimmedBase = base.slice(0, Math.max(USERNAME_MIN_LENGTH, USERNAME_MAX_LENGTH - suffixValue.length));
  return `${trimmedBase}${suffixValue}`.slice(0, USERNAME_MAX_LENGTH);
};
var buildSuggestionBaseCandidates = (request, userId) => {
  var _a, _b, _c, _d, _e;
  const displayNameHints = [
    (_a = request.displayNameHint) != null ? _a : "",
    (_c = (_b = request.displayNameHint) == null ? void 0 : _b.split(/\s+/)[0]) != null ? _c : ""
  ];
  const emailHint = (_e = (_d = request.emailHint) == null ? void 0 : _d.split("@")[0]) != null ? _e : "";
  const fallbackBases = FALLBACK_SUGGESTION_BASES.map((base) => {
    const themedBase = sanitizeUsernameSuggestionBase(base);
    const suffix = createDeterministicNumber(`${userId}:${base}`, 3);
    return appendNumericSuffix(themedBase, suffix);
  });
  const rawCandidates = [
    ...displayNameHints,
    emailHint,
    ...FALLBACK_SUGGESTION_BASES,
    ...fallbackBases
  ];
  const deduped = /* @__PURE__ */ new Set();
  rawCandidates.forEach((candidate) => {
    const sanitized = sanitizeUsernameSuggestionBase(candidate);
    if (!sanitized) {
      return;
    }
    deduped.add(sanitized);
    if (sanitized.length < USERNAME_MIN_LENGTH) {
      deduped.add(sanitizeUsernameSuggestionBase(`Ur${sanitized}`));
    }
    deduped.add(appendNumericSuffix(sanitized, createDeterministicNumber(`${userId}:${sanitized}`, 3)));
    deduped.add(appendNumericSuffix(sanitized, createDeterministicNumber(`${sanitized}:${userId}`, 4)));
  });
  return [...deduped].filter((candidate) => validateUsername(candidate).isValid);
};
var isUsernameCanonicalAvailable = (nk, usernameCanonical, userId) => {
  const existing = readUsernameCanonicalIndex(nk, usernameCanonical).record;
  return !existing || existing.userId === userId;
};
var suggestAvailableUsername = (nk, request, userId) => {
  const candidates = buildSuggestionBaseCandidates(request, userId);
  for (const candidate of candidates) {
    const validation = validateUsername(candidate);
    if (!validation.isValid) {
      continue;
    }
    if (isUsernameCanonicalAvailable(nk, validation.canonical, userId)) {
      return validation.display;
    }
  }
  for (let attempt = 0; attempt < 200; attempt += 1) {
    const base = FALLBACK_SUGGESTION_BASES[attempt % FALLBACK_SUGGESTION_BASES.length];
    const suffix = createDeterministicNumber(`${userId}:${attempt}`, 4);
    const candidate = appendNumericSuffix(sanitizeUsernameSuggestionBase(base), suffix);
    const validation = validateUsername(candidate);
    if (validation.isValid && isUsernameCanonicalAvailable(nk, validation.canonical, userId)) {
      return validation.display;
    }
  }
  return "UrPlayer";
};
var getUsernameOnboardingProfile = (nk, userId) => readUsernameProfile(nk, userId).profile;
var requireCompletedUsernameOnboarding = (nk, userId) => {
  const { object, profile } = readUsernameProfile(nk, userId);
  if (!object || profile.onboardingComplete) {
    return;
  }
  throw new Error("Choose a username before accessing multiplayer or social features.");
};
var rpcGetUsernameOnboardingStatus = (ctx, logger, nk, payload) => {
  if (!ctx.userId) {
    throw new Error("Authentication required.");
  }
  const request = parseStatusRequest(payload);
  const { profile } = ensureUsernameProfile(nk, ctx.userId);
  const response = profile.onboardingComplete && profile.usernameDisplay ? {
    onboardingComplete: true,
    currentUsername: profile.usernameDisplay,
    suggestedUsername: null
  } : {
    onboardingComplete: false,
    currentUsername: null,
    suggestedUsername: suggestAvailableUsername(nk, request, ctx.userId)
  };
  logger.info("Username onboarding status requested for user %s (complete=%s).", ctx.userId, response.onboardingComplete);
  return JSON.stringify(response);
};
var rpcClaimUsername = (ctx, logger, nk, payload) => {
  var _a, _b, _c, _d;
  if (!ctx.userId) {
    throw new Error("Authentication required.");
  }
  const request = parseClaimUsernameRequest(payload);
  const validation = validateUsername(request.username);
  if (!validation.isValid) {
    return JSON.stringify(
      buildClaimUsernameError("INVALID_USERNAME", (_a = validation.errorMessage) != null ? _a : "Username is invalid.")
    );
  }
  for (let attempt = 1; attempt <= MAX_WRITE_ATTEMPTS; attempt += 1) {
    const objects = nk.storageRead([
      {
        collection: USERNAME_PROFILE_COLLECTION,
        key: USERNAME_PROFILE_KEY,
        userId: ctx.userId
      },
      {
        collection: USERNAME_CANONICAL_INDEX_COLLECTION,
        key: validation.canonical,
        userId: SYSTEM_USER_ID
      }
    ]);
    const profileObject = findStorageObject(objects, USERNAME_PROFILE_COLLECTION, USERNAME_PROFILE_KEY, ctx.userId);
    const indexObject = findStorageObject(
      objects,
      USERNAME_CANONICAL_INDEX_COLLECTION,
      validation.canonical,
      SYSTEM_USER_ID
    );
    const profile = normalizeUsernameProfile(profileObject == null ? void 0 : profileObject.value, ctx.userId);
    const existingIndexRecord = normalizeUsernameClaimIndexRecord(indexObject == null ? void 0 : indexObject.value);
    if (profile.onboardingComplete && profile.usernameDisplay && profile.usernameCanonical === validation.canonical) {
      return JSON.stringify(buildClaimUsernameSuccess(profile.usernameDisplay));
    }
    if (profile.onboardingComplete) {
      return JSON.stringify(
        buildClaimUsernameError("USERNAME_ALREADY_SET", "Your username has already been claimed.")
      );
    }
    if (existingIndexRecord && existingIndexRecord.userId !== ctx.userId) {
      return JSON.stringify(
        buildClaimUsernameError("USERNAME_TAKEN", "That username is already taken.")
      );
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const nextProfile = {
      userId: ctx.userId,
      usernameDisplay: validation.display,
      usernameCanonical: validation.canonical,
      onboardingComplete: true,
      authProvider: "google",
      createdAt: profile.createdAt,
      updatedAt: now
    };
    const nextIndexRecord = {
      userId: ctx.userId,
      usernameDisplay: validation.display,
      usernameCanonical: validation.canonical,
      claimedAt: (_b = existingIndexRecord == null ? void 0 : existingIndexRecord.claimedAt) != null ? _b : now,
      updatedAt: now
    };
    try {
      nk.storageWrite([
        {
          collection: USERNAME_PROFILE_COLLECTION,
          key: USERNAME_PROFILE_KEY,
          userId: ctx.userId,
          value: nextProfile,
          version: profileObject ? (_c = getStorageObjectVersion(profileObject)) != null ? _c : "" : "*",
          permissionRead: STORAGE_PERMISSION_NONE,
          permissionWrite: STORAGE_PERMISSION_NONE
        },
        {
          collection: USERNAME_CANONICAL_INDEX_COLLECTION,
          key: validation.canonical,
          userId: SYSTEM_USER_ID,
          value: nextIndexRecord,
          version: indexObject ? (_d = getStorageObjectVersion(indexObject)) != null ? _d : "" : "*",
          permissionRead: STORAGE_PERMISSION_NONE,
          permissionWrite: STORAGE_PERMISSION_NONE
        }
      ]);
      logger.info("User %s claimed username %s.", ctx.userId, validation.display);
      return JSON.stringify(buildClaimUsernameSuccess(validation.display));
    } catch (error) {
      logger.warn(
        "Username claim write attempt %d/%d failed for user %s (%s): %s",
        attempt,
        MAX_WRITE_ATTEMPTS,
        ctx.userId,
        validation.canonical,
        getErrorMessage(error)
      );
    }
  }
  return JSON.stringify(
    buildClaimUsernameError("SERVER_ERROR", "Unable to claim a username right now. Please try again.")
  );
};

// backend/modules/elo.ts
var SYSTEM_USER_ID2 = "00000000-0000-0000-0000-000000000000";
var ELO_PROFILE_COLLECTION = "elo_profiles";
var ELO_PROFILE_KEY = "profile";
var ELO_MATCH_RESULT_COLLECTION = "elo_match_results";
var DEFAULT_LEADERBOARD_PAGE_SIZE = 25;
var MAX_LEADERBOARD_PAGE_SIZE = 100;
var DEFAULT_HAYSTACK_SIZE = 11;
var RPC_GET_MY_RATING_PROFILE = "get_my_rating_profile";
var RPC_LIST_TOP_ELO_PLAYERS = "list_top_elo_players";
var RPC_GET_ELO_LEADERBOARD_AROUND_ME = "get_elo_leaderboard_around_me";
var readStringField3 = (value, keys) => {
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
var readNumberField2 = (value, keys) => {
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
var readBooleanField2 = (value, keys) => {
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
var getRequiredUsernameDisplay = (nk, userId) => {
  const profile = getUsernameOnboardingProfile(nk, userId);
  if (!profile.onboardingComplete || !profile.usernameDisplay) {
    throw new Error("Choose a username before accessing multiplayer or social features.");
  }
  return profile.usernameDisplay;
};
var normalizeEloProfile = (rawValue, userId, usernameDisplay, fallbackTimestamp = (/* @__PURE__ */ new Date()).toISOString()) => {
  var _a, _b, _c, _d, _e, _f;
  const defaults = createDefaultEloProfile(userId, usernameDisplay, fallbackTimestamp);
  const eloRating = sanitizeEloRating((_a = readNumberField2(rawValue, ["eloRating", "elo_rating"])) != null ? _a : defaults.eloRating);
  const ratedGames = sanitizeRatedGameCount(
    (_b = readNumberField2(rawValue, ["ratedGames", "rated_games"])) != null ? _b : defaults.ratedGames
  );
  const ratedWins = Math.min(
    ratedGames,
    sanitizeRatedGameCount((_c = readNumberField2(rawValue, ["ratedWins", "rated_wins"])) != null ? _c : defaults.ratedWins)
  );
  const ratedLosses = Math.min(
    ratedGames,
    sanitizeRatedGameCount((_d = readNumberField2(rawValue, ["ratedLosses", "rated_losses"])) != null ? _d : defaults.ratedLosses)
  );
  const createdAt = (_e = readStringField3(rawValue, ["createdAt", "created_at"])) != null ? _e : defaults.createdAt;
  const updatedAt = (_f = readStringField3(rawValue, ["updatedAt", "updated_at"])) != null ? _f : fallbackTimestamp;
  const lastRatedMatchId = readStringField3(rawValue, ["lastRatedMatchId", "last_rated_match_id"]);
  const lastRatedAt = readStringField3(rawValue, ["lastRatedAt", "last_rated_at"]);
  const sanitizedLosses = Math.min(ratedGames - ratedWins, ratedLosses);
  return {
    userId,
    usernameDisplay,
    eloRating,
    ratedGames,
    ratedWins,
    ratedLosses: sanitizedLosses,
    provisional: ratedGames < 10,
    lastRatedMatchId: lastRatedMatchId != null ? lastRatedMatchId : null,
    lastRatedAt: lastRatedAt != null ? lastRatedAt : null,
    createdAt,
    updatedAt
  };
};
var normalizeStoredEloProfile = (rawValue, userId) => {
  const usernameDisplay = readStringField3(rawValue, ["usernameDisplay", "username_display"]);
  if (!usernameDisplay) {
    return null;
  }
  return normalizeEloProfile(rawValue, userId, usernameDisplay);
};
var eloProfileNeedsRepair = (rawValue, normalized) => {
  var _a, _b, _c, _d, _e, _f;
  const rawRecord = asRecord(rawValue);
  if (!rawRecord) {
    return true;
  }
  return readStringField3(rawRecord, ["userId", "user_id"]) !== normalized.userId || readStringField3(rawRecord, ["usernameDisplay", "username_display"]) !== normalized.usernameDisplay || sanitizeEloRating((_a = readNumberField2(rawRecord, ["eloRating", "elo_rating"])) != null ? _a : normalized.eloRating) !== normalized.eloRating || sanitizeRatedGameCount((_b = readNumberField2(rawRecord, ["ratedGames", "rated_games"])) != null ? _b : normalized.ratedGames) !== normalized.ratedGames || sanitizeRatedGameCount((_c = readNumberField2(rawRecord, ["ratedWins", "rated_wins"])) != null ? _c : normalized.ratedWins) !== normalized.ratedWins || sanitizeRatedGameCount((_d = readNumberField2(rawRecord, ["ratedLosses", "rated_losses"])) != null ? _d : normalized.ratedLosses) !== normalized.ratedLosses || readBooleanField2(rawRecord, ["provisional"]) !== normalized.provisional || ((_e = readStringField3(rawRecord, ["lastRatedMatchId", "last_rated_match_id"])) != null ? _e : null) !== normalized.lastRatedMatchId || ((_f = readStringField3(rawRecord, ["lastRatedAt", "last_rated_at"])) != null ? _f : null) !== normalized.lastRatedAt || readStringField3(rawRecord, ["createdAt", "created_at"]) !== normalized.createdAt || readStringField3(rawRecord, ["updatedAt", "updated_at"]) !== normalized.updatedAt;
};
var writeEloProfile = (nk, userId, profile, version) => {
  nk.storageWrite([
    {
      collection: ELO_PROFILE_COLLECTION,
      key: ELO_PROFILE_KEY,
      userId,
      value: profile,
      version,
      permissionRead: STORAGE_PERMISSION_NONE,
      permissionWrite: STORAGE_PERMISSION_NONE
    }
  ]);
};
var readEloProfileObject = (nk, userId) => {
  const objects = nk.storageRead([
    {
      collection: ELO_PROFILE_COLLECTION,
      key: ELO_PROFILE_KEY,
      userId
    }
  ]);
  return findStorageObject(objects, ELO_PROFILE_COLLECTION, ELO_PROFILE_KEY, userId);
};
var ensureEloProfileObject = (nk, logger, userId) => {
  var _a;
  const usernameDisplay = getRequiredUsernameDisplay(nk, userId);
  for (let attempt = 1; attempt <= MAX_WRITE_ATTEMPTS; attempt += 1) {
    const existingObject = readEloProfileObject(nk, userId);
    if (existingObject) {
      const normalized = normalizeEloProfile(getStorageObjectValue(existingObject), userId, usernameDisplay);
      if (!eloProfileNeedsRepair(getStorageObjectValue(existingObject), normalized)) {
        return {
          object: existingObject,
          profile: normalized
        };
      }
      try {
        writeEloProfile(nk, userId, normalized, (_a = getStorageObjectVersion(existingObject)) != null ? _a : "");
        return {
          object: readEloProfileObject(nk, userId),
          profile: normalized
        };
      } catch (error) {
        logger.warn(
          "Elo profile repair attempt %d/%d failed for user %s: %s",
          attempt,
          MAX_WRITE_ATTEMPTS,
          userId,
          getErrorMessage(error)
        );
      }
      continue;
    }
    const nextProfile = createDefaultEloProfile(userId, usernameDisplay);
    try {
      writeEloProfile(nk, userId, nextProfile, "*");
      return {
        object: readEloProfileObject(nk, userId),
        profile: nextProfile
      };
    } catch (error) {
      logger.warn(
        "Elo profile init attempt %d/%d failed for user %s: %s",
        attempt,
        MAX_WRITE_ATTEMPTS,
        userId,
        getErrorMessage(error)
      );
    }
  }
  throw new Error(`Unable to initialize Elo rating profile for user ${userId}.`);
};
var buildEloLeaderboardMetadata = (profile) => ({
  usernameDisplay: profile.usernameDisplay,
  ratedGames: profile.ratedGames,
  ratedWins: profile.ratedWins,
  ratedLosses: profile.ratedLosses,
  provisional: profile.provisional
});
var buildLeaderboardEntryFromProfile = (profile, rank) => ({
  userId: profile.userId,
  usernameDisplay: profile.usernameDisplay,
  eloRating: profile.eloRating,
  ratedGames: profile.ratedGames,
  ratedWins: profile.ratedWins,
  ratedLosses: profile.ratedLosses,
  provisional: profile.provisional,
  rank
});
var getLeaderboardRecordRank = (record) => {
  const rank = readNumberField2(record, ["rank"]);
  return typeof rank === "number" ? rank : null;
};
var getLeaderboardRecordOwnerId = (record) => readStringField3(record, ["ownerId", "owner_id"]);
var getLeaderboardRecordScore = (record) => readNumberField2(record, ["score"]);
var getLeaderboardRecordMetadata = (record) => {
  const data = asRecord(record);
  return asRecord(data == null ? void 0 : data.metadata);
};
var getLeaderboardRecordUsername = (record) => readStringField3(record, ["username"]);
var syncEloLeaderboardRecord = (nk, logger, profile) => {
  try {
    const record = nk.leaderboardRecordWrite(
      ELO_LEADERBOARD_ID,
      profile.userId,
      profile.usernameDisplay,
      profile.eloRating,
      profile.ratedWins,
      buildEloLeaderboardMetadata(profile)
    );
    return getLeaderboardRecordRank(record);
  } catch (error) {
    logger.error(
      "Failed to write Elo leaderboard record for user %s: %s",
      profile.userId,
      getErrorMessage(error)
    );
    return null;
  }
};
var syncEloLeaderboardRecords = (nk, logger, profiles) => profiles.reduce(
  (entries, profile) => {
    entries[profile.userId] = syncEloLeaderboardRecord(nk, logger, profile);
    return entries;
  },
  {}
);
var readOwnerLeaderboardRecord = (nk, userId) => {
  const result = nk.leaderboardRecordsList(ELO_LEADERBOARD_ID, [userId], 1, "", 0);
  const ownerRecords = Array.isArray(result.ownerRecords) ? result.ownerRecords : Array.isArray(result.owner_records) ? result.owner_records : [];
  return ownerRecords.length > 0 ? ownerRecords[0] : null;
};
var clampLimit = (value, fallback) => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }
  return Math.max(1, Math.min(MAX_LEADERBOARD_PAGE_SIZE, Math.floor(value)));
};
var parseLeaderboardRequest = (payload) => {
  if (!payload) {
    return {};
  }
  const data = asRecord(JSON.parse(payload));
  return {
    limit: typeof (data == null ? void 0 : data.limit) === "number" ? data.limit : null,
    cursor: typeof (data == null ? void 0 : data.cursor) === "string" ? data.cursor : null
  };
};
var parseAroundMeRequest = (payload) => {
  if (!payload) {
    return {};
  }
  const data = asRecord(JSON.parse(payload));
  return {
    limit: typeof (data == null ? void 0 : data.limit) === "number" ? data.limit : null
  };
};
var normalizeStoredEloMatchParticipantResult = (value) => {
  const userId = readStringField3(value, ["userId", "user_id"]);
  const usernameDisplay = readStringField3(value, ["usernameDisplay", "username_display"]);
  const oldRating = readNumberField2(value, ["oldRating", "old_rating"]);
  const newRating = readNumberField2(value, ["newRating", "new_rating"]);
  const delta = readNumberField2(value, ["delta"]);
  const ratedGames = readNumberField2(value, ["ratedGames", "rated_games"]);
  const ratedWins = readNumberField2(value, ["ratedWins", "rated_wins"]);
  const ratedLosses = readNumberField2(value, ["ratedLosses", "rated_losses"]);
  const provisional = readBooleanField2(value, ["provisional"]);
  const lastRatedMatchId = readStringField3(value, ["lastRatedMatchId", "last_rated_match_id"]);
  const lastRatedAt = readStringField3(value, ["lastRatedAt", "last_rated_at"]);
  if (!userId || !usernameDisplay || oldRating === null || newRating === null || delta === null || ratedGames === null || ratedWins === null || ratedLosses === null || provisional === null || !lastRatedMatchId || !lastRatedAt) {
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
    lastRatedAt
  };
};
var normalizeStoredEloMatchResultRecord = (value) => {
  const record = asRecord(value);
  if (!record) {
    return null;
  }
  const matchId = readStringField3(record, ["matchId", "match_id"]);
  const leaderboardId = readStringField3(record, ["leaderboardId", "leaderboard_id"]);
  const processedAt = readStringField3(record, ["processedAt", "processed_at"]);
  const winnerUserId = readStringField3(record, ["winnerUserId", "winner_user_id"]);
  const loserUserId = readStringField3(record, ["loserUserId", "loser_user_id"]);
  const rawPlayerResults = Array.isArray(record.playerResults) ? record.playerResults : Array.isArray(record.player_results) ? record.player_results : [];
  const playerResults = rawPlayerResults.map((playerResult) => normalizeStoredEloMatchParticipantResult(playerResult)).filter((playerResult) => Boolean(playerResult));
  if (!matchId || !leaderboardId || !processedAt || !winnerUserId || !loserUserId || playerResults.length !== 2) {
    return null;
  }
  return {
    matchId,
    leaderboardId,
    processedAt,
    winnerUserId,
    loserUserId,
    playerResults
  };
};
var readProcessedMatchResultObject = (nk, matchId) => {
  const objects = nk.storageRead([
    {
      collection: ELO_MATCH_RESULT_COLLECTION,
      key: matchId,
      userId: SYSTEM_USER_ID2
    }
  ]);
  return findStorageObject(objects, ELO_MATCH_RESULT_COLLECTION, matchId, SYSTEM_USER_ID2);
};
var getProcessedMatchPlayerResult = (result, userId) => {
  var _a;
  return (_a = result.playerResults.find((playerResult) => playerResult.userId === userId)) != null ? _a : null;
};
var createMatchParticipantView = (playerResult, rank) => ({
  userId: playerResult.userId,
  usernameDisplay: playerResult.usernameDisplay,
  oldRating: playerResult.oldRating,
  newRating: playerResult.newRating,
  delta: playerResult.delta,
  ratedGames: playerResult.ratedGames,
  ratedWins: playerResult.ratedWins,
  ratedLosses: playerResult.ratedLosses,
  provisional: playerResult.provisional,
  rank
});
var createEloRatingChangeNotification = (result, userId, ranksByUserId, duplicate = false) => {
  var _a, _b;
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
    player: createMatchParticipantView(playerResult, (_a = ranksByUserId[playerResult.userId]) != null ? _a : null),
    opponent: createMatchParticipantView(opponentResult, (_b = ranksByUserId[opponentResult.userId]) != null ? _b : null)
  };
};
var syncLeaderboardFromProcessedMatch = (nk, logger, result) => syncEloLeaderboardRecords(
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
    updatedAt: playerResult.lastRatedAt
  }))
);
var ensureEloLeaderboard = (nk, logger) => {
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
        version: 1
      },
      true
    );
  } catch (error) {
    logger.warn("Unable to ensure Elo leaderboard exists: %s", getErrorMessage(error));
  }
};
var processRankedMatchResult = (nk, logger, params) => {
  var _a, _b;
  if (!params.ranked || params.privateMatch || params.botMatch || params.casualMatch || params.experimentalMode) {
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
        ranksByUserId: syncLeaderboardFromProcessedMatch(nk, logger, existingProcessed)
      };
    }
    const winnerProfileState = ensureEloProfileObject(nk, logger, winnerUserId);
    const loserProfileState = ensureEloProfileObject(nk, logger, loserUserId);
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const computation = computeEloRatingUpdate({
      playerARating: winnerProfileState.profile.eloRating,
      playerBRating: loserProfileState.profile.eloRating,
      playerAOutcome: "win",
      playerARatedGames: winnerProfileState.profile.ratedGames,
      playerBRatedGames: loserProfileState.profile.ratedGames,
      playerARatedWins: winnerProfileState.profile.ratedWins,
      playerARatedLosses: winnerProfileState.profile.ratedLosses,
      playerBRatedWins: loserProfileState.profile.ratedWins,
      playerBRatedLosses: loserProfileState.profile.ratedLosses
    });
    const nextWinnerProfile = __spreadProps(__spreadValues({}, winnerProfileState.profile), {
      eloRating: computation.playerA.newRating,
      ratedGames: computation.playerA.ratedGames,
      ratedWins: computation.playerA.ratedWins,
      ratedLosses: computation.playerA.ratedLosses,
      provisional: computation.playerA.provisional,
      lastRatedMatchId: matchId,
      lastRatedAt: now,
      updatedAt: now
    });
    const nextLoserProfile = __spreadProps(__spreadValues({}, loserProfileState.profile), {
      eloRating: computation.playerB.newRating,
      ratedGames: computation.playerB.ratedGames,
      ratedWins: computation.playerB.ratedWins,
      ratedLosses: computation.playerB.ratedLosses,
      provisional: computation.playerB.provisional,
      lastRatedMatchId: matchId,
      lastRatedAt: now,
      updatedAt: now
    });
    const processedRecord = {
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
          lastRatedAt: now
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
          lastRatedAt: now
        }
      ]
    };
    try {
      nk.storageWrite([
        {
          collection: ELO_PROFILE_COLLECTION,
          key: ELO_PROFILE_KEY,
          userId: nextWinnerProfile.userId,
          value: nextWinnerProfile,
          version: winnerProfileState.object ? (_a = getStorageObjectVersion(winnerProfileState.object)) != null ? _a : "" : "*",
          permissionRead: STORAGE_PERMISSION_NONE,
          permissionWrite: STORAGE_PERMISSION_NONE
        },
        {
          collection: ELO_PROFILE_COLLECTION,
          key: ELO_PROFILE_KEY,
          userId: nextLoserProfile.userId,
          value: nextLoserProfile,
          version: loserProfileState.object ? (_b = getStorageObjectVersion(loserProfileState.object)) != null ? _b : "" : "*",
          permissionRead: STORAGE_PERMISSION_NONE,
          permissionWrite: STORAGE_PERMISSION_NONE
        },
        {
          collection: ELO_MATCH_RESULT_COLLECTION,
          key: matchId,
          userId: SYSTEM_USER_ID2,
          value: processedRecord,
          version: "*",
          permissionRead: STORAGE_PERMISSION_NONE,
          permissionWrite: STORAGE_PERMISSION_NONE
        }
      ]);
      logger.info(
        "Processed ranked Elo result for match %s (%s beat %s).",
        matchId,
        winnerUserId,
        loserUserId
      );
      return {
        duplicate: false,
        record: processedRecord,
        leaderboardId: ELO_LEADERBOARD_ID,
        matchId,
        playerResults: processedRecord.playerResults,
        ranksByUserId: syncEloLeaderboardRecords(nk, logger, [nextWinnerProfile, nextLoserProfile])
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
          ranksByUserId: syncLeaderboardFromProcessedMatch(nk, logger, refreshedProcessed)
        };
      }
      logger.warn(
        "Ranked Elo processing attempt %d/%d failed for match %s: %s",
        attempt,
        MAX_WRITE_ATTEMPTS,
        matchId,
        getErrorMessage(error)
      );
    }
  }
  throw new Error(`Unable to process ranked Elo result for match ${matchId}.`);
};
var readEloProfilesByUserId = (nk, userIds) => {
  if (userIds.length === 0) {
    return {};
  }
  const objects = nk.storageRead(
    userIds.map((userId) => ({
      collection: ELO_PROFILE_COLLECTION,
      key: ELO_PROFILE_KEY,
      userId
    }))
  );
  return userIds.reduce(
    (entries, userId) => {
      const object = findStorageObject(objects, ELO_PROFILE_COLLECTION, ELO_PROFILE_KEY, userId);
      const profile = normalizeStoredEloProfile(getStorageObjectValue(object), userId);
      if (profile) {
        entries[userId] = profile;
      }
      return entries;
    },
    {}
  );
};
var buildLeaderboardEntryFromRecord = (record, profile) => {
  var _a, _b, _c, _d, _e, _f;
  const userId = getLeaderboardRecordOwnerId(record);
  if (!userId) {
    return null;
  }
  if (profile) {
    return buildLeaderboardEntryFromProfile(profile, getLeaderboardRecordRank(record));
  }
  const metadata = getLeaderboardRecordMetadata(record);
  const usernameDisplay = (_b = (_a = readStringField3(metadata, ["usernameDisplay", "username_display"])) != null ? _a : getLeaderboardRecordUsername(record)) != null ? _b : "Unknown";
  const ratedGames = sanitizeRatedGameCount((_c = readNumberField2(metadata, ["ratedGames", "rated_games"])) != null ? _c : 0);
  const ratedWins = sanitizeRatedGameCount((_d = readNumberField2(metadata, ["ratedWins", "rated_wins"])) != null ? _d : 0);
  const ratedLosses = sanitizeRatedGameCount((_e = readNumberField2(metadata, ["ratedLosses", "rated_losses"])) != null ? _e : 0);
  const provisional = readBooleanField2(metadata, ["provisional"]);
  return {
    userId,
    usernameDisplay,
    eloRating: sanitizeEloRating((_f = getLeaderboardRecordScore(record)) != null ? _f : 1200),
    ratedGames,
    ratedWins,
    ratedLosses,
    provisional: typeof provisional === "boolean" ? provisional : ratedGames < 10,
    rank: getLeaderboardRecordRank(record)
  };
};
var normalizeLeaderboardListResponse = (result) => {
  const response = asRecord(result);
  const records = Array.isArray(response == null ? void 0 : response.records) ? response.records : [];
  const nextCursor = readStringField3(response, ["nextCursor", "next_cursor"]);
  const prevCursor = readStringField3(response, ["prevCursor", "prev_cursor"]);
  return {
    records,
    nextCursor: nextCursor != null ? nextCursor : null,
    prevCursor: prevCursor != null ? prevCursor : null
  };
};
var requireLeaderboardAccess = (nk, userId) => {
  getRequiredUsernameDisplay(nk, userId);
};
var rpcGetMyRatingProfile = (ctx, logger, nk, _payload) => {
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
    rank = rank != null ? rank : getLeaderboardRecordRank(ownerRecord);
  }
  const response = __spreadProps(__spreadValues({
    leaderboardId: ELO_LEADERBOARD_ID
  }, buildLeaderboardEntryFromProfile(profileState.profile, rank)), {
    lastRatedMatchId: profileState.profile.lastRatedMatchId,
    lastRatedAt: profileState.profile.lastRatedAt
  });
  return JSON.stringify(response);
};
var rpcListTopEloPlayers = (ctx, _logger, nk, payload) => {
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
    records.map((record) => getLeaderboardRecordOwnerId(record)).filter((ownerId) => Boolean(ownerId))
  );
  const response = {
    leaderboardId: ELO_LEADERBOARD_ID,
    records: records.map((record) => {
      var _a;
      const userId = getLeaderboardRecordOwnerId(record);
      return buildLeaderboardEntryFromRecord(record, userId ? (_a = profilesByUserId[userId]) != null ? _a : null : null);
    }).filter((record) => Boolean(record)),
    nextCursor,
    prevCursor
  };
  return JSON.stringify(response);
};
var rpcGetEloLeaderboardAroundMe = (ctx, logger, nk, payload) => {
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
  const rawResult = nk.leaderboardRecordsHaystack(ELO_LEADERBOARD_ID, ctx.userId, limit, 0);
  const { records } = normalizeLeaderboardListResponse(rawResult);
  const profilesByUserId = readEloProfilesByUserId(
    nk,
    records.map((record) => getLeaderboardRecordOwnerId(record)).filter((ownerId) => Boolean(ownerId))
  );
  const response = {
    leaderboardId: ELO_LEADERBOARD_ID,
    records: records.map((record) => {
      var _a;
      const userId = getLeaderboardRecordOwnerId(record);
      return buildLeaderboardEntryFromRecord(record, userId ? (_a = profilesByUserId[userId]) != null ? _a : null : null);
    }).filter((record) => Boolean(record))
  };
  return JSON.stringify(response);
};

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
    rewardXp: 50
  },
  {
    id: CHALLENGE_IDS.BEAT_EASY_BOT,
    name: "Beat the Easy Bot",
    description: "Win a completed game against the easy AI opponent.",
    type: "bot",
    rewardXp: 30
  },
  {
    id: CHALLENGE_IDS.FAST_FINISH,
    name: "Fast Finish",
    description: "Win a completed game in fewer than 100 total applied moves.",
    type: "match",
    rewardXp: 150
  },
  {
    id: CHALLENGE_IDS.SAFE_PLAY,
    name: "Safe Play",
    description: "Win a completed game without losing any pieces to captures.",
    type: "match",
    rewardXp: 150
  },
  {
    id: CHALLENGE_IDS.LUCKY_ROLL,
    name: "Lucky Roll",
    description: "Win a completed game after rolling the maximum value at least 3 times.",
    type: "match",
    rewardXp: 100
  },
  {
    id: CHALLENGE_IDS.HOME_STRETCH,
    name: "Home Stretch",
    description: "Win a completed game while making zero captures across the entire match.",
    type: "match",
    rewardXp: 150
  },
  {
    id: CHALLENGE_IDS.CAPTURE_MASTER,
    name: "Capture Master",
    description: "Capture at least 3 opponent pieces in a single completed game. Victory is not required.",
    type: "match",
    rewardXp: 150
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
    rewardXp: 100
  },
  {
    id: CHALLENGE_IDS.BEAT_HARD_BOT,
    name: "Beat the Hard Bot",
    description: "Win a completed game against the hard AI opponent.",
    type: "bot",
    rewardXp: 150
  },
  {
    id: CHALLENGE_IDS.BEAT_PERFECT_BOT,
    name: "Beat the Perfect Bot",
    description: "Win a completed game against the perfect AI opponent.",
    type: "bot",
    rewardXp: 250
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
  return isCompletedMatchSummary(payload.summary) && (typeof payload.tutorialId === "string" || payload.tutorialId === null || typeof payload.tutorialId === "undefined") && (typeof payload.modeId === "undefined" || payload.modeId === null || isMatchModeId(payload.modeId)) && (typeof payload.rewardMode === "undefined" || isCompletedBotMatchRewardMode(payload.rewardMode));
};
var getPieceProgressScore = (position, pathLength) => {
  if (position < 0) {
    return 0;
  }
  if (position >= pathLength) {
    return pathLength + 1;
  }
  return position + 1;
};
var calculateBoardProgressScore = (player, pathLength) => player.pieces.reduce((total, piece) => total + getPieceProgressScore(piece.position, pathLength), 0);
var calculateComebackCheckpoint = (state, playerColor) => {
  const opponentColor = playerColor === "light" ? "dark" : "light";
  const player = state[playerColor];
  const opponent = state[opponentColor];
  const reasons = [];
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
var readStringField4 = (value, keys) => {
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
      const completedAt = completed ? (_a2 = readStringField4(rawState, ["completedAt", "completed_at"])) != null ? _a2 : fallbackUpdatedAt : null;
      const completedMatchId = completed ? readStringField4(rawState, ["completedMatchId", "completed_match_id"]) : null;
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
    updatedAt: (_a = readStringField4(rawRecord, ["updatedAt", "updated_at"])) != null ? _a : fallbackUpdatedAt,
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
  const matchId = readStringField4(record, ["matchId", "match_id"]);
  const playerUserId = readStringField4(record, ["playerUserId", "player_user_id"]);
  const processedAt = readStringField4(record, ["processedAt", "processed_at"]);
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
  const modeId = isMatchModeId(requestPayload.modeId) ? requestPayload.modeId : "standard";
  const matchConfig = getMatchConfig(modeId);
  const requestedRewardMode = isCompletedBotMatchRewardMode(
    requestPayload.rewardMode
  ) ? requestPayload.rewardMode : "standard";
  const rewardMode = matchConfig.allowsChallenges ? requestedRewardMode : "base_win_only";
  const summary = __spreadProps(__spreadValues({}, requestPayload.summary), {
    playerUserId: ctx.userId
  });
  const progressionAward = summary.didWin ? awardXpForMatchWin(nk, logger, {
    userId: ctx.userId,
    matchId: summary.matchId,
    source: matchConfig.offlineWinRewardSource
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
  PROGRESSION_AWARD: 102,
  ELO_RATING_UPDATE: 103
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

// shared/privateMatchCode.ts
var PRIVATE_MATCH_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
var PRIVATE_MATCH_CODE_LENGTH = 8;
var PRIVATE_MATCH_CODE_CHARACTER_SET = new Set(PRIVATE_MATCH_CODE_ALPHABET.split(""));
var normalizePrivateMatchCodeInput = (value) => value.toUpperCase().split("").filter((character) => PRIVATE_MATCH_CODE_CHARACTER_SET.has(character)).join("").slice(0, PRIVATE_MATCH_CODE_LENGTH);
var isPrivateMatchCode = (value) => normalizePrivateMatchCodeInput(value) === value && value.length === PRIVATE_MATCH_CODE_LENGTH;
var generatePrivateMatchCode = (random = Math.random) => {
  var _a;
  let code = "";
  for (let index = 0; index < PRIVATE_MATCH_CODE_LENGTH; index += 1) {
    const characterIndex = Math.floor(random() * PRIVATE_MATCH_CODE_ALPHABET.length);
    code += (_a = PRIVATE_MATCH_CODE_ALPHABET[characterIndex]) != null ? _a : PRIVATE_MATCH_CODE_ALPHABET[0];
  }
  return code;
};

// backend/modules/index.ts
var TICK_RATE = 10;
var MAX_PLAYERS = 2;
var ONLINE_TTL_MS = 3e4;
var SYSTEM_USER_ID3 = "00000000-0000-0000-0000-000000000000";
var RPC_AUTH_LINK_CUSTOM = "auth_link_custom";
var RPC_GET_PROGRESSION_NAME = RPC_GET_PROGRESSION;
var RPC_GET_USER_XP_PROGRESS_NAME = RPC_GET_USER_XP_PROGRESS;
var RPC_GET_CHALLENGE_DEFINITIONS_NAME = RPC_GET_CHALLENGE_DEFINITIONS;
var RPC_GET_USER_CHALLENGE_PROGRESS_NAME = RPC_GET_USER_CHALLENGE_PROGRESS;
var RPC_SUBMIT_COMPLETED_BOT_MATCH_NAME = RPC_SUBMIT_COMPLETED_BOT_MATCH;
var RPC_MATCHMAKER_ADD = "matchmaker_add";
var RPC_CREATE_PRIVATE_MATCH = "create_private_match";
var RPC_JOIN_PRIVATE_MATCH = "join_private_match";
var RPC_GET_PRIVATE_MATCH_STATUS = "get_private_match_status";
var RPC_PRESENCE_HEARTBEAT = "presence_heartbeat";
var RPC_PRESENCE_COUNT = "presence_count";
var RPC_GET_USERNAME_ONBOARDING_STATUS_NAME = RPC_GET_USERNAME_ONBOARDING_STATUS;
var RPC_CLAIM_USERNAME_NAME = RPC_CLAIM_USERNAME;
var MATCH_HANDLER = "authoritative_match";
var PRIVATE_MATCH_CODE_COLLECTION = "private_match_codes";
var PRIVATE_MATCH_CODE_MAX_GENERATION_ATTEMPTS = 12;
var PRIVATE_MATCH_CODE_WRITE_ATTEMPTS = 4;
var onlinePresenceByUser = /* @__PURE__ */ new Map();
var asRecord2 = (value) => typeof value === "object" && value !== null ? value : null;
var readStringField5 = (value, keys) => {
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
var readNumberField3 = (value, keys) => {
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
var getPresenceUserId = (presence) => readStringField5(presence, ["userId", "user_id"]);
var getSenderUserId = (sender) => readStringField5(sender, ["userId", "user_id"]);
var getMatchId = (ctx) => {
  var _a;
  return (_a = readStringField5(ctx, ["matchId", "match_id"])) != null ? _a : "";
};
var getMessageOpCode = (message) => readNumberField3(message, ["opCode", "op_code"]);
var getContextUserId = (ctx) => readStringField5(ctx, ["userId", "user_id"]);
var resolveMatchModeId = (value) => isMatchModeId(value) ? value : "standard";
var buildMatchClassification = (params, modeId) => {
  const config = getMatchConfig(modeId);
  const privateMatch = params.privateMatch === true;
  const botMatch = params.botMatch === true;
  const casualMatch = params.casualMatch === true;
  const experimental = !config.allowsRankedStats;
  const ranked = params.rankedMatch === true || !privateMatch && !botMatch && !casualMatch && !experimental && params.rankedMatch !== false;
  return {
    ranked,
    casual: casualMatch,
    private: privateMatch,
    bot: botMatch,
    experimental
  };
};
var pruneOnlinePresence = (nowMs) => {
  onlinePresenceByUser.forEach((lastSeenMs, userId) => {
    if (nowMs - lastSeenMs > ONLINE_TTL_MS) {
      onlinePresenceByUser.delete(userId);
    }
  });
};
var encodeOnlinePresencePayload = (nowMs) => JSON.stringify({
  onlineCount: onlinePresenceByUser.size,
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
var parseRpcPayload = (payload) => {
  var _a;
  if (!payload) {
    return {};
  }
  const data = JSON.parse(payload);
  return (_a = asRecord2(data)) != null ? _a : {};
};
var normalizePrivateMatchCodeRecord = (value) => {
  var _a;
  const record = asRecord2(value);
  if (!record) {
    return null;
  }
  const code = normalizePrivateMatchCodeInput((_a = readStringField5(record, ["code"])) != null ? _a : "");
  const matchId = readStringField5(record, ["matchId", "match_id"]);
  const modeId = record.modeId;
  const creatorUserId = readStringField5(record, ["creatorUserId", "creator_user_id"]);
  const joinedUserId = readStringField5(record, ["joinedUserId", "joined_user_id"]);
  const createdAt = readStringField5(record, ["createdAt", "created_at"]);
  const updatedAt = readStringField5(record, ["updatedAt", "updated_at"]);
  if (!isPrivateMatchCode(code) || !matchId || !isMatchModeId(modeId) || !creatorUserId || !createdAt || !updatedAt) {
    return null;
  }
  return {
    code,
    matchId,
    modeId,
    creatorUserId,
    joinedUserId: joinedUserId != null ? joinedUserId : null,
    createdAt,
    updatedAt
  };
};
var readPrivateMatchCodeObject = (nk, code) => {
  const normalizedCode = normalizePrivateMatchCodeInput(code);
  if (!isPrivateMatchCode(normalizedCode)) {
    return {
      object: null,
      record: null
    };
  }
  const objects = nk.storageRead([
    {
      collection: PRIVATE_MATCH_CODE_COLLECTION,
      key: normalizedCode,
      userId: SYSTEM_USER_ID3
    }
  ]);
  const object = findStorageObject(objects, PRIVATE_MATCH_CODE_COLLECTION, normalizedCode, SYSTEM_USER_ID3);
  return {
    object,
    record: normalizePrivateMatchCodeRecord(object == null ? void 0 : object.value)
  };
};
var writePrivateMatchCodeRecord = (nk, record, version) => {
  nk.storageWrite([
    {
      collection: PRIVATE_MATCH_CODE_COLLECTION,
      key: record.code,
      value: record,
      version,
      permissionRead: STORAGE_PERMISSION_NONE,
      permissionWrite: STORAGE_PERMISSION_NONE
    }
  ]);
};
var createAvailablePrivateMatchCode = (nk) => {
  for (let attempt = 0; attempt < PRIVATE_MATCH_CODE_MAX_GENERATION_ATTEMPTS; attempt += 1) {
    const code = generatePrivateMatchCode();
    const existing = readPrivateMatchCodeObject(nk, code);
    if (existing.record) {
      continue;
    }
    return code;
  }
  throw new Error("Unable to create a private game code right now.");
};
var createPrivateMatchCodeRecord = (nk, modeId, matchId, creatorUserId, code) => {
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const record = {
    code,
    matchId,
    modeId,
    creatorUserId,
    joinedUserId: null,
    createdAt: now,
    updatedAt: now
  };
  writePrivateMatchCodeRecord(nk, record, "*");
  return record;
};
var claimPrivateMatchCode = (nk, code, userId) => {
  var _a;
  const normalizedCode = normalizePrivateMatchCodeInput(code);
  if (!isPrivateMatchCode(normalizedCode)) {
    throw new Error("Enter a valid private game code.");
  }
  for (let attempt = 0; attempt < PRIVATE_MATCH_CODE_WRITE_ATTEMPTS; attempt += 1) {
    const { object, record } = readPrivateMatchCodeObject(nk, normalizedCode);
    if (!record) {
      throw new Error("Private game code not found.");
    }
    if (record.creatorUserId === userId || record.joinedUserId === userId) {
      return record;
    }
    if (record.joinedUserId && record.joinedUserId !== userId) {
      throw new Error("This private game code has already been claimed.");
    }
    const nextRecord = __spreadProps(__spreadValues({}, record), {
      joinedUserId: userId,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    });
    try {
      writePrivateMatchCodeRecord(nk, nextRecord, (_a = getStorageObjectVersion(object)) != null ? _a : "");
      return nextRecord;
    } catch (e) {
    }
  }
  throw new Error("Unable to claim this private game code right now.");
};
var syncPrivateMatchReservation = (nk, state) => {
  if (!state.privateMatch || !state.privateCode) {
    return;
  }
  const { record } = readPrivateMatchCodeObject(nk, state.privateCode);
  if (!record) {
    return;
  }
  state.privateCreatorUserId = record.creatorUserId;
  state.privateGuestUserId = record.joinedUserId;
};
var canUserJoinPrivateMatch = (state, userId) => {
  if (!state.privateMatch) {
    return true;
  }
  if (state.privateCreatorUserId && state.privateCreatorUserId === userId) {
    return true;
  }
  return Boolean(state.privateGuestUserId && state.privateGuestUserId === userId);
};
var isPrivateMatchReady = (state) => !state.privateMatch || Object.keys(state.presences).length >= MAX_PLAYERS;
var buildPrivateMatchRpcResponse = (matchId, modeId, privateCode, hasGuestJoined) => JSON.stringify(__spreadValues({
  matchId,
  modeId,
  // Some deployed Nakama runtimes have dropped a `code` field from RPC payloads.
  // Keep the original key for compatibility and add a second alias the client can fall back to.
  code: privateCode,
  privateCode
}, typeof hasGuestJoined === "boolean" ? { hasGuestJoined } : {}));
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
  initializer.registerRpc(RPC_GET_MY_RATING_PROFILE, rpcGetMyRatingProfile);
  initializer.registerRpc(RPC_LIST_TOP_ELO_PLAYERS, rpcListTopEloPlayers);
  initializer.registerRpc(RPC_GET_ELO_LEADERBOARD_AROUND_ME, rpcGetEloLeaderboardAroundMe);
  initializer.registerRpc(RPC_GET_CHALLENGE_DEFINITIONS_NAME, rpcGetChallengeDefinitions);
  initializer.registerRpc(RPC_GET_USER_CHALLENGE_PROGRESS_NAME, rpcGetUserChallengeProgress);
  initializer.registerRpc(RPC_SUBMIT_COMPLETED_BOT_MATCH_NAME, rpcSubmitCompletedBotMatch);
  initializer.registerRpc(RPC_MATCHMAKER_ADD, rpcMatchmakerAdd);
  initializer.registerRpc(RPC_CREATE_PRIVATE_MATCH, rpcCreatePrivateMatch);
  initializer.registerRpc(RPC_JOIN_PRIVATE_MATCH, rpcJoinPrivateMatch);
  initializer.registerRpc(RPC_GET_PRIVATE_MATCH_STATUS, rpcGetPrivateMatchStatus);
  initializer.registerRpc(RPC_PRESENCE_HEARTBEAT, rpcPresenceHeartbeat);
  initializer.registerRpc(RPC_PRESENCE_COUNT, rpcPresenceCount);
  initializer.registerRpc(RPC_GET_USERNAME_ONBOARDING_STATUS_NAME, rpcGetUsernameOnboardingStatus);
  initializer.registerRpc(RPC_CLAIM_USERNAME_NAME, rpcClaimUsername);
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
    ensureEloLeaderboard(nk, logger);
  } catch (error) {
    logger.warn(
      "Skipping Elo leaderboard setup on startup: %s",
      error instanceof Error ? error.message : String(error)
    );
  }
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
  onlinePresenceByUser.set(userId, nowMs);
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
  requireCompletedUsernameOnboarding(nk, ctx.userId);
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
function rpcCreatePrivateMatch(ctx, _logger, nk, payload) {
  if (!ctx.userId) {
    throw new Error("Authentication required.");
  }
  requireCompletedUsernameOnboarding(nk, ctx.userId);
  const data = parseRpcPayload(payload);
  const modeId = resolveMatchModeId(data.modeId);
  const privateCode = createAvailablePrivateMatchCode(nk);
  const matchId = nk.matchCreate(MATCH_HANDLER, {
    playerIds: [ctx.userId],
    modeId,
    rankedMatch: false,
    casualMatch: false,
    botMatch: false,
    privateMatch: true,
    privateCode,
    privateCreatorUserId: ctx.userId,
    winRewardSource: "private_pvp_win",
    allowsChallengeRewards: false
  });
  createPrivateMatchCodeRecord(nk, modeId, matchId, ctx.userId, privateCode);
  return buildPrivateMatchRpcResponse(matchId, modeId, privateCode);
}
function rpcJoinPrivateMatch(ctx, _logger, nk, payload) {
  if (!ctx.userId) {
    throw new Error("Authentication required.");
  }
  requireCompletedUsernameOnboarding(nk, ctx.userId);
  const data = parseRpcPayload(payload);
  const requestedCode = typeof data.code === "string" ? data.code : "";
  const reservation = claimPrivateMatchCode(nk, requestedCode, ctx.userId);
  return buildPrivateMatchRpcResponse(reservation.matchId, reservation.modeId, reservation.code);
}
function rpcGetPrivateMatchStatus(ctx, _logger, nk, payload) {
  if (!ctx.userId) {
    throw new Error("Authentication required.");
  }
  requireCompletedUsernameOnboarding(nk, ctx.userId);
  const data = parseRpcPayload(payload);
  const requestedCode = typeof data.code === "string" ? data.code : "";
  const normalizedCode = normalizePrivateMatchCodeInput(requestedCode);
  if (!isPrivateMatchCode(normalizedCode)) {
    throw new Error("Enter a valid private game code.");
  }
  const { record } = readPrivateMatchCodeObject(nk, normalizedCode);
  if (!record) {
    throw new Error("Private game code not found.");
  }
  if (record.creatorUserId !== ctx.userId && record.joinedUserId !== ctx.userId) {
    throw new Error("You do not have access to this private game.");
  }
  return buildPrivateMatchRpcResponse(
    record.matchId,
    record.modeId,
    record.code,
    Boolean(record.joinedUserId)
  );
}
function matchmakerMatched(_ctx, logger, nk, matched) {
  const users = Array.isArray(matched.users) ? matched.users : [];
  const playerIds = users.map((user) => getPresenceUserId(user == null ? void 0 : user.presence)).filter((userId) => Boolean(userId)).slice(0, MAX_PLAYERS);
  logger.info("Matchmaker matched %s players", playerIds.length);
  return nk.matchCreate(MATCH_HANDLER, {
    playerIds,
    modeId: "standard",
    rankedMatch: true,
    casualMatch: false,
    botMatch: false,
    privateMatch: false,
    winRewardSource: "pvp_win",
    allowsChallengeRewards: true
  });
}
function matchInit(_ctx, _logger, _nk, params) {
  const playerIds = Array.isArray(params.playerIds) ? params.playerIds : [];
  const modeId = resolveMatchModeId(params.modeId);
  const classification = buildMatchClassification(params, modeId);
  const privateMatch = classification.private;
  const privateCode = typeof params.privateCode === "string" ? normalizePrivateMatchCodeInput(params.privateCode) : "";
  const privateCreatorUserId = typeof params.privateCreatorUserId === "string" ? params.privateCreatorUserId : null;
  const winRewardSource = params.winRewardSource === "private_pvp_win" ? "private_pvp_win" : "pvp_win";
  const allowsChallengeRewards = params.allowsChallengeRewards !== false;
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
    gameState: createInitialState(getMatchConfig(modeId)),
    revision: 0,
    opponentType: "human",
    modeId,
    classification,
    privateMatch,
    privateCode: isPrivateMatchCode(privateCode) ? privateCode : null,
    privateCreatorUserId,
    privateGuestUserId: null,
    winRewardSource,
    allowsChallengeRewards,
    telemetry: createMatchTelemetry()
  };
  return { state, tickRate: TICK_RATE, label: MATCH_HANDLER };
}
function matchJoinAttempt(_ctx, logger, nk, _dispatcher, _tick, state, presence) {
  const userId = getPresenceUserId(presence);
  if (!userId) {
    logger.warn("Rejecting join attempt with missing user ID.");
    return { state, accept: false, rejectMessage: "Unable to identify player." };
  }
  try {
    requireCompletedUsernameOnboarding(nk, userId);
  } catch (error) {
    return {
      state,
      accept: false,
      rejectMessage: error instanceof Error ? error.message : "Choose a username before joining online matches."
    };
  }
  if (state.privateMatch) {
    syncPrivateMatchReservation(nk, state);
    if (!canUserJoinPrivateMatch(state, userId)) {
      return { state, accept: false, rejectMessage: "Enter the private game code before joining this table." };
    }
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
  if (!isPrivateMatchReady(state)) {
    sendError(dispatcher, state, userId, "MATCH_NOT_READY", "Waiting for the other player to join.");
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
  if (!isPrivateMatchReady(state)) {
    sendError(dispatcher, state, userId, "MATCH_NOT_READY", "Waiting for the other player to join.");
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
    processCompletedMatchRatings(logger, nk, dispatcher, state, matchId);
    awardWinnerProgression(logger, nk, dispatcher, state, matchId);
    processCompletedMatchSummaries(logger, nk, state, matchId);
  }
}
function processCompletedMatchRatings(logger, nk, dispatcher, state, matchId) {
  const winnerColor = state.gameState.winner;
  if (!winnerColor) {
    return;
  }
  const winnerEntry = Object.entries(state.assignments).find(([, color]) => color === winnerColor);
  const loserEntry = Object.entries(state.assignments).find(([, color]) => color !== winnerColor);
  if (!winnerEntry || !loserEntry) {
    logger.warn("Match %s could not resolve both Elo participants.", matchId);
    return;
  }
  const [winnerUserId] = winnerEntry;
  const [loserUserId] = loserEntry;
  try {
    const ratingResult = processRankedMatchResult(nk, logger, {
      matchId,
      winnerUserId,
      loserUserId,
      ranked: state.classification.ranked,
      privateMatch: state.classification.private,
      botMatch: state.classification.bot,
      casualMatch: state.classification.casual,
      experimentalMode: state.classification.experimental
    });
    if (!ratingResult) {
      return;
    }
    ratingResult.record.playerResults.forEach((playerResult) => {
      const targetPresence = state.presences[playerResult.userId];
      if (!targetPresence) {
        logger.info(
          "Ranked Elo processed for user %s on match %s, but no live presence was available for notification.",
          playerResult.userId,
          matchId
        );
        return;
      }
      dispatcher.broadcastMessage(
        MatchOpCode.ELO_RATING_UPDATE,
        encodePayload(
          createEloRatingChangeNotification(
            ratingResult.record,
            playerResult.userId,
            ratingResult.ranksByUserId,
            ratingResult.duplicate
          )
        ),
        [targetPresence]
      );
    });
  } catch (error) {
    logger.error(
      "Failed to process ranked Elo result for match %s: %s",
      matchId,
      error instanceof Error ? error.message : String(error)
    );
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
      source: state.winRewardSource
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
  if (!state.allowsChallengeRewards) {
    return;
  }
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
  rpcGetUsernameOnboardingStatus,
  rpcClaimUsername,
  rpcGetMyRatingProfile,
  rpcListTopEloPlayers,
  rpcGetEloLeaderboardAroundMe,
  rpcMatchmakerAdd,
  rpcCreatePrivateMatch,
  rpcJoinPrivateMatch,
  rpcGetPrivateMatchStatus,
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
