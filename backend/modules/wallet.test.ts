import { PREMIUM_CURRENCY_KEY, SOFT_CURRENCY_KEY } from "../../shared/wallet";
import { addPremiumCurrency, getWalletResponseForUser, rpcGetWallet, spendPremiumCurrency } from "./wallet";

describe("wallet RPC helpers", () => {
  it("returns zero Coins when the Nakama wallet is missing", () => {
    const nk = {
      accountGetId: jest.fn(() => ({})),
    };

    expect(getWalletResponseForUser(nk, "user-1")).toEqual({
      wallet: { [SOFT_CURRENCY_KEY]: 0, [PREMIUM_CURRENCY_KEY]: 0 },
      softCurrency: 0,
      premiumCurrency: 0,
    });
  });

  it("reads Coins and premium currency from object and JSON string wallet payloads", () => {
    const nk = {
      accountGetId: jest
        .fn()
        .mockReturnValueOnce({ wallet: { [SOFT_CURRENCY_KEY]: 42, [PREMIUM_CURRENCY_KEY]: 8 } })
        .mockReturnValueOnce({ wallet: JSON.stringify({ [SOFT_CURRENCY_KEY]: 17, [PREMIUM_CURRENCY_KEY]: 4 }) }),
    };

    const objectResponse = getWalletResponseForUser(nk, "user-1");
    const jsonResponse = getWalletResponseForUser(nk, "user-1");

    expect(objectResponse.softCurrency).toBe(42);
    expect(objectResponse.premiumCurrency).toBe(8);
    expect(jsonResponse.softCurrency).toBe(17);
    expect(jsonResponse.premiumCurrency).toBe(4);
  });

  it("exposes an authenticated get_wallet RPC", () => {
    const nk = {
      accountGetId: jest.fn(() => ({ wallet: { [SOFT_CURRENCY_KEY]: 123 } })),
    };

    const response = rpcGetWallet({ userId: "user-1" }, {}, nk, "");

    expect(JSON.parse(response)).toEqual({
      wallet: { [SOFT_CURRENCY_KEY]: 123, [PREMIUM_CURRENCY_KEY]: 0 },
      softCurrency: 123,
      premiumCurrency: 0,
    });
    expect(nk.accountGetId).toHaveBeenCalledWith("user-1");
  });

  it("rejects unauthenticated calls", () => {
    expect(() => rpcGetWallet({}, {}, { accountGetId: jest.fn() }, "")).toThrow("Authentication required.");
  });
});

describe("addPremiumCurrency", () => {
  const buildNk = (walletGems = 0, ledgerItems: unknown[] = []) => ({
    accountGetId: jest.fn(() => ({ wallet: { [PREMIUM_CURRENCY_KEY]: walletGems } })),
    walletLedgerList: jest.fn(() => ({ items: ledgerItems, cursor: null })),
    walletUpdate: jest.fn(),
  });

  it("awards gems and returns duplicate=false on first grant", () => {
    const nk = buildNk();
    const logger = { info: jest.fn(), warn: jest.fn() };

    const result = addPremiumCurrency(nk, logger, {
      userId: "user-1",
      amount: 100,
      source: "tournament_reward",
      deduplicationKey: "tournament_reward:run-1:rank:1",
    });

    expect(result).toEqual({ awardedPremiumCurrency: 100, duplicate: false });
    expect(nk.walletUpdate).toHaveBeenCalledWith(
      "user-1",
      { [PREMIUM_CURRENCY_KEY]: 100 },
      expect.objectContaining({
        source: "tournament_reward",
        deduplicationKey: "tournament_reward:run-1:rank:1",
        amount: 100,
      }),
      true,
    );
  });

  it("returns duplicate=true when ledger entry already exists", () => {
    const nk = buildNk(100, [
      {
        metadata: JSON.stringify({
          currency: PREMIUM_CURRENCY_KEY,
          deduplicationKey: "tournament_reward:run-1:rank:1",
        }),
        changeset: { [PREMIUM_CURRENCY_KEY]: 100 },
      },
    ]);
    const logger = { info: jest.fn(), warn: jest.fn() };

    const result = addPremiumCurrency(nk, logger, {
      userId: "user-1",
      amount: 100,
      source: "tournament_reward",
      deduplicationKey: "tournament_reward:run-1:rank:1",
    });

    expect(result).toEqual({ awardedPremiumCurrency: 100, duplicate: true });
    expect(nk.walletUpdate).not.toHaveBeenCalled();
  });

  it("skips grant when amount is zero or negative", () => {
    const nk = buildNk();
    const logger = { info: jest.fn(), warn: jest.fn() };

    const result = addPremiumCurrency(nk, logger, {
      userId: "user-1",
      amount: 0,
      source: "tournament_reward",
      deduplicationKey: "key",
    });

    expect(result).toEqual({ awardedPremiumCurrency: 0, duplicate: false });
    expect(nk.walletUpdate).not.toHaveBeenCalled();
  });
});

describe("spendPremiumCurrency", () => {
  const buildNk = (walletGems: number) => ({
    accountGetId: jest.fn(() => ({ wallet: { [PREMIUM_CURRENCY_KEY]: walletGems } })),
    walletUpdate: jest.fn(),
  });

  it("deducts gems when balance is sufficient", () => {
    const nk = buildNk(200);
    const logger = { info: jest.fn(), warn: jest.fn() };

    const result = spendPremiumCurrency(nk, logger, {
      userId: "user-1",
      amount: 50,
      source: "cosmetic_purchase",
    });

    expect(result).toEqual({ spentPremiumCurrency: 50 });
    expect(nk.walletUpdate).toHaveBeenCalledWith(
      "user-1",
      { [PREMIUM_CURRENCY_KEY]: -50 },
      expect.objectContaining({ source: "cosmetic_purchase" }),
      true,
    );
  });

  it("throws INSUFFICIENT_GEMS when balance is too low", () => {
    const nk = buildNk(10);
    const logger = { info: jest.fn(), warn: jest.fn() };

    expect(() =>
      spendPremiumCurrency(nk, logger, { userId: "user-1", amount: 50, source: "cosmetic_purchase" }),
    ).toThrow("INSUFFICIENT_GEMS");
    expect(nk.walletUpdate).not.toHaveBeenCalled();
  });
});
