import { GamePhase, GameState, MoveAction, PlayerColor } from "../logic/types";
import {
  EloRatingChangeNotificationPayload,
  isEloRatingChangeNotificationPayload,
} from "./elo";
import {
  isProgressionAwardNotificationPayload,
  ProgressionAwardNotificationPayload,
} from "./progression";

export const MatchOpCode = {
  ROLL_REQUEST: 1,
  MOVE_REQUEST: 2,
  STATE_SNAPSHOT: 100,
  SERVER_ERROR: 101,
  PROGRESSION_AWARD: 102,
  ELO_RATING_UPDATE: 103,
} as const;

export type MatchOpCodeValue = (typeof MatchOpCode)[keyof typeof MatchOpCode];

export type RollRequestPayload = {
  type: "roll_request";
};

export type MoveRequestPayload = {
  type: "move_request";
  move: MoveAction;
};

export type ClientMatchPayload = RollRequestPayload | MoveRequestPayload;

export type MatchEndReason = "completed" | "forfeit_inactivity";

export type MatchEndPayload = {
  reason: MatchEndReason;
  winnerUserId: string | null;
  loserUserId: string | null;
  forfeitingUserId?: string | null;
  message?: string | null;
};

export type StateSnapshotPayload = {
  type: "state_snapshot";
  matchId: string;
  revision: number;
  gameState: GameState;
  assignments: Record<string, PlayerColor>;
  serverTimeMs?: number;
  turnDurationMs?: number;
  turnStartedAtMs?: number | null;
  turnDeadlineMs?: number | null;
  turnRemainingMs?: number;
  activeTimedPlayer?: string | null;
  activeTimedPlayerColor?: PlayerColor | null;
  activeTimedPhase?: GamePhase | null;
  afkAccumulatedMs?: Partial<Record<PlayerColor, number>>;
  afkRemainingMs?: number | null;
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

export type ServerMatchPayload = StateSnapshotPayload | ServerErrorPayload;
export type MatchProgressionPayload = ProgressionAwardNotificationPayload;
export type MatchEloRatingPayload = EloRatingChangeNotificationPayload;
export type ExtendedServerMatchPayload = ServerMatchPayload | MatchProgressionPayload | MatchEloRatingPayload;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isOptionalNumber = (value: unknown): value is number | undefined | null =>
  value === undefined || value === null || (typeof value === "number" && Number.isFinite(value));

const isOptionalString = (value: unknown): value is string | undefined | null =>
  value === undefined || value === null || typeof value === "string";

const isOptionalPlayerColor = (value: unknown): value is PlayerColor | undefined | null =>
  value === undefined || value === null || value === "light" || value === "dark";

const isOptionalGamePhase = (value: unknown): value is GamePhase | undefined | null =>
  value === undefined || value === null || value === "rolling" || value === "moving" || value === "ended";

const isMatchEndPayload = (value: unknown): value is MatchEndPayload =>
  isRecord(value) &&
  (value.reason === "completed" || value.reason === "forfeit_inactivity") &&
  isOptionalString(value.winnerUserId) &&
  isOptionalString(value.loserUserId) &&
  isOptionalString(value.forfeitingUserId) &&
  isOptionalString(value.message);

const isAfkAccumulatedMs = (value: unknown): value is Partial<Record<PlayerColor, number>> =>
  isRecord(value) &&
  isOptionalNumber(value.light) &&
  isOptionalNumber(value.dark);

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
  isRecord(value) && value.type === "roll_request";

export const isMoveRequestPayload = (value: unknown): value is MoveRequestPayload =>
  isRecord(value) && value.type === "move_request" && isMoveAction(value.move);

export const isClientMatchPayload = (value: unknown): value is ClientMatchPayload =>
  isRollRequestPayload(value) || isMoveRequestPayload(value);

export const isStateSnapshotPayload = (value: unknown): value is StateSnapshotPayload =>
  isRecord(value) &&
  value.type === "state_snapshot" &&
  typeof value.matchId === "string" &&
  typeof value.revision === "number" &&
  Number.isInteger(value.revision) &&
  isRecord(value.gameState) &&
  isRecord(value.assignments) &&
  isOptionalNumber(value.serverTimeMs) &&
  isOptionalNumber(value.turnDurationMs) &&
  isOptionalNumber(value.turnStartedAtMs) &&
  isOptionalNumber(value.turnDeadlineMs) &&
  isOptionalNumber(value.turnRemainingMs) &&
  isOptionalString(value.activeTimedPlayer) &&
  isOptionalPlayerColor(value.activeTimedPlayerColor) &&
  isOptionalGamePhase(value.activeTimedPhase) &&
  (value.afkAccumulatedMs === undefined || isAfkAccumulatedMs(value.afkAccumulatedMs)) &&
  isOptionalNumber(value.afkRemainingMs) &&
  (value.matchEnd === undefined || value.matchEnd === null || isMatchEndPayload(value.matchEnd));

export const isServerErrorPayload = (value: unknown): value is ServerErrorPayload =>
  isRecord(value) &&
  value.type === "server_error" &&
  typeof value.code === "string" &&
  typeof value.message === "string";

export const isServerMatchPayload = (value: unknown): value is ServerMatchPayload =>
  isStateSnapshotPayload(value) || isServerErrorPayload(value);

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
