import { GameState, MoveAction, PlayerColor } from "../logic/types";
import {
  isUserChallengeProgressRpcResponse,
  UserChallengeProgressRpcResponse,
} from "./challenges";
import {
  EloRatingProfileRpcResponse,
  EloRatingChangeNotificationPayload,
  isEloRatingProfileRpcResponse,
  isEloRatingChangeNotificationPayload,
} from "./elo";
import {
  isProgressionSnapshot,
  isProgressionAwardNotificationPayload,
  ProgressionSnapshot,
  ProgressionAwardNotificationPayload,
} from "./progression";

export const MatchOpCode = {
  ROLL_REQUEST: 1,
  MOVE_REQUEST: 2,
  EMOJI_REACTION: 3,
  STATE_SNAPSHOT: 100,
  SERVER_ERROR: 101,
  PROGRESSION_AWARD: 102,
  ELO_RATING_UPDATE: 103,
  TOURNAMENT_REWARD_SUMMARY: 104,
  REACTION_BROADCAST: 105,
} as const;

export type MatchOpCodeValue = (typeof MatchOpCode)[keyof typeof MatchOpCode];
export const EMOJI_REACTION_KEYS = ["laughing", "cool", "fire", "omg", "skeleton"] as const;
export const MAX_EMOJI_REACTIONS_PER_MATCH = 5;

export type RollRequestPayload = {
  type: "roll_request";
  autoTriggered?: boolean;
};

export type MoveRequestPayload = {
  type: "move_request";
  move: MoveAction;
};

export type EmojiReactionKey = (typeof EMOJI_REACTION_KEYS)[number];

export type EmojiReactionRequestPayload = {
  type: "emoji_reaction";
  emoji: EmojiReactionKey;
};

export type ClientMatchPayload =
  | RollRequestPayload
  | MoveRequestPayload
  | EmojiReactionRequestPayload;

export type MatchEndReason = "completed" | "forfeit_inactivity" | "forfeit_disconnect";

export type MatchEndPayload = {
  reason: MatchEndReason;
  winnerUserId: string | null;
  loserUserId: string | null;
  forfeitingUserId: string | null;
  message?: string | null;
};

export type StateSnapshotPlayer = {
  userId: string | null;
  title: string | null;
};

export type StateSnapshotPlayers = Record<PlayerColor, StateSnapshotPlayer>;

export type StateSnapshotPayload = {
  type: "state_snapshot";
  matchId: string;
  revision: number;
  gameState: GameState;
  historyCount?: number;
  players: StateSnapshotPlayers;
  serverTimeMs?: number;
  turnDurationMs?: number;
  turnStartedAtMs?: number | null;
  turnDeadlineMs?: number | null;
  turnRemainingMs?: number | null;
  activeTimedPlayer?: string | null;
  activeTimedPlayerColor?: PlayerColor | null;
  activeTimedPhase?: GameState["phase"] | null;
  afkAccumulatedMs?: Record<PlayerColor, number> | null;
  afkRemainingMs?: number | null;
  reconnectingPlayer?: string | null;
  reconnectingPlayerColor?: PlayerColor | null;
  reconnectGraceDurationMs?: number | null;
  reconnectDeadlineMs?: number | null;
  reconnectRemainingMs?: number | null;
  matchEnd?: MatchEndPayload | null;
};

export type ServerErrorCode =
  | "INVALID_PAYLOAD"
  | "UNAUTHORIZED_PLAYER"
  | "INVALID_TURN"
  | "INVALID_PHASE"
  | "INVALID_MOVE"
  | "MATCH_NOT_READY"
  | "UNKNOWN_OP";

export type ServerErrorPayload = {
  type: "server_error";
  code: ServerErrorCode;
  message: string;
  revision?: number;
};

export type EmojiReactionBroadcastPayload = {
  type: "reaction_broadcast";
  emoji: EmojiReactionKey;
  senderUserId: string;
  senderColor: PlayerColor;
  remainingForSender: number;
  createdAtMs: number;
};

export type TournamentMatchRewardSummaryOutcome =
  | "advancing"
  | "eliminated"
  | "runner_up"
  | "champion";

export type TournamentMatchRewardSummaryPayload = {
  type: "tournament_match_reward_summary";
  matchId: string;
  tournamentRunId: string;
  tournamentId: string;
  round: number | null;
  playerUserId: string;
  didWin: boolean;
  tournamentOutcome: TournamentMatchRewardSummaryOutcome;
  eloProfile: EloRatingProfileRpcResponse;
  eloOld: number;
  eloNew: number;
  eloDelta: number;
  totalXpOld: number;
  totalXpNew: number;
  totalXpDelta: number;
  challengeCompletionCount: number;
  challengeXpDelta: number;
  shouldEnterWaitingRoom: boolean;
  progression: ProgressionSnapshot;
  challengeProgress: UserChallengeProgressRpcResponse;
};

