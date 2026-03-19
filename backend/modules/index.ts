/*
  Nakama runtime entrypoint.
  Authoritative Royal Game of Ur match implementation.
*/

import { applyMove, createInitialState, getValidMoves, rollDice } from "../../logic/engine";
import { PATH_DARK, PATH_LENGTH, PATH_LIGHT, isWarZone } from "../../logic/constants";
import { GameState, PlayerColor } from "../../logic/types";
import {
  awardXpForMatchWin,
  createProgressionAwardNotification,
  rpcGetProgression,
  RPC_GET_PROGRESSION,
  rpcGetUserXpProgress,
  RPC_GET_USER_XP_PROGRESS,
} from "./progression";
import {
  ensureChallengeDefinitions,
  processCompletedMatch,
  rpcGetChallengeDefinitions,
  rpcSubmitCompletedBotMatch,
  rpcGetUserChallengeProgress,
  RPC_GET_CHALLENGE_DEFINITIONS,
  RPC_GET_USER_CHALLENGE_PROGRESS,
  RPC_SUBMIT_COMPLETED_BOT_MATCH,
} from "./challenges";
import {
  MatchOpCode,
  MoveRequestPayload,
  RollRequestPayload,
  ServerErrorCode,
  StateSnapshotPayload,
  decodePayload,
  encodePayload,
  isMoveRequestPayload,
  isRollRequestPayload,
} from "../../shared/urMatchProtocol";
import { CompletedMatchSummary, OpponentType, calculateComebackCheckpoint } from "../../shared/challenges";

declare namespace nkruntime {
  type Context = any;
  type Logger = any;
  type Nakama = any;
  type Initializer = any;
  type Presence = any;
  type MatchmakerMatched = any;
  type MatchDispatcher = any;
  type MatchMessage = any;
}

type MatchState = {
  presences: Record<string, nkruntime.Presence>;
  assignments: Record<string, PlayerColor>;
  gameState: GameState;
  revision: number;
  opponentType: OpponentType;
  telemetry: MatchTelemetry;
};

type MatchPlayerTelemetry = {
  playerMoveCount: number;
  maxRollCount: number;
  capturesMade: number;
  capturesSuffered: number;
  contestedTilesLandedCount: number;
  wasBehindDuringMatch: boolean;
  behindCheckpointCount: number;
  behindReasons: Set<"progress_deficit" | "borne_off_deficit">;
};

type MatchTelemetry = {
  totalMoves: number;
  players: Record<PlayerColor, MatchPlayerTelemetry>;
};

type RuntimeRecord = Record<string, unknown>;

const TICK_RATE = 10;
const MAX_PLAYERS = 2;
const ONLINE_TTL_MS = 30_000;

const RPC_AUTH_LINK_CUSTOM = "auth_link_custom";
const RPC_GET_PROGRESSION_NAME = RPC_GET_PROGRESSION;
const RPC_GET_USER_XP_PROGRESS_NAME = RPC_GET_USER_XP_PROGRESS;
const RPC_GET_CHALLENGE_DEFINITIONS_NAME = RPC_GET_CHALLENGE_DEFINITIONS;
const RPC_GET_USER_CHALLENGE_PROGRESS_NAME = RPC_GET_USER_CHALLENGE_PROGRESS;
const RPC_SUBMIT_COMPLETED_BOT_MATCH_NAME = RPC_SUBMIT_COMPLETED_BOT_MATCH;
const RPC_MATCHMAKER_ADD = "matchmaker_add";
const RPC_PRESENCE_HEARTBEAT = "presence_heartbeat";
const RPC_PRESENCE_COUNT = "presence_count";
const MATCH_HANDLER = "authoritative_match";
const onlinePresenceByDevice = new Map<string, number>();

const asRecord = (value: unknown): RuntimeRecord | null =>
  typeof value === "object" && value !== null ? (value as RuntimeRecord) : null;

const readStringField = (value: unknown, keys: string[]): string | null => {
  const record = asRecord(value);
  if (!record) {
    return null;
  }

  for (const key of keys) {
    const field = record[key];
    if (typeof field === "string" && field.length > 0) {
      return field;
    }
  }

  return null;
};

