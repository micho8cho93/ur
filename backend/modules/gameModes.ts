import {
  GLOBAL_STORAGE_USER_ID,
  MAX_WRITE_ATTEMPTS,
  STORAGE_PERMISSION_NONE,
  asRecord,
  findStorageObject,
  getErrorMessage,
  getStorageObjectValue,
  getStorageObjectVersion,
  maybeSetStorageVersion,
} from './progression';
import { assertAdmin } from './tournaments/auth';
import type { AdminRole } from './tournaments/types';
import { isMatchModeId } from '../../logic/matchConfigs';
import {
  GAME_MODE_PRESET_BY_ID,
  isLegacyGameModeBaseRulesetPreset,
  normalizeGameModeBaseRulesetPreset,
  type AdminGameMode,
  type AdminGameModeDraft,
  type AdminGameModesResponse,
  type GameModeBoardAssetKey,
  type GameModeDeleteResponse,
  type GameModeFeatureResponse,
  type GameModeMutationResponse,
  type GameModeToggleResponse,
  type PublicGameModesResponse,
  toGameModeDefinition,
  isGameModeDefinition,
} from '../../shared/gameModes';

type RuntimeContext = any;
type RuntimeLogger = any;
type RuntimeNakama = any;
type RuntimeRecord = Record<string, unknown>;
type RuntimeStorageObject = RuntimeRecord & {
  value?: unknown;
  version?: string;
};

type GameModeCatalogRecord = {
  modes: AdminGameMode[];
  featuredModeId: string | null;
  updatedAt: string;
};

const GAME_MODE_COLLECTION = 'game_modes';
const GAME_MODE_KEY = 'catalog';

export const RPC_GET_GAME_MODES = 'get_game_modes';
export const RPC_ADMIN_LIST_GAME_MODES = 'admin_list_game_modes';
export const RPC_ADMIN_GET_GAME_MODE = 'admin_get_game_mode';
export const RPC_ADMIN_UPSERT_GAME_MODE = 'admin_upsert_game_mode';
export const RPC_ADMIN_DISABLE_GAME_MODE = 'admin_disable_game_mode';
export const RPC_ADMIN_ENABLE_GAME_MODE = 'admin_enable_game_mode';
export const RPC_ADMIN_DELETE_GAME_MODE = 'admin_delete_game_mode';
export const RPC_ADMIN_FEATURE_GAME_MODE = 'admin_feature_game_mode';
export const RPC_ADMIN_UNFEATURE_GAME_MODE = 'admin_unfeature_game_mode';

const VALID_BOARD_ASSET_KEYS: readonly GameModeBoardAssetKey[] = ['board_design', 'board_single_exit'];

const isVersionConflict = (error: unknown): boolean => {
  const message = getErrorMessage(error).toLowerCase();
  return (
    message.includes('version check') ||
    message.includes('version conflict') ||
    message.includes('version mismatch') ||
    message.includes('storage write rejected')
  );
};

const parseJsonPayload = (payload: string): RuntimeRecord => {
  let parsed: unknown;
  try {
    parsed = payload ? JSON.parse(payload) : {};
  } catch {
    throw new Error('INVALID_PAYLOAD');
  }

  const record = asRecord(parsed);
  if (!record) {
    throw new Error('INVALID_PAYLOAD');
  }

  return record;
};

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
  }

  return null;
};

const isValidBoardAssetKey = (value: string): value is GameModeBoardAssetKey =>
  VALID_BOARD_ASSET_KEYS.includes(value as GameModeBoardAssetKey);

