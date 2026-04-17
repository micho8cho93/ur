import { callRpc } from './client'
import { asRecord, readArrayField, readBooleanField, readNumberField, readStringField } from './runtime'
import type {
  AdminCosmeticMutationResponse,
  AdminDeleteCosmeticResponse,
  CosmeticAssetMediaType,
  CosmeticDefinition,
  CosmeticTier,
  CosmeticType,
  CurrencyType,
  FullCatalogResponse,
  LimitedTimeEvent,
  RotationPool,
  StoreRotationStateResponse,
  StoreStatsResponse,
} from '../types/store'

const RPC_ADMIN_GET_FULL_CATALOG = 'admin_get_full_catalog'
const RPC_ADMIN_UPSERT_COSMETIC = 'admin_upsert_cosmetic'
const RPC_ADMIN_DISABLE_COSMETIC = 'admin_disable_cosmetic'
const RPC_ADMIN_ENABLE_COSMETIC = 'admin_enable_cosmetic'
const RPC_ADMIN_DELETE_COSMETIC = 'admin_delete_cosmetic'
const RPC_ADMIN_GET_ROTATION_STATE = 'admin_get_rotation_state'
const RPC_ADMIN_SET_MANUAL_ROTATION = 'admin_set_manual_rotation'
const RPC_ADMIN_CLEAR_MANUAL_ROTATION = 'admin_clear_manual_rotation'
const RPC_ADMIN_SET_LIMITED_TIME_EVENT = 'admin_set_limited_time_event'
const RPC_ADMIN_REMOVE_LIMITED_TIME_EVENT = 'admin_remove_limited_time_event'
const RPC_ADMIN_GET_STORE_STATS = 'admin_get_store_stats'

const cosmeticTiers: CosmeticTier[] = ['common', 'rare', 'epic', 'legendary']
const cosmeticTypes: CosmeticType[] = ['board', 'pieces', 'dice_animation', 'emote', 'music', 'sound_effect']
const currencies: CurrencyType[] = ['soft', 'premium']
const rotationPools: RotationPool[] = ['daily', 'featured', 'limited']
const assetMediaTypes: CosmeticAssetMediaType[] = ['image', 'audio', 'video', 'animation']

function readStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0)
    : []
}

function normalizeCosmetic(value: unknown): CosmeticDefinition | null {
  const record = asRecord(value)
  const price = asRecord(record?.price)
  const tier = readStringField(record, ['tier'])
  const type = readStringField(record, ['type'])
  const currency = readStringField(price, ['currency'])

  if (
    !record ||
    !price ||
    !cosmeticTiers.includes(tier as CosmeticTier) ||
    !cosmeticTypes.includes(type as CosmeticType) ||
    !currencies.includes(currency as CurrencyType)
  ) {
    return null
  }

  const id = readStringField(record, ['id'])
  const name = readStringField(record, ['name'])
  const amount = readNumberField(price, ['amount'])
  const rarityWeight = readNumberField(record, ['rarityWeight', 'rarity_weight'])
  const releasedDate = readStringField(record, ['releasedDate', 'released_date'])
  const assetKey = readStringField(record, ['assetKey', 'asset_key'])

  if (!id || !name || typeof amount !== 'number' || typeof rarityWeight !== 'number' || !releasedDate || !assetKey) {
    return null
  }

  const availabilityWindow = asRecord(record.availabilityWindow)
  const start = readStringField(availabilityWindow, ['start'])
  const end = readStringField(availabilityWindow, ['end'])
  const uploadedAssetRecord = asRecord(record.uploadedAsset)
  const assetMediaType = readStringField(uploadedAssetRecord, ['mediaType'])
  const uploadedAsset =
    uploadedAssetRecord && assetMediaTypes.includes(assetMediaType as CosmeticAssetMediaType)
      ? {
          fileName: readStringField(uploadedAssetRecord, ['fileName']) ?? '',
          mimeType: readStringField(uploadedAssetRecord, ['mimeType']) ?? '',
          sizeBytes: readNumberField(uploadedAssetRecord, ['sizeBytes']) ?? 0,
          mediaType: assetMediaType as CosmeticAssetMediaType,
          dataUrl: readStringField(uploadedAssetRecord, ['dataUrl']) ?? '',
          uploadedAt: readStringField(uploadedAssetRecord, ['uploadedAt']) ?? '',
        }
      : null

  return {
    id,
    name,
    tier: tier as CosmeticTier,
    type: type as CosmeticType,
    price: {
      currency: currency as CurrencyType,
      amount,
    },
    rotationPools: readStringArray(record.rotationPools).filter((pool): pool is RotationPool =>
      rotationPools.includes(pool as RotationPool),
    ),
    rarityWeight,
    ...(start && end ? { availabilityWindow: { start, end } } : {}),
    releasedDate,
    assetKey,
    ...(uploadedAsset?.fileName && uploadedAsset.mimeType && uploadedAsset.dataUrl && uploadedAsset.sizeBytes > 0
      ? { uploadedAsset }
      : {}),
    disabled: readBooleanField(record, ['disabled']) ?? false,
  }
}

function normalizeCatalog(value: unknown): FullCatalogResponse {
  return {
    items: readArrayField(value, ['items']).map(normalizeCosmetic).filter((item): item is CosmeticDefinition => Boolean(item)),
  }
}

