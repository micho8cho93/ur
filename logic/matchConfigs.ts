import type { PathVariant } from './pathVariants';
import { getXpAwardAmount, type BotMatchXpSource } from '../shared/progression';

export type RulesVariant = 'standard' | 'capture' | 'no-capture';
export type MatchOpponentType = 'bot' | 'human';
export type MatchModeId =
  | 'standard'
  | 'gameMode_1_piece'
  | 'gameMode_3_pieces'
  | 'gameMode_5_pieces'
  | 'gameMode_finkel_rules'
  | 'gameMode_pvp'
  | 'gameMode_capture'
  | 'gameMode_full_path';

export type MatchConfig = {
  allowsCoins: boolean;
  allowsChallenges: boolean;
  allowsOnline: boolean;
  allowsRankedStats: boolean;
  allowsXp: boolean;
  displayName: string;
  isPracticeMode: boolean;
  modeId: MatchModeId;
  offlineWinRewardSource: BotMatchXpSource;
  opponentType: MatchOpponentType;
  pathVariant: PathVariant;
  pieceCountPerSide: number;
  rulesVariant: RulesVariant;
  rulesIntro?: MatchRulesIntro | null;
  selectionSubtitle?: string;
};

export type MatchModeOption = {
  modeId: MatchModeId;
  label: string;
  description: string;
};

export type PrivateMatchOption = MatchModeOption;

export type MatchRulesIntro = {
  title: string;
  message: string;
};

const STANDARD_MATCH_CONFIG: MatchConfig = {
  modeId: 'standard',
  displayName: 'Quick Play',
  pieceCountPerSide: 7,
  rulesVariant: 'standard',
  allowsXp: true,
  allowsOnline: true,
  allowsChallenges: true,
  allowsCoins: true,
  allowsRankedStats: true,
  offlineWinRewardSource: 'bot_win',
  opponentType: 'bot',
  pathVariant: 'default',
  isPracticeMode: false,
  selectionSubtitle: 'Classic seven-piece rules.',
  rulesIntro: null,
};

const PURE_LUCK_MATCH_CONFIG: MatchConfig = {
  modeId: 'gameMode_1_piece',
  displayName: 'Pure Luck',
  pieceCountPerSide: 3,
  rulesVariant: 'no-capture',
  allowsXp: true,
  allowsOnline: false,
  allowsChallenges: true,
  allowsCoins: false,
  allowsRankedStats: false,
  offlineWinRewardSource: 'practice_1_piece_win',
  opponentType: 'bot',
  pathVariant: 'default',
  isPracticeMode: true,
  selectionSubtitle: 'Three pieces per side with captures disabled everywhere.',
  rulesIntro: {
    title: 'Pure Luck',
    message:
      'This variant keeps the race short and removes every takedown:\n\n• Each side plays with 3 pieces.\n• Captures are disabled everywhere, including the shared lane.\n• Rosettes still grant extra rolls, so momentum matters more than disruption.',
  },
};

const RACE_MATCH_CONFIG: MatchConfig = {
  modeId: 'gameMode_3_pieces',
  displayName: 'Race',
  pieceCountPerSide: 3,
  rulesVariant: 'standard',
  allowsXp: true,
  allowsOnline: false,
  allowsChallenges: true,
  allowsCoins: false,
  allowsRankedStats: false,
  offlineWinRewardSource: 'practice_3_pieces_win',
  opponentType: 'bot',
  pathVariant: 'default',
  isPracticeMode: true,
  selectionSubtitle: 'Three pieces per side with the standard capture rules.',
  rulesIntro: {
    title: 'Race',
    message:
      'This variant trims the match down without changing the usual rules:\n\n• Each side plays with 3 pieces.\n• Standard captures are still allowed, but the shared middle rosette remains protected.\n• First to bear off all 3 pieces wins.',
  },
};

const LEGACY_FIVE_PIECE_MATCH_CONFIG: MatchConfig = {
  modeId: 'gameMode_5_pieces',
  displayName: '5 Pieces',
  pieceCountPerSide: 5,
  rulesVariant: 'standard',
  allowsXp: true,
  allowsOnline: false,
  allowsChallenges: true,
  allowsCoins: false,
  allowsRankedStats: false,
  offlineWinRewardSource: 'practice_5_pieces_win',
  opponentType: 'bot',
  pathVariant: 'default',
  isPracticeMode: true,
  selectionSubtitle: 'Legacy five-piece practice rules.',
  rulesIntro: {
    title: '5 Pieces',
    message:
      'This legacy variant keeps the standard rules with a reduced pool:\n\n• Each side plays with 5 pieces.\n• Standard captures are still allowed, but the shared middle rosette remains protected.\n• First to bear off all 5 pieces wins.',
  },
};

