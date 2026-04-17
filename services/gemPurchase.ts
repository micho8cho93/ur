import type { GemPackDefinition, GemPackProvider } from "../shared/gemPacks";
import { getEnabledGemPacks } from "../shared/gemPacks";
import { nakamaService } from "./nakama";

const RPC_CONFIRM_GEM_PACK_PURCHASE = "confirm_gem_pack_purchase";

export type GemPurchaseResult = {
  success: boolean;
  gemAmount: number;
  duplicate: boolean;
  newPremiumCurrency: number;
};

export type GemPurchaseRequest = {
  packId: string;
  provider: GemPackProvider;
  receiptToken: string;
};

const normalizeRpcPayload = (payload: unknown): unknown => {
  if (typeof payload !== "string") {
    return payload;
  }
  try {
    return JSON.parse(payload);
  } catch {
    return payload;
  }
};

export const getAvailableGemPacks = (): GemPackDefinition[] => getEnabledGemPacks();

export const confirmGemPackPurchase = async (
  request: GemPurchaseRequest,
): Promise<GemPurchaseResult> => {
  const session = await nakamaService.loadSession();
  if (!session) {
    throw new Error("No active Nakama session. Authenticate before purchasing gems.");
  }

  const response = await nakamaService
    .getClient()
    .rpc(session, RPC_CONFIRM_GEM_PACK_PURCHASE, request);

  const payload = normalizeRpcPayload(response.payload);
  if (
    typeof payload !== "object" ||
    payload === null ||
    typeof (payload as Record<string, unknown>).success !== "boolean"
  ) {
    throw new Error("Gem purchase RPC returned an invalid response.");
  }

  return payload as GemPurchaseResult;
};