const readNumberField = (value: unknown, keys: string[]): number | null => {
  const record = asRecord(value);
  if (!record) {
    return null;
  }

  for (const key of keys) {
    const field = record[key];
    if (typeof field === "number" && Number.isFinite(field)) {
      return field;
    }
  }

  return null;
};

const encodeBytesToString = (bytes: Uint8Array): string => {
  if (typeof TextDecoder !== "undefined") {
    try {
      return new TextDecoder().decode(bytes);
    } catch {
      // Fall through to manual decode.
    }
  }

  let output = "";
  for (let i = 0; i < bytes.length; i += 1) {
    output += String.fromCharCode(bytes[i]);
  }
  return output;
};

const decodeMessageData = (data: unknown, nk?: nkruntime.Nakama): string => {
  if (typeof data === "string") {
    return data;
  }

  const binaryToString = asRecord(nk)?.binaryToString;
  if (typeof binaryToString === "function") {
    try {
      return String(binaryToString(data));
    } catch {
      // Fall back to local decoding when runtime helper is unavailable.
    }
  }

  if (typeof ArrayBuffer !== "undefined" && data instanceof ArrayBuffer) {
    return encodeBytesToString(new Uint8Array(data));
  }

  if (typeof Uint8Array !== "undefined" && data instanceof Uint8Array) {
    return encodeBytesToString(data);
  }

  if (Array.isArray(data) && data.every((value) => typeof value === "number")) {
    return encodeBytesToString(Uint8Array.from(data));
  }

  return String(data ?? "");
};

const getPresenceUserId = (presence: unknown): string | null =>
  readStringField(presence, ["userId", "user_id"]);

const getSenderUserId = (sender: unknown): string | null =>
  readStringField(sender, ["userId", "user_id"]);

const getMatchId = (ctx: nkruntime.Context): string =>
  readStringField(ctx, ["matchId", "match_id"]) ?? "";

const getMessageOpCode = (message: nkruntime.MatchMessage): number | null =>
  readNumberField(message, ["opCode", "op_code"]);

const getContextUserId = (ctx: nkruntime.Context): string | null =>
  readStringField(ctx, ["userId", "user_id"]);

const pruneOnlinePresence = (nowMs: number): void => {
  onlinePresenceByDevice.forEach((lastSeenMs, deviceKey) => {
    if (nowMs - lastSeenMs > ONLINE_TTL_MS) {
      onlinePresenceByDevice.delete(deviceKey);
    }
  });
};

const encodeOnlinePresencePayload = (nowMs: number): string =>
  JSON.stringify({
    onlineCount: onlinePresenceByDevice.size,
    onlineTtlMs: ONLINE_TTL_MS,
    serverTimeMs: nowMs,
  });

const createPlayerTelemetry = (): MatchPlayerTelemetry => ({
  playerMoveCount: 0,
  maxRollCount: 0,
  capturesMade: 0,
  capturesSuffered: 0,
  contestedTilesLandedCount: 0,
  wasBehindDuringMatch: false,
  behindCheckpointCount: 0,
  behindReasons: new Set(),
});

const createMatchTelemetry = (): MatchTelemetry => ({
  totalMoves: 0,
  players: {
    light: createPlayerTelemetry(),
    dark: createPlayerTelemetry(),
  },
});

const getPathCoord = (color: PlayerColor, index: number) => {
  if (index < 0 || index >= PATH_LENGTH) {
    return null;
  }

  return color === "light" ? PATH_LIGHT[index] ?? null : PATH_DARK[index] ?? null;
};

const detectCaptureOnMove = (state: GameState, move: MoveRequestPayload["move"]): boolean => {
  const moverColor = state.currentTurn;
  const opponentColor: PlayerColor = moverColor === "light" ? "dark" : "light";
  const targetCoord = getPathCoord(moverColor, move.toIndex);
  if (!targetCoord) {
    return false;
  }

  return state[opponentColor].pieces.some((piece) => {
    if (piece.position < 0 || piece.isFinished) {
      return false;
    }

    const pieceCoord = getPathCoord(opponentColor, piece.position);
    return Boolean(pieceCoord && pieceCoord.row === targetCoord.row && pieceCoord.col === targetCoord.col);
  });
};