const normalizeAdminGameMode = (value: unknown): AdminGameMode | null => {
  const record = asRecord(value);
  if (!record) {
    return null;
  }

  const id = readStringField(record, ['id']);
  const name = readStringField(record, ['name']);
  const description = readStringField(record, ['description']);
  const baseRulesetPreset = readStringField(record, ['baseRulesetPreset', 'base_ruleset_preset']);
  const pieceCountPerSide = readNumberField(record, ['pieceCountPerSide', 'piece_count_per_side']);
  const rulesVariant = readStringField(record, ['rulesVariant', 'rules_variant']);
  const rosetteSafetyMode = readStringField(record, ['rosetteSafetyMode', 'rosette_safety_mode']);
  const exitStyle = readStringField(record, ['exitStyle', 'exit_style']);
  const eliminationMode = readStringField(record, ['eliminationMode', 'elimination_mode']);
  const fogOfWar = readBooleanField(record, ['fogOfWar', 'fog_of_war']);
  const boardAssetKey = readStringField(record, ['boardAssetKey', 'board_asset_key']);
  const isActive = readBooleanField(record, ['isActive', 'is_active']);
  const featured = readBooleanField(record, ['featured']);
  const createdAt = readStringField(record, ['createdAt', 'created_at']);
  const updatedAt = readStringField(record, ['updatedAt', 'updated_at']);

  if (
    !id ||
    !name ||
    !description ||
    !baseRulesetPreset ||
    (!isLegacyGameModeBaseRulesetPreset(baseRulesetPreset) && !(baseRulesetPreset in GAME_MODE_PRESET_BY_ID)) ||
    typeof pieceCountPerSide !== 'number' ||
    !Number.isInteger(pieceCountPerSide) ||
    pieceCountPerSide <= 0 ||
    !rulesVariant ||
    !rosetteSafetyMode ||
    !exitStyle ||
    !eliminationMode ||
    typeof fogOfWar !== 'boolean' ||
    !boardAssetKey ||
    !isValidBoardAssetKey(boardAssetKey) ||
    typeof isActive !== 'boolean' ||
    typeof featured !== 'boolean' ||
    !createdAt ||
    !updatedAt ||
    isMatchModeId(id)
  ) {
    return null;
  }

  const mode: AdminGameMode = {
    id,
    name,
    description,
    baseRulesetPreset: normalizeGameModeBaseRulesetPreset(baseRulesetPreset),
    pieceCountPerSide,
    rulesVariant: rulesVariant as AdminGameMode['rulesVariant'],
    rosetteSafetyMode: rosetteSafetyMode as AdminGameMode['rosetteSafetyMode'],
    exitStyle: exitStyle as AdminGameMode['exitStyle'],
    eliminationMode: eliminationMode as AdminGameMode['eliminationMode'],
    fogOfWar,
    boardAssetKey: boardAssetKey as GameModeBoardAssetKey,
    isActive,
    featured,
    createdAt,
    updatedAt,
  };

  return isGameModeDefinition(toGameModeDefinition(mode)) ? mode : null;
};

const normalizeCatalogRecord = (value: unknown): GameModeCatalogRecord | null => {
  const record = asRecord(value);
  const rawModes = Array.isArray(record?.modes)
    ? record.modes
    : Array.isArray(record?.items)
      ? record.items
      : [];

  const modesById = new Map<string, AdminGameMode>();
  rawModes.forEach((item) => {
    const mode = normalizeAdminGameMode(item);
    if (mode) {
      modesById.set(mode.id, mode);
    }
  });

  if (!record && modesById.size === 0) {
    return null;
  }

  const featuredModeId = readStringField(record, ['featuredModeId', 'featured_mode_id']);
  const fallbackFeaturedModeId =
    Array.from(modesById.values()).find((mode) => mode.featured && mode.isActive)?.id ??
    Array.from(modesById.values()).find((mode) => mode.featured)?.id ??
    Array.from(modesById.values()).find((mode) => mode.isActive)?.id ??
    Array.from(modesById.values())[0]?.id ??
    null;

  const resolvedFeaturedModeId = featuredModeId && modesById.has(featuredModeId)
    ? featuredModeId
    : fallbackFeaturedModeId;

  const modes = Array.from(modesById.values()).map((mode) => ({
    ...mode,
    featured: mode.id === resolvedFeaturedModeId,
  }));

  return {
    modes,
    featuredModeId: resolvedFeaturedModeId,
    updatedAt: readStringField(record, ['updatedAt', 'updated_at']) ?? new Date().toISOString(),
  };
};

