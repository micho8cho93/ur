import { PREMIUM_CURRENCY_KEY, SOFT_CURRENCY_KEY } from "../../shared/wallet";
import { CATALOG_COLLECTION, CATALOG_ITEMS_KEY, getCatalog, invalidateCatalogCache } from "./cosmeticCatalog";
import {
  COSMETICS_COLLECTION,
  COSMETICS_OWNED_KEY,
  RPC_GET_OWNED_COSMETICS,
  RPC_GET_STOREFRONT,
  RPC_PURCHASE_ITEM,
  STORE_ROTATION_KEY,
  STORE_STATE_COLLECTION,
  buildStorefrontResponse,
  getOwnedCosmeticsForUser,
  purchaseCosmeticItem,
  rpcGetOwnedCosmetics,
  rpcGetStorefront,
  rpcPurchaseItem,
} from "./cosmeticStore";
import { GLOBAL_STORAGE_USER_ID } from "./progression";

type StorageObject = {
  collection: string;
  key: string;
  userId: string;
  value: unknown;
  version: string;
};

type StorageWrite = {
  collection: string;
  key: string;
  userId: string;
  value: unknown;
  version?: string;
};

const storageKey = (collection: string, key: string, userId: string): string => `${collection}:${key}:${userId}`;

const createLogger = () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
});

const createNakama = () => {
  const storage = new Map<string, StorageObject>();
  const wallets = new Map<string, Record<string, number>>();
  let versionCounter = 1;

  const applyStorageWrite = (writes: StorageWrite[]) => {
    writes.forEach((write) => {
      const key = storageKey(write.collection, write.key, write.userId);
      const existing = storage.get(key);
      const version = write.version;

      if (version === "*" && existing) {
        throw new Error(`Storage version mismatch for ${key}`);
      }
      if (typeof version === "string" && version !== "*" && version.length > 0 && existing?.version !== version) {
        throw new Error(`Storage version mismatch for ${key}`);
      }

      storage.set(key, {
        collection: write.collection,
        key: write.key,
        userId: write.userId,
        value: write.value,
        version: `v${versionCounter++}`,
      });
    });
  };

  const storageRead = jest.fn((requests: Array<{ collection: string; key: string; userId: string }>) =>
    requests
      .map((request) => storage.get(storageKey(request.collection, request.key, request.userId)))
      .filter(Boolean),
  );

  const storageWrite = jest.fn((writes: StorageWrite[]) => applyStorageWrite(writes));

  const walletsUpdate = jest.fn((updates: Array<{ userId: string; changeset: Record<string, number> }>) => {
    const nextWallets = new Map(wallets);
    updates.forEach((update) => {
      const current = nextWallets.get(update.userId) ?? {};
      const next = { ...current };
      Object.entries(update.changeset).forEach(([key, delta]) => {
        const nextAmount = (next[key] ?? 0) + delta;
        if (nextAmount < 0) {
          throw new Error("insufficient funds");
        }
        next[key] = nextAmount;
      });
      nextWallets.set(update.userId, next);
    });
    nextWallets.forEach((wallet, userId) => wallets.set(userId, wallet));
  });

  const accountGetId = jest.fn((userId: string) => ({
    wallet: wallets.get(userId) ?? {},
  }));

  storage.set(storageKey(CATALOG_COLLECTION, CATALOG_ITEMS_KEY, GLOBAL_STORAGE_USER_ID), {
    collection: CATALOG_COLLECTION,
    key: CATALOG_ITEMS_KEY,
    userId: GLOBAL_STORAGE_USER_ID,
    value: { items: getCatalog() },
    version: "catalog-v1",
  });

  return {
    storage,
    wallets,
    applyStorageWrite,
    storageRead,
    storageWrite,
    walletsUpdate,
    accountGetId,
  };
};

const seedRotation = (
  nk: ReturnType<typeof createNakama>,
  generatedAt: string,
  ids = getCatalog().slice(0, 8).map((item) => item.id),
) => {
  nk.storage.set(storageKey(STORE_STATE_COLLECTION, STORE_ROTATION_KEY, GLOBAL_STORAGE_USER_ID), {
    collection: STORE_STATE_COLLECTION,
    key: STORE_ROTATION_KEY,
    userId: GLOBAL_STORAGE_USER_ID,
    value: {
      dailyRotation: ids,
      featuredIds: getCatalog().filter((item) => item.rotationPools.includes("featured")).slice(0, 2).map((item) => item.id),
      generatedAt,
      previousDays: [],
    },
    version: "rotation-v1",
  });
};