function normalizeLimitedTimeEvent(value: unknown): LimitedTimeEvent | null {
  const record = asRecord(value)
  const id = readStringField(record, ['id'])
  const name = readStringField(record, ['name'])
  const startsAt = readStringField(record, ['startsAt', 'starts_at'])
  const endsAt = readStringField(record, ['endsAt', 'ends_at'])

  if (!id || !name || !startsAt || !endsAt) {
    return null
  }

  return {
    id,
    name,
    cosmeticIds: readStringArray(record?.cosmeticIds),
    startsAt,
    endsAt,
    disabled: readBooleanField(record, ['disabled']) ?? false,
  }
}

function normalizeRotationState(value: unknown): StoreRotationStateResponse {
  const record = asRecord(value)
  return {
    dailyRotationIds: readStringArray(record?.dailyRotationIds),
    featuredIds: readStringArray(record?.featuredIds),
    generatedAt: readStringField(record, ['generatedAt', 'generated_at']) ?? '',
    previousDays: readArrayField(record, ['previousDays']).map(readStringArray).filter((day) => day.length > 0),
    manualOverride: readBooleanField(record, ['manualOverride', 'manual_override']) === true,
    limitedTimeEvents: readArrayField(record, ['limitedTimeEvents'])
      .map(normalizeLimitedTimeEvent)
      .filter((event): event is LimitedTimeEvent => Boolean(event)),
  }
}

function normalizeStats(value: unknown): StoreStatsResponse {
  const record = asRecord(value)
  return {
    totalPurchases: readNumberField(record, ['totalPurchases']) ?? 0,
    totalSoftCurrencySpent: readNumberField(record, ['totalSoftCurrencySpent']) ?? 0,
    totalPremiumCurrencySpent: readNumberField(record, ['totalPremiumCurrencySpent']) ?? 0,
    items: readArrayField(record, ['items']).map((item) => {
      const itemRecord = asRecord(item)
      return {
        cosmeticId: readStringField(itemRecord, ['cosmeticId']) ?? 'unknown',
        purchaseCount: readNumberField(itemRecord, ['purchaseCount']) ?? 0,
        softCurrencySpent: readNumberField(itemRecord, ['softCurrencySpent']) ?? 0,
        premiumCurrencySpent: readNumberField(itemRecord, ['premiumCurrencySpent']) ?? 0,
      }
    }),
  }
}

function normalizeMutation(value: unknown): AdminCosmeticMutationResponse {
  const item = normalizeCosmetic(asRecord(value)?.item)
  if (!item) {
    throw new Error('Store catalog mutation returned an invalid item.')
  }

  return {
    success: true,
    item,
  }
}

function normalizeDeleteMutation(value: unknown): AdminDeleteCosmeticResponse {
  const record = asRecord(value)
  const cosmeticId = readStringField(record, ['cosmeticId'])
  if (!cosmeticId) {
    throw new Error('Store catalog delete returned an invalid item ID.')
  }

  return {
    success: true,
    cosmeticId,
  }
}

export async function getAdminFullCatalog(): Promise<FullCatalogResponse> {
  return normalizeCatalog(await callRpc<unknown>(RPC_ADMIN_GET_FULL_CATALOG))
}

export async function upsertCosmetic(
  cosmetic: Partial<Omit<CosmeticDefinition, 'uploadedAsset' | 'uploadedAsset2'>> & {
    id: string
    uploadedAsset?: CosmeticDefinition['uploadedAsset'] | null
    uploadedAsset2?: CosmeticDefinition['uploadedAsset2'] | null
  },
) {
  return normalizeMutation(await callRpc<unknown>(RPC_ADMIN_UPSERT_COSMETIC, { cosmetic }))
}

export async function disableCosmetic(cosmeticId: string) {
  return normalizeMutation(await callRpc<unknown>(RPC_ADMIN_DISABLE_COSMETIC, { cosmeticId }))
}

export async function enableCosmetic(cosmeticId: string) {
  return normalizeMutation(await callRpc<unknown>(RPC_ADMIN_ENABLE_COSMETIC, { cosmeticId }))
}

export async function deleteCosmetic(cosmeticId: string) {
  return normalizeDeleteMutation(await callRpc<unknown>(RPC_ADMIN_DELETE_COSMETIC, { cosmeticId }))
}

export async function getRotationState(): Promise<StoreRotationStateResponse> {
  return normalizeRotationState(await callRpc<unknown>(RPC_ADMIN_GET_ROTATION_STATE))
}

export async function setManualRotation(dailyRotationIds: string[], featuredIds: string[]) {
  return normalizeRotationState(await callRpc<unknown>(RPC_ADMIN_SET_MANUAL_ROTATION, { dailyRotationIds, featuredIds }))
}

export async function clearManualRotation() {
  return normalizeRotationState(await callRpc<unknown>(RPC_ADMIN_CLEAR_MANUAL_ROTATION))
}

export async function setLimitedTimeEvent(event: LimitedTimeEvent) {
  return normalizeRotationState(await callRpc<unknown>(RPC_ADMIN_SET_LIMITED_TIME_EVENT, { event }))
}

export async function removeLimitedTimeEvent(eventId: string) {
  return normalizeRotationState(await callRpc<unknown>(RPC_ADMIN_REMOVE_LIMITED_TIME_EVENT, { eventId }))
}

export async function getStoreStats(): Promise<StoreStatsResponse> {
  return normalizeStats(await callRpc<unknown>(RPC_ADMIN_GET_STORE_STATS))
}