const updateComebackTelemetry = (state: MatchState): void => {
  (["light", "dark"] as PlayerColor[]).forEach((playerColor) => {
    const checkpoint = calculateComebackCheckpoint(state.gameState, playerColor);
    if (!checkpoint.wasBehind) {
      return;
    }

    const playerTelemetry = state.telemetry.players[playerColor];
    playerTelemetry.wasBehindDuringMatch = true;
    playerTelemetry.behindCheckpointCount += 1;
    checkpoint.reasons.forEach((reason) => playerTelemetry.behindReasons.add(reason));
  });
};

const buildPlayerMatchSummary = (
  state: MatchState,
  matchId: string,
  playerUserId: string,
  playerColor: PlayerColor
): CompletedMatchSummary => {
  const opponentColor: PlayerColor = playerColor === "light" ? "dark" : "light";
  const playerTelemetry = state.telemetry.players[playerColor];

  return {
    matchId,
    playerUserId,
    opponentType: state.opponentType,
    didWin: state.gameState.winner === playerColor,
    totalMoves: state.telemetry.totalMoves,
    playerMoveCount: playerTelemetry.playerMoveCount,
    piecesLost: playerTelemetry.capturesSuffered,
    maxRollCount: playerTelemetry.maxRollCount,
    capturesMade: playerTelemetry.capturesMade,
    capturesSuffered: playerTelemetry.capturesSuffered,
    contestedTilesLandedCount: playerTelemetry.contestedTilesLandedCount,
    borneOffCount: state.gameState[playerColor].finishedCount,
    opponentBorneOffCount: state.gameState[opponentColor].finishedCount,
    wasBehindDuringMatch: playerTelemetry.wasBehindDuringMatch,
    behindCheckpointCount: playerTelemetry.behindCheckpointCount,
    behindReasons: Array.from(playerTelemetry.behindReasons),
    timestamp: new Date().toISOString(),
  };
};

// Nakama's JS runtime parser can panic on shorthand object properties in registerMatch.
// Use distinct local aliases so emitted JS keeps explicit key:value pairs.
const matchInitHandler = matchInit;
const matchJoinAttemptHandler = matchJoinAttempt;
const matchJoinHandler = matchJoin;
const matchLeaveHandler = matchLeave;
const matchLoopHandler = matchLoop;
const matchTerminateHandler = matchTerminate;
const matchSignalHandler = matchSignal;

function InitModule(
  _ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  initializer: nkruntime.Initializer
) {
  initializer.registerRpc(RPC_AUTH_LINK_CUSTOM, rpcAuthLinkCustom);
  initializer.registerRpc(RPC_GET_PROGRESSION_NAME, rpcGetProgression);
  initializer.registerRpc(RPC_GET_USER_XP_PROGRESS_NAME, rpcGetUserXpProgress);
  initializer.registerRpc(RPC_GET_CHALLENGE_DEFINITIONS_NAME, rpcGetChallengeDefinitions);
  initializer.registerRpc(RPC_GET_USER_CHALLENGE_PROGRESS_NAME, rpcGetUserChallengeProgress);
  initializer.registerRpc(RPC_SUBMIT_COMPLETED_BOT_MATCH_NAME, rpcSubmitCompletedBotMatch);
  initializer.registerRpc(RPC_MATCHMAKER_ADD, rpcMatchmakerAdd);
  initializer.registerRpc(RPC_PRESENCE_HEARTBEAT, rpcPresenceHeartbeat);
  initializer.registerRpc(RPC_PRESENCE_COUNT, rpcPresenceCount);
  initializer.registerMatch(MATCH_HANDLER, {
    matchInit: matchInitHandler,
    matchJoinAttempt: matchJoinAttemptHandler,
    matchJoin: matchJoinHandler,
    matchLeave: matchLeaveHandler,
    matchLoop: matchLoopHandler,
    matchTerminate: matchTerminateHandler,
    matchSignal: matchSignalHandler,
  });
  initializer.registerMatchmakerMatched(matchmakerMatched);
  try {
    ensureChallengeDefinitions(nk, logger);
  } catch (error) {
    logger.warn(
      "Skipping challenge definition sync on startup: %s",
      error instanceof Error ? error.message : String(error)
    );
  }

  logger.info("Nakama runtime module loaded.");
}

