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

/**
 * Heartbeat: requires an existing authenticated session.
 * Does NOT fall back to device-auth so a Google user never gets counted under
 * a different anonymous identity if nakama's storage is momentarily stale.
 */
export const sendPresenceHeartbeat = async (): Promise<number> => {
  const session = await nakamaService.loadSession();
  if (!session) {
    throw new Error("No active session — cannot send heartbeat.");
  }
  const client = nakamaService.getClient();
  const response = await client.rpc(session, RPC_PRESENCE_HEARTBEAT, {});
  return parseOnlineCount(response.payload);
};

/**
 * Online count query: uses ensureAuthenticatedDevice so anonymous/pre-auth
 * clients can still read the counter (e.g. landing screens).
 */
export const getOnlineDeviceCount = async (): Promise<number> => {
  const session = await nakamaService.ensureAuthenticatedDevice();
  const client = nakamaService.getClient();
  const response = await client.rpc(session, RPC_PRESENCE_COUNT, {});
  return parseOnlineCount(response.payload);
};
