export type GemPackProvider = "ios_iap" | "android_iap" | "stripe" | "placeholder";

export type GemPackDefinition = {
  id: string;
  title: string;
  gemAmount: number;
  displayPrice: string;
  provider: GemPackProvider;
  productId: string;
  enabled: boolean;
  placeholder: boolean;
};

// All packs are disabled and placeholder=true until receipt verification is
// implemented per provider. Set enabled=false to prevent accidental free grants.
export const GEM_PACK_CATALOG: GemPackDefinition[] = [
  {
    id: "gems_100",
    title: "100 Gems",
    gemAmount: 100,
    displayPrice: "$0.99",
    provider: "placeholder",
    productId: "gems_100",
    enabled: false,
    placeholder: true,
  },
  {
    id: "gems_500",
    title: "500 Gems",
    gemAmount: 500,
    displayPrice: "$4.99",
    provider: "placeholder",
    productId: "gems_500",
    enabled: false,
    placeholder: true,
  },
  {
    id: "gems_1200",
    title: "1200 Gems",
    gemAmount: 1200,
    displayPrice: "$9.99",
    provider: "placeholder",
    productId: "gems_1200",
    enabled: false,
    placeholder: true,
  },
  {
    id: "gems_2600",
    title: "2600 Gems",
    gemAmount: 2600,
    displayPrice: "$19.99",
    provider: "placeholder",
    productId: "gems_2600",
    enabled: false,
    placeholder: true,
  },
];

export const getEnabledGemPacks = (): GemPackDefinition[] =>
  GEM_PACK_CATALOG.filter((pack) => pack.enabled);