const FINKEL_RULES_MATCH_CONFIG: MatchConfig = {
  modeId: 'gameMode_finkel_rules',
  displayName: 'Finkel Rules',
  pieceCountPerSide: 7,
  rulesVariant: 'standard',
  allowsXp: true,
  allowsOnline: false,
  allowsChallenges: true,
  allowsCoins: false,
  allowsRankedStats: false,
  offlineWinRewardSource: 'practice_finkel_rules_win',
  opponentType: 'bot',
  pathVariant: 'default',
  isPracticeMode: true,
  selectionSubtitle: 'Seven pieces per side using the classic protected-rosette rules.',
  rulesIntro: {
    title: 'Finkel Rules',
    message:
      'This variant keeps the classic full-length duel:\n\n• Each side plays with 7 pieces.\n• Standard captures are allowed, except the shared middle rosette stays protected.\n• Rosettes still grant extra rolls, rewarding precise tempo play.',
  },
};

const LOCAL_PVP_MATCH_CONFIG: MatchConfig = {
  modeId: 'gameMode_pvp',
  displayName: 'PvP',
  pieceCountPerSide: 7,
  rulesVariant: 'standard',
  allowsXp: false,
  allowsOnline: false,
  allowsChallenges: false,
  allowsCoins: false,
  allowsRankedStats: false,
  offlineWinRewardSource: 'practice_finkel_rules_win',
  opponentType: 'human',
  pathVariant: 'default',
  isPracticeMode: true,
  selectionSubtitle: 'Two human players on one device using seven-piece Finkel rules offline.',
  rulesIntro: {
    title: 'PvP',
    message:
      'This local mode uses the classic full-length duel with two human players on one device:\n\n• Each side plays with 7 pieces.\n• Standard captures are allowed, except the shared middle rosette stays protected.\n• Every roll and move is taken by a human locally, with no bot turns and no online connection.',
  },
};

const CAPTURE_MATCH_CONFIG: MatchConfig = {
  modeId: 'gameMode_capture',
  displayName: 'Capture',
  pieceCountPerSide: 5,
  rulesVariant: 'capture',
  allowsXp: true,
  allowsOnline: false,
  allowsChallenges: true,
  allowsCoins: false,
  allowsRankedStats: false,
  offlineWinRewardSource: 'practice_capture_win',
  opponentType: 'bot',
  pathVariant: 'default',
  isPracticeMode: true,
  selectionSubtitle: 'Five pieces per side where captures can chain extra rolls.',
  rulesIntro: {
    title: 'Capture',
    message:
      'This variant is shorter and sharper than standard play:\n\n• Each side plays with 5 pieces.\n• The shared middle rosette is no longer safe, so pieces there can be captured.\n• Any capture gives you an extra roll, which can chain attacks together.',
  },
};

const EXTENDED_PATH_MATCH_CONFIG: MatchConfig = {
  modeId: 'gameMode_full_path',
  displayName: 'Extended Path',
  pieceCountPerSide: 7,
  rulesVariant: 'standard',
  allowsXp: true,
  allowsOnline: false,
  allowsChallenges: true,
  allowsCoins: false,
  allowsRankedStats: false,
  offlineWinRewardSource: 'practice_extended_path_win',
  opponentType: 'bot',
  pathVariant: 'full-path',
  isPracticeMode: true,
  selectionSubtitle: 'Seven pieces each using the longer extended-path route.',
  rulesIntro: {
    title: 'Extended Path',
    message:
      'This variant keeps the usual rules but changes the route:\n\n• Each side still plays with 7 pieces.\n• The path is longer before bearing off, stretching races and recovery windows.\n• Standard captures are allowed, while the shared middle rosette remains protected.',
  },
};

