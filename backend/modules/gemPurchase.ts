// Gem pack purchase confirmation RPC.
// All packs in GEM_PACK_CATALOG have enabled=false until real receipt
// verification is wired per provider. Do NOT enable packs without
// implementing the verification steps marked TODO below.

import { GEM_PACK_CATALOG } from "../../shared/gemPacks";
import { addPremiumCurrency } from "./wallet";
import { PREMIUM_CURRENCY_KEY, parseWalletBalances } from "../../shared/wallet";

type RuntimeContext = any;
type RuntimeLogger = any;
type RuntimeNakama = any;

export const RPC_CONFIRM_GEM_PACK_PURCHASE = "confirm_gem_pack_purchase";

const parseJsonPayload = (payload: string): Record<string, unknown> => {
  if (!payload) {
    return {};
  }
  try {
    const parsed = JSON.parse(payload) as unknown;
    if (typeof parsed === "object" && parsed !== null) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    // fall through
  }
  return {};
};

const readStringField = (
  value: Record<string, unknown>,
  keys: string[],
): string | null => {
  for (const key of keys) {
    const field = value[key];
    if (typeof field === "string" && field.trim().length > 0) {
      return field.trim();
    }
  }
  return null;
};

export const rpcConfirmGemPackPurchase = (
  ctx: RuntimeContext,
  logger: RuntimeLogger,
  nk: RuntimeNakama,
  payload: string,
): string => {
  if (!ctx.userId) {
    throw new Error("Authentication required.");
  }

  const params = parseJsonPayload(payload);
  const packId = readStringField(params, ["packId", "pack_id"]);
  const provider = readStringField(params, ["provider"]);
  const receiptToken = readStringField(params, ["receiptToken", "receipt_token"]);

  if (!packId) {
    throw new Error("MISSING_PACK_ID");
  }

  const pack = GEM_PACK_CATALOG.find((p) => p.id === packId);
  if (!pack) {
    throw new Error("GEM_PACK_NOT_FOUND");
  }

  if (!pack.enabled) {
    throw new Error("GEM_PACK_NOT_AVAILABLE");
  }

  if (!pack.placeholder) {
    if (pack.provider === "ios_iap" || pack.provider === "android_iap") {
      // TODO: Verify receipt with Apple/Google before awarding gems.
      throw new Error("IAP_VERIFICATION_NOT_IMPLEMENTED");
    }
    if (pack.provider === "stripe") {
      // TODO: Verify Stripe PaymentIntent server-side before awarding gems.
      throw new Error("STRIPE_VERIFICATION_NOT_IMPLEMENTED");
    }
  }

  // Placeholder packs require a receipt token for per-transaction deduplication.
  // This prevents trivial replay attacks even in dev environments.
  if (!receiptToken) {
    throw new Error("MISSING_RECEIPT_TOKEN");
  }

  const deduplicationKey = `iap:${pack.provider}:${packId}:${ctx.userId}:${receiptToken}`;

  const result = addPremiumCurrency(nk, logger, {
    userId: ctx.userId,
    amount: pack.gemAmount,
    source: pack.placeholder ? "gem_pack_purchase_placeholder" : `iap_purchase_${pack.provider}` as any,
    deduplicationKey,
    metadata: {
      packId,
      provider: provider ?? pack.provider,
      receiptToken,
    },
  });

  const wallet = parseWalletBalances(nk.accountGetId(ctx.userId)?.wallet);

  return JSON.stringify({
    success: true,
    gemAmount: result.awardedPremiumCurrency,
    duplicate: result.duplicate,
    newPremiumCurrency: wallet[PREMIUM_CURRENCY_KEY],
  });
};
