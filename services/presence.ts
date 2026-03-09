import { nakamaService } from "./nakama";

const RPC_PRESENCE_HEARTBEAT = "presence_heartbeat";
const RPC_PRESENCE_COUNT = "presence_count";

type PresenceRpcPayload = {
  onlineCount?: unknown;
};

const parseOnlineCount = (payload: unknown): number => {
  const rpcPayload = payload as PresenceRpcPayload | undefined;
  if (typeof rpcPayload?.onlineCount === "number" && Number.isFinite(rpcPayload.onlineCount)) {
    return rpcPayload.onlineCount;
  }

  throw new Error("Presence RPC payload is missing a valid onlineCount.");
};

const callPresenceRpc = async (rpcId: string): Promise<number> => {
  const session = await nakamaService.ensureAuthenticatedDevice();
  const client = nakamaService.getClient();
  const response = await client.rpc(session, rpcId, {});
  return parseOnlineCount(response.payload);
};

export const sendPresenceHeartbeat = async (): Promise<number> =>
  callPresenceRpc(RPC_PRESENCE_HEARTBEAT);

export const getOnlineDeviceCount = async (): Promise<number> =>
  callPresenceRpc(RPC_PRESENCE_COUNT);
