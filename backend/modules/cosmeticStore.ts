import {
  PREMIUM_CURRENCY_KEY,
  SOFT_CURRENCY_KEY,
  parseWalletBalances,
} from "../../shared/wallet";
import type {
  AdminCosmeticMutationResponse,
  AdminRemoveLimitedTimeEventRequest,
  AdminSetLimitedTimeEventRequest,
  AdminSetManualRotationRequest,
  AdminToggleCosmeticRequest,
  AdminUpsertCosmeticRequest,
  CosmeticDefinition,
  FullCatalogResponse,
  LimitedTimeEvent,
  OwnedCosmetic,
  OwnedCosmeticsResponse,
  PurchaseItemRequest,
  PurchaseItemResponse,
  StoreRotationStateResponse,
  StoreStatsResponse,
  StorefrontResponse,
} from "../../shared/cosmetics";
import { isCosmeticDefinition, isLimitedTimeEvent } from "../../shared/cosmetics";
import {
  GLOBAL_STORAGE_USER_ID,
  MAX_WRITE_ATTEMPTS,
  STORAGE_PERMISSION_NONE,
  findStorageObject,
  getStorageObjectValue,
  getStorageObjectVersion,
  maybeSetStorageVersion,
} from "./progression";
import {
  invalidateCatalogCache,
  loadCatalogFromStorage,
  writeRawCatalogWithRetry,
} from "./cosmeticCatalog";
import { invalidateRotationCache, getDailyRotation, getFeaturedItems } from "./storeRotation";
import { assertAdmin } from "./tournaments/auth";
import type { AdminRole } from "./tournaments/types";
import { listAnalyticsEvents, recordCosmeticPurchaseAnalyticsEvent } from "./analytics/tracking";

type RuntimeContext = any;
type RuntimeLogger = any;
type RuntimeNakama = any;
type RuntimeRecord = Record<string, unknown>;
type RuntimeStorageObject = RuntimeRecord & {
  value?: unknown;
  version?: string;
};

type StoredOwnedCosmetics = {
  items: OwnedCosmetic[];
};

type StoreRotationRecord = {
  dailyRotationIds: string[];
  featuredIds: string[];
  generatedAt: string;
  previousDays: string[][];
  manualOverride: boolean;
  limitedTimeEvents: LimitedTimeEvent[];
};

export const COSMETICS_COLLECTION = "cosmetics";
export const COSMETICS_OWNED_KEY = "owned";
export const STORE_STATE_COLLECTION = "store_state";
export const STORE_ROTATION_KEY = "rotation";

export const RPC_GET_STOREFRONT = "get_storefront";
export const RPC_GET_FULL_CATALOG = "get_full_catalog";
export const RPC_PURCHASE_ITEM = "purchase_item";
export const RPC_GET_OWNED_COSMETICS = "get_owned_cosmetics";
export const RPC_ADMIN_GET_FULL_CATALOG = "admin_get_full_catalog";
export const RPC_ADMIN_UPSERT_COSMETIC = "admin_upsert_cosmetic";
export const RPC_ADMIN_DISABLE_COSMETIC = "admin_disable_cosmetic";
export const RPC_ADMIN_ENABLE_COSMETIC = "admin_enable_cosmetic";
export const RPC_ADMIN_GET_ROTATION_STATE = "admin_get_rotation_state";
export const RPC_ADMIN_SET_MANUAL_ROTATION = "admin_set_manual_rotation";
export const RPC_ADMIN_CLEAR_MANUAL_ROTATION = "admin_clear_manual_rotation";
export const RPC_ADMIN_SET_LIMITED_TIME_EVENT = "admin_set_limited_time_event";
export const RPC_ADMIN_REMOVE_LIMITED_TIME_EVENT = "admin_remove_limited_time_event";
export const RPC_ADMIN_GET_STORE_STATS = "admin_get_store_stats";

const ROTATION_TTL_MS = 24 * 60 * 60 * 1000;

const asRecord = (value: unknown): RuntimeRecord | null =>
  typeof value === "object" && value !== null ? (value as RuntimeRecord) : null;

const getErrorMessage = (error: unknown): string => (error instanceof Error ? error.message : String(error));

const isVersionConflict = (error: unknown): boolean => {
  const message = getErrorMessage(error).toLowerCase();
  return (
    message.includes("version check") ||
    message.includes("version conflict") ||
    message.includes("version mismatch") ||
    message.includes("storage write rejected")
  );
};