export type ServerMatchPayload =
  | StateSnapshotPayload
  | ServerErrorPayload
  | EmojiReactionBroadcastPayload
  | TournamentMatchRewardSummaryPayload;
export type MatchProgressionPayload = ProgressionAwardNotificationPayload;
export type MatchEloRatingPayload = EloRatingChangeNotificationPayload;
export type ExtendedServerMatchPayload =
  | ServerMatchPayload
  | MatchProgressionPayload
  | MatchEloRatingPayload;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isPlayerColor = (value: unknown): value is PlayerColor =>
  value === "light" || value === "dark";

export const isEmojiReactionKey = (value: unknown): value is EmojiReactionKey =>
  typeof value === "string" &&
  (EMOJI_REACTION_KEYS as readonly string[]).includes(value);

const isGamePhase = (value: unknown): value is GameState["phase"] =>
  value === "rolling" || value === "moving" || value === "ended";

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const isNonNegativeInteger = (value: unknown): value is number =>
  typeof value === "number" && Number.isInteger(value) && value >= 0;

const isNullableFiniteNumber = (value: unknown): value is number | null =>
  value === null || isFiniteNumber(value);

const isOptional = <T>(value: unknown, guard: (candidate: unknown) => candidate is T): value is T | undefined =>
  typeof value === "undefined" || guard(value);

const isNullableString = (value: unknown): value is string | null =>
  value === null || typeof value === "string";

const isStateSnapshotPlayer = (value: unknown): value is StateSnapshotPlayer =>
  isRecord(value) && isNullableString(value.userId) && isNullableString(value.title);

const isStateSnapshotPlayers = (value: unknown): value is StateSnapshotPlayers =>
  isRecord(value) && isStateSnapshotPlayer(value.light) && isStateSnapshotPlayer(value.dark);

const isAfkAccumulatedPayload = (value: unknown): value is Record<PlayerColor, number> =>
  isRecord(value) && isFiniteNumber(value.light) && isFiniteNumber(value.dark);

export const isMatchEndPayload = (value: unknown): value is MatchEndPayload =>
  isRecord(value) &&
  (value.reason === "completed" || value.reason === "forfeit_inactivity" || value.reason === "forfeit_disconnect") &&
  (typeof value.winnerUserId === "string" || value.winnerUserId === null) &&
  (typeof value.loserUserId === "string" || value.loserUserId === null) &&
  (typeof value.forfeitingUserId === "string" || value.forfeitingUserId === null) &&
  (typeof value.message === "undefined" || typeof value.message === "string" || value.message === null);

const isMoveAction = (value: unknown): value is MoveAction => {
  if (!isRecord(value)) {
    return false;
  }
  return (
    typeof value.pieceId === "string" &&
    typeof value.fromIndex === "number" &&
    Number.isInteger(value.fromIndex) &&
    typeof value.toIndex === "number" &&
    Number.isInteger(value.toIndex)
  );
};

export const isRollRequestPayload = (value: unknown): value is RollRequestPayload =>
  isRecord(value) &&
  value.type === "roll_request" &&
  isOptional(value.autoTriggered, (candidate): candidate is boolean => typeof candidate === "boolean");

export const isMoveRequestPayload = (value: unknown): value is MoveRequestPayload =>
  isRecord(value) && value.type === "move_request" && isMoveAction(value.move);

export const isEmojiReactionRequestPayload = (
  value: unknown,
): value is EmojiReactionRequestPayload =>
  isRecord(value) && value.type === "emoji_reaction" && isEmojiReactionKey(value.emoji);

export const isClientMatchPayload = (value: unknown): value is ClientMatchPayload =>
  isRollRequestPayload(value) ||
  isMoveRequestPayload(value) ||
  isEmojiReactionRequestPayload(value);

