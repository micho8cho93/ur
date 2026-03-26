/*
  Nakama runtime entrypoint.
  Authoritative Royal Game of Ur match implementation.
*/

import { applyMove, createInitialState, getValidMoves, rollDice } from "../../logic/engine";
import { PATH_DARK, PATH_LENGTH, PATH_LIGHT, isWarZone } from "../../logic/constants";
import { MatchModeId, getMatchConfig, isMatchModeId } from "../../logic/matchConfigs";
import { GameState, PlayerColor } from "../../logic/types";
import {
  awardXpForMatchWin,
  createProgressionAwardNotification,
  findStorageObject,
  getStorageObjectVersion,
  rpcGetProgression,
  RPC_GET_PROGRESSION,
  rpcGetUserXpProgress,
  RPC_GET_USER_XP_PROGRESS,
  STORAGE_PERMISSION_NONE,
} from "./progression";
import {
  createEloRatingChangeNotification,
  ensureEloLeaderboard,
  processRankedMatchResult,
  rpcGetEloLeaderboardAroundMe,
  rpcGetMyRatingProfile,
  rpcListTopEloPlayers,
  RPC_GET_ELO_LEADERBOARD_AROUND_ME,
  RPC_GET_MY_RATING_PROFILE,
  RPC_LIST_TOP_ELO_PLAYERS,
} from "./elo";
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
import type { XpSource } from "../../shared/progression";
import {
  generatePrivateMatchCode,
  isPrivateMatchCode,
  normalizePrivateMatchCodeInput,
} from "../../shared/privateMatchCode";
import {
  requireCompletedUsernameOnboarding,
  rpcClaimUsername,
  rpcGetUsernameOnboardingStatus,
  RPC_CLAIM_USERNAME,
  RPC_GET_USERNAME_ONBOARDING_STATUS,
} from "./usernameOnboarding";
import {
  RPC_ADMIN_CLOSE_TOURNAMENT,
  RPC_ADMIN_CREATE_TOURNAMENT_RUN,
  RPC_ADMIN_FINALIZE_TOURNAMENT,
  RPC_ADMIN_GET_TOURNAMENT_AUDIT_LOG,
  RPC_ADMIN_GET_TOURNAMENT_RUN,
  RPC_ADMIN_GET_TOURNAMENT_STANDINGS,
  RPC_ADMIN_LIST_TOURNAMENTS,
  RPC_ADMIN_OPEN_TOURNAMENT,
  RPC_ADMIN_WHOAMI,
  RPC_TOURNAMENT_JOIN,
  rpcAdminCloseTournament,
  rpcAdminCreateTournamentRun,
  rpcAdminFinalizeTournament,
  rpcAdminGetTournamentAuditLog,
  rpcAdminGetTournamentRun,
  rpcAdminGetTournamentStandings,
  rpcAdminListTournaments,
  rpcAdminOpenTournament,
  rpcAdminWhoAmI,
  rpcJoinTournament,
} from "./tournaments";
import {
  processCompletedAuthoritativeTournamentMatch,
  resolveTournamentMatchContextFromParams,
  type AuthoritativeTournamentMatchCompletion,
  type TournamentMatchContext,
  type TournamentMatchPlayerSummary,
} from "./tournaments/matchResults";

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
  presences: Record<string, Record<string, nkruntime.Presence>>;
  assignments: Record<string, PlayerColor>;
  gameState: GameState;
  revision: number;
  opponentType: OpponentType;
  modeId: MatchModeId;
  classification: MatchClassification;
  privateMatch: boolean;
  privateCode: string | null;
  privateCreatorUserId: string | null;
  privateGuestUserId: string | null;
  winRewardSource: XpSource;
  allowsChallengeRewards: boolean;
  tournamentContext: TournamentMatchContext | null;
  telemetry: MatchTelemetry;
};

type RuntimeStorageObject = RuntimeRecord & {
  value?: unknown;
  version?: string;
};

