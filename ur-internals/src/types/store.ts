export type CosmeticTier = 'common' | 'rare' | 'epic' | 'legendary'
export type CosmeticType = 'board' | 'pieces' | 'dice_animation' | 'emote' | 'music' | 'sound_effect'
export type CurrencyType = 'soft' | 'premium'
export type RotationPool = 'daily' | 'featured' | 'limited'

export interface CosmeticDefinition {
  id: string
  name: string
  tier: CosmeticTier
  type: CosmeticType
  price: {
    currency: CurrencyType
    amount: number
  }
  rotationPools: RotationPool[]
  rarityWeight: number
  availabilityWindow?: {
    start: string
    end: string
  }
  releasedDate: string
  assetKey: string
  disabled?: boolean
}

export interface LimitedTimeEvent {
  id: string
  name: string
  cosmeticIds: string[]
  startsAt: string
  endsAt: string
  disabled?: boolean
}

export interface FullCatalogResponse {
  items: CosmeticDefinition[]
}

export interface StoreRotationStateResponse {
  dailyRotationIds: string[]
  featuredIds: string[]
  generatedAt: string
  previousDays: string[][]
  manualOverride: boolean
  limitedTimeEvents: LimitedTimeEvent[]
}

export interface StoreStatsItem {
  cosmeticId: string
  purchaseCount: number
  softCurrencySpent: number
  premiumCurrencySpent: number
}

export interface StoreStatsResponse {
  totalPurchases: number
  totalSoftCurrencySpent: number
  totalPremiumCurrencySpent: number
  items: StoreStatsItem[]
}

export interface AdminCosmeticMutationResponse {
  success: true
  item: CosmeticDefinition
}
