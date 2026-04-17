import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { getFullCatalog } from '@/services/cosmetics';
import { cosmeticDefinitionToTheme } from '@/shared/cosmeticTheme';
import type { CosmeticDefinition, CosmeticType } from '@/shared/cosmetics';
import type { CosmeticTheme } from '@/shared/cosmeticTheme';
import { useAuth } from '@/src/auth/useAuth';
import { useStore } from '@/src/store/StoreProvider';

type InventoryLoadout = Record<CosmeticType, string | null>;

type StoredInventoryLoadout = {
  version: 1;
  equippedIdsByType: Partial<InventoryLoadout>;
};

type InventoryCosmeticEntry = CosmeticDefinition & {
  isEquipped: boolean;
};

export type InventoryContextValue = {
  isLoading: boolean;
  errorMessage: string | null;
  ownedCosmetics: InventoryCosmeticEntry[];
  ownedCosmeticsByType: Record<CosmeticType, InventoryCosmeticEntry[]>;
  equippedIdsByType: InventoryLoadout;
  equippedCosmeticsByType: Partial<Record<CosmeticType, CosmeticDefinition>>;
  equippedTheme: CosmeticTheme;
  refresh: () => Promise<void>;
  equipCosmetic: (cosmetic: CosmeticDefinition) => Promise<void>;
  unequipCosmetic: (type: CosmeticType) => Promise<void>;
  resetLoadout: () => Promise<void>;
  isEquipped: (cosmeticId: string) => boolean;
};

const INVENTORY_LOADOUT_KEY_PREFIX = 'inventory.loadout.v1';
const COSMETIC_TYPES: CosmeticType[] = [
  'board',
  'pieces',
  'dice_animation',
  'music',
  'sound_effect',
  'emote',
];

const createEmptyLoadout = (): InventoryLoadout =>
  COSMETIC_TYPES.reduce((loadout, type) => {
    loadout[type] = null;
    return loadout;
  }, {} as InventoryLoadout);

const createEmptyCosmeticTypeMap = (): Record<CosmeticType, InventoryCosmeticEntry[]> =>
  COSMETIC_TYPES.reduce((map, type) => {
    map[type] = [];
    return map;
  }, {} as Record<CosmeticType, InventoryCosmeticEntry[]>);

const tierRank: Record<CosmeticDefinition['tier'], number> = {
  legendary: 4,
  epic: 3,
  rare: 2,
  common: 1,
};

const sortCosmetics = (items: CosmeticDefinition[]): CosmeticDefinition[] =>
  [...items].sort((left, right) => {
    const tierDelta = tierRank[right.tier] - tierRank[left.tier];
    if (tierDelta !== 0) {
      return tierDelta;
    }

    return left.name.localeCompare(right.name);
  });

const mergeCosmeticThemes = (base: CosmeticTheme, override: CosmeticTheme): CosmeticTheme => ({
  ...(base.board || override.board ? { board: { ...base.board, ...override.board } } : {}),
  ...(base.pieces || override.pieces ? { pieces: { ...base.pieces, ...override.pieces } } : {}),
  ...(base.dice || override.dice ? { dice: { ...base.dice, ...override.dice } } : {}),
  ...(base.music || override.music ? { music: { ...base.music, ...override.music } } : {}),
  ...(base.soundEffects || override.soundEffects
    ? { soundEffects: { ...base.soundEffects, ...override.soundEffects } }
    : {}),
});

const readStoredLoadout = async (userId: string): Promise<InventoryLoadout> => {
  const rawValue = await AsyncStorage.getItem(`${INVENTORY_LOADOUT_KEY_PREFIX}.${userId}`);

  if (!rawValue) {
    return createEmptyLoadout();
  }

  try {
    const parsed = JSON.parse(rawValue) as Partial<StoredInventoryLoadout>;

    const equippedIdsByType = parsed.equippedIdsByType;

    if (parsed.version !== 1 || !equippedIdsByType || typeof equippedIdsByType !== 'object') {
      return createEmptyLoadout();
    }

    const loadout = createEmptyLoadout();

    COSMETIC_TYPES.forEach((type) => {
      const candidate = equippedIdsByType[type];
      loadout[type] = typeof candidate === 'string' && candidate.trim().length > 0 ? candidate : null;
    });

    return loadout;
  } catch {
    return createEmptyLoadout();
  }
};

