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
import { EQUIPPED_EMOJI_SLOT_COUNT } from '@/shared/emojiReactions';
import { useAuth } from '@/src/auth/useAuth';
import { useStore } from '@/src/store/StoreProvider';

type InventoryLoadout = Record<CosmeticType, string | null>;

type EmoteLoadout = Array<string | null>;

type StoredInventoryLoadoutV1 = {
  version: 1;
  equippedIdsByType: Partial<InventoryLoadout>;
};

type StoredInventoryLoadoutV2 = {
  version: 2;
  equippedIdsByType: Partial<InventoryLoadout>;
  equippedEmoteIds: EmoteLoadout;
};

type StoredInventoryLoadout = StoredInventoryLoadoutV1 | StoredInventoryLoadoutV2;

type ResolvedInventoryLoadout = {
  equippedIdsByType: InventoryLoadout;
  equippedEmoteIds: EmoteLoadout;
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
  equippedEmoteIds: EmoteLoadout;
  equippedEmoteCosmetics: Array<CosmeticDefinition | null>;
  equippedTheme: CosmeticTheme;
  refresh: () => Promise<void>;
  equipCosmetic: (cosmetic: CosmeticDefinition) => Promise<void>;
  unequipCosmetic: (type: CosmeticType) => Promise<void>;
  unequipEmoteCosmetic: (cosmeticId: string) => Promise<void>;
  unequipEmoteSlot: (slotIndex: number) => Promise<void>;
  resetLoadout: () => Promise<void>;
  isEquipped: (cosmeticId: string) => boolean;
};

const INVENTORY_LOADOUT_KEY_PREFIX = 'inventory.loadout.v1';
const INVENTORY_COSMETIC_TYPES: CosmeticType[] = [
  'board',
  'pieces',
  'dice_animation',
  'music',
  'sound_effect',
  'emote',
];

const EMOTE_SLOT_COUNT = EQUIPPED_EMOJI_SLOT_COUNT;
const EQUIPPABLE_COSMETIC_TYPES: Exclude<CosmeticType, 'emote'>[] = [
  'board',
  'pieces',
  'dice_animation',
  'music',
  'sound_effect',
];

const createEmptyLoadout = (): InventoryLoadout =>
  INVENTORY_COSMETIC_TYPES.reduce((loadout, type) => {
    loadout[type] = null;
    return loadout;
  }, {} as InventoryLoadout);

const createEmptyCosmeticTypeMap = (): Record<CosmeticType, InventoryCosmeticEntry[]> =>
  INVENTORY_COSMETIC_TYPES.reduce((map, type) => {
    map[type] = [];
    return map;
  }, {} as Record<CosmeticType, InventoryCosmeticEntry[]>);

const createEmptyEmoteLoadout = (): EmoteLoadout => Array.from({ length: EMOTE_SLOT_COUNT }, () => null);

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

const createResolvedLoadout = (): ResolvedInventoryLoadout => ({
  equippedIdsByType: createEmptyLoadout(),
  equippedEmoteIds: createEmptyEmoteLoadout(),
});

const readStoredLoadout = async (userId: string): Promise<ResolvedInventoryLoadout> => {
  const rawValue = await AsyncStorage.getItem(`${INVENTORY_LOADOUT_KEY_PREFIX}.${userId}`);

  if (!rawValue) {
    return createResolvedLoadout();
  }

  try {
    const parsed = JSON.parse(rawValue) as Partial<StoredInventoryLoadout>;

    const equippedIdsByType = parsed.equippedIdsByType;

    if (parsed.version !== 1 && parsed.version !== 2) {
      return createResolvedLoadout();
    }

    if (!equippedIdsByType || typeof equippedIdsByType !== 'object') {
      return createResolvedLoadout();
    }

    const loadout = createResolvedLoadout();

    INVENTORY_COSMETIC_TYPES.forEach((type) => {
      const candidate = equippedIdsByType[type];
      loadout.equippedIdsByType[type] = typeof candidate === 'string' && candidate.trim().length > 0 ? candidate : null;
    });

    if (parsed.version === 2 && Array.isArray(parsed.equippedEmoteIds)) {
      loadout.equippedEmoteIds = parsed.equippedEmoteIds
        .slice(0, EMOTE_SLOT_COUNT)
        .map((candidate) => (typeof candidate === 'string' && candidate.trim().length > 0 ? candidate : null));
      while (loadout.equippedEmoteIds.length < EMOTE_SLOT_COUNT) {
        loadout.equippedEmoteIds.push(null);
      }
    }

    return loadout;
  } catch {
    return createResolvedLoadout();
  }
};