const isOwnedCosmeticSource = (value: unknown): value is OwnedCosmetic["source"] =>
  value === "purchase_soft" || value === "purchase_premium" || value === "tournament_reward" || value === "gift";

const normalizeOwnedCosmetics = (value: unknown): StoredOwnedCosmetics => {
  const record = asRecord(value);
  const rawItems = Array.isArray(record?.items) ? record.items : [];
  const items = rawItems.flatMap((item): OwnedCosmetic[] => {
    const itemRecord = asRecord(item);
    if (
      !itemRecord ||
      typeof itemRecord.cosmeticId !== "string" ||
      typeof itemRecord.acquiredAt !== "string" ||
      !isOwnedCosmeticSource(itemRecord.source)
    ) {
      return [];
    }

    return [
      {
        cosmeticId: itemRecord.cosmeticId,
        acquiredAt: itemRecord.acquiredAt,
        source: itemRecord.source,
      },
    ];
  });

  return { items };
};

const normalizeStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string") : [];

const normalizePreviousDays = (value: unknown): string[][] =>
  Array.isArray(value) ? value.map(normalizeStringArray).filter((entry) => entry.length > 0).slice(0, 3) : [];

const normalizeLimitedTimeEvents = (value: unknown): LimitedTimeEvent[] =>
  Array.isArray(value) ? value.filter(isLimitedTimeEvent) : [];

const normalizeRotationRecord = (value: unknown): StoreRotationRecord | null => {
  const record = asRecord(value);
  if (!record || typeof record.generatedAt !== "string") {
    return null;
  }

  const dailyRotationIds = normalizeStringArray(record.dailyRotationIds).length > 0
    ? normalizeStringArray(record.dailyRotationIds)
    : normalizeStringArray(record.dailyRotation);
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
    limitedTimeEvents: normalizeLimitedTimeEvents(record.limitedTimeEvents),
  };
};

const parseJsonPayload = (payload: string): RuntimeRecord => {
  let parsed: unknown;
  try {
    parsed = payload ? JSON.parse(payload) : {};
  } catch {
    throw new Error("INVALID_PAYLOAD");
  }

  const record = asRecord(parsed);
  if (!record) {
    throw new Error("INVALID_PAYLOAD");
  }

  return record;
};

export const requireAdminRole = (
  ctx: RuntimeContext,
  nk: RuntimeNakama,
  role: AdminRole = "viewer",
): AdminRole => assertAdmin(ctx, role, nk);

const readOwnedCosmeticsObject = (
  nk: RuntimeNakama,
  userId: string,
): { object: RuntimeStorageObject | null; owned: StoredOwnedCosmetics } => {
  const objects = nk.storageRead([
    {
      collection: COSMETICS_COLLECTION,
      key: COSMETICS_OWNED_KEY,
      userId,
    },
  ]) as RuntimeStorageObject[];
  const object = findStorageObject(objects, COSMETICS_COLLECTION, COSMETICS_OWNED_KEY, userId);

  return {
    object,
    owned: normalizeOwnedCosmetics(getStorageObjectValue(object)),
  };
};

const readRotationObject = (
  nk: RuntimeNakama,
): { object: RuntimeStorageObject | null; rotation: StoreRotationRecord | null } => {
  const objects = nk.storageRead([
    {
      collection: STORE_STATE_COLLECTION,
      key: STORE_ROTATION_KEY,
      userId: GLOBAL_STORAGE_USER_ID,
    },
    {
      collection: STORE_STATE_COLLECTION,
      key: STORE_ROTATION_KEY,
      userId: "system",
    },
  ]) as RuntimeStorageObject[];
  const object =
    findStorageObject(objects, STORE_STATE_COLLECTION, STORE_ROTATION_KEY, GLOBAL_STORAGE_USER_ID) ??
    findStorageObject(objects, STORE_STATE_COLLECTION, STORE_ROTATION_KEY, "system");

  return {
    object,
    rotation: normalizeRotationRecord(getStorageObjectValue(object)),
  };
};

const isRotationFresh = (rotation: StoreRotationRecord, nowMs: number): boolean => {
  const generatedAtMs = Date.parse(rotation.generatedAt);
  return (
    rotation.manualOverride ||
    (Number.isFinite(generatedAtMs) && nowMs - generatedAtMs < ROTATION_TTL_MS && rotation.dailyRotationIds.length === 8)
  );
};

