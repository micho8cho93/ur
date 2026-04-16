import { WalletRpcResponse, isWalletRpcResponse } from "../shared/wallet";
import { nakamaService } from "./nakama";

const RPC_GET_WALLET = "get_wallet";

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

export const getWallet = async (): Promise<WalletRpcResponse> => {
  const session = await nakamaService.loadSession();
  if (!session) {
    throw new Error("No active Nakama session. Authenticate before requesting wallet data.");
  }

  const response = await nakamaService.getClient().rpc(session, RPC_GET_WALLET, {});
  const payload = normalizeRpcPayload(response.payload);

  if (!isWalletRpcResponse(payload)) {
    throw new Error("Wallet RPC payload is invalid.");
  }

  return payload;
};