function rpcPresenceHeartbeat(
  ctx: nkruntime.Context,
  _logger: nkruntime.Logger,
  _nk: nkruntime.Nakama,
  _payload: string
): string {
  const userId = getContextUserId(ctx);
  if (!userId) {
    throw new Error("Authentication required.");
  }

  const nowMs = Date.now();
  onlinePresenceByDevice.set(userId, nowMs);
  pruneOnlinePresence(nowMs);
  return encodeOnlinePresencePayload(nowMs);
}

function rpcPresenceCount(
  ctx: nkruntime.Context,
  _logger: nkruntime.Logger,
  _nk: nkruntime.Nakama,
  _payload: string
): string {
  const userId = getContextUserId(ctx);
  if (!userId) {
    throw new Error("Authentication required.");
  }

  const nowMs = Date.now();
  pruneOnlinePresence(nowMs);
  return encodeOnlinePresencePayload(nowMs);
}

function rpcAuthLinkCustom(
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  payload: string
): string {
  if (!ctx.userId) {
    throw new Error("Authentication required.");
  }

  const data = payload ? JSON.parse(payload) : {};
  const customId = data.customId as string | undefined;
  const username = data.username as string | undefined;

  if (!customId) {
    throw new Error("customId is required.");
  }

  nk.linkCustom(ctx.userId, customId, username);
  logger.info("Linked custom ID to user %s", ctx.userId);

  return JSON.stringify({
    userId: ctx.userId,
    customId,
  });
}

function rpcMatchmakerAdd(
  ctx: nkruntime.Context,
  _logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  payload: string
): string {
  if (!ctx.userId || !ctx.sessionId) {
    throw new Error("Authentication required.");
  }

  const data = payload ? JSON.parse(payload) : {};
  const minCount = Number.isInteger(data.minCount) ? data.minCount : 2;
  const maxCount = Number.isInteger(data.maxCount) ? data.maxCount : 2;
  const query = typeof data.query === "string" ? data.query : "*";
  const stringProperties = typeof data.stringProperties === "object" ? data.stringProperties : {};
  const numericProperties = typeof data.numericProperties === "object" ? data.numericProperties : {};

  const ticket = nk.matchmakerAdd(
    ctx.userId,
    ctx.sessionId,
    query,
    minCount,
    maxCount,
    stringProperties,
    numericProperties
  );

  return JSON.stringify({ ticket });
}

function matchmakerMatched(
  _ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  matched: nkruntime.MatchmakerMatched
): string {
  const users = Array.isArray(matched.users) ? matched.users : [];
  const playerIds = users
    .map((user: any) => getPresenceUserId(user?.presence))
    .filter((userId: string | null): userId is string => Boolean(userId))
    .slice(0, MAX_PLAYERS);
  logger.info("Matchmaker matched %s players", playerIds.length);

  return nk.matchCreate(MATCH_HANDLER, { playerIds });
}

function matchInit(
  _ctx: nkruntime.Context,
  _logger: nkruntime.Logger,
  _nk: nkruntime.Nakama,
  params: Record<string, unknown>
): { state: MatchState; tickRate: number; label: string } {
  const playerIds = Array.isArray(params.playerIds) ? (params.playerIds as string[]) : [];

  const assignments: Record<string, PlayerColor> = {};
  if (playerIds[0]) {
    assignments[playerIds[0]] = "light";
  }
  if (playerIds[1]) {
    assignments[playerIds[1]] = "dark";
  }

  const state: MatchState = {
    presences: {},
    assignments,
    gameState: createInitialState(),
    revision: 0,
    opponentType: "human",
    telemetry: createMatchTelemetry(),
  };

  return { state, tickRate: TICK_RATE, label: MATCH_HANDLER };
}

function matchJoinAttempt(
  _ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  _nk: nkruntime.Nakama,
  _dispatcher: nkruntime.MatchDispatcher,
  _tick: number,
  state: MatchState,
  presence: nkruntime.Presence
): { state: MatchState; accept: boolean; rejectMessage?: string } {
  const userId = getPresenceUserId(presence);
  if (!userId) {
    logger.warn("Rejecting join attempt with missing user ID.");
    return { state, accept: false, rejectMessage: "Unable to identify player." };
  }

  const activeCount = Object.keys(state.presences).length;
  const hasExistingAssignment = Boolean(state.assignments[userId]);

  if (activeCount >= MAX_PLAYERS && !hasExistingAssignment) {
    return { state, accept: false, rejectMessage: "Match is full." };
  }

  state.presences[userId] = presence;
  ensureAssignment(state, userId);

  return { state, accept: true };
}

