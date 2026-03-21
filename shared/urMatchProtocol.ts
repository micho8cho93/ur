import { GameState, MoveAction, PlayerColor } from "../logic/types";
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

export type StateSnapshotPayload = {
  type: "state_snapshot";
  matchId: string;
  revision: number;
  gameState: GameState;
  assignments: Record<string, PlayerColor>;
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
  isRecord(value.assignments);

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