const writeRotationRecord = (
  nk: RuntimeNakama,
  rotation: StoreRotationRecord,
  version: string | null,
): void => {
  nk.storageWrite([
    maybeSetStorageVersion({
      collection: STORE_STATE_COLLECTION,
      key: STORE_ROTATION_KEY,
      userId: GLOBAL_STORAGE_USER_ID,
      value: rotation,
      permissionRead: STORAGE_PERMISSION_NONE,
      permissionWrite: STORAGE_PERMISSION_NONE,
    }, version),
  ]);
};

const buildRotationRecord = (
  catalog: CosmeticDefinition[],
  nowIso: string,
  previousRotation: StoreRotationRecord | null,
): StoreRotationRecord => {
  const previousDays = previousRotation
    ? [previousRotation.dailyRotationIds, ...previousRotation.previousDays].slice(0, 3)
    : [];
  const dailyRotationIds = getDailyRotation(catalog, nowIso, previousDays).map((item) => item.id);
  const featuredIds = getFeaturedItems(catalog).map((item) => item.id);

  return {
    dailyRotationIds,
    featuredIds,
    generatedAt: nowIso,
    previousDays,
    manualOverride: false,
    limitedTimeEvents: previousRotation?.limitedTimeEvents ?? [],
  };
};

export const getOrCreateStoreRotation = (
  nk: RuntimeNakama,
  logger: RuntimeLogger,
  catalog: CosmeticDefinition[],
  now = new Date(),
): StoreRotationRecord => {
  for (let attempt = 1; attempt <= MAX_WRITE_ATTEMPTS; attempt += 1) {
    const { object, rotation } = readRotationObject(nk);
    if (rotation && isRotationFresh(rotation, now.getTime())) {
      return rotation;
    }

    const nextRotation = buildRotationRecord(catalog, now.toISOString(), rotation);
    const objectUserId = typeof object?.userId === "string" ? object.userId : undefined;
    const version = object && objectUserId === GLOBAL_STORAGE_USER_ID ? (getStorageObjectVersion(object) ?? "") : "*";

    try {
      writeRotationRecord(nk, nextRotation, version);
      return nextRotation;
    } catch (error) {
      if (!isVersionConflict(error) || attempt === MAX_WRITE_ATTEMPTS) {
        logger.error("Failed to write store rotation: %s", getErrorMessage(error));
        throw error;
      }
    }
  }

  throw new Error("STORE_ROTATION_WRITE_FAILED");
};

const catalogItemsForIds = (catalog: CosmeticDefinition[], ids: string[]): CosmeticDefinition[] => {
  const byId = new Map(catalog.map((item) => [item.id, item]));
  return ids.flatMap((id) => {
    const item = byId.get(id);
    return item ? [item] : [];
  });
};

const getRotationExpiresAt = (rotation: StoreRotationRecord): string =>
  new Date(Date.parse(rotation.generatedAt) + ROTATION_TTL_MS).toISOString();

const isLimitedTimeEventActive = (event: LimitedTimeEvent, now: Date): boolean => {
  if (event.disabled) {
    return false;
  }

  const nowMs = now.getTime();
  const startMs = Date.parse(event.startsAt);
  const endMs = Date.parse(event.endsAt);
  return Number.isFinite(startMs) && Number.isFinite(endMs) && nowMs >= startMs && nowMs <= endMs;
};

const resolveLimitedTimeItems = (
  catalog: CosmeticDefinition[],
  events: LimitedTimeEvent[],
  now: Date,
): CosmeticDefinition[] => {
  const activeIds = new Set(
    events
      .filter((event) => isLimitedTimeEventActive(event, now))
      .flatMap((event) => event.cosmeticIds),
  );

  return catalog.filter((item) => activeIds.has(item.id));
};

export const buildStorefrontResponse = (
  nk: RuntimeNakama,
  logger: RuntimeLogger,
  userId: string,
  now = new Date(),
): StorefrontResponse => {
  const catalog = loadCatalogFromStorage(nk);
  const rotation = getOrCreateStoreRotation(nk, logger, catalog, now);
  const { owned } = readOwnedCosmeticsObject(nk, userId);

  return {
    dailyRotation: catalogItemsForIds(catalog, rotation.dailyRotationIds),
    featured: catalogItemsForIds(catalog, rotation.featuredIds),
    limitedTime: resolveLimitedTimeItems(catalog, rotation.limitedTimeEvents, now),
    bundles: [],
    ownedIds: owned.items.map((item) => item.cosmeticId),
    rotationExpiresAt: getRotationExpiresAt(rotation),
  };
};

