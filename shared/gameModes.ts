import type { MatchConfig, RulesVariant } from '../logic/matchConfigs';
import type { PathVariant } from '../logic/pathVariants';

export type GameModeBaseRulesetPreset =
  // Compatibility-only aliases for older stored configs and legacy match modes.
  | 'quick_play'
  | 'race'
  | 'capture'
  | 'finkel_rules'
  | 'hjr_murray'
  | 'rc_bell'
  | 'masters'
  | 'skiryuk'
  | 'custom';

export type GameModeLegacyBaseRulesetPreset =
  | 'quick_play'
  | 'race'
  | 'capture';

export type GameModeThrowProfile = 'standard' | 'bell' | 'masters';

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
  pathVariant: PathVariant;
  throwProfile: GameModeThrowProfile;
  bonusTurnOnRosette: boolean;
  bonusTurnOnCapture: boolean;
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

export interface GameModeDeleteResponse {
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
    id: 'finkel_rules',
    label: 'Finkel',
    description: 'Seven pieces on the classic protected-rosette route.',
    baseRulesetPreset: 'finkel_rules',
    pieceCountPerSide: 7,
    rulesVariant: 'standard',
    rosetteSafetyMode: 'standard',
    exitStyle: 'standard',
    eliminationMode: 'return_to_start',
    fogOfWar: false,
    boardAssetKey: 'board_design',
    pathVariant: 'default',
    throwProfile: 'standard',
    bonusTurnOnRosette: true,
    bonusTurnOnCapture: false,
  },
  {
    id: 'hjr_murray',
    label: 'HJR Murray',
    description: 'Seven pieces on the longer looped reconstruction.',
    baseRulesetPreset: 'hjr_murray',
    pieceCountPerSide: 7,
    rulesVariant: 'standard',
    rosetteSafetyMode: 'standard',
    exitStyle: 'standard',
    eliminationMode: 'return_to_start',
    fogOfWar: false,
    boardAssetKey: 'board_design',
    pathVariant: 'murray',
    throwProfile: 'standard',
    bonusTurnOnRosette: true,
    bonusTurnOnCapture: false,
  },
  {
    id: 'rc_bell',
    label: 'RC Bell',
    description: 'Seven pieces with Bell throws and rosette fines.',
    baseRulesetPreset: 'rc_bell',
    pieceCountPerSide: 7,
    rulesVariant: 'standard',
    rosetteSafetyMode: 'open',
    exitStyle: 'standard',
    eliminationMode: 'return_to_start',
    fogOfWar: false,
    boardAssetKey: 'board_design',
    pathVariant: 'default',
    throwProfile: 'bell',
    bonusTurnOnRosette: false,
    bonusTurnOnCapture: false,
  },
  {
    id: 'masters',
    label: 'Masters',
    description: 'Seven pieces on the compromise looped route.',
    baseRulesetPreset: 'masters',
    pieceCountPerSide: 7,
    rulesVariant: 'standard',
    rosetteSafetyMode: 'standard',
    exitStyle: 'standard',
    eliminationMode: 'return_to_start',
    fogOfWar: false,
    boardAssetKey: 'board_design',
    pathVariant: 'masters',
    throwProfile: 'masters',
    bonusTurnOnRosette: true,
    bonusTurnOnCapture: false,
  },
  {
    id: 'skiryuk',
    label: 'Skiryuk',
    description: 'Seven pieces on the alternate middle-left exit route.',
    baseRulesetPreset: 'skiryuk',
    pieceCountPerSide: 7,
    rulesVariant: 'standard',
    rosetteSafetyMode: 'standard',
    exitStyle: 'standard',
    eliminationMode: 'return_to_start',
    fogOfWar: false,
    boardAssetKey: 'board_design',
    pathVariant: 'skiryuk',
    throwProfile: 'standard',
    bonusTurnOnRosette: true,
    bonusTurnOnCapture: false,
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
    pathVariant: 'default',
    throwProfile: 'standard',
    bonusTurnOnRosette: true,
    bonusTurnOnCapture: false,
  },
] as const;

export const GAME_MODE_PRESET_BY_ID = Object.fromEntries(
  GAME_MODE_PRESET_OPTIONS.map((option) => [option.id, option]),
) as Record<GameModeBaseRulesetPreset, GameModePresetOption>;