describe("cosmetic store RPC helpers", () => {
  beforeEach(() => {
    jest.spyOn(Math, "random").mockReturnValue(0);
    invalidateCatalogCache();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("creates a missing storefront rotation and returns owned IDs", () => {
    const nk = createNakama();
    const logger = createLogger();
    nk.storage.set(storageKey(COSMETICS_COLLECTION, COSMETICS_OWNED_KEY, "user-1"), {
      collection: COSMETICS_COLLECTION,
      key: COSMETICS_OWNED_KEY,
      userId: "user-1",
      value: {
        items: [
          {
            cosmeticId: "board_cedar_001",
            acquiredAt: "2026-04-15T12:00:00.000Z",
            source: "purchase_soft",
          },
        ],
      },
      version: "owned-v1",
    });

    const response = buildStorefrontResponse(nk, logger, "user-1", new Date("2026-04-15T12:00:00.000Z"));

    expect(response.dailyRotation).toHaveLength(8);
    expect(response.ownedIds).toEqual(["board_cedar_001"]);
    expect(nk.storageWrite).toHaveBeenCalledWith([
      expect.objectContaining({
        collection: STORE_STATE_COLLECTION,
        key: STORE_ROTATION_KEY,
        userId: GLOBAL_STORAGE_USER_ID,
        version: "*",
      }),
    ]);
  });

  it("reuses a fresh storefront rotation", () => {
    const nk = createNakama();
    const logger = createLogger();
    const ids = getCatalog().slice(0, 8).map((item) => item.id);
    seedRotation(nk, "2026-04-15T00:00:00.000Z", ids);

    const response = buildStorefrontResponse(nk, logger, "user-1", new Date("2026-04-15T12:00:00.000Z"));

    expect(response.dailyRotation.map((item) => item.id)).toEqual(ids);
    expect(nk.storageWrite).not.toHaveBeenCalled();
  });

  it("regenerates a stale storefront rotation and tracks previous days", () => {
    const nk = createNakama();
    const logger = createLogger();
    const oldIds = getCatalog().slice(0, 8).map((item) => item.id);
    seedRotation(nk, "2026-04-13T00:00:00.000Z", oldIds);

    buildStorefrontResponse(nk, logger, "user-1", new Date("2026-04-15T12:00:00.000Z"));

    const stored = nk.storage.get(storageKey(STORE_STATE_COLLECTION, STORE_ROTATION_KEY, GLOBAL_STORAGE_USER_ID));
    expect((stored?.value as { previousDays: string[][] }).previousDays[0]).toEqual(oldIds);
    expect(nk.storageWrite).toHaveBeenCalled();
  });

  it("deducts currency and grants a purchased cosmetic", () => {
    const nk = createNakama();
    nk.wallets.set("user-1", { [SOFT_CURRENCY_KEY]: 1000, [PREMIUM_CURRENCY_KEY]: 0 });

    const response = purchaseCosmeticItem(nk, createLogger(), "user-1", "board_cedar_001");

    expect(response).toEqual({
      success: true,
      cosmeticId: "board_cedar_001",
      updatedWallet: {
        [SOFT_CURRENCY_KEY]: 700,
        [PREMIUM_CURRENCY_KEY]: 0,
      },
    });
    expect(getOwnedCosmeticsForUser(nk, "user-1").cosmeticIds).toEqual(["board_cedar_001"]);
  });

  it("rejects missing, duplicate, and unaffordable purchases", () => {
    const nk = createNakama();
    nk.wallets.set("user-1", { [SOFT_CURRENCY_KEY]: 1000, [PREMIUM_CURRENCY_KEY]: 0 });

    expect(() => purchaseCosmeticItem(nk, createLogger(), "user-1", "missing")).toThrow("ITEM_NOT_FOUND");
    purchaseCosmeticItem(nk, createLogger(), "user-1", "board_cedar_001");
    expect(() => purchaseCosmeticItem(nk, createLogger(), "user-1", "board_cedar_001")).toThrow("ALREADY_OWNED");
    expect(() => purchaseCosmeticItem(nk, createLogger(), "user-1", "board_obsidian_001")).toThrow("INSUFFICIENT_FUNDS");
  });

  it("retries ownership writes after OCC conflicts without repeating wallet deduction", () => {
    const nk = createNakama();
    nk.wallets.set("user-1", { [SOFT_CURRENCY_KEY]: 1000, [PREMIUM_CURRENCY_KEY]: 0 });
    nk.storageWrite
      .mockImplementationOnce(() => {
        throw new Error("storage version conflict");
      })
      .mockImplementation((writes: StorageWrite[]) => nk.applyStorageWrite(writes));

    purchaseCosmeticItem(nk, createLogger(), "user-1", "board_cedar_001");

    expect(nk.walletsUpdate).toHaveBeenCalledTimes(1);
    expect(nk.wallets.get("user-1")?.[SOFT_CURRENCY_KEY]).toBe(700);
    expect(getOwnedCosmeticsForUser(nk, "user-1").cosmeticIds).toEqual(["board_cedar_001"]);
  });

  it("exposes storefront, purchase, and owned cosmetics RPCs", () => {
    const nk = createNakama();
    const logger = createLogger();
    nk.wallets.set("user-1", { [SOFT_CURRENCY_KEY]: 1000, [PREMIUM_CURRENCY_KEY]: 0 });

    expect(JSON.parse(rpcGetStorefront({ userId: "user-1" }, logger, nk, ""))).toEqual(
      expect.objectContaining({
        dailyRotation: expect.any(Array),
        ownedIds: [],
      }),
    );
    expect(JSON.parse(rpcPurchaseItem({ userId: "user-1" }, logger, nk, JSON.stringify({ itemId: "board_cedar_001" })))).toEqual(
      expect.objectContaining({
        success: true,
        cosmeticId: "board_cedar_001",
      }),
    );
    expect(JSON.parse(rpcGetOwnedCosmetics({ userId: "user-1" }, logger, nk, ""))).toEqual({
      items: expect.any(Array),
      cosmeticIds: ["board_cedar_001"],
    });
  });

  it("exports the expected RPC names", () => {
    expect([RPC_GET_STOREFRONT, RPC_PURCHASE_ITEM, RPC_GET_OWNED_COSMETICS]).toEqual([
      "get_storefront",
      "purchase_item",
      "get_owned_cosmetics",
    ]);
  });
});
