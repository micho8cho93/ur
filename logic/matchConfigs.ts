import type { PathVariant } from './pathVariants';
import { getXpAwardAmount, type BotMatchXpSource } from '../shared/progression';

export type RulesVariant = 'standard';
export type MatchOpponentType = 'bot';
export type MatchModeId =
  | 'standard'
  | 'gameMode_1_piece'
  | 'gameMode_3_pieces'
  | 'gameMode_5_pieces'
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
  selectionSubtitle?: string;
};

export type PrivateMatchOption = {
  modeId: MatchModeId;
  label: string;
  description: string;
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
};

const GAME_MODE_MATCH_CONFIGS: readonly MatchConfig[] = [
  {
    modeId: 'gameMode_1_piece',
    displayName: '1 Piece',
    pieceCountPerSide: 1,
    rulesVariant: 'standard',
    allowsXp: true,
    allowsOnline: false,
    allowsChallenges: false,
    allowsCoins: false,
    allowsRankedStats: false,
    offlineWinRewardSource: 'practice_1_piece_win',
    opponentType: 'bot',
    pathVariant: 'default',
    isPracticeMode: true,
    selectionSubtitle: 'Bot match with 1 piece each',
  },
  {
    modeId: 'gameMode_3_pieces',
    displayName: '3 Pieces',
    pieceCountPerSide: 3,
    rulesVariant: 'standard',
    allowsXp: true,
    allowsOnline: false,
    allowsChallenges: false,
    allowsCoins: false,
    allowsRankedStats: false,
    offlineWinRewardSource: 'practice_3_pieces_win',
    opponentType: 'bot',
    pathVariant: 'default',
    isPracticeMode: true,
    selectionSubtitle: 'Bot match with 3 pieces each',
  },
  {
    modeId: 'gameMode_5_pieces',
    displayName: '5 Pieces',
    pieceCountPerSide: 5,
    rulesVariant: 'standard',
    allowsXp: true,
    allowsOnline: false,
    allowsChallenges: false,
    allowsCoins: false,
    allowsRankedStats: false,
    offlineWinRewardSource: 'practice_5_pieces_win',
    opponentType: 'bot',
    pathVariant: 'default',
    isPracticeMode: true,
    selectionSubtitle: 'Bot match with 5 pieces each',
  },
  {
    modeId: 'gameMode_full_path',
    displayName: 'Extended Path',
    pieceCountPerSide: 7,
    rulesVariant: 'standard',
    allowsXp: true,
    allowsOnline: false,
    allowsChallenges: false,
    allowsCoins: false,
    allowsRankedStats: false,
    offlineWinRewardSource: 'practice_extended_path_win',
    opponentType: 'bot',
    pathVariant: 'full-path',
    isPracticeMode: true,
    selectionSubtitle: 'Bot match with 7 pieces each using the extended-path rules',
  },
] as const;

export const MATCH_CONFIGS: Readonly<Record<MatchModeId, MatchConfig>> = {
  standard: STANDARD_MATCH_CONFIG,
  gameMode_1_piece: GAME_MODE_MATCH_CONFIGS[0],
  gameMode_3_pieces: GAME_MODE_MATCH_CONFIGS[1],
  gameMode_5_pieces: GAME_MODE_MATCH_CONFIGS[2],
  gameMode_full_path: GAME_MODE_MATCH_CONFIGS[3],
};

export const DEFAULT_MATCH_CONFIG = STANDARD_MATCH_CONFIG;
export const GAME_MODE_CONFIGS = GAME_MODE_MATCH_CONFIGS;
export const PRIVATE_MATCH_OPTIONS: readonly PrivateMatchOption[] = [
  {
    modeId: 'gameMode_1_piece',
    label: '1 Piece',
    description: 'One piece per side for a fast duel.',
  },
  {
    modeId: 'gameMode_3_pieces',
    label: '3 Pieces',
    description: 'Three pieces per side for a brisk match.',
  },
  {
    modeId: 'gameMode_5_pieces',
    label: '5 Pieces',
    description: 'Five pieces per side for a shorter board battle.',
  },
  {
    modeId: 'standard',
    label: '7 Pieces',
    description: 'Standard private match rules.',
  },
  {
    modeId: 'gameMode_full_path',
    label: 'Extended Play',
    description: 'Seven pieces with the extended-path rules.',
  },
] as const;
export const getPracticeModeRewardLabel = (config: MatchConfig): string =>
  `Practice Mode Win Reward: +${getXpAwardAmount(config.offlineWinRewardSource)} XP`;

export const GAME_MODE_SCREEN_NOTE =
  'Game Modes are offline bot matches with reduced XP rewards when signed in. No challenge rewards or online play.';

export const isMatchModeId = (value: unknown): value is MatchModeId =>
  typeof value === 'string' && value in MATCH_CONFIGS;

export const isGameModeId = (value: unknown): value is Exclude<MatchModeId, 'standard'> =>
  typeof value === 'string' && GAME_MODE_MATCH_CONFIGS.some((config) => config.modeId === value);

export const getMatchConfig = (modeId?: string | null): MatchConfig =>
  (modeId && isMatchModeId(modeId) ? MATCH_CONFIGS[modeId] : DEFAULT_MATCH_CONFIG);

export const getPracticeModeBadgeLabel = (config: MatchConfig): string =>
  config.isPracticeMode ? `Practice Mode · ${config.displayName}` : config.displayName;

export const getPrivateMatchOption = (modeId: MatchModeId): PrivateMatchOption =>
  PRIVATE_MATCH_OPTIONS.find((option) => option.modeId === modeId) ??
  PRIVATE_MATCH_OPTIONS.find((option) => option.modeId === 'standard')!;

export const getPrivateMatchLabel = (modeId: MatchModeId): string => getPrivateMatchOption(modeId).label;