const LEGACY_GAME_MODE_PRESET_IDS: readonly GameModeLegacyBaseRulesetPreset[] = [
  'quick_play',
  'race',
  'capture',
] as const;

const LEGACY_GAME_MODE_PRESET_IDS_SET = new Set<string>(LEGACY_GAME_MODE_PRESET_IDS);

const GAME_MODE_BASE_RULESET_PRESET_SET = new Set<string>([
  ...GAME_MODE_PRESET_OPTIONS.map((option) => option.id),
  ...LEGACY_GAME_MODE_PRESET_IDS,
]);
const GAME_MODE_RULE_VARIANT_SET = new Set<RulesVariant>(['standard', 'capture', 'no-capture']);
const GAME_MODE_ROSETTE_SAFETY_MODE_SET = new Set<GameModeRosetteSafetyMode>(['standard', 'open']);
const GAME_MODE_EXIT_STYLE_SET = new Set<GameModeExitStyle>(['standard', 'single_exit']);
const GAME_MODE_ELIMINATION_MODE_SET = new Set<GameModeEliminationMode>(['return_to_start', 'eliminated']);
const GAME_MODE_BOARD_ASSET_KEY_SET = new Set<GameModeBoardAssetKey>(['board_design', 'board_single_exit']);

export const normalizeGameModeBaseRulesetPreset = (
  preset: string | null | undefined,
): GameModeBaseRulesetPreset => {
  if (preset && preset in GAME_MODE_PRESET_BY_ID) {
    return preset as GameModeBaseRulesetPreset;
  }

  return 'custom';
};

export const isLegacyGameModeBaseRulesetPreset = (
  preset: string | null | undefined,
): preset is GameModeLegacyBaseRulesetPreset => Boolean(preset && LEGACY_GAME_MODE_PRESET_IDS_SET.has(preset));

export const getGameModePresetDefaults = (
  preset: string | null | undefined,
): GameModePresetDefaults => {
  const normalizedPreset = normalizeGameModeBaseRulesetPreset(preset);
  const option = GAME_MODE_PRESET_BY_ID[normalizedPreset] ?? GAME_MODE_PRESET_BY_ID.custom;
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
    bonusTurnOnCapture: option.bonusTurnOnCapture,
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
    throwProfile?: MatchConfig['throwProfile'];
    bonusTurnOnRosette?: MatchConfig['bonusTurnOnRosette'];
    bonusTurnOnCapture?: MatchConfig['bonusTurnOnCapture'];
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
  pathVariant: options.pathVariant ?? getGameModePresetDefaults(mode.baseRulesetPreset).pathVariant,
  throwProfile: options.throwProfile ?? getGameModePresetDefaults(mode.baseRulesetPreset).throwProfile,
  bonusTurnOnRosette:
    options.bonusTurnOnRosette ?? getGameModePresetDefaults(mode.baseRulesetPreset).bonusTurnOnRosette,
  bonusTurnOnCapture:
    options.bonusTurnOnCapture ?? getGameModePresetDefaults(mode.baseRulesetPreset).bonusTurnOnCapture,
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
      GAME_MODE_BASE_RULESET_PRESET_SET.has(record.baseRulesetPreset) &&
      typeof pieceCountPerSide === 'number' &&
      Number.isInteger(pieceCountPerSide) &&
      pieceCountPerSide > 0 &&
      typeof record.rulesVariant === 'string' &&
      GAME_MODE_RULE_VARIANT_SET.has(record.rulesVariant as RulesVariant) &&
      typeof record.rosetteSafetyMode === 'string' &&
      GAME_MODE_ROSETTE_SAFETY_MODE_SET.has(record.rosetteSafetyMode as GameModeRosetteSafetyMode) &&
      typeof record.exitStyle === 'string' &&
      GAME_MODE_EXIT_STYLE_SET.has(record.exitStyle as GameModeExitStyle) &&
      typeof record.eliminationMode === 'string' &&
      GAME_MODE_ELIMINATION_MODE_SET.has(record.eliminationMode as GameModeEliminationMode) &&
      typeof record.fogOfWar === 'boolean' &&
      typeof record.boardAssetKey === 'string' &&
      GAME_MODE_BOARD_ASSET_KEY_SET.has(record.boardAssetKey as GameModeBoardAssetKey),
  );
};
