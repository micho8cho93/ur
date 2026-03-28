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
  tournament_champion: {
    amount: 250,
    description: "Tournament champion reward."
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
var MAX_PROGRESSION_RANK = MAX_RANK;

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
    allowsChallenges: true,
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
    allowsChallenges: true,
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
    allowsChallenges: true,
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
    allowsChallenges: true,
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
var GLOBAL_STORAGE_USER_ID = "00000000-0000-0000-0000-000000000000";
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
var maybeSetStorageVersion = (write, version) => typeof version === "string" && version.length > 0 ? __spreadProps(__spreadValues({}, write), { version }) : write;
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
    return !objectUserId || objectUserId === GLOBAL_STORAGE_USER_ID;
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
      awardedXp: typeof params.awardedXp === "number" && Number.isFinite(params.awardedXp) ? params.awardedXp : getXpAwardAmount(source)
    })
  );
};
var awardXpForTournamentChampion = (nk, logger, params) => {
  var _a;
  const runId = (_a = params.runId) == null ? void 0 : _a.trim();
  if (!runId) {
    throw new Error("Cannot award tournament champion XP without a run ID.");
  }
  return awardXp(nk, logger, {
    userId: params.userId,
    ledgerKey: `tournament_champion:${runId}`,
    source: "tournament_champion",
    sourceId: runId,
    awardedXp: typeof params.awardedXp === "number" && Number.isFinite(params.awardedXp) ? params.awardedXp : getXpAwardAmount("tournament_champion")
  });
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
  const rawResult = nk.leaderboardRecordsHaystack(ELO_LEADERBOARD_ID, ctx.userId, limit, "", 0);
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
  MASTER_OF_UR: "master_of_ur"
};
var CHALLENGE_THRESHOLDS = {
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
  TOURNAMENT_SURVIVOR_REQUIRED_WINS: 3
};
var CHALLENGE_DEFINITIONS = [
  {
    id: CHALLENGE_IDS.FIRST_VICTORY,
    name: "First Victory",
    description: "Win your first completed game against any opponent.",
    type: "milestone",
    category: "starter",
    rewardXp: 50,
    sortOrder: 10
  },
  {
    id: CHALLENGE_IDS.BEAT_EASY_BOT,
    name: "Beat the Easy Bot",
    description: "Win a completed game against the easy AI opponent.",
    type: "bot",
    category: "starter",
    rewardXp: 30,
    sortOrder: 20
  },
  {
    id: CHALLENGE_IDS.BEAT_MEDIUM_BOT,
    name: "Beat the Medium Bot",
    description: "Win a completed game against the medium AI opponent.",
    type: "bot",
    category: "mastery",
    rewardXp: 100,
    sortOrder: 30
  },
  {
    id: CHALLENGE_IDS.BEAT_HARD_BOT,
    name: "Beat the Hard Bot",
    description: "Win a completed game against the hard AI opponent.",
    type: "bot",
    category: "mastery",
    rewardXp: 150,
    sortOrder: 40
  },
  {
    id: CHALLENGE_IDS.BEAT_PERFECT_BOT,
    name: "Beat the Perfect Bot",
    description: "Win a completed game against the perfect AI opponent.",
    type: "bot",
    category: "mastery",
    rewardXp: 250,
    sortOrder: 50
  },
  {
    id: CHALLENGE_IDS.MASTER_OF_UR,
    name: "Master of Ur",
    description: "Win against the perfect bot without losing a piece.",
    type: "bot",
    category: "mastery",
    rewardXp: 350,
    sortOrder: 60
  },
  {
    id: CHALLENGE_IDS.FAST_FINISH,
    name: "Fast Finish",
    description: "Win a completed game in fewer than 100 total applied moves.",
    type: "match",
    category: "mastery",
    rewardXp: 150,
    sortOrder: 70
  },
  {
    id: CHALLENGE_IDS.SAFE_PLAY,
    name: "Safe Play",
    description: "Win a completed game without losing any pieces to captures.",
    type: "match",
    category: "mastery",
    rewardXp: 150,
    sortOrder: 80
  },
  {
    id: CHALLENGE_IDS.UNBREAKABLE,
    name: "Unbreakable",
    description: "Complete a game without any of your pieces being captured.",
    type: "match",
    category: "mastery",
    rewardXp: 120,
    sortOrder: 90
  },
  {
    id: CHALLENGE_IDS.LUCKY_ROLL,
    name: "Lucky Roll",
    description: "Win a completed game after rolling the maximum value at least 3 times.",
    type: "match",
    category: "mastery",
    rewardXp: 100,
    sortOrder: 100
  },
  {
    id: CHALLENGE_IDS.HOME_STRETCH,
    name: "Home Stretch",
    description: "Win a completed game while making zero captures across the entire match.",
    type: "match",
    category: "mastery",
    rewardXp: 150,
    sortOrder: 110
  },
  {
    id: CHALLENGE_IDS.SILENT_VICTORY,
    name: "Silent Victory",
    description: "Win without capturing any opponent pieces.",
    type: "match",
    category: "mastery",
    rewardXp: 150,
    sortOrder: 120
  },
  {
    id: CHALLENGE_IDS.CAPTURE_MASTER,
    name: "Capture Master",
    description: "Capture at least 3 opponent pieces in a single completed game. Victory is not required.",
    type: "match",
    category: "mastery",
    rewardXp: 150,
    sortOrder: 130
  },
  {
    id: CHALLENGE_IDS.DOUBLE_STRIKE,
    name: "Double Strike",
    description: "Capture two opponent pieces within 3 of your own turns.",
    type: "match",
    category: "mastery",
    rewardXp: 150,
    sortOrder: 140
  },
  {
    id: CHALLENGE_IDS.RELENTLESS_PRESSURE,
    name: "Relentless Pressure",
    description: "Capture at least one piece in 3 consecutive turns of your own.",
    type: "match",
    category: "mastery",
    rewardXp: 180,
    sortOrder: 150
  },
  {
    id: CHALLENGE_IDS.PERFECT_PATH,
    name: "Perfect Path",
    description: "Win without landing on a contested tile.",
    type: "match",
    category: "mastery",
    rewardXp: 120,
    sortOrder: 160
  },
  {
    id: CHALLENGE_IDS.RISK_TAKER,
    name: "Risk Taker",
    description: "Win a completed game after landing on shared contestable tiles at least 3 times.",
    type: "match",
    category: "mastery",
    rewardXp: 200,
    sortOrder: 170
  },
  {
    id: CHALLENGE_IDS.NO_WASTE,
    name: "No Waste",
    description: "Complete a game with zero unusable rolls.",
    type: "match",
    category: "mastery",
    rewardXp: 120,
    sortOrder: 180
  },
  {
    id: CHALLENGE_IDS.LOCKDOWN,
    name: "Lockdown",
    description: "Keep the opponent from leaving their starting area for 10 turns.",
    type: "match",
    category: "mastery",
    rewardXp: 180,
    sortOrder: 190
  },
  {
    id: CHALLENGE_IDS.COMEBACK_WIN,
    name: "Comeback Win",
    description: "Win a completed game after trailing at one or more deterministic progress checkpoints during the match.",
    type: "match",
    category: "mastery",
    rewardXp: 250,
    sortOrder: 200
  },
  {
    id: CHALLENGE_IDS.FROM_THE_BRINK,
    name: "From the Brink",
    description: "Win after the opponent reaches a state where they are one successful move from victory.",
    type: "match",
    category: "mastery",
    rewardXp: 220,
    sortOrder: 210
  },
  {
    id: CHALLENGE_IDS.MOMENTUM_SHIFT,
    name: "Momentum Shift",
    description: "Go from behind to ahead within a 5-turn window.",
    type: "match",
    category: "mastery",
    rewardXp: 200,
    sortOrder: 220
  },
  {
    id: CHALLENGE_IDS.SHADOW_PLAYER,
    name: "Shadow Player",
    description: "Win while never having more than one of your own pieces on the board at the same time.",
    type: "match",
    category: "mastery",
    rewardXp: 250,
    sortOrder: 230
  },
  {
    id: CHALLENGE_IDS.SOLO_MASTER,
    name: "Solo Master",
    description: "Win a 1-piece mode game.",
    type: "mode",
    category: "mode",
    rewardXp: 80,
    sortOrder: 240
  },
  {
    id: CHALLENGE_IDS.SPEED_RUNNER,
    name: "Speed Runner",
    description: "Win a 1-piece mode game in under 10 turns.",
    type: "mode",
    category: "mode",
    rewardXp: 200,
    sortOrder: 250
  },
  {
    id: CHALLENGE_IDS.MINIMALIST,
    name: "Minimalist",
    description: "Win with 3 pieces.",
    type: "mode",
    category: "mode",
    rewardXp: 100,
    sortOrder: 260
  },
  {
    id: CHALLENGE_IDS.HALF_STRATEGY,
    name: "Half Strategy",
    description: "Win with 5 pieces.",
    type: "mode",
    category: "mode",
    rewardXp: 120,
    sortOrder: 270
  },
  {
    id: CHALLENGE_IDS.FULL_COMMANDER,
    name: "Full Commander",
    description: "Win a full 7-piece match.",
    type: "mode",
    category: "mode",
    rewardXp: 100,
    sortOrder: 280
  },
  {
    id: CHALLENGE_IDS.DAILY_GRINDER,
    name: "Daily Grinder",
    description: "Complete 3 games in one UTC day.",
    type: "progression",
    category: "grind",
    rewardXp: 100,
    sortOrder: 290
  },
  {
    id: CHALLENGE_IDS.WINNING_STREAK_I,
    name: "Winning Streak I",
    description: "Win 3 games in a row.",
    type: "progression",
    category: "grind",
    rewardXp: 100,
    sortOrder: 300
  },
  {
    id: CHALLENGE_IDS.WINNING_STREAK_II,
    name: "Winning Streak II",
    description: "Win 5 games in a row.",
    type: "progression",
    category: "grind",
    rewardXp: 180,
    sortOrder: 310
  },
  {
    id: CHALLENGE_IDS.WINNING_STREAK_III,
    name: "Winning Streak III",
    description: "Win 10 games in a row.",
    type: "progression",
    category: "grind",
    rewardXp: 320,
    sortOrder: 320
  },
  {
    id: CHALLENGE_IDS.VETERAN_I,
    name: "Veteran I",
    description: "Play 50 games.",
    type: "progression",
    category: "grind",
    rewardXp: 120,
    sortOrder: 330
  },
  {
    id: CHALLENGE_IDS.VETERAN_II,
    name: "Veteran II",
    description: "Play 100 games.",
    type: "progression",
    category: "grind",
    rewardXp: 220,
    sortOrder: 340
  },
  {
    id: CHALLENGE_IDS.VETERAN_III,
    name: "Veteran III",
    description: "Play 250 games.",
    type: "progression",
    category: "grind",
    rewardXp: 400,
    sortOrder: 350
  },
  {
    id: CHALLENGE_IDS.ETERNAL,
    name: "Eternal",
    description: "Reach the Immortal rank.",
    type: "progression",
    category: "grind",
    rewardXp: 300,
    sortOrder: 360
  },
  {
    id: CHALLENGE_IDS.FRIENDLY_RIVALRY,
    name: "Friendly Rivalry",
    description: "Win against a friend.",
    type: "social",
    category: "social",
    rewardXp: 120,
    sortOrder: 370
  },
  {
    id: CHALLENGE_IDS.TOURNAMENT_SURVIVOR,
    name: "Tournament Survivor",
    description: "Win 3 consecutive tournament matches.",
    type: "tournament",
    category: "tournament",
    rewardXp: 220,
    sortOrder: 380
  },
  {
    id: CHALLENGE_IDS.CLUTCH_TOURNAMENT,
    name: "Clutch Tournament",
    description: "Win a tournament match while at risk of elimination.",
    type: "tournament",
    category: "tournament",
    rewardXp: 220,
    sortOrder: 390
  },
  {
    id: CHALLENGE_IDS.PERFECTIONIST,
    name: "Perfectionist",
    description: "Complete every other challenge.",
    type: "meta",
    category: "meta",
    rewardXp: 500,
    sortOrder: 400
  }
];
var CHALLENGE_DEFINITION_BY_ID = CHALLENGE_DEFINITIONS.reduce(
  (definitions, definition) => {
    definitions[definition.id] = definition;
    return definitions;
  },
  {}
);
var CHALLENGE_IDS_EXCLUDING_PERFECTIONIST = CHALLENGE_DEFINITIONS.filter(
  (definition) => definition.id !== CHALLENGE_IDS.PERFECTIONIST
).map((definition) => definition.id);
var getChallengeDefinition = (challengeId) => {
  const definition = CHALLENGE_DEFINITION_BY_ID[challengeId];
  if (!definition) {
    throw new Error(`Unknown challenge definition: ${challengeId}`);
  }
  return definition;
};
var createDefaultChallengeProgressStats = () => ({
  totalGamesPlayed: 0,
  totalWins: 0,
  currentWinStreak: 0,
  currentTournamentWinStreak: 0,
  dailyGameBucket: null,
  dailyGameCount: 0
});
var createDefaultUserChallengeProgressSnapshot = (updatedAt = (/* @__PURE__ */ new Date()).toISOString()) => ({
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
        progressLabel: null
      };
      return states;
    },
    {}
  )
});
var isChallengeId = (value) => typeof value === "string" && value in CHALLENGE_DEFINITION_BY_ID;
var isOpponentType = (value) => value === "human" || value === "easy_bot" || value === "medium_bot" || value === "hard_bot" || value === "perfect_bot";
var isOpponentDifficulty = (value) => value === "easy" || value === "medium" || value === "hard" || value === "perfect";
var getOpponentDifficultyFromType = (opponentType) => {
  if (opponentType === "human") {
    return null;
  }
  return opponentType.replace("_bot", "");
};
var isChallengeDefinition = (value) => {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const definition = value;
  return isChallengeId(definition.id) && typeof definition.name === "string" && typeof definition.description === "string" && typeof definition.type === "string" && typeof definition.category === "string" && typeof definition.rewardXp === "number" && typeof definition.sortOrder === "number" && (typeof definition.hidden === "undefined" || typeof definition.hidden === "boolean");
};
var isOptionalNonNegativeNumber = (value) => typeof value === "undefined" || typeof value === "number" && Number.isFinite(value) && value >= 0;
var isOptionalBoolean = (value) => typeof value === "undefined" || typeof value === "boolean";
var isCompletedMatchSummary = (value) => {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const summary = value;
  return typeof summary.matchId === "string" && typeof summary.playerUserId === "string" && isOpponentType(summary.opponentType) && (summary.opponentDifficulty === null || typeof summary.opponentDifficulty === "undefined" || isOpponentDifficulty(summary.opponentDifficulty)) && typeof summary.didWin === "boolean" && typeof summary.totalMoves === "number" && typeof summary.playerMoveCount === "number" && isOptionalNonNegativeNumber(summary.playerTurnCount) && isOptionalNonNegativeNumber(summary.opponentTurnCount) && typeof summary.piecesLost === "number" && typeof summary.maxRollCount === "number" && isOptionalNonNegativeNumber(summary.unusableRollCount) && typeof summary.capturesMade === "number" && typeof summary.capturesSuffered === "number" && (typeof summary.captureTurnNumbers === "undefined" || Array.isArray(summary.captureTurnNumbers) && summary.captureTurnNumbers.every((turn) => typeof turn === "number" && turn >= 0)) && isOptionalNonNegativeNumber(summary.maxCaptureTurnStreak) && isOptionalBoolean(summary.doubleStrikeAchieved) && isOptionalBoolean(summary.relentlessPressureAchieved) && typeof summary.contestedTilesLandedCount === "number" && (typeof summary.opponentStartingAreaExitTurn === "undefined" || summary.opponentStartingAreaExitTurn === null || typeof summary.opponentStartingAreaExitTurn === "number" && summary.opponentStartingAreaExitTurn >= 0) && isOptionalBoolean(summary.lockdownAchieved) && typeof summary.borneOffCount === "number" && typeof summary.opponentBorneOffCount === "number" && typeof summary.wasBehindDuringMatch === "boolean" && typeof summary.behindCheckpointCount === "number" && Array.isArray(summary.behindReasons) && summary.behindReasons.every(
    (reason) => reason === "progress_deficit" || reason === "borne_off_deficit"
  ) && isOptionalBoolean(summary.opponentReachedBrink) && isOptionalBoolean(summary.momentumShiftAchieved) && (typeof summary.momentumShiftTurnSpan === "undefined" || summary.momentumShiftTurnSpan === null || typeof summary.momentumShiftTurnSpan === "number" && summary.momentumShiftTurnSpan >= 0) && isOptionalNonNegativeNumber(summary.maxActivePiecesOnBoard) && (typeof summary.modeId === "undefined" || summary.modeId === null || isMatchModeId(summary.modeId)) && isOptionalNonNegativeNumber(summary.pieceCountPerSide) && isOptionalBoolean(summary.isPrivateMatch) && isOptionalBoolean(summary.isFriendMatch) && isOptionalBoolean(summary.isTournamentMatch) && isOptionalBoolean(summary.tournamentEliminationRisk) && typeof summary.timestamp === "string";
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
var getPositionLeadRelation = (state, playerColor) => {
  const opponentColor = playerColor === "light" ? "dark" : "light";
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
var formatUtcDayBucket = (isoTimestamp) => isoTimestamp.slice(0, 10);
var getSharedPathStartIndex = (modeIdOrVariant) => {
  const path = getPathForColor(modeIdOrVariant, "light");
  const sharedIndex = path.findIndex((coord) => coord.row === 1);
  return sharedIndex >= 0 ? sharedIndex : path.length;
};
var isContestedLanding = (variant, playerColor, targetIndex) => {
  const coord = getPathCoord(variant, playerColor, targetIndex);
  if (!coord || coord.row !== 1) {
    return false;
  }
  return !isRosette(coord.row, coord.col);
};
var countActivePiecesOnBoard = (player, pathLength) => player.pieces.filter((piece) => piece.position >= 0 && piece.position < pathLength && !piece.isFinished).length;
var hasPlayerExitedStartingArea = (player, variant) => {
  const sharedPathStartIndex = getSharedPathStartIndex(variant);
  return player.pieces.some((piece) => piece.isFinished || piece.position >= sharedPathStartIndex);
};
var isOneSuccessfulMoveFromVictory = (state, playerColor) => {
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
var calculateDoubleStrikeTurnSpan = (captureTurnNumbers, maxInclusiveTurnSpan = CHALLENGE_THRESHOLDS.DOUBLE_STRIKE_MAX_TURN_SPAN) => {
  if (captureTurnNumbers.length < 2) {
    return null;
  }
  let bestSpan = null;
  for (let index = 1; index < captureTurnNumbers.length; index += 1) {
    const span = captureTurnNumbers[index] - captureTurnNumbers[index - 1] + 1;
    if (span <= maxInclusiveTurnSpan) {
      bestSpan = bestSpan === null ? span : Math.min(bestSpan, span);
    }
  }
  return bestSpan;
};
var hasReachedImmortalRank = (totalXp) => getRankForXp(totalXp).title === MAX_PROGRESSION_RANK.title;

// backend/modules/challengeProgress.ts
var asRecord2 = (value) => typeof value === "object" && value !== null ? value : null;
var readStringField4 = (value, keys) => {
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
    if (typeof field === "string" && field.trim().length > 0) {
      const parsed = Number(field);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }
  return null;
};
var clampNonNegativeInteger = (value) => typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
var normalizeChallengeStats = (rawValue) => {
  var _a, _b, _c, _d, _e;
  const record = asRecord2(rawValue);
  return {
    totalGamesPlayed: clampNonNegativeInteger(
      (_a = readNumberField3(record, ["totalGamesPlayed", "total_games_played"])) != null ? _a : 0
    ),
    totalWins: clampNonNegativeInteger((_b = readNumberField3(record, ["totalWins", "total_wins"])) != null ? _b : 0),
    currentWinStreak: clampNonNegativeInteger(
      (_c = readNumberField3(record, ["currentWinStreak", "current_win_streak"])) != null ? _c : 0
    ),
    currentTournamentWinStreak: clampNonNegativeInteger(
      (_d = readNumberField3(record, ["currentTournamentWinStreak", "current_tournament_win_streak"])) != null ? _d : 0
    ),
    dailyGameBucket: readStringField4(record, ["dailyGameBucket", "daily_game_bucket"]),
    dailyGameCount: clampNonNegativeInteger((_e = readNumberField3(record, ["dailyGameCount", "daily_game_count"])) != null ? _e : 0)
  };
};
var getRequiredCountForChallenge = (challengeId) => {
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
var buildIncompleteChallengeProgress = (challengeId, stats, totalXp, completedChallengeIds) => {
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
      progressLabel: `${Math.min(current, requiredCount)}/${requiredCount} ${labelSuffix}`
    };
  }
  if (challengeId === CHALLENGE_IDS.ETERNAL) {
    return {
      progressCurrent: totalXp,
      progressTarget: CHALLENGE_THRESHOLDS.IMMORTAL_REQUIRED_XP,
      progressLabel: `Current rank: ${getRankForXp(totalXp).title}`
    };
  }
  if (challengeId === CHALLENGE_IDS.PERFECTIONIST) {
    const completedOtherChallenges = CHALLENGE_IDS_EXCLUDING_PERFECTIONIST.filter(
      (id) => completedChallengeIds.has(id)
    ).length;
    const required = CHALLENGE_IDS_EXCLUDING_PERFECTIONIST.length;
    return {
      progressCurrent: completedOtherChallenges,
      progressTarget: required,
      progressLabel: `${completedOtherChallenges}/${required} other challenges completed`
    };
  }
  return {
    progressCurrent: null,
    progressTarget: null,
    progressLabel: null
  };
};
var decorateChallengeProgressSnapshot = (snapshot, totalXp) => {
  const completedChallengeIds = new Set(
    CHALLENGE_DEFINITIONS.filter((definition) => {
      var _a;
      return (_a = snapshot.challenges[definition.id]) == null ? void 0 : _a.completed;
    }).map(
      (definition) => definition.id
    )
  );
  return __spreadProps(__spreadValues({}, snapshot), {
    challenges: CHALLENGE_DEFINITIONS.reduce(
      (states, definition) => {
        const current = snapshot.challenges[definition.id];
        if (!current) {
          return states;
        }
        const progress = current.completed ? { progressCurrent: null, progressTarget: null, progressLabel: null } : buildIncompleteChallengeProgress(definition.id, snapshot.stats, totalXp, completedChallengeIds);
        states[definition.id] = __spreadValues(__spreadProps(__spreadValues({}, current), {
          rewardXp: definition.rewardXp
        }), progress);
        return states;
      },
      {}
    )
  });
};
var normalizeChallengeProgressSnapshot = (rawValue, totalXp, fallbackUpdatedAt = (/* @__PURE__ */ new Date()).toISOString()) => {
  var _a;
  const defaults = createDefaultUserChallengeProgressSnapshot(fallbackUpdatedAt);
  const rawRecord = asRecord2(rawValue);
  const rawChallenges = rawRecord && typeof rawRecord.challenges === "object" && rawRecord.challenges !== null ? rawRecord.challenges : null;
  const normalized = __spreadProps(__spreadValues({}, defaults), {
    updatedAt: (_a = readStringField4(rawRecord, ["updatedAt", "updated_at"])) != null ? _a : fallbackUpdatedAt,
    stats: normalizeChallengeStats(rawRecord == null ? void 0 : rawRecord.stats),
    challenges: CHALLENGE_DEFINITIONS.reduce(
      (states, definition) => {
        var _a2;
        const rawState = asRecord2(rawChallenges == null ? void 0 : rawChallenges[definition.id]);
        const completed = (rawState == null ? void 0 : rawState.completed) === true;
        const completedAt = completed ? (_a2 = readStringField4(rawState, ["completedAt", "completed_at"])) != null ? _a2 : fallbackUpdatedAt : null;
        const completedMatchId = completed ? readStringField4(rawState, ["completedMatchId", "completed_match_id"]) : null;
        states[definition.id] = {
          challengeId: definition.id,
          completed,
          completedAt,
          completedMatchId: completedMatchId != null ? completedMatchId : null,
          rewardXp: definition.rewardXp,
          progressCurrent: null,
          progressTarget: null,
          progressLabel: null
        };
        return states;
      },
      {}
    )
  });
  normalized.totalCompleted = Object.values(normalized.challenges).filter((challenge) => challenge.completed).length;
  normalized.totalRewardedXp = Object.values(normalized.challenges).filter((challenge) => challenge.completed).reduce((total, challenge) => total + challenge.rewardXp, 0);
  return decorateChallengeProgressSnapshot(normalized, totalXp);
};
var challengeProgressNeedsRepair = (rawValue, normalized) => {
  const rawRecord = asRecord2(rawValue);
  if (!rawRecord) {
    return true;
  }
  if (rawRecord.totalCompleted !== normalized.totalCompleted) {
    return true;
  }
  if (rawRecord.totalRewardedXp !== normalized.totalRewardedXp) {
    return true;
  }
  if (rawRecord.updatedAt !== normalized.updatedAt) {
    return true;
  }
  const rawStats = asRecord2(rawRecord.stats);
  if (readNumberField3(rawStats, ["totalGamesPlayed", "total_games_played"]) !== normalized.stats.totalGamesPlayed || readNumberField3(rawStats, ["totalWins", "total_wins"]) !== normalized.stats.totalWins || readNumberField3(rawStats, ["currentWinStreak", "current_win_streak"]) !== normalized.stats.currentWinStreak || readNumberField3(rawStats, ["currentTournamentWinStreak", "current_tournament_win_streak"]) !== normalized.stats.currentTournamentWinStreak || readStringField4(rawStats, ["dailyGameBucket", "daily_game_bucket"]) !== normalized.stats.dailyGameBucket || readNumberField3(rawStats, ["dailyGameCount", "daily_game_count"]) !== normalized.stats.dailyGameCount) {
    return true;
  }
  const rawChallenges = rawRecord.challenges;
  return CHALLENGE_DEFINITIONS.some((definition) => {
    const rawState = asRecord2(rawChallenges == null ? void 0 : rawChallenges[definition.id]);
    const normalizedState = normalized.challenges[definition.id];
    return !rawState || rawState.completed !== normalizedState.completed || rawState.completedAt !== normalizedState.completedAt || rawState.completedMatchId !== normalizedState.completedMatchId || rawState.rewardXp !== normalizedState.rewardXp || rawState.progressCurrent !== normalizedState.progressCurrent || rawState.progressTarget !== normalizedState.progressTarget || rawState.progressLabel !== normalizedState.progressLabel;
  });
};
var applyMatchToChallengeStats = (currentStats, summary) => {
  const dayBucket = formatUtcDayBucket(summary.timestamp);
  const sameDay = currentStats.dailyGameBucket === dayBucket;
  return {
    totalGamesPlayed: currentStats.totalGamesPlayed + 1,
    totalWins: currentStats.totalWins + (summary.didWin ? 1 : 0),
    currentWinStreak: summary.didWin ? currentStats.currentWinStreak + 1 : 0,
    currentTournamentWinStreak: summary.isTournamentMatch ? summary.didWin ? currentStats.currentTournamentWinStreak + 1 : 0 : currentStats.currentTournamentWinStreak,
    dailyGameBucket: dayBucket,
    dailyGameCount: sameDay ? currentStats.dailyGameCount + 1 : 1
  };
};
var didWinModeWithPieceCount = (summary, pieceCountPerSide) => {
  var _a;
  return summary.didWin && ((_a = summary.pieceCountPerSide) != null ? _a : 0) === pieceCountPerSide;
};
var evaluateChallengeCompletion = (challengeId, context) => {
  var _a, _b, _c, _d, _e, _f, _g, _h;
  const { summary, stats, totalXp, completedChallengeIds } = context;
  const unusableRollCount = (_a = summary.unusableRollCount) != null ? _a : 0;
  const playerTurnCount = (_b = summary.playerTurnCount) != null ? _b : summary.playerMoveCount;
  const opponentTurnCount = (_c = summary.opponentTurnCount) != null ? _c : 0;
  const captureTurnNumbers = Array.isArray(summary.captureTurnNumbers) ? summary.captureTurnNumbers : [];
  const maxCaptureTurnStreak = (_d = summary.maxCaptureTurnStreak) != null ? _d : 0;
  const doubleStrikeAchieved = (_e = summary.doubleStrikeAchieved) != null ? _e : captureTurnNumbers.length >= 2 && captureTurnNumbers.some(
    (turn, index) => index > 0 && turn - captureTurnNumbers[index - 1] + 1 <= CHALLENGE_THRESHOLDS.DOUBLE_STRIKE_MAX_TURN_SPAN
  );
  const relentlessPressureAchieved = (_f = summary.relentlessPressureAchieved) != null ? _f : maxCaptureTurnStreak >= CHALLENGE_THRESHOLDS.RELENTLESS_PRESSURE_REQUIRED_STREAK;
  const lockdownAchieved = (_g = summary.lockdownAchieved) != null ? _g : opponentTurnCount >= CHALLENGE_THRESHOLDS.LOCKDOWN_REQUIRED_OPPONENT_TURNS && (summary.opponentStartingAreaExitTurn === null || summary.opponentStartingAreaExitTurn > CHALLENGE_THRESHOLDS.LOCKDOWN_REQUIRED_OPPONENT_TURNS);
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
      return summary.didWin && summary.contestedTilesLandedCount >= CHALLENGE_THRESHOLDS.RISK_TAKER_REQUIRED_CONTESTED_LANDINGS;
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
      return didWinModeWithPieceCount(summary, 1);
    case CHALLENGE_IDS.MINIMALIST:
      return didWinModeWithPieceCount(summary, 3);
    case CHALLENGE_IDS.HALF_STRATEGY:
      return didWinModeWithPieceCount(summary, 5);
    case CHALLENGE_IDS.FULL_COMMANDER:
      return didWinModeWithPieceCount(summary, 7);
    case CHALLENGE_IDS.SPEED_RUNNER:
      return didWinModeWithPieceCount(summary, 1) && playerTurnCount < CHALLENGE_THRESHOLDS.SPEED_RUNNER_MAX_PLAYER_TURNS;
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
      return summary.didWin && ((_h = summary.maxActivePiecesOnBoard) != null ? _h : 0) <= 1;
    case CHALLENGE_IDS.MASTER_OF_UR:
      return summary.didWin && summary.opponentType === "perfect_bot" && summary.capturesSuffered === 0;
    default:
      return false;
  }
};
var evaluateChallengeCompletions = (context) => CHALLENGE_DEFINITIONS.filter(
  (definition) => !context.completedChallengeIds.has(definition.id) && evaluateChallengeCompletion(definition.id, context)
).map((definition) => definition.id);
var createCompletedChallengeState = (challengeId, completedAt, completedMatchId) => {
  const definition = getChallengeDefinition(challengeId);
  return {
    challengeId,
    completed: true,
    completedAt,
    completedMatchId,
    rewardXp: definition.rewardXp,
    progressCurrent: null,
    progressTarget: null,
    progressLabel: null
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
var buildChallengeRewardLedgerKey = (challengeId) => `challenge:${challengeId}`;
var buildProcessedMatchResultKey = (matchId) => matchId;
var isBotOpponentType = (opponentType) => opponentType === "easy_bot" || opponentType === "medium_bot" || opponentType === "hard_bot" || opponentType === "perfect_bot";
var readStringField5 = (value, keys) => {
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
        if (storedDefinition.name === definition.name && storedDefinition.description === definition.description && storedDefinition.type === definition.type && storedDefinition.category === definition.category && storedDefinition.rewardXp === definition.rewardXp && storedDefinition.sortOrder === definition.sortOrder && storedDefinition.hidden === definition.hidden) {
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
    const progressionProfile = ensureProgressionProfile(nk, logger, userId);
    if (existingObject) {
      const normalized = normalizeChallengeProgressSnapshot(
        getStorageObjectValue(existingObject),
        progressionProfile.totalXp
      );
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
    const defaults = decorateChallengeProgressSnapshot(
      createDefaultUserChallengeProgressSnapshot(),
      progressionProfile.totalXp
    );
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
var normalizeProcessedMatchResult = (rawValue) => {
  if (typeof rawValue !== "object" || rawValue === null) {
    return null;
  }
  const record = rawValue;
  const matchId = readStringField5(record, ["matchId", "match_id"]);
  const playerUserId = readStringField5(record, ["playerUserId", "player_user_id"]);
  const processedAt = readStringField5(record, ["processedAt", "processed_at"]);
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
var readMatchProcessingObjects = (nk, userId, matchId) => {
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
    ...CHALLENGE_DEFINITIONS.map((challengeId) => ({
      collection: XP_REWARD_LEDGER_COLLECTION,
      key: buildChallengeRewardLedgerKey(challengeId.id),
      userId
    }))
  ];
  const objects = nk.storageRead(objectIds);
  const rewardLedgerObjectsByChallengeId = CHALLENGE_DEFINITIONS.reduce(
    (entries, definition) => {
      const rewardObject = findStorageObject(
        objects,
        XP_REWARD_LEDGER_COLLECTION,
        buildChallengeRewardLedgerKey(definition.id),
        userId
      );
      if (rewardObject) {
        entries[definition.id] = rewardObject;
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
  for (let attempt = 1; attempt <= MAX_WRITE_ATTEMPTS; attempt += 1) {
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const {
      profileObject,
      challengeProgressObject,
      processedMatchObject,
      rewardLedgerObjectsByChallengeId
    } = readMatchProcessingObjects(nk, userId, matchId);
    const currentProfile = profileObject ? normalizeProgressionProfile(getStorageObjectValue(profileObject), now) : ensureProgressionProfile(nk, logger, userId);
    const currentProgress = challengeProgressObject ? normalizeChallengeProgressSnapshot(getStorageObjectValue(challengeProgressObject), currentProfile.totalXp, now) : decorateChallengeProgressSnapshot(createDefaultUserChallengeProgressSnapshot(now), currentProfile.totalXp);
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
    let projectedTotalXp = currentProfile.totalXp;
    const completedChallengeIdsSet = new Set(
      CHALLENGE_DEFINITIONS.filter((definition) => {
        var _a2;
        return (_a2 = currentProgress.challenges[definition.id]) == null ? void 0 : _a2.completed;
      }).map(
        (definition) => definition.id
      )
    );
    const nextStats = applyMatchToChallengeStats(currentProgress.stats, summary);
    let nextProgress = __spreadProps(__spreadValues({}, currentProgress), {
      updatedAt: now,
      stats: nextStats,
      challenges: __spreadValues({}, currentProgress.challenges)
    });
    while (true) {
      const newlySatisfiedChallengeIds = evaluateChallengeCompletions({
        summary,
        stats: nextStats,
        totalXp: projectedTotalXp,
        completedChallengeIds: completedChallengeIdsSet
      });
      if (newlySatisfiedChallengeIds.length === 0) {
        break;
      }
      newlySatisfiedChallengeIds.forEach((challengeId) => {
        if (completedChallengeIdsSet.has(challengeId)) {
          return;
        }
        const definition = CHALLENGE_DEFINITIONS.find((entry) => entry.id === challengeId);
        completedChallengeIds.push(challengeId);
        completedChallengeIdsSet.add(challengeId);
        nextProgress.challenges[challengeId] = createCompletedChallengeState(challengeId, now, matchId);
        if (!rewardLedgerObjectsByChallengeId[challengeId]) {
          totalAwardedXp += definition.rewardXp;
          projectedTotalXp += definition.rewardXp;
          completionWrites.push({
            challengeId,
            completedAt: now,
            completedMatchId: matchId,
            rewardXp: definition.rewardXp,
            rewardLedgerKey: buildChallengeRewardLedgerKey(challengeId)
          });
        }
      });
    }
    nextProgress.totalCompleted = Object.values(nextProgress.challenges).filter((challenge) => challenge.completed).length;
    nextProgress.totalRewardedXp = Object.values(nextProgress.challenges).filter((challenge) => challenge.completed).reduce((total, challenge) => total + challenge.rewardXp, 0);
    nextProgress = decorateChallengeProgressSnapshot(nextProgress, projectedTotalXp);
    const nextTotalXp = projectedTotalXp;
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
      const refreshed = readMatchProcessingObjects(nk, userId, matchId);
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

// backend/modules/tournaments/definitions.ts
var TOURNAMENT_COLLECTION = "tournaments";
var TOURNAMENT_AUDIT_COLLECTION = "tournament_audit_logs";
var TOURNAMENT_AUDIT_LOG_KEY = "recent";
var DEFAULT_LIST_LIMIT = 50;
var MAX_LIST_LIMIT = 100;
var DEFAULT_AUDIT_LIMIT = 50;
var MAX_AUDIT_LIMIT = 200;
var MAX_AUDIT_LOG_ENTRIES = 500;
var DEFAULT_MAX_PARTICIPANTS = 32;
var MAX_TOURNAMENT_PARTICIPANTS = 4096;
var RPC_TOURNAMENT_JOIN = "tournament_join";
var DEFAULT_TOURNAMENT_SCORING = {
  winPoints: 3,
  drawPoints: 1,
  lossPoints: 0,
  allowDraws: true
};
var DEFAULT_TOURNAMENT_XP_PER_MATCH_WIN = getXpAwardAmount("pvp_win");
var DEFAULT_TOURNAMENT_XP_FOR_CHAMPION = getXpAwardAmount("tournament_champion");
var TOURNAMENT_STATUSES = [
  "draft",
  "scheduled",
  "live",
  "complete",
  "cancelled"
];
var readStringField6 = (value, keys) => {
  const record = asRecord(value);
  if (!record) {
    return null;
  }
  for (const key of keys) {
    const field = record[key];
    if (typeof field === "string" && field.trim().length > 0) {
      return field.trim();
    }
  }
  return null;
};
var readNumberField4 = (value, keys) => {
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
var readBooleanField3 = (value, keys) => {
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
var readStringArrayField = (value, keys) => {
  const record = asRecord(value);
  if (!record) {
    return [];
  }
  for (const key of keys) {
    const field = record[key];
    if (Array.isArray(field)) {
      return Array.from(
        new Set(
          field.filter((item) => typeof item === "string").map((item) => item.trim()).filter((item) => item.length > 0)
        )
      );
    }
  }
  return [];
};
var clampListLimit = (value, fallback = DEFAULT_LIST_LIMIT, max = MAX_LIST_LIMIT) => {
  const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  const floored = Math.floor(parsed);
  if (floored < 1) {
    return 1;
  }
  return Math.min(max, floored);
};
var parseJsonPayload = (payload) => {
  if (!payload) {
    return {};
  }
  const parsed = JSON.parse(payload);
  const record = asRecord(parsed);
  if (!record) {
    throw new Error("RPC payload must be a JSON object.");
  }
  return record;
};
var requireAuthenticatedUserId = (ctx) => {
  const userId = readStringField6(ctx, ["userId", "user_id"]);
  if (!userId) {
    throw new Error("Authentication required.");
  }
  return userId;
};
var getActorLabel = (ctx) => {
  var _a, _b;
  const ctxRecord = asRecord(ctx);
  const vars = asRecord(ctxRecord == null ? void 0 : ctxRecord.vars);
  return (_b = (_a = readStringField6(ctxRecord, ["username", "displayName", "display_name", "name"])) != null ? _a : readStringField6(vars, ["usernameDisplay", "username_display", "displayName", "display_name", "email"])) != null ? _b : requireAuthenticatedUserId(ctx);
};
var normalizeTournamentStatus = (value, fallback = "draft") => {
  if (typeof value !== "string") {
    return fallback;
  }
  const normalized = value.trim().toLowerCase();
  return TOURNAMENT_STATUSES.indexOf(normalized) >= 0 ? normalized : fallback;
};
var clampPositiveInteger = (value, fallback, max) => {
  const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  const floored = Math.floor(parsed);
  if (floored < 2) {
    return 2;
  }
  return Math.min(max, floored);
};
var clampNonNegativeInteger2 = (value, fallback, max) => {
  const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.max(0, Math.min(max, Math.floor(parsed)));
};
var normalizeCurrency = (value) => {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim().toUpperCase();
  return trimmed.length > 0 ? trimmed : null;
};
var normalizeRewardPoolAmount = (value) => {
  const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }
  return Math.round(parsed * 100) / 100;
};
var resolveTournamentXpRewardSettings = (value) => ({
  xpPerMatchWin: clampNonNegativeInteger2(
    readNumberField4(value, [
      "xpPerMatchWin",
      "xp_per_match_win",
      "matchWinXp",
      "match_win_xp",
      "tournamentMatchWinXp",
      "tournament_match_win_xp"
    ]),
    DEFAULT_TOURNAMENT_XP_PER_MATCH_WIN,
    1e6
  ),
  xpForTournamentChampion: clampNonNegativeInteger2(
    readNumberField4(value, [
      "xpForTournamentChampion",
      "xp_for_tournament_champion",
      "championXp",
      "champion_xp",
      "tournamentChampionXp",
      "tournament_champion_xp"
    ]),
    DEFAULT_TOURNAMENT_XP_FOR_CHAMPION,
    1e6
  )
});
var slugify = (value) => value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
var normalizeParticipant = (value) => {
  const record = asRecord(value);
  if (!record) {
    return null;
  }
  const userId = readStringField6(record, ["userId", "user_id"]);
  const displayName = readStringField6(record, ["displayName", "display_name"]);
  const joinedAt = readStringField6(record, ["joinedAt", "joined_at"]);
  if (!userId || !displayName || !joinedAt) {
    return null;
  }
  const status = readStringField6(record, ["status"]);
  const seed = readNumberField4(record, ["seed"]);
  return {
    userId,
    displayName,
    joinedAt,
    status: status === "checked_in" || status === "eliminated" || status === "joined" ? status : "joined",
    seed: typeof seed === "number" && Number.isFinite(seed) ? Math.floor(seed) : null
  };
};
var normalizeResult = (value) => {
  var _a;
  const record = asRecord(value);
  if (!record) {
    return null;
  }
  const matchId = readStringField6(record, ["matchId", "match_id"]);
  const submittedByUserId = readStringField6(record, ["submittedByUserId", "submitted_by_user_id"]);
  const submittedAt = readStringField6(record, ["submittedAt", "submitted_at"]);
  const playerAUserId = readStringField6(record, ["playerAUserId", "player_a_user_id"]);
  const playerBUserId = readStringField6(record, ["playerBUserId", "player_b_user_id"]);
  const scoreA = readNumberField4(record, ["scoreA", "score_a"]);
  const scoreB = readNumberField4(record, ["scoreB", "score_b"]);
  const round = readNumberField4(record, ["round"]);
  if (!matchId || !submittedByUserId || !submittedAt || !playerAUserId || !playerBUserId || typeof scoreA !== "number" || typeof scoreB !== "number" || typeof round !== "number") {
    return null;
  }
  return {
    matchId,
    round: Math.max(1, Math.floor(round)),
    submittedByUserId,
    submittedAt,
    playerAUserId,
    playerBUserId,
    scoreA,
    scoreB,
    winnerUserId: readStringField6(record, ["winnerUserId", "winner_user_id"]),
    notes: (_a = readStringField6(record, ["notes"])) != null ? _a : null
  };
};
var normalizeTournamentRecord = (value, fallbackId) => {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k;
  const record = asRecord(value);
  if (!record) {
    return null;
  }
  const id = (_b = (_a = readStringField6(record, ["id"])) != null ? _a : fallbackId) != null ? _b : null;
  const name = readStringField6(record, ["name"]);
  const startsAt = readStringField6(record, ["startsAt", "starts_at"]);
  const createdAt = readStringField6(record, ["createdAt", "created_at"]);
  const updatedAt = readStringField6(record, ["updatedAt", "updated_at"]);
  const createdByUserId = readStringField6(record, ["createdByUserId", "created_by_user_id"]);
  const createdByLabel = readStringField6(record, ["createdByLabel", "created_by_label"]);
  if (!id || !name || !startsAt || !createdAt || !updatedAt || !createdByUserId || !createdByLabel) {
    return null;
  }
  const rawParticipants = Array.isArray(record.participants) ? record.participants : [];
  const rawResults = Array.isArray(record.results) ? record.results : [];
  const scoringRecord = asRecord(record.scoring);
  const participants = rawParticipants.map((entry) => normalizeParticipant(entry)).filter((entry) => Boolean(entry));
  const results = rawResults.map((entry) => normalizeResult(entry)).filter((entry) => Boolean(entry)).sort((left, right) => {
    if (left.round !== right.round) {
      return left.round - right.round;
    }
    return left.submittedAt.localeCompare(right.submittedAt);
  });
  return {
    id,
    slug: (_c = readStringField6(record, ["slug"])) != null ? _c : id,
    name,
    description: (_d = readStringField6(record, ["description"])) != null ? _d : "",
    status: normalizeTournamentStatus(record.status, "draft"),
    startsAt,
    createdAt,
    updatedAt,
    createdByUserId,
    createdByLabel,
    region: (_e = readStringField6(record, ["region"])) != null ? _e : "Global",
    gameMode: (_f = readStringField6(record, ["gameMode", "game_mode"])) != null ? _f : "Standard",
    entryFee: (_g = readStringField6(record, ["entryFee", "entry_fee"])) != null ? _g : "Free",
    maxParticipants: clampPositiveInteger(
      readNumberField4(record, ["maxParticipants", "max_participants"]),
      DEFAULT_MAX_PARTICIPANTS,
      MAX_TOURNAMENT_PARTICIPANTS
    ),
    rewardCurrency: normalizeCurrency(record.rewardCurrency),
    rewardPoolAmount: normalizeRewardPoolAmount(record.rewardPoolAmount),
    rewardNotes: readStringField6(record, ["rewardNotes", "reward_notes"]),
    tags: readStringArrayField(record, ["tags"]),
    scoring: {
      winPoints: (_h = readNumberField4(scoringRecord, ["winPoints", "win_points"])) != null ? _h : DEFAULT_TOURNAMENT_SCORING.winPoints,
      drawPoints: (_i = readNumberField4(scoringRecord, ["drawPoints", "draw_points"])) != null ? _i : DEFAULT_TOURNAMENT_SCORING.drawPoints,
      lossPoints: (_j = readNumberField4(scoringRecord, ["lossPoints", "loss_points"])) != null ? _j : DEFAULT_TOURNAMENT_SCORING.lossPoints,
      allowDraws: (_k = readBooleanField3(scoringRecord, ["allowDraws", "allow_draws"])) != null ? _k : DEFAULT_TOURNAMENT_SCORING.allowDraws
    },
    participants,
    results
  };
};
var buildTournamentSummary = (tournament) => ({
  id: tournament.id,
  name: tournament.name,
  status: tournament.status,
  startsAt: tournament.startsAt,
  updatedAt: tournament.updatedAt,
  region: tournament.region,
  gameMode: tournament.gameMode,
  participantsCount: tournament.participants.length,
  maxParticipants: tournament.maxParticipants,
  rewardPoolAmount: tournament.rewardPoolAmount,
  rewardCurrency: tournament.rewardCurrency
});
var readTournamentObject = (nk, tournamentId) => {
  const objects = nk.storageRead([
    {
      collection: TOURNAMENT_COLLECTION,
      key: tournamentId
    }
  ]);
  return findStorageObject(objects, TOURNAMENT_COLLECTION, tournamentId);
};
var readTournamentOrThrow = (nk, tournamentId) => {
  var _a;
  const object = readTournamentObject(nk, tournamentId);
  const tournament = normalizeTournamentRecord((_a = object == null ? void 0 : object.value) != null ? _a : null, tournamentId);
  if (!object || !tournament) {
    throw new Error(`Tournament '${tournamentId}' was not found.`);
  }
  return tournament;
};
var writeTournamentObject = (nk, tournament, version) => {
  nk.storageWrite([
    {
      collection: TOURNAMENT_COLLECTION,
      key: tournament.id,
      value: tournament,
      version,
      permissionRead: STORAGE_PERMISSION_NONE,
      permissionWrite: STORAGE_PERMISSION_NONE
    }
  ]);
};
var updateTournamentWithRetry = (nk, logger, tournamentId, updater) => {
  var _a, _b;
  for (let attempt = 1; attempt <= MAX_WRITE_ATTEMPTS; attempt += 1) {
    const object = readTournamentObject(nk, tournamentId);
    const current = normalizeTournamentRecord((_a = object == null ? void 0 : object.value) != null ? _a : null, tournamentId);
    if (!object || !current) {
      throw new Error(`Tournament '${tournamentId}' was not found.`);
    }
    const next = updater(current);
    try {
      writeTournamentObject(nk, next, (_b = getStorageObjectVersion(object)) != null ? _b : "");
      return next;
    } catch (error) {
      if (attempt === MAX_WRITE_ATTEMPTS) {
        throw error;
      }
      logger.warn(
        "Retrying tournament write for %s after storage conflict: %s",
        tournamentId,
        getErrorMessage(error)
      );
    }
  }
  throw new Error(`Unable to update tournament '${tournamentId}'.`);
};

// backend/modules/tournaments/auth.ts
var ADMIN_COLLECTION = "admins";
var ADMIN_ROLE_KEY = "role";
var RPC_ADMIN_WHOAMI = "rpc_admin_whoami";
var TEST_ADMIN_USERNAME = "admin";
var TEST_ADMIN_ROLE = "admin";
var ADMIN_ROLE_RANK = {
  viewer: 1,
  operator: 2,
  admin: 3
};
var readStringField7 = (value, keys) => {
  const record = asRecord(value);
  if (!record) {
    return null;
  }
  for (const key of keys) {
    const field = record[key];
    if (typeof field === "string" && field.trim().length > 0) {
      return field.trim();
    }
  }
  return null;
};
var getContextUserId = (ctx) => {
  const userId = readStringField7(ctx, ["userId", "user_id"]);
  if (!userId) {
    throw new Error("Authentication required.");
  }
  return userId;
};
var normalizeAdminRole = (value) => {
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "viewer" || normalized === "operator" || normalized === "admin") {
      return normalized;
    }
  }
  const record = asRecord(value);
  if (!record) {
    return null;
  }
  const role = readStringField7(record, ["role"]);
  if (role === "viewer" || role === "operator" || role === "admin") {
    return role;
  }
  return null;
};
var fetchAdminRole = (nk, userId) => {
  var _a;
  const objects = nk.storageRead([
    {
      collection: ADMIN_COLLECTION,
      key: ADMIN_ROLE_KEY,
      userId
    }
  ]);
  const object = findStorageObject(objects, ADMIN_COLLECTION, ADMIN_ROLE_KEY, userId);
  return normalizeAdminRole((_a = object == null ? void 0 : object.value) != null ? _a : null);
};
var hasRequiredRole = (actualRole, requiredRole) => {
  if (!actualRole) {
    return false;
  }
  return ADMIN_ROLE_RANK[actualRole] >= ADMIN_ROLE_RANK[requiredRole];
};
var assertAdmin = (ctx, requiredRole, nk) => {
  var _a;
  const userId = getContextUserId(ctx);
  const actualRole = (_a = fetchAdminRole(nk, userId)) != null ? _a : maybeBootstrapTestAdminRole(nk, userId);
  if (!hasRequiredRole(actualRole, requiredRole)) {
    throw new Error(`Unauthorized: ${requiredRole} role required.`);
  }
  return actualRole;
};
var normalizeUserRecord = (value) => {
  const record = asRecord(value);
  if (!record) {
    return null;
  }
  return record;
};
var resolveAdminProfile = (nk, userId) => {
  var _a;
  if (typeof nk.usersGetId !== "function") {
    return {
      username: null,
      displayName: null,
      email: null
    };
  }
  try {
    const rawUsers = nk.usersGetId([userId]);
    const users = Array.isArray(rawUsers) ? rawUsers : [];
    const profile = (_a = users.map((value) => normalizeUserRecord(value)).find((value) => Boolean(value))) != null ? _a : null;
    return {
      username: readStringField7(profile, ["username"]),
      displayName: readStringField7(profile, ["displayName", "display_name"]),
      email: readStringField7(profile, ["email"])
    };
  } catch (e) {
    return {
      username: null,
      displayName: null,
      email: null
    };
  }
};
var maybeBootstrapTestAdminRole = (nk, userId) => {
  const profile = resolveAdminProfile(nk, userId);
  if (profile.username !== TEST_ADMIN_USERNAME) {
    return null;
  }
  nk.storageWrite([
    {
      collection: ADMIN_COLLECTION,
      key: ADMIN_ROLE_KEY,
      userId,
      value: { role: TEST_ADMIN_ROLE },
      permissionRead: STORAGE_PERMISSION_NONE,
      permissionWrite: STORAGE_PERMISSION_NONE
    }
  ]);
  return TEST_ADMIN_ROLE;
};
var rpcAdminWhoAmI = (ctx, logger, nk, payload) => {
  return runAuditedAdminRpc(
    (_ctx, _logger, _nk) => {
      const role = assertAdmin(_ctx, "viewer", _nk);
      const userId = getContextUserId(_ctx);
      const profile = resolveAdminProfile(_nk, userId);
      const response = {
        ok: true,
        userId,
        role,
        username: profile.username,
        displayName: profile.displayName,
        email: profile.email
      };
      return JSON.stringify(response);
    },
    {
      action: RPC_ADMIN_WHOAMI,
      targetName: "Current admin user"
    },
    ctx,
    logger,
    nk,
    payload
  );
};

// backend/modules/tournaments/audit.ts
var normalizeAuditValue = (value, depth = 0) => {
  if (value === null) {
    return null;
  }
  if (typeof value === "string") {
    return value.length > 160 ? `${value.slice(0, 157)}...` : value;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return value;
  }
  if (Array.isArray(value)) {
    return value.slice(0, 5).map((entry) => normalizeAuditValue(entry, depth + 1));
  }
  const record = asRecord(value);
  if (!record) {
    return void 0;
  }
  if (depth >= 1) {
    const compact = {};
    Object.keys(record).slice(0, 5).forEach((key) => {
      const normalized = normalizeAuditValue(record[key], depth + 1);
      if (normalized !== void 0) {
        compact[key] = normalized;
      }
    });
    return compact;
  }
  const nested = {};
  Object.keys(record).slice(0, 10).forEach((key) => {
    const normalized = normalizeAuditValue(record[key], depth + 1);
    if (normalized !== void 0) {
      nested[key] = normalized;
    }
  });
  return nested;
};
var createAuditPayloadSummary = (value) => {
  const record = asRecord(value);
  if (!record) {
    return {};
  }
  const summary = {};
  Object.keys(record).slice(0, 12).forEach((key) => {
    const normalized = normalizeAuditValue(record[key]);
    if (normalized !== void 0) {
      summary[key] = normalized;
    }
  });
  return summary;
};
var normalizeAuditEntry = (value) => {
  var _a, _b, _c, _d, _e, _f;
  const record = asRecord(value);
  if (!record) {
    return null;
  }
  const id = readStringField6(record, ["id"]);
  const action = readStringField6(record, ["action"]);
  const userId = readStringField6(record, ["userId", "user_id", "actorUserId", "actor_user_id"]);
  const targetId = readStringField6(record, ["targetId", "target_id", "tournamentId", "tournament_id"]);
  const timestamp = readStringField6(record, ["timestamp", "createdAt", "created_at"]);
  if (!id || !action || !userId || !targetId || !timestamp) {
    return null;
  }
  const payloadSummary = (_c = (_b = (_a = asRecord(record.payloadSummary)) != null ? _a : asRecord(record.payload_summary)) != null ? _b : asRecord(record.metadata)) != null ? _c : {};
  const actorLabel = (_d = readStringField6(record, ["actorLabel", "actor_label"])) != null ? _d : userId;
  const tournamentName = (_f = (_e = readStringField6(record, ["tournamentName", "tournament_name"])) != null ? _e : readStringField6(record, ["targetName", "target_name"])) != null ? _f : targetId;
  return {
    id,
    userId,
    action,
    targetId,
    timestamp,
    payloadSummary,
    actorUserId: userId,
    actorLabel,
    tournamentId: targetId,
    tournamentName,
    createdAt: timestamp,
    metadata: payloadSummary
  };
};
var normalizeAuditLogRecord = (value) => {
  var _a;
  const record = asRecord(value);
  const entries = Array.isArray(record == null ? void 0 : record.entries) ? record.entries.map((entry) => normalizeAuditEntry(entry)).filter((entry) => Boolean(entry)) : [];
  return {
    entries,
    updatedAt: (_a = readStringField6(record, ["updatedAt", "updated_at"])) != null ? _a : (/* @__PURE__ */ new Date(0)).toISOString()
  };
};
var readAuditLogState = (nk) => {
  var _a;
  const objects = nk.storageRead([
    {
      collection: TOURNAMENT_AUDIT_COLLECTION,
      key: TOURNAMENT_AUDIT_LOG_KEY
    }
  ]);
  const object = findStorageObject(objects, TOURNAMENT_AUDIT_COLLECTION, TOURNAMENT_AUDIT_LOG_KEY);
  return {
    object,
    log: normalizeAuditLogRecord((_a = object == null ? void 0 : object.value) != null ? _a : null)
  };
};
var writeAuditLogState = (nk, log, version) => {
  nk.storageWrite([
    maybeSetStorageVersion({
      collection: TOURNAMENT_AUDIT_COLLECTION,
      key: TOURNAMENT_AUDIT_LOG_KEY,
      value: log,
      permissionRead: STORAGE_PERMISSION_NONE,
      permissionWrite: STORAGE_PERMISSION_NONE
    }, version)
  ]);
};
var buildAuditEntryId = (targetId, timestamp, action) => {
  const compactTimestamp = timestamp.replace(/[^0-9]/g, "");
  const randomSuffix = Math.random().toString(36).slice(2, 8);
  return `${targetId}-${action}-${compactTimestamp}-${randomSuffix}`;
};
var buildAuditEntry = (ctx, target, action, payloadSummary) => {
  var _a;
  const userId = requireAuthenticatedUserId(ctx);
  const timestamp = (/* @__PURE__ */ new Date()).toISOString();
  const summary = payloadSummary != null ? payloadSummary : {};
  return {
    id: buildAuditEntryId(target.id, timestamp, action),
    userId,
    action,
    targetId: target.id,
    timestamp,
    payloadSummary: summary,
    actorUserId: userId,
    actorLabel: getActorLabel(ctx),
    tournamentId: target.id,
    tournamentName: (_a = target.name) != null ? _a : target.id,
    createdAt: timestamp,
    metadata: summary
  };
};
var appendTournamentAuditEntry = (ctx, logger, nk, target, action, payloadSummary) => {
  const entry = buildAuditEntry(ctx, target, action, payloadSummary);
  try {
    const currentState = readAuditLogState(nk);
    const nextLog = {
      entries: [entry].concat(currentState.log.entries).slice(0, MAX_AUDIT_LOG_ENTRIES),
      updatedAt: entry.timestamp
    };
    writeAuditLogState(nk, nextLog, getStorageObjectVersion(currentState.object));
  } catch (error) {
    logger.warn("Unable to append tournament audit entry for %s: %s", target.id, getErrorMessage(error));
  }
  return entry;
};
var parseResponseRecord = (value) => {
  try {
    return asRecord(JSON.parse(value));
  } catch (e) {
    return null;
  }
};
var resolveDefaultTargetId = (ctx, payload, response) => {
  var _a, _b, _c, _d, _e;
  const responseRun = asRecord(response == null ? void 0 : response.run);
  const responseTournament = asRecord(response == null ? void 0 : response.tournament);
  return (_e = (_d = (_c = (_b = (_a = readStringField6(payload, ["targetId", "target_id", "runId", "run_id", "tournamentId", "tournament_id"])) != null ? _a : readStringField6(response, ["targetId", "target_id", "runId", "run_id", "tournamentId", "tournament_id", "userId", "user_id"])) != null ? _b : readStringField6(responseRun, ["runId", "run_id", "tournamentId", "tournament_id"])) != null ? _c : readStringField6(responseTournament, ["id", "tournamentId", "tournament_id"])) != null ? _d : readStringField6(ctx, ["userId", "user_id"])) != null ? _e : "unknown-target";
};
var resolveTargetId = (ctx, payload, response, resolver) => {
  var _a;
  if (typeof resolver === "function") {
    return (_a = resolver(ctx, payload, response)) != null ? _a : resolveDefaultTargetId(ctx, payload, response);
  }
  if (typeof resolver === "string" && resolver.trim().length > 0) {
    return resolver;
  }
  return resolveDefaultTargetId(ctx, payload, response);
};
var resolveTargetName = (ctx, payload, response, targetId, resolver) => {
  var _a, _b, _c, _d;
  if (typeof resolver === "function") {
    return (_a = resolver(ctx, payload, response)) != null ? _a : targetId;
  }
  if (typeof resolver === "string" && resolver.trim().length > 0) {
    return resolver;
  }
  const responseRun = asRecord(response == null ? void 0 : response.run);
  const responseTournament = asRecord(response == null ? void 0 : response.tournament);
  return (_d = (_c = (_b = readStringField6(responseRun, ["title", "name"])) != null ? _b : readStringField6(responseTournament, ["title", "name"])) != null ? _c : readStringField6(payload, ["title", "name"])) != null ? _d : targetId;
};
var safeParsePayload = (payload) => {
  try {
    return parseJsonPayload(payload);
  } catch (e) {
    return {};
  }
};
var appendAutomatedAdminAuditEntry = (ctx, logger, nk, action, targetId, targetName, payloadSummary) => {
  try {
    appendTournamentAuditEntry(ctx, logger, nk, { id: targetId, name: targetName }, action, payloadSummary);
  } catch (error) {
    logger.warn("Unable to append automated admin audit entry for %s: %s", targetId, getErrorMessage(error));
  }
};
var runAuditedAdminRpc = (handler, options, ctx, logger, nk, payload) => {
  var _a;
  const parsedPayload = safeParsePayload(payload);
  try {
    const response = handler(ctx, logger, nk, payload);
    const parsedResponse = parseResponseRecord(response);
    const targetId = resolveTargetId(ctx, parsedPayload, parsedResponse, options.targetId);
    const targetName = resolveTargetName(ctx, parsedPayload, parsedResponse, targetId, options.targetName);
    appendAutomatedAdminAuditEntry(
      ctx,
      logger,
      nk,
      options.action,
      targetId,
      targetName,
      createAuditPayloadSummary(parsedPayload)
    );
    return response;
  } catch (error) {
    const targetId = resolveTargetId(ctx, parsedPayload, null, options.targetId);
    const targetName = resolveTargetName(ctx, parsedPayload, null, targetId, options.targetName);
    appendAutomatedAdminAuditEntry(
      ctx,
      logger,
      nk,
      (_a = options.failureAction) != null ? _a : `${options.action}.failed`,
      targetId,
      targetName,
      __spreadProps(__spreadValues({}, createAuditPayloadSummary(parsedPayload)), {
        error: getErrorMessage(error)
      })
    );
    throw error;
  }
};
var listTournamentAuditEntries = (nk, request = {}) => {
  var _a, _b;
  const currentState = readAuditLogState(nk);
  const limit = clampListLimit(request.limit, DEFAULT_AUDIT_LIMIT, MAX_AUDIT_LIMIT);
  const targetId = (_b = (_a = request.targetId) != null ? _a : request.tournamentId) != null ? _b : null;
  const filtered = targetId ? currentState.log.entries.filter(
    (entry) => entry.targetId === targetId || entry.tournamentId === targetId
  ) : currentState.log.entries.slice();
  return filtered.slice(0, limit);
};

// backend/modules/tournaments/admin.ts
var RUNS_COLLECTION = "tournament_runs";
var RUNS_INDEX_KEY = "index";
var RPC_ADMIN_LIST_TOURNAMENTS = "rpc_admin_list_tournaments";
var RPC_ADMIN_GET_TOURNAMENT_RUN = "rpc_admin_get_tournament_run";
var RPC_ADMIN_CREATE_TOURNAMENT_RUN = "rpc_admin_create_tournament_run";
var RPC_ADMIN_OPEN_TOURNAMENT = "rpc_admin_open_tournament";
var RPC_ADMIN_DELETE_TOURNAMENT = "rpc_admin_delete_tournament";
var RPC_ADMIN_CLOSE_TOURNAMENT = "rpc_admin_close_tournament";
var RPC_ADMIN_FINALIZE_TOURNAMENT = "rpc_admin_finalize_tournament";
var RPC_ADMIN_GET_TOURNAMENT_STANDINGS = "rpc_admin_get_tournament_standings";
var RPC_ADMIN_GET_TOURNAMENT_AUDIT_LOG = "rpc_admin_get_tournament_audit_log";
var DEFAULT_CATEGORY = 0;
var DEFAULT_SORT_ORDER = "desc";
var DEFAULT_OPERATOR = "best";
var DEFAULT_DURATION_SECONDS = 3600;
var DEFAULT_MAX_SIZE = 1024;
var DEFAULT_MAX_NUM_SCORE = 3;
var DEFAULT_STANDINGS_LIMIT = 100;
var MAX_STANDINGS_LIMIT = 1e4;
var MAX_RUN_LIST_LIMIT = 100;
var TOURNAMENT_MATCH_QUEUE_COLLECTION = "tournament_match_queue";
var SYSTEM_USER_ID3 = "00000000-0000-0000-0000-000000000000";
var readBooleanField4 = (value, keys) => {
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
var readMetadataField = (value, keys) => {
  const record = asRecord(value);
  if (!record) {
    return {};
  }
  for (const key of keys) {
    const field = asRecord(record[key]);
    if (field) {
      return field;
    }
  }
  return {};
};
var normalizeSortOrder = (value) => {
  if (typeof value === "string" && value.toLowerCase() === "asc") {
    return "asc";
  }
  return "desc";
};
var normalizeOperator = (value) => {
  if (value === "set" || value === "incr" || value === "best") {
    return value;
  }
  return DEFAULT_OPERATOR;
};
var normalizeRunLifecycle = (value) => {
  if (value === "draft" || value === "open" || value === "closed" || value === "finalized") {
    return value;
  }
  return "draft";
};
var clampInteger = (value, fallback, minimum, maximum) => {
  const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.max(minimum, Math.min(maximum, Math.floor(parsed)));
};
var buildRunId = (preferredId, title, existingIds) => {
  const existing = new Set(existingIds);
  const base = slugify(preferredId != null ? preferredId : title) || `tournament-run-${Date.now()}`;
  if (!existing.has(base)) {
    return base;
  }
  let suffix = 2;
  let candidate = `${base}-${suffix}`;
  while (existing.has(candidate)) {
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }
  return candidate;
};
var normalizeStandingsSnapshot = (value) => {
  var _a;
  const record = asRecord(value);
  if (!record) {
    return null;
  }
  const rawRecords = Array.isArray(record.records) ? record.records : [];
  return {
    generatedAt: (_a = readStringField6(record, ["generatedAt", "generated_at"])) != null ? _a : (/* @__PURE__ */ new Date(0)).toISOString(),
    overrideExpiry: clampInteger(readNumberField4(record, ["overrideExpiry", "override_expiry"]), 0, 0, 2147483647),
    rankCount: (() => {
      const rankCount = readNumberField4(record, ["rankCount", "rank_count"]);
      return typeof rankCount === "number" ? rankCount : null;
    })(),
    records: rawRecords.map((entry) => {
      var _a2;
      return (_a2 = asRecord(entry)) != null ? _a2 : {};
    }),
    prevCursor: readStringField6(record, ["prevCursor", "prev_cursor"]),
    nextCursor: readStringField6(record, ["nextCursor", "next_cursor"])
  };
};
var normalizeRunRecord = (value, fallbackId) => {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k;
  const record = asRecord(value);
  if (!record) {
    return null;
  }
  const runId = (_b = (_a = readStringField6(record, ["runId", "run_id"])) != null ? _a : fallbackId) != null ? _b : null;
  const tournamentId = (_c = readStringField6(record, ["tournamentId", "tournament_id"])) != null ? _c : runId;
  const title = readStringField6(record, ["title"]);
  const createdAt = readStringField6(record, ["createdAt", "created_at"]);
  const updatedAt = readStringField6(record, ["updatedAt", "updated_at"]);
  const createdByUserId = readStringField6(record, ["createdByUserId", "created_by_user_id"]);
  const createdByLabel = readStringField6(record, ["createdByLabel", "created_by_label"]);
  if (!runId || !tournamentId || !title || !createdAt || !updatedAt || !createdByUserId || !createdByLabel) {
    return null;
  }
  return {
    runId,
    tournamentId,
    title,
    description: (_d = readStringField6(record, ["description"])) != null ? _d : "",
    category: clampInteger(readNumberField4(record, ["category"]), DEFAULT_CATEGORY, 0, 127),
    authoritative: (_e = readBooleanField4(record, ["authoritative"])) != null ? _e : true,
    sortOrder: normalizeSortOrder((_f = readStringField6(record, ["sortOrder", "sort_order"])) != null ? _f : DEFAULT_SORT_ORDER),
    operator: normalizeOperator((_g = readStringField6(record, ["operator"])) != null ? _g : DEFAULT_OPERATOR),
    resetSchedule: (_h = readStringField6(record, ["resetSchedule", "reset_schedule"])) != null ? _h : "",
    metadata: readMetadataField(record, ["metadata"]),
    startTime: clampInteger(readNumberField4(record, ["startTime", "start_time"]), 0, 0, 2147483647),
    endTime: clampInteger(readNumberField4(record, ["endTime", "end_time"]), 0, 0, 2147483647),
    duration: clampInteger(readNumberField4(record, ["duration"]), DEFAULT_DURATION_SECONDS, 1, 2147483647),
    maxSize: clampInteger(readNumberField4(record, ["maxSize", "max_size"]), DEFAULT_MAX_SIZE, 1, 1e6),
    maxNumScore: clampInteger(
      readNumberField4(record, ["maxNumScore", "max_num_score"]),
      DEFAULT_MAX_NUM_SCORE,
      1,
      1e6
    ),
    joinRequired: (_i = readBooleanField4(record, ["joinRequired", "join_required"])) != null ? _i : true,
    enableRanks: (_j = readBooleanField4(record, ["enableRanks", "enable_ranks"])) != null ? _j : true,
    lifecycle: normalizeRunLifecycle((_k = readStringField6(record, ["lifecycle"])) != null ? _k : "draft"),
    createdAt,
    updatedAt,
    createdByUserId,
    createdByLabel,
    openedAt: readStringField6(record, ["openedAt", "opened_at"]),
    closedAt: readStringField6(record, ["closedAt", "closed_at"]),
    finalizedAt: readStringField6(record, ["finalizedAt", "finalized_at"]),
    finalSnapshot: normalizeStandingsSnapshot(record.finalSnapshot)
  };
};
var normalizeRunIndex = (value) => {
  var _a;
  const record = asRecord(value);
  const runIds = Array.isArray(record == null ? void 0 : record.runIds) ? record == null ? void 0 : record.runIds : [];
  return {
    runIds: Array.from(
      new Set(runIds.filter((entry) => typeof entry === "string" && entry.trim().length > 0))
    ),
    updatedAt: (_a = readStringField6(record, ["updatedAt", "updated_at"])) != null ? _a : (/* @__PURE__ */ new Date(0)).toISOString()
  };
};
var readRunIndexState = (nk) => {
  var _a;
  const objects = nk.storageRead([
    {
      collection: RUNS_COLLECTION,
      key: RUNS_INDEX_KEY
    }
  ]);
  const object = findStorageObject(objects, RUNS_COLLECTION, RUNS_INDEX_KEY);
  return {
    object,
    index: normalizeRunIndex((_a = object == null ? void 0 : object.value) != null ? _a : null)
  };
};
var readRunObject = (nk, runId) => {
  const objects = nk.storageRead([
    {
      collection: RUNS_COLLECTION,
      key: runId
    }
  ]);
  return findStorageObject(objects, RUNS_COLLECTION, runId);
};
var readRunOrThrow = (nk, runId) => {
  var _a;
  const object = readRunObject(nk, runId);
  const run = normalizeRunRecord((_a = object == null ? void 0 : object.value) != null ? _a : null, runId);
  if (!object || !run) {
    throw new Error(`Tournament run '${runId}' was not found.`);
  }
  return run;
};
var readRunsByIds = (nk, runIds) => {
  if (runIds.length === 0) {
    return [];
  }
  const objects = nk.storageRead(
    runIds.map((runId) => ({
      collection: RUNS_COLLECTION,
      key: runId
    }))
  );
  return runIds.map((runId) => {
    var _a;
    const object = findStorageObject(objects, RUNS_COLLECTION, runId);
    return normalizeRunRecord((_a = object == null ? void 0 : object.value) != null ? _a : null, runId);
  }).filter((run) => Boolean(run));
};
var writeRun = (nk, run, version) => {
  nk.storageWrite([
    maybeSetStorageVersion({
      collection: RUNS_COLLECTION,
      key: run.runId,
      value: run,
      permissionRead: STORAGE_PERMISSION_NONE,
      permissionWrite: STORAGE_PERMISSION_NONE
    }, version)
  ]);
};
var writeRunIndex = (nk, index, version) => {
  nk.storageWrite([
    maybeSetStorageVersion({
      collection: RUNS_COLLECTION,
      key: RUNS_INDEX_KEY,
      value: index,
      permissionRead: STORAGE_PERMISSION_NONE,
      permissionWrite: STORAGE_PERMISSION_NONE
    }, version)
  ]);
};
var updateRunWithRetry = (nk, logger, runId, updater) => {
  var _a, _b;
  for (let attempt = 1; attempt <= MAX_WRITE_ATTEMPTS; attempt += 1) {
    const object = readRunObject(nk, runId);
    const current = normalizeRunRecord((_a = object == null ? void 0 : object.value) != null ? _a : null, runId);
    if (!object || !current) {
      throw new Error(`Tournament run '${runId}' was not found.`);
    }
    const next = updater(current);
    try {
      writeRun(nk, next, (_b = getStorageObjectVersion(object)) != null ? _b : "");
      return next;
    } catch (error) {
      if (attempt === MAX_WRITE_ATTEMPTS) {
        throw error;
      }
      logger.warn(
        "Retrying tournament run write for %s after storage conflict: %s",
        runId,
        getErrorMessage(error)
      );
    }
  }
  throw new Error(`Unable to update tournament run '${runId}'.`);
};
var readTournamentArray = (value) => {
  if (Array.isArray(value)) {
    return value.map((entry) => {
      var _a;
      return (_a = asRecord(entry)) != null ? _a : {};
    }).filter((entry) => Object.keys(entry).length > 0);
  }
  const record = asRecord(value);
  const tournaments = Array.isArray(record == null ? void 0 : record.tournaments) ? record.tournaments : [];
  return tournaments.map((entry) => {
    var _a;
    return (_a = asRecord(entry)) != null ? _a : {};
  }).filter((entry) => Object.keys(entry).length > 0);
};
var mapTournamentsById = (value) => {
  return readTournamentArray(value).reduce(
    (accumulator, tournament) => {
      const tournamentId = readStringField6(tournament, ["id"]);
      if (tournamentId) {
        accumulator[tournamentId] = tournament;
      }
      return accumulator;
    },
    {}
  );
};
var getNakamaTournamentById = (nk, tournamentId) => {
  const tournaments = readTournamentArray(nk.tournamentsGetId([tournamentId]));
  return tournaments.length > 0 ? tournaments[0] : null;
};
var getNakamaTournamentsById = (nk, tournamentIds) => {
  const filteredIds = Array.from(new Set(tournamentIds.filter((id) => id.length > 0)));
  if (filteredIds.length === 0) {
    return {};
  }
  return mapTournamentsById(nk.tournamentsGetId(filteredIds));
};
var readTournamentRecordList = (value) => {
  const record = asRecord(value);
  const records = Array.isArray(record == null ? void 0 : record.records) ? record.records : [];
  const ownerRecords = Array.isArray(record == null ? void 0 : record.owner_records) ? record.owner_records : Array.isArray(record == null ? void 0 : record.ownerRecords) ? record.ownerRecords : [];
  return {
    records: records.map((entry) => {
      var _a;
      return (_a = asRecord(entry)) != null ? _a : {};
    }),
    ownerRecords: ownerRecords.map((entry) => {
      var _a;
      return (_a = asRecord(entry)) != null ? _a : {};
    }),
    prevCursor: readStringField6(record, ["prev_cursor", "prevCursor"]),
    nextCursor: readStringField6(record, ["next_cursor", "nextCursor"]),
    rankCount: (() => {
      const parsed = readNumberField4(record, ["rank_count", "rankCount"]);
      return typeof parsed === "number" ? parsed : null;
    })()
  };
};
var resolveOverrideExpiry = (overrideExpiry, tournament) => {
  if (typeof overrideExpiry === "number" && Number.isFinite(overrideExpiry) && overrideExpiry >= 0) {
    return Math.floor(overrideExpiry);
  }
  if (tournament) {
    const endTime = readNumberField4(tournament, ["end_time", "endTime"]);
    if (typeof endTime === "number" && endTime > 0) {
      return Math.floor(endTime);
    }
  }
  return 0;
};
var buildStandingsSnapshot = (nk, tournamentId, limit, overrideExpiry) => {
  const result = readTournamentRecordList(
    nk.tournamentRecordsList(tournamentId, [], limit, "", overrideExpiry)
  );
  return {
    generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    overrideExpiry,
    rankCount: result.rankCount,
    records: result.records,
    prevCursor: result.prevCursor,
    nextCursor: result.nextCursor
  };
};
var readStandingsRecordRank = (record) => {
  const rank = readNumberField4(record, ["rank"]);
  return typeof rank === "number" && Number.isFinite(rank) ? rank : null;
};
var readStandingsRecordOwnerId = (record) => readStringField6(record, ["ownerId", "owner_id"]);
var resolveChampionUserId = (snapshot) => {
  var _a, _b, _c, _d;
  if (snapshot.records.length === 0) {
    return null;
  }
  const rankedRecords = snapshot.records.map((record) => ({
    record,
    rank: readStandingsRecordRank(record)
  })).filter((entry) => entry.rank !== null);
  const championRecord = (_d = (_c = (_a = rankedRecords.find((entry) => entry.rank === 1)) == null ? void 0 : _a.record) != null ? _c : (_b = rankedRecords.slice().sort((left, right) => left.rank - right.rank)[0]) == null ? void 0 : _b.record) != null ? _d : snapshot.records[0];
  return championRecord ? readStandingsRecordOwnerId(championRecord) : null;
};
var sortRuns = (runs) => runs.slice().sort((left, right) => {
  const updatedCompare = right.updatedAt.localeCompare(left.updatedAt);
  if (updatedCompare !== 0) {
    return updatedCompare;
  }
  return left.runId.localeCompare(right.runId);
});
var buildRunResponse = (run, nakamaTournament) => ({
  ok: true,
  run,
  nakamaTournament
});
var deleteRunWithRetry = (nk, logger, run) => {
  for (let attempt = 1; attempt <= MAX_WRITE_ATTEMPTS; attempt += 1) {
    const indexState = readRunIndexState(nk);
    const nextIndex = {
      runIds: indexState.index.runIds.filter((entry) => entry !== run.runId),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    try {
      nk.storageDelete([
        {
          collection: RUNS_COLLECTION,
          key: run.runId
        },
        {
          collection: TOURNAMENT_MATCH_QUEUE_COLLECTION,
          key: run.runId,
          userId: SYSTEM_USER_ID3
        }
      ]);
      writeRunIndex(nk, nextIndex, getStorageObjectVersion(indexState.object));
      return run;
    } catch (error) {
      if (attempt === MAX_WRITE_ATTEMPTS) {
        throw error;
      }
      logger.warn(
        "Retrying tournament run delete for %s after storage conflict: %s",
        run.runId,
        getErrorMessage(error)
      );
    }
  }
  throw new Error(`Unable to delete tournament run '${run.runId}'.`);
};
var rpcAdminListTournaments = (ctx, logger, nk, payload) => {
  return runAuditedAdminRpc(
    (_ctx, _logger, _nk, _payload) => {
      assertAdmin(_ctx, "viewer", _nk);
      const parsed = parseJsonPayload(_payload);
      const limit = clampInteger(parsed.limit, 50, 1, MAX_RUN_LIST_LIMIT);
      const lifecycleFilter = readStringField6(parsed, ["lifecycle"]);
      const indexState = readRunIndexState(_nk);
      const runs = sortRuns(readRunsByIds(_nk, indexState.index.runIds));
      const filteredRuns = lifecycleFilter && (lifecycleFilter === "draft" || lifecycleFilter === "open" || lifecycleFilter === "closed" || lifecycleFilter === "finalized") ? runs.filter((run) => run.lifecycle === lifecycleFilter) : runs;
      const limitedRuns = filteredRuns.slice(0, limit);
      const tournamentsById = getNakamaTournamentsById(
        _nk,
        limitedRuns.map((run) => run.tournamentId)
      );
      const items = limitedRuns.map((run) => {
        var _a;
        return __spreadProps(__spreadValues({}, run), {
          nakamaTournament: (_a = tournamentsById[run.tournamentId]) != null ? _a : null
        });
      });
      return JSON.stringify({
        ok: true,
        runs: items,
        totalCount: filteredRuns.length
      });
    },
    {
      action: RPC_ADMIN_LIST_TOURNAMENTS,
      targetId: "tournament_runs",
      targetName: "Tournament runs"
    },
    ctx,
    logger,
    nk,
    payload
  );
};
var rpcAdminGetTournamentRun = (ctx, logger, nk, payload) => {
  return runAuditedAdminRpc(
    (_ctx, _logger, _nk, _payload) => {
      var _a, _b;
      assertAdmin(_ctx, "viewer", _nk);
      const parsed = parseJsonPayload(_payload);
      const runId = readStringField6(parsed, ["runId", "run_id", "tournamentId", "tournament_id"]);
      if (!runId) {
        throw new Error("runId is required.");
      }
      const run = normalizeRunRecord((_b = (_a = readRunObject(_nk, runId)) == null ? void 0 : _a.value) != null ? _b : null, runId);
      if (!run) {
        return JSON.stringify({
          ok: true,
          run: null,
          nakamaTournament: null
        });
      }
      const nakamaTournament = getNakamaTournamentById(_nk, run.tournamentId);
      return JSON.stringify(buildRunResponse(run, nakamaTournament));
    },
    {
      action: RPC_ADMIN_GET_TOURNAMENT_RUN
    },
    ctx,
    logger,
    nk,
    payload
  );
};
var rpcAdminCreateTournamentRun = (ctx, logger, nk, payload) => {
  return runAuditedAdminRpc(
    (_ctx, _logger, _nk, _payload) => {
      var _a, _b, _c, _d, _e;
      assertAdmin(_ctx, "operator", _nk);
      const parsed = parseJsonPayload(_payload);
      const title = readStringField6(parsed, ["title"]);
      if (!title) {
        throw new Error("title is required.");
      }
      for (let attempt = 1; attempt <= MAX_WRITE_ATTEMPTS; attempt += 1) {
        const indexState = readRunIndexState(_nk);
        const createdAt = (/* @__PURE__ */ new Date()).toISOString();
        const runId = buildRunId(
          readStringField6(parsed, ["runId", "run_id"]),
          title,
          indexState.index.runIds
        );
        const run = {
          runId,
          tournamentId: runId,
          title,
          description: (_a = readStringField6(parsed, ["description"])) != null ? _a : "",
          category: clampInteger(readNumberField4(parsed, ["category"]), DEFAULT_CATEGORY, 0, 127),
          authoritative: (_b = readBooleanField4(parsed, ["authoritative"])) != null ? _b : true,
          sortOrder: normalizeSortOrder(readStringField6(parsed, ["sortOrder", "sort_order"])),
          operator: normalizeOperator(readStringField6(parsed, ["operator"])),
          resetSchedule: (_c = readStringField6(parsed, ["resetSchedule", "reset_schedule"])) != null ? _c : "",
          metadata: readMetadataField(parsed, ["metadata"]),
          startTime: clampInteger(readNumberField4(parsed, ["startTime", "start_time"]), 0, 0, 2147483647),
          endTime: clampInteger(readNumberField4(parsed, ["endTime", "end_time"]), 0, 0, 2147483647),
          duration: clampInteger(readNumberField4(parsed, ["duration"]), DEFAULT_DURATION_SECONDS, 1, 2147483647),
          maxSize: clampInteger(readNumberField4(parsed, ["maxSize", "max_size"]), DEFAULT_MAX_SIZE, 1, 1e6),
          maxNumScore: clampInteger(
            readNumberField4(parsed, ["maxNumScore", "max_num_score"]),
            DEFAULT_MAX_NUM_SCORE,
            1,
            1e6
          ),
          joinRequired: (_d = readBooleanField4(parsed, ["joinRequired", "join_required"])) != null ? _d : true,
          enableRanks: (_e = readBooleanField4(parsed, ["enableRanks", "enable_ranks"])) != null ? _e : true,
          lifecycle: "draft",
          createdAt,
          updatedAt: createdAt,
          createdByUserId: requireAuthenticatedUserId(_ctx),
          createdByLabel: getActorLabel(_ctx),
          openedAt: null,
          closedAt: null,
          finalizedAt: null,
          finalSnapshot: null
        };
        const nextIndex = {
          runIds: [run.runId].concat(indexState.index.runIds),
          updatedAt: createdAt
        };
        try {
          _nk.storageWrite([
            maybeSetStorageVersion({
              collection: RUNS_COLLECTION,
              key: run.runId,
              value: run,
              permissionRead: STORAGE_PERMISSION_NONE,
              permissionWrite: STORAGE_PERMISSION_NONE
            }, null),
            maybeSetStorageVersion({
              collection: RUNS_COLLECTION,
              key: RUNS_INDEX_KEY,
              value: nextIndex,
              permissionRead: STORAGE_PERMISSION_NONE,
              permissionWrite: STORAGE_PERMISSION_NONE
            }, getStorageObjectVersion(indexState.object))
          ]);
          return JSON.stringify(buildRunResponse(run, null));
        } catch (error) {
          if (attempt === MAX_WRITE_ATTEMPTS) {
            throw error;
          }
          _logger.warn("Retrying tournament run create for %s: %s", title, getErrorMessage(error));
        }
      }
      throw new Error("Unable to create tournament run.");
    },
    {
      action: RPC_ADMIN_CREATE_TOURNAMENT_RUN
    },
    ctx,
    logger,
    nk,
    payload
  );
};
var rpcAdminOpenTournament = (ctx, logger, nk, payload) => {
  return runAuditedAdminRpc(
    (_ctx, _logger, _nk, _payload) => {
      assertAdmin(_ctx, "operator", _nk);
      const parsed = parseJsonPayload(_payload);
      const runId = readStringField6(parsed, ["runId", "run_id", "tournamentId", "tournament_id"]);
      if (!runId) {
        throw new Error("runId is required.");
      }
      let createdTournament = false;
      const run = updateRunWithRetry(_nk, _logger, runId, (current) => {
        var _a;
        if (current.lifecycle === "finalized") {
          throw new Error("A finalized tournament run cannot be reopened.");
        }
        if (current.lifecycle === "draft") {
          const existingTournament = getNakamaTournamentById(_nk, current.tournamentId);
          if (!existingTournament) {
            _nk.tournamentCreate(
              current.tournamentId,
              current.authoritative,
              current.sortOrder,
              current.operator,
              current.duration,
              current.resetSchedule,
              current.metadata,
              current.title,
              current.description,
              current.category,
              current.startTime,
              current.endTime,
              current.maxSize,
              current.maxNumScore,
              current.joinRequired,
              current.enableRanks
            );
            createdTournament = true;
          }
        }
        if (current.lifecycle === "open") {
          return current;
        }
        const updatedAt = (/* @__PURE__ */ new Date()).toISOString();
        return __spreadProps(__spreadValues({}, current), {
          lifecycle: "open",
          updatedAt,
          openedAt: (_a = current.openedAt) != null ? _a : updatedAt,
          closedAt: null
        });
      });
      return JSON.stringify(buildRunResponse(run, getNakamaTournamentById(_nk, run.tournamentId)));
    },
    {
      action: RPC_ADMIN_OPEN_TOURNAMENT
    },
    ctx,
    logger,
    nk,
    payload
  );
};
var rpcAdminDeleteTournament = (ctx, logger, nk, payload) => {
  return runAuditedAdminRpc(
    (_ctx, _logger, _nk, _payload) => {
      assertAdmin(_ctx, "admin", _nk);
      const parsed = parseJsonPayload(_payload);
      const runId = readStringField6(parsed, ["runId", "run_id", "tournamentId", "tournament_id"]);
      if (!runId) {
        throw new Error("runId is required.");
      }
      const run = readRunOrThrow(_nk, runId);
      let deletedNakamaTournament = false;
      if (getNakamaTournamentById(_nk, run.tournamentId)) {
        try {
          _nk.tournamentDelete(run.tournamentId);
          deletedNakamaTournament = true;
        } catch (error) {
          _logger.warn(
            "Unable to delete Nakama tournament %s for run %s: %s",
            run.tournamentId,
            run.runId,
            getErrorMessage(error)
          );
        }
      }
      deleteRunWithRetry(_nk, _logger, run);
      return JSON.stringify({
        ok: true,
        deleted: true,
        deletedNakamaTournament,
        run,
        nakamaTournament: null
      });
    },
    {
      action: RPC_ADMIN_DELETE_TOURNAMENT
    },
    ctx,
    logger,
    nk,
    payload
  );
};
var rpcAdminCloseTournament = (ctx, logger, nk, payload) => {
  return runAuditedAdminRpc(
    (_ctx, _logger, _nk, _payload) => {
      assertAdmin(_ctx, "operator", _nk);
      const parsed = parseJsonPayload(_payload);
      const runId = readStringField6(parsed, ["runId", "run_id", "tournamentId", "tournament_id"]);
      if (!runId) {
        throw new Error("runId is required.");
      }
      const run = updateRunWithRetry(_nk, _logger, runId, (current) => {
        var _a;
        if (current.lifecycle === "finalized") {
          throw new Error("A finalized tournament run cannot be closed.");
        }
        if (current.lifecycle === "closed") {
          return current;
        }
        const updatedAt = (/* @__PURE__ */ new Date()).toISOString();
        return __spreadProps(__spreadValues({}, current), {
          lifecycle: "closed",
          updatedAt,
          closedAt: (_a = current.closedAt) != null ? _a : updatedAt
        });
      });
      return JSON.stringify(buildRunResponse(run, getNakamaTournamentById(_nk, run.tournamentId)));
    },
    {
      action: RPC_ADMIN_CLOSE_TOURNAMENT
    },
    ctx,
    logger,
    nk,
    payload
  );
};
var rpcAdminFinalizeTournament = (ctx, logger, nk, payload) => {
  return runAuditedAdminRpc(
    (_ctx, _logger, _nk, _payload) => {
      assertAdmin(_ctx, "admin", _nk);
      const parsed = parseJsonPayload(_payload);
      const runId = readStringField6(parsed, ["runId", "run_id", "tournamentId", "tournament_id"]);
      if (!runId) {
        throw new Error("runId is required.");
      }
      const runBeforeUpdate = readRunOrThrow(_nk, runId);
      const nakamaTournament = getNakamaTournamentById(_nk, runBeforeUpdate.tournamentId);
      const standingsLimit = clampInteger(parsed.limit, DEFAULT_STANDINGS_LIMIT, 1, MAX_STANDINGS_LIMIT);
      const overrideExpiry = resolveOverrideExpiry(
        readNumberField4(parsed, ["overrideExpiry", "override_expiry"]),
        nakamaTournament
      );
      const finalSnapshot = buildStandingsSnapshot(_nk, runBeforeUpdate.tournamentId, standingsLimit, overrideExpiry);
      let disabledRanks = false;
      try {
        _nk.tournamentRanksDisable(runBeforeUpdate.tournamentId);
        disabledRanks = true;
      } catch (error) {
        _logger.warn("Unable to disable ranks for %s during finalization: %s", runBeforeUpdate.runId, String(error));
      }
      const run = updateRunWithRetry(_nk, _logger, runId, (current) => {
        var _a, _b;
        return __spreadProps(__spreadValues({}, current), {
          lifecycle: "finalized",
          updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
          finalizedAt: (_a = current.finalizedAt) != null ? _a : (/* @__PURE__ */ new Date()).toISOString(),
          closedAt: (_b = current.closedAt) != null ? _b : (/* @__PURE__ */ new Date()).toISOString(),
          finalSnapshot
        });
      });
      const championUserId = resolveChampionUserId(finalSnapshot);
      if (championUserId) {
        const rewardSettings = resolveTournamentXpRewardSettings(run.metadata);
        if (rewardSettings.xpForTournamentChampion <= 0) {
          _logger.info("Skipping tournament champion XP for %s because the configured reward is zero.", run.runId);
        } else {
          try {
            const rewardResult = awardXpForTournamentChampion(_nk, _logger, {
              userId: championUserId,
              runId: run.runId,
              awardedXp: rewardSettings.xpForTournamentChampion
            });
            if (!rewardResult.duplicate) {
              _logger.info(
                "Awarded tournament champion XP to %s for run %s. total=%d",
                championUserId,
                run.runId,
                rewardResult.newTotalXp
              );
            }
          } catch (error) {
            _logger.warn(
              "Unable to award tournament champion XP for %s to %s: %s",
              run.runId,
              championUserId,
              getErrorMessage(error)
            );
          }
        }
      } else if (finalSnapshot.records.length > 0) {
        _logger.warn("Unable to resolve champion user ID for finalized tournament %s.", run.runId);
      }
      return JSON.stringify({
        ok: true,
        run,
        nakamaTournament,
        finalSnapshot,
        disabledRanks
      });
    },
    {
      action: RPC_ADMIN_FINALIZE_TOURNAMENT
    },
    ctx,
    logger,
    nk,
    payload
  );
};
var rpcAdminGetTournamentStandings = (ctx, logger, nk, payload) => {
  return runAuditedAdminRpc(
    (_ctx, _logger, _nk, _payload) => {
      assertAdmin(_ctx, "viewer", _nk);
      const parsed = parseJsonPayload(_payload);
      const runId = readStringField6(parsed, ["runId", "run_id", "tournamentId", "tournament_id"]);
      if (!runId) {
        throw new Error("runId is required.");
      }
      const run = readRunOrThrow(_nk, runId);
      const nakamaTournament = getNakamaTournamentById(_nk, run.tournamentId);
      const limit = clampInteger(parsed.limit, DEFAULT_STANDINGS_LIMIT, 1, MAX_STANDINGS_LIMIT);
      const overrideExpiry = resolveOverrideExpiry(
        readNumberField4(parsed, ["overrideExpiry", "override_expiry"]),
        nakamaTournament
      );
      const standings = buildStandingsSnapshot(_nk, run.tournamentId, limit, overrideExpiry);
      return JSON.stringify({
        ok: true,
        run,
        nakamaTournament,
        standings
      });
    },
    {
      action: RPC_ADMIN_GET_TOURNAMENT_STANDINGS
    },
    ctx,
    logger,
    nk,
    payload
  );
};
var rpcAdminGetTournamentAuditLog = (ctx, logger, nk, payload) => {
  return runAuditedAdminRpc(
    (_ctx, _logger, _nk, _payload) => {
      assertAdmin(_ctx, "viewer", _nk);
      const parsed = parseJsonPayload(_payload);
      const runId = readStringField6(parsed, ["runId", "run_id", "tournamentId", "tournament_id"]);
      if (!runId) {
        throw new Error("runId is required.");
      }
      const run = readRunOrThrow(_nk, runId);
      const limit = clampInteger(parsed.limit, 100, 1, 500);
      const entries = listTournamentAuditEntries(_nk, {
        tournamentId: run.runId,
        limit
      });
      return JSON.stringify({
        ok: true,
        runId: run.runId,
        tournamentId: run.tournamentId,
        entries
      });
    },
    {
      action: RPC_ADMIN_GET_TOURNAMENT_AUDIT_LOG,
      targetName: "Tournament audit log"
    },
    ctx,
    logger,
    nk,
    payload
  );
};

// backend/modules/tournaments/joins.ts
var resolveDisplayName = (ctx, requestDisplayName, userId) => {
  if (requestDisplayName && requestDisplayName.trim().length > 0) {
    return requestDisplayName.trim();
  }
  if (typeof ctx === "object" && ctx !== null) {
    const username = readStringField6(ctx, ["username", "displayName", "display_name", "name"]);
    if (username) {
      return username;
    }
    const vars = typeof ctx.vars === "object" && ctx.vars !== null ? ctx.vars : null;
    const fallbackName = readStringField6(vars, ["usernameDisplay", "displayName", "email"]);
    if (fallbackName) {
      return fallbackName;
    }
  }
  return `player-${userId.slice(0, 8)}`;
};
var assertTournamentJoinAllowed = (tournament) => {
  if (tournament.status === "complete" || tournament.status === "cancelled") {
    throw new Error(`Tournament '${tournament.name}' is no longer accepting joins.`);
  }
};
var rpcJoinTournament = (ctx, logger, nk, payload) => {
  var _a, _b, _c;
  const userId = requireAuthenticatedUserId(ctx);
  const parsed = parseJsonPayload(payload);
  const request = {
    tournamentId: (_a = readStringField6(parsed, ["tournamentId", "tournament_id"])) != null ? _a : "",
    displayName: (_b = readStringField6(parsed, ["displayName", "display_name"])) != null ? _b : void 0
  };
  if (!request.tournamentId) {
    throw new Error("tournamentId is required.");
  }
  const current = readTournamentOrThrow(nk, request.tournamentId);
  assertTournamentJoinAllowed(current);
  const displayName = resolveDisplayName(ctx, (_c = request.displayName) != null ? _c : null, userId);
  let joined = false;
  const tournament = updateTournamentWithRetry(nk, logger, request.tournamentId, (existing) => {
    assertTournamentJoinAllowed(existing);
    const existingParticipant = existing.participants.find((participant3) => participant3.userId === userId);
    if (existingParticipant) {
      return existing;
    }
    if (existing.participants.length >= existing.maxParticipants) {
      throw new Error(`Tournament '${existing.name}' is already full.`);
    }
    const participant2 = {
      userId,
      displayName,
      joinedAt: (/* @__PURE__ */ new Date()).toISOString(),
      status: "joined",
      seed: existing.participants.length + 1
    };
    joined = true;
    return {
      id: existing.id,
      slug: existing.slug,
      name: existing.name,
      description: existing.description,
      status: existing.status,
      startsAt: existing.startsAt,
      createdAt: existing.createdAt,
      updatedAt: participant2.joinedAt,
      createdByUserId: existing.createdByUserId,
      createdByLabel: existing.createdByLabel,
      region: existing.region,
      gameMode: existing.gameMode,
      entryFee: existing.entryFee,
      maxParticipants: existing.maxParticipants,
      rewardCurrency: existing.rewardCurrency,
      rewardPoolAmount: existing.rewardPoolAmount,
      rewardNotes: existing.rewardNotes,
      tags: existing.tags.slice(),
      scoring: {
        winPoints: existing.scoring.winPoints,
        drawPoints: existing.scoring.drawPoints,
        lossPoints: existing.scoring.lossPoints,
        allowDraws: existing.scoring.allowDraws
      },
      participants: existing.participants.concat(participant2),
      results: existing.results.slice()
    };
  });
  const participant = tournament.participants.find((entry) => entry.userId === userId);
  if (!participant) {
    throw new Error("Unable to resolve joined participant.");
  }
  if (joined) {
    appendTournamentAuditEntry(ctx, logger, nk, tournament, "tournament.joined", {
      joinedUserId: userId,
      displayName: participant.displayName
    });
  }
  const response = {
    tournament: buildTournamentSummary(tournament),
    participant,
    joined
  };
  return JSON.stringify(response);
};

// backend/modules/tournaments/public.ts
var TOURNAMENT_RUN_MEMBERSHIPS_COLLECTION = "tournament_run_memberships";
var TOURNAMENT_MATCH_QUEUE_COLLECTION2 = "tournament_match_queue";
var DEFAULT_PUBLIC_LIST_LIMIT = 50;
var DEFAULT_PUBLIC_STANDINGS_LIMIT = 256;
var TOURNAMENT_QUEUE_TTL_SECONDS = 300;
var SYSTEM_USER_ID4 = "00000000-0000-0000-0000-000000000000";
var RPC_LIST_PUBLIC_TOURNAMENTS = "list_public_tournaments";
var RPC_GET_PUBLIC_TOURNAMENT = "get_public_tournament";
var RPC_GET_PUBLIC_TOURNAMENT_STANDINGS = "get_public_tournament_standings";
var RPC_JOIN_PUBLIC_TOURNAMENT = "join_public_tournament";
var RPC_LAUNCH_TOURNAMENT_MATCH = "launch_tournament_match";
var normalizeMembershipRecord = (value, fallbackRunId, fallbackUserId) => {
  var _a, _b, _c, _d;
  const record = asRecord(value);
  if (!record) {
    return null;
  }
  const runId = (_a = readStringField6(record, ["runId", "run_id"])) != null ? _a : fallbackRunId;
  const tournamentId = (_b = readStringField6(record, ["tournamentId", "tournament_id"])) != null ? _b : runId;
  const userId = (_c = readStringField6(record, ["userId", "user_id"])) != null ? _c : fallbackUserId;
  const displayName = readStringField6(record, ["displayName", "display_name"]);
  const joinedAt = readStringField6(record, ["joinedAt", "joined_at"]);
  const updatedAt = (_d = readStringField6(record, ["updatedAt", "updated_at"])) != null ? _d : joinedAt;
  if (!runId || !tournamentId || !userId || !displayName || !joinedAt || !updatedAt) {
    return null;
  }
  return {
    runId,
    tournamentId,
    userId,
    displayName,
    joinedAt,
    updatedAt
  };
};
var normalizeMatchQueueRecord = (value, fallbackRunId) => {
  var _a, _b, _c, _d;
  const record = asRecord(value);
  if (!record) {
    return null;
  }
  const runId = (_a = readStringField6(record, ["runId", "run_id"])) != null ? _a : fallbackRunId;
  const tournamentId = (_b = readStringField6(record, ["tournamentId", "tournament_id"])) != null ? _b : runId;
  const matchId = readStringField6(record, ["matchId", "match_id"]);
  const hostUserId = readStringField6(record, ["hostUserId", "host_user_id"]);
  const modeId = (_c = readStringField6(record, ["modeId", "mode_id"])) != null ? _c : "standard";
  const createdAt = readStringField6(record, ["createdAt", "created_at"]);
  const updatedAt = (_d = readStringField6(record, ["updatedAt", "updated_at"])) != null ? _d : createdAt;
  const expiresAt = readStringField6(record, ["expiresAt", "expires_at"]);
  if (!runId || !tournamentId || !matchId || !hostUserId || !createdAt || !updatedAt || !expiresAt) {
    return null;
  }
  return {
    runId,
    tournamentId,
    matchId,
    hostUserId,
    modeId,
    createdAt,
    updatedAt,
    expiresAt,
    claimedByUserId: readStringField6(record, ["claimedByUserId", "claimed_by_user_id"]),
    claimedAt: readStringField6(record, ["claimedAt", "claimed_at"])
  };
};
var toIsoFromUnixSeconds = (seconds, fallback) => {
  if (typeof seconds === "number" && Number.isFinite(seconds) && seconds > 0) {
    return new Date(seconds * 1e3).toISOString();
  }
  return fallback;
};
var readMetadata = (run) => {
  var _a;
  return (_a = asRecord(run.metadata)) != null ? _a : {};
};
var formatPrizeLabel = (metadata) => {
  var _a;
  const explicitPrize = readStringField6(metadata, ["prizePool", "prize_pool", "prizeLabel", "prize_label"]);
  if (explicitPrize) {
    return explicitPrize;
  }
  const buyIn = (_a = readStringField6(metadata, ["buyIn", "buy_in"])) != null ? _a : "Free";
  return buyIn === "Free" ? "No prize listed" : `${buyIn} buy-in`;
};
var buildMembershipState = (membership) => {
  var _a;
  return {
    isJoined: Boolean(membership),
    joinedAt: (_a = membership == null ? void 0 : membership.joinedAt) != null ? _a : null
  };
};
var buildPublicTournamentResponse = (run, nakamaTournament, membership) => {
  var _a, _b, _c, _d, _e, _f, _g, _h;
  const metadata = readMetadata(run);
  const createdAt = run.createdAt;
  return {
    runId: run.runId,
    tournamentId: run.tournamentId,
    name: run.title,
    description: run.description || "No description configured.",
    lifecycle: run.lifecycle,
    startAt: (_b = toIsoFromUnixSeconds(
      (_a = readNumberField4(nakamaTournament, ["startTime", "start_time"])) != null ? _a : run.startTime,
      createdAt
    )) != null ? _b : createdAt,
    endAt: toIsoFromUnixSeconds(
      (_c = readNumberField4(nakamaTournament, ["endTime", "end_time"])) != null ? _c : run.endTime,
      null
    ),
    updatedAt: run.updatedAt,
    entrants: Math.max(0, Math.floor((_d = readNumberField4(nakamaTournament, ["size"])) != null ? _d : 0)),
    maxEntrants: Math.max(
      0,
      Math.floor((_e = readNumberField4(nakamaTournament, ["maxSize", "max_size"])) != null ? _e : run.maxSize)
    ),
    gameMode: (_f = readStringField6(metadata, ["gameMode", "game_mode"])) != null ? _f : "standard",
    region: (_g = readStringField6(metadata, ["region"])) != null ? _g : "Global",
    buyInLabel: (_h = readStringField6(metadata, ["buyIn", "buy_in"])) != null ? _h : "Free",
    prizeLabel: formatPrizeLabel(metadata),
    membership: buildMembershipState(membership)
  };
};
var getRunEndTimeMs = (run, nakamaTournament) => {
  var _a;
  const endTimeSeconds = (_a = readNumberField4(nakamaTournament, ["endTime", "end_time"])) != null ? _a : run.endTime;
  if (typeof endTimeSeconds !== "number" || !Number.isFinite(endTimeSeconds) || endTimeSeconds <= 0) {
    return null;
  }
  return Math.floor(endTimeSeconds * 1e3);
};
var isPublicRunActive = (run, nakamaTournament, nowMs = Date.now()) => {
  if (run.lifecycle !== "open" || !nakamaTournament) {
    return false;
  }
  const endTimeMs = getRunEndTimeMs(run, nakamaTournament);
  return endTimeMs === null || endTimeMs > nowMs;
};
var comparePublicTournamentOrder = (left, right) => {
  const nowMs = Date.now();
  const leftStartMs = Date.parse(left.startAt);
  const rightStartMs = Date.parse(right.startAt);
  const leftStarted = Number.isFinite(leftStartMs) && leftStartMs <= nowMs;
  const rightStarted = Number.isFinite(rightStartMs) && rightStartMs <= nowMs;
  if (leftStarted !== rightStarted) {
    return leftStarted ? -1 : 1;
  }
  if (leftStarted && rightStarted) {
    if (leftStartMs !== rightStartMs) {
      return rightStartMs - leftStartMs;
    }
  } else if (leftStartMs !== rightStartMs) {
    return leftStartMs - rightStartMs;
  }
  const updatedCompare = right.updatedAt.localeCompare(left.updatedAt);
  if (updatedCompare !== 0) {
    return updatedCompare;
  }
  return left.runId.localeCompare(right.runId);
};
var assertPublicRunVisible = (run, nakamaTournament, nowMs = Date.now()) => {
  if (!isPublicRunActive(run, nakamaTournament, nowMs)) {
    throw new Error("This tournament is not available in public play.");
  }
};
var readMembershipObject = (nk, runId, userId) => {
  const objects = nk.storageRead([
    {
      collection: TOURNAMENT_RUN_MEMBERSHIPS_COLLECTION,
      key: runId,
      userId
    }
  ]);
  return findStorageObject(objects, TOURNAMENT_RUN_MEMBERSHIPS_COLLECTION, runId, userId);
};
var readMembership = (nk, runId, userId) => {
  var _a, _b;
  return normalizeMembershipRecord((_b = (_a = readMembershipObject(nk, runId, userId)) == null ? void 0 : _a.value) != null ? _b : null, runId, userId);
};
var readMembershipsByRunId = (nk, runIds, userId) => {
  const filteredRunIds = Array.from(new Set(runIds.filter((runId) => runId.trim().length > 0)));
  if (filteredRunIds.length === 0) {
    return {};
  }
  const objects = nk.storageRead(
    filteredRunIds.map((runId) => ({
      collection: TOURNAMENT_RUN_MEMBERSHIPS_COLLECTION,
      key: runId,
      userId
    }))
  );
  return filteredRunIds.reduce(
    (accumulator, runId) => {
      var _a;
      const object = findStorageObject(objects, TOURNAMENT_RUN_MEMBERSHIPS_COLLECTION, runId, userId);
      accumulator[runId] = normalizeMembershipRecord((_a = object == null ? void 0 : object.value) != null ? _a : null, runId, userId);
      return accumulator;
    },
    {}
  );
};
var writeMembership = (nk, run, userId, displayName) => {
  var _a, _b;
  for (let attempt = 1; attempt <= MAX_WRITE_ATTEMPTS; attempt += 1) {
    const existingObject = readMembershipObject(nk, run.runId, userId);
    const existing = normalizeMembershipRecord((_a = existingObject == null ? void 0 : existingObject.value) != null ? _a : null, run.runId, userId);
    const joinedAt = (_b = existing == null ? void 0 : existing.joinedAt) != null ? _b : (/* @__PURE__ */ new Date()).toISOString();
    const record = {
      runId: run.runId,
      tournamentId: run.tournamentId,
      userId,
      displayName,
      joinedAt,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    try {
      nk.storageWrite([
        maybeSetStorageVersion({
          collection: TOURNAMENT_RUN_MEMBERSHIPS_COLLECTION,
          key: run.runId,
          userId,
          value: record,
          permissionRead: STORAGE_PERMISSION_NONE,
          permissionWrite: STORAGE_PERMISSION_NONE
        }, getStorageObjectVersion(existingObject))
      ]);
      return record;
    } catch (error) {
      if (attempt === MAX_WRITE_ATTEMPTS) {
        throw error;
      }
    }
  }
  throw new Error(`Unable to store membership for tournament '${run.runId}'.`);
};
var readQueueState = (nk, runId) => {
  var _a;
  const objects = nk.storageRead([
    {
      collection: TOURNAMENT_MATCH_QUEUE_COLLECTION2,
      key: runId,
      userId: SYSTEM_USER_ID4
    }
  ]);
  const object = findStorageObject(objects, TOURNAMENT_MATCH_QUEUE_COLLECTION2, runId, SYSTEM_USER_ID4);
  return {
    object,
    queue: normalizeMatchQueueRecord((_a = object == null ? void 0 : object.value) != null ? _a : null, runId)
  };
};
var isQueueExpired = (queue, nowMs = Date.now()) => {
  if (!queue) {
    return true;
  }
  const expiresAtMs = Date.parse(queue.expiresAt);
  return !Number.isFinite(expiresAtMs) || expiresAtMs <= nowMs;
};
var listPublicRuns = (nk) => {
  const indexState = readRunIndexState(nk);
  return readRunsByIds(nk, indexState.index.runIds);
};
var rpcListPublicTournaments = (ctx, _logger, nk, payload) => {
  const userId = requireAuthenticatedUserId(ctx);
  const parsed = parseJsonPayload(payload);
  const limit = clampInteger(parsed.limit, DEFAULT_PUBLIC_LIST_LIMIT, 1, 100);
  const runs = listPublicRuns(nk);
  const tournamentsById = getNakamaTournamentsById(
    nk,
    runs.map((run) => run.tournamentId)
  );
  const membershipsByRunId = readMembershipsByRunId(
    nk,
    runs.map((run) => run.runId),
    userId
  );
  const nowMs = Date.now();
  const visibleRuns = runs.filter(
    (run) => {
      var _a;
      return isPublicRunActive(run, (_a = tournamentsById[run.tournamentId]) != null ? _a : null, nowMs);
    }
  );
  const tournaments = visibleRuns.map(
    (run) => {
      var _a, _b;
      return buildPublicTournamentResponse(
        run,
        (_a = tournamentsById[run.tournamentId]) != null ? _a : null,
        (_b = membershipsByRunId[run.runId]) != null ? _b : null
      );
    }
  ).sort(comparePublicTournamentOrder).slice(0, limit);
  return JSON.stringify({
    ok: true,
    tournaments,
    totalCount: visibleRuns.length
  });
};
var rpcGetPublicTournament = (ctx, _logger, nk, payload) => {
  const userId = requireAuthenticatedUserId(ctx);
  const parsed = parseJsonPayload(payload);
  const runId = readStringField6(parsed, ["runId", "run_id", "tournamentRunId", "tournament_run_id", "tournamentId", "tournament_id"]);
  if (!runId) {
    throw new Error("runId is required.");
  }
  const run = readRunOrThrow(nk, runId);
  const nakamaTournament = getNakamaTournamentById(nk, run.tournamentId);
  assertPublicRunVisible(run, nakamaTournament);
  return JSON.stringify({
    ok: true,
    tournament: buildPublicTournamentResponse(
      run,
      nakamaTournament,
      readMembership(nk, run.runId, userId)
    )
  });
};
var rpcGetPublicTournamentStandings = (ctx, _logger, nk, payload) => {
  var _a;
  requireAuthenticatedUserId(ctx);
  const parsed = parseJsonPayload(payload);
  const runId = readStringField6(parsed, ["runId", "run_id", "tournamentRunId", "tournament_run_id", "tournamentId", "tournament_id"]);
  if (!runId) {
    throw new Error("runId is required.");
  }
  const run = readRunOrThrow(nk, runId);
  const nakamaTournament = getNakamaTournamentById(nk, run.tournamentId);
  assertPublicRunVisible(run, nakamaTournament);
  const limit = clampInteger(
    (_a = parsed.limit) != null ? _a : run.maxSize,
    Math.max(DEFAULT_PUBLIC_STANDINGS_LIMIT, run.maxSize),
    1,
    MAX_STANDINGS_LIMIT
  );
  const standings = buildStandingsSnapshot(nk, run.tournamentId, limit, 0);
  return JSON.stringify({
    ok: true,
    tournamentRunId: run.runId,
    tournamentId: run.tournamentId,
    standings
  });
};
var rpcJoinPublicTournament = (ctx, logger, nk, payload) => {
  var _a, _b;
  const userId = requireAuthenticatedUserId(ctx);
  requireCompletedUsernameOnboarding(nk, userId);
  const parsed = parseJsonPayload(payload);
  const runId = readStringField6(parsed, ["runId", "run_id", "tournamentRunId", "tournament_run_id", "tournamentId", "tournament_id"]);
  if (!runId) {
    throw new Error("runId is required.");
  }
  const run = readRunOrThrow(nk, runId);
  const nakamaTournamentBeforeJoin = getNakamaTournamentById(nk, run.tournamentId);
  assertPublicRunVisible(run, nakamaTournamentBeforeJoin);
  const existingMembership = readMembership(nk, run.runId, userId);
  const displayName = getActorLabel(ctx);
  let joined = false;
  if (!existingMembership) {
    const entrantsBeforeJoin = Math.max(0, Math.floor((_a = readNumberField4(nakamaTournamentBeforeJoin, ["size"])) != null ? _a : 0));
    const maxEntrants = Math.max(
      0,
      Math.floor((_b = readNumberField4(nakamaTournamentBeforeJoin, ["maxSize", "max_size"])) != null ? _b : run.maxSize)
    );
    if (maxEntrants > 0 && entrantsBeforeJoin >= maxEntrants) {
      throw new Error("This tournament is already full.");
    }
    nk.tournamentJoin(run.tournamentId, userId, displayName);
    writeMembership(nk, run, userId, displayName);
    joined = true;
    appendTournamentAuditEntry(ctx, logger, nk, { id: run.runId, name: run.title }, "tournament.public_joined", {
      joinedUserId: userId,
      displayName
    });
  }
  return JSON.stringify({
    ok: true,
    joined,
    tournament: buildPublicTournamentResponse(
      run,
      getNakamaTournamentById(nk, run.tournamentId),
      readMembership(nk, run.runId, userId)
    )
  });
};
var rpcLaunchTournamentMatch = (ctx, logger, nk, payload) => {
  var _a;
  const userId = requireAuthenticatedUserId(ctx);
  requireCompletedUsernameOnboarding(nk, userId);
  const parsed = parseJsonPayload(payload);
  const runId = readStringField6(parsed, ["runId", "run_id", "tournamentRunId", "tournament_run_id", "tournamentId", "tournament_id"]);
  if (!runId) {
    throw new Error("runId is required.");
  }
  const run = readRunOrThrow(nk, runId);
  const nakamaTournament = getNakamaTournamentById(nk, run.tournamentId);
  assertPublicRunVisible(run, nakamaTournament);
  const membership = readMembership(nk, run.runId, userId);
  if (!membership) {
    throw new Error("Join this tournament before launching a match.");
  }
  const nowMs = Date.now();
  const startAtMs = run.startTime > 0 ? run.startTime * 1e3 : 0;
  if (startAtMs > nowMs) {
    throw new Error("This tournament has not started yet.");
  }
  const metadata = readMetadata(run);
  const modeId = (_a = readStringField6(metadata, ["gameMode", "game_mode"])) != null ? _a : "standard";
  const rewardSettings = resolveTournamentXpRewardSettings(metadata);
  for (let attempt = 1; attempt <= MAX_WRITE_ATTEMPTS; attempt += 1) {
    const queueState = readQueueState(nk, run.runId);
    const activeQueue = queueState.queue && !queueState.queue.claimedByUserId && !isQueueExpired(queueState.queue, nowMs) ? queueState.queue : null;
    if (activeQueue && activeQueue.hostUserId === userId) {
      return JSON.stringify({
        ok: true,
        matchId: activeQueue.matchId,
        matchToken: null,
        tournamentRunId: run.runId,
        tournamentId: run.tournamentId,
        playerState: "waiting",
        nextRoundReady: false,
        queueStatus: "waiting_for_opponent",
        statusMessage: "Waiting for opponent to join."
      });
    }
    if (activeQueue && activeQueue.hostUserId !== userId) {
      const claimedQueue = __spreadProps(__spreadValues({}, activeQueue), {
        updatedAt: new Date(nowMs).toISOString(),
        claimedByUserId: userId,
        claimedAt: new Date(nowMs).toISOString()
      });
      try {
        nk.storageWrite([
          maybeSetStorageVersion({
            collection: TOURNAMENT_MATCH_QUEUE_COLLECTION2,
            key: run.runId,
            userId: SYSTEM_USER_ID4,
            value: claimedQueue,
            permissionRead: STORAGE_PERMISSION_NONE,
            permissionWrite: STORAGE_PERMISSION_NONE
          }, getStorageObjectVersion(queueState.object))
        ]);
        appendTournamentAuditEntry(ctx, logger, nk, { id: run.runId, name: run.title }, "tournament.match_launch.claimed", {
          matchId: activeQueue.matchId,
          hostUserId: activeQueue.hostUserId,
          guestUserId: userId
        });
        return JSON.stringify({
          ok: true,
          matchId: activeQueue.matchId,
          matchToken: null,
          tournamentRunId: run.runId,
          tournamentId: run.tournamentId,
          playerState: "matched",
          nextRoundReady: true,
          queueStatus: "matched",
          statusMessage: "Opponent found."
        });
      } catch (error) {
        if (attempt === MAX_WRITE_ATTEMPTS) {
          throw error;
        }
        logger.warn(
          "Retrying tournament queue claim for %s after storage conflict: %s",
          run.runId,
          getErrorMessage(error)
        );
        continue;
      }
    }
    const createdAt = new Date(nowMs).toISOString();
    const expiresAt = new Date(nowMs + TOURNAMENT_QUEUE_TTL_SECONDS * 1e3).toISOString();
    const matchId = nk.matchCreate("authoritative_match", {
      playerIds: [userId],
      modeId,
      rankedMatch: true,
      casualMatch: false,
      botMatch: false,
      privateMatch: false,
      winRewardSource: "pvp_win",
      allowsChallengeRewards: true,
      tournamentRunId: run.runId,
      tournamentId: run.tournamentId,
      tournamentMatchWinXp: rewardSettings.xpPerMatchWin,
      tournamentChampionXp: rewardSettings.xpForTournamentChampion,
      // Current public tournaments operate as elimination runs: a loss ends the player's run.
      tournamentEliminationRisk: true
    });
    const nextQueue = {
      runId: run.runId,
      tournamentId: run.tournamentId,
      matchId,
      hostUserId: userId,
      modeId,
      createdAt,
      updatedAt: createdAt,
      expiresAt,
      claimedByUserId: null,
      claimedAt: null
    };
    try {
      nk.storageWrite([
        maybeSetStorageVersion({
          collection: TOURNAMENT_MATCH_QUEUE_COLLECTION2,
          key: run.runId,
          userId: SYSTEM_USER_ID4,
          value: nextQueue,
          permissionRead: STORAGE_PERMISSION_NONE,
          permissionWrite: STORAGE_PERMISSION_NONE
        }, getStorageObjectVersion(queueState.object))
      ]);
      appendTournamentAuditEntry(ctx, logger, nk, { id: run.runId, name: run.title }, "tournament.match_launch.created", {
        matchId,
        hostUserId: userId
      });
      return JSON.stringify({
        ok: true,
        matchId,
        matchToken: null,
        tournamentRunId: run.runId,
        tournamentId: run.tournamentId,
        playerState: "waiting",
        nextRoundReady: false,
        queueStatus: "waiting_for_opponent",
        statusMessage: "Waiting for opponent to join."
      });
    } catch (error) {
      if (attempt === MAX_WRITE_ATTEMPTS) {
        throw error;
      }
      logger.warn(
        "Retrying tournament queue create for %s after storage conflict: %s",
        run.runId,
        getErrorMessage(error)
      );
    }
  }
  throw new Error("Unable to launch a tournament match right now.");
};

// backend/modules/tournaments/matchResults.ts
var TOURNAMENT_RUNS_COLLECTION = "tournament_runs";
var TOURNAMENT_MATCH_RESULTS_COLLECTION = "tournament_match_results";
var normalizeOperator2 = (value) => {
  if (value === "set" || value === "incr" || value === "best") {
    return value;
  }
  return "best";
};
var normalizeRunLifecycle2 = (value) => {
  if (value === "draft" || value === "open" || value === "closed" || value === "finalized") {
    return value;
  }
  return "draft";
};
var normalizeMetadata = (value) => {
  var _a;
  return (_a = asRecord(value)) != null ? _a : {};
};
var normalizeRunSnapshot = (value, fallbackRunId) => {
  var _a, _b, _c, _d;
  const record = asRecord(value);
  if (!record) {
    return null;
  }
  const runId = (_a = readStringField6(record, ["runId", "run_id"])) != null ? _a : fallbackRunId;
  const tournamentId = (_b = readStringField6(record, ["tournamentId", "tournament_id"])) != null ? _b : runId;
  const title = readStringField6(record, ["title"]);
  const updatedAt = readStringField6(record, ["updatedAt", "updated_at"]);
  if (!runId || !tournamentId || !title || !updatedAt) {
    return null;
  }
  return {
    runId,
    tournamentId,
    title,
    lifecycle: normalizeRunLifecycle2((_c = readStringField6(record, ["lifecycle"])) != null ? _c : "draft"),
    operator: normalizeOperator2((_d = readStringField6(record, ["operator"])) != null ? _d : "best"),
    joinRequired: record.joinRequired !== false,
    metadata: normalizeMetadata(record.metadata),
    updatedAt
  };
};
var readTournamentRunState = (nk, runId) => {
  var _a, _b;
  const objects = nk.storageRead([
    {
      collection: TOURNAMENT_RUNS_COLLECTION,
      key: runId
    }
  ]);
  const object = findStorageObject(objects, TOURNAMENT_RUNS_COLLECTION, runId);
  const value = (_a = asRecord(object == null ? void 0 : object.value)) != null ? _a : null;
  return {
    object,
    value,
    run: normalizeRunSnapshot((_b = object == null ? void 0 : object.value) != null ? _b : null, runId)
  };
};
var readTournamentMatchResultObject = (nk, resultId) => {
  const objects = nk.storageRead([
    {
      collection: TOURNAMENT_MATCH_RESULTS_COLLECTION,
      key: resultId
    }
  ]);
  return findStorageObject(objects, TOURNAMENT_MATCH_RESULTS_COLLECTION, resultId);
};
var buildTournamentMatchResultId = (context, matchId) => `${context.runId}:${matchId}`;
var mapOperatorToOverride = (operator) => {
  if (operator === "best") {
    return 1;
  }
  if (operator === "set") {
    return 2;
  }
  if (operator === "incr") {
    return 3;
  }
  return 0;
};
var buildInvalidReason = (completion, run) => {
  var _a, _b;
  if (!completion.winningColor || !completion.winnerUserId || !completion.loserUserId) {
    return "Match winner could not be determined.";
  }
  if (completion.players.length !== 2) {
    return "Tournament matches require exactly two assigned players.";
  }
  const distinctUserIds = new Set(
    completion.players.map((player) => player.userId.trim()).filter((userId) => userId.length > 0)
  );
  if (distinctUserIds.size !== 2) {
    return "Tournament matches require two distinct players.";
  }
  if (completion.classification.private) {
    return "Private matches do not count toward tournaments.";
  }
  if (completion.classification.bot) {
    return "Bot matches do not count toward tournaments.";
  }
  if (completion.classification.casual) {
    return "Casual matches do not count toward tournaments.";
  }
  if (completion.classification.experimental) {
    return "Experimental matches do not count toward tournaments.";
  }
  if (completion.totalMoves < 1) {
    return "Matches without at least one applied move do not count toward tournaments.";
  }
  if (!run) {
    return `Tournament run '${(_b = (_a = completion.context) == null ? void 0 : _a.runId) != null ? _b : ""}' was not found.`;
  }
  if (run.lifecycle !== "open") {
    return `Tournament run '${run.runId}' is not open.`;
  }
  if (!completion.context || completion.context.tournamentId !== run.tournamentId) {
    return "Tournament context did not match the configured Nakama tournament.";
  }
  return null;
};
var normalizeUsersArray = (value) => Array.isArray(value) ? value.map((entry) => {
  var _a;
  return (_a = asRecord(entry)) != null ? _a : {};
}).filter((entry) => Object.keys(entry).length > 0) : [];
var resolveUsernames = (nk, logger, players) => {
  const usernames = {};
  players.forEach((player) => {
    var _a;
    const trimmedUsername = (_a = player.username) == null ? void 0 : _a.trim();
    if (trimmedUsername) {
      usernames[player.userId] = trimmedUsername;
    }
  });
  const unresolvedUserIds = players.map((player) => player.userId).filter((userId) => userId.length > 0 && !usernames[userId]);
  if (unresolvedUserIds.length > 0 && typeof nk.usersGetId === "function") {
    try {
      const users = normalizeUsersArray(nk.usersGetId(unresolvedUserIds));
      users.forEach((user) => {
        const userId = readStringField6(user, ["userId", "user_id", "id"]);
        const username = readStringField6(user, ["username", "displayName", "display_name"]);
        if (userId && username) {
          usernames[userId] = username;
        }
      });
    } catch (error) {
      logger.warn(
        "Unable to resolve tournament usernames for %s: %s",
        unresolvedUserIds.join(","),
        getErrorMessage(error)
      );
    }
  }
  players.forEach((player) => {
    if (!usernames[player.userId]) {
      usernames[player.userId] = player.userId;
    }
  });
  return usernames;
};
var ensureTournamentJoined = (nk, run, players, usernames) => {
  if (!run.joinRequired) {
    return;
  }
  players.forEach((player) => {
    var _a;
    nk.tournamentJoin(run.tournamentId, player.userId, (_a = usernames[player.userId]) != null ? _a : player.userId);
  });
};
var submitTournamentScores = (nk, run, completion, usernames) => {
  const operatorOverride = mapOperatorToOverride(run.operator);
  return completion.players.map((player) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i;
    const opponentUserId = (_b = (_a = completion.players.find((candidate) => candidate.userId !== player.userId)) == null ? void 0 : _a.userId) != null ? _b : null;
    const metadata = {
      matchId: completion.matchId,
      runId: run.runId,
      tournamentId: run.tournamentId,
      round: (_d = (_c = completion.context) == null ? void 0 : _c.round) != null ? _d : null,
      entryId: (_f = (_e = completion.context) == null ? void 0 : _e.entryId) != null ? _f : null,
      modeId: completion.modeId,
      totalMoves: completion.totalMoves,
      completedAt: completion.completedAt,
      opponentUserId,
      result: player.didWin ? "win" : "loss",
      winningColor: completion.winningColor,
      winnerUserId: completion.winnerUserId
    };
    const record = nk.tournamentRecordWrite(
      run.tournamentId,
      player.userId,
      (_g = usernames[player.userId]) != null ? _g : player.userId,
      player.score,
      player.finishedCount,
      metadata,
      operatorOverride
    );
    return {
      userId: player.userId,
      username: (_h = usernames[player.userId]) != null ? _h : null,
      score: player.score,
      subscore: player.finishedCount,
      result: (_i = asRecord(record)) != null ? _i : null
    };
  });
};
var writeTournamentMatchResultRecord = (nk, record) => {
  nk.storageWrite([
    maybeSetStorageVersion({
      collection: TOURNAMENT_MATCH_RESULTS_COLLECTION,
      key: record.resultId,
      value: record,
      permissionRead: STORAGE_PERMISSION_NONE,
      permissionWrite: STORAGE_PERMISSION_NONE
    }, null)
  ]);
};
var updateTournamentRunMetadata = (nk, logger, runId, result) => {
  var _a, _b;
  for (let attempt = 1; attempt <= MAX_WRITE_ATTEMPTS; attempt += 1) {
    const currentState = readTournamentRunState(nk, runId);
    if (!currentState.object || !currentState.value) {
      return;
    }
    const currentMetadata = normalizeMetadata(currentState.value.metadata);
    const currentCount = Math.max(
      0,
      Math.floor((_a = readNumberField4(currentMetadata, ["countedMatchCount", "validMatchCount"])) != null ? _a : 0)
    );
    const nextMetadata = __spreadProps(__spreadValues({}, currentMetadata), {
      countedMatchCount: result.counted ? currentCount + 1 : currentCount,
      lastProcessedMatchId: result.matchId,
      lastProcessedResultId: result.resultId,
      lastProcessedAt: result.updatedAt,
      lastProcessedWasCounted: result.counted,
      lastProcessedReason: (_b = result.invalidReason) != null ? _b : result.errorMessage,
      lastWinnerUserId: result.summary.winnerUserId
    });
    const nextValue = __spreadProps(__spreadValues({}, currentState.value), {
      updatedAt: result.updatedAt,
      metadata: nextMetadata
    });
    try {
      nk.storageWrite([
        maybeSetStorageVersion({
          collection: TOURNAMENT_RUNS_COLLECTION,
          key: runId,
          value: nextValue,
          permissionRead: STORAGE_PERMISSION_NONE,
          permissionWrite: STORAGE_PERMISSION_NONE
        }, getStorageObjectVersion(currentState.object))
      ]);
      return;
    } catch (error) {
      if (attempt === MAX_WRITE_ATTEMPTS) {
        throw error;
      }
      logger.warn(
        "Retrying tournament run metadata update for %s after storage conflict: %s",
        runId,
        getErrorMessage(error)
      );
    }
  }
};
var resolveTournamentMatchContextFromParams = (params) => {
  var _a, _b;
  const runId = readStringField6(params, ["tournamentRunId", "tournament_run_id", "runId", "run_id"]);
  const tournamentId = readStringField6(params, ["tournamentId", "tournament_id"]);
  if (!runId && !tournamentId) {
    return null;
  }
  const normalizedRunId = (_a = runId != null ? runId : tournamentId) != null ? _a : null;
  if (!normalizedRunId) {
    return null;
  }
  const round = readNumberField4(params, ["tournamentRound", "tournament_round", "round"]);
  return {
    runId: normalizedRunId,
    tournamentId: tournamentId != null ? tournamentId : normalizedRunId,
    round: typeof round === "number" && Number.isFinite(round) ? Math.max(1, Math.floor(round)) : null,
    entryId: (_b = readStringField6(params, [
      "tournamentEntryId",
      "tournament_entry_id",
      "tournamentMatchId",
      "tournament_match_id",
      "bracketMatchId",
      "bracket_match_id"
    ])) != null ? _b : null,
    eliminationRisk: params.tournamentEliminationRisk === true
  };
};
var processCompletedAuthoritativeTournamentMatch = (nk, logger, completion) => {
  var _a, _b;
  if (!completion.context) {
    return {
      skipped: true,
      duplicate: false,
      record: null
    };
  }
  const resultId = buildTournamentMatchResultId(completion.context, completion.matchId);
  if (readTournamentMatchResultObject(nk, resultId)) {
    logger.info("Skipping duplicate tournament result for %s", resultId);
    return {
      skipped: false,
      duplicate: true,
      record: null
    };
  }
  const runState = readTournamentRunState(nk, completion.context.runId);
  const invalidReason = buildInvalidReason(completion, runState.run);
  let tournamentRecordWrites = [];
  let errorMessage = null;
  if (!invalidReason && runState.run) {
    try {
      const usernames = resolveUsernames(nk, logger, completion.players);
      ensureTournamentJoined(nk, runState.run, completion.players, usernames);
      tournamentRecordWrites = submitTournamentScores(nk, runState.run, completion, usernames);
    } catch (error) {
      errorMessage = getErrorMessage(error);
      logger.error(
        "Failed to submit tournament scores for run %s on match %s: %s",
        completion.context.runId,
        completion.matchId,
        errorMessage
      );
    }
  }
  const record = {
    resultId,
    matchId: completion.matchId,
    runId: completion.context.runId,
    tournamentId: (_b = (_a = runState.run) == null ? void 0 : _a.tournamentId) != null ? _b : completion.context.tournamentId,
    createdAt: completion.completedAt,
    updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    valid: invalidReason === null,
    counted: invalidReason === null && errorMessage === null,
    invalidReason,
    summary: {
      modeId: completion.modeId,
      totalMoves: completion.totalMoves,
      revision: completion.revision,
      completedAt: completion.completedAt,
      round: completion.context.round,
      entryId: completion.context.entryId,
      winningColor: completion.winningColor,
      winnerUserId: completion.winnerUserId,
      loserUserId: completion.loserUserId,
      classification: completion.classification,
      players: completion.players.map((player) => __spreadValues({}, player))
    },
    tournamentRecordWrites,
    errorMessage
  };
  try {
    writeTournamentMatchResultRecord(nk, record);
  } catch (error) {
    if (readTournamentMatchResultObject(nk, resultId)) {
      logger.info("Skipping duplicate tournament result after concurrent write for %s", resultId);
      return {
        skipped: false,
        duplicate: true,
        record: null
      };
    }
    throw error;
  }
  if (runState.run) {
    try {
      updateTournamentRunMetadata(nk, logger, runState.run.runId, record);
    } catch (error) {
      logger.warn(
        "Unable to update tournament run metadata for %s after match %s: %s",
        runState.run.runId,
        completion.matchId,
        getErrorMessage(error)
      );
    }
  }
  return {
    skipped: false,
    duplicate: false,
    record
  };
};

// backend/modules/index.ts
var TICK_RATE = 10;
var MAX_PLAYERS = 2;
var ONLINE_TTL_MS = 3e4;
var ONLINE_TURN_DURATION_MS = 1e4;
var ONLINE_AFK_FORFEIT_MS = 9e4;
var SYSTEM_USER_ID5 = "00000000-0000-0000-0000-000000000000";
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
var asRecord3 = (value) => typeof value === "object" && value !== null ? value : null;
var readStringField8 = (value, keys) => {
  const record = asRecord3(value);
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
var readNumberField5 = (value, keys) => {
  const record = asRecord3(value);
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
  const binaryToString = (_a = asRecord3(nk)) == null ? void 0 : _a.binaryToString;
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
var getPresenceUserId = (presence) => readStringField8(presence, ["userId", "user_id"]);
var getPresenceSessionId = (presence) => readStringField8(presence, ["sessionId", "session_id"]);
var getSenderUserId = (sender) => readStringField8(sender, ["userId", "user_id"]);
var getPresenceKey = (presence) => {
  const sessionId = getPresenceSessionId(presence);
  if (sessionId) {
    return sessionId;
  }
  const userId = getPresenceUserId(presence);
  return userId ? `user:${userId}` : null;
};
var getMatchId = (ctx) => {
  var _a;
  return (_a = readStringField8(ctx, ["matchId", "match_id"])) != null ? _a : "";
};
var getMessageOpCode = (message) => readNumberField5(message, ["opCode", "op_code"]);
var getContextUserId2 = (ctx) => readStringField8(ctx, ["userId", "user_id"]);
var resolveMatchModeId = (value) => isMatchModeId(value) ? value : "standard";
var resolveConfiguredRewardXp = (value) => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }
  return Math.max(0, Math.floor(value));
};
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
  playerTurnCount: 0,
  maxRollCount: 0,
  unusableRollCount: 0,
  capturesMade: 0,
  capturesSuffered: 0,
  captureTurnNumbers: [],
  currentCaptureTurnStreak: 0,
  maxCaptureTurnStreak: 0,
  contestedTilesLandedCount: 0,
  wasBehindDuringMatch: false,
  behindCheckpointCount: 0,
  behindReasons: /* @__PURE__ */ new Set(),
  firstStartingAreaExitTurn: null,
  opponentReachedBrink: false,
  lastBehindTurnIndex: null,
  momentumShiftAchieved: false,
  momentumShiftTurnSpan: null,
  maxActivePiecesOnBoard: 0
});
var createMatchTelemetry = () => ({
  totalMoves: 0,
  totalTurns: 0,
  players: {
    light: createPlayerTelemetry(),
    dark: createPlayerTelemetry()
  }
});
var createPlayerAfkState = () => ({
  accumulatedMs: 0,
  timeoutCount: 0,
  lastMeaningfulActionAtMs: null,
  lastTimeoutAtMs: null
});
var createMatchTimerState = () => ({
  turnDurationMs: ONLINE_TURN_DURATION_MS,
  turnStartedAtMs: null,
  turnDeadlineMs: null,
  activePlayerColor: null,
  activePlayerUserId: null,
  activePhase: null,
  resetReason: null
});
var detectCaptureOnMove = (state, move) => {
  const moverColor = state.currentTurn;
  const opponentColor = moverColor === "light" ? "dark" : "light";
  const targetCoord = getPathCoord(state.matchConfig.pathVariant, moverColor, move.toIndex);
  if (!targetCoord) {
    return false;
  }
  return state[opponentColor].pieces.some((piece) => {
    if (piece.position < 0 || piece.isFinished) {
      return false;
    }
    const pieceCoord = getPathCoord(state.matchConfig.pathVariant, opponentColor, piece.position);
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
var updateActivePieceTelemetry = (state) => {
  const pathLength = getPathLength(state.gameState.matchConfig.pathVariant);
  ["light", "dark"].forEach((playerColor) => {
    const activePieceCount = countActivePiecesOnBoard(state.gameState[playerColor], pathLength);
    state.telemetry.players[playerColor].maxActivePiecesOnBoard = Math.max(
      state.telemetry.players[playerColor].maxActivePiecesOnBoard,
      activePieceCount
    );
  });
};
var updateStartingAreaExitTelemetry = (state, playerColor) => {
  const playerTelemetry = state.telemetry.players[playerColor];
  if (playerTelemetry.firstStartingAreaExitTurn !== null) {
    return;
  }
  if (!hasPlayerExitedStartingArea(state.gameState[playerColor], state.gameState.matchConfig.pathVariant)) {
    return;
  }
  playerTelemetry.firstStartingAreaExitTurn = playerTelemetry.playerTurnCount;
};
var updateOpponentBrinkTelemetry = (state) => {
  ["light", "dark"].forEach((playerColor) => {
    const opponentColor = getOtherPlayerColor(playerColor);
    if (isOneSuccessfulMoveFromVictory(state.gameState, opponentColor)) {
      state.telemetry.players[playerColor].opponentReachedBrink = true;
    }
  });
};
var updateMomentumTelemetry = (state) => {
  const turnIndex = state.telemetry.totalTurns;
  ["light", "dark"].forEach((playerColor) => {
    const playerTelemetry = state.telemetry.players[playerColor];
    const relation = getPositionLeadRelation(state.gameState, playerColor);
    if (relation === "behind") {
      playerTelemetry.lastBehindTurnIndex = turnIndex;
      return;
    }
    if (relation !== "ahead" || playerTelemetry.lastBehindTurnIndex === null) {
      return;
    }
    const turnSpan = turnIndex - playerTelemetry.lastBehindTurnIndex;
    if (turnSpan > CHALLENGE_THRESHOLDS.MOMENTUM_SHIFT_MAX_TURN_WINDOW) {
      return;
    }
    playerTelemetry.momentumShiftAchieved = true;
    playerTelemetry.momentumShiftTurnSpan = playerTelemetry.momentumShiftTurnSpan === null ? turnSpan : Math.min(playerTelemetry.momentumShiftTurnSpan, turnSpan);
  });
};
var completePlayerTurnTelemetry = (state, playerColor, options) => {
  const playerTelemetry = state.telemetry.players[playerColor];
  state.telemetry.totalTurns += 1;
  playerTelemetry.playerTurnCount += 1;
  if (options.unusableRoll) {
    playerTelemetry.unusableRollCount += 1;
    playerTelemetry.currentCaptureTurnStreak = 0;
  } else if (options.didCapture) {
    playerTelemetry.captureTurnNumbers.push(playerTelemetry.playerTurnCount);
    playerTelemetry.currentCaptureTurnStreak += 1;
    playerTelemetry.maxCaptureTurnStreak = Math.max(
      playerTelemetry.maxCaptureTurnStreak,
      playerTelemetry.currentCaptureTurnStreak
    );
  } else {
    playerTelemetry.currentCaptureTurnStreak = 0;
  }
  updateStartingAreaExitTelemetry(state, playerColor);
  updateActivePieceTelemetry(state);
  updateComebackTelemetry(state);
  updateMomentumTelemetry(state);
  updateOpponentBrinkTelemetry(state);
};
var parseRpcPayload = (payload) => {
  var _a;
  if (!payload) {
    return {};
  }
  const data = JSON.parse(payload);
  return (_a = asRecord3(data)) != null ? _a : {};
};
var normalizePrivateMatchCodeRecord = (value) => {
  var _a;
  const record = asRecord3(value);
  if (!record) {
    return null;
  }
  const code = normalizePrivateMatchCodeInput((_a = readStringField8(record, ["code"])) != null ? _a : "");
  const matchId = readStringField8(record, ["matchId", "match_id"]);
  const modeId = record.modeId;
  const creatorUserId = readStringField8(record, ["creatorUserId", "creator_user_id"]);
  const joinedUserId = readStringField8(record, ["joinedUserId", "joined_user_id"]);
  const createdAt = readStringField8(record, ["createdAt", "created_at"]);
  const updatedAt = readStringField8(record, ["updatedAt", "updated_at"]);
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
      userId: SYSTEM_USER_ID5
    }
  ]);
  const object = findStorageObject(objects, PRIVATE_MATCH_CODE_COLLECTION, normalizedCode, SYSTEM_USER_ID5);
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
var getUserPresenceTargets = (state, userId) => {
  var _a;
  return Object.values((_a = state.presences[userId]) != null ? _a : {});
};
var getPrimaryUserPresence = (state, userId) => {
  var _a;
  return (_a = getUserPresenceTargets(state, userId)[0]) != null ? _a : null;
};
var getActiveUserCount = (state) => Object.keys(state.presences).length;
var upsertPresence = (state, presence) => {
  var _a;
  const userId = getPresenceUserId(presence);
  const presenceKey = getPresenceKey(presence);
  if (!userId || !presenceKey) {
    return;
  }
  state.presences[userId] = __spreadProps(__spreadValues({}, (_a = state.presences[userId]) != null ? _a : {}), {
    [presenceKey]: presence
  });
};
var removePresence = (state, presence) => {
  const userId = getPresenceUserId(presence);
  const presenceKey = getPresenceKey(presence);
  if (!userId || !presenceKey) {
    return;
  }
  const userPresences = state.presences[userId];
  if (!userPresences) {
    return;
  }
  delete userPresences[presenceKey];
  if (Object.keys(userPresences).length === 0) {
    delete state.presences[userId];
  }
};
var getUserIdForColor = (state, color) => {
  var _a, _b;
  return (_b = (_a = Object.entries(state.assignments).find(([, assignedColor]) => assignedColor === color)) == null ? void 0 : _a[0]) != null ? _b : null;
};
var getOtherPlayerColor = (color) => color === "light" ? "dark" : "light";
var getActiveAssignedUserCount = (state) => Object.keys(state.assignments).filter((userId) => getUserPresenceTargets(state, userId).length > 0).length;
var canStartMatch = (state) => Object.keys(state.assignments).length >= MAX_PLAYERS && getActiveAssignedUserCount(state) >= MAX_PLAYERS;
var canRunAuthoritativeTurnTimer = (state) => state.started && !state.gameState.winner && state.gameState.phase !== "ended" && Boolean(getUserIdForColor(state, state.gameState.currentTurn));
var clearTurnTimer = (state, reason = null) => {
  state.timer.turnStartedAtMs = null;
  state.timer.turnDeadlineMs = null;
  state.timer.activePlayerColor = null;
  state.timer.activePlayerUserId = null;
  state.timer.activePhase = null;
  state.timer.resetReason = reason;
};
var resetTurnTimerForCurrentState = (state, nowMs, reason) => {
  if (!canRunAuthoritativeTurnTimer(state)) {
    clearTurnTimer(state, reason);
    return;
  }
  const activePlayerColor = state.gameState.currentTurn;
  state.timer.turnStartedAtMs = nowMs;
  state.timer.turnDeadlineMs = nowMs + state.timer.turnDurationMs;
  state.timer.activePlayerColor = activePlayerColor;
  state.timer.activePlayerUserId = getUserIdForColor(state, activePlayerColor);
  state.timer.activePhase = state.gameState.phase;
  state.timer.resetReason = reason;
};
var ensureTurnTimerForCurrentState = (state, nowMs) => {
  if (!canRunAuthoritativeTurnTimer(state)) {
    clearTurnTimer(state, "inactive");
    return;
  }
  if (state.timer.turnDeadlineMs !== null && state.timer.activePlayerColor === state.gameState.currentTurn && state.timer.activePhase === state.gameState.phase) {
    return;
  }
  resetTurnTimerForCurrentState(state, nowMs, "resynced");
};
var resetAfkOnMeaningfulAction = (state, playerColor, nowMs) => {
  state.afk[playerColor] = {
    accumulatedMs: 0,
    timeoutCount: 0,
    lastMeaningfulActionAtMs: nowMs,
    lastTimeoutAtMs: state.afk[playerColor].lastTimeoutAtMs
  };
};
var recordTimeoutWindow = (state, playerColor, nowMs) => {
  const tracker = state.afk[playerColor];
  tracker.accumulatedMs = Math.min(ONLINE_AFK_FORFEIT_MS, tracker.accumulatedMs + state.timer.turnDurationMs);
  tracker.timeoutCount += 1;
  tracker.lastTimeoutAtMs = nowMs;
  return tracker.accumulatedMs;
};
var getAfkRemainingMs = (state, playerColor, nowMs) => {
  const tracker = state.afk[playerColor];
  let effectiveAccumulatedMs = tracker.accumulatedMs;
  if (state.timer.activePlayerColor === playerColor && state.timer.turnStartedAtMs !== null && state.timer.turnDeadlineMs !== null && state.gameState.phase !== "ended" && !state.gameState.winner) {
    effectiveAccumulatedMs += Math.max(0, nowMs - state.timer.turnStartedAtMs);
  }
  return Math.max(0, ONLINE_AFK_FORFEIT_MS - effectiveAccumulatedMs);
};
var buildMatchEndPayload = (state, reason, winnerColor, forfeitingColor) => {
  const loserColor = getOtherPlayerColor(winnerColor);
  return {
    reason,
    winnerUserId: getUserIdForColor(state, winnerColor),
    loserUserId: getUserIdForColor(state, loserColor),
    forfeitingUserId: forfeitingColor ? getUserIdForColor(state, forfeitingColor) : null,
    message: null
  };
};
var syncCompletedMatchEnd = (state) => {
  var _a;
  if (!state.gameState.winner) {
    state.matchEnd = null;
    return;
  }
  if (((_a = state.matchEnd) == null ? void 0 : _a.reason) === "forfeit_inactivity") {
    return;
  }
  state.matchEnd = buildMatchEndPayload(state, "completed", state.gameState.winner);
};
var finalizeCompletedMatch = (logger, nk, dispatcher, state, matchId) => {
  if (!state.gameState.winner || state.resultRecorded) {
    return;
  }
  syncCompletedMatchEnd(state);
  state.resultRecorded = true;
  processCompletedMatchRatings(logger, nk, dispatcher, state, matchId);
  awardWinnerProgression(logger, nk, dispatcher, state, matchId);
  processCompletedTournamentMatch(logger, nk, state, matchId);
  processCompletedMatchSummaries(logger, nk, state, matchId);
};
var markMatchStartedIfReady = (state, nowMs) => {
  if (state.started || !canStartMatch(state)) {
    return false;
  }
  state.started = true;
  resetTurnTimerForCurrentState(state, nowMs, "match_started");
  return true;
};
var isPrivateMatchReady = (state) => !state.privateMatch || state.started || getActiveUserCount(state) >= MAX_PLAYERS;
var buildPrivateMatchRpcResponse = (matchId, modeId, privateCode, hasGuestJoined) => JSON.stringify(__spreadValues({
  matchId,
  modeId,
  // Some deployed Nakama runtimes have dropped a `code` field from RPC payloads.
  // Keep the original key for compatibility and add a second alias the client can fall back to.
  code: privateCode,
  privateCode
}, typeof hasGuestJoined === "boolean" ? { hasGuestJoined } : {}));
var buildPlayerMatchSummary = (state, matchId, playerUserId, playerColor) => {
  var _a;
  const opponentColor = playerColor === "light" ? "dark" : "light";
  const playerTelemetry = state.telemetry.players[playerColor];
  const opponentTelemetry = state.telemetry.players[opponentColor];
  const doubleStrikeTurnSpan = calculateDoubleStrikeTurnSpan(playerTelemetry.captureTurnNumbers);
  return {
    matchId,
    playerUserId,
    opponentType: state.opponentType,
    opponentDifficulty: getOpponentDifficultyFromType(state.opponentType),
    didWin: state.gameState.winner === playerColor,
    totalMoves: state.telemetry.totalMoves,
    playerMoveCount: playerTelemetry.playerMoveCount,
    playerTurnCount: playerTelemetry.playerTurnCount,
    opponentTurnCount: opponentTelemetry.playerTurnCount,
    piecesLost: playerTelemetry.capturesSuffered,
    maxRollCount: playerTelemetry.maxRollCount,
    unusableRollCount: playerTelemetry.unusableRollCount,
    capturesMade: playerTelemetry.capturesMade,
    capturesSuffered: playerTelemetry.capturesSuffered,
    captureTurnNumbers: [...playerTelemetry.captureTurnNumbers],
    maxCaptureTurnStreak: playerTelemetry.maxCaptureTurnStreak,
    doubleStrikeAchieved: doubleStrikeTurnSpan !== null,
    relentlessPressureAchieved: playerTelemetry.maxCaptureTurnStreak >= CHALLENGE_THRESHOLDS.RELENTLESS_PRESSURE_REQUIRED_STREAK,
    contestedTilesLandedCount: playerTelemetry.contestedTilesLandedCount,
    opponentStartingAreaExitTurn: opponentTelemetry.firstStartingAreaExitTurn,
    lockdownAchieved: opponentTelemetry.playerTurnCount >= CHALLENGE_THRESHOLDS.LOCKDOWN_REQUIRED_OPPONENT_TURNS && (opponentTelemetry.firstStartingAreaExitTurn === null || opponentTelemetry.firstStartingAreaExitTurn > CHALLENGE_THRESHOLDS.LOCKDOWN_REQUIRED_OPPONENT_TURNS),
    borneOffCount: state.gameState[playerColor].finishedCount,
    opponentBorneOffCount: state.gameState[opponentColor].finishedCount,
    wasBehindDuringMatch: playerTelemetry.wasBehindDuringMatch,
    behindCheckpointCount: playerTelemetry.behindCheckpointCount,
    behindReasons: Array.from(playerTelemetry.behindReasons),
    opponentReachedBrink: playerTelemetry.opponentReachedBrink,
    momentumShiftAchieved: playerTelemetry.momentumShiftAchieved,
    momentumShiftTurnSpan: playerTelemetry.momentumShiftTurnSpan,
    maxActivePiecesOnBoard: playerTelemetry.maxActivePiecesOnBoard,
    modeId: state.modeId,
    pieceCountPerSide: state.gameState.matchConfig.pieceCountPerSide,
    isPrivateMatch: state.classification.private,
    isFriendMatch: state.privateMatch,
    isTournamentMatch: Boolean(state.tournamentContext),
    tournamentEliminationRisk: ((_a = state.tournamentContext) == null ? void 0 : _a.eliminationRisk) === true,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  };
};
var getPresenceUsername = (presence) => readStringField8(presence, ["username", "displayName", "display_name", "name"]);
var buildTournamentMatchCompletion = (state, matchId) => {
  var _a, _b, _c, _d;
  if (!state.tournamentContext) {
    return null;
  }
  const completedAt = (/* @__PURE__ */ new Date()).toISOString();
  const winningColor = state.gameState.winner;
  const players = Object.entries(state.assignments).map(([userId, color]) => {
    const presence = getPrimaryUserPresence(state, userId);
    const playerTelemetry = state.telemetry.players[color];
    return {
      userId,
      username: getPresenceUsername(presence),
      color,
      didWin: winningColor === color,
      score: winningColor === color ? 1 : 0,
      finishedCount: state.gameState[color].finishedCount,
      capturesMade: playerTelemetry.capturesMade,
      capturesSuffered: playerTelemetry.capturesSuffered,
      playerMoveCount: playerTelemetry.playerMoveCount
    };
  });
  const winner = winningColor ? (_a = players.find((player) => player.color === winningColor)) != null ? _a : null : null;
  const loser = winningColor ? (_b = players.find((player) => player.color !== winningColor)) != null ? _b : null : null;
  return {
    matchId,
    modeId: state.modeId,
    context: state.tournamentContext,
    completedAt,
    totalMoves: state.telemetry.totalMoves,
    revision: state.revision,
    winningColor,
    winnerUserId: (_c = winner == null ? void 0 : winner.userId) != null ? _c : null,
    loserUserId: (_d = loser == null ? void 0 : loser.userId) != null ? _d : null,
    classification: {
      ranked: state.classification.ranked,
      casual: state.classification.casual,
      private: state.classification.private,
      bot: state.classification.bot,
      experimental: state.classification.experimental
    },
    players
  };
};
function processCompletedTournamentMatch(logger, nk, state, matchId) {
  if (!state.tournamentContext) {
    return;
  }
  try {
    const completion = buildTournamentMatchCompletion(state, matchId);
    if (!completion) {
      return;
    }
    processCompletedAuthoritativeTournamentMatch(nk, logger, completion);
  } catch (error) {
    logger.error(
      "Failed to process tournament result for match %s: %s",
      matchId,
      error instanceof Error ? error.message : String(error)
    );
  }
}
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
  initializer.registerRpc(RPC_ADMIN_WHOAMI, rpcAdminWhoAmI);
  initializer.registerRpc(RPC_ADMIN_LIST_TOURNAMENTS, rpcAdminListTournaments);
  initializer.registerRpc(RPC_ADMIN_GET_TOURNAMENT_RUN, rpcAdminGetTournamentRun);
  initializer.registerRpc(RPC_ADMIN_CREATE_TOURNAMENT_RUN, rpcAdminCreateTournamentRun);
  initializer.registerRpc(RPC_ADMIN_OPEN_TOURNAMENT, rpcAdminOpenTournament);
  initializer.registerRpc(RPC_ADMIN_DELETE_TOURNAMENT, rpcAdminDeleteTournament);
  initializer.registerRpc(RPC_ADMIN_CLOSE_TOURNAMENT, rpcAdminCloseTournament);
  initializer.registerRpc(RPC_ADMIN_FINALIZE_TOURNAMENT, rpcAdminFinalizeTournament);
  initializer.registerRpc(RPC_ADMIN_GET_TOURNAMENT_STANDINGS, rpcAdminGetTournamentStandings);
  initializer.registerRpc(RPC_ADMIN_GET_TOURNAMENT_AUDIT_LOG, rpcAdminGetTournamentAuditLog);
  initializer.registerRpc(RPC_TOURNAMENT_JOIN, rpcJoinTournament);
  initializer.registerRpc(RPC_LIST_PUBLIC_TOURNAMENTS, rpcListPublicTournaments);
  initializer.registerRpc(RPC_GET_PUBLIC_TOURNAMENT, rpcGetPublicTournament);
  initializer.registerRpc(RPC_GET_PUBLIC_TOURNAMENT_STANDINGS, rpcGetPublicTournamentStandings);
  initializer.registerRpc(RPC_JOIN_PUBLIC_TOURNAMENT, rpcJoinPublicTournament);
  initializer.registerRpc(RPC_LAUNCH_TOURNAMENT_MATCH, rpcLaunchTournamentMatch);
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
  const userId = getContextUserId2(ctx);
  if (!userId) {
    throw new Error("Authentication required.");
  }
  const nowMs = Date.now();
  onlinePresenceByUser.set(userId, nowMs);
  pruneOnlinePresence(nowMs);
  return encodeOnlinePresencePayload(nowMs);
}
function rpcPresenceCount(ctx, _logger, _nk, _payload) {
  const userId = getContextUserId2(ctx);
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
    allowsChallengeRewards: true
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
  const tournamentMatchWinXp = resolveConfiguredRewardXp(
    readNumberField5(params, ["tournamentMatchWinXp", "tournament_match_win_xp"])
  );
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
    started: false,
    opponentType: "human",
    modeId,
    classification,
    privateMatch,
    privateCode: isPrivateMatchCode(privateCode) ? privateCode : null,
    privateCreatorUserId,
    privateGuestUserId: null,
    winRewardSource,
    allowsChallengeRewards,
    tournamentContext: resolveTournamentMatchContextFromParams(params),
    tournamentMatchWinXp,
    telemetry: createMatchTelemetry(),
    timer: createMatchTimerState(),
    afk: {
      light: createPlayerAfkState(),
      dark: createPlayerAfkState()
    },
    matchEnd: null,
    resultRecorded: false
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
  const activeCount = getActiveUserCount(state);
  const hasExistingAssignment = Boolean(state.assignments[userId]);
  if (activeCount >= MAX_PLAYERS && !hasExistingAssignment) {
    return { state, accept: false, rejectMessage: "Match is full." };
  }
  upsertPresence(state, presence);
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
    upsertPresence(state, presence);
    ensureAssignment(state, userId);
  });
  markMatchStartedIfReady(state, Date.now());
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
    removePresence(state, presence);
  });
  return { state };
}
var logMatchLoopError = (logger, matchId, state, context, error) => {
  logger.error(
    "Authoritative match error in %s during %s (revision %d, phase %s, turn %s): %s",
    matchId,
    context,
    state.revision,
    state.gameState.phase,
    state.gameState.currentTurn,
    error instanceof Error ? error.message : String(error)
  );
};
function matchLoop(ctx, logger, nk, dispatcher, _tick, state, messages) {
  const matchId = getMatchId(ctx);
  const nowMs = Date.now();
  try {
    markMatchStartedIfReady(state, nowMs);
    ensureTurnTimerForCurrentState(state, nowMs);
  } catch (error) {
    logMatchLoopError(logger, matchId, state, "timer_sync", error);
    return { state };
  }
  messages.forEach((message) => {
    try {
      const senderUserId = getSenderUserId(message.sender);
      if (!senderUserId) {
        logger.warn("Ignoring message with missing sender user ID.");
        return;
      }
      upsertPresence(state, message.sender);
      const senderColor = state.assignments[senderUserId];
      if (!senderColor) {
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
    } catch (error) {
      logMatchLoopError(logger, matchId, state, "message_processing", error);
      try {
        broadcastSnapshot(dispatcher, state, matchId);
      } catch (snapshotError) {
        logMatchLoopError(logger, matchId, state, "message_recovery_snapshot", snapshotError);
      }
    }
  });
  try {
    ensureTurnTimerForCurrentState(state, Date.now());
    const timerExpired = state.timer.turnDeadlineMs !== null && Date.now() >= state.timer.turnDeadlineMs && !state.gameState.winner && state.gameState.phase !== "ended";
    if (timerExpired) {
      applyTimedTurnTimeout(logger, nk, dispatcher, state, matchId, Date.now());
    }
  } catch (error) {
    logMatchLoopError(logger, matchId, state, "timeout_processing", error);
    try {
      broadcastSnapshot(dispatcher, state, matchId);
    } catch (snapshotError) {
      logMatchLoopError(logger, matchId, state, "timeout_recovery_snapshot", snapshotError);
    }
  }
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
function applyRollOutcome(state, playerColor, rollValue) {
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
      currentTurn: getOtherPlayerColor(rollingState.currentTurn),
      phase: "rolling",
      rollValue: null,
      history: [...rollingState.history, `${rollingState.currentTurn} rolled ${rollValue} but had no moves.`]
    });
    completePlayerTurnTelemetry(state, playerColor, { didCapture: false, unusableRoll: true });
    return [];
  }
  state.gameState = rollingState;
  return validMoves;
}
function applyValidatedMove(state, playerColor, move) {
  const didCapture = detectCaptureOnMove(state.gameState, move);
  const targetCoord = getPathCoord(state.gameState.matchConfig.pathVariant, playerColor, move.toIndex);
  state.gameState = applyMove(state.gameState, move);
  state.telemetry.totalMoves += 1;
  state.telemetry.players[playerColor].playerMoveCount += 1;
  if (didCapture) {
    const opponentColor = getOtherPlayerColor(playerColor);
    state.telemetry.players[playerColor].capturesMade += 1;
    state.telemetry.players[opponentColor].capturesSuffered += 1;
  }
  if (targetCoord && isContestedLanding(state.gameState.matchConfig.pathVariant, playerColor, move.toIndex)) {
    state.telemetry.players[playerColor].contestedTilesLandedCount += 1;
  }
  completePlayerTurnTelemetry(state, playerColor, { didCapture, unusableRoll: false });
}
function forfeitPlayerForInactivity(logger, nk, dispatcher, state, matchId, forfeitingColor) {
  const winnerColor = getOtherPlayerColor(forfeitingColor);
  state.afk[forfeitingColor].accumulatedMs = ONLINE_AFK_FORFEIT_MS;
  state.gameState = __spreadProps(__spreadValues({}, state.gameState), {
    phase: "ended",
    rollValue: null,
    winner: winnerColor,
    history: [...state.gameState.history, `${forfeitingColor} forfeited due to inactivity.`]
  });
  state.matchEnd = buildMatchEndPayload(state, "forfeit_inactivity", winnerColor, forfeitingColor);
  clearTurnTimer(state, "forfeit_inactivity");
  state.revision += 1;
  logger.info(
    "Forfeited %s for inactivity in match %s after %dms (revision %d)",
    forfeitingColor,
    matchId,
    state.afk[forfeitingColor].accumulatedMs,
    state.revision
  );
  broadcastSnapshot(dispatcher, state, matchId);
  finalizeCompletedMatch(logger, nk, dispatcher, state, matchId);
}
function applyTimedTurnTimeout(logger, nk, dispatcher, state, matchId, nowMs) {
  var _a;
  const activePlayerColor = (_a = state.timer.activePlayerColor) != null ? _a : state.gameState.currentTurn;
  if (!activePlayerColor || state.gameState.winner || state.gameState.phase === "ended") {
    clearTurnTimer(state, "timeout_ignored");
    return;
  }
  const accumulatedInactivityMs = recordTimeoutWindow(state, activePlayerColor, nowMs);
  if (accumulatedInactivityMs >= ONLINE_AFK_FORFEIT_MS) {
    forfeitPlayerForInactivity(logger, nk, dispatcher, state, matchId, activePlayerColor);
    return;
  }
  if (state.gameState.phase === "rolling") {
    const validMoves = applyRollOutcome(state, activePlayerColor, rollDice());
    if (validMoves.length > 0) {
      applyValidatedMove(state, activePlayerColor, validMoves[0]);
    }
  } else if (state.gameState.phase === "moving" && state.gameState.rollValue !== null) {
    const validMoves = getValidMoves(state.gameState, state.gameState.rollValue);
    if (validMoves.length > 0) {
      applyValidatedMove(state, activePlayerColor, validMoves[0]);
    } else {
      state.gameState = __spreadProps(__spreadValues({}, state.gameState), {
        currentTurn: getOtherPlayerColor(activePlayerColor),
        phase: "rolling",
        rollValue: null,
        history: [...state.gameState.history, `${activePlayerColor} timed out with no valid move.`]
      });
      completePlayerTurnTelemetry(state, activePlayerColor, { didCapture: false, unusableRoll: true });
    }
  }
  if (state.gameState.winner) {
    syncCompletedMatchEnd(state);
  } else {
    state.matchEnd = null;
  }
  resetTurnTimerForCurrentState(state, nowMs, "timeout_autoplay");
  state.revision += 1;
  logger.debug("Applied authoritative timeout for %s (revision %d)", activePlayerColor, state.revision);
  broadcastSnapshot(dispatcher, state, matchId);
  finalizeCompletedMatch(logger, nk, dispatcher, state, matchId);
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
  const nowMs = Date.now();
  resetAfkOnMeaningfulAction(state, playerColor, nowMs);
  applyRollOutcome(state, playerColor, rollDice());
  state.matchEnd = null;
  resetTurnTimerForCurrentState(state, nowMs, "player_roll");
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
  const nowMs = Date.now();
  resetAfkOnMeaningfulAction(state, playerColor, nowMs);
  applyValidatedMove(state, playerColor, payload.move);
  syncCompletedMatchEnd(state);
  resetTurnTimerForCurrentState(state, nowMs, "player_move");
  state.revision += 1;
  logger.debug("Applied move for %s (revision %d)", userId, state.revision);
  broadcastSnapshot(dispatcher, state, matchId);
  finalizeCompletedMatch(logger, nk, dispatcher, state, matchId);
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
      const targetPresences = getUserPresenceTargets(state, playerResult.userId);
      if (targetPresences.length === 0) {
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
        targetPresences
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
  const configuredTournamentMatchWinXp = state.tournamentContext && typeof state.tournamentMatchWinXp === "number" ? state.tournamentMatchWinXp : null;
  if (configuredTournamentMatchWinXp !== null && configuredTournamentMatchWinXp <= 0) {
    return;
  }
  try {
    const awardResponse = awardXpForMatchWin(nk, logger, __spreadValues({
      userId: winnerUserId,
      matchId,
      source: state.winRewardSource
    }, configuredTournamentMatchWinXp !== null ? { awardedXp: configuredTournamentMatchWinXp } : {}));
    if (awardResponse.duplicate) {
      return;
    }
    const winnerPresence = getPrimaryUserPresence(state, winnerUserId);
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
  const targets = getUserPresenceTargets(state, userId);
  if (targets.length === 0) {
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
    targets
  );
}
function broadcastSnapshot(dispatcher, state, matchId) {
  const nowMs = Date.now();
  const activeTimedPlayerColor = state.timer.activePlayerColor;
  const turnRemainingMs = state.timer.turnDeadlineMs === null ? 0 : Math.max(0, state.timer.turnDeadlineMs - nowMs);
  const payload = {
    type: "state_snapshot",
    matchId,
    revision: state.revision,
    gameState: state.gameState,
    assignments: state.assignments,
    serverTimeMs: nowMs,
    turnDurationMs: state.timer.turnDurationMs,
    turnStartedAtMs: state.timer.turnStartedAtMs,
    turnDeadlineMs: state.timer.turnDeadlineMs,
    turnRemainingMs,
    activeTimedPlayer: state.timer.activePlayerUserId,
    activeTimedPlayerColor,
    activeTimedPhase: state.timer.activePhase,
    afkAccumulatedMs: {
      light: state.afk.light.accumulatedMs,
      dark: state.afk.dark.accumulatedMs
    },
    afkRemainingMs: activeTimedPlayerColor ? getAfkRemainingMs(state, activeTimedPlayerColor, nowMs) : null,
    matchEnd: state.matchEnd
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
