import type { MatchConfig, RulesVariant } from '../logic/matchConfigs';

export type GameModeBaseRulesetPreset =
  | 'quick_play'
  | 'race'
  | 'finkel_rules'
  | 'capture'
  | 'custom';

export type GameModeRosetteSafetyMode = 'standard' | 'open';
export type GameModeExitStyle = 'standard' | 'single_exit';
export type GameModeEliminationMode = 'return_to_start' | 'eliminated';
export type GameModeBoardAssetKey = 'board_design' | 'board_single_exit';

export type GameModePresetDefaults = {
  baseRulesetPreset: GameModeBaseRulesetPreset;
  pieceCountPerSide: number;
  rulesVariant: RulesVariant;
  rosetteSafetyMode: GameModeRosetteSafetyMode;
  exitStyle: GameModeExitStyle;
  eliminationMode: GameModeEliminationMode;
  fogOfWar: boolean;
  boardAssetKey: GameModeBoardAssetKey;
};

export type GameModePresetOption = GameModePresetDefaults & {
  id: GameModeBaseRulesetPreset;
  label: string;
  description: string;
};

export interface GameModeDefinition {
  id: string;
  name: string;
  description: string;
  baseRulesetPreset: GameModeBaseRulesetPreset;
  pieceCountPerSide: number;
  rulesVariant: RulesVariant;
  rosetteSafetyMode: GameModeRosetteSafetyMode;
  exitStyle: GameModeExitStyle;
  eliminationMode: GameModeEliminationMode;
  fogOfWar: boolean;
  boardAssetKey: GameModeBoardAssetKey;
}

export interface AdminGameMode extends GameModeDefinition {
  isActive: boolean;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
}

export type AdminGameModeDraft = GameModeDefinition & {
  isActive: boolean;
};

export interface PublicGameModesResponse {
  featuredMode: GameModeDefinition | null;
  activeModes: GameModeDefinition[];
}

export interface AdminGameModesResponse {
  featuredModeId: string | null;
  modes: AdminGameMode[];
}

export interface GameModeMutationResponse {
  success: true;
  mode: AdminGameMode;
}

export interface GameModeToggleResponse {
  success: true;
  modeId: string;
}

export interface GameModeFeatureResponse {
  success: true;
  featuredModeId: string | null;
}

export interface GameModeListItem extends AdminGameMode {}

export const GAME_MODE_PRESET_OPTIONS: readonly GameModePresetOption[] = [
  {
    id: 'quick_play',
    label: 'Quick Play',
    description: 'Seven pieces, standard rules, and the default board.',
    baseRulesetPreset: 'quick_play',
    pieceCountPerSide: 7,
    rulesVariant: 'standard',
    rosetteSafetyMode: 'standard',
    exitStyle: 'standard',
    eliminationMode: 'return_to_start',
    fogOfWar: false,
    boardAssetKey: 'board_design',
  },
  {
    id: 'race',
    label: 'Race',
    description: 'Three pieces, standard captures, and a faster finish.',
    baseRulesetPreset: 'race',
    pieceCountPerSide: 3,
    rulesVariant: 'standard',
    rosetteSafetyMode: 'standard',
    exitStyle: 'standard',
    eliminationMode: 'return_to_start',
    fogOfWar: false,
    boardAssetKey: 'board_design',
  },
  {
    id: 'finkel_rules',
    label: 'Finkel Rules',
    description: 'Seven pieces with the protected shared rosette.',
    baseRulesetPreset: 'finkel_rules',
    pieceCountPerSide: 7,
    rulesVariant: 'standard',
    rosetteSafetyMode: 'standard',
    exitStyle: 'standard',
    eliminationMode: 'return_to_start',
    fogOfWar: false,
    boardAssetKey: 'board_design',
  },
  {
    id: 'capture',
    label: 'Capture',
    description: 'Five pieces and extra rolls after captures.',
    baseRulesetPreset: 'capture',
    pieceCountPerSide: 5,
    rulesVariant: 'capture',
    rosetteSafetyMode: 'open',
    exitStyle: 'standard',
    eliminationMode: 'return_to_start',
    fogOfWar: false,
    boardAssetKey: 'board_design',
  },
  {
    id: 'custom',
    label: 'Custom',
    description: 'A blank slate for operator-built mode variants.',
    baseRulesetPreset: 'custom',
    pieceCountPerSide: 7,
    rulesVariant: 'standard',
    rosetteSafetyMode: 'standard',
    exitStyle: 'standard',
    eliminationMode: 'return_to_start',
    fogOfWar: false,
    boardAssetKey: 'board_design',
  },
] as const;

export const GAME_MODE_PRESET_BY_ID = Object.fromEntries(
  GAME_MODE_PRESET_OPTIONS.map((option) => [option.id, option]),
) as Record<GameModeBaseRulesetPreset, GameModePresetOption>;