const ensureFeaturedMode = (catalog: GameModeCatalogRecord): GameModeCatalogRecord => {
  if (catalog.modes.length === 0) {
    return {
      ...catalog,
      featuredModeId: null,
      modes: [],
    };
  }

  const featuredModeId =
    catalog.featuredModeId && catalog.modes.some((mode) => mode.id === catalog.featuredModeId)
      ? catalog.featuredModeId
      : catalog.modes.find((mode) => mode.isActive)?.id ?? catalog.modes[0]!.id;

  return {
    ...catalog,
    featuredModeId,
    modes: catalog.modes.map((mode) => ({
      ...mode,
      featured: mode.id === featuredModeId,
    })),
  };
};

const readCatalogObject = (
  nk: RuntimeNakama,
): { object: RuntimeStorageObject | null; catalog: GameModeCatalogRecord | null } => {
  const objects = nk.storageRead([
    {
      collection: GAME_MODE_COLLECTION,
      key: GAME_MODE_KEY,
      userId: GLOBAL_STORAGE_USER_ID,
    },
  ]) as RuntimeStorageObject[];
  const object = findStorageObject(objects, GAME_MODE_COLLECTION, GAME_MODE_KEY, GLOBAL_STORAGE_USER_ID);

  return {
    object,
    catalog: normalizeCatalogRecord(getStorageObjectValue(object)),
  };
};

const writeCatalog = (
  nk: RuntimeNakama,
  catalog: GameModeCatalogRecord,
  version: string | null,
): void => {
  nk.storageWrite([
    maybeSetStorageVersion(
      {
        collection: GAME_MODE_COLLECTION,
        key: GAME_MODE_KEY,
        userId: GLOBAL_STORAGE_USER_ID,
        value: ensureFeaturedMode(catalog),
        permissionRead: STORAGE_PERMISSION_NONE,
        permissionWrite: STORAGE_PERMISSION_NONE,
      },
      version,
    ),
  ]);
};

const updateCatalogWithRetry = (
  nk: RuntimeNakama,
  logger: RuntimeLogger,
  update: (catalog: GameModeCatalogRecord) => GameModeCatalogRecord,
): GameModeCatalogRecord => {
  for (let attempt = 1; attempt <= MAX_WRITE_ATTEMPTS; attempt += 1) {
    const { object, catalog } = readCatalogObject(nk);
    const currentCatalog = catalog ?? {
      modes: [],
      featuredModeId: null,
      updatedAt: new Date().toISOString(),
    };
    const nextCatalog = ensureFeaturedMode(
      update({
        ...currentCatalog,
        modes: currentCatalog.modes.map((mode) => ({ ...mode })),
      }),
    );

    try {
      writeCatalog(nk, nextCatalog, object ? (getStorageObjectVersion(object) ?? '') : '*');
      return nextCatalog;
    } catch (error) {
      if (!isVersionConflict(error) || attempt === MAX_WRITE_ATTEMPTS) {
        logger.error('Failed to write game mode catalog: %s', getErrorMessage(error));
        throw error;
      }
    }
  }

  throw new Error('GAME_MODE_CATALOG_WRITE_FAILED');
};

const updateModeWithRetry = (
  nk: RuntimeNakama,
  logger: RuntimeLogger,
  modeId: string,
  update: (mode: AdminGameMode | null, catalog: GameModeCatalogRecord) => GameModeCatalogRecord,
): { catalog: GameModeCatalogRecord; mode: AdminGameMode | null } => {
  let result: { catalog: GameModeCatalogRecord; mode: AdminGameMode | null } | null = null;
  const catalog = updateCatalogWithRetry(nk, logger, (currentCatalog) => {
    const currentMode = currentCatalog.modes.find((mode) => mode.id === modeId) ?? null;
    const nextCatalog = update(currentMode, currentCatalog);
    result = {
      catalog: nextCatalog,
      mode: nextCatalog.modes.find((mode) => mode.id === modeId) ?? null,
    };
    return nextCatalog;
  });

  return result ?? {
    catalog,
    mode: catalog.modes.find((mode) => mode.id === modeId) ?? null,
  };
};