function matchJoin(
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  _nk: nkruntime.Nakama,
  dispatcher: nkruntime.MatchDispatcher,
  _tick: number,
  state: MatchState,
  presences: nkruntime.Presence[]
): { state: MatchState } {
  presences.forEach((presence) => {
    const userId = getPresenceUserId(presence);
    if (!userId) {
      logger.warn("Skipping join presence with missing user ID.");
      return;
    }
    state.presences[userId] = presence;
    ensureAssignment(state, userId);
  });

  broadcastSnapshot(dispatcher, state, getMatchId(ctx));

  return { state };
}

function matchLeave(
  _ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  _nk: nkruntime.Nakama,
  _dispatcher: nkruntime.MatchDispatcher,
  _tick: number,
  state: MatchState,
  presences: nkruntime.Presence[]
): { state: MatchState } {
  presences.forEach((presence) => {
    const userId = getPresenceUserId(presence);
    if (!userId) {
      logger.warn("Skipping leave presence with missing user ID.");
      return;
    }
    delete state.presences[userId];
  });

  return { state };
}

function matchLoop(
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  dispatcher: nkruntime.MatchDispatcher,
  _tick: number,
  state: MatchState,
  messages: nkruntime.MatchMessage[]
): { state: MatchState } {
  const matchId = getMatchId(ctx);

  messages.forEach((message) => {
    const senderUserId = getSenderUserId(message.sender);
    if (!senderUserId) {
      logger.warn("Ignoring message with missing sender user ID.");
      return;
    }

    const senderPresence = state.presences[senderUserId];
    const senderColor = state.assignments[senderUserId];

    if (!senderPresence || !senderColor) {
      sendError(
        dispatcher,
        state,
        senderUserId,
        "UNAUTHORIZED_PLAYER",
        "Only assigned players can send match commands."
      );
      return;
    }

    const opCode = getMessageOpCode(message);
    if (opCode === null) {
      sendError(dispatcher, state, senderUserId, "UNKNOWN_OP", "Message opcode is missing.");
      return;
    }

    const rawPayload = decodeMessageData(message.data, nk);
    const decodedPayload = decodePayload(rawPayload);

    if (opCode === MatchOpCode.ROLL_REQUEST) {
      if (!isRollRequestPayload(decodedPayload)) {
        sendError(dispatcher, state, senderUserId, "INVALID_PAYLOAD", "Roll payload is invalid.");
        return;
      }

      applyRollRequest(logger, dispatcher, state, senderUserId, senderColor, decodedPayload, matchId);
      return;
    }

    if (opCode === MatchOpCode.MOVE_REQUEST) {
      if (!isMoveRequestPayload(decodedPayload)) {
        sendError(dispatcher, state, senderUserId, "INVALID_PAYLOAD", "Move payload is invalid.");
        return;
      }

      applyMoveRequest(logger, nk, dispatcher, state, senderUserId, senderColor, decodedPayload, matchId);
      return;
    }

    sendError(dispatcher, state, senderUserId, "UNKNOWN_OP", `Unsupported opcode ${opCode}.`);
  });

  return { state };
}

function matchTerminate(
  _ctx: nkruntime.Context,
  _logger: nkruntime.Logger,
  _nk: nkruntime.Nakama,
  _dispatcher: nkruntime.MatchDispatcher,
  _tick: number,
  state: MatchState,
  _graceSeconds: number
): { state: MatchState } {
  return { state };
}

function matchSignal(
  ctx: nkruntime.Context,
  _logger: nkruntime.Logger,
  _nk: nkruntime.Nakama,
  dispatcher: nkruntime.MatchDispatcher,
  _tick: number,
  state: MatchState,
  data: string
): { state: MatchState } | string {
  if (data === "snapshot") {
    broadcastSnapshot(dispatcher, state, getMatchId(ctx));
  }
  return { state };
}

