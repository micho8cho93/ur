import { Session, Socket } from "@heroiclabs/nakama-js";

import { PlayerColor } from "@/logic/types";
import { isPrivateMatchCode, normalizePrivateMatchCodeInput } from "@/shared/privateMatchCode";
import { nakamaService } from "./nakama";

const RPC_CREATE_PRIVATE_MATCH = "create_private_match";
const RPC_JOIN_PRIVATE_MATCH = "join_private_match";
const RPC_GET_PRIVATE_MATCH_STATUS = "get_private_match_status";
const RPC_LIST_SPECTATABLE_MATCHES = "list_spectatable_matches";
const RPC_CREATE_OPEN_ONLINE_MATCH = "create_open_online_match";
const RPC_LIST_OPEN_ONLINE_MATCHES = "list_open_online_matches";
const RPC_JOIN_OPEN_ONLINE_MATCH = "join_open_online_match";
const RPC_GET_OPEN_ONLINE_MATCH_STATUS = "get_open_online_match_status";
const RPC_GET_ACTIVE_OPEN_ONLINE_MATCH = "get_active_open_online_match";
const CONNECT_TIMEOUT_MS = 10_000;
const START_MATCHMAKING_TIMEOUT_MS = 10_000;
const WAIT_FOR_MATCH_TIMEOUT_MS = 20_000;

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
  message?: string;
  error?: string;
  status?: number;
  statusText?: string;
  headers?: {
    get?: (name: string) => string | null;
  };
  json?: () => Promise<unknown>;
  text?: () => Promise<string>;
  clone?: () => {
    json?: () => Promise<unknown>;
    text?: () => Promise<string>;
  };
};

const readRpcErrorMessage = async (error: StatusLikeError): Promise<string | null> => {
  const directMessage =
    typeof error.message === "string" && error.message.trim().length > 0
      ? error.message.trim()
      : typeof error.error === "string" && error.error.trim().length > 0
        ? error.error.trim()
        : null;

  if (directMessage) {
    return directMessage;
  }

  const responseLike = typeof error.clone === "function" ? error.clone() : error;
  if (typeof responseLike.json === "function") {
    try {
      const payload = await responseLike.json();
      if (typeof payload === "object" && payload !== null) {
        const record = payload as { message?: unknown; error?: unknown };
        if (typeof record.message === "string" && record.message.trim().length > 0) {
          return record.message.trim();
        }
        if (typeof record.error === "string" && record.error.trim().length > 0) {
          return record.error.trim();
        }
      }
    } catch {
      // Fall back to plain text when the response body is not valid JSON.
    }
  }

  if (typeof responseLike.text === "function") {
    try {
      const text = await responseLike.text();
      if (!text || text.trim().length === 0) {
        return null;
      }

      try {
        const payload = JSON.parse(text) as { message?: unknown; error?: unknown };
        if (typeof payload.message === "string" && payload.message.trim().length > 0) {
          return payload.message.trim();
        }
        if (typeof payload.error === "string" && payload.error.trim().length > 0) {
          return payload.error.trim();
        }
      } catch {
        // Use the raw response text when it is not JSON.
      }

      return text.trim();
    } catch {
      return null;
    }
  }

  return null;
};

const normalizeMatchmakingError = async (error: unknown): Promise<Error> => {
  if (error instanceof Error) {
    return error;
  }

  if (typeof error === "object" && error !== null) {
    const responseLike = error as StatusLikeError;
    const message = await readRpcErrorMessage(responseLike);
    const status = responseLike.status;
    const statusText = responseLike.statusText;
    const authenticateHeader =
      responseLike.headers?.get?.("www-authenticate") ?? responseLike.headers?.get?.("WWW-Authenticate");

    if (message) {
      return new Error(message);
    }

    if (status === 401 && authenticateHeader?.toLowerCase().includes("server key invalid")) {
      return new Error("Authentication failed: Nakama server key is invalid or mismatched.");
    }

    if (typeof status === "number") {
      return new Error(`Matchmaking request failed (${status}${statusText ? ` ${statusText}` : ""}).`);
    }
  }

  return new Error("No opponents found. Try again later.");
};

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
  modeId: string;
  code: string;
  session: Session;
  userId: string;
};

export type PrivateMatchStatusResult = {
  matchId: string;
  modeId: string;
  code: string;
  hasGuestJoined: boolean;
};

export type SpectatableMatch = {
  matchId: string;
  modeId: string;
  startedAt: string | null;
  playerLabels: string[];
};