const normalizeDraft = (value: unknown): AdminGameModeDraft => {
  const record = asRecord(value);
  if (!record) {
    throw new Error('INVALID_PAYLOAD');
  }

  const source = asRecord(record.mode) ?? record;
  const id = readStringField(source, ['id']);
  const name = readStringField(source, ['name']);
  const description = readStringField(source, ['description']);
  const baseRulesetPreset = readStringField(source, ['baseRulesetPreset', 'base_ruleset_preset']);
  const pieceCountPerSide = readNumberField(source, ['pieceCountPerSide', 'piece_count_per_side']);
  const rulesVariant = readStringField(source, ['rulesVariant', 'rules_variant']);
  const rosetteSafetyMode = readStringField(source, ['rosetteSafetyMode', 'rosette_safety_mode']);
  const exitStyle = readStringField(source, ['exitStyle', 'exit_style']);
  const eliminationMode = readStringField(source, ['eliminationMode', 'elimination_mode']);
  const fogOfWar = readBooleanField(source, ['fogOfWar', 'fog_of_war']);
  const boardAssetKey = readStringField(source, ['boardAssetKey', 'board_asset_key']);
  const isActive = readBooleanField(source, ['isActive', 'is_active']);
  const draftCandidate = {
    id,
    name,
    description,
    baseRulesetPreset: normalizeGameModeBaseRulesetPreset(baseRulesetPreset),
    pieceCountPerSide,
    rulesVariant: rulesVariant as AdminGameModeDraft['rulesVariant'],
    rosetteSafetyMode: rosetteSafetyMode as AdminGameModeDraft['rosetteSafetyMode'],
    exitStyle: exitStyle as AdminGameModeDraft['exitStyle'],
    eliminationMode: eliminationMode as AdminGameModeDraft['eliminationMode'],
    fogOfWar,
    boardAssetKey: boardAssetKey as GameModeBoardAssetKey,
  } satisfies AdminGameModeDraft;

  if (
    !id ||
    !name ||
    !description ||
    !baseRulesetPreset ||
    (!isLegacyGameModeBaseRulesetPreset(baseRulesetPreset) && !(baseRulesetPreset in GAME_MODE_PRESET_BY_ID)) ||
    typeof pieceCountPerSide !== 'number' ||
    !Number.isInteger(pieceCountPerSide) ||
    pieceCountPerSide <= 0 ||
    !rulesVariant ||
    !rosetteSafetyMode ||
    !exitStyle ||
    !eliminationMode ||
    typeof fogOfWar !== 'boolean' ||
    !boardAssetKey ||
    !isValidBoardAssetKey(boardAssetKey) ||
    typeof isActive !== 'boolean' ||
    isMatchModeId(id)
  ) {
    throw new Error('INVALID_PAYLOAD');
  }

  if (!isGameModeDefinition(draftCandidate)) {
    throw new Error('INVALID_PAYLOAD');
  }

  return {
    ...draftCandidate,
    isActive,
  };
};

const parseModeIdRequest = (payload: string): { modeId: string } => {
  const record = parseJsonPayload(payload);
  const modeId = readStringField(record, ['modeId', 'mode_id', 'id']);
  if (!modeId) {
    throw new Error('INVALID_PAYLOAD');
  }

  return { modeId };
};

const buildGameModeResponse = (mode: AdminGameMode): GameModeMutationResponse => ({
  success: true,
  mode,
});

const buildToggleResponse = (modeId: string): GameModeToggleResponse => ({
  success: true,
  modeId,
});

const buildDeleteResponse = (modeId: string): GameModeDeleteResponse => ({
  success: true,
  modeId,
});

const buildFeatureResponse = (featuredModeId: string | null): GameModeFeatureResponse => ({
  success: true,
  featuredModeId,
});

export const requireAdminRole = (
  ctx: RuntimeContext,
  nk: RuntimeNakama,
  role: AdminRole = 'viewer',
): AdminRole => assertAdmin(ctx, role, nk);

export const loadGameModeCatalog = (nk: RuntimeNakama): GameModeCatalogRecord => {
  const { catalog } = readCatalogObject(nk);
  return ensureFeaturedMode(
    catalog ?? {
      modes: [],
      featuredModeId: null,
      updatedAt: new Date().toISOString(),
    },
  );
};