const saveLoadout = async (userId: string, loadout: InventoryLoadout): Promise<void> => {
  const payload: StoredInventoryLoadout = {
    version: 1,
    equippedIdsByType: loadout,
  };

  await AsyncStorage.setItem(`${INVENTORY_LOADOUT_KEY_PREFIX}.${userId}`, JSON.stringify(payload));
};

const sanitizeLoadout = (
  loadout: InventoryLoadout,
  ownedIds: Set<string>,
  catalogById: Map<string, CosmeticDefinition>,
): InventoryLoadout => {
  const nextLoadout = createEmptyLoadout();

  COSMETIC_TYPES.forEach((type) => {
    const cosmeticId = loadout[type];
    if (!cosmeticId || !ownedIds.has(cosmeticId)) {
      return;
    }

    const cosmetic = catalogById.get(cosmeticId);
    if (!cosmetic || cosmetic.type !== type) {
      return;
    }

    nextLoadout[type] = cosmeticId;
  });

  return nextLoadout;
};

const InventoryContext = createContext<InventoryContextValue | undefined>(undefined);

export const InventoryProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const { user, isLoading: isAuthLoading } = useAuth();
  const {
    storefront,
    loading: isStoreLoading,
    errorMessage: storeErrorMessage,
  } = useStore();
  const [catalogItems, setCatalogItems] = useState<CosmeticDefinition[]>([]);
  const [equippedIdsByType, setEquippedIdsByType] = useState<InventoryLoadout>(createEmptyLoadout());
  const [isCatalogLoading, setIsCatalogLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const activeUserIdRef = useRef<string | null>(null);
  const requestIdRef = useRef(0);

  const refresh = useCallback(async () => {
    if (!user) {
      activeUserIdRef.current = null;
      requestIdRef.current += 1;
      setCatalogItems([]);
      setEquippedIdsByType(createEmptyLoadout());
      setErrorMessage(null);
      setIsCatalogLoading(false);
      return;
    }

    requestIdRef.current += 1;
    const requestId = requestIdRef.current;
    activeUserIdRef.current = user.id;
    setIsCatalogLoading(true);
    setErrorMessage(null);

    try {
      const [nextCatalogItems, nextLoadout] = await Promise.all([
        getFullCatalog(),
        readStoredLoadout(user.id),
      ]);

      if (requestIdRef.current !== requestId) {
        return;
      }

      const catalogById = new Map(nextCatalogItems.items.map((item) => [item.id, item]));
      const sanitizedLoadout = storefront
        ? sanitizeLoadout(nextLoadout, new Set(storefront.ownedIds ?? []), catalogById)
        : nextLoadout;

      setCatalogItems(nextCatalogItems.items);
      setEquippedIdsByType(sanitizedLoadout);
    } catch (error) {
      if (requestIdRef.current !== requestId) {
        return;
      }

      setErrorMessage(error instanceof Error ? error.message : 'Unable to load inventory.');
    } finally {
      if (requestIdRef.current === requestId) {
        setIsCatalogLoading(false);
      }
    }
  }, [storefront?.ownedIds, user]);

  useEffect(() => {
    if (isAuthLoading || isStoreLoading) {
      return;
    }

    if (!user) {
      activeUserIdRef.current = null;
      requestIdRef.current += 1;
      setCatalogItems([]);
      setEquippedIdsByType(createEmptyLoadout());
      setErrorMessage(null);
      setIsCatalogLoading(false);
      return;
    }

    if (activeUserIdRef.current !== user.id) {
      void refresh();
    }
  }, [isAuthLoading, isStoreLoading, refresh, user]);

  useEffect(() => {
    if (!user || !catalogItems.length || isStoreLoading || !storefront) {
      return;
    }

    const catalogById = new Map(catalogItems.map((item) => [item.id, item]));
    const ownedIds = new Set(storefront?.ownedIds ?? []);
    const sanitizedLoadout = sanitizeLoadout(equippedIdsByType, ownedIds, catalogById);

    if (COSMETIC_TYPES.every((type) => sanitizedLoadout[type] === equippedIdsByType[type])) {
      return;
    }

    setEquippedIdsByType(sanitizedLoadout);
    void saveLoadout(user.id, sanitizedLoadout);
  }, [catalogItems, equippedIdsByType, isStoreLoading, storefront, user]);

  const catalogById = useMemo(
    () => new Map(catalogItems.map((item) => [item.id, item])),
    [catalogItems],
  );

  const ownedIds = useMemo(() => new Set(storefront?.ownedIds ?? []), [storefront?.ownedIds]);

  const ownedDefinitions = useMemo(
    () => sortCosmetics(catalogItems.filter((item) => ownedIds.has(item.id))),
    [catalogItems, ownedIds],
  );

  const ownedCosmeticsByType = useMemo(() => {
    const grouped = createEmptyCosmeticTypeMap();

    ownedDefinitions.forEach((item) => {
      grouped[item.type].push({
        ...item,
        isEquipped: equippedIdsByType[item.type] === item.id,
      });
    });

    COSMETIC_TYPES.forEach((type) => {
      grouped[type] = sortCosmetics(grouped[type]) as InventoryCosmeticEntry[];
    });

    return grouped;
  }, [equippedIdsByType, ownedDefinitions]);

  const equippedCosmeticsByType = useMemo(() => {
    const nextEquipped: Partial<Record<CosmeticType, CosmeticDefinition>> = {};

    COSMETIC_TYPES.forEach((type) => {
      const cosmeticId = equippedIdsByType[type];
      if (!cosmeticId || !ownedIds.has(cosmeticId)) {
        return;
      }

      const cosmetic = catalogById.get(cosmeticId);
      if (!cosmetic || cosmetic.type !== type) {
        return;
      }

      nextEquipped[type] = cosmetic;
    });

    return nextEquipped;
  }, [catalogById, equippedIdsByType, ownedIds]);

  const equippedTheme = useMemo(
    () =>
      COSMETIC_TYPES.reduce((theme, type) => {
        const cosmetic = equippedCosmeticsByType[type];
        if (!cosmetic) {
          return theme;
        }

        return mergeCosmeticThemes(theme, cosmeticDefinitionToTheme(cosmetic));
      }, {} as CosmeticTheme),
    [equippedCosmeticsByType],
  );

  const persistLoadout = useCallback(
    async (nextLoadout: InventoryLoadout) => {
      if (!user) {
        return;
      }

      await saveLoadout(user.id, nextLoadout);
    },
    [user],
  );

  const updateLoadout = useCallback(
    async (updater: (current: InventoryLoadout) => InventoryLoadout) => {
      if (!user) {
        return;
      }

      const nextLoadout = updater(equippedIdsByType);
      setEquippedIdsByType(nextLoadout);

      await persistLoadout(nextLoadout);
    },
    [equippedIdsByType, persistLoadout, user],
  );

  const equipCosmetic = useCallback(
    async (cosmetic: CosmeticDefinition) => {
      if (!ownedIds.has(cosmetic.id) || !user) {
        return;
      }

      await updateLoadout((current) => ({
        ...current,
        [cosmetic.type]: cosmetic.id,
      }));
    },
    [ownedIds, updateLoadout, user],
  );

  const unequipCosmetic = useCallback(
    async (type: CosmeticType) => {
      if (!user) {
        return;
      }

      await updateLoadout((current) => ({
        ...current,
        [type]: null,
      }));
    },
    [updateLoadout, user],
  );

  const resetLoadout = useCallback(async () => {
    if (!user) {
      return;
    }

    const nextLoadout = createEmptyLoadout();
    setEquippedIdsByType(nextLoadout);
    await persistLoadout(nextLoadout);
  }, [persistLoadout, user]);

  const isEquipped = useCallback(
    (cosmeticId: string) => COSMETIC_TYPES.some((type) => equippedIdsByType[type] === cosmeticId),
    [equippedIdsByType],
  );

  const value = useMemo<InventoryContextValue>(
    () => ({
      isLoading: isAuthLoading || isStoreLoading || isCatalogLoading,
      errorMessage: errorMessage ?? storeErrorMessage,
      ownedCosmetics: ownedDefinitions.map((item) => ({
        ...item,
        isEquipped: isEquipped(item.id),
      })),
      ownedCosmeticsByType,
      equippedIdsByType,
      equippedCosmeticsByType,
      equippedTheme,
      refresh,
      equipCosmetic,
      unequipCosmetic,
      resetLoadout,
      isEquipped,
    }),
    [
      equippedCosmeticsByType,
      equippedIdsByType,
      equippedTheme,
      errorMessage,
      equipCosmetic,
      isAuthLoading,
      isCatalogLoading,
      isEquipped,
      isStoreLoading,
      ownedCosmeticsByType,
      ownedDefinitions,
      refresh,
      resetLoadout,
      storeErrorMessage,
      unequipCosmetic,
    ],
  );

  return <InventoryContext.Provider value={value}>{children}</InventoryContext.Provider>;
};

export const useInventory = (): InventoryContextValue => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider.');
  }

  return context;
};
