import { DEFAULT_MATCH_CONFIG, getMatchConfig, isMatchModeId, type MatchConfig } from '@/logic/matchConfigs';
import { nakamaService } from './nakama';
import {
  buildGameModeMatchConfig,
  isGameModeDefinition,
  type AdminGameMode,
  type GameModeDefinition,
  type AdminGameModesResponse,
  type PublicGameModesResponse,
} from '../shared/gameModes';

const RPC_GET_GAME_MODES = 'get_game_modes';

type RpcRecord = Record<string, unknown>;

const asRecord = (value: unknown): RpcRecord | null =>
  typeof value === 'object' && value !== null ? (value as RpcRecord) : null;

const readStringField = (value: unknown, keys: string[]): string | null => {
  const record = asRecord(value);
  if (!record) {
    return null;
  }

  for (const key of keys) {
    const field = record[key];
    if (typeof field === 'string' && field.trim().length > 0) {
      return field.trim();
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
    if (typeof field === 'number' && Number.isFinite(field)) {
      return field;
    }

    if (typeof field === 'string' && field.trim().length > 0) {
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
    if (typeof field === 'boolean') {
      return field;
    }
  }

  return null;
};

const readArrayField = (value: unknown, keys: string[]): unknown[] => {
  const record = asRecord(value);
  if (!record) {
    return [];
  }

  for (const key of keys) {
    const field = record[key];
    if (Array.isArray(field)) {
      return field;
    }
  }

  return [];
};

const normalizeRpcPayload = (payload: unknown): unknown => {
  if (typeof payload !== 'string') {
    return payload;
  }

  try {
    return JSON.parse(payload);
  } catch {
    return payload;
  }
};

const getAuthenticatedSession = async () => {
  const session = await nakamaService.ensureAuthenticatedDevice();
  if (!session) {
    throw new Error('No active Nakama session. Authenticate before requesting game modes.');
  }

  return session;
};

function normalizeGameMode(value: unknown): GameModeDefinition | null {
  const record = asRecord(value);
  if (!record) {
    return null;
  }

  const gameMode: GameModeDefinition = {
    id: readStringField(record, ['id']) ?? '',
    name: readStringField(record, ['name']) ?? '',
    description: readStringField(record, ['description']) ?? '',
    baseRulesetPreset: readStringField(record, ['baseRulesetPreset', 'base_ruleset_preset']) as GameModeDefinition['baseRulesetPreset'],
    pieceCountPerSide: readNumberField(record, ['pieceCountPerSide', 'piece_count_per_side']) ?? 0,
    rulesVariant: readStringField(record, ['rulesVariant', 'rules_variant']) as GameModeDefinition['rulesVariant'],
    rosetteSafetyMode: readStringField(record, ['rosetteSafetyMode', 'rosette_safety_mode']) as GameModeDefinition['rosetteSafetyMode'],
    exitStyle: readStringField(record, ['exitStyle', 'exit_style']) as GameModeDefinition['exitStyle'],
    eliminationMode: readStringField(record, ['eliminationMode', 'elimination_mode']) as GameModeDefinition['eliminationMode'],
    fogOfWar: readBooleanField(record, ['fogOfWar', 'fog_of_war']) ?? false,
    boardAssetKey: readStringField(record, ['boardAssetKey', 'board_asset_key']) as GameModeDefinition['boardAssetKey'],
  };

  return isGameModeDefinition(gameMode) ? gameMode : null;
}

function normalizeAdminGameMode(value: unknown): AdminGameMode | null {
  const mode = normalizeGameMode(value);
  const record = asRecord(value);

  if (!mode || !record) {
    return null;
  }

  const isActive = readBooleanField(record, ['isActive', 'is_active']);
  const featured = readBooleanField(record, ['featured']);
  const createdAt = readStringField(record, ['createdAt', 'created_at']);
  const updatedAt = readStringField(record, ['updatedAt', 'updated_at']);

  if (typeof isActive !== 'boolean' || typeof featured !== 'boolean' || !createdAt || !updatedAt) {
    return null;
  }

  return {
    ...mode,
    isActive,
    featured,
    createdAt,
    updatedAt,
  };
}

function normalizePublicGameModes(value: unknown): PublicGameModesResponse {
  const record = asRecord(value);
  const featuredMode = normalizeGameMode(record?.featuredMode);

  return {
    featuredMode,
    activeModes: readArrayField(record, ['activeModes'])
      .map(normalizeGameMode)
      .filter((mode): mode is GameModeDefinition => Boolean(mode)),
  };
}

function normalizeAdminGameModes(value: unknown): AdminGameModesResponse {
  const record = asRecord(value);

  return {
    featuredModeId: readStringField(record, ['featuredModeId', 'featured_mode_id']),
    modes: readArrayField(record, ['modes'])
      .map(normalizeAdminGameMode)
      .filter((mode): mode is AdminGameMode => Boolean(mode)),
  };
}

export async function getPublicGameModes(): Promise<PublicGameModesResponse> {
  const session = await getAuthenticatedSession();
  const response = await nakamaService.getClient().rpc(session, RPC_GET_GAME_MODES, {});
  return normalizePublicGameModes(normalizeRpcPayload(response.payload));
}

export const getPublicGameModesForAuthenticatedSession = getPublicGameModes;

export async function getAdminGameModes() {
  const session = await getAuthenticatedSession();
  const response = await nakamaService.getClient().rpc(session, 'admin_list_game_modes', {});
  return normalizeAdminGameModes(normalizeRpcPayload(response.payload));
}

export async function getCustomGameModeDefinition(modeId: string): Promise<GameModeDefinition | null> {
  const { featuredMode, activeModes } = await getPublicGameModes();
  return [featuredMode, ...activeModes].find((mode) => mode?.id === modeId) ?? null;
}

export async function resolveGameModeMatchConfig(
  modeId?: string | null,
  options?: Parameters<typeof buildGameModeMatchConfig>[1],
): Promise<MatchConfig> {
  if (!modeId) {
    return DEFAULT_MATCH_CONFIG;
  }

  if (isMatchModeId(modeId)) {
    return getMatchConfig(modeId);
  }

  const customMode = await getCustomGameModeDefinition(modeId);
  return customMode ? buildGameModeMatchConfig(customMode, options) : DEFAULT_MATCH_CONFIG;
}
