import { PREMIUM_CURRENCY_KEY, SOFT_CURRENCY_KEY } from "../../shared/wallet";
import { getWalletResponseForUser, rpcGetWallet } from "./wallet";

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
