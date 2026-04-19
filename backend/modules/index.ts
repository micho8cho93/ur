/*
  Nakama runtime entrypoint.
  Authoritative Royal Game of Ur match implementation.
*/

import { getBotMove } from "../../logic/bot/bot";
import { DEFAULT_BOT_DIFFICULTY, isBotDifficulty, type BotDifficulty } from "../../logic/bot/types";
import { applyMove, createInitialState, getValidMoves, rollDice } from "../../logic/engine";
import { getMatchConfig, isMatchModeId, type MatchConfig } from "../../logic/matchConfigs";
import { getPathCoord as getVariantPathCoord, getPathLength } from "../../logic/pathVariants";
import { GameState, PlayerColor } from "../../logic/types";
import {
  awardXpForMatchWin,
  createProgressionAwardNotification,
  findStorageObject,
  getProgressionForUser,
  getStorageObjectValue,
  getStorageObjectVersion,
  normalizeProgressionProfile,
  PROGRESSION_COLLECTION,
  PROGRESSION_PROFILE_KEY,
  rpcGetProgression,
  RPC_GET_PROGRESSION,
  rpcGetUserXpProgress,
  RPC_GET_USER_XP_PROGRESS,
  STORAGE_PERMISSION_NONE,
} from "./progression";
import {
  createEloRatingChangeNotification,
  ensureEloLeaderboard,
  getEloRatingProfileForUser,
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
  getUserChallengeProgress,
  processCompletedMatch,
  rpcGetChallengeDefinitions,
  rpcSubmitCompletedBotMatch,
  rpcGetUserChallengeProgress,
  RPC_GET_CHALLENGE_DEFINITIONS,
  RPC_GET_USER_CHALLENGE_PROGRESS,
  RPC_SUBMIT_COMPLETED_BOT_MATCH,
  type ProcessCompletedMatchResult,
} from "./challenges";
import {
  getWalletForUser,
  RPC_GET_WALLET,
  rpcGetWallet,
} from "./wallet";
import {
  RPC_CONFIRM_GEM_PACK_PURCHASE,
  rpcConfirmGemPackPurchase,
} from "./gemPurchase";
import {
  RPC_GET_OWNED_COSMETICS,
  RPC_GET_FULL_CATALOG,
  RPC_GET_STOREFRONT,
  RPC_PURCHASE_ITEM,
  RPC_ADMIN_CLEAR_MANUAL_ROTATION,
  RPC_ADMIN_DISABLE_COSMETIC,
  RPC_ADMIN_DELETE_COSMETIC,
  RPC_ADMIN_ENABLE_COSMETIC,
  RPC_ADMIN_GET_FULL_CATALOG,
  RPC_ADMIN_GET_ROTATION_STATE,
  RPC_ADMIN_GET_STORE_STATS,
  RPC_ADMIN_REMOVE_LIMITED_TIME_EVENT,
  RPC_ADMIN_SET_LIMITED_TIME_EVENT,
  RPC_ADMIN_SET_MANUAL_ROTATION,
  RPC_ADMIN_UPSERT_COSMETIC,
  rpcAdminClearManualRotation,
  rpcAdminDisableCosmetic,
  rpcAdminDeleteCosmetic,
  rpcAdminEnableCosmetic,
  rpcAdminGetFullCatalog,
  rpcAdminGetRotationState,
  rpcAdminGetStoreStats,
  rpcAdminRemoveLimitedTimeEvent,
  rpcAdminSetLimitedTimeEvent,
  rpcAdminSetManualRotation,
  rpcAdminUpsertCosmetic,
  rpcGetFullCatalog,
  rpcGetOwnedCosmetics,
  rpcGetStorefront,
  rpcPurchaseItem,
} from "./cosmeticStore";
import {
  RPC_ADMIN_DISABLE_GAME_MODE,
  RPC_ADMIN_ENABLE_GAME_MODE,
  RPC_ADMIN_FEATURE_GAME_MODE,
  RPC_ADMIN_GET_GAME_MODE,
  RPC_ADMIN_LIST_GAME_MODES,
  RPC_ADMIN_UNFEATURE_GAME_MODE,
  RPC_ADMIN_UPSERT_GAME_MODE,
  RPC_GET_GAME_MODES,
  rpcAdminDisableGameMode,
  rpcAdminEnableGameMode,
  rpcAdminFeatureGameMode,
  rpcAdminGetGameMode,
  rpcAdminListGameModes,
  rpcAdminUnfeatureGameMode,
  rpcAdminUpsertGameMode,
  rpcGetGameModes,
  getPublicGameModes,
} from "./gameModes";
import { normalizeChallengeProgressSnapshot } from "./challengeProgress";
import {
  EmojiReactionBroadcastPayload,
  EmojiReactionRequestPayload,
  MatchEndPayload,
  MatchOpCode,
  MAX_EMOJI_REACTIONS_PER_MATCH,
  MoveRequestPayload,
  PieceSelectionBroadcastPayload,
  PieceSelectionRequestPayload,
  RematchDecision,
  RematchResponsePayload,
  RollRequestPayload,
  ServerErrorCode,
  StateSnapshotRematch,
  StateSnapshotPayload,
  TournamentMatchRewardSummaryPayload,
  decodePayload,
  encodePayload,
  isEmojiReactionRequestPayload,
  isMoveRequestPayload,
  isPieceSelectionRequestPayload,
  isRematchResponsePayload,
  isRollRequestPayload,
} from "../../shared/urMatchProtocol";
import { buildGameModeMatchConfig } from "../../shared/gameModes";
import {
  CHALLENGE_THRESHOLDS,
  CompletedMatchSummary,
  OpponentType,
  calculateComebackCheckpoint,
  calculateDoubleStrikeTurnSpan,
  countActivePiecesOnBoard,
  getOpponentDifficultyFromType,
  getPositionLeadRelation,
  hasPlayerExitedStartingArea,
  isContestedLanding,
  isOneSuccessfulMoveFromVictory,
} from "../../shared/challenges";
import {
  DEFAULT_ELO_RATING,
  ELO_LEADERBOARD_ID,
  PROVISIONAL_RATED_GAMES,
  sanitizeEloRating,
  sanitizeRatedGameCount,
} from "../../shared/elo";
import { buildProgressionSnapshot, type ProgressionAwardResponse, type XpSource } from "../../shared/progression";
import { SOFT_CURRENCY_KEY } from "../../shared/wallet";
import {
  generatePrivateMatchCode,
  isPrivateMatchCode,
  normalizePrivateMatchCodeInput,
} from "../../shared/privateMatchCode";
import {
  getUsernameOnboardingProfile,
  requireCompletedUsernameOnboarding,
  rpcClaimUsername,
  rpcGetUsernameOnboardingStatus,
  RPC_CLAIM_USERNAME,
  RPC_GET_USERNAME_ONBOARDING_STATUS,
} from "./usernameOnboarding";
import {
  RPC_ADMIN_LIST_FEEDBACK,
  RPC_SUBMIT_FEEDBACK,
  rpcAdminListFeedback,
  rpcSubmitFeedback,
} from "./feedback";
import {
  RPC_ADMIN_CLOSE_TOURNAMENT,
  RPC_ADMIN_CREATE_TOURNAMENT_RUN,
  RPC_ADMIN_DELETE_TOURNAMENT,
  RPC_ADMIN_EXPORT_TOURNAMENT,
  RPC_ADMIN_FINALIZE_TOURNAMENT,
  RPC_ADMIN_GET_TOURNAMENT_AUDIT_LOG,
  RPC_ADMIN_GET_TOURNAMENT_LIVE_STATUS,
  RPC_ADMIN_GET_TOURNAMENT_RUN,
  RPC_ADMIN_GET_TOURNAMENT_STANDINGS,
  RPC_ADMIN_LIST_TOURNAMENTS,
  RPC_ADMIN_OPEN_TOURNAMENT,
  RPC_GET_ACTIVE_TOURNAMENT_FLOW,
  RPC_GET_PUBLIC_TOURNAMENT,
  RPC_GET_PUBLIC_TOURNAMENT_STANDINGS,
  RPC_JOIN_PUBLIC_TOURNAMENT,
  RPC_LAUNCH_TOURNAMENT_MATCH,
  RPC_LIST_PUBLIC_TOURNAMENTS,
  RPC_ADMIN_WHOAMI,
  RPC_TOURNAMENT_JOIN,
  rpcAdminCloseTournament,
  rpcAdminCreateTournamentRun,
  rpcAdminDeleteTournament,
  rpcAdminExportTournament,
  rpcAdminFinalizeTournament,
  rpcAdminGetTournamentAuditLog,
  rpcAdminGetTournamentLiveStatus,
  rpcAdminGetTournamentRun,
  rpcAdminGetTournamentStandings,
  rpcAdminListTournaments,
  rpcAdminOpenTournament,
  rpcAdminWhoAmI,
  rpcGetActiveTournamentFlow,
  rpcGetPublicTournament,
  rpcGetPublicTournamentStandings,
  rpcJoinTournament,
  rpcJoinPublicTournament,
  rpcLaunchTournamentMatch,
  rpcListPublicTournaments,
} from "./tournaments";
import {
  RPC_ADMIN_GET_ANALYTICS_GAMEPLAY,
  RPC_ADMIN_GET_ANALYTICS_OVERVIEW,
  RPC_ADMIN_GET_ANALYTICS_PLAYERS,
  RPC_ADMIN_GET_ANALYTICS_PROGRESSION,
  RPC_ADMIN_GET_ANALYTICS_REALTIME,
  RPC_ADMIN_GET_ANALYTICS_SUMMARY,
  RPC_ADMIN_GET_ANALYTICS_TOURNAMENTS,
  rpcAdminGetAnalyticsGameplay,
  rpcAdminGetAnalyticsOverview,
  rpcAdminGetAnalyticsPlayers,
  rpcAdminGetAnalyticsProgression,
  rpcAdminGetAnalyticsRealtime,
  rpcAdminGetAnalyticsSummary,
  rpcAdminGetAnalyticsTournaments,
} from "./analytics";
import {
  createAnalyticsEventWriteBuffer,
  flushAnalyticsEventWriteBuffer,
  getOnlinePresenceSnapshot,
  recordMatchEndAnalyticsEvent,
  recordMatchStartAnalyticsEvent,
  trackPresenceHeartbeat,
  listActiveTrackedMatches,
  type AnalyticsEventWriteBuffer,
  unregisterActiveMatch,
} from "./analytics/tracking";
import {
  maybeAutoFinalizeTournamentRunById,
  processCompletedAuthoritativeTournamentMatch,
  resolveTournamentMatchContextFromParams,
  type AuthoritativeTournamentMatchCompletion,
  type TournamentMatchContext,
  type TournamentMatchPlayerSummary,
} from "./tournaments/matchResults";
import { isTournamentBotUserId } from "../../shared/tournamentBots";

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
  spectatorPresences: Record<string, Record<string, nkruntime.Presence>>;
  assignments: Record<string, PlayerColor>;
  playerTitles: Record<string, string>;
  playerRankTitles: Record<string, string | null>;
  bot: MatchBotState;
  gameState: GameState;
  revision: number;
  started: boolean;
  opponentType: OpponentType;
  modeId: string;
  classification: MatchClassification;
  privateMatch: boolean;
  privateCode: string | null;
  privateCreatorUserId: string | null;
  privateGuestUserId: string | null;
  openOnlineMatchId: string | null;
  openOnlineMatchWager: number | null;
  openOnlineMatchCreatorUserId: string | null;
  openOnlineMatchJoinerUserId: string | null;
  winRewardSource: XpSource;
  allowsChallengeRewards: boolean;
  tournamentContext: TournamentMatchContext | null;
  tournamentMatchWinXp: number | null;
  reactionCounts: Record<string, number>;
  rollDisplay: MatchRollDisplayState;
  telemetry: MatchTelemetry;
  timer: MatchTimerState;
  matchStartedAtMs: number | null;
  afk: Record<PlayerColor, PlayerAfkState>;
  disconnect: Record<PlayerColor, PlayerDisconnectState>;
  matchEnd: MatchEndPayload | null;
  rematch: MatchRematchState;
  resultRecorded: boolean;
};

type MatchRatingSummary = {
  oldRating: number;
  newRating: number;
  delta: number;
};

type MatchRatingProcessingResult = {
  byUserId: Record<string, MatchRatingSummary>;
};

type MatchChallengeProcessingResults = Record<string, ProcessCompletedMatchResult>;

type TournamentRewardSummaryReadModel = Pick<
  TournamentMatchRewardSummaryPayload,
  "progression" | "challengeProgress" | "eloProfile"
>;

type TournamentRewardOutcome = TournamentMatchRewardSummaryPayload["tournamentOutcome"];

type RuntimeStorageObject = RuntimeRecord & {
  value?: unknown;
  version?: string;
};

type PrivateMatchCodeRecord = {
  code: string;
  matchId: string | null;
  modeId: string;
  creatorUserId: string;
  joinedUserId: string | null;
  createdAt: string;
  updatedAt: string;
};

type OpenOnlineMatchStatus = "open" | "matched" | "expired" | "settled";

type OpenOnlineMatchRecord = {
  openMatchId: string;
  matchId: string;
  modeId: string;
  creatorUserId: string;
  joinedUserId: string | null;
  wager: number;
  durationMinutes: number;
  status: OpenOnlineMatchStatus;
  creatorEscrowRefunded: boolean;
  potPaidOut: boolean;
  createdAt: string;
  expiresAt: string;
  updatedAt: string;
};

type MatchPlayerTelemetry = {
  playerMoveCount: number;
  playerTurnCount: number;
  maxRollCount: number;
  unusableRollCount: number;
  capturesMade: number;
  capturesSuffered: number;
  captureTurnNumbers: number[];
  currentCaptureTurnStreak: number;
  maxCaptureTurnStreak: number;
  contestedTilesLandedCount: number;
  wasBehindDuringMatch: boolean;
  behindCheckpointCount: number;
  behindReasons: Set<"progress_deficit" | "borne_off_deficit">;
  firstStartingAreaExitTurn: number | null;
  opponentReachedBrink: boolean;
  lastBehindTurnIndex: number | null;
  momentumShiftAchieved: boolean;
  momentumShiftTurnSpan: number | null;
  maxActivePiecesOnBoard: number;
};

type MatchTelemetry = {
  totalMoves: number;
  totalTurns: number;
  players: Record<PlayerColor, MatchPlayerTelemetry>;
};

type MatchRollDisplayState = {
  value: number | null;
  label: string | null;
};

type MatchTimerResetReason =
  | "match_started"
  | "player_roll"
  | "player_move"
  | "timeout_autoplay"
  | "bot_turn_delay"
  | "paused_for_disconnect"
  | "resumed_after_reconnect"
  | "resynced"
  | "inactive"
  | "timeout_ignored"
  | "forfeit_inactivity"
  | "forfeit_disconnect"
  | null;

type MatchTimerState = {
  turnDurationMs: number;
  turnStartedAtMs: number | null;
  turnDeadlineMs: number | null;
  pausedTurnRemainingMs: number | null;
  activePlayerColor: PlayerColor | null;
  activePlayerUserId: string | null;
  activePhase: GameState["phase"] | null;
  resetReason: MatchTimerResetReason;
};

type PlayerAfkState = {
  accumulatedMs: number;
  timeoutCount: number;
  lastMeaningfulActionAtMs: number | null;
  lastTimeoutAtMs: number | null;
};

type PlayerDisconnectState = {
  disconnectedAtMs: number | null;
  reconnectDeadlineMs: number | null;
};

type MatchClassification = {
  ranked: boolean;
  casual: boolean;
  private: boolean;
  bot: boolean;
  experimental: boolean;
};

type MatchBotState = {
  userId: string;
  color: PlayerColor;
  difficulty: BotDifficulty;
  displayName: string;
} | null;

type MatchRematchState = {
  status: StateSnapshotRematch["status"];
  deadlineMs: number | null;
  decisionsByUserId: Record<string, RematchDecision>;
  nextMatchId: string | null;
  nextPrivateCode: string | null;
};

type RuntimeRecord = Record<string, unknown>;

const TICK_RATE = 10;
const MAX_PLAYERS = 2;
const MAX_SNAPSHOT_HISTORY_ENTRIES = 12;
const ONLINE_TURN_DURATION_MS = 10_000;
const ONLINE_AFK_FORFEIT_MS = 30_000;
const ONLINE_DISCONNECT_GRACE_MS = 15_000;
const ONLINE_RECONNECT_RESUME_MS = 5_000;
const REMATCH_WINDOW_MS = 15_000;
const BOT_TURN_DELAY_MS = 850;
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
const RPC_LIST_SPECTATABLE_MATCHES = "list_spectatable_matches";
const RPC_CREATE_OPEN_ONLINE_MATCH = "create_open_online_match";
const RPC_LIST_OPEN_ONLINE_MATCHES = "list_open_online_matches";
const RPC_JOIN_OPEN_ONLINE_MATCH = "join_open_online_match";
const RPC_GET_OPEN_ONLINE_MATCH_STATUS = "get_open_online_match_status";
const RPC_GET_ACTIVE_OPEN_ONLINE_MATCH = "get_active_open_online_match";
const RPC_PRESENCE_HEARTBEAT = "presence_heartbeat";
const RPC_PRESENCE_COUNT = "presence_count";
const RPC_GET_USERNAME_ONBOARDING_STATUS_NAME = RPC_GET_USERNAME_ONBOARDING_STATUS;
const RPC_CLAIM_USERNAME_NAME = RPC_CLAIM_USERNAME;
const MATCH_HANDLER = "authoritative_match";
const PRIVATE_MATCH_CODE_COLLECTION = "private_match_codes";
const OPEN_ONLINE_MATCH_COLLECTION = "open_online_matches";
const PRIVATE_MATCH_CODE_MAX_GENERATION_ATTEMPTS = 12;
const PRIVATE_MATCH_CODE_WRITE_ATTEMPTS = 4;
const OPEN_ONLINE_MATCH_MAX_GENERATION_ATTEMPTS = 12;
const OPEN_ONLINE_MATCH_WRITE_ATTEMPTS = 4;
const OPEN_ONLINE_MATCH_PAGE_SIZE = 100;
const OPEN_ONLINE_MATCH_MAX_PAGES = 10;
const OPEN_ONLINE_MATCH_MIN_WAGER = 10;
const OPEN_ONLINE_MATCH_MAX_WAGER = 100;
const OPEN_ONLINE_MATCH_WAGER_STEP = 10;
const OPEN_ONLINE_MATCH_DURATIONS_MINUTES = [3, 5, 10] as const;
const OPEN_ONLINE_MATCH_MODE_IDS: readonly string[] = [
  "gameMode_3_pieces",
  "gameMode_finkel_rules",
  "standard",
];
const USER_CHALLENGE_PROGRESS_COLLECTION = "user_challenge_progress";
const USER_CHALLENGE_PROGRESS_KEY = "progress";
const ELO_PROFILE_COLLECTION = "elo_profiles";
const ELO_PROFILE_KEY = "profile";
const SECURE_RANDOM_UINT32_DIVISOR = 4_294_967_296;
const SECURE_RANDOM_FALLBACK_HEX_LENGTH = 8;

type CryptoWithGetRandomValues = {
  getRandomValues: (array: Uint32Array) => Uint32Array;
};

const asRecord = (value: unknown): RuntimeRecord | null =>
  typeof value === "object" && value !== null ? (value as RuntimeRecord) : null;

