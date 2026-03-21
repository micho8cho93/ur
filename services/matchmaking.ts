import { MatchData, Session, Socket } from "@heroiclabs/nakama-js";

import { MatchModeId, isMatchModeId } from "@/logic/matchConfigs";
import { PlayerColor } from "@/logic/types";
import { isPrivateMatchCode, normalizePrivateMatchCodeInput } from "@/shared/privateMatchCode";
import { MatchOpCode, decodePayload, isStateSnapshotPayload } from "@/shared/urMatchProtocol";
import { nakamaService } from "./nakama";

const RPC_CREATE_PRIVATE_MATCH = "create_private_match";
const RPC_JOIN_PRIVATE_MATCH = "join_private_match";
const RPC_GET_PRIVATE_MATCH_STATUS = "get_private_match_status";
const CONNECT_TIMEOUT_MS = 10_000;
const START_MATCHMAKING_TIMEOUT_MS = 10_000;
const WAIT_FOR_MATCH_TIMEOUT_MS = 20_000;
const JOIN_MATCH_TIMEOUT_MS = 10_000;

let activeMatchmakerTicket: string | null = null;

const ensureAuthenticated = async (): Promise<Session> => nakamaService.ensureAuthenticatedDevice();

const ensureSocket = async (): Promise<Socket> =>
  nakamaService.connectSocketWithRetry({ attempts: 3, retryDelayMs: 1_000, createStatus: true });

const waitForMatchmaker = (socket: Socket, ticket: string, timeoutMs: number): Promise<{ matchId: string; token?: string }> =>
  new Promise((resolve, reject) => {
    const previousHandler = socket.onmatchmakermatched;
    const timeout = setTimeout(() => {
      socket.onmatchmakermatched = previousHandler;
      reject(new Error("Matchmaking timed out. Please try again."));
    }, timeoutMs);

    socket.onmatchmakermatched = (matched) => {
      if (matched.ticket !== ticket) {
        return;
      }
      clearTimeout(timeout);
      socket.onmatchmakermatched = previousHandler;
      resolve({ matchId: matched.match_id, token: matched.token || undefined });
    };
  });

const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(message)), timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
};

type StatusLikeError = {
  status?: number;
  statusText?: string;
  headers?: {
    get?: (name: string) => string | null;
  };
};

const normalizeMatchmakingError = (error: unknown): Error => {
  if (error instanceof Error) {
    return error;
  }

  if (typeof error === "object" && error !== null) {
    const responseLike = error as StatusLikeError;
    const status = responseLike.status;
    const statusText = responseLike.statusText;
    const authenticateHeader =
      responseLike.headers?.get?.("www-authenticate") ?? responseLike.headers?.get?.("WWW-Authenticate");

    if (status === 401 && authenticateHeader?.toLowerCase().includes("server key invalid")) {
      return new Error("Authentication failed: Nakama server key is invalid or mismatched.");
    }

    if (typeof status === "number") {
      return new Error(`Matchmaking request failed (${status}${statusText ? ` ${statusText}` : ""}).`);
    }
  }

  return new Error("No opponents found. Try again later.");
};

const waitForInitialAssignment = (
  socket: Socket,
  matchId: string,
  userId: string,
  timeoutMs: number
): Promise<PlayerColor | null> =>
  new Promise((resolve) => {
    const previousHandler = socket.onmatchdata;
    const timeout = setTimeout(() => {
      socket.onmatchdata = previousHandler;
      resolve(null);
    }, timeoutMs);

    socket.onmatchdata = (matchData: MatchData) => {
      if (matchData.match_id !== matchId || matchData.op_code !== MatchOpCode.STATE_SNAPSHOT) {
        if (previousHandler) {
          previousHandler(matchData);
        }
        return;
      }

      let rawPayload = "";
      if (typeof matchData.data === "string") {
        rawPayload = matchData.data;
      } else if (typeof TextDecoder !== "undefined") {
        rawPayload = new TextDecoder().decode(matchData.data);
      } else {
        rawPayload = String.fromCharCode(...Array.from(matchData.data));
      }

      const payload = decodePayload(rawPayload);
      if (isStateSnapshotPayload(payload)) {
        const assignment = payload.assignments[userId];
        if (assignment === "light" || assignment === "dark") {
          clearTimeout(timeout);
          socket.onmatchdata = previousHandler;
          resolve(assignment);
          return;
        }
      }

      if (previousHandler) {
        previousHandler(matchData);
      }
    };
  });

export type MatchResult = {
  matchId: string;
  session: Session;
  userId: string;
  matchmakerTicket: string | null;
  playerColor: PlayerColor | null;
  matchToken: string | null;
};

export type PrivateMatchResult = {
  matchId: string;
  modeId: MatchModeId;
  code: string;
  session: Session;
  userId: string;
};

export type PrivateMatchStatusResult = {
  matchId: string;
  modeId: MatchModeId;
  code: string;
  hasGuestJoined: boolean;
};

export type MatchmakingHandlers = {
  onSearching?: () => void;
};

