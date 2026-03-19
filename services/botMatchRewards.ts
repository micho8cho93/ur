import {
  CompletedMatchSummary,
  SubmitCompletedBotMatchRpcResponse,
  isSubmitCompletedBotMatchRpcResponse,
} from "../shared/challenges";
import { nakamaService } from "./nakama";

const RPC_SUBMIT_COMPLETED_BOT_MATCH = "submit_completed_bot_match";

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

export const submitCompletedBotMatchResult = async (
  summary: CompletedMatchSummary
): Promise<SubmitCompletedBotMatchRpcResponse> => {
  const session = await nakamaService.loadSession();
  if (!session) {
    throw new Error("No active Nakama session. Authenticate before submitting bot match rewards.");
  }

  const response = await nakamaService
    .getClient()
    .rpc(session, RPC_SUBMIT_COMPLETED_BOT_MATCH, JSON.stringify({ summary }));
  const payload = normalizeRpcPayload(response.payload);

  if (!isSubmitCompletedBotMatchRpcResponse(payload)) {
    throw new Error("Completed bot match RPC payload is invalid.");
  }

  return payload;
};
