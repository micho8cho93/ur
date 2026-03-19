import {
  isProgressionSnapshot,
  ProgressionAwardNotificationPayload,
  ProgressionRpcResponse,
} from "../shared/progression";
import { nakamaService } from "./nakama";

const RPC_GET_PROGRESSION = "get_progression";

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

export const getUserProgression = async (): Promise<ProgressionRpcResponse> => {
  const session = await nakamaService.loadSession();
  if (!session) {
    throw new Error("No active Nakama session. Authenticate before requesting progression.");
  }

  const response = await nakamaService.getClient().rpc(session, RPC_GET_PROGRESSION, {});
  const payload = normalizeRpcPayload(response.payload);

  if (!isProgressionSnapshot(payload)) {
    throw new Error("Progression RPC payload is invalid.");
  }

  return payload;
};

export const stripProgressionAwardEnvelope = (
  payload: ProgressionAwardNotificationPayload
) => {
  const { type: _type, ...award } = payload;
  return award;
};