const hasCryptoGetRandomValues = (value: unknown): value is CryptoWithGetRandomValues =>
  typeof value === "object" &&
  value !== null &&
  typeof (value as { getRandomValues?: unknown }).getRandomValues === "function";

const getSecureRandomUnit = (nk?: nkruntime.Nakama): number => {
  const cryptoApi = (globalThis as { crypto?: unknown }).crypto;
  if (hasCryptoGetRandomValues(cryptoApi)) {
    const randomValues = cryptoApi.getRandomValues(new Uint32Array(1));
    return randomValues[0] / SECURE_RANDOM_UINT32_DIVISOR;
  }

  if (nk && typeof nk.uuidv4 === "function") {
    const uuid = nk.uuidv4().replace(/-/g, "");
    if (uuid.length >= SECURE_RANDOM_FALLBACK_HEX_LENGTH) {
      const fallbackValue = Number.parseInt(uuid.slice(0, SECURE_RANDOM_FALLBACK_HEX_LENGTH), 16);
      if (Number.isFinite(fallbackValue)) {
        return fallbackValue / SECURE_RANDOM_UINT32_DIVISOR;
      }
    }
  }

  throw new Error("Authoritative dice roll requires a cryptographically secure random source.");
};

const rollAuthoritativeDice = (nk?: nkruntime.Nakama): number => rollDice(() => getSecureRandomUnit(nk));

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

const getPresenceMetadata = (presence: unknown): RuntimeRecord | null => {
  const metadata = asRecord(presence)?.metadata;
  return asRecord(metadata);
};

const isSpectatorPresenceRequest = (presence: unknown): boolean => {
  const record = asRecord(presence);
  const metadata = getPresenceMetadata(presence);
  return record?.role === "spectator" || metadata?.role === "spectator";
};

const getMatchId = (ctx: nkruntime.Context): string =>
  readStringField(ctx, ["matchId", "match_id"]) ?? "";

const getMessageOpCode = (message: nkruntime.MatchMessage): number | null =>
  readNumberField(message, ["opCode", "op_code"]);

const getContextUserId = (ctx: nkruntime.Context): string | null =>
  readStringField(ctx, ["userId", "user_id"]);

const resolveMatchModeId = (value: unknown): string =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : "standard";

const resolveMatchConfigForModeId = (
  nk: nkruntime.Nakama,
  params: Record<string, unknown>,
  modeId: string,
): MatchConfig | null => {
  const restrictedOnlineMatch =
    Boolean(readStringField(params, ["openOnlineMatchId", "open_online_match_id"])) ||
    params.privateMatch === true ||
    Boolean(resolveTournamentMatchContextFromParams(params));

  if (isMatchModeId(modeId)) {
    if (restrictedOnlineMatch && !OPEN_ONLINE_MATCH_MODE_IDS.includes(modeId)) {
      return null;
    }

    return getMatchConfig(modeId);
  }

  const isOpenOnlineMatch = Boolean(readStringField(params, ["openOnlineMatchId", "open_online_match_id"]));
  const isTournamentMatch = Boolean(resolveTournamentMatchContextFromParams(params));
  const featuredMode = getPublicGameModes(nk).featuredMode;
  if (!featuredMode || featuredMode.id !== modeId) {
    return null;
  }

  return buildGameModeMatchConfig(featuredMode, {
    allowsXp: true,
    allowsChallenges: true,
    allowsCoins: isOpenOnlineMatch,
    allowsOnline: true,
    allowsRankedStats: isOpenOnlineMatch || isTournamentMatch,
    isPracticeMode: false,
    displayName: featuredMode.name,
  });
};

const resolveConfiguredRewardXp = (value: unknown): number | null => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }

  return Math.max(0, Math.floor(value));
};