function ensureAssignment(state: MatchState, userId: string): void {
  if (state.assignments[userId]) {
    return;
  }

  const assignedColors = Object.values(state.assignments);
  if (!assignedColors.includes("light")) {
    state.assignments[userId] = "light";
    return;
  }

  if (!assignedColors.includes("dark")) {
    state.assignments[userId] = "dark";
  }
}

function applyRollRequest(
  logger: nkruntime.Logger,
  dispatcher: nkruntime.MatchDispatcher,
  state: MatchState,
  userId: string,
  playerColor: PlayerColor,
  _payload: RollRequestPayload,
  matchId: string
): void {
  if (state.gameState.winner) {
    sendError(dispatcher, state, userId, "INVALID_PHASE", "The match has already ended.");
    return;
  }

  if (state.gameState.currentTurn !== playerColor) {
    sendError(dispatcher, state, userId, "INVALID_TURN", "It is not your turn to roll.");
    return;
  }

  if (state.gameState.phase !== "rolling") {
    sendError(dispatcher, state, userId, "INVALID_PHASE", "Roll is only valid during rolling phase.");
    return;
  }

  const rollValue = rollDice();
  if (rollValue === 4) {
    state.telemetry.players[playerColor].maxRollCount += 1;
  }

  const rollingState: GameState = {
    ...state.gameState,
    rollValue,
    phase: "moving",
  };

  const validMoves = getValidMoves(rollingState, rollValue);

  if (validMoves.length === 0) {
    state.gameState = {
      ...rollingState,
      currentTurn: rollingState.currentTurn === "light" ? "dark" : "light",
      phase: "rolling",
      rollValue: null,
      history: [...rollingState.history, `${rollingState.currentTurn} rolled ${rollValue} but had no moves.`],
    };
    updateComebackTelemetry(state);
  } else {
    state.gameState = rollingState;
  }

  state.revision += 1;
  logger.debug("Applied roll for %s (revision %d)", userId, state.revision);
  broadcastSnapshot(dispatcher, state, matchId);
}

function applyMoveRequest(
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  dispatcher: nkruntime.MatchDispatcher,
  state: MatchState,
  userId: string,
  playerColor: PlayerColor,
  payload: MoveRequestPayload,
  matchId: string
): void {
  if (state.gameState.winner) {
    sendError(dispatcher, state, userId, "INVALID_PHASE", "The match has already ended.");
    return;
  }

  if (state.gameState.currentTurn !== playerColor) {
    sendError(dispatcher, state, userId, "INVALID_TURN", "It is not your turn to move.");
    return;
  }

  if (state.gameState.phase !== "moving" || state.gameState.rollValue === null) {
    sendError(dispatcher, state, userId, "INVALID_PHASE", "Move is only valid during moving phase.");
    return;
  }

  const validMoves = getValidMoves(state.gameState, state.gameState.rollValue);
  const moveIsValid = validMoves.some(
    (validMove) =>
      validMove.pieceId === payload.move.pieceId &&
      validMove.fromIndex === payload.move.fromIndex &&
      validMove.toIndex === payload.move.toIndex
  );

  if (!moveIsValid) {
    sendError(dispatcher, state, userId, "INVALID_MOVE", "Move is not valid for current state.");
    return;
  }

  const didCapture = detectCaptureOnMove(state.gameState, payload.move);
  const targetCoord = getPathCoord(playerColor, payload.move.toIndex);
  state.gameState = applyMove(state.gameState, payload.move);
  state.telemetry.totalMoves += 1;
  state.telemetry.players[playerColor].playerMoveCount += 1;

  if (didCapture) {
    const opponentColor: PlayerColor = playerColor === "light" ? "dark" : "light";
    state.telemetry.players[playerColor].capturesMade += 1;
    state.telemetry.players[opponentColor].capturesSuffered += 1;
  }

  if (targetCoord && isWarZone(targetCoord.row, targetCoord.col)) {
    state.telemetry.players[playerColor].contestedTilesLandedCount += 1;
  }

  updateComebackTelemetry(state);
  state.revision += 1;
  logger.debug("Applied move for %s (revision %d)", userId, state.revision);
  broadcastSnapshot(dispatcher, state, matchId);

  if (state.gameState.winner) {
    awardWinnerProgression(logger, nk, dispatcher, state, matchId);
    processCompletedMatchSummaries(logger, nk, state, matchId);
  }
}