type PrivateMatchCodeRecord = {
  code: string;
  matchId: string;
  modeId: MatchModeId;
  creatorUserId: string;
  joinedUserId: string | null;
  createdAt: string;
  updatedAt: string;
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

type MatchClassification = {
  ranked: boolean;
  casual: boolean;
  private: boolean;
  bot: boolean;
  experimental: boolean;
};

type RuntimeRecord = Record<string, unknown>;

const TICK_RATE = 10;
const MAX_PLAYERS = 2;
const ONLINE_TTL_MS = 30_000;
const SYSTEM_USER_ID = "00000000-0000-0000-0000-000000000000";

const RPC_AUTH_LINK_CUSTOM = "auth_link_custom";
const RPC_GET_PROGRESSION_NAME = RPC_GET_PROGRESSION;
const RPC_GET_USER_XP_PROGRESS_NAME = RPC_GET_USER_XP_PROGRESS;
const RPC_GET_CHALLENGE_DEFINITIONS_NAME = RPC_GET_CHALLENGE_DEFINITIONS;
const RPC_GET_USER_CHALLENGE_PROGRESS_NAME = RPC_GET_USER_CHALLENGE_PROGRESS;
const RPC_SUBMIT_COMPLETED_BOT_MATCH_NAME = RPC_SUBMIT_COMPLETED_BOT_MATCH;
const RPC_MATCHMAKER_ADD = "matchmaker_add";
const RPC_CREATE_PRIVATE_MATCH = "create_private_match";
const RPC_JOIN_PRIVATE_MATCH = "join_private_match";
const RPC_GET_PRIVATE_MATCH_STATUS = "get_private_match_status";
const RPC_PRESENCE_HEARTBEAT = "presence_heartbeat";
const RPC_PRESENCE_COUNT = "presence_count";
const RPC_GET_USERNAME_ONBOARDING_STATUS_NAME = RPC_GET_USERNAME_ONBOARDING_STATUS;
const RPC_CLAIM_USERNAME_NAME = RPC_CLAIM_USERNAME;
const MATCH_HANDLER = "authoritative_match";
const PRIVATE_MATCH_CODE_COLLECTION = "private_match_codes";
const PRIVATE_MATCH_CODE_MAX_GENERATION_ATTEMPTS = 12;
const PRIVATE_MATCH_CODE_WRITE_ATTEMPTS = 4;
const onlinePresenceByUser = new Map<string, number>();

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

const getPresenceSessionId = (presence: unknown): string | null =>
  readStringField(presence, ["sessionId", "session_id"]);

const getSenderUserId = (sender: unknown): string | null =>
  readStringField(sender, ["userId", "user_id"]);

const getPresenceKey = (presence: unknown): string | null => {
  const sessionId = getPresenceSessionId(presence);
  if (sessionId) {
    return sessionId;
  }

  const userId = getPresenceUserId(presence);
  return userId ? `user:${userId}` : null;
};

const getMatchId = (ctx: nkruntime.Context): string =>
  readStringField(ctx, ["matchId", "match_id"]) ?? "";

const getMessageOpCode = (message: nkruntime.MatchMessage): number | null =>
  readNumberField(message, ["opCode", "op_code"]);

const getContextUserId = (ctx: nkruntime.Context): string | null =>
  readStringField(ctx, ["userId", "user_id"]);

const resolveMatchModeId = (value: unknown): MatchModeId =>
  isMatchModeId(value) ? value : "standard";

const buildMatchClassification = (params: Record<string, unknown>, modeId: MatchModeId): MatchClassification => {
  const config = getMatchConfig(modeId);
  const privateMatch = params.privateMatch === true;
  const botMatch = params.botMatch === true;
  const casualMatch = params.casualMatch === true;
  const experimental = !config.allowsRankedStats;
  const ranked =
    params.rankedMatch === true ||
    (!privateMatch && !botMatch && !casualMatch && !experimental && params.rankedMatch !== false);

  return {
    ranked,
    casual: casualMatch,
    private: privateMatch,
    bot: botMatch,
    experimental,
  };
};

const pruneOnlinePresence = (nowMs: number): void => {
  onlinePresenceByUser.forEach((lastSeenMs, userId) => {
    if (nowMs - lastSeenMs > ONLINE_TTL_MS) {
      onlinePresenceByUser.delete(userId);
    }
  });
};

const encodeOnlinePresencePayload = (nowMs: number): string =>
  JSON.stringify({
    onlineCount: onlinePresenceByUser.size,
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

const parseRpcPayload = (payload: string): RuntimeRecord => {
  if (!payload) {
    return {};
  }

  const data = JSON.parse(payload);
  return asRecord(data) ?? {};
};

const normalizePrivateMatchCodeRecord = (value: unknown): PrivateMatchCodeRecord | null => {
  const record = asRecord(value);
  if (!record) {
    return null;
  }

  const code = normalizePrivateMatchCodeInput(readStringField(record, ["code"]) ?? "");
  const matchId = readStringField(record, ["matchId", "match_id"]);
  const modeId = record.modeId;
  const creatorUserId = readStringField(record, ["creatorUserId", "creator_user_id"]);
  const joinedUserId = readStringField(record, ["joinedUserId", "joined_user_id"]);
  const createdAt = readStringField(record, ["createdAt", "created_at"]);
  const updatedAt = readStringField(record, ["updatedAt", "updated_at"]);

  if (!isPrivateMatchCode(code) || !matchId || !isMatchModeId(modeId) || !creatorUserId || !createdAt || !updatedAt) {
    return null;
  }

  return {
    code,
    matchId,
    modeId,
    creatorUserId,
    joinedUserId: joinedUserId ?? null,
    createdAt,
    updatedAt,
  };
};

const readPrivateMatchCodeObject = (
  nk: nkruntime.Nakama,
  code: string
): { object: RuntimeStorageObject | null; record: PrivateMatchCodeRecord | null } => {
  const normalizedCode = normalizePrivateMatchCodeInput(code);
  if (!isPrivateMatchCode(normalizedCode)) {
    return {
      object: null,
      record: null,
    };
  }

  const objects = nk.storageRead([
    {
      collection: PRIVATE_MATCH_CODE_COLLECTION,
      key: normalizedCode,
      userId: SYSTEM_USER_ID,
    },
  ]) as RuntimeStorageObject[];
  const object = findStorageObject(objects, PRIVATE_MATCH_CODE_COLLECTION, normalizedCode, SYSTEM_USER_ID);

  return {
    object,
    record: normalizePrivateMatchCodeRecord(object?.value),
  };
};

const writePrivateMatchCodeRecord = (
  nk: nkruntime.Nakama,
  record: PrivateMatchCodeRecord,
  version: string
): void => {
  nk.storageWrite([
    {
      collection: PRIVATE_MATCH_CODE_COLLECTION,
      key: record.code,
      value: record,
      version,
      permissionRead: STORAGE_PERMISSION_NONE,
      permissionWrite: STORAGE_PERMISSION_NONE,
    },
  ]);
};

const createAvailablePrivateMatchCode = (nk: nkruntime.Nakama): string => {
  for (let attempt = 0; attempt < PRIVATE_MATCH_CODE_MAX_GENERATION_ATTEMPTS; attempt += 1) {
    const code = generatePrivateMatchCode();
    const existing = readPrivateMatchCodeObject(nk, code);

    if (existing.record) {
      continue;
    }

    return code;
  }

  throw new Error("Unable to create a private game code right now.");
};

const createPrivateMatchCodeRecord = (
  nk: nkruntime.Nakama,
  modeId: MatchModeId,
  matchId: string,
  creatorUserId: string,
  code: string
): PrivateMatchCodeRecord => {
  const now = new Date().toISOString();
  const record: PrivateMatchCodeRecord = {
    code,
    matchId,
    modeId,
    creatorUserId,
    joinedUserId: null,
    createdAt: now,
    updatedAt: now,
  };

  writePrivateMatchCodeRecord(nk, record, "*");
  return record;
};

const claimPrivateMatchCode = (
  nk: nkruntime.Nakama,
  code: string,
  userId: string
): PrivateMatchCodeRecord => {
  const normalizedCode = normalizePrivateMatchCodeInput(code);
  if (!isPrivateMatchCode(normalizedCode)) {
    throw new Error("Enter a valid private game code.");
  }

  for (let attempt = 0; attempt < PRIVATE_MATCH_CODE_WRITE_ATTEMPTS; attempt += 1) {
    const { object, record } = readPrivateMatchCodeObject(nk, normalizedCode);
    if (!record) {
      throw new Error("Private game code not found.");
    }

    if (record.creatorUserId === userId || record.joinedUserId === userId) {
      return record;
    }

    if (record.joinedUserId && record.joinedUserId !== userId) {
      throw new Error("This private game code has already been claimed.");
    }

    const nextRecord: PrivateMatchCodeRecord = {
      ...record,
      joinedUserId: userId,
      updatedAt: new Date().toISOString(),
    };

    try {
      writePrivateMatchCodeRecord(nk, nextRecord, getStorageObjectVersion(object) ?? "");
      return nextRecord;
    } catch {
      // Retry when another guest claims between read and write.
    }
  }

  throw new Error("Unable to claim this private game code right now.");
};

const syncPrivateMatchReservation = (nk: nkruntime.Nakama, state: MatchState): void => {
  if (!state.privateMatch || !state.privateCode) {
    return;
  }

  const { record } = readPrivateMatchCodeObject(nk, state.privateCode);
  if (!record) {
    return;
  }

  state.privateCreatorUserId = record.creatorUserId;
  state.privateGuestUserId = record.joinedUserId;
};

const canUserJoinPrivateMatch = (state: MatchState, userId: string): boolean => {
  if (!state.privateMatch) {
    return true;
  }

  if (state.privateCreatorUserId && state.privateCreatorUserId === userId) {
    return true;
  }

  return Boolean(state.privateGuestUserId && state.privateGuestUserId === userId);
};

const getUserPresenceTargets = (state: MatchState, userId: string): nkruntime.Presence[] =>
  Object.values(state.presences[userId] ?? {});

const getPrimaryUserPresence = (state: MatchState, userId: string): nkruntime.Presence | null =>
  getUserPresenceTargets(state, userId)[0] ?? null;

const getActiveUserCount = (state: MatchState): number =>
  Object.keys(state.presences).length;

const upsertPresence = (state: MatchState, presence: nkruntime.Presence): void => {
  const userId = getPresenceUserId(presence);
  const presenceKey = getPresenceKey(presence);

  if (!userId || !presenceKey) {
    return;
  }

  state.presences[userId] = {
    ...(state.presences[userId] ?? {}),
    [presenceKey]: presence,
  };
};

const removePresence = (state: MatchState, presence: nkruntime.Presence): void => {
  const userId = getPresenceUserId(presence);
  const presenceKey = getPresenceKey(presence);

  if (!userId || !presenceKey) {
    return;
  }

  const userPresences = state.presences[userId];
  if (!userPresences) {
    return;
  }

  delete userPresences[presenceKey];
  if (Object.keys(userPresences).length === 0) {
    delete state.presences[userId];
  }
};

const isPrivateMatchReady = (state: MatchState): boolean =>
  !state.privateMatch || getActiveUserCount(state) >= MAX_PLAYERS;

const buildPrivateMatchRpcResponse = (
  matchId: string,
  modeId: MatchModeId,
  privateCode: string,
  hasGuestJoined?: boolean
): string =>
  JSON.stringify({
    matchId,
    modeId,
    // Some deployed Nakama runtimes have dropped a `code` field from RPC payloads.
    // Keep the original key for compatibility and add a second alias the client can fall back to.
    code: privateCode,
    privateCode,
    ...(typeof hasGuestJoined === "boolean" ? { hasGuestJoined } : {}),
  });

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

const getPresenceUsername = (presence: unknown): string | null =>
  readStringField(presence, ["username", "displayName", "display_name", "name"]);

const buildTournamentMatchCompletion = (
  state: MatchState,
  matchId: string
): AuthoritativeTournamentMatchCompletion | null => {
  if (!state.tournamentContext) {
    return null;
  }

  const completedAt = new Date().toISOString();
  const winningColor = state.gameState.winner;
  const players: TournamentMatchPlayerSummary[] = Object.entries(state.assignments).map(([userId, color]) => {
    const presence = getPrimaryUserPresence(state, userId);
    const playerTelemetry = state.telemetry.players[color];

    return {
      userId,
      username: getPresenceUsername(presence),
      color,
      didWin: winningColor === color,
      score: winningColor === color ? 1 : 0,
      finishedCount: state.gameState[color].finishedCount,
      capturesMade: playerTelemetry.capturesMade,
      capturesSuffered: playerTelemetry.capturesSuffered,
      playerMoveCount: playerTelemetry.playerMoveCount,
    };
  });
  const winner = winningColor ? players.find((player) => player.color === winningColor) ?? null : null;
  const loser = winningColor ? players.find((player) => player.color !== winningColor) ?? null : null;

  return {
    matchId,
    modeId: state.modeId,
    context: state.tournamentContext,
    completedAt,
    totalMoves: state.telemetry.totalMoves,
    revision: state.revision,
    winningColor,
    winnerUserId: winner?.userId ?? null,
    loserUserId: loser?.userId ?? null,
    classification: {
      ranked: state.classification.ranked,
      casual: state.classification.casual,
      private: state.classification.private,
      bot: state.classification.bot,
      experimental: state.classification.experimental,
    },
    players,
  };
};

function processCompletedTournamentMatch(
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  state: MatchState,
  matchId: string
): void {
  if (!state.tournamentContext) {
    return;
  }

  try {
    const completion = buildTournamentMatchCompletion(state, matchId);
    if (!completion) {
      return;
    }

    processCompletedAuthoritativeTournamentMatch(nk, logger, completion);
  } catch (error) {
    logger.error(
      "Failed to process tournament result for match %s: %s",
      matchId,
      error instanceof Error ? error.message : String(error)
    );
  }
}

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
  initializer.registerRpc(RPC_GET_MY_RATING_PROFILE, rpcGetMyRatingProfile);
  initializer.registerRpc(RPC_LIST_TOP_ELO_PLAYERS, rpcListTopEloPlayers);
  initializer.registerRpc(RPC_GET_ELO_LEADERBOARD_AROUND_ME, rpcGetEloLeaderboardAroundMe);
  initializer.registerRpc(RPC_GET_CHALLENGE_DEFINITIONS_NAME, rpcGetChallengeDefinitions);
  initializer.registerRpc(RPC_GET_USER_CHALLENGE_PROGRESS_NAME, rpcGetUserChallengeProgress);
  initializer.registerRpc(RPC_SUBMIT_COMPLETED_BOT_MATCH_NAME, rpcSubmitCompletedBotMatch);
  initializer.registerRpc(RPC_MATCHMAKER_ADD, rpcMatchmakerAdd);
  initializer.registerRpc(RPC_CREATE_PRIVATE_MATCH, rpcCreatePrivateMatch);
  initializer.registerRpc(RPC_JOIN_PRIVATE_MATCH, rpcJoinPrivateMatch);
  initializer.registerRpc(RPC_GET_PRIVATE_MATCH_STATUS, rpcGetPrivateMatchStatus);
  initializer.registerRpc(RPC_PRESENCE_HEARTBEAT, rpcPresenceHeartbeat);
  initializer.registerRpc(RPC_PRESENCE_COUNT, rpcPresenceCount);
  initializer.registerRpc(RPC_GET_USERNAME_ONBOARDING_STATUS_NAME, rpcGetUsernameOnboardingStatus);
  initializer.registerRpc(RPC_CLAIM_USERNAME_NAME, rpcClaimUsername);
  initializer.registerRpc(RPC_ADMIN_WHOAMI, rpcAdminWhoAmI);
  initializer.registerRpc(RPC_ADMIN_LIST_TOURNAMENTS, rpcAdminListTournaments);
  initializer.registerRpc(RPC_ADMIN_GET_TOURNAMENT_RUN, rpcAdminGetTournamentRun);
  initializer.registerRpc(RPC_ADMIN_CREATE_TOURNAMENT_RUN, rpcAdminCreateTournamentRun);
  initializer.registerRpc(RPC_ADMIN_OPEN_TOURNAMENT, rpcAdminOpenTournament);
  initializer.registerRpc(RPC_ADMIN_CLOSE_TOURNAMENT, rpcAdminCloseTournament);
  initializer.registerRpc(RPC_ADMIN_FINALIZE_TOURNAMENT, rpcAdminFinalizeTournament);
  initializer.registerRpc(RPC_ADMIN_GET_TOURNAMENT_STANDINGS, rpcAdminGetTournamentStandings);
  initializer.registerRpc(RPC_ADMIN_GET_TOURNAMENT_AUDIT_LOG, rpcAdminGetTournamentAuditLog);
  initializer.registerRpc(RPC_TOURNAMENT_JOIN, rpcJoinTournament);
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
    ensureEloLeaderboard(nk, logger);
  } catch (error) {
    logger.warn(
      "Skipping Elo leaderboard setup on startup: %s",
      error instanceof Error ? error.message : String(error)
    );
  }

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
  onlinePresenceByUser.set(userId, nowMs);
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

  requireCompletedUsernameOnboarding(nk, ctx.userId);

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

function rpcCreatePrivateMatch(
  ctx: nkruntime.Context,
  _logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  payload: string
): string {
  if (!ctx.userId) {
    throw new Error("Authentication required.");
  }

  requireCompletedUsernameOnboarding(nk, ctx.userId);

  const data = parseRpcPayload(payload);
  const modeId = resolveMatchModeId(data.modeId);
  const privateCode = createAvailablePrivateMatchCode(nk);
  const matchId = nk.matchCreate(MATCH_HANDLER, {
    playerIds: [ctx.userId],
    modeId,
    rankedMatch: false,
    casualMatch: false,
    botMatch: false,
    privateMatch: true,
    privateCode,
    privateCreatorUserId: ctx.userId,
    winRewardSource: "private_pvp_win",
    allowsChallengeRewards: false,
  });
  createPrivateMatchCodeRecord(nk, modeId, matchId, ctx.userId, privateCode);

  return buildPrivateMatchRpcResponse(matchId, modeId, privateCode);
}

function rpcJoinPrivateMatch(
  ctx: nkruntime.Context,
  _logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  payload: string
): string {
  if (!ctx.userId) {
    throw new Error("Authentication required.");
  }

  requireCompletedUsernameOnboarding(nk, ctx.userId);

  const data = parseRpcPayload(payload);
  const requestedCode = typeof data.code === "string" ? data.code : "";
  const reservation = claimPrivateMatchCode(nk, requestedCode, ctx.userId);

  return buildPrivateMatchRpcResponse(reservation.matchId, reservation.modeId, reservation.code);
}

function rpcGetPrivateMatchStatus(
  ctx: nkruntime.Context,
  _logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  payload: string
): string {
  if (!ctx.userId) {
    throw new Error("Authentication required.");
  }

  requireCompletedUsernameOnboarding(nk, ctx.userId);

  const data = parseRpcPayload(payload);
  const requestedCode = typeof data.code === "string" ? data.code : "";
  const normalizedCode = normalizePrivateMatchCodeInput(requestedCode);

  if (!isPrivateMatchCode(normalizedCode)) {
    throw new Error("Enter a valid private game code.");
  }

  const { record } = readPrivateMatchCodeObject(nk, normalizedCode);
  if (!record) {
    throw new Error("Private game code not found.");
  }

  if (record.creatorUserId !== ctx.userId && record.joinedUserId !== ctx.userId) {
    throw new Error("You do not have access to this private game.");
  }

  return buildPrivateMatchRpcResponse(
    record.matchId,
    record.modeId,
    record.code,
    Boolean(record.joinedUserId)
  );
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

  return nk.matchCreate(MATCH_HANDLER, {
    playerIds,
    modeId: "standard",
    rankedMatch: true,
    casualMatch: false,
    botMatch: false,
    privateMatch: false,
    winRewardSource: "pvp_win",
    allowsChallengeRewards: true,
  });
}

function matchInit(
  _ctx: nkruntime.Context,
  _logger: nkruntime.Logger,
  _nk: nkruntime.Nakama,
  params: Record<string, unknown>
): { state: MatchState; tickRate: number; label: string } {
  const playerIds = Array.isArray(params.playerIds) ? (params.playerIds as string[]) : [];
  const modeId = resolveMatchModeId(params.modeId);
  const classification = buildMatchClassification(params, modeId);
  const privateMatch = classification.private;
  const privateCode = typeof params.privateCode === "string" ? normalizePrivateMatchCodeInput(params.privateCode) : "";
  const privateCreatorUserId =
    typeof params.privateCreatorUserId === "string" ? params.privateCreatorUserId : null;
  const winRewardSource = params.winRewardSource === "private_pvp_win" ? "private_pvp_win" : "pvp_win";
  const allowsChallengeRewards = params.allowsChallengeRewards !== false;

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
    gameState: createInitialState(getMatchConfig(modeId)),
    revision: 0,
    opponentType: "human",
    modeId,
    classification,
    privateMatch,
    privateCode: isPrivateMatchCode(privateCode) ? privateCode : null,
    privateCreatorUserId,
    privateGuestUserId: null,
    winRewardSource,
    allowsChallengeRewards,
    tournamentContext: resolveTournamentMatchContextFromParams(params),
    telemetry: createMatchTelemetry(),
  };

  return { state, tickRate: TICK_RATE, label: MATCH_HANDLER };
}

function matchJoinAttempt(
  _ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
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

  try {
    requireCompletedUsernameOnboarding(nk, userId);
  } catch (error) {
    return {
      state,
      accept: false,
      rejectMessage: error instanceof Error ? error.message : "Choose a username before joining online matches.",
    };
  }

  if (state.privateMatch) {
    syncPrivateMatchReservation(nk, state);

    if (!canUserJoinPrivateMatch(state, userId)) {
      return { state, accept: false, rejectMessage: "Enter the private game code before joining this table." };
    }
  }

  const activeCount = getActiveUserCount(state);
  const hasExistingAssignment = Boolean(state.assignments[userId]);

  if (activeCount >= MAX_PLAYERS && !hasExistingAssignment) {
    return { state, accept: false, rejectMessage: "Match is full." };
  }

  upsertPresence(state, presence);
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
    upsertPresence(state, presence);
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
    removePresence(state, presence);
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

    upsertPresence(state, message.sender);
    const senderColor = state.assignments[senderUserId];

    if (!senderColor) {
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

  if (!isPrivateMatchReady(state)) {
    sendError(dispatcher, state, userId, "MATCH_NOT_READY", "Waiting for the other player to join.");
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

  if (!isPrivateMatchReady(state)) {
    sendError(dispatcher, state, userId, "MATCH_NOT_READY", "Waiting for the other player to join.");
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
    processCompletedMatchRatings(logger, nk, dispatcher, state, matchId);
    awardWinnerProgression(logger, nk, dispatcher, state, matchId);
    processCompletedTournamentMatch(logger, nk, state, matchId);
    processCompletedMatchSummaries(logger, nk, state, matchId);
  }
}

function processCompletedMatchRatings(
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
  const loserEntry = Object.entries(state.assignments).find(([, color]) => color !== winnerColor);

  if (!winnerEntry || !loserEntry) {
    logger.warn("Match %s could not resolve both Elo participants.", matchId);
    return;
  }

  const [winnerUserId] = winnerEntry;
  const [loserUserId] = loserEntry;

  try {
    const ratingResult = processRankedMatchResult(nk, logger, {
      matchId,
      winnerUserId,
      loserUserId,
      ranked: state.classification.ranked,
      privateMatch: state.classification.private,
      botMatch: state.classification.bot,
      casualMatch: state.classification.casual,
      experimentalMode: state.classification.experimental,
    });

    if (!ratingResult) {
      return;
    }

    ratingResult.record.playerResults.forEach((playerResult) => {
      const targetPresences = getUserPresenceTargets(state, playerResult.userId);
      if (targetPresences.length === 0) {
        logger.info(
          "Ranked Elo processed for user %s on match %s, but no live presence was available for notification.",
          playerResult.userId,
          matchId
        );
        return;
      }

      dispatcher.broadcastMessage(
        MatchOpCode.ELO_RATING_UPDATE,
        encodePayload(
          createEloRatingChangeNotification(
            ratingResult.record,
            playerResult.userId,
            ratingResult.ranksByUserId,
            ratingResult.duplicate
          )
        ),
        targetPresences
      );
    });
  } catch (error) {
    logger.error(
      "Failed to process ranked Elo result for match %s: %s",
      matchId,
      error instanceof Error ? error.message : String(error)
    );
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
      source: state.winRewardSource,
    });

    if (awardResponse.duplicate) {
      return;
    }

    const winnerPresence = getPrimaryUserPresence(state, winnerUserId);
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
  if (!state.allowsChallengeRewards) {
    return;
  }

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
  const targets = getUserPresenceTargets(state, userId);
  if (targets.length === 0) {
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
    targets
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
  rpcGetUsernameOnboardingStatus: typeof rpcGetUsernameOnboardingStatus;
  rpcClaimUsername: typeof rpcClaimUsername;
  rpcGetMyRatingProfile: typeof rpcGetMyRatingProfile;
  rpcListTopEloPlayers: typeof rpcListTopEloPlayers;
  rpcGetEloLeaderboardAroundMe: typeof rpcGetEloLeaderboardAroundMe;
  rpcMatchmakerAdd: typeof rpcMatchmakerAdd;
  rpcCreatePrivateMatch: typeof rpcCreatePrivateMatch;
  rpcJoinPrivateMatch: typeof rpcJoinPrivateMatch;
  rpcGetPrivateMatchStatus: typeof rpcGetPrivateMatchStatus;
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
  rpcGetUsernameOnboardingStatus,
  rpcClaimUsername,
  rpcGetMyRatingProfile,
  rpcListTopEloPlayers,
  rpcGetEloLeaderboardAroundMe,
  rpcMatchmakerAdd,
  rpcCreatePrivateMatch,
  rpcJoinPrivateMatch,
  rpcGetPrivateMatchStatus,
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