const parsePurchaseItemRequest = (payload: string): PurchaseItemRequest => {
  let parsed: unknown;
  try {
    parsed = payload ? JSON.parse(payload) : {};
  } catch {
    throw new Error("INVALID_PAYLOAD");
  }

  const record = asRecord(parsed);
  if (!record || typeof record.itemId !== "string" || record.itemId.trim().length === 0) {
    throw new Error("INVALID_PAYLOAD");
  }

  return { itemId: record.itemId };
};

const currencyKeyForCosmetic = (definition: CosmeticDefinition): typeof SOFT_CURRENCY_KEY | typeof PREMIUM_CURRENCY_KEY =>
  definition.price.currency === "premium" ? PREMIUM_CURRENCY_KEY : SOFT_CURRENCY_KEY;

const purchaseSourceForCosmetic = (definition: CosmeticDefinition): OwnedCosmetic["source"] =>
  definition.price.currency === "premium" ? "purchase_premium" : "purchase_soft";

const deductWalletForPurchase = (
  nk: RuntimeNakama,
  userId: string,
  definition: CosmeticDefinition,
): void => {
  const currencyKey = currencyKeyForCosmetic(definition);

  try {
    nk.walletsUpdate([
      {
        userId,
        changeset: {
          [currencyKey]: -definition.price.amount,
        },
        metadata: {
          source: "cosmetic_purchase",
          cosmeticId: definition.id,
          currency: currencyKey,
          amount: definition.price.amount,
        },
      },
    ]);
  } catch {
    throw new Error("INSUFFICIENT_FUNDS");
  }
};

const writeOwnedCosmeticAfterPurchase = (
  nk: RuntimeNakama,
  userId: string,
  definition: CosmeticDefinition,
  acquiredAt: string,
): OwnedCosmetic[] => {
  const purchasedItem: OwnedCosmetic = {
    cosmeticId: definition.id,
    acquiredAt,
    source: purchaseSourceForCosmetic(definition),
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
          permissionRead: STORAGE_PERMISSION_NONE,
          permissionWrite: STORAGE_PERMISSION_NONE,
        }, object ? (getStorageObjectVersion(object) ?? "") : "*"),
      ]);
      return nextItems;
    } catch (error) {
      if (!isVersionConflict(error) || attempt === MAX_WRITE_ATTEMPTS) {
        throw error;
      }
    }
  }

  throw new Error("OWNED_COSMETICS_WRITE_FAILED");
};

const getUpdatedWallet = (nk: RuntimeNakama, userId: string): PurchaseItemResponse["updatedWallet"] => {
  const wallet = parseWalletBalances(nk.accountGetId(userId)?.wallet);
  return {
    [SOFT_CURRENCY_KEY]: wallet[SOFT_CURRENCY_KEY],
    [PREMIUM_CURRENCY_KEY]: wallet[PREMIUM_CURRENCY_KEY],
  };
};

export const purchaseCosmeticItem = (
  nk: RuntimeNakama,
  logger: RuntimeLogger,
  userId: string,
  itemId: string,
): PurchaseItemResponse => {
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
  writeOwnedCosmeticAfterPurchase(nk, userId, definition, new Date().toISOString());
  recordCosmeticPurchaseAnalyticsEvent(nk, logger, {
    userId,
    cosmeticId: definition.id,
    currency: definition.price.currency,
    amount: definition.price.amount,
  });

  return {
    success: true,
    cosmeticId: itemId,
    updatedWallet: getUpdatedWallet(nk, userId),
  };
};

export const getOwnedCosmeticsForUser = (nk: RuntimeNakama, userId: string): OwnedCosmeticsResponse => {
  const { owned } = readOwnedCosmeticsObject(nk, userId);
  return {
    items: owned.items,
    cosmeticIds: owned.items.map((item) => item.cosmeticId),
  };
};

const ensureCatalogItemIdsExist = (
  catalog: CosmeticDefinition[],
  ids: string[],
): void => {
  const byId = new Map(catalog.map((item) => [item.id, item]));
  ids.forEach((id) => {
    const item = byId.get(id);
    if (!item || item.disabled) {
      throw new Error("INVALID_COSMETIC_ID");
    }
  });
};

