import {
  isOwnedCosmeticsResponse,
  isFullCatalogResponse,
  isPurchaseItemResponse,
  isStorefrontResponse,
  type FullCatalogResponse,
  type OwnedCosmeticsResponse,
  type PurchaseItemResponse,
  type StorefrontResponse,
} from "../shared/cosmetics";
import { nakamaService } from "./nakama";

const RPC_GET_STOREFRONT = "get_storefront";
const RPC_GET_FULL_CATALOG = "get_full_catalog";
const RPC_PURCHASE_ITEM = "purchase_item";
const RPC_GET_OWNED_COSMETICS = "get_owned_cosmetics";

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

const getAuthenticatedSession = async () => {
  const session = await nakamaService.loadSession();
  if (!session) {
    throw new Error("No active Nakama session. Authenticate before requesting cosmetic store data.");
  }

  return session;
};

export const getStorefront = async (): Promise<StorefrontResponse> => {
  const session = await getAuthenticatedSession();
  const response = await nakamaService.getClient().rpc(session, RPC_GET_STOREFRONT, {});
  const payload = normalizeRpcPayload(response.payload);

  if (!isStorefrontResponse(payload)) {
    throw new Error("Storefront RPC payload is invalid.");
  }

  return payload;
};

export const getFullCatalog = async (): Promise<FullCatalogResponse> => {
  const session = await getAuthenticatedSession();
  const response = await nakamaService.getClient().rpc(session, RPC_GET_FULL_CATALOG, {});
  const payload = normalizeRpcPayload(response.payload);

  if (!isFullCatalogResponse(payload)) {
    throw new Error("Full catalog RPC payload is invalid.");
  }

  return payload;
};

export const purchaseItem = async (itemId: string): Promise<PurchaseItemResponse> => {
  const session = await getAuthenticatedSession();
  const response = await nakamaService.getClient().rpc(session, RPC_PURCHASE_ITEM, { itemId });
  const payload = normalizeRpcPayload(response.payload);

  if (!isPurchaseItemResponse(payload)) {
    throw new Error("Purchase item RPC payload is invalid.");
  }

  return payload;
};

export const getOwnedCosmetics = async (): Promise<OwnedCosmeticsResponse> => {
  const session = await getAuthenticatedSession();
  const response = await nakamaService.getClient().rpc(session, RPC_GET_OWNED_COSMETICS, {});
  const payload = normalizeRpcPayload(response.payload);

  if (!isOwnedCosmeticsResponse(payload)) {
    throw new Error("Owned cosmetics RPC payload is invalid.");
  }

  return payload;
};
