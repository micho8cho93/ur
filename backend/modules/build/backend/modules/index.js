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
var __objRest = (source, exclude) => {
  var target = {};
  for (var prop in source)
    if (__hasOwnProp.call(source, prop) && exclude.indexOf(prop) < 0)
      target[prop] = source[prop];
  if (source != null && __getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(source)) {
      if (exclude.indexOf(prop) < 0 && __propIsEnum.call(source, prop))
        target[prop] = source[prop];
    }
  return target;
};

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
var MASTERS_PATH_LIGHT = [
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
var MASTERS_PATH_DARK = [
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
var MURRAY_PATH_LIGHT = [
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
  { row: 2, col: 6 },
  { row: 1, col: 6 },
  { row: 1, col: 5 },
  { row: 1, col: 4 },
  { row: 1, col: 3 },
  { row: 1, col: 2 },
  { row: 1, col: 1 },
  { row: 1, col: 0 },
  { row: 2, col: 0 },
  { row: 2, col: 1 },
  { row: 2, col: 2 },
  { row: 2, col: 3 }
];
var MURRAY_PATH_DARK = [
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
  { row: 0, col: 6 },
  { row: 1, col: 6 },
  { row: 1, col: 5 },
  { row: 1, col: 4 },
  { row: 1, col: 3 },
  { row: 1, col: 2 },
  { row: 1, col: 1 },
  { row: 1, col: 0 },
  { row: 0, col: 0 },
  { row: 0, col: 1 },
  { row: 0, col: 2 },
  { row: 0, col: 3 }
];
var SKYRIUK_PATH_LIGHT = [
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
  { row: 2, col: 6 },
  { row: 1, col: 6 },
  { row: 1, col: 5 },
  { row: 1, col: 4 },
  { row: 1, col: 3 },
  { row: 1, col: 2 },
  { row: 1, col: 1 },
  { row: 1, col: 0 }
];
var SKYRIUK_PATH_DARK = [
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
  { row: 0, col: 6 },
  { row: 1, col: 6 },
  { row: 1, col: 5 },
  { row: 1, col: 4 },
  { row: 1, col: 3 },
  { row: 1, col: 2 },
  { row: 1, col: 1 },
  { row: 1, col: 0 }
];
var DEFAULT_PATH_VARIANT = "default";
var PATH_VARIANT_DEFINITIONS = {
  default: {
    id: "default",
    light: DEFAULT_PATH_LIGHT,
    dark: DEFAULT_PATH_DARK,
    pathLength: DEFAULT_PATH_LIGHT.length
  },
  masters: {
    id: "masters",
    light: MASTERS_PATH_LIGHT,
    dark: MASTERS_PATH_DARK,
    pathLength: MASTERS_PATH_LIGHT.length
  },
  murray: {
    id: "murray",
    light: MURRAY_PATH_LIGHT,
    dark: MURRAY_PATH_DARK,
    pathLength: MURRAY_PATH_LIGHT.length
  },
  skiryuk: {
    id: "skiryuk",
    light: SKYRIUK_PATH_LIGHT,
    dark: SKYRIUK_PATH_DARK,
    pathLength: SKYRIUK_PATH_LIGHT.length
  },
  "full-path": {
    id: "full-path",
    light: MASTERS_PATH_LIGHT,
    dark: MASTERS_PATH_DARK,
    pathLength: MASTERS_PATH_LIGHT.length
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
    description: "Authenticated Pure Luck practice win reward."
  },
  practice_3_pieces_win: {
    amount: 20,
    description: "Authenticated Race practice win reward."
  },
  practice_5_pieces_win: {
    amount: 30,
    description: "Authenticated legacy 5-piece practice win reward."
  },
  practice_finkel_rules_win: {
    amount: 40,
    description: "Authenticated Finkel Rules practice win reward."
  },
  practice_capture_win: {
    amount: 50,
    description: "Authenticated 5-piece Capture practice win reward."
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
  baseRulesetPreset: "quick_play",
  pieceCountPerSide: 7,
  rulesVariant: "standard",
  rosetteSafetyMode: "standard",
  exitStyle: "standard",
  eliminationMode: "return_to_start",
  fogOfWar: false,
  allowsXp: true,
  allowsOnline: true,
  allowsChallenges: true,
  allowsCoins: true,
  allowsRankedStats: true,
  offlineWinRewardSource: "bot_win",
  opponentType: "bot",
  pathVariant: "default",
  throwProfile: "standard",
  bonusTurnOnRosette: true,
  bonusTurnOnCapture: false,
  isPracticeMode: false,
  selectionSubtitle: "Classic seven-piece rules.",
  rulesIntro: null
};
var PURE_LUCK_MATCH_CONFIG = {
  modeId: "gameMode_1_piece",
  displayName: "Pure Luck",
  baseRulesetPreset: "custom",
  pieceCountPerSide: 3,
  rulesVariant: "no-capture",
  rosetteSafetyMode: "open",
  exitStyle: "standard",
  eliminationMode: "return_to_start",
  fogOfWar: false,
  allowsXp: true,
  allowsOnline: false,
  allowsChallenges: true,
  allowsCoins: false,
  allowsRankedStats: false,
  offlineWinRewardSource: "practice_1_piece_win",
  opponentType: "bot",
  pathVariant: "default",
  throwProfile: "standard",
  bonusTurnOnRosette: true,
  bonusTurnOnCapture: false,
  isPracticeMode: true,
  selectionSubtitle: "Three pieces per side with captures disabled everywhere.",
  rulesIntro: {
    title: "Pure Luck",
    message: "This variant keeps the race short and removes every takedown:\n\n\u2022 Each side plays with 3 pieces.\n\u2022 Captures are disabled everywhere, including the shared lane.\n\u2022 Rosettes still grant extra rolls, so momentum matters more than disruption."
  }
};
var RACE_MATCH_CONFIG = {
  modeId: "gameMode_3_pieces",
  displayName: "Race",
  baseRulesetPreset: "race",
  pieceCountPerSide: 3,
  rulesVariant: "standard",
  rosetteSafetyMode: "standard",
  exitStyle: "standard",
  eliminationMode: "return_to_start",
  fogOfWar: false,
  allowsXp: true,
  allowsOnline: false,
  allowsChallenges: true,
  allowsCoins: false,
  allowsRankedStats: false,
  offlineWinRewardSource: "practice_3_pieces_win",
  opponentType: "bot",
  pathVariant: "default",
  throwProfile: "standard",
  bonusTurnOnRosette: true,
  bonusTurnOnCapture: false,
  isPracticeMode: true,
  selectionSubtitle: "Three pieces per side with the standard capture rules.",
  rulesIntro: {
    title: "Race",
    message: "This variant trims the match down without changing the usual rules:\n\n\u2022 Each side plays with 3 pieces.\n\u2022 Standard captures are still allowed, but the shared middle rosette remains protected.\n\u2022 First to bear off all 3 pieces wins."
  }
};
var LEGACY_FIVE_PIECE_MATCH_CONFIG = {
  modeId: "gameMode_5_pieces",
  displayName: "5 Pieces",
  baseRulesetPreset: "custom",
  pieceCountPerSide: 5,
  rulesVariant: "standard",
  rosetteSafetyMode: "standard",
  exitStyle: "standard",
  eliminationMode: "return_to_start",
  fogOfWar: false,
  allowsXp: true,
  allowsOnline: false,
  allowsChallenges: true,
  allowsCoins: false,
  allowsRankedStats: false,
  offlineWinRewardSource: "practice_5_pieces_win",
  opponentType: "bot",
  pathVariant: "default",
  throwProfile: "standard",
  bonusTurnOnRosette: true,
  bonusTurnOnCapture: false,
  isPracticeMode: true,
  selectionSubtitle: "Legacy five-piece practice rules.",
  rulesIntro: {
    title: "5 Pieces",
    message: "This legacy variant keeps the standard rules with a reduced pool:\n\n\u2022 Each side plays with 5 pieces.\n\u2022 Standard captures are still allowed, but the shared middle rosette remains protected.\n\u2022 First to bear off all 5 pieces wins."
  }
};
var FINKEL_RULES_MATCH_CONFIG = {
  modeId: "gameMode_finkel_rules",
  displayName: "Finkel Rules",
  baseRulesetPreset: "finkel_rules",
  pieceCountPerSide: 7,
  rulesVariant: "standard",
  rosetteSafetyMode: "standard",
  exitStyle: "standard",
  eliminationMode: "return_to_start",
  fogOfWar: false,
  allowsXp: true,
  allowsOnline: false,
  allowsChallenges: true,
  allowsCoins: false,
  allowsRankedStats: false,
  offlineWinRewardSource: "practice_finkel_rules_win",
  opponentType: "bot",
  pathVariant: "default",
  throwProfile: "standard",
  bonusTurnOnRosette: true,
  bonusTurnOnCapture: false,
  isPracticeMode: true,
  selectionSubtitle: "Seven pieces per side using the classic protected-rosette rules.",
  rulesIntro: {
    title: "Finkel Rules",
    message: "This variant keeps the classic full-length duel:\n\n\u2022 Each side plays with 7 pieces.\n\u2022 Standard captures are allowed, except the shared middle rosette stays protected.\n\u2022 Rosettes still grant extra rolls, rewarding precise tempo play."
  }
};
var LOCAL_PVP_MATCH_CONFIG = {
  modeId: "gameMode_pvp",
  displayName: "PvP",
  baseRulesetPreset: "custom",
  pieceCountPerSide: 7,
  rulesVariant: "standard",
  rosetteSafetyMode: "standard",
  exitStyle: "standard",
  eliminationMode: "return_to_start",
  fogOfWar: false,
  allowsXp: false,
  allowsOnline: false,
  allowsChallenges: false,
  allowsCoins: false,
  allowsRankedStats: false,
  offlineWinRewardSource: "practice_finkel_rules_win",
  opponentType: "human",
  pathVariant: "default",
  throwProfile: "standard",
  bonusTurnOnRosette: true,
  bonusTurnOnCapture: false,
  isPracticeMode: true,
  selectionSubtitle: "Two human players on one device using seven-piece Finkel rules offline.",
  rulesIntro: {
    title: "PvP",
    message: "This local mode uses the classic full-length duel with two human players on one device:\n\n\u2022 Each side plays with 7 pieces.\n\u2022 Standard captures are allowed, except the shared middle rosette stays protected.\n\u2022 Every roll and move is taken by a human locally, with no bot turns and no online connection."
  }
};
var CAPTURE_MATCH_CONFIG = {
  modeId: "gameMode_capture",
  displayName: "Capture",
  baseRulesetPreset: "capture",
  pieceCountPerSide: 5,
  rulesVariant: "capture",
  rosetteSafetyMode: "open",
  exitStyle: "standard",
  eliminationMode: "return_to_start",
  fogOfWar: false,
  allowsXp: true,
  allowsOnline: false,
  allowsChallenges: true,
  allowsCoins: false,
  allowsRankedStats: false,
  offlineWinRewardSource: "practice_capture_win",
  opponentType: "bot",
  pathVariant: "default",
  throwProfile: "standard",
  bonusTurnOnRosette: true,
  bonusTurnOnCapture: true,
  isPracticeMode: true,
  selectionSubtitle: "Five pieces per side where captures can chain extra rolls.",
  rulesIntro: {
    title: "Capture",
    message: "This variant is shorter and sharper than standard play:\n\n\u2022 Each side plays with 5 pieces.\n\u2022 The shared middle rosette is no longer safe, so pieces there can be captured.\n\u2022 Any capture gives you an extra roll, which can chain attacks together."
  }
};
var EXTENDED_PATH_MATCH_CONFIG = {
  modeId: "gameMode_full_path",
  displayName: "Extended Path",
  baseRulesetPreset: "custom",
  pieceCountPerSide: 7,
  rulesVariant: "standard",
  rosetteSafetyMode: "standard",
  exitStyle: "single_exit",
  eliminationMode: "return_to_start",
  fogOfWar: false,
  allowsXp: true,
  allowsOnline: false,
  allowsChallenges: true,
  allowsCoins: false,
  allowsRankedStats: false,
  offlineWinRewardSource: "practice_extended_path_win",
  opponentType: "bot",
  pathVariant: "full-path",
  throwProfile: "standard",
  bonusTurnOnRosette: true,
  bonusTurnOnCapture: false,
  isPracticeMode: true,
  selectionSubtitle: "Seven pieces each using the longer extended-path route.",
  rulesIntro: {
    title: "Extended Path",
    message: "This variant keeps the usual rules but changes the route:\n\n\u2022 Each side still plays with 7 pieces.\n\u2022 The path is longer before bearing off, stretching races and recovery windows.\n\u2022 Standard captures are allowed, while the shared middle rosette remains protected."
  }
};
var MATCH_CONFIGS = {
  standard: STANDARD_MATCH_CONFIG,
  gameMode_1_piece: PURE_LUCK_MATCH_CONFIG,
  gameMode_3_pieces: RACE_MATCH_CONFIG,
  gameMode_5_pieces: LEGACY_FIVE_PIECE_MATCH_CONFIG,
  gameMode_finkel_rules: FINKEL_RULES_MATCH_CONFIG,
  gameMode_pvp: LOCAL_PVP_MATCH_CONFIG,
  gameMode_capture: CAPTURE_MATCH_CONFIG,
  gameMode_full_path: EXTENDED_PATH_MATCH_CONFIG
};
var DEFAULT_MATCH_CONFIG = STANDARD_MATCH_CONFIG;
var MATCH_MODE_SELECTION_IDS = [
  "standard",
  "gameMode_3_pieces",
  "gameMode_finkel_rules",
  "gameMode_pvp"
];
var MATCH_MODE_SELECTION_OPTIONS = MATCH_MODE_SELECTION_IDS.map((modeId) => {
  var _a;
  const config = MATCH_CONFIGS[modeId];
  return {
    modeId,
    label: config.displayName,
    description: (_a = config.selectionSubtitle) != null ? _a : config.displayName
  };
});
var PRIVATE_MATCH_SELECTION_IDS = [
  "gameMode_3_pieces",
  "gameMode_finkel_rules"
];
var PRIVATE_MATCH_OPTIONS = PRIVATE_MATCH_SELECTION_IDS.map((modeId) => {
  var _a;
  const config = MATCH_CONFIGS[modeId];
  return {
    modeId,
    label: config.displayName,
    description: (_a = config.selectionSubtitle) != null ? _a : config.displayName
  };
});
var STANDARD_THROW_OUTCOMES = [
  { rawThrowFace: 0, moveDistance: 0, grantsBonusThrow: false },
  { rawThrowFace: 1, moveDistance: 1, grantsBonusThrow: false },
  { rawThrowFace: 2, moveDistance: 2, grantsBonusThrow: false },
  { rawThrowFace: 3, moveDistance: 3, grantsBonusThrow: false },
  { rawThrowFace: 4, moveDistance: 4, grantsBonusThrow: false }
];
var HISTORICAL_THROW_OUTCOMES = [
  { rawThrowFace: 0, moveDistance: 4, grantsBonusThrow: true },
  { rawThrowFace: 1, moveDistance: 0, grantsBonusThrow: false },
  { rawThrowFace: 2, moveDistance: 1, grantsBonusThrow: true },
  { rawThrowFace: 3, moveDistance: 5, grantsBonusThrow: true }
];
var resolveThrowOutcome = (throwProfile, rawThrowFace) => {
  var _a, _b;
  const profile = typeof throwProfile === "string" ? throwProfile : (_a = throwProfile.throwProfile) != null ? _a : "standard";
  const table = profile === "standard" ? STANDARD_THROW_OUTCOMES : HISTORICAL_THROW_OUTCOMES;
  return (_b = table.find((entry) => entry.rawThrowFace === rawThrowFace)) != null ? _b : {
    rawThrowFace,
    moveDistance: rawThrowFace,
    grantsBonusThrow: false
  };
};
var getThrowOutcomeDistribution = (throwProfile) => throwProfile === "standard" ? [
  { rawThrowFace: 0, probability: 1 / 16 },
  { rawThrowFace: 1, probability: 4 / 16 },
  { rawThrowFace: 2, probability: 6 / 16 },
  { rawThrowFace: 3, probability: 4 / 16 },
  { rawThrowFace: 4, probability: 1 / 16 }
] : [
  { rawThrowFace: 0, probability: 1 / 8 },
  { rawThrowFace: 1, probability: 3 / 8 },
  { rawThrowFace: 2, probability: 3 / 8 },
  { rawThrowFace: 3, probability: 1 / 8 }
];
var isMatchModeId = (value) => typeof value === "string" && value in MATCH_CONFIGS;
var getMatchConfig = (modeId) => modeId && isMatchModeId(modeId) ? MATCH_CONFIGS[modeId] : DEFAULT_MATCH_CONFIG;

// logic/rules.ts
var resolveRulesVariant = (matchConfigOrVariant) => {
  var _a;
  return typeof matchConfigOrVariant === "string" ? matchConfigOrVariant : (_a = matchConfigOrVariant == null ? void 0 : matchConfigOrVariant.rulesVariant) != null ? _a : "standard";
};
var isSharedRosetteCoord = (coord) => Boolean(coord && isWarZone(coord.row, coord.col) && isRosette(coord.row, coord.col));
var canCaptureOnWarTile = (matchConfigOrVariant, coord) => {
  if (!coord || !isWarZone(coord.row, coord.col)) {
    return false;
  }
  const rulesVariant = resolveRulesVariant(matchConfigOrVariant);
  if (rulesVariant === "no-capture") {
    return false;
  }
  if (rulesVariant !== "capture" && isSharedRosetteCoord(coord)) {
    return false;
  }
  return true;
};
var isProtectedFromCapture = (matchConfigOrVariant, coord) => Boolean(coord && isWarZone(coord.row, coord.col) && !canCaptureOnWarTile(matchConfigOrVariant, coord));
var isContestedWarTile = (matchConfigOrVariant, coord) => canCaptureOnWarTile(matchConfigOrVariant, coord);
var shouldGrantExtraTurn = (matchConfig, options) => {
  var _a, _b;
  const bonusTurnOnRosette = (_a = matchConfig.bonusTurnOnRosette) != null ? _a : true;
  const bonusTurnOnCapture = (_b = matchConfig.bonusTurnOnCapture) != null ? _b : false;
  return options.bonusThrow || bonusTurnOnRosette && options.landedOnRosette || bonusTurnOnCapture && options.didCapture;
};

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
var rollThrowFace = (matchConfig = DEFAULT_MATCH_CONFIG, randomSource = Math.random) => {
  var _a;
  let sum = 0;
  const throwProfile = (_a = matchConfig.throwProfile) != null ? _a : "standard";
  const binaryLotCount = throwProfile === "standard" ? 4 : 3;
  for (let i = 0; i < binaryLotCount; i++) {
    if (randomSource() >= 0.5) sum++;
  }
  return sum;
};
var getValidMoves = (state, roll) => {
  var _a;
  const player = state[state.currentTurn];
  const opponent = state[state.currentTurn === "light" ? "dark" : "light"];
  const moves = [];
  const processedPositions = /* @__PURE__ */ new Set();
  const pathLength = getPathLength(state.matchConfig.pathVariant);
  const moveDistance = resolveThrowOutcome((_a = state.matchConfig.throwProfile) != null ? _a : "standard", roll).moveDistance;
  if (moveDistance === 0) {
    return [];
  }
  for (const piece of player.pieces) {
    if (piece.isFinished) continue;
    if (piece.position === -1 && processedPositions.has(-1)) continue;
    if (piece.position === -1) processedPositions.add(-1);
    const targetIndex = piece.position + moveDistance;
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
      if (isShared && isProtectedFromCapture(state.matchConfig, targetCoord)) {
        continue;
      }
    }
    moves.push({ pieceId: piece.id, fromIndex: piece.position, toIndex: targetIndex });
  }
  return moves;
};
var applyMove = (state, move) => {
  var _a, _b;
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
  let didCapture = false;
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
    if (opponentPiece && isContestedWarTile(newState.matchConfig, targetCoord)) {
      if (newState.matchConfig.eliminationMode === "eliminated") {
        opponentPiece.position = pathLength;
        opponentPiece.isFinished = true;
        opponent.finishedCount++;
      } else {
        opponentPiece.position = -1;
      }
      player.capturedCount++;
      didCapture = true;
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
  const throwOutcome = resolveThrowOutcome((_a = newState.matchConfig.throwProfile) != null ? _a : "standard", (_b = state.rollValue) != null ? _b : 0);
  if (shouldGrantExtraTurn(newState.matchConfig, {
    didCapture,
    landedOnRosette: isRosetteLanding,
    bonusThrow: throwOutcome.grantsBonusThrow
  })) {
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

// logic/bot/types.ts
var BOT_DIFFICULTIES = ["easy", "medium", "hard", "perfect"];
var DEFAULT_BOT_DIFFICULTY = "easy";
var isBotDifficulty = (value) => BOT_DIFFICULTIES.includes(value);

// logic/bot/bot.ts
var EPSILON = 1e-6;
var otherColor = (color) => color === "light" ? "dark" : "light";
var clamp = (value, min, max) => Math.min(max, Math.max(min, value));
var stripHistory = (state) => state.history.length === 0 ? state : __spreadProps(__spreadValues({}, state), { history: [] });
var sortPositions = (player) => player.pieces.map((piece) => piece.position).sort((left, right) => left - right).join(",");
var buildStateKey = (state, depth, rootColor) => {
  var _a;
  return [
    rootColor,
    depth,
    state.currentTurn,
    state.phase,
    (_a = state.rollValue) != null ? _a : "n",
    state.matchConfig.modeId,
    sortPositions(state.light),
    sortPositions(state.dark)
  ].join("|");
};
var getPieceProgress = (position, pathLength) => {
  if (position === -1) {
    return 0;
  }
  if (position >= pathLength) {
    return pathLength + 2;
  }
  return position + 1;
};
var getProgressScore = (player, pathLength) => player.pieces.reduce((total, piece) => total + getPieceProgress(piece.position, pathLength), 0);
var countReservePieces = (player) => player.pieces.filter((piece) => piece.position === -1 && !piece.isFinished).length;
var getStatePathVariant = (state) => state.matchConfig.pathVariant;
var getPieceCoord = (state, color, position) => getPathCoord(getStatePathVariant(state), color, position);
var countRosetteOccupancyForState = (state, player) => player.pieces.reduce((count, piece) => {
  const coord = getPieceCoord(state, player.color, piece.position);
  if (!coord) {
    return count;
  }
  return isRosette(coord.row, coord.col) ? count + 1 : count;
}, 0);
var canReachCoordOnNextRoll = (state, attackerColor, row, col) => {
  var _a;
  const attacker = state[attackerColor];
  const pathLength = getPathLength(state.matchConfig.pathVariant);
  const throwProfile = (_a = state.matchConfig.throwProfile) != null ? _a : "standard";
  const reachableDistances = new Set(
    getThrowOutcomeDistribution(throwProfile).map((outcome) => resolveThrowOutcome(throwProfile, outcome.rawThrowFace).moveDistance).filter((moveDistance) => moveDistance > 0)
  );
  return attacker.pieces.some((piece) => {
    if (piece.isFinished) {
      return false;
    }
    for (const moveDistance of reachableDistances) {
      const targetIndex = piece.position + moveDistance;
      if (targetIndex < 0 || targetIndex >= pathLength) {
        continue;
      }
      const coord = getPieceCoord(state, attackerColor, targetIndex);
      if (coord && coord.row === row && coord.col === col) {
        return true;
      }
    }
    return false;
  });
};
var countThreatenedPieces = (state, defenderColor) => {
  const attackerColor = otherColor(defenderColor);
  const defender = state[defenderColor];
  return defender.pieces.reduce((count, piece) => {
    const coord = getPieceCoord(state, defenderColor, piece.position);
    if (!coord || !isContestedWarTile(state.matchConfig, coord)) {
      return count;
    }
    return canReachCoordOnNextRoll(state, attackerColor, coord.row, coord.col) ? count + 1 : count;
  }, 0);
};
var countCaptureThreats = (state, attackerColor) => {
  const defenderColor = otherColor(attackerColor);
  const defender = state[defenderColor];
  return defender.pieces.reduce((count, piece) => {
    const coord = getPieceCoord(state, defenderColor, piece.position);
    if (!coord || !isContestedWarTile(state.matchConfig, coord)) {
      return count;
    }
    return canReachCoordOnNextRoll(state, attackerColor, coord.row, coord.col) ? count + 1 : count;
  }, 0);
};
var evaluateHeuristic = (state, rootColor) => {
  if (state.winner === rootColor) {
    return 1;
  }
  const opponentColor = otherColor(rootColor);
  if (state.winner === opponentColor) {
    return 0;
  }
  const root = state[rootColor];
  const opponent = state[opponentColor];
  const pathLength = getPathLength(state.matchConfig.pathVariant);
  const finishedDiff = root.finishedCount - opponent.finishedCount;
  const progressDiff = getProgressScore(root, pathLength) - getProgressScore(opponent, pathLength);
  const reserveDiff = countReservePieces(opponent) - countReservePieces(root);
  const rosetteDiff = countRosetteOccupancyForState(state, root) - countRosetteOccupancyForState(state, opponent);
  const threatDiff = countCaptureThreats(state, rootColor) - countCaptureThreats(state, opponentColor);
  const safetyDiff = countThreatenedPieces(state, opponentColor) - countThreatenedPieces(state, rootColor);
  const tempoBonus = state.currentTurn === rootColor ? 5 : -5;
  const score = finishedDiff * 150 + progressDiff * 6 + reserveDiff * 18 + rosetteDiff * 16 + threatDiff * 14 + safetyDiff * 18 + tempoBonus;
  return clamp(1 / (1 + Math.exp(-score / 100)), 0, 1);
};
var doesMoveCapture = (state, move) => {
  const mover = state.currentTurn;
  const opponent = state[otherColor(mover)];
  const coord = getPieceCoord(state, mover, move.toIndex);
  if (!coord) {
    return false;
  }
  return opponent.pieces.some((piece) => {
    const pieceCoord = getPieceCoord(state, opponent.color, piece.position);
    return Boolean(pieceCoord && pieceCoord.row === coord.row && pieceCoord.col === coord.col);
  });
};
var isMoveUnsafe = (state, moverColor, move) => {
  const coord = getPieceCoord(state, moverColor, move.toIndex);
  if (!coord || !isContestedWarTile(state.matchConfig, coord)) {
    return false;
  }
  return canReachCoordOnNextRoll(state, otherColor(moverColor), coord.row, coord.col);
};
var scoreImmediateMove = (state, move, rootColor) => {
  const moverColor = state.currentTurn;
  const coord = getPieceCoord(state, moverColor, move.toIndex);
  const landsOnRosette = Boolean(coord && isRosette(coord.row, coord.col));
  const captures = doesMoveCapture(state, move);
  const nextState = stripHistory(applyMove(state, move));
  const pathLength = getPathLength(state.matchConfig.pathVariant);
  let score = evaluateHeuristic(nextState, rootColor) * 100;
  if (move.toIndex >= pathLength) {
    score += 120;
  }
  if (captures) {
    score += 90;
  }
  if (landsOnRosette) {
    score += 55;
  }
  if (move.fromIndex === -1) {
    score += 16;
  }
  score += Math.max(move.toIndex, 0) * 3.5;
  if (isMoveUnsafe(nextState, moverColor, move)) {
    score -= 46;
  }
  return score;
};
var simulateRollState = (state, roll) => {
  const rollingState = __spreadProps(__spreadValues({}, state), {
    phase: "moving",
    rollValue: roll
  });
  const validMoves = getValidMoves(rollingState, roll);
  if (validMoves.length > 0) {
    return stripHistory(rollingState);
  }
  return stripHistory(__spreadProps(__spreadValues({}, rollingState), {
    currentTurn: otherColor(rollingState.currentTurn),
    phase: "rolling",
    rollValue: null,
    history: [...state.history, `${state.currentTurn} rolled ${roll} but had no moves.`]
  }));
};
var getRollOutcomes = (state) => {
  var _a;
  return getThrowOutcomeDistribution((_a = state.matchConfig.throwProfile) != null ? _a : "standard");
};
var evaluateSearch = (state, depth, context) => {
  if (state.winner) {
    return state.winner === context.rootColor ? 1 : 0;
  }
  if (depth <= 0) {
    return evaluateHeuristic(state, context.rootColor);
  }
  const cacheKey = buildStateKey(state, depth, context.rootColor);
  const cached = context.cache.get(cacheKey);
  if (cached !== void 0) {
    return cached;
  }
  let value = 0;
  if (state.phase === "moving" && state.rollValue !== null) {
    const validMoves = getValidMoves(state, state.rollValue);
    if (validMoves.length === 0) {
      value = evaluateSearch(
        stripHistory(__spreadProps(__spreadValues({}, state), {
          currentTurn: otherColor(state.currentTurn),
          phase: "rolling",
          rollValue: null
        })),
        depth,
        context
      );
    } else {
      const maximize = state.currentTurn === context.rootColor;
      const orderedMoves = [...validMoves].sort((left, right) => {
        const delta = scoreImmediateMove(state, right, context.rootColor) - scoreImmediateMove(state, left, context.rootColor);
        return maximize ? delta : -delta;
      });
      value = maximize ? -Infinity : Infinity;
      for (const move of orderedMoves) {
        const childValue = evaluateSearch(stripHistory(applyMove(state, move)), depth, context);
        value = maximize ? Math.max(value, childValue) : Math.min(value, childValue);
      }
    }
  } else {
    value = getRollOutcomes(state).reduce((total, outcome) => {
      const nextState = simulateRollState(state, outcome.rawThrowFace);
      return total + outcome.probability * evaluateSearch(nextState, depth - 1, context);
    }, 0);
  }
  context.cache.set(cacheKey, value);
  return value;
};
var chooseRandomMove = (moves) => moves[Math.floor(Math.random() * moves.length)];
var pickMediumMove = (state, moves) => {
  var _a, _b;
  const rootColor = state.currentTurn;
  const rankedMoves = moves.map((move) => ({ move, score: scoreImmediateMove(state, move, rootColor) })).sort((left, right) => right.score - left.score);
  const bestScore = (_b = (_a = rankedMoves[0]) == null ? void 0 : _a.score) != null ? _b : 0;
  const shortlist = rankedMoves.filter((entry) => bestScore - entry.score <= 10);
  return chooseRandomMove(shortlist.map((entry) => entry.move));
};
var getSearchDepth = (difficulty, state) => {
  const remainingPieces = state.matchConfig.pieceCountPerSide * 2 - (state.light.finishedCount + state.dark.finishedCount);
  if (difficulty === "hard") {
    if (remainingPieces <= 4) return 4;
    if (remainingPieces <= 8) return 3;
    return 2;
  }
  if (remainingPieces <= 4) return 6;
  if (remainingPieces <= 8) return 5;
  return 4;
};
var pickSearchMove = (state, moves, difficulty) => {
  const rootColor = state.currentTurn;
  const context = {
    rootColor,
    cache: /* @__PURE__ */ new Map()
  };
  const depth = getSearchDepth(difficulty, state);
  let bestMove = moves[0];
  let bestScore = -Infinity;
  let bestImmediateScore = -Infinity;
  const orderedMoves = [...moves].sort(
    (left, right) => scoreImmediateMove(state, right, rootColor) - scoreImmediateMove(state, left, rootColor)
  );
  for (const move of orderedMoves) {
    const immediateScore = scoreImmediateMove(state, move, rootColor);
    const nextState = stripHistory(applyMove(state, move));
    const searchScore = evaluateSearch(nextState, depth, context);
    if (searchScore > bestScore + EPSILON || Math.abs(searchScore - bestScore) <= EPSILON && immediateScore > bestImmediateScore) {
      bestMove = move;
      bestScore = searchScore;
      bestImmediateScore = immediateScore;
    }
  }
  return bestMove;
};
var getBotMove = (state, roll, difficulty = DEFAULT_BOT_DIFFICULTY) => {
  const searchState = stripHistory(state);
  const moves = getValidMoves(searchState, roll);
  if (moves.length === 0) return null;
  switch (difficulty) {
    case "medium":
      return pickMediumMove(searchState, moves);
    case "hard":
    case "perfect":
      return pickSearchMove(searchState, moves, difficulty);
    case "easy":
    default:
      return chooseRandomMove(moves);
  }
};

// backend/modules/analytics/tracking.ts
var STORAGE_PERMISSION_NONE = 0;
var SYSTEM_USER_ID = "00000000-0000-0000-0000-000000000000";
var ONLINE_TTL_MS = 3e4;
var ANALYTICS_EVENT_PAGE_SIZE = 100;
var ANALYTICS_EVENT_MAX_PAGES = 50;
var ANALYTICS_EVENT_COLLECTION = "analytics_events";
var onlinePresenceByUser = /* @__PURE__ */ new Map();
var activeMatchesById = /* @__PURE__ */ new Map();
var asRecord = (value) => typeof value === "object" && value !== null ? value : null;
var readStringField = (value, keys) => {
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
var getErrorMessage = (error) => error instanceof Error ? error.message : String(error);
var buildEventId = (type, occurredAt, scope) => {
  const compactTimestamp = occurredAt.replace(/[^0-9]/g, "");
  const randomSuffix = Math.random().toString(36).slice(2, 8);
  return `${type}:${scope}:${compactTimestamp}:${randomSuffix}`;
};
var pruneOnlinePresence = (nowMs) => {
  onlinePresenceByUser.forEach((lastSeenMs, userId) => {
    if (nowMs - lastSeenMs > ONLINE_TTL_MS) {
      onlinePresenceByUser.delete(userId);
    }
  });
};
var normalizeClassification = (value) => {
  const record = asRecord(value);
  if (!record) {
    return null;
  }
  return {
    ranked: readBooleanField(record, ["ranked"]) === true,
    casual: readBooleanField(record, ["casual"]) === true,
    private: readBooleanField(record, ["private"]) === true,
    bot: readBooleanField(record, ["bot"]) === true,
    experimental: readBooleanField(record, ["experimental"]) === true,
    tournament: readBooleanField(record, ["tournament"]) === true
  };
};
var normalizeMatchPlayer = (value) => {
  const record = asRecord(value);
  const userId = readStringField(record, ["userId", "user_id"]);
  const color = readStringField(record, ["color"]);
  if (!record || !userId || color !== "light" && color !== "dark") {
    return null;
  }
  return {
    userId,
    username: readStringField(record, ["username"]),
    color,
    didWin: (() => {
      const didWin = readBooleanField(record, ["didWin", "did_win"]);
      return typeof didWin === "boolean" ? didWin : null;
    })(),
    capturesMade: readNumberField(record, ["capturesMade", "captures_made"]),
    capturesSuffered: readNumberField(record, ["capturesSuffered", "captures_suffered"]),
    playerMoveCount: readNumberField(record, ["playerMoveCount", "player_move_count"]),
    finishedCount: readNumberField(record, ["finishedCount", "finished_count"]),
    isBot: readBooleanField(record, ["isBot", "is_bot"]) === true
  };
};
var normalizeMatchStartEvent = (value) => {
  const record = asRecord(value);
  const eventId = readStringField(record, ["eventId", "event_id"]);
  const occurredAt = readStringField(record, ["occurredAt", "occurred_at"]);
  const matchId = readStringField(record, ["matchId", "match_id"]);
  const startedAt = readStringField(record, ["startedAt", "started_at"]);
  const modeId = readStringField(record, ["modeId", "mode_id"]);
  const classification = normalizeClassification(record == null ? void 0 : record.classification);
  if (!record || !eventId || !occurredAt || !matchId || !startedAt || !modeId || !classification) {
    return null;
  }
  return {
    eventId,
    type: "match_start",
    occurredAt,
    matchId,
    startedAt,
    modeId,
    classification,
    tournamentRunId: readStringField(record, ["tournamentRunId", "tournament_run_id"]),
    tournamentId: readStringField(record, ["tournamentId", "tournament_id"]),
    players: Array.isArray(record.players) ? record.players.map((player) => normalizeMatchPlayer(player)).filter((player) => Boolean(player)) : []
  };
};
var normalizeMatchEndEvent = (value) => {
  var _a, _b;
  const record = asRecord(value);
  const eventId = readStringField(record, ["eventId", "event_id"]);
  const occurredAt = readStringField(record, ["occurredAt", "occurred_at"]);
  const matchId = readStringField(record, ["matchId", "match_id"]);
  const endedAt = readStringField(record, ["endedAt", "ended_at"]);
  const modeId = readStringField(record, ["modeId", "mode_id"]);
  const reason = readStringField(record, ["reason"]);
  const classification = normalizeClassification(record == null ? void 0 : record.classification);
  if (!record || !eventId || !occurredAt || !matchId || !endedAt || !modeId || !classification || reason !== "completed" && reason !== "forfeit_inactivity" && reason !== "forfeit_disconnect") {
    return null;
  }
  return {
    eventId,
    type: "match_end",
    occurredAt,
    matchId,
    startedAt: readStringField(record, ["startedAt", "started_at"]),
    endedAt,
    durationSeconds: readNumberField(record, ["durationSeconds", "duration_seconds"]),
    modeId,
    reason,
    classification,
    tournamentRunId: readStringField(record, ["tournamentRunId", "tournament_run_id"]),
    tournamentId: readStringField(record, ["tournamentId", "tournament_id"]),
    winnerUserId: readStringField(record, ["winnerUserId", "winner_user_id"]),
    loserUserId: readStringField(record, ["loserUserId", "loser_user_id"]),
    totalMoves: Math.max(0, Math.floor((_a = readNumberField(record, ["totalMoves", "total_moves"])) != null ? _a : 0)),
    totalTurns: Math.max(0, Math.floor((_b = readNumberField(record, ["totalTurns", "total_turns"])) != null ? _b : 0)),
    players: Array.isArray(record.players) ? record.players.map((player) => normalizeMatchPlayer(player)).filter((player) => Boolean(player)) : []
  };
};
var normalizeXpAwardEvent = (value) => {
  var _a, _b, _c, _d, _e;
  const record = asRecord(value);
  const eventId = readStringField(record, ["eventId", "event_id"]);
  const occurredAt = readStringField(record, ["occurredAt", "occurred_at"]);
  const userId = readStringField(record, ["userId", "user_id"]);
  const source = readStringField(record, ["source"]);
  const sourceId = readStringField(record, ["sourceId", "source_id"]);
  if (!record || !eventId || !occurredAt || !userId || !source || !sourceId) {
    return null;
  }
  return {
    eventId,
    type: "xp_awarded",
    occurredAt,
    userId,
    awardedXp: Math.max(0, Math.floor((_a = readNumberField(record, ["awardedXp", "awarded_xp"])) != null ? _a : 0)),
    source,
    sourceId,
    matchId: readStringField(record, ["matchId", "match_id"]),
    previousTotalXp: Math.max(
      0,
      Math.floor((_b = readNumberField(record, ["previousTotalXp", "previous_total_xp"])) != null ? _b : 0)
    ),
    newTotalXp: Math.max(0, Math.floor((_c = readNumberField(record, ["newTotalXp", "new_total_xp"])) != null ? _c : 0)),
    previousRank: (_d = readStringField(record, ["previousRank", "previous_rank"])) != null ? _d : "Laborer",
    newRank: (_e = readStringField(record, ["newRank", "new_rank"])) != null ? _e : "Laborer",
    rankChanged: readBooleanField(record, ["rankChanged", "rank_changed"]) === true
  };
};
var normalizeAnalyticsEvent = (value) => {
  const record = asRecord(value);
  const type = readStringField(record, ["type"]);
  if (type === "match_start") {
    return normalizeMatchStartEvent(record);
  }
  if (type === "match_end") {
    return normalizeMatchEndEvent(record);
  }
  if (type === "xp_awarded") {
    return normalizeXpAwardEvent(record);
  }
  if (type === "cosmetic_purchase") {
    const eventId = readStringField(record, ["eventId", "event_id"]);
    const occurredAt = readStringField(record, ["occurredAt", "occurred_at"]);
    const userId = readStringField(record, ["userId", "user_id"]);
    const cosmeticId = readStringField(record, ["cosmeticId", "cosmetic_id"]);
    const currency = readStringField(record, ["currency"]);
    const amount = readNumberField(record, ["amount"]);
    if (!eventId || !occurredAt || !userId || !cosmeticId || currency !== "soft" && currency !== "premium" || typeof amount !== "number") {
      return null;
    }
    return {
      eventId,
      type: "cosmetic_purchase",
      occurredAt,
      userId,
      cosmeticId,
      currency,
      amount
    };
  }
  return null;
};
var normalizeStorageListResult = (value) => {
  if (Array.isArray(value)) {
    return {
      objects: value.map((object) => {
        var _a;
        return (_a = asRecord(object)) != null ? _a : {};
      }),
      cursor: null
    };
  }
  const record = asRecord(value);
  const objects = Array.isArray(record == null ? void 0 : record.objects) ? record.objects.map((object) => {
    var _a;
    return (_a = asRecord(object)) != null ? _a : {};
  }) : [];
  return {
    objects,
    cursor: readStringField(record, ["cursor", "nextCursor", "next_cursor"])
  };
};
var buildAnalyticsStorageWrite = (event) => ({
  collection: ANALYTICS_EVENT_COLLECTION,
  key: event.eventId,
  userId: SYSTEM_USER_ID,
  value: event,
  version: "*",
  permissionRead: STORAGE_PERMISSION_NONE,
  permissionWrite: STORAGE_PERMISSION_NONE
});
var createAnalyticsEventWriteBuffer = () => ({
  writes: []
});
var flushAnalyticsEventWriteBuffer = (nk, logger, buffer) => {
  if (buffer.writes.length === 0) {
    return 0;
  }
  try {
    const pendingWrites = buffer.writes.slice();
    nk.storageWrite(pendingWrites);
    buffer.writes.length = 0;
    return pendingWrites.length;
  } catch (error) {
    logger.warn("Unable to flush %d buffered analytics events: %s", buffer.writes.length, getErrorMessage(error));
    return 0;
  }
};
var writeEvent = (nk, logger, event, writeBuffer) => {
  const write = buildAnalyticsStorageWrite(event);
  if (writeBuffer) {
    writeBuffer.writes.push(write);
    return;
  }
  try {
    nk.storageWrite([write]);
  } catch (error) {
    logger.warn("Unable to write analytics event %s: %s", event.eventId, getErrorMessage(error));
  }
};
var trackPresenceHeartbeat = (userId) => {
  const nowMs = Date.now();
  onlinePresenceByUser.set(userId, nowMs);
  pruneOnlinePresence(nowMs);
  return {
    onlineCount: onlinePresenceByUser.size,
    onlineTtlMs: ONLINE_TTL_MS,
    serverTimeMs: nowMs
  };
};
var getOnlinePresenceSnapshot = () => {
  const nowMs = Date.now();
  pruneOnlinePresence(nowMs);
  return {
    onlineCount: onlinePresenceByUser.size,
    onlineTtlMs: ONLINE_TTL_MS,
    serverTimeMs: nowMs
  };
};
var recordMatchStartAnalyticsEvent = (nk, logger, event, writeBuffer) => {
  const occurredAt = event.startedAt;
  const normalizedEvent = __spreadValues({
    eventId: buildEventId("match_start", occurredAt, event.matchId),
    type: "match_start",
    occurredAt
  }, event);
  activeMatchesById.set(event.matchId, {
    matchId: event.matchId,
    startedAt: event.startedAt,
    modeId: event.modeId,
    classification: event.classification,
    tournamentRunId: event.tournamentRunId,
    tournamentId: event.tournamentId,
    playerLabels: event.players.map((player) => {
      var _a;
      return (_a = player.username) != null ? _a : player.userId;
    }).filter((playerLabel) => playerLabel.length > 0)
  });
  writeEvent(nk, logger, normalizedEvent, writeBuffer);
};
var recordMatchEndAnalyticsEvent = (nk, logger, event, writeBuffer) => {
  const occurredAt = event.endedAt;
  const normalizedEvent = __spreadValues({
    eventId: buildEventId("match_end", occurredAt, event.matchId),
    type: "match_end",
    occurredAt
  }, event);
  activeMatchesById.delete(event.matchId);
  writeEvent(nk, logger, normalizedEvent, writeBuffer);
};
var recordXpAwardAnalyticsEvent = (nk, logger, event, writeBuffer) => {
  var _a;
  const occurredAt = (_a = event.occurredAt) != null ? _a : (/* @__PURE__ */ new Date()).toISOString();
  const normalizedEvent = {
    eventId: buildEventId("xp_awarded", occurredAt, `${event.userId}:${event.sourceId}`),
    type: "xp_awarded",
    occurredAt,
    userId: event.userId,
    awardedXp: event.awardedXp,
    source: event.source,
    sourceId: event.sourceId,
    matchId: event.matchId,
    previousTotalXp: event.previousTotalXp,
    newTotalXp: event.newTotalXp,
    previousRank: event.previousRank,
    newRank: event.newRank,
    rankChanged: event.rankChanged
  };
  writeEvent(nk, logger, normalizedEvent, writeBuffer);
};
var recordCosmeticPurchaseAnalyticsEvent = (nk, logger, event) => {
  var _a;
  const occurredAt = (_a = event.occurredAt) != null ? _a : (/* @__PURE__ */ new Date()).toISOString();
  const normalizedEvent = {
    eventId: buildEventId("cosmetic_purchase", occurredAt, `${event.userId}:${event.cosmeticId}`),
    type: "cosmetic_purchase",
    occurredAt,
    userId: event.userId,
    cosmeticId: event.cosmeticId,
    currency: event.currency,
    amount: event.amount
  };
  writeEvent(nk, logger, normalizedEvent);
};
var unregisterActiveMatch = (matchId) => {
  activeMatchesById.delete(matchId);
};
var listActiveTrackedMatches = () => Array.from(activeMatchesById.values()).sort((left, right) => left.startedAt.localeCompare(right.startedAt) * -1);
var listAnalyticsEvents = (nk, logger) => {
  if (typeof nk.storageList !== "function") {
    return {
      supported: false,
      notes: ["Analytics event storage listing is not supported by this Nakama runtime."],
      events: []
    };
  }
  const events = [];
  let cursor = "";
  for (let page = 0; page < ANALYTICS_EVENT_MAX_PAGES; page += 1) {
    try {
      const rawResult = nk.storageList(SYSTEM_USER_ID, ANALYTICS_EVENT_COLLECTION, ANALYTICS_EVENT_PAGE_SIZE, cursor);
      const result = normalizeStorageListResult(rawResult);
      result.objects.forEach((object) => {
        const event = normalizeAnalyticsEvent(object.value);
        if (event) {
          events.push(event);
        }
      });
      if (!result.cursor) {
        break;
      }
      cursor = result.cursor;
    } catch (error) {
      logger.warn("Unable to list analytics events: %s", getErrorMessage(error));
      return {
        supported: false,
        notes: ["Analytics event storage could not be listed from the current runtime."],
        events: []
      };
    }
  }
  return {
    supported: true,
    notes: [],
    events: events.sort((left, right) => left.occurredAt.localeCompare(right.occurredAt))
  };
};

// backend/modules/progression.ts
var PROGRESSION_COLLECTION = "progression";
var PROGRESSION_PROFILE_KEY = "profile";
var XP_REWARD_LEDGER_COLLECTION = "xp_reward_ledger";
var STORAGE_PERMISSION_NONE2 = 0;
var MAX_WRITE_ATTEMPTS = 4;
var GLOBAL_STORAGE_USER_ID = "00000000-0000-0000-0000-000000000000";
var RPC_GET_PROGRESSION = "get_progression";
var RPC_GET_USER_XP_PROGRESS = "get_user_xp_progress";
var asRecord2 = (value) => typeof value === "object" && value !== null ? value : null;
var readStringField2 = (value, keys) => {
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
var getStorageObjectVersion = (object) => readStringField2(object, ["version"]);
var maybeSetStorageVersion = (write, version) => typeof version === "string" && version.length > 0 ? __spreadProps(__spreadValues({}, write), { version }) : write;
var getErrorMessage2 = (error) => error instanceof Error ? error.message : String(error);
var findStorageObject = (objects, collection, key, userId) => {
  var _a;
  return (_a = objects.find((object) => {
    const collectionName = readStringField2(object, ["collection"]);
    const objectKey = readStringField2(object, ["key"]);
    const objectUserId = readStringField2(object, ["userId", "user_id"]);
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
  const totalXp = sanitizeTotalXp((_a = readNumberField2(rawValue, ["totalXp", "total_xp"])) != null ? _a : 0);
  const lastUpdatedAt = (_b = readStringField2(rawValue, ["lastUpdatedAt", "last_updated_at"])) != null ? _b : fallbackUpdatedAt;
  return {
    totalXp,
    currentRankTitle: getRankForXp(totalXp).title,
    lastUpdatedAt
  };
};
var profileNeedsRepair = (rawValue, normalized) => {
  const rawRecord = asRecord2(rawValue);
  if (!rawRecord) {
    return true;
  }
  const rawTotalXp = readNumberField2(rawRecord, ["totalXp", "total_xp"]);
  const rawRankTitle = readStringField2(rawRecord, ["currentRankTitle", "current_rank_title"]);
  const rawLastUpdatedAt = readStringField2(rawRecord, ["lastUpdatedAt", "last_updated_at"]);
  return rawTotalXp !== normalized.totalXp || rawRankTitle !== normalized.currentRankTitle || rawLastUpdatedAt !== normalized.lastUpdatedAt;
};
var normalizeStoredXpRewardRecord = (rawValue) => {
  var _a, _b, _c;
  const record = asRecord2(rawValue);
  if (!record) {
    return null;
  }
  const userId = readStringField2(record, ["userId", "user_id"]);
  const ledgerKey = readStringField2(record, ["ledgerKey", "ledger_key"]);
  const source = readStringField2(record, ["source"]);
  const sourceId = readStringField2(record, ["sourceId", "source_id"]);
  const awardedAt = readStringField2(record, ["awardedAt", "awarded_at"]);
  const matchId = readStringField2(record, ["matchId", "match_id"]);
  const awardedXp = sanitizeTotalXp((_a = readNumberField2(record, ["awardedXp", "awarded_xp"])) != null ? _a : 0);
  const previousTotalXp = sanitizeTotalXp((_b = readNumberField2(record, ["previousTotalXp", "previous_total_xp"])) != null ? _b : 0);
  const newTotalXp = sanitizeTotalXp((_c = readNumberField2(record, ["newTotalXp", "new_total_xp"])) != null ? _c : 0);
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
      permissionRead: STORAGE_PERMISSION_NONE2,
      permissionWrite: STORAGE_PERMISSION_NONE2
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
          getErrorMessage2(error)
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
        getErrorMessage2(error)
      );
    }
  }
  throw new Error(`Unable to initialize progression for user ${userId}.`);
};
var getProgressionForUser = (nk, logger, userId) => buildProgressionSnapshot(ensureProgressionProfile(nk, logger, userId).totalXp);
var awardXp = (nk, logger, params) => {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i;
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
          permissionRead: STORAGE_PERMISSION_NONE2,
          permissionWrite: STORAGE_PERMISSION_NONE2
        },
        {
          collection: XP_REWARD_LEDGER_COLLECTION,
          key: ledgerKey,
          userId,
          value: rewardRecord,
          version: "*",
          permissionRead: STORAGE_PERMISSION_NONE2,
          permissionWrite: STORAGE_PERMISSION_NONE2
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
      recordXpAwardAnalyticsEvent(nk, logger, {
        occurredAt: now,
        userId,
        awardedXp,
        source: params.source,
        sourceId,
        matchId: (_h = params.matchId) != null ? _h : null,
        previousTotalXp,
        newTotalXp,
        previousRank,
        newRank,
        rankChanged: previousRank !== newRank
      }, params.analyticsWriteBuffer);
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
            matchId: (_i = params.matchId) != null ? _i : null
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
        getErrorMessage2(error)
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
      awardedXp: typeof params.awardedXp === "number" && Number.isFinite(params.awardedXp) ? params.awardedXp : getXpAwardAmount(source),
      analyticsWriteBuffer: params.analyticsWriteBuffer
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
    awardedXp: typeof params.awardedXp === "number" && Number.isFinite(params.awardedXp) ? params.awardedXp : getXpAwardAmount("tournament_champion"),
    analyticsWriteBuffer: params.analyticsWriteBuffer
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
var SYSTEM_USER_ID2 = "00000000-0000-0000-0000-000000000000";
var RPC_GET_USERNAME_ONBOARDING_STATUS = "get_username_onboarding_status";
var RPC_CLAIM_USERNAME = "claim_username";
var USERNAME_PROFILE_COLLECTION = "user_profile";
var USERNAME_PROFILE_KEY = "profile";
var USERNAME_CANONICAL_INDEX_COLLECTION = "username_canonical_index";
var FALLBACK_SUGGESTION_BASES = ["Rosette", "Lapis", "Sumer", "Reed", "RoyalUr"];
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
var readBooleanField2 = (value, keys) => {
  const record = asRecord2(value);
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
  const usernameDisplay = readStringField3(rawValue, ["usernameDisplay", "username_display"]);
  const usernameCanonical = readStringField3(rawValue, ["usernameCanonical", "username_canonical"]);
  const createdAt = (_a = readStringField3(rawValue, ["createdAt", "created_at"])) != null ? _a : defaults.createdAt;
  const updatedAt = (_b = readStringField3(rawValue, ["updatedAt", "updated_at"])) != null ? _b : defaults.updatedAt;
  const onboardingComplete = readBooleanField2(rawValue, ["onboardingComplete", "onboarding_complete"]);
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
  const record = asRecord2(rawValue);
  if (!record) {
    return null;
  }
  const userId = readStringField3(record, ["userId", "user_id"]);
  const usernameDisplay = readStringField3(record, ["usernameDisplay", "username_display"]);
  const usernameCanonical = readStringField3(record, ["usernameCanonical", "username_canonical"]);
  const claimedAt = readStringField3(record, ["claimedAt", "claimed_at"]);
  const updatedAt = readStringField3(record, ["updatedAt", "updated_at"]);
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
      userId: SYSTEM_USER_ID2
    }
  ]);
  const object = findStorageObject(
    objects,
    USERNAME_CANONICAL_INDEX_COLLECTION,
    usernameCanonical,
    SYSTEM_USER_ID2
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
  const data = asRecord2(JSON.parse(payload));
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
  const data = asRecord2(JSON.parse(payload));
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
        permissionRead: STORAGE_PERMISSION_NONE2,
        permissionWrite: STORAGE_PERMISSION_NONE2
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
  const trimmedBase = base.slice(0, Math.max(0, USERNAME_MAX_LENGTH - suffixValue.length));
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
        userId: SYSTEM_USER_ID2
      }
    ]);
    const profileObject = findStorageObject(objects, USERNAME_PROFILE_COLLECTION, USERNAME_PROFILE_KEY, ctx.userId);
    const indexObject = findStorageObject(
      objects,
      USERNAME_CANONICAL_INDEX_COLLECTION,
      validation.canonical,
      SYSTEM_USER_ID2
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
          permissionRead: STORAGE_PERMISSION_NONE2,
          permissionWrite: STORAGE_PERMISSION_NONE2
        },
        {
          collection: USERNAME_CANONICAL_INDEX_COLLECTION,
          key: validation.canonical,
          userId: SYSTEM_USER_ID2,
          value: nextIndexRecord,
          version: indexObject ? (_d = getStorageObjectVersion(indexObject)) != null ? _d : "" : "*",
          permissionRead: STORAGE_PERMISSION_NONE2,
          permissionWrite: STORAGE_PERMISSION_NONE2
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
        getErrorMessage2(error)
      );
    }
  }
  return JSON.stringify(
    buildClaimUsernameError("SERVER_ERROR", "Unable to claim a username right now. Please try again.")
  );
};

// backend/modules/elo.ts
var SYSTEM_USER_ID3 = "00000000-0000-0000-0000-000000000000";
var ELO_PROFILE_COLLECTION = "elo_profiles";
var ELO_PROFILE_KEY = "profile";
var ELO_MATCH_RESULT_COLLECTION = "elo_match_results";
var DEFAULT_LEADERBOARD_PAGE_SIZE = 25;
var MAX_LEADERBOARD_PAGE_SIZE = 100;
var DEFAULT_HAYSTACK_SIZE = 11;
var RPC_GET_MY_RATING_PROFILE = "get_my_rating_profile";
var RPC_LIST_TOP_ELO_PLAYERS = "list_top_elo_players";
var RPC_GET_ELO_LEADERBOARD_AROUND_ME = "get_elo_leaderboard_around_me";
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
var readBooleanField3 = (value, keys) => {
  const record = asRecord2(value);
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
  const eloRating = sanitizeEloRating((_a = readNumberField3(rawValue, ["eloRating", "elo_rating"])) != null ? _a : defaults.eloRating);
  const ratedGames = sanitizeRatedGameCount(
    (_b = readNumberField3(rawValue, ["ratedGames", "rated_games"])) != null ? _b : defaults.ratedGames
  );
  const ratedWins = Math.min(
    ratedGames,
    sanitizeRatedGameCount((_c = readNumberField3(rawValue, ["ratedWins", "rated_wins"])) != null ? _c : defaults.ratedWins)
  );
  const ratedLosses = Math.min(
    ratedGames,
    sanitizeRatedGameCount((_d = readNumberField3(rawValue, ["ratedLosses", "rated_losses"])) != null ? _d : defaults.ratedLosses)
  );
  const createdAt = (_e = readStringField4(rawValue, ["createdAt", "created_at"])) != null ? _e : defaults.createdAt;
  const updatedAt = (_f = readStringField4(rawValue, ["updatedAt", "updated_at"])) != null ? _f : fallbackTimestamp;
  const lastRatedMatchId = readStringField4(rawValue, ["lastRatedMatchId", "last_rated_match_id"]);
  const lastRatedAt = readStringField4(rawValue, ["lastRatedAt", "last_rated_at"]);
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
  const usernameDisplay = readStringField4(rawValue, ["usernameDisplay", "username_display"]);
  if (!usernameDisplay) {
    return null;
  }
  return normalizeEloProfile(rawValue, userId, usernameDisplay);
};
var eloProfileNeedsRepair = (rawValue, normalized) => {
  var _a, _b, _c, _d, _e, _f;
  const rawRecord = asRecord2(rawValue);
  if (!rawRecord) {
    return true;
  }
  return readStringField4(rawRecord, ["userId", "user_id"]) !== normalized.userId || readStringField4(rawRecord, ["usernameDisplay", "username_display"]) !== normalized.usernameDisplay || sanitizeEloRating((_a = readNumberField3(rawRecord, ["eloRating", "elo_rating"])) != null ? _a : normalized.eloRating) !== normalized.eloRating || sanitizeRatedGameCount((_b = readNumberField3(rawRecord, ["ratedGames", "rated_games"])) != null ? _b : normalized.ratedGames) !== normalized.ratedGames || sanitizeRatedGameCount((_c = readNumberField3(rawRecord, ["ratedWins", "rated_wins"])) != null ? _c : normalized.ratedWins) !== normalized.ratedWins || sanitizeRatedGameCount((_d = readNumberField3(rawRecord, ["ratedLosses", "rated_losses"])) != null ? _d : normalized.ratedLosses) !== normalized.ratedLosses || readBooleanField3(rawRecord, ["provisional"]) !== normalized.provisional || ((_e = readStringField4(rawRecord, ["lastRatedMatchId", "last_rated_match_id"])) != null ? _e : null) !== normalized.lastRatedMatchId || ((_f = readStringField4(rawRecord, ["lastRatedAt", "last_rated_at"])) != null ? _f : null) !== normalized.lastRatedAt || readStringField4(rawRecord, ["createdAt", "created_at"]) !== normalized.createdAt || readStringField4(rawRecord, ["updatedAt", "updated_at"]) !== normalized.updatedAt;
};
var writeEloProfile = (nk, userId, profile, version) => {
  nk.storageWrite([
    {
      collection: ELO_PROFILE_COLLECTION,
      key: ELO_PROFILE_KEY,
      userId,
      value: profile,
      version,
      permissionRead: STORAGE_PERMISSION_NONE2,
      permissionWrite: STORAGE_PERMISSION_NONE2
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
          getErrorMessage2(error)
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
        getErrorMessage2(error)
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
var getEloRatingProfileForUser = (nk, logger, userId) => {
  var _a;
  const profileState = ensureEloProfileObject(nk, logger, userId);
  const rank = (_a = syncEloLeaderboardRecords(nk, logger, [profileState.profile])[userId]) != null ? _a : null;
  return __spreadProps(__spreadValues({
    leaderboardId: ELO_LEADERBOARD_ID
  }, buildLeaderboardEntryFromProfile(profileState.profile, rank)), {
    lastRatedMatchId: profileState.profile.lastRatedMatchId,
    lastRatedAt: profileState.profile.lastRatedAt
  });
};
var getLeaderboardRecordRank = (record) => {
  const rank = readNumberField3(record, ["rank"]);
  return typeof rank === "number" ? rank : null;
};
var getLeaderboardRecordOwnerId = (record) => readStringField4(record, ["ownerId", "owner_id"]);
var getLeaderboardRecordScore = (record) => readNumberField3(record, ["score"]);
var getLeaderboardRecordMetadata = (record) => {
  const data = asRecord2(record);
  return asRecord2(data == null ? void 0 : data.metadata);
};
var getLeaderboardRecordUsername = (record) => readStringField4(record, ["username"]);
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
      getErrorMessage2(error)
    );
    return null;
  }
};
var syncEloLeaderboardRecords = (nk, logger, profiles) => {
  const entries = {};
  for (const profile of profiles) {
    try {
      entries[profile.userId] = syncEloLeaderboardRecord(nk, logger, profile);
    } catch (error) {
      logger.error(
        "Unexpected Elo leaderboard sync failure for user %s: %s",
        profile.userId,
        getErrorMessage2(error)
      );
      entries[profile.userId] = null;
    }
  }
  return entries;
};
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
  const data = asRecord2(JSON.parse(payload));
  return {
    limit: typeof (data == null ? void 0 : data.limit) === "number" ? data.limit : null,
    cursor: typeof (data == null ? void 0 : data.cursor) === "string" ? data.cursor : null
  };
};
var parseAroundMeRequest = (payload) => {
  if (!payload) {
    return {};
  }
  const data = asRecord2(JSON.parse(payload));
  return {
    limit: typeof (data == null ? void 0 : data.limit) === "number" ? data.limit : null
  };
};
var normalizeStoredEloMatchParticipantResult = (value) => {
  const userId = readStringField4(value, ["userId", "user_id"]);
  const usernameDisplay = readStringField4(value, ["usernameDisplay", "username_display"]);
  const oldRating = readNumberField3(value, ["oldRating", "old_rating"]);
  const newRating = readNumberField3(value, ["newRating", "new_rating"]);
  const delta = readNumberField3(value, ["delta"]);
  const ratedGames = readNumberField3(value, ["ratedGames", "rated_games"]);
  const ratedWins = readNumberField3(value, ["ratedWins", "rated_wins"]);
  const ratedLosses = readNumberField3(value, ["ratedLosses", "rated_losses"]);
  const provisional = readBooleanField3(value, ["provisional"]);
  const lastRatedMatchId = readStringField4(value, ["lastRatedMatchId", "last_rated_match_id"]);
  const lastRatedAt = readStringField4(value, ["lastRatedAt", "last_rated_at"]);
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
  const record = asRecord2(value);
  if (!record) {
    return null;
  }
  const matchId = readStringField4(record, ["matchId", "match_id"]);
  const leaderboardId = readStringField4(record, ["leaderboardId", "leaderboard_id"]);
  const processedAt = readStringField4(record, ["processedAt", "processed_at"]);
  const winnerUserId = readStringField4(record, ["winnerUserId", "winner_user_id"]);
  const loserUserId = readStringField4(record, ["loserUserId", "loser_user_id"]);
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
      userId: SYSTEM_USER_ID3
    }
  ]);
  return findStorageObject(objects, ELO_MATCH_RESULT_COLLECTION, matchId, SYSTEM_USER_ID3);
};
var readRankedMatchStorageState = (nk, matchId, userIds) => {
  const objects = nk.storageRead([
    {
      collection: ELO_MATCH_RESULT_COLLECTION,
      key: matchId,
      userId: SYSTEM_USER_ID3
    },
    ...userIds.map((userId) => ({
      collection: ELO_PROFILE_COLLECTION,
      key: ELO_PROFILE_KEY,
      userId
    }))
  ]);
  const profileObjectsByUserId = userIds.reduce(
    (entries, userId) => {
      entries[userId] = findStorageObject(objects, ELO_PROFILE_COLLECTION, ELO_PROFILE_KEY, userId);
      return entries;
    },
    {}
  );
  return {
    processedMatchObject: findStorageObject(objects, ELO_MATCH_RESULT_COLLECTION, matchId, SYSTEM_USER_ID3),
    profileObjectsByUserId
  };
};
var buildEloProfileState = (nk, userId, profileObject) => {
  const usernameDisplay = getRequiredUsernameDisplay(nk, userId);
  const profile = normalizeEloProfile(getStorageObjectValue(profileObject), userId, usernameDisplay);
  return {
    object: profileObject,
    profile
  };
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
    logger.warn("Unable to ensure Elo leaderboard exists: %s", getErrorMessage2(error));
  }
};
var processRankedMatchResult = (nk, logger, params) => {
  var _a, _b, _c, _d;
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
    const storageState = readRankedMatchStorageState(nk, matchId, [winnerUserId, loserUserId]);
    const existingProcessedObject = storageState.processedMatchObject;
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
    const winnerProfileState = buildEloProfileState(
      nk,
      winnerUserId,
      (_a = storageState.profileObjectsByUserId[winnerUserId]) != null ? _a : null
    );
    const loserProfileState = buildEloProfileState(
      nk,
      loserUserId,
      (_b = storageState.profileObjectsByUserId[loserUserId]) != null ? _b : null
    );
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
          version: winnerProfileState.object ? (_c = getStorageObjectVersion(winnerProfileState.object)) != null ? _c : "" : "*",
          permissionRead: STORAGE_PERMISSION_NONE2,
          permissionWrite: STORAGE_PERMISSION_NONE2
        },
        {
          collection: ELO_PROFILE_COLLECTION,
          key: ELO_PROFILE_KEY,
          userId: nextLoserProfile.userId,
          value: nextLoserProfile,
          version: loserProfileState.object ? (_d = getStorageObjectVersion(loserProfileState.object)) != null ? _d : "" : "*",
          permissionRead: STORAGE_PERMISSION_NONE2,
          permissionWrite: STORAGE_PERMISSION_NONE2
        },
        {
          collection: ELO_MATCH_RESULT_COLLECTION,
          key: matchId,
          userId: SYSTEM_USER_ID3,
          value: processedRecord,
          version: "*",
          permissionRead: STORAGE_PERMISSION_NONE2,
          permissionWrite: STORAGE_PERMISSION_NONE2
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
        getErrorMessage2(error)
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
  const usernameDisplay = (_b = (_a = readStringField4(metadata, ["usernameDisplay", "username_display"])) != null ? _a : getLeaderboardRecordUsername(record)) != null ? _b : "Unknown";
  const ratedGames = sanitizeRatedGameCount((_c = readNumberField3(metadata, ["ratedGames", "rated_games"])) != null ? _c : 0);
  const ratedWins = sanitizeRatedGameCount((_d = readNumberField3(metadata, ["ratedWins", "rated_wins"])) != null ? _d : 0);
  const ratedLosses = sanitizeRatedGameCount((_e = readNumberField3(metadata, ["ratedLosses", "rated_losses"])) != null ? _e : 0);
  const provisional = readBooleanField3(metadata, ["provisional"]);
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
  const response = asRecord2(result);
  const records = Array.isArray(response == null ? void 0 : response.records) ? response.records : [];
  const nextCursor = readStringField4(response, ["nextCursor", "next_cursor"]);
  const prevCursor = readStringField4(response, ["prevCursor", "prev_cursor"]);
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
    description: "Win a Pure Luck game.",
    type: "mode",
    category: "mode",
    rewardXp: 80,
    sortOrder: 240
  },
  {
    id: CHALLENGE_IDS.SPEED_RUNNER,
    name: "Speed Runner",
    description: "Win a Pure Luck game in under 10 turns.",
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
  ) && isOptionalBoolean(summary.opponentReachedBrink) && isOptionalBoolean(summary.momentumShiftAchieved) && (typeof summary.momentumShiftTurnSpan === "undefined" || summary.momentumShiftTurnSpan === null || typeof summary.momentumShiftTurnSpan === "number" && summary.momentumShiftTurnSpan >= 0) && isOptionalNonNegativeNumber(summary.maxActivePiecesOnBoard) && (typeof summary.modeId === "undefined" || summary.modeId === null || typeof summary.modeId === "string") && isOptionalNonNegativeNumber(summary.pieceCountPerSide) && isOptionalBoolean(summary.isPrivateMatch) && isOptionalBoolean(summary.isFriendMatch) && isOptionalBoolean(summary.isTournamentMatch) && isOptionalBoolean(summary.tournamentEliminationRisk) && typeof summary.timestamp === "string";
};
var isCompletedBotMatchRewardMode = (value) => value === "standard" || value === "base_win_only";
var isSubmitCompletedBotMatchRpcRequest = (value) => {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const payload = value;
  return isCompletedMatchSummary(payload.summary) && (typeof payload.tutorialId === "string" || payload.tutorialId === null || typeof payload.tutorialId === "undefined") && (typeof payload.modeId === "undefined" || payload.modeId === null || typeof payload.modeId === "string") && (typeof payload.rewardMode === "undefined" || isCompletedBotMatchRewardMode(payload.rewardMode));
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
var isContestedLanding = (matchConfig, playerColor, targetIndex) => {
  const coord = getPathCoord(matchConfig.pathVariant, playerColor, targetIndex);
  return isContestedWarTile(matchConfig, coord);
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

// shared/wallet.ts
var SOFT_CURRENCY_KEY = "soft_currency";
var PREMIUM_CURRENCY_KEY = "premium_currency";
var COIN_REWARD_RATE = 0.1;
var isRecord = (value) => typeof value === "object" && value !== null;
var sanitizeSoftCurrencyAmount = (value) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, Math.floor(value));
  }
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return Math.max(0, Math.floor(parsed));
    }
  }
  return 0;
};
var sanitizePremiumCurrencyAmount = (value) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, Math.floor(value));
  }
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return Math.max(0, Math.floor(parsed));
    }
  }
  return 0;
};
var calculateChallengeSoftCurrencyReward = (rewardXp) => sanitizeSoftCurrencyAmount(rewardXp * COIN_REWARD_RATE);
var buildWalletRpcResponse = (softCurrency, premiumCurrency = 0) => {
  const sanitizedSoftCurrency = sanitizeSoftCurrencyAmount(softCurrency);
  const sanitizedPremiumCurrency = sanitizePremiumCurrencyAmount(premiumCurrency);
  return {
    wallet: {
      [SOFT_CURRENCY_KEY]: sanitizedSoftCurrency,
      [PREMIUM_CURRENCY_KEY]: sanitizedPremiumCurrency
    },
    softCurrency: sanitizedSoftCurrency,
    premiumCurrency: sanitizedPremiumCurrency
  };
};
var parseWalletBalances = (value) => {
  if (typeof value === "string" && value.trim().length > 0) {
    try {
      return parseWalletBalances(JSON.parse(value));
    } catch (e) {
      return buildWalletRpcResponse(0).wallet;
    }
  }
  if (!isRecord(value)) {
    return buildWalletRpcResponse(0).wallet;
  }
  return buildWalletRpcResponse(value[SOFT_CURRENCY_KEY], value[PREMIUM_CURRENCY_KEY]).wallet;
};

// backend/modules/challengeProgress.ts
var asRecord3 = (value) => typeof value === "object" && value !== null ? value : null;
var readStringField5 = (value, keys) => {
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
var readNumberField4 = (value, keys) => {
  const record = asRecord3(value);
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
  const record = asRecord3(rawValue);
  return {
    totalGamesPlayed: clampNonNegativeInteger(
      (_a = readNumberField4(record, ["totalGamesPlayed", "total_games_played"])) != null ? _a : 0
    ),
    totalWins: clampNonNegativeInteger((_b = readNumberField4(record, ["totalWins", "total_wins"])) != null ? _b : 0),
    currentWinStreak: clampNonNegativeInteger(
      (_c = readNumberField4(record, ["currentWinStreak", "current_win_streak"])) != null ? _c : 0
    ),
    currentTournamentWinStreak: clampNonNegativeInteger(
      (_d = readNumberField4(record, ["currentTournamentWinStreak", "current_tournament_win_streak"])) != null ? _d : 0
    ),
    dailyGameBucket: readStringField5(record, ["dailyGameBucket", "daily_game_bucket"]),
    dailyGameCount: clampNonNegativeInteger((_e = readNumberField4(record, ["dailyGameCount", "daily_game_count"])) != null ? _e : 0)
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
  const rawRecord = asRecord3(rawValue);
  const rawChallenges = rawRecord && typeof rawRecord.challenges === "object" && rawRecord.challenges !== null ? rawRecord.challenges : null;
  const normalized = __spreadProps(__spreadValues({}, defaults), {
    updatedAt: (_a = readStringField5(rawRecord, ["updatedAt", "updated_at"])) != null ? _a : fallbackUpdatedAt,
    stats: normalizeChallengeStats(rawRecord == null ? void 0 : rawRecord.stats),
    challenges: CHALLENGE_DEFINITIONS.reduce(
      (states, definition) => {
        var _a2;
        const rawState = asRecord3(rawChallenges == null ? void 0 : rawChallenges[definition.id]);
        const completed = (rawState == null ? void 0 : rawState.completed) === true;
        const completedAt = completed ? (_a2 = readStringField5(rawState, ["completedAt", "completed_at"])) != null ? _a2 : fallbackUpdatedAt : null;
        const completedMatchId = completed ? readStringField5(rawState, ["completedMatchId", "completed_match_id"]) : null;
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
  const rawRecord = asRecord3(rawValue);
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
  const rawStats = asRecord3(rawRecord.stats);
  if (readNumberField4(rawStats, ["totalGamesPlayed", "total_games_played"]) !== normalized.stats.totalGamesPlayed || readNumberField4(rawStats, ["totalWins", "total_wins"]) !== normalized.stats.totalWins || readNumberField4(rawStats, ["currentWinStreak", "current_win_streak"]) !== normalized.stats.currentWinStreak || readNumberField4(rawStats, ["currentTournamentWinStreak", "current_tournament_win_streak"]) !== normalized.stats.currentTournamentWinStreak || readStringField5(rawStats, ["dailyGameBucket", "daily_game_bucket"]) !== normalized.stats.dailyGameBucket || readNumberField4(rawStats, ["dailyGameCount", "daily_game_count"]) !== normalized.stats.dailyGameCount) {
    return true;
  }
  const rawChallenges = rawRecord.challenges;
  return CHALLENGE_DEFINITIONS.some((definition) => {
    const rawState = asRecord3(rawChallenges == null ? void 0 : rawChallenges[definition.id]);
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
      return summary.didWin && summary.modeId === "gameMode_1_piece";
    case CHALLENGE_IDS.MINIMALIST:
      return didWinModeWithPieceCount(summary, 3);
    case CHALLENGE_IDS.HALF_STRATEGY:
      return didWinModeWithPieceCount(summary, 5);
    case CHALLENGE_IDS.FULL_COMMANDER:
      return didWinModeWithPieceCount(summary, 7);
    case CHALLENGE_IDS.SPEED_RUNNER:
      return summary.didWin && summary.modeId === "gameMode_1_piece" && playerTurnCount < CHALLENGE_THRESHOLDS.SPEED_RUNNER_MAX_PLAYER_TURNS;
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

// backend/modules/wallet.ts
var RPC_GET_WALLET = "get_wallet";
var WALLET_LEDGER_PAGE_SIZE = 100;
var CHALLENGE_COMPLETION_CURRENCY_SOURCE = "challenge_completion";
var asRecord4 = (value) => typeof value === "object" && value !== null ? value : null;
var readStringField6 = (value, keys) => {
  const record = asRecord4(value);
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
  const record = asRecord4(value);
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
var parseJsonRecord = (value) => {
  if (typeof value === "string" && value.trim().length > 0) {
    try {
      return asRecord4(JSON.parse(value));
    } catch (e) {
      return null;
    }
  }
  return asRecord4(value);
};
var getWalletForUser = (nk, userId) => {
  const account = nk.accountGetId(userId);
  return parseWalletBalances(account == null ? void 0 : account.wallet);
};
var getWalletResponseForUser = (nk, userId) => {
  const wallet = getWalletForUser(nk, userId);
  return buildWalletRpcResponse(wallet[SOFT_CURRENCY_KEY], wallet[PREMIUM_CURRENCY_KEY]);
};
var buildChallengeSoftCurrencyMetadata = (matchId, challengeId, amount) => ({
  source: CHALLENGE_COMPLETION_CURRENCY_SOURCE,
  currency: SOFT_CURRENCY_KEY,
  matchId,
  challengeId,
  amount
});
var normalizeWalletLedgerResult = (result) => {
  if (Array.isArray(result)) {
    return {
      items: result.filter((item) => asRecord4(item) !== null),
      cursor: null
    };
  }
  const record = asRecord4(result);
  if (!record) {
    return { items: [], cursor: null };
  }
  const rawItems = Array.isArray(record.items) ? record.items : Array.isArray(record.walletLedgerItems) ? record.walletLedgerItems : Array.isArray(record.runtimeItems) ? record.runtimeItems : [];
  return {
    items: rawItems.filter((item) => asRecord4(item) !== null),
    cursor: readStringField6(record, ["cursor"])
  };
};
var getLedgerItemMetadata = (item) => {
  var _a;
  return parseJsonRecord((_a = item.metadata) != null ? _a : item.Metadata);
};
var getLedgerItemChangeset = (item) => {
  var _a;
  return parseJsonRecord((_a = item.changeset) != null ? _a : item.Changeset);
};
var isMatchingChallengeSoftCurrencyLedgerItem = (item, metadata) => {
  const ledgerMetadata = getLedgerItemMetadata(item);
  if (!ledgerMetadata) {
    return false;
  }
  const metadataAmount = readNumberField5(ledgerMetadata, ["amount"]);
  if (readStringField6(ledgerMetadata, ["source"]) !== metadata.source || readStringField6(ledgerMetadata, ["currency"]) !== metadata.currency || readStringField6(ledgerMetadata, ["matchId", "match_id"]) !== metadata.matchId || readStringField6(ledgerMetadata, ["challengeId", "challenge_id"]) !== metadata.challengeId || metadataAmount !== metadata.amount) {
    return false;
  }
  const changeset = getLedgerItemChangeset(item);
  if (!changeset) {
    return true;
  }
  return readNumberField5(changeset, [SOFT_CURRENCY_KEY]) === metadata.amount;
};
var hasChallengeSoftCurrencyLedgerEntry = (nk, userId, metadata) => {
  let cursor = "";
  while (true) {
    const result = cursor ? nk.walletLedgerList(userId, WALLET_LEDGER_PAGE_SIZE, cursor) : nk.walletLedgerList(userId, WALLET_LEDGER_PAGE_SIZE);
    const { items, cursor: nextCursor } = normalizeWalletLedgerResult(result);
    if (items.some((item) => isMatchingChallengeSoftCurrencyLedgerItem(item, metadata))) {
      return true;
    }
    if (!nextCursor || nextCursor === cursor) {
      return false;
    }
    cursor = nextCursor;
  }
};
var awardChallengeSoftCurrency = (nk, logger, params) => {
  const awardedSoftCurrency = calculateChallengeSoftCurrencyReward(params.rewardXp);
  if (awardedSoftCurrency <= 0) {
    return { awardedSoftCurrency: 0, duplicate: false };
  }
  const metadata = buildChallengeSoftCurrencyMetadata(
    params.matchId,
    params.challengeId,
    awardedSoftCurrency
  );
  if (hasChallengeSoftCurrencyLedgerEntry(nk, params.userId, metadata)) {
    return { awardedSoftCurrency, duplicate: true };
  }
  nk.walletUpdate(
    params.userId,
    {
      [SOFT_CURRENCY_KEY]: awardedSoftCurrency
    },
    metadata,
    true
  );
  logger.info(
    "Awarded %d Coins to user %s for challenge %s on match %s.",
    awardedSoftCurrency,
    params.userId,
    params.challengeId,
    params.matchId
  );
  return { awardedSoftCurrency, duplicate: false };
};
var buildPremiumCurrencyAddMetadata = (source, deduplicationKey, amount, extra = {}) => __spreadValues({
  source,
  currency: PREMIUM_CURRENCY_KEY,
  deduplicationKey,
  amount
}, extra);
var isPremiumCurrencyLedgerItem = (item, deduplicationKey) => {
  var _a;
  const ledgerMetadata = getLedgerItemMetadata(item);
  if (!ledgerMetadata) {
    return false;
  }
  if (readStringField6(ledgerMetadata, ["currency"]) !== PREMIUM_CURRENCY_KEY) {
    return false;
  }
  if (readStringField6(ledgerMetadata, ["deduplicationKey", "deduplication_key"]) !== deduplicationKey) {
    return false;
  }
  const changeset = getLedgerItemChangeset(item);
  return !changeset || ((_a = readNumberField5(changeset, [PREMIUM_CURRENCY_KEY])) != null ? _a : 0) > 0;
};
var hasPremiumCurrencyLedgerEntry = (nk, userId, deduplicationKey) => {
  let cursor = "";
  while (true) {
    const result = cursor ? nk.walletLedgerList(userId, WALLET_LEDGER_PAGE_SIZE, cursor) : nk.walletLedgerList(userId, WALLET_LEDGER_PAGE_SIZE);
    const { items, cursor: nextCursor } = normalizeWalletLedgerResult(result);
    if (items.some((item) => isPremiumCurrencyLedgerItem(item, deduplicationKey))) {
      return true;
    }
    if (!nextCursor || nextCursor === cursor) {
      return false;
    }
    cursor = nextCursor;
  }
};
var addPremiumCurrency = (nk, logger, params) => {
  var _a;
  const amount = sanitizePremiumCurrencyAmount(params.amount);
  if (amount <= 0) {
    return { awardedPremiumCurrency: 0, duplicate: false };
  }
  if (hasPremiumCurrencyLedgerEntry(nk, params.userId, params.deduplicationKey)) {
    return { awardedPremiumCurrency: amount, duplicate: true };
  }
  const metadata = buildPremiumCurrencyAddMetadata(
    params.source,
    params.deduplicationKey,
    amount,
    (_a = params.metadata) != null ? _a : {}
  );
  nk.walletUpdate(params.userId, { [PREMIUM_CURRENCY_KEY]: amount }, metadata, true);
  logger.info(
    "Awarded %d gems to user %s (source=%s, deduplicationKey=%s).",
    amount,
    params.userId,
    params.source,
    params.deduplicationKey
  );
  return { awardedPremiumCurrency: amount, duplicate: false };
};
var spendSoftCurrency = (nk, logger, params) => {
  var _a;
  const amount = sanitizeSoftCurrencyAmount(params.amount);
  if (amount <= 0) {
    return { spentSoftCurrency: 0 };
  }
  const wallet = getWalletForUser(nk, params.userId);
  if (wallet[SOFT_CURRENCY_KEY] < amount) {
    throw new Error("INSUFFICIENT_COINS");
  }
  nk.walletUpdate(
    params.userId,
    { [SOFT_CURRENCY_KEY]: -amount },
    __spreadValues({
      source: params.source,
      currency: SOFT_CURRENCY_KEY,
      amount
    }, (_a = params.metadata) != null ? _a : {}),
    true
  );
  logger.info("Spent %d Coins from user %s (source=%s).", amount, params.userId, params.source);
  return { spentSoftCurrency: amount };
};
var spendPremiumCurrency = (nk, logger, params) => {
  var _a;
  const amount = sanitizePremiumCurrencyAmount(params.amount);
  if (amount <= 0) {
    return { spentPremiumCurrency: 0 };
  }
  const wallet = getWalletForUser(nk, params.userId);
  if (wallet[PREMIUM_CURRENCY_KEY] < amount) {
    throw new Error("INSUFFICIENT_GEMS");
  }
  nk.walletUpdate(
    params.userId,
    { [PREMIUM_CURRENCY_KEY]: -amount },
    __spreadValues({
      source: params.source,
      currency: PREMIUM_CURRENCY_KEY,
      amount
    }, (_a = params.metadata) != null ? _a : {}),
    true
  );
  logger.info(
    "Spent %d gems from user %s (source=%s).",
    amount,
    params.userId,
    params.source
  );
  return { spentPremiumCurrency: amount };
};
var rpcGetWallet = (ctx, _logger, nk, _payload) => {
  if (!ctx.userId) {
    throw new Error("Authentication required.");
  }
  return JSON.stringify(getWalletResponseForUser(nk, ctx.userId));
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
var readStringField7 = (value, keys) => {
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
      permissionRead: STORAGE_PERMISSION_NONE2,
      permissionWrite: STORAGE_PERMISSION_NONE2
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
          permissionRead: STORAGE_PERMISSION_NONE2,
          permissionWrite: STORAGE_PERMISSION_NONE2
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
        getErrorMessage2(error)
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
          getErrorMessage2(error)
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
        getErrorMessage2(error)
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
  const matchId = readStringField7(record, ["matchId", "match_id"]);
  const playerUserId = readStringField7(record, ["playerUserId", "player_user_id"]);
  const processedAt = readStringField7(record, ["processedAt", "processed_at"]);
  const summary = record.summary;
  const completedChallengeIds = Array.isArray(record.completedChallengeIds) ? record.completedChallengeIds.filter((challengeId) => typeof challengeId === "string") : [];
  const awardedXp = typeof record.awardedXp === "number" ? record.awardedXp : 0;
  const awardedSoftCurrency = typeof record.awardedSoftCurrency === "number" ? record.awardedSoftCurrency : 0;
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
    awardedSoftCurrency
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
        awardedSoftCurrency: existingProcessedMatch.awardedSoftCurrency,
        totalXp: currentProfile.totalXp,
        progressionRank: getRankForXp(currentProfile.totalXp).title
      };
    }
    const completedChallengeIds = [];
    const completionWrites = [];
    let totalAwardedXp = 0;
    let totalAwardedSoftCurrency = 0;
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
          const rewardSoftCurrency = calculateChallengeSoftCurrencyReward(definition.rewardXp);
          totalAwardedSoftCurrency += rewardSoftCurrency;
          completionWrites.push({
            challengeId,
            completedAt: now,
            completedMatchId: matchId,
            rewardXp: definition.rewardXp,
            rewardSoftCurrency,
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
      awardedXp: totalAwardedXp,
      awardedSoftCurrency: totalAwardedSoftCurrency
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
        permissionRead: STORAGE_PERMISSION_NONE2,
        permissionWrite: STORAGE_PERMISSION_NONE2
      };
    });
    const writes = [
      {
        collection: PROGRESSION_COLLECTION,
        key: PROGRESSION_PROFILE_KEY,
        userId,
        value: nextProfile,
        version: profileObject ? (_a = getStorageObjectVersion(profileObject)) != null ? _a : "" : "*",
        permissionRead: STORAGE_PERMISSION_NONE2,
        permissionWrite: STORAGE_PERMISSION_NONE2
      },
      {
        collection: USER_CHALLENGE_PROGRESS_COLLECTION,
        key: USER_CHALLENGE_PROGRESS_KEY,
        userId,
        value: nextProgress,
        version: challengeProgressObject ? (_b = getStorageObjectVersion(challengeProgressObject)) != null ? _b : "" : "*",
        permissionRead: STORAGE_PERMISSION_NONE2,
        permissionWrite: STORAGE_PERMISSION_NONE2
      },
      {
        collection: PROCESSED_MATCH_RESULTS_COLLECTION,
        key: buildProcessedMatchResultKey(matchId),
        userId,
        value: processedRecord,
        version: processedMatchObject ? (_c = getStorageObjectVersion(processedMatchObject)) != null ? _c : "" : "*",
        permissionRead: STORAGE_PERMISSION_NONE2,
        permissionWrite: STORAGE_PERMISSION_NONE2
      },
      ...challengeRewardWrites
    ];
    try {
      completionWrites.forEach((completion) => {
        if (completion.rewardSoftCurrency <= 0) {
          return;
        }
        awardChallengeSoftCurrency(nk, logger, {
          userId,
          matchId,
          challengeId: completion.challengeId,
          rewardXp: completion.rewardXp
        });
      });
      nk.storageWrite(writes);
      logger.info(
        "Processed completed match %s for user %s: %d challenge completions, %d XP and %d Coins awarded.",
        matchId,
        userId,
        completedChallengeIds.length,
        totalAwardedXp,
        totalAwardedSoftCurrency
      );
      return {
        duplicate: false,
        completedChallengeIds,
        awardedXp: totalAwardedXp,
        awardedSoftCurrency: totalAwardedSoftCurrency,
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
          awardedSoftCurrency: refreshedProcessed.awardedSoftCurrency,
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
        getErrorMessage2(error)
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
  if (summary.didWin && matchConfig.allowsCoins) {
    nk.walletUpdate(
      ctx.userId,
      {
        [SOFT_CURRENCY_KEY]: 10
      },
      {
        source: "local_bot_win",
        matchId: summary.matchId,
        modeId,
        amount: 10
      },
      true
    );
  }
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

// shared/gemPacks.ts
var GEM_PACK_CATALOG = [
  {
    id: "gems_100",
    title: "100 Gems",
    gemAmount: 100,
    displayPrice: "$0.99",
    provider: "placeholder",
    productId: "gems_100",
    enabled: false,
    placeholder: true
  },
  {
    id: "gems_500",
    title: "500 Gems",
    gemAmount: 500,
    displayPrice: "$4.99",
    provider: "placeholder",
    productId: "gems_500",
    enabled: false,
    placeholder: true
  },
  {
    id: "gems_1200",
    title: "1200 Gems",
    gemAmount: 1200,
    displayPrice: "$9.99",
    provider: "placeholder",
    productId: "gems_1200",
    enabled: false,
    placeholder: true
  },
  {
    id: "gems_2600",
    title: "2600 Gems",
    gemAmount: 2600,
    displayPrice: "$19.99",
    provider: "placeholder",
    productId: "gems_2600",
    enabled: false,
    placeholder: true
  }
];

// backend/modules/gemPurchase.ts
var RPC_CONFIRM_GEM_PACK_PURCHASE = "confirm_gem_pack_purchase";
var parseJsonPayload = (payload) => {
  if (!payload) {
    return {};
  }
  try {
    const parsed = JSON.parse(payload);
    if (typeof parsed === "object" && parsed !== null) {
      return parsed;
    }
  } catch (e) {
  }
  return {};
};
var readStringField8 = (value, keys) => {
  for (const key of keys) {
    const field = value[key];
    if (typeof field === "string" && field.trim().length > 0) {
      return field.trim();
    }
  }
  return null;
};
var rpcConfirmGemPackPurchase = (ctx, logger, nk, payload) => {
  var _a;
  if (!ctx.userId) {
    throw new Error("Authentication required.");
  }
  const params = parseJsonPayload(payload);
  const packId = readStringField8(params, ["packId", "pack_id"]);
  const provider = readStringField8(params, ["provider"]);
  const receiptToken = readStringField8(params, ["receiptToken", "receipt_token"]);
  if (!packId) {
    throw new Error("MISSING_PACK_ID");
  }
  const pack = GEM_PACK_CATALOG.find((p) => p.id === packId);
  if (!pack) {
    throw new Error("GEM_PACK_NOT_FOUND");
  }
  if (!pack.enabled) {
    throw new Error("GEM_PACK_NOT_AVAILABLE");
  }
  if (!pack.placeholder) {
    if (pack.provider === "ios_iap" || pack.provider === "android_iap") {
      throw new Error("IAP_VERIFICATION_NOT_IMPLEMENTED");
    }
    if (pack.provider === "stripe") {
      throw new Error("STRIPE_VERIFICATION_NOT_IMPLEMENTED");
    }
  }
  if (!receiptToken) {
    throw new Error("MISSING_RECEIPT_TOKEN");
  }
  const deduplicationKey = `iap:${pack.provider}:${packId}:${ctx.userId}:${receiptToken}`;
  const result = addPremiumCurrency(nk, logger, {
    userId: ctx.userId,
    amount: pack.gemAmount,
    source: pack.placeholder ? "gem_pack_purchase_placeholder" : `iap_purchase_${pack.provider}`,
    deduplicationKey,
    metadata: {
      packId,
      provider: provider != null ? provider : pack.provider,
      receiptToken
    }
  });
  const wallet = parseWalletBalances((_a = nk.accountGetId(ctx.userId)) == null ? void 0 : _a.wallet);
  return JSON.stringify({
    success: true,
    gemAmount: result.awardedPremiumCurrency,
    duplicate: result.duplicate,
    newPremiumCurrency: wallet[PREMIUM_CURRENCY_KEY]
  });
};

// shared/cosmetics.ts
var MAX_INLINE_COSMETIC_UPLOAD_BYTES = 3 * 1024 * 1024;
var isRecord2 = (value) => typeof value === "object" && value !== null;
var isStringArray = (value) => Array.isArray(value) && value.every((entry) => typeof entry === "string");
var isCosmeticTier = (value) => value === "common" || value === "rare" || value === "epic" || value === "legendary";
var isCosmeticType = (value) => value === "board" || value === "pieces" || value === "dice_animation" || value === "emote" || value === "music" || value === "sound_effect";
var isCurrencyType = (value) => value === "soft" || value === "premium";
var isCosmeticAssetMediaType = (value) => value === "image" || value === "audio" || value === "video" || value === "animation";
var isUploadedCosmeticAsset = (value) => isRecord2(value) && typeof value.fileName === "string" && value.fileName.trim().length > 0 && typeof value.mimeType === "string" && value.mimeType.trim().length > 0 && typeof value.sizeBytes === "number" && Number.isFinite(value.sizeBytes) && value.sizeBytes > 0 && isCosmeticAssetMediaType(value.mediaType) && typeof value.dataUrl === "string" && value.dataUrl.startsWith("data:") && typeof value.uploadedAt === "string";
var isCosmeticDefinition = (value) => {
  if (!isRecord2(value) || !isRecord2(value.price)) {
    return false;
  }
  const availabilityWindow = value.availabilityWindow;
  const hasValidAvailability = typeof availabilityWindow === "undefined" || isRecord2(availabilityWindow) && typeof availabilityWindow.start === "string" && typeof availabilityWindow.end === "string";
  return typeof value.id === "string" && typeof value.name === "string" && isCosmeticTier(value.tier) && isCosmeticType(value.type) && isCurrencyType(value.price.currency) && typeof value.price.amount === "number" && Number.isFinite(value.price.amount) && value.price.amount >= 0 && isStringArray(value.rotationPools) && value.rotationPools.every((pool) => pool === "daily" || pool === "featured" || pool === "limited") && typeof value.rarityWeight === "number" && Number.isFinite(value.rarityWeight) && value.rarityWeight >= 0 && value.rarityWeight <= 1 && hasValidAvailability && typeof value.releasedDate === "string" && typeof value.assetKey === "string" && (typeof value.uploadedAsset === "undefined" || isUploadedCosmeticAsset(value.uploadedAsset)) && (typeof value.uploadedAsset2 === "undefined" || isUploadedCosmeticAsset(value.uploadedAsset2)) && (typeof value.disabled === "undefined" || typeof value.disabled === "boolean");
};
var isLimitedTimeEvent = (value) => isRecord2(value) && typeof value.id === "string" && typeof value.name === "string" && isStringArray(value.cosmeticIds) && typeof value.startsAt === "string" && typeof value.endsAt === "string" && (typeof value.disabled === "undefined" || typeof value.disabled === "boolean");

// backend/modules/cosmeticCatalog.ts
var CATALOG_COLLECTION = "cosmetics_catalog";
var CATALOG_ITEMS_KEY = "items";
var CATALOG_CACHE_TTL_MS = 6e4;
var RELEASED_DATE = "2026-04-15T00:00:00.000Z";
var cachedRawCatalog = null;
var cachedRawCatalogExpiresAt = 0;
var asRecord5 = (value) => typeof value === "object" && value !== null ? value : null;
var getErrorMessage3 = (error) => error instanceof Error ? error.message : String(error);
var isVersionConflict = (error) => {
  const message = getErrorMessage3(error).toLowerCase();
  return message.includes("version check") || message.includes("version conflict") || message.includes("version mismatch") || message.includes("storage write rejected");
};
var normalizeRawCatalog = (value) => {
  const record = asRecord5(value);
  const items = Array.isArray(record == null ? void 0 : record.items) ? record.items : Array.isArray(value) ? value : [];
  if (!Array.isArray(items)) {
    return null;
  }
  if (!items.every(isCosmeticDefinition)) {
    return null;
  }
  return items.map((item) => __spreadValues({}, item));
};
var SEED_CATALOG = [
  {
    id: "board_cedar_001",
    name: "Cedar Court Board",
    tier: "common",
    type: "board",
    price: { currency: "soft", amount: 300 },
    rotationPools: ["daily"],
    rarityWeight: 0.92,
    releasedDate: RELEASED_DATE,
    assetKey: "board_cedar_001"
  },
  {
    id: "board_alabaster_001",
    name: "Alabaster Board",
    tier: "common",
    type: "board",
    price: { currency: "soft", amount: 450 },
    rotationPools: ["daily"],
    rarityWeight: 0.86,
    releasedDate: RELEASED_DATE,
    assetKey: "board_alabaster_001"
  },
  {
    id: "board_lapis_001",
    name: "Lapis Board",
    tier: "rare",
    type: "board",
    price: { currency: "soft", amount: 700 },
    rotationPools: ["daily"],
    rarityWeight: 0.58,
    releasedDate: RELEASED_DATE,
    assetKey: "board_lapis_001"
  },
  {
    id: "board_obsidian_001",
    name: "Obsidian Board",
    tier: "rare",
    type: "board",
    price: { currency: "premium", amount: 450 },
    rotationPools: ["daily"],
    rarityWeight: 0.5,
    releasedDate: RELEASED_DATE,
    assetKey: "board_obsidian_001"
  },
  {
    id: "board_gold_001",
    name: "Gold Inlay Board",
    tier: "epic",
    type: "board",
    price: { currency: "premium", amount: 1e3 },
    rotationPools: ["daily", "featured"],
    rarityWeight: 0.35,
    releasedDate: RELEASED_DATE,
    assetKey: "board_gold_001"
  },
  {
    id: "pieces_ivory_001",
    name: "Ivory Shell Pieces",
    tier: "common",
    type: "pieces",
    price: { currency: "soft", amount: 300 },
    rotationPools: ["daily"],
    rarityWeight: 0.9,
    releasedDate: RELEASED_DATE,
    assetKey: "pieces_ivory_001"
  },
  {
    id: "pieces_bronze_001",
    name: "Bronze Guard Pieces",
    tier: "common",
    type: "pieces",
    price: { currency: "soft", amount: 500 },
    rotationPools: ["daily"],
    rarityWeight: 0.82,
    releasedDate: RELEASED_DATE,
    assetKey: "pieces_bronze_001"
  },
  {
    id: "pieces_carnelian_001",
    name: "Carnelian Pieces",
    tier: "rare",
    type: "pieces",
    price: { currency: "soft", amount: 750 },
    rotationPools: ["daily"],
    rarityWeight: 0.55,
    releasedDate: RELEASED_DATE,
    assetKey: "pieces_carnelian_001"
  },
  {
    id: "pieces_lapis_001",
    name: "Lapis Priest Pieces",
    tier: "rare",
    type: "pieces",
    price: { currency: "premium", amount: 500 },
    rotationPools: ["daily"],
    rarityWeight: 0.48,
    releasedDate: RELEASED_DATE,
    assetKey: "pieces_lapis_001"
  },
  {
    id: "pieces_gold_001",
    name: "Gold Royal Pieces",
    tier: "epic",
    type: "pieces",
    price: { currency: "premium", amount: 900 },
    rotationPools: ["daily", "featured"],
    rarityWeight: 0.4,
    releasedDate: RELEASED_DATE,
    assetKey: "pieces_gold_001"
  },
  {
    id: "dice_clay_001",
    name: "Clay Dice Sparks",
    tier: "common",
    type: "dice_animation",
    price: { currency: "soft", amount: 400 },
    rotationPools: ["daily"],
    rarityWeight: 0.76,
    releasedDate: RELEASED_DATE,
    assetKey: "dice_clay_001"
  },
  {
    id: "dice_copper_001",
    name: "Copper Star Toss",
    tier: "rare",
    type: "dice_animation",
    price: { currency: "soft", amount: 600 },
    rotationPools: ["daily"],
    rarityWeight: 0.52,
    releasedDate: RELEASED_DATE,
    assetKey: "dice_copper_001"
  },
  {
    id: "dice_lapis_001",
    name: "Lapis Comet Roll",
    tier: "epic",
    type: "dice_animation",
    price: { currency: "premium", amount: 900 },
    rotationPools: ["daily", "featured"],
    rarityWeight: 0.38,
    releasedDate: RELEASED_DATE,
    assetKey: "dice_lapis_001"
  },
  {
    id: "music_ancient_001",
    name: "Ancient Ambience Theme",
    tier: "common",
    type: "music",
    price: { currency: "soft", amount: 350 },
    rotationPools: ["daily"],
    rarityWeight: 0.74,
    releasedDate: RELEASED_DATE,
    assetKey: "music_ancient_001"
  },
  {
    id: "music_procession_001",
    name: "Royal Procession Theme",
    tier: "epic",
    type: "music",
    price: { currency: "premium", amount: 850 },
    rotationPools: ["daily", "featured"],
    rarityWeight: 0.36,
    releasedDate: RELEASED_DATE,
    assetKey: "music_procession_001"
  },
  {
    id: "sfx_stone_001",
    name: "Stone Table Sounds",
    tier: "common",
    type: "sound_effect",
    price: { currency: "soft", amount: 350 },
    rotationPools: ["daily"],
    rarityWeight: 0.72,
    releasedDate: RELEASED_DATE,
    assetKey: "sfx_stone_001"
  },
  {
    id: "sfx_bronze_001",
    name: "Bronze Court Sounds",
    tier: "rare",
    type: "sound_effect",
    price: { currency: "soft", amount: 650 },
    rotationPools: ["daily"],
    rarityWeight: 0.5,
    releasedDate: RELEASED_DATE,
    assetKey: "sfx_bronze_001"
  },
  {
    id: "emote_scribe_001",
    name: "Scribe's Nod",
    tier: "common",
    type: "emote",
    price: { currency: "soft", amount: 200 },
    rotationPools: ["daily"],
    rarityWeight: 0.88,
    releasedDate: RELEASED_DATE,
    assetKey: "emote_scribe_001"
  },
  {
    id: "emote_lyre_001",
    name: "Lyre Flourish",
    tier: "common",
    type: "emote",
    price: { currency: "soft", amount: 200 },
    rotationPools: ["daily"],
    rarityWeight: 0.84,
    releasedDate: RELEASED_DATE,
    assetKey: "emote_lyre_001"
  },
  {
    id: "emote_king_001",
    name: "King's Decree",
    tier: "legendary",
    type: "emote",
    price: { currency: "premium", amount: 1200 },
    rotationPools: ["daily", "featured"],
    rarityWeight: 0.3,
    releasedDate: RELEASED_DATE,
    assetKey: "emote_king_001"
  }
];
var invalidateCatalogCache = () => {
  cachedRawCatalog = null;
  cachedRawCatalogExpiresAt = 0;
};
var readRawCatalogObject = (nk) => {
  const objects = nk.storageRead([
    {
      collection: CATALOG_COLLECTION,
      key: CATALOG_ITEMS_KEY,
      userId: GLOBAL_STORAGE_USER_ID
    }
  ]);
  const object = findStorageObject(objects, CATALOG_COLLECTION, CATALOG_ITEMS_KEY, GLOBAL_STORAGE_USER_ID);
  return {
    object,
    items: normalizeRawCatalog(getStorageObjectValue(object))
  };
};
var writeRawCatalog = (nk, items, version) => {
  nk.storageWrite([
    maybeSetStorageVersion({
      collection: CATALOG_COLLECTION,
      key: CATALOG_ITEMS_KEY,
      userId: GLOBAL_STORAGE_USER_ID,
      value: { items },
      permissionRead: STORAGE_PERMISSION_NONE2,
      permissionWrite: STORAGE_PERMISSION_NONE2
    }, version)
  ]);
  invalidateCatalogCache();
};
var writeRawCatalogWithRetry = (nk, update) => {
  var _a;
  for (let attempt = 1; attempt <= MAX_WRITE_ATTEMPTS; attempt += 1) {
    const { object, items } = readRawCatalogObject(nk);
    const currentItems = items != null ? items : SEED_CATALOG;
    const nextItems = update(currentItems.map((item) => __spreadValues({}, item)));
    if (!nextItems.every(isCosmeticDefinition)) {
      throw new Error("INVALID_CATALOG");
    }
    try {
      writeRawCatalog(nk, nextItems, object ? (_a = getStorageObjectVersion(object)) != null ? _a : "" : "*");
      return nextItems;
    } catch (error) {
      if (!isVersionConflict(error) || attempt === MAX_WRITE_ATTEMPTS) {
        throw error;
      }
    }
  }
  throw new Error("CATALOG_WRITE_FAILED");
};
var loadCatalogFromStorage = (nk, options = {}) => {
  var _a;
  const now = Date.now();
  let rawItems = cachedRawCatalog;
  if (options.bypassCache || !rawItems || now >= cachedRawCatalogExpiresAt) {
    const { object, items } = readRawCatalogObject(nk);
    rawItems = items != null ? items : SEED_CATALOG;
    if (!object || !items) {
      writeRawCatalog(nk, rawItems, object ? (_a = getStorageObjectVersion(object)) != null ? _a : "" : "*");
    }
    cachedRawCatalog = rawItems.map((item) => __spreadValues({}, item));
    cachedRawCatalogExpiresAt = now + CATALOG_CACHE_TTL_MS;
  }
  const catalog = rawItems.map((item) => __spreadValues({}, item));
  return options.includeDisabled ? catalog : catalog.filter((item) => !item.disabled);
};

// backend/modules/storeRotation.ts
var DAILY_ROTATION_SIZE = 8;
var invalidateRotationCache = () => {
};
var isActiveOn = (definition, today) => {
  if (!definition.availabilityWindow) {
    return true;
  }
  const currentTime = Date.parse(today);
  const startTime = Date.parse(definition.availabilityWindow.start);
  const endTime = Date.parse(definition.availabilityWindow.end);
  if (!Number.isFinite(currentTime) || !Number.isFinite(startTime) || !Number.isFinite(endTime)) {
    return false;
  }
  return currentTime >= startTime && currentTime <= endTime;
};
var getEffectiveWeight = (definition, previousRotations) => {
  var _a, _b;
  const baseWeight = Math.max(0, definition.rarityWeight);
  const olderRotationIds = /* @__PURE__ */ new Set([...(_a = previousRotations[1]) != null ? _a : [], ...(_b = previousRotations[2]) != null ? _b : []]);
  return olderRotationIds.has(definition.id) ? baseWeight / 2 : baseWeight;
};
var weightedPick = (candidates, previousRotations) => {
  var _a, _b;
  if (candidates.length === 0) {
    return null;
  }
  const totalWeight = candidates.reduce((total, definition) => total + getEffectiveWeight(definition, previousRotations), 0);
  if (totalWeight <= 0) {
    return (_a = candidates[Math.floor(Math.random() * candidates.length)]) != null ? _a : null;
  }
  let cursor = Math.random() * totalWeight;
  for (const candidate of candidates) {
    cursor -= getEffectiveWeight(candidate, previousRotations);
    if (cursor <= 0) {
      return candidate;
    }
  }
  return (_b = candidates[candidates.length - 1]) != null ? _b : null;
};
var weightedSample = (candidates, count, previousRotations) => {
  const remaining = [...candidates];
  const selected = [];
  while (remaining.length > 0 && selected.length < count) {
    const picked = weightedPick(remaining, previousRotations);
    if (!picked) {
      break;
    }
    selected.push(picked);
    remaining.splice(remaining.findIndex((candidate) => candidate.id === picked.id), 1);
  }
  return selected;
};
var hasPreviewMedia = (items) => items.some(
  (item) => item.type === "dice_animation" || item.type === "emote" || item.type === "music" || item.type === "sound_effect"
);
var selectedWouldKeepRequiredGroups = (selected, candidate, replacement) => {
  const remaining = selected.filter((item) => item.id !== candidate.id);
  const next = [...remaining, replacement];
  return next.some((item) => item.type === "board") && next.some((item) => item.type === "pieces") && hasPreviewMedia(next);
};
var repairTypeDiversity = (selected, eligible, previousRotations) => {
  let repaired = [...selected];
  const missingGroups = [];
  if (!repaired.some((item) => item.type === "board")) {
    missingGroups.push("board");
  }
  if (!repaired.some((item) => item.type === "pieces")) {
    missingGroups.push("pieces");
  }
  if (!hasPreviewMedia(repaired)) {
    missingGroups.push("animation_or_emote");
  }
  for (const missingGroup of missingGroups) {
    const selectedIds = new Set(repaired.map((item) => item.id));
    const candidates = eligible.filter((item) => {
      if (selectedIds.has(item.id)) {
        return false;
      }
      if (missingGroup === "animation_or_emote") {
        return item.type === "dice_animation" || item.type === "emote" || item.type === "music" || item.type === "sound_effect";
      }
      return item.type === missingGroup;
    });
    const replacement = weightedPick(candidates, previousRotations);
    if (!replacement) {
      continue;
    }
    const replaceable = [...repaired].sort((a, b) => getEffectiveWeight(a, previousRotations) - getEffectiveWeight(b, previousRotations)).find((item) => selectedWouldKeepRequiredGroups(repaired, item, replacement));
    if (!replaceable) {
      continue;
    }
    repaired = repaired.map((item) => item.id === replaceable.id ? replacement : item);
  }
  return repaired;
};
var getDailyRotation = (catalog, today, previousRotations) => {
  var _a;
  const yesterdayIds = new Set((_a = previousRotations[0]) != null ? _a : []);
  const activeDaily = catalog.filter(
    (definition) => definition.rotationPools.includes("daily") && isActiveOn(definition, today)
  );
  const eligible = activeDaily.filter((definition) => !yesterdayIds.has(definition.id));
  const samplingPool = eligible.length >= DAILY_ROTATION_SIZE ? eligible : activeDaily;
  const selected = weightedSample(samplingPool, DAILY_ROTATION_SIZE, previousRotations);
  return repairTypeDiversity(selected, samplingPool, previousRotations).slice(0, DAILY_ROTATION_SIZE);
};
var getFeaturedItems = (catalog) => {
  const today = (/* @__PURE__ */ new Date()).toISOString();
  return catalog.filter(
    (definition) => definition.rotationPools.includes("featured") && (definition.tier === "epic" || definition.tier === "legendary") && isActiveOn(definition, today)
  ).sort((a, b) => b.rarityWeight - a.rarityWeight).slice(0, 2);
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
var readStringField9 = (value, keys) => {
  const record = asRecord2(value);
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
var readNumberField6 = (value, keys) => {
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
var readBooleanField4 = (value, keys) => {
  const record = asRecord2(value);
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
  const record = asRecord2(value);
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
var parseJsonPayload2 = (payload) => {
  if (!payload) {
    return {};
  }
  const parsed = JSON.parse(payload);
  const record = asRecord2(parsed);
  if (!record) {
    throw new Error("RPC payload must be a JSON object.");
  }
  return record;
};
var requireAuthenticatedUserId = (ctx) => {
  const userId = readStringField9(ctx, ["userId", "user_id"]);
  if (!userId) {
    throw new Error("Authentication required.");
  }
  return userId;
};
var getActorLabel = (ctx) => {
  var _a, _b;
  const ctxRecord = asRecord2(ctx);
  const vars = asRecord2(ctxRecord == null ? void 0 : ctxRecord.vars);
  return (_b = (_a = readStringField9(ctxRecord, ["username", "displayName", "display_name", "name"])) != null ? _a : readStringField9(vars, ["usernameDisplay", "username_display", "displayName", "display_name", "email"])) != null ? _b : requireAuthenticatedUserId(ctx);
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
var resolveTournamentGemRewardSettings = (value) => ({
  gemsForRank1: clampNonNegativeInteger2(
    readNumberField6(value, ["gemsForRank1", "gems_for_rank_1", "gemsForChampion", "gems_for_champion"]),
    0,
    1e6
  ),
  gemsForRank2: clampNonNegativeInteger2(
    readNumberField6(value, ["gemsForRank2", "gems_for_rank_2", "gemsForFinalist", "gems_for_finalist"]),
    0,
    1e6
  ),
  gemsForRank3: clampNonNegativeInteger2(
    readNumberField6(value, ["gemsForRank3", "gems_for_rank_3", "gemsForSemifinalist", "gems_for_semifinalist"]),
    0,
    1e6
  )
});
var resolveTournamentXpRewardSettings = (value) => ({
  xpPerMatchWin: clampNonNegativeInteger2(
    readNumberField6(value, [
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
    readNumberField6(value, [
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
  const record = asRecord2(value);
  if (!record) {
    return null;
  }
  const userId = readStringField9(record, ["userId", "user_id"]);
  const displayName = readStringField9(record, ["displayName", "display_name"]);
  const joinedAt = readStringField9(record, ["joinedAt", "joined_at"]);
  if (!userId || !displayName || !joinedAt) {
    return null;
  }
  const status = readStringField9(record, ["status"]);
  const seed = readNumberField6(record, ["seed"]);
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
  const record = asRecord2(value);
  if (!record) {
    return null;
  }
  const matchId = readStringField9(record, ["matchId", "match_id"]);
  const submittedByUserId = readStringField9(record, ["submittedByUserId", "submitted_by_user_id"]);
  const submittedAt = readStringField9(record, ["submittedAt", "submitted_at"]);
  const playerAUserId = readStringField9(record, ["playerAUserId", "player_a_user_id"]);
  const playerBUserId = readStringField9(record, ["playerBUserId", "player_b_user_id"]);
  const scoreA = readNumberField6(record, ["scoreA", "score_a"]);
  const scoreB = readNumberField6(record, ["scoreB", "score_b"]);
  const round = readNumberField6(record, ["round"]);
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
    winnerUserId: readStringField9(record, ["winnerUserId", "winner_user_id"]),
    notes: (_a = readStringField9(record, ["notes"])) != null ? _a : null
  };
};
var normalizeTournamentRecord = (value, fallbackId) => {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k;
  const record = asRecord2(value);
  if (!record) {
    return null;
  }
  const id = (_b = (_a = readStringField9(record, ["id"])) != null ? _a : fallbackId) != null ? _b : null;
  const name = readStringField9(record, ["name"]);
  const startsAt = readStringField9(record, ["startsAt", "starts_at"]);
  const createdAt = readStringField9(record, ["createdAt", "created_at"]);
  const updatedAt = readStringField9(record, ["updatedAt", "updated_at"]);
  const createdByUserId = readStringField9(record, ["createdByUserId", "created_by_user_id"]);
  const createdByLabel = readStringField9(record, ["createdByLabel", "created_by_label"]);
  if (!id || !name || !startsAt || !createdAt || !updatedAt || !createdByUserId || !createdByLabel) {
    return null;
  }
  const rawParticipants = Array.isArray(record.participants) ? record.participants : [];
  const rawResults = Array.isArray(record.results) ? record.results : [];
  const scoringRecord = asRecord2(record.scoring);
  const participants = rawParticipants.map((entry) => normalizeParticipant(entry)).filter((entry) => Boolean(entry));
  const results = rawResults.map((entry) => normalizeResult(entry)).filter((entry) => Boolean(entry)).sort((left, right) => {
    if (left.round !== right.round) {
      return left.round - right.round;
    }
    return left.submittedAt.localeCompare(right.submittedAt);
  });
  return {
    id,
    slug: (_c = readStringField9(record, ["slug"])) != null ? _c : id,
    name,
    description: (_d = readStringField9(record, ["description"])) != null ? _d : "",
    status: normalizeTournamentStatus(record.status, "draft"),
    startsAt,
    createdAt,
    updatedAt,
    createdByUserId,
    createdByLabel,
    region: (_e = readStringField9(record, ["region"])) != null ? _e : "Global",
    gameMode: (_f = readStringField9(record, ["gameMode", "game_mode"])) != null ? _f : "Standard",
    entryFee: (_g = readStringField9(record, ["entryFee", "entry_fee"])) != null ? _g : "Free",
    maxParticipants: clampPositiveInteger(
      readNumberField6(record, ["maxParticipants", "max_participants"]),
      DEFAULT_MAX_PARTICIPANTS,
      MAX_TOURNAMENT_PARTICIPANTS
    ),
    rewardCurrency: normalizeCurrency(record.rewardCurrency),
    rewardPoolAmount: normalizeRewardPoolAmount(record.rewardPoolAmount),
    rewardNotes: readStringField9(record, ["rewardNotes", "reward_notes"]),
    tags: readStringArrayField(record, ["tags"]),
    scoring: {
      winPoints: (_h = readNumberField6(scoringRecord, ["winPoints", "win_points"])) != null ? _h : DEFAULT_TOURNAMENT_SCORING.winPoints,
      drawPoints: (_i = readNumberField6(scoringRecord, ["drawPoints", "draw_points"])) != null ? _i : DEFAULT_TOURNAMENT_SCORING.drawPoints,
      lossPoints: (_j = readNumberField6(scoringRecord, ["lossPoints", "loss_points"])) != null ? _j : DEFAULT_TOURNAMENT_SCORING.lossPoints,
      allowDraws: (_k = readBooleanField4(scoringRecord, ["allowDraws", "allow_draws"])) != null ? _k : DEFAULT_TOURNAMENT_SCORING.allowDraws
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
      permissionRead: STORAGE_PERMISSION_NONE2,
      permissionWrite: STORAGE_PERMISSION_NONE2
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
        getErrorMessage2(error)
      );
    }
  }
  throw new Error(`Unable to update tournament '${tournamentId}'.`);
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
  const record = asRecord2(value);
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
  const record = asRecord2(value);
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
  const record = asRecord2(value);
  if (!record) {
    return null;
  }
  const id = readStringField9(record, ["id"]);
  const action = readStringField9(record, ["action"]);
  const userId = readStringField9(record, ["userId", "user_id", "actorUserId", "actor_user_id"]);
  const targetId = readStringField9(record, ["targetId", "target_id", "tournamentId", "tournament_id"]);
  const timestamp = readStringField9(record, ["timestamp", "createdAt", "created_at"]);
  if (!id || !action || !userId || !targetId || !timestamp) {
    return null;
  }
  const payloadSummary = (_c = (_b = (_a = asRecord2(record.payloadSummary)) != null ? _a : asRecord2(record.payload_summary)) != null ? _b : asRecord2(record.metadata)) != null ? _c : {};
  const actorLabel = (_d = readStringField9(record, ["actorLabel", "actor_label"])) != null ? _d : userId;
  const tournamentName = (_f = (_e = readStringField9(record, ["tournamentName", "tournament_name"])) != null ? _e : readStringField9(record, ["targetName", "target_name"])) != null ? _f : targetId;
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
  const record = asRecord2(value);
  const entries = Array.isArray(record == null ? void 0 : record.entries) ? record.entries.map((entry) => normalizeAuditEntry(entry)).filter((entry) => Boolean(entry)) : [];
  return {
    entries,
    updatedAt: (_a = readStringField9(record, ["updatedAt", "updated_at"])) != null ? _a : (/* @__PURE__ */ new Date(0)).toISOString()
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
      permissionRead: STORAGE_PERMISSION_NONE2,
      permissionWrite: STORAGE_PERMISSION_NONE2
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
    logger.warn("Unable to append tournament audit entry for %s: %s", target.id, getErrorMessage2(error));
  }
  return entry;
};
var parseResponseRecord = (value) => {
  try {
    return asRecord2(JSON.parse(value));
  } catch (e) {
    return null;
  }
};
var resolveDefaultTargetId = (ctx, payload, response) => {
  var _a, _b, _c, _d, _e;
  const responseRun = asRecord2(response == null ? void 0 : response.run);
  const responseTournament = asRecord2(response == null ? void 0 : response.tournament);
  return (_e = (_d = (_c = (_b = (_a = readStringField9(payload, ["targetId", "target_id", "runId", "run_id", "tournamentId", "tournament_id"])) != null ? _a : readStringField9(response, ["targetId", "target_id", "runId", "run_id", "tournamentId", "tournament_id", "userId", "user_id"])) != null ? _b : readStringField9(responseRun, ["runId", "run_id", "tournamentId", "tournament_id"])) != null ? _c : readStringField9(responseTournament, ["id", "tournamentId", "tournament_id"])) != null ? _d : readStringField9(ctx, ["userId", "user_id"])) != null ? _e : "unknown-target";
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
  const responseRun = asRecord2(response == null ? void 0 : response.run);
  const responseTournament = asRecord2(response == null ? void 0 : response.tournament);
  return (_d = (_c = (_b = readStringField9(responseRun, ["title", "name"])) != null ? _b : readStringField9(responseTournament, ["title", "name"])) != null ? _c : readStringField9(payload, ["title", "name"])) != null ? _d : targetId;
};
var safeParsePayload = (payload) => {
  try {
    return parseJsonPayload2(payload);
  } catch (e) {
    return {};
  }
};
var appendAutomatedAdminAuditEntry = (ctx, logger, nk, action, targetId, targetName, payloadSummary) => {
  try {
    appendTournamentAuditEntry(ctx, logger, nk, { id: targetId, name: targetName }, action, payloadSummary);
  } catch (error) {
    logger.warn("Unable to append automated admin audit entry for %s: %s", targetId, getErrorMessage2(error));
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
        error: getErrorMessage2(error)
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
var readStringField10 = (value, keys) => {
  const record = asRecord2(value);
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
  const userId = readStringField10(ctx, ["userId", "user_id"]);
  if (!userId) {
    throw new Error("Authentication required.");
  }
  return userId;
};
var normalizeAdminRole = (value) => {
  var _a;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "viewer" || normalized === "operator" || normalized === "admin") {
      return normalized;
    }
  }
  const record = asRecord2(value);
  if (!record) {
    return null;
  }
  const role = (_a = readStringField10(record, ["role"])) == null ? void 0 : _a.toLowerCase();
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
  if (!actualRole) {
    throw new Error(`Unauthorized: ${requiredRole} role required.`);
  }
  return actualRole;
};
var normalizeUserRecord = (value) => {
  const record = asRecord2(value);
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
      username: readStringField10(profile, ["username"]),
      displayName: readStringField10(profile, ["displayName", "display_name"]),
      email: readStringField10(profile, ["email"])
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
      permissionRead: STORAGE_PERMISSION_NONE2,
      permissionWrite: STORAGE_PERMISSION_NONE2
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

// backend/modules/cosmeticStore.ts
var COSMETICS_COLLECTION = "cosmetics";
var COSMETICS_OWNED_KEY = "owned";
var STORE_STATE_COLLECTION = "store_state";
var STORE_ROTATION_KEY = "rotation";
var RPC_GET_STOREFRONT = "get_storefront";
var RPC_GET_FULL_CATALOG = "get_full_catalog";
var RPC_PURCHASE_ITEM = "purchase_item";
var RPC_GET_OWNED_COSMETICS = "get_owned_cosmetics";
var RPC_ADMIN_GET_FULL_CATALOG = "admin_get_full_catalog";
var RPC_ADMIN_UPSERT_COSMETIC = "admin_upsert_cosmetic";
var RPC_ADMIN_DISABLE_COSMETIC = "admin_disable_cosmetic";
var RPC_ADMIN_ENABLE_COSMETIC = "admin_enable_cosmetic";
var RPC_ADMIN_DELETE_COSMETIC = "admin_delete_cosmetic";
var RPC_ADMIN_GET_ROTATION_STATE = "admin_get_rotation_state";
var RPC_ADMIN_SET_MANUAL_ROTATION = "admin_set_manual_rotation";
var RPC_ADMIN_CLEAR_MANUAL_ROTATION = "admin_clear_manual_rotation";
var RPC_ADMIN_SET_LIMITED_TIME_EVENT = "admin_set_limited_time_event";
var RPC_ADMIN_REMOVE_LIMITED_TIME_EVENT = "admin_remove_limited_time_event";
var RPC_ADMIN_GET_STORE_STATS = "admin_get_store_stats";
var ROTATION_TTL_MS = 24 * 60 * 60 * 1e3;
var asRecord6 = (value) => typeof value === "object" && value !== null ? value : null;
var getErrorMessage4 = (error) => error instanceof Error ? error.message : String(error);
var isVersionConflict2 = (error) => {
  const message = getErrorMessage4(error).toLowerCase();
  return message.includes("version check") || message.includes("version conflict") || message.includes("version mismatch") || message.includes("storage write rejected");
};
var isOwnedCosmeticSource = (value) => value === "purchase_soft" || value === "purchase_premium" || value === "tournament_reward" || value === "gift";
var normalizeOwnedCosmetics = (value) => {
  const record = asRecord6(value);
  const rawItems = Array.isArray(record == null ? void 0 : record.items) ? record.items : [];
  const items = rawItems.flatMap((item) => {
    const itemRecord = asRecord6(item);
    if (!itemRecord || typeof itemRecord.cosmeticId !== "string" || typeof itemRecord.acquiredAt !== "string" || !isOwnedCosmeticSource(itemRecord.source)) {
      return [];
    }
    return [
      {
        cosmeticId: itemRecord.cosmeticId,
        acquiredAt: itemRecord.acquiredAt,
        source: itemRecord.source
      }
    ];
  });
  return { items };
};
var normalizeStringArray = (value) => Array.isArray(value) ? value.filter((entry) => typeof entry === "string") : [];
var normalizePreviousDays = (value) => Array.isArray(value) ? value.map(normalizeStringArray).filter((entry) => entry.length > 0).slice(0, 3) : [];
var normalizeLimitedTimeEvents = (value) => Array.isArray(value) ? value.filter(isLimitedTimeEvent) : [];
var normalizeRotationRecord = (value) => {
  const record = asRecord6(value);
  if (!record || typeof record.generatedAt !== "string") {
    return null;
  }
  const dailyRotationIds = normalizeStringArray(record.dailyRotationIds).length > 0 ? normalizeStringArray(record.dailyRotationIds) : normalizeStringArray(record.dailyRotation);
  const featuredIds = normalizeStringArray(record.featuredIds);
  if (dailyRotationIds.length === 0 && record.manualOverride !== true) {
    return null;
  }
  return {
    dailyRotationIds,
    featuredIds,
    generatedAt: record.generatedAt,
    previousDays: normalizePreviousDays(record.previousDays),
    manualOverride: record.manualOverride === true,
    limitedTimeEvents: normalizeLimitedTimeEvents(record.limitedTimeEvents)
  };
};
var parseJsonPayload3 = (payload) => {
  let parsed;
  try {
    parsed = payload ? JSON.parse(payload) : {};
  } catch (e) {
    throw new Error("INVALID_PAYLOAD");
  }
  const record = asRecord6(parsed);
  if (!record) {
    throw new Error("INVALID_PAYLOAD");
  }
  return record;
};
var requireAdminRole = (ctx, nk, role = "viewer") => assertAdmin(ctx, role, nk);
var readOwnedCosmeticsObject = (nk, userId) => {
  const objects = nk.storageRead([
    {
      collection: COSMETICS_COLLECTION,
      key: COSMETICS_OWNED_KEY,
      userId
    }
  ]);
  const object = findStorageObject(objects, COSMETICS_COLLECTION, COSMETICS_OWNED_KEY, userId);
  return {
    object,
    owned: normalizeOwnedCosmetics(getStorageObjectValue(object))
  };
};
var readRotationObject = (nk) => {
  const objects = nk.storageRead([
    {
      collection: STORE_STATE_COLLECTION,
      key: STORE_ROTATION_KEY,
      userId: GLOBAL_STORAGE_USER_ID
    }
  ]);
  const object = findStorageObject(objects, STORE_STATE_COLLECTION, STORE_ROTATION_KEY, GLOBAL_STORAGE_USER_ID);
  return {
    object,
    rotation: normalizeRotationRecord(getStorageObjectValue(object))
  };
};
var isRotationFresh = (rotation, nowMs) => {
  const generatedAtMs = Date.parse(rotation.generatedAt);
  return rotation.manualOverride || Number.isFinite(generatedAtMs) && nowMs - generatedAtMs < ROTATION_TTL_MS && rotation.dailyRotationIds.length === 8;
};
var writeRotationRecord = (nk, rotation, version) => {
  nk.storageWrite([
    maybeSetStorageVersion({
      collection: STORE_STATE_COLLECTION,
      key: STORE_ROTATION_KEY,
      userId: GLOBAL_STORAGE_USER_ID,
      value: rotation,
      permissionRead: STORAGE_PERMISSION_NONE2,
      permissionWrite: STORAGE_PERMISSION_NONE2
    }, version)
  ]);
};
var buildRotationRecord = (catalog, nowIso, previousRotation) => {
  var _a;
  const previousDays = previousRotation ? [previousRotation.dailyRotationIds, ...previousRotation.previousDays].slice(0, 3) : [];
  const dailyRotationIds = getDailyRotation(catalog, nowIso, previousDays).map((item) => item.id);
  const featuredIds = getFeaturedItems(catalog).map((item) => item.id);
  return {
    dailyRotationIds,
    featuredIds,
    generatedAt: nowIso,
    previousDays,
    manualOverride: false,
    limitedTimeEvents: (_a = previousRotation == null ? void 0 : previousRotation.limitedTimeEvents) != null ? _a : []
  };
};
var getOrCreateStoreRotation = (nk, logger, catalog, now = /* @__PURE__ */ new Date()) => {
  var _a;
  for (let attempt = 1; attempt <= MAX_WRITE_ATTEMPTS; attempt += 1) {
    const { object, rotation } = readRotationObject(nk);
    if (rotation && isRotationFresh(rotation, now.getTime())) {
      return rotation;
    }
    const nextRotation = buildRotationRecord(catalog, now.toISOString(), rotation);
    const objectUserId = typeof (object == null ? void 0 : object.userId) === "string" ? object.userId : void 0;
    const version = object && objectUserId === GLOBAL_STORAGE_USER_ID ? (_a = getStorageObjectVersion(object)) != null ? _a : "" : "*";
    try {
      writeRotationRecord(nk, nextRotation, version);
      return nextRotation;
    } catch (error) {
      if (!isVersionConflict2(error) || attempt === MAX_WRITE_ATTEMPTS) {
        logger.error("Failed to write store rotation: %s", getErrorMessage4(error));
        throw error;
      }
    }
  }
  throw new Error("STORE_ROTATION_WRITE_FAILED");
};
var catalogItemsForIds = (catalog, ids) => {
  const byId = new Map(catalog.map((item) => [item.id, item]));
  return ids.flatMap((id) => {
    const item = byId.get(id);
    return item ? [item] : [];
  });
};
var getRotationExpiresAt = (rotation) => new Date(Date.parse(rotation.generatedAt) + ROTATION_TTL_MS).toISOString();
var isLimitedTimeEventActive = (event, now) => {
  if (event.disabled) {
    return false;
  }
  const nowMs = now.getTime();
  const startMs = Date.parse(event.startsAt);
  const endMs = Date.parse(event.endsAt);
  return Number.isFinite(startMs) && Number.isFinite(endMs) && nowMs >= startMs && nowMs <= endMs;
};
var resolveLimitedTimeItems = (catalog, events, now) => {
  const activeIds = new Set(
    events.filter((event) => isLimitedTimeEventActive(event, now)).flatMap((event) => event.cosmeticIds)
  );
  return catalog.filter((item) => activeIds.has(item.id));
};
var buildStorefrontResponse = (nk, logger, userId, now = /* @__PURE__ */ new Date()) => {
  const catalog = loadCatalogFromStorage(nk);
  const rotation = getOrCreateStoreRotation(nk, logger, catalog, now);
  const { owned } = readOwnedCosmeticsObject(nk, userId);
  return {
    dailyRotation: catalogItemsForIds(catalog, rotation.dailyRotationIds),
    featured: catalogItemsForIds(catalog, rotation.featuredIds),
    limitedTime: resolveLimitedTimeItems(catalog, rotation.limitedTimeEvents, now),
    bundles: [],
    ownedIds: owned.items.map((item) => item.cosmeticId),
    rotationExpiresAt: getRotationExpiresAt(rotation)
  };
};
var parsePurchaseItemRequest = (payload) => {
  let parsed;
  try {
    parsed = payload ? JSON.parse(payload) : {};
  } catch (e) {
    throw new Error("INVALID_PAYLOAD");
  }
  const record = asRecord6(parsed);
  if (!record || typeof record.itemId !== "string" || record.itemId.trim().length === 0) {
    throw new Error("INVALID_PAYLOAD");
  }
  return { itemId: record.itemId };
};
var currencyKeyForCosmetic = (definition) => definition.price.currency === "premium" ? PREMIUM_CURRENCY_KEY : SOFT_CURRENCY_KEY;
var purchaseSourceForCosmetic = (definition) => definition.price.currency === "premium" ? "purchase_premium" : "purchase_soft";
var deductWalletForPurchase = (nk, userId, definition) => {
  const currencyKey = currencyKeyForCosmetic(definition);
  try {
    nk.walletsUpdate([
      {
        userId,
        changeset: {
          [currencyKey]: -definition.price.amount
        },
        metadata: {
          source: "cosmetic_purchase",
          cosmeticId: definition.id,
          currency: currencyKey,
          amount: definition.price.amount
        }
      }
    ]);
  } catch (e) {
    throw new Error("INSUFFICIENT_FUNDS");
  }
};
var writeOwnedCosmeticAfterPurchase = (nk, userId, definition, acquiredAt) => {
  var _a;
  const purchasedItem = {
    cosmeticId: definition.id,
    acquiredAt,
    source: purchaseSourceForCosmetic(definition)
  };
  for (let attempt = 1; attempt <= MAX_WRITE_ATTEMPTS; attempt += 1) {
    const { object, owned } = readOwnedCosmeticsObject(nk, userId);
    if (owned.items.some((item) => item.cosmeticId === definition.id)) {
      return owned.items;
    }
    const nextItems = [...owned.items, purchasedItem];
    try {
      nk.storageWrite([
        maybeSetStorageVersion({
          collection: COSMETICS_COLLECTION,
          key: COSMETICS_OWNED_KEY,
          userId,
          value: { items: nextItems },
          permissionRead: STORAGE_PERMISSION_NONE2,
          permissionWrite: STORAGE_PERMISSION_NONE2
        }, object ? (_a = getStorageObjectVersion(object)) != null ? _a : "" : "*")
      ]);
      return nextItems;
    } catch (error) {
      if (!isVersionConflict2(error) || attempt === MAX_WRITE_ATTEMPTS) {
        throw error;
      }
    }
  }
  throw new Error("OWNED_COSMETICS_WRITE_FAILED");
};
var getUpdatedWallet = (nk, userId) => {
  var _a;
  const wallet = parseWalletBalances((_a = nk.accountGetId(userId)) == null ? void 0 : _a.wallet);
  return {
    [SOFT_CURRENCY_KEY]: wallet[SOFT_CURRENCY_KEY],
    [PREMIUM_CURRENCY_KEY]: wallet[PREMIUM_CURRENCY_KEY]
  };
};
var purchaseCosmeticItem = (nk, logger, userId, itemId) => {
  const catalog = loadCatalogFromStorage(nk);
  const definition = catalog.find((item) => item.id === itemId);
  if (!definition || definition.disabled) {
    throw new Error("ITEM_NOT_FOUND");
  }
  const { owned } = readOwnedCosmeticsObject(nk, userId);
  if (owned.items.some((item) => item.cosmeticId === itemId)) {
    throw new Error("ALREADY_OWNED");
  }
  deductWalletForPurchase(nk, userId, definition);
  writeOwnedCosmeticAfterPurchase(nk, userId, definition, (/* @__PURE__ */ new Date()).toISOString());
  recordCosmeticPurchaseAnalyticsEvent(nk, logger, {
    userId,
    cosmeticId: definition.id,
    currency: definition.price.currency,
    amount: definition.price.amount
  });
  return {
    success: true,
    cosmeticId: itemId,
    updatedWallet: getUpdatedWallet(nk, userId)
  };
};
var getOwnedCosmeticsForUser = (nk, userId) => {
  const { owned } = readOwnedCosmeticsObject(nk, userId);
  return {
    items: owned.items,
    cosmeticIds: owned.items.map((item) => item.cosmeticId)
  };
};
var ensureCatalogItemIdsExist = (catalog, ids) => {
  const byId = new Map(catalog.map((item) => [item.id, item]));
  ids.forEach((id) => {
    const item = byId.get(id);
    if (!item || item.disabled) {
      throw new Error("INVALID_COSMETIC_ID");
    }
  });
};
var getRotationStateForAdmin = (nk, logger, now = /* @__PURE__ */ new Date()) => {
  const catalog = loadCatalogFromStorage(nk);
  const rotation = getOrCreateStoreRotation(nk, logger, catalog, now);
  return {
    dailyRotationIds: rotation.dailyRotationIds,
    featuredIds: rotation.featuredIds,
    generatedAt: rotation.generatedAt,
    previousDays: rotation.previousDays,
    manualOverride: rotation.manualOverride,
    limitedTimeEvents: rotation.limitedTimeEvents
  };
};
var updateRotationRecordWithRetry = (nk, logger, catalog, update) => {
  var _a;
  for (let attempt = 1; attempt <= MAX_WRITE_ATTEMPTS; attempt += 1) {
    const { object, rotation } = readRotationObject(nk);
    const current = rotation != null ? rotation : buildRotationRecord(catalog, (/* @__PURE__ */ new Date()).toISOString(), null);
    const nextRotation = update(current);
    const objectUserId = typeof (object == null ? void 0 : object.userId) === "string" ? object.userId : void 0;
    const version = object && objectUserId === GLOBAL_STORAGE_USER_ID ? (_a = getStorageObjectVersion(object)) != null ? _a : "" : "*";
    try {
      writeRotationRecord(nk, nextRotation, version);
      invalidateRotationCache();
      return nextRotation;
    } catch (error) {
      if (!isVersionConflict2(error) || attempt === MAX_WRITE_ATTEMPTS) {
        logger.error("Failed to write store rotation: %s", getErrorMessage4(error));
        throw error;
      }
    }
  }
  throw new Error("STORE_ROTATION_WRITE_FAILED");
};
var parseUpsertCosmeticRequest = (payload) => {
  const record = parseJsonPayload3(payload);
  const cosmetic = asRecord6(record.cosmetic);
  if (!cosmetic || typeof cosmetic.id !== "string" || cosmetic.id.trim().length === 0) {
    throw new Error("INVALID_PAYLOAD");
  }
  return {
    cosmetic
  };
};
var parseToggleCosmeticRequest = (payload) => {
  const record = parseJsonPayload3(payload);
  if (typeof record.cosmeticId !== "string" || record.cosmeticId.trim().length === 0) {
    throw new Error("INVALID_PAYLOAD");
  }
  return { cosmeticId: record.cosmeticId };
};
var parseDeleteCosmeticRequest = (payload) => {
  const record = parseJsonPayload3(payload);
  if (typeof record.cosmeticId !== "string" || record.cosmeticId.trim().length === 0) {
    throw new Error("INVALID_PAYLOAD");
  }
  return { cosmeticId: record.cosmeticId };
};
var parseManualRotationRequest = (payload) => {
  const record = parseJsonPayload3(payload);
  const dailyRotationIds = normalizeStringArray(record.dailyRotationIds);
  const featuredIds = normalizeStringArray(record.featuredIds);
  if (dailyRotationIds.length > 8 || featuredIds.length > 2) {
    throw new Error("INVALID_ROTATION_SIZE");
  }
  return { dailyRotationIds, featuredIds };
};
var parseSetLimitedTimeEventRequest = (payload) => {
  const record = parseJsonPayload3(payload);
  if (!isLimitedTimeEvent(record.event)) {
    throw new Error("INVALID_PAYLOAD");
  }
  return { event: record.event };
};
var parseRemoveLimitedTimeEventRequest = (payload) => {
  const record = parseJsonPayload3(payload);
  if (typeof record.eventId !== "string" || record.eventId.trim().length === 0) {
    throw new Error("INVALID_PAYLOAD");
  }
  return { eventId: record.eventId };
};
var isUploadedAssetCompatible = (item) => {
  var _a;
  const mediaType = (_a = item.uploadedAsset) == null ? void 0 : _a.mediaType;
  if (mediaType) {
    if (item.type === "music" || item.type === "sound_effect") {
      if (mediaType !== "audio") return false;
    } else if (item.type === "board" || item.type === "pieces") {
      if (mediaType !== "image" && mediaType !== "animation") return false;
    } else if (item.type === "dice_animation" || item.type === "emote") {
      if (mediaType !== "image" && mediaType !== "animation" && mediaType !== "video") return false;
    } else {
      return false;
    }
  }
  if (item.uploadedAsset2) {
    if (item.type !== "dice_animation") return false;
    const mt2 = item.uploadedAsset2.mediaType;
    if (mt2 !== "image" && mt2 !== "animation" && mt2 !== "video") return false;
  }
  return true;
};
var upsertCatalogItem = (nk, patch) => {
  let updatedItem = null;
  writeRawCatalogWithRetry(nk, (items) => {
    const existingIndex = items.findIndex((item) => item.id === patch.id);
    const patchWithoutAssetRemoval = __spreadValues({}, patch);
    if (patch.uploadedAsset === null) {
      delete patchWithoutAssetRemoval.uploadedAsset;
    }
    if (patch.uploadedAsset2 === null) {
      delete patchWithoutAssetRemoval.uploadedAsset2;
    }
    if (patchWithoutAssetRemoval.uploadedAsset && patchWithoutAssetRemoval.uploadedAsset.sizeBytes > MAX_INLINE_COSMETIC_UPLOAD_BYTES) {
      throw new Error("INVALID_COSMETIC_ASSET");
    }
    if (patchWithoutAssetRemoval.uploadedAsset2 && patchWithoutAssetRemoval.uploadedAsset2.sizeBytes > MAX_INLINE_COSMETIC_UPLOAD_BYTES) {
      throw new Error("INVALID_COSMETIC_ASSET");
    }
    const merged = __spreadValues(__spreadValues({}, existingIndex >= 0 ? items[existingIndex] : {}), patchWithoutAssetRemoval);
    if (patch.uploadedAsset === null) {
      delete merged.uploadedAsset;
    }
    if (patch.uploadedAsset2 === null) {
      delete merged.uploadedAsset2;
    }
    if (!isCosmeticDefinition(merged)) {
      throw new Error("INVALID_COSMETIC");
    }
    if (!isUploadedAssetCompatible(merged)) {
      throw new Error("INVALID_COSMETIC_ASSET");
    }
    updatedItem = merged;
    if (existingIndex >= 0) {
      return items.map((item, index) => index === existingIndex ? merged : item);
    }
    return [...items, merged];
  });
  invalidateCatalogCache();
  invalidateRotationCache();
  if (!updatedItem) {
    throw new Error("CATALOG_WRITE_FAILED");
  }
  return {
    success: true,
    item: updatedItem
  };
};
var deleteCatalogItem = (nk, logger, cosmeticId) => {
  let deleted = false;
  writeRawCatalogWithRetry(nk, (items) => {
    deleted = items.some((item) => item.id === cosmeticId);
    if (!deleted) {
      throw new Error("ITEM_NOT_FOUND");
    }
    return items.filter((item) => item.id !== cosmeticId);
  });
  const catalog = loadCatalogFromStorage(nk, { bypassCache: true });
  updateRotationRecordWithRetry(nk, logger, catalog, (current) => __spreadProps(__spreadValues({}, current), {
    dailyRotationIds: current.dailyRotationIds.filter((id) => id !== cosmeticId),
    featuredIds: current.featuredIds.filter((id) => id !== cosmeticId),
    limitedTimeEvents: current.limitedTimeEvents.map((event) => __spreadProps(__spreadValues({}, event), {
      cosmeticIds: event.cosmeticIds.filter((id) => id !== cosmeticId)
    })).filter((event) => event.cosmeticIds.length > 0)
  }));
  invalidateCatalogCache();
  invalidateRotationCache();
  return {
    success: true,
    cosmeticId
  };
};
var toggleCatalogItem = (nk, cosmeticId, disabled) => {
  let updatedItem = null;
  writeRawCatalogWithRetry(nk, (items) => {
    const existing = items.find((item) => item.id === cosmeticId);
    if (!existing) {
      throw new Error("ITEM_NOT_FOUND");
    }
    updatedItem = __spreadProps(__spreadValues({}, existing), { disabled });
    return items.map((item) => item.id === cosmeticId ? updatedItem : item);
  });
  invalidateCatalogCache();
  invalidateRotationCache();
  if (!updatedItem) {
    throw new Error("ITEM_NOT_FOUND");
  }
  return {
    success: true,
    item: updatedItem
  };
};
var buildStoreStats = (nk, logger) => {
  const result = listAnalyticsEvents(nk, logger);
  if (!result.supported || result.events.length === 0) {
    return {
      totalPurchases: 0,
      totalSoftCurrencySpent: 0,
      totalPremiumCurrencySpent: 0,
      items: []
    };
  }
  const byCosmetic = /* @__PURE__ */ new Map();
  let totalPurchases = 0;
  let totalSoftCurrencySpent = 0;
  let totalPremiumCurrencySpent = 0;
  result.events.forEach((event) => {
    var _a;
    if (event.type !== "cosmetic_purchase") {
      return;
    }
    totalPurchases += 1;
    if (event.currency === "premium") {
      totalPremiumCurrencySpent += event.amount;
    } else {
      totalSoftCurrencySpent += event.amount;
    }
    const current = (_a = byCosmetic.get(event.cosmeticId)) != null ? _a : {
      cosmeticId: event.cosmeticId,
      purchaseCount: 0,
      softCurrencySpent: 0,
      premiumCurrencySpent: 0
    };
    current.purchaseCount += 1;
    if (event.currency === "premium") {
      current.premiumCurrencySpent += event.amount;
    } else {
      current.softCurrencySpent += event.amount;
    }
    byCosmetic.set(event.cosmeticId, current);
  });
  return {
    totalPurchases,
    totalSoftCurrencySpent,
    totalPremiumCurrencySpent,
    items: Array.from(byCosmetic.values()).sort((left, right) => right.purchaseCount - left.purchaseCount)
  };
};
var rpcGetStorefront = (ctx, logger, nk, _payload) => {
  if (!ctx.userId) {
    throw new Error("Authentication required.");
  }
  return JSON.stringify(buildStorefrontResponse(nk, logger, ctx.userId));
};
var rpcGetFullCatalog = (ctx, _logger, nk, _payload) => {
  if (!ctx.userId) {
    throw new Error("Authentication required.");
  }
  const items = loadCatalogFromStorage(nk).map((_a2) => {
    var _b2 = _a2, { uploadedAsset: _a, uploadedAsset2: _b } = _b2, rest = __objRest(_b2, ["uploadedAsset", "uploadedAsset2"]);
    return rest;
  });
  const response = { items };
  return JSON.stringify(response);
};
var rpcPurchaseItem = (ctx, logger, nk, payload) => {
  if (!ctx.userId) {
    throw new Error("Authentication required.");
  }
  const request = parsePurchaseItemRequest(payload);
  return JSON.stringify(purchaseCosmeticItem(nk, logger, ctx.userId, request.itemId));
};
var rpcGetOwnedCosmetics = (ctx, _logger, nk, _payload) => {
  if (!ctx.userId) {
    throw new Error("Authentication required.");
  }
  return JSON.stringify(getOwnedCosmeticsForUser(nk, ctx.userId));
};
var rpcAdminGetFullCatalog = (ctx, _logger, nk, _payload) => {
  requireAdminRole(ctx, nk, "viewer");
  return JSON.stringify({ items: loadCatalogFromStorage(nk, { includeDisabled: true }) });
};
var rpcAdminUpsertCosmetic = (ctx, _logger, nk, payload) => {
  requireAdminRole(ctx, nk, "operator");
  const request = parseUpsertCosmeticRequest(payload);
  return JSON.stringify(upsertCatalogItem(nk, request.cosmetic));
};
var rpcAdminDisableCosmetic = (ctx, _logger, nk, payload) => {
  requireAdminRole(ctx, nk, "operator");
  const request = parseToggleCosmeticRequest(payload);
  return JSON.stringify(toggleCatalogItem(nk, request.cosmeticId, true));
};
var rpcAdminEnableCosmetic = (ctx, _logger, nk, payload) => {
  requireAdminRole(ctx, nk, "operator");
  const request = parseToggleCosmeticRequest(payload);
  return JSON.stringify(toggleCatalogItem(nk, request.cosmeticId, false));
};
var rpcAdminDeleteCosmetic = (ctx, logger, nk, payload) => {
  requireAdminRole(ctx, nk, "operator");
  const request = parseDeleteCosmeticRequest(payload);
  return JSON.stringify(deleteCatalogItem(nk, logger, request.cosmeticId));
};
var rpcAdminGetRotationState = (ctx, logger, nk, _payload) => {
  requireAdminRole(ctx, nk, "viewer");
  return JSON.stringify(getRotationStateForAdmin(nk, logger));
};
var rpcAdminSetManualRotation = (ctx, logger, nk, payload) => {
  requireAdminRole(ctx, nk, "operator");
  const request = parseManualRotationRequest(payload);
  const catalog = loadCatalogFromStorage(nk);
  ensureCatalogItemIdsExist(catalog, [...request.dailyRotationIds, ...request.featuredIds]);
  const rotation = updateRotationRecordWithRetry(nk, logger, catalog, (current) => __spreadProps(__spreadValues({}, current), {
    dailyRotationIds: request.dailyRotationIds,
    featuredIds: request.featuredIds,
    generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    manualOverride: true
  }));
  return JSON.stringify(rotation);
};
var rpcAdminClearManualRotation = (ctx, logger, nk, _payload) => {
  requireAdminRole(ctx, nk, "operator");
  const catalog = loadCatalogFromStorage(nk);
  const rotation = updateRotationRecordWithRetry(nk, logger, catalog, (current) => __spreadProps(__spreadValues({}, current), {
    dailyRotationIds: [],
    featuredIds: [],
    generatedAt: (/* @__PURE__ */ new Date(0)).toISOString(),
    manualOverride: false
  }));
  return JSON.stringify(rotation);
};
var rpcAdminSetLimitedTimeEvent = (ctx, logger, nk, payload) => {
  requireAdminRole(ctx, nk, "operator");
  const request = parseSetLimitedTimeEventRequest(payload);
  const catalog = loadCatalogFromStorage(nk);
  ensureCatalogItemIdsExist(catalog, request.event.cosmeticIds);
  const rotation = updateRotationRecordWithRetry(nk, logger, catalog, (current) => __spreadProps(__spreadValues({}, current), {
    limitedTimeEvents: [
      ...current.limitedTimeEvents.filter((event) => event.id !== request.event.id),
      request.event
    ]
  }));
  return JSON.stringify(rotation);
};
var rpcAdminRemoveLimitedTimeEvent = (ctx, logger, nk, payload) => {
  requireAdminRole(ctx, nk, "operator");
  const request = parseRemoveLimitedTimeEventRequest(payload);
  const catalog = loadCatalogFromStorage(nk);
  const rotation = updateRotationRecordWithRetry(nk, logger, catalog, (current) => __spreadProps(__spreadValues({}, current), {
    limitedTimeEvents: current.limitedTimeEvents.filter((event) => event.id !== request.eventId)
  }));
  return JSON.stringify(rotation);
};
var rpcAdminGetStoreStats = (ctx, logger, nk, _payload) => {
  requireAdminRole(ctx, nk, "viewer");
  return JSON.stringify(buildStoreStats(nk, logger));
};

// shared/gameModes.ts
var GAME_MODE_PRESET_OPTIONS = [
  {
    id: "finkel_rules",
    label: "Finkel",
    description: "Seven pieces on the classic protected-rosette route.",
    baseRulesetPreset: "finkel_rules",
    pieceCountPerSide: 7,
    rulesVariant: "standard",
    rosetteSafetyMode: "standard",
    exitStyle: "standard",
    eliminationMode: "return_to_start",
    fogOfWar: false,
    boardAssetKey: "board_design",
    pathVariant: "default",
    throwProfile: "standard",
    bonusTurnOnRosette: true,
    bonusTurnOnCapture: false
  },
  {
    id: "hjr_murray",
    label: "HJR Murray",
    description: "Seven pieces on the longer looped reconstruction.",
    baseRulesetPreset: "hjr_murray",
    pieceCountPerSide: 7,
    rulesVariant: "standard",
    rosetteSafetyMode: "standard",
    exitStyle: "standard",
    eliminationMode: "return_to_start",
    fogOfWar: false,
    boardAssetKey: "board_design",
    pathVariant: "murray",
    throwProfile: "standard",
    bonusTurnOnRosette: true,
    bonusTurnOnCapture: false
  },
  {
    id: "rc_bell",
    label: "RC Bell",
    description: "Seven pieces with Bell throws and rosette fines.",
    baseRulesetPreset: "rc_bell",
    pieceCountPerSide: 7,
    rulesVariant: "standard",
    rosetteSafetyMode: "open",
    exitStyle: "standard",
    eliminationMode: "return_to_start",
    fogOfWar: false,
    boardAssetKey: "board_design",
    pathVariant: "default",
    throwProfile: "bell",
    bonusTurnOnRosette: false,
    bonusTurnOnCapture: false
  },
  {
    id: "masters",
    label: "Masters",
    description: "Seven pieces on the compromise looped route.",
    baseRulesetPreset: "masters",
    pieceCountPerSide: 7,
    rulesVariant: "standard",
    rosetteSafetyMode: "standard",
    exitStyle: "standard",
    eliminationMode: "return_to_start",
    fogOfWar: false,
    boardAssetKey: "board_design",
    pathVariant: "masters",
    throwProfile: "masters",
    bonusTurnOnRosette: true,
    bonusTurnOnCapture: false
  },
  {
    id: "skiryuk",
    label: "Skiryuk",
    description: "Seven pieces on the alternate middle-left exit route.",
    baseRulesetPreset: "skiryuk",
    pieceCountPerSide: 7,
    rulesVariant: "standard",
    rosetteSafetyMode: "standard",
    exitStyle: "standard",
    eliminationMode: "return_to_start",
    fogOfWar: false,
    boardAssetKey: "board_design",
    pathVariant: "skiryuk",
    throwProfile: "standard",
    bonusTurnOnRosette: true,
    bonusTurnOnCapture: false
  },
  {
    id: "custom",
    label: "Custom",
    description: "A blank slate for operator-built mode variants.",
    baseRulesetPreset: "custom",
    pieceCountPerSide: 7,
    rulesVariant: "standard",
    rosetteSafetyMode: "standard",
    exitStyle: "standard",
    eliminationMode: "return_to_start",
    fogOfWar: false,
    boardAssetKey: "board_design",
    pathVariant: "default",
    throwProfile: "standard",
    bonusTurnOnRosette: true,
    bonusTurnOnCapture: false
  }
];
var GAME_MODE_PRESET_BY_ID = Object.fromEntries(
  GAME_MODE_PRESET_OPTIONS.map((option) => [option.id, option])
);
var LEGACY_GAME_MODE_PRESET_IDS = [
  "quick_play",
  "race",
  "capture"
];
var LEGACY_GAME_MODE_PRESET_IDS_SET = new Set(LEGACY_GAME_MODE_PRESET_IDS);
var GAME_MODE_BASE_RULESET_PRESET_SET = /* @__PURE__ */ new Set([
  ...GAME_MODE_PRESET_OPTIONS.map((option) => option.id),
  ...LEGACY_GAME_MODE_PRESET_IDS
]);
var GAME_MODE_RULE_VARIANT_SET = /* @__PURE__ */ new Set(["standard", "capture", "no-capture"]);
var GAME_MODE_ROSETTE_SAFETY_MODE_SET = /* @__PURE__ */ new Set(["standard", "open"]);
var GAME_MODE_EXIT_STYLE_SET = /* @__PURE__ */ new Set(["standard", "single_exit"]);
var GAME_MODE_ELIMINATION_MODE_SET = /* @__PURE__ */ new Set(["return_to_start", "eliminated"]);
var GAME_MODE_BOARD_ASSET_KEY_SET = /* @__PURE__ */ new Set(["board_design", "board_single_exit"]);
var normalizeGameModeBaseRulesetPreset = (preset) => {
  if (preset && preset in GAME_MODE_PRESET_BY_ID) {
    return preset;
  }
  return "custom";
};
var isLegacyGameModeBaseRulesetPreset = (preset) => Boolean(preset && LEGACY_GAME_MODE_PRESET_IDS_SET.has(preset));
var getGameModePresetDefaults = (preset) => {
  var _a;
  const normalizedPreset = normalizeGameModeBaseRulesetPreset(preset);
  const option = (_a = GAME_MODE_PRESET_BY_ID[normalizedPreset]) != null ? _a : GAME_MODE_PRESET_BY_ID.custom;
  return {
    baseRulesetPreset: option.baseRulesetPreset,
    pieceCountPerSide: option.pieceCountPerSide,
    rulesVariant: option.rulesVariant,
    rosetteSafetyMode: option.rosetteSafetyMode,
    exitStyle: option.exitStyle,
    eliminationMode: option.eliminationMode,
    fogOfWar: option.fogOfWar,
    boardAssetKey: option.boardAssetKey,
    pathVariant: option.pathVariant,
    throwProfile: option.throwProfile,
    bonusTurnOnRosette: option.bonusTurnOnRosette,
    bonusTurnOnCapture: option.bonusTurnOnCapture
  };
};
var resolveGameModeBaseRulesetLabel = (preset) => {
  var _a, _b;
  return (_b = (_a = GAME_MODE_PRESET_BY_ID[preset]) == null ? void 0 : _a.label) != null ? _b : "Custom";
};
var resolveGameModeBoardLabel = (boardAssetKey) => boardAssetKey === "board_single_exit" ? "Single Exit Board" : "Board Design";
var resolveGameModeRulesLabel = (rulesVariant) => {
  switch (rulesVariant) {
    case "capture":
      return "Capture rules";
    case "no-capture":
      return "No-capture rules";
    default:
      return "Standard rules";
  }
};
var resolveGameModeSummary = (mode) => {
  const parts = [
    resolveGameModeBaseRulesetLabel(mode.baseRulesetPreset),
    `${mode.pieceCountPerSide} pieces`,
    resolveGameModeRulesLabel(mode.rulesVariant),
    mode.rosetteSafetyMode === "open" ? "open rosettes" : "protected rosettes",
    mode.eliminationMode === "eliminated" ? "elimination mode" : "return to start",
    mode.exitStyle === "single_exit" ? "single-exit board" : "standard exit",
    mode.fogOfWar ? "fog on" : "fog off",
    resolveGameModeBoardLabel(mode.boardAssetKey)
  ];
  return parts.join(" \xB7 ");
};
var toGameModeDefinition = (mode) => ({
  id: mode.id,
  name: mode.name,
  description: mode.description,
  baseRulesetPreset: mode.baseRulesetPreset,
  pieceCountPerSide: mode.pieceCountPerSide,
  rulesVariant: mode.rulesVariant,
  rosetteSafetyMode: mode.rosetteSafetyMode,
  exitStyle: mode.exitStyle,
  eliminationMode: mode.eliminationMode,
  fogOfWar: mode.fogOfWar,
  boardAssetKey: mode.boardAssetKey
});
var buildGameModeMatchConfig = (mode, options = {}) => {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m;
  return {
    modeId: mode.id,
    displayName: (_a = options.displayName) != null ? _a : mode.name,
    baseRulesetPreset: mode.baseRulesetPreset,
    pieceCountPerSide: mode.pieceCountPerSide,
    rulesVariant: mode.rulesVariant,
    rosetteSafetyMode: mode.rosetteSafetyMode,
    exitStyle: mode.exitStyle,
    eliminationMode: mode.eliminationMode,
    fogOfWar: mode.fogOfWar,
    boardAssetKey: mode.boardAssetKey,
    allowsXp: (_b = options.allowsXp) != null ? _b : false,
    allowsChallenges: (_c = options.allowsChallenges) != null ? _c : false,
    allowsOnline: (_d = options.allowsOnline) != null ? _d : false,
    allowsRankedStats: (_e = options.allowsRankedStats) != null ? _e : false,
    allowsCoins: (_f = options.allowsCoins) != null ? _f : false,
    isPracticeMode: (_g = options.isPracticeMode) != null ? _g : true,
    offlineWinRewardSource: (_h = options.offlineWinRewardSource) != null ? _h : "practice_finkel_rules_win",
    opponentType: (_i = options.opponentType) != null ? _i : "bot",
    pathVariant: (_j = options.pathVariant) != null ? _j : getGameModePresetDefaults(mode.baseRulesetPreset).pathVariant,
    throwProfile: (_k = options.throwProfile) != null ? _k : getGameModePresetDefaults(mode.baseRulesetPreset).throwProfile,
    bonusTurnOnRosette: (_l = options.bonusTurnOnRosette) != null ? _l : getGameModePresetDefaults(mode.baseRulesetPreset).bonusTurnOnRosette,
    bonusTurnOnCapture: (_m = options.bonusTurnOnCapture) != null ? _m : getGameModePresetDefaults(mode.baseRulesetPreset).bonusTurnOnCapture,
    selectionSubtitle: resolveGameModeSummary(mode),
    rulesIntro: null
  };
};
var isGameModeDefinition = (value) => {
  const record = typeof value === "object" && value !== null ? value : null;
  const pieceCountPerSide = record == null ? void 0 : record.pieceCountPerSide;
  return Boolean(
    record && typeof record.id === "string" && typeof record.name === "string" && typeof record.description === "string" && typeof record.baseRulesetPreset === "string" && GAME_MODE_BASE_RULESET_PRESET_SET.has(record.baseRulesetPreset) && typeof pieceCountPerSide === "number" && Number.isInteger(pieceCountPerSide) && pieceCountPerSide > 0 && typeof record.rulesVariant === "string" && GAME_MODE_RULE_VARIANT_SET.has(record.rulesVariant) && typeof record.rosetteSafetyMode === "string" && GAME_MODE_ROSETTE_SAFETY_MODE_SET.has(record.rosetteSafetyMode) && typeof record.exitStyle === "string" && GAME_MODE_EXIT_STYLE_SET.has(record.exitStyle) && typeof record.eliminationMode === "string" && GAME_MODE_ELIMINATION_MODE_SET.has(record.eliminationMode) && typeof record.fogOfWar === "boolean" && typeof record.boardAssetKey === "string" && GAME_MODE_BOARD_ASSET_KEY_SET.has(record.boardAssetKey)
  );
};

// backend/modules/gameModes.ts
var GAME_MODE_COLLECTION = "game_modes";
var GAME_MODE_KEY = "catalog";
var RPC_GET_GAME_MODES = "get_game_modes";
var RPC_ADMIN_LIST_GAME_MODES = "admin_list_game_modes";
var RPC_ADMIN_GET_GAME_MODE = "admin_get_game_mode";
var RPC_ADMIN_UPSERT_GAME_MODE = "admin_upsert_game_mode";
var RPC_ADMIN_DISABLE_GAME_MODE = "admin_disable_game_mode";
var RPC_ADMIN_ENABLE_GAME_MODE = "admin_enable_game_mode";
var RPC_ADMIN_DELETE_GAME_MODE = "admin_delete_game_mode";
var RPC_ADMIN_FEATURE_GAME_MODE = "admin_feature_game_mode";
var RPC_ADMIN_UNFEATURE_GAME_MODE = "admin_unfeature_game_mode";
var VALID_BOARD_ASSET_KEYS = ["board_design", "board_single_exit"];
var isVersionConflict3 = (error) => {
  const message = getErrorMessage2(error).toLowerCase();
  return message.includes("version check") || message.includes("version conflict") || message.includes("version mismatch") || message.includes("storage write rejected");
};
var parseJsonPayload4 = (payload) => {
  let parsed;
  try {
    parsed = payload ? JSON.parse(payload) : {};
  } catch (e) {
    throw new Error("INVALID_PAYLOAD");
  }
  const record = asRecord2(parsed);
  if (!record) {
    throw new Error("INVALID_PAYLOAD");
  }
  return record;
};
var readStringField11 = (value, keys) => {
  const record = asRecord2(value);
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
var readBooleanField5 = (value, keys) => {
  const record = asRecord2(value);
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
var readNumberField7 = (value, keys) => {
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
var isValidBoardAssetKey = (value) => VALID_BOARD_ASSET_KEYS.includes(value);
var normalizeAdminGameMode = (value) => {
  const record = asRecord2(value);
  if (!record) {
    return null;
  }
  const id = readStringField11(record, ["id"]);
  const name = readStringField11(record, ["name"]);
  const description = readStringField11(record, ["description"]);
  const baseRulesetPreset = readStringField11(record, ["baseRulesetPreset", "base_ruleset_preset"]);
  const pieceCountPerSide = readNumberField7(record, ["pieceCountPerSide", "piece_count_per_side"]);
  const rulesVariant = readStringField11(record, ["rulesVariant", "rules_variant"]);
  const rosetteSafetyMode = readStringField11(record, ["rosetteSafetyMode", "rosette_safety_mode"]);
  const exitStyle = readStringField11(record, ["exitStyle", "exit_style"]);
  const eliminationMode = readStringField11(record, ["eliminationMode", "elimination_mode"]);
  const fogOfWar = readBooleanField5(record, ["fogOfWar", "fog_of_war"]);
  const boardAssetKey = readStringField11(record, ["boardAssetKey", "board_asset_key"]);
  const isActive = readBooleanField5(record, ["isActive", "is_active"]);
  const featured = readBooleanField5(record, ["featured"]);
  const createdAt = readStringField11(record, ["createdAt", "created_at"]);
  const updatedAt = readStringField11(record, ["updatedAt", "updated_at"]);
  if (!id || !name || !description || !baseRulesetPreset || !isLegacyGameModeBaseRulesetPreset(baseRulesetPreset) && !(baseRulesetPreset in GAME_MODE_PRESET_BY_ID) || typeof pieceCountPerSide !== "number" || !Number.isInteger(pieceCountPerSide) || pieceCountPerSide <= 0 || !rulesVariant || !rosetteSafetyMode || !exitStyle || !eliminationMode || typeof fogOfWar !== "boolean" || !boardAssetKey || !isValidBoardAssetKey(boardAssetKey) || typeof isActive !== "boolean" || typeof featured !== "boolean" || !createdAt || !updatedAt || isMatchModeId(id)) {
    return null;
  }
  const mode = {
    id,
    name,
    description,
    baseRulesetPreset: normalizeGameModeBaseRulesetPreset(baseRulesetPreset),
    pieceCountPerSide,
    rulesVariant,
    rosetteSafetyMode,
    exitStyle,
    eliminationMode,
    fogOfWar,
    boardAssetKey,
    isActive,
    featured,
    createdAt,
    updatedAt
  };
  return isGameModeDefinition(toGameModeDefinition(mode)) ? mode : null;
};
var normalizeCatalogRecord = (value) => {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i;
  const record = asRecord2(value);
  const rawModes = Array.isArray(record == null ? void 0 : record.modes) ? record.modes : Array.isArray(record == null ? void 0 : record.items) ? record.items : [];
  const modesById = /* @__PURE__ */ new Map();
  rawModes.forEach((item) => {
    const mode = normalizeAdminGameMode(item);
    if (mode) {
      modesById.set(mode.id, mode);
    }
  });
  if (!record && modesById.size === 0) {
    return null;
  }
  const featuredModeId = readStringField11(record, ["featuredModeId", "featured_mode_id"]);
  const fallbackFeaturedModeId = (_h = (_g = (_e = (_c = (_a = Array.from(modesById.values()).find((mode) => mode.featured && mode.isActive)) == null ? void 0 : _a.id) != null ? _c : (_b = Array.from(modesById.values()).find((mode) => mode.featured)) == null ? void 0 : _b.id) != null ? _e : (_d = Array.from(modesById.values()).find((mode) => mode.isActive)) == null ? void 0 : _d.id) != null ? _g : (_f = Array.from(modesById.values())[0]) == null ? void 0 : _f.id) != null ? _h : null;
  const resolvedFeaturedModeId = featuredModeId && modesById.has(featuredModeId) ? featuredModeId : fallbackFeaturedModeId;
  const modes = Array.from(modesById.values()).map((mode) => __spreadProps(__spreadValues({}, mode), {
    featured: mode.id === resolvedFeaturedModeId
  }));
  return {
    modes,
    featuredModeId: resolvedFeaturedModeId,
    updatedAt: (_i = readStringField11(record, ["updatedAt", "updated_at"])) != null ? _i : (/* @__PURE__ */ new Date()).toISOString()
  };
};
var ensureFeaturedMode = (catalog) => {
  var _a, _b;
  if (catalog.modes.length === 0) {
    return __spreadProps(__spreadValues({}, catalog), {
      featuredModeId: null,
      modes: []
    });
  }
  const featuredModeId = catalog.featuredModeId && catalog.modes.some((mode) => mode.id === catalog.featuredModeId) ? catalog.featuredModeId : (_b = (_a = catalog.modes.find((mode) => mode.isActive)) == null ? void 0 : _a.id) != null ? _b : catalog.modes[0].id;
  return __spreadProps(__spreadValues({}, catalog), {
    featuredModeId,
    modes: catalog.modes.map((mode) => __spreadProps(__spreadValues({}, mode), {
      featured: mode.id === featuredModeId
    }))
  });
};
var readCatalogObject = (nk) => {
  const objects = nk.storageRead([
    {
      collection: GAME_MODE_COLLECTION,
      key: GAME_MODE_KEY,
      userId: GLOBAL_STORAGE_USER_ID
    }
  ]);
  const object = findStorageObject(objects, GAME_MODE_COLLECTION, GAME_MODE_KEY, GLOBAL_STORAGE_USER_ID);
  return {
    object,
    catalog: normalizeCatalogRecord(getStorageObjectValue(object))
  };
};
var writeCatalog = (nk, catalog, version) => {
  nk.storageWrite([
    maybeSetStorageVersion(
      {
        collection: GAME_MODE_COLLECTION,
        key: GAME_MODE_KEY,
        userId: GLOBAL_STORAGE_USER_ID,
        value: ensureFeaturedMode(catalog),
        permissionRead: STORAGE_PERMISSION_NONE2,
        permissionWrite: STORAGE_PERMISSION_NONE2
      },
      version
    )
  ]);
};
var updateCatalogWithRetry = (nk, logger, update) => {
  var _a;
  for (let attempt = 1; attempt <= MAX_WRITE_ATTEMPTS; attempt += 1) {
    const { object, catalog } = readCatalogObject(nk);
    const currentCatalog = catalog != null ? catalog : {
      modes: [],
      featuredModeId: null,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    const nextCatalog = ensureFeaturedMode(
      update(__spreadProps(__spreadValues({}, currentCatalog), {
        modes: currentCatalog.modes.map((mode) => __spreadValues({}, mode))
      }))
    );
    try {
      writeCatalog(nk, nextCatalog, object ? (_a = getStorageObjectVersion(object)) != null ? _a : "" : "*");
      return nextCatalog;
    } catch (error) {
      if (!isVersionConflict3(error) || attempt === MAX_WRITE_ATTEMPTS) {
        logger.error("Failed to write game mode catalog: %s", getErrorMessage2(error));
        throw error;
      }
    }
  }
  throw new Error("GAME_MODE_CATALOG_WRITE_FAILED");
};
var updateModeWithRetry = (nk, logger, modeId, update) => {
  var _a;
  let result = null;
  const catalog = updateCatalogWithRetry(nk, logger, (currentCatalog) => {
    var _a2, _b;
    const currentMode = (_a2 = currentCatalog.modes.find((mode) => mode.id === modeId)) != null ? _a2 : null;
    const nextCatalog = update(currentMode, currentCatalog);
    result = {
      catalog: nextCatalog,
      mode: (_b = nextCatalog.modes.find((mode) => mode.id === modeId)) != null ? _b : null
    };
    return nextCatalog;
  });
  return result != null ? result : {
    catalog,
    mode: (_a = catalog.modes.find((mode) => mode.id === modeId)) != null ? _a : null
  };
};
var normalizeDraft = (value) => {
  var _a;
  const record = asRecord2(value);
  if (!record) {
    throw new Error("INVALID_PAYLOAD");
  }
  const source = (_a = asRecord2(record.mode)) != null ? _a : record;
  const id = readStringField11(source, ["id"]);
  const name = readStringField11(source, ["name"]);
  const description = readStringField11(source, ["description"]);
  const baseRulesetPreset = readStringField11(source, ["baseRulesetPreset", "base_ruleset_preset"]);
  const pieceCountPerSide = readNumberField7(source, ["pieceCountPerSide", "piece_count_per_side"]);
  const rulesVariant = readStringField11(source, ["rulesVariant", "rules_variant"]);
  const rosetteSafetyMode = readStringField11(source, ["rosetteSafetyMode", "rosette_safety_mode"]);
  const exitStyle = readStringField11(source, ["exitStyle", "exit_style"]);
  const eliminationMode = readStringField11(source, ["eliminationMode", "elimination_mode"]);
  const fogOfWar = readBooleanField5(source, ["fogOfWar", "fog_of_war"]);
  const boardAssetKey = readStringField11(source, ["boardAssetKey", "board_asset_key"]);
  const isActive = readBooleanField5(source, ["isActive", "is_active"]);
  const draftCandidate = {
    id,
    name,
    description,
    baseRulesetPreset: normalizeGameModeBaseRulesetPreset(baseRulesetPreset),
    pieceCountPerSide,
    rulesVariant,
    rosetteSafetyMode,
    exitStyle,
    eliminationMode,
    fogOfWar,
    boardAssetKey
  };
  if (!id || !name || !description || !baseRulesetPreset || !isLegacyGameModeBaseRulesetPreset(baseRulesetPreset) && !(baseRulesetPreset in GAME_MODE_PRESET_BY_ID) || typeof pieceCountPerSide !== "number" || !Number.isInteger(pieceCountPerSide) || pieceCountPerSide <= 0 || !rulesVariant || !rosetteSafetyMode || !exitStyle || !eliminationMode || typeof fogOfWar !== "boolean" || !boardAssetKey || !isValidBoardAssetKey(boardAssetKey) || typeof isActive !== "boolean" || isMatchModeId(id)) {
    throw new Error("INVALID_PAYLOAD");
  }
  if (!isGameModeDefinition(draftCandidate)) {
    throw new Error("INVALID_PAYLOAD");
  }
  return __spreadProps(__spreadValues({}, draftCandidate), {
    isActive
  });
};
var parseModeIdRequest = (payload) => {
  const record = parseJsonPayload4(payload);
  const modeId = readStringField11(record, ["modeId", "mode_id", "id"]);
  if (!modeId) {
    throw new Error("INVALID_PAYLOAD");
  }
  return { modeId };
};
var buildGameModeResponse = (mode) => ({
  success: true,
  mode
});
var buildToggleResponse = (modeId) => ({
  success: true,
  modeId
});
var buildDeleteResponse = (modeId) => ({
  success: true,
  modeId
});
var buildFeatureResponse = (featuredModeId) => ({
  success: true,
  featuredModeId
});
var requireAdminRole2 = (ctx, nk, role = "viewer") => assertAdmin(ctx, role, nk);
var loadGameModeCatalog = (nk) => {
  const { catalog } = readCatalogObject(nk);
  return ensureFeaturedMode(
    catalog != null ? catalog : {
      modes: [],
      featuredModeId: null,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    }
  );
};
var listGameModes = (nk) => {
  const catalog = loadGameModeCatalog(nk);
  return {
    featuredModeId: catalog.featuredModeId,
    modes: catalog.modes
  };
};
var getPublicGameModes = (nk) => {
  var _a;
  const catalog = loadGameModeCatalog(nk);
  const activeModes = catalog.modes.filter((mode) => mode.isActive).map(toGameModeDefinition);
  const featuredMode = (_a = catalog.modes.find((mode) => mode.id === catalog.featuredModeId)) != null ? _a : null;
  return {
    featuredMode: featuredMode ? toGameModeDefinition(featuredMode) : null,
    activeModes
  };
};
var getGameModeById = (nk, modeId) => {
  var _a;
  return (_a = loadGameModeCatalog(nk).modes.find((mode) => mode.id === modeId)) != null ? _a : null;
};
var rpcGetGameModes = (ctx, _logger, nk, _payload) => {
  if (!ctx.userId) {
    throw new Error("Authentication required.");
  }
  return JSON.stringify(getPublicGameModes(nk));
};
var rpcAdminListGameModes = (ctx, _logger, nk, _payload) => {
  requireAdminRole2(ctx, nk, "viewer");
  return JSON.stringify(listGameModes(nk));
};
var rpcAdminGetGameMode = (ctx, _logger, nk, payload) => {
  requireAdminRole2(ctx, nk, "viewer");
  const { modeId } = parseModeIdRequest(payload);
  const mode = getGameModeById(nk, modeId);
  if (!mode) {
    throw new Error("MODE_NOT_FOUND");
  }
  return JSON.stringify(buildGameModeResponse(mode));
};
var rpcAdminUpsertGameMode = (ctx, logger, nk, payload) => {
  var _a;
  requireAdminRole2(ctx, nk, "operator");
  const record = parseJsonPayload4(payload);
  const mode = normalizeDraft((_a = record.mode) != null ? _a : record);
  const result = updateModeWithRetry(nk, logger, mode.id, (currentMode, catalog) => {
    var _a2;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const nextMode = __spreadProps(__spreadValues(__spreadValues({}, currentMode != null ? currentMode : __spreadProps(__spreadValues({}, mode), {
      featured: false,
      createdAt: now
    })), mode), {
      featured: catalog.featuredModeId === mode.id || (currentMode == null ? void 0 : currentMode.featured) === true,
      createdAt: (_a2 = currentMode == null ? void 0 : currentMode.createdAt) != null ? _a2 : now,
      updatedAt: now
    });
    const modes = currentMode ? catalog.modes.map((item) => item.id === mode.id ? nextMode : item) : [...catalog.modes, nextMode];
    return __spreadProps(__spreadValues({}, catalog), {
      modes,
      updatedAt: now
    });
  });
  if (!result.mode) {
    throw new Error("GAME_MODE_WRITE_FAILED");
  }
  return JSON.stringify(buildGameModeResponse(result.mode));
};
var rpcAdminDisableGameMode = (ctx, logger, nk, payload) => {
  requireAdminRole2(ctx, nk, "operator");
  const { modeId } = parseModeIdRequest(payload);
  const result = updateModeWithRetry(nk, logger, modeId, (currentMode, catalog) => {
    if (!currentMode) {
      throw new Error("MODE_NOT_FOUND");
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const nextMode = __spreadProps(__spreadValues({}, currentMode), {
      isActive: false,
      featured: catalog.featuredModeId === currentMode.id,
      updatedAt: now
    });
    return __spreadProps(__spreadValues({}, catalog), {
      modes: catalog.modes.map((mode) => mode.id === currentMode.id ? nextMode : mode),
      updatedAt: now
    });
  });
  if (!result.mode) {
    throw new Error("MODE_NOT_FOUND");
  }
  return JSON.stringify(buildToggleResponse(modeId));
};
var rpcAdminEnableGameMode = (ctx, logger, nk, payload) => {
  requireAdminRole2(ctx, nk, "operator");
  const { modeId } = parseModeIdRequest(payload);
  const result = updateModeWithRetry(nk, logger, modeId, (currentMode, catalog) => {
    if (!currentMode) {
      throw new Error("MODE_NOT_FOUND");
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const nextMode = __spreadProps(__spreadValues({}, currentMode), {
      isActive: true,
      featured: catalog.featuredModeId === currentMode.id,
      updatedAt: now
    });
    return __spreadProps(__spreadValues({}, catalog), {
      modes: catalog.modes.map((mode) => mode.id === currentMode.id ? nextMode : mode),
      updatedAt: now
    });
  });
  if (!result.mode) {
    throw new Error("MODE_NOT_FOUND");
  }
  return JSON.stringify(buildToggleResponse(modeId));
};
var rpcAdminDeleteGameMode = (ctx, logger, nk, payload) => {
  requireAdminRole2(ctx, nk, "operator");
  const { modeId } = parseModeIdRequest(payload);
  updateCatalogWithRetry(nk, logger, (catalog) => {
    const currentMode = catalog.modes.find((mode) => mode.id === modeId);
    if (!currentMode) {
      throw new Error("MODE_NOT_FOUND");
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    return __spreadProps(__spreadValues({}, catalog), {
      modes: catalog.modes.filter((mode) => mode.id !== modeId),
      updatedAt: now
    });
  });
  return JSON.stringify(buildDeleteResponse(modeId));
};
var rpcAdminFeatureGameMode = (ctx, logger, nk, payload) => {
  requireAdminRole2(ctx, nk, "operator");
  const { modeId } = parseModeIdRequest(payload);
  const result = updateModeWithRetry(nk, logger, modeId, (currentMode, catalog) => {
    if (!currentMode) {
      throw new Error("MODE_NOT_FOUND");
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const modes = catalog.modes.map((mode) => __spreadProps(__spreadValues({}, mode), {
      featured: mode.id === modeId,
      updatedAt: mode.id === modeId ? now : mode.updatedAt
    }));
    return __spreadProps(__spreadValues({}, catalog), {
      featuredModeId: modeId,
      modes,
      updatedAt: now
    });
  });
  if (!result.mode) {
    throw new Error("MODE_NOT_FOUND");
  }
  return JSON.stringify(buildFeatureResponse(modeId));
};
var rpcAdminUnfeatureGameMode = (ctx, logger, nk, payload) => {
  requireAdminRole2(ctx, nk, "operator");
  const { modeId } = parseModeIdRequest(payload);
  const result = updateModeWithRetry(nk, logger, modeId, (currentMode, catalog) => {
    var _a, _b;
    if (!currentMode) {
      throw new Error("MODE_NOT_FOUND");
    }
    const fallbackMode = (_b = (_a = catalog.modes.find((mode) => mode.id !== modeId && mode.isActive)) != null ? _a : catalog.modes.find((mode) => mode.id !== modeId)) != null ? _b : currentMode;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const modes = catalog.modes.map((mode) => __spreadProps(__spreadValues({}, mode), {
      featured: mode.id === fallbackMode.id,
      updatedAt: mode.id === fallbackMode.id ? now : mode.updatedAt
    }));
    return __spreadProps(__spreadValues({}, catalog), {
      featuredModeId: fallbackMode.id,
      modes,
      updatedAt: now
    });
  });
  if (!result.mode) {
    throw new Error("MODE_NOT_FOUND");
  }
  return JSON.stringify(buildFeatureResponse(result.catalog.featuredModeId));
};

// shared/urMatchProtocol.ts
var MatchOpCode = {
  ROLL_REQUEST: 1,
  MOVE_REQUEST: 2,
  EMOJI_REACTION: 3,
  PIECE_SELECTION: 4,
  REMATCH_RESPONSE: 5,
  STATE_SNAPSHOT: 100,
  SERVER_ERROR: 101,
  PROGRESSION_AWARD: 102,
  ELO_RATING_UPDATE: 103,
  TOURNAMENT_REWARD_SUMMARY: 104,
  REACTION_BROADCAST: 105,
  PIECE_SELECTION_BROADCAST: 106
};
var EMOJI_REACTION_KEYS = [
  "laughing",
  "cool",
  "fire",
  "omg",
  "skeleton",
  "sad",
  "hugging",
  "angry",
  "eyes",
  "question"
];
var MAX_EMOJI_REACTIONS_PER_MATCH = 10;
var isRecord3 = (value) => typeof value === "object" && value !== null;
var isEmojiReactionKey = (value) => typeof value === "string" && EMOJI_REACTION_KEYS.includes(value);
var isOptional = (value, guard) => typeof value === "undefined" || guard(value);
var isMoveAction = (value) => {
  if (!isRecord3(value)) {
    return false;
  }
  return typeof value.pieceId === "string" && typeof value.fromIndex === "number" && Number.isInteger(value.fromIndex) && typeof value.toIndex === "number" && Number.isInteger(value.toIndex);
};
var isRollRequestPayload = (value) => isRecord3(value) && value.type === "roll_request" && isOptional(value.autoTriggered, (candidate) => typeof candidate === "boolean");
var isMoveRequestPayload = (value) => isRecord3(value) && value.type === "move_request" && isMoveAction(value.move);
var isEmojiReactionRequestPayload = (value) => isRecord3(value) && value.type === "emoji_reaction" && isEmojiReactionKey(value.emoji);
var isPieceSelectionRequestPayload = (value) => isRecord3(value) && value.type === "piece_selection" && (typeof value.pieceId === "string" || value.pieceId === null);
var isRematchResponsePayload = (value) => isRecord3(value) && value.type === "rematch_response" && typeof value.accepted === "boolean";
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

// shared/feedback.ts
var FEEDBACK_TYPES = ["bug", "feature_request", "player_report"];
var FEEDBACK_SOURCE_PAGES = ["home", "play_online", "match"];
var FEEDBACK_TYPE_LABELS = {
  bug: "Bug",
  feature_request: "Feature request",
  player_report: "Player report"
};
var FEEDBACK_SUBMISSION_COLLECTION = "user_feedback_submissions";
var FEEDBACK_DEFAULT_LIST_LIMIT = 50;
var FEEDBACK_MAX_LIST_LIMIT = 100;

// backend/modules/feedback.ts
var RPC_SUBMIT_FEEDBACK = "submit_feedback";
var RPC_ADMIN_LIST_FEEDBACK = "admin_list_feedback";
var normalizeFeedbackType = (value) => typeof value === "string" && FEEDBACK_TYPES.includes(value) ? value : null;
var normalizeFeedbackSourcePage = (value) => typeof value === "string" && FEEDBACK_SOURCE_PAGES.includes(value) ? value : null;
var normalizeMatchContext = (value) => {
  const record = asRecord2(value);
  const matchId = readStringField9(record, ["matchId", "match_id"]);
  return matchId ? { matchId } : null;
};
var normalizeReportedUser = (value) => {
  const record = asRecord2(value);
  const userId = readStringField9(record, ["userId", "user_id"]);
  const username = readStringField9(record, ["username", "displayName", "display_name", "name"]);
  if (!userId || !username) {
    return null;
  }
  return {
    userId,
    username
  };
};
var normalizeSubmitterFromRecord = (value) => {
  const record = asRecord2(value);
  const userId = readStringField9(record, ["userId", "user_id"]);
  const username = readStringField9(record, ["username", "displayName", "display_name", "name"]);
  const provider = readStringField9(record, ["provider"]);
  const nakamaUserId = readStringField9(record, ["nakamaUserId", "nakama_user_id"]);
  if (!userId || !username) {
    return null;
  }
  return {
    userId,
    username,
    provider: provider != null ? provider : "unknown",
    nakamaUserId
  };
};
var normalizeSubmitterFromRequest = (ctx, payload) => {
  var _a, _b, _c;
  const ctxUserId = requireAuthenticatedUserId(ctx);
  const submitterRecord = asRecord2(payload.submitter);
  return {
    userId: (_a = readStringField9(submitterRecord, ["userId", "user_id"])) != null ? _a : ctxUserId,
    username: (_b = readStringField9(submitterRecord, ["username", "displayName", "display_name", "name"])) != null ? _b : getActorLabel(ctx),
    provider: (_c = readStringField9(submitterRecord, ["provider"])) != null ? _c : "unknown",
    nakamaUserId: ctxUserId
  };
};
var buildSubmissionId = () => `feedback-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
var buildStorageKey = (createdAt, submissionId) => {
  const reverseTimestamp = String(9999999999999 - Date.parse(createdAt)).padStart(13, "0");
  return `${reverseTimestamp}-${submissionId}`;
};
var normalizeStoredSubmission = (value) => {
  var _a, _b;
  const record = asRecord2(value);
  if (!record) {
    return null;
  }
  const id = readStringField9(record, ["id", "submissionId", "submission_id"]);
  const type = normalizeFeedbackType(readStringField9(record, ["type"]));
  const message = readStringField9(record, ["message", "body"]);
  const sourcePage = normalizeFeedbackSourcePage(readStringField9(record, ["sourcePage", "source_page"]));
  const createdAt = readStringField9(record, ["createdAt", "created_at"]);
  const submitter = normalizeSubmitterFromRecord(record.submitter);
  const matchContext = normalizeMatchContext((_a = record.matchContext) != null ? _a : record.match_context);
  const reportedUser = normalizeReportedUser((_b = record.reportedUser) != null ? _b : record.reported_user);
  if (!id || !type || !message || !sourcePage || !createdAt || !submitter) {
    return null;
  }
  return {
    id,
    type,
    message: message.trim(),
    sourcePage,
    submitter,
    matchContext,
    reportedUser,
    createdAt
  };
};
var normalizeStorageListResult2 = (value) => {
  const record = asRecord2(value);
  const objects = Array.isArray(record == null ? void 0 : record.objects) ? record.objects : [];
  const cursor = readStringField9(record, ["cursor", "nextCursor", "next_cursor"]);
  return {
    objects,
    cursor
  };
};
var normalizeSubmittedMessage = (payload) => {
  var _a;
  const message = (_a = readStringField9(payload, ["message", "body", "text"])) != null ? _a : "";
  if (!message) {
    throw new Error("Feedback message is required.");
  }
  return message;
};
var normalizeSubmissionPayload = (ctx, payload) => {
  const type = normalizeFeedbackType(readStringField9(payload, ["type", "feedbackType", "feedback_type"]));
  if (!type) {
    throw new Error(`Feedback category must be one of: ${FEEDBACK_TYPE_LABELS.bug}, ${FEEDBACK_TYPE_LABELS.feature_request}, or ${FEEDBACK_TYPE_LABELS.player_report}.`);
  }
  const sourcePage = normalizeFeedbackSourcePage(readStringField9(payload, ["sourcePage", "source_page"]));
  if (!sourcePage) {
    throw new Error("Feedback source page must be one of: home, play_online, or match.");
  }
  return {
    id: buildSubmissionId(),
    type,
    message: normalizeSubmittedMessage(payload),
    sourcePage,
    submitter: normalizeSubmitterFromRequest(ctx, payload),
    matchContext: normalizeMatchContext(payload.matchContext),
    reportedUser: normalizeReportedUser(payload.reportedUser),
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
};
function rpcSubmitFeedback(ctx, logger, nk, payload) {
  var _a;
  const request = parseJsonPayload2(payload);
  const submission = normalizeSubmissionPayload(ctx, request);
  const storageKey = buildStorageKey(submission.createdAt, submission.id);
  nk.storageWrite([
    {
      collection: FEEDBACK_SUBMISSION_COLLECTION,
      key: storageKey,
      userId: GLOBAL_STORAGE_USER_ID,
      value: submission,
      permissionRead: STORAGE_PERMISSION_NONE2,
      permissionWrite: STORAGE_PERMISSION_NONE2
    }
  ]);
  logger.info(
    "Stored feedback submission %s from %s on %s.",
    submission.id,
    (_a = submission.submitter.nakamaUserId) != null ? _a : submission.submitter.userId,
    submission.sourcePage
  );
  return JSON.stringify({ submission });
}
function rpcAdminListFeedback(ctx, logger, nk, payload) {
  assertAdmin(ctx, "viewer", nk);
  const request = parseJsonPayload2(payload);
  const requestedLimit = readNumberField6(request, ["limit"]);
  const limit = Math.max(
    1,
    Math.min(FEEDBACK_MAX_LIST_LIMIT, Math.floor(requestedLimit != null ? requestedLimit : FEEDBACK_DEFAULT_LIST_LIMIT))
  );
  const rawEntries = [];
  let cursor = "";
  for (let page = 0; page < 50; page += 1) {
    const rawResult = nk.storageList(GLOBAL_STORAGE_USER_ID, FEEDBACK_SUBMISSION_COLLECTION, FEEDBACK_MAX_LIST_LIMIT, cursor);
    const result = normalizeStorageListResult2(rawResult);
    rawEntries.push(...result.objects);
    if (!result.cursor) {
      break;
    }
    cursor = result.cursor;
  }
  const submissions = rawEntries.map((entry) => normalizeStoredSubmission(entry.value)).filter((entry) => Boolean(entry)).sort((left, right) => {
    const byCreatedAt = right.createdAt.localeCompare(left.createdAt);
    return byCreatedAt !== 0 ? byCreatedAt : right.id.localeCompare(left.id);
  }).slice(0, limit);
  logger.info("Loaded %d feedback submissions for admin review.", submissions.length);
  return JSON.stringify({ submissions });
}

// backend/modules/tournaments/bracket.ts
var normalizeParticipantState = (value) => {
  if (value === "lobby" || value === "in_match" || value === "waiting_next_round" || value === "eliminated" || value === "runner_up" || value === "champion") {
    return value;
  }
  return "lobby";
};
var normalizeEntryStatus = (value) => {
  if (value === "pending" || value === "ready" || value === "in_match" || value === "completed") {
    return value;
  }
  return "pending";
};
var sortRegistrations = (registrations) => registrations.slice().sort((left, right) => {
  if (left.seed !== right.seed) {
    return left.seed - right.seed;
  }
  const joinedCompare = left.joinedAt.localeCompare(right.joinedAt);
  if (joinedCompare !== 0) {
    return joinedCompare;
  }
  return left.userId.localeCompare(right.userId);
});
var normalizeTournamentRunRegistration = (value) => {
  const record = asRecord2(value);
  if (!record) {
    return null;
  }
  const userId = readStringField9(record, ["userId", "user_id"]);
  const displayName = readStringField9(record, ["displayName", "display_name"]);
  const joinedAt = readStringField9(record, ["joinedAt", "joined_at"]);
  const seed = readNumberField6(record, ["seed"]);
  if (!userId || !displayName || !joinedAt || typeof seed !== "number" || !Number.isFinite(seed)) {
    return null;
  }
  return {
    userId,
    displayName,
    joinedAt,
    seed: Math.max(1, Math.floor(seed))
  };
};
var normalizeTournamentBracketParticipant = (value) => {
  const record = asRecord2(value);
  if (!record) {
    return null;
  }
  const userId = readStringField9(record, ["userId", "user_id"]);
  const displayName = readStringField9(record, ["displayName", "display_name"]);
  const joinedAt = readStringField9(record, ["joinedAt", "joined_at"]);
  const updatedAt = readStringField9(record, ["updatedAt", "updated_at"]);
  const seed = readNumberField6(record, ["seed"]);
  if (!userId || !displayName || !joinedAt || !updatedAt || typeof seed !== "number" || !Number.isFinite(seed)) {
    return null;
  }
  return {
    userId,
    displayName,
    joinedAt,
    seed: Math.max(1, Math.floor(seed)),
    state: normalizeParticipantState(readStringField9(record, ["state"])),
    currentRound: (() => {
      const round = readNumberField6(record, ["currentRound", "current_round"]);
      return typeof round === "number" && Number.isFinite(round) ? Math.max(1, Math.floor(round)) : null;
    })(),
    currentEntryId: readStringField9(record, ["currentEntryId", "current_entry_id"]),
    activeMatchId: readStringField9(record, ["activeMatchId", "active_match_id"]),
    finalPlacement: (() => {
      const placement = readNumberField6(record, ["finalPlacement", "final_placement"]);
      return typeof placement === "number" && Number.isFinite(placement) ? Math.max(1, Math.floor(placement)) : null;
    })(),
    lastResult: (() => {
      const result = readStringField9(record, ["lastResult", "last_result"]);
      return result === "win" || result === "loss" ? result : null;
    })(),
    updatedAt
  };
};
var normalizeTournamentBracketEntry = (value) => {
  const record = asRecord2(value);
  if (!record) {
    return null;
  }
  const entryId = readStringField9(record, ["entryId", "entry_id"]);
  const round = readNumberField6(record, ["round"]);
  const slot = readNumberField6(record, ["slot"]);
  const createdAt = readStringField9(record, ["createdAt", "created_at"]);
  const updatedAt = readStringField9(record, ["updatedAt", "updated_at"]);
  const sourceEntryIds = Array.isArray(record.sourceEntryIds) ? record.sourceEntryIds.filter((entry) => typeof entry === "string" && entry.trim().length > 0) : [];
  if (!entryId || typeof round !== "number" || !Number.isFinite(round) || typeof slot !== "number" || !Number.isFinite(slot) || !createdAt || !updatedAt) {
    return null;
  }
  return {
    entryId,
    round: Math.max(1, Math.floor(round)),
    slot: Math.max(1, Math.floor(slot)),
    sourceEntryIds,
    playerAUserId: readStringField9(record, ["playerAUserId", "player_a_user_id"]),
    playerBUserId: readStringField9(record, ["playerBUserId", "player_b_user_id"]),
    matchId: readStringField9(record, ["matchId", "match_id"]),
    status: normalizeEntryStatus(readStringField9(record, ["status"])),
    winnerUserId: readStringField9(record, ["winnerUserId", "winner_user_id"]),
    loserUserId: readStringField9(record, ["loserUserId", "loser_user_id"]),
    createdAt,
    updatedAt,
    readyAt: readStringField9(record, ["readyAt", "ready_at"]),
    startedAt: readStringField9(record, ["startedAt", "started_at"]),
    completedAt: readStringField9(record, ["completedAt", "completed_at"])
  };
};
var normalizeTournamentBracketState = (value) => {
  const record = asRecord2(value);
  if (!record) {
    return null;
  }
  const startedAt = readStringField9(record, ["startedAt", "started_at"]);
  const lockedAt = readStringField9(record, ["lockedAt", "locked_at"]);
  const size = readNumberField6(record, ["size"]);
  const totalRounds = readNumberField6(record, ["totalRounds", "total_rounds"]);
  if (readStringField9(record, ["format"]) !== "single_elimination" || !startedAt || !lockedAt || typeof size !== "number" || !Number.isFinite(size) || typeof totalRounds !== "number" || !Number.isFinite(totalRounds)) {
    return null;
  }
  const participants = Array.isArray(record.participants) ? record.participants.map((entry) => normalizeTournamentBracketParticipant(entry)).filter((entry) => Boolean(entry)) : [];
  const entries = Array.isArray(record.entries) ? record.entries.map((entry) => normalizeTournamentBracketEntry(entry)).filter((entry) => Boolean(entry)) : [];
  return {
    format: "single_elimination",
    size: Math.max(2, Math.floor(size)),
    totalRounds: Math.max(1, Math.floor(totalRounds)),
    startedAt,
    lockedAt,
    finalizedAt: readStringField9(record, ["finalizedAt", "finalized_at"]),
    winnerUserId: readStringField9(record, ["winnerUserId", "winner_user_id"]),
    runnerUpUserId: readStringField9(record, ["runnerUpUserId", "runner_up_user_id"]),
    participants,
    entries
  };
};
var isPowerOfTwo = (value) => {
  if (!Number.isFinite(value)) {
    return false;
  }
  const normalized = Math.floor(value);
  return normalized >= 2 && (normalized & normalized - 1) === 0;
};
var assertPowerOfTwoTournamentSize = (value) => {
  if (!isPowerOfTwo(value)) {
    throw new Error("Single-elimination tournaments require a power-of-two maxSize.");
  }
};
var getSingleEliminationRoundCount = (value) => {
  assertPowerOfTwoTournamentSize(value);
  return Math.log2(Math.floor(value));
};
var getTournamentBracketEntryId = (round, slot) => `round-${round}-match-${slot}`;
var upsertTournamentRegistration = (registrations, userId, displayName, joinedAt) => {
  var _a;
  const existing = (_a = sortRegistrations(registrations).find((entry) => entry.userId === userId)) != null ? _a : null;
  if (existing) {
    const nextRegistration2 = __spreadProps(__spreadValues({}, existing), {
      displayName
    });
    return {
      registrations: sortRegistrations(
        registrations.map((entry) => entry.userId === userId ? nextRegistration2 : entry)
      ),
      registration: nextRegistration2,
      added: false
    };
  }
  const nextRegistration = {
    userId,
    displayName,
    joinedAt,
    seed: registrations.length + 1
  };
  return {
    registrations: sortRegistrations(registrations.concat(nextRegistration)),
    registration: nextRegistration,
    added: true
  };
};
var createSingleEliminationBracket = (registrations, startedAt) => {
  var _a, _b, _c, _d;
  const seededRegistrations = sortRegistrations(registrations);
  assertPowerOfTwoTournamentSize(seededRegistrations.length);
  const size = seededRegistrations.length;
  const totalRounds = Math.log2(size);
  let previousRoundEntries = [];
  const entries = [];
  for (let round = 1; round <= totalRounds; round += 1) {
    const roundEntries = [];
    const matchCount = size / 2 ** round;
    for (let slot = 1; slot <= matchCount; slot += 1) {
      const entryId = getTournamentBracketEntryId(round, slot);
      const sourceEntryIds = round === 1 ? [] : [
        previousRoundEntries[(slot - 1) * 2].entryId,
        previousRoundEntries[(slot - 1) * 2 + 1].entryId
      ];
      const playerAUserId = round === 1 ? (_b = (_a = seededRegistrations[(slot - 1) * 2]) == null ? void 0 : _a.userId) != null ? _b : null : null;
      const playerBUserId = round === 1 ? (_d = (_c = seededRegistrations[(slot - 1) * 2 + 1]) == null ? void 0 : _c.userId) != null ? _d : null : null;
      const ready = round === 1 && Boolean(playerAUserId) && Boolean(playerBUserId);
      roundEntries.push({
        entryId,
        round,
        slot,
        sourceEntryIds,
        playerAUserId,
        playerBUserId,
        matchId: null,
        status: ready ? "ready" : "pending",
        winnerUserId: null,
        loserUserId: null,
        createdAt: startedAt,
        updatedAt: startedAt,
        readyAt: ready ? startedAt : null,
        startedAt: null,
        completedAt: null
      });
    }
    entries.push(...roundEntries);
    previousRoundEntries = roundEntries;
  }
  const participants = seededRegistrations.map((registration, index) => ({
    userId: registration.userId,
    displayName: registration.displayName,
    joinedAt: registration.joinedAt,
    seed: registration.seed,
    state: "waiting_next_round",
    currentRound: 1,
    currentEntryId: getTournamentBracketEntryId(1, Math.floor(index / 2) + 1),
    activeMatchId: null,
    finalPlacement: null,
    lastResult: null,
    updatedAt: startedAt
  }));
  return {
    format: "single_elimination",
    size,
    totalRounds,
    startedAt,
    lockedAt: startedAt,
    finalizedAt: null,
    winnerUserId: null,
    runnerUpUserId: null,
    participants,
    entries
  };
};
var cloneBracket = (bracket) => __spreadProps(__spreadValues({}, bracket), {
  participants: bracket.participants.map((participant) => __spreadValues({}, participant)),
  entries: bracket.entries.map((entry) => __spreadProps(__spreadValues({}, entry), {
    sourceEntryIds: entry.sourceEntryIds.slice()
  }))
});
var getTournamentBracketParticipant = (bracket, userId) => {
  var _a;
  return (_a = bracket == null ? void 0 : bracket.participants.find((participant) => participant.userId === userId)) != null ? _a : null;
};
var getTournamentBracketEntry = (bracket, entryId) => {
  var _a;
  return (_a = bracket == null ? void 0 : bracket.entries.find((entry) => entry.entryId === entryId)) != null ? _a : null;
};
var getTournamentBracketEntryByMatchId = (bracket, matchId) => {
  var _a;
  return (_a = bracket == null ? void 0 : bracket.entries.find((entry) => entry.matchId === matchId)) != null ? _a : null;
};
var getTournamentBracketCurrentRound = (bracket) => {
  var _a;
  if (!bracket) {
    return null;
  }
  const activeEntry = bracket.entries.filter((entry) => entry.status !== "completed").sort((left, right) => {
    if (left.round !== right.round) {
      return left.round - right.round;
    }
    return left.slot - right.slot;
  })[0];
  return (_a = activeEntry == null ? void 0 : activeEntry.round) != null ? _a : null;
};
var startTournamentBracketMatch = (bracket, userId, matchId, startedAt) => {
  var _a;
  const nextBracket = cloneBracket(bracket);
  const participantIndex = nextBracket.participants.findIndex((participant2) => participant2.userId === userId);
  if (participantIndex < 0) {
    throw new Error("Tournament participant was not found.");
  }
  const participant = nextBracket.participants[participantIndex];
  if (!participant.currentEntryId) {
    throw new Error("Tournament participant does not have an active bracket entry.");
  }
  const entryIndex = nextBracket.entries.findIndex((entry2) => entry2.entryId === participant.currentEntryId);
  if (entryIndex < 0) {
    throw new Error(`Tournament bracket entry '${participant.currentEntryId}' was not found.`);
  }
  const entry = nextBracket.entries[entryIndex];
  if (entry.playerAUserId !== userId && entry.playerBUserId !== userId) {
    throw new Error("Tournament participant is not assigned to this bracket entry.");
  }
  if (!entry.playerAUserId || !entry.playerBUserId) {
    throw new Error("The next tournament match is not ready yet.");
  }
  entry.matchId = matchId;
  entry.status = "in_match";
  entry.startedAt = (_a = entry.startedAt) != null ? _a : startedAt;
  entry.updatedAt = startedAt;
  nextBracket.participants.forEach((candidate) => {
    if (candidate.userId === entry.playerAUserId || candidate.userId === entry.playerBUserId) {
      candidate.state = "in_match";
      candidate.currentRound = entry.round;
      candidate.currentEntryId = entry.entryId;
      candidate.activeMatchId = matchId;
      candidate.updatedAt = startedAt;
    }
  });
  return nextBracket;
};
var calculateTournamentPlacement = (bracketSize, round) => Math.floor(bracketSize / 2 ** round) + 1;
var completeTournamentBracketMatch = (bracket, params) => {
  var _a, _b, _c;
  const nextBracket = cloneBracket(bracket);
  const entryIndex = nextBracket.entries.findIndex(
    (entry2) => params.entryId ? entry2.entryId === params.entryId : entry2.matchId === params.matchId
  );
  if (entryIndex < 0) {
    throw new Error("Tournament bracket entry was not found for the completed match.");
  }
  const entry = nextBracket.entries[entryIndex];
  if (entry.playerAUserId !== params.winnerUserId && entry.playerBUserId !== params.winnerUserId) {
    throw new Error("Winner is not assigned to the completed tournament bracket entry.");
  }
  if (entry.playerAUserId !== params.loserUserId && entry.playerBUserId !== params.loserUserId) {
    throw new Error("Loser is not assigned to the completed tournament bracket entry.");
  }
  entry.matchId = (_a = entry.matchId) != null ? _a : params.matchId;
  entry.status = "completed";
  entry.winnerUserId = params.winnerUserId;
  entry.loserUserId = params.loserUserId;
  entry.completedAt = params.completedAt;
  entry.updatedAt = params.completedAt;
  entry.startedAt = (_b = entry.startedAt) != null ? _b : params.completedAt;
  const winner = getTournamentBracketParticipant(nextBracket, params.winnerUserId);
  const loser = getTournamentBracketParticipant(nextBracket, params.loserUserId);
  if (!winner || !loser) {
    throw new Error("Tournament bracket participants were not found for the completed match.");
  }
  loser.state = entry.round === nextBracket.totalRounds ? "runner_up" : "eliminated";
  loser.currentRound = entry.round;
  loser.currentEntryId = entry.entryId;
  loser.activeMatchId = null;
  loser.finalPlacement = calculateTournamentPlacement(nextBracket.size, entry.round);
  loser.lastResult = "loss";
  loser.updatedAt = params.completedAt;
  if (entry.round === nextBracket.totalRounds) {
    winner.state = "champion";
    winner.currentRound = entry.round;
    winner.currentEntryId = entry.entryId;
    winner.activeMatchId = null;
    winner.finalPlacement = 1;
    winner.lastResult = "win";
    winner.updatedAt = params.completedAt;
    nextBracket.winnerUserId = winner.userId;
    nextBracket.runnerUpUserId = loser.userId;
    nextBracket.finalizedAt = params.completedAt;
    return nextBracket;
  }
  const nextEntry = nextBracket.entries.find((candidate) => candidate.sourceEntryIds.includes(entry.entryId));
  if (!nextEntry) {
    throw new Error("The next tournament bracket entry could not be resolved.");
  }
  if (nextEntry.sourceEntryIds[0] === entry.entryId) {
    nextEntry.playerAUserId = winner.userId;
  } else if (nextEntry.sourceEntryIds[1] === entry.entryId) {
    nextEntry.playerBUserId = winner.userId;
  }
  if (nextEntry.playerAUserId && nextEntry.playerBUserId) {
    nextEntry.status = nextEntry.status === "completed" ? "completed" : "ready";
    nextEntry.readyAt = (_c = nextEntry.readyAt) != null ? _c : params.completedAt;
  }
  nextEntry.updatedAt = params.completedAt;
  winner.state = "waiting_next_round";
  winner.currentRound = nextEntry.round;
  winner.currentEntryId = nextEntry.entryId;
  winner.activeMatchId = null;
  winner.finalPlacement = null;
  winner.lastResult = "win";
  winner.updatedAt = params.completedAt;
  return nextBracket;
};
var hasTournamentBracketStarted = (bracket) => Boolean(bracket == null ? void 0 : bracket.startedAt);

// shared/tournamentFees.ts
var FREE_FEE_LABELS = /* @__PURE__ */ new Set(["free", "none", "no fee", "free entry"]);
var normalizeFeeText = (value) => {
  if (typeof value !== "string") {
    return null;
  }
  const normalized = value.trim().toLowerCase().replace(/,/g, "");
  return normalized.length > 0 ? normalized : null;
};
var parseFeeAmount = (value) => {
  const match = value.match(/(\d+(?:\.\d+)?)/);
  if (!match) {
    return null;
  }
  const parsed = Number(match[1]);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }
  return Math.floor(parsed);
};
var parseTournamentEntryFee = (value) => {
  const normalized = normalizeFeeText(value);
  if (!normalized || FREE_FEE_LABELS.has(normalized)) {
    return null;
  }
  const amount = parseFeeAmount(normalized);
  if (!amount) {
    return null;
  }
  if (normalized.includes("gem") || normalized.includes("premium") || normalized.startsWith("$") || normalized.startsWith("usd ")) {
    return { amount, currency: "premium" };
  }
  if (normalized.includes("coin") || normalized.includes("soft")) {
    return { amount, currency: "soft" };
  }
  return { amount, currency: "soft" };
};
var formatTournamentEntryFee = (value) => {
  const parsed = parseTournamentEntryFee(value);
  if (!parsed) {
    return "Free";
  }
  return `${parsed.amount} ${parsed.currency === "soft" ? "coins" : "gems"}`;
};

// shared/tournamentBots.ts
var TOURNAMENT_BOT_USER_ID_PREFIX = "tournament-bot:";
var asRecord7 = (value) => typeof value === "object" && value !== null ? value : null;
var readBooleanField6 = (value, keys) => {
  const record = asRecord7(value);
  if (!record) {
    return null;
  }
  for (const key of keys) {
    if (typeof record[key] === "boolean") {
      return record[key];
    }
  }
  return null;
};
var readStringField12 = (value, keys) => {
  const record = asRecord7(value);
  if (!record) {
    return null;
  }
  for (const key of keys) {
    const candidate = record[key];
    if (typeof candidate === "string" && candidate.trim().length > 0) {
      return candidate.trim();
    }
  }
  return null;
};
var parseBotSlot = (userId) => {
  if (!isTournamentBotUserId(userId)) {
    return null;
  }
  const parts = userId.split(":");
  const parsed = Number(parts[parts.length - 1]);
  return Number.isFinite(parsed) ? Math.max(1, Math.floor(parsed)) : null;
};
var isTournamentBotUserId = (value) => typeof value === "string" && value.startsWith(TOURNAMENT_BOT_USER_ID_PREFIX);
var buildTournamentBotUserId = (runId, slot) => `${TOURNAMENT_BOT_USER_ID_PREFIX}${runId}:${Math.max(1, Math.floor(slot))}`;
var formatBotDifficultyLabel = (difficulty) => `${difficulty.slice(0, 1).toUpperCase()}${difficulty.slice(1)}`;
var buildTournamentBotDisplayName = (difficulty, ordinal) => `${formatBotDifficultyLabel(difficulty)} Bot ${Math.max(1, Math.floor(ordinal))}`;
var normalizeTournamentBotPolicy = (metadata) => {
  var _a;
  const autoAdd = (_a = readBooleanField6(metadata, ["autoAddBots", "auto_add_bots"])) != null ? _a : false;
  const requestedDifficulty = readStringField12(metadata, ["botDifficulty", "bot_difficulty"]);
  const difficulty = requestedDifficulty && isBotDifficulty(requestedDifficulty) ? requestedDifficulty : null;
  if (!autoAdd) {
    return {
      autoAdd: false,
      difficulty: null
    };
  }
  return {
    autoAdd: true,
    difficulty: difficulty != null ? difficulty : DEFAULT_BOT_DIFFICULTY
  };
};
var buildTournamentBotDisplayNames = (userIds, difficulty) => {
  const resolvedDifficulty = difficulty != null ? difficulty : DEFAULT_BOT_DIFFICULTY;
  const uniqueIds = Array.from(new Set(userIds.filter(isTournamentBotUserId)));
  uniqueIds.sort((left, right) => {
    var _a, _b;
    const leftSlot = (_a = parseBotSlot(left)) != null ? _a : Number.MAX_SAFE_INTEGER;
    const rightSlot = (_b = parseBotSlot(right)) != null ? _b : Number.MAX_SAFE_INTEGER;
    if (leftSlot !== rightSlot) {
      return leftSlot - rightSlot;
    }
    return left.localeCompare(right);
  });
  return uniqueIds.reduce((accumulator, userId, index) => {
    accumulator[userId] = buildTournamentBotDisplayName(resolvedDifficulty, index + 1);
    return accumulator;
  }, {});
};
var countTournamentBotEntrants = (userIds) => Object.keys(buildTournamentBotDisplayNames(userIds, null)).length;
var buildTournamentBotSummary = (metadata, userIds) => {
  const policy = normalizeTournamentBotPolicy(metadata);
  return __spreadProps(__spreadValues({}, policy), {
    count: countTournamentBotEntrants(userIds)
  });
};

// shared/tournamentLobby.ts
var TOURNAMENT_LOBBY_FILL_COUNTDOWN_SECONDS = 180;
var TOURNAMENT_LOBBY_FILL_COUNTDOWN_MS = TOURNAMENT_LOBBY_FILL_COUNTDOWN_SECONDS * 1e3;
var parseIsoMs = (value) => {
  if (!value) {
    return null;
  }
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
};
var getTournamentLobbyDeadlineMs = (openedAt) => {
  const openedAtMs = parseIsoMs(openedAt);
  if (openedAtMs === null) {
    return null;
  }
  return openedAtMs + TOURNAMENT_LOBBY_FILL_COUNTDOWN_MS;
};
var getTournamentLobbyDeadlineAt = (openedAt) => {
  const deadlineMs = getTournamentLobbyDeadlineMs(openedAt);
  return deadlineMs === null ? null : new Date(deadlineMs).toISOString();
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
var AUTO_TOURNAMENT_DURATION_SECONDS = 18e3;
var DEFAULT_DURATION_SECONDS = AUTO_TOURNAMENT_DURATION_SECONDS;
var DEFAULT_MAX_SIZE = 1024;
var DEFAULT_STANDINGS_LIMIT = 100;
var MAX_STANDINGS_LIMIT = 1e4;
var MAX_RUN_LIST_LIMIT = 100;
var SYSTEM_USER_ID4 = "00000000-0000-0000-0000-000000000000";
var TOURNAMENT_RUN_MEMBERSHIPS_COLLECTION = "tournament_run_memberships";
var TOURNAMENT_MATCH_RESULTS_COLLECTION = "tournament_match_results";
var readBooleanField7 = (value, keys) => {
  const record = asRecord2(value);
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
  const record = asRecord2(value);
  if (!record) {
    return {};
  }
  for (const key of keys) {
    const field = asRecord2(record[key]);
    if (field) {
      return field;
    }
  }
  return {};
};
var readStringArrayField2 = (value, keys) => {
  const record = asRecord2(value);
  if (!record) {
    return [];
  }
  for (const key of keys) {
    const field = record[key];
    if (!Array.isArray(field)) {
      continue;
    }
    return field.filter((entry) => typeof entry === "string" && entry.trim().length > 0);
  }
  return [];
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
  const record = asRecord2(value);
  if (!record) {
    return null;
  }
  const rawRecords = Array.isArray(record.records) ? record.records : [];
  return {
    generatedAt: (_a = readStringField9(record, ["generatedAt", "generated_at"])) != null ? _a : (/* @__PURE__ */ new Date(0)).toISOString(),
    overrideExpiry: clampInteger(readNumberField6(record, ["overrideExpiry", "override_expiry"]), 0, 0, 2147483647),
    rankCount: (() => {
      const rankCount = readNumberField6(record, ["rankCount", "rank_count"]);
      return typeof rankCount === "number" ? rankCount : null;
    })(),
    records: rawRecords.map((entry) => {
      var _a2;
      return (_a2 = asRecord2(entry)) != null ? _a2 : {};
    }),
    prevCursor: readStringField9(record, ["prevCursor", "prev_cursor"]),
    nextCursor: readStringField9(record, ["nextCursor", "next_cursor"])
  };
};
var normalizeRunRecord = (value, fallbackId) => {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k;
  const record = asRecord2(value);
  if (!record) {
    return null;
  }
  const runId = (_b = (_a = readStringField9(record, ["runId", "run_id"])) != null ? _a : fallbackId) != null ? _b : null;
  const tournamentId = (_c = readStringField9(record, ["tournamentId", "tournament_id"])) != null ? _c : runId;
  const title = readStringField9(record, ["title"]);
  const createdAt = readStringField9(record, ["createdAt", "created_at"]);
  const updatedAt = readStringField9(record, ["updatedAt", "updated_at"]);
  const createdByUserId = readStringField9(record, ["createdByUserId", "created_by_user_id"]);
  const createdByLabel = readStringField9(record, ["createdByLabel", "created_by_label"]);
  if (!runId || !tournamentId || !title || !createdAt || !updatedAt || !createdByUserId || !createdByLabel) {
    return null;
  }
  return {
    runId,
    tournamentId,
    title,
    description: (_d = readStringField9(record, ["description"])) != null ? _d : "",
    category: clampInteger(readNumberField6(record, ["category"]), DEFAULT_CATEGORY, 0, 127),
    authoritative: (_e = readBooleanField7(record, ["authoritative"])) != null ? _e : true,
    sortOrder: normalizeSortOrder((_f = readStringField9(record, ["sortOrder", "sort_order"])) != null ? _f : DEFAULT_SORT_ORDER),
    operator: normalizeOperator((_g = readStringField9(record, ["operator"])) != null ? _g : DEFAULT_OPERATOR),
    resetSchedule: (_h = readStringField9(record, ["resetSchedule", "reset_schedule"])) != null ? _h : "",
    metadata: readMetadataField(record, ["metadata"]),
    startTime: clampInteger(readNumberField6(record, ["startTime", "start_time"]), 0, 0, 2147483647),
    endTime: clampInteger(readNumberField6(record, ["endTime", "end_time"]), 0, 0, 2147483647),
    duration: clampInteger(readNumberField6(record, ["duration"]), DEFAULT_DURATION_SECONDS, 1, 2147483647),
    maxSize: clampInteger(readNumberField6(record, ["maxSize", "max_size"]), DEFAULT_MAX_SIZE, 1, 1e6),
    maxNumScore: clampInteger(
      readNumberField6(record, ["maxNumScore", "max_num_score"]),
      1,
      1,
      1e6
    ),
    joinRequired: (_i = readBooleanField7(record, ["joinRequired", "join_required"])) != null ? _i : true,
    enableRanks: (_j = readBooleanField7(record, ["enableRanks", "enable_ranks"])) != null ? _j : true,
    lifecycle: normalizeRunLifecycle((_k = readStringField9(record, ["lifecycle"])) != null ? _k : "draft"),
    createdAt,
    updatedAt,
    createdByUserId,
    createdByLabel,
    openedAt: readStringField9(record, ["openedAt", "opened_at"]),
    closedAt: readStringField9(record, ["closedAt", "closed_at"]),
    finalizedAt: readStringField9(record, ["finalizedAt", "finalized_at"]),
    finalSnapshot: normalizeStandingsSnapshot(record.finalSnapshot),
    registrations: Array.isArray(record.registrations) ? record.registrations.map((entry) => normalizeTournamentRunRegistration(entry)).filter((entry) => Boolean(entry)) : [],
    bracket: normalizeTournamentBracketState(record.bracket)
  };
};
var normalizeRunIndex = (value) => {
  var _a;
  const record = asRecord2(value);
  const runIds = Array.isArray(record == null ? void 0 : record.runIds) ? record == null ? void 0 : record.runIds : [];
  return {
    runIds: Array.from(
      new Set(runIds.filter((entry) => typeof entry === "string" && entry.trim().length > 0))
    ),
    updatedAt: (_a = readStringField9(record, ["updatedAt", "updated_at"])) != null ? _a : (/* @__PURE__ */ new Date(0)).toISOString()
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
      permissionRead: STORAGE_PERMISSION_NONE2,
      permissionWrite: STORAGE_PERMISSION_NONE2
    }, version)
  ]);
};
var writeRunIndex = (nk, index, version) => {
  nk.storageWrite([
    maybeSetStorageVersion({
      collection: RUNS_COLLECTION,
      key: RUNS_INDEX_KEY,
      value: index,
      permissionRead: STORAGE_PERMISSION_NONE2,
      permissionWrite: STORAGE_PERMISSION_NONE2
    }, version)
  ]);
};
var isStorageVersionConflict = (error) => {
  const message = getErrorMessage2(error).toLowerCase();
  return message.includes("version check") || message.includes("version conflict") || message.includes("version mismatch") || message.includes("storage write rejected") || message.includes("already exists");
};
var getRunObjectVersionOrThrow = (runId, object) => {
  const version = getStorageObjectVersion(object);
  if (!version || version.trim().length === 0) {
    throw new Error(
      `Tournament run '${runId}' is missing a storage version and cannot be updated safely.`
    );
  }
  return version;
};
var updateRunWithRetry = (nk, logger, runId, updater) => {
  var _a;
  for (let attempt = 1; attempt <= MAX_WRITE_ATTEMPTS; attempt += 1) {
    const object = readRunObject(nk, runId);
    const current = normalizeRunRecord((_a = object == null ? void 0 : object.value) != null ? _a : null, runId);
    if (!object || !current) {
      throw new Error(`Tournament run '${runId}' was not found.`);
    }
    const next = updater(current);
    const version = getRunObjectVersionOrThrow(runId, object);
    try {
      writeRun(nk, next, version);
      return next;
    } catch (error) {
      if (!isStorageVersionConflict(error)) {
        throw error;
      }
      if (attempt === MAX_WRITE_ATTEMPTS) {
        throw error;
      }
      logger.warn(
        "Retrying tournament run write for %s after storage conflict: %s",
        runId,
        getErrorMessage2(error)
      );
    }
  }
  throw new Error(`Unable to update tournament run '${runId}'.`);
};
var readTournamentArray = (value) => {
  if (Array.isArray(value)) {
    return value.map((entry) => {
      var _a;
      return (_a = asRecord2(entry)) != null ? _a : {};
    }).filter((entry) => Object.keys(entry).length > 0);
  }
  const record = asRecord2(value);
  const tournaments = Array.isArray(record == null ? void 0 : record.tournaments) ? record.tournaments : [];
  return tournaments.map((entry) => {
    var _a;
    return (_a = asRecord2(entry)) != null ? _a : {};
  }).filter((entry) => Object.keys(entry).length > 0);
};
var mapTournamentsById = (value) => {
  return readTournamentArray(value).reduce(
    (accumulator, tournament) => {
      const tournamentId = readStringField9(tournament, ["id"]);
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
var getRunEntrantCount = (run, nakamaTournament) => {
  var _a;
  return Math.max(
    run.registrations.length,
    Math.max(0, Math.floor((_a = readNumberField6(nakamaTournament, ["size"])) != null ? _a : 0))
  );
};
var getRunCapacity = (run, nakamaTournament) => {
  var _a;
  return Math.max(0, Math.floor((_a = readNumberField6(nakamaTournament, ["maxSize", "max_size"])) != null ? _a : run.maxSize));
};
var getRunStartTimeMs = (run, nakamaTournament) => {
  var _a;
  const startTimeSeconds = (_a = readNumberField6(nakamaTournament, ["startTime", "start_time"])) != null ? _a : run.startTime;
  if (typeof startTimeSeconds !== "number" || !Number.isFinite(startTimeSeconds) || startTimeSeconds <= 0) {
    return null;
  }
  return Math.floor(startTimeSeconds * 1e3);
};
var hasRunReachedStartTime = (run, nakamaTournament, nowMs = Date.now()) => {
  const startTimeMs = getRunStartTimeMs(run, nakamaTournament);
  return startTimeMs === null || startTimeMs <= nowMs;
};
var getRunBotUserIds = (run) => {
  var _a, _b;
  const userIds = /* @__PURE__ */ new Set();
  run.registrations.forEach((registration) => {
    if (isTournamentBotUserId(registration.userId)) {
      userIds.add(registration.userId);
    }
  });
  (_a = run.bracket) == null ? void 0 : _a.participants.forEach((participant) => {
    if (isTournamentBotUserId(participant.userId)) {
      userIds.add(participant.userId);
    }
  });
  (_b = run.bracket) == null ? void 0 : _b.entries.forEach((entry) => {
    if (isTournamentBotUserId(entry.playerAUserId)) {
      userIds.add(entry.playerAUserId);
    }
    if (isTournamentBotUserId(entry.playerBUserId)) {
      userIds.add(entry.playerBUserId);
    }
  });
  return Array.from(userIds);
};
var buildRunBotSummary = (run) => buildTournamentBotSummary(run.metadata, getRunBotUserIds(run));
var buildRunResponseMetadata = (value) => {
  var _a, _b;
  const baseMetadata = readMetadataField(value, ["metadata"]);
  const explicitAutoAddBots = readBooleanField7(value, ["autoAddBots", "auto_add_bots"]);
  const explicitBotDifficulty = readStringField9(value, ["botDifficulty", "bot_difficulty"]);
  const explicitEntryFee = (_a = readStringField9(value, ["entryFee", "entry_fee", "buyIn", "buy_in"])) != null ? _a : readStringField9(baseMetadata, ["entryFee", "entry_fee", "buyIn", "buy_in"]);
  const normalizedEntryFee = formatTournamentEntryFee(explicitEntryFee);
  const normalizedPolicy = normalizeTournamentBotPolicy(__spreadValues(__spreadValues(__spreadValues({}, baseMetadata), explicitAutoAddBots !== null ? { autoAddBots: explicitAutoAddBots } : {}), explicitBotDifficulty !== null ? { botDifficulty: explicitBotDifficulty } : {}));
  return __spreadProps(__spreadValues({}, baseMetadata), {
    entryFee: normalizedEntryFee,
    buyIn: normalizedEntryFee,
    autoAddBots: normalizedPolicy.autoAdd,
    botDifficulty: normalizedPolicy.autoAdd ? (_b = normalizedPolicy.difficulty) != null ? _b : DEFAULT_BOT_DIFFICULTY : null
  });
};
var buildTournamentRunResponse = (run) => __spreadProps(__spreadValues({}, run), {
  bots: buildRunBotSummary(run)
});
var buildTournamentBotRegistrations = (runId, difficulty, startingSeed, count, joinedAt) => {
  const registrations = Array.from({ length: count }, (_, index) => {
    const seed = startingSeed + index;
    return {
      userId: buildTournamentBotUserId(runId, seed),
      displayName: "",
      joinedAt,
      seed
    };
  });
  const displayNames = buildTournamentBotDisplayNames(
    registrations.map((registration) => registration.userId),
    difficulty === "easy" || difficulty === "medium" || difficulty === "hard" || difficulty === "perfect" ? difficulty : DEFAULT_BOT_DIFFICULTY
  );
  return registrations.map((registration) => {
    var _a;
    return __spreadProps(__spreadValues({}, registration), {
      displayName: (_a = displayNames[registration.userId]) != null ? _a : registration.userId
    });
  });
};
var joinTournamentBots = (nk, logger, tournamentId, registrations) => {
  registrations.forEach((registration) => {
    try {
      nk.tournamentJoin(tournamentId, registration.userId, registration.displayName);
    } catch (error) {
      const message = getErrorMessage2(error);
      if (/already|joined|duplicate|exists|member/i.test(message)) {
        return;
      }
      logger.warn(
        "Unable to join tournament bot %s into %s: %s",
        registration.userId,
        tournamentId,
        message
      );
    }
  });
};
var isRunAwaitingLobbyFill = (run, nakamaTournament) => {
  var _a;
  if (run.lifecycle !== "open" || Boolean(run.finalizedAt) || Boolean((_a = run.bracket) == null ? void 0 : _a.finalizedAt) || Boolean(run.bracket)) {
    return false;
  }
  const capacity = getRunCapacity(run, nakamaTournament);
  if (capacity <= 0) {
    return false;
  }
  return getRunEntrantCount(run, nakamaTournament) < capacity;
};
var hasRunLobbyFillCountdownExpired = (run, nakamaTournament, nowMs = Date.now()) => {
  if (!isRunAwaitingLobbyFill(run, nakamaTournament)) {
    return false;
  }
  if (!hasRunReachedStartTime(run, nakamaTournament, nowMs)) {
    return false;
  }
  const deadlineMs = getTournamentLobbyDeadlineMs(run.openedAt);
  return deadlineMs !== null && deadlineMs <= nowMs;
};
var maybeAutoFinalizeRunForLobbyTimeout = (logger, nk, run, nakamaTournament) => {
  var _a;
  const resolvedTournament = nakamaTournament === void 0 ? getNakamaTournamentById(nk, run.tournamentId) : nakamaTournament;
  if (!hasRunLobbyFillCountdownExpired(run, resolvedTournament, Date.now())) {
    return run;
  }
  const botPolicy = normalizeTournamentBotPolicy(run.metadata);
  const humanRegistrations = run.registrations.filter((registration) => !isTournamentBotUserId(registration.userId));
  const capacity = getRunCapacity(run, resolvedTournament);
  const missingSeats = Math.max(0, capacity - run.registrations.length);
  if (botPolicy.autoAdd && humanRegistrations.length > 0 && missingSeats > 0) {
    try {
      const filledAt = (/* @__PURE__ */ new Date()).toISOString();
      const botRegistrations = buildTournamentBotRegistrations(
        run.runId,
        (_a = botPolicy.difficulty) != null ? _a : DEFAULT_BOT_DIFFICULTY,
        run.registrations.length + 1,
        missingSeats,
        filledAt
      );
      const updatedRun = updateRunWithRetry(nk, logger, run.runId, (current) => {
        var _a2;
        if (current.bracket || current.lifecycle !== "open") {
          return current;
        }
        const currentHumanRegistrations = current.registrations.filter(
          (registration) => !isTournamentBotUserId(registration.userId)
        );
        if (currentHumanRegistrations.length === 0) {
          return current;
        }
        const currentCapacity = getRunCapacity(current, resolvedTournament);
        const currentMissingSeats = Math.max(0, currentCapacity - current.registrations.length);
        if (currentMissingSeats <= 0) {
          return current;
        }
        const currentBotRegistrations = buildTournamentBotRegistrations(
          current.runId,
          (_a2 = botPolicy.difficulty) != null ? _a2 : DEFAULT_BOT_DIFFICULTY,
          current.registrations.length + 1,
          currentMissingSeats,
          filledAt
        );
        const nextRegistrations = current.registrations.concat(currentBotRegistrations);
        return __spreadProps(__spreadValues({}, current), {
          updatedAt: filledAt,
          registrations: nextRegistrations,
          bracket: createSingleEliminationBracket(nextRegistrations, filledAt)
        });
      });
      if (updatedRun.bracket) {
        joinTournamentBots(
          nk,
          logger,
          updatedRun.tournamentId,
          updatedRun.registrations.filter((registration) => isTournamentBotUserId(registration.userId))
        );
        logger.info(
          "Filled %d tournament bot seats for run %s after the lobby fill countdown expired.",
          botRegistrations.length,
          updatedRun.runId
        );
        return updatedRun;
      }
    } catch (error) {
      logger.warn(
        "Unable to fill tournament run %s with bots after the lobby fill countdown expired: %s",
        run.runId,
        getErrorMessage2(error)
      );
      return readRunOrThrow(nk, run.runId);
    }
  }
  try {
    const result = finalizeTournamentRun(logger, nk, run.runId, {});
    logger.info(
      "Auto-finalized tournament run %s after the lobby fill countdown expired.",
      result.run.runId
    );
    return result.run;
  } catch (error) {
    logger.warn(
      "Unable to auto-finalize tournament run %s after the lobby fill countdown expired: %s",
      run.runId,
      getErrorMessage2(error)
    );
    return readRunOrThrow(nk, run.runId);
  }
};
var getNakamaTournamentsById = (nk, tournamentIds) => {
  const filteredIds = Array.from(new Set(tournamentIds.filter((id) => id.length > 0)));
  if (filteredIds.length === 0) {
    return {};
  }
  return mapTournamentsById(nk.tournamentsGetId(filteredIds));
};
var readTournamentRecordList = (value) => {
  const record = asRecord2(value);
  const records = Array.isArray(record == null ? void 0 : record.records) ? record.records : [];
  const ownerRecords = Array.isArray(record == null ? void 0 : record.owner_records) ? record.owner_records : Array.isArray(record == null ? void 0 : record.ownerRecords) ? record.ownerRecords : [];
  return {
    records: records.map((entry) => {
      var _a;
      return (_a = asRecord2(entry)) != null ? _a : {};
    }),
    ownerRecords: ownerRecords.map((entry) => {
      var _a;
      return (_a = asRecord2(entry)) != null ? _a : {};
    }),
    prevCursor: readStringField9(record, ["prev_cursor", "prevCursor"]),
    nextCursor: readStringField9(record, ["next_cursor", "nextCursor"]),
    rankCount: (() => {
      const parsed = readNumberField6(record, ["rank_count", "rankCount"]);
      return typeof parsed === "number" ? parsed : null;
    })()
  };
};
var resolveOverrideExpiry = (overrideExpiry, tournament) => {
  if (typeof overrideExpiry === "number" && Number.isFinite(overrideExpiry) && overrideExpiry >= 0) {
    return Math.floor(overrideExpiry);
  }
  if (tournament) {
    const endTime = readNumberField6(tournament, ["end_time", "endTime"]);
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
var normalizeStoredTournamentMatchSummary = (value, options) => {
  var _a;
  const record = asRecord2(value);
  const requireCounted = (options == null ? void 0 : options.requireCounted) !== false;
  if (!record || requireCounted && readBooleanField7(record, ["counted"]) !== true) {
    return null;
  }
  const summary = asRecord2(record.summary);
  const matchId = readStringField9(record, ["matchId", "match_id"]);
  const completedAt = (_a = readStringField9(summary, ["completedAt", "completed_at"])) != null ? _a : readStringField9(record, ["updatedAt", "updated_at", "createdAt", "created_at"]);
  if (!summary || !matchId || !completedAt) {
    return null;
  }
  const players = Array.isArray(summary.players) ? summary.players.map((entry) => {
    var _a2, _b;
    const player = asRecord2(entry);
    const userId = readStringField9(player, ["userId", "user_id"]);
    if (!player || !userId) {
      return null;
    }
    return {
      userId,
      username: readStringField9(player, ["username"]),
      didWin: readBooleanField7(player, ["didWin"]) === true,
      score: Math.max(0, Math.floor((_a2 = readNumberField6(player, ["score"])) != null ? _a2 : 0)),
      finishedCount: Math.max(
        0,
        Math.floor((_b = readNumberField6(player, ["finishedCount", "finished_count"])) != null ? _b : 0)
      )
    };
  }).filter((entry) => Boolean(entry)) : [];
  if (players.length === 0) {
    return null;
  }
  return {
    matchId,
    completedAt,
    round: (() => {
      const round = readNumberField6(summary, ["round"]);
      return typeof round === "number" && Number.isFinite(round) ? Math.max(1, Math.floor(round)) : null;
    })(),
    entryId: readStringField9(summary, ["entryId", "entry_id"]),
    players
  };
};
var normalizeReconstructedTournamentSnapshotMatch = (value) => {
  return normalizeStoredTournamentMatchSummary(value, { requireCounted: true });
};
var readStoredReconstructedTournamentSnapshotMatches = (nk, resultIds) => {
  if (resultIds.length === 0) {
    return [];
  }
  const objects = nk.storageRead(
    resultIds.map((resultId) => ({
      collection: TOURNAMENT_MATCH_RESULTS_COLLECTION,
      key: resultId
    }))
  );
  return resultIds.map(
    (resultId) => {
      var _a, _b;
      return normalizeReconstructedTournamentSnapshotMatch(
        (_b = (_a = findStorageObject(objects, TOURNAMENT_MATCH_RESULTS_COLLECTION, resultId)) == null ? void 0 : _a.value) != null ? _b : null
      );
    }
  ).filter((entry) => Boolean(entry));
};
var buildAdminBracketEntryMatchContextByMatchId = (nk, run) => {
  var _a, _b;
  const completedEntries = (_b = (_a = run.bracket) == null ? void 0 : _a.entries.filter(
    (entry) => entry.status === "completed" && Boolean(entry.matchId)
  )) != null ? _b : [];
  if (completedEntries.length === 0) {
    return /* @__PURE__ */ new Map();
  }
  const resultIds = Array.from(
    new Set(
      completedEntries.map((entry) => entry.matchId).filter((matchId) => Boolean(matchId)).map((matchId) => `${run.runId}:${matchId}`)
    )
  );
  const objects = nk.storageRead(
    resultIds.map((resultId) => ({
      collection: TOURNAMENT_MATCH_RESULTS_COLLECTION,
      key: resultId
    }))
  );
  return new Map(
    resultIds.map(
      (resultId) => {
        var _a2, _b2;
        return normalizeStoredTournamentMatchSummary(
          (_b2 = (_a2 = findStorageObject(objects, TOURNAMENT_MATCH_RESULTS_COLLECTION, resultId)) == null ? void 0 : _a2.value) != null ? _b2 : null,
          { requireCounted: false }
        );
      }
    ).filter((entry) => Boolean(entry)).map((entry) => [
      entry.matchId,
      {
        usernamesByUserId: entry.players.reduce((accumulator, player) => {
          var _a2;
          accumulator[player.userId] = ((_a2 = player.username) == null ? void 0 : _a2.trim()) || null;
          return accumulator;
        }, {}),
        finishedCountsByUserId: entry.players.reduce((accumulator, player) => {
          accumulator[player.userId] = player.finishedCount;
          return accumulator;
        }, {})
      }
    ])
  );
};
var buildAdminTournamentRunResponse = (nk, run) => {
  const responseRun = buildTournamentRunResponse(run);
  if (!run.bracket) {
    return responseRun;
  }
  const matchContextByMatchId = buildAdminBracketEntryMatchContextByMatchId(nk, run);
  return __spreadProps(__spreadValues({}, responseRun), {
    bracket: __spreadProps(__spreadValues({}, run.bracket), {
      participants: run.bracket.participants.map((participant) => __spreadValues({}, participant)),
      entries: run.bracket.entries.map((entry) => {
        var _a, _b, _c, _d;
        const matchContext = entry.matchId ? matchContextByMatchId.get(entry.matchId) : null;
        return __spreadProps(__spreadValues({}, entry), {
          playerAUsername: entry.playerAUserId && matchContext ? (_a = matchContext.usernamesByUserId[entry.playerAUserId]) != null ? _a : null : null,
          playerBUsername: entry.playerBUserId && matchContext ? (_b = matchContext.usernamesByUserId[entry.playerBUserId]) != null ? _b : null : null,
          playerAScore: entry.playerAUserId && matchContext ? (_c = matchContext.finishedCountsByUserId[entry.playerAUserId]) != null ? _c : null : null,
          playerBScore: entry.playerBUserId && matchContext ? (_d = matchContext.finishedCountsByUserId[entry.playerBUserId]) != null ? _d : null : null
        });
      })
    })
  });
};
var applyReconstructedStandingUpdate = (operator, standing, player) => {
  if (operator === "incr") {
    standing.score += player.score;
    standing.subscore += player.finishedCount;
    return;
  }
  if (operator === "best" && (player.score > standing.score || player.score === standing.score && player.finishedCount > standing.subscore)) {
    standing.score = player.score;
    standing.subscore = player.finishedCount;
    return;
  }
  if (operator === "set") {
    standing.score = player.score;
    standing.subscore = player.finishedCount;
  }
};
var buildReconstructedFinalStandingsSnapshot = (nk, run, overrideExpiry, generatedAt) => {
  var _a;
  const countedResultIds = readStringArrayField2(run.metadata, ["countedResultIds", "counted_result_ids"]);
  if (countedResultIds.length === 0) {
    return null;
  }
  const matches = readStoredReconstructedTournamentSnapshotMatches(nk, countedResultIds);
  if (matches.length !== countedResultIds.length) {
    return null;
  }
  const participants = ((_a = run.bracket) == null ? void 0 : _a.participants.length) ? run.bracket.participants.slice().sort(compareBracketParticipantsForFallbackSnapshot) : run.registrations.slice().sort((left, right) => {
    if (left.seed !== right.seed) {
      return left.seed - right.seed;
    }
    const joinedCompare = left.joinedAt.localeCompare(right.joinedAt);
    if (joinedCompare !== 0) {
      return joinedCompare;
    }
    return left.userId.localeCompare(right.userId);
  }).map((registration) => ({
    userId: registration.userId,
    displayName: registration.displayName,
    joinedAt: registration.joinedAt,
    seed: registration.seed,
    state: "lobby",
    currentRound: null,
    currentEntryId: null,
    activeMatchId: null,
    finalPlacement: null,
    lastResult: null,
    updatedAt: run.updatedAt
  }));
  const standingsByUserId = participants.reduce(
    (accumulator, participant) => {
      accumulator[participant.userId] = {
        userId: participant.userId,
        username: participant.displayName,
        score: 0,
        subscore: 0,
        attempts: 0,
        latestCompletedAt: null,
        latestRound: null,
        latestEntryId: null,
        latestMatchId: null,
        latestOpponentUserId: null,
        lastResult: participant.lastResult
      };
      return accumulator;
    },
    {}
  );
  matches.forEach((match) => {
    match.players.forEach((player) => {
      var _a2, _b, _c, _d, _e;
      const standing = (_b = standingsByUserId[player.userId]) != null ? _b : standingsByUserId[player.userId] = {
        userId: player.userId,
        username: ((_a2 = player.username) == null ? void 0 : _a2.trim()) || player.userId,
        score: 0,
        subscore: 0,
        attempts: 0,
        latestCompletedAt: null,
        latestRound: null,
        latestEntryId: null,
        latestMatchId: null,
        latestOpponentUserId: null,
        lastResult: null
      };
      standing.attempts += 1;
      if ((_c = player.username) == null ? void 0 : _c.trim()) {
        standing.username = player.username.trim();
      }
      applyReconstructedStandingUpdate(run.operator, standing, player);
      if (!standing.latestCompletedAt || match.completedAt.localeCompare(standing.latestCompletedAt) >= 0) {
        standing.latestCompletedAt = match.completedAt;
        standing.latestRound = match.round;
        standing.latestEntryId = match.entryId;
        standing.latestMatchId = match.matchId;
        standing.latestOpponentUserId = (_e = (_d = match.players.find((candidate) => candidate.userId !== player.userId)) == null ? void 0 : _d.userId) != null ? _e : null;
        standing.lastResult = player.didWin ? "win" : "loss";
      }
    });
  });
  const knownParticipantUserIds = new Set(participants.map((participant) => participant.userId));
  const extraParticipants = Object.keys(standingsByUserId).filter((userId) => !knownParticipantUserIds.has(userId)).sort((leftUserId, rightUserId) => {
    const left = standingsByUserId[leftUserId];
    const right = standingsByUserId[rightUserId];
    if (left.score !== right.score) {
      return right.score - left.score;
    }
    if (left.subscore !== right.subscore) {
      return right.subscore - left.subscore;
    }
    if (left.attempts !== right.attempts) {
      return right.attempts - left.attempts;
    }
    return left.username.localeCompare(right.username);
  }).map((userId) => {
    var _a2;
    const standing = standingsByUserId[userId];
    return {
      userId,
      displayName: standing.username,
      joinedAt: run.createdAt,
      seed: Number.MAX_SAFE_INTEGER,
      state: "lobby",
      currentRound: standing.latestRound,
      currentEntryId: standing.latestEntryId,
      activeMatchId: standing.latestMatchId,
      finalPlacement: null,
      lastResult: standing.lastResult,
      updatedAt: (_a2 = standing.latestCompletedAt) != null ? _a2 : run.updatedAt
    };
  });
  const orderedParticipants = participants.concat(extraParticipants);
  const records = orderedParticipants.map((participant, index) => {
    var _a2, _b, _c, _d, _e, _f, _g, _h;
    const standing = (_a2 = standingsByUserId[participant.userId]) != null ? _a2 : {
      userId: participant.userId,
      username: participant.displayName,
      score: 0,
      subscore: 0,
      attempts: 0,
      latestCompletedAt: null,
      latestRound: null,
      latestEntryId: null,
      latestMatchId: null,
      latestOpponentUserId: null,
      lastResult: participant.lastResult
    };
    return {
      rank: typeof participant.finalPlacement === "number" && Number.isFinite(participant.finalPlacement) ? participant.finalPlacement : index + 1,
      owner_id: participant.userId,
      username: standing.username || participant.displayName,
      score: standing.score,
      subscore: standing.subscore,
      num_score: standing.attempts,
      max_num_score: run.maxNumScore,
      create_time: run.createdAt,
      update_time: (_d = (_c = (_b = standing.latestCompletedAt) != null ? _b : participant.updatedAt) != null ? _c : run.updatedAt) != null ? _d : generatedAt,
      metadata: {
        state: participant.state,
        round: (_e = standing.latestRound) != null ? _e : participant.currentRound,
        entryId: (_f = standing.latestEntryId) != null ? _f : participant.currentEntryId,
        matchId: (_g = standing.latestMatchId) != null ? _g : participant.activeMatchId,
        activeMatchId: participant.activeMatchId,
        finalPlacement: participant.finalPlacement,
        result: (_h = standing.lastResult) != null ? _h : participant.lastResult,
        seed: participant.seed,
        opponentUserId: standing.latestOpponentUserId,
        completedAt: standing.latestCompletedAt
      }
    };
  });
  return {
    generatedAt,
    overrideExpiry,
    rankCount: records.length,
    records,
    prevCursor: null,
    nextCursor: null
  };
};
var canReuseStoredStandingsSnapshot = (snapshot, limit) => {
  var _a;
  if (!snapshot) {
    return false;
  }
  const availableRecords = snapshot.records.length;
  const totalRecords = (_a = snapshot.rankCount) != null ? _a : availableRecords;
  return availableRecords >= Math.min(limit, totalRecords);
};
var resolveRunStandingsSnapshot = (nk, run, limit, overrideExpiry) => {
  var _a, _b;
  const reconstructedSnapshot = run.lifecycle === "finalized" ? buildReconstructedFinalStandingsSnapshot(
    nk,
    run,
    overrideExpiry,
    (_b = (_a = run.finalSnapshot) == null ? void 0 : _a.generatedAt) != null ? _b : (/* @__PURE__ */ new Date()).toISOString()
  ) : null;
  if (run.lifecycle === "finalized" && canReuseStoredStandingsSnapshot(run.finalSnapshot, limit)) {
    if (reconstructedSnapshot && !snapshotMatchesReconstructedCountedData(run.finalSnapshot, reconstructedSnapshot)) {
      return __spreadProps(__spreadValues({}, reconstructedSnapshot), {
        records: reconstructedSnapshot.records.slice(0, limit)
      });
    }
    return __spreadProps(__spreadValues({}, run.finalSnapshot), {
      records: run.finalSnapshot.records.slice(0, limit)
    });
  }
  if (run.lifecycle === "finalized" && reconstructedSnapshot) {
    return __spreadProps(__spreadValues({}, reconstructedSnapshot), {
      records: reconstructedSnapshot.records.slice(0, limit)
    });
  }
  return buildStandingsSnapshot(nk, run.tournamentId, limit, overrideExpiry);
};
var readStandingsRecordRank = (record) => {
  const rank = readNumberField6(record, ["rank"]);
  return typeof rank === "number" && Number.isFinite(rank) ? rank : null;
};
var readStandingsRecordOwnerId = (record) => readStringField9(record, ["ownerId", "owner_id"]);
var readStandingsRecordScore = (record) => {
  var _a;
  return Math.max(0, Math.floor((_a = readNumberField6(record, ["score"])) != null ? _a : 0));
};
var readStandingsRecordSubscore = (record) => {
  var _a;
  return Math.max(0, Math.floor((_a = readNumberField6(record, ["subscore"])) != null ? _a : 0));
};
var readStandingsRecordAttemptCount = (record) => {
  var _a;
  return Math.max(0, Math.floor((_a = readNumberField6(record, ["numScore", "num_score"])) != null ? _a : 0));
};
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
var resolveTopRankOwnerId = (snapshot, targetRank) => {
  var _a, _b;
  const rankedRecords = snapshot.records.map((record) => ({
    record,
    rank: readStandingsRecordRank(record)
  })).filter((entry) => entry.rank !== null);
  const matchedRecord = (_b = (_a = rankedRecords.find((entry) => entry.rank === targetRank)) == null ? void 0 : _a.record) != null ? _b : null;
  return matchedRecord ? readStandingsRecordOwnerId(matchedRecord) : null;
};
var snapshotMatchesFinalizedBracket = (snapshot, run) => {
  var _a;
  if (!((_a = run.bracket) == null ? void 0 : _a.finalizedAt) || !run.bracket.winnerUserId || !run.bracket.runnerUpUserId) {
    return true;
  }
  const championUserId = resolveTopRankOwnerId(snapshot, 1);
  const runnerUpUserId = resolveTopRankOwnerId(snapshot, 2);
  return championUserId === run.bracket.winnerUserId && runnerUpUserId === run.bracket.runnerUpUserId;
};
var snapshotMatchesReconstructedCountedData = (snapshot, reconstructedSnapshot) => {
  if (!snapshot) {
    return false;
  }
  const actualByUserId = snapshot.records.reduce(
    (accumulator, record) => {
      const ownerId = readStandingsRecordOwnerId(record);
      if (ownerId) {
        accumulator[ownerId] = record;
      }
      return accumulator;
    },
    {}
  );
  return reconstructedSnapshot.records.every((expectedRecord) => {
    const ownerId = readStandingsRecordOwnerId(expectedRecord);
    if (!ownerId) {
      return false;
    }
    const actualRecord = actualByUserId[ownerId];
    if (!actualRecord) {
      return false;
    }
    return readStandingsRecordScore(actualRecord) === readStandingsRecordScore(expectedRecord) && readStandingsRecordSubscore(actualRecord) === readStandingsRecordSubscore(expectedRecord) && readStandingsRecordAttemptCount(actualRecord) === readStandingsRecordAttemptCount(expectedRecord);
  });
};
var compareBracketParticipantsForFallbackSnapshot = (left, right) => {
  const leftPlacement = typeof left.finalPlacement === "number" ? left.finalPlacement : Number.MAX_SAFE_INTEGER;
  const rightPlacement = typeof right.finalPlacement === "number" ? right.finalPlacement : Number.MAX_SAFE_INTEGER;
  if (leftPlacement !== rightPlacement) {
    return leftPlacement - rightPlacement;
  }
  const leftRound = typeof left.currentRound === "number" ? left.currentRound : 0;
  const rightRound = typeof right.currentRound === "number" ? right.currentRound : 0;
  if (leftRound !== rightRound) {
    return rightRound - leftRound;
  }
  if (left.seed !== right.seed) {
    return left.seed - right.seed;
  }
  const joinedCompare = left.joinedAt.localeCompare(right.joinedAt);
  if (joinedCompare !== 0) {
    return joinedCompare;
  }
  return left.userId.localeCompare(right.userId);
};
var buildBracketStandingsFallbackSnapshot = (run, overrideExpiry, generatedAt) => {
  var _a, _b;
  const records = ((_b = (_a = run.bracket) == null ? void 0 : _a.participants) != null ? _b : []).slice().sort(compareBracketParticipantsForFallbackSnapshot).map((participant, index) => ({
    rank: typeof participant.finalPlacement === "number" && Number.isFinite(participant.finalPlacement) ? participant.finalPlacement : index + 1,
    owner_id: participant.userId,
    username: participant.displayName,
    score: participant.state === "champion" ? 1 : 0,
    subscore: 0,
    metadata: {
      state: participant.state,
      round: participant.currentRound,
      entryId: participant.currentEntryId,
      activeMatchId: participant.activeMatchId,
      finalPlacement: participant.finalPlacement,
      result: participant.lastResult,
      seed: participant.seed
    }
  }));
  return {
    generatedAt,
    overrideExpiry,
    rankCount: records.length,
    records,
    prevCursor: null,
    nextCursor: null
  };
};
var finalizeTournamentRun = (logger, nk, runId, options = {}) => {
  var _a, _b, _c, _d, _e;
  const runBeforeUpdate = readRunOrThrow(nk, runId);
  const nakamaTournament = getNakamaTournamentById(nk, runBeforeUpdate.tournamentId);
  const standingsLimit = clampInteger(options.limit, DEFAULT_STANDINGS_LIMIT, 1, MAX_STANDINGS_LIMIT);
  const overrideExpiry = resolveOverrideExpiry((_a = options.overrideExpiry) != null ? _a : null, nakamaTournament);
  const finalizationTimestamp = (/* @__PURE__ */ new Date()).toISOString();
  const bracketFallbackSnapshot = buildBracketStandingsFallbackSnapshot(
    runBeforeUpdate,
    overrideExpiry,
    finalizationTimestamp
  );
  const reconstructedSnapshot = (() => {
    try {
      return buildReconstructedFinalStandingsSnapshot(
        nk,
        runBeforeUpdate,
        overrideExpiry,
        finalizationTimestamp
      );
    } catch (error) {
      logger.warn(
        "Unable to reconstruct counted-match standings for %s during finalization: %s",
        runBeforeUpdate.runId,
        getErrorMessage2(error)
      );
      return null;
    }
  })();
  const finalSnapshot = (() => {
    if (runBeforeUpdate.finalSnapshot) {
      return runBeforeUpdate.finalSnapshot;
    }
    try {
      const standingsSnapshot = buildStandingsSnapshot(
        nk,
        runBeforeUpdate.tournamentId,
        standingsLimit,
        overrideExpiry
      );
      if (!snapshotMatchesFinalizedBracket(standingsSnapshot, runBeforeUpdate)) {
        if (reconstructedSnapshot && snapshotMatchesFinalizedBracket(reconstructedSnapshot, runBeforeUpdate)) {
          logger.warn(
            "Standings snapshot for %s disagreed with finalized bracket, using counted-match reconstruction.",
            runBeforeUpdate.runId
          );
          return reconstructedSnapshot;
        }
        logger.warn(
          "Standings snapshot for %s disagreed with finalized bracket, using bracket fallback.",
          runBeforeUpdate.runId
        );
        return bracketFallbackSnapshot;
      }
      if (reconstructedSnapshot && !snapshotMatchesReconstructedCountedData(standingsSnapshot, reconstructedSnapshot)) {
        logger.warn(
          "Standings snapshot for %s looked stale compared with counted match results, using counted-match reconstruction.",
          runBeforeUpdate.runId
        );
        return reconstructedSnapshot;
      }
      return standingsSnapshot;
    } catch (error) {
      if (reconstructedSnapshot && snapshotMatchesFinalizedBracket(reconstructedSnapshot, runBeforeUpdate)) {
        logger.warn(
          "Unable to build final standings snapshot for %s during finalization, using counted-match reconstruction: %s",
          runBeforeUpdate.runId,
          getErrorMessage2(error)
        );
        return reconstructedSnapshot;
      }
      logger.warn(
        "Unable to build final standings snapshot for %s during finalization, using bracket fallback: %s",
        runBeforeUpdate.runId,
        getErrorMessage2(error)
      );
      return bracketFallbackSnapshot;
    }
  })();
  let disabledRanks = false;
  try {
    nk.tournamentRanksDisable(runBeforeUpdate.tournamentId);
    disabledRanks = true;
  } catch (error) {
    logger.warn(
      "Unable to disable ranks for %s during finalization: %s",
      runBeforeUpdate.runId,
      String(error)
    );
  }
  const run = updateRunWithRetry(nk, logger, runId, (current) => {
    var _a2, _b2, _c2;
    return __spreadProps(__spreadValues({}, current), {
      lifecycle: "finalized",
      updatedAt: finalizationTimestamp,
      finalizedAt: (_a2 = current.finalizedAt) != null ? _a2 : finalizationTimestamp,
      closedAt: (_b2 = current.closedAt) != null ? _b2 : finalizationTimestamp,
      finalSnapshot: (_c2 = current.finalSnapshot) != null ? _c2 : finalSnapshot
    });
  });
  const effectiveSnapshot = (_b = run.finalSnapshot) != null ? _b : finalSnapshot;
  const championUserId = (_e = (_d = resolveChampionUserId(effectiveSnapshot)) != null ? _d : (_c = run.bracket) == null ? void 0 : _c.winnerUserId) != null ? _e : null;
  let championRewardResult = null;
  if (championUserId && isTournamentBotUserId(championUserId)) {
    logger.info("Skipping tournament champion XP for synthetic bot %s on run %s.", championUserId, run.runId);
  } else if (championUserId) {
    const rewardSettings = resolveTournamentXpRewardSettings(run.metadata);
    if (rewardSettings.xpForTournamentChampion <= 0) {
      logger.info("Skipping tournament champion XP for %s because the configured reward is zero.", run.runId);
    } else {
      try {
        championRewardResult = awardXpForTournamentChampion(nk, logger, {
          userId: championUserId,
          runId: run.runId,
          awardedXp: rewardSettings.xpForTournamentChampion
        });
        if (!championRewardResult.duplicate) {
          logger.info(
            "Awarded tournament champion XP to %s for run %s. total=%d",
            championUserId,
            run.runId,
            championRewardResult.newTotalXp
          );
        }
      } catch (error) {
        logger.warn(
          "Unable to award tournament champion XP for %s to %s: %s",
          run.runId,
          championUserId,
          getErrorMessage2(error)
        );
      }
    }
  } else if (effectiveSnapshot.records.length > 0) {
    logger.warn("Unable to resolve champion user ID for finalized tournament %s.", run.runId);
  }
  const gemSettings = resolveTournamentGemRewardSettings(run.metadata);
  const gemRewardResults = [];
  const rankedGemRewards = [
    { rank: 1, gems: gemSettings.gemsForRank1 },
    { rank: 2, gems: gemSettings.gemsForRank2 },
    { rank: 3, gems: gemSettings.gemsForRank3 }
  ];
  for (const { rank, gems } of rankedGemRewards) {
    if (gems <= 0) {
      continue;
    }
    const rankUserId = rank === 1 ? championUserId != null ? championUserId : resolveTopRankOwnerId(effectiveSnapshot, 1) : resolveTopRankOwnerId(effectiveSnapshot, rank);
    if (!rankUserId || isTournamentBotUserId(rankUserId)) {
      logger.info(
        "Skipping gem reward for rank %d on run %s (no real user at this placement).",
        rank,
        run.runId
      );
      continue;
    }
    try {
      const result = addPremiumCurrency(nk, logger, {
        userId: rankUserId,
        amount: gems,
        source: "tournament_reward",
        deduplicationKey: `tournament_reward:${run.runId}:rank:${rank}`,
        metadata: { runId: run.runId, tournamentId: run.tournamentId, rank }
      });
      gemRewardResults.push({
        userId: rankUserId,
        rank,
        gemAmount: gems,
        duplicate: result.duplicate,
        source: "tournament_reward"
      });
    } catch (error) {
      logger.warn(
        "Unable to award %d gems to rank %d user %s for run %s: %s",
        gems,
        rank,
        rankUserId,
        run.runId,
        getErrorMessage2(error)
      );
    }
  }
  return {
    run,
    nakamaTournament,
    finalSnapshot: effectiveSnapshot,
    disabledRanks,
    championUserId,
    championRewardResult,
    gemRewardResults
  };
};
var sortRuns = (runs) => runs.slice().sort((left, right) => {
  const updatedCompare = right.updatedAt.localeCompare(left.updatedAt);
  if (updatedCompare !== 0) {
    return updatedCompare;
  }
  return left.runId.localeCompare(right.runId);
});
var buildRunResponse = (nk, run, nakamaTournament) => ({
  ok: true,
  run: buildAdminTournamentRunResponse(nk, run),
  nakamaTournament
});
var maybeAutoFinalizeAdminRun = (logger, nk, run) => {
  var _a;
  const maybeTimedOutRun = maybeAutoFinalizeRunForLobbyTimeout(logger, nk, run);
  if (maybeTimedOutRun.lifecycle === "finalized" || !((_a = maybeTimedOutRun.bracket) == null ? void 0 : _a.finalizedAt)) {
    return maybeTimedOutRun;
  }
  try {
    return finalizeTournamentRun(logger, nk, maybeTimedOutRun.runId, {}).run;
  } catch (error) {
    logger.warn(
      "Unable to auto-finalize admin tournament run %s while serving internals: %s",
      maybeTimedOutRun.runId,
      getErrorMessage2(error)
    );
    return readRunOrThrow(nk, maybeTimedOutRun.runId);
  }
};
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
          collection: "tournament_match_queue",
          key: run.runId,
          userId: SYSTEM_USER_ID4
        },
        ...run.registrations.map((registration) => ({
          collection: TOURNAMENT_RUN_MEMBERSHIPS_COLLECTION,
          key: run.runId,
          userId: registration.userId
        }))
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
        getErrorMessage2(error)
      );
    }
  }
  throw new Error(`Unable to delete tournament run '${run.runId}'.`);
};
var rpcAdminListTournaments = (ctx, logger, nk, payload) => {
  return runAuditedAdminRpc(
    (_ctx, _logger, _nk, _payload) => {
      assertAdmin(_ctx, "viewer", _nk);
      const parsed = parseJsonPayload2(_payload);
      const limit = clampInteger(parsed.limit, 50, 1, MAX_RUN_LIST_LIMIT);
      const lifecycleFilter = readStringField9(parsed, ["lifecycle"]);
      const indexState = readRunIndexState(_nk);
      const runs = sortRuns(readRunsByIds(_nk, indexState.index.runIds).map(
        (run) => maybeAutoFinalizeAdminRun(_logger, _nk, run)
      ));
      const filteredRuns = lifecycleFilter && (lifecycleFilter === "draft" || lifecycleFilter === "open" || lifecycleFilter === "closed" || lifecycleFilter === "finalized") ? runs.filter((run) => run.lifecycle === lifecycleFilter) : runs;
      const limitedRuns = filteredRuns.slice(0, limit);
      const tournamentsById = getNakamaTournamentsById(
        _nk,
        limitedRuns.map((run) => run.tournamentId)
      );
      const items = limitedRuns.map((run) => {
        var _a;
        return __spreadProps(__spreadValues({}, buildAdminTournamentRunResponse(_nk, run)), {
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
      const parsed = parseJsonPayload2(_payload);
      const runId = readStringField9(parsed, ["runId", "run_id", "tournamentId", "tournament_id"]);
      if (!runId) {
        throw new Error("runId is required.");
      }
      const existingRun = normalizeRunRecord((_b = (_a = readRunObject(_nk, runId)) == null ? void 0 : _a.value) != null ? _b : null, runId);
      const run = existingRun ? maybeAutoFinalizeAdminRun(_logger, _nk, existingRun) : null;
      if (!run) {
        return JSON.stringify({
          ok: true,
          run: null,
          nakamaTournament: null
        });
      }
      const nakamaTournament = getNakamaTournamentById(_nk, run.tournamentId);
      return JSON.stringify({
        ok: true,
        run: buildAdminTournamentRunResponse(_nk, run),
        nakamaTournament
      });
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
      const parsed = parseJsonPayload2(_payload);
      const title = readStringField9(parsed, ["title"]);
      if (!title) {
        throw new Error("title is required.");
      }
      for (let attempt = 1; attempt <= MAX_WRITE_ATTEMPTS; attempt += 1) {
        const indexState = readRunIndexState(_nk);
        const createdAt = (/* @__PURE__ */ new Date()).toISOString();
        const runId = buildRunId(
          readStringField9(parsed, ["runId", "run_id"]),
          title,
          indexState.index.runIds
        );
        const startTime = clampInteger(readNumberField6(parsed, ["startTime", "start_time"]), 0, 0, 2147483647);
        const maxSize = clampInteger(readNumberField6(parsed, ["maxSize", "max_size"]), DEFAULT_MAX_SIZE, 1, 1e6);
        assertPowerOfTwoTournamentSize(maxSize);
        const duration = AUTO_TOURNAMENT_DURATION_SECONDS;
        const maxNumScore = getSingleEliminationRoundCount(maxSize);
        const endTime = startTime > 0 ? startTime + duration : 0;
        const run = {
          runId,
          tournamentId: runId,
          title,
          description: (_a = readStringField9(parsed, ["description"])) != null ? _a : "",
          category: clampInteger(readNumberField6(parsed, ["category"]), DEFAULT_CATEGORY, 0, 127),
          authoritative: (_b = readBooleanField7(parsed, ["authoritative"])) != null ? _b : true,
          sortOrder: normalizeSortOrder(readStringField9(parsed, ["sortOrder", "sort_order"])),
          operator: normalizeOperator(readStringField9(parsed, ["operator"])),
          resetSchedule: (_c = readStringField9(parsed, ["resetSchedule", "reset_schedule"])) != null ? _c : "",
          metadata: buildRunResponseMetadata(parsed),
          startTime,
          endTime,
          duration,
          maxSize,
          maxNumScore,
          joinRequired: (_d = readBooleanField7(parsed, ["joinRequired", "join_required"])) != null ? _d : true,
          enableRanks: (_e = readBooleanField7(parsed, ["enableRanks", "enable_ranks"])) != null ? _e : true,
          lifecycle: "draft",
          createdAt,
          updatedAt: createdAt,
          createdByUserId: requireAuthenticatedUserId(_ctx),
          createdByLabel: getActorLabel(_ctx),
          openedAt: null,
          closedAt: null,
          finalizedAt: null,
          finalSnapshot: null,
          registrations: [],
          bracket: null
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
              permissionRead: STORAGE_PERMISSION_NONE2,
              permissionWrite: STORAGE_PERMISSION_NONE2
            }, null),
            maybeSetStorageVersion({
              collection: RUNS_COLLECTION,
              key: RUNS_INDEX_KEY,
              value: nextIndex,
              permissionRead: STORAGE_PERMISSION_NONE2,
              permissionWrite: STORAGE_PERMISSION_NONE2
            }, getStorageObjectVersion(indexState.object))
          ]);
          return JSON.stringify(buildRunResponse(_nk, run, null));
        } catch (error) {
          if (attempt === MAX_WRITE_ATTEMPTS) {
            throw error;
          }
          _logger.warn("Retrying tournament run create for %s: %s", title, getErrorMessage2(error));
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
      const parsed = parseJsonPayload2(_payload);
      const runId = readStringField9(parsed, ["runId", "run_id", "tournamentId", "tournament_id"]);
      if (!runId) {
        throw new Error("runId is required.");
      }
      let createdTournament = false;
      const run = updateRunWithRetry(_nk, _logger, runId, (current) => {
        var _a;
        assertPowerOfTwoTournamentSize(current.maxSize);
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
      return JSON.stringify(buildRunResponse(_nk, run, getNakamaTournamentById(_nk, run.tournamentId)));
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
      const parsed = parseJsonPayload2(_payload);
      const runId = readStringField9(parsed, ["runId", "run_id", "tournamentId", "tournament_id"]);
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
            getErrorMessage2(error)
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
      const parsed = parseJsonPayload2(_payload);
      const runId = readStringField9(parsed, ["runId", "run_id", "tournamentId", "tournament_id"]);
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
      return JSON.stringify(buildRunResponse(_nk, run, getNakamaTournamentById(_nk, run.tournamentId)));
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
      const parsed = parseJsonPayload2(_payload);
      const runId = readStringField9(parsed, ["runId", "run_id", "tournamentId", "tournament_id"]);
      if (!runId) {
        throw new Error("runId is required.");
      }
      const finalized = finalizeTournamentRun(_logger, _nk, runId, {
        limit: readNumberField6(parsed, ["limit"]),
        overrideExpiry: readNumberField6(parsed, ["overrideExpiry", "override_expiry"])
      });
      return JSON.stringify({
        ok: true,
        run: finalized.run,
        nakamaTournament: finalized.nakamaTournament,
        finalSnapshot: finalized.finalSnapshot,
        disabledRanks: finalized.disabledRanks
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
      const parsed = parseJsonPayload2(_payload);
      const runId = readStringField9(parsed, ["runId", "run_id", "tournamentId", "tournament_id"]);
      if (!runId) {
        throw new Error("runId is required.");
      }
      const run = maybeAutoFinalizeAdminRun(_logger, _nk, readRunOrThrow(_nk, runId));
      const nakamaTournament = getNakamaTournamentById(_nk, run.tournamentId);
      const limit = clampInteger(parsed.limit, DEFAULT_STANDINGS_LIMIT, 1, MAX_STANDINGS_LIMIT);
      const overrideExpiry = resolveOverrideExpiry(
        readNumberField6(parsed, ["overrideExpiry", "override_expiry"]),
        nakamaTournament
      );
      const standings = resolveRunStandingsSnapshot(_nk, run, limit, overrideExpiry);
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
      const parsed = parseJsonPayload2(_payload);
      const runId = readStringField9(parsed, ["runId", "run_id", "tournamentId", "tournament_id"]);
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

// backend/modules/tournaments/flow.ts
var TOURNAMENT_PARTICIPANT_FLOWS_COLLECTION = "tournament_participant_flows";
var normalizeFlowState = (value) => {
  if (value === "registered" || value === "pending_match" || value === "in_match" || value === "waiting_next_round" || value === "eliminated" || value === "completed") {
    return value;
  }
  return "registered";
};
var normalizePendingDestination = (value) => {
  const record = asRecord2(value);
  if (!record) {
    return null;
  }
  const type = readStringField9(record, ["type"]);
  const round = readNumberField6(record, ["round"]);
  const normalizedRound = typeof round === "number" && Number.isFinite(round) ? Math.max(1, Math.floor(round)) : null;
  if (type === "match") {
    const matchId = readStringField9(record, ["matchId", "match_id"]);
    return matchId ? { type: "match", matchId, round: normalizedRound } : null;
  }
  if (type === "waiting_room") {
    return { type: "waiting_room", round: normalizedRound };
  }
  return null;
};
var normalizeTournamentParticipantFlow = (value, fallbackRunId, fallbackUserId) => {
  var _a, _b, _c, _d, _e;
  const record = asRecord2(value);
  if (!record) {
    return null;
  }
  const runId = (_a = readStringField9(record, ["runId", "run_id"])) != null ? _a : fallbackRunId;
  const tournamentId = (_b = readStringField9(record, ["tournamentId", "tournament_id"])) != null ? _b : runId;
  const userId = (_c = readStringField9(record, ["userId", "user_id"])) != null ? _c : fallbackUserId;
  const createdAt = readStringField9(record, ["createdAt", "created_at"]);
  const updatedAt = (_d = readStringField9(record, ["updatedAt", "updated_at"])) != null ? _d : createdAt;
  const currentRound = readNumberField6(record, ["currentRound", "current_round"]);
  if (!runId || !tournamentId || !userId || !createdAt || !updatedAt) {
    return null;
  }
  return {
    runId,
    tournamentId,
    userId,
    state: normalizeFlowState(readStringField9(record, ["state"])),
    currentRound: typeof currentRound === "number" && Number.isFinite(currentRound) ? Math.max(1, Math.floor(currentRound)) : null,
    currentMatchId: readStringField9(record, ["currentMatchId", "current_match_id"]),
    pendingDestination: normalizePendingDestination((_e = record.pendingDestination) != null ? _e : record.pending_destination),
    createdAt,
    updatedAt
  };
};
var readParticipantFlowObject = (nk, runId, userId) => {
  const objects = nk.storageRead([
    {
      collection: TOURNAMENT_PARTICIPANT_FLOWS_COLLECTION,
      key: runId,
      userId
    }
  ]);
  return findStorageObject(objects, TOURNAMENT_PARTICIPANT_FLOWS_COLLECTION, runId, userId);
};
var readTournamentParticipantFlow = (nk, runId, userId) => {
  var _a, _b;
  return normalizeTournamentParticipantFlow((_b = (_a = readParticipantFlowObject(nk, runId, userId)) == null ? void 0 : _a.value) != null ? _b : null, runId, userId);
};
var writeParticipantFlow = (nk, record, version = null) => {
  nk.storageWrite([
    maybeSetStorageVersion({
      collection: TOURNAMENT_PARTICIPANT_FLOWS_COLLECTION,
      key: record.runId,
      userId: record.userId,
      value: record,
      permissionRead: STORAGE_PERMISSION_NONE2,
      permissionWrite: STORAGE_PERMISSION_NONE2
    }, version)
  ]);
};
var upsertTournamentParticipantFlow = (nk, run, userId, derive) => {
  var _a, _b;
  for (let attempt = 1; attempt <= MAX_WRITE_ATTEMPTS; attempt += 1) {
    const object = readParticipantFlowObject(nk, run.runId, userId);
    const existing = normalizeTournamentParticipantFlow((_a = object == null ? void 0 : object.value) != null ? _a : null, run.runId, userId);
    const nextRecord = derive(existing, (/* @__PURE__ */ new Date()).toISOString());
    try {
      writeParticipantFlow(nk, nextRecord, (_b = getStorageObjectVersion(object)) != null ? _b : null);
      return nextRecord;
    } catch (error) {
      if (attempt === MAX_WRITE_ATTEMPTS) {
        throw error;
      }
    }
  }
  throw new Error(`Unable to store tournament participant flow for '${run.runId}' and '${userId}'.`);
};
var getRunGameMode = (run) => {
  var _a;
  return (_a = readStringField9(run.metadata, ["gameMode", "game_mode"])) != null ? _a : "standard";
};
var createFlowRecord = (run, userId, state, currentRound, currentMatchId, pendingDestination, existing, now) => {
  var _a;
  return {
    runId: run.runId,
    tournamentId: run.tournamentId,
    userId,
    state,
    currentRound,
    currentMatchId,
    pendingDestination,
    createdAt: (_a = existing == null ? void 0 : existing.createdAt) != null ? _a : now,
    updatedAt: now
  };
};
var setRegisteredTournamentParticipantFlow = (nk, run, userId) => upsertTournamentParticipantFlow(
  nk,
  run,
  userId,
  (existing, now) => createFlowRecord(run, userId, "registered", 1, null, null, existing, now)
);
var isHumanParticipant = (userId) => Boolean(userId && !isTournamentBotUserId(userId));
var getEntryHumanParticipants = (entry) => [entry.playerAUserId, entry.playerBUserId].filter(isHumanParticipant);
var getEntryBotOpponent = (entry, userId) => {
  if (isTournamentBotUserId(entry.playerAUserId) && entry.playerAUserId !== userId) {
    return entry.playerAUserId;
  }
  if (isTournamentBotUserId(entry.playerBUserId) && entry.playerBUserId !== userId) {
    return entry.playerBUserId;
  }
  return null;
};
var ensureTournamentMatchForEntry = (nk, logger, run, entry, requestedByUserId) => {
  var _a, _b;
  if (entry.status === "in_match" && entry.matchId) {
    return run;
  }
  if (entry.status !== "ready") {
    return run;
  }
  if (!entry.playerAUserId || !entry.playerBUserId) {
    return run;
  }
  if (!isHumanParticipant(entry.playerAUserId) && !isHumanParticipant(entry.playerBUserId)) {
    return run;
  }
  const metadata = (_a = asRecord2(run.metadata)) != null ? _a : {};
  const modeId = getRunGameMode(run);
  const rewardSettings = resolveTournamentXpRewardSettings(metadata);
  const botPolicy = normalizeTournamentBotPolicy(run.metadata);
  let createdMatchId = null;
  const launchedAt = (/* @__PURE__ */ new Date()).toISOString();
  const nextRun = updateRunWithRetry(nk, logger, run.runId, (current) => {
    var _a2, _b2;
    if (!current.bracket) {
      return current;
    }
    const currentEntry = getTournamentBracketEntry(current.bracket, entry.entryId);
    if (!currentEntry || currentEntry.matchId || currentEntry.status !== "ready") {
      return current;
    }
    if (!currentEntry.playerAUserId || !currentEntry.playerBUserId) {
      return current;
    }
    const botUserId = getEntryBotOpponent(currentEntry, requestedByUserId);
    const botDisplayName = botUserId ? (_a2 = buildTournamentBotDisplayNames([botUserId], botPolicy.difficulty)[botUserId]) != null ? _a2 : botUserId : null;
    createdMatchId = nk.matchCreate("authoritative_match", __spreadValues({
      playerIds: [currentEntry.playerAUserId, currentEntry.playerBUserId],
      modeId,
      rankedMatch: true,
      casualMatch: false,
      botMatch: Boolean(botUserId),
      privateMatch: false,
      winRewardSource: "pvp_win",
      allowsChallengeRewards: true,
      tournamentRunId: current.runId,
      tournamentId: current.tournamentId,
      tournamentRound: currentEntry.round,
      tournamentEntryId: currentEntry.entryId,
      tournamentMatchWinXp: rewardSettings.xpPerMatchWin,
      tournamentChampionXp: rewardSettings.xpForTournamentChampion,
      tournamentEliminationRisk: true
    }, botUserId ? {
      botDifficulty: (_b2 = botPolicy.difficulty) != null ? _b2 : DEFAULT_BOT_DIFFICULTY,
      botUserId,
      botDisplayName
    } : {}));
    const matchId = createdMatchId;
    if (!matchId) {
      throw new Error("Unable to allocate tournament match.");
    }
    return __spreadProps(__spreadValues({}, current), {
      updatedAt: launchedAt,
      bracket: startTournamentBracketMatch(current.bracket, requestedByUserId, matchId, launchedAt)
    });
  });
  const nextEntry = getTournamentBracketEntry(nextRun.bracket, entry.entryId);
  const resolvedMatchId = (_b = nextEntry == null ? void 0 : nextEntry.matchId) != null ? _b : createdMatchId;
  if (resolvedMatchId) {
    logger.info(
      "Tournament dispatch prepared match %s for run %s entry %s.",
      resolvedMatchId,
      nextRun.runId,
      entry.entryId
    );
  }
  return nextRun;
};
var ensureReadyTournamentMatchesForRun = (nk, logger, run) => {
  var _a, _b;
  let currentRun = run;
  const readyEntries = (_b = (_a = run.bracket) == null ? void 0 : _a.entries.filter((entry) => entry.status === "ready" && !entry.matchId)) != null ? _b : [];
  readyEntries.forEach((entry) => {
    var _a2;
    const requestedByUserId = (_a2 = getEntryHumanParticipants(entry)[0]) != null ? _a2 : null;
    if (!requestedByUserId) {
      return;
    }
    currentRun = ensureTournamentMatchForEntry(nk, logger, currentRun, entry, requestedByUserId);
  });
  return currentRun;
};
var resolveParticipantActiveEntry = (run, participant) => {
  var _a;
  const currentEntry = participant.currentEntryId ? getTournamentBracketEntry(run.bracket, participant.currentEntryId) : null;
  const activeEntry = participant.activeMatchId ? getTournamentBracketEntryByMatchId(run.bracket, participant.activeMatchId) : null;
  return (_a = activeEntry != null ? activeEntry : currentEntry) != null ? _a : null;
};
var deriveFlowFromRun = (run, userId, existing, now) => {
  var _a, _b, _c, _d;
  if (!run.bracket) {
    return createFlowRecord(run, userId, "registered", 1, null, null, existing, now);
  }
  const participant = getTournamentBracketParticipant(run.bracket, userId);
  if (!participant) {
    return createFlowRecord(
      run,
      userId,
      "registered",
      getTournamentBracketCurrentRound(run.bracket),
      null,
      null,
      existing,
      now
    );
  }
  if (participant.state === "eliminated") {
    return createFlowRecord(
      run,
      userId,
      "eliminated",
      participant.currentRound,
      null,
      null,
      existing,
      now
    );
  }
  if (participant.state === "champion" || participant.state === "runner_up" || run.lifecycle === "closed" || run.lifecycle === "finalized" || run.finalizedAt != null || run.bracket.finalizedAt != null) {
    return createFlowRecord(
      run,
      userId,
      "completed",
      participant.currentRound,
      null,
      null,
      existing,
      now
    );
  }
  const activeEntry = resolveParticipantActiveEntry(run, participant);
  const activeMatchId = (_b = (_a = participant.activeMatchId) != null ? _a : activeEntry == null ? void 0 : activeEntry.matchId) != null ? _b : null;
  const activeRound = (_d = (_c = activeEntry == null ? void 0 : activeEntry.round) != null ? _c : participant.currentRound) != null ? _d : getTournamentBracketCurrentRound(run.bracket);
  if (activeMatchId) {
    return createFlowRecord(
      run,
      userId,
      (existing == null ? void 0 : existing.state) === "in_match" ? "in_match" : "pending_match",
      activeRound,
      activeMatchId,
      {
        type: "match",
        matchId: activeMatchId,
        round: activeRound
      },
      existing,
      now
    );
  }
  return createFlowRecord(
    run,
    userId,
    "waiting_next_round",
    activeRound,
    null,
    {
      type: "waiting_room",
      round: activeRound
    },
    existing,
    now
  );
};
var syncTournamentParticipantFlow = (nk, run, userId) => upsertTournamentParticipantFlow(
  nk,
  run,
  userId,
  (existing, now) => deriveFlowFromRun(run, userId, existing, now)
);
var syncTournamentParticipantFlowsForRun = (nk, run) => {
  var _a, _b;
  const userIds = Array.from(
    new Set(
      [
        ...run.registrations.map((registration) => registration.userId),
        ...(_b = (_a = run.bracket) == null ? void 0 : _a.participants.map((participant) => participant.userId)) != null ? _b : []
      ].filter(isHumanParticipant)
    )
  );
  userIds.forEach((userId) => {
    syncTournamentParticipantFlow(nk, run, userId);
  });
};
var ensureTournamentMatchDispatchForParticipant = (nk, logger, run, userId) => {
  let nextRun = ensureReadyTournamentMatchesForRun(nk, logger, run);
  const flow = syncTournamentParticipantFlow(nk, nextRun, userId);
  return {
    run: nextRun,
    flow
  };
};
var markTournamentParticipantFlowInMatch = (nk, run, userId, matchId) => upsertTournamentParticipantFlow(nk, run, userId, (existing, now) => {
  var _a;
  const currentRound = (_a = existing == null ? void 0 : existing.currentRound) != null ? _a : getTournamentBracketCurrentRound(run.bracket);
  return createFlowRecord(
    run,
    userId,
    "in_match",
    currentRound,
    matchId,
    {
      type: "match",
      matchId,
      round: currentRound
    },
    existing,
    now
  );
});
var buildTournamentParticipantFlowResponse = (run, flow) => __spreadProps(__spreadValues({}, flow), {
  tournamentName: run.title,
  gameMode: getRunGameMode(run)
});
var isActiveTournamentParticipantFlow = (flow) => Boolean(
  flow && (flow.state === "pending_match" || flow.state === "in_match" || flow.state === "waiting_next_round") && flow.pendingDestination
);

// backend/modules/tournaments/matchResults.ts
var TOURNAMENT_RUNS_COLLECTION = "tournament_runs";
var TOURNAMENT_MATCH_RESULTS_COLLECTION2 = "tournament_match_results";
var normalizeMetadata = (value) => {
  var _a;
  return (_a = asRecord2(value)) != null ? _a : {};
};
var readStringArrayField3 = (value, keys) => {
  const record = asRecord2(value);
  if (!record) {
    return [];
  }
  for (const key of keys) {
    const field = record[key];
    if (!Array.isArray(field)) {
      continue;
    }
    return field.filter((entry) => typeof entry === "string" && entry.trim().length > 0);
  }
  return [];
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
  const value = (_a = asRecord2(object == null ? void 0 : object.value)) != null ? _a : null;
  return {
    object,
    value,
    run: normalizeRunRecord((_b = object == null ? void 0 : object.value) != null ? _b : null, runId)
  };
};
var readTournamentMatchResultObject = (nk, resultId) => {
  const objects = nk.storageRead([
    {
      collection: TOURNAMENT_MATCH_RESULTS_COLLECTION2,
      key: resultId
    }
  ]);
  return findStorageObject(objects, TOURNAMENT_MATCH_RESULTS_COLLECTION2, resultId);
};
var normalizeTournamentMatchResultRecord = (value) => {
  const record = asRecord2(value);
  if (!record) {
    return null;
  }
  const resultId = readStringField9(record, ["resultId", "result_id"]);
  const matchId = readStringField9(record, ["matchId", "match_id"]);
  const runId = readStringField9(record, ["runId", "run_id"]);
  const tournamentId = readStringField9(record, ["tournamentId", "tournament_id"]);
  if (!resultId || !matchId || !runId || !tournamentId) {
    return null;
  }
  return record;
};
var readTournamentMatchResultState = (nk, resultId) => {
  var _a;
  const object = readTournamentMatchResultObject(nk, resultId);
  return {
    object,
    record: normalizeTournamentMatchResultRecord((_a = object == null ? void 0 : object.value) != null ? _a : null)
  };
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
  var _a, _b, _c;
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
  if (completion.classification.bot && !completion.players.some((player) => isTournamentBotUserId(player.userId))) {
    return "Bot matches do not count toward tournaments.";
  }
  if (completion.classification.casual) {
    return "Casual matches do not count toward tournaments.";
  }
  if (completion.classification.experimental) {
    return "Experimental matches do not count toward tournaments.";
  }
  if (completion.totalMoves < 1 && ((_a = completion.context) == null ? void 0 : _a.eliminationRisk) !== true) {
    return "Matches without at least one applied move do not count toward tournaments.";
  }
  if (!run) {
    return `Tournament run '${(_c = (_b = completion.context) == null ? void 0 : _b.runId) != null ? _c : ""}' was not found.`;
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
  return (_a = asRecord2(entry)) != null ? _a : {};
}).filter((entry) => Object.keys(entry).length > 0) : [];
var resolveUsernames = (nk, logger, players, run) => {
  const usernames = {};
  const tournamentBotDisplayNames = run ? buildTournamentBotDisplayNames(
    players.map((player) => player.userId),
    normalizeTournamentBotPolicy(run.metadata).difficulty
  ) : {};
  players.forEach((player) => {
    var _a;
    if (tournamentBotDisplayNames[player.userId]) {
      usernames[player.userId] = tournamentBotDisplayNames[player.userId];
      return;
    }
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
        const userId = readStringField9(user, ["userId", "user_id", "id"]);
        const username = readStringField9(user, ["username", "displayName", "display_name"]);
        if (userId && username) {
          usernames[userId] = username;
        }
      });
    } catch (error) {
      logger.warn(
        "Unable to resolve tournament usernames for %s: %s",
        unresolvedUserIds.join(","),
        getErrorMessage2(error)
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
var isIgnorableTournamentJoinError = (error) => {
  const message = getErrorMessage2(error);
  return /already|joined|duplicate|exists|member/i.test(message);
};
var ensureTournamentJoined = (nk, logger, run, players, usernames) => {
  if (!run.joinRequired) {
    return;
  }
  const registeredUserIds = new Set(
    run.registrations.map((registration) => registration.userId.trim()).filter((userId) => userId.length > 0)
  );
  players.forEach((player) => {
    var _a;
    if (registeredUserIds.has(player.userId)) {
      return;
    }
    try {
      nk.tournamentJoin(run.tournamentId, player.userId, (_a = usernames[player.userId]) != null ? _a : player.userId);
    } catch (error) {
      if (isIgnorableTournamentJoinError(error)) {
        logger.info(
          "Skipping redundant tournamentJoin for run %s user %s: %s",
          run.runId,
          player.userId,
          getErrorMessage2(error)
        );
        return;
      }
      throw error;
    }
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
      result: (_i = asRecord2(record)) != null ? _i : null
    };
  });
};
var writeTournamentMatchResultRecord = (nk, record, version = null) => {
  nk.storageWrite([
    maybeSetStorageVersion({
      collection: TOURNAMENT_MATCH_RESULTS_COLLECTION2,
      key: record.resultId,
      value: record,
      permissionRead: STORAGE_PERMISSION_NONE2,
      permissionWrite: STORAGE_PERMISSION_NONE2
    }, version)
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
    const currentCountedResultIds = readStringArrayField3(currentMetadata, [
      "countedResultIds",
      "counted_result_ids"
    ]);
    const countedResultIds = new Set(currentCountedResultIds);
    const alreadyCounted = countedResultIds.has(result.resultId);
    const currentCount = Math.max(
      0,
      Math.max(
        currentCountedResultIds.length,
        Math.floor((_a = readNumberField6(currentMetadata, ["countedMatchCount", "validMatchCount"])) != null ? _a : 0)
      )
    );
    if (result.counted) {
      countedResultIds.add(result.resultId);
    }
    const nextMetadata = __spreadProps(__spreadValues({}, currentMetadata), {
      countedMatchCount: result.counted && !alreadyCounted ? currentCount + 1 : currentCount,
      countedResultIds: Array.from(countedResultIds),
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
          permissionRead: STORAGE_PERMISSION_NONE2,
          permissionWrite: STORAGE_PERMISSION_NONE2
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
        getErrorMessage2(error)
      );
    }
  }
};
var readTournamentEntrantCount = (value) => {
  const entrants = readNumberField6(value, ["size", "maxSize", "max_size"]);
  return typeof entrants === "number" && Number.isFinite(entrants) ? Math.max(0, Math.floor(entrants)) : 0;
};
var resolveTournamentRunModeId = (run) => {
  const modeId = readStringField9(run.metadata, ["gameMode", "game_mode"]);
  return modeId != null ? modeId : "standard";
};
var buildBotOnlyTournamentCompletion = (run, entryId) => {
  var _a, _b, _c;
  if (!run.bracket) {
    return null;
  }
  const entry = (_a = run.bracket.entries.find((candidate) => candidate.entryId === entryId)) != null ? _a : null;
  if (!entry || entry.status !== "ready" || entry.matchId || !isTournamentBotUserId(entry.playerAUserId) || !isTournamentBotUserId(entry.playerBUserId)) {
    return null;
  }
  const participantA = getTournamentBracketParticipant(run.bracket, entry.playerAUserId);
  const participantB = getTournamentBracketParticipant(run.bracket, entry.playerBUserId);
  const botDisplayNames = buildTournamentBotDisplayNames(
    [entry.playerAUserId, entry.playerBUserId],
    normalizeTournamentBotPolicy(run.metadata).difficulty
  );
  const winnerUserId = participantA && participantB ? participantA.seed <= participantB.seed ? participantA.userId : participantB.userId : entry.playerAUserId;
  const loserUserId = winnerUserId === entry.playerAUserId ? entry.playerBUserId : entry.playerAUserId;
  const winningColor = winnerUserId === entry.playerAUserId ? "light" : "dark";
  const completedAt = (/* @__PURE__ */ new Date()).toISOString();
  return {
    matchId: `tournament-bot-match:${run.runId}:${entry.entryId}`,
    modeId: resolveTournamentRunModeId(run),
    context: {
      runId: run.runId,
      tournamentId: run.tournamentId,
      round: entry.round,
      entryId: entry.entryId,
      eliminationRisk: true
    },
    completedAt,
    totalMoves: 1,
    revision: 1,
    winningColor,
    winnerUserId,
    loserUserId,
    classification: {
      ranked: false,
      casual: false,
      private: false,
      bot: true,
      experimental: false
    },
    players: [
      {
        userId: entry.playerAUserId,
        username: (_b = botDisplayNames[entry.playerAUserId]) != null ? _b : entry.playerAUserId,
        color: "light",
        didWin: winnerUserId === entry.playerAUserId,
        score: winnerUserId === entry.playerAUserId ? 1 : 0,
        finishedCount: winnerUserId === entry.playerAUserId ? 7 : 4,
        capturesMade: 0,
        capturesSuffered: 0,
        playerMoveCount: winnerUserId === entry.playerAUserId ? 1 : 0
      },
      {
        userId: entry.playerBUserId,
        username: (_c = botDisplayNames[entry.playerBUserId]) != null ? _c : entry.playerBUserId,
        color: "dark",
        didWin: winnerUserId === entry.playerBUserId,
        score: winnerUserId === entry.playerBUserId ? 1 : 0,
        finishedCount: winnerUserId === entry.playerBUserId ? 7 : 4,
        capturesMade: 0,
        capturesSuffered: 0,
        playerMoveCount: winnerUserId === entry.playerBUserId ? 1 : 0
      }
    ]
  };
};
var processPendingBotOnlyTournamentMatches = (nk, logger, runId) => {
  var _a, _b, _c, _d, _e;
  let currentRun = readTournamentRunState(nk, runId).run;
  const maxIterations = Math.max(1, (_b = (_a = currentRun == null ? void 0 : currentRun.bracket) == null ? void 0 : _a.entries.length) != null ? _b : 1);
  for (let iteration = 0; iteration < maxIterations; iteration += 1) {
    if (!(currentRun == null ? void 0 : currentRun.bracket) || currentRun.lifecycle !== "open" || currentRun.bracket.finalizedAt) {
      break;
    }
    const readyBotOnlyEntry = currentRun.bracket.entries.find(
      (entry) => entry.status === "ready" && !entry.matchId && isTournamentBotUserId(entry.playerAUserId) && isTournamentBotUserId(entry.playerBUserId)
    );
    if (!readyBotOnlyEntry) {
      break;
    }
    const completion = buildBotOnlyTournamentCompletion(currentRun, readyBotOnlyEntry.entryId);
    if (!completion) {
      break;
    }
    const result = processCompletedAuthoritativeTournamentMatch(nk, logger, completion);
    currentRun = (_e = (_d = (_c = result.finalizationResult) == null ? void 0 : _c.run) != null ? _d : result.updatedRun) != null ? _e : readTournamentRunState(nk, runId).run;
    if (result.retryableFailure) {
      break;
    }
  }
  return currentRun;
};
var updateTournamentRunBracket = (nk, logger, completion) => {
  if (!completion.context || !completion.winnerUserId || !completion.loserUserId) {
    return null;
  }
  return updateRunWithRetry(nk, logger, completion.context.runId, (current) => {
    var _a, _b, _c, _d;
    if (!current.bracket) {
      return current;
    }
    const nextBracket = completeTournamentBracketMatch(current.bracket, {
      entryId: (_b = (_a = completion.context) == null ? void 0 : _a.entryId) != null ? _b : null,
      matchId: completion.matchId,
      winnerUserId: (_c = completion.winnerUserId) != null ? _c : "",
      loserUserId: (_d = completion.loserUserId) != null ? _d : "",
      completedAt: completion.completedAt
    });
    return __spreadProps(__spreadValues({}, current), {
      updatedAt: completion.completedAt,
      bracket: nextBracket
    });
  });
};
var maybeAutoFinalizeTournamentRunById = (nk, logger, runId) => {
  var _a, _b, _c;
  const runState = readTournamentRunState(nk, runId);
  let run = runState.run;
  if (!run || run.lifecycle === "finalized") {
    return null;
  }
  if (run.bracket && !run.bracket.finalizedAt) {
    run = (_a = processPendingBotOnlyTournamentMatches(nk, logger, runId)) != null ? _a : run;
  }
  if ((_b = run.bracket) == null ? void 0 : _b.finalizedAt) {
    try {
      const result = finalizeTournamentRun(logger, nk, run.runId, {});
      logger.info(
        "Auto-finalized tournament run %s after bracket completion.",
        result.run.runId
      );
      return result;
    } catch (error) {
      logger.warn(
        "Unable to auto-finalize tournament run %s after bracket completion: %s",
        run.runId,
        getErrorMessage2(error)
      );
    }
    return null;
  }
  const countedMatchCount = Math.max(
    0,
    Math.floor((_c = readNumberField6(run.metadata, ["countedMatchCount", "validMatchCount"])) != null ? _c : 0)
  );
  const entrantCount = readTournamentEntrantCount(getNakamaTournamentById(nk, run.tournamentId));
  if (entrantCount < 2 || countedMatchCount < entrantCount - 1) {
    return null;
  }
  try {
    const result = finalizeTournamentRun(logger, nk, run.runId, {});
    logger.info(
      "Auto-finalized tournament run %s after %d counted matches for %d entrants.",
      result.run.runId,
      countedMatchCount,
      entrantCount
    );
    return result;
  } catch (error) {
    logger.warn(
      "Unable to auto-finalize tournament run %s after match completion: %s",
      run.runId,
      getErrorMessage2(error)
    );
  }
  return null;
};
var logRetryableTournamentSyncFailure = (logger, completion, stage, error) => {
  var _a, _b, _c, _d;
  logger.warn(
    "Deferring tournament synchronization for run %s match %s entry %s during %s: %s",
    (_b = (_a = completion.context) == null ? void 0 : _a.runId) != null ? _b : "",
    completion.matchId,
    (_d = (_c = completion.context) == null ? void 0 : _c.entryId) != null ? _d : "",
    stage,
    getErrorMessage2(error)
  );
};
var synchronizeTournamentRunFromRecord = (nk, logger, completion, record, fallbackRun) => {
  var _a, _b, _c, _d, _e;
  let updatedRun = fallbackRun;
  let finalizationResult = null;
  const shouldAdvanceBracket = record.valid === true && !record.invalidReason && Boolean(completion.winnerUserId) && Boolean(completion.loserUserId);
  try {
    updateTournamentRunMetadata(nk, logger, record.runId, record);
    updatedRun = (_a = readTournamentRunState(nk, record.runId).run) != null ? _a : updatedRun;
  } catch (error) {
    logRetryableTournamentSyncFailure(logger, completion, "run_metadata", error);
    return {
      updatedRun,
      finalizationResult: null,
      retryableFailure: true
    };
  }
  if (shouldAdvanceBracket) {
    try {
      updatedRun = (_c = (_b = updateTournamentRunBracket(nk, logger, completion)) != null ? _b : readTournamentRunState(nk, record.runId).run) != null ? _c : updatedRun;
      if (updatedRun) {
        updatedRun = ensureReadyTournamentMatchesForRun(nk, logger, updatedRun);
        syncTournamentParticipantFlowsForRun(nk, updatedRun);
      }
    } catch (error) {
      logRetryableTournamentSyncFailure(logger, completion, "bracket_update", error);
      return {
        updatedRun,
        finalizationResult: null,
        retryableFailure: true
      };
    }
    try {
      finalizationResult = maybeAutoFinalizeTournamentRunById(nk, logger, record.runId);
    } catch (error) {
      logRetryableTournamentSyncFailure(logger, completion, "auto_finalization", error);
      return {
        updatedRun,
        finalizationResult: null,
        retryableFailure: true
      };
    }
  }
  updatedRun = (_e = (_d = finalizationResult == null ? void 0 : finalizationResult.run) != null ? _d : readTournamentRunState(nk, record.runId).run) != null ? _e : updatedRun;
  return {
    updatedRun,
    finalizationResult,
    retryableFailure: false
  };
};
var buildParticipantResolutions = (run, players) => players.map((player) => {
  var _a, _b, _c;
  const participant = getTournamentBracketParticipant((_a = run == null ? void 0 : run.bracket) != null ? _a : null, player.userId);
  return {
    userId: player.userId,
    state: (_b = participant == null ? void 0 : participant.state) != null ? _b : null,
    finalPlacement: (_c = participant == null ? void 0 : participant.finalPlacement) != null ? _c : null
  };
});
var resolveTournamentMatchContextFromParams = (params) => {
  var _a, _b;
  const runId = readStringField9(params, ["tournamentRunId", "tournament_run_id", "runId", "run_id"]);
  const tournamentId = readStringField9(params, ["tournamentId", "tournament_id"]);
  if (!runId && !tournamentId) {
    return null;
  }
  const normalizedRunId = (_a = runId != null ? runId : tournamentId) != null ? _a : null;
  if (!normalizedRunId) {
    return null;
  }
  const round = readNumberField6(params, ["tournamentRound", "tournament_round", "round"]);
  return {
    runId: normalizedRunId,
    tournamentId: tournamentId != null ? tournamentId : normalizedRunId,
    round: typeof round === "number" && Number.isFinite(round) ? Math.max(1, Math.floor(round)) : null,
    entryId: (_b = readStringField9(params, [
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
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m;
  if (!completion.context) {
    return {
      skipped: true,
      duplicate: false,
      record: null,
      updatedRun: null,
      participantResolutions: [],
      finalizationResult: null,
      retryableFailure: false
    };
  }
  const resultId = buildTournamentMatchResultId(completion.context, completion.matchId);
  const existingResultState = readTournamentMatchResultState(nk, resultId);
  const existingRecord = existingResultState.record;
  const canRetryPendingRecord = (existingRecord == null ? void 0 : existingRecord.valid) === true && existingRecord.counted === false && existingRecord.invalidReason === null;
  if (existingRecord && !canRetryPendingRecord) {
    logger.info("Skipping duplicate tournament result for %s", resultId);
    const duplicateRun = readTournamentRunState(nk, completion.context.runId).run;
    const duplicateSync = existingRecord.counted ? synchronizeTournamentRunFromRecord(nk, logger, completion, existingRecord, duplicateRun) : {
      updatedRun: duplicateRun,
      finalizationResult: null,
      retryableFailure: false
    };
    const resolvedRun = (_c = (_b = (_a = duplicateSync.finalizationResult) == null ? void 0 : _a.run) != null ? _b : duplicateSync.updatedRun) != null ? _c : duplicateRun;
    return {
      skipped: false,
      duplicate: true,
      record: existingRecord,
      updatedRun: resolvedRun,
      participantResolutions: buildParticipantResolutions(resolvedRun, completion.players),
      finalizationResult: duplicateSync.finalizationResult,
      retryableFailure: duplicateSync.retryableFailure
    };
  }
  const runState = readTournamentRunState(nk, completion.context.runId);
  const invalidReason = buildInvalidReason(completion, runState.run);
  let tournamentRecordWrites = [];
  let errorMessage = null;
  if (!invalidReason && runState.run) {
    try {
      const usernames = resolveUsernames(nk, logger, completion.players, runState.run);
      ensureTournamentJoined(nk, logger, runState.run, completion.players, usernames);
      tournamentRecordWrites = submitTournamentScores(nk, runState.run, completion, usernames);
    } catch (error) {
      logRetryableTournamentSyncFailure(logger, completion, "score_sync", error);
      if (!((_d = runState.run) == null ? void 0 : _d.bracket) || !completion.winnerUserId || !completion.loserUserId) {
        return {
          skipped: false,
          duplicate: canRetryPendingRecord,
          record: existingRecord,
          updatedRun: runState.run,
          participantResolutions: buildParticipantResolutions(runState.run, completion.players),
          finalizationResult: null,
          retryableFailure: true
        };
      }
      errorMessage = getErrorMessage2(error);
    }
  }
  const record = {
    resultId,
    matchId: completion.matchId,
    runId: completion.context.runId,
    tournamentId: (_f = (_e = runState.run) == null ? void 0 : _e.tournamentId) != null ? _f : completion.context.tournamentId,
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
    writeTournamentMatchResultRecord(
      nk,
      record,
      (_g = getStorageObjectVersion(existingResultState.object)) != null ? _g : null
    );
  } catch (error) {
    const concurrentResultState = readTournamentMatchResultState(nk, resultId);
    if (concurrentResultState.record) {
      logger.info("Skipping duplicate tournament result after concurrent write for %s", resultId);
      const duplicateRun = readTournamentRunState(nk, completion.context.runId).run;
      const duplicateSync = concurrentResultState.record.counted ? synchronizeTournamentRunFromRecord(nk, logger, completion, concurrentResultState.record, duplicateRun) : {
        updatedRun: duplicateRun,
        finalizationResult: null,
        retryableFailure: false
      };
      const resolvedRun = (_j = (_i = (_h = duplicateSync.finalizationResult) == null ? void 0 : _h.run) != null ? _i : duplicateSync.updatedRun) != null ? _j : duplicateRun;
      return {
        skipped: false,
        duplicate: true,
        record: concurrentResultState.record,
        updatedRun: resolvedRun,
        participantResolutions: buildParticipantResolutions(resolvedRun, completion.players),
        finalizationResult: duplicateSync.finalizationResult,
        retryableFailure: duplicateSync.retryableFailure
      };
    }
    throw error;
  }
  const synchronizedRunState = runState.run ? synchronizeTournamentRunFromRecord(nk, logger, completion, record, runState.run) : {
    updatedRun: runState.run,
    finalizationResult: null,
    retryableFailure: false
  };
  const updatedRun = (_m = (_l = (_k = synchronizedRunState.finalizationResult) == null ? void 0 : _k.run) != null ? _l : synchronizedRunState.updatedRun) != null ? _m : runState.run;
  return {
    skipped: false,
    duplicate: false,
    record,
    updatedRun,
    participantResolutions: buildParticipantResolutions(updatedRun, completion.players),
    finalizationResult: synchronizedRunState.finalizationResult,
    retryableFailure: synchronizedRunState.retryableFailure
  };
};

// backend/modules/tournaments/export.ts
var RPC_ADMIN_EXPORT_TOURNAMENT = "rpc_admin_export_tournament";
var readTournamentAuditEntries = (nk, runId) => {
  var _a, _b;
  const objects = nk.storageRead([
    {
      collection: TOURNAMENT_AUDIT_COLLECTION,
      key: TOURNAMENT_AUDIT_LOG_KEY
    }
  ]);
  const log = asRecord2(
    (_b = (_a = findStorageObject(objects, TOURNAMENT_AUDIT_COLLECTION, TOURNAMENT_AUDIT_LOG_KEY)) == null ? void 0 : _a.value) != null ? _b : null
  );
  const entries = Array.isArray(log == null ? void 0 : log.entries) ? log.entries : [];
  return entries.map((entry) => {
    var _a2;
    return (_a2 = asRecord2(entry)) != null ? _a2 : null;
  }).filter((entry) => Boolean(entry)).filter((entry) => {
    const targetId = readStringField9(entry, ["targetId", "target_id"]);
    const tournamentId = readStringField9(entry, ["tournamentId", "tournament_id"]);
    return targetId === runId || tournamentId === runId;
  });
};
var readTournamentMatchResults = (nk, resultIds) => {
  if (resultIds.length === 0) {
    return [];
  }
  const objects = nk.storageRead(
    resultIds.map((resultId) => ({
      collection: TOURNAMENT_MATCH_RESULTS_COLLECTION2,
      key: resultId
    }))
  );
  return resultIds.map(
    (resultId) => {
      var _a, _b;
      return asRecord2((_b = (_a = findStorageObject(objects, TOURNAMENT_MATCH_RESULTS_COLLECTION2, resultId)) == null ? void 0 : _a.value) != null ? _b : null);
    }
  ).filter((entry) => Boolean(entry));
};
var resolveExportableRun = (logger, nk, runId) => {
  var _a;
  const existingRun = readRunOrThrow(nk, runId);
  if (existingRun.lifecycle === "finalized") {
    return existingRun;
  }
  if ((_a = existingRun.bracket) == null ? void 0 : _a.finalizedAt) {
    return finalizeTournamentRun(logger, nk, runId, {}).run;
  }
  throw new Error("Tournament export is only available after the run is finalized.");
};
var resolveFinalStandingsSnapshot = (nk, run, nakamaTournament) => {
  var _a, _b, _c;
  if (run.finalSnapshot) {
    return run.finalSnapshot;
  }
  const participantCount = (_c = (_b = (_a = run.bracket) == null ? void 0 : _a.participants.length) != null ? _b : run.registrations.length) != null ? _c : Math.max(1, run.maxSize);
  return resolveRunStandingsSnapshot(
    nk,
    run,
    Math.max(1, participantCount),
    resolveOverrideExpiry(null, nakamaTournament)
  );
};
var rpcAdminExportTournament = (ctx, logger, nk, payload) => {
  return runAuditedAdminRpc(
    (_ctx, _logger, _nk, _payload) => {
      assertAdmin(_ctx, "viewer", _nk);
      const parsed = parseJsonPayload2(_payload);
      const runId = readStringField9(parsed, ["runId", "run_id", "tournamentId", "tournament_id"]);
      if (!runId) {
        throw new Error("runId is required.");
      }
      const run = resolveExportableRun(_logger, _nk, runId);
      const nakamaTournament = getNakamaTournamentById(_nk, run.tournamentId);
      const standings = resolveFinalStandingsSnapshot(_nk, run, nakamaTournament);
      const countedResultIds = readStringArrayField(run.metadata, [
        "countedResultIds",
        "counted_result_ids"
      ]);
      const lastProcessedResultId = readStringField9(run.metadata, [
        "lastProcessedResultId",
        "last_processed_result_id"
      ]);
      const resultIds = Array.from(
        new Set(
          countedResultIds.concat(
            lastProcessedResultId && !countedResultIds.includes(lastProcessedResultId) ? [lastProcessedResultId] : []
          )
        )
      );
      return JSON.stringify({
        ok: true,
        exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
        run,
        nakamaTournament,
        standings,
        auditEntries: readTournamentAuditEntries(_nk, run.runId),
        matchResults: readTournamentMatchResults(_nk, resultIds)
      });
    },
    {
      action: RPC_ADMIN_EXPORT_TOURNAMENT
    },
    ctx,
    logger,
    nk,
    payload
  );
};

// backend/modules/tournaments/liveStatus.ts
var RPC_ADMIN_GET_TOURNAMENT_LIVE_STATUS = "rpc_admin_get_tournament_live_status";
var STARTING_SOON_WINDOW_MS = 60 * 60 * 1e3;
var READY_STALE_WINDOW_MS = 10 * 60 * 1e3;
var IN_MATCH_STALE_WINDOW_MS = 25 * 60 * 1e3;
var RECENT_RUN_WINDOW_MS = 72 * 60 * 60 * 1e3;
var DEFAULT_OVERVIEW_LIMIT = 12;
var MAX_OVERVIEW_LIMIT = 50;
var OVERVIEW_TIMELINE_BUCKET_COUNT = 8;
var OVERVIEW_TIMELINE_BUCKET_HOURS = 6;
var DETAIL_TIMELINE_BUCKET_COUNT = 8;
var DETAIL_TIMELINE_BUCKET_HOURS = 3;
var parseIsoMs2 = (value) => {
  if (!value) {
    return null;
  }
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
};
var maxIso = (...values) => {
  const timestamps = values.map((value) => typeof value === "string" ? parseIsoMs2(value) : null).filter((value) => value !== null);
  if (timestamps.length === 0) {
    return null;
  }
  return new Date(Math.max(...timestamps)).toISOString();
};
var toIsoFromUnixSeconds = (seconds) => {
  if (typeof seconds !== "number" || !Number.isFinite(seconds) || seconds <= 0) {
    return null;
  }
  return new Date(seconds * 1e3).toISOString();
};
var formatCountLabel = (count, singular, plural = `${singular}s`) => `${count} ${count === 1 ? singular : plural}`;
var describeElapsedMinutes = (durationMs) => {
  const minutes = Math.max(1, Math.round(durationMs / 6e4));
  return `${minutes} minute${minutes === 1 ? "" : "s"}`;
};
var buildParticipantNameMap = (run) => {
  var _a, _b;
  const names = /* @__PURE__ */ new Map();
  run.registrations.forEach((registration) => {
    names.set(registration.userId, registration.displayName);
  });
  (_a = run.bracket) == null ? void 0 : _a.participants.forEach((participant) => {
    names.set(participant.userId, participant.displayName);
  });
  (_b = run.finalSnapshot) == null ? void 0 : _b.records.forEach((record) => {
    const normalized = asRecord2(record);
    const ownerId = readStringField9(normalized, ["ownerId", "owner_id"]);
    const username = readStringField9(normalized, ["username"]);
    if (ownerId && username) {
      names.set(ownerId, username);
    }
  });
  return names;
};
var getEntrantCount = (run, nakamaTournament) => {
  const nakamaSize = readNumberField6(nakamaTournament, ["size", "size"]);
  return Math.max(
    run.registrations.length,
    typeof nakamaSize === "number" && Number.isFinite(nakamaSize) ? Math.floor(nakamaSize) : 0
  );
};
var createEmptyParticipantStateCounts = () => ({
  lobby: 0,
  inMatch: 0,
  waitingNextRound: 0,
  eliminated: 0,
  runnerUp: 0,
  champion: 0
});
var incrementParticipantStateCount = (counts, state) => {
  if (state === "in_match") {
    counts.inMatch += 1;
    return;
  }
  if (state === "waiting_next_round") {
    counts.waitingNextRound += 1;
    return;
  }
  if (state === "eliminated") {
    counts.eliminated += 1;
    return;
  }
  if (state === "runner_up") {
    counts.runnerUp += 1;
    return;
  }
  if (state === "champion") {
    counts.champion += 1;
    return;
  }
  counts.lobby += 1;
};
var buildParticipantStateCounts = (run) => {
  var _a, _b;
  const counts = createEmptyParticipantStateCounts();
  const participants = (_b = (_a = run.bracket) == null ? void 0 : _a.participants) != null ? _b : [];
  if (participants.length === 0) {
    counts.lobby = run.registrations.length;
    return counts;
  }
  participants.forEach((participant) => {
    incrementParticipantStateCount(counts, participant.state);
  });
  return counts;
};
var getRoundLabel = (round, totalRounds) => {
  if (typeof totalRounds === "number" && round === totalRounds) {
    return "Final";
  }
  return `Round ${round}`;
};
var getEntryDurationSeconds = (entry) => {
  const startedAtMs = parseIsoMs2(entry.startedAt);
  const completedAtMs = parseIsoMs2(entry.completedAt);
  if (startedAtMs === null || completedAtMs === null || completedAtMs < startedAtMs) {
    return null;
  }
  return Math.floor((completedAtMs - startedAtMs) / 1e3);
};
var isReadyEntryStale = (entry, nowMs) => {
  var _a;
  if (entry.status !== "ready") {
    return false;
  }
  const readyAtMs = parseIsoMs2((_a = entry.readyAt) != null ? _a : entry.updatedAt);
  return readyAtMs !== null && nowMs - readyAtMs >= READY_STALE_WINDOW_MS;
};
var isInMatchEntryStale = (entry, nowMs) => {
  var _a;
  if (entry.status !== "in_match") {
    return false;
  }
  const startedAtMs = parseIsoMs2((_a = entry.startedAt) != null ? _a : entry.updatedAt);
  return startedAtMs !== null && nowMs - startedAtMs >= IN_MATCH_STALE_WINDOW_MS;
};
var buildEntryBlockedReason = (entry, nameByUserId) => {
  var _a, _b;
  if (entry.status === "pending") {
    if (entry.playerAUserId && !entry.playerBUserId) {
      return `${(_a = nameByUserId.get(entry.playerAUserId)) != null ? _a : entry.playerAUserId} is waiting for an opponent.`;
    }
    if (!entry.playerAUserId && entry.playerBUserId) {
      return `${(_b = nameByUserId.get(entry.playerBUserId)) != null ? _b : entry.playerBUserId} is waiting for an opponent.`;
    }
    if (entry.sourceEntryIds.length > 0) {
      return `Waiting for winners from ${entry.sourceEntryIds.join(", ")}.`;
    }
    return "Waiting for the bracket to resolve upstream results.";
  }
  return null;
};
var buildEntryStaleReason = (entry, nowMs) => {
  var _a, _b;
  if (entry.status === "ready") {
    const readyAtMs = parseIsoMs2((_a = entry.readyAt) != null ? _a : entry.updatedAt);
    if (readyAtMs !== null && nowMs - readyAtMs >= READY_STALE_WINDOW_MS) {
      return `Ready for ${describeElapsedMinutes(nowMs - readyAtMs)} without a match launch.`;
    }
  }
  if (entry.status === "in_match") {
    const startedAtMs = parseIsoMs2((_b = entry.startedAt) != null ? _b : entry.updatedAt);
    if (startedAtMs !== null && nowMs - startedAtMs >= IN_MATCH_STALE_WINDOW_MS) {
      return `In match for ${describeElapsedMinutes(nowMs - startedAtMs)} without a result.`;
    }
  }
  return null;
};
var sortLiveEntries = (entries) => {
  const statusPriority = {
    in_match: 0,
    ready: 1,
    pending: 2,
    completed: 3
  };
  return entries.slice().sort((left, right) => {
    if (statusPriority[left.status] !== statusPriority[right.status]) {
      return statusPriority[left.status] - statusPriority[right.status];
    }
    if (left.round !== right.round) {
      return left.round - right.round;
    }
    return left.slot - right.slot;
  });
};
var buildLiveEntries = (run, nowMs) => {
  var _a, _b;
  const nameByUserId = buildParticipantNameMap(run);
  return sortLiveEntries(
    ((_b = (_a = run.bracket) == null ? void 0 : _a.entries) != null ? _b : []).map((entry) => {
      var _a2, _b2;
      const staleReason = buildEntryStaleReason(entry, nowMs);
      return {
        entryId: entry.entryId,
        round: entry.round,
        slot: entry.slot,
        status: entry.status,
        playerAUserId: entry.playerAUserId,
        playerADisplayName: entry.playerAUserId ? (_a2 = nameByUserId.get(entry.playerAUserId)) != null ? _a2 : entry.playerAUserId : null,
        playerBUserId: entry.playerBUserId,
        playerBDisplayName: entry.playerBUserId ? (_b2 = nameByUserId.get(entry.playerBUserId)) != null ? _b2 : entry.playerBUserId : null,
        winnerUserId: entry.winnerUserId,
        loserUserId: entry.loserUserId,
        matchId: entry.matchId,
        readyAt: entry.readyAt,
        startedAt: entry.startedAt,
        completedAt: entry.completedAt,
        durationSeconds: getEntryDurationSeconds(entry),
        stale: staleReason !== null,
        staleReason,
        blockedReason: buildEntryBlockedReason(entry, nameByUserId)
      };
    })
  );
};
var buildRoundStats = (bracket) => {
  if (!bracket || bracket.entries.length === 0) {
    return [];
  }
  const rounds = Array.from(new Set(bracket.entries.map((entry) => entry.round))).sort((left, right) => left - right);
  return rounds.map((round) => {
    const entries = bracket.entries.filter((entry) => entry.round === round);
    const pending = entries.filter((entry) => entry.status === "pending").length;
    const ready = entries.filter((entry) => entry.status === "ready").length;
    const inMatch = entries.filter((entry) => entry.status === "in_match").length;
    const completed = entries.filter((entry) => entry.status === "completed").length;
    return {
      round,
      label: getRoundLabel(round, bracket.totalRounds),
      totalMatches: entries.length,
      pending,
      ready,
      inMatch,
      completed,
      completionPercent: entries.length > 0 ? Math.round(completed / entries.length * 100) : 0
    };
  });
};
var buildTournamentLiveSummary = (run, nakamaTournament, auditEntries, nowMs) => {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k;
  const participantCounts = buildParticipantStateCounts(run);
  const roundStats = buildRoundStats(run.bracket);
  const entries = (_b = (_a = run.bracket) == null ? void 0 : _a.entries) != null ? _b : [];
  const totalMatches = entries.length;
  const completedMatches = roundStats.reduce((total, round) => total + round.completed, 0);
  const pendingMatches = roundStats.reduce((total, round) => total + round.pending, 0);
  const readyMatches = roundStats.reduce((total, round) => total + round.ready, 0);
  const activeMatches = roundStats.reduce((total, round) => total + round.inMatch, 0);
  const staleEntryCount = entries.filter(
    (entry) => isReadyEntryStale(entry, nowMs) || isInMatchEntryStale(entry, nowMs)
  ).length;
  const startAt = (_d = toIsoFromUnixSeconds((_c = readNumberField6(nakamaTournament, ["startTime", "start_time"])) != null ? _c : run.startTime)) != null ? _d : null;
  const currentRound = getTournamentBracketCurrentRound(run.bracket);
  const lastResultAt = entries.reduce(
    (latest, entry) => maxIso(latest, entry.completedAt),
    null
  );
  const lastActivityAt = maxIso(
    run.updatedAt,
    lastResultAt,
    ...entries.flatMap((entry) => [entry.updatedAt, entry.readyAt, entry.startedAt, entry.completedAt]),
    ...auditEntries.map((entry) => entry.createdAt)
  );
  const finalizedFromBracket = Boolean((_e = run.bracket) == null ? void 0 : _e.finalizedAt) || totalMatches > 0 && completedMatches === totalMatches;
  const finalizeReady = run.lifecycle !== "finalized" && finalizedFromBracket;
  const startingSoon = (() => {
    const startAtMs = parseIsoMs2(startAt);
    return startAtMs !== null && startAtMs > nowMs && startAtMs - nowMs <= STARTING_SOON_WINDOW_MS && run.lifecycle !== "finalized";
  })();
  const alerts = [];
  if (staleEntryCount > 0) {
    alerts.push({
      code: "stale_match",
      level: "critical",
      message: `${formatCountLabel(staleEntryCount, "stale match")} needs operator attention.`,
      count: staleEntryCount
    });
  }
  if (readyMatches > 0) {
    alerts.push({
      code: "ready_matches",
      level: "warning",
      message: `${formatCountLabel(readyMatches, "match")} ready to launch.`,
      count: readyMatches
    });
  }
  if (activeMatches > 0) {
    alerts.push({
      code: "active_matches",
      level: "info",
      message: `${formatCountLabel(activeMatches, "active match")} in progress.`,
      count: activeMatches
    });
  }
  if (participantCounts.waitingNextRound > 0) {
    alerts.push({
      code: "waiting_players",
      level: readyMatches > 0 || activeMatches > 0 ? "info" : "warning",
      message: `${formatCountLabel(participantCounts.waitingNextRound, "player")} waiting for the next round.`,
      count: participantCounts.waitingNextRound
    });
  }
  if (startingSoon) {
    alerts.push({
      code: "starting_soon",
      level: "info",
      message: "Run starts within the next hour.",
      count: 1
    });
  }
  if (finalizeReady) {
    alerts.push({
      code: "finalize_ready",
      level: "success",
      message: "Bracket is complete and ready to finalize.",
      count: 1
    });
  }
  if (run.lifecycle === "finalized") {
    alerts.push({
      code: "finalized",
      level: "success",
      message: "Run is finalized and export-ready.",
      count: 1
    });
  }
  const actionNeeded = alerts.some((alert) => alert.level === "warning" || alert.level === "critical");
  const entrants = getEntrantCount(run, nakamaTournament);
  const capacity = Math.max(run.maxSize, entrants);
  const registrationFillPercent = capacity > 0 ? Math.round(entrants / capacity * 100) : 0;
  const urgencyScore = staleEntryCount * 100 + readyMatches * 35 + activeMatches * 20 + participantCounts.waitingNextRound * 8 + (startingSoon ? 15 : 0) + (run.lifecycle === "open" ? 10 : 0) + (finalizeReady ? 5 : 0);
  return {
    runId: run.runId,
    tournamentId: run.tournamentId,
    title: run.title,
    lifecycle: run.lifecycle,
    startAt,
    openedAt: run.openedAt,
    closedAt: run.closedAt,
    finalizedAt: (_h = (_g = run.finalizedAt) != null ? _g : (_f = run.bracket) == null ? void 0 : _f.finalizedAt) != null ? _h : null,
    updatedAt: run.updatedAt,
    entrants,
    capacity,
    registrationFillPercent,
    currentRound,
    totalRounds: (_k = (_j = (_i = run.bracket) == null ? void 0 : _i.totalRounds) != null ? _j : run.maxNumScore) != null ? _k : null,
    totalMatches,
    completedMatches,
    pendingMatches,
    readyMatches,
    activeMatches,
    waitingPlayers: participantCounts.waitingNextRound,
    playersInMatch: participantCounts.inMatch,
    lastActivityAt,
    lastResultAt,
    startingSoon,
    finalizeReady,
    actionNeeded,
    urgencyScore,
    alerts
  };
};
var buildTimelineBuckets = (timestamps, nowMs, bucketCount, bucketHours) => {
  const bucketWidthMs = bucketHours * 60 * 60 * 1e3;
  const firstBucketStartMs = nowMs - bucketWidthMs * (bucketCount - 1);
  return Array.from({ length: bucketCount }, (_, index) => {
    const bucketStartMs = firstBucketStartMs + index * bucketWidthMs;
    const bucketEndMs = bucketStartMs + bucketWidthMs;
    return {
      bucketStart: new Date(bucketStartMs).toISOString(),
      bucketEnd: new Date(bucketEndMs).toISOString(),
      count: timestamps.reduce((total, timestamp) => {
        const parsed = parseIsoMs2(timestamp);
        return parsed !== null && parsed >= bucketStartMs && parsed < bucketEndMs ? total + 1 : total;
      }, 0)
    };
  });
};
var buildMatchDurationBuckets = (bracket) => {
  var _a;
  const durations = ((_a = bracket == null ? void 0 : bracket.entries) != null ? _a : []).map((entry) => getEntryDurationSeconds(entry)).filter((duration) => duration !== null);
  const buckets = [
    { label: "<5m", minSeconds: 0, maxSeconds: 5 * 60, count: 0 },
    { label: "5-10m", minSeconds: 5 * 60, maxSeconds: 10 * 60, count: 0 },
    { label: "10-15m", minSeconds: 10 * 60, maxSeconds: 15 * 60, count: 0 },
    { label: "15-20m", minSeconds: 15 * 60, maxSeconds: 20 * 60, count: 0 },
    { label: "20m+", minSeconds: 20 * 60, maxSeconds: null, count: 0 }
  ];
  durations.forEach((duration) => {
    var _a2;
    const bucket = (_a2 = buckets.find((candidate) => {
      const minSeconds = candidate.minSeconds;
      if (candidate.maxSeconds === null) {
        return duration >= minSeconds;
      }
      return duration >= minSeconds && duration < candidate.maxSeconds;
    })) != null ? _a2 : buckets[buckets.length - 1];
    bucket.count += 1;
  });
  return buckets;
};
var buildSeedSurvival = (bracket) => {
  if (!bracket || bracket.participants.length === 0) {
    return [];
  }
  const seedByUserId = bracket.participants.reduce((accumulator, participant) => {
    accumulator[participant.userId] = participant.seed;
    return accumulator;
  }, {});
  const remainingUserIds = new Set(bracket.participants.map((participant) => participant.userId));
  return Array.from({ length: bracket.totalRounds }, (_, index) => index + 1).map((round) => {
    var _a;
    bracket.entries.filter((entry) => entry.round === round && entry.status === "completed" && entry.loserUserId).forEach((entry) => {
      if (entry.loserUserId) {
        remainingUserIds.delete(entry.loserUserId);
      }
    });
    const remainingSeeds = Array.from(remainingUserIds).map((userId) => seedByUserId[userId]).filter((seed) => typeof seed === "number" && Number.isFinite(seed)).sort((left, right) => left - right);
    const averageSeedRemaining = remainingSeeds.length > 0 ? Number((remainingSeeds.reduce((total, seed) => total + seed, 0) / remainingSeeds.length).toFixed(2)) : null;
    return {
      round,
      label: getRoundLabel(round, bracket.totalRounds),
      survivingCount: remainingSeeds.length,
      topSeedRemaining: (_a = remainingSeeds[0]) != null ? _a : null,
      averageSeedRemaining
    };
  });
};
var compareSummariesByUrgency = (left, right) => {
  var _a, _b, _c, _d;
  if (left.urgencyScore !== right.urgencyScore) {
    return right.urgencyScore - left.urgencyScore;
  }
  const leftActivity = (_b = parseIsoMs2((_a = left.lastActivityAt) != null ? _a : left.updatedAt)) != null ? _b : 0;
  const rightActivity = (_d = parseIsoMs2((_c = right.lastActivityAt) != null ? _c : right.updatedAt)) != null ? _d : 0;
  if (leftActivity !== rightActivity) {
    return rightActivity - leftActivity;
  }
  return left.runId.localeCompare(right.runId);
};
var isOverviewCandidate = (summary, nowMs) => {
  var _a, _b;
  if (summary.lifecycle !== "finalized") {
    return true;
  }
  const recentActivityMs = parseIsoMs2((_b = (_a = summary.lastActivityAt) != null ? _a : summary.finalizedAt) != null ? _b : summary.updatedAt);
  return recentActivityMs !== null && nowMs - recentActivityMs <= RECENT_RUN_WINDOW_MS;
};
var buildOverviewResponse = (nk, limit) => {
  var _a;
  const generatedAt = (/* @__PURE__ */ new Date()).toISOString();
  const nowMs = (_a = parseIsoMs2(generatedAt)) != null ? _a : Date.now();
  const indexState = readRunIndexState(nk);
  const runs = sortRuns(readRunsByIds(nk, indexState.index.runIds));
  const auditEntries = listTournamentAuditEntries(nk, { limit: 200 });
  const auditsByRunId = auditEntries.reduce((accumulator, entry) => {
    var _a2;
    const runId = entry.tournamentId || entry.targetId;
    if (!runId) {
      return accumulator;
    }
    accumulator[runId] = (_a2 = accumulator[runId]) != null ? _a2 : [];
    accumulator[runId].push(entry);
    return accumulator;
  }, {});
  const tournamentsById = runs.reduce((accumulator, run) => {
    accumulator[run.runId] = getNakamaTournamentById(nk, run.tournamentId);
    return accumulator;
  }, {});
  const summaries = runs.map((run) => {
    var _a2, _b;
    return buildTournamentLiveSummary(run, (_a2 = tournamentsById[run.runId]) != null ? _a2 : null, (_b = auditsByRunId[run.runId]) != null ? _b : [], nowMs);
  }).filter((summary) => isOverviewCandidate(summary, nowMs)).sort(compareSummariesByUrgency).slice(0, limit);
  const includedRunIds = new Set(summaries.map((summary) => summary.runId));
  const activeMatchesByRound = runs.filter((run) => includedRunIds.has(run.runId)).flatMap((run) => buildRoundStats(run.bracket)).reduce((accumulator, round) => {
    var _a2;
    accumulator[round.round] = ((_a2 = accumulator[round.round]) != null ? _a2 : 0) + round.inMatch;
    return accumulator;
  }, {});
  const completionTimestamps = runs.filter((run) => includedRunIds.has(run.runId)).flatMap((run) => {
    var _a2, _b;
    return ((_b = (_a2 = run.bracket) == null ? void 0 : _a2.entries) != null ? _b : []).map((entry) => entry.completedAt).filter((value) => Boolean(value));
  });
  const auditTimestamps = auditEntries.filter((entry) => {
    var _a2;
    const runId = (_a2 = entry.tournamentId) != null ? _a2 : entry.targetId;
    return typeof runId === "string" && includedRunIds.has(runId);
  }).map((entry) => entry.createdAt);
  return {
    ok: true,
    generatedAt,
    summaries,
    activeMatchesByRound: Object.keys(activeMatchesByRound).map((round) => {
      var _a2;
      return {
        round: Number(round),
        count: (_a2 = activeMatchesByRound[Number(round)]) != null ? _a2 : 0
      };
    }).sort((left, right) => left.round - right.round),
    completionsOverTime: buildTimelineBuckets(
      completionTimestamps,
      nowMs,
      OVERVIEW_TIMELINE_BUCKET_COUNT,
      OVERVIEW_TIMELINE_BUCKET_HOURS
    ),
    auditActivityTimeline: buildTimelineBuckets(
      auditTimestamps,
      nowMs,
      OVERVIEW_TIMELINE_BUCKET_COUNT,
      OVERVIEW_TIMELINE_BUCKET_HOURS
    )
  };
};
var buildDetailResponse = (nk, runId) => {
  var _a;
  const generatedAt = (/* @__PURE__ */ new Date()).toISOString();
  const nowMs = (_a = parseIsoMs2(generatedAt)) != null ? _a : Date.now();
  const run = readRunOrThrow(nk, runId);
  const nakamaTournament = getNakamaTournamentById(nk, run.tournamentId);
  const auditEntries = listTournamentAuditEntries(nk, {
    tournamentId: run.runId,
    limit: 200
  });
  return {
    ok: true,
    generatedAt,
    summary: buildTournamentLiveSummary(run, nakamaTournament, auditEntries, nowMs),
    roundStats: buildRoundStats(run.bracket),
    participantStateCounts: buildParticipantStateCounts(run),
    liveEntries: buildLiveEntries(run, nowMs),
    matchDurationBuckets: buildMatchDurationBuckets(run.bracket),
    seedSurvival: buildSeedSurvival(run.bracket),
    auditActivityTimeline: buildTimelineBuckets(
      auditEntries.map((entry) => entry.createdAt),
      nowMs,
      DETAIL_TIMELINE_BUCKET_COUNT,
      DETAIL_TIMELINE_BUCKET_HOURS
    )
  };
};
var rpcAdminGetTournamentLiveStatus = (ctx, _logger, nk, payload) => {
  assertAdmin(ctx, "viewer", nk);
  const parsed = parseJsonPayload2(payload);
  const runId = readStringField9(parsed, ["runId", "run_id", "tournamentId", "tournament_id"]);
  if (runId) {
    return JSON.stringify(buildDetailResponse(nk, runId));
  }
  const limit = clampInteger(parsed.limit, DEFAULT_OVERVIEW_LIMIT, 1, MAX_OVERVIEW_LIMIT);
  return JSON.stringify(buildOverviewResponse(nk, limit));
};

// backend/modules/tournaments/joins.ts
var resolveDisplayName = (ctx, requestDisplayName, userId) => {
  if (requestDisplayName && requestDisplayName.trim().length > 0) {
    return requestDisplayName.trim();
  }
  if (typeof ctx === "object" && ctx !== null) {
    const username = readStringField9(ctx, ["username", "displayName", "display_name", "name"]);
    if (username) {
      return username;
    }
    const vars = typeof ctx.vars === "object" && ctx.vars !== null ? ctx.vars : null;
    const fallbackName = readStringField9(vars, ["usernameDisplay", "displayName", "email"]);
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
  const parsed = parseJsonPayload2(payload);
  const request = {
    tournamentId: (_a = readStringField9(parsed, ["tournamentId", "tournament_id"])) != null ? _a : "",
    displayName: (_b = readStringField9(parsed, ["displayName", "display_name"])) != null ? _b : void 0
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

// shared/tournamentNotifications.ts
var TOURNAMENT_BRACKET_READY_NOTIFICATION_CODE = 41001;
var TOURNAMENT_BRACKET_READY_NOTIFICATION_SUBJECT = "tournament_bracket_ready";
var TOURNAMENT_BRACKET_READY_NOTIFICATION_TYPE = "tournament_bracket_ready";

// backend/modules/tournaments/public.ts
var TOURNAMENT_RUN_MEMBERSHIPS_COLLECTION2 = "tournament_run_memberships";
var DEFAULT_PUBLIC_LIST_LIMIT = 50;
var DEFAULT_PUBLIC_STANDINGS_LIMIT = 256;
var SYSTEM_NOTIFICATION_SENDER_ID = "00000000-0000-0000-0000-000000000000";
var BRACKET_START_NOTIFICATION_TOKEN_KEY = "publicBracketStartNotificationToken";
var RPC_LIST_PUBLIC_TOURNAMENTS = "list_public_tournaments";
var RPC_GET_PUBLIC_TOURNAMENT = "get_public_tournament";
var RPC_GET_PUBLIC_TOURNAMENT_STANDINGS = "get_public_tournament_standings";
var RPC_JOIN_PUBLIC_TOURNAMENT = "join_public_tournament";
var RPC_LAUNCH_TOURNAMENT_MATCH = "launch_tournament_match";
var RPC_GET_ACTIVE_TOURNAMENT_FLOW = "get_active_tournament_flow";
var normalizeMembershipRecord = (value, fallbackRunId, fallbackUserId) => {
  var _a, _b, _c, _d;
  const record = asRecord2(value);
  if (!record) {
    return null;
  }
  const runId = (_a = readStringField9(record, ["runId", "run_id"])) != null ? _a : fallbackRunId;
  const tournamentId = (_b = readStringField9(record, ["tournamentId", "tournament_id"])) != null ? _b : runId;
  const userId = (_c = readStringField9(record, ["userId", "user_id"])) != null ? _c : fallbackUserId;
  const displayName = readStringField9(record, ["displayName", "display_name"]);
  const joinedAt = readStringField9(record, ["joinedAt", "joined_at"]);
  const updatedAt = (_d = readStringField9(record, ["updatedAt", "updated_at"])) != null ? _d : joinedAt;
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
var toIsoFromUnixSeconds2 = (seconds, fallback) => {
  if (typeof seconds === "number" && Number.isFinite(seconds) && seconds > 0) {
    return new Date(seconds * 1e3).toISOString();
  }
  return fallback;
};
var readMetadata = (run) => {
  var _a;
  return (_a = asRecord2(run.metadata)) != null ? _a : {};
};
var getRunBotUserIds2 = (run) => {
  var _a, _b;
  const userIds = /* @__PURE__ */ new Set();
  run.registrations.forEach((registration) => {
    if (isTournamentBotUserId(registration.userId)) {
      userIds.add(registration.userId);
    }
  });
  (_a = run.bracket) == null ? void 0 : _a.participants.forEach((participant) => {
    if (isTournamentBotUserId(participant.userId)) {
      userIds.add(participant.userId);
    }
  });
  (_b = run.bracket) == null ? void 0 : _b.entries.forEach((entry) => {
    if (isTournamentBotUserId(entry.playerAUserId)) {
      userIds.add(entry.playerAUserId);
    }
    if (isTournamentBotUserId(entry.playerBUserId)) {
      userIds.add(entry.playerBUserId);
    }
  });
  return Array.from(userIds);
};
var formatPrizeLabel = (metadata) => {
  var _a;
  const explicitPrize = readStringField9(metadata, ["prizePool", "prize_pool", "prizeLabel", "prize_label"]);
  if (explicitPrize) {
    return explicitPrize;
  }
  const buyIn = (_a = readStringField9(metadata, ["buyIn", "buy_in", "entryFee", "entry_fee"])) != null ? _a : "Free";
  return buyIn === "Free" ? "No prize listed" : `${buyIn} buy-in`;
};
var resolveTournamentEntryFee = (metadata) => {
  var _a;
  return parseTournamentEntryFee((_a = readStringField9(metadata, ["buyIn", "buy_in", "entryFee", "entry_fee"])) != null ? _a : "Free");
};
var buildMembershipState = (membership) => {
  var _a;
  return {
    isJoined: Boolean(membership),
    joinedAt: (_a = membership == null ? void 0 : membership.joinedAt) != null ? _a : null
  };
};
var buildFinalizedParticipationOverride = (run, participant) => {
  var _a;
  if (!((_a = run.bracket) == null ? void 0 : _a.finalizedAt)) {
    return null;
  }
  if (run.bracket.winnerUserId === participant.userId) {
    return {
      state: "champion",
      currentRound: participant.currentRound,
      currentEntryId: participant.currentEntryId,
      activeMatchId: null,
      finalPlacement: 1,
      lastResult: "win",
      canLaunch: false
    };
  }
  if (run.bracket.runnerUpUserId === participant.userId) {
    return {
      state: "runner_up",
      currentRound: participant.currentRound,
      currentEntryId: participant.currentEntryId,
      activeMatchId: null,
      finalPlacement: 2,
      lastResult: "loss",
      canLaunch: false
    };
  }
  return null;
};
var readStandingsRecordRank2 = (record) => {
  const rank = readNumberField6(record, ["rank"]);
  return typeof rank === "number" && Number.isFinite(rank) ? Math.max(1, Math.floor(rank)) : null;
};
var readStandingsRecordOwnerId2 = (record) => readStringField9(record, ["ownerId", "owner_id"]);
var readStandingsRecordMetadata = (record) => {
  var _a;
  return (_a = asRecord2(record == null ? void 0 : record.metadata)) != null ? _a : {};
};
var normalizeSnapshotResult = (value) => value === "win" || value === "loss" ? value : null;
var buildStoredFinalizedParticipationOverride = (run, userId, participant) => {
  var _a, _b, _c, _d, _e, _f, _g;
  const terminalLifecycle = run.lifecycle === "closed" || run.lifecycle === "finalized" || run.finalizedAt != null;
  const snapshotRecord = (_b = (_a = run.finalSnapshot) == null ? void 0 : _a.records.map((entry) => asRecord2(entry)).find((entry) => readStandingsRecordOwnerId2(entry) === userId)) != null ? _b : null;
  if (!terminalLifecycle && !snapshotRecord) {
    return null;
  }
  const finalPlacement = (_d = (_c = readStandingsRecordRank2(snapshotRecord)) != null ? _c : participant == null ? void 0 : participant.finalPlacement) != null ? _d : null;
  const metadata = readStandingsRecordMetadata(snapshotRecord);
  const snapshotState = readStringField9(metadata, ["state"]);
  const state = snapshotState === "champion" || snapshotState === "runner_up" || snapshotState === "eliminated" ? snapshotState : finalPlacement === 1 ? "champion" : finalPlacement === 2 ? "runner_up" : typeof finalPlacement === "number" ? "eliminated" : null;
  if (!state) {
    return null;
  }
  const snapshotLastResult = normalizeSnapshotResult(readStringField9(metadata, ["result"]));
  return {
    state,
    currentRound: (_e = participant == null ? void 0 : participant.currentRound) != null ? _e : readNumberField6(metadata, ["round"]),
    currentEntryId: (_f = participant == null ? void 0 : participant.currentEntryId) != null ? _f : readStringField9(metadata, ["entryId", "entry_id"]),
    activeMatchId: null,
    finalPlacement,
    lastResult: (_g = snapshotLastResult != null ? snapshotLastResult : participant == null ? void 0 : participant.lastResult) != null ? _g : state === "champion" ? "win" : state === "runner_up" ? "loss" : null,
    canLaunch: false
  };
};
var isParticipantAssignedToEntry = (entry, userId) => Boolean(entry && (entry.playerAUserId === userId || entry.playerBUserId === userId));
var resolvePublicParticipantBracketState = (bracket, participant) => {
  var _a, _b;
  const currentEntryCandidate = participant.currentEntryId ? getTournamentBracketEntry(bracket, participant.currentEntryId) : null;
  const currentEntry = isParticipantAssignedToEntry(currentEntryCandidate, participant.userId) ? currentEntryCandidate : null;
  const activeEntryCandidate = participant.activeMatchId ? getTournamentBracketEntryByMatchId(bracket, participant.activeMatchId) : null;
  const activeEntry = isParticipantAssignedToEntry(activeEntryCandidate, participant.userId) ? activeEntryCandidate : null;
  const resumedEntry = (currentEntry == null ? void 0 : currentEntry.status) === "in_match" && currentEntry.matchId ? currentEntry : !currentEntry && (activeEntry == null ? void 0 : activeEntry.status) === "in_match" && activeEntry.matchId ? activeEntry : null;
  const resolvedEntry = (_a = currentEntry != null ? currentEntry : resumedEntry) != null ? _a : null;
  const activeMatchId = (_b = resumedEntry == null ? void 0 : resumedEntry.matchId) != null ? _b : null;
  const canLaunch = Boolean(
    activeMatchId || currentEntry && (currentEntry.status === "ready" || currentEntry.status === "in_match")
  );
  let playerState = participant.state;
  if (activeMatchId) {
    playerState = "in_match";
  } else if (participant.state === "in_match" && currentEntry && currentEntry.status !== "completed") {
    playerState = "waiting_next_round";
  }
  return {
    currentEntry: resolvedEntry,
    activeMatchId,
    playerState,
    canLaunch
  };
};
var resolveMembershipForRun = (run, membership) => {
  if (!membership) {
    return null;
  }
  if (membership.runId !== run.runId || membership.tournamentId !== run.tournamentId) {
    return null;
  }
  const joinedAtMs = Date.parse(membership.joinedAt);
  const runCreatedAtMs = Date.parse(run.createdAt);
  if (Number.isFinite(joinedAtMs) && Number.isFinite(runCreatedAtMs) && joinedAtMs < runCreatedAtMs) {
    return null;
  }
  return membership;
};
var getRunEndTimeMs = (run, nakamaTournament) => {
  var _a;
  const endTimeSeconds = (_a = readNumberField6(nakamaTournament, ["endTime", "end_time"])) != null ? _a : run.endTime;
  if (typeof endTimeSeconds !== "number" || !Number.isFinite(endTimeSeconds) || endTimeSeconds <= 0) {
    return null;
  }
  return Math.floor(endTimeSeconds * 1e3);
};
var getRunStartTimeMs2 = (run, nakamaTournament) => {
  var _a;
  const startTimeSeconds = (_a = readNumberField6(nakamaTournament, ["startTime", "start_time"])) != null ? _a : run.startTime;
  if (typeof startTimeSeconds !== "number" || !Number.isFinite(startTimeSeconds) || startTimeSeconds <= 0) {
    return null;
  }
  return Math.floor(startTimeSeconds * 1e3);
};
var getRunEntrants = (run, nakamaTournament) => {
  var _a;
  return Math.max(
    run.registrations.length,
    Math.max(0, Math.floor((_a = readNumberField6(nakamaTournament, ["size"])) != null ? _a : 0))
  );
};
var getRunMaxEntrants = (run, nakamaTournament) => {
  var _a;
  return Math.max(
    0,
    Math.floor((_a = readNumberField6(nakamaTournament, ["maxSize", "max_size"])) != null ? _a : run.maxSize)
  );
};
var isPublicRunFull = (run, nakamaTournament) => {
  const maxEntrants = getRunMaxEntrants(run, nakamaTournament);
  return maxEntrants > 0 && getRunEntrants(run, nakamaTournament) >= maxEntrants;
};
var hasPublicRunReachedStartTime = (run, nakamaTournament, nowMs = Date.now()) => {
  const startTimeMs = getRunStartTimeMs2(run, nakamaTournament);
  return startTimeMs === null || startTimeMs <= nowMs;
};
var getLaunchBlockedReason = (run, nakamaTournament) => {
  if (!isPublicRunFull(run, nakamaTournament)) {
    return "lobby";
  }
  if (!hasPublicRunReachedStartTime(run, nakamaTournament)) {
    return "start";
  }
  return null;
};
var isPublicRunActive = (run, nakamaTournament, nowMs = Date.now()) => {
  var _a;
  if (run.lifecycle !== "open" || run.finalizedAt != null || ((_a = run.bracket) == null ? void 0 : _a.finalizedAt) != null || !nakamaTournament) {
    return false;
  }
  if (run.bracket && !run.bracket.finalizedAt) {
    return true;
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
var assertPublicRunReadable = (run, nakamaTournament, membership, nowMs = Date.now()) => {
  var _a;
  if (isPublicRunActive(run, nakamaTournament, nowMs)) {
    return;
  }
  if (membership && (run.lifecycle === "closed" || run.lifecycle === "finalized" || run.finalizedAt != null || ((_a = run.bracket) == null ? void 0 : _a.finalizedAt) != null)) {
    return;
  }
  throw new Error("This tournament is not available in public play.");
};
var readMembershipObject = (nk, runId, userId) => {
  const objects = nk.storageRead([
    {
      collection: TOURNAMENT_RUN_MEMBERSHIPS_COLLECTION2,
      key: runId,
      userId
    }
  ]);
  return findStorageObject(objects, TOURNAMENT_RUN_MEMBERSHIPS_COLLECTION2, runId, userId);
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
      collection: TOURNAMENT_RUN_MEMBERSHIPS_COLLECTION2,
      key: runId,
      userId
    }))
  );
  return filteredRunIds.reduce(
    (accumulator, runId) => {
      var _a;
      const object = findStorageObject(objects, TOURNAMENT_RUN_MEMBERSHIPS_COLLECTION2, runId, userId);
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
    const existing = resolveMembershipForRun(
      run,
      normalizeMembershipRecord((_a = existingObject == null ? void 0 : existingObject.value) != null ? _a : null, run.runId, userId)
    );
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const joinedAt = (_b = existing == null ? void 0 : existing.joinedAt) != null ? _b : now;
    const record = {
      runId: run.runId,
      tournamentId: run.tournamentId,
      userId,
      displayName,
      joinedAt,
      updatedAt: now
    };
    try {
      nk.storageWrite([
        maybeSetStorageVersion({
          collection: TOURNAMENT_RUN_MEMBERSHIPS_COLLECTION2,
          key: run.runId,
          userId,
          value: record,
          permissionRead: STORAGE_PERMISSION_NONE2,
          permissionWrite: STORAGE_PERMISSION_NONE2
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
var buildPublicParticipationState = (run, membership) => {
  var _a, _b, _c, _d;
  if (!membership) {
    return {
      state: null,
      currentRound: null,
      currentEntryId: null,
      activeMatchId: null,
      finalPlacement: null,
      lastResult: null,
      canLaunch: false
    };
  }
  if (!run.bracket) {
    const storedFinalizedParticipation2 = buildStoredFinalizedParticipationOverride(run, membership.userId, null);
    if (storedFinalizedParticipation2) {
      return storedFinalizedParticipation2;
    }
    return {
      state: "lobby",
      currentRound: 1,
      currentEntryId: null,
      activeMatchId: null,
      finalPlacement: null,
      lastResult: null,
      canLaunch: false
    };
  }
  const participant = getTournamentBracketParticipant(run.bracket, membership.userId);
  if (!participant) {
    const storedFinalizedParticipation2 = buildStoredFinalizedParticipationOverride(run, membership.userId, null);
    if (storedFinalizedParticipation2) {
      return storedFinalizedParticipation2;
    }
    return {
      state: null,
      currentRound: getTournamentBracketCurrentRound(run.bracket),
      currentEntryId: null,
      activeMatchId: null,
      finalPlacement: null,
      lastResult: null,
      canLaunch: false
    };
  }
  const finalizedParticipation = buildFinalizedParticipationOverride(run, participant);
  if (finalizedParticipation) {
    return finalizedParticipation;
  }
  const storedFinalizedParticipation = buildStoredFinalizedParticipationOverride(run, membership.userId, participant);
  if (storedFinalizedParticipation) {
    return storedFinalizedParticipation;
  }
  const resolvedParticipantState = resolvePublicParticipantBracketState(run.bracket, participant);
  return {
    state: resolvedParticipantState.playerState,
    currentRound: (_b = (_a = resolvedParticipantState.currentEntry) == null ? void 0 : _a.round) != null ? _b : participant.currentRound,
    currentEntryId: (_d = (_c = resolvedParticipantState.currentEntry) == null ? void 0 : _c.entryId) != null ? _d : participant.currentEntryId,
    activeMatchId: resolvedParticipantState.activeMatchId,
    finalPlacement: participant.finalPlacement,
    lastResult: participant.lastResult,
    canLaunch: resolvedParticipantState.canLaunch
  };
};
var buildPublicTournamentResponse = (run, nakamaTournament, membership) => {
  var _a, _b, _c, _d, _e, _f, _g;
  const metadata = readMetadata(run);
  const createdAt = run.createdAt;
  const resolvedMembership = resolveMembershipForRun(run, membership);
  const participation = buildPublicParticipationState(run, resolvedMembership);
  const rewardSettings = resolveTournamentXpRewardSettings(metadata);
  return {
    runId: run.runId,
    tournamentId: run.tournamentId,
    name: run.title,
    description: run.description || "No description configured.",
    lifecycle: run.lifecycle,
    startAt: (_b = toIsoFromUnixSeconds2(
      (_a = readNumberField6(nakamaTournament, ["startTime", "start_time"])) != null ? _a : run.startTime,
      createdAt
    )) != null ? _b : createdAt,
    endAt: toIsoFromUnixSeconds2(
      (_c = readNumberField6(nakamaTournament, ["endTime", "end_time"])) != null ? _c : run.endTime,
      null
    ),
    updatedAt: run.updatedAt,
    lobbyDeadlineAt: getTournamentLobbyDeadlineAt(run.openedAt),
    entrants: getRunEntrants(run, nakamaTournament),
    maxEntrants: getRunMaxEntrants(run, nakamaTournament),
    gameMode: (_d = readStringField9(metadata, ["gameMode", "game_mode"])) != null ? _d : "standard",
    region: (_e = readStringField9(metadata, ["region"])) != null ? _e : "Global",
    buyInLabel: formatTournamentEntryFee(
      (_f = readStringField9(metadata, ["buyIn", "buy_in", "entryFee", "entry_fee"])) != null ? _f : "Free"
    ),
    prizeLabel: formatPrizeLabel(metadata),
    xpPerMatchWin: rewardSettings.xpPerMatchWin,
    xpForTournamentChampion: rewardSettings.xpForTournamentChampion,
    bots: buildTournamentBotSummary(run.metadata, getRunBotUserIds2(run)),
    isLocked: hasTournamentBracketStarted(run.bracket),
    currentRound: (_g = participation.currentRound) != null ? _g : getTournamentBracketCurrentRound(run.bracket),
    membership: buildMembershipState(resolvedMembership),
    participation
  };
};
var listPublicRuns = (nk) => {
  const indexState = readRunIndexState(nk);
  return readRunsByIds(nk, indexState.index.runIds);
};
var ensureRunRegistration = (nk, logger, run, membership) => updateRunWithRetry(nk, logger, run.runId, (current) => {
  var _a;
  const existing = (_a = current.registrations.find((entry) => entry.userId === membership.userId)) != null ? _a : null;
  if (existing && existing.displayName === membership.displayName) {
    return current;
  }
  const result = upsertTournamentRegistration(
    current.registrations,
    membership.userId,
    membership.displayName,
    membership.joinedAt
  );
  return __spreadProps(__spreadValues({}, current), {
    updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    registrations: result.registrations
  });
});
var sendBracketReadyNotifications = (nk, logger, run) => {
  var _a, _b;
  if (typeof nk.notificationSend !== "function") {
    return;
  }
  const startedAt = (_b = (_a = run.bracket) == null ? void 0 : _a.startedAt) != null ? _b : run.updatedAt;
  if (!startedAt) {
    return;
  }
  const userIds = Array.from(
    new Set(
      run.registrations.map((registration) => registration.userId).filter((userId) => userId.trim().length > 0 && !isTournamentBotUserId(userId))
    )
  );
  if (userIds.length === 0) {
    return;
  }
  const content = {
    type: TOURNAMENT_BRACKET_READY_NOTIFICATION_TYPE,
    runId: run.runId,
    tournamentId: run.tournamentId,
    startedAt
  };
  userIds.forEach((userId) => {
    try {
      nk.notificationSend(
        userId,
        TOURNAMENT_BRACKET_READY_NOTIFICATION_SUBJECT,
        content,
        TOURNAMENT_BRACKET_READY_NOTIFICATION_CODE,
        SYSTEM_NOTIFICATION_SENDER_ID,
        false
      );
    } catch (error) {
      logger.warn(
        "Unable to send bracket-ready notification for run %s to user %s: %s",
        run.runId,
        userId,
        String(error)
      );
    }
  });
};
var maybeStartBracketForRun = (nk, logger, run) => {
  if (run.bracket || run.lifecycle !== "open") {
    return run;
  }
  const nakamaTournament = getNakamaTournamentById(nk, run.tournamentId);
  if (!isPublicRunFull(run, nakamaTournament)) {
    return run;
  }
  if (!hasPublicRunReachedStartTime(run, nakamaTournament)) {
    return run;
  }
  const bracketStartNotificationToken = `bracket-start:${run.runId}:${Date.now()}:${Math.random().toString(36).slice(2, 10)}`;
  let nextRun = updateRunWithRetry(nk, logger, run.runId, (current) => {
    if (current.bracket) {
      return current;
    }
    const startedAt = (/* @__PURE__ */ new Date()).toISOString();
    return __spreadProps(__spreadValues({}, current), {
      updatedAt: startedAt,
      metadata: __spreadProps(__spreadValues({}, readMetadata(current)), {
        [BRACKET_START_NOTIFICATION_TOKEN_KEY]: bracketStartNotificationToken
      }),
      bracket: createSingleEliminationBracket(current.registrations, startedAt)
    });
  });
  nextRun = ensureReadyTournamentMatchesForRun(nk, logger, nextRun);
  syncTournamentParticipantFlowsForRun(nk, nextRun);
  if (nextRun.bracket && readStringField9(readMetadata(nextRun), [BRACKET_START_NOTIFICATION_TOKEN_KEY]) === bracketStartNotificationToken) {
    sendBracketReadyNotifications(nk, logger, nextRun);
  }
  return nextRun;
};
var buildTournamentLaunchResponse = (params) => JSON.stringify({
  ok: true,
  matchId: params.matchId,
  matchToken: null,
  tournamentRunId: params.run.runId,
  tournamentId: params.run.tournamentId,
  tournamentRound: params.tournamentRound,
  tournamentEntryId: params.tournamentEntryId,
  playerState: params.playerState,
  nextRoundReady: params.nextRoundReady,
  queueStatus: params.queueStatus,
  statusMessage: params.statusMessage
});
var buildActiveTournamentFlowResponse = (flow) => JSON.stringify({
  ok: true,
  flow
});
var maybeFinalizePublicRun = (logger, nk, run) => {
  var _a, _b;
  const maybeTimedOutRun = maybeAutoFinalizeRunForLobbyTimeout(logger, nk, run);
  if (maybeTimedOutRun.lifecycle === "finalized") {
    return maybeTimedOutRun;
  }
  try {
    return (_b = (_a = maybeAutoFinalizeTournamentRunById(nk, logger, maybeTimedOutRun.runId)) == null ? void 0 : _a.run) != null ? _b : maybeTimedOutRun;
  } catch (error) {
    logger.warn(
      "Unable to auto-finalize public tournament run %s while serving player status: %s",
      maybeTimedOutRun.runId,
      String(error)
    );
    return readRunOrThrow(nk, maybeTimedOutRun.runId);
  }
};
var rpcListPublicTournaments = (ctx, logger, nk, payload) => {
  const userId = requireAuthenticatedUserId(ctx);
  const parsed = parseJsonPayload2(payload);
  const limit = clampInteger(parsed.limit, DEFAULT_PUBLIC_LIST_LIMIT, 1, 100);
  const runs = listPublicRuns(nk).map(
    (run) => maybeFinalizePublicRun(
      logger,
      nk,
      maybeStartBracketForRun(nk, logger, run)
    )
  );
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
var rpcGetPublicTournament = (ctx, logger, nk, payload) => {
  const userId = requireAuthenticatedUserId(ctx);
  const parsed = parseJsonPayload2(payload);
  const runId = readStringField9(parsed, [
    "runId",
    "run_id",
    "tournamentRunId",
    "tournament_run_id",
    "tournamentId",
    "tournament_id"
  ]);
  if (!runId) {
    throw new Error("runId is required.");
  }
  let run = readRunOrThrow(nk, runId);
  run = maybeStartBracketForRun(nk, logger, run);
  run = maybeFinalizePublicRun(logger, nk, run);
  const nakamaTournament = getNakamaTournamentById(nk, run.tournamentId);
  const membership = resolveMembershipForRun(run, readMembership(nk, run.runId, userId));
  assertPublicRunReadable(run, nakamaTournament, membership);
  return JSON.stringify({
    ok: true,
    tournament: buildPublicTournamentResponse(
      run,
      nakamaTournament,
      membership
    )
  });
};
var rpcGetPublicTournamentStandings = (ctx, logger, nk, payload) => {
  var _a;
  const userId = requireAuthenticatedUserId(ctx);
  const parsed = parseJsonPayload2(payload);
  const runId = readStringField9(parsed, [
    "runId",
    "run_id",
    "tournamentRunId",
    "tournament_run_id",
    "tournamentId",
    "tournament_id"
  ]);
  if (!runId) {
    throw new Error("runId is required.");
  }
  let run = readRunOrThrow(nk, runId);
  run = maybeStartBracketForRun(nk, logger, run);
  run = maybeFinalizePublicRun(logger, nk, run);
  const nakamaTournament = getNakamaTournamentById(nk, run.tournamentId);
  const membership = resolveMembershipForRun(run, readMembership(nk, run.runId, userId));
  assertPublicRunReadable(run, nakamaTournament, membership);
  const limit = clampInteger(
    (_a = parsed.limit) != null ? _a : run.maxSize,
    Math.max(DEFAULT_PUBLIC_STANDINGS_LIMIT, run.maxSize),
    1,
    MAX_STANDINGS_LIMIT
  );
  const standings = resolveRunStandingsSnapshot(nk, run, limit, 0);
  return JSON.stringify({
    ok: true,
    tournamentRunId: run.runId,
    tournamentId: run.tournamentId,
    standings
  });
};
var rpcJoinPublicTournament = (ctx, logger, nk, payload) => {
  var _a;
  const userId = requireAuthenticatedUserId(ctx);
  requireCompletedUsernameOnboarding(nk, userId);
  const parsed = parseJsonPayload2(payload);
  const runId = readStringField9(parsed, [
    "runId",
    "run_id",
    "tournamentRunId",
    "tournament_run_id",
    "tournamentId",
    "tournament_id"
  ]);
  if (!runId) {
    throw new Error("runId is required.");
  }
  let run = readRunOrThrow(nk, runId);
  run = maybeStartBracketForRun(nk, logger, run);
  run = maybeFinalizePublicRun(logger, nk, run);
  const nakamaTournamentBeforeJoin = getNakamaTournamentById(nk, run.tournamentId);
  assertPublicRunVisible(run, nakamaTournamentBeforeJoin);
  const entryFee = resolveTournamentEntryFee(readMetadata(run));
  const existingMembership = resolveMembershipForRun(run, readMembership(nk, run.runId, userId));
  const displayName = getActorLabel(ctx);
  let joined = false;
  let membership = existingMembership;
  if (run.bracket) {
    if (!existingMembership) {
      throw new Error("This tournament is locked because play has already started.");
    }
  } else if (!existingMembership) {
    const entrantsBeforeJoin = getRunEntrants(run, nakamaTournamentBeforeJoin);
    const maxEntrants = getRunMaxEntrants(run, nakamaTournamentBeforeJoin);
    if (maxEntrants > 0 && entrantsBeforeJoin >= maxEntrants) {
      throw new Error("This tournament is already full.");
    }
    if (entryFee) {
      const wallet = getWalletForUser(nk, userId);
      const balanceKey = entryFee.currency === "soft" ? SOFT_CURRENCY_KEY : PREMIUM_CURRENCY_KEY;
      const insufficientBalanceError = entryFee.currency === "soft" ? "INSUFFICIENT_COINS" : "INSUFFICIENT_GEMS";
      const balance = (_a = wallet[balanceKey]) != null ? _a : 0;
      if (balance < entryFee.amount) {
        throw new Error(insufficientBalanceError);
      }
    }
    nk.tournamentJoin(run.tournamentId, userId, displayName);
    membership = writeMembership(nk, run, userId, displayName);
    setRegisteredTournamentParticipantFlow(nk, run, userId);
    if (entryFee) {
      const feeMetadata = {
        runId: run.runId,
        tournamentId: run.tournamentId,
        amount: entryFee.amount,
        currency: entryFee.currency
      };
      if (entryFee.currency === "soft") {
        spendSoftCurrency(nk, logger, {
          userId,
          amount: entryFee.amount,
          source: "tournament_entry_fee",
          metadata: feeMetadata
        });
      } else {
        spendPremiumCurrency(nk, logger, {
          userId,
          amount: entryFee.amount,
          source: "tournament_entry_fee",
          metadata: feeMetadata
        });
      }
    }
    joined = true;
    appendTournamentAuditEntry(ctx, logger, nk, { id: run.runId, name: run.title }, "tournament.public_joined", {
      joinedUserId: userId,
      displayName
    });
  }
  if (!membership) {
    throw new Error("Unable to resolve tournament membership.");
  }
  run = ensureRunRegistration(nk, logger, run, membership);
  run = maybeStartBracketForRun(nk, logger, run);
  run = maybeFinalizePublicRun(logger, nk, run);
  return JSON.stringify({
    ok: true,
    joined,
    tournament: buildPublicTournamentResponse(
      run,
      getNakamaTournamentById(nk, run.tournamentId),
      resolveMembershipForRun(run, readMembership(nk, run.runId, userId))
    )
  });
};
var rpcLaunchTournamentMatch = (ctx, logger, nk, payload) => {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k;
  const userId = requireAuthenticatedUserId(ctx);
  requireCompletedUsernameOnboarding(nk, userId);
  const parsed = parseJsonPayload2(payload);
  const runId = readStringField9(parsed, [
    "runId",
    "run_id",
    "tournamentRunId",
    "tournament_run_id",
    "tournamentId",
    "tournament_id"
  ]);
  if (!runId) {
    throw new Error("runId is required.");
  }
  let run = readRunOrThrow(nk, runId);
  const membership = resolveMembershipForRun(run, readMembership(nk, run.runId, userId));
  if (!membership) {
    throw new Error("Join this tournament before launching a match.");
  }
  run = ensureRunRegistration(nk, logger, run, membership);
  run = maybeStartBracketForRun(nk, logger, run);
  run = maybeFinalizePublicRun(logger, nk, run);
  const nakamaTournament = getNakamaTournamentById(nk, run.tournamentId);
  const participation = buildPublicParticipationState(run, membership);
  const isTerminalRun = run.lifecycle === "closed" || run.lifecycle === "finalized" || run.finalizedAt != null || ((_a = run.bracket) == null ? void 0 : _a.finalizedAt) != null;
  if (participation.state === "eliminated") {
    throw new Error("Your tournament run has ended.");
  }
  if (participation.state === "champion" || participation.state === "runner_up" || isTerminalRun) {
    return buildTournamentLaunchResponse({
      run,
      matchId: null,
      tournamentRound: participation.currentRound,
      tournamentEntryId: participation.currentEntryId,
      playerState: (_b = participation.state) != null ? _b : "finalized",
      nextRoundReady: false,
      queueStatus: "finalized",
      statusMessage: "Tournament complete."
    });
  }
  assertPublicRunVisible(run, nakamaTournament);
  if (!run.bracket) {
    const launchBlockedReason = getLaunchBlockedReason(run, nakamaTournament);
    if (launchBlockedReason === "lobby") {
      throw new Error("This tournament is waiting for the lobby to fill.");
    }
    if (launchBlockedReason === "start") {
      throw new Error("This tournament is full and will start at the scheduled time.");
    }
    throw new Error("This tournament bracket is not ready yet.");
  }
  const participant = getTournamentBracketParticipant(run.bracket, userId);
  if (!participant) {
    throw new Error("You are not seated in this tournament bracket.");
  }
  const resolvedParticipantState = resolvePublicParticipantBracketState(run.bracket, participant);
  if (participant.state === "eliminated") {
    throw new Error("Your tournament run has ended.");
  }
  if (participant.state === "champion" || participant.state === "runner_up") {
    return buildTournamentLaunchResponse({
      run,
      matchId: null,
      tournamentRound: participant.currentRound,
      tournamentEntryId: participant.currentEntryId,
      playerState: participant.state,
      nextRoundReady: false,
      queueStatus: "finalized",
      statusMessage: "Tournament complete."
    });
  }
  if (resolvedParticipantState.activeMatchId) {
    markTournamentParticipantFlowInMatch(nk, run, userId, resolvedParticipantState.activeMatchId);
    return buildTournamentLaunchResponse({
      run,
      matchId: resolvedParticipantState.activeMatchId,
      tournamentRound: (_d = (_c = resolvedParticipantState.currentEntry) == null ? void 0 : _c.round) != null ? _d : participant.currentRound,
      tournamentEntryId: (_f = (_e = resolvedParticipantState.currentEntry) == null ? void 0 : _e.entryId) != null ? _f : participant.currentEntryId,
      playerState: resolvedParticipantState.playerState,
      nextRoundReady: true,
      queueStatus: "active_match",
      statusMessage: "Resuming active tournament match."
    });
  }
  if (!resolvedParticipantState.currentEntry) {
    syncTournamentParticipantFlow(nk, run, userId);
    return buildTournamentLaunchResponse({
      run,
      matchId: null,
      tournamentRound: participant.currentRound,
      tournamentEntryId: null,
      playerState: resolvedParticipantState.playerState,
      nextRoundReady: false,
      queueStatus: "waiting_next_round",
      statusMessage: "Waiting for the next tournament pairing."
    });
  }
  const entry = resolvedParticipantState.currentEntry;
  if (entry.status === "in_match" && entry.matchId) {
    markTournamentParticipantFlowInMatch(nk, run, userId, entry.matchId);
    return buildTournamentLaunchResponse({
      run,
      matchId: entry.matchId,
      tournamentRound: entry.round,
      tournamentEntryId: entry.entryId,
      playerState: "in_match",
      nextRoundReady: true,
      queueStatus: "active_match",
      statusMessage: "Resuming active tournament match."
    });
  }
  if (!resolvedParticipantState.canLaunch || entry.status !== "ready") {
    syncTournamentParticipantFlow(nk, run, userId);
    return buildTournamentLaunchResponse({
      run,
      matchId: null,
      tournamentRound: entry.round,
      tournamentEntryId: entry.entryId,
      playerState: resolvedParticipantState.playerState,
      nextRoundReady: false,
      queueStatus: "waiting_next_round",
      statusMessage: "Waiting for the rest of the bracket to settle."
    });
  }
  const dispatch = ensureTournamentMatchDispatchForParticipant(nk, logger, run, userId);
  run = dispatch.run;
  const activeParticipant = run.bracket ? getTournamentBracketParticipant(run.bracket, userId) : null;
  const activeEntry = (activeParticipant == null ? void 0 : activeParticipant.currentEntryId) && run.bracket ? getTournamentBracketEntry(run.bracket, activeParticipant.currentEntryId) : null;
  const resolvedMatchId = (_i = (_h = (_g = dispatch.flow.currentMatchId) != null ? _g : activeParticipant == null ? void 0 : activeParticipant.activeMatchId) != null ? _h : activeEntry == null ? void 0 : activeEntry.matchId) != null ? _i : null;
  if (!resolvedMatchId) {
    throw new Error("Unable to resolve tournament match assignment.");
  }
  markTournamentParticipantFlowInMatch(nk, run, userId, resolvedMatchId);
  appendTournamentAuditEntry(ctx, logger, nk, { id: run.runId, name: run.title }, "tournament.match_launch.created", {
    matchId: resolvedMatchId,
    entryId: entry.entryId,
    round: entry.round,
    playerUserId: userId
  });
  return buildTournamentLaunchResponse({
    run,
    matchId: resolvedMatchId,
    tournamentRound: (_j = activeEntry == null ? void 0 : activeEntry.round) != null ? _j : entry.round,
    tournamentEntryId: (_k = activeEntry == null ? void 0 : activeEntry.entryId) != null ? _k : entry.entryId,
    playerState: "in_match",
    nextRoundReady: true,
    queueStatus: "active_match",
    statusMessage: "Tournament match ready."
  });
};
var rpcGetActiveTournamentFlow = (ctx, logger, nk, _payload) => {
  var _a;
  const userId = requireAuthenticatedUserId(ctx);
  const runs = listPublicRuns(nk);
  const membershipsByRunId = readMembershipsByRunId(
    nk,
    runs.map((run) => run.runId),
    userId
  );
  const activeFlows = [];
  runs.forEach((candidateRun) => {
    var _a2, _b, _c;
    let run = candidateRun;
    const membership = resolveMembershipForRun(run, (_a2 = membershipsByRunId[run.runId]) != null ? _a2 : null);
    if (!membership) {
      return;
    }
    try {
      run = ensureRunRegistration(nk, logger, run, membership);
      run = maybeStartBracketForRun(nk, logger, run);
      run = maybeFinalizePublicRun(logger, nk, run);
      if (!run.bracket) {
        setRegisteredTournamentParticipantFlow(nk, run, userId);
        return;
      }
      const dispatch = ensureTournamentMatchDispatchForParticipant(nk, logger, run, userId);
      const flow = (_b = readTournamentParticipantFlow(nk, dispatch.run.runId, userId)) != null ? _b : dispatch.flow;
      if (!isActiveTournamentParticipantFlow(flow)) {
        return;
      }
      activeFlows.push(buildTournamentParticipantFlowResponse(dispatch.run, flow));
      if (((_c = flow.pendingDestination) == null ? void 0 : _c.type) === "match") {
        markTournamentParticipantFlowInMatch(nk, dispatch.run, userId, flow.pendingDestination.matchId);
      }
    } catch (error) {
      logger.warn(
        "Unable to resolve active tournament flow for run %s user %s: %s",
        candidateRun.runId,
        userId,
        String(error)
      );
    }
  });
  const selectedFlow = (_a = activeFlows.slice().sort((left, right) => {
    var _a2, _b, _c;
    if (((_a2 = left.pendingDestination) == null ? void 0 : _a2.type) !== ((_b = right.pendingDestination) == null ? void 0 : _b.type)) {
      return ((_c = left.pendingDestination) == null ? void 0 : _c.type) === "match" ? -1 : 1;
    }
    return right.updatedAt.localeCompare(left.updatedAt);
  })[0]) != null ? _a : null;
  return buildActiveTournamentFlowResponse(selectedFlow);
};

// backend/modules/analytics/availability.ts
var STATUS_PRIORITY = {
  tracking_missing: 5,
  not_enough_data: 4,
  no_data: 3,
  partial: 2,
  available: 1
};
var uniqueNotes = (notes) => Array.from(new Set(notes.filter((note) => note.trim().length > 0)));
var createAvailability = (status, options) => {
  var _a;
  return {
    status,
    hasData: status === "available" || status === "partial",
    sampleSize: typeof (options == null ? void 0 : options.sampleSize) === "number" ? options.sampleSize : null,
    notes: uniqueNotes((_a = options == null ? void 0 : options.notes) != null ? _a : [])
  };
};
var available = (sampleSize) => createAvailability("available", { sampleSize });
var partial = (notes, sampleSize) => createAvailability("partial", { notes, sampleSize });
var noData = (note, sampleSize) => createAvailability("no_data", { notes: [note], sampleSize });
var notEnoughData = (note, sampleSize) => createAvailability("not_enough_data", { notes: [note], sampleSize });
var trackingMissing = (note) => createAvailability("tracking_missing", { notes: [note] });
var mergeAvailability = (...items) => {
  if (items.length === 0) {
    return available();
  }
  const status = items.reduce((current, item) => {
    if (STATUS_PRIORITY[item.status] > STATUS_PRIORITY[current]) {
      return item.status;
    }
    return current;
  }, "available");
  const sampleSizes = items.map((item) => item.sampleSize).filter((sampleSize) => typeof sampleSize === "number" && Number.isFinite(sampleSize));
  return createAvailability(status, {
    sampleSize: sampleSizes.length > 0 ? Math.max(...sampleSizes) : null,
    notes: items.flatMap((item) => item.notes)
  });
};
var toResponseAvailability = (availability) => ({
  hasEnoughData: availability.status === "available" || availability.status === "partial",
  notes: availability.notes
});

// backend/modules/analytics/filters.ts
var DEFAULT_LIMIT = 25;
var MAX_LIMIT = 100;
var DEFAULT_RANGE_DAYS = 30;
var DAY_MS = 24 * 60 * 60 * 1e3;
var asRecord8 = (value) => typeof value === "object" && value !== null ? value : null;
var readStringField13 = (value, keys) => {
  const record = asRecord8(value);
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
var readNumberField8 = (value, keys) => {
  const record = asRecord8(value);
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
var parsePayload = (payload) => {
  var _a;
  if (!payload) {
    return {};
  }
  const parsed = JSON.parse(payload);
  return (_a = asRecord8(parsed)) != null ? _a : {};
};
var clampLimit2 = (value) => {
  const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  if (!Number.isFinite(parsed)) {
    return DEFAULT_LIMIT;
  }
  return Math.max(1, Math.min(MAX_LIMIT, Math.floor(parsed)));
};
var parseDateMs = (value, fallback) => {
  if (!value) {
    return fallback;
  }
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};
var sanitizeRange = (startMs, endMs) => {
  if (startMs <= endMs) {
    return { startMs, endMs };
  }
  return { startMs: endMs, endMs: startMs };
};
var parseAnalyticsFilters = (payload, now = Date.now()) => {
  const parsed = parsePayload(payload);
  const fallbackEndMs = now;
  const fallbackStartMs = fallbackEndMs - (DEFAULT_RANGE_DAYS - 1) * DAY_MS;
  const rawStartMs = parseDateMs(
    readStringField13(parsed, ["startDate", "start_date"]),
    fallbackStartMs
  );
  const rawEndMs = parseDateMs(
    readStringField13(parsed, ["endDate", "end_date"]),
    fallbackEndMs
  );
  const { startMs, endMs } = sanitizeRange(rawStartMs, rawEndMs);
  const tournamentId = readStringField13(parsed, ["tournamentId", "tournament_id"]);
  const gameMode = readStringField13(parsed, ["gameMode", "game_mode"]);
  const eloMin = readNumberField8(parsed, ["eloMin", "elo_min"]);
  const eloMax = readNumberField8(parsed, ["eloMax", "elo_max"]);
  return {
    startDate: new Date(startMs).toISOString(),
    endDate: new Date(endMs).toISOString(),
    startMs,
    endMs,
    tournamentId,
    gameMode,
    eloMin: typeof eloMin === "number" ? Math.floor(eloMin) : null,
    eloMax: typeof eloMax === "number" ? Math.floor(eloMax) : null,
    limit: clampLimit2(parsed.limit)
  };
};
var isWithinRange = (value, filters) => {
  if (!value) {
    return false;
  }
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) && parsed >= filters.startMs && parsed <= filters.endMs;
};
var toResponseFilters = (filters) => ({
  startDate: filters.startDate,
  endDate: filters.endDate,
  tournamentId: filters.tournamentId,
  gameMode: filters.gameMode,
  eloMin: filters.eloMin,
  eloMax: filters.eloMax,
  limit: filters.limit
});
var DAY_BUCKET_MS = DAY_MS;

// backend/modules/analytics/service.ts
var MATCH_DURATION_BUCKETS = [
  { key: "under_5", label: "< 5m", min: 0, max: 5 * 60 },
  { key: "5_10", label: "5-10m", min: 5 * 60, max: 10 * 60 },
  { key: "10_15", label: "10-15m", min: 10 * 60, max: 15 * 60 },
  { key: "15_20", label: "15-20m", min: 15 * 60, max: 20 * 60 },
  { key: "20_plus", label: "20m+", min: 20 * 60, max: null }
];
var TOURNAMENT_DURATION_BUCKETS = [
  { key: "under_30m", label: "< 30m", min: 0, max: 30 * 60 },
  { key: "30_60m", label: "30-60m", min: 30 * 60, max: 60 * 60 },
  { key: "60_120m", label: "1-2h", min: 60 * 60, max: 120 * 60 },
  { key: "2_6h", label: "2-6h", min: 120 * 60, max: 6 * 60 * 60 },
  { key: "6h_plus", label: "6h+", min: 6 * 60 * 60, max: null }
];
var ELO_BUCKETS = [
  { key: "below_1000", label: "< 1000", min: Number.NEGATIVE_INFINITY, max: 1e3 },
  { key: "1000_1199", label: "1000-1199", min: 1e3, max: 1200 },
  { key: "1200_1399", label: "1200-1399", min: 1200, max: 1400 },
  { key: "1400_1599", label: "1400-1599", min: 1400, max: 1600 },
  { key: "1600_plus", label: "1600+", min: 1600, max: null }
];
var PARTICIPATION_BUCKETS = [
  { key: "1_4", label: "1-4 entrants", min: 1, max: 5 },
  { key: "5_8", label: "5-8 entrants", min: 5, max: 9 },
  { key: "9_16", label: "9-16 entrants", min: 9, max: 17 },
  { key: "17_plus", label: "17+ entrants", min: 17, max: null }
];
var asRecord9 = (value) => typeof value === "object" && value !== null ? value : null;
var readStringField14 = (value, keys) => {
  const record = asRecord9(value);
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
var readNumberField9 = (value, keys) => {
  const record = asRecord9(value);
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
var readBooleanField8 = (value, keys) => {
  const record = asRecord9(value);
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
var readStringArrayField4 = (value, keys) => {
  const record = asRecord9(value);
  if (!record) {
    return [];
  }
  for (const key of keys) {
    const field = record[key];
    if (Array.isArray(field)) {
      return field.filter((entry) => typeof entry === "string" && entry.trim().length > 0);
    }
  }
  return [];
};
var getErrorMessage5 = (error) => error instanceof Error ? error.message : String(error);
var batch = (values, size) => {
  const chunks = [];
  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size));
  }
  return chunks;
};
var parseIsoMs3 = (value) => {
  if (!value) {
    return null;
  }
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
};
var startOfDayMs = (value) => {
  const date = new Date(value);
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
};
var toDayKey = (value) => {
  var _a;
  const timestamp = typeof value === "number" ? value : (_a = parseIsoMs3(value)) != null ? _a : Date.now();
  return new Date(startOfDayMs(timestamp)).toISOString().slice(0, 10);
};
var buildDayKeys = (filters) => {
  const keys = [];
  let cursor = startOfDayMs(filters.startMs);
  const finalDayMs = startOfDayMs(filters.endMs);
  while (cursor <= finalDayMs) {
    keys.push(new Date(cursor).toISOString().slice(0, 10));
    cursor += DAY_BUCKET_MS;
  }
  return keys;
};
var unique = (values) => Array.from(new Set(values));
var median = (values) => {
  if (values.length === 0) {
    return null;
  }
  const sorted = [...values].sort((left, right) => left - right);
  const midpoint = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return Math.round((sorted[midpoint - 1] + sorted[midpoint]) / 2 * 100) / 100;
  }
  return sorted[midpoint];
};
var toPercentage = (numerator, denominator) => {
  if (denominator <= 0) {
    return null;
  }
  return Math.round(numerator / denominator * 1e3) / 10;
};
var createMetric = (value, availability, options) => {
  var _a, _b, _c;
  return {
    value,
    numerator: (_a = options == null ? void 0 : options.numerator) != null ? _a : null,
    denominator: (_b = options == null ? void 0 : options.denominator) != null ? _b : null,
    previousValue: (_c = options == null ? void 0 : options.previousValue) != null ? _c : null,
    availability
  };
};
var getRunGameMode2 = (run) => {
  var _a;
  return (_a = readStringField14(run.metadata, ["gameMode", "game_mode"])) != null ? _a : "standard";
};
var runMatchesFilters = (run, filters) => {
  if (filters.tournamentId && filters.tournamentId !== run.runId && filters.tournamentId !== run.tournamentId) {
    return false;
  }
  if (filters.gameMode && filters.gameMode !== getRunGameMode2(run)) {
    return false;
  }
  return true;
};
var matchesEloFilter = (eloRating, filters) => {
  if (filters.eloMin !== null && (eloRating === null || eloRating < filters.eloMin)) {
    return false;
  }
  if (filters.eloMax !== null && (eloRating === null || eloRating > filters.eloMax)) {
    return false;
  }
  return true;
};
var isHumanUserId = (userId) => typeof userId === "string" && userId.trim().length > 0 && !isTournamentBotUserId(userId);
var normalizeTournamentMatchResult = (value) => {
  const record = asRecord9(value);
  const resultId = readStringField14(record, ["resultId", "result_id"]);
  const matchId = readStringField14(record, ["matchId", "match_id"]);
  const runId = readStringField14(record, ["runId", "run_id"]);
  const tournamentId = readStringField14(record, ["tournamentId", "tournament_id"]);
  if (!record || !resultId || !matchId || !runId || !tournamentId) {
    return null;
  }
  return record;
};
var normalizeEloHistoryRecord = (value) => {
  const record = asRecord9(value);
  const matchId = readStringField14(record, ["matchId", "match_id"]);
  const processedAt = readStringField14(record, ["processedAt", "processed_at"]);
  const winnerUserId = readStringField14(record, ["winnerUserId", "winner_user_id"]);
  const loserUserId = readStringField14(record, ["loserUserId", "loser_user_id"]);
  if (!record || !matchId || !processedAt || !winnerUserId || !loserUserId) {
    return null;
  }
  const rawPlayers = Array.isArray(record.playerResults) ? record.playerResults : Array.isArray(record.player_results) ? record.player_results : [];
  const playerResults = rawPlayers.map((player) => {
    var _a, _b, _c;
    const normalized = asRecord9(player);
    const userId = readStringField14(normalized, ["userId", "user_id"]);
    const usernameDisplay = readStringField14(normalized, ["usernameDisplay", "username_display"]);
    const oldRating = readNumberField9(normalized, ["oldRating", "old_rating"]);
    const newRating = readNumberField9(normalized, ["newRating", "new_rating"]);
    const delta = readNumberField9(normalized, ["delta"]);
    if (!normalized || !userId || !usernameDisplay || oldRating === null || newRating === null || delta === null) {
      return null;
    }
    return {
      userId,
      usernameDisplay,
      oldRating,
      newRating,
      delta,
      ratedGames: Math.max(0, Math.floor((_a = readNumberField9(normalized, ["ratedGames", "rated_games"])) != null ? _a : 0)),
      ratedWins: Math.max(0, Math.floor((_b = readNumberField9(normalized, ["ratedWins", "rated_wins"])) != null ? _b : 0)),
      ratedLosses: Math.max(0, Math.floor((_c = readNumberField9(normalized, ["ratedLosses", "rated_losses"])) != null ? _c : 0)),
      provisional: readBooleanField8(normalized, ["provisional"]) === true
    };
  }).filter((player) => Boolean(player));
  if (playerResults.length !== 2) {
    return null;
  }
  return {
    matchId,
    processedAt,
    winnerUserId,
    loserUserId,
    playerResults
  };
};
var normalizeStorageListResult3 = (value) => {
  if (Array.isArray(value)) {
    return {
      objects: value.map((entry) => {
        var _a;
        return (_a = asRecord9(entry)) != null ? _a : {};
      }),
      cursor: null
    };
  }
  const record = asRecord9(value);
  const objects = Array.isArray(record == null ? void 0 : record.objects) ? record.objects.map((entry) => {
    var _a;
    return (_a = asRecord9(entry)) != null ? _a : {};
  }) : [];
  return {
    objects,
    cursor: readStringField14(record, ["cursor", "nextCursor", "next_cursor"])
  };
};
var listAllGlobalObjects = (nk, logger, collection, userId) => {
  if (typeof nk.storageList !== "function") {
    return {
      supported: false,
      notes: [`Collection listing is not supported for '${collection}' on this runtime.`],
      objects: []
    };
  }
  const objects = [];
  let cursor = "";
  for (let page = 0; page < 50; page += 1) {
    try {
      const rawResult = nk.storageList(userId, collection, 100, cursor);
      const result = normalizeStorageListResult3(rawResult);
      objects.push(...result.objects);
      if (!result.cursor) {
        break;
      }
      cursor = result.cursor;
    } catch (error) {
      logger.warn("Unable to list storage collection %s: %s", collection, getErrorMessage5(error));
      return {
        supported: false,
        notes: [`Collection listing failed for '${collection}'.`],
        objects: []
      };
    }
  }
  return {
    supported: true,
    notes: [],
    objects
  };
};
var getLeaderboardRecordMetadata2 = (record) => {
  var _a;
  return asRecord9((_a = asRecord9(record)) == null ? void 0 : _a.metadata);
};
var getLeaderboardRecordOwnerId2 = (record) => readStringField14(record, ["ownerId", "owner_id"]);
var getLeaderboardRecordUsername2 = (record) => readStringField14(record, ["username"]);
var getLeaderboardRecordScore2 = (record) => readNumberField9(record, ["score"]);
var getLeaderboardRecordRank2 = (record) => readNumberField9(record, ["rank"]);
var listAllLeaderboardRows = (nk) => {
  if (typeof nk.leaderboardRecordsList !== "function") {
    return [];
  }
  const rows = [];
  let cursor = "";
  for (let page = 0; page < 50; page += 1) {
    const result = asRecord9(nk.leaderboardRecordsList(ELO_LEADERBOARD_ID, [], 100, cursor, 0));
    const records = Array.isArray(result == null ? void 0 : result.records) ? result.records : [];
    records.forEach((record) => {
      var _a, _b, _c, _d, _e, _f;
      const userId = getLeaderboardRecordOwnerId2(record);
      if (!userId) {
        return;
      }
      const metadata = getLeaderboardRecordMetadata2(record);
      const ratedGames = Math.max(0, Math.floor((_a = readNumberField9(metadata, ["ratedGames", "rated_games"])) != null ? _a : 0));
      rows.push({
        userId,
        usernameDisplay: (_c = (_b = readStringField14(metadata, ["usernameDisplay", "username_display"])) != null ? _b : getLeaderboardRecordUsername2(record)) != null ? _c : userId,
        eloRating: sanitizeEloRating((_d = getLeaderboardRecordScore2(record)) != null ? _d : DEFAULT_ELO_RATING),
        ratedGames,
        ratedWins: Math.max(0, Math.floor((_e = readNumberField9(metadata, ["ratedWins", "rated_wins"])) != null ? _e : 0)),
        ratedLosses: Math.max(0, Math.floor((_f = readNumberField9(metadata, ["ratedLosses", "rated_losses"])) != null ? _f : 0)),
        provisional: readBooleanField8(metadata, ["provisional"]) === true || ratedGames < 10,
        rank: getLeaderboardRecordRank2(record)
      });
    });
    const nextCursor = readStringField14(result, ["nextCursor", "next_cursor"]);
    if (!nextCursor) {
      break;
    }
    cursor = nextCursor;
  }
  return rows;
};
var loadRuns = (nk, filters) => {
  const runIds = readRunIndexState(nk).index.runIds;
  return readRunsByIds(nk, runIds).filter((run) => runMatchesFilters(run, filters)).sort((left, right) => right.createdAt.localeCompare(left.createdAt));
};
var readTournamentMatchResultIds = (run) => unique(readStringArrayField4(run.metadata, ["countedResultIds", "counted_result_ids"]));
var buildTournamentEntryContextByMatchId = (runs) => {
  const contextByMatchId = /* @__PURE__ */ new Map();
  runs.forEach((run) => {
    var _a;
    (_a = run.bracket) == null ? void 0 : _a.entries.forEach((entry) => {
      if (!entry.matchId) {
        return;
      }
      const startedAtMs = parseIsoMs3(entry.startedAt);
      const completedAtMs = parseIsoMs3(entry.completedAt);
      contextByMatchId.set(entry.matchId, {
        runId: run.runId,
        tournamentId: run.tournamentId,
        round: entry.round,
        startedAt: entry.startedAt,
        completedAt: entry.completedAt,
        durationSeconds: startedAtMs !== null && completedAtMs !== null && completedAtMs >= startedAtMs ? Math.round((completedAtMs - startedAtMs) / 1e3) : null
      });
    });
  });
  return contextByMatchId;
};
var loadTournamentMatchHistory = (nk, runs) => {
  const resultIds = unique(runs.flatMap((run) => readTournamentMatchResultIds(run)));
  if (resultIds.length === 0) {
    return [];
  }
  const objects = nk.storageRead(
    resultIds.map((resultId) => ({
      collection: TOURNAMENT_MATCH_RESULTS_COLLECTION2,
      key: resultId
    }))
  );
  const objectByKey = new Map(
    objects.map((object) => {
      const key = readStringField14(object, ["key"]);
      return key ? [key, object] : null;
    }).filter((entry) => Boolean(entry))
  );
  const entryContextByMatchId = buildTournamentEntryContextByMatchId(runs);
  return resultIds.map((resultId) => {
    var _a, _b;
    return normalizeTournamentMatchResult((_b = (_a = objectByKey.get(resultId)) == null ? void 0 : _a.value) != null ? _b : null);
  }).filter((record) => Boolean(record)).map((record) => {
    var _a, _b, _c, _d, _e, _f, _g;
    const summary = asRecord9(record.summary);
    const classificationRecord = asRecord9(summary == null ? void 0 : summary.classification);
    const entryContext = (_a = entryContextByMatchId.get(record.matchId)) != null ? _a : null;
    const players = Array.isArray(summary == null ? void 0 : summary.players) ? summary.players.map((player) => {
      const normalized = asRecord9(player);
      const userId = readStringField14(normalized, ["userId", "user_id"]);
      if (!normalized || !userId) {
        return null;
      }
      return {
        userId,
        username: readStringField14(normalized, ["username"]),
        color: (() => {
          const color = readStringField14(normalized, ["color"]);
          return color === "light" || color === "dark" ? color : null;
        })(),
        didWin: readBooleanField8(normalized, ["didWin", "did_win"]),
        capturesMade: readNumberField9(normalized, ["capturesMade", "captures_made"]),
        capturesSuffered: readNumberField9(normalized, ["capturesSuffered", "captures_suffered"]),
        playerMoveCount: readNumberField9(normalized, ["playerMoveCount", "player_move_count"]),
        finishedCount: readNumberField9(normalized, ["finishedCount", "finished_count"]),
        isBot: isTournamentBotUserId(userId)
      };
    }).filter((player) => Boolean(player)) : [];
    return {
      source: "tournament",
      matchId: record.matchId,
      startedAt: (_b = entryContext == null ? void 0 : entryContext.startedAt) != null ? _b : null,
      endedAt: (_d = (_c = readStringField14(summary, ["completedAt", "completed_at"])) != null ? _c : entryContext == null ? void 0 : entryContext.completedAt) != null ? _d : record.updatedAt,
      durationSeconds: (_e = entryContext == null ? void 0 : entryContext.durationSeconds) != null ? _e : null,
      reason: "completed",
      modeId: (_g = readStringField14(summary, ["modeId", "mode_id"])) != null ? _g : getRunGameMode2((_f = runs.find((run) => run.runId === record.runId)) != null ? _f : runs[0]),
      classification: {
        ranked: readBooleanField8(classificationRecord, ["ranked"]) === true,
        casual: readBooleanField8(classificationRecord, ["casual"]) === true,
        private: readBooleanField8(classificationRecord, ["private"]) === true,
        bot: readBooleanField8(classificationRecord, ["bot"]) === true,
        experimental: readBooleanField8(classificationRecord, ["experimental"]) === true,
        tournament: true
      },
      tournamentRunId: record.runId,
      tournamentId: record.tournamentId,
      winnerUserId: readStringField14(summary, ["winnerUserId", "winner_user_id"]),
      loserUserId: readStringField14(summary, ["loserUserId", "loser_user_id"]),
      totalMoves: readNumberField9(summary, ["totalMoves", "total_moves"]),
      totalTurns: null,
      players
    };
  });
};
var loadTrackedAnalyticsEvents = (nk, logger) => {
  const result = listAnalyticsEvents(nk, logger);
  return {
    supported: result.supported,
    notes: result.notes,
    trackedMatchStarts: result.events.filter(
      (event) => event.type === "match_start"
    ),
    trackedMatchEnds: result.events.filter(
      (event) => event.type === "match_end"
    ),
    xpAwardEvents: result.events.filter((event) => event.type === "xp_awarded")
  };
};
var buildTrackedMatchHistory = (trackedMatchEnds, filters) => trackedMatchEnds.filter((event) => {
  if (filters.gameMode && filters.gameMode !== event.modeId) {
    return false;
  }
  if (filters.tournamentId && filters.tournamentId !== event.tournamentRunId && filters.tournamentId !== event.tournamentId) {
    return false;
  }
  return true;
}).map((event) => ({
  source: "tracked",
  matchId: event.matchId,
  startedAt: event.startedAt,
  endedAt: event.endedAt,
  durationSeconds: event.durationSeconds,
  reason: event.reason,
  modeId: event.modeId,
  classification: event.classification,
  tournamentRunId: event.tournamentRunId,
  tournamentId: event.tournamentId,
  winnerUserId: event.winnerUserId,
  loserUserId: event.loserUserId,
  totalMoves: event.totalMoves,
  totalTurns: event.totalTurns,
  players: event.players.map((player) => ({
    userId: player.userId,
    username: player.username,
    color: player.color,
    didWin: player.didWin,
    capturesMade: player.capturesMade,
    capturesSuffered: player.capturesSuffered,
    playerMoveCount: player.playerMoveCount,
    finishedCount: player.finishedCount,
    isBot: player.isBot
  }))
}));
var loadEloHistory = (nk, logger, filters) => {
  const leaderboardRows = listAllLeaderboardRows(nk);
  const historyResult = listAllGlobalObjects(nk, logger, "elo_match_results", "00000000-0000-0000-0000-000000000000");
  const eloHistory = historyResult.objects.map((object) => {
    var _a;
    return normalizeEloHistoryRecord((_a = object.value) != null ? _a : null);
  }).filter((record) => Boolean(record));
  const eloMatches = eloHistory.filter((record) => {
    if (filters.gameMode && filters.gameMode !== "standard") {
      return false;
    }
    return true;
  }).map((record) => ({
    source: "elo",
    matchId: record.matchId,
    startedAt: null,
    endedAt: record.processedAt,
    durationSeconds: null,
    reason: "completed",
    modeId: "standard",
    classification: {
      ranked: true,
      casual: false,
      private: false,
      bot: false,
      experimental: false,
      tournament: false
    },
    tournamentRunId: null,
    tournamentId: null,
    winnerUserId: record.winnerUserId,
    loserUserId: record.loserUserId,
    totalMoves: null,
    totalTurns: null,
    players: record.playerResults.map((player) => ({
      userId: player.userId,
      username: player.usernameDisplay,
      color: null,
      didWin: player.userId === record.winnerUserId,
      capturesMade: null,
      capturesSuffered: null,
      playerMoveCount: null,
      finishedCount: null,
      isBot: false
    }))
  }));
  return {
    supported: historyResult.supported,
    notes: historyResult.notes,
    leaderboardRows,
    eloHistory,
    eloMatches
  };
};
var loadKnownUsers = (nk, userIds, leaderboardRows) => {
  const leaderboardByUserId = new Map(leaderboardRows.map((row) => [row.userId, row]));
  const records = /* @__PURE__ */ new Map();
  const uniqueUserIds = unique(userIds.filter((userId) => isHumanUserId(userId)));
  batch(uniqueUserIds, 60).forEach((chunk) => {
    const requests = chunk.flatMap((userId) => [
      {
        collection: USERNAME_PROFILE_COLLECTION,
        key: USERNAME_PROFILE_KEY,
        userId
      },
      {
        collection: PROGRESSION_COLLECTION,
        key: PROGRESSION_PROFILE_KEY,
        userId
      }
    ]);
    const objects = nk.storageRead(requests);
    const objectEntries = objects.map((object) => {
      const collection = readStringField14(object, ["collection"]);
      const key = readStringField14(object, ["key"]);
      const userId = readStringField14(object, ["userId", "user_id"]);
      return collection && key && userId ? [`${collection}:${key}:${userId}`, object] : null;
    }).filter(
      (entry) => entry !== null
    );
    const objectMap = new Map(objectEntries);
    chunk.forEach((userId) => {
      var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k;
      const usernameProfile = asRecord9(
        (_b = (_a = objectMap.get(`${USERNAME_PROFILE_COLLECTION}:${USERNAME_PROFILE_KEY}:${userId}`)) == null ? void 0 : _a.value) != null ? _b : null
      );
      const progressionProfile = asRecord9(
        (_d = (_c = objectMap.get(`${PROGRESSION_COLLECTION}:${PROGRESSION_PROFILE_KEY}:${userId}`)) == null ? void 0 : _c.value) != null ? _d : null
      );
      const leaderboardRow = (_e = leaderboardByUserId.get(userId)) != null ? _e : null;
      records.set(userId, {
        userId,
        username: (_g = (_f = readStringField14(usernameProfile, ["usernameDisplay", "username_display"])) != null ? _f : leaderboardRow == null ? void 0 : leaderboardRow.usernameDisplay) != null ? _g : userId,
        createdAt: readStringField14(usernameProfile, ["createdAt", "created_at"]),
        totalXp: readNumberField9(progressionProfile, ["totalXp", "total_xp"]),
        currentRankTitle: readStringField14(progressionProfile, ["currentRankTitle", "current_rank_title"]),
        eloRating: (_h = leaderboardRow == null ? void 0 : leaderboardRow.eloRating) != null ? _h : null,
        ratedGames: (_i = leaderboardRow == null ? void 0 : leaderboardRow.ratedGames) != null ? _i : null,
        ratedWins: (_j = leaderboardRow == null ? void 0 : leaderboardRow.ratedWins) != null ? _j : null,
        ratedLosses: (_k = leaderboardRow == null ? void 0 : leaderboardRow.ratedLosses) != null ? _k : null
      });
    });
  });
  return records;
};
var buildUnifiedMatches = (trackedMatches, tournamentMatches, eloMatches) => {
  const matchById = /* @__PURE__ */ new Map();
  tournamentMatches.forEach((match) => {
    matchById.set(match.matchId, match);
  });
  eloMatches.forEach((match) => {
    if (!matchById.has(match.matchId)) {
      matchById.set(match.matchId, match);
    }
  });
  trackedMatches.forEach((match) => {
    matchById.set(match.matchId, match);
  });
  return Array.from(matchById.values()).sort((left, right) => left.endedAt.localeCompare(right.endedAt));
};
var collectActivityEvents = (runs, trackedMatchStarts, trackedMatchEnds, tournamentMatches, eloMatches, xpAwardEvents) => {
  const events = [];
  runs.forEach((run) => {
    run.registrations.forEach((registration) => {
      if (!isHumanUserId(registration.userId)) {
        return;
      }
      events.push({
        userId: registration.userId,
        occurredAt: registration.joinedAt,
        source: "tournament_registration"
      });
    });
  });
  trackedMatchStarts.forEach((event) => {
    event.players.forEach((player) => {
      if (!isHumanUserId(player.userId)) {
        return;
      }
      events.push({
        userId: player.userId,
        occurredAt: event.startedAt,
        source: "match_start"
      });
    });
  });
  trackedMatchEnds.forEach((event) => {
    event.players.forEach((player) => {
      if (!isHumanUserId(player.userId)) {
        return;
      }
      events.push({
        userId: player.userId,
        occurredAt: event.endedAt,
        source: "match_end"
      });
    });
  });
  tournamentMatches.forEach((match) => {
    match.players.forEach((player) => {
      if (!isHumanUserId(player.userId)) {
        return;
      }
      events.push({
        userId: player.userId,
        occurredAt: match.endedAt,
        source: "tournament_match"
      });
    });
  });
  eloMatches.forEach((match) => {
    match.players.forEach((player) => {
      if (!isHumanUserId(player.userId)) {
        return;
      }
      events.push({
        userId: player.userId,
        occurredAt: match.endedAt,
        source: "ranked_match"
      });
    });
  });
  xpAwardEvents.forEach((event) => {
    if (!isHumanUserId(event.userId)) {
      return;
    }
    events.push({
      userId: event.userId,
      occurredAt: event.occurredAt,
      source: "xp_award"
    });
  });
  return events.sort((left, right) => left.occurredAt.localeCompare(right.occurredAt));
};
var buildFirstSeenByUserId = (usersById, activityEvents) => {
  const firstSeenByUserId = /* @__PURE__ */ new Map();
  usersById.forEach((user) => {
    if (user.createdAt) {
      firstSeenByUserId.set(user.userId, user.createdAt);
    }
  });
  activityEvents.forEach((event) => {
    const current = firstSeenByUserId.get(event.userId);
    if (!current || event.occurredAt < current) {
      firstSeenByUserId.set(event.userId, event.occurredAt);
    }
  });
  return firstSeenByUserId;
};
var buildUserPerformance = (usersById, unifiedMatches, runs, firstSeenByUserId) => {
  const participationByUserId = /* @__PURE__ */ new Map();
  const performanceByUserId = /* @__PURE__ */ new Map();
  runs.forEach((run) => {
    run.registrations.forEach((registration) => {
      var _a;
      if (!isHumanUserId(registration.userId)) {
        return;
      }
      participationByUserId.set(
        registration.userId,
        ((_a = participationByUserId.get(registration.userId)) != null ? _a : 0) + 1
      );
    });
  });
  unifiedMatches.forEach((match) => {
    match.players.forEach((player) => {
      var _a, _b, _c, _d, _e, _f;
      if (!isHumanUserId(player.userId)) {
        return;
      }
      const current = (_f = performanceByUserId.get(player.userId)) != null ? _f : {
        userId: player.userId,
        username: (_c = (_b = (_a = usersById.get(player.userId)) == null ? void 0 : _a.username) != null ? _b : player.username) != null ? _c : player.userId,
        matchesPlayed: 0,
        wins: 0,
        losses: 0,
        tournamentParticipations: (_d = participationByUserId.get(player.userId)) != null ? _d : 0,
        lastActiveAt: null,
        firstSeenAt: (_e = firstSeenByUserId.get(player.userId)) != null ? _e : null
      };
      current.matchesPlayed += 1;
      current.wins += player.didWin === true ? 1 : 0;
      current.losses += player.didWin === false ? 1 : 0;
      current.lastActiveAt = current.lastActiveAt && current.lastActiveAt > match.endedAt ? current.lastActiveAt : match.endedAt;
      performanceByUserId.set(player.userId, current);
    });
  });
  usersById.forEach((user) => {
    var _a, _b;
    if (!performanceByUserId.has(user.userId)) {
      performanceByUserId.set(user.userId, {
        userId: user.userId,
        username: user.username,
        matchesPlayed: 0,
        wins: 0,
        losses: 0,
        tournamentParticipations: (_a = participationByUserId.get(user.userId)) != null ? _a : 0,
        lastActiveAt: null,
        firstSeenAt: (_b = firstSeenByUserId.get(user.userId)) != null ? _b : null
      });
    }
  });
  return performanceByUserId;
};
var createAnalyticsContext = (nk, logger, filters) => {
  const generatedAt = (/* @__PURE__ */ new Date()).toISOString();
  const runs = loadRuns(nk, filters);
  const tournamentMatches = loadTournamentMatchHistory(nk, runs);
  const trackedResult = loadTrackedAnalyticsEvents(nk, logger);
  const trackedMatches = buildTrackedMatchHistory(trackedResult.trackedMatchEnds, filters);
  const eloResult = loadEloHistory(nk, logger, filters);
  const unifiedMatches = buildUnifiedMatches(trackedMatches, tournamentMatches, eloResult.eloMatches);
  const userIds = unique(
    [
      ...runs.flatMap((run) => run.registrations.map((registration) => registration.userId)),
      ...trackedResult.trackedMatchStarts.flatMap((event) => event.players.map((player) => player.userId)),
      ...trackedResult.trackedMatchEnds.flatMap((event) => event.players.map((player) => player.userId)),
      ...tournamentMatches.flatMap((match) => match.players.map((player) => player.userId)),
      ...eloResult.eloMatches.flatMap((match) => match.players.map((player) => player.userId)),
      ...eloResult.leaderboardRows.map((row) => row.userId),
      ...trackedResult.xpAwardEvents.map((event) => event.userId)
    ].filter((userId) => isHumanUserId(userId))
  );
  const usersById = loadKnownUsers(nk, userIds, eloResult.leaderboardRows);
  const activityEvents = collectActivityEvents(
    runs,
    trackedResult.trackedMatchStarts,
    trackedResult.trackedMatchEnds,
    tournamentMatches,
    eloResult.eloMatches,
    trackedResult.xpAwardEvents
  );
  const firstSeenByUserId = buildFirstSeenByUserId(usersById, activityEvents);
  const userPerformanceById = buildUserPerformance(usersById, unifiedMatches, runs, firstSeenByUserId);
  return {
    generatedAt,
    filters,
    runs,
    tournamentMatches,
    trackedMatches,
    eloMatches: eloResult.eloMatches,
    unifiedMatches,
    trackedMatchStarts: trackedResult.trackedMatchStarts.filter((event) => {
      if (filters.gameMode && filters.gameMode !== event.modeId) {
        return false;
      }
      if (filters.tournamentId && filters.tournamentId !== event.tournamentRunId && filters.tournamentId !== event.tournamentId) {
        return false;
      }
      return true;
    }),
    trackedMatchEnds: trackedResult.trackedMatchEnds,
    xpAwardEvents: trackedResult.xpAwardEvents,
    activityEvents,
    usersById,
    userPerformanceById,
    firstSeenByUserId,
    leaderboardRows: eloResult.leaderboardRows,
    eloHistory: eloResult.eloHistory,
    eventsSupported: trackedResult.supported,
    eloHistorySupported: eloResult.supported,
    runtimeNotes: [...trackedResult.notes, ...eloResult.notes]
  };
};
var filterEndedMatchesInWindow = (matches, startMs, endMs) => matches.filter((match) => {
  const endedAtMs = parseIsoMs3(match.endedAt);
  return endedAtMs !== null && endedAtMs >= startMs && endedAtMs <= endMs;
});
var filterStartsInWindow = (context, startMs, endMs) => {
  const startsById = /* @__PURE__ */ new Map();
  context.trackedMatchStarts.forEach((event) => {
    const startedAtMs = parseIsoMs3(event.startedAt);
    if (startedAtMs === null || startedAtMs < startMs || startedAtMs > endMs) {
      return;
    }
    startsById.set(event.matchId, {
      matchId: event.matchId,
      startedAt: event.startedAt,
      modeId: event.modeId,
      tournamentRunId: event.tournamentRunId,
      tournamentId: event.tournamentId
    });
  });
  context.runs.forEach((run) => {
    var _a;
    (_a = run.bracket) == null ? void 0 : _a.entries.forEach((entry) => {
      if (!entry.matchId || !entry.startedAt) {
        return;
      }
      const startedAtMs = parseIsoMs3(entry.startedAt);
      if (startedAtMs === null || startedAtMs < startMs || startedAtMs > endMs) {
        return;
      }
      startsById.set(entry.matchId, {
        matchId: entry.matchId,
        startedAt: entry.startedAt,
        modeId: getRunGameMode2(run),
        tournamentRunId: run.runId,
        tournamentId: run.tournamentId
      });
    });
  });
  return Array.from(startsById.values());
};
var buildStartedMatchMetrics = (context, startMs, endMs) => {
  const starts = filterStartsInWindow(context, startMs, endMs);
  const matchById = new Map(context.unifiedMatches.map((match) => [match.matchId, match]));
  let completedCount = 0;
  let disconnectCount = 0;
  let inactivityCount = 0;
  starts.forEach((start) => {
    var _a;
    const matched = (_a = matchById.get(start.matchId)) != null ? _a : null;
    if (!matched) {
      return;
    }
    if (matched.reason === "completed") {
      completedCount += 1;
      return;
    }
    if (matched.reason === "forfeit_disconnect") {
      disconnectCount += 1;
      return;
    }
    if (matched.reason === "forfeit_inactivity") {
      inactivityCount += 1;
    }
  });
  const abandonedCount = Math.max(0, starts.length - completedCount - disconnectCount - inactivityCount);
  return {
    startedCount: starts.length,
    completedCount,
    disconnectCount,
    inactivityCount,
    abandonedCount
  };
};
var countUniqueActiveUsers = (activityEvents, startMs, endMs) => new Set(
  activityEvents.filter((event) => {
    const occurredAtMs = parseIsoMs3(event.occurredAt);
    return occurredAtMs !== null && occurredAtMs >= startMs && occurredAtMs <= endMs;
  }).map((event) => event.userId)
).size;
var buildDailyActiveUserCounts = (activityEvents, filters) => {
  const activityByDay = /* @__PURE__ */ new Map();
  buildDayKeys(filters).forEach((dayKey) => {
    activityByDay.set(dayKey, /* @__PURE__ */ new Set());
  });
  activityEvents.forEach((event) => {
    var _a;
    if (!isWithinRange(event.occurredAt, filters)) {
      return;
    }
    const dayKey = toDayKey(event.occurredAt);
    if (!activityByDay.has(dayKey)) {
      activityByDay.set(dayKey, /* @__PURE__ */ new Set());
    }
    (_a = activityByDay.get(dayKey)) == null ? void 0 : _a.add(event.userId);
  });
  return activityByDay;
};
var buildCountPoints = (valuesByDay, filters) => buildDayKeys(filters).map((dayKey) => {
  var _a;
  return {
    date: dayKey,
    value: (_a = valuesByDay.get(dayKey)) != null ? _a : 0
  };
});
var buildRatePoints = (numeratorByDay, denominatorByDay, filters) => buildDayKeys(filters).map((dayKey) => {
  var _a, _b;
  const numerator = (_a = numeratorByDay.get(dayKey)) != null ? _a : 0;
  const denominator = (_b = denominatorByDay.get(dayKey)) != null ? _b : 0;
  return {
    date: dayKey,
    value: toPercentage(numerator, denominator),
    numerator,
    denominator
  };
});
var buildDualCountPoints = (primaryByDay, secondaryByDay, filters) => buildDayKeys(filters).map((dayKey) => {
  var _a, _b;
  const primary = (_a = primaryByDay.get(dayKey)) != null ? _a : 0;
  const secondary = (_b = secondaryByDay.get(dayKey)) != null ? _b : 0;
  return {
    date: dayKey,
    primary,
    secondary,
    total: primary + secondary
  };
});
var buildBucketDistribution = (values, bucketConfig) => bucketConfig.map((bucket) => ({
  key: bucket.key,
  label: bucket.label,
  min: Number.isFinite(bucket.min) ? bucket.min : null,
  max: bucket.max,
  count: values.filter((value) => value >= bucket.min && (bucket.max === null || value < bucket.max)).length
}));
var buildSummaryData = (context) => {
  const previousWindowDuration = context.filters.endMs - context.filters.startMs;
  const previousStartMs = context.filters.startMs - previousWindowDuration - 1;
  const previousEndMs = context.filters.startMs - 1;
  const endDayStartMs = startOfDayMs(context.filters.endMs);
  const wauWindowStartMs = context.filters.endMs - 6 * DAY_BUCKET_MS;
  const previousDayStartMs = endDayStartMs - DAY_BUCKET_MS;
  const previousWauWindowEndMs = wauWindowStartMs - 1;
  const previousWauWindowStartMs = previousWauWindowEndMs - 6 * DAY_BUCKET_MS;
  const dauCurrent = countUniqueActiveUsers(context.activityEvents, endDayStartMs, endDayStartMs + DAY_BUCKET_MS - 1);
  const dauPrevious = countUniqueActiveUsers(
    context.activityEvents,
    previousDayStartMs,
    previousDayStartMs + DAY_BUCKET_MS - 1
  );
  const wauCurrent = countUniqueActiveUsers(context.activityEvents, wauWindowStartMs, context.filters.endMs);
  const wauPrevious = countUniqueActiveUsers(
    context.activityEvents,
    previousWauWindowStartMs,
    previousWauWindowEndMs
  );
  const matchesInWindow = filterEndedMatchesInWindow(
    context.unifiedMatches,
    context.filters.startMs,
    context.filters.endMs
  );
  const previousMatchesInWindow = filterEndedMatchesInWindow(
    context.unifiedMatches,
    previousStartMs,
    previousEndMs
  );
  const completionWindow = buildStartedMatchMetrics(context, context.filters.startMs, context.filters.endMs);
  const previousCompletionWindow = buildStartedMatchMetrics(context, previousStartMs, previousEndMs);
  const durationValues = matchesInWindow.map((match) => match.durationSeconds).filter((value) => typeof value === "number" && Number.isFinite(value));
  const previousDurationValues = previousMatchesInWindow.map((match) => match.durationSeconds).filter((value) => typeof value === "number" && Number.isFinite(value));
  const tournamentsCompletedCount = context.runs.filter((run) => isWithinRange(run.finalizedAt, context.filters)).length;
  const previousTournamentsCompletedCount = context.runs.filter((run) => {
    const finalizedAtMs = parseIsoMs3(run.finalizedAt);
    return finalizedAtMs !== null && finalizedAtMs >= previousStartMs && finalizedAtMs <= previousEndMs;
  }).length;
  const activeTournamentsCount = context.runs.filter(
    (run) => run.lifecycle === "open" || run.lifecycle === "closed" && !run.finalizedAt
  ).length;
  const onlinePresence = getOnlinePresenceSnapshot();
  const disconnectsInRange = matchesInWindow.filter(
    (match) => match.reason === "forfeit_disconnect" || match.reason === "forfeit_inactivity"
  ).length;
  const previousDisconnectsInRange = previousMatchesInWindow.filter(
    (match) => match.reason === "forfeit_disconnect" || match.reason === "forfeit_inactivity"
  ).length;
  const completionAvailability = completionWindow.startedCount === 0 ? context.eventsSupported ? noData("No started matches were recorded in this date range.") : partial(["Cross-mode start tracking is not available on this runtime."]) : completionWindow.startedCount < 3 ? notEnoughData("Not enough started matches yet for a stable completion rate.", completionWindow.startedCount) : available(completionWindow.startedCount);
  return {
    dau: createMetric(
      dauCurrent,
      context.activityEvents.length > 0 ? available(dauCurrent) : noData("No recorded player activity is available yet."),
      { previousValue: dauPrevious }
    ),
    wau: createMetric(
      wauCurrent,
      context.activityEvents.length > 0 ? available(wauCurrent) : noData("No recorded player activity is available yet."),
      { previousValue: wauPrevious }
    ),
    matchesPlayed: createMetric(
      matchesInWindow.length,
      matchesInWindow.length > 0 ? available(matchesInWindow.length) : noData("No matches ended in this date range."),
      { previousValue: previousMatchesInWindow.length }
    ),
    completionRate: createMetric(
      toPercentage(completionWindow.completedCount, completionWindow.startedCount),
      completionAvailability,
      {
        numerator: completionWindow.completedCount,
        denominator: completionWindow.startedCount,
        previousValue: toPercentage(previousCompletionWindow.completedCount, previousCompletionWindow.startedCount)
      }
    ),
    medianMatchDurationSeconds: createMetric(
      median(durationValues),
      durationValues.length === 0 ? noData("No completed matches with duration data are available in this date range.") : durationValues.length < 3 ? notEnoughData("Not enough completed matches yet to show a reliable duration median.", durationValues.length) : available(durationValues.length),
      { previousValue: median(previousDurationValues) }
    ),
    activeTournaments: createMetric(activeTournamentsCount, available(activeTournamentsCount)),
    tournamentsCompleted: createMetric(
      tournamentsCompletedCount,
      tournamentsCompletedCount > 0 ? available(tournamentsCompletedCount) : noData("No tournaments finalized in this date range."),
      { previousValue: previousTournamentsCompletedCount }
    ),
    currentOnlinePlayers: createMetric(onlinePresence.onlineCount, available(onlinePresence.onlineCount)),
    disconnectRate: createMetric(
      toPercentage(disconnectsInRange, matchesInWindow.length),
      matchesInWindow.length === 0 ? noData("No ended matches are available for disconnect-rate reporting in this range.") : matchesInWindow.length < 3 ? notEnoughData("Not enough ended matches yet for a stable disconnect rate.", matchesInWindow.length) : available(matchesInWindow.length),
      {
        numerator: disconnectsInRange,
        denominator: matchesInWindow.length,
        previousValue: toPercentage(previousDisconnectsInRange, previousMatchesInWindow.length)
      }
    )
  };
};
var buildOverviewData = (context) => {
  const activityByDay = buildDailyActiveUserCounts(context.activityEvents, context.filters);
  const dauValues = new Map(
    Array.from(activityByDay.entries()).map(([dayKey, users]) => [dayKey, users.size])
  );
  const wauValues = /* @__PURE__ */ new Map();
  const matchesByDay = /* @__PURE__ */ new Map();
  const completedStartsByDay = /* @__PURE__ */ new Map();
  const startsByDay = /* @__PURE__ */ new Map();
  const createdByDay = /* @__PURE__ */ new Map();
  const completedTournamentByDay = /* @__PURE__ */ new Map();
  const firstSeenByDay = /* @__PURE__ */ new Map();
  const returningByDay = /* @__PURE__ */ new Map();
  const allDayKeys = buildDayKeys(context.filters);
  context.unifiedMatches.forEach((match) => {
    var _a;
    if (!isWithinRange(match.endedAt, context.filters)) {
      return;
    }
    const dayKey = toDayKey(match.endedAt);
    matchesByDay.set(dayKey, ((_a = matchesByDay.get(dayKey)) != null ? _a : 0) + 1);
  });
  const startedMetrics = filterStartsInWindow(context, context.filters.startMs, context.filters.endMs);
  const matchById = new Map(context.unifiedMatches.map((match) => [match.matchId, match]));
  startedMetrics.forEach((started) => {
    var _a, _b;
    const dayKey = toDayKey(started.startedAt);
    startsByDay.set(dayKey, ((_a = startsByDay.get(dayKey)) != null ? _a : 0) + 1);
    const matched = matchById.get(started.matchId);
    if ((matched == null ? void 0 : matched.reason) === "completed") {
      completedStartsByDay.set(dayKey, ((_b = completedStartsByDay.get(dayKey)) != null ? _b : 0) + 1);
    }
  });
  allDayKeys.forEach((dayKey) => {
    var _a;
    const currentDayMs = (_a = parseIsoMs3(`${dayKey}T00:00:00.000Z`)) != null ? _a : context.filters.startMs;
    const trailingUserIds = /* @__PURE__ */ new Set();
    context.activityEvents.forEach((event) => {
      const occurredAtMs = parseIsoMs3(event.occurredAt);
      if (occurredAtMs !== null && occurredAtMs >= currentDayMs - 6 * DAY_BUCKET_MS && occurredAtMs <= currentDayMs + DAY_BUCKET_MS - 1) {
        trailingUserIds.add(event.userId);
      }
    });
    wauValues.set(dayKey, trailingUserIds.size);
  });
  context.runs.forEach((run) => {
    var _a, _b;
    if (isWithinRange(run.createdAt, context.filters)) {
      const dayKey = toDayKey(run.createdAt);
      createdByDay.set(dayKey, ((_a = createdByDay.get(dayKey)) != null ? _a : 0) + 1);
    }
    if (isWithinRange(run.finalizedAt, context.filters)) {
      const dayKey = toDayKey(run.finalizedAt);
      completedTournamentByDay.set(dayKey, ((_b = completedTournamentByDay.get(dayKey)) != null ? _b : 0) + 1);
    }
  });
  context.firstSeenByUserId.forEach((firstSeenAt) => {
    var _a;
    if (!isWithinRange(firstSeenAt, context.filters)) {
      return;
    }
    const dayKey = toDayKey(firstSeenAt);
    firstSeenByDay.set(dayKey, ((_a = firstSeenByDay.get(dayKey)) != null ? _a : 0) + 1);
  });
  activityByDay.forEach((userIds, dayKey) => {
    let returning = 0;
    userIds.forEach((userId) => {
      const firstSeenAt = context.firstSeenByUserId.get(userId);
      if (!firstSeenAt) {
        return;
      }
      if (toDayKey(firstSeenAt) < dayKey) {
        returning += 1;
      }
    });
    returningByDay.set(dayKey, returning);
  });
  const dauPoints = buildCountPoints(dauValues, context.filters);
  const wauPoints = buildCountPoints(wauValues, context.filters);
  const matchPoints = buildCountPoints(matchesByDay, context.filters);
  const completionPoints = buildRatePoints(completedStartsByDay, startsByDay, context.filters);
  const newVsReturningPoints = buildDualCountPoints(firstSeenByDay, returningByDay, context.filters);
  const totalPlayersCount = countUniqueActiveUsers(
    context.activityEvents,
    context.filters.startMs,
    context.filters.endMs
  );
  return {
    dauTrend: {
      availability: context.activityEvents.length > 0 ? available(context.activityEvents.length) : noData("No recorded player activity is available yet."),
      points: dauPoints
    },
    wauTrend: {
      availability: context.activityEvents.length > 0 ? available(context.activityEvents.length) : noData("No recorded player activity is available yet."),
      points: wauPoints
    },
    matchesPerDay: {
      availability: matchPoints.some((point) => point.value > 0) ? available(matchPoints.reduce((sum, point) => sum + point.value, 0)) : noData("No matches ended in this date range."),
      points: matchPoints
    },
    completionRateTrend: {
      availability: completionPoints.some((point) => point.denominator > 0) ? available(completionPoints.reduce((sum, point) => sum + point.denominator, 0)) : context.eventsSupported ? noData("No started matches were recorded in this date range.") : partial(["Cross-mode start tracking is not available on this runtime."]),
      points: completionPoints
    },
    newVsReturningPlayers: {
      availability: newVsReturningPoints.some((point) => point.total > 0) ? available(newVsReturningPoints.reduce((sum, point) => sum + point.total, 0)) : noData("No player activity or first-seen data is available in this date range."),
      points: newVsReturningPoints
    },
    totalPlayers: createMetric(
      totalPlayersCount,
      totalPlayersCount > 0 ? available(totalPlayersCount) : noData("No active players were recorded in this date range.")
    ),
    tournamentsCreated: createMetric(
      context.runs.filter((run) => isWithinRange(run.createdAt, context.filters)).length,
      context.runs.length > 0 ? available(context.runs.length) : noData("No tournaments match the selected filters.")
    ),
    tournamentsCompleted: createMetric(
      context.runs.filter((run) => isWithinRange(run.finalizedAt, context.filters)).length,
      context.runs.some((run) => Boolean(run.finalizedAt)) ? available(context.runs.filter((run) => Boolean(run.finalizedAt)).length) : noData("No finalized tournaments are available in the selected filters.")
    )
  };
};
var buildPlayersData = (context) => {
  const newPlayersByDay = /* @__PURE__ */ new Map();
  const returningPlayersByDay = /* @__PURE__ */ new Map();
  const activityDaysByUser = /* @__PURE__ */ new Map();
  const retentionEligible = {
    d1: [],
    d7: [],
    d30: []
  };
  const retentionReturned = {
    d1: 0,
    d7: 0,
    d30: 0
  };
  context.firstSeenByUserId.forEach((firstSeenAt, userId) => {
    var _a;
    if (!isWithinRange(firstSeenAt, context.filters)) {
      return;
    }
    const dayKey = toDayKey(firstSeenAt);
    newPlayersByDay.set(dayKey, ((_a = newPlayersByDay.get(dayKey)) != null ? _a : 0) + 1);
    const firstSeenMs = parseIsoMs3(firstSeenAt);
    if (firstSeenMs === null) {
      return;
    }
    if (firstSeenMs + DAY_BUCKET_MS <= context.filters.endMs) {
      retentionEligible.d1.push(userId);
    }
    if (firstSeenMs + 7 * DAY_BUCKET_MS <= context.filters.endMs) {
      retentionEligible.d7.push(userId);
    }
    if (firstSeenMs + 30 * DAY_BUCKET_MS <= context.filters.endMs) {
      retentionEligible.d30.push(userId);
    }
  });
  context.activityEvents.forEach((event) => {
    var _a, _b;
    if (!isWithinRange(event.occurredAt, context.filters)) {
      return;
    }
    const dayKey = toDayKey(event.occurredAt);
    if (!activityDaysByUser.has(event.userId)) {
      activityDaysByUser.set(event.userId, /* @__PURE__ */ new Set());
    }
    (_a = activityDaysByUser.get(event.userId)) == null ? void 0 : _a.add(dayKey);
    const firstSeenAt = context.firstSeenByUserId.get(event.userId);
    if (!firstSeenAt) {
      return;
    }
    if (toDayKey(firstSeenAt) < dayKey) {
      returningPlayersByDay.set(dayKey, ((_b = returningPlayersByDay.get(dayKey)) != null ? _b : 0) + 1);
    }
  });
  const didReturnOnTargetDay = (userId, offsetDays) => {
    var _a, _b;
    const firstSeenAt = context.firstSeenByUserId.get(userId);
    if (!firstSeenAt) {
      return false;
    }
    const targetKey = toDayKey(((_a = parseIsoMs3(firstSeenAt)) != null ? _a : 0) + offsetDays * DAY_BUCKET_MS);
    return ((_b = activityDaysByUser.get(userId)) == null ? void 0 : _b.has(targetKey)) === true;
  };
  retentionEligible.d1.forEach((userId) => {
    if (didReturnOnTargetDay(userId, 1)) {
      retentionReturned.d1 += 1;
    }
  });
  retentionEligible.d7.forEach((userId) => {
    if (didReturnOnTargetDay(userId, 7)) {
      retentionReturned.d7 += 1;
    }
  });
  retentionEligible.d30.forEach((userId) => {
    if (didReturnOnTargetDay(userId, 30)) {
      retentionReturned.d30 += 1;
    }
  });
  const activityBuckets = [
    {
      key: "1_day",
      label: "1 active day",
      count: Array.from(activityDaysByUser.values()).filter((days) => days.size === 1).length
    },
    {
      key: "2_4_days",
      label: "2-4 active days",
      count: Array.from(activityDaysByUser.values()).filter((days) => days.size >= 2 && days.size <= 4).length
    },
    {
      key: "5_plus_days",
      label: "5+ active days",
      count: Array.from(activityDaysByUser.values()).filter((days) => days.size >= 5).length
    }
  ];
  const topPlayerRows = Array.from(context.userPerformanceById.values()).filter((entry) => {
    var _a, _b;
    const currentUser = (_a = context.usersById.get(entry.userId)) != null ? _a : null;
    return matchesEloFilter((_b = currentUser == null ? void 0 : currentUser.eloRating) != null ? _b : null, context.filters);
  }).sort((left, right) => {
    var _a, _b;
    if (right.matchesPlayed !== left.matchesPlayed) {
      return right.matchesPlayed - left.matchesPlayed;
    }
    return ((_a = right.lastActiveAt) != null ? _a : "").localeCompare((_b = left.lastActiveAt) != null ? _b : "");
  }).slice(0, context.filters.limit).map((entry) => {
    var _a, _b, _c, _d;
    const user = (_a = context.usersById.get(entry.userId)) != null ? _a : null;
    return {
      id: entry.userId,
      userId: entry.userId,
      label: entry.username,
      secondaryLabel: (_b = user == null ? void 0 : user.currentRankTitle) != null ? _b : null,
      metrics: {
        matchesPlayed: entry.matchesPlayed,
        wins: entry.wins,
        losses: entry.losses,
        winRate: toPercentage(entry.wins, Math.max(1, entry.matchesPlayed)),
        elo: (_c = user == null ? void 0 : user.eloRating) != null ? _c : null,
        tournamentParticipations: entry.tournamentParticipations,
        totalXp: (_d = user == null ? void 0 : user.totalXp) != null ? _d : null,
        lastActiveAt: entry.lastActiveAt
      }
    };
  });
  const buildRetentionMetric = (returned, eligible, dayLabel) => {
    if (eligible.length === 0) {
      return createMetric(
        null,
        noData(`No ${dayLabel} retention cohorts have matured inside the selected date range.`),
        { numerator: 0, denominator: 0 }
      );
    }
    if (eligible.length < 3) {
      return createMetric(
        toPercentage(returned, eligible.length),
        notEnoughData(`Not enough cohorts have matured for a reliable ${dayLabel} retention signal.`, eligible.length),
        { numerator: returned, denominator: eligible.length }
      );
    }
    return createMetric(
      toPercentage(returned, eligible.length),
      available(eligible.length),
      { numerator: returned, denominator: eligible.length }
    );
  };
  return {
    uniquePlayers: createMetric(
      countUniqueActiveUsers(context.activityEvents, context.filters.startMs, context.filters.endMs),
      context.activityEvents.length > 0 ? available(context.activityEvents.length) : noData("No player activity is available in this date range.")
    ),
    newPlayersOverTime: {
      availability: newPlayersByDay.size > 0 ? available(newPlayersByDay.size) : noData("No new players were first seen in this date range."),
      points: buildCountPoints(newPlayersByDay, context.filters)
    },
    returningPlayersOverTime: {
      availability: returningPlayersByDay.size > 0 ? available(returningPlayersByDay.size) : noData("No returning players were recorded in this date range."),
      points: buildCountPoints(returningPlayersByDay, context.filters)
    },
    activityBuckets: {
      availability: activityBuckets.some((bucket) => bucket.count > 0) ? available(activityBuckets.reduce((sum, bucket) => sum + bucket.count, 0)) : noData("No activity buckets can be built because no player activity was recorded."),
      buckets: activityBuckets
    },
    topPlayers: {
      availability: topPlayerRows.length > 0 ? available(topPlayerRows.length) : noData("No player rows are available for the selected filters."),
      rows: topPlayerRows
    },
    retention: {
      availability: mergeAvailability(
        buildRetentionMetric(retentionReturned.d1, retentionEligible.d1, "D1").availability,
        buildRetentionMetric(retentionReturned.d7, retentionEligible.d7, "D7").availability,
        buildRetentionMetric(retentionReturned.d30, retentionEligible.d30, "D30").availability
      ),
      d1: buildRetentionMetric(retentionReturned.d1, retentionEligible.d1, "D1"),
      d7: buildRetentionMetric(retentionReturned.d7, retentionEligible.d7, "D7"),
      d30: buildRetentionMetric(retentionReturned.d30, retentionEligible.d30, "D30")
    }
  };
};
var buildGameplayData = (context) => {
  const matchesPerDay = /* @__PURE__ */ new Map();
  const startedByDay = /* @__PURE__ */ new Map();
  const completedByDay = /* @__PURE__ */ new Map();
  const abandonedByDay = /* @__PURE__ */ new Map();
  const recentMatches = filterEndedMatchesInWindow(context.unifiedMatches, context.filters.startMs, context.filters.endMs).sort((left, right) => right.endedAt.localeCompare(left.endedAt)).slice(0, context.filters.limit);
  const startedMetrics = filterStartsInWindow(context, context.filters.startMs, context.filters.endMs);
  const matchById = new Map(context.unifiedMatches.map((match) => [match.matchId, match]));
  const durations = recentMatches.map((match) => match.durationSeconds).filter((value) => typeof value === "number" && Number.isFinite(value));
  const completionWindow = buildStartedMatchMetrics(context, context.filters.startMs, context.filters.endMs);
  const lightSideWinsByMode = /* @__PURE__ */ new Map();
  let captureCount = 0;
  let captureMatchCount = 0;
  filterEndedMatchesInWindow(context.unifiedMatches, context.filters.startMs, context.filters.endMs).forEach((match) => {
    var _a, _b, _c;
    const dayKey = toDayKey(match.endedAt);
    matchesPerDay.set(dayKey, ((_a = matchesPerDay.get(dayKey)) != null ? _a : 0) + 1);
    if (match.modeId) {
      const bucket = (_b = lightSideWinsByMode.get(match.modeId)) != null ? _b : { wins: 0, losses: 0, count: 0 };
      const lightPlayer = (_c = match.players.find((player) => player.color === "light")) != null ? _c : null;
      bucket.count += 1;
      if ((lightPlayer == null ? void 0 : lightPlayer.didWin) === true) {
        bucket.wins += 1;
      } else if ((lightPlayer == null ? void 0 : lightPlayer.didWin) === false) {
        bucket.losses += 1;
      }
      lightSideWinsByMode.set(match.modeId, bucket);
    }
    const trackedCaptureCount = match.players.reduce((sum, player) => {
      var _a2;
      return sum + ((_a2 = player.capturesMade) != null ? _a2 : 0);
    }, 0);
    if (trackedCaptureCount > 0 || match.players.some((player) => player.capturesMade !== null)) {
      captureCount += trackedCaptureCount;
      captureMatchCount += 1;
    }
  });
  startedMetrics.forEach((started) => {
    var _a, _b, _c, _d, _e;
    const dayKey = toDayKey(started.startedAt);
    startedByDay.set(dayKey, ((_a = startedByDay.get(dayKey)) != null ? _a : 0) + 1);
    const matched = (_b = matchById.get(started.matchId)) != null ? _b : null;
    if (!matched) {
      abandonedByDay.set(dayKey, ((_c = abandonedByDay.get(dayKey)) != null ? _c : 0) + 1);
      return;
    }
    if (matched.reason === "completed") {
      completedByDay.set(dayKey, ((_d = completedByDay.get(dayKey)) != null ? _d : 0) + 1);
      return;
    }
    abandonedByDay.set(dayKey, ((_e = abandonedByDay.get(dayKey)) != null ? _e : 0) + 1);
  });
  const winRateSegments = Array.from(lightSideWinsByMode.entries()).map(([modeId, bucket]) => ({
    key: modeId,
    label: modeId,
    count: bucket.count,
    wins: bucket.wins,
    losses: bucket.losses,
    winRate: toPercentage(bucket.wins, Math.max(1, bucket.wins + bucket.losses))
  })).sort((left, right) => right.count - left.count);
  return {
    matchesPerDay: {
      availability: matchesPerDay.size > 0 ? available(matchesPerDay.size) : noData("No matches ended in this date range."),
      points: buildCountPoints(matchesPerDay, context.filters)
    },
    startedVsCompleted: {
      availability: startedMetrics.length > 0 ? available(startedMetrics.length) : context.eventsSupported ? noData("No started matches were recorded in this date range.") : partial(["Cross-mode start tracking is not available on this runtime."]),
      points: buildDayKeys(context.filters).map((dayKey) => {
        var _a, _b, _c;
        return {
          date: dayKey,
          started: (_a = startedByDay.get(dayKey)) != null ? _a : 0,
          completed: (_b = completedByDay.get(dayKey)) != null ? _b : 0,
          abandoned: (_c = abandonedByDay.get(dayKey)) != null ? _c : 0
        };
      })
    },
    completionFunnel: {
      availability: completionWindow.startedCount > 0 ? available(completionWindow.startedCount) : context.eventsSupported ? noData("No started matches were recorded in this date range.") : partial(["Cross-mode start tracking is not available on this runtime."]),
      started: completionWindow.startedCount,
      completed: completionWindow.completedCount,
      disconnect: completionWindow.disconnectCount,
      inactivity: completionWindow.inactivityCount,
      abandoned: completionWindow.abandonedCount
    },
    durationDistribution: {
      availability: durations.length === 0 ? noData("No completed matches with duration data are available in this date range.") : durations.length < 3 ? notEnoughData("Not enough completed matches yet to show a reliable duration distribution.", durations.length) : available(durations.length),
      buckets: buildBucketDistribution(durations, MATCH_DURATION_BUCKETS)
    },
    winRateByMode: {
      availability: winRateSegments.length > 0 ? available(winRateSegments.length) : noData("No completed matches with mode metadata are available in this date range."),
      segments: winRateSegments
    },
    winRateByTurnOrder: {
      availability: trackingMissing("Turn-order tracking is not implemented yet.")
    },
    disconnectRate: createMetric(
      toPercentage(completionWindow.disconnectCount + completionWindow.inactivityCount, completionWindow.startedCount),
      completionWindow.startedCount === 0 ? noData("No started matches are available for disconnect-rate reporting in this date range.") : completionWindow.startedCount < 3 ? notEnoughData("Not enough started matches yet for a stable disconnect rate.", completionWindow.startedCount) : available(completionWindow.startedCount),
      {
        numerator: completionWindow.disconnectCount + completionWindow.inactivityCount,
        denominator: completionWindow.startedCount
      }
    ),
    captureRate: createMetric(
      captureMatchCount > 0 ? Math.round(captureCount / captureMatchCount * 100) / 100 : null,
      captureMatchCount === 0 ? noData("Capture totals are not available for matches in this date range.") : captureMatchCount < 3 ? notEnoughData("Not enough matches with capture telemetry yet for a stable capture metric.", captureMatchCount) : available(captureMatchCount),
      {
        numerator: captureCount,
        denominator: captureMatchCount
      }
    ),
    recentMatches: {
      availability: recentMatches.length > 0 ? available(recentMatches.length) : noData("No recent matches ended in this date range."),
      rows: recentMatches.map((match) => {
        var _a, _b, _c, _d, _e, _f, _g;
        return {
          id: match.matchId,
          userId: null,
          label: (_c = (_b = (_a = match.players.find((player) => player.userId === match.winnerUserId)) == null ? void 0 : _a.username) != null ? _b : match.winnerUserId) != null ? _c : "Unknown winner",
          secondaryLabel: match.modeId,
          metrics: {
            winner: (_e = (_d = match.players.find((player) => player.userId === match.winnerUserId)) == null ? void 0 : _d.username) != null ? _e : match.winnerUserId,
            loser: (_g = (_f = match.players.find((player) => player.userId === match.loserUserId)) == null ? void 0 : _f.username) != null ? _g : match.loserUserId,
            reason: match.reason,
            durationSeconds: match.durationSeconds,
            totalMoves: match.totalMoves,
            endedAt: match.endedAt
          }
        };
      })
    }
  };
};
var buildTournamentsData = (context) => {
  const createdByDay = /* @__PURE__ */ new Map();
  const entrantCounts = context.runs.map((run) => run.registrations.length);
  const dropoutByRound = /* @__PURE__ */ new Map();
  const recentTournamentRows = context.runs.slice().sort((left, right) => {
    var _a, _b;
    return ((_a = right.finalizedAt) != null ? _a : right.updatedAt).localeCompare((_b = left.finalizedAt) != null ? _b : left.updatedAt);
  }).slice(0, context.filters.limit);
  const durationValues = context.runs.map((run) => {
    var _a, _b, _c, _d;
    const openedAtMs = parseIsoMs3((_a = run.openedAt) != null ? _a : run.createdAt);
    const finalizedAtMs = parseIsoMs3((_d = (_c = run.finalizedAt) != null ? _c : (_b = run.bracket) == null ? void 0 : _b.finalizedAt) != null ? _d : null);
    if (openedAtMs === null || finalizedAtMs === null || finalizedAtMs < openedAtMs) {
      return null;
    }
    return Math.round((finalizedAtMs - openedAtMs) / 1e3);
  }).filter((value) => typeof value === "number" && Number.isFinite(value));
  const completedRuns = context.runs.filter((run) => Boolean(run.finalizedAt));
  context.runs.forEach((run) => {
    var _a;
    if (isWithinRange(run.createdAt, context.filters)) {
      const dayKey = toDayKey(run.createdAt);
      createdByDay.set(dayKey, ((_a = createdByDay.get(dayKey)) != null ? _a : 0) + 1);
    }
  });
  context.tournamentMatches.forEach((match) => {
    var _a;
    const round = readNumberField9(match, ["round"]);
    const derivedRound = typeof round === "number" ? Math.max(1, Math.floor(round)) : (() => {
      var _a2, _b, _c;
      const run = context.runs.find((candidate) => candidate.runId === match.tournamentRunId);
      const entry = (_b = (_a2 = run == null ? void 0 : run.bracket) == null ? void 0 : _a2.entries.find((candidate) => candidate.matchId === match.matchId)) != null ? _b : null;
      return (_c = entry == null ? void 0 : entry.round) != null ? _c : null;
    })();
    if (derivedRound !== null && match.loserUserId) {
      dropoutByRound.set(derivedRound, ((_a = dropoutByRound.get(derivedRound)) != null ? _a : 0) + 1);
    }
  });
  const completionDenominator = context.runs.filter((run) => isWithinRange(run.createdAt, context.filters)).length;
  const completionNumerator = context.runs.filter((run) => isWithinRange(run.finalizedAt, context.filters)).length;
  return {
    createdOverTime: {
      availability: createdByDay.size > 0 ? available(createdByDay.size) : noData("No tournaments were created in this date range."),
      points: buildCountPoints(createdByDay, context.filters)
    },
    participationCounts: {
      availability: entrantCounts.length > 0 ? available(entrantCounts.length) : noData("No tournament participation data is available for the selected filters."),
      buckets: buildBucketDistribution(entrantCounts, PARTICIPATION_BUCKETS)
    },
    completionRate: createMetric(
      toPercentage(completionNumerator, completionDenominator),
      completionDenominator === 0 ? noData("No tournaments were created in this date range.") : completionDenominator < 3 ? notEnoughData("Not enough tournaments yet for a stable completion-rate signal.", completionDenominator) : available(completionDenominator),
      {
        numerator: completionNumerator,
        denominator: completionDenominator
      }
    ),
    dropoutByRound: {
      availability: dropoutByRound.size > 0 ? available(Array.from(dropoutByRound.values()).reduce((sum, count) => sum + count, 0)) : noData("No tournament match results are available to show round dropouts."),
      buckets: Array.from(dropoutByRound.entries()).sort((left, right) => left[0] - right[0]).map(([round, count]) => ({
        round,
        label: `Round ${round}`,
        count
      }))
    },
    durationDistribution: {
      availability: durationValues.length === 0 ? noData("No finalized tournaments with duration data are available.") : durationValues.length < 3 ? notEnoughData("Not enough finalized tournaments yet for a stable duration distribution.", durationValues.length) : available(durationValues.length),
      buckets: buildBucketDistribution(durationValues, TOURNAMENT_DURATION_BUCKETS)
    },
    recentTournaments: {
      availability: recentTournamentRows.length > 0 ? available(recentTournamentRows.length) : noData("No tournaments match the selected filters."),
      rows: recentTournamentRows.map((run) => {
        var _a, _b, _c, _d, _e, _f, _g;
        const totalMatches = (_b = (_a = run.bracket) == null ? void 0 : _a.entries.length) != null ? _b : 0;
        const completedMatches = (_d = (_c = run.bracket) == null ? void 0 : _c.entries.filter((entry) => entry.status === "completed").length) != null ? _d : 0;
        return {
          id: run.runId,
          userId: null,
          label: run.title,
          secondaryLabel: getRunGameMode2(run),
          metrics: {
            status: run.lifecycle,
            entrants: run.registrations.length,
            totalMatches,
            completedMatches,
            completionRate: toPercentage(completedMatches, Math.max(1, totalMatches)),
            createdAt: run.createdAt,
            openedAt: run.openedAt,
            finalizedAt: (_g = (_f = run.finalizedAt) != null ? _f : (_e = run.bracket) == null ? void 0 : _e.finalizedAt) != null ? _g : null
          }
        };
      })
    }
  };
};
var buildProgressionData = (context) => {
  const eloRows = context.leaderboardRows.filter((row) => matchesEloFilter(row.eloRating, context.filters));
  const eloDistribution = buildBucketDistribution(
    eloRows.map((row) => row.eloRating),
    ELO_BUCKETS
  );
  const rankCounts = /* @__PURE__ */ new Map();
  const ratingMovementByDay = /* @__PURE__ */ new Map();
  const ratedMatchesByDay = /* @__PURE__ */ new Map();
  const xpAwardedByDay = /* @__PURE__ */ new Map();
  const recentRankUps = context.xpAwardEvents.filter((event) => event.rankChanged && isWithinRange(event.occurredAt, context.filters)).sort((left, right) => right.occurredAt.localeCompare(left.occurredAt)).slice(0, context.filters.limit);
  context.usersById.forEach((user) => {
    var _a;
    if (!matchesEloFilter(user.eloRating, context.filters)) {
      return;
    }
    if (user.currentRankTitle) {
      rankCounts.set(user.currentRankTitle, ((_a = rankCounts.get(user.currentRankTitle)) != null ? _a : 0) + 1);
    }
  });
  context.eloHistory.forEach((record) => {
    var _a, _b, _c, _d;
    if (!isWithinRange(record.processedAt, context.filters)) {
      return;
    }
    const dayKey = toDayKey(record.processedAt);
    const winnerDelta = Math.abs((_b = (_a = record.playerResults.find((player) => player.userId === record.winnerUserId)) == null ? void 0 : _a.delta) != null ? _b : 0);
    if (!ratingMovementByDay.has(dayKey)) {
      ratingMovementByDay.set(dayKey, []);
    }
    (_c = ratingMovementByDay.get(dayKey)) == null ? void 0 : _c.push(winnerDelta);
    ratedMatchesByDay.set(dayKey, ((_d = ratedMatchesByDay.get(dayKey)) != null ? _d : 0) + 1);
  });
  context.xpAwardEvents.forEach((event) => {
    var _a;
    if (!isWithinRange(event.occurredAt, context.filters)) {
      return;
    }
    const dayKey = toDayKey(event.occurredAt);
    xpAwardedByDay.set(dayKey, ((_a = xpAwardedByDay.get(dayKey)) != null ? _a : 0) + event.awardedXp);
  });
  const ratingMovementPoints = buildDayKeys(context.filters).map((dayKey) => {
    var _a, _b;
    return {
      date: dayKey,
      medianAbsoluteDelta: median((_a = ratingMovementByDay.get(dayKey)) != null ? _a : []),
      ratedMatches: (_b = ratedMatchesByDay.get(dayKey)) != null ? _b : 0
    };
  });
  return {
    eloDistribution: {
      availability: eloRows.length > 0 ? available(eloRows.length) : noData("No Elo leaderboard records are available for the selected filters."),
      buckets: eloDistribution
    },
    rankDistribution: {
      availability: rankCounts.size > 0 ? available(rankCounts.size) : noData("No progression profiles are available for the selected filters."),
      buckets: PROGRESSION_RANKS.map((rank) => {
        var _a;
        return {
          key: rank.title,
          label: rank.title,
          count: (_a = rankCounts.get(rank.title)) != null ? _a : 0,
          min: rank.threshold,
          max: null
        };
      })
    },
    ratingMovement: {
      availability: context.eloHistorySupported ? ratingMovementPoints.some((point) => point.ratedMatches > 0) ? available(ratingMovementPoints.reduce((sum, point) => sum + point.ratedMatches, 0)) : noData("No rated match history is available in this date range.") : trackingMissing("Ranked match history is not listable on this runtime."),
      points: ratingMovementPoints
    },
    xpAwardedOverTime: {
      availability: xpAwardedByDay.size > 0 ? available(Array.from(xpAwardedByDay.values()).reduce((sum, value) => sum + value, 0)) : noData("No XP award events are available in this date range."),
      points: buildCountPoints(xpAwardedByDay, context.filters)
    },
    recentRankUps: {
      availability: recentRankUps.length > 0 ? available(recentRankUps.length) : noData("No rank-up events were recorded in this date range."),
      rows: recentRankUps.map((event) => {
        var _a, _b;
        const user = (_a = context.usersById.get(event.userId)) != null ? _a : null;
        return {
          id: event.eventId,
          userId: event.userId,
          label: (_b = user == null ? void 0 : user.username) != null ? _b : event.userId,
          secondaryLabel: event.newRank,
          metrics: {
            awardedXp: event.awardedXp,
            source: event.source,
            previousRank: event.previousRank,
            newRank: event.newRank,
            occurredAt: event.occurredAt
          }
        };
      })
    }
  };
};
var buildRealtimeData = (context) => {
  const onlineSnapshot = getOnlinePresenceSnapshot();
  const activeTrackedMatches = listActiveTrackedMatches();
  const recentEvents = [...context.trackedMatchStarts, ...context.trackedMatchEnds, ...context.xpAwardEvents].sort((left, right) => right.occurredAt.localeCompare(left.occurredAt)).slice(0, context.filters.limit);
  const recentDisconnects = context.trackedMatchEnds.filter((event) => event.reason !== "completed").sort((left, right) => right.occurredAt.localeCompare(left.occurredAt)).slice(0, context.filters.limit);
  const activeTournamentsCount = context.runs.filter(
    (run) => run.lifecycle === "open" || run.lifecycle === "closed" && !run.finalizedAt
  ).length;
  const lastEventAt = recentEvents.length > 0 ? recentEvents[0].occurredAt : null;
  return {
    onlinePlayers: createMetric(onlineSnapshot.onlineCount, available(onlineSnapshot.onlineCount)),
    activeMatches: createMetric(activeTrackedMatches.length, available(activeTrackedMatches.length)),
    activeTournaments: createMetric(activeTournamentsCount, available(activeTournamentsCount)),
    queueSize: createMetric(null, trackingMissing("Queue-size tracking is not implemented yet.")),
    queueWaitSeconds: createMetric(null, trackingMissing("Queue wait-time tracking is not implemented yet.")),
    activeMatchRows: {
      availability: activeTrackedMatches.length > 0 ? available(activeTrackedMatches.length) : noData("No active tracked matches are live right now."),
      rows: activeTrackedMatches
    },
    recentEvents: {
      availability: recentEvents.length > 0 ? available(recentEvents.length) : noData("No recent analytics events have been recorded yet."),
      rows: recentEvents.map((event) => {
        if (event.type === "match_start") {
          return {
            id: event.eventId,
            type: event.type,
            occurredAt: event.occurredAt,
            label: `${event.modeId} match started`,
            detail: event.players.map((player) => {
              var _a;
              return (_a = player.username) != null ? _a : player.userId;
            }).join(" vs "),
            status: "neutral"
          };
        }
        if (event.type === "match_end") {
          return {
            id: event.eventId,
            type: event.type,
            occurredAt: event.occurredAt,
            label: event.reason === "completed" ? "Match completed" : "Match ended early",
            detail: `${event.modeId} \xB7 ${event.reason}`,
            status: event.reason === "completed" ? "success" : "warning"
          };
        }
        return {
          id: event.eventId,
          type: event.type,
          occurredAt: event.occurredAt,
          label: "XP awarded",
          detail: `${event.awardedXp} XP \xB7 ${event.newRank}`,
          status: event.rankChanged ? "success" : "neutral"
        };
      })
    },
    recentDisconnects: {
      availability: recentDisconnects.length > 0 ? available(recentDisconnects.length) : noData("No recent disconnect or inactivity forfeits have been recorded."),
      rows: recentDisconnects.map((event) => ({
        id: event.eventId,
        type: event.reason,
        occurredAt: event.occurredAt,
        label: event.reason === "forfeit_disconnect" ? "Disconnect forfeit" : "Inactivity forfeit",
        detail: `${event.modeId} \xB7 ${event.players.map((player) => {
          var _a;
          return (_a = player.username) != null ? _a : player.userId;
        }).join(" vs ")}`,
        status: "danger"
      }))
    },
    freshness: {
      availability: available(),
      lastEventAt,
      generatedAt: context.generatedAt
    }
  };
};
var buildResponse = (context, data, availability, extraNotes = []) => ({
  success: true,
  filters: toResponseFilters(context.filters),
  generatedAt: context.generatedAt,
  dataAvailability: toResponseAvailability(
    mergeAvailability(
      availability,
      extraNotes.length > 0 ? partial(extraNotes) : available(),
      context.runtimeNotes.length > 0 ? partial(context.runtimeNotes) : available()
    )
  ),
  data
});
var getAnalyticsSummary = (nk, logger, payload) => {
  const filters = parseAnalyticsFilters(payload);
  const context = createAnalyticsContext(nk, logger, filters);
  const data = buildSummaryData(context);
  const availability = mergeAvailability(
    data.dau.availability,
    data.wau.availability,
    data.matchesPlayed.availability,
    data.completionRate.availability,
    data.medianMatchDurationSeconds.availability,
    data.disconnectRate.availability
  );
  return buildResponse(context, data, availability);
};
var getAnalyticsOverview = (nk, logger, payload) => {
  const filters = parseAnalyticsFilters(payload);
  const context = createAnalyticsContext(nk, logger, filters);
  const data = buildOverviewData(context);
  const availability = mergeAvailability(
    data.dauTrend.availability,
    data.wauTrend.availability,
    data.matchesPerDay.availability,
    data.completionRateTrend.availability,
    data.newVsReturningPlayers.availability
  );
  return buildResponse(context, data, availability);
};
var getAnalyticsPlayers = (nk, logger, payload) => {
  const filters = parseAnalyticsFilters(payload);
  const context = createAnalyticsContext(nk, logger, filters);
  const data = buildPlayersData(context);
  const availability = mergeAvailability(
    data.uniquePlayers.availability,
    data.newPlayersOverTime.availability,
    data.returningPlayersOverTime.availability,
    data.activityBuckets.availability,
    data.topPlayers.availability,
    data.retention.availability
  );
  return buildResponse(context, data, availability);
};
var getAnalyticsGameplay = (nk, logger, payload) => {
  const filters = parseAnalyticsFilters(payload);
  const context = createAnalyticsContext(nk, logger, filters);
  const data = buildGameplayData(context);
  const availability = mergeAvailability(
    data.matchesPerDay.availability,
    data.startedVsCompleted.availability,
    data.completionFunnel.availability,
    data.durationDistribution.availability,
    data.winRateByMode.availability,
    data.winRateByTurnOrder.availability,
    data.disconnectRate.availability,
    data.captureRate.availability
  );
  return buildResponse(context, data, availability);
};
var getAnalyticsTournaments = (nk, logger, payload) => {
  const filters = parseAnalyticsFilters(payload);
  const context = createAnalyticsContext(nk, logger, filters);
  const data = buildTournamentsData(context);
  const availability = mergeAvailability(
    data.createdOverTime.availability,
    data.participationCounts.availability,
    data.completionRate.availability,
    data.dropoutByRound.availability,
    data.durationDistribution.availability,
    data.recentTournaments.availability
  );
  return buildResponse(context, data, availability);
};
var getAnalyticsProgression = (nk, logger, payload) => {
  const filters = parseAnalyticsFilters(payload);
  const context = createAnalyticsContext(nk, logger, filters);
  const data = buildProgressionData(context);
  const availability = mergeAvailability(
    data.eloDistribution.availability,
    data.rankDistribution.availability,
    data.ratingMovement.availability,
    data.xpAwardedOverTime.availability,
    data.recentRankUps.availability
  );
  return buildResponse(context, data, availability);
};
var getAnalyticsRealtime = (nk, logger, payload) => {
  const filters = parseAnalyticsFilters(payload);
  const context = createAnalyticsContext(nk, logger, filters);
  const data = buildRealtimeData(context);
  const availability = mergeAvailability(
    data.onlinePlayers.availability,
    data.activeMatches.availability,
    data.activeTournaments.availability,
    data.queueSize.availability,
    data.queueWaitSeconds.availability,
    data.activeMatchRows.availability,
    data.recentEvents.availability,
    data.recentDisconnects.availability,
    data.freshness.availability
  );
  return buildResponse(context, data, availability);
};

// backend/modules/analytics/index.ts
var RPC_ADMIN_GET_ANALYTICS_SUMMARY = "rpc_admin_get_analytics_summary";
var RPC_ADMIN_GET_ANALYTICS_OVERVIEW = "rpc_admin_get_analytics_overview";
var RPC_ADMIN_GET_ANALYTICS_PLAYERS = "rpc_admin_get_analytics_players";
var RPC_ADMIN_GET_ANALYTICS_GAMEPLAY = "rpc_admin_get_analytics_gameplay";
var RPC_ADMIN_GET_ANALYTICS_TOURNAMENTS = "rpc_admin_get_analytics_tournaments";
var RPC_ADMIN_GET_ANALYTICS_PROGRESSION = "rpc_admin_get_analytics_progression";
var RPC_ADMIN_GET_ANALYTICS_REALTIME = "rpc_admin_get_analytics_realtime";
var runAnalyticsRpc = (ctx, nk, logger, payload, handler) => {
  assertAdmin(ctx, "viewer", nk);
  return JSON.stringify(handler(nk, logger, payload));
};
function rpcAdminGetAnalyticsSummary(ctx, logger, nk, payload) {
  return runAnalyticsRpc(ctx, nk, logger, payload, getAnalyticsSummary);
}
function rpcAdminGetAnalyticsOverview(ctx, logger, nk, payload) {
  return runAnalyticsRpc(ctx, nk, logger, payload, getAnalyticsOverview);
}
function rpcAdminGetAnalyticsPlayers(ctx, logger, nk, payload) {
  return runAnalyticsRpc(ctx, nk, logger, payload, getAnalyticsPlayers);
}
function rpcAdminGetAnalyticsGameplay(ctx, logger, nk, payload) {
  return runAnalyticsRpc(ctx, nk, logger, payload, getAnalyticsGameplay);
}
function rpcAdminGetAnalyticsTournaments(ctx, logger, nk, payload) {
  return runAnalyticsRpc(ctx, nk, logger, payload, getAnalyticsTournaments);
}
function rpcAdminGetAnalyticsProgression(ctx, logger, nk, payload) {
  return runAnalyticsRpc(ctx, nk, logger, payload, getAnalyticsProgression);
}
function rpcAdminGetAnalyticsRealtime(ctx, logger, nk, payload) {
  return runAnalyticsRpc(ctx, nk, logger, payload, getAnalyticsRealtime);
}

// backend/modules/index.ts
var TICK_RATE = 10;
var MAX_PLAYERS = 2;
var MAX_SNAPSHOT_HISTORY_ENTRIES = 12;
var ONLINE_TURN_DURATION_MS = 1e4;
var ONLINE_AFK_FORFEIT_MS = 3e4;
var ONLINE_DISCONNECT_GRACE_MS = 15e3;
var ONLINE_RECONNECT_RESUME_MS = 5e3;
var REMATCH_WINDOW_MS = 15e3;
var BOT_TURN_DELAY_MS = 850;
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
var RPC_LIST_SPECTATABLE_MATCHES = "list_spectatable_matches";
var RPC_CREATE_OPEN_ONLINE_MATCH = "create_open_online_match";
var RPC_LIST_OPEN_ONLINE_MATCHES = "list_open_online_matches";
var RPC_JOIN_OPEN_ONLINE_MATCH = "join_open_online_match";
var RPC_GET_OPEN_ONLINE_MATCH_STATUS = "get_open_online_match_status";
var RPC_GET_ACTIVE_OPEN_ONLINE_MATCH = "get_active_open_online_match";
var RPC_PRESENCE_HEARTBEAT = "presence_heartbeat";
var RPC_PRESENCE_COUNT = "presence_count";
var RPC_GET_USERNAME_ONBOARDING_STATUS_NAME = RPC_GET_USERNAME_ONBOARDING_STATUS;
var RPC_CLAIM_USERNAME_NAME = RPC_CLAIM_USERNAME;
var MATCH_HANDLER = "authoritative_match";
var PRIVATE_MATCH_CODE_COLLECTION = "private_match_codes";
var OPEN_ONLINE_MATCH_COLLECTION = "open_online_matches";
var PRIVATE_MATCH_CODE_MAX_GENERATION_ATTEMPTS = 12;
var PRIVATE_MATCH_CODE_WRITE_ATTEMPTS = 4;
var OPEN_ONLINE_MATCH_WRITE_ATTEMPTS = 4;
var OPEN_ONLINE_MATCH_PAGE_SIZE = 100;
var OPEN_ONLINE_MATCH_MAX_PAGES = 10;
var OPEN_ONLINE_MATCH_MIN_WAGER = 10;
var OPEN_ONLINE_MATCH_MAX_WAGER = 100;
var OPEN_ONLINE_MATCH_WAGER_STEP = 10;
var OPEN_ONLINE_MATCH_DURATIONS_MINUTES = [3, 5, 10];
var OPEN_ONLINE_MATCH_MODE_IDS = [
  "gameMode_3_pieces",
  "gameMode_finkel_rules",
  "standard"
];
var USER_CHALLENGE_PROGRESS_COLLECTION2 = "user_challenge_progress";
var USER_CHALLENGE_PROGRESS_KEY2 = "progress";
var ELO_PROFILE_COLLECTION2 = "elo_profiles";
var ELO_PROFILE_KEY2 = "profile";
var SECURE_RANDOM_UINT32_DIVISOR = 4294967296;
var SECURE_RANDOM_FALLBACK_HEX_LENGTH = 8;
var asRecord10 = (value) => typeof value === "object" && value !== null ? value : null;
var hasCryptoGetRandomValues = (value) => typeof value === "object" && value !== null && typeof value.getRandomValues === "function";
var getSecureRandomUnit = (nk) => {
  const cryptoApi = globalThis.crypto;
  if (hasCryptoGetRandomValues(cryptoApi)) {
    const randomValues = cryptoApi.getRandomValues(new Uint32Array(1));
    return randomValues[0] / SECURE_RANDOM_UINT32_DIVISOR;
  }
  if (nk && typeof nk.uuidv4 === "function") {
    const uuid = nk.uuidv4().replace(/-/g, "");
    if (uuid.length >= SECURE_RANDOM_FALLBACK_HEX_LENGTH) {
      const fallbackValue = Number.parseInt(uuid.slice(0, SECURE_RANDOM_FALLBACK_HEX_LENGTH), 16);
      if (Number.isFinite(fallbackValue)) {
        return fallbackValue / SECURE_RANDOM_UINT32_DIVISOR;
      }
    }
  }
  throw new Error("Authoritative dice roll requires a cryptographically secure random source.");
};
var rollAuthoritativeDice = (nk, matchConfig) => rollThrowFace(matchConfig, () => getSecureRandomUnit(nk));
var readStringField15 = (value, keys) => {
  const record = asRecord10(value);
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
var readNumberField10 = (value, keys) => {
  const record = asRecord10(value);
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
  const binaryToString = (_a = asRecord10(nk)) == null ? void 0 : _a.binaryToString;
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
var getPresenceUserId = (presence) => readStringField15(presence, ["userId", "user_id"]);
var getPresenceSessionId = (presence) => readStringField15(presence, ["sessionId", "session_id"]);
var getSenderUserId = (sender) => readStringField15(sender, ["userId", "user_id"]);
var getPresenceKey = (presence) => {
  const sessionId = getPresenceSessionId(presence);
  if (sessionId) {
    return sessionId;
  }
  const userId = getPresenceUserId(presence);
  return userId ? `user:${userId}` : null;
};
var getPresenceMetadata = (presence) => {
  var _a;
  const metadata = (_a = asRecord10(presence)) == null ? void 0 : _a.metadata;
  return asRecord10(metadata);
};
var isSpectatorPresenceRequest = (presence) => {
  const record = asRecord10(presence);
  const metadata = getPresenceMetadata(presence);
  return (record == null ? void 0 : record.role) === "spectator" || (metadata == null ? void 0 : metadata.role) === "spectator";
};
var getMatchId = (ctx) => {
  var _a;
  return (_a = readStringField15(ctx, ["matchId", "match_id"])) != null ? _a : "";
};
var getMessageOpCode = (message) => readNumberField10(message, ["opCode", "op_code"]);
var getContextUserId2 = (ctx) => readStringField15(ctx, ["userId", "user_id"]);
var resolveMatchModeId = (value) => typeof value === "string" && value.trim().length > 0 ? value.trim() : "standard";
var resolveMatchConfigForModeId = (nk, params, modeId) => {
  const restrictedOnlineMatch = Boolean(readStringField15(params, ["openOnlineMatchId", "open_online_match_id"])) || params.privateMatch === true || Boolean(resolveTournamentMatchContextFromParams(params));
  if (isMatchModeId(modeId)) {
    if (restrictedOnlineMatch && !OPEN_ONLINE_MATCH_MODE_IDS.includes(modeId)) {
      return null;
    }
    return getMatchConfig(modeId);
  }
  const isOpenOnlineMatch = Boolean(readStringField15(params, ["openOnlineMatchId", "open_online_match_id"]));
  const isTournamentMatch = Boolean(resolveTournamentMatchContextFromParams(params));
  const featuredMode = getPublicGameModes(nk).featuredMode;
  if (!featuredMode || featuredMode.id !== modeId) {
    return null;
  }
  return buildGameModeMatchConfig(featuredMode, {
    allowsXp: true,
    allowsChallenges: true,
    allowsCoins: isOpenOnlineMatch,
    allowsOnline: true,
    allowsRankedStats: isOpenOnlineMatch || isTournamentMatch,
    isPracticeMode: false,
    displayName: featuredMode.name
  });
};
var resolveConfiguredRewardXp = (value) => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }
  return Math.max(0, Math.floor(value));
};
var buildMatchClassification = (params, matchConfig) => {
  const tournamentMatch = Boolean(resolveTournamentMatchContextFromParams(params));
  const privateMatch = params.privateMatch === true;
  const botMatch = params.botMatch === true;
  const casualMatch = params.casualMatch === true;
  const experimental = !matchConfig.allowsRankedStats && !tournamentMatch;
  const ranked = params.rankedMatch === true || !privateMatch && !botMatch && !casualMatch && !experimental && params.rankedMatch !== false;
  return {
    ranked,
    casual: casualMatch,
    private: privateMatch,
    bot: botMatch,
    experimental
  };
};
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
var createPlayerDisconnectState = () => ({
  disconnectedAtMs: null,
  reconnectDeadlineMs: null
});
var createMatchTimerState = () => ({
  turnDurationMs: ONLINE_TURN_DURATION_MS,
  turnStartedAtMs: null,
  turnDeadlineMs: null,
  pausedTurnRemainingMs: null,
  activePlayerColor: null,
  activePlayerUserId: null,
  activePhase: null,
  resetReason: null
});
var createMatchRollDisplayState = () => ({
  value: null,
  label: null
});
var createReactionCounts = (assignments) => Object.keys(assignments).reduce((counts, userId) => {
  counts[userId] = 0;
  return counts;
}, {});
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
  try {
    const data = JSON.parse(payload);
    return (_a = asRecord10(data)) != null ? _a : {};
  } catch (_error) {
    return {};
  }
};
var normalizePrivateMatchCodeRecord = (value) => {
  var _a;
  const record = asRecord10(value);
  if (!record) {
    return null;
  }
  const code = normalizePrivateMatchCodeInput((_a = readStringField15(record, ["code"])) != null ? _a : "");
  const matchId = readStringField15(record, ["matchId", "match_id"]);
  const modeId = readStringField15(record, ["modeId", "mode_id"]);
  const creatorUserId = readStringField15(record, ["creatorUserId", "creator_user_id"]);
  const joinedUserId = readStringField15(record, ["joinedUserId", "joined_user_id"]);
  const createdAt = readStringField15(record, ["createdAt", "created_at"]);
  const updatedAt = readStringField15(record, ["updatedAt", "updated_at"]);
  if (!isPrivateMatchCode(code) || !modeId || !creatorUserId || !createdAt || !updatedAt) {
    return null;
  }
  return {
    code,
    matchId: matchId != null ? matchId : null,
    modeId,
    creatorUserId,
    joinedUserId: joinedUserId != null ? joinedUserId : null,
    createdAt,
    updatedAt
  };
};
var readPrivateMatchCodeObject = (nk, code) => {
  var _a;
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
    },
    {
      collection: PRIVATE_MATCH_CODE_COLLECTION,
      key: normalizedCode
    }
  ]);
  const object = (_a = findStorageObject(objects, PRIVATE_MATCH_CODE_COLLECTION, normalizedCode, SYSTEM_USER_ID5)) != null ? _a : findStorageObject(objects, PRIVATE_MATCH_CODE_COLLECTION, normalizedCode);
  return {
    object,
    record: normalizePrivateMatchCodeRecord(object == null ? void 0 : object.value)
  };
};
var writePrivateMatchCodeRecord = (nk, record, version) => {
  const write = {
    collection: PRIVATE_MATCH_CODE_COLLECTION,
    key: record.code,
    userId: SYSTEM_USER_ID5,
    value: record,
    permissionRead: STORAGE_PERMISSION_NONE2,
    permissionWrite: STORAGE_PERMISSION_NONE2
  };
  if (typeof version === "string") {
    write.version = version;
  }
  nk.storageWrite([
    write
  ]);
};
var getErrorMessage6 = (error) => error instanceof Error ? error.message : String(error);
var isPrivateMatchCodeReservationConflict = (error) => {
  const message = getErrorMessage6(error).toLowerCase();
  return message.includes("version check") || message.includes("version conflict") || message.includes("storage write rejected") || message.includes("already exists");
};
var reservePrivateMatchCodeRecord = (nk, modeId, creatorUserId) => {
  for (let attempt = 0; attempt < PRIVATE_MATCH_CODE_MAX_GENERATION_ATTEMPTS; attempt += 1) {
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const record = {
      code: generatePrivateMatchCode(),
      matchId: null,
      modeId,
      creatorUserId,
      joinedUserId: null,
      createdAt: now,
      updatedAt: now
    };
    try {
      writePrivateMatchCodeRecord(nk, record, "*");
      return record;
    } catch (error) {
      if (isPrivateMatchCodeReservationConflict(error)) {
        continue;
      }
      throw new Error("Unable to reserve a private game code right now.");
    }
  }
  throw new Error("Unable to create a private game code right now.");
};
var createPrivateMatchCodeRecord = (nk, reservation, matchId) => {
  const record = __spreadProps(__spreadValues({}, reservation), { matchId, updatedAt: (/* @__PURE__ */ new Date()).toISOString() });
  for (let attempt = 0; attempt < PRIVATE_MATCH_CODE_WRITE_ATTEMPTS; attempt += 1) {
    try {
      writePrivateMatchCodeRecord(nk, record);
      return record;
    } catch (e) {
    }
  }
  throw new Error("Unable to publish private game code right now.");
};
var deletePrivateMatchCodeRecord = (nk, code) => {
  nk.storageDelete([
    {
      collection: PRIVATE_MATCH_CODE_COLLECTION,
      key: code,
      userId: SYSTEM_USER_ID5
    }
  ]);
};
var isOpenOnlineMatchDurationMinutes = (value) => OPEN_ONLINE_MATCH_DURATIONS_MINUTES.includes(value);
var normalizeOpenOnlineMatchWager = (value) => {
  const wager = readNumberField10({ value }, ["value"]);
  if (wager === null || !Number.isInteger(wager) || wager < OPEN_ONLINE_MATCH_MIN_WAGER || wager > OPEN_ONLINE_MATCH_MAX_WAGER || wager % OPEN_ONLINE_MATCH_WAGER_STEP !== 0) {
    throw new Error("Wager must be between 10 and 100 coins in increments of 10.");
  }
  return wager;
};
var normalizeOpenOnlineMatchDurationMinutes = (value) => {
  const durationMinutes = readNumberField10({ value }, ["value"]);
  if (durationMinutes === null || !Number.isInteger(durationMinutes) || !isOpenOnlineMatchDurationMinutes(durationMinutes)) {
    throw new Error("Open match duration must be 3, 5, or 10 minutes.");
  }
  return durationMinutes;
};
var normalizeOpenOnlineMatchModeId = (nk, value) => {
  const modeId = resolveMatchModeId(value);
  const featuredMode = getPublicGameModes(nk).featuredMode;
  if (!OPEN_ONLINE_MATCH_MODE_IDS.includes(modeId) && (featuredMode == null ? void 0 : featuredMode.id) !== modeId) {
    throw new Error("Online matches support Race, Finkel Rules, or the current Game Mode of the Month.");
  }
  return modeId;
};
var generateOpenOnlineMatchId = () => {
  const randomPart = Math.floor(Math.random() * 4294967295).toString(36).padStart(7, "0").slice(0, 7);
  return `open-${Date.now().toString(36)}-${randomPart}`;
};
var normalizeOpenOnlineMatchStatus = (value) => {
  if (value === "matched" || value === "expired" || value === "settled") {
    return value;
  }
  return "open";
};
var normalizeOpenOnlineMatchRecord = (value) => {
  const record = asRecord10(value);
  if (!record) {
    return null;
  }
  const openMatchId = readStringField15(record, ["openMatchId", "open_match_id"]);
  const matchId = readStringField15(record, ["matchId", "match_id"]);
  const modeId = readStringField15(record, ["modeId", "mode_id"]);
  const creatorUserId = readStringField15(record, ["creatorUserId", "creator_user_id"]);
  const joinedUserId = readStringField15(record, ["joinedUserId", "joined_user_id"]);
  const wager = readNumberField10(record, ["wager"]);
  const durationMinutes = readNumberField10(record, ["durationMinutes", "duration_minutes"]);
  const createdAt = readStringField15(record, ["createdAt", "created_at"]);
  const expiresAt = readStringField15(record, ["expiresAt", "expires_at"]);
  const updatedAt = readStringField15(record, ["updatedAt", "updated_at"]);
  if (!openMatchId || !matchId || !modeId || !creatorUserId || wager === null || durationMinutes === null || !Number.isInteger(wager) || !Number.isInteger(durationMinutes) || !createdAt || !expiresAt || !updatedAt) {
    return null;
  }
  return {
    openMatchId,
    matchId,
    modeId,
    creatorUserId,
    joinedUserId: joinedUserId != null ? joinedUserId : null,
    wager,
    durationMinutes,
    status: normalizeOpenOnlineMatchStatus(record.status),
    creatorEscrowRefunded: record.creatorEscrowRefunded === true || record.creator_escrow_refunded === true,
    potPaidOut: record.potPaidOut === true || record.pot_paid_out === true,
    createdAt,
    expiresAt,
    updatedAt
  };
};
var readOpenOnlineMatchObject = (nk, openMatchId) => {
  if (!openMatchId) {
    return { object: null, record: null };
  }
  const objects = nk.storageRead([
    {
      collection: OPEN_ONLINE_MATCH_COLLECTION,
      key: openMatchId,
      userId: SYSTEM_USER_ID5
    }
  ]);
  const object = findStorageObject(objects, OPEN_ONLINE_MATCH_COLLECTION, openMatchId, SYSTEM_USER_ID5);
  return {
    object,
    record: normalizeOpenOnlineMatchRecord(object == null ? void 0 : object.value)
  };
};
var writeOpenOnlineMatchRecord = (nk, record, version) => {
  const write = {
    collection: OPEN_ONLINE_MATCH_COLLECTION,
    key: record.openMatchId,
    userId: SYSTEM_USER_ID5,
    value: record,
    permissionRead: STORAGE_PERMISSION_NONE2,
    permissionWrite: STORAGE_PERMISSION_NONE2
  };
  if (typeof version === "string") {
    write.version = version;
  }
  nk.storageWrite([write]);
};
var isOpenOnlineMatchStorageConflict = (error) => isPrivateMatchCodeReservationConflict(error);
var spendOpenOnlineMatchWager = (nk, userId, wager, metadata) => {
  const wallet = getWalletForUser(nk, userId);
  if (wallet[SOFT_CURRENCY_KEY] < wager) {
    throw new Error("INSUFFICIENT_FUNDS");
  }
  nk.walletUpdate(
    userId,
    { [SOFT_CURRENCY_KEY]: -wager },
    __spreadValues({
      source: "open_online_match_wager",
      currency: SOFT_CURRENCY_KEY,
      amount: wager
    }, metadata),
    true
  );
};
var refundOpenOnlineMatchCreator = (logger, nk, record) => {
  if (record.creatorEscrowRefunded || record.status === "matched" || record.status === "settled") {
    return record;
  }
  nk.walletUpdate(
    record.creatorUserId,
    { [SOFT_CURRENCY_KEY]: record.wager },
    {
      source: "open_online_match_refund",
      currency: SOFT_CURRENCY_KEY,
      amount: record.wager,
      openMatchId: record.openMatchId,
      matchId: record.matchId
    },
    true
  );
  logger.info("Refunded expired open online match wager", {
    userId: record.creatorUserId,
    openMatchId: record.openMatchId,
    wager: record.wager
  });
  return __spreadProps(__spreadValues({}, record), {
    status: "expired",
    creatorEscrowRefunded: true,
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  });
};
var expireOpenOnlineMatchIfNeeded = (logger, nk, record, version, nowMs = Date.now()) => {
  if (record.status !== "open" || Date.parse(record.expiresAt) > nowMs) {
    return record;
  }
  const expiredRecord = refundOpenOnlineMatchCreator(logger, nk, record);
  try {
    writeOpenOnlineMatchRecord(nk, expiredRecord, version != null ? version : void 0);
  } catch (error) {
    logger.warn(
      "Expired open online match %s but failed to persist refund state: %s",
      record.openMatchId,
      getErrorMessage6(error)
    );
  }
  return expiredRecord;
};
var normalizeStorageListResultForOpenMatches = (result) => {
  if (Array.isArray(result)) {
    return {
      objects: result.filter((object) => asRecord10(object) !== null),
      cursor: null
    };
  }
  const record = asRecord10(result);
  if (!record) {
    return { objects: [], cursor: null };
  }
  const rawObjects = Array.isArray(record.objects) ? record.objects : Array.isArray(record.storageObjects) ? record.storageObjects : Array.isArray(record.runtimeObjects) ? record.runtimeObjects : [];
  return {
    objects: rawObjects.filter((object) => asRecord10(object) !== null),
    cursor: readStringField15(record, ["cursor"])
  };
};
var listOpenOnlineMatchStorageObjects = (logger, nk) => {
  if (typeof nk.storageList !== "function") {
    logger.warn("Open online match listing is not supported by this Nakama runtime.");
    return [];
  }
  const objects = [];
  let cursor = "";
  for (let page = 0; page < OPEN_ONLINE_MATCH_MAX_PAGES; page += 1) {
    const rawResult = nk.storageList(SYSTEM_USER_ID5, OPEN_ONLINE_MATCH_COLLECTION, OPEN_ONLINE_MATCH_PAGE_SIZE, cursor);
    const result = normalizeStorageListResultForOpenMatches(rawResult);
    objects.push(...result.objects);
    if (!result.cursor) {
      break;
    }
    cursor = result.cursor;
  }
  return objects;
};
var buildOpenOnlineMatchRpcModel = (record, viewerUserId) => ({
  openMatchId: record.openMatchId,
  matchId: record.matchId,
  modeId: record.modeId,
  creatorUserId: record.creatorUserId,
  joinedUserId: record.joinedUserId,
  wager: record.wager,
  durationMinutes: record.durationMinutes,
  status: record.status,
  createdAt: record.createdAt,
  expiresAt: record.expiresAt,
  updatedAt: record.updatedAt,
  entrants: record.joinedUserId ? 2 : 1,
  maxEntrants: MAX_PLAYERS,
  isCreator: Boolean(viewerUserId && viewerUserId === record.creatorUserId),
  isJoiner: Boolean(viewerUserId && viewerUserId === record.joinedUserId)
});
var syncOpenOnlineMatchReservation = (logger, nk, state) => {
  if (!state.openOnlineMatchId) {
    return;
  }
  const { object, record } = readOpenOnlineMatchObject(nk, state.openOnlineMatchId);
  if (!record) {
    return;
  }
  const nextRecord = expireOpenOnlineMatchIfNeeded(logger, nk, record, getStorageObjectVersion(object));
  state.openOnlineMatchCreatorUserId = nextRecord.creatorUserId;
  state.openOnlineMatchJoinerUserId = nextRecord.joinedUserId;
};
var canUserJoinOpenOnlineMatch = (state, userId) => {
  if (!state.openOnlineMatchId) {
    return true;
  }
  if (state.openOnlineMatchCreatorUserId === userId) {
    return true;
  }
  return Boolean(state.openOnlineMatchJoinerUserId && state.openOnlineMatchJoinerUserId === userId);
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
    if (!record.matchId) {
      throw new Error("Private game is still starting. Try this code again in a moment.");
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
var clearPrivateMatchGuestReservation = (nk, state, userId) => {
  var _a;
  if (!state.privateMatch || state.started || !state.privateCode || state.privateGuestUserId !== userId) {
    return false;
  }
  const { object, record } = readPrivateMatchCodeObject(nk, state.privateCode);
  if (!record || record.matchId === null || record.joinedUserId !== userId) {
    return false;
  }
  const nextRecord = __spreadProps(__spreadValues({}, record), {
    joinedUserId: null,
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  });
  try {
    writePrivateMatchCodeRecord(nk, nextRecord, (_a = getStorageObjectVersion(object)) != null ? _a : "");
    state.privateGuestUserId = null;
    state.revision += 1;
    return true;
  } catch (e) {
    return false;
  }
};
var createMatchRematchState = () => ({
  status: "idle",
  deadlineMs: null,
  decisionsByUserId: {},
  nextMatchId: null,
  nextPrivateCode: null
});
var getRematchAcceptedUserIds = (state) => Object.entries(state.rematch.decisionsByUserId).filter(([, decision]) => decision === "accepted").map(([userId]) => userId);
var buildSnapshotRematch = (state) => ({
  status: state.rematch.status,
  deadlineMs: state.rematch.deadlineMs,
  decisionsByUserId: __spreadValues({}, state.rematch.decisionsByUserId),
  acceptedUserIds: getRematchAcceptedUserIds(state),
  nextMatchId: state.rematch.nextMatchId,
  nextPrivateCode: state.rematch.nextPrivateCode
});
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
var getAssignedPlayerTargets = (state) => Object.keys(state.assignments).flatMap((userId) => getUserPresenceTargets(state, userId));
var getActiveUserCount = (state) => Object.keys(state.presences).length;
var isSpectatorPresence = (state, presence) => {
  var _a;
  const userId = getPresenceUserId(presence);
  const presenceKey = getPresenceKey(presence);
  return Boolean(userId && presenceKey && ((_a = state.spectatorPresences[userId]) == null ? void 0 : _a[presenceKey]));
};
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
var upsertSpectatorPresence = (state, presence) => {
  var _a;
  const userId = getPresenceUserId(presence);
  const presenceKey = getPresenceKey(presence);
  if (!userId || !presenceKey) {
    return;
  }
  state.spectatorPresences[userId] = __spreadProps(__spreadValues({}, (_a = state.spectatorPresences[userId]) != null ? _a : {}), {
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
var removeSpectatorPresence = (state, presence) => {
  const userId = getPresenceUserId(presence);
  const presenceKey = getPresenceKey(presence);
  if (!userId || !presenceKey) {
    return false;
  }
  const userPresences = state.spectatorPresences[userId];
  if (!userPresences) {
    return false;
  }
  delete userPresences[presenceKey];
  if (Object.keys(userPresences).length === 0) {
    delete state.spectatorPresences[userId];
  }
  return true;
};
var isSpectatableMatchState = (state) => state.started && !state.gameState.winner && state.gameState.phase !== "ended" && state.opponentType === "human" && !state.classification.private && !state.classification.bot && !state.tournamentContext;
var getUserIdForColor = (state, color) => {
  var _a, _b;
  return (_b = (_a = Object.entries(state.assignments).find(([, assignedColor]) => assignedColor === color)) == null ? void 0 : _a[0]) != null ? _b : null;
};
var getBotOpponentType = (difficulty) => {
  if (difficulty === "medium") {
    return "medium_bot";
  }
  if (difficulty === "hard") {
    return "hard_bot";
  }
  if (difficulty === "perfect") {
    return "perfect_bot";
  }
  return "easy_bot";
};
var isConfiguredBotUser = (state, userId) => {
  var _a;
  return Boolean(userId && ((_a = state.bot) == null ? void 0 : _a.userId) === userId);
};
var isConfiguredBotColor = (state, color) => {
  var _a;
  return Boolean(color && ((_a = state.bot) == null ? void 0 : _a.color) === color);
};
var resolveAssignedPlayerTitle = (nk, userId) => {
  try {
    const profile = getUsernameOnboardingProfile(nk, userId);
    if (profile.onboardingComplete && profile.usernameDisplay) {
      return profile.usernameDisplay;
    }
  } catch (e) {
  }
  return "Guest";
};
var cacheAssignedPlayerTitle = (state, nk, userId) => {
  if (Object.prototype.hasOwnProperty.call(state.playerTitles, userId)) {
    return;
  }
  state.playerTitles[userId] = resolveAssignedPlayerTitle(nk, userId);
};
var resolveAssignedPlayerRankTitle = (nk, logger, userId, options) => {
  if (options == null ? void 0 : options.isBotUser) {
    return null;
  }
  try {
    return getProgressionForUser(nk, logger, userId).currentRank;
  } catch (e) {
    return null;
  }
};
var cacheAssignedPlayerRankTitle = (state, nk, logger, userId) => {
  if (Object.prototype.hasOwnProperty.call(state.playerRankTitles, userId)) {
    return;
  }
  state.playerRankTitles[userId] = resolveAssignedPlayerRankTitle(nk, logger, userId, {
    isBotUser: isConfiguredBotUser(state, userId)
  });
};
var buildSnapshotPlayer = (state, color) => {
  var _a, _b;
  const userId = getUserIdForColor(state, color);
  return {
    userId,
    title: userId ? (_a = state.playerTitles[userId]) != null ? _a : "Guest" : null,
    rankTitle: userId ? (_b = state.playerRankTitles[userId]) != null ? _b : null : null
  };
};
var getOtherPlayerColor = (color) => color === "light" ? "dark" : "light";
var getActiveAssignedUserCount = (state) => Object.keys(state.assignments).filter(
  (userId) => isConfiguredBotUser(state, userId) || getUserPresenceTargets(state, userId).length > 0
).length;
var canStartMatch = (state) => Object.keys(state.assignments).length >= MAX_PLAYERS && getActiveAssignedUserCount(state) >= MAX_PLAYERS;
var canUseMatchEmojiReactions = (state) => !state.classification.bot && state.opponentType === "human" && Object.keys(state.assignments).length >= MAX_PLAYERS;
var canUseLivePieceSelectionRequests = (state) => !state.classification.bot && state.opponentType === "human" && Object.keys(state.assignments).length >= MAX_PLAYERS;
var canRunAuthoritativeTurnTimer = (state) => state.started && !state.gameState.winner && state.gameState.phase !== "ended" && Boolean(getUserIdForColor(state, state.gameState.currentTurn));
var getAssignedHumanUserIdForColor = (state, color) => {
  const userId = getUserIdForColor(state, color);
  if (!userId || isConfiguredBotColor(state, color)) {
    return null;
  }
  return userId;
};
var getOrderedRematchHumanUserIds = (state) => {
  const lightUserId = getAssignedHumanUserIdForColor(state, "light");
  const darkUserId = getAssignedHumanUserIdForColor(state, "dark");
  if (!lightUserId || !darkUserId) {
    return null;
  }
  return [lightUserId, darkUserId];
};
var canOpenRematchWindow = (state) => state.resultRecorded && state.gameState.winner !== null && state.opponentType === "human" && !state.classification.bot && !state.tournamentContext && getOrderedRematchHumanUserIds(state) !== null;
var openRematchWindow = (state, nowMs) => {
  const rematchPlayerIds = getOrderedRematchHumanUserIds(state);
  if (!canOpenRematchWindow(state) || state.rematch.status !== "idle" || !rematchPlayerIds) {
    return false;
  }
  state.rematch = {
    status: "pending",
    deadlineMs: nowMs + REMATCH_WINDOW_MS,
    decisionsByUserId: rematchPlayerIds.reduce(
      (entries, userId) => {
        entries[userId] = "pending";
        return entries;
      },
      {}
    ),
    nextMatchId: null,
    nextPrivateCode: null
  };
  state.revision += 1;
  return true;
};
var expireRematchWindow = (state) => {
  if (state.rematch.status !== "pending") {
    return false;
  }
  state.rematch.status = "expired";
  state.revision += 1;
  return true;
};
var haveAllRematchPlayersAccepted = (state) => {
  const rematchPlayerIds = getOrderedRematchHumanUserIds(state);
  return Boolean(
    rematchPlayerIds && rematchPlayerIds.every((userId) => state.rematch.decisionsByUserId[userId] === "accepted")
  );
};
var getDisconnectedAssignedColors = (state) => ["light", "dark"].filter((color) => {
  const userId = getAssignedHumanUserIdForColor(state, color);
  if (!userId) {
    return false;
  }
  return state.disconnect[color].reconnectDeadlineMs !== null && getUserPresenceTargets(state, userId).length === 0;
});
var hasActiveDisconnectGrace = (state) => !state.gameState.winner && state.gameState.phase !== "ended" && getDisconnectedAssignedColors(state).length > 0;
var getReconnectGraceState = (state, nowMs) => {
  var _a;
  const candidates = getDisconnectedAssignedColors(state).map((playerColor) => {
    const userId = getAssignedHumanUserIdForColor(state, playerColor);
    const reconnectDeadlineMs = state.disconnect[playerColor].reconnectDeadlineMs;
    if (!userId || reconnectDeadlineMs === null) {
      return null;
    }
    return {
      playerColor,
      userId,
      reconnectDeadlineMs,
      reconnectRemainingMs: Math.max(0, reconnectDeadlineMs - nowMs)
    };
  }).filter((candidate) => candidate !== null).sort((left, right) => left.reconnectDeadlineMs - right.reconnectDeadlineMs);
  return (_a = candidates[0]) != null ? _a : null;
};
var getExpiredDisconnectedColor = (state, nowMs) => {
  const expiredColors = getDisconnectedAssignedColors(state).filter((color) => {
    const reconnectDeadlineMs = state.disconnect[color].reconnectDeadlineMs;
    return reconnectDeadlineMs !== null && nowMs >= reconnectDeadlineMs;
  });
  if (expiredColors.length === 0) {
    return null;
  }
  return expiredColors.includes(state.gameState.currentTurn) ? state.gameState.currentTurn : expiredColors[0];
};
var clearTurnTimer = (state, reason = null) => {
  state.timer.turnStartedAtMs = null;
  state.timer.turnDeadlineMs = null;
  state.timer.pausedTurnRemainingMs = null;
  state.timer.activePlayerColor = null;
  state.timer.activePlayerUserId = null;
  state.timer.activePhase = null;
  state.timer.resetReason = reason;
};
var pauseTurnTimerForDisconnect = (state, nowMs) => {
  if (state.timer.turnDeadlineMs !== null) {
    state.timer.pausedTurnRemainingMs = Math.max(0, state.timer.turnDeadlineMs - nowMs);
  } else if (state.timer.pausedTurnRemainingMs === null) {
    state.timer.pausedTurnRemainingMs = ONLINE_RECONNECT_RESUME_MS;
  }
  state.timer.turnStartedAtMs = null;
  state.timer.turnDeadlineMs = null;
  state.timer.activePlayerColor = null;
  state.timer.activePlayerUserId = null;
  state.timer.activePhase = null;
  state.timer.resetReason = "paused_for_disconnect";
};
var resetTurnTimerForCurrentState = (state, nowMs, reason, overrideTurnDurationMs) => {
  if (!canRunAuthoritativeTurnTimer(state)) {
    clearTurnTimer(state, reason);
    return;
  }
  const activePlayerColor = state.gameState.currentTurn;
  const defaultTurnDurationMs = isConfiguredBotColor(state, activePlayerColor) ? BOT_TURN_DELAY_MS : ONLINE_TURN_DURATION_MS;
  const turnDurationMs = typeof overrideTurnDurationMs === "number" && Number.isFinite(overrideTurnDurationMs) ? Math.max(0, Math.round(overrideTurnDurationMs)) : defaultTurnDurationMs;
  state.timer.turnDurationMs = turnDurationMs;
  state.timer.turnStartedAtMs = nowMs;
  state.timer.turnDeadlineMs = nowMs + turnDurationMs;
  state.timer.pausedTurnRemainingMs = null;
  state.timer.activePlayerColor = activePlayerColor;
  state.timer.activePlayerUserId = getUserIdForColor(state, activePlayerColor);
  state.timer.activePhase = state.gameState.phase;
  state.timer.resetReason = reason;
};
var ensureTurnTimerForCurrentState = (state, nowMs) => {
  if (hasActiveDisconnectGrace(state)) {
    pauseTurnTimerForDisconnect(state, nowMs);
    return;
  }
  if (!canRunAuthoritativeTurnTimer(state)) {
    clearTurnTimer(state, "inactive");
    return;
  }
  if (state.timer.turnDeadlineMs !== null && state.timer.activePlayerColor === state.gameState.currentTurn && state.timer.activePhase === state.gameState.phase) {
    return;
  }
  resetTurnTimerForCurrentState(state, nowMs, "resynced");
};
var clearDisconnectGraceForColor = (state, playerColor) => {
  const tracker = state.disconnect[playerColor];
  const didClear = tracker.disconnectedAtMs !== null || tracker.reconnectDeadlineMs !== null;
  state.disconnect[playerColor] = createPlayerDisconnectState();
  return didClear;
};
var clearDisconnectGraceForUser = (state, userId) => {
  const playerColor = state.assignments[userId];
  if (!playerColor) {
    return false;
  }
  return clearDisconnectGraceForColor(state, playerColor);
};
var startDisconnectGraceForUser = (state, userId, nowMs) => {
  if (!state.started || state.gameState.winner || state.gameState.phase === "ended") {
    return false;
  }
  const playerColor = state.assignments[userId];
  if (!playerColor || isConfiguredBotColor(state, playerColor)) {
    return false;
  }
  if (getUserPresenceTargets(state, userId).length > 0) {
    return false;
  }
  state.disconnect[playerColor] = {
    disconnectedAtMs: nowMs,
    reconnectDeadlineMs: nowMs + ONLINE_DISCONNECT_GRACE_MS
  };
  pauseTurnTimerForDisconnect(state, nowMs);
  return true;
};
var resumeTurnTimerAfterReconnect = (state, nowMs) => {
  const pausedTurnRemainingMs = state.timer.pausedTurnRemainingMs;
  const resumeTurnDurationMs = pausedTurnRemainingMs === null ? ONLINE_TURN_DURATION_MS : Math.min(ONLINE_TURN_DURATION_MS, Math.max(pausedTurnRemainingMs, ONLINE_RECONNECT_RESUME_MS));
  resetTurnTimerForCurrentState(state, nowMs, "resumed_after_reconnect", resumeTurnDurationMs);
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
  if (isConfiguredBotColor(state, playerColor)) {
    return 0;
  }
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
  var _a, _b, _c;
  if (!state.gameState.winner) {
    state.matchEnd = null;
    return;
  }
  if (((_a = state.matchEnd) == null ? void 0 : _a.reason) === "forfeit_inactivity" || ((_b = state.matchEnd) == null ? void 0 : _b.reason) === "forfeit_disconnect") {
    return;
  }
  const softCurrencyAwarded = ((_c = state.matchEnd) == null ? void 0 : _c.softCurrencyAwarded) === true;
  state.matchEnd = buildMatchEndPayload(state, "completed", state.gameState.winner);
  if (softCurrencyAwarded) {
    state.matchEnd.softCurrencyAwarded = true;
  }
};
var buildRematchMatchParams = (state, privateCode) => {
  const rematchPlayerIds = getOrderedRematchHumanUserIds(state);
  if (!rematchPlayerIds) {
    throw new Error("Rematch requires two human players.");
  }
  const [lightUserId, darkUserId] = rematchPlayerIds;
  const params = {
    playerIds: [lightUserId, darkUserId],
    modeId: state.modeId,
    rankedMatch: state.classification.ranked,
    casualMatch: state.classification.casual,
    botMatch: false,
    privateMatch: state.privateMatch,
    winRewardSource: state.winRewardSource,
    allowsChallengeRewards: state.allowsChallengeRewards
  };
  if (state.privateMatch) {
    if (!privateCode || !state.privateCreatorUserId || !state.privateGuestUserId) {
      throw new Error("Private rematch requires preserved creator, guest, and private code.");
    }
    params.privateCode = privateCode;
    params.privateCreatorUserId = state.privateCreatorUserId;
    params.privateGuestUserId = state.privateGuestUserId;
  }
  return params;
};
var maybeCreateRematchMatch = (logger, nk, dispatcher, state, currentMatchId) => {
  if (state.rematch.status !== "pending" || state.rematch.nextMatchId !== null || !haveAllRematchPlayersAccepted(state)) {
    return false;
  }
  let privateCodeReservation = null;
  let nextPrivateCode = null;
  if (state.privateMatch) {
    syncPrivateMatchReservation(nk, state);
    if (!state.privateCreatorUserId) {
      throw new Error("Private rematch requires a preserved creator.");
    }
    privateCodeReservation = reservePrivateMatchCodeRecord(nk, state.modeId, state.privateCreatorUserId);
    nextPrivateCode = privateCodeReservation.code;
  }
  let nextMatchId;
  try {
    nextMatchId = nk.matchCreate(MATCH_HANDLER, buildRematchMatchParams(state, nextPrivateCode));
  } catch (error) {
    if (privateCodeReservation) {
      try {
        deletePrivateMatchCodeRecord(nk, privateCodeReservation.code);
      } catch (deleteError) {
        logger.warn(
          "Private rematch code %s cleanup failed after matchCreate error on match %s: %s",
          privateCodeReservation.code,
          currentMatchId,
          getErrorMessage6(deleteError)
        );
      }
    }
    throw error;
  }
  state.rematch.status = "matched";
  state.rematch.nextMatchId = nextMatchId;
  state.rematch.nextPrivateCode = nextPrivateCode;
  state.revision += 1;
  if (privateCodeReservation && state.privateGuestUserId) {
    try {
      createPrivateMatchCodeRecord(
        nk,
        __spreadProps(__spreadValues({}, privateCodeReservation), {
          joinedUserId: state.privateGuestUserId
        }),
        nextMatchId
      );
    } catch (error) {
      logger.warn(
        "Created private rematch %s from match %s but failed to publish private code %s: %s",
        nextMatchId,
        currentMatchId,
        privateCodeReservation.code,
        getErrorMessage6(error)
      );
      const rematchPlayerIds = getOrderedRematchHumanUserIds(state);
      if (rematchPlayerIds) {
        rematchPlayerIds.forEach((userId) => {
          sendError(
            dispatcher,
            state,
            userId,
            "MATCH_NOT_READY",
            "Rematch started but private code sync failed. If either player cannot rejoin, start a new private table."
          );
        });
      }
    }
  }
  logger.info("Created authoritative rematch %s from completed match %s.", nextMatchId, currentMatchId);
  return true;
};
var syncRematchState = (logger, nk, dispatcher, state, matchId, nowMs) => {
  let didChange = false;
  didChange = openRematchWindow(state, nowMs) || didChange;
  if (state.rematch.status === "pending" && state.rematch.deadlineMs !== null && nowMs >= state.rematch.deadlineMs) {
    didChange = expireRematchWindow(state) || didChange;
  } else if (state.rematch.status === "pending") {
    didChange = maybeCreateRematchMatch(logger, nk, dispatcher, state, matchId) || didChange;
  }
  if (didChange) {
    broadcastSnapshot(dispatcher, state, matchId);
  }
};
var finalizeCompletedMatch = (logger, nk, dispatcher, state, matchId) => {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l;
  if (!state.gameState.winner || state.resultRecorded) {
    return state.resultRecorded;
  }
  const analyticsWriteBuffer = createAnalyticsEventWriteBuffer();
  try {
    syncCompletedMatchEnd(state);
    const ratingProcessingResult = processCompletedMatchRatings(logger, nk, dispatcher, state, matchId);
    const winnerProgressionAward = awardWinnerProgression(logger, nk, dispatcher, state, matchId, analyticsWriteBuffer);
    awardOpenOnlineMatchPot(logger, nk, state, matchId);
    const tournamentProcessingResult = processCompletedTournamentMatch(logger, nk, state, matchId);
    const challengeProcessingResults = processCompletedMatchSummaries(logger, nk, state, matchId);
    if (state.tournamentContext && (!tournamentProcessingResult || tournamentProcessingResult.retryableFailure)) {
      logger.warn("Deferring final result lock for match %s until tournament synchronization succeeds.", matchId);
      state.resultRecorded = false;
      return false;
    }
    broadcastTournamentMatchRewardSummaries(logger, nk, dispatcher, state, matchId, {
      ratingProcessingResult,
      winnerProgressionAward,
      tournamentProcessingResult,
      challengeProcessingResults
    });
    state.resultRecorded = true;
    {
      const endedAt = (/* @__PURE__ */ new Date()).toISOString();
      const durationSeconds = state.matchStartedAtMs !== null ? Math.max(0, Math.round((Date.now() - state.matchStartedAtMs) / 1e3)) : null;
      recordMatchEndAnalyticsEvent(nk, logger, {
        matchId,
        startedAt: state.matchStartedAtMs !== null ? new Date(state.matchStartedAtMs).toISOString() : null,
        endedAt,
        durationSeconds,
        modeId: state.modeId,
        reason: (_b = (_a = state.matchEnd) == null ? void 0 : _a.reason) != null ? _b : "completed",
        classification: {
          ranked: state.classification.ranked,
          casual: state.classification.casual,
          private: state.classification.private,
          bot: state.classification.bot,
          experimental: state.classification.experimental,
          tournament: Boolean(state.tournamentContext)
        },
        tournamentRunId: (_d = (_c = state.tournamentContext) == null ? void 0 : _c.runId) != null ? _d : null,
        tournamentId: (_f = (_e = state.tournamentContext) == null ? void 0 : _e.tournamentId) != null ? _f : null,
        winnerUserId: (_h = (_g = state.matchEnd) == null ? void 0 : _g.winnerUserId) != null ? _h : null,
        loserUserId: (_j = (_i = state.matchEnd) == null ? void 0 : _i.loserUserId) != null ? _j : null,
        totalMoves: state.telemetry.totalMoves,
        totalTurns: state.telemetry.totalTurns,
        players: buildAnalyticsMatchPlayers(state)
      }, analyticsWriteBuffer);
    }
    if (state.tournamentContext && tournamentProcessingResult && !tournamentProcessingResult.finalizationResult && Boolean((_l = (_k = tournamentProcessingResult.updatedRun) == null ? void 0 : _k.bracket) == null ? void 0 : _l.finalizedAt)) {
      maybeFinalizeRecordedTournamentRun(logger, nk, state, matchId, "result_recorded");
    }
    return true;
  } finally {
    flushAnalyticsEventWriteBuffer(nk, logger, analyticsWriteBuffer);
  }
};
var maybeFinalizeRecordedTournamentRun = (logger, nk, state, matchId, source) => {
  if (!state.tournamentContext || !state.gameState.winner) {
    return;
  }
  try {
    const finalizationResult = maybeAutoFinalizeTournamentRunById(
      nk,
      logger,
      state.tournamentContext.runId
    );
    if (finalizationResult) {
      logger.info(
        "Auto-finalized tournament run %s after %s processing for completed match %s.",
        finalizationResult.run.runId,
        source,
        matchId
      );
    }
  } catch (error) {
    logger.warn(
      "Unable to auto-finalize tournament run %s after %s processing for match %s: %s",
      state.tournamentContext.runId,
      source,
      matchId,
      error instanceof Error ? error.message : String(error)
    );
  }
};
var markMatchStartedIfReady = (state, nowMs) => {
  if (state.started || !canStartMatch(state)) {
    return false;
  }
  state.started = true;
  state.matchStartedAtMs = nowMs;
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
var getPresenceUsername = (presence) => readStringField15(presence, ["username", "displayName", "display_name", "name"]);
var buildAnalyticsMatchPlayers = (state) => Object.entries(state.assignments).map(([userId, color]) => {
  var _a, _b;
  const presence = getPrimaryUserPresence(state, userId);
  const playerTelemetry = state.telemetry.players[color];
  return {
    userId,
    username: (_b = (_a = getPresenceUsername(presence)) != null ? _a : state.playerTitles[userId]) != null ? _b : null,
    color,
    didWin: state.gameState.winner ? state.gameState.winner === color : null,
    capturesMade: playerTelemetry.capturesMade,
    capturesSuffered: playerTelemetry.capturesSuffered,
    playerMoveCount: playerTelemetry.playerMoveCount,
    finishedCount: state.gameState[color].finishedCount,
    isBot: isConfiguredBotUser(state, userId)
  };
});
var buildTournamentMatchCompletion = (state, matchId) => {
  var _a, _b, _c, _d;
  if (!state.tournamentContext) {
    return null;
  }
  const completedAt = (/* @__PURE__ */ new Date()).toISOString();
  const winningColor = state.gameState.winner;
  const players = Object.entries(state.assignments).map(([userId, color]) => {
    var _a2, _b2;
    const presence = getPrimaryUserPresence(state, userId);
    const playerTelemetry = state.telemetry.players[color];
    return {
      userId,
      username: (_b2 = (_a2 = getPresenceUsername(presence)) != null ? _a2 : state.playerTitles[userId]) != null ? _b2 : null,
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
    return null;
  }
  try {
    const completion = buildTournamentMatchCompletion(state, matchId);
    if (!completion) {
      return null;
    }
    return processCompletedAuthoritativeTournamentMatch(nk, logger, completion);
  } catch (error) {
    logger.error(
      "Failed to process tournament result for match %s: %s",
      matchId,
      error instanceof Error ? error.message : String(error)
    );
    return null;
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
  initializer.registerRpc(RPC_GET_WALLET, rpcGetWallet);
  initializer.registerRpc(RPC_CONFIRM_GEM_PACK_PURCHASE, rpcConfirmGemPackPurchase);
  initializer.registerRpc(RPC_GET_STOREFRONT, rpcGetStorefront);
  initializer.registerRpc(RPC_GET_FULL_CATALOG, rpcGetFullCatalog);
  initializer.registerRpc(RPC_PURCHASE_ITEM, rpcPurchaseItem);
  initializer.registerRpc(RPC_GET_OWNED_COSMETICS, rpcGetOwnedCosmetics);
  initializer.registerRpc(RPC_MATCHMAKER_ADD, rpcMatchmakerAdd);
  initializer.registerRpc(RPC_CREATE_PRIVATE_MATCH, rpcCreatePrivateMatch);
  initializer.registerRpc(RPC_JOIN_PRIVATE_MATCH, rpcJoinPrivateMatch);
  initializer.registerRpc(RPC_GET_PRIVATE_MATCH_STATUS, rpcGetPrivateMatchStatus);
  initializer.registerRpc(RPC_LIST_SPECTATABLE_MATCHES, rpcListSpectatableMatches);
  initializer.registerRpc(RPC_CREATE_OPEN_ONLINE_MATCH, rpcCreateOpenOnlineMatch);
  initializer.registerRpc(RPC_LIST_OPEN_ONLINE_MATCHES, rpcListOpenOnlineMatches);
  initializer.registerRpc(RPC_JOIN_OPEN_ONLINE_MATCH, rpcJoinOpenOnlineMatch);
  initializer.registerRpc(RPC_GET_OPEN_ONLINE_MATCH_STATUS, rpcGetOpenOnlineMatchStatus);
  initializer.registerRpc(RPC_GET_ACTIVE_OPEN_ONLINE_MATCH, rpcGetActiveOpenOnlineMatch);
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
  initializer.registerRpc(RPC_ADMIN_EXPORT_TOURNAMENT, rpcAdminExportTournament);
  initializer.registerRpc(RPC_ADMIN_GET_TOURNAMENT_LIVE_STATUS, rpcAdminGetTournamentLiveStatus);
  initializer.registerRpc(RPC_ADMIN_GET_TOURNAMENT_STANDINGS, rpcAdminGetTournamentStandings);
  initializer.registerRpc(RPC_ADMIN_GET_TOURNAMENT_AUDIT_LOG, rpcAdminGetTournamentAuditLog);
  initializer.registerRpc(RPC_TOURNAMENT_JOIN, rpcJoinTournament);
  initializer.registerRpc(RPC_LIST_PUBLIC_TOURNAMENTS, rpcListPublicTournaments);
  initializer.registerRpc(RPC_GET_ACTIVE_TOURNAMENT_FLOW, rpcGetActiveTournamentFlow);
  initializer.registerRpc(RPC_GET_PUBLIC_TOURNAMENT, rpcGetPublicTournament);
  initializer.registerRpc(RPC_GET_PUBLIC_TOURNAMENT_STANDINGS, rpcGetPublicTournamentStandings);
  initializer.registerRpc(RPC_JOIN_PUBLIC_TOURNAMENT, rpcJoinPublicTournament);
  initializer.registerRpc(RPC_LAUNCH_TOURNAMENT_MATCH, rpcLaunchTournamentMatch);
  initializer.registerRpc(RPC_ADMIN_GET_ANALYTICS_SUMMARY, rpcAdminGetAnalyticsSummary);
  initializer.registerRpc(RPC_ADMIN_GET_ANALYTICS_OVERVIEW, rpcAdminGetAnalyticsOverview);
  initializer.registerRpc(RPC_ADMIN_GET_ANALYTICS_PLAYERS, rpcAdminGetAnalyticsPlayers);
  initializer.registerRpc(RPC_ADMIN_GET_ANALYTICS_GAMEPLAY, rpcAdminGetAnalyticsGameplay);
  initializer.registerRpc(RPC_ADMIN_GET_ANALYTICS_TOURNAMENTS, rpcAdminGetAnalyticsTournaments);
  initializer.registerRpc(RPC_ADMIN_GET_ANALYTICS_PROGRESSION, rpcAdminGetAnalyticsProgression);
  initializer.registerRpc(RPC_ADMIN_GET_ANALYTICS_REALTIME, rpcAdminGetAnalyticsRealtime);
  initializer.registerRpc(RPC_ADMIN_GET_FULL_CATALOG, rpcAdminGetFullCatalog);
  initializer.registerRpc(RPC_ADMIN_UPSERT_COSMETIC, rpcAdminUpsertCosmetic);
  initializer.registerRpc(RPC_ADMIN_DISABLE_COSMETIC, rpcAdminDisableCosmetic);
  initializer.registerRpc(RPC_ADMIN_ENABLE_COSMETIC, rpcAdminEnableCosmetic);
  initializer.registerRpc(RPC_ADMIN_DELETE_COSMETIC, rpcAdminDeleteCosmetic);
  initializer.registerRpc(RPC_ADMIN_GET_ROTATION_STATE, rpcAdminGetRotationState);
  initializer.registerRpc(RPC_ADMIN_SET_MANUAL_ROTATION, rpcAdminSetManualRotation);
  initializer.registerRpc(RPC_ADMIN_CLEAR_MANUAL_ROTATION, rpcAdminClearManualRotation);
  initializer.registerRpc(RPC_ADMIN_SET_LIMITED_TIME_EVENT, rpcAdminSetLimitedTimeEvent);
  initializer.registerRpc(RPC_ADMIN_REMOVE_LIMITED_TIME_EVENT, rpcAdminRemoveLimitedTimeEvent);
  initializer.registerRpc(RPC_ADMIN_GET_STORE_STATS, rpcAdminGetStoreStats);
  initializer.registerRpc(RPC_GET_GAME_MODES, rpcGetGameModes);
  initializer.registerRpc(RPC_ADMIN_LIST_GAME_MODES, rpcAdminListGameModes);
  initializer.registerRpc(RPC_ADMIN_GET_GAME_MODE, rpcAdminGetGameMode);
  initializer.registerRpc(RPC_ADMIN_UPSERT_GAME_MODE, rpcAdminUpsertGameMode);
  initializer.registerRpc(RPC_ADMIN_DISABLE_GAME_MODE, rpcAdminDisableGameMode);
  initializer.registerRpc(RPC_ADMIN_ENABLE_GAME_MODE, rpcAdminEnableGameMode);
  initializer.registerRpc(RPC_ADMIN_DELETE_GAME_MODE, rpcAdminDeleteGameMode);
  initializer.registerRpc(RPC_ADMIN_FEATURE_GAME_MODE, rpcAdminFeatureGameMode);
  initializer.registerRpc(RPC_ADMIN_UNFEATURE_GAME_MODE, rpcAdminUnfeatureGameMode);
  initializer.registerRpc(RPC_SUBMIT_FEEDBACK, rpcSubmitFeedback);
  initializer.registerRpc(RPC_ADMIN_LIST_FEEDBACK, rpcAdminListFeedback);
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
  return JSON.stringify(trackPresenceHeartbeat(userId));
}
function rpcPresenceCount(ctx, _logger, _nk, _payload) {
  const userId = getContextUserId2(ctx);
  if (!userId) {
    throw new Error("Authentication required.");
  }
  return JSON.stringify(getOnlinePresenceSnapshot());
}
function rpcAuthLinkCustom(ctx, logger, nk, payload) {
  if (!ctx.userId) {
    throw new Error("Authentication required.");
  }
  const data = parseRpcPayload(payload);
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
  const data = parseRpcPayload(payload);
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
function rpcCreatePrivateMatch(ctx, logger, nk, payload) {
  if (!ctx.userId) {
    throw new Error("Authentication required.");
  }
  requireCompletedUsernameOnboarding(nk, ctx.userId);
  const data = parseRpcPayload(payload);
  const modeId = resolveMatchModeId(data.modeId);
  const matchConfig = resolveMatchConfigForModeId(nk, { privateMatch: true }, modeId);
  if (!matchConfig) {
    throw new Error("Private matches support Race, Finkel Rules, or the current Game Mode of the Month.");
  }
  const reservation = reservePrivateMatchCodeRecord(nk, modeId, ctx.userId);
  const privateCode = reservation.code;
  let matchId;
  try {
    matchId = nk.matchCreate(MATCH_HANDLER, {
      playerIds: [ctx.userId],
      modeId,
      rankedMatch: matchConfig.allowsRankedStats,
      casualMatch: false,
      botMatch: false,
      privateMatch: true,
      privateCode,
      privateCreatorUserId: ctx.userId,
      winRewardSource: "private_pvp_win",
      allowsChallengeRewards: true
    });
  } catch (error) {
    try {
      deletePrivateMatchCodeRecord(nk, privateCode);
    } catch (deleteError) {
      logger.warn(
        "Private code %s reservation cleanup failed after matchCreate error: %s",
        privateCode,
        getErrorMessage6(deleteError)
      );
    }
    throw error;
  }
  try {
    createPrivateMatchCodeRecord(nk, reservation, matchId);
  } catch (error) {
    logger.warn(
      "Private match %s was created for %s but could not publish code %s: %s",
      matchId,
      ctx.userId,
      privateCode,
      getErrorMessage6(error)
    );
    throw new Error("Private table was created but could not be published. Please create a new private table.");
  }
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
  if (!reservation.matchId) {
    throw new Error("Private game is still starting. Try this code again in a moment.");
  }
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
  if (!record.matchId) {
    throw new Error("Private game is still starting. Try this code again in a moment.");
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
function rpcCreateOpenOnlineMatch(ctx, logger, nk, payload) {
  var _a;
  if (!ctx.userId) {
    throw new Error("Authentication required.");
  }
  requireCompletedUsernameOnboarding(nk, ctx.userId);
  const data = parseRpcPayload(payload);
  const wager = normalizeOpenOnlineMatchWager(data.wager);
  const durationMinutes = normalizeOpenOnlineMatchDurationMinutes(data.durationMinutes);
  const modeId = normalizeOpenOnlineMatchModeId(nk, (_a = data.modeId) != null ? _a : data.mode_id);
  const matchConfig = resolveMatchConfigForModeId(
    nk,
    { openOnlineMatchId: "pending" },
    modeId
  );
  if (!matchConfig) {
    throw new Error("Open matches support Race, Finkel Rules, or the current Game Mode of the Month.");
  }
  const openMatchId = generateOpenOnlineMatchId();
  const now = /* @__PURE__ */ new Date();
  const createdAt = now.toISOString();
  const expiresAt = new Date(now.getTime() + durationMinutes * 6e4).toISOString();
  spendOpenOnlineMatchWager(nk, ctx.userId, wager, { openMatchId });
  let matchId;
  try {
    matchId = nk.matchCreate(MATCH_HANDLER, {
      playerIds: [ctx.userId],
      modeId,
      rankedMatch: true,
      casualMatch: false,
      botMatch: false,
      privateMatch: false,
      openOnlineMatchId: openMatchId,
      openOnlineMatchWager: wager,
      openOnlineMatchCreatorUserId: ctx.userId,
      winRewardSource: "pvp_win",
      allowsChallengeRewards: true
    });
  } catch (error) {
    try {
      nk.walletUpdate(
        ctx.userId,
        { [SOFT_CURRENCY_KEY]: wager },
        {
          source: "open_online_match_create_refund",
          currency: SOFT_CURRENCY_KEY,
          amount: wager,
          openMatchId
        },
        true
      );
    } catch (refundError) {
      logger.warn(
        "Failed to refund open online match wager after matchCreate error for %s: %s",
        openMatchId,
        getErrorMessage6(refundError)
      );
    }
    throw error;
  }
  const record = {
    openMatchId,
    matchId,
    modeId,
    creatorUserId: ctx.userId,
    joinedUserId: null,
    wager,
    durationMinutes,
    status: "open",
    creatorEscrowRefunded: false,
    potPaidOut: false,
    createdAt,
    expiresAt,
    updatedAt: createdAt
  };
  try {
    writeOpenOnlineMatchRecord(nk, record, "*");
  } catch (error) {
    try {
      nk.walletUpdate(
        ctx.userId,
        { [SOFT_CURRENCY_KEY]: wager },
        {
          source: "open_online_match_publish_refund",
          currency: SOFT_CURRENCY_KEY,
          amount: wager,
          openMatchId,
          matchId
        },
        true
      );
    } catch (refundError) {
      logger.warn(
        "Failed to refund open online match wager after publish error for %s: %s",
        openMatchId,
        getErrorMessage6(refundError)
      );
    }
    throw new Error("Open match was created but could not be published. Please create a new match.");
  }
  return JSON.stringify({ match: buildOpenOnlineMatchRpcModel(record, ctx.userId) });
}
function rpcListOpenOnlineMatches(ctx, logger, nk, _payload) {
  if (!ctx.userId) {
    throw new Error("Authentication required.");
  }
  requireCompletedUsernameOnboarding(nk, ctx.userId);
  const nowMs = Date.now();
  const matches = listOpenOnlineMatchStorageObjects(logger, nk).map((object) => {
    const record = normalizeOpenOnlineMatchRecord(object.value);
    if (!record) {
      return null;
    }
    return expireOpenOnlineMatchIfNeeded(logger, nk, record, getStorageObjectVersion(object), nowMs);
  }).filter((record) => Boolean(record)).filter((record) => record.status === "open" || record.status === "matched").sort((left, right) => left.createdAt.localeCompare(right.createdAt)).map((record) => buildOpenOnlineMatchRpcModel(record, ctx.userId));
  return JSON.stringify({ matches });
}
function rpcJoinOpenOnlineMatch(ctx, logger, nk, payload) {
  var _a;
  if (!ctx.userId) {
    throw new Error("Authentication required.");
  }
  requireCompletedUsernameOnboarding(nk, ctx.userId);
  const data = parseRpcPayload(payload);
  const openMatchId = readStringField15(data, ["openMatchId", "open_match_id"]);
  if (!openMatchId) {
    throw new Error("Open match id is required.");
  }
  for (let attempt = 0; attempt < OPEN_ONLINE_MATCH_WRITE_ATTEMPTS; attempt += 1) {
    const { object, record } = readOpenOnlineMatchObject(nk, openMatchId);
    if (!record) {
      throw new Error("Open match not found.");
    }
    const currentRecord = expireOpenOnlineMatchIfNeeded(logger, nk, record, getStorageObjectVersion(object));
    if (currentRecord.status !== "open") {
      throw new Error("Open match is no longer available.");
    }
    if (currentRecord.creatorUserId === ctx.userId) {
      throw new Error("You cannot join your own open match.");
    }
    spendOpenOnlineMatchWager(nk, ctx.userId, currentRecord.wager, {
      openMatchId: currentRecord.openMatchId,
      matchId: currentRecord.matchId
    });
    const nextRecord = __spreadProps(__spreadValues({}, currentRecord), {
      joinedUserId: ctx.userId,
      status: "matched",
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    });
    try {
      writeOpenOnlineMatchRecord(nk, nextRecord, (_a = getStorageObjectVersion(object)) != null ? _a : "");
      return JSON.stringify({ match: buildOpenOnlineMatchRpcModel(nextRecord, ctx.userId) });
    } catch (error) {
      try {
        nk.walletUpdate(
          ctx.userId,
          { [SOFT_CURRENCY_KEY]: currentRecord.wager },
          {
            source: "open_online_match_join_refund",
            currency: SOFT_CURRENCY_KEY,
            amount: currentRecord.wager,
            openMatchId: currentRecord.openMatchId,
            matchId: currentRecord.matchId
          },
          true
        );
      } catch (refundError) {
        logger.warn(
          "Failed to refund joiner wager after open match claim conflict for %s: %s",
          currentRecord.openMatchId,
          getErrorMessage6(refundError)
        );
      }
      if (!isOpenOnlineMatchStorageConflict(error)) {
        throw new Error("Unable to join this open match right now.");
      }
    }
  }
  throw new Error("Unable to join this open match right now.");
}
function rpcGetOpenOnlineMatchStatus(ctx, logger, nk, payload) {
  if (!ctx.userId) {
    throw new Error("Authentication required.");
  }
  requireCompletedUsernameOnboarding(nk, ctx.userId);
  const data = parseRpcPayload(payload);
  const openMatchId = readStringField15(data, ["openMatchId", "open_match_id"]);
  if (!openMatchId) {
    throw new Error("Open match id is required.");
  }
  const { object, record } = readOpenOnlineMatchObject(nk, openMatchId);
  if (!record) {
    throw new Error("Open match not found.");
  }
  const nextRecord = expireOpenOnlineMatchIfNeeded(logger, nk, record, getStorageObjectVersion(object));
  if (nextRecord.creatorUserId !== ctx.userId && nextRecord.joinedUserId !== ctx.userId) {
    throw new Error("You do not have access to this open match.");
  }
  return JSON.stringify({ match: buildOpenOnlineMatchRpcModel(nextRecord, ctx.userId) });
}
function rpcGetActiveOpenOnlineMatch(ctx, logger, nk, _payload) {
  var _a;
  if (!ctx.userId) {
    throw new Error("Authentication required.");
  }
  requireCompletedUsernameOnboarding(nk, ctx.userId);
  const nowMs = Date.now();
  const match = (_a = listOpenOnlineMatchStorageObjects(logger, nk).map((object) => {
    const record = normalizeOpenOnlineMatchRecord(object.value);
    if (!record) {
      return null;
    }
    return expireOpenOnlineMatchIfNeeded(logger, nk, record, getStorageObjectVersion(object), nowMs);
  }).filter((record) => Boolean(record)).filter(
    (record) => record.creatorUserId === ctx.userId && (record.status === "open" || record.status === "matched")
  ).sort((left, right) => right.createdAt.localeCompare(left.createdAt))[0]) != null ? _a : null;
  return JSON.stringify({ match: match ? buildOpenOnlineMatchRpcModel(match, ctx.userId) : null });
}
function rpcListSpectatableMatches(ctx, logger, nk, _payload) {
  if (!ctx.userId) {
    throw new Error("Authentication required.");
  }
  requireCompletedUsernameOnboarding(nk, ctx.userId);
  const matchesById = /* @__PURE__ */ new Map();
  listActiveTrackedMatches().filter(
    (match) => !match.classification.private && !match.classification.bot && !match.classification.tournament && match.playerLabels.length >= MAX_PLAYERS
  ).forEach((match) => {
    var _a;
    const matchConfig = resolveMatchConfigForModeId(nk, {}, match.modeId);
    matchesById.set(match.matchId, {
      matchId: match.matchId,
      modeId: match.modeId,
      displayName: (_a = matchConfig == null ? void 0 : matchConfig.displayName) != null ? _a : match.modeId,
      startedAt: match.startedAt,
      playerLabels: match.playerLabels.slice(0, MAX_PLAYERS)
    });
  });
  const nowMs = Date.now();
  listOpenOnlineMatchStorageObjects(logger, nk).map((object) => {
    const record = normalizeOpenOnlineMatchRecord(object.value);
    if (!record) {
      return null;
    }
    return expireOpenOnlineMatchIfNeeded(logger, nk, record, getStorageObjectVersion(object), nowMs);
  }).filter((record) => Boolean(record)).filter((record) => record.status === "matched").forEach((record) => {
    var _a, _b;
    if (matchesById.has(record.matchId)) {
      return;
    }
    const matchConfig = resolveMatchConfigForModeId(nk, { openOnlineMatchId: record.openMatchId }, record.modeId);
    matchesById.set(record.matchId, {
      matchId: record.matchId,
      modeId: record.modeId,
      displayName: (_a = matchConfig == null ? void 0 : matchConfig.displayName) != null ? _a : record.modeId,
      startedAt: record.createdAt,
      playerLabels: [
        resolveAssignedPlayerTitle(nk, record.creatorUserId),
        resolveAssignedPlayerTitle(nk, (_b = record.joinedUserId) != null ? _b : record.creatorUserId)
      ].slice(0, MAX_PLAYERS)
    });
  });
  const matches = Array.from(matchesById.values()).sort(
    (left, right) => {
      var _a, _b;
      return ((_a = right.startedAt) != null ? _a : "").localeCompare((_b = left.startedAt) != null ? _b : "");
    }
  );
  return JSON.stringify({ matches });
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
function matchInit(_ctx, logger, nk, params) {
  var _a;
  const playerIds = Array.isArray(params.playerIds) ? params.playerIds : [];
  const modeId = resolveMatchModeId(params.modeId);
  const matchConfig = resolveMatchConfigForModeId(nk, params, modeId);
  if (!matchConfig) {
    throw new Error(`Unsupported game mode: ${modeId}`);
  }
  const classification = buildMatchClassification(params, matchConfig);
  const privateMatch = classification.private;
  const privateCode = typeof params.privateCode === "string" ? normalizePrivateMatchCodeInput(params.privateCode) : "";
  const privateCreatorUserId = typeof params.privateCreatorUserId === "string" ? params.privateCreatorUserId : null;
  const privateGuestUserId = typeof params.privateGuestUserId === "string" ? params.privateGuestUserId : null;
  const openOnlineMatchId = readStringField15(params, ["openOnlineMatchId", "open_online_match_id"]);
  const openOnlineMatchWager = readNumberField10(params, ["openOnlineMatchWager", "open_online_match_wager"]);
  const openOnlineMatchCreatorUserId = readStringField15(params, [
    "openOnlineMatchCreatorUserId",
    "open_online_match_creator_user_id"
  ]);
  const openOnlineMatchJoinerUserId = readStringField15(params, [
    "openOnlineMatchJoinerUserId",
    "open_online_match_joiner_user_id"
  ]);
  const botUserId = readStringField15(params, ["botUserId", "bot_user_id"]);
  const botDifficultyValue = readStringField15(params, ["botDifficulty", "bot_difficulty"]);
  const botDifficulty = botDifficultyValue && isBotDifficulty(botDifficultyValue) ? botDifficultyValue : DEFAULT_BOT_DIFFICULTY;
  const botDisplayName = (_a = readStringField15(params, ["botDisplayName", "bot_display_name"])) != null ? _a : `${botDifficulty.slice(0, 1).toUpperCase()}${botDifficulty.slice(1)} Bot`;
  const winRewardSource = params.winRewardSource === "private_pvp_win" ? "private_pvp_win" : "pvp_win";
  const allowsChallengeRewards = params.allowsChallengeRewards !== false;
  const tournamentMatchWinXp = resolveConfiguredRewardXp(
    readNumberField10(params, ["tournamentMatchWinXp", "tournament_match_win_xp"])
  );
  const assignments = {};
  if (playerIds[0]) {
    assignments[playerIds[0]] = "light";
  }
  if (playerIds[1]) {
    assignments[playerIds[1]] = "dark";
  }
  const playerTitles = {};
  const playerRankTitles = {};
  playerIds.forEach((userId) => {
    if (typeof userId === "string" && userId.length > 0) {
      playerTitles[userId] = resolveAssignedPlayerTitle(nk, userId);
      playerRankTitles[userId] = resolveAssignedPlayerRankTitle(nk, logger, userId, {
        isBotUser: userId === botUserId
      });
    }
  });
  const botColor = botUserId && assignments[botUserId] ? assignments[botUserId] : botUserId && playerIds[1] === botUserId ? "dark" : botUserId && playerIds[0] === botUserId ? "light" : null;
  const bot = classification.bot && botUserId && botColor ? {
    userId: botUserId,
    color: botColor,
    difficulty: botDifficulty,
    displayName: botDisplayName
  } : null;
  if (bot) {
    playerTitles[bot.userId] = bot.displayName;
    playerRankTitles[bot.userId] = null;
  }
  const state = {
    presences: {},
    spectatorPresences: {},
    assignments,
    playerTitles,
    playerRankTitles,
    bot,
    gameState: createInitialState(matchConfig),
    revision: 0,
    started: false,
    opponentType: bot ? getBotOpponentType(bot.difficulty) : "human",
    modeId,
    classification,
    privateMatch,
    privateCode: isPrivateMatchCode(privateCode) ? privateCode : null,
    privateCreatorUserId,
    privateGuestUserId,
    openOnlineMatchId,
    openOnlineMatchWager: typeof openOnlineMatchWager === "number" && Number.isFinite(openOnlineMatchWager) ? Math.max(0, Math.floor(openOnlineMatchWager)) : null,
    openOnlineMatchCreatorUserId,
    openOnlineMatchJoinerUserId,
    winRewardSource,
    allowsChallengeRewards,
    tournamentContext: resolveTournamentMatchContextFromParams(params),
    tournamentMatchWinXp,
    reactionCounts: createReactionCounts(assignments),
    rollDisplay: createMatchRollDisplayState(),
    telemetry: createMatchTelemetry(),
    timer: createMatchTimerState(),
    matchStartedAtMs: null,
    afk: {
      light: createPlayerAfkState(),
      dark: createPlayerAfkState()
    },
    disconnect: {
      light: createPlayerDisconnectState(),
      dark: createPlayerDisconnectState()
    },
    matchEnd: null,
    rematch: createMatchRematchState(),
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
  if (isSpectatorPresenceRequest(presence)) {
    if (!isSpectatableMatchState(state)) {
      return { state, accept: false, rejectMessage: "This match is not available for spectating." };
    }
    upsertSpectatorPresence(state, presence);
    return { state, accept: true };
  }
  if (state.openOnlineMatchId) {
    syncOpenOnlineMatchReservation(logger, nk, state);
    if (!canUserJoinOpenOnlineMatch(state, userId)) {
      return { state, accept: false, rejectMessage: "Join this open match before entering the table." };
    }
  }
  const hasExistingAssignment = Boolean(state.assignments[userId]);
  if (Object.keys(state.assignments).length >= MAX_PLAYERS && !hasExistingAssignment) {
    return { state, accept: false, rejectMessage: "Match is full." };
  }
  upsertPresence(state, presence);
  ensureAssignment(state, userId);
  return { state, accept: true };
}
function matchJoin(ctx, logger, nk, dispatcher, _tick, state, presences) {
  var _a, _b, _c, _d;
  const nowMs = Date.now();
  let clearedDisconnectGrace = false;
  presences.forEach((presence) => {
    const userId = getPresenceUserId(presence);
    if (!userId) {
      logger.warn("Skipping join presence with missing user ID.");
      return;
    }
    if (isSpectatorPresenceRequest(presence) || isSpectatorPresence(state, presence)) {
      upsertSpectatorPresence(state, presence);
      return;
    }
    const hadPresenceBeforeJoin = getUserPresenceTargets(state, userId).length > 0;
    upsertPresence(state, presence);
    ensureAssignment(state, userId);
    cacheAssignedPlayerTitle(state, nk, userId);
    cacheAssignedPlayerRankTitle(state, nk, logger, userId);
    const didClearDisconnectGrace = clearDisconnectGraceForUser(state, userId);
    clearedDisconnectGrace = didClearDisconnectGrace || clearedDisconnectGrace;
    const playerColor = state.assignments[userId];
    if (state.started && !state.gameState.winner && state.gameState.phase !== "ended" && playerColor && !isConfiguredBotColor(state, playerColor) && (!hadPresenceBeforeJoin || didClearDisconnectGrace)) {
      resetAfkOnMeaningfulAction(state, playerColor, nowMs);
    }
  });
  if (state.started && clearedDisconnectGrace && !hasActiveDisconnectGrace(state)) {
    resumeTurnTimerAfterReconnect(state, nowMs);
  }
  const matchId = getMatchId(ctx);
  const didStartMatch = markMatchStartedIfReady(state, nowMs);
  if (didStartMatch && state.matchStartedAtMs !== null) {
    recordMatchStartAnalyticsEvent(nk, logger, {
      matchId,
      startedAt: new Date(state.matchStartedAtMs).toISOString(),
      modeId: state.modeId,
      classification: {
        ranked: state.classification.ranked,
        casual: state.classification.casual,
        private: state.classification.private,
        bot: state.classification.bot,
        experimental: state.classification.experimental,
        tournament: Boolean(state.tournamentContext)
      },
      tournamentRunId: (_b = (_a = state.tournamentContext) == null ? void 0 : _a.runId) != null ? _b : null,
      tournamentId: (_d = (_c = state.tournamentContext) == null ? void 0 : _c.tournamentId) != null ? _d : null,
      players: buildAnalyticsMatchPlayers(state)
    });
  }
  broadcastSnapshot(dispatcher, state, matchId);
  return { state };
}
function matchLeave(ctx, logger, nk, dispatcher, _tick, state, presences) {
  const nowMs = Date.now();
  let shouldBroadcastSnapshot = false;
  presences.forEach((presence) => {
    const userId = getPresenceUserId(presence);
    if (!userId) {
      logger.warn("Skipping leave presence with missing user ID.");
      return;
    }
    if (removeSpectatorPresence(state, presence)) {
      shouldBroadcastSnapshot = true;
      return;
    }
    removePresence(state, presence);
    shouldBroadcastSnapshot = startDisconnectGraceForUser(state, userId, nowMs) || shouldBroadcastSnapshot;
    shouldBroadcastSnapshot = clearPrivateMatchGuestReservation(nk, state, userId) || shouldBroadcastSnapshot;
  });
  if (shouldBroadcastSnapshot) {
    broadcastSnapshot(dispatcher, state, getMatchId(ctx));
  }
  if (state.gameState.winner && !state.resultRecorded) {
    try {
      finalizeCompletedMatch(logger, nk, dispatcher, state, getMatchId(ctx));
    } catch (error) {
      logMatchLoopError(logger, getMatchId(ctx), state, "leave_result_processing", error);
    }
  }
  if (state.gameState.winner && state.resultRecorded) {
    try {
      syncRematchState(logger, nk, dispatcher, state, getMatchId(ctx), nowMs);
    } catch (error) {
      logMatchLoopError(logger, getMatchId(ctx), state, "leave_rematch_processing", error);
    }
  }
  if (state.gameState.winner && state.resultRecorded) {
    maybeFinalizeRecordedTournamentRun(logger, nk, state, getMatchId(ctx), "leave");
  }
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
  var _a, _b, _c, _d;
  const matchId = getMatchId(ctx);
  const nowMs = Date.now();
  try {
    const didStartMatch = markMatchStartedIfReady(state, nowMs);
    if (didStartMatch && state.matchStartedAtMs !== null) {
      recordMatchStartAnalyticsEvent(nk, logger, {
        matchId,
        startedAt: new Date(state.matchStartedAtMs).toISOString(),
        modeId: state.modeId,
        classification: {
          ranked: state.classification.ranked,
          casual: state.classification.casual,
          private: state.classification.private,
          bot: state.classification.bot,
          experimental: state.classification.experimental,
          tournament: Boolean(state.tournamentContext)
        },
        tournamentRunId: (_b = (_a = state.tournamentContext) == null ? void 0 : _a.runId) != null ? _b : null,
        tournamentId: (_d = (_c = state.tournamentContext) == null ? void 0 : _c.tournamentId) != null ? _d : null,
        players: buildAnalyticsMatchPlayers(state)
      });
    }
    ensureTurnTimerForCurrentState(state, nowMs);
  } catch (error) {
    logMatchLoopError(logger, matchId, state, "timer_sync", error);
    return { state };
  }
  try {
    const expiredDisconnectedColor = getExpiredDisconnectedColor(state, nowMs);
    if (expiredDisconnectedColor) {
      forfeitPlayerForDisconnect(logger, nk, dispatcher, state, matchId, expiredDisconnectedColor);
    }
  } catch (error) {
    logMatchLoopError(logger, matchId, state, "disconnect_processing", error);
    try {
      broadcastSnapshot(dispatcher, state, matchId);
    } catch (snapshotError) {
      logMatchLoopError(logger, matchId, state, "disconnect_recovery_snapshot", snapshotError);
    }
  }
  messages.forEach((message) => {
    try {
      const senderUserId = getSenderUserId(message.sender);
      if (!senderUserId) {
        logger.warn("Ignoring message with missing sender user ID.");
        return;
      }
      if (isSpectatorPresence(state, message.sender) || isSpectatorPresenceRequest(message.sender)) {
        upsertSpectatorPresence(state, message.sender);
        sendPresenceError(
          dispatcher,
          state,
          message.sender,
          "READ_ONLY",
          "Spectators cannot send match commands."
        );
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
      if (hasActiveDisconnectGrace(state) && !state.gameState.winner && state.gameState.phase !== "ended") {
        const reconnectState = getReconnectGraceState(state, Date.now());
        sendError(
          dispatcher,
          state,
          senderUserId,
          "MATCH_NOT_READY",
          reconnectState ? `Waiting for ${reconnectState.playerColor} to reconnect.` : "Waiting for the disconnected player to reconnect."
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
        applyRollRequest(logger, nk, dispatcher, state, senderUserId, senderColor, decodedPayload, matchId);
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
      if (opCode === MatchOpCode.EMOJI_REACTION) {
        if (!isEmojiReactionRequestPayload(decodedPayload)) {
          sendError(dispatcher, state, senderUserId, "INVALID_PAYLOAD", "Emoji reaction payload is invalid.");
          return;
        }
        applyEmojiReactionRequest(dispatcher, state, senderUserId, senderColor, decodedPayload);
        return;
      }
      if (opCode === MatchOpCode.PIECE_SELECTION) {
        if (!isPieceSelectionRequestPayload(decodedPayload)) {
          sendError(dispatcher, state, senderUserId, "INVALID_PAYLOAD", "Piece selection payload is invalid.");
          return;
        }
        applyPieceSelectionRequest(dispatcher, state, senderUserId, senderColor, decodedPayload);
        return;
      }
      if (opCode === MatchOpCode.REMATCH_RESPONSE) {
        if (!isRematchResponsePayload(decodedPayload)) {
          sendError(dispatcher, state, senderUserId, "INVALID_PAYLOAD", "Rematch payload is invalid.");
          return;
        }
        applyRematchResponse(dispatcher, state, senderUserId, decodedPayload, matchId);
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
  if (state.gameState.winner && !state.resultRecorded) {
    try {
      finalizeCompletedMatch(logger, nk, dispatcher, state, matchId);
    } catch (error) {
      logMatchLoopError(logger, matchId, state, "result_processing", error);
    }
  }
  try {
    syncRematchState(logger, nk, dispatcher, state, matchId, Date.now());
  } catch (error) {
    logMatchLoopError(logger, matchId, state, "rematch_processing", error);
    try {
      broadcastSnapshot(dispatcher, state, matchId);
    } catch (snapshotError) {
      logMatchLoopError(logger, matchId, state, "rematch_recovery_snapshot", snapshotError);
    }
  }
  return { state };
}
function matchTerminate(ctx, logger, nk, dispatcher, _tick, state, _graceSeconds) {
  const matchId = getMatchId(ctx);
  if (state.gameState.winner && !state.resultRecorded) {
    try {
      finalizeCompletedMatch(logger, nk, dispatcher, state, matchId);
    } catch (error) {
      logMatchLoopError(logger, matchId, state, "terminate_result_processing", error);
    }
  }
  if (state.gameState.winner && state.resultRecorded) {
    try {
      syncRematchState(logger, nk, dispatcher, state, matchId, Date.now());
    } catch (error) {
      logMatchLoopError(logger, matchId, state, "terminate_rematch_processing", error);
    }
  }
  if (state.gameState.winner && state.resultRecorded) {
    maybeFinalizeRecordedTournamentRun(logger, nk, state, matchId, "terminate");
  }
  unregisterActiveMatch(matchId);
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
    if (typeof state.reactionCounts[userId] !== "number") {
      state.reactionCounts[userId] = 0;
    }
    return;
  }
  const assignedColors = Object.values(state.assignments);
  if (!assignedColors.includes("light")) {
    state.assignments[userId] = "light";
    state.reactionCounts[userId] = 0;
    return;
  }
  if (!assignedColors.includes("dark")) {
    state.assignments[userId] = "dark";
    state.reactionCounts[userId] = 0;
  }
}
function applyRollOutcome(state, playerColor, rollValue) {
  var _a;
  const maxRawThrowFace = ((_a = state.gameState.matchConfig.throwProfile) != null ? _a : "standard") === "standard" ? 4 : 3;
  if (rollValue === maxRawThrowFace) {
    state.telemetry.players[playerColor].maxRollCount += 1;
  }
  const rollingState = __spreadProps(__spreadValues({}, state.gameState), {
    rollValue,
    phase: "moving"
  });
  const validMoves = getValidMoves(rollingState, rollValue);
  state.rollDisplay = {
    value: rollValue,
    label: validMoves.length === 0 && rollValue > 0 ? "No Move" : null
  };
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
  if (targetCoord && isContestedLanding(state.gameState.matchConfig, playerColor, move.toIndex)) {
    state.telemetry.players[playerColor].contestedTilesLandedCount += 1;
  }
  completePlayerTurnTelemetry(state, playerColor, { didCapture, unusableRoll: false });
}
function forfeitPlayerForInactivity(logger, nk, dispatcher, state, matchId, forfeitingColor) {
  const winnerColor = getOtherPlayerColor(forfeitingColor);
  state.afk[forfeitingColor].accumulatedMs = ONLINE_AFK_FORFEIT_MS;
  clearDisconnectGraceForColor(state, "light");
  clearDisconnectGraceForColor(state, "dark");
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
function forfeitPlayerForDisconnect(logger, nk, dispatcher, state, matchId, forfeitingColor) {
  const winnerColor = getOtherPlayerColor(forfeitingColor);
  clearDisconnectGraceForColor(state, "light");
  clearDisconnectGraceForColor(state, "dark");
  state.gameState = __spreadProps(__spreadValues({}, state.gameState), {
    phase: "ended",
    rollValue: null,
    winner: winnerColor,
    history: [...state.gameState.history, `${forfeitingColor} forfeited after disconnecting.`]
  });
  state.matchEnd = buildMatchEndPayload(state, "forfeit_disconnect", winnerColor, forfeitingColor);
  clearTurnTimer(state, "forfeit_disconnect");
  state.revision += 1;
  logger.info(
    "Forfeited %s for disconnect in match %s after missing reconnect deadline (revision %d)",
    forfeitingColor,
    matchId,
    state.revision
  );
  broadcastSnapshot(dispatcher, state, matchId);
  finalizeCompletedMatch(logger, nk, dispatcher, state, matchId);
}
function applyTimedTurnTimeout(logger, nk, dispatcher, state, matchId, nowMs) {
  var _a, _b, _c;
  const activePlayerColor = (_a = state.timer.activePlayerColor) != null ? _a : state.gameState.currentTurn;
  if (!activePlayerColor || state.gameState.winner || state.gameState.phase === "ended") {
    clearTurnTimer(state, "timeout_ignored");
    return;
  }
  if (isConfiguredBotColor(state, activePlayerColor) && state.bot) {
    if (state.gameState.phase === "rolling") {
      const rolledValue = rollAuthoritativeDice(nk, state.gameState.matchConfig);
      const validMoves = applyRollOutcome(state, activePlayerColor, rolledValue);
      if (validMoves.length > 0) {
        const botMove = (_b = getBotMove(state.gameState, rolledValue, state.bot.difficulty)) != null ? _b : validMoves[0];
        broadcastPieceSelection(
          dispatcher,
          state,
          state.bot.userId,
          activePlayerColor,
          botMove.pieceId,
          nowMs
        );
        applyValidatedMove(
          state,
          activePlayerColor,
          botMove
        );
      }
    } else if (state.gameState.phase === "moving" && state.gameState.rollValue !== null) {
      const validMoves = getValidMoves(state.gameState, state.gameState.rollValue);
      if (validMoves.length > 0) {
        const botMove = (_c = getBotMove(state.gameState, state.gameState.rollValue, state.bot.difficulty)) != null ? _c : validMoves[0];
        broadcastPieceSelection(
          dispatcher,
          state,
          state.bot.userId,
          activePlayerColor,
          botMove.pieceId,
          nowMs
        );
        applyValidatedMove(
          state,
          activePlayerColor,
          botMove
        );
      } else {
        state.rollDisplay = {
          value: state.gameState.rollValue,
          label: state.gameState.rollValue > 0 ? "No Move" : null
        };
        state.gameState = __spreadProps(__spreadValues({}, state.gameState), {
          currentTurn: getOtherPlayerColor(activePlayerColor),
          phase: "rolling",
          rollValue: null,
          history: [...state.gameState.history, `${activePlayerColor} had no valid move.`]
        });
        completePlayerTurnTelemetry(state, activePlayerColor, { didCapture: false, unusableRoll: true });
      }
    }
    if (state.gameState.winner) {
      syncCompletedMatchEnd(state);
    } else {
      state.matchEnd = null;
    }
    resetTurnTimerForCurrentState(state, nowMs, "bot_turn_delay");
    state.revision += 1;
    logger.debug("Applied configured bot turn for %s (revision %d)", activePlayerColor, state.revision);
    broadcastSnapshot(dispatcher, state, matchId);
    finalizeCompletedMatch(logger, nk, dispatcher, state, matchId);
    return;
  }
  const accumulatedInactivityMs = recordTimeoutWindow(state, activePlayerColor, nowMs);
  if (accumulatedInactivityMs >= ONLINE_AFK_FORFEIT_MS) {
    forfeitPlayerForInactivity(logger, nk, dispatcher, state, matchId, activePlayerColor);
    return;
  }
  if (state.gameState.phase === "rolling") {
    const validMoves = applyRollOutcome(state, activePlayerColor, rollAuthoritativeDice(nk, state.gameState.matchConfig));
    if (validMoves.length > 0) {
      applyValidatedMove(state, activePlayerColor, validMoves[0]);
    }
  } else if (state.gameState.phase === "moving" && state.gameState.rollValue !== null) {
    const validMoves = getValidMoves(state.gameState, state.gameState.rollValue);
    if (validMoves.length > 0) {
      applyValidatedMove(state, activePlayerColor, validMoves[0]);
    } else {
      state.rollDisplay = {
        value: state.gameState.rollValue,
        label: state.gameState.rollValue > 0 ? "No Move" : null
      };
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
function applyRollRequest(logger, nk, dispatcher, state, userId, playerColor, payload, matchId) {
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
  if (payload.autoTriggered !== true) {
    resetAfkOnMeaningfulAction(state, playerColor, nowMs);
  }
  applyRollOutcome(state, playerColor, rollAuthoritativeDice(nk, state.gameState.matchConfig));
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
  broadcastPieceSelection(dispatcher, state, userId, playerColor, payload.move.pieceId, nowMs);
  applyValidatedMove(state, playerColor, payload.move);
  syncCompletedMatchEnd(state);
  resetTurnTimerForCurrentState(state, nowMs, "player_move");
  state.revision += 1;
  logger.debug("Applied move for %s (revision %d)", userId, state.revision);
  broadcastSnapshot(dispatcher, state, matchId);
  finalizeCompletedMatch(logger, nk, dispatcher, state, matchId);
}
function applyEmojiReactionRequest(dispatcher, state, userId, playerColor, payload) {
  var _a;
  if (!canUseMatchEmojiReactions(state)) {
    sendError(
      dispatcher,
      state,
      userId,
      "INVALID_PAYLOAD",
      "Emoji reactions are only available in online human matches."
    );
    return;
  }
  const currentCount = (_a = state.reactionCounts[userId]) != null ? _a : 0;
  if (currentCount >= MAX_EMOJI_REACTIONS_PER_MATCH) {
    sendError(
      dispatcher,
      state,
      userId,
      "INVALID_PAYLOAD",
      "Reaction limit reached for this match."
    );
    return;
  }
  const nextCount = currentCount + 1;
  state.reactionCounts[userId] = nextCount;
  const targets = getAssignedPlayerTargets(state);
  if (targets.length === 0) {
    return;
  }
  const broadcastPayload = {
    type: "reaction_broadcast",
    emoji: payload.emoji,
    senderUserId: userId,
    senderColor: playerColor,
    remainingForSender: Math.max(0, MAX_EMOJI_REACTIONS_PER_MATCH - nextCount),
    createdAtMs: Date.now()
  };
  dispatcher.broadcastMessage(
    MatchOpCode.REACTION_BROADCAST,
    encodePayload(broadcastPayload),
    targets
  );
}
function applyPieceSelectionRequest(dispatcher, state, userId, playerColor, payload) {
  if (!canUseLivePieceSelectionRequests(state)) {
    return;
  }
  if (!isPrivateMatchReady(state) || state.gameState.winner) {
    return;
  }
  if (state.gameState.currentTurn !== playerColor) {
    return;
  }
  if (payload.pieceId !== null) {
    if (state.gameState.phase !== "moving" || state.gameState.rollValue === null) {
      return;
    }
    const pieceCanMove = getValidMoves(state.gameState, state.gameState.rollValue).some(
      (move) => move.pieceId === payload.pieceId
    );
    if (!pieceCanMove) {
      return;
    }
  }
  broadcastPieceSelection(dispatcher, state, userId, playerColor, payload.pieceId, Date.now());
}
function broadcastPieceSelection(dispatcher, state, userId, playerColor, pieceId, createdAtMs) {
  const targets = getAssignedPlayerTargets(state);
  if (targets.length === 0) {
    return;
  }
  const broadcastPayload = {
    type: "piece_selection_broadcast",
    pieceId,
    senderUserId: userId,
    senderColor: playerColor,
    createdAtMs
  };
  dispatcher.broadcastMessage(
    MatchOpCode.PIECE_SELECTION_BROADCAST,
    encodePayload(broadcastPayload),
    targets
  );
}
function applyRematchResponse(dispatcher, state, userId, payload, matchId) {
  if (state.rematch.status !== "pending") {
    return;
  }
  if (!(userId in state.rematch.decisionsByUserId)) {
    return;
  }
  if (state.rematch.deadlineMs !== null && Date.now() >= state.rematch.deadlineMs) {
    if (expireRematchWindow(state)) {
      broadcastSnapshot(dispatcher, state, matchId);
    }
    return;
  }
  const nextDecision = payload.accepted ? "accepted" : "declined";
  if (state.rematch.decisionsByUserId[userId] === nextDecision) {
    return;
  }
  state.rematch.decisionsByUserId[userId] = nextDecision;
  state.revision += 1;
  broadcastSnapshot(dispatcher, state, matchId);
}
function processCompletedMatchRatings(logger, nk, dispatcher, state, matchId) {
  const winnerColor = state.gameState.winner;
  if (!winnerColor) {
    return null;
  }
  const winnerEntry = Object.entries(state.assignments).find(([, color]) => color === winnerColor);
  const loserEntry = Object.entries(state.assignments).find(([, color]) => color !== winnerColor);
  if (!winnerEntry || !loserEntry) {
    logger.warn("Match %s could not resolve both Elo participants.", matchId);
    return null;
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
      return null;
    }
    const byUserId = ratingResult.record.playerResults.reduce((entries, playerResult) => {
      entries[playerResult.userId] = {
        oldRating: playerResult.oldRating,
        newRating: playerResult.newRating,
        delta: playerResult.delta
      };
      return entries;
    }, {});
    if (ratingResult.duplicate) {
      return {
        byUserId
      };
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
    return {
      byUserId
    };
  } catch (error) {
    logger.error(
      "Failed to process ranked Elo result for match %s: %s",
      matchId,
      error instanceof Error ? error.message : String(error)
    );
    return null;
  }
}
function awardWinnerProgression(logger, nk, dispatcher, state, matchId, analyticsWriteBuffer) {
  const winnerColor = state.gameState.winner;
  if (!winnerColor) {
    return null;
  }
  const winnerEntry = Object.entries(state.assignments).find(([, color]) => color === winnerColor);
  if (!winnerEntry) {
    logger.warn("Match %s ended with winner color %s but no assigned user was found.", matchId, winnerColor);
    return null;
  }
  const [winnerUserId] = winnerEntry;
  if (isTournamentBotUserId(winnerUserId)) {
    logger.info("Skipping progression award for synthetic tournament bot winner %s on match %s.", winnerUserId, matchId);
    return null;
  }
  const configuredTournamentMatchWinXp = state.tournamentContext && typeof state.tournamentMatchWinXp === "number" ? state.tournamentMatchWinXp : null;
  if (configuredTournamentMatchWinXp !== null && configuredTournamentMatchWinXp <= 0) {
    return null;
  }
  try {
    const awardResponse = awardXpForMatchWin(nk, logger, __spreadProps(__spreadValues({
      userId: winnerUserId,
      matchId,
      source: state.winRewardSource
    }, configuredTournamentMatchWinXp !== null ? { awardedXp: configuredTournamentMatchWinXp } : {}), {
      analyticsWriteBuffer
    }));
    awardMatchCompletionSoftCurrency(logger, nk, state, matchId);
    if (awardResponse.duplicate) {
      return awardResponse;
    }
    const winnerPresence = getPrimaryUserPresence(state, winnerUserId);
    if (!winnerPresence) {
      logger.info(
        "Progression updated for winner %s on match %s, but no live presence was available for notification.",
        winnerUserId,
        matchId
      );
      return awardResponse;
    }
    dispatcher.broadcastMessage(
      MatchOpCode.PROGRESSION_AWARD,
      encodePayload(createProgressionAwardNotification(awardResponse)),
      [winnerPresence]
    );
    return awardResponse;
  } catch (error) {
    logger.error(
      "Failed to award progression for winner %s on match %s: %s",
      winnerUserId,
      matchId,
      error instanceof Error ? error.message : String(error)
    );
    return null;
  }
}
function awardMatchCompletionSoftCurrency(logger, nk, state, matchId) {
  var _a, _b, _c, _d, _e;
  if ((_a = state.matchEnd) == null ? void 0 : _a.softCurrencyAwarded) {
    return;
  }
  const winnerUserId = (_c = (_b = state.matchEnd) == null ? void 0 : _b.winnerUserId) != null ? _c : null;
  const loserUserId = (_e = (_d = state.matchEnd) == null ? void 0 : _d.loserUserId) != null ? _e : null;
  const grants = [
    { userId: winnerUserId, amount: 15 },
    { userId: loserUserId, amount: 5 }
  ].filter(
    (grant) => typeof grant.userId === "string" && grant.userId.length > 0 && !isTournamentBotUserId(grant.userId)
  );
  if (grants.length === 0) {
    if (state.matchEnd) {
      state.matchEnd.softCurrencyAwarded = true;
    }
    return;
  }
  try {
    nk.walletsUpdate(
      grants.map((grant) => ({
        userId: grant.userId,
        changeset: {
          [SOFT_CURRENCY_KEY]: grant.amount
        },
        metadata: {
          source: "match_completion",
          matchId,
          amount: grant.amount
        }
      }))
    );
    grants.forEach((grant) => {
      logger.info("Soft currency awarded", { userId: grant.userId, amount: grant.amount, matchId });
    });
    if (state.matchEnd) {
      state.matchEnd.softCurrencyAwarded = true;
    }
  } catch (error) {
    logger.error(
      "Failed to award soft currency for match %s: %s",
      matchId,
      error instanceof Error ? error.message : String(error)
    );
  }
}
function awardOpenOnlineMatchPot(logger, nk, state, matchId) {
  var _a, _b;
  if (!state.openOnlineMatchId || !((_a = state.matchEnd) == null ? void 0 : _a.winnerUserId)) {
    return;
  }
  const { object, record } = readOpenOnlineMatchObject(nk, state.openOnlineMatchId);
  if (!record || record.potPaidOut) {
    return;
  }
  if (record.matchId !== matchId || !record.joinedUserId || record.status === "expired") {
    return;
  }
  const potAmount = record.wager * MAX_PLAYERS;
  try {
    nk.walletUpdate(
      state.matchEnd.winnerUserId,
      { [SOFT_CURRENCY_KEY]: potAmount },
      {
        source: "open_online_match_pot",
        currency: SOFT_CURRENCY_KEY,
        amount: potAmount,
        wager: record.wager,
        openMatchId: record.openMatchId,
        matchId
      },
      true
    );
    writeOpenOnlineMatchRecord(
      nk,
      __spreadProps(__spreadValues({}, record), {
        status: "settled",
        potPaidOut: true,
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      }),
      (_b = getStorageObjectVersion(object)) != null ? _b : void 0
    );
    logger.info("Awarded open online match pot", {
      userId: state.matchEnd.winnerUserId,
      openMatchId: record.openMatchId,
      matchId,
      amount: potAmount
    });
  } catch (error) {
    logger.error(
      "Failed to award open online match pot for match %s: %s",
      matchId,
      getErrorMessage6(error)
    );
  }
}
function processCompletedMatchSummaries(logger, nk, state, matchId) {
  var _a, _b;
  const results = {};
  if (!state.allowsChallengeRewards) {
    return results;
  }
  if (((_a = state.matchEnd) == null ? void 0 : _a.reason) === "forfeit_inactivity" || ((_b = state.matchEnd) == null ? void 0 : _b.reason) === "forfeit_disconnect") {
    logger.info("Skipping challenge completion processing for forfeited match %s.", matchId);
    return results;
  }
  Object.entries(state.assignments).forEach(([playerUserId, playerColor]) => {
    if (isTournamentBotUserId(playerUserId)) {
      return;
    }
    try {
      const summary = buildPlayerMatchSummary(state, matchId, playerUserId, playerColor);
      results[playerUserId] = processCompletedMatch(nk, logger, summary);
    } catch (error) {
      logger.error(
        "Failed to process challenge summary for user %s on match %s: %s",
        playerUserId,
        matchId,
        error instanceof Error ? error.message : String(error)
      );
    }
  });
  return results;
}
var resolveTournamentRewardOutcome = (params) => {
  const terminalOutcome = resolveTerminalTournamentRewardOutcome(params);
  if (terminalOutcome) {
    return terminalOutcome;
  }
  if (params.participantState === "eliminated") {
    return "eliminated";
  }
  return params.didWin ? "advancing" : "eliminated";
};
var resolveTerminalTournamentRewardOutcome = (params) => {
  var _a, _b, _c, _d, _e, _f, _g, _h;
  const {
    participantState,
    didWin,
    playerUserId,
    tournamentProcessingResult
  } = params;
  const finalizationResult = tournamentProcessingResult.finalizationResult;
  const bracket = (_b = (_a = tournamentProcessingResult.updatedRun) == null ? void 0 : _a.bracket) != null ? _b : null;
  const completedRound = (_d = (_c = tournamentProcessingResult.record) == null ? void 0 : _c.summary.round) != null ? _d : null;
  const totalRounds = (_e = bracket == null ? void 0 : bracket.totalRounds) != null ? _e : null;
  const bracketWinnerUserId = (_f = bracket == null ? void 0 : bracket.winnerUserId) != null ? _f : null;
  const bracketRunnerUpUserId = (_g = bracket == null ? void 0 : bracket.runnerUpUserId) != null ? _g : null;
  const bracketFinalized = Boolean(bracket == null ? void 0 : bracket.finalizedAt);
  if (finalizationResult) {
    if (finalizationResult.championUserId === playerUserId) {
      return "champion";
    }
    if (participantState === "champion" || didWin && finalizationResult.run.lifecycle === "finalized") {
      return "champion";
    }
    if (participantState === "runner_up" || !didWin) {
      return "runner_up";
    }
  }
  if (bracketFinalized) {
    if (bracketWinnerUserId === playerUserId) {
      return "champion";
    }
    if (bracketRunnerUpUserId === playerUserId) {
      return "runner_up";
    }
    return didWin ? "champion" : "runner_up";
  }
  if (((_h = tournamentProcessingResult.record) == null ? void 0 : _h.counted) === true && typeof completedRound === "number" && typeof totalRounds === "number" && completedRound === totalRounds) {
    return didWin ? "champion" : "runner_up";
  }
  if (participantState === "champion") {
    return "champion";
  }
  if (participantState === "runner_up") {
    return "runner_up";
  }
  return null;
};
var readTournamentEloRanksByUserId = (logger, nk, playerUserIds) => {
  if (playerUserIds.length === 0) {
    return {};
  }
  try {
    const result = nk.leaderboardRecordsList(
      ELO_LEADERBOARD_ID,
      playerUserIds,
      Math.max(1, playerUserIds.length),
      "",
      0
    );
    const ownerRecords = Array.isArray(result.ownerRecords) ? result.ownerRecords : Array.isArray(result.owner_records) ? result.owner_records : [];
    return ownerRecords.reduce(
      (entries, record) => {
        const ownerId = readStringField15(record, ["ownerId", "owner_id"]);
        if (!ownerId) {
          return entries;
        }
        const rank = readNumberField10(record, ["rank"]);
        entries[ownerId] = typeof rank === "number" ? rank : null;
        return entries;
      },
      {}
    );
  } catch (error) {
    logger.warn(
      "Unable to read Elo leaderboard ranks in batch for tournament summary users %s: %s",
      playerUserIds.join(","),
      error instanceof Error ? error.message : String(error)
    );
    return {};
  }
};
var buildEloProfileFromStorageObject = (userId, fallbackUsernameDisplay, rawValue, rank) => {
  var _a, _b, _c, _d, _e;
  const normalizedFallbackName = fallbackUsernameDisplay.trim().length > 0 ? fallbackUsernameDisplay : userId;
  const usernameDisplay = (_a = readStringField15(rawValue, ["usernameDisplay", "username_display"])) != null ? _a : normalizedFallbackName;
  const eloRating = sanitizeEloRating((_b = readNumberField10(rawValue, ["eloRating", "elo_rating"])) != null ? _b : DEFAULT_ELO_RATING);
  const ratedGames = sanitizeRatedGameCount((_c = readNumberField10(rawValue, ["ratedGames", "rated_games"])) != null ? _c : 0);
  const ratedWins = Math.min(
    ratedGames,
    sanitizeRatedGameCount((_d = readNumberField10(rawValue, ["ratedWins", "rated_wins"])) != null ? _d : 0)
  );
  const ratedLosses = Math.min(
    Math.max(0, ratedGames - ratedWins),
    sanitizeRatedGameCount((_e = readNumberField10(rawValue, ["ratedLosses", "rated_losses"])) != null ? _e : 0)
  );
  return {
    leaderboardId: ELO_LEADERBOARD_ID,
    userId,
    usernameDisplay,
    eloRating,
    ratedGames,
    ratedWins,
    ratedLosses,
    provisional: ratedGames < PROVISIONAL_RATED_GAMES,
    rank,
    lastRatedMatchId: readStringField15(rawValue, ["lastRatedMatchId", "last_rated_match_id"]),
    lastRatedAt: readStringField15(rawValue, ["lastRatedAt", "last_rated_at"])
  };
};
var buildTournamentRewardSummaryReadModelsByUserId = (logger, nk, state) => {
  const playerUserIds = Object.keys(state.assignments);
  if (playerUserIds.length === 0) {
    return {};
  }
  try {
    const storageObjects = nk.storageRead(
      playerUserIds.flatMap((userId) => [
        {
          collection: PROGRESSION_COLLECTION,
          key: PROGRESSION_PROFILE_KEY,
          userId
        },
        {
          collection: USER_CHALLENGE_PROGRESS_COLLECTION2,
          key: USER_CHALLENGE_PROGRESS_KEY2,
          userId
        },
        {
          collection: ELO_PROFILE_COLLECTION2,
          key: ELO_PROFILE_KEY2,
          userId
        }
      ])
    );
    const eloRanksByUserId = readTournamentEloRanksByUserId(logger, nk, playerUserIds);
    return playerUserIds.reduce(
      (entries, userId) => {
        var _a, _b;
        const progressionObject = findStorageObject(
          storageObjects,
          PROGRESSION_COLLECTION,
          PROGRESSION_PROFILE_KEY,
          userId
        );
        const challengeProgressObject = findStorageObject(
          storageObjects,
          USER_CHALLENGE_PROGRESS_COLLECTION2,
          USER_CHALLENGE_PROGRESS_KEY2,
          userId
        );
        const eloProfileObject = findStorageObject(storageObjects, ELO_PROFILE_COLLECTION2, ELO_PROFILE_KEY2, userId);
        if (!progressionObject || !challengeProgressObject || !eloProfileObject) {
          return entries;
        }
        const progressionProfile = normalizeProgressionProfile(getStorageObjectValue(progressionObject));
        const progression = buildProgressionSnapshot(progressionProfile.totalXp);
        const challengeProgress = normalizeChallengeProgressSnapshot(
          getStorageObjectValue(challengeProgressObject),
          progression.totalXp
        );
        entries[userId] = {
          progression,
          challengeProgress,
          eloProfile: buildEloProfileFromStorageObject(
            userId,
            (_a = state.playerTitles[userId]) != null ? _a : userId,
            getStorageObjectValue(eloProfileObject),
            (_b = eloRanksByUserId[userId]) != null ? _b : null
          )
        };
        return entries;
      },
      {}
    );
  } catch (error) {
    logger.warn(
      "Unable to batch load tournament reward summary state for match users %s: %s",
      playerUserIds.join(","),
      error instanceof Error ? error.message : String(error)
    );
    return {};
  }
};
var buildTournamentRewardSummaryPayload = (logger, nk, state, matchId, playerUserId, didWin, context) => {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q;
  if (!state.tournamentContext) {
    return null;
  }
  const participantResolution = context.tournamentProcessingResult.participantResolutions.find(
    (entry) => entry.userId === playerUserId
  );
  const tournamentOutcome = resolveTournamentRewardOutcome({
    participantState: (_a = participantResolution == null ? void 0 : participantResolution.state) != null ? _a : null,
    didWin,
    playerUserId,
    tournamentProcessingResult: context.tournamentProcessingResult
  });
  const shouldEnterWaitingRoom = tournamentOutcome === "advancing" && context.tournamentProcessingResult.finalizationResult === null;
  const challengeResult = (_b = context.challengeProcessingResults[playerUserId]) != null ? _b : null;
  const challengeCompletionCount = (_c = challengeResult == null ? void 0 : challengeResult.completedChallengeIds.length) != null ? _c : 0;
  const challengeXpDelta = (_d = challengeResult == null ? void 0 : challengeResult.awardedXp) != null ? _d : 0;
  const winnerUserId = (_f = (_e = state.matchEnd) == null ? void 0 : _e.winnerUserId) != null ? _f : state.gameState.winner ? getUserIdForColor(state, state.gameState.winner) : null;
  const winnerBaseXpDelta = playerUserId === winnerUserId ? (_h = (_g = context.winnerProgressionAward) == null ? void 0 : _g.awardedXp) != null ? _h : 0 : 0;
  const championXpDelta = ((_i = context.tournamentProcessingResult.finalizationResult) == null ? void 0 : _i.championUserId) === playerUserId ? (_k = (_j = context.tournamentProcessingResult.finalizationResult.championRewardResult) == null ? void 0 : _j.awardedXp) != null ? _k : 0 : 0;
  const rewardSummaryReadModel = (_l = context.rewardSummaryReadModelsByUserId[playerUserId]) != null ? _l : null;
  const progression = (_m = rewardSummaryReadModel == null ? void 0 : rewardSummaryReadModel.progression) != null ? _m : getProgressionForUser(nk, logger, playerUserId);
  const challengeProgress = (_n = rewardSummaryReadModel == null ? void 0 : rewardSummaryReadModel.challengeProgress) != null ? _n : getUserChallengeProgress(nk, logger, playerUserId);
  const totalXpDelta = winnerBaseXpDelta + championXpDelta + challengeXpDelta;
  const totalXpNew = progression.totalXp;
  const totalXpOld = Math.max(0, totalXpNew - totalXpDelta);
  const eloProfile = (_o = rewardSummaryReadModel == null ? void 0 : rewardSummaryReadModel.eloProfile) != null ? _o : getEloRatingProfileForUser(nk, logger, playerUserId);
  const ratingSummary = (_q = (_p = context.ratingProcessingResult) == null ? void 0 : _p.byUserId[playerUserId]) != null ? _q : {
    oldRating: eloProfile.eloRating,
    newRating: eloProfile.eloRating,
    delta: 0
  };
  return {
    type: "tournament_match_reward_summary",
    matchId,
    tournamentRunId: state.tournamentContext.runId,
    tournamentId: state.tournamentContext.tournamentId,
    round: state.tournamentContext.round,
    playerUserId,
    didWin,
    tournamentOutcome,
    eloProfile,
    eloOld: ratingSummary.oldRating,
    eloNew: ratingSummary.newRating,
    eloDelta: ratingSummary.delta,
    totalXpOld,
    totalXpNew,
    totalXpDelta,
    challengeCompletionCount,
    challengeXpDelta,
    shouldEnterWaitingRoom,
    progression,
    challengeProgress
  };
};
function broadcastTournamentMatchRewardSummaries(logger, nk, dispatcher, state, matchId, context) {
  const tournamentProcessingResult = context.tournamentProcessingResult;
  if (!state.tournamentContext || !tournamentProcessingResult) {
    return;
  }
  const rewardSummaryReadModelsByUserId = buildTournamentRewardSummaryReadModelsByUserId(logger, nk, state);
  Object.entries(state.assignments).forEach(([playerUserId, playerColor]) => {
    const targets = getUserPresenceTargets(state, playerUserId);
    if (targets.length === 0) {
      return;
    }
    try {
      const payload = buildTournamentRewardSummaryPayload(
        logger,
        nk,
        state,
        matchId,
        playerUserId,
        state.gameState.winner === playerColor,
        {
          ratingProcessingResult: context.ratingProcessingResult,
          winnerProgressionAward: context.winnerProgressionAward,
          tournamentProcessingResult,
          challengeProcessingResults: context.challengeProcessingResults,
          rewardSummaryReadModelsByUserId
        }
      );
      if (!payload) {
        return;
      }
      dispatcher.broadcastMessage(
        MatchOpCode.TOURNAMENT_REWARD_SUMMARY,
        encodePayload(payload),
        targets
      );
    } catch (error) {
      logger.error(
        "Failed to build tournament reward summary for user %s on match %s: %s",
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
function sendPresenceError(dispatcher, state, presence, code, message) {
  dispatcher.broadcastMessage(
    MatchOpCode.SERVER_ERROR,
    encodePayload({
      type: "server_error",
      code,
      message,
      revision: state.revision
    }),
    [presence]
  );
}
function broadcastSnapshot(dispatcher, state, matchId) {
  var _a, _b, _c, _d;
  const nowMs = Date.now();
  const activeTimedPlayerColor = state.timer.activePlayerColor;
  const reconnectGraceState = getReconnectGraceState(state, nowMs);
  const turnRemainingMs = state.timer.turnDeadlineMs === null ? 0 : Math.max(0, state.timer.turnDeadlineMs - nowMs);
  const snapshotGameState = state.gameState.history.length <= MAX_SNAPSHOT_HISTORY_ENTRIES ? state.gameState : __spreadProps(__spreadValues({}, state.gameState), {
    history: state.gameState.history.slice(-MAX_SNAPSHOT_HISTORY_ENTRIES)
  });
  const payload = {
    type: "state_snapshot",
    matchId,
    revision: state.revision,
    gameState: snapshotGameState,
    historyCount: state.gameState.history.length,
    players: {
      light: buildSnapshotPlayer(state, "light"),
      dark: buildSnapshotPlayer(state, "dark")
    },
    rollDisplayValue: state.rollDisplay.value,
    rollDisplayLabel: state.rollDisplay.label,
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
    afkRemainingMs: activeTimedPlayerColor && !isConfiguredBotColor(state, activeTimedPlayerColor) ? getAfkRemainingMs(state, activeTimedPlayerColor, nowMs) : null,
    reconnectingPlayer: (_a = reconnectGraceState == null ? void 0 : reconnectGraceState.userId) != null ? _a : null,
    reconnectingPlayerColor: (_b = reconnectGraceState == null ? void 0 : reconnectGraceState.playerColor) != null ? _b : null,
    reconnectGraceDurationMs: reconnectGraceState ? ONLINE_DISCONNECT_GRACE_MS : null,
    reconnectDeadlineMs: (_c = reconnectGraceState == null ? void 0 : reconnectGraceState.reconnectDeadlineMs) != null ? _c : null,
    reconnectRemainingMs: (_d = reconnectGraceState == null ? void 0 : reconnectGraceState.reconnectRemainingMs) != null ? _d : null,
    matchEnd: state.matchEnd,
    rematch: buildSnapshotRematch(state)
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
  rpcGetStorefront,
  rpcPurchaseItem,
  rpcGetOwnedCosmetics,
  rpcGetGameModes,
  rpcAdminListGameModes,
  rpcAdminGetGameMode,
  rpcAdminUpsertGameMode,
  rpcAdminDisableGameMode,
  rpcAdminDeleteGameMode,
  rpcAdminEnableGameMode,
  rpcAdminFeatureGameMode,
  rpcAdminUnfeatureGameMode,
  rpcMatchmakerAdd,
  rpcCreatePrivateMatch,
  rpcJoinPrivateMatch,
  rpcGetPrivateMatchStatus,
  rpcListSpectatableMatches,
  rpcCreateOpenOnlineMatch,
  rpcListOpenOnlineMatches,
  rpcJoinOpenOnlineMatch,
  rpcGetOpenOnlineMatchStatus,
  rpcGetActiveOpenOnlineMatch,
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
