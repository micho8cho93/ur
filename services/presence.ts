import { nakamaService } from "./nakama";

const RPC_PRESENCE_HEARTBEAT = "presence_heartbeat";
const RPC_PRESENCE_COUNT = "presence_count";

type PresenceRpcPayload = {
  onlineCount?: unknown;
};

const isUnauthorizedPresenceError = (error: unknown): boolean => {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  const candidate = error as {
    code?: unknown;
    message?: unknown;
    status?: unknown;
    statusCode?: unknown;
  };

  if (candidate.status === 401 || candidate.statusCode === 401 || candidate.code === 401) {
    return true;
  }

  return typeof candidate.message === "string" && /unauthorized|expired|token/i.test(candidate.message);
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
  let session = await nakamaService.loadSession();
  if (!session) {
    throw new Error("No active session — cannot send heartbeat.");
  }
  let client = nakamaService.getClient();

  try {
    const response = await client.rpc(session, RPC_PRESENCE_HEARTBEAT, {});
    return parseOnlineCount(response.payload);
  } catch (error) {
    if (!isUnauthorizedPresenceError(error)) {
      throw error;
    }

    const recoveredSession = await nakamaService.recoverSessionAfterUnauthorized(session, {
      allowDeviceAuthFallback: false,
    });
    if (!recoveredSession) {
      throw error;
    }

    session = recoveredSession;
    client = nakamaService.getClient();
    const retryResponse = await client.rpc(session, RPC_PRESENCE_HEARTBEAT, {});
    return parseOnlineCount(retryResponse.payload);
  }
};

/**
 * Site-wide player count query: uses ensureAuthenticatedDevice so anonymous or
 * pre-auth clients can still read the counter (e.g. landing screens).
 */
export const getSitePlayerCount = async (): Promise<number> => {
  let session = await nakamaService.ensureAuthenticatedDevice();
  let client = nakamaService.getClient();

  try {
    const response = await client.rpc(session, RPC_PRESENCE_COUNT, {});
    return parseOnlineCount(response.payload);
  } catch (error) {
    if (!isUnauthorizedPresenceError(error)) {
      throw error;
    }

    const recoveredSession = await nakamaService.recoverSessionAfterUnauthorized(session);
    if (!recoveredSession) {
      throw error;
    }

    session = recoveredSession;
    client = nakamaService.getClient();
    const retryResponse = await client.rpc(session, RPC_PRESENCE_COUNT, {});
    return parseOnlineCount(retryResponse.payload);
  }
};