export type OpenOnlineMatchStatus = "open" | "matched" | "expired" | "settled";

export type OpenOnlineMatch = {
  openMatchId: string;
  matchId: string;
  modeId: string;
  creatorUserId: string;
  joinedUserId: string | null;
  wager: number;
  durationMinutes: number;
  status: OpenOnlineMatchStatus;
  createdAt: string;
  expiresAt: string;
  updatedAt: string;
  entrants: number;
  maxEntrants: number;
  isCreator: boolean;
  isJoiner: boolean;
};

export type OpenOnlineMatchResult = {
  match: OpenOnlineMatch;
  session: Session;
  userId: string;
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

type SpectatableMatchRpcPayload = {
  matchId?: unknown;
  match_id?: unknown;
  modeId?: unknown;
  mode_id?: unknown;
  startedAt?: unknown;
  started_at?: unknown;
  playerLabels?: unknown;
  player_labels?: unknown;
};

type OpenOnlineMatchRpcPayload = {
  openMatchId?: unknown;
  open_match_id?: unknown;
  matchId?: unknown;
  match_id?: unknown;
  modeId?: unknown;
  mode_id?: unknown;
  creatorUserId?: unknown;
  creator_user_id?: unknown;
  joinedUserId?: unknown;
  joined_user_id?: unknown;
  wager?: unknown;
  durationMinutes?: unknown;
  duration_minutes?: unknown;
  status?: unknown;
  createdAt?: unknown;
  created_at?: unknown;
  expiresAt?: unknown;
  expires_at?: unknown;
  updatedAt?: unknown;
  updated_at?: unknown;
  entrants?: unknown;
  maxEntrants?: unknown;
  max_entrants?: unknown;
  isCreator?: unknown;
  is_creator?: unknown;
  isJoiner?: unknown;
  is_joiner?: unknown;
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

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : null;

const readNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
};

const parsePrivateMatchPayload = (
  payload: unknown,
  options?: { requireGuestFlag?: boolean }
): { matchId: string; modeId: string; code: string; hasGuestJoined?: boolean } => {
  const rpcPayload = normalizeRpcPayload(payload) as CreatePrivateMatchRpcPayload | undefined;
  const matchId =
    typeof rpcPayload?.matchId === "string"
      ? rpcPayload.matchId
      : typeof rpcPayload?.match_id === "string"
        ? rpcPayload.match_id
        : null;
  const modeId = readString(rpcPayload?.modeId) ?? readString(rpcPayload?.mode_id);
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

  if (!matchId || !modeId || !isPrivateMatchCode(code)) {
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

const parseSpectatableMatchEntry = (entry: unknown): SpectatableMatch | null => {
  const rpcPayload = entry as SpectatableMatchRpcPayload | undefined;
  const matchId =
    typeof rpcPayload?.matchId === "string"
      ? rpcPayload.matchId
      : typeof rpcPayload?.match_id === "string"
        ? rpcPayload.match_id
        : null;
  const modeId = readString(rpcPayload?.modeId) ?? readString(rpcPayload?.mode_id);
  const startedAt =
    typeof rpcPayload?.startedAt === "string"
      ? rpcPayload.startedAt
      : typeof rpcPayload?.started_at === "string"
        ? rpcPayload.started_at
        : null;
  const rawPlayerLabels = Array.isArray(rpcPayload?.playerLabels)
    ? rpcPayload.playerLabels
    : Array.isArray(rpcPayload?.player_labels)
      ? rpcPayload.player_labels
      : [];
  const playerLabels = rawPlayerLabels
    .filter((label): label is string => typeof label === "string" && label.trim().length > 0)
    .map((label) => label.trim())
    .slice(0, 2);

  if (!matchId || !modeId) {
    return null;
  }

  return {
    matchId,
    modeId,
    startedAt,
    playerLabels,
  };
};

const parseSpectatableMatchesPayload = (payload: unknown): SpectatableMatch[] => {
  const rpcPayload = normalizeRpcPayload(payload);
  const matches = Array.isArray(rpcPayload)
    ? rpcPayload
    : typeof rpcPayload === "object" && rpcPayload !== null && Array.isArray((rpcPayload as { matches?: unknown }).matches)
      ? (rpcPayload as { matches: unknown[] }).matches
      : null;

  if (!matches) {
    throw new Error("Live matches returned an invalid payload.");
  }

  return matches
    .map((entry) => parseSpectatableMatchEntry(entry))
    .filter((entry): entry is SpectatableMatch => Boolean(entry));
};

const normalizeOpenOnlineMatchStatus = (value: unknown): OpenOnlineMatchStatus | null => {
  if (value === "open" || value === "matched" || value === "expired" || value === "settled") {
    return value;
  }

  return null;
};

const parseOpenOnlineMatchEntry = (entry: unknown): OpenOnlineMatch | null => {
  const rpcPayload = entry as OpenOnlineMatchRpcPayload | undefined;
  const openMatchId = readString(rpcPayload?.openMatchId) ?? readString(rpcPayload?.open_match_id);
  const matchId = readString(rpcPayload?.matchId) ?? readString(rpcPayload?.match_id);
  const modeId = readString(rpcPayload?.modeId) ?? readString(rpcPayload?.mode_id);
  const creatorUserId = readString(rpcPayload?.creatorUserId) ?? readString(rpcPayload?.creator_user_id);
  const joinedUserId = readString(rpcPayload?.joinedUserId) ?? readString(rpcPayload?.joined_user_id);
  const wager = readNumber(rpcPayload?.wager);
  const durationMinutes = readNumber(rpcPayload?.durationMinutes) ?? readNumber(rpcPayload?.duration_minutes);
  const status = normalizeOpenOnlineMatchStatus(rpcPayload?.status);
  const createdAt = readString(rpcPayload?.createdAt) ?? readString(rpcPayload?.created_at);
  const expiresAt = readString(rpcPayload?.expiresAt) ?? readString(rpcPayload?.expires_at);
  const updatedAt = readString(rpcPayload?.updatedAt) ?? readString(rpcPayload?.updated_at);
  const entrants = readNumber(rpcPayload?.entrants);
  const maxEntrants = readNumber(rpcPayload?.maxEntrants) ?? readNumber(rpcPayload?.max_entrants);
  const isCreator =
    typeof rpcPayload?.isCreator === "boolean"
      ? rpcPayload.isCreator
      : typeof rpcPayload?.is_creator === "boolean"
        ? rpcPayload.is_creator
        : false;
  const isJoiner =
    typeof rpcPayload?.isJoiner === "boolean"
      ? rpcPayload.isJoiner
      : typeof rpcPayload?.is_joiner === "boolean"
        ? rpcPayload.is_joiner
        : false;

  if (
    !openMatchId ||
    !matchId ||
    !modeId ||
    !creatorUserId ||
    wager === null ||
    durationMinutes === null ||
    !status ||
    !createdAt ||
    !expiresAt ||
    !updatedAt
  ) {
    return null;
  }

  return {
    openMatchId,
    matchId,
    modeId,
    creatorUserId,
    joinedUserId,
    wager: Math.max(0, Math.floor(wager)),
    durationMinutes: Math.max(0, Math.floor(durationMinutes)),
    status,
    createdAt,
    expiresAt,
    updatedAt,
    entrants: entrants === null ? (joinedUserId ? 2 : 1) : Math.max(0, Math.floor(entrants)),
    maxEntrants: maxEntrants === null ? 2 : Math.max(1, Math.floor(maxEntrants)),
    isCreator,
    isJoiner,
  };
};

const parseOpenOnlineMatchPayload = (payload: unknown): OpenOnlineMatch => {
  const rpcPayload = normalizeRpcPayload(payload);
  const matchPayload =
    typeof rpcPayload === "object" && rpcPayload !== null && "match" in rpcPayload
      ? (rpcPayload as { match?: unknown }).match
      : rpcPayload;
  const match = parseOpenOnlineMatchEntry(matchPayload);

  if (!match) {
    throw new Error("Open online match returned an invalid payload.");
  }

  return match;
};

const parseOpenOnlineMatchesPayload = (payload: unknown): OpenOnlineMatch[] => {
  const rpcPayload = normalizeRpcPayload(payload);
  const matches = Array.isArray(rpcPayload)
    ? rpcPayload
    : typeof rpcPayload === "object" && rpcPayload !== null && Array.isArray((rpcPayload as { matches?: unknown }).matches)
      ? (rpcPayload as { matches: unknown[] }).matches
      : null;

  if (!matches) {
    throw new Error("Open online matches returned an invalid payload.");
  }

  return matches
    .map((entry) => parseOpenOnlineMatchEntry(entry))
    .filter((entry): entry is OpenOnlineMatch => Boolean(entry));
};

const parseNullableOpenOnlineMatchPayload = (payload: unknown): OpenOnlineMatch | null => {
  const rpcPayload = normalizeRpcPayload(payload);
  const matchPayload =
    typeof rpcPayload === "object" && rpcPayload !== null && "match" in rpcPayload
      ? (rpcPayload as { match?: unknown }).match
      : rpcPayload;

  if (matchPayload === null || matchPayload === undefined) {
    return null;
  }

  const match = parseOpenOnlineMatchEntry(matchPayload);
  if (!match) {
    throw new Error("Open online match returned an invalid payload.");
  }

  return match;
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

    if (!session.user_id) {
      throw new Error("Authenticated session is missing user ID.");
    }

    if (!matched.matchId) {
      throw new Error("Matchmaking did not return a match ID.");
    }

    return {
      matchId: matched.matchId,
      session,
      userId: session.user_id,
      matchmakerTicket: ticket.ticket,
      playerColor: null,
      matchToken: matched.token ?? null,
    };
  } catch (error) {
    await cancelMatchmaking();
    nakamaService.disconnectSocket(false);
    throw await normalizeMatchmakingError(error);
  }
};

export const createPrivateMatch = async (modeId: string = "standard"): Promise<PrivateMatchResult> => {
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
    throw await normalizeMatchmakingError(error);
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
    throw await normalizeMatchmakingError(error);
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
    throw await normalizeMatchmakingError(error);
  }
};

export const listSpectatableMatches = async (): Promise<SpectatableMatch[]> => {
  const session = await ensureAuthenticated();
  const client = nakamaService.getClient();

  try {
    const response = await client.rpc(session, RPC_LIST_SPECTATABLE_MATCHES, {});
    return parseSpectatableMatchesPayload(response.payload);
  } catch (error) {
    throw await normalizeMatchmakingError(error);
  }
};

export const createOpenOnlineMatch = async (
  wager: number,
  durationMinutes: number,
  modeId: string
): Promise<OpenOnlineMatchResult> => {
  const session = await ensureAuthenticated();
  const client = nakamaService.getClient();

  try {
    const response = await client.rpc(session, RPC_CREATE_OPEN_ONLINE_MATCH, { wager, durationMinutes, modeId });
    const match = parseOpenOnlineMatchPayload(response.payload);

    if (!session.user_id) {
      throw new Error("Authenticated session is missing user ID.");
    }

    return {
      match,
      session,
      userId: session.user_id,
    };
  } catch (error) {
    throw await normalizeMatchmakingError(error);
  }
};

export const listOpenOnlineMatches = async (): Promise<OpenOnlineMatch[]> => {
  const session = await ensureAuthenticated();
  const client = nakamaService.getClient();

  try {
    const response = await client.rpc(session, RPC_LIST_OPEN_ONLINE_MATCHES, {});
    return parseOpenOnlineMatchesPayload(response.payload);
  } catch (error) {
    throw await normalizeMatchmakingError(error);
  }
};

export const joinOpenOnlineMatch = async (openMatchId: string): Promise<OpenOnlineMatchResult> => {
  const session = await ensureAuthenticated();
  const client = nakamaService.getClient();

  try {
    const response = await client.rpc(session, RPC_JOIN_OPEN_ONLINE_MATCH, { openMatchId });
    const match = parseOpenOnlineMatchPayload(response.payload);

    if (!session.user_id) {
      throw new Error("Authenticated session is missing user ID.");
    }

    return {
      match,
      session,
      userId: session.user_id,
    };
  } catch (error) {
    throw await normalizeMatchmakingError(error);
  }
};

export const getOpenOnlineMatchStatus = async (openMatchId: string): Promise<OpenOnlineMatch> => {
  const session = await ensureAuthenticated();
  const client = nakamaService.getClient();

  try {
    const response = await client.rpc(session, RPC_GET_OPEN_ONLINE_MATCH_STATUS, { openMatchId });
    return parseOpenOnlineMatchPayload(response.payload);
  } catch (error) {
    throw await normalizeMatchmakingError(error);
  }
};

export const getActiveOpenOnlineMatch = async (): Promise<OpenOnlineMatch | null> => {
  const session = await ensureAuthenticated();
  const client = nakamaService.getClient();

  try {
    const response = await client.rpc(session, RPC_GET_ACTIVE_OPEN_ONLINE_MATCH, {});
    return parseNullableOpenOnlineMatchPayload(response.payload);
  } catch (error) {
    throw await normalizeMatchmakingError(error);
  }
};