const saveLoadout = async (userId: string, loadout: ResolvedInventoryLoadout): Promise<void> => {
  const payload: StoredInventoryLoadout = {
    version: 2,
    equippedIdsByType: loadout.equippedIdsByType,
    equippedEmoteIds: loadout.equippedEmoteIds,
  };

  await AsyncStorage.setItem(`${INVENTORY_LOADOUT_KEY_PREFIX}.${userId}`, JSON.stringify(payload));
};

const sanitizeLoadout = (
  loadout: ResolvedInventoryLoadout,
  ownedIds: Set<string>,
  catalogById: Map<string, CosmeticDefinition>,
): ResolvedInventoryLoadout => {
  const nextLoadout = createResolvedLoadout();

  EQUIPPABLE_COSMETIC_TYPES.forEach((type) => {
    const cosmeticId = loadout.equippedIdsByType[type];
    if (!cosmeticId || !ownedIds.has(cosmeticId)) {
      return;
    }

    const cosmetic = catalogById.get(cosmeticId);
    if (!cosmetic || cosmetic.type !== type) {
      return;
    }

    nextLoadout.equippedIdsByType[type] = cosmeticId;
  });

  const emoteCandidates = [...loadout.equippedEmoteIds];
  if (loadout.equippedIdsByType.emote) {
    emoteCandidates.unshift(loadout.equippedIdsByType.emote);
  }

  const seenEmoteIds = new Set<string>();
  emoteCandidates.slice(0, EMOTE_SLOT_COUNT).forEach((cosmeticId, index) => {
    if (!cosmeticId || !ownedIds.has(cosmeticId) || seenEmoteIds.has(cosmeticId)) {
      return;
    }

    const cosmetic = catalogById.get(cosmeticId);
    if (!cosmetic || cosmetic.type !== 'emote') {
      return;
    }

    seenEmoteIds.add(cosmeticId);
    nextLoadout.equippedEmoteIds[index] = cosmeticId;
  });

  nextLoadout.equippedIdsByType.emote = nextLoadout.equippedEmoteIds[0] ?? null;

  return nextLoadout;
};

const InventoryContext = createContext<InventoryContextValue | undefined>(undefined);

