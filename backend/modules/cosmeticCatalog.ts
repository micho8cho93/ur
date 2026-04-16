import { isCosmeticDefinition, type CosmeticDefinition } from "../../shared/cosmetics";
import {
  GLOBAL_STORAGE_USER_ID,
  MAX_WRITE_ATTEMPTS,
  STORAGE_PERMISSION_NONE,
  findStorageObject,
  getStorageObjectValue,
  getStorageObjectVersion,
  maybeSetStorageVersion,
} from "./progression";

type RuntimeNakama = any;
type RuntimeRecord = Record<string, unknown>;
type RuntimeStorageObject = RuntimeRecord & {
  value?: unknown;
  version?: string;
};

export type LoadCatalogOptions = {
  includeDisabled?: boolean;
  bypassCache?: boolean;
};

export const CATALOG_COLLECTION = "cosmetics_catalog";
export const CATALOG_ITEMS_KEY = "items";

const CATALOG_CACHE_TTL_MS = 60_000;

const RELEASED_DATE = "2026-04-15T00:00:00.000Z";

let cachedRawCatalog: CosmeticDefinition[] | null = null;
let cachedRawCatalogExpiresAt = 0;

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

const normalizeRawCatalog = (value: unknown): CosmeticDefinition[] | null => {
  const record = asRecord(value);
  const items = Array.isArray(record?.items) ? record.items : Array.isArray(value) ? value : [];
  if (!Array.isArray(items)) {
    return null;
  }

  if (!items.every(isCosmeticDefinition)) {
    return null;
  }

  return items.map((item) => ({ ...item }));
};

export const SEED_CATALOG: CosmeticDefinition[] = [
  {
    id: "board_cedar_001",
    name: "Cedar Court Board",
    tier: "common",
    type: "board",
    price: { currency: "soft", amount: 300 },
    rotationPools: ["daily"],
    rarityWeight: 0.92,
    releasedDate: RELEASED_DATE,
    assetKey: "board_cedar_001",
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
    assetKey: "board_alabaster_001",
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
    assetKey: "board_lapis_001",
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
    assetKey: "board_obsidian_001",
  },
  {
    id: "board_gold_001",
    name: "Gold Inlay Board",
    tier: "epic",
    type: "board",
    price: { currency: "premium", amount: 1000 },
    rotationPools: ["daily", "featured"],
    rarityWeight: 0.35,
    releasedDate: RELEASED_DATE,
    assetKey: "board_gold_001",
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
    assetKey: "pieces_ivory_001",
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
    assetKey: "pieces_bronze_001",
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
    assetKey: "pieces_carnelian_001",
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
    assetKey: "pieces_lapis_001",
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
    assetKey: "pieces_gold_001",
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
    assetKey: "dice_clay_001",
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
    assetKey: "dice_copper_001",
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
    assetKey: "dice_lapis_001",
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
    assetKey: "music_ancient_001",
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
    assetKey: "music_procession_001",
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
    assetKey: "sfx_stone_001",
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
    assetKey: "sfx_bronze_001",
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
    assetKey: "emote_scribe_001",
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
    assetKey: "emote_lyre_001",
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
    assetKey: "emote_king_001",
  },
];

export const invalidateCatalogCache = (): void => {
  cachedRawCatalog = null;
  cachedRawCatalogExpiresAt = 0;
};

export const readRawCatalogObject = (
  nk: RuntimeNakama,
): { object: RuntimeStorageObject | null; items: CosmeticDefinition[] | null } => {
  const objects = nk.storageRead([
    {
      collection: CATALOG_COLLECTION,
      key: CATALOG_ITEMS_KEY,
      userId: GLOBAL_STORAGE_USER_ID,
    },
  ]) as RuntimeStorageObject[];
  const object = findStorageObject(objects, CATALOG_COLLECTION, CATALOG_ITEMS_KEY, GLOBAL_STORAGE_USER_ID);

  return {
    object,
    items: normalizeRawCatalog(getStorageObjectValue(object)),
  };
};

export const writeRawCatalog = (
  nk: RuntimeNakama,
  items: CosmeticDefinition[],
  version: string | null,
): void => {
  nk.storageWrite([
    maybeSetStorageVersion({
      collection: CATALOG_COLLECTION,
      key: CATALOG_ITEMS_KEY,
      userId: GLOBAL_STORAGE_USER_ID,
      value: { items },
      permissionRead: STORAGE_PERMISSION_NONE,
      permissionWrite: STORAGE_PERMISSION_NONE,
    }, version),
  ]);
  invalidateCatalogCache();
};

export const writeRawCatalogWithRetry = (
  nk: RuntimeNakama,
  update: (items: CosmeticDefinition[]) => CosmeticDefinition[],
): CosmeticDefinition[] => {
  for (let attempt = 1; attempt <= MAX_WRITE_ATTEMPTS; attempt += 1) {
    const { object, items } = readRawCatalogObject(nk);
    const currentItems = items ?? SEED_CATALOG;
    const nextItems = update(currentItems.map((item) => ({ ...item })));

    if (!nextItems.every(isCosmeticDefinition)) {
      throw new Error("INVALID_CATALOG");
    }

    try {
      writeRawCatalog(nk, nextItems, object ? (getStorageObjectVersion(object) ?? "") : "*");
      return nextItems;
    } catch (error) {
      if (!isVersionConflict(error) || attempt === MAX_WRITE_ATTEMPTS) {
        throw error;
      }
    }
  }

  throw new Error("CATALOG_WRITE_FAILED");
};

export const loadCatalogFromStorage = (
  nk: RuntimeNakama,
  options: LoadCatalogOptions = {},
): CosmeticDefinition[] => {
  const now = Date.now();
  let rawItems = cachedRawCatalog;

  if (options.bypassCache || !rawItems || now >= cachedRawCatalogExpiresAt) {
    const { object, items } = readRawCatalogObject(nk);
    rawItems = items ?? SEED_CATALOG;

    if (!object || !items) {
      writeRawCatalog(nk, rawItems, object ? (getStorageObjectVersion(object) ?? "") : "*");
    }

    cachedRawCatalog = rawItems.map((item) => ({ ...item }));
    cachedRawCatalogExpiresAt = now + CATALOG_CACHE_TTL_MS;
  }

  const catalog = rawItems.map((item) => ({ ...item }));
  return options.includeDisabled ? catalog : catalog.filter((item) => !item.disabled);
};

export const getCatalog = (): CosmeticDefinition[] => [...SEED_CATALOG];

export const getCosmeticById = (id: string, catalog: CosmeticDefinition[] = SEED_CATALOG): CosmeticDefinition | undefined =>
  catalog.find((cosmetic) => cosmetic.id === id);