export const listGameModes = (nk: RuntimeNakama): AdminGameModesResponse => {
  const catalog = loadGameModeCatalog(nk);
  return {
    featuredModeId: catalog.featuredModeId,
    modes: catalog.modes,
  };
};

export const getPublicGameModes = (nk: RuntimeNakama): PublicGameModesResponse => {
  const catalog = loadGameModeCatalog(nk);
  const activeModes = catalog.modes.filter((mode) => mode.isActive).map(toGameModeDefinition);
  const featuredMode = catalog.modes.find((mode) => mode.id === catalog.featuredModeId) ?? null;

  return {
    featuredMode: featuredMode ? toGameModeDefinition(featuredMode) : null,
    activeModes,
  };
};

const getGameModeById = (nk: RuntimeNakama, modeId: string): AdminGameMode | null =>
  loadGameModeCatalog(nk).modes.find((mode) => mode.id === modeId) ?? null;

export const rpcGetGameModes = (
  ctx: RuntimeContext,
  _logger: RuntimeLogger,
  nk: RuntimeNakama,
  _payload: string,
): string => {
  if (!ctx.userId) {
    throw new Error('Authentication required.');
  }

  return JSON.stringify(getPublicGameModes(nk));
};

export const rpcAdminListGameModes = (
  ctx: RuntimeContext,
  _logger: RuntimeLogger,
  nk: RuntimeNakama,
  _payload: string,
): string => {
  requireAdminRole(ctx, nk, 'viewer');
  return JSON.stringify(listGameModes(nk));
};

export const rpcAdminGetGameMode = (
  ctx: RuntimeContext,
  _logger: RuntimeLogger,
  nk: RuntimeNakama,
  payload: string,
): string => {
  requireAdminRole(ctx, nk, 'viewer');
  const { modeId } = parseModeIdRequest(payload);
  const mode = getGameModeById(nk, modeId);
  if (!mode) {
    throw new Error('MODE_NOT_FOUND');
  }

  return JSON.stringify(buildGameModeResponse(mode));
};

export const rpcAdminUpsertGameMode = (
  ctx: RuntimeContext,
  logger: RuntimeLogger,
  nk: RuntimeNakama,
  payload: string,
): string => {
  requireAdminRole(ctx, nk, 'operator');
  const record = parseJsonPayload(payload);
  const mode = normalizeDraft(record.mode ?? record);

  const result = updateModeWithRetry(nk, logger, mode.id, (currentMode, catalog) => {
    const now = new Date().toISOString();
    const nextMode: AdminGameMode = {
      ...(currentMode ?? {
        ...mode,
        featured: false,
        createdAt: now,
      }),
      ...mode,
      featured: catalog.featuredModeId === mode.id || currentMode?.featured === true,
      createdAt: currentMode?.createdAt ?? now,
      updatedAt: now,
    };

    const modes = currentMode
      ? catalog.modes.map((item) => (item.id === mode.id ? nextMode : item))
      : [...catalog.modes, nextMode];

    return {
      ...catalog,
      modes,
      updatedAt: now,
    };
  });

  if (!result.mode) {
    throw new Error('GAME_MODE_WRITE_FAILED');
  }

  return JSON.stringify(buildGameModeResponse(result.mode));
};

export const rpcAdminDisableGameMode = (
  ctx: RuntimeContext,
  logger: RuntimeLogger,
  nk: RuntimeNakama,
  payload: string,
): string => {
  requireAdminRole(ctx, nk, 'operator');
  const { modeId } = parseModeIdRequest(payload);
  const result = updateModeWithRetry(nk, logger, modeId, (currentMode, catalog) => {
    if (!currentMode) {
      throw new Error('MODE_NOT_FOUND');
    }

    const now = new Date().toISOString();
    const nextMode: AdminGameMode = {
      ...currentMode,
      isActive: false,
      featured: catalog.featuredModeId === currentMode.id,
      updatedAt: now,
    };

    return {
      ...catalog,
      modes: catalog.modes.map((mode) => (mode.id === currentMode.id ? nextMode : mode)),
      updatedAt: now,
    };
  });

  if (!result.mode) {
    throw new Error('MODE_NOT_FOUND');
  }

  return JSON.stringify(buildToggleResponse(modeId));
};