export const InventoryProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const { user, isLoading: isAuthLoading } = useAuth();
  const {
    storefront,
    loading: isStoreLoading,
    errorMessage: storeErrorMessage,
    refresh: refreshStorefront,
  } = useStore();
  const [catalogItems, setCatalogItems] = useState<CosmeticDefinition[]>([]);
  const [equippedIdsByType, setEquippedIdsByType] = useState<InventoryLoadout>(createEmptyLoadout());
  const [equippedEmoteIds, setEquippedEmoteIds] = useState<EmoteLoadout>(createEmptyEmoteLoadout());
  const [isCatalogLoading, setIsCatalogLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const activeUserIdRef = useRef<string | null>(null);
  const requestIdRef = useRef(0);
  const storefrontRef = useRef(storefront);
  storefrontRef.current = storefront;

  const refresh = useCallback(async () => {
    if (!user) {
      activeUserIdRef.current = null;
      requestIdRef.current += 1;
      setCatalogItems([]);
      setEquippedIdsByType(createEmptyLoadout());
      setEquippedEmoteIds(createEmptyEmoteLoadout());
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
      const [nextCatalogItems, nextLoadout, nextStorefront] = await Promise.all([
        getFullCatalog(),
        readStoredLoadout(user.id),
        refreshStorefront({ silent: true }),
      ]);

      if (requestIdRef.current !== requestId) {
        return;
      }

      const catalogById = new Map(nextCatalogItems.items.map((item) => [item.id, item]));
      const freshOwnedIds = new Set((nextStorefront ?? storefrontRef.current)?.ownedIds ?? []);
      const sanitizedLoadout = sanitizeLoadout(nextLoadout, freshOwnedIds, catalogById);

      setCatalogItems(nextCatalogItems.items);
      setEquippedIdsByType(sanitizedLoadout.equippedIdsByType);
      setEquippedEmoteIds(sanitizedLoadout.equippedEmoteIds);
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
  }, [refreshStorefront, user]);

  useEffect(() => {
    if (isAuthLoading || isStoreLoading) {
      return;
    }

    if (!user) {
      activeUserIdRef.current = null;
      requestIdRef.current += 1;
      setCatalogItems([]);
      setEquippedIdsByType(createEmptyLoadout());
      setEquippedEmoteIds(createEmptyEmoteLoadout());
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
    const sanitizedLoadout = sanitizeLoadout(
      {
        equippedIdsByType,
        equippedEmoteIds,
      },
      ownedIds,
      catalogById,
    );

    if (
      INVENTORY_COSMETIC_TYPES.every((type) => sanitizedLoadout.equippedIdsByType[type] === equippedIdsByType[type]) &&
      sanitizedLoadout.equippedEmoteIds.every((item, index) => item === equippedEmoteIds[index])
    ) {
      return;
    }

    setEquippedIdsByType(sanitizedLoadout.equippedIdsByType);
    setEquippedEmoteIds(sanitizedLoadout.equippedEmoteIds);
    void saveLoadout(user.id, sanitizedLoadout);
  }, [catalogItems, equippedEmoteIds, equippedIdsByType, isStoreLoading, storefront, user]);

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
        isEquipped:
          item.type === 'emote'
            ? equippedEmoteIds.includes(item.id)
            : equippedIdsByType[item.type] === item.id,
      });
    });

    INVENTORY_COSMETIC_TYPES.forEach((type) => {
      grouped[type] = sortCosmetics(grouped[type]) as InventoryCosmeticEntry[];
    });

    return grouped;
  }, [equippedEmoteIds, equippedIdsByType, ownedDefinitions]);

  const equippedCosmeticsByType = useMemo(() => {
    const nextEquipped: Partial<Record<CosmeticType, CosmeticDefinition>> = {};

    EQUIPPABLE_COSMETIC_TYPES.forEach((type) => {
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

    const firstEquippedEmoteId = equippedEmoteIds[0] ?? null;
    if (firstEquippedEmoteId && ownedIds.has(firstEquippedEmoteId)) {
      const cosmetic = catalogById.get(firstEquippedEmoteId);
      if (cosmetic && cosmetic.type === 'emote') {
        nextEquipped.emote = cosmetic;
      }
    }

    return nextEquipped;
  }, [catalogById, equippedEmoteIds, equippedIdsByType, ownedIds]);

  const equippedEmoteCosmetics = useMemo(
    () =>
      equippedEmoteIds.map((cosmeticId) => {
        if (!cosmeticId || !ownedIds.has(cosmeticId)) {
          return null;
        }

        const cosmetic = catalogById.get(cosmeticId);
        if (!cosmetic || cosmetic.type !== 'emote') {
          return null;
        }

        return cosmetic;
      }),
    [catalogById, equippedEmoteIds, ownedIds],
  );

  const equippedTheme = useMemo(
    () =>
      EQUIPPABLE_COSMETIC_TYPES.reduce((theme, type) => {
        const cosmetic = equippedCosmeticsByType[type];
        if (!cosmetic) {
          return theme;
        }

        return mergeCosmeticThemes(theme, cosmeticDefinitionToTheme(cosmetic));
      }, {} as CosmeticTheme),
    [equippedCosmeticsByType],
  );

  const persistLoadout = useCallback(
    async (nextLoadout: ResolvedInventoryLoadout) => {
      if (!user) {
        return;
      }

      await saveLoadout(user.id, nextLoadout);
    },
    [user],
  );

  const updateLoadout = useCallback(
    async (
      updater: (current: ResolvedInventoryLoadout) => ResolvedInventoryLoadout,
    ) => {
      if (!user) {
        return;
      }

      const currentLoadout: ResolvedInventoryLoadout = {
        equippedIdsByType,
        equippedEmoteIds,
      };
      const nextLoadout = updater(currentLoadout);
      setEquippedIdsByType(nextLoadout.equippedIdsByType);
      setEquippedEmoteIds(nextLoadout.equippedEmoteIds);
      await persistLoadout(nextLoadout);
    },
    [equippedEmoteIds, equippedIdsByType, persistLoadout, user],
  );

  const equipCosmetic = useCallback(
    async (cosmetic: CosmeticDefinition) => {
      if (!ownedIds.has(cosmetic.id) || !user) {
        return;
      }

      if (cosmetic.type === 'emote') {
        await updateLoadout((current) => {
          if (current.equippedEmoteIds.includes(cosmetic.id)) {
            return current;
          }

          const nextEmoteIds = [...current.equippedEmoteIds];
          const nextEmoteIndex = nextEmoteIds.findIndex((item) => item == null);
          if (nextEmoteIndex < 0) {
            return current;
          }

          nextEmoteIds[nextEmoteIndex] = cosmetic.id;

          return {
            equippedIdsByType: {
              ...current.equippedIdsByType,
              emote: nextEmoteIds[0] ?? null,
            },
            equippedEmoteIds: nextEmoteIds,
          };
        });
        return;
      }

      await updateLoadout((current) => ({
        equippedIdsByType: {
          ...current.equippedIdsByType,
          [cosmetic.type]: cosmetic.id,
        },
        equippedEmoteIds: current.equippedEmoteIds,
      }));
    },
    [ownedIds, updateLoadout, user],
  );

  const unequipCosmetic = useCallback(
    async (type: CosmeticType) => {
      if (!user) {
        return;
      }

      if (type === 'emote') {
        await updateLoadout((current) => ({
          equippedIdsByType: {
            ...current.equippedIdsByType,
            emote: null,
          },
          equippedEmoteIds: createEmptyEmoteLoadout(),
        }));
        return;
      }

      await updateLoadout((current) => ({
        equippedIdsByType: {
          ...current.equippedIdsByType,
          [type]: null,
        },
        equippedEmoteIds: current.equippedEmoteIds,
      }));
    },
    [updateLoadout, user],
  );

  const unequipEmoteCosmetic = useCallback(
    async (cosmeticId: string) => {
      if (!user) {
        return;
      }

      await updateLoadout((current) => {
        const nextEmoteIds = current.equippedEmoteIds.map((item) => (item === cosmeticId ? null : item));
        return {
          equippedIdsByType: {
            ...current.equippedIdsByType,
            emote: nextEmoteIds[0] ?? null,
          },
          equippedEmoteIds: nextEmoteIds,
        };
      });
    },
    [updateLoadout, user],
  );

  const unequipEmoteSlot = useCallback(
    async (slotIndex: number) => {
      if (!user || slotIndex < 0 || slotIndex >= EMOTE_SLOT_COUNT) {
        return;
      }

      await updateLoadout((current) => {
        const nextEmoteIds = [...current.equippedEmoteIds];
        nextEmoteIds[slotIndex] = null;
        return {
          equippedIdsByType: {
            ...current.equippedIdsByType,
            emote: nextEmoteIds[0] ?? null,
          },
          equippedEmoteIds: nextEmoteIds,
        };
      });
    },
    [updateLoadout, user],
  );

  const resetLoadout = useCallback(async () => {
    if (!user) {
      return;
    }

    const nextLoadout = createResolvedLoadout();
    setEquippedIdsByType(nextLoadout.equippedIdsByType);
    setEquippedEmoteIds(nextLoadout.equippedEmoteIds);
    await persistLoadout(nextLoadout);
  }, [persistLoadout, user]);

  const isEquipped = useCallback(
    (cosmeticId: string) =>
      INVENTORY_COSMETIC_TYPES.some((type) => equippedIdsByType[type] === cosmeticId) ||
      equippedEmoteIds.includes(cosmeticId),
    [equippedEmoteIds, equippedIdsByType],
  );

  const value = useMemo<InventoryContextValue>(
    () => ({
      isLoading: isAuthLoading || isStoreLoading || isCatalogLoading,
      errorMessage: errorMessage ?? (storefront != null ? null : storeErrorMessage),
      ownedCosmetics: ownedDefinitions.map((item) => ({
        ...item,
        isEquipped: isEquipped(item.id),
      })),
      ownedCosmeticsByType,
      equippedIdsByType,
      equippedCosmeticsByType,
      equippedEmoteIds,
      equippedEmoteCosmetics,
      equippedTheme,
      refresh,
      equipCosmetic,
      unequipCosmetic,
      unequipEmoteCosmetic,
      unequipEmoteSlot,
      resetLoadout,
      isEquipped,
    }),
    [
      equippedCosmeticsByType,
      equippedIdsByType,
      equippedEmoteCosmetics,
      equippedEmoteIds,
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
      unequipEmoteCosmetic,
      unequipEmoteSlot,
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