type CreatePrivateMatchRpcPayload = {
  matchId?: unknown;
  match_id?: unknown;
  modeId?: unknown;
  mode_id?: unknown;
  code?: unknown;
  privateCode?: unknown;
  private_code?: unknown;
  hasGuestJoined?: unknown;
  has_guest_joined?: unknown;
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

const parsePrivateMatchPayload = (
  payload: unknown,
  options?: { requireGuestFlag?: boolean }
): { matchId: string; modeId: MatchModeId; code: string; hasGuestJoined?: boolean } => {
  const rpcPayload = normalizeRpcPayload(payload) as CreatePrivateMatchRpcPayload | undefined;
  const matchId =
    typeof rpcPayload?.matchId === "string"
      ? rpcPayload.matchId
      : typeof rpcPayload?.match_id === "string"
        ? rpcPayload.match_id
        : null;
  const modeId = rpcPayload?.modeId ?? rpcPayload?.mode_id;
  const rawCode =
    typeof rpcPayload?.code === "string"
      ? rpcPayload.code
      : typeof rpcPayload?.privateCode === "string"
        ? rpcPayload.privateCode
        : typeof rpcPayload?.private_code === "string"
          ? rpcPayload.private_code
          : "";
  const code = normalizePrivateMatchCodeInput(rawCode);
  const hasGuestJoined =
    typeof rpcPayload?.hasGuestJoined === "boolean"
      ? rpcPayload.hasGuestJoined
      : typeof rpcPayload?.has_guest_joined === "boolean"
        ? rpcPayload.has_guest_joined
        : undefined;

  if (!matchId || !isMatchModeId(modeId) || !isPrivateMatchCode(code)) {
    throw new Error("Private match returned an invalid payload.");
  }

  if (options?.requireGuestFlag && typeof hasGuestJoined !== "boolean") {
    throw new Error("Private match status returned an invalid payload.");
  }

  return {
    matchId,
    modeId,
    code,
    hasGuestJoined,
  };
};

export const cancelMatchmaking = async (): Promise<void> => {
  const ticket = activeMatchmakerTicket;
  if (!ticket) {
    return;
  }

  activeMatchmakerTicket = null;
  const socket = nakamaService.getSocket();
  if (!socket) {
    return;
  }

  try {
    await socket.removeMatchmaker(ticket);
  } catch {
    // Ignore removal errors if the ticket was already consumed or the socket dropped.
  }
};

export const findMatch = async (handlers?: MatchmakingHandlers): Promise<MatchResult> => {
  const session = await ensureAuthenticated();
  const socket = await withTimeout(
    ensureSocket(),
    CONNECT_TIMEOUT_MS,
    "Connecting to the game server timed out. Please retry."
  );

  try {
    const ticket = await withTimeout(
      socket.addMatchmaker("*", 2, 2),
      START_MATCHMAKING_TIMEOUT_MS,
      "Unable to start matchmaking. Please retry."
    );

    activeMatchmakerTicket = ticket.ticket;
    handlers?.onSearching?.();

    const matched = await waitForMatchmaker(socket, ticket.ticket, WAIT_FOR_MATCH_TIMEOUT_MS);
    activeMatchmakerTicket = null;

    const match = await withTimeout(
      socket.joinMatch(matched.matchId, matched.token),
      JOIN_MATCH_TIMEOUT_MS,
      "Joining the match timed out. Please retry."
    );

    if (!match.match_id) {
      throw new Error("Match join did not return a match ID.");
    }

    if (!session.user_id) {
      throw new Error("Authenticated session is missing user ID.");
    }

    const playerColor = await waitForInitialAssignment(socket, match.match_id, session.user_id, 3_000);

    return {
      matchId: match.match_id,
      session,
      userId: session.user_id,
      matchmakerTicket: ticket.ticket,
      playerColor,
      matchToken: matched.token ?? null,
    };
  } catch (error) {
    await cancelMatchmaking();
    nakamaService.disconnectSocket(false);
    throw normalizeMatchmakingError(error);
  }
};

export const createPrivateMatch = async (modeId: MatchModeId = "standard"): Promise<PrivateMatchResult> => {
  const session = await ensureAuthenticated();
  const client = nakamaService.getClient();

  try {
    const response = await client.rpc(session, RPC_CREATE_PRIVATE_MATCH, { modeId });
    const payload = parsePrivateMatchPayload(response.payload);

    if (!session.user_id) {
      throw new Error("Authenticated session is missing user ID.");
    }

    return {
      matchId: payload.matchId,
      modeId: payload.modeId,
      code: payload.code,
      session,
      userId: session.user_id,
    };
  } catch (error) {
    throw normalizeMatchmakingError(error);
  }
};

export const joinPrivateMatch = async (code: string): Promise<PrivateMatchResult> => {
  const session = await ensureAuthenticated();
  const client = nakamaService.getClient();
  const normalizedCode = normalizePrivateMatchCodeInput(code);

  if (!isPrivateMatchCode(normalizedCode)) {
    throw new Error("Enter a valid private game code.");
  }

  try {
    const response = await client.rpc(session, RPC_JOIN_PRIVATE_MATCH, { code: normalizedCode });
    const payload = parsePrivateMatchPayload(response.payload);

    if (!session.user_id) {
      throw new Error("Authenticated session is missing user ID.");
    }

    return {
      matchId: payload.matchId,
      modeId: payload.modeId,
      code: payload.code,
      session,
      userId: session.user_id,
    };
  } catch (error) {
    throw normalizeMatchmakingError(error);
  }
};

export const getPrivateMatchStatus = async (code: string): Promise<PrivateMatchStatusResult> => {
  const session = await ensureAuthenticated();
  const client = nakamaService.getClient();
  const normalizedCode = normalizePrivateMatchCodeInput(code);

  if (!isPrivateMatchCode(normalizedCode)) {
    throw new Error("Enter a valid private game code.");
  }

  try {
    const response = await client.rpc(session, RPC_GET_PRIVATE_MATCH_STATUS, { code: normalizedCode });
    const payload = parsePrivateMatchPayload(response.payload, { requireGuestFlag: true });

    return {
      matchId: payload.matchId,
      modeId: payload.modeId,
      code: payload.code,
      hasGuestJoined: Boolean(payload.hasGuestJoined),
    };
  } catch (error) {
    throw normalizeMatchmakingError(error);
  }
};