const getRotationStateForAdmin = (
  nk: RuntimeNakama,
  logger: RuntimeLogger,
  now = new Date(),
): StoreRotationStateResponse => {
  const catalog = loadCatalogFromStorage(nk);
  const rotation = getOrCreateStoreRotation(nk, logger, catalog, now);
  return {
    dailyRotationIds: rotation.dailyRotationIds,
    featuredIds: rotation.featuredIds,
    generatedAt: rotation.generatedAt,
    previousDays: rotation.previousDays,
    manualOverride: rotation.manualOverride,
    limitedTimeEvents: rotation.limitedTimeEvents,
  };
};

const updateRotationRecordWithRetry = (
  nk: RuntimeNakama,
  logger: RuntimeLogger,
  catalog: CosmeticDefinition[],
  update: (rotation: StoreRotationRecord) => StoreRotationRecord,
): StoreRotationRecord => {
  for (let attempt = 1; attempt <= MAX_WRITE_ATTEMPTS; attempt += 1) {
    const { object, rotation } = readRotationObject(nk);
    const current = rotation ?? buildRotationRecord(catalog, new Date().toISOString(), null);
    const nextRotation = update(current);
    const objectUserId = typeof object?.userId === "string" ? object.userId : undefined;
    const version = object && objectUserId === GLOBAL_STORAGE_USER_ID ? (getStorageObjectVersion(object) ?? "") : "*";

    try {
      writeRotationRecord(nk, nextRotation, version);
      invalidateRotationCache();
      return nextRotation;
    } catch (error) {
      if (!isVersionConflict(error) || attempt === MAX_WRITE_ATTEMPTS) {
        logger.error("Failed to write store rotation: %s", getErrorMessage(error));
        throw error;
      }
    }
  }

  throw new Error("STORE_ROTATION_WRITE_FAILED");
};

const parseUpsertCosmeticRequest = (payload: string): AdminUpsertCosmeticRequest => {
  const record = parseJsonPayload(payload);
  const cosmetic = asRecord(record.cosmetic);
  if (!cosmetic || typeof cosmetic.id !== "string" || cosmetic.id.trim().length === 0) {
    throw new Error("INVALID_PAYLOAD");
  }

  return {
    cosmetic: cosmetic as Partial<CosmeticDefinition> & { id: string },
  };
};

const parseToggleCosmeticRequest = (payload: string): AdminToggleCosmeticRequest => {
  const record = parseJsonPayload(payload);
  if (typeof record.cosmeticId !== "string" || record.cosmeticId.trim().length === 0) {
    throw new Error("INVALID_PAYLOAD");
  }

  return { cosmeticId: record.cosmeticId };
};

const parseManualRotationRequest = (payload: string): AdminSetManualRotationRequest => {
  const record = parseJsonPayload(payload);
  const dailyRotationIds = normalizeStringArray(record.dailyRotationIds);
  const featuredIds = normalizeStringArray(record.featuredIds);

  if (dailyRotationIds.length > 8 || featuredIds.length > 2) {
    throw new Error("INVALID_ROTATION_SIZE");
  }

  return { dailyRotationIds, featuredIds };
};

const parseSetLimitedTimeEventRequest = (payload: string): AdminSetLimitedTimeEventRequest => {
  const record = parseJsonPayload(payload);
  if (!isLimitedTimeEvent(record.event)) {
    throw new Error("INVALID_PAYLOAD");
  }

  return { event: record.event };
};

const parseRemoveLimitedTimeEventRequest = (payload: string): AdminRemoveLimitedTimeEventRequest => {
  const record = parseJsonPayload(payload);
  if (typeof record.eventId !== "string" || record.eventId.trim().length === 0) {
    throw new Error("INVALID_PAYLOAD");
  }

  return { eventId: record.eventId };
};

