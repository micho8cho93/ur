export const SOFT_CURRENCY_KEY = "soft_currency" as const;
export const PREMIUM_CURRENCY_KEY = "premium_currency" as const;
export const COIN_REWARD_RATE = 0.1;

export type WalletBalances = {
  [SOFT_CURRENCY_KEY]: number;
  [PREMIUM_CURRENCY_KEY]: number;
};

export type WalletRpcResponse = {
  wallet: WalletBalances;
  softCurrency: number;
  premiumCurrency: number;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

export const sanitizeSoftCurrencyAmount = (value: unknown): number => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, Math.floor(value));
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return Math.max(0, Math.floor(parsed));
    }
  }

  return 0;
};

export const sanitizePremiumCurrencyAmount = (value: unknown): number => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, Math.floor(value));
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return Math.max(0, Math.floor(parsed));
    }
  }

  return 0;
};

export const calculateChallengeSoftCurrencyReward = (rewardXp: number): number =>
  sanitizeSoftCurrencyAmount(rewardXp * COIN_REWARD_RATE);

export const buildWalletRpcResponse = (softCurrency: unknown, premiumCurrency: unknown = 0): WalletRpcResponse => {
  const sanitizedSoftCurrency = sanitizeSoftCurrencyAmount(softCurrency);
  const sanitizedPremiumCurrency = sanitizePremiumCurrencyAmount(premiumCurrency);

  return {
    wallet: {
      [SOFT_CURRENCY_KEY]: sanitizedSoftCurrency,
      [PREMIUM_CURRENCY_KEY]: sanitizedPremiumCurrency,
    },
    softCurrency: sanitizedSoftCurrency,
    premiumCurrency: sanitizedPremiumCurrency,
  };
};

export const parseWalletBalances = (value: unknown): WalletBalances => {
  if (typeof value === "string" && value.trim().length > 0) {
    try {
      return parseWalletBalances(JSON.parse(value));
    } catch {
      return buildWalletRpcResponse(0).wallet;
    }
  }

  if (!isRecord(value)) {
    return buildWalletRpcResponse(0).wallet;
  }

  return buildWalletRpcResponse(value[SOFT_CURRENCY_KEY], value[PREMIUM_CURRENCY_KEY]).wallet;
};

export const isWalletRpcResponse = (value: unknown): value is WalletRpcResponse => {
  if (!isRecord(value) || !isRecord(value.wallet)) {
    return false;
  }

  const softCurrency = value.softCurrency;
  const premiumCurrency = value.premiumCurrency;
  const walletSoftCurrency = value.wallet[SOFT_CURRENCY_KEY];
  const walletPremiumCurrency = value.wallet[PREMIUM_CURRENCY_KEY];

  return (
    typeof softCurrency === "number" &&
    Number.isFinite(softCurrency) &&
    softCurrency >= 0 &&
    Number.isInteger(softCurrency) &&
    typeof premiumCurrency === "number" &&
    Number.isFinite(premiumCurrency) &&
    premiumCurrency >= 0 &&
    Number.isInteger(premiumCurrency) &&
    walletSoftCurrency === softCurrency &&
    walletPremiumCurrency === premiumCurrency
  );
};