const buildMatchClassification = (params: Record<string, unknown>, matchConfig: MatchConfig): MatchClassification => {
  const tournamentMatch = Boolean(resolveTournamentMatchContextFromParams(params));
  const privateMatch = params.privateMatch === true;
  const botMatch = params.botMatch === true;
  const casualMatch = params.casualMatch === true;
  const experimental = !matchConfig.allowsRankedStats && !tournamentMatch;
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

const createPlayerTelemetry = (): MatchPlayerTelemetry => ({
  playerMoveCount: 0,
  playerTurnCount: 0,
  maxRollCount: 0,
  unusableRollCount: 0,
  capturesMade: 0,
  capturesSuffered: 0,
  captureTurnNumbers: [],
  currentCaptureTurnStreak: 0,
  maxCaptureTurnStreak: 0,
  contestedTilesLandedCount: 0,
  wasBehindDuringMatch: false,
  behindCheckpointCount: 0,
  behindReasons: new Set(),
  firstStartingAreaExitTurn: null,
  opponentReachedBrink: false,
  lastBehindTurnIndex: null,
  momentumShiftAchieved: false,
  momentumShiftTurnSpan: null,
  maxActivePiecesOnBoard: 0,
});

const createMatchTelemetry = (): MatchTelemetry => ({
  totalMoves: 0,
  totalTurns: 0,
  players: {
    light: createPlayerTelemetry(),
    dark: createPlayerTelemetry(),
  },
});

const createPlayerAfkState = (): PlayerAfkState => ({
  accumulatedMs: 0,
  timeoutCount: 0,
  lastMeaningfulActionAtMs: null,
  lastTimeoutAtMs: null,
});

const createPlayerDisconnectState = (): PlayerDisconnectState => ({
  disconnectedAtMs: null,
  reconnectDeadlineMs: null,
});

const createMatchTimerState = (): MatchTimerState => ({
  turnDurationMs: ONLINE_TURN_DURATION_MS,
  turnStartedAtMs: null,
  turnDeadlineMs: null,
  pausedTurnRemainingMs: null,
  activePlayerColor: null,
  activePlayerUserId: null,
  activePhase: null,
  resetReason: null,
});

const createMatchRollDisplayState = (): MatchRollDisplayState => ({
  value: null,
  label: null,
});

const createReactionCounts = (assignments: Record<string, PlayerColor>): Record<string, number> =>
  Object.keys(assignments).reduce<Record<string, number>>((counts, userId) => {
    counts[userId] = 0;
    return counts;
  }, {});

const detectCaptureOnMove = (state: GameState, move: MoveRequestPayload["move"]): boolean => {
  const moverColor = state.currentTurn;
  const opponentColor: PlayerColor = moverColor === "light" ? "dark" : "light";
  const targetCoord = getVariantPathCoord(state.matchConfig.pathVariant, moverColor, move.toIndex);
  if (!targetCoord) {
    return false;
  }

  return state[opponentColor].pieces.some((piece) => {
    if (piece.position < 0 || piece.isFinished) {
      return false;
    }

    const pieceCoord = getVariantPathCoord(state.matchConfig.pathVariant, opponentColor, piece.position);
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

const updateActivePieceTelemetry = (state: MatchState): void => {
  const pathLength = getPathLength(state.gameState.matchConfig.pathVariant);
  (["light", "dark"] as PlayerColor[]).forEach((playerColor) => {
    const activePieceCount = countActivePiecesOnBoard(state.gameState[playerColor], pathLength);
    state.telemetry.players[playerColor].maxActivePiecesOnBoard = Math.max(
      state.telemetry.players[playerColor].maxActivePiecesOnBoard,
      activePieceCount
    );
  });
};

const updateStartingAreaExitTelemetry = (state: MatchState, playerColor: PlayerColor): void => {
  const playerTelemetry = state.telemetry.players[playerColor];
  if (playerTelemetry.firstStartingAreaExitTurn !== null) {
    return;
  }

  if (!hasPlayerExitedStartingArea(state.gameState[playerColor], state.gameState.matchConfig.pathVariant)) {
    return;
  }

  playerTelemetry.firstStartingAreaExitTurn = playerTelemetry.playerTurnCount;
};

const updateOpponentBrinkTelemetry = (state: MatchState): void => {
  (["light", "dark"] as PlayerColor[]).forEach((playerColor) => {
    const opponentColor = getOtherPlayerColor(playerColor);
    if (isOneSuccessfulMoveFromVictory(state.gameState, opponentColor)) {
      state.telemetry.players[playerColor].opponentReachedBrink = true;
    }
  });
};

const updateMomentumTelemetry = (state: MatchState): void => {
  const turnIndex = state.telemetry.totalTurns;
  (["light", "dark"] as PlayerColor[]).forEach((playerColor) => {
    const playerTelemetry = state.telemetry.players[playerColor];
    const relation = getPositionLeadRelation(state.gameState, playerColor);

    if (relation === "behind") {
      playerTelemetry.lastBehindTurnIndex = turnIndex;
      return;
    }

    if (relation !== "ahead" || playerTelemetry.lastBehindTurnIndex === null) {
      return;
    }

    const turnSpan = turnIndex - playerTelemetry.lastBehindTurnIndex;
    if (turnSpan > CHALLENGE_THRESHOLDS.MOMENTUM_SHIFT_MAX_TURN_WINDOW) {
      return;
    }

    playerTelemetry.momentumShiftAchieved = true;
    playerTelemetry.momentumShiftTurnSpan =
      playerTelemetry.momentumShiftTurnSpan === null
        ? turnSpan
        : Math.min(playerTelemetry.momentumShiftTurnSpan, turnSpan);
  });
};

const completePlayerTurnTelemetry = (
  state: MatchState,
  playerColor: PlayerColor,
  options: { didCapture: boolean; unusableRoll: boolean }
): void => {
  const playerTelemetry = state.telemetry.players[playerColor];
  state.telemetry.totalTurns += 1;
  playerTelemetry.playerTurnCount += 1;

  if (options.unusableRoll) {
    playerTelemetry.unusableRollCount += 1;
    playerTelemetry.currentCaptureTurnStreak = 0;
  } else if (options.didCapture) {
    playerTelemetry.captureTurnNumbers.push(playerTelemetry.playerTurnCount);
    playerTelemetry.currentCaptureTurnStreak += 1;
    playerTelemetry.maxCaptureTurnStreak = Math.max(
      playerTelemetry.maxCaptureTurnStreak,
      playerTelemetry.currentCaptureTurnStreak
    );
  } else {
    playerTelemetry.currentCaptureTurnStreak = 0;
  }

  updateStartingAreaExitTelemetry(state, playerColor);
  updateActivePieceTelemetry(state);
  updateComebackTelemetry(state);
  updateMomentumTelemetry(state);
  updateOpponentBrinkTelemetry(state);
};

const parseRpcPayload = (payload: string): RuntimeRecord => {
  if (!payload) {
    return {};
  }

  try {
    const data = JSON.parse(payload);
    return asRecord(data) ?? {};
  } catch (_error) {
    return {};
  }
};

const normalizePrivateMatchCodeRecord = (value: unknown): PrivateMatchCodeRecord | null => {
  const record = asRecord(value);
  if (!record) {
    return null;
  }

  const code = normalizePrivateMatchCodeInput(readStringField(record, ["code"]) ?? "");
  const matchId = readStringField(record, ["matchId", "match_id"]);
  const modeId = readStringField(record, ["modeId", "mode_id"]);
  const creatorUserId = readStringField(record, ["creatorUserId", "creator_user_id"]);
  const joinedUserId = readStringField(record, ["joinedUserId", "joined_user_id"]);
  const createdAt = readStringField(record, ["createdAt", "created_at"]);
  const updatedAt = readStringField(record, ["updatedAt", "updated_at"]);

  if (!isPrivateMatchCode(code) || !modeId || !creatorUserId || !createdAt || !updatedAt) {
    return null;
  }

  return {
    code,
    matchId: matchId ?? null,
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
    {
      collection: PRIVATE_MATCH_CODE_COLLECTION,
      key: normalizedCode,
    },
  ]) as RuntimeStorageObject[];
  const object =
    findStorageObject(objects, PRIVATE_MATCH_CODE_COLLECTION, normalizedCode, SYSTEM_USER_ID) ??
    findStorageObject(objects, PRIVATE_MATCH_CODE_COLLECTION, normalizedCode);

  return {
    object,
    record: normalizePrivateMatchCodeRecord(object?.value),
  };
};

const writePrivateMatchCodeRecord = (
  nk: nkruntime.Nakama,
  record: PrivateMatchCodeRecord,
  version?: string
): void => {
  const write: RuntimeRecord = {
    collection: PRIVATE_MATCH_CODE_COLLECTION,
    key: record.code,
    userId: SYSTEM_USER_ID,
    value: record,
    permissionRead: STORAGE_PERMISSION_NONE,
    permissionWrite: STORAGE_PERMISSION_NONE,
  };
  if (typeof version === "string") {
    write.version = version;
  }

  nk.storageWrite([
    write,
  ]);
};

const getErrorMessage = (error: unknown): string => (error instanceof Error ? error.message : String(error));

const isPrivateMatchCodeReservationConflict = (error: unknown): boolean => {
  const message = getErrorMessage(error).toLowerCase();
  return (
    message.includes("version check") ||
    message.includes("version conflict") ||
    message.includes("storage write rejected") ||
    message.includes("already exists")
  );
};

const reservePrivateMatchCodeRecord = (
  nk: nkruntime.Nakama,
  modeId: string,
  creatorUserId: string
): PrivateMatchCodeRecord => {
  for (let attempt = 0; attempt < PRIVATE_MATCH_CODE_MAX_GENERATION_ATTEMPTS; attempt += 1) {
    const now = new Date().toISOString();
    const record: PrivateMatchCodeRecord = {
      code: generatePrivateMatchCode(),
      matchId: null,
      modeId,
      creatorUserId,
      joinedUserId: null,
      createdAt: now,
      updatedAt: now,
    };

    try {
      writePrivateMatchCodeRecord(nk, record, "*");
      return record;
    } catch (error) {
      if (isPrivateMatchCodeReservationConflict(error)) {
        continue;
      }

      throw new Error("Unable to reserve a private game code right now.");
    }
  }

  throw new Error("Unable to create a private game code right now.");
};

const createPrivateMatchCodeRecord = (
  nk: nkruntime.Nakama,
  reservation: PrivateMatchCodeRecord,
  matchId: string,
): PrivateMatchCodeRecord => {
  const record: PrivateMatchCodeRecord = { ...reservation, matchId, updatedAt: new Date().toISOString() };

  for (let attempt = 0; attempt < PRIVATE_MATCH_CODE_WRITE_ATTEMPTS; attempt += 1) {
    try {
      writePrivateMatchCodeRecord(nk, record);
      return record;
    } catch {
      // Retry transient storage write failures while publishing the match ID.
    }
  }

  throw new Error("Unable to publish private game code right now.");
};

const deletePrivateMatchCodeRecord = (nk: nkruntime.Nakama, code: string): void => {
  nk.storageDelete([
    {
      collection: PRIVATE_MATCH_CODE_COLLECTION,
      key: code,
      userId: SYSTEM_USER_ID,
    },
  ]);
};

const isOpenOnlineMatchDurationMinutes = (value: number): value is typeof OPEN_ONLINE_MATCH_DURATIONS_MINUTES[number] =>
  OPEN_ONLINE_MATCH_DURATIONS_MINUTES.includes(value as typeof OPEN_ONLINE_MATCH_DURATIONS_MINUTES[number]);

const normalizeOpenOnlineMatchWager = (value: unknown): number => {
  const wager = readNumberField({ value }, ["value"]);
  if (
    wager === null ||
    !Number.isInteger(wager) ||
    wager < OPEN_ONLINE_MATCH_MIN_WAGER ||
    wager > OPEN_ONLINE_MATCH_MAX_WAGER ||
    wager % OPEN_ONLINE_MATCH_WAGER_STEP !== 0
  ) {
    throw new Error("Wager must be between 10 and 100 coins in increments of 10.");
  }

  return wager;
};

const normalizeOpenOnlineMatchDurationMinutes = (value: unknown): number => {
  const durationMinutes = readNumberField({ value }, ["value"]);
  if (durationMinutes === null || !Number.isInteger(durationMinutes) || !isOpenOnlineMatchDurationMinutes(durationMinutes)) {
    throw new Error("Open match duration must be 3, 5, or 10 minutes.");
  }

  return durationMinutes;
};

const normalizeOpenOnlineMatchModeId = (nk: nkruntime.Nakama, value: unknown): string => {
  const modeId = resolveMatchModeId(value);
  const featuredMode = getPublicGameModes(nk).featuredMode;
  if (!OPEN_ONLINE_MATCH_MODE_IDS.includes(modeId) && featuredMode?.id !== modeId) {
    throw new Error("Online matches support Race, Finkel Rules, or the current Game Mode of the Month.");
  }
  return modeId;
};

const generateOpenOnlineMatchId = (): string => {
  const randomPart = Math.floor(Math.random() * 0xffffffff)
    .toString(36)
    .padStart(7, "0")
    .slice(0, 7);
  return `open-${Date.now().toString(36)}-${randomPart}`;
};

const normalizeOpenOnlineMatchStatus = (value: unknown): OpenOnlineMatchStatus => {
  if (value === "matched" || value === "expired" || value === "settled") {
    return value;
  }

  return "open";
};

const normalizeOpenOnlineMatchRecord = (value: unknown): OpenOnlineMatchRecord | null => {
  const record = asRecord(value);
  if (!record) {
    return null;
  }

  const openMatchId = readStringField(record, ["openMatchId", "open_match_id"]);
  const matchId = readStringField(record, ["matchId", "match_id"]);
  const modeId = readStringField(record, ["modeId", "mode_id"]);
  const creatorUserId = readStringField(record, ["creatorUserId", "creator_user_id"]);
  const joinedUserId = readStringField(record, ["joinedUserId", "joined_user_id"]);
  const wager = readNumberField(record, ["wager"]);
  const durationMinutes = readNumberField(record, ["durationMinutes", "duration_minutes"]);
  const createdAt = readStringField(record, ["createdAt", "created_at"]);
  const expiresAt = readStringField(record, ["expiresAt", "expires_at"]);
  const updatedAt = readStringField(record, ["updatedAt", "updated_at"]);

  if (
    !openMatchId ||
    !matchId ||
    !modeId ||
    !creatorUserId ||
    wager === null ||
    durationMinutes === null ||
    !Number.isInteger(wager) ||
    !Number.isInteger(durationMinutes) ||
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
    joinedUserId: joinedUserId ?? null,
    wager,
    durationMinutes,
    status: normalizeOpenOnlineMatchStatus(record.status),
    creatorEscrowRefunded: record.creatorEscrowRefunded === true || record.creator_escrow_refunded === true,
    potPaidOut: record.potPaidOut === true || record.pot_paid_out === true,
    createdAt,
    expiresAt,
    updatedAt,
  };
};

const readOpenOnlineMatchObject = (
  nk: nkruntime.Nakama,
  openMatchId: string
): { object: RuntimeStorageObject | null; record: OpenOnlineMatchRecord | null } => {
  if (!openMatchId) {
    return { object: null, record: null };
  }

  const objects = nk.storageRead([
    {
      collection: OPEN_ONLINE_MATCH_COLLECTION,
      key: openMatchId,
      userId: SYSTEM_USER_ID,
    },
  ]) as RuntimeStorageObject[];
  const object = findStorageObject(objects, OPEN_ONLINE_MATCH_COLLECTION, openMatchId, SYSTEM_USER_ID);

  return {
    object,
    record: normalizeOpenOnlineMatchRecord(object?.value),
  };
};

const writeOpenOnlineMatchRecord = (
  nk: nkruntime.Nakama,
  record: OpenOnlineMatchRecord,
  version?: string
): void => {
  const write: RuntimeRecord = {
    collection: OPEN_ONLINE_MATCH_COLLECTION,
    key: record.openMatchId,
    userId: SYSTEM_USER_ID,
    value: record,
    permissionRead: STORAGE_PERMISSION_NONE,
    permissionWrite: STORAGE_PERMISSION_NONE,
  };
  if (typeof version === "string") {
    write.version = version;
  }

  nk.storageWrite([write]);
};

const isOpenOnlineMatchStorageConflict = (error: unknown): boolean => isPrivateMatchCodeReservationConflict(error);

const spendOpenOnlineMatchWager = (
  nk: nkruntime.Nakama,
  userId: string,
  wager: number,
  metadata: RuntimeRecord
): void => {
  const wallet = getWalletForUser(nk, userId);
  if (wallet[SOFT_CURRENCY_KEY] < wager) {
    throw new Error("INSUFFICIENT_FUNDS");
  }

  nk.walletUpdate(
    userId,
    { [SOFT_CURRENCY_KEY]: -wager },
    {
      source: "open_online_match_wager",
      currency: SOFT_CURRENCY_KEY,
      amount: wager,
      ...metadata,
    },
    true,
  );
};

const refundOpenOnlineMatchCreator = (
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  record: OpenOnlineMatchRecord
): OpenOnlineMatchRecord => {
  if (record.creatorEscrowRefunded || record.status === "matched" || record.status === "settled") {
    return record;
  }

  nk.walletUpdate(
    record.creatorUserId,
    { [SOFT_CURRENCY_KEY]: record.wager },
    {
      source: "open_online_match_refund",
      currency: SOFT_CURRENCY_KEY,
      amount: record.wager,
      openMatchId: record.openMatchId,
      matchId: record.matchId,
    },
    true,
  );

  logger.info("Refunded expired open online match wager", {
    userId: record.creatorUserId,
    openMatchId: record.openMatchId,
    wager: record.wager,
  });

  return {
    ...record,
    status: "expired",
    creatorEscrowRefunded: true,
    updatedAt: new Date().toISOString(),
  };
};

const expireOpenOnlineMatchIfNeeded = (
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  record: OpenOnlineMatchRecord,
  version?: string | null,
  nowMs = Date.now(),
): OpenOnlineMatchRecord => {
  if (record.status !== "open" || Date.parse(record.expiresAt) > nowMs) {
    return record;
  }

  const expiredRecord = refundOpenOnlineMatchCreator(logger, nk, record);
  try {
    writeOpenOnlineMatchRecord(nk, expiredRecord, version ?? undefined);
  } catch (error) {
    logger.warn(
      "Expired open online match %s but failed to persist refund state: %s",
      record.openMatchId,
      getErrorMessage(error),
    );
  }

  return expiredRecord;
};

const normalizeStorageListResultForOpenMatches = (result: unknown): { objects: RuntimeStorageObject[]; cursor: string | null } => {
  if (Array.isArray(result)) {
    return {
      objects: result.filter((object): object is RuntimeStorageObject => asRecord(object) !== null),
      cursor: null,
    };
  }

  const record = asRecord(result);
  if (!record) {
    return { objects: [], cursor: null };
  }

  const rawObjects = Array.isArray(record.objects)
    ? record.objects
    : Array.isArray(record.storageObjects)
      ? record.storageObjects
      : Array.isArray(record.runtimeObjects)
        ? record.runtimeObjects
        : [];

  return {
    objects: rawObjects.filter((object): object is RuntimeStorageObject => asRecord(object) !== null),
    cursor: readStringField(record, ["cursor"]),
  };
};

const listOpenOnlineMatchStorageObjects = (
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama
): RuntimeStorageObject[] => {
  if (typeof nk.storageList !== "function") {
    logger.warn("Open online match listing is not supported by this Nakama runtime.");
    return [];
  }

  const objects: RuntimeStorageObject[] = [];
  let cursor = "";
  for (let page = 0; page < OPEN_ONLINE_MATCH_MAX_PAGES; page += 1) {
    const rawResult = nk.storageList(SYSTEM_USER_ID, OPEN_ONLINE_MATCH_COLLECTION, OPEN_ONLINE_MATCH_PAGE_SIZE, cursor);
    const result = normalizeStorageListResultForOpenMatches(rawResult);
    objects.push(...result.objects);

    if (!result.cursor) {
      break;
    }

    cursor = result.cursor;
  }

  return objects;
};

const createOpenOnlineMatchStorageRecord = (
  nk: nkruntime.Nakama,
  record: Omit<OpenOnlineMatchRecord, "openMatchId">
): OpenOnlineMatchRecord => {
  for (let attempt = 0; attempt < OPEN_ONLINE_MATCH_MAX_GENERATION_ATTEMPTS; attempt += 1) {
    const nextRecord: OpenOnlineMatchRecord = {
      ...record,
      openMatchId: generateOpenOnlineMatchId(),
    };

    try {
      writeOpenOnlineMatchRecord(nk, nextRecord, "*");
      return nextRecord;
    } catch (error) {
      if (isOpenOnlineMatchStorageConflict(error)) {
        continue;
      }

      throw new Error("Unable to publish open online match right now.");
    }
  }

  throw new Error("Unable to create an open online match right now.");
};

const buildOpenOnlineMatchRpcModel = (
  record: OpenOnlineMatchRecord,
  viewerUserId?: string | null
): RuntimeRecord => ({
  openMatchId: record.openMatchId,
  matchId: record.matchId,
  modeId: record.modeId,
  creatorUserId: record.creatorUserId,
  joinedUserId: record.joinedUserId,
  wager: record.wager,
  durationMinutes: record.durationMinutes,
  status: record.status,
  createdAt: record.createdAt,
  expiresAt: record.expiresAt,
  updatedAt: record.updatedAt,
  entrants: record.joinedUserId ? 2 : 1,
  maxEntrants: MAX_PLAYERS,
  isCreator: Boolean(viewerUserId && viewerUserId === record.creatorUserId),
  isJoiner: Boolean(viewerUserId && viewerUserId === record.joinedUserId),
});

const syncOpenOnlineMatchReservation = (logger: nkruntime.Logger, nk: nkruntime.Nakama, state: MatchState): void => {
  if (!state.openOnlineMatchId) {
    return;
  }

  const { object, record } = readOpenOnlineMatchObject(nk, state.openOnlineMatchId);
  if (!record) {
    return;
  }

  const nextRecord = expireOpenOnlineMatchIfNeeded(logger, nk, record, getStorageObjectVersion(object));
  state.openOnlineMatchCreatorUserId = nextRecord.creatorUserId;
  state.openOnlineMatchJoinerUserId = nextRecord.joinedUserId;
};

const canUserJoinOpenOnlineMatch = (state: MatchState, userId: string): boolean => {
  if (!state.openOnlineMatchId) {
    return true;
  }

  if (state.openOnlineMatchCreatorUserId === userId) {
    return true;
  }

  return Boolean(state.openOnlineMatchJoinerUserId && state.openOnlineMatchJoinerUserId === userId);
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

    if (!record.matchId) {
      throw new Error("Private game is still starting. Try this code again in a moment.");
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

const createMatchRematchState = (): MatchRematchState => ({
  status: "idle",
  deadlineMs: null,
  decisionsByUserId: {},
  nextMatchId: null,
  nextPrivateCode: null,
});

const getRematchAcceptedUserIds = (state: MatchState): string[] =>
  Object.entries(state.rematch.decisionsByUserId)
    .filter(([, decision]) => decision === "accepted")
    .map(([userId]) => userId);

const buildSnapshotRematch = (state: MatchState): StateSnapshotRematch => ({
  status: state.rematch.status,
  deadlineMs: state.rematch.deadlineMs,
  decisionsByUserId: { ...state.rematch.decisionsByUserId },
  acceptedUserIds: getRematchAcceptedUserIds(state),
  nextMatchId: state.rematch.nextMatchId,
  nextPrivateCode: state.rematch.nextPrivateCode,
});

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

const getAssignedPlayerTargets = (state: MatchState): nkruntime.Presence[] =>
  Object.keys(state.assignments).flatMap((userId) => getUserPresenceTargets(state, userId));

const getActiveUserCount = (state: MatchState): number =>
  Object.keys(state.presences).length;

const isSpectatorPresence = (state: MatchState, presence: nkruntime.Presence): boolean => {
  const userId = getPresenceUserId(presence);
  const presenceKey = getPresenceKey(presence);
  return Boolean(userId && presenceKey && state.spectatorPresences[userId]?.[presenceKey]);
};

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

const upsertSpectatorPresence = (state: MatchState, presence: nkruntime.Presence): void => {
  const userId = getPresenceUserId(presence);
  const presenceKey = getPresenceKey(presence);

  if (!userId || !presenceKey) {
    return;
  }

  state.spectatorPresences[userId] = {
    ...(state.spectatorPresences[userId] ?? {}),
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

const removeSpectatorPresence = (state: MatchState, presence: nkruntime.Presence): boolean => {
  const userId = getPresenceUserId(presence);
  const presenceKey = getPresenceKey(presence);

  if (!userId || !presenceKey) {
    return false;
  }

  const userPresences = state.spectatorPresences[userId];
  if (!userPresences) {
    return false;
  }

  delete userPresences[presenceKey];
  if (Object.keys(userPresences).length === 0) {
    delete state.spectatorPresences[userId];
  }

  return true;
};

const isSpectatableMatchState = (state: MatchState): boolean =>
  state.started &&
  !state.gameState.winner &&
  state.gameState.phase !== "ended" &&
  state.opponentType === "human" &&
  !state.classification.private &&
  !state.classification.bot &&
  !state.tournamentContext;

const getUserIdForColor = (state: MatchState, color: PlayerColor): string | null =>
  Object.entries(state.assignments).find(([, assignedColor]) => assignedColor === color)?.[0] ?? null;

const getBotOpponentType = (difficulty: BotDifficulty): OpponentType => {
  if (difficulty === "medium") {
    return "medium_bot";
  }

  if (difficulty === "hard") {
    return "hard_bot";
  }

  if (difficulty === "perfect") {
    return "perfect_bot";
  }

  return "easy_bot";
};

const isConfiguredBotUser = (state: MatchState, userId: string | null | undefined): boolean =>
  Boolean(userId && state.bot?.userId === userId);

const isConfiguredBotColor = (state: MatchState, color: PlayerColor | null | undefined): boolean =>
  Boolean(color && state.bot?.color === color);

const resolveAssignedPlayerTitle = (nk: nkruntime.Nakama, userId: string): string => {
  try {
    const profile = getUsernameOnboardingProfile(nk, userId);
    if (profile.onboardingComplete && profile.usernameDisplay) {
      return profile.usernameDisplay;
    }
  } catch {
    // Fall back to the guest title when profile data is unavailable.
  }

  return "Guest";
};

const cacheAssignedPlayerTitle = (state: MatchState, nk: nkruntime.Nakama, userId: string): void => {
  if (Object.prototype.hasOwnProperty.call(state.playerTitles, userId)) {
    return;
  }

  state.playerTitles[userId] = resolveAssignedPlayerTitle(nk, userId);
};

const resolveAssignedPlayerRankTitle = (
  nk: nkruntime.Nakama,
  logger: nkruntime.Logger,
  userId: string,
  options?: { isBotUser?: boolean },
): string | null => {
  if (options?.isBotUser) {
    return null;
  }

  try {
    return getProgressionForUser(nk, logger, userId).currentRank;
  } catch {
    return null;
  }
};

const cacheAssignedPlayerRankTitle = (
  state: MatchState,
  nk: nkruntime.Nakama,
  logger: nkruntime.Logger,
  userId: string,
): void => {
  if (Object.prototype.hasOwnProperty.call(state.playerRankTitles, userId)) {
    return;
  }

  state.playerRankTitles[userId] = resolveAssignedPlayerRankTitle(nk, logger, userId, {
    isBotUser: isConfiguredBotUser(state, userId),
  });
};

const buildSnapshotPlayer = (
  state: MatchState,
  color: PlayerColor,
): StateSnapshotPayload["players"][PlayerColor] => {
  const userId = getUserIdForColor(state, color);
  return {
    userId,
    title: userId ? state.playerTitles[userId] ?? "Guest" : null,
    rankTitle: userId ? state.playerRankTitles[userId] ?? null : null,
  };
};

const getOtherPlayerColor = (color: PlayerColor): PlayerColor =>
  color === "light" ? "dark" : "light";

const getActiveAssignedUserCount = (state: MatchState): number =>
  Object.keys(state.assignments).filter(
    (userId) => isConfiguredBotUser(state, userId) || getUserPresenceTargets(state, userId).length > 0,
  ).length;

const canStartMatch = (state: MatchState): boolean =>
  Object.keys(state.assignments).length >= MAX_PLAYERS && getActiveAssignedUserCount(state) >= MAX_PLAYERS;

const canUseMatchEmojiReactions = (state: MatchState): boolean =>
  !state.classification.bot &&
  state.opponentType === "human" &&
  Object.keys(state.assignments).length >= MAX_PLAYERS;

const canUseLivePieceSelectionRequests = (state: MatchState): boolean =>
  !state.classification.bot &&
  state.opponentType === "human" &&
  Object.keys(state.assignments).length >= MAX_PLAYERS;

const canRunAuthoritativeTurnTimer = (state: MatchState): boolean =>
  state.started &&
  !state.gameState.winner &&
  state.gameState.phase !== "ended" &&
  Boolean(getUserIdForColor(state, state.gameState.currentTurn));

const getAssignedHumanUserIdForColor = (state: MatchState, color: PlayerColor): string | null => {
  const userId = getUserIdForColor(state, color);
  if (!userId || isConfiguredBotColor(state, color)) {
    return null;
  }

  return userId;
};

const getOrderedRematchHumanUserIds = (state: MatchState): [string, string] | null => {
  const lightUserId = getAssignedHumanUserIdForColor(state, "light");
  const darkUserId = getAssignedHumanUserIdForColor(state, "dark");

  if (!lightUserId || !darkUserId) {
    return null;
  }

  return [lightUserId, darkUserId];
};

const canOpenRematchWindow = (state: MatchState): boolean =>
  state.resultRecorded &&
  state.gameState.winner !== null &&
  state.opponentType === "human" &&
  !state.classification.bot &&
  !state.tournamentContext &&
  getOrderedRematchHumanUserIds(state) !== null;

const openRematchWindow = (state: MatchState, nowMs: number): boolean => {
  const rematchPlayerIds = getOrderedRematchHumanUserIds(state);
  if (!canOpenRematchWindow(state) || state.rematch.status !== "idle" || !rematchPlayerIds) {
    return false;
  }

  state.rematch = {
    status: "pending",
    deadlineMs: nowMs + REMATCH_WINDOW_MS,
    decisionsByUserId: rematchPlayerIds.reduce(
      (entries, userId) => {
        entries[userId] = "pending";
        return entries;
      },
      {} as Record<string, RematchDecision>,
    ),
    nextMatchId: null,
    nextPrivateCode: null,
  };
  state.revision += 1;
  return true;
};

const expireRematchWindow = (state: MatchState): boolean => {
  if (state.rematch.status !== "pending") {
    return false;
  }

  state.rematch.status = "expired";
  state.revision += 1;
  return true;
};

const haveAllRematchPlayersAccepted = (state: MatchState): boolean => {
  const rematchPlayerIds = getOrderedRematchHumanUserIds(state);
  return Boolean(
    rematchPlayerIds &&
    rematchPlayerIds.every((userId) => state.rematch.decisionsByUserId[userId] === "accepted"),
  );
};

const getDisconnectedAssignedColors = (state: MatchState): PlayerColor[] =>
  (["light", "dark"] as const).filter((color) => {
    const userId = getAssignedHumanUserIdForColor(state, color);
    if (!userId) {
      return false;
    }

    return (
      state.disconnect[color].reconnectDeadlineMs !== null &&
      getUserPresenceTargets(state, userId).length === 0
    );
  });

const hasActiveDisconnectGrace = (state: MatchState): boolean =>
  !state.gameState.winner &&
  state.gameState.phase !== "ended" &&
  getDisconnectedAssignedColors(state).length > 0;

const getReconnectGraceState = (
  state: MatchState,
  nowMs: number
): { playerColor: PlayerColor; userId: string; reconnectDeadlineMs: number; reconnectRemainingMs: number } | null => {
  const candidates = getDisconnectedAssignedColors(state)
    .map((playerColor) => {
      const userId = getAssignedHumanUserIdForColor(state, playerColor);
      const reconnectDeadlineMs = state.disconnect[playerColor].reconnectDeadlineMs;
      if (!userId || reconnectDeadlineMs === null) {
        return null;
      }

      return {
        playerColor,
        userId,
        reconnectDeadlineMs,
        reconnectRemainingMs: Math.max(0, reconnectDeadlineMs - nowMs),
      };
    })
    .filter((candidate): candidate is {
      playerColor: PlayerColor;
      userId: string;
      reconnectDeadlineMs: number;
      reconnectRemainingMs: number;
    } => candidate !== null)
    .sort((left, right) => left.reconnectDeadlineMs - right.reconnectDeadlineMs);

  return candidates[0] ?? null;
};

const getExpiredDisconnectedColor = (state: MatchState, nowMs: number): PlayerColor | null => {
  const expiredColors = getDisconnectedAssignedColors(state).filter((color) => {
    const reconnectDeadlineMs = state.disconnect[color].reconnectDeadlineMs;
    return reconnectDeadlineMs !== null && nowMs >= reconnectDeadlineMs;
  });

  if (expiredColors.length === 0) {
    return null;
  }

  return expiredColors.includes(state.gameState.currentTurn) ? state.gameState.currentTurn : expiredColors[0];
};

const clearTurnTimer = (state: MatchState, reason: MatchTimerResetReason = null): void => {
  state.timer.turnStartedAtMs = null;
  state.timer.turnDeadlineMs = null;
  state.timer.pausedTurnRemainingMs = null;
  state.timer.activePlayerColor = null;
  state.timer.activePlayerUserId = null;
  state.timer.activePhase = null;
  state.timer.resetReason = reason;
};

const pauseTurnTimerForDisconnect = (state: MatchState, nowMs: number): void => {
  if (state.timer.turnDeadlineMs !== null) {
    state.timer.pausedTurnRemainingMs = Math.max(0, state.timer.turnDeadlineMs - nowMs);
  } else if (state.timer.pausedTurnRemainingMs === null) {
    state.timer.pausedTurnRemainingMs = ONLINE_RECONNECT_RESUME_MS;
  }

  state.timer.turnStartedAtMs = null;
  state.timer.turnDeadlineMs = null;
  state.timer.activePlayerColor = null;
  state.timer.activePlayerUserId = null;
  state.timer.activePhase = null;
  state.timer.resetReason = "paused_for_disconnect";
};

const resetTurnTimerForCurrentState = (
  state: MatchState,
  nowMs: number,
  reason: MatchTimerResetReason,
  overrideTurnDurationMs?: number | null
): void => {
  if (!canRunAuthoritativeTurnTimer(state)) {
    clearTurnTimer(state, reason);
    return;
  }

  const activePlayerColor = state.gameState.currentTurn;
  const defaultTurnDurationMs = isConfiguredBotColor(state, activePlayerColor)
    ? BOT_TURN_DELAY_MS
    : ONLINE_TURN_DURATION_MS;
  const turnDurationMs =
    typeof overrideTurnDurationMs === "number" && Number.isFinite(overrideTurnDurationMs)
      ? Math.max(0, Math.round(overrideTurnDurationMs))
      : defaultTurnDurationMs;
  state.timer.turnDurationMs = turnDurationMs;
  state.timer.turnStartedAtMs = nowMs;
  state.timer.turnDeadlineMs = nowMs + turnDurationMs;
  state.timer.pausedTurnRemainingMs = null;
  state.timer.activePlayerColor = activePlayerColor;
  state.timer.activePlayerUserId = getUserIdForColor(state, activePlayerColor);
  state.timer.activePhase = state.gameState.phase;
  state.timer.resetReason = reason;
};

const ensureTurnTimerForCurrentState = (state: MatchState, nowMs: number): void => {
  if (hasActiveDisconnectGrace(state)) {
    pauseTurnTimerForDisconnect(state, nowMs);
    return;
  }

  if (!canRunAuthoritativeTurnTimer(state)) {
    clearTurnTimer(state, "inactive");
    return;
  }

  if (
    state.timer.turnDeadlineMs !== null &&
    state.timer.activePlayerColor === state.gameState.currentTurn &&
    state.timer.activePhase === state.gameState.phase
  ) {
    return;
  }

  resetTurnTimerForCurrentState(state, nowMs, "resynced");
};

const clearDisconnectGraceForColor = (state: MatchState, playerColor: PlayerColor): boolean => {
  const tracker = state.disconnect[playerColor];
  const didClear = tracker.disconnectedAtMs !== null || tracker.reconnectDeadlineMs !== null;
  state.disconnect[playerColor] = createPlayerDisconnectState();
  return didClear;
};

const clearDisconnectGraceForUser = (state: MatchState, userId: string): boolean => {
  const playerColor = state.assignments[userId];
  if (!playerColor) {
    return false;
  }

  return clearDisconnectGraceForColor(state, playerColor);
};

const startDisconnectGraceForUser = (state: MatchState, userId: string, nowMs: number): boolean => {
  if (!state.started || state.gameState.winner || state.gameState.phase === "ended") {
    return false;
  }

  const playerColor = state.assignments[userId];
  if (!playerColor || isConfiguredBotColor(state, playerColor)) {
    return false;
  }

  if (getUserPresenceTargets(state, userId).length > 0) {
    return false;
  }

  state.disconnect[playerColor] = {
    disconnectedAtMs: nowMs,
    reconnectDeadlineMs: nowMs + ONLINE_DISCONNECT_GRACE_MS,
  };
  pauseTurnTimerForDisconnect(state, nowMs);
  return true;
};

const resumeTurnTimerAfterReconnect = (state: MatchState, nowMs: number): void => {
  const pausedTurnRemainingMs = state.timer.pausedTurnRemainingMs;
  const resumeTurnDurationMs =
    pausedTurnRemainingMs === null
      ? ONLINE_TURN_DURATION_MS
      : Math.min(ONLINE_TURN_DURATION_MS, Math.max(pausedTurnRemainingMs, ONLINE_RECONNECT_RESUME_MS));

  resetTurnTimerForCurrentState(state, nowMs, "resumed_after_reconnect", resumeTurnDurationMs);
};

const resetAfkOnMeaningfulAction = (state: MatchState, playerColor: PlayerColor, nowMs: number): void => {
  state.afk[playerColor] = {
    accumulatedMs: 0,
    timeoutCount: 0,
    lastMeaningfulActionAtMs: nowMs,
    lastTimeoutAtMs: state.afk[playerColor].lastTimeoutAtMs,
  };
};

const recordTimeoutWindow = (state: MatchState, playerColor: PlayerColor, nowMs: number): number => {
  const tracker = state.afk[playerColor];
  tracker.accumulatedMs = Math.min(ONLINE_AFK_FORFEIT_MS, tracker.accumulatedMs + state.timer.turnDurationMs);
  tracker.timeoutCount += 1;
  tracker.lastTimeoutAtMs = nowMs;
  return tracker.accumulatedMs;
};

const getAfkRemainingMs = (state: MatchState, playerColor: PlayerColor, nowMs: number): number => {
  if (isConfiguredBotColor(state, playerColor)) {
    return 0;
  }

  const tracker = state.afk[playerColor];
  let effectiveAccumulatedMs = tracker.accumulatedMs;

  if (
    state.timer.activePlayerColor === playerColor &&
    state.timer.turnStartedAtMs !== null &&
    state.timer.turnDeadlineMs !== null &&
    state.gameState.phase !== "ended" &&
    !state.gameState.winner
  ) {
    effectiveAccumulatedMs += Math.max(0, nowMs - state.timer.turnStartedAtMs);
  }

  return Math.max(0, ONLINE_AFK_FORFEIT_MS - effectiveAccumulatedMs);
};

const buildMatchEndPayload = (
  state: MatchState,
  reason: MatchEndPayload["reason"],
  winnerColor: PlayerColor,
  forfeitingColor?: PlayerColor
): MatchEndPayload => {
  const loserColor = getOtherPlayerColor(winnerColor);
  return {
    reason,
    winnerUserId: getUserIdForColor(state, winnerColor),
    loserUserId: getUserIdForColor(state, loserColor),
    forfeitingUserId: forfeitingColor ? getUserIdForColor(state, forfeitingColor) : null,
    message: null,
  };
};

const syncCompletedMatchEnd = (state: MatchState): void => {
  if (!state.gameState.winner) {
    state.matchEnd = null;
    return;
  }

  if (state.matchEnd?.reason === "forfeit_inactivity" || state.matchEnd?.reason === "forfeit_disconnect") {
    return;
  }

  const softCurrencyAwarded = state.matchEnd?.softCurrencyAwarded === true;
  state.matchEnd = buildMatchEndPayload(state, "completed", state.gameState.winner);
  if (softCurrencyAwarded) {
    state.matchEnd.softCurrencyAwarded = true;
  }
};

const buildRematchMatchParams = (
  state: MatchState,
  privateCode: string | null
): Record<string, unknown> => {
  const rematchPlayerIds = getOrderedRematchHumanUserIds(state);
  if (!rematchPlayerIds) {
    throw new Error("Rematch requires two human players.");
  }

  const [lightUserId, darkUserId] = rematchPlayerIds;
  const params: Record<string, unknown> = {
    playerIds: [lightUserId, darkUserId],
    modeId: state.modeId,
    rankedMatch: state.classification.ranked,
    casualMatch: state.classification.casual,
    botMatch: false,
    privateMatch: state.privateMatch,
    winRewardSource: state.winRewardSource,
    allowsChallengeRewards: state.allowsChallengeRewards,
  };

  if (state.privateMatch) {
    if (!privateCode || !state.privateCreatorUserId || !state.privateGuestUserId) {
      throw new Error("Private rematch requires preserved creator, guest, and private code.");
    }

    params.privateCode = privateCode;
    params.privateCreatorUserId = state.privateCreatorUserId;
    params.privateGuestUserId = state.privateGuestUserId;
  }

  return params;
};

const maybeCreateRematchMatch = (
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  dispatcher: nkruntime.MatchDispatcher,
  state: MatchState,
  currentMatchId: string
): boolean => {
  if (
    state.rematch.status !== "pending" ||
    state.rematch.nextMatchId !== null ||
    !haveAllRematchPlayersAccepted(state)
  ) {
    return false;
  }

  let privateCodeReservation: PrivateMatchCodeRecord | null = null;
  let nextPrivateCode: string | null = null;
  if (state.privateMatch) {
    syncPrivateMatchReservation(nk, state);
    if (!state.privateCreatorUserId) {
      throw new Error("Private rematch requires a preserved creator.");
    }

    privateCodeReservation = reservePrivateMatchCodeRecord(nk, state.modeId, state.privateCreatorUserId);
    nextPrivateCode = privateCodeReservation.code;
  }

  let nextMatchId: string;
  try {
    nextMatchId = nk.matchCreate(MATCH_HANDLER, buildRematchMatchParams(state, nextPrivateCode));
  } catch (error) {
    if (privateCodeReservation) {
      try {
        deletePrivateMatchCodeRecord(nk, privateCodeReservation.code);
      } catch (deleteError) {
        logger.warn(
          "Private rematch code %s cleanup failed after matchCreate error on match %s: %s",
          privateCodeReservation.code,
          currentMatchId,
          getErrorMessage(deleteError),
        );
      }
    }

    throw error;
  }

  state.rematch.status = "matched";
  state.rematch.nextMatchId = nextMatchId;
  state.rematch.nextPrivateCode = nextPrivateCode;
  state.revision += 1;

  if (privateCodeReservation && state.privateGuestUserId) {
    try {
      createPrivateMatchCodeRecord(
        nk,
        {
          ...privateCodeReservation,
          joinedUserId: state.privateGuestUserId,
        },
        nextMatchId,
      );
    } catch (error) {
      logger.warn(
        "Created private rematch %s from match %s but failed to publish private code %s: %s",
        nextMatchId,
        currentMatchId,
        privateCodeReservation.code,
        getErrorMessage(error),
      );

      const rematchPlayerIds = getOrderedRematchHumanUserIds(state);
      if (rematchPlayerIds) {
        rematchPlayerIds.forEach((userId) => {
          sendError(
            dispatcher,
            state,
            userId,
            "MATCH_NOT_READY",
            "Rematch started but private code sync failed. If either player cannot rejoin, start a new private table.",
          );
        });
      }
    }
  }

  logger.info("Created authoritative rematch %s from completed match %s.", nextMatchId, currentMatchId);
  return true;
};

const syncRematchState = (
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  dispatcher: nkruntime.MatchDispatcher,
  state: MatchState,
  matchId: string,
  nowMs: number
): void => {
  let didChange = false;

  didChange = openRematchWindow(state, nowMs) || didChange;

  if (state.rematch.status === "pending" && state.rematch.deadlineMs !== null && nowMs >= state.rematch.deadlineMs) {
    didChange = expireRematchWindow(state) || didChange;
  } else if (state.rematch.status === "pending") {
    didChange = maybeCreateRematchMatch(logger, nk, dispatcher, state, matchId) || didChange;
  }

  if (didChange) {
    broadcastSnapshot(dispatcher, state, matchId);
  }
};

const finalizeCompletedMatch = (
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  dispatcher: nkruntime.MatchDispatcher,
  state: MatchState,
  matchId: string
): boolean => {
  if (!state.gameState.winner || state.resultRecorded) {
    return state.resultRecorded;
  }

  const analyticsWriteBuffer = createAnalyticsEventWriteBuffer();

  try {
    syncCompletedMatchEnd(state);
    const ratingProcessingResult = processCompletedMatchRatings(logger, nk, dispatcher, state, matchId);
    const winnerProgressionAward = awardWinnerProgression(logger, nk, dispatcher, state, matchId, analyticsWriteBuffer);
    awardOpenOnlineMatchPot(logger, nk, state, matchId);
    const tournamentProcessingResult = processCompletedTournamentMatch(logger, nk, state, matchId);
    const challengeProcessingResults = processCompletedMatchSummaries(logger, nk, state, matchId);

    if (
      state.tournamentContext &&
      (!tournamentProcessingResult || tournamentProcessingResult.retryableFailure)
    ) {
      logger.warn("Deferring final result lock for match %s until tournament synchronization succeeds.", matchId);
      state.resultRecorded = false;
      return false;
    }

    broadcastTournamentMatchRewardSummaries(logger, nk, dispatcher, state, matchId, {
      ratingProcessingResult,
      winnerProgressionAward,
      tournamentProcessingResult,
      challengeProcessingResults,
    });

    state.resultRecorded = true;

    {
      const endedAt = new Date().toISOString();
      const durationSeconds =
        state.matchStartedAtMs !== null ? Math.max(0, Math.round((Date.now() - state.matchStartedAtMs) / 1000)) : null;

      recordMatchEndAnalyticsEvent(nk, logger, {
        matchId,
        startedAt: state.matchStartedAtMs !== null ? new Date(state.matchStartedAtMs).toISOString() : null,
        endedAt,
        durationSeconds,
        modeId: state.modeId,
        reason: state.matchEnd?.reason ?? "completed",
        classification: {
          ranked: state.classification.ranked,
          casual: state.classification.casual,
          private: state.classification.private,
          bot: state.classification.bot,
          experimental: state.classification.experimental,
          tournament: Boolean(state.tournamentContext),
        },
        tournamentRunId: state.tournamentContext?.runId ?? null,
        tournamentId: state.tournamentContext?.tournamentId ?? null,
        winnerUserId: state.matchEnd?.winnerUserId ?? null,
        loserUserId: state.matchEnd?.loserUserId ?? null,
        totalMoves: state.telemetry.totalMoves,
        totalTurns: state.telemetry.totalTurns,
        players: buildAnalyticsMatchPlayers(state),
      }, analyticsWriteBuffer);
    }

    if (
      state.tournamentContext &&
      tournamentProcessingResult &&
      !tournamentProcessingResult.finalizationResult &&
      Boolean(tournamentProcessingResult.updatedRun?.bracket?.finalizedAt)
    ) {
      maybeFinalizeRecordedTournamentRun(logger, nk, state, matchId, "result_recorded");
    }

    return true;
  } finally {
    flushAnalyticsEventWriteBuffer(nk, logger, analyticsWriteBuffer);
  }
};

const maybeFinalizeRecordedTournamentRun = (
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  state: MatchState,
  matchId: string,
  source: "leave" | "terminate" | "result_recorded",
): void => {
  if (!state.tournamentContext || !state.gameState.winner) {
    return;
  }

  try {
    const finalizationResult = maybeAutoFinalizeTournamentRunById(
      nk,
      logger,
      state.tournamentContext.runId,
    );

    if (finalizationResult) {
      logger.info(
        "Auto-finalized tournament run %s after %s processing for completed match %s.",
        finalizationResult.run.runId,
        source,
        matchId,
      );
    }
  } catch (error) {
    logger.warn(
      "Unable to auto-finalize tournament run %s after %s processing for match %s: %s",
      state.tournamentContext.runId,
      source,
      matchId,
      error instanceof Error ? error.message : String(error),
    );
  }
};

const markMatchStartedIfReady = (state: MatchState, nowMs: number): boolean => {
  if (state.started || !canStartMatch(state)) {
    return false;
  }

  state.started = true;
  state.matchStartedAtMs = nowMs;
  resetTurnTimerForCurrentState(state, nowMs, "match_started");
  return true;
};

const isPrivateMatchReady = (state: MatchState): boolean =>
  !state.privateMatch || state.started || getActiveUserCount(state) >= MAX_PLAYERS;

const buildPrivateMatchRpcResponse = (
  matchId: string,
  modeId: string,
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
  const opponentTelemetry = state.telemetry.players[opponentColor];
  const doubleStrikeTurnSpan = calculateDoubleStrikeTurnSpan(playerTelemetry.captureTurnNumbers);

  return {
    matchId,
    playerUserId,
    opponentType: state.opponentType,
    opponentDifficulty: getOpponentDifficultyFromType(state.opponentType),
    didWin: state.gameState.winner === playerColor,
    totalMoves: state.telemetry.totalMoves,
    playerMoveCount: playerTelemetry.playerMoveCount,
    playerTurnCount: playerTelemetry.playerTurnCount,
    opponentTurnCount: opponentTelemetry.playerTurnCount,
    piecesLost: playerTelemetry.capturesSuffered,
    maxRollCount: playerTelemetry.maxRollCount,
    unusableRollCount: playerTelemetry.unusableRollCount,
    capturesMade: playerTelemetry.capturesMade,
    capturesSuffered: playerTelemetry.capturesSuffered,
    captureTurnNumbers: [...playerTelemetry.captureTurnNumbers],
    maxCaptureTurnStreak: playerTelemetry.maxCaptureTurnStreak,
    doubleStrikeAchieved: doubleStrikeTurnSpan !== null,
    relentlessPressureAchieved:
      playerTelemetry.maxCaptureTurnStreak >= CHALLENGE_THRESHOLDS.RELENTLESS_PRESSURE_REQUIRED_STREAK,
    contestedTilesLandedCount: playerTelemetry.contestedTilesLandedCount,
    opponentStartingAreaExitTurn: opponentTelemetry.firstStartingAreaExitTurn,
    lockdownAchieved:
      opponentTelemetry.playerTurnCount >= CHALLENGE_THRESHOLDS.LOCKDOWN_REQUIRED_OPPONENT_TURNS &&
      (opponentTelemetry.firstStartingAreaExitTurn === null ||
        opponentTelemetry.firstStartingAreaExitTurn > CHALLENGE_THRESHOLDS.LOCKDOWN_REQUIRED_OPPONENT_TURNS),
    borneOffCount: state.gameState[playerColor].finishedCount,
    opponentBorneOffCount: state.gameState[opponentColor].finishedCount,
    wasBehindDuringMatch: playerTelemetry.wasBehindDuringMatch,
    behindCheckpointCount: playerTelemetry.behindCheckpointCount,
    behindReasons: Array.from(playerTelemetry.behindReasons),
    opponentReachedBrink: playerTelemetry.opponentReachedBrink,
    momentumShiftAchieved: playerTelemetry.momentumShiftAchieved,
    momentumShiftTurnSpan: playerTelemetry.momentumShiftTurnSpan,
    maxActivePiecesOnBoard: playerTelemetry.maxActivePiecesOnBoard,
    modeId: state.modeId,
    pieceCountPerSide: state.gameState.matchConfig.pieceCountPerSide,
    isPrivateMatch: state.classification.private,
    isFriendMatch: state.privateMatch,
    isTournamentMatch: Boolean(state.tournamentContext),
    tournamentEliminationRisk: state.tournamentContext?.eliminationRisk === true,
    timestamp: new Date().toISOString(),
  };
};

const getPresenceUsername = (presence: unknown): string | null =>
  readStringField(presence, ["username", "displayName", "display_name", "name"]);

const buildAnalyticsMatchPlayers = (state: MatchState) =>
  Object.entries(state.assignments).map(([userId, color]) => {
    const presence = getPrimaryUserPresence(state, userId);
    const playerTelemetry = state.telemetry.players[color];

    return {
      userId,
      username: getPresenceUsername(presence) ?? state.playerTitles[userId] ?? null,
      color,
      didWin: state.gameState.winner ? state.gameState.winner === color : null,
      capturesMade: playerTelemetry.capturesMade,
      capturesSuffered: playerTelemetry.capturesSuffered,
      playerMoveCount: playerTelemetry.playerMoveCount,
      finishedCount: state.gameState[color].finishedCount,
      isBot: isConfiguredBotUser(state, userId),
    };
  });

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
      username: getPresenceUsername(presence) ?? state.playerTitles[userId] ?? null,
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
): ReturnType<typeof processCompletedAuthoritativeTournamentMatch> | null {
  if (!state.tournamentContext) {
    return null;
  }

  try {
    const completion = buildTournamentMatchCompletion(state, matchId);
    if (!completion) {
      return null;
    }

    return processCompletedAuthoritativeTournamentMatch(nk, logger, completion);
  } catch (error) {
    logger.error(
      "Failed to process tournament result for match %s: %s",
      matchId,
      error instanceof Error ? error.message : String(error)
    );
    return null;
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
  initializer.registerRpc(RPC_GET_WALLET, rpcGetWallet);
  initializer.registerRpc(RPC_CONFIRM_GEM_PACK_PURCHASE, rpcConfirmGemPackPurchase);
  initializer.registerRpc(RPC_GET_STOREFRONT, rpcGetStorefront);
  initializer.registerRpc(RPC_GET_FULL_CATALOG, rpcGetFullCatalog);
  initializer.registerRpc(RPC_PURCHASE_ITEM, rpcPurchaseItem);
  initializer.registerRpc(RPC_GET_OWNED_COSMETICS, rpcGetOwnedCosmetics);
  initializer.registerRpc(RPC_MATCHMAKER_ADD, rpcMatchmakerAdd);
  initializer.registerRpc(RPC_CREATE_PRIVATE_MATCH, rpcCreatePrivateMatch);
  initializer.registerRpc(RPC_JOIN_PRIVATE_MATCH, rpcJoinPrivateMatch);
  initializer.registerRpc(RPC_GET_PRIVATE_MATCH_STATUS, rpcGetPrivateMatchStatus);
  initializer.registerRpc(RPC_LIST_SPECTATABLE_MATCHES, rpcListSpectatableMatches);
  initializer.registerRpc(RPC_CREATE_OPEN_ONLINE_MATCH, rpcCreateOpenOnlineMatch);
  initializer.registerRpc(RPC_LIST_OPEN_ONLINE_MATCHES, rpcListOpenOnlineMatches);
  initializer.registerRpc(RPC_JOIN_OPEN_ONLINE_MATCH, rpcJoinOpenOnlineMatch);
  initializer.registerRpc(RPC_GET_OPEN_ONLINE_MATCH_STATUS, rpcGetOpenOnlineMatchStatus);
  initializer.registerRpc(RPC_GET_ACTIVE_OPEN_ONLINE_MATCH, rpcGetActiveOpenOnlineMatch);
  initializer.registerRpc(RPC_PRESENCE_HEARTBEAT, rpcPresenceHeartbeat);
  initializer.registerRpc(RPC_PRESENCE_COUNT, rpcPresenceCount);
  initializer.registerRpc(RPC_GET_USERNAME_ONBOARDING_STATUS_NAME, rpcGetUsernameOnboardingStatus);
  initializer.registerRpc(RPC_CLAIM_USERNAME_NAME, rpcClaimUsername);
  initializer.registerRpc(RPC_ADMIN_WHOAMI, rpcAdminWhoAmI);
  initializer.registerRpc(RPC_ADMIN_LIST_TOURNAMENTS, rpcAdminListTournaments);
  initializer.registerRpc(RPC_ADMIN_GET_TOURNAMENT_RUN, rpcAdminGetTournamentRun);
  initializer.registerRpc(RPC_ADMIN_CREATE_TOURNAMENT_RUN, rpcAdminCreateTournamentRun);
  initializer.registerRpc(RPC_ADMIN_OPEN_TOURNAMENT, rpcAdminOpenTournament);
  initializer.registerRpc(RPC_ADMIN_DELETE_TOURNAMENT, rpcAdminDeleteTournament);
  initializer.registerRpc(RPC_ADMIN_CLOSE_TOURNAMENT, rpcAdminCloseTournament);
  initializer.registerRpc(RPC_ADMIN_FINALIZE_TOURNAMENT, rpcAdminFinalizeTournament);
  initializer.registerRpc(RPC_ADMIN_EXPORT_TOURNAMENT, rpcAdminExportTournament);
  initializer.registerRpc(RPC_ADMIN_GET_TOURNAMENT_LIVE_STATUS, rpcAdminGetTournamentLiveStatus);
  initializer.registerRpc(RPC_ADMIN_GET_TOURNAMENT_STANDINGS, rpcAdminGetTournamentStandings);
  initializer.registerRpc(RPC_ADMIN_GET_TOURNAMENT_AUDIT_LOG, rpcAdminGetTournamentAuditLog);
  initializer.registerRpc(RPC_TOURNAMENT_JOIN, rpcJoinTournament);
  initializer.registerRpc(RPC_LIST_PUBLIC_TOURNAMENTS, rpcListPublicTournaments);
  initializer.registerRpc(RPC_GET_ACTIVE_TOURNAMENT_FLOW, rpcGetActiveTournamentFlow);
  initializer.registerRpc(RPC_GET_PUBLIC_TOURNAMENT, rpcGetPublicTournament);
  initializer.registerRpc(RPC_GET_PUBLIC_TOURNAMENT_STANDINGS, rpcGetPublicTournamentStandings);
  initializer.registerRpc(RPC_JOIN_PUBLIC_TOURNAMENT, rpcJoinPublicTournament);
  initializer.registerRpc(RPC_LAUNCH_TOURNAMENT_MATCH, rpcLaunchTournamentMatch);
  initializer.registerRpc(RPC_ADMIN_GET_ANALYTICS_SUMMARY, rpcAdminGetAnalyticsSummary);
  initializer.registerRpc(RPC_ADMIN_GET_ANALYTICS_OVERVIEW, rpcAdminGetAnalyticsOverview);
  initializer.registerRpc(RPC_ADMIN_GET_ANALYTICS_PLAYERS, rpcAdminGetAnalyticsPlayers);
  initializer.registerRpc(RPC_ADMIN_GET_ANALYTICS_GAMEPLAY, rpcAdminGetAnalyticsGameplay);
  initializer.registerRpc(RPC_ADMIN_GET_ANALYTICS_TOURNAMENTS, rpcAdminGetAnalyticsTournaments);
  initializer.registerRpc(RPC_ADMIN_GET_ANALYTICS_PROGRESSION, rpcAdminGetAnalyticsProgression);
  initializer.registerRpc(RPC_ADMIN_GET_ANALYTICS_REALTIME, rpcAdminGetAnalyticsRealtime);
  initializer.registerRpc(RPC_ADMIN_GET_FULL_CATALOG, rpcAdminGetFullCatalog);
  initializer.registerRpc(RPC_ADMIN_UPSERT_COSMETIC, rpcAdminUpsertCosmetic);
  initializer.registerRpc(RPC_ADMIN_DISABLE_COSMETIC, rpcAdminDisableCosmetic);
  initializer.registerRpc(RPC_ADMIN_ENABLE_COSMETIC, rpcAdminEnableCosmetic);
  initializer.registerRpc(RPC_ADMIN_DELETE_COSMETIC, rpcAdminDeleteCosmetic);
  initializer.registerRpc(RPC_ADMIN_GET_ROTATION_STATE, rpcAdminGetRotationState);
  initializer.registerRpc(RPC_ADMIN_SET_MANUAL_ROTATION, rpcAdminSetManualRotation);
  initializer.registerRpc(RPC_ADMIN_CLEAR_MANUAL_ROTATION, rpcAdminClearManualRotation);
  initializer.registerRpc(RPC_ADMIN_SET_LIMITED_TIME_EVENT, rpcAdminSetLimitedTimeEvent);
  initializer.registerRpc(RPC_ADMIN_REMOVE_LIMITED_TIME_EVENT, rpcAdminRemoveLimitedTimeEvent);
  initializer.registerRpc(RPC_ADMIN_GET_STORE_STATS, rpcAdminGetStoreStats);
  initializer.registerRpc(RPC_GET_GAME_MODES, rpcGetGameModes);
  initializer.registerRpc(RPC_ADMIN_LIST_GAME_MODES, rpcAdminListGameModes);
  initializer.registerRpc(RPC_ADMIN_GET_GAME_MODE, rpcAdminGetGameMode);
  initializer.registerRpc(RPC_ADMIN_UPSERT_GAME_MODE, rpcAdminUpsertGameMode);
  initializer.registerRpc(RPC_ADMIN_DISABLE_GAME_MODE, rpcAdminDisableGameMode);
  initializer.registerRpc(RPC_ADMIN_ENABLE_GAME_MODE, rpcAdminEnableGameMode);
  initializer.registerRpc(RPC_ADMIN_FEATURE_GAME_MODE, rpcAdminFeatureGameMode);
  initializer.registerRpc(RPC_ADMIN_UNFEATURE_GAME_MODE, rpcAdminUnfeatureGameMode);
  initializer.registerRpc(RPC_SUBMIT_FEEDBACK, rpcSubmitFeedback);
  initializer.registerRpc(RPC_ADMIN_LIST_FEEDBACK, rpcAdminListFeedback);
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

  return JSON.stringify(trackPresenceHeartbeat(userId));
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

  return JSON.stringify(getOnlinePresenceSnapshot());
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

  const data = parseRpcPayload(payload);
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

  const data = parseRpcPayload(payload);
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
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  payload: string
): string {
  if (!ctx.userId) {
    throw new Error("Authentication required.");
  }

  requireCompletedUsernameOnboarding(nk, ctx.userId);

  const data = parseRpcPayload(payload);
  const modeId = resolveMatchModeId(data.modeId);
  const matchConfig = resolveMatchConfigForModeId(nk, { privateMatch: true }, modeId);
  if (!matchConfig) {
    throw new Error("Private matches support Race, Finkel Rules, or the current Game Mode of the Month.");
  }
  const reservation = reservePrivateMatchCodeRecord(nk, modeId, ctx.userId);
  const privateCode = reservation.code;
  let matchId: string;
  try {
    matchId = nk.matchCreate(MATCH_HANDLER, {
      playerIds: [ctx.userId],
      modeId,
      rankedMatch: matchConfig.allowsRankedStats,
      casualMatch: false,
      botMatch: false,
      privateMatch: true,
      privateCode,
      privateCreatorUserId: ctx.userId,
      winRewardSource: "private_pvp_win",
      allowsChallengeRewards: true,
    });
  } catch (error) {
    try {
      deletePrivateMatchCodeRecord(nk, privateCode);
    } catch (deleteError) {
      logger.warn(
        "Private code %s reservation cleanup failed after matchCreate error: %s",
        privateCode,
        getErrorMessage(deleteError),
      );
    }

    throw error;
  }

  try {
    createPrivateMatchCodeRecord(nk, reservation, matchId);
  } catch (error) {
    logger.warn(
      "Private match %s was created for %s but could not publish code %s: %s",
      matchId,
      ctx.userId,
      privateCode,
      getErrorMessage(error),
    );
    throw new Error("Private table was created but could not be published. Please create a new private table.");
  }

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
  if (!reservation.matchId) {
    throw new Error("Private game is still starting. Try this code again in a moment.");
  }

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

  if (!record.matchId) {
    throw new Error("Private game is still starting. Try this code again in a moment.");
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

function rpcCreateOpenOnlineMatch(
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  payload: string
): string {
  if (!ctx.userId) {
    throw new Error("Authentication required.");
  }

  requireCompletedUsernameOnboarding(nk, ctx.userId);

  const data = parseRpcPayload(payload);
  const wager = normalizeOpenOnlineMatchWager(data.wager);
  const durationMinutes = normalizeOpenOnlineMatchDurationMinutes(data.durationMinutes);
  const modeId = normalizeOpenOnlineMatchModeId(nk, data.modeId ?? data.mode_id);
  const matchConfig = resolveMatchConfigForModeId(
    nk,
    { openOnlineMatchId: "pending" },
    modeId,
  );
  if (!matchConfig) {
    throw new Error("Open matches support Race, Finkel Rules, or the current Game Mode of the Month.");
  }
  const openMatchId = generateOpenOnlineMatchId();
  const now = new Date();
  const createdAt = now.toISOString();
  const expiresAt = new Date(now.getTime() + durationMinutes * 60_000).toISOString();

  spendOpenOnlineMatchWager(nk, ctx.userId, wager, { openMatchId });

  let matchId: string;
  try {
    matchId = nk.matchCreate(MATCH_HANDLER, {
      playerIds: [ctx.userId],
      modeId,
      rankedMatch: true,
      casualMatch: false,
      botMatch: false,
      privateMatch: false,
      openOnlineMatchId: openMatchId,
      openOnlineMatchWager: wager,
      openOnlineMatchCreatorUserId: ctx.userId,
      winRewardSource: "pvp_win",
      allowsChallengeRewards: true,
    });
  } catch (error) {
    try {
      nk.walletUpdate(
        ctx.userId,
        { [SOFT_CURRENCY_KEY]: wager },
        {
          source: "open_online_match_create_refund",
          currency: SOFT_CURRENCY_KEY,
          amount: wager,
          openMatchId,
        },
        true,
      );
    } catch (refundError) {
      logger.warn(
        "Failed to refund open online match wager after matchCreate error for %s: %s",
        openMatchId,
        getErrorMessage(refundError),
      );
    }

    throw error;
  }

  const record: OpenOnlineMatchRecord = {
    openMatchId,
    matchId,
    modeId,
    creatorUserId: ctx.userId,
    joinedUserId: null,
    wager,
    durationMinutes,
    status: "open",
    creatorEscrowRefunded: false,
    potPaidOut: false,
    createdAt,
    expiresAt,
    updatedAt: createdAt,
  };

  try {
    writeOpenOnlineMatchRecord(nk, record, "*");
  } catch (error) {
    try {
      nk.walletUpdate(
        ctx.userId,
        { [SOFT_CURRENCY_KEY]: wager },
        {
          source: "open_online_match_publish_refund",
          currency: SOFT_CURRENCY_KEY,
          amount: wager,
          openMatchId,
          matchId,
        },
        true,
      );
    } catch (refundError) {
      logger.warn(
        "Failed to refund open online match wager after publish error for %s: %s",
        openMatchId,
        getErrorMessage(refundError),
      );
    }

    throw new Error("Open match was created but could not be published. Please create a new match.");
  }

  return JSON.stringify({ match: buildOpenOnlineMatchRpcModel(record, ctx.userId) });
}

function rpcListOpenOnlineMatches(
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  _payload: string
): string {
  if (!ctx.userId) {
    throw new Error("Authentication required.");
  }

  requireCompletedUsernameOnboarding(nk, ctx.userId);

  const nowMs = Date.now();
  const matches = listOpenOnlineMatchStorageObjects(logger, nk)
    .map((object) => {
      const record = normalizeOpenOnlineMatchRecord(object.value);
      if (!record) {
        return null;
      }

      return expireOpenOnlineMatchIfNeeded(logger, nk, record, getStorageObjectVersion(object), nowMs);
    })
    .filter((record): record is OpenOnlineMatchRecord => Boolean(record))
    .filter((record) => record.status === "open" || record.status === "matched")
    .sort((left, right) => left.createdAt.localeCompare(right.createdAt))
    .map((record) => buildOpenOnlineMatchRpcModel(record, ctx.userId));

  return JSON.stringify({ matches });
}

function rpcJoinOpenOnlineMatch(
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  payload: string
): string {
  if (!ctx.userId) {
    throw new Error("Authentication required.");
  }

  requireCompletedUsernameOnboarding(nk, ctx.userId);

  const data = parseRpcPayload(payload);
  const openMatchId = readStringField(data, ["openMatchId", "open_match_id"]);
  if (!openMatchId) {
    throw new Error("Open match id is required.");
  }

  for (let attempt = 0; attempt < OPEN_ONLINE_MATCH_WRITE_ATTEMPTS; attempt += 1) {
    const { object, record } = readOpenOnlineMatchObject(nk, openMatchId);
    if (!record) {
      throw new Error("Open match not found.");
    }

    const currentRecord = expireOpenOnlineMatchIfNeeded(logger, nk, record, getStorageObjectVersion(object));
    if (currentRecord.status !== "open") {
      throw new Error("Open match is no longer available.");
    }

    if (currentRecord.creatorUserId === ctx.userId) {
      throw new Error("You cannot join your own open match.");
    }

    spendOpenOnlineMatchWager(nk, ctx.userId, currentRecord.wager, {
      openMatchId: currentRecord.openMatchId,
      matchId: currentRecord.matchId,
    });

    const nextRecord: OpenOnlineMatchRecord = {
      ...currentRecord,
      joinedUserId: ctx.userId,
      status: "matched",
      updatedAt: new Date().toISOString(),
    };

    try {
      writeOpenOnlineMatchRecord(nk, nextRecord, getStorageObjectVersion(object) ?? "");
      return JSON.stringify({ match: buildOpenOnlineMatchRpcModel(nextRecord, ctx.userId) });
    } catch (error) {
      try {
        nk.walletUpdate(
          ctx.userId,
          { [SOFT_CURRENCY_KEY]: currentRecord.wager },
          {
            source: "open_online_match_join_refund",
            currency: SOFT_CURRENCY_KEY,
            amount: currentRecord.wager,
            openMatchId: currentRecord.openMatchId,
            matchId: currentRecord.matchId,
          },
          true,
        );
      } catch (refundError) {
        logger.warn(
          "Failed to refund joiner wager after open match claim conflict for %s: %s",
          currentRecord.openMatchId,
          getErrorMessage(refundError),
        );
      }

      if (!isOpenOnlineMatchStorageConflict(error)) {
        throw new Error("Unable to join this open match right now.");
      }
    }
  }

  throw new Error("Unable to join this open match right now.");
}

function rpcGetOpenOnlineMatchStatus(
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  payload: string
): string {
  if (!ctx.userId) {
    throw new Error("Authentication required.");
  }

  requireCompletedUsernameOnboarding(nk, ctx.userId);

  const data = parseRpcPayload(payload);
  const openMatchId = readStringField(data, ["openMatchId", "open_match_id"]);
  if (!openMatchId) {
    throw new Error("Open match id is required.");
  }

  const { object, record } = readOpenOnlineMatchObject(nk, openMatchId);
  if (!record) {
    throw new Error("Open match not found.");
  }

  const nextRecord = expireOpenOnlineMatchIfNeeded(logger, nk, record, getStorageObjectVersion(object));
  if (nextRecord.creatorUserId !== ctx.userId && nextRecord.joinedUserId !== ctx.userId) {
    throw new Error("You do not have access to this open match.");
  }

  return JSON.stringify({ match: buildOpenOnlineMatchRpcModel(nextRecord, ctx.userId) });
}

function rpcGetActiveOpenOnlineMatch(
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  _payload: string
): string {
  if (!ctx.userId) {
    throw new Error("Authentication required.");
  }

  requireCompletedUsernameOnboarding(nk, ctx.userId);

  const nowMs = Date.now();
  const match =
    listOpenOnlineMatchStorageObjects(logger, nk)
      .map((object) => {
        const record = normalizeOpenOnlineMatchRecord(object.value);
        if (!record) {
          return null;
        }

        return expireOpenOnlineMatchIfNeeded(logger, nk, record, getStorageObjectVersion(object), nowMs);
      })
      .filter((record): record is OpenOnlineMatchRecord => Boolean(record))
      .filter(
        (record) =>
          record.creatorUserId === ctx.userId &&
          (record.status === "open" || record.status === "matched"),
      )
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))[0] ?? null;

  return JSON.stringify({ match: match ? buildOpenOnlineMatchRpcModel(match, ctx.userId) : null });
}

function rpcListSpectatableMatches(
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  _payload: string
): string {
  if (!ctx.userId) {
    throw new Error("Authentication required.");
  }

  requireCompletedUsernameOnboarding(nk, ctx.userId);

  const matchesById = new Map<string, { matchId: string; modeId: string; startedAt: string | null; playerLabels: string[] }>();

  listActiveTrackedMatches()
    .filter((match) =>
      !match.classification.private &&
      !match.classification.bot &&
      !match.classification.tournament &&
      match.playerLabels.length >= MAX_PLAYERS
    )
    .forEach((match) => {
      matchesById.set(match.matchId, {
        matchId: match.matchId,
        modeId: match.modeId,
        startedAt: match.startedAt,
        playerLabels: match.playerLabels.slice(0, MAX_PLAYERS),
      });
    });

  const nowMs = Date.now();
  listOpenOnlineMatchStorageObjects(logger, nk)
    .map((object) => {
      const record = normalizeOpenOnlineMatchRecord(object.value);
      if (!record) {
        return null;
      }

      return expireOpenOnlineMatchIfNeeded(logger, nk, record, getStorageObjectVersion(object), nowMs);
    })
    .filter((record): record is OpenOnlineMatchRecord => Boolean(record))
    .filter((record) => record.status === "matched")
    .forEach((record) => {
      if (matchesById.has(record.matchId)) {
        return;
      }

      matchesById.set(record.matchId, {
        matchId: record.matchId,
        modeId: record.modeId,
        startedAt: record.updatedAt,
        playerLabels: [],
      });
    });

  const matches = Array.from(matchesById.values()).sort((left, right) =>
    (right.startedAt ?? "").localeCompare(left.startedAt ?? "")
  );

  return JSON.stringify({ matches });
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
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  params: Record<string, unknown>
): { state: MatchState; tickRate: number; label: string } {
  const playerIds = Array.isArray(params.playerIds) ? (params.playerIds as string[]) : [];
  const modeId = resolveMatchModeId(params.modeId);
  const matchConfig = resolveMatchConfigForModeId(nk, params, modeId);
  if (!matchConfig) {
    throw new Error(`Unsupported game mode: ${modeId}`);
  }
  const classification = buildMatchClassification(params, matchConfig);
  const privateMatch = classification.private;
  const privateCode = typeof params.privateCode === "string" ? normalizePrivateMatchCodeInput(params.privateCode) : "";
  const privateCreatorUserId =
    typeof params.privateCreatorUserId === "string" ? params.privateCreatorUserId : null;
  const privateGuestUserId =
    typeof params.privateGuestUserId === "string" ? params.privateGuestUserId : null;
  const openOnlineMatchId = readStringField(params, ["openOnlineMatchId", "open_online_match_id"]);
  const openOnlineMatchWager = readNumberField(params, ["openOnlineMatchWager", "open_online_match_wager"]);
  const openOnlineMatchCreatorUserId = readStringField(params, [
    "openOnlineMatchCreatorUserId",
    "open_online_match_creator_user_id",
  ]);
  const openOnlineMatchJoinerUserId = readStringField(params, [
    "openOnlineMatchJoinerUserId",
    "open_online_match_joiner_user_id",
  ]);
  const botUserId = readStringField(params, ["botUserId", "bot_user_id"]);
  const botDifficultyValue = readStringField(params, ["botDifficulty", "bot_difficulty"]);
  const botDifficulty =
    botDifficultyValue && isBotDifficulty(botDifficultyValue) ? botDifficultyValue : DEFAULT_BOT_DIFFICULTY;
  const botDisplayName =
    readStringField(params, ["botDisplayName", "bot_display_name"]) ??
    `${botDifficulty.slice(0, 1).toUpperCase()}${botDifficulty.slice(1)} Bot`;
  const winRewardSource = params.winRewardSource === "private_pvp_win" ? "private_pvp_win" : "pvp_win";
  const allowsChallengeRewards = params.allowsChallengeRewards !== false;
  const tournamentMatchWinXp = resolveConfiguredRewardXp(
    readNumberField(params, ["tournamentMatchWinXp", "tournament_match_win_xp"]),
  );

  const assignments: Record<string, PlayerColor> = {};
  if (playerIds[0]) {
    assignments[playerIds[0]] = "light";
  }
  if (playerIds[1]) {
    assignments[playerIds[1]] = "dark";
  }

  const playerTitles: Record<string, string> = {};
  const playerRankTitles: Record<string, string | null> = {};
  playerIds.forEach((userId) => {
    if (typeof userId === "string" && userId.length > 0) {
      playerTitles[userId] = resolveAssignedPlayerTitle(nk, userId);
      playerRankTitles[userId] = resolveAssignedPlayerRankTitle(nk, logger, userId, {
        isBotUser: userId === botUserId,
      });
    }
  });
  const botColor =
    botUserId && assignments[botUserId]
      ? assignments[botUserId]
      : botUserId && playerIds[1] === botUserId
        ? "dark"
        : botUserId && playerIds[0] === botUserId
          ? "light"
          : null;
  const bot: MatchBotState =
    classification.bot && botUserId && botColor
      ? {
          userId: botUserId,
          color: botColor,
          difficulty: botDifficulty,
          displayName: botDisplayName,
        }
      : null;
  if (bot) {
    playerTitles[bot.userId] = bot.displayName;
    playerRankTitles[bot.userId] = null;
  }

  const state: MatchState = {
    presences: {},
    spectatorPresences: {},
    assignments,
    playerTitles,
    playerRankTitles,
    bot,
    gameState: createInitialState(matchConfig),
    revision: 0,
    started: false,
    opponentType: bot ? getBotOpponentType(bot.difficulty) : "human",
    modeId,
    classification,
    privateMatch,
    privateCode: isPrivateMatchCode(privateCode) ? privateCode : null,
    privateCreatorUserId,
    privateGuestUserId,
    openOnlineMatchId,
    openOnlineMatchWager:
      typeof openOnlineMatchWager === "number" && Number.isFinite(openOnlineMatchWager)
        ? Math.max(0, Math.floor(openOnlineMatchWager))
        : null,
    openOnlineMatchCreatorUserId,
    openOnlineMatchJoinerUserId,
    winRewardSource,
    allowsChallengeRewards,
    tournamentContext: resolveTournamentMatchContextFromParams(params),
    tournamentMatchWinXp,
    reactionCounts: createReactionCounts(assignments),
    rollDisplay: createMatchRollDisplayState(),
    telemetry: createMatchTelemetry(),
    timer: createMatchTimerState(),
    matchStartedAtMs: null,
    afk: {
      light: createPlayerAfkState(),
      dark: createPlayerAfkState(),
    },
    disconnect: {
      light: createPlayerDisconnectState(),
      dark: createPlayerDisconnectState(),
    },
    matchEnd: null,
    rematch: createMatchRematchState(),
    resultRecorded: false,
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

  if (state.openOnlineMatchId) {
    syncOpenOnlineMatchReservation(logger, nk, state);

    if (!canUserJoinOpenOnlineMatch(state, userId)) {
      return { state, accept: false, rejectMessage: "Join this open match before entering the table." };
    }
  }

  if (isSpectatorPresenceRequest(presence)) {
    if (!isSpectatableMatchState(state)) {
      return { state, accept: false, rejectMessage: "This match is not available for spectating." };
    }

    upsertSpectatorPresence(state, presence);
    return { state, accept: true };
  }

  const hasExistingAssignment = Boolean(state.assignments[userId]);

  if (Object.keys(state.assignments).length >= MAX_PLAYERS && !hasExistingAssignment) {
    return { state, accept: false, rejectMessage: "Match is full." };
  }

  upsertPresence(state, presence);
  ensureAssignment(state, userId);

  return { state, accept: true };
}

function matchJoin(
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  dispatcher: nkruntime.MatchDispatcher,
  _tick: number,
  state: MatchState,
  presences: nkruntime.Presence[]
): { state: MatchState } {
  const nowMs = Date.now();
  let clearedDisconnectGrace = false;

  presences.forEach((presence) => {
    const userId = getPresenceUserId(presence);
    if (!userId) {
      logger.warn("Skipping join presence with missing user ID.");
      return;
    }

    if (isSpectatorPresenceRequest(presence) || isSpectatorPresence(state, presence)) {
      upsertSpectatorPresence(state, presence);
      return;
    }

    const hadPresenceBeforeJoin = getUserPresenceTargets(state, userId).length > 0;
    upsertPresence(state, presence);
    ensureAssignment(state, userId);
    cacheAssignedPlayerTitle(state, nk, userId);
    cacheAssignedPlayerRankTitle(state, nk, logger, userId);
    const didClearDisconnectGrace = clearDisconnectGraceForUser(state, userId);
    clearedDisconnectGrace = didClearDisconnectGrace || clearedDisconnectGrace;
    const playerColor = state.assignments[userId];
    if (
      state.started &&
      !state.gameState.winner &&
      state.gameState.phase !== "ended" &&
      playerColor &&
      !isConfiguredBotColor(state, playerColor) &&
      (!hadPresenceBeforeJoin || didClearDisconnectGrace)
    ) {
      // Treat any successful session rejoin as renewed activity so stale AFK
      // debt from a prior disconnected session cannot trigger a delayed forfeit.
      resetAfkOnMeaningfulAction(state, playerColor, nowMs);
    }
  });

  if (state.started && clearedDisconnectGrace && !hasActiveDisconnectGrace(state)) {
    resumeTurnTimerAfterReconnect(state, nowMs);
  }

  const matchId = getMatchId(ctx);
  const didStartMatch = markMatchStartedIfReady(state, nowMs);
  if (didStartMatch && state.matchStartedAtMs !== null) {
    recordMatchStartAnalyticsEvent(nk, logger, {
      matchId,
      startedAt: new Date(state.matchStartedAtMs).toISOString(),
      modeId: state.modeId,
      classification: {
        ranked: state.classification.ranked,
        casual: state.classification.casual,
        private: state.classification.private,
        bot: state.classification.bot,
        experimental: state.classification.experimental,
        tournament: Boolean(state.tournamentContext),
      },
      tournamentRunId: state.tournamentContext?.runId ?? null,
      tournamentId: state.tournamentContext?.tournamentId ?? null,
      players: buildAnalyticsMatchPlayers(state),
    });
  }
  broadcastSnapshot(dispatcher, state, matchId);

  return { state };
}

function matchLeave(
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  dispatcher: nkruntime.MatchDispatcher,
  _tick: number,
  state: MatchState,
  presences: nkruntime.Presence[]
): { state: MatchState } {
  const nowMs = Date.now();
  let shouldBroadcastSnapshot = false;

  presences.forEach((presence) => {
    const userId = getPresenceUserId(presence);
    if (!userId) {
      logger.warn("Skipping leave presence with missing user ID.");
      return;
    }

    if (removeSpectatorPresence(state, presence)) {
      shouldBroadcastSnapshot = true;
      return;
    }

    removePresence(state, presence);
    shouldBroadcastSnapshot = startDisconnectGraceForUser(state, userId, nowMs) || shouldBroadcastSnapshot;
  });

  if (shouldBroadcastSnapshot) {
    broadcastSnapshot(dispatcher, state, getMatchId(ctx));
  }

  if (state.gameState.winner && !state.resultRecorded) {
    try {
      finalizeCompletedMatch(logger, nk, dispatcher, state, getMatchId(ctx));
    } catch (error) {
      logMatchLoopError(logger, getMatchId(ctx), state, "leave_result_processing", error);
    }
  }

  if (state.gameState.winner && state.resultRecorded) {
    try {
      syncRematchState(logger, nk, dispatcher, state, getMatchId(ctx), nowMs);
    } catch (error) {
      logMatchLoopError(logger, getMatchId(ctx), state, "leave_rematch_processing", error);
    }
  }

  if (state.gameState.winner && state.resultRecorded) {
    maybeFinalizeRecordedTournamentRun(logger, nk, state, getMatchId(ctx), "leave");
  }

  return { state };
}

const logMatchLoopError = (
  logger: nkruntime.Logger,
  matchId: string,
  state: MatchState,
  context: string,
  error: unknown
): void => {
  logger.error(
    "Authoritative match error in %s during %s (revision %d, phase %s, turn %s): %s",
    matchId,
    context,
    state.revision,
    state.gameState.phase,
    state.gameState.currentTurn,
    error instanceof Error ? error.message : String(error)
  );
};

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
  const nowMs = Date.now();

  try {
    const didStartMatch = markMatchStartedIfReady(state, nowMs);
    if (didStartMatch && state.matchStartedAtMs !== null) {
      recordMatchStartAnalyticsEvent(nk, logger, {
        matchId,
        startedAt: new Date(state.matchStartedAtMs).toISOString(),
        modeId: state.modeId,
        classification: {
          ranked: state.classification.ranked,
          casual: state.classification.casual,
          private: state.classification.private,
          bot: state.classification.bot,
          experimental: state.classification.experimental,
          tournament: Boolean(state.tournamentContext),
        },
        tournamentRunId: state.tournamentContext?.runId ?? null,
        tournamentId: state.tournamentContext?.tournamentId ?? null,
        players: buildAnalyticsMatchPlayers(state),
      });
    }
    ensureTurnTimerForCurrentState(state, nowMs);
  } catch (error) {
    logMatchLoopError(logger, matchId, state, "timer_sync", error);
    return { state };
  }

  try {
    const expiredDisconnectedColor = getExpiredDisconnectedColor(state, nowMs);
    if (expiredDisconnectedColor) {
      forfeitPlayerForDisconnect(logger, nk, dispatcher, state, matchId, expiredDisconnectedColor);
    }
  } catch (error) {
    logMatchLoopError(logger, matchId, state, "disconnect_processing", error);
    try {
      broadcastSnapshot(dispatcher, state, matchId);
    } catch (snapshotError) {
      logMatchLoopError(logger, matchId, state, "disconnect_recovery_snapshot", snapshotError);
    }
  }

  messages.forEach((message) => {
    try {
      const senderUserId = getSenderUserId(message.sender);
      if (!senderUserId) {
        logger.warn("Ignoring message with missing sender user ID.");
        return;
      }

      if (isSpectatorPresence(state, message.sender) || isSpectatorPresenceRequest(message.sender)) {
        upsertSpectatorPresence(state, message.sender);
        sendPresenceError(
          dispatcher,
          state,
          message.sender,
          "READ_ONLY",
          "Spectators cannot send match commands."
        );
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

      if (
        hasActiveDisconnectGrace(state) &&
        !state.gameState.winner &&
        state.gameState.phase !== "ended"
      ) {
        const reconnectState = getReconnectGraceState(state, Date.now());
        sendError(
          dispatcher,
          state,
          senderUserId,
          "MATCH_NOT_READY",
          reconnectState
            ? `Waiting for ${reconnectState.playerColor} to reconnect.`
            : "Waiting for the disconnected player to reconnect."
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

        applyRollRequest(logger, nk, dispatcher, state, senderUserId, senderColor, decodedPayload, matchId);
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

      if (opCode === MatchOpCode.EMOJI_REACTION) {
        if (!isEmojiReactionRequestPayload(decodedPayload)) {
          sendError(dispatcher, state, senderUserId, "INVALID_PAYLOAD", "Emoji reaction payload is invalid.");
          return;
        }

        applyEmojiReactionRequest(dispatcher, state, senderUserId, senderColor, decodedPayload);
        return;
      }

      if (opCode === MatchOpCode.PIECE_SELECTION) {
        if (!isPieceSelectionRequestPayload(decodedPayload)) {
          sendError(dispatcher, state, senderUserId, "INVALID_PAYLOAD", "Piece selection payload is invalid.");
          return;
        }

        applyPieceSelectionRequest(dispatcher, state, senderUserId, senderColor, decodedPayload);
        return;
      }

      if (opCode === MatchOpCode.REMATCH_RESPONSE) {
        if (!isRematchResponsePayload(decodedPayload)) {
          sendError(dispatcher, state, senderUserId, "INVALID_PAYLOAD", "Rematch payload is invalid.");
          return;
        }

        applyRematchResponse(dispatcher, state, senderUserId, decodedPayload, matchId);
        return;
      }

      sendError(dispatcher, state, senderUserId, "UNKNOWN_OP", `Unsupported opcode ${opCode}.`);
    } catch (error) {
      logMatchLoopError(logger, matchId, state, "message_processing", error);
      try {
        broadcastSnapshot(dispatcher, state, matchId);
      } catch (snapshotError) {
        logMatchLoopError(logger, matchId, state, "message_recovery_snapshot", snapshotError);
      }
    }
  });

  try {
    ensureTurnTimerForCurrentState(state, Date.now());
    const timerExpired =
      state.timer.turnDeadlineMs !== null &&
      Date.now() >= state.timer.turnDeadlineMs &&
      !state.gameState.winner &&
      state.gameState.phase !== "ended";

    if (timerExpired) {
      applyTimedTurnTimeout(logger, nk, dispatcher, state, matchId, Date.now());
    }
  } catch (error) {
    logMatchLoopError(logger, matchId, state, "timeout_processing", error);
    try {
      broadcastSnapshot(dispatcher, state, matchId);
    } catch (snapshotError) {
      logMatchLoopError(logger, matchId, state, "timeout_recovery_snapshot", snapshotError);
    }
  }

  if (state.gameState.winner && !state.resultRecorded) {
    try {
      finalizeCompletedMatch(logger, nk, dispatcher, state, matchId);
    } catch (error) {
      logMatchLoopError(logger, matchId, state, "result_processing", error);
    }
  }

  try {
    syncRematchState(logger, nk, dispatcher, state, matchId, Date.now());
  } catch (error) {
    logMatchLoopError(logger, matchId, state, "rematch_processing", error);
    try {
      broadcastSnapshot(dispatcher, state, matchId);
    } catch (snapshotError) {
      logMatchLoopError(logger, matchId, state, "rematch_recovery_snapshot", snapshotError);
    }
  }

  return { state };
}

function matchTerminate(
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  dispatcher: nkruntime.MatchDispatcher,
  _tick: number,
  state: MatchState,
  _graceSeconds: number
): { state: MatchState } {
  const matchId = getMatchId(ctx);
  if (state.gameState.winner && !state.resultRecorded) {
    try {
      finalizeCompletedMatch(logger, nk, dispatcher, state, matchId);
    } catch (error) {
      logMatchLoopError(logger, matchId, state, "terminate_result_processing", error);
    }
  }

  if (state.gameState.winner && state.resultRecorded) {
    try {
      syncRematchState(logger, nk, dispatcher, state, matchId, Date.now());
    } catch (error) {
      logMatchLoopError(logger, matchId, state, "terminate_rematch_processing", error);
    }
  }

  if (state.gameState.winner && state.resultRecorded) {
    maybeFinalizeRecordedTournamentRun(logger, nk, state, matchId, "terminate");
  }

  unregisterActiveMatch(matchId);

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
    if (typeof state.reactionCounts[userId] !== "number") {
      state.reactionCounts[userId] = 0;
    }
    return;
  }

  const assignedColors = Object.values(state.assignments);
  if (!assignedColors.includes("light")) {
    state.assignments[userId] = "light";
    state.reactionCounts[userId] = 0;
    return;
  }

  if (!assignedColors.includes("dark")) {
    state.assignments[userId] = "dark";
    state.reactionCounts[userId] = 0;
  }
}

function applyRollOutcome(state: MatchState, playerColor: PlayerColor, rollValue: number): MoveRequestPayload["move"][] {
  if (rollValue === 4) {
    state.telemetry.players[playerColor].maxRollCount += 1;
  }

  const rollingState: GameState = {
    ...state.gameState,
    rollValue,
    phase: "moving",
  };

  const validMoves = getValidMoves(rollingState, rollValue);
  state.rollDisplay = {
    value: rollValue,
    label: validMoves.length === 0 && rollValue > 0 ? "No Move" : null,
  };

  if (validMoves.length === 0) {
    state.gameState = {
      ...rollingState,
      currentTurn: getOtherPlayerColor(rollingState.currentTurn),
      phase: "rolling",
      rollValue: null,
      history: [...rollingState.history, `${rollingState.currentTurn} rolled ${rollValue} but had no moves.`],
    };
    completePlayerTurnTelemetry(state, playerColor, { didCapture: false, unusableRoll: true });
    return [];
  }

  state.gameState = rollingState;
  return validMoves;
}

function applyValidatedMove(state: MatchState, playerColor: PlayerColor, move: MoveRequestPayload["move"]): void {
  const didCapture = detectCaptureOnMove(state.gameState, move);
  const targetCoord = getVariantPathCoord(state.gameState.matchConfig.pathVariant, playerColor, move.toIndex);
  state.gameState = applyMove(state.gameState, move);
  state.telemetry.totalMoves += 1;
  state.telemetry.players[playerColor].playerMoveCount += 1;

  if (didCapture) {
    const opponentColor = getOtherPlayerColor(playerColor);
    state.telemetry.players[playerColor].capturesMade += 1;
    state.telemetry.players[opponentColor].capturesSuffered += 1;
  }

  if (targetCoord && isContestedLanding(state.gameState.matchConfig, playerColor, move.toIndex)) {
    state.telemetry.players[playerColor].contestedTilesLandedCount += 1;
  }

  completePlayerTurnTelemetry(state, playerColor, { didCapture, unusableRoll: false });
}

function forfeitPlayerForInactivity(
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  dispatcher: nkruntime.MatchDispatcher,
  state: MatchState,
  matchId: string,
  forfeitingColor: PlayerColor
): void {
  const winnerColor = getOtherPlayerColor(forfeitingColor);
  state.afk[forfeitingColor].accumulatedMs = ONLINE_AFK_FORFEIT_MS;
  clearDisconnectGraceForColor(state, "light");
  clearDisconnectGraceForColor(state, "dark");
  state.gameState = {
    ...state.gameState,
    phase: "ended",
    rollValue: null,
    winner: winnerColor,
    history: [...state.gameState.history, `${forfeitingColor} forfeited due to inactivity.`],
  };
  state.matchEnd = buildMatchEndPayload(state, "forfeit_inactivity", winnerColor, forfeitingColor);
  clearTurnTimer(state, "forfeit_inactivity");
  state.revision += 1;
  logger.info(
    "Forfeited %s for inactivity in match %s after %dms (revision %d)",
    forfeitingColor,
    matchId,
    state.afk[forfeitingColor].accumulatedMs,
    state.revision
  );
  broadcastSnapshot(dispatcher, state, matchId);
  finalizeCompletedMatch(logger, nk, dispatcher, state, matchId);
}

function forfeitPlayerForDisconnect(
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  dispatcher: nkruntime.MatchDispatcher,
  state: MatchState,
  matchId: string,
  forfeitingColor: PlayerColor
): void {
  const winnerColor = getOtherPlayerColor(forfeitingColor);
  clearDisconnectGraceForColor(state, "light");
  clearDisconnectGraceForColor(state, "dark");
  state.gameState = {
    ...state.gameState,
    phase: "ended",
    rollValue: null,
    winner: winnerColor,
    history: [...state.gameState.history, `${forfeitingColor} forfeited after disconnecting.`],
  };
  state.matchEnd = buildMatchEndPayload(state, "forfeit_disconnect", winnerColor, forfeitingColor);
  clearTurnTimer(state, "forfeit_disconnect");
  state.revision += 1;
  logger.info(
    "Forfeited %s for disconnect in match %s after missing reconnect deadline (revision %d)",
    forfeitingColor,
    matchId,
    state.revision
  );
  broadcastSnapshot(dispatcher, state, matchId);
  finalizeCompletedMatch(logger, nk, dispatcher, state, matchId);
}

function applyTimedTurnTimeout(
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  dispatcher: nkruntime.MatchDispatcher,
  state: MatchState,
  matchId: string,
  nowMs: number
): void {
  const activePlayerColor = state.timer.activePlayerColor ?? state.gameState.currentTurn;
  if (!activePlayerColor || state.gameState.winner || state.gameState.phase === "ended") {
    clearTurnTimer(state, "timeout_ignored");
    return;
  }

  if (isConfiguredBotColor(state, activePlayerColor) && state.bot) {
    if (state.gameState.phase === "rolling") {
      const rolledValue = rollAuthoritativeDice(nk);
      const validMoves = applyRollOutcome(state, activePlayerColor, rolledValue);
      if (validMoves.length > 0) {
        const botMove = getBotMove(state.gameState, rolledValue, state.bot.difficulty) ?? validMoves[0];
        broadcastPieceSelection(
          dispatcher,
          state,
          state.bot.userId,
          activePlayerColor,
          botMove.pieceId,
          nowMs,
        );
        applyValidatedMove(
          state,
          activePlayerColor,
          botMove,
        );
      }
    } else if (state.gameState.phase === "moving" && state.gameState.rollValue !== null) {
      const validMoves = getValidMoves(state.gameState, state.gameState.rollValue);
      if (validMoves.length > 0) {
        const botMove =
          getBotMove(state.gameState, state.gameState.rollValue, state.bot.difficulty) ?? validMoves[0];
        broadcastPieceSelection(
          dispatcher,
          state,
          state.bot.userId,
          activePlayerColor,
          botMove.pieceId,
          nowMs,
        );
        applyValidatedMove(
          state,
          activePlayerColor,
          botMove,
        );
      } else {
        state.rollDisplay = {
          value: state.gameState.rollValue,
          label: state.gameState.rollValue > 0 ? "No Move" : null,
        };
        state.gameState = {
          ...state.gameState,
          currentTurn: getOtherPlayerColor(activePlayerColor),
          phase: "rolling",
          rollValue: null,
          history: [...state.gameState.history, `${activePlayerColor} had no valid move.`],
        };
        completePlayerTurnTelemetry(state, activePlayerColor, { didCapture: false, unusableRoll: true });
      }
    }

    if (state.gameState.winner) {
      syncCompletedMatchEnd(state);
    } else {
      state.matchEnd = null;
    }

    resetTurnTimerForCurrentState(state, nowMs, "bot_turn_delay");
    state.revision += 1;
    logger.debug("Applied configured bot turn for %s (revision %d)", activePlayerColor, state.revision);
    broadcastSnapshot(dispatcher, state, matchId);
    finalizeCompletedMatch(logger, nk, dispatcher, state, matchId);
    return;
  }

  const accumulatedInactivityMs = recordTimeoutWindow(state, activePlayerColor, nowMs);
  if (accumulatedInactivityMs >= ONLINE_AFK_FORFEIT_MS) {
    forfeitPlayerForInactivity(logger, nk, dispatcher, state, matchId, activePlayerColor);
    return;
  }

  if (state.gameState.phase === "rolling") {
    const validMoves = applyRollOutcome(state, activePlayerColor, rollAuthoritativeDice(nk));
    if (validMoves.length > 0) {
      applyValidatedMove(state, activePlayerColor, validMoves[0]);
    }
  } else if (state.gameState.phase === "moving" && state.gameState.rollValue !== null) {
    const validMoves = getValidMoves(state.gameState, state.gameState.rollValue);
    if (validMoves.length > 0) {
      applyValidatedMove(state, activePlayerColor, validMoves[0]);
    } else {
      state.rollDisplay = {
        value: state.gameState.rollValue,
        label: state.gameState.rollValue > 0 ? "No Move" : null,
      };
      state.gameState = {
        ...state.gameState,
        currentTurn: getOtherPlayerColor(activePlayerColor),
        phase: "rolling",
        rollValue: null,
        history: [...state.gameState.history, `${activePlayerColor} timed out with no valid move.`],
      };
      completePlayerTurnTelemetry(state, activePlayerColor, { didCapture: false, unusableRoll: true });
    }
  }

  if (state.gameState.winner) {
    syncCompletedMatchEnd(state);
  } else {
    state.matchEnd = null;
  }

  resetTurnTimerForCurrentState(state, nowMs, "timeout_autoplay");
  state.revision += 1;
  logger.debug("Applied authoritative timeout for %s (revision %d)", activePlayerColor, state.revision);
  broadcastSnapshot(dispatcher, state, matchId);
  finalizeCompletedMatch(logger, nk, dispatcher, state, matchId);
}

function applyRollRequest(
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  dispatcher: nkruntime.MatchDispatcher,
  state: MatchState,
  userId: string,
  playerColor: PlayerColor,
  payload: RollRequestPayload,
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

  const nowMs = Date.now();
  if (payload.autoTriggered !== true) {
    resetAfkOnMeaningfulAction(state, playerColor, nowMs);
  }
  applyRollOutcome(state, playerColor, rollAuthoritativeDice(nk));
  state.matchEnd = null;
  resetTurnTimerForCurrentState(state, nowMs, "player_roll");
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

  const nowMs = Date.now();
  resetAfkOnMeaningfulAction(state, playerColor, nowMs);
  broadcastPieceSelection(dispatcher, state, userId, playerColor, payload.move.pieceId, nowMs);
  applyValidatedMove(state, playerColor, payload.move);
  syncCompletedMatchEnd(state);
  resetTurnTimerForCurrentState(state, nowMs, "player_move");
  state.revision += 1;
  logger.debug("Applied move for %s (revision %d)", userId, state.revision);
  broadcastSnapshot(dispatcher, state, matchId);
  finalizeCompletedMatch(logger, nk, dispatcher, state, matchId);
}

function applyEmojiReactionRequest(
  dispatcher: nkruntime.MatchDispatcher,
  state: MatchState,
  userId: string,
  playerColor: PlayerColor,
  payload: EmojiReactionRequestPayload,
): void {
  if (!canUseMatchEmojiReactions(state)) {
    sendError(
      dispatcher,
      state,
      userId,
      "INVALID_PAYLOAD",
      "Emoji reactions are only available in online human matches.",
    );
    return;
  }

  const currentCount = state.reactionCounts[userId] ?? 0;
  if (currentCount >= MAX_EMOJI_REACTIONS_PER_MATCH) {
    sendError(
      dispatcher,
      state,
      userId,
      "INVALID_PAYLOAD",
      "Reaction limit reached for this match.",
    );
    return;
  }

  const nextCount = currentCount + 1;
  state.reactionCounts[userId] = nextCount;

  const targets = getAssignedPlayerTargets(state);
  if (targets.length === 0) {
    return;
  }

  const broadcastPayload: EmojiReactionBroadcastPayload = {
    type: "reaction_broadcast",
    emoji: payload.emoji,
    senderUserId: userId,
    senderColor: playerColor,
    remainingForSender: Math.max(0, MAX_EMOJI_REACTIONS_PER_MATCH - nextCount),
    createdAtMs: Date.now(),
  };

  dispatcher.broadcastMessage(
    MatchOpCode.REACTION_BROADCAST,
    encodePayload(broadcastPayload),
    targets,
  );
}

function applyPieceSelectionRequest(
  dispatcher: nkruntime.MatchDispatcher,
  state: MatchState,
  userId: string,
  playerColor: PlayerColor,
  payload: PieceSelectionRequestPayload,
): void {
  if (!canUseLivePieceSelectionRequests(state)) {
    return;
  }

  if (!isPrivateMatchReady(state) || state.gameState.winner) {
    return;
  }

  if (state.gameState.currentTurn !== playerColor) {
    return;
  }

  if (payload.pieceId !== null) {
    if (state.gameState.phase !== "moving" || state.gameState.rollValue === null) {
      return;
    }

    const pieceCanMove = getValidMoves(state.gameState, state.gameState.rollValue).some(
      (move) => move.pieceId === payload.pieceId,
    );
    if (!pieceCanMove) {
      return;
    }
  }

  broadcastPieceSelection(dispatcher, state, userId, playerColor, payload.pieceId, Date.now());
}

function broadcastPieceSelection(
  dispatcher: nkruntime.MatchDispatcher,
  state: MatchState,
  userId: string,
  playerColor: PlayerColor,
  pieceId: string | null,
  createdAtMs: number,
): void {
  const targets = getAssignedPlayerTargets(state);
  if (targets.length === 0) {
    return;
  }

  const broadcastPayload: PieceSelectionBroadcastPayload = {
    type: "piece_selection_broadcast",
    pieceId,
    senderUserId: userId,
    senderColor: playerColor,
    createdAtMs,
  };

  dispatcher.broadcastMessage(
    MatchOpCode.PIECE_SELECTION_BROADCAST,
    encodePayload(broadcastPayload),
    targets,
  );
}

function applyRematchResponse(
  dispatcher: nkruntime.MatchDispatcher,
  state: MatchState,
  userId: string,
  payload: RematchResponsePayload,
  matchId: string,
): void {
  if (state.rematch.status !== "pending") {
    return;
  }

  if (!(userId in state.rematch.decisionsByUserId)) {
    return;
  }

  if (state.rematch.deadlineMs !== null && Date.now() >= state.rematch.deadlineMs) {
    if (expireRematchWindow(state)) {
      broadcastSnapshot(dispatcher, state, matchId);
    }
    return;
  }

  const nextDecision: RematchDecision = payload.accepted ? "accepted" : "declined";

  if (state.rematch.decisionsByUserId[userId] === nextDecision) {
    return;
  }

  state.rematch.decisionsByUserId[userId] = nextDecision;
  state.revision += 1;
  broadcastSnapshot(dispatcher, state, matchId);
}

function processCompletedMatchRatings(
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  dispatcher: nkruntime.MatchDispatcher,
  state: MatchState,
  matchId: string
): MatchRatingProcessingResult | null {
  const winnerColor = state.gameState.winner;
  if (!winnerColor) {
    return null;
  }

  const winnerEntry = Object.entries(state.assignments).find(([, color]) => color === winnerColor);
  const loserEntry = Object.entries(state.assignments).find(([, color]) => color !== winnerColor);

  if (!winnerEntry || !loserEntry) {
    logger.warn("Match %s could not resolve both Elo participants.", matchId);
    return null;
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
      return null;
    }

    const byUserId = ratingResult.record.playerResults.reduce((entries, playerResult) => {
      entries[playerResult.userId] = {
        oldRating: playerResult.oldRating,
        newRating: playerResult.newRating,
        delta: playerResult.delta,
      };
      return entries;
    }, {} as MatchRatingProcessingResult["byUserId"]);

    if (ratingResult.duplicate) {
      return {
        byUserId,
      };
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

    return {
      byUserId,
    };
  } catch (error) {
    logger.error(
      "Failed to process ranked Elo result for match %s: %s",
      matchId,
      error instanceof Error ? error.message : String(error)
    );
    return null;
  }
}

function awardWinnerProgression(
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  dispatcher: nkruntime.MatchDispatcher,
  state: MatchState,
  matchId: string,
  analyticsWriteBuffer?: AnalyticsEventWriteBuffer,
): ProgressionAwardResponse | null {
  const winnerColor = state.gameState.winner;
  if (!winnerColor) {
    return null;
  }

  const winnerEntry = Object.entries(state.assignments).find(([, color]) => color === winnerColor);
  if (!winnerEntry) {
    logger.warn("Match %s ended with winner color %s but no assigned user was found.", matchId, winnerColor);
    return null;
  }

  const [winnerUserId] = winnerEntry;
  if (isTournamentBotUserId(winnerUserId)) {
    logger.info("Skipping progression award for synthetic tournament bot winner %s on match %s.", winnerUserId, matchId);
    return null;
  }
  const configuredTournamentMatchWinXp =
    state.tournamentContext && typeof state.tournamentMatchWinXp === "number" ? state.tournamentMatchWinXp : null;

  if (configuredTournamentMatchWinXp !== null && configuredTournamentMatchWinXp <= 0) {
    return null;
  }

  try {
    const awardResponse = awardXpForMatchWin(nk, logger, {
      userId: winnerUserId,
      matchId,
      source: state.winRewardSource,
      ...(configuredTournamentMatchWinXp !== null ? { awardedXp: configuredTournamentMatchWinXp } : {}),
      analyticsWriteBuffer,
    });

    awardMatchCompletionSoftCurrency(logger, nk, state, matchId);

    if (awardResponse.duplicate) {
      return awardResponse;
    }

    const winnerPresence = getPrimaryUserPresence(state, winnerUserId);
    if (!winnerPresence) {
      logger.info(
        "Progression updated for winner %s on match %s, but no live presence was available for notification.",
        winnerUserId,
        matchId
      );
      return awardResponse;
    }

    dispatcher.broadcastMessage(
      MatchOpCode.PROGRESSION_AWARD,
      encodePayload(createProgressionAwardNotification(awardResponse)),
      [winnerPresence]
    );
    return awardResponse;
  } catch (error) {
    logger.error(
      "Failed to award progression for winner %s on match %s: %s",
      winnerUserId,
      matchId,
      error instanceof Error ? error.message : String(error)
    );
    return null;
  }
}

function awardMatchCompletionSoftCurrency(
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  state: MatchState,
  matchId: string,
): void {
  if (state.matchEnd?.softCurrencyAwarded) {
    return;
  }

  const winnerUserId = state.matchEnd?.winnerUserId ?? null;
  const loserUserId = state.matchEnd?.loserUserId ?? null;
  const grants = [
    { userId: winnerUserId, amount: 15 },
    { userId: loserUserId, amount: 5 },
  ].filter((grant): grant is { userId: string; amount: number } =>
    typeof grant.userId === "string" && grant.userId.length > 0 && !isTournamentBotUserId(grant.userId)
  );

  if (grants.length === 0) {
    if (state.matchEnd) {
      state.matchEnd.softCurrencyAwarded = true;
    }
    return;
  }

  try {
    nk.walletsUpdate(
      grants.map((grant) => ({
        userId: grant.userId,
        changeset: {
          [SOFT_CURRENCY_KEY]: grant.amount,
        },
        metadata: {
          source: "match_completion",
          matchId,
          amount: grant.amount,
        },
      }))
    );

    grants.forEach((grant) => {
      logger.info("Soft currency awarded", { userId: grant.userId, amount: grant.amount, matchId });
    });

    if (state.matchEnd) {
      state.matchEnd.softCurrencyAwarded = true;
    }
  } catch (error) {
    logger.error(
      "Failed to award soft currency for match %s: %s",
      matchId,
      error instanceof Error ? error.message : String(error)
    );
  }
}

function awardOpenOnlineMatchPot(
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  state: MatchState,
  matchId: string,
): void {
  if (!state.openOnlineMatchId || !state.matchEnd?.winnerUserId) {
    return;
  }

  const { object, record } = readOpenOnlineMatchObject(nk, state.openOnlineMatchId);
  if (!record || record.potPaidOut) {
    return;
  }

  if (record.matchId !== matchId || !record.joinedUserId || record.status === "expired") {
    return;
  }

  const potAmount = record.wager * MAX_PLAYERS;
  try {
    nk.walletUpdate(
      state.matchEnd.winnerUserId,
      { [SOFT_CURRENCY_KEY]: potAmount },
      {
        source: "open_online_match_pot",
        currency: SOFT_CURRENCY_KEY,
        amount: potAmount,
        wager: record.wager,
        openMatchId: record.openMatchId,
        matchId,
      },
      true,
    );

    writeOpenOnlineMatchRecord(
      nk,
      {
        ...record,
        status: "settled",
        potPaidOut: true,
        updatedAt: new Date().toISOString(),
      },
      getStorageObjectVersion(object) ?? undefined,
    );

    logger.info("Awarded open online match pot", {
      userId: state.matchEnd.winnerUserId,
      openMatchId: record.openMatchId,
      matchId,
      amount: potAmount,
    });
  } catch (error) {
    logger.error(
      "Failed to award open online match pot for match %s: %s",
      matchId,
      getErrorMessage(error),
    );
  }
}

function processCompletedMatchSummaries(
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  state: MatchState,
  matchId: string
): MatchChallengeProcessingResults {
  const results: MatchChallengeProcessingResults = {};

  if (!state.allowsChallengeRewards) {
    return results;
  }

  if (state.matchEnd?.reason === "forfeit_inactivity" || state.matchEnd?.reason === "forfeit_disconnect") {
    logger.info("Skipping challenge completion processing for forfeited match %s.", matchId);
    return results;
  }

  Object.entries(state.assignments).forEach(([playerUserId, playerColor]) => {
    if (isTournamentBotUserId(playerUserId)) {
      return;
    }

    try {
      const summary = buildPlayerMatchSummary(state, matchId, playerUserId, playerColor);
      results[playerUserId] = processCompletedMatch(nk, logger, summary);
    } catch (error) {
      logger.error(
        "Failed to process challenge summary for user %s on match %s: %s",
        playerUserId,
        matchId,
        error instanceof Error ? error.message : String(error)
      );
    }
  });

  return results;
}

const resolveTournamentRewardOutcome = (
  params: {
    participantState: string | null;
    didWin: boolean;
    playerUserId: string;
    tournamentProcessingResult: ReturnType<typeof processCompletedAuthoritativeTournamentMatch>;
  },
): TournamentRewardOutcome => {
  const terminalOutcome = resolveTerminalTournamentRewardOutcome(params);

  if (terminalOutcome) {
    return terminalOutcome;
  }

  if (params.participantState === "eliminated") {
    return "eliminated";
  }

  return params.didWin ? "advancing" : "eliminated";
};

const resolveTerminalTournamentRewardOutcome = (
  params: {
    participantState: string | null;
    didWin: boolean;
    playerUserId: string;
    tournamentProcessingResult: ReturnType<typeof processCompletedAuthoritativeTournamentMatch>;
  },
): Exclude<TournamentRewardOutcome, "advancing" | "eliminated"> | null => {
  const {
    participantState,
    didWin,
    playerUserId,
    tournamentProcessingResult,
  } = params;
  const finalizationResult = tournamentProcessingResult.finalizationResult;
  const bracket = tournamentProcessingResult.updatedRun?.bracket ?? null;
  const completedRound = tournamentProcessingResult.record?.summary.round ?? null;
  const totalRounds = bracket?.totalRounds ?? null;
  const bracketWinnerUserId = bracket?.winnerUserId ?? null;
  const bracketRunnerUpUserId = bracket?.runnerUpUserId ?? null;
  const bracketFinalized = Boolean(bracket?.finalizedAt);

  if (finalizationResult) {
    if (finalizationResult.championUserId === playerUserId) {
      return "champion";
    }

    if (participantState === "champion" || (didWin && finalizationResult.run.lifecycle === "finalized")) {
      return "champion";
    }

    if (participantState === "runner_up" || !didWin) {
      return "runner_up";
    }
  }

  if (bracketFinalized) {
    if (bracketWinnerUserId === playerUserId) {
      return "champion";
    }

    if (bracketRunnerUpUserId === playerUserId) {
      return "runner_up";
    }

    return didWin ? "champion" : "runner_up";
  }

  if (
    tournamentProcessingResult.record?.counted === true &&
    typeof completedRound === "number" &&
    typeof totalRounds === "number" &&
    completedRound === totalRounds
  ) {
    return didWin ? "champion" : "runner_up";
  }

  if (participantState === "champion") {
    return "champion";
  }

  if (participantState === "runner_up") {
    return "runner_up";
  }

  return null;
};

const readTournamentEloRanksByUserId = (
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  playerUserIds: string[],
): Record<string, number | null> => {
  if (playerUserIds.length === 0) {
    return {};
  }

  try {
    const result = nk.leaderboardRecordsList(
      ELO_LEADERBOARD_ID,
      playerUserIds,
      Math.max(1, playerUserIds.length),
      "",
      0,
    ) as RuntimeRecord;
    const ownerRecords = Array.isArray(result.ownerRecords)
      ? result.ownerRecords
      : Array.isArray(result.owner_records)
        ? result.owner_records
        : [];

    return ownerRecords.reduce(
      (entries, record) => {
        const ownerId = readStringField(record, ["ownerId", "owner_id"]);
        if (!ownerId) {
          return entries;
        }

        const rank = readNumberField(record, ["rank"]);
        entries[ownerId] = typeof rank === "number" ? rank : null;
        return entries;
      },
      {} as Record<string, number | null>,
    );
  } catch (error) {
    logger.warn(
      "Unable to read Elo leaderboard ranks in batch for tournament summary users %s: %s",
      playerUserIds.join(","),
      error instanceof Error ? error.message : String(error),
    );
    return {};
  }
};

const buildEloProfileFromStorageObject = (
  userId: string,
  fallbackUsernameDisplay: string,
  rawValue: unknown,
  rank: number | null,
): TournamentMatchRewardSummaryPayload["eloProfile"] => {
  const normalizedFallbackName = fallbackUsernameDisplay.trim().length > 0 ? fallbackUsernameDisplay : userId;
  const usernameDisplay = readStringField(rawValue, ["usernameDisplay", "username_display"]) ?? normalizedFallbackName;
  const eloRating = sanitizeEloRating(readNumberField(rawValue, ["eloRating", "elo_rating"]) ?? DEFAULT_ELO_RATING);
  const ratedGames = sanitizeRatedGameCount(readNumberField(rawValue, ["ratedGames", "rated_games"]) ?? 0);
  const ratedWins = Math.min(
    ratedGames,
    sanitizeRatedGameCount(readNumberField(rawValue, ["ratedWins", "rated_wins"]) ?? 0),
  );
  const ratedLosses = Math.min(
    Math.max(0, ratedGames - ratedWins),
    sanitizeRatedGameCount(readNumberField(rawValue, ["ratedLosses", "rated_losses"]) ?? 0),
  );

  return {
    leaderboardId: ELO_LEADERBOARD_ID,
    userId,
    usernameDisplay,
    eloRating,
    ratedGames,
    ratedWins,
    ratedLosses,
    provisional: ratedGames < PROVISIONAL_RATED_GAMES,
    rank,
    lastRatedMatchId: readStringField(rawValue, ["lastRatedMatchId", "last_rated_match_id"]),
    lastRatedAt: readStringField(rawValue, ["lastRatedAt", "last_rated_at"]),
  };
};

const buildTournamentRewardSummaryReadModelsByUserId = (
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  state: MatchState,
): Record<string, TournamentRewardSummaryReadModel> => {
  const playerUserIds = Object.keys(state.assignments);
  if (playerUserIds.length === 0) {
    return {};
  }

  try {
    const storageObjects = nk.storageRead(
      playerUserIds.flatMap((userId) => [
        {
          collection: PROGRESSION_COLLECTION,
          key: PROGRESSION_PROFILE_KEY,
          userId,
        },
        {
          collection: USER_CHALLENGE_PROGRESS_COLLECTION,
          key: USER_CHALLENGE_PROGRESS_KEY,
          userId,
        },
        {
          collection: ELO_PROFILE_COLLECTION,
          key: ELO_PROFILE_KEY,
          userId,
        },
      ]),
    ) as RuntimeStorageObject[];
    const eloRanksByUserId = readTournamentEloRanksByUserId(logger, nk, playerUserIds);

    return playerUserIds.reduce(
      (entries, userId) => {
        const progressionObject = findStorageObject(
          storageObjects,
          PROGRESSION_COLLECTION,
          PROGRESSION_PROFILE_KEY,
          userId,
        );
        const challengeProgressObject = findStorageObject(
          storageObjects,
          USER_CHALLENGE_PROGRESS_COLLECTION,
          USER_CHALLENGE_PROGRESS_KEY,
          userId,
        );
        const eloProfileObject = findStorageObject(storageObjects, ELO_PROFILE_COLLECTION, ELO_PROFILE_KEY, userId);
        if (!progressionObject || !challengeProgressObject || !eloProfileObject) {
          return entries;
        }

        const progressionProfile = normalizeProgressionProfile(getStorageObjectValue(progressionObject));
        const progression = buildProgressionSnapshot(progressionProfile.totalXp);
        const challengeProgress = normalizeChallengeProgressSnapshot(
          getStorageObjectValue(challengeProgressObject),
          progression.totalXp,
        );

        entries[userId] = {
          progression,
          challengeProgress,
          eloProfile: buildEloProfileFromStorageObject(
            userId,
            state.playerTitles[userId] ?? userId,
            getStorageObjectValue(eloProfileObject),
            eloRanksByUserId[userId] ?? null,
          ),
        };
        return entries;
      },
      {} as Record<string, TournamentRewardSummaryReadModel>,
    );
  } catch (error) {
    logger.warn(
      "Unable to batch load tournament reward summary state for match users %s: %s",
      playerUserIds.join(","),
      error instanceof Error ? error.message : String(error),
    );
    return {};
  }
};

const buildTournamentRewardSummaryPayload = (
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  state: MatchState,
  matchId: string,
  playerUserId: string,
  didWin: boolean,
  context: {
    ratingProcessingResult: MatchRatingProcessingResult | null;
    winnerProgressionAward: ProgressionAwardResponse | null;
    tournamentProcessingResult: ReturnType<typeof processCompletedAuthoritativeTournamentMatch>;
    challengeProcessingResults: MatchChallengeProcessingResults;
    rewardSummaryReadModelsByUserId: Record<string, TournamentRewardSummaryReadModel>;
  },
): TournamentMatchRewardSummaryPayload | null => {
  if (!state.tournamentContext) {
    return null;
  }

  const participantResolution = context.tournamentProcessingResult.participantResolutions.find(
    (entry) => entry.userId === playerUserId,
  );
  const tournamentOutcome = resolveTournamentRewardOutcome({
    participantState: participantResolution?.state ?? null,
    didWin,
    playerUserId,
    tournamentProcessingResult: context.tournamentProcessingResult,
  });
  const shouldEnterWaitingRoom =
    tournamentOutcome === "advancing" && context.tournamentProcessingResult.finalizationResult === null;
  const challengeResult = context.challengeProcessingResults[playerUserId] ?? null;
  const challengeCompletionCount = challengeResult?.completedChallengeIds.length ?? 0;
  const challengeXpDelta = challengeResult?.awardedXp ?? 0;
  const winnerUserId =
    state.matchEnd?.winnerUserId ??
    (state.gameState.winner ? getUserIdForColor(state, state.gameState.winner) : null);
  const winnerBaseXpDelta =
    playerUserId === winnerUserId ? context.winnerProgressionAward?.awardedXp ?? 0 : 0;
  const championXpDelta =
    context.tournamentProcessingResult.finalizationResult?.championUserId === playerUserId
      ? context.tournamentProcessingResult.finalizationResult.championRewardResult?.awardedXp ?? 0
      : 0;
  const rewardSummaryReadModel = context.rewardSummaryReadModelsByUserId[playerUserId] ?? null;
  const progression = rewardSummaryReadModel?.progression ?? getProgressionForUser(nk, logger, playerUserId);
  const challengeProgress =
    rewardSummaryReadModel?.challengeProgress ?? getUserChallengeProgress(nk, logger, playerUserId);
  const totalXpDelta = winnerBaseXpDelta + championXpDelta + challengeXpDelta;
  const totalXpNew = progression.totalXp;
  const totalXpOld = Math.max(0, totalXpNew - totalXpDelta);
  const eloProfile = rewardSummaryReadModel?.eloProfile ?? getEloRatingProfileForUser(nk, logger, playerUserId);

  const ratingSummary =
    context.ratingProcessingResult?.byUserId[playerUserId] ??
    {
      oldRating: eloProfile.eloRating,
      newRating: eloProfile.eloRating,
      delta: 0,
    };

  return {
    type: "tournament_match_reward_summary",
    matchId,
    tournamentRunId: state.tournamentContext.runId,
    tournamentId: state.tournamentContext.tournamentId,
    round: state.tournamentContext.round,
    playerUserId,
    didWin,
    tournamentOutcome,
    eloProfile,
    eloOld: ratingSummary.oldRating,
    eloNew: ratingSummary.newRating,
    eloDelta: ratingSummary.delta,
    totalXpOld,
    totalXpNew,
    totalXpDelta,
    challengeCompletionCount,
    challengeXpDelta,
    shouldEnterWaitingRoom,
    progression,
    challengeProgress,
  };
};

function broadcastTournamentMatchRewardSummaries(
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  dispatcher: nkruntime.MatchDispatcher,
  state: MatchState,
  matchId: string,
  context: {
    ratingProcessingResult: MatchRatingProcessingResult | null;
    winnerProgressionAward: ProgressionAwardResponse | null;
    tournamentProcessingResult: ReturnType<typeof processCompletedAuthoritativeTournamentMatch> | null;
    challengeProcessingResults: MatchChallengeProcessingResults;
  },
): void {
  const tournamentProcessingResult = context.tournamentProcessingResult;

  if (!state.tournamentContext || !tournamentProcessingResult) {
    return;
  }

  const rewardSummaryReadModelsByUserId = buildTournamentRewardSummaryReadModelsByUserId(logger, nk, state);

  Object.entries(state.assignments).forEach(([playerUserId, playerColor]) => {
    const targets = getUserPresenceTargets(state, playerUserId);
    if (targets.length === 0) {
      return;
    }

    try {
      const payload = buildTournamentRewardSummaryPayload(
        logger,
        nk,
        state,
        matchId,
        playerUserId,
        state.gameState.winner === playerColor,
        {
          ratingProcessingResult: context.ratingProcessingResult,
          winnerProgressionAward: context.winnerProgressionAward,
          tournamentProcessingResult,
          challengeProcessingResults: context.challengeProcessingResults,
          rewardSummaryReadModelsByUserId,
        },
      );

      if (!payload) {
        return;
      }

      dispatcher.broadcastMessage(
        MatchOpCode.TOURNAMENT_REWARD_SUMMARY,
        encodePayload(payload),
        targets,
      );
    } catch (error) {
      logger.error(
        "Failed to build tournament reward summary for user %s on match %s: %s",
        playerUserId,
        matchId,
        error instanceof Error ? error.message : String(error),
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

function sendPresenceError(
  dispatcher: nkruntime.MatchDispatcher,
  state: MatchState,
  presence: nkruntime.Presence,
  code: ServerErrorCode,
  message: string
): void {
  dispatcher.broadcastMessage(
    MatchOpCode.SERVER_ERROR,
    encodePayload({
      type: "server_error",
      code,
      message,
      revision: state.revision,
    }),
    [presence],
  );
}

function broadcastSnapshot(dispatcher: nkruntime.MatchDispatcher, state: MatchState, matchId: string): void {
  const nowMs = Date.now();
  const activeTimedPlayerColor = state.timer.activePlayerColor;
  const reconnectGraceState = getReconnectGraceState(state, nowMs);
  const turnRemainingMs =
    state.timer.turnDeadlineMs === null ? 0 : Math.max(0, state.timer.turnDeadlineMs - nowMs);
  const snapshotGameState =
    state.gameState.history.length <= MAX_SNAPSHOT_HISTORY_ENTRIES
      ? state.gameState
      : {
          ...state.gameState,
          history: state.gameState.history.slice(-MAX_SNAPSHOT_HISTORY_ENTRIES),
        };
  const payload: StateSnapshotPayload = {
    type: "state_snapshot",
    matchId,
    revision: state.revision,
    gameState: snapshotGameState,
    historyCount: state.gameState.history.length,
    players: {
      light: buildSnapshotPlayer(state, "light"),
      dark: buildSnapshotPlayer(state, "dark"),
    },
    rollDisplayValue: state.rollDisplay.value,
    rollDisplayLabel: state.rollDisplay.label,
    serverTimeMs: nowMs,
    turnDurationMs: state.timer.turnDurationMs,
    turnStartedAtMs: state.timer.turnStartedAtMs,
    turnDeadlineMs: state.timer.turnDeadlineMs,
    turnRemainingMs,
    activeTimedPlayer: state.timer.activePlayerUserId,
    activeTimedPlayerColor,
    activeTimedPhase: state.timer.activePhase,
    afkAccumulatedMs: {
      light: state.afk.light.accumulatedMs,
      dark: state.afk.dark.accumulatedMs,
    },
    afkRemainingMs:
      activeTimedPlayerColor && !isConfiguredBotColor(state, activeTimedPlayerColor)
        ? getAfkRemainingMs(state, activeTimedPlayerColor, nowMs)
        : null,
    reconnectingPlayer: reconnectGraceState?.userId ?? null,
    reconnectingPlayerColor: reconnectGraceState?.playerColor ?? null,
    reconnectGraceDurationMs: reconnectGraceState ? ONLINE_DISCONNECT_GRACE_MS : null,
    reconnectDeadlineMs: reconnectGraceState?.reconnectDeadlineMs ?? null,
    reconnectRemainingMs: reconnectGraceState?.reconnectRemainingMs ?? null,
    matchEnd: state.matchEnd,
    rematch: buildSnapshotRematch(state),
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
  rpcGetStorefront: typeof rpcGetStorefront;
  rpcPurchaseItem: typeof rpcPurchaseItem;
  rpcGetOwnedCosmetics: typeof rpcGetOwnedCosmetics;
  rpcGetGameModes: typeof rpcGetGameModes;
  rpcAdminListGameModes: typeof rpcAdminListGameModes;
  rpcAdminGetGameMode: typeof rpcAdminGetGameMode;
  rpcAdminUpsertGameMode: typeof rpcAdminUpsertGameMode;
  rpcAdminDisableGameMode: typeof rpcAdminDisableGameMode;
  rpcAdminEnableGameMode: typeof rpcAdminEnableGameMode;
  rpcAdminFeatureGameMode: typeof rpcAdminFeatureGameMode;
  rpcAdminUnfeatureGameMode: typeof rpcAdminUnfeatureGameMode;
  rpcMatchmakerAdd: typeof rpcMatchmakerAdd;
  rpcCreatePrivateMatch: typeof rpcCreatePrivateMatch;
  rpcJoinPrivateMatch: typeof rpcJoinPrivateMatch;
  rpcGetPrivateMatchStatus: typeof rpcGetPrivateMatchStatus;
  rpcListSpectatableMatches: typeof rpcListSpectatableMatches;
  rpcCreateOpenOnlineMatch: typeof rpcCreateOpenOnlineMatch;
  rpcListOpenOnlineMatches: typeof rpcListOpenOnlineMatches;
  rpcJoinOpenOnlineMatch: typeof rpcJoinOpenOnlineMatch;
  rpcGetOpenOnlineMatchStatus: typeof rpcGetOpenOnlineMatchStatus;
  rpcGetActiveOpenOnlineMatch: typeof rpcGetActiveOpenOnlineMatch;
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
  rpcGetStorefront,
  rpcPurchaseItem,
  rpcGetOwnedCosmetics,
  rpcGetGameModes,
  rpcAdminListGameModes,
  rpcAdminGetGameMode,
  rpcAdminUpsertGameMode,
  rpcAdminDisableGameMode,
  rpcAdminEnableGameMode,
  rpcAdminFeatureGameMode,
  rpcAdminUnfeatureGameMode,
  rpcMatchmakerAdd,
  rpcCreatePrivateMatch,
  rpcJoinPrivateMatch,
  rpcGetPrivateMatchStatus,
  rpcListSpectatableMatches,
  rpcCreateOpenOnlineMatch,
  rpcListOpenOnlineMatches,
  rpcJoinOpenOnlineMatch,
  rpcGetOpenOnlineMatchStatus,
  rpcGetActiveOpenOnlineMatch,
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