const upsertCatalogItem = (
  nk: RuntimeNakama,
  patch: Partial<CosmeticDefinition> & { id: string },
): AdminCosmeticMutationResponse => {
  let updatedItem: CosmeticDefinition | null = null;
  writeRawCatalogWithRetry(nk, (items) => {
    const existingIndex = items.findIndex((item) => item.id === patch.id);
    const merged = {
      ...(existingIndex >= 0 ? items[existingIndex] : {}),
      ...patch,
    };

    if (!isCosmeticDefinition(merged)) {
      throw new Error("INVALID_COSMETIC");
    }

    updatedItem = merged;
    if (existingIndex >= 0) {
      return items.map((item, index) => (index === existingIndex ? merged : item));
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
    item: updatedItem,
  };
};

const toggleCatalogItem = (
  nk: RuntimeNakama,
  cosmeticId: string,
  disabled: boolean,
): AdminCosmeticMutationResponse => {
  let updatedItem: CosmeticDefinition | null = null;
  writeRawCatalogWithRetry(nk, (items) => {
    const existing = items.find((item) => item.id === cosmeticId);
    if (!existing) {
      throw new Error("ITEM_NOT_FOUND");
    }

    updatedItem = { ...existing, disabled };
    return items.map((item) => (item.id === cosmeticId ? updatedItem as CosmeticDefinition : item));
  });
  invalidateCatalogCache();
  invalidateRotationCache();

  if (!updatedItem) {
    throw new Error("ITEM_NOT_FOUND");
  }

  return {
    success: true,
    item: updatedItem,
  };
};

const buildStoreStats = (nk: RuntimeNakama, logger: RuntimeLogger): StoreStatsResponse => {
  const result = listAnalyticsEvents(nk, logger);
  if (!result.supported || result.events.length === 0) {
    return {
      totalPurchases: 0,
      totalSoftCurrencySpent: 0,
      totalPremiumCurrencySpent: 0,
      items: [],
    };
  }

  const byCosmetic = new Map<string, StoreStatsResponse["items"][number]>();
  let totalPurchases = 0;
  let totalSoftCurrencySpent = 0;
  let totalPremiumCurrencySpent = 0;

  result.events.forEach((event) => {
    if (event.type !== "cosmetic_purchase") {
      return;
    }

    totalPurchases += 1;
    if (event.currency === "premium") {
      totalPremiumCurrencySpent += event.amount;
    } else {
      totalSoftCurrencySpent += event.amount;
    }

    const current = byCosmetic.get(event.cosmeticId) ?? {
      cosmeticId: event.cosmeticId,
      purchaseCount: 0,
      softCurrencySpent: 0,
      premiumCurrencySpent: 0,
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
    items: Array.from(byCosmetic.values()).sort((left, right) => right.purchaseCount - left.purchaseCount),
  };
};

export const rpcGetStorefront = (
  ctx: RuntimeContext,
  logger: RuntimeLogger,
  nk: RuntimeNakama,
  _payload: string,
): string => {
  if (!ctx.userId) {
    throw new Error("Authentication required.");
  }

  return JSON.stringify(buildStorefrontResponse(nk, logger, ctx.userId));
};

export const rpcGetFullCatalog = (
  ctx: RuntimeContext,
  _logger: RuntimeLogger,
  nk: RuntimeNakama,
  _payload: string,
): string => {
  if (!ctx.userId) {
    throw new Error("Authentication required.");
  }

  const response: FullCatalogResponse = {
    items: loadCatalogFromStorage(nk),
  };
  return JSON.stringify(response);
};

export const rpcPurchaseItem = (
  ctx: RuntimeContext,
  logger: RuntimeLogger,
  nk: RuntimeNakama,
  payload: string,
): string => {
  if (!ctx.userId) {
    throw new Error("Authentication required.");
  }

  const request = parsePurchaseItemRequest(payload);
  return JSON.stringify(purchaseCosmeticItem(nk, logger, ctx.userId, request.itemId));
};

export const rpcGetOwnedCosmetics = (
  ctx: RuntimeContext,
  _logger: RuntimeLogger,
  nk: RuntimeNakama,
  _payload: string,
): string => {
  if (!ctx.userId) {
    throw new Error("Authentication required.");
  }

  return JSON.stringify(getOwnedCosmeticsForUser(nk, ctx.userId));
};

export const rpcAdminGetFullCatalog = (
  ctx: RuntimeContext,
  _logger: RuntimeLogger,
  nk: RuntimeNakama,
  _payload: string,
): string => {
  requireAdminRole(ctx, nk, "viewer");
  return JSON.stringify({ items: loadCatalogFromStorage(nk, { includeDisabled: true }) } satisfies FullCatalogResponse);
};

export const rpcAdminUpsertCosmetic = (
  ctx: RuntimeContext,
  _logger: RuntimeLogger,
  nk: RuntimeNakama,
  payload: string,
): string => {
  requireAdminRole(ctx, nk, "operator");
  const request = parseUpsertCosmeticRequest(payload);
  return JSON.stringify(upsertCatalogItem(nk, request.cosmetic));
};

export const rpcAdminDisableCosmetic = (
  ctx: RuntimeContext,
  _logger: RuntimeLogger,
  nk: RuntimeNakama,
  payload: string,
): string => {
  requireAdminRole(ctx, nk, "operator");
  const request = parseToggleCosmeticRequest(payload);
  return JSON.stringify(toggleCatalogItem(nk, request.cosmeticId, true));
};

export const rpcAdminEnableCosmetic = (
  ctx: RuntimeContext,
  _logger: RuntimeLogger,
  nk: RuntimeNakama,
  payload: string,
): string => {
  requireAdminRole(ctx, nk, "operator");
  const request = parseToggleCosmeticRequest(payload);
  return JSON.stringify(toggleCatalogItem(nk, request.cosmeticId, false));
};

export const rpcAdminGetRotationState = (
  ctx: RuntimeContext,
  logger: RuntimeLogger,
  nk: RuntimeNakama,
  _payload: string,
): string => {
  requireAdminRole(ctx, nk, "viewer");
  return JSON.stringify(getRotationStateForAdmin(nk, logger));
};

export const rpcAdminSetManualRotation = (
  ctx: RuntimeContext,
  logger: RuntimeLogger,
  nk: RuntimeNakama,
  payload: string,
): string => {
  requireAdminRole(ctx, nk, "operator");
  const request = parseManualRotationRequest(payload);
  const catalog = loadCatalogFromStorage(nk);
  ensureCatalogItemIdsExist(catalog, [...request.dailyRotationIds, ...request.featuredIds]);
  const rotation = updateRotationRecordWithRetry(nk, logger, catalog, (current) => ({
    ...current,
    dailyRotationIds: request.dailyRotationIds,
    featuredIds: request.featuredIds,
    generatedAt: new Date().toISOString(),
    manualOverride: true,
  }));
  return JSON.stringify(rotation satisfies StoreRotationStateResponse);
};

export const rpcAdminClearManualRotation = (
  ctx: RuntimeContext,
  logger: RuntimeLogger,
  nk: RuntimeNakama,
  _payload: string,
): string => {
  requireAdminRole(ctx, nk, "operator");
  const catalog = loadCatalogFromStorage(nk);
  const rotation = updateRotationRecordWithRetry(nk, logger, catalog, (current) => ({
    ...current,
    dailyRotationIds: [],
    featuredIds: [],
    generatedAt: new Date(0).toISOString(),
    manualOverride: false,
  }));
  return JSON.stringify(rotation satisfies StoreRotationStateResponse);
};

export const rpcAdminSetLimitedTimeEvent = (
  ctx: RuntimeContext,
  logger: RuntimeLogger,
  nk: RuntimeNakama,
  payload: string,
): string => {
  requireAdminRole(ctx, nk, "operator");
  const request = parseSetLimitedTimeEventRequest(payload);
  const catalog = loadCatalogFromStorage(nk);
  ensureCatalogItemIdsExist(catalog, request.event.cosmeticIds);
  const rotation = updateRotationRecordWithRetry(nk, logger, catalog, (current) => ({
    ...current,
    limitedTimeEvents: [
      ...current.limitedTimeEvents.filter((event) => event.id !== request.event.id),
      request.event,
    ],
  }));
  return JSON.stringify(rotation satisfies StoreRotationStateResponse);
};

export const rpcAdminRemoveLimitedTimeEvent = (
  ctx: RuntimeContext,
  logger: RuntimeLogger,
  nk: RuntimeNakama,
  payload: string,
): string => {
  requireAdminRole(ctx, nk, "operator");
  const request = parseRemoveLimitedTimeEventRequest(payload);
  const catalog = loadCatalogFromStorage(nk);
  const rotation = updateRotationRecordWithRetry(nk, logger, catalog, (current) => ({
    ...current,
    limitedTimeEvents: current.limitedTimeEvents.filter((event) => event.id !== request.eventId),
  }));
  return JSON.stringify(rotation satisfies StoreRotationStateResponse);
};

export const rpcAdminGetStoreStats = (
  ctx: RuntimeContext,
  logger: RuntimeLogger,
  nk: RuntimeNakama,
  _payload: string,
): string => {
  requireAdminRole(ctx, nk, "viewer");
  return JSON.stringify(buildStoreStats(nk, logger));
};