export const getGameModePresetDefaults = (
  preset: GameModeBaseRulesetPreset,
): GameModePresetDefaults => {
  const option = GAME_MODE_PRESET_BY_ID[preset] ?? GAME_MODE_PRESET_BY_ID.custom;
  return {
    baseRulesetPreset: option.baseRulesetPreset,
    pieceCountPerSide: option.pieceCountPerSide,
    rulesVariant: option.rulesVariant,
    rosetteSafetyMode: option.rosetteSafetyMode,
    exitStyle: option.exitStyle,
    eliminationMode: option.eliminationMode,
    fogOfWar: option.fogOfWar,
    boardAssetKey: option.boardAssetKey,
  };
};

export const resolveGameModeBaseRulesetLabel = (preset: GameModeBaseRulesetPreset): string =>
  GAME_MODE_PRESET_BY_ID[preset]?.label ?? 'Custom';

export const resolveGameModeBoardLabel = (boardAssetKey: GameModeBoardAssetKey): string =>
  boardAssetKey === 'board_single_exit' ? 'Single Exit Board' : 'Board Design';

export const resolveGameModeRulesLabel = (rulesVariant: RulesVariant): string => {
  switch (rulesVariant) {
    case 'capture':
      return 'Capture rules';
    case 'no-capture':
      return 'No-capture rules';
    default:
      return 'Standard rules';
  }
};

export const resolveGameModeSummary = (mode: Pick<
  GameModeDefinition,
  | 'baseRulesetPreset'
  | 'boardAssetKey'
  | 'eliminationMode'
  | 'exitStyle'
  | 'fogOfWar'
  | 'pieceCountPerSide'
  | 'rulesVariant'
  | 'rosetteSafetyMode'
>): string => {
  const parts = [
    resolveGameModeBaseRulesetLabel(mode.baseRulesetPreset),
    `${mode.pieceCountPerSide} pieces`,
    resolveGameModeRulesLabel(mode.rulesVariant),
    mode.rosetteSafetyMode === 'open' ? 'open rosettes' : 'protected rosettes',
    mode.eliminationMode === 'eliminated' ? 'elimination mode' : 'return to start',
    mode.exitStyle === 'single_exit' ? 'single-exit board' : 'standard exit',
    mode.fogOfWar ? 'fog on' : 'fog off',
    resolveGameModeBoardLabel(mode.boardAssetKey),
  ];

  return parts.join(' · ');
};

export const toGameModeDefinition = (mode: AdminGameMode): GameModeDefinition => ({
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
  boardAssetKey: mode.boardAssetKey,
});

export const buildGameModeMatchConfig = (
  mode: GameModeDefinition,
  options: {
    displayName?: string;
    isPracticeMode?: boolean;
    allowsXp?: boolean;
    allowsChallenges?: boolean;
    allowsCoins?: boolean;
    allowsOnline?: boolean;
    allowsRankedStats?: boolean;
    opponentType?: MatchConfig['opponentType'];
    offlineWinRewardSource?: MatchConfig['offlineWinRewardSource'];
    pathVariant?: MatchConfig['pathVariant'];
  } = {},
): MatchConfig => ({
  modeId: mode.id,
  displayName: options.displayName ?? mode.name,
  baseRulesetPreset: mode.baseRulesetPreset,
  pieceCountPerSide: mode.pieceCountPerSide,
  rulesVariant: mode.rulesVariant,
  rosetteSafetyMode: mode.rosetteSafetyMode,
  exitStyle: mode.exitStyle,
  eliminationMode: mode.eliminationMode,
  fogOfWar: mode.fogOfWar,
  boardAssetKey: mode.boardAssetKey,
  allowsXp: options.allowsXp ?? false,
  allowsChallenges: options.allowsChallenges ?? false,
  allowsOnline: options.allowsOnline ?? false,
  allowsRankedStats: options.allowsRankedStats ?? false,
  allowsCoins: options.allowsCoins ?? false,
  isPracticeMode: options.isPracticeMode ?? true,
  offlineWinRewardSource: options.offlineWinRewardSource ?? 'practice_finkel_rules_win',
  opponentType: options.opponentType ?? 'bot',
  pathVariant: options.pathVariant ?? 'default',
  selectionSubtitle: resolveGameModeSummary(mode),
  rulesIntro: null,
});

export const isGameModeDefinition = (value: unknown): value is GameModeDefinition => {
  const record = typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : null;
  const pieceCountPerSide = record?.pieceCountPerSide;

  return Boolean(
    record &&
      typeof record.id === 'string' &&
      typeof record.name === 'string' &&
      typeof record.description === 'string' &&
      typeof record.baseRulesetPreset === 'string' &&
      typeof pieceCountPerSide === 'number' &&
      Number.isInteger(pieceCountPerSide) &&
      pieceCountPerSide > 0 &&
      typeof record.rulesVariant === 'string' &&
      typeof record.rosetteSafetyMode === 'string' &&
      typeof record.exitStyle === 'string' &&
      typeof record.eliminationMode === 'string' &&
      typeof record.fogOfWar === 'boolean' &&
      typeof record.boardAssetKey === 'string',
  );
};
