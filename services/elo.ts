import {
  EloLeaderboardAroundMeRpcRequest,
  EloLeaderboardAroundMeRpcResponse,
  EloLeaderboardRpcRequest,
  EloLeaderboardRpcResponse,
  EloRatingProfileRpcResponse,
  isEloLeaderboardAroundMeRpcResponse,
  isEloLeaderboardRpcResponse,
  isEloRatingProfileRpcResponse,
} from "@/shared/elo";
import { nakamaService } from "./nakama";

const RPC_GET_MY_RATING_PROFILE = "get_my_rating_profile";
const RPC_LIST_TOP_ELO_PLAYERS = "list_top_elo_players";
const RPC_GET_ELO_LEADERBOARD_AROUND_ME = "get_elo_leaderboard_around_me";

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

const getSessionOrThrow = async () => {
  const session = await nakamaService.loadSession();
  if (!session) {
    throw new Error("No active Nakama session. Authenticate before requesting Elo data.");
  }

  return session;
};

export const getMyRatingProfile = async (): Promise<EloRatingProfileRpcResponse> => {
  const session = await getSessionOrThrow();
  const response = await nakamaService.getClient().rpc(session, RPC_GET_MY_RATING_PROFILE, {});
  const payload = normalizeRpcPayload(response.payload);

  if (!isEloRatingProfileRpcResponse(payload)) {
    throw new Error("My rating profile RPC payload is invalid.");
  }

  return payload;
};

export const listTopEloPlayers = async (
  request: EloLeaderboardRpcRequest = {},
): Promise<EloLeaderboardRpcResponse> => {
  const session = await getSessionOrThrow();
  const response = await nakamaService.getClient().rpc(session, RPC_LIST_TOP_ELO_PLAYERS, request);
  const payload = normalizeRpcPayload(response.payload);

  if (!isEloLeaderboardRpcResponse(payload)) {
    throw new Error("Top Elo leaderboard RPC payload is invalid.");
  }

  return payload;
};

export const getEloLeaderboardAroundMe = async (
  request: EloLeaderboardAroundMeRpcRequest = {},
): Promise<EloLeaderboardAroundMeRpcResponse> => {
  const session = await getSessionOrThrow();
  const response = await nakamaService.getClient().rpc(session, RPC_GET_ELO_LEADERBOARD_AROUND_ME, request);
  const payload = normalizeRpcPayload(response.payload);

  if (!isEloLeaderboardAroundMeRpcResponse(payload)) {
    throw new Error("Around-me Elo leaderboard RPC payload is invalid.");
  }

  return payload;
};
