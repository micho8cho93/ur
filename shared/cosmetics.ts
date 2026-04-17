import { PREMIUM_CURRENCY_KEY, SOFT_CURRENCY_KEY, type WalletBalances } from "./wallet";

export type CosmeticTier = "common" | "rare" | "epic" | "legendary";
export type CosmeticType = "board" | "pieces" | "dice_animation" | "emote" | "music" | "sound_effect";
export type CurrencyType = "soft" | "premium";
export type RotationPool = "daily" | "featured" | "limited";
export type CosmeticAssetMediaType = "image" | "audio" | "video" | "animation";

// Cosmetic uploads are embedded directly into Nakama RPC payloads and catalog
// storage, so we keep them well below the transport/storage ceiling.
export const MAX_INLINE_COSMETIC_UPLOAD_BYTES = 3 * 1024 * 1024;

export type UploadedCosmeticAsset = {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  mediaType: CosmeticAssetMediaType;
  dataUrl: string;
  uploadedAt: string;
};

export type CosmeticDefinition = {
  id: string;
  name: string;
  tier: CosmeticTier;
  type: CosmeticType;
  price: {
    currency: CurrencyType;
    amount: number;
  };
  rotationPools: RotationPool[];
  rarityWeight: number;
  availabilityWindow?: {
    start: string;
    end: string;
  };
  releasedDate: string;
  assetKey: string;
  uploadedAsset?: UploadedCosmeticAsset;
  disabled?: boolean;
};

export type FullCatalogResponse = {
  items: CosmeticDefinition[];
};

export type LimitedTimeEvent = {
  id: string;
  name: string;
  cosmeticIds: string[];
  startsAt: string;
  endsAt: string;
  disabled?: boolean;
};

export type OwnedCosmetic = {
  cosmeticId: string;
  acquiredAt: string;
  source: "purchase_soft" | "purchase_premium" | "tournament_reward" | "gift";
};

export type BundleDefinition = {
  id: string;
  name: string;
  cosmeticIds: string[];
  price: {
    currency: CurrencyType;
    amount: number;
  };
  availabilityWindow?: {
    start: string;
    end: string;
  };
  assetKey: string;
};

export type StorefrontResponse = {
  dailyRotation: CosmeticDefinition[];
  featured: CosmeticDefinition[];
  limitedTime: CosmeticDefinition[];
  bundles: BundleDefinition[];
  ownedIds: string[];
  rotationExpiresAt: string;
};

export type PurchaseItemRequest = {
  itemId: string;
};

export type PurchaseItemResponse = {
  success: true;
  cosmeticId: string;
  updatedWallet: Pick<WalletBalances, typeof SOFT_CURRENCY_KEY | typeof PREMIUM_CURRENCY_KEY>;
};

export type OwnedCosmeticsResponse = {
  items: OwnedCosmetic[];
  cosmeticIds: string[];
};

export type StoreRotationStateResponse = {
  dailyRotationIds: string[];
  featuredIds: string[];
  generatedAt: string;
  previousDays: string[][];
  manualOverride: boolean;
  limitedTimeEvents: LimitedTimeEvent[];
};

export type AdminUpsertCosmeticRequest = {
  cosmetic: Partial<Omit<CosmeticDefinition, "uploadedAsset">> & {
    id: string;
    uploadedAsset?: UploadedCosmeticAsset | null;
  };
};

export type AdminToggleCosmeticRequest = {
  cosmeticId: string;
};

export type AdminDeleteCosmeticRequest = {
  cosmeticId: string;
};

export type AdminCosmeticMutationResponse = {
  success: true;
  item: CosmeticDefinition;
};

export type AdminDeleteCosmeticResponse = {
  success: true;
  cosmeticId: string;
};

export type AdminSetManualRotationRequest = {
  dailyRotationIds: string[];
  featuredIds: string[];
};

export type AdminSetLimitedTimeEventRequest = {
  event: LimitedTimeEvent;
};