const GAME_MODE_MATCH_CONFIGS: readonly MatchConfig[] = [
  PURE_LUCK_MATCH_CONFIG,
  RACE_MATCH_CONFIG,
  FINKEL_RULES_MATCH_CONFIG,
  LOCAL_PVP_MATCH_CONFIG,
  CAPTURE_MATCH_CONFIG,
  EXTENDED_PATH_MATCH_CONFIG,
] as const;

export const MATCH_CONFIGS: Readonly<Record<MatchModeId, MatchConfig>> = {
  standard: STANDARD_MATCH_CONFIG,
  gameMode_1_piece: PURE_LUCK_MATCH_CONFIG,
  gameMode_3_pieces: RACE_MATCH_CONFIG,
  gameMode_5_pieces: LEGACY_FIVE_PIECE_MATCH_CONFIG,
  gameMode_finkel_rules: FINKEL_RULES_MATCH_CONFIG,
  gameMode_pvp: LOCAL_PVP_MATCH_CONFIG,
  gameMode_capture: CAPTURE_MATCH_CONFIG,
  gameMode_full_path: EXTENDED_PATH_MATCH_CONFIG,
};

export const DEFAULT_MATCH_CONFIG = STANDARD_MATCH_CONFIG;
export const GAME_MODE_CONFIGS = GAME_MODE_MATCH_CONFIGS;
const MATCH_MODE_SELECTION_IDS: readonly MatchModeId[] = [
  'standard',
  'gameMode_1_piece',
  'gameMode_3_pieces',
  'gameMode_finkel_rules',
  'gameMode_pvp',
  'gameMode_capture',
  'gameMode_full_path',
] as const;

export const MATCH_MODE_SELECTION_OPTIONS: ReadonlyArray<MatchModeOption> = MATCH_MODE_SELECTION_IDS.map((modeId) => {
  const config = MATCH_CONFIGS[modeId];

  return {
    modeId,
    label: config.displayName,
    description: config.selectionSubtitle ?? config.displayName,
  };
});

const PRIVATE_MATCH_SELECTION_IDS: readonly MatchModeId[] = [
  'gameMode_1_piece',
  'gameMode_3_pieces',
  'gameMode_finkel_rules',
  'gameMode_capture',
  'gameMode_full_path',
] as const;

export const PRIVATE_MATCH_OPTIONS: ReadonlyArray<PrivateMatchOption> = PRIVATE_MATCH_SELECTION_IDS.map((modeId) => {
  const config = MATCH_CONFIGS[modeId];

  return {
    modeId,
    label: config.displayName,
    description: config.selectionSubtitle ?? config.displayName,
  };
});

export const getPracticeModeRewardLabel = (config: MatchConfig): string | null =>
  config.allowsXp ? `Practice Mode Win Reward: +${getXpAwardAmount(config.offlineWinRewardSource)} XP` : null;

export const GAME_MODE_SCREEN_NOTE =
  'Game Modes stay fully offline. Most variants seat you against a local bot with reduced signed-in XP rewards, while PvP is a same-device two-player ruleset with no bot turns or online rewards.';

export const isMatchModeId = (value: unknown): value is MatchModeId =>
  typeof value === 'string' && value in MATCH_CONFIGS;

export const isGameModeId = (value: unknown): value is Exclude<MatchModeId, 'standard'> =>
  typeof value === 'string' && value !== 'standard' && Boolean(MATCH_CONFIGS[value as MatchModeId]?.isPracticeMode);

export const getMatchConfig = (modeId?: string | null): MatchConfig =>
  (modeId && isMatchModeId(modeId) ? MATCH_CONFIGS[modeId] : DEFAULT_MATCH_CONFIG);

export const getPracticeModeBadgeLabel = (config: MatchConfig): string =>
  config.isPracticeMode ? `Practice Mode · ${config.displayName}` : config.displayName;

export const getPrivateMatchOption = (modeId: MatchModeId): PrivateMatchOption =>
  PRIVATE_MATCH_OPTIONS.find((option) => option.modeId === modeId) ?? {
    modeId,
    label: MATCH_CONFIGS[modeId].displayName,
    description: MATCH_CONFIGS[modeId].selectionSubtitle ?? MATCH_CONFIGS[modeId].displayName,
  };

export const getPrivateMatchLabel = (modeId: MatchModeId): string => getPrivateMatchOption(modeId).label;

export const getMatchRulesIntro = (modeId: MatchModeId): MatchRulesIntro | null =>
  MATCH_CONFIGS[modeId].rulesIntro ?? null;