export const isStateSnapshotPayload = (value: unknown): value is StateSnapshotPayload =>
  isRecord(value) &&
  value.type === "state_snapshot" &&
  typeof value.matchId === "string" &&
  typeof value.revision === "number" &&
  Number.isInteger(value.revision) &&
  isRecord(value.gameState) &&
  isOptional(value.historyCount, isNonNegativeInteger) &&
  isStateSnapshotPlayers(value.players) &&
  isOptional(value.serverTimeMs, isFiniteNumber) &&
  isOptional(value.turnDurationMs, isFiniteNumber) &&
  isOptional(value.turnStartedAtMs, isNullableFiniteNumber) &&
  isOptional(value.turnDeadlineMs, isNullableFiniteNumber) &&
  isOptional(value.turnRemainingMs, isNullableFiniteNumber) &&
  (typeof value.activeTimedPlayer === "undefined" ||
    typeof value.activeTimedPlayer === "string" ||
    value.activeTimedPlayer === null) &&
  (typeof value.activeTimedPlayerColor === "undefined" ||
    isPlayerColor(value.activeTimedPlayerColor) ||
    value.activeTimedPlayerColor === null) &&
  (typeof value.activeTimedPhase === "undefined" ||
    isGamePhase(value.activeTimedPhase) ||
    value.activeTimedPhase === null) &&
  (typeof value.afkAccumulatedMs === "undefined" ||
    isAfkAccumulatedPayload(value.afkAccumulatedMs) ||
    value.afkAccumulatedMs === null) &&
  isOptional(value.afkRemainingMs, isNullableFiniteNumber) &&
  isOptional(value.reconnectingPlayer, isNullableString) &&
  (typeof value.reconnectingPlayerColor === "undefined" ||
    isPlayerColor(value.reconnectingPlayerColor) ||
    value.reconnectingPlayerColor === null) &&
  isOptional(value.reconnectGraceDurationMs, isNullableFiniteNumber) &&
  isOptional(value.reconnectDeadlineMs, isNullableFiniteNumber) &&
  isOptional(value.reconnectRemainingMs, isNullableFiniteNumber) &&
  (typeof value.matchEnd === "undefined" || isMatchEndPayload(value.matchEnd) || value.matchEnd === null);

export const isServerErrorPayload = (value: unknown): value is ServerErrorPayload =>
  isRecord(value) &&
  value.type === "server_error" &&
  typeof value.code === "string" &&
  typeof value.message === "string";

export const isEmojiReactionBroadcastPayload = (
  value: unknown,
): value is EmojiReactionBroadcastPayload =>
  isRecord(value) &&
  value.type === "reaction_broadcast" &&
  isEmojiReactionKey(value.emoji) &&
  typeof value.senderUserId === "string" &&
  isPlayerColor(value.senderColor) &&
  isNonNegativeInteger(value.remainingForSender) &&
  isFiniteNumber(value.createdAtMs);

const isTournamentMatchRewardSummaryOutcome = (
  value: unknown,
): value is TournamentMatchRewardSummaryOutcome =>
  value === "advancing" ||
  value === "eliminated" ||
  value === "runner_up" ||
  value === "champion";

export const isTournamentMatchRewardSummaryPayload = (
  value: unknown,
): value is TournamentMatchRewardSummaryPayload =>
  isRecord(value) &&
  value.type === "tournament_match_reward_summary" &&
  typeof value.matchId === "string" &&
  typeof value.tournamentRunId === "string" &&
  typeof value.tournamentId === "string" &&
  (typeof value.round === "number" || value.round === null) &&
  typeof value.playerUserId === "string" &&
  typeof value.didWin === "boolean" &&
  isTournamentMatchRewardSummaryOutcome(value.tournamentOutcome) &&
  isEloRatingProfileRpcResponse(value.eloProfile) &&
  isFiniteNumber(value.eloOld) &&
  isFiniteNumber(value.eloNew) &&
  isFiniteNumber(value.eloDelta) &&
  isFiniteNumber(value.totalXpOld) &&
  isFiniteNumber(value.totalXpNew) &&
  isFiniteNumber(value.totalXpDelta) &&
  isFiniteNumber(value.challengeCompletionCount) &&
  isFiniteNumber(value.challengeXpDelta) &&
  typeof value.shouldEnterWaitingRoom === "boolean" &&
  isProgressionSnapshot(value.progression) &&
  isUserChallengeProgressRpcResponse(value.challengeProgress);

export const isServerMatchPayload = (value: unknown): value is ServerMatchPayload =>
  isStateSnapshotPayload(value) ||
  isServerErrorPayload(value) ||
  isEmojiReactionBroadcastPayload(value) ||
  isTournamentMatchRewardSummaryPayload(value);

export const isExtendedServerMatchPayload = (value: unknown): value is ExtendedServerMatchPayload =>
  isServerMatchPayload(value) ||
  isProgressionAwardNotificationPayload(value) ||
  isEloRatingChangeNotificationPayload(value);

export const encodePayload = (payload: ClientMatchPayload | ExtendedServerMatchPayload): string =>
  JSON.stringify(payload);

export const decodePayload = (raw: string): unknown => {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};