function awardWinnerProgression(
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  dispatcher: nkruntime.MatchDispatcher,
  state: MatchState,
  matchId: string
): void {
  const winnerColor = state.gameState.winner;
  if (!winnerColor) {
    return;
  }

  const winnerEntry = Object.entries(state.assignments).find(([, color]) => color === winnerColor);
  if (!winnerEntry) {
    logger.warn("Match %s ended with winner color %s but no assigned user was found.", matchId, winnerColor);
    return;
  }

  const [winnerUserId] = winnerEntry;

  try {
    const awardResponse = awardXpForMatchWin(nk, logger, {
      userId: winnerUserId,
      matchId,
      source: "pvp_win",
    });

    if (awardResponse.duplicate) {
      return;
    }

    const winnerPresence = state.presences[winnerUserId];
    if (!winnerPresence) {
      logger.info(
        "Progression updated for winner %s on match %s, but no live presence was available for notification.",
        winnerUserId,
        matchId
      );
      return;
    }

    dispatcher.broadcastMessage(
      MatchOpCode.PROGRESSION_AWARD,
      encodePayload(createProgressionAwardNotification(awardResponse)),
      [winnerPresence]
    );
  } catch (error) {
    logger.error(
      "Failed to award progression for winner %s on match %s: %s",
      winnerUserId,
      matchId,
      error instanceof Error ? error.message : String(error)
    );
  }
}

function processCompletedMatchSummaries(
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  state: MatchState,
  matchId: string
): void {
  Object.entries(state.assignments).forEach(([playerUserId, playerColor]) => {
    try {
      const summary = buildPlayerMatchSummary(state, matchId, playerUserId, playerColor);
      processCompletedMatch(nk, logger, summary);
    } catch (error) {
      logger.error(
        "Failed to process challenge summary for user %s on match %s: %s",
        playerUserId,
        matchId,
        error instanceof Error ? error.message : String(error)
      );
    }
  });
}

function sendError(
  dispatcher: nkruntime.MatchDispatcher,
  state: MatchState,
  userId: string,
  code: ServerErrorCode,
  message: string
): void {
  const target = state.presences[userId];
  if (!target) {
    return;
  }

  dispatcher.broadcastMessage(
    MatchOpCode.SERVER_ERROR,
    encodePayload({
      type: "server_error",
      code,
      message,
      revision: state.revision,
    }),
    [target]
  );
}

function broadcastSnapshot(dispatcher: nkruntime.MatchDispatcher, state: MatchState, matchId: string): void {
  const payload: StateSnapshotPayload = {
    type: "state_snapshot",
    matchId,
    revision: state.revision,
    gameState: state.gameState,
    assignments: state.assignments,
  };

  dispatcher.broadcastMessage(MatchOpCode.STATE_SNAPSHOT, encodePayload(payload));
}

type RuntimeGlobalBindings = {
  InitModule: typeof InitModule;
  rpcAuthLinkCustom: typeof rpcAuthLinkCustom;
  rpcMatchmakerAdd: typeof rpcMatchmakerAdd;
  rpcPresenceHeartbeat: typeof rpcPresenceHeartbeat;
  rpcPresenceCount: typeof rpcPresenceCount;
  matchmakerMatched: typeof matchmakerMatched;
  matchInit: typeof matchInit;
  matchJoinAttempt: typeof matchJoinAttempt;
  matchJoin: typeof matchJoin;
  matchLeave: typeof matchLeave;
  matchLoop: typeof matchLoop;
  matchTerminate: typeof matchTerminate;
  matchSignal: typeof matchSignal;
};

const runtimeGlobals: RuntimeGlobalBindings = {
  InitModule,
  rpcAuthLinkCustom,
  rpcMatchmakerAdd,
  rpcPresenceHeartbeat,
  rpcPresenceCount,
  matchmakerMatched,
  matchInit,
  matchJoinAttempt,
  matchJoin,
  matchLeave,
  matchLoop,
  matchTerminate,
  matchSignal,
};

Object.assign(globalThis as Record<string, unknown>, runtimeGlobals);