export type AdminRemoveLimitedTimeEventRequest = {
  eventId: string;
};

export type StoreStatsItem = {
  cosmeticId: string;
  purchaseCount: number;
  softCurrencySpent: number;
  premiumCurrencySpent: number;
};

export type StoreStatsResponse = {
  totalPurchases: number;
  totalSoftCurrencySpent: number;
  totalPremiumCurrencySpent: number;
  items: StoreStatsItem[];
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((entry) => typeof entry === "string");

export const isCosmeticTier = (value: unknown): value is CosmeticTier =>
  value === "common" || value === "rare" || value === "epic" || value === "legendary";

export const isCosmeticType = (value: unknown): value is CosmeticType =>
  value === "board" ||
  value === "pieces" ||
  value === "dice_animation" ||
  value === "emote" ||
  value === "music" ||
  value === "sound_effect";

export const isCurrencyType = (value: unknown): value is CurrencyType => value === "soft" || value === "premium";

export const isCosmeticAssetMediaType = (value: unknown): value is CosmeticAssetMediaType =>
  value === "image" || value === "audio" || value === "video" || value === "animation";

export const isUploadedCosmeticAsset = (value: unknown): value is UploadedCosmeticAsset =>
  isRecord(value) &&
  typeof value.fileName === "string" &&
  value.fileName.trim().length > 0 &&
  typeof value.mimeType === "string" &&
  value.mimeType.trim().length > 0 &&
  typeof value.sizeBytes === "number" &&
  Number.isFinite(value.sizeBytes) &&
  value.sizeBytes > 0 &&
  isCosmeticAssetMediaType(value.mediaType) &&
  typeof value.dataUrl === "string" &&
  value.dataUrl.startsWith("data:") &&
  typeof value.uploadedAt === "string";

export const isCosmeticDefinition = (value: unknown): value is CosmeticDefinition => {
  if (!isRecord(value) || !isRecord(value.price)) {
    return false;
  }

  const availabilityWindow = value.availabilityWindow;
  const hasValidAvailability =
    typeof availabilityWindow === "undefined" ||
    (isRecord(availabilityWindow) &&
      typeof availabilityWindow.start === "string" &&
      typeof availabilityWindow.end === "string");

  return (
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    isCosmeticTier(value.tier) &&
    isCosmeticType(value.type) &&
    isCurrencyType(value.price.currency) &&
    typeof value.price.amount === "number" &&
    Number.isFinite(value.price.amount) &&
    value.price.amount >= 0 &&
    isStringArray(value.rotationPools) &&
    value.rotationPools.every((pool) => pool === "daily" || pool === "featured" || pool === "limited") &&
    typeof value.rarityWeight === "number" &&
    Number.isFinite(value.rarityWeight) &&
    value.rarityWeight >= 0 &&
    value.rarityWeight <= 1 &&
    hasValidAvailability &&
    typeof value.releasedDate === "string" &&
    typeof value.assetKey === "string" &&
    (typeof value.uploadedAsset === "undefined" || isUploadedCosmeticAsset(value.uploadedAsset)) &&
    (typeof value.disabled === "undefined" || typeof value.disabled === "boolean")
  );
};

export const isLimitedTimeEvent = (value: unknown): value is LimitedTimeEvent =>
  isRecord(value) &&
  typeof value.id === "string" &&
  typeof value.name === "string" &&
  isStringArray(value.cosmeticIds) &&
  typeof value.startsAt === "string" &&
  typeof value.endsAt === "string" &&
  (typeof value.disabled === "undefined" || typeof value.disabled === "boolean");

export const isOwnedCosmetic = (value: unknown): value is OwnedCosmetic =>
  isRecord(value) &&
  typeof value.cosmeticId === "string" &&
  typeof value.acquiredAt === "string" &&
  (value.source === "purchase_soft" ||
    value.source === "purchase_premium" ||
    value.source === "tournament_reward" ||
    value.source === "gift");

export const isBundleDefinition = (value: unknown): value is BundleDefinition => {
  if (!isRecord(value) || !isRecord(value.price)) {
    return false;
  }

  const availabilityWindow = value.availabilityWindow;
  const hasValidAvailability =
    typeof availabilityWindow === "undefined" ||
    (isRecord(availabilityWindow) &&
      typeof availabilityWindow.start === "string" &&
      typeof availabilityWindow.end === "string");

  return (
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    isStringArray(value.cosmeticIds) &&
    isCurrencyType(value.price.currency) &&
    typeof value.price.amount === "number" &&
    Number.isFinite(value.price.amount) &&
    value.price.amount >= 0 &&
    hasValidAvailability &&
    typeof value.assetKey === "string"
  );
};

export const isStorefrontResponse = (value: unknown): value is StorefrontResponse =>
  isRecord(value) &&
  Array.isArray(value.dailyRotation) &&
  value.dailyRotation.every(isCosmeticDefinition) &&
  Array.isArray(value.featured) &&
  value.featured.every(isCosmeticDefinition) &&
  Array.isArray(value.limitedTime) &&
  value.limitedTime.every(isCosmeticDefinition) &&
  Array.isArray(value.bundles) &&
  value.bundles.every(isBundleDefinition) &&
  isStringArray(value.ownedIds) &&
  typeof value.rotationExpiresAt === "string";

export const isFullCatalogResponse = (value: unknown): value is FullCatalogResponse =>
  isRecord(value) &&
  Array.isArray(value.items) &&
  value.items.every(isCosmeticDefinition);

export const isStoreRotationStateResponse = (value: unknown): value is StoreRotationStateResponse =>
  isRecord(value) &&
  isStringArray(value.dailyRotationIds) &&
  isStringArray(value.featuredIds) &&
  typeof value.generatedAt === "string" &&
  Array.isArray(value.previousDays) &&
  value.previousDays.every(isStringArray) &&
  typeof value.manualOverride === "boolean" &&
  Array.isArray(value.limitedTimeEvents) &&
  value.limitedTimeEvents.every(isLimitedTimeEvent);

export const isStoreStatsResponse = (value: unknown): value is StoreStatsResponse =>
  isRecord(value) &&
  typeof value.totalPurchases === "number" &&
  Number.isFinite(value.totalPurchases) &&
  typeof value.totalSoftCurrencySpent === "number" &&
  Number.isFinite(value.totalSoftCurrencySpent) &&
  typeof value.totalPremiumCurrencySpent === "number" &&
  Number.isFinite(value.totalPremiumCurrencySpent) &&
  Array.isArray(value.items) &&
  value.items.every(
    (item) =>
      isRecord(item) &&
      typeof item.cosmeticId === "string" &&
      typeof item.purchaseCount === "number" &&
      Number.isFinite(item.purchaseCount) &&
      typeof item.softCurrencySpent === "number" &&
      Number.isFinite(item.softCurrencySpent) &&
      typeof item.premiumCurrencySpent === "number" &&
      Number.isFinite(item.premiumCurrencySpent),
  );

export const isPurchaseItemResponse = (value: unknown): value is PurchaseItemResponse =>
  isRecord(value) &&
  value.success === true &&
  typeof value.cosmeticId === "string" &&
  isRecord(value.updatedWallet) &&
  typeof value.updatedWallet[SOFT_CURRENCY_KEY] === "number" &&
  Number.isFinite(value.updatedWallet[SOFT_CURRENCY_KEY]) &&
  typeof value.updatedWallet[PREMIUM_CURRENCY_KEY] === "number" &&
  Number.isFinite(value.updatedWallet[PREMIUM_CURRENCY_KEY]);

export const isOwnedCosmeticsResponse = (value: unknown): value is OwnedCosmeticsResponse =>
  isRecord(value) &&
  Array.isArray(value.items) &&
  value.items.every(isOwnedCosmetic) &&
  isStringArray(value.cosmeticIds);
