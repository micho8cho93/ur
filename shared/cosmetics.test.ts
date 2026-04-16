import {
  isCosmeticDefinition,
  isFullCatalogResponse,
  isLimitedTimeEvent,
  isPurchaseItemResponse,
  isStorefrontResponse,
} from "./cosmetics";
import { PREMIUM_CURRENCY_KEY, SOFT_CURRENCY_KEY } from "./wallet";

const cosmetic = {
  id: "board_lapis_001",
  name: "Lapis Board",
  tier: "rare",
  type: "board",
  price: { currency: "soft", amount: 700 },
  rotationPools: ["daily"],
  rarityWeight: 0.5,
  releasedDate: "2026-04-15T00:00:00.000Z",
  assetKey: "board_lapis_001",
};

describe("cosmetic shared validators", () => {
  it("accepts valid cosmetic definitions and storefront payloads", () => {
    expect(isCosmeticDefinition(cosmetic)).toBe(true);
    expect(isCosmeticDefinition({ ...cosmetic, disabled: true })).toBe(true);
    expect(isCosmeticDefinition({ ...cosmetic, id: "music_ancient_001", type: "music", assetKey: "music_ancient_001" })).toBe(true);
    expect(isCosmeticDefinition({ ...cosmetic, id: "sfx_stone_001", type: "sound_effect", assetKey: "sfx_stone_001" })).toBe(true);
    expect(
      isStorefrontResponse({
        dailyRotation: [cosmetic],
        featured: [],
        limitedTime: [],
        bundles: [],
        ownedIds: ["board_lapis_001"],
        rotationExpiresAt: "2026-04-16T00:00:00.000Z",
      }),
    ).toBe(true);
    expect(isFullCatalogResponse({ items: [{ ...cosmetic, disabled: true }] })).toBe(true);
    expect(
      isLimitedTimeEvent({
        id: "spring",
        name: "Spring",
        cosmeticIds: ["board_lapis_001"],
        startsAt: "2026-04-15T00:00:00.000Z",
        endsAt: "2026-04-16T00:00:00.000Z",
      }),
    ).toBe(true);
  });

  it("rejects malformed cosmetic payloads", () => {
    expect(isCosmeticDefinition({ ...cosmetic, rarityWeight: 2 })).toBe(false);
    expect(isCosmeticDefinition({ ...cosmetic, disabled: "yes" })).toBe(false);
    expect(isStorefrontResponse({ dailyRotation: [cosmetic] })).toBe(false);
    expect(isFullCatalogResponse({ items: [{ ...cosmetic, price: null }] })).toBe(false);
    expect(isLimitedTimeEvent({ id: "spring", cosmeticIds: [] })).toBe(false);
  });

  it("accepts purchase responses with both wallet currencies", () => {
    expect(
      isPurchaseItemResponse({
        success: true,
        cosmeticId: "board_lapis_001",
        updatedWallet: {
          [SOFT_CURRENCY_KEY]: 300,
          [PREMIUM_CURRENCY_KEY]: 25,
        },
      }),
    ).toBe(true);
  });
});