export const rpcAdminEnableGameMode = (
  ctx: RuntimeContext,
  logger: RuntimeLogger,
  nk: RuntimeNakama,
  payload: string,
): string => {
  requireAdminRole(ctx, nk, 'operator');
  const { modeId } = parseModeIdRequest(payload);
  const result = updateModeWithRetry(nk, logger, modeId, (currentMode, catalog) => {
    if (!currentMode) {
      throw new Error('MODE_NOT_FOUND');
    }

    const now = new Date().toISOString();
    const nextMode: AdminGameMode = {
      ...currentMode,
      isActive: true,
      featured: catalog.featuredModeId === currentMode.id,
      updatedAt: now,
    };

    return {
      ...catalog,
      modes: catalog.modes.map((mode) => (mode.id === currentMode.id ? nextMode : mode)),
      updatedAt: now,
    };
  });

  if (!result.mode) {
    throw new Error('MODE_NOT_FOUND');
  }

  return JSON.stringify(buildToggleResponse(modeId));
};

export const rpcAdminDeleteGameMode = (
  ctx: RuntimeContext,
  logger: RuntimeLogger,
  nk: RuntimeNakama,
  payload: string,
): string => {
  requireAdminRole(ctx, nk, 'operator');
  const { modeId } = parseModeIdRequest(payload);

  updateCatalogWithRetry(nk, logger, (catalog) => {
    const currentMode = catalog.modes.find((mode) => mode.id === modeId);
    if (!currentMode) {
      throw new Error('MODE_NOT_FOUND');
    }

    const now = new Date().toISOString();
    return {
      ...catalog,
      modes: catalog.modes.filter((mode) => mode.id !== modeId),
      updatedAt: now,
    };
  });

  return JSON.stringify(buildDeleteResponse(modeId));
};

export const rpcAdminFeatureGameMode = (
  ctx: RuntimeContext,
  logger: RuntimeLogger,
  nk: RuntimeNakama,
  payload: string,
): string => {
  requireAdminRole(ctx, nk, 'operator');
  const { modeId } = parseModeIdRequest(payload);
  const result = updateModeWithRetry(nk, logger, modeId, (currentMode, catalog) => {
    if (!currentMode) {
      throw new Error('MODE_NOT_FOUND');
    }

    const now = new Date().toISOString();
    const modes = catalog.modes.map((mode) => ({
      ...mode,
      featured: mode.id === modeId,
      updatedAt: mode.id === modeId ? now : mode.updatedAt,
    }));

    return {
      ...catalog,
      featuredModeId: modeId,
      modes,
      updatedAt: now,
    };
  });

  if (!result.mode) {
    throw new Error('MODE_NOT_FOUND');
  }

  return JSON.stringify(buildFeatureResponse(modeId));
};

export const rpcAdminUnfeatureGameMode = (
  ctx: RuntimeContext,
  logger: RuntimeLogger,
  nk: RuntimeNakama,
  payload: string,
): string => {
  requireAdminRole(ctx, nk, 'operator');
  const { modeId } = parseModeIdRequest(payload);
  const result = updateModeWithRetry(nk, logger, modeId, (currentMode, catalog) => {
    if (!currentMode) {
      throw new Error('MODE_NOT_FOUND');
    }

    const fallbackMode =
      catalog.modes.find((mode) => mode.id !== modeId && mode.isActive) ??
      catalog.modes.find((mode) => mode.id !== modeId) ??
      currentMode;
    const now = new Date().toISOString();
    const modes = catalog.modes.map((mode) => ({
      ...mode,
      featured: mode.id === fallbackMode.id,
      updatedAt: mode.id === fallbackMode.id ? now : mode.updatedAt,
    }));

    return {
      ...catalog,
      featuredModeId: fallbackMode.id,
      modes,
      updatedAt: now,
    };
  });

  if (!result.mode) {
    throw new Error('MODE_NOT_FOUND');
  }

  return JSON.stringify(buildFeatureResponse(result.catalog.featuredModeId));
};
