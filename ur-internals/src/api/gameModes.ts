import { callRpc } from './client'
import { asRecord, readArrayField, readBooleanField, readNumberField, readStringField } from './runtime'
import type {
  AdminGameMode,
  AdminGameModeDraft,
  AdminGameModesResponse,
  GameModeDefinition,
  GameModeFeatureResponse,
  GameModeMutationResponse,
  GameModeToggleResponse,
  PublicGameModesResponse,
} from '../types/gameModes'

const RPC_GET_GAME_MODES = 'get_game_modes'
const RPC_ADMIN_LIST_GAME_MODES = 'admin_list_game_modes'
const RPC_ADMIN_GET_GAME_MODE = 'admin_get_game_mode'
const RPC_ADMIN_UPSERT_GAME_MODE = 'admin_upsert_game_mode'
const RPC_ADMIN_DISABLE_GAME_MODE = 'admin_disable_game_mode'
const RPC_ADMIN_ENABLE_GAME_MODE = 'admin_enable_game_mode'
const RPC_ADMIN_FEATURE_GAME_MODE = 'admin_feature_game_mode'
const RPC_ADMIN_UNFEATURE_GAME_MODE = 'admin_unfeature_game_mode'

function normalizeGameMode(value: unknown): GameModeDefinition | null {
  const record = asRecord(value)
  if (!record) {
    return null
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
  }

  return gameMode.id && gameMode.name && gameMode.description ? gameMode : null
}

function normalizeAdminGameMode(value: unknown): AdminGameMode | null {
  const mode = normalizeGameMode(value)
  const record = asRecord(value)
  if (!mode || !record) {
    return null
  }

  const isActive = readBooleanField(record, ['isActive', 'is_active'])
  const featured = readBooleanField(record, ['featured'])
  const createdAt = readStringField(record, ['createdAt', 'created_at'])
  const updatedAt = readStringField(record, ['updatedAt', 'updated_at'])

  if (typeof isActive !== 'boolean' || typeof featured !== 'boolean' || !createdAt || !updatedAt) {
    return null
  }

  return {
    ...mode,
    isActive,
    featured,
    createdAt,
    updatedAt,
  }
}

function normalizePublicGameModes(value: unknown): PublicGameModesResponse {
  const record = asRecord(value)

  return {
    featuredMode: normalizeGameMode(record?.featuredMode),
    activeModes: readArrayField(record, ['activeModes'])
      .map(normalizeGameMode)
      .filter((mode): mode is GameModeDefinition => Boolean(mode)),
  }
}

function normalizeAdminGameModes(value: unknown): AdminGameModesResponse {
  const record = asRecord(value)
  return {
    featuredModeId: readStringField(record, ['featuredModeId', 'featured_mode_id']),
    modes: readArrayField(record, ['modes'])
      .map(normalizeAdminGameMode)
      .filter((mode): mode is AdminGameMode => Boolean(mode)),
  }
}

function normalizeMutation(value: unknown): GameModeMutationResponse {
  const mode = normalizeAdminGameMode(asRecord(value)?.mode ?? value)
  if (!mode) {
    throw new Error('Game mode mutation returned an invalid payload.')
  }

  return {
    success: true,
    mode,
  }
}

function normalizeToggle(value: unknown): GameModeToggleResponse {
  const record = asRecord(value)
  const modeId = readStringField(record, ['modeId', 'mode_id'])
  if (!modeId) {
    throw new Error('Game mode toggle returned an invalid payload.')
  }

  return {
    success: true,
    modeId,
  }
}

function normalizeFeature(value: unknown): GameModeFeatureResponse {
  const record = asRecord(value)
  const featuredModeId = readStringField(record, ['featuredModeId', 'featured_mode_id'])

  return {
    success: true,
    featuredModeId,
  }
}

export async function getPublicGameModes(): Promise<PublicGameModesResponse> {
  return normalizePublicGameModes(await callRpc<unknown>(RPC_GET_GAME_MODES))
}

export async function getAdminGameModes(): Promise<AdminGameModesResponse> {
  return normalizeAdminGameModes(await callRpc<unknown>(RPC_ADMIN_LIST_GAME_MODES))
}

export async function getAdminGameMode(modeId: string): Promise<AdminGameMode> {
  return normalizeMutation(await callRpc<unknown>(RPC_ADMIN_GET_GAME_MODE, { modeId })).mode
}

export async function upsertGameMode(mode: AdminGameModeDraft): Promise<AdminGameMode> {
  return normalizeMutation(await callRpc<unknown>(RPC_ADMIN_UPSERT_GAME_MODE, { mode })).mode
}

export async function disableGameMode(modeId: string): Promise<GameModeToggleResponse> {
  return normalizeToggle(await callRpc<unknown>(RPC_ADMIN_DISABLE_GAME_MODE, { modeId }))
}

export async function enableGameMode(modeId: string): Promise<GameModeToggleResponse> {
  return normalizeToggle(await callRpc<unknown>(RPC_ADMIN_ENABLE_GAME_MODE, { modeId }))
}

export async function featureGameMode(modeId: string): Promise<GameModeFeatureResponse> {
  return normalizeFeature(await callRpc<unknown>(RPC_ADMIN_FEATURE_GAME_MODE, { modeId }))
}

export async function unfeatureGameMode(modeId: string): Promise<GameModeFeatureResponse> {
  return normalizeFeature(await callRpc<unknown>(RPC_ADMIN_UNFEATURE_GAME_MODE, { modeId }))
}
