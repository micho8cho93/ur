import { BotDifficulty } from '@/logic/bot/types';
import { PATH_DARK, PATH_LENGTH, PATH_LIGHT, isWarZone } from '@/logic/constants';
import { GameState, PlayerColor } from '@/logic/types';
import {
  CompletedMatchSummary,
  MatchSummaryCheckpointReason,
  OpponentType,
  calculateComebackCheckpoint,
} from '@/shared/challenges';

export type OfflinePlayerMatchTelemetry = {
  playerMoveCount: number;
  maxRollCount: number;
  capturesMade: number;
  capturesSuffered: number;
  contestedTilesLandedCount: number;
  wasBehindDuringMatch: boolean;
  behindCheckpointCount: number;
  behindReasons: MatchSummaryCheckpointReason[];
};

export type OfflineMatchTelemetry = {
  totalMoves: number;
  players: Record<PlayerColor, OfflinePlayerMatchTelemetry>;
};

const MOVE_HISTORY_RE = /^(light|dark) moved to (\d+)\. Rosette: (true|false)$/;
const CAPTURE_HISTORY_RE = /^(light|dark) captured (light|dark)$/;
const NO_MOVE_HISTORY_RE = /^(light|dark) rolled ([0-4]) but had no moves\.$/;

const BOT_OPPONENT_BY_DIFFICULTY: Record<BotDifficulty, OpponentType> = {
  easy: 'easy_bot',
  medium: 'medium_bot',
  hard: 'hard_bot',
  perfect: 'perfect_bot',
};

const createPlayerTelemetry = (): OfflinePlayerMatchTelemetry => ({
  playerMoveCount: 0,
  maxRollCount: 0,
  capturesMade: 0,
  capturesSuffered: 0,
  contestedTilesLandedCount: 0,
  wasBehindDuringMatch: false,
  behindCheckpointCount: 0,
  behindReasons: [],
});

export const createOfflineMatchTelemetry = (): OfflineMatchTelemetry => ({
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

  return color === 'light' ? PATH_LIGHT[index] ?? null : PATH_DARK[index] ?? null;
};

const appendUniqueReasons = (
  currentReasons: MatchSummaryCheckpointReason[],
  nextReasons: MatchSummaryCheckpointReason[],
): MatchSummaryCheckpointReason[] => {
  if (nextReasons.length === 0) {
    return currentReasons;
  }

  const merged = [...currentReasons];
  nextReasons.forEach((reason) => {
    if (!merged.includes(reason)) {
      merged.push(reason);
    }
  });

  return merged;
};

const patchPlayerTelemetry = (
  telemetry: OfflineMatchTelemetry,
  playerColor: PlayerColor,
  updater: (current: OfflinePlayerMatchTelemetry) => OfflinePlayerMatchTelemetry,
): OfflineMatchTelemetry => ({
  ...telemetry,
  players: {
    ...telemetry.players,
    [playerColor]: updater(telemetry.players[playerColor]),
  },
});

const recordComebackCheckpoint = (
  telemetry: OfflineMatchTelemetry,
  state: GameState,
): OfflineMatchTelemetry => {
  let nextTelemetry = telemetry;

  (['light', 'dark'] as PlayerColor[]).forEach((playerColor) => {
    const checkpoint = calculateComebackCheckpoint(state, playerColor);
    if (!checkpoint.wasBehind) {
      return;
    }

    nextTelemetry = patchPlayerTelemetry(nextTelemetry, playerColor, (current) => ({
      ...current,
      wasBehindDuringMatch: true,
      behindCheckpointCount: current.behindCheckpointCount + 1,
      behindReasons: appendUniqueReasons(current.behindReasons, checkpoint.reasons),
    }));
  });

  return nextTelemetry;
};

export const recordOfflineRoll = (
  telemetry: OfflineMatchTelemetry,
  playerColor: PlayerColor,
  rollValue: number,
): OfflineMatchTelemetry => {
  if (rollValue !== 4) {
    return telemetry;
  }

  return patchPlayerTelemetry(telemetry, playerColor, (current) => ({
    ...current,
    maxRollCount: current.maxRollCount + 1,
  }));
};

export const recordOfflineHistoryEntries = (
  telemetry: OfflineMatchTelemetry,
  nextState: GameState,
  newEntries: string[],
): OfflineMatchTelemetry => {
  let nextTelemetry = telemetry;

  newEntries.forEach((entry) => {
    const captureMatch = entry.match(CAPTURE_HISTORY_RE);
    if (captureMatch) {
      const capturer = captureMatch[1] as PlayerColor;
      const victim = captureMatch[2] as PlayerColor;

      nextTelemetry = patchPlayerTelemetry(nextTelemetry, capturer, (current) => ({
        ...current,
        capturesMade: current.capturesMade + 1,
      }));
      nextTelemetry = patchPlayerTelemetry(nextTelemetry, victim, (current) => ({
        ...current,
        capturesSuffered: current.capturesSuffered + 1,
      }));
      return;
    }

    const moveMatch = entry.match(MOVE_HISTORY_RE);
    if (moveMatch) {
      const mover = moveMatch[1] as PlayerColor;
      const toIndex = Number(moveMatch[2]);
      const targetCoord = getPathCoord(mover, toIndex);

      nextTelemetry = {
        ...patchPlayerTelemetry(nextTelemetry, mover, (current) => ({
          ...current,
          playerMoveCount: current.playerMoveCount + 1,
          contestedTilesLandedCount:
            current.contestedTilesLandedCount +
            (targetCoord && isWarZone(targetCoord.row, targetCoord.col) ? 1 : 0),
        })),
        totalMoves: nextTelemetry.totalMoves + 1,
      };
      nextTelemetry = recordComebackCheckpoint(nextTelemetry, nextState);
      return;
    }

    if (NO_MOVE_HISTORY_RE.test(entry)) {
      nextTelemetry = recordComebackCheckpoint(nextTelemetry, nextState);
    }
  });

  return nextTelemetry;
};

export const getBotOpponentType = (difficulty: BotDifficulty): OpponentType =>
  BOT_OPPONENT_BY_DIFFICULTY[difficulty];

export const buildOfflineCompletedMatchSummary = (params: {
  matchId: string;
  playerColor: PlayerColor;
  opponentType: OpponentType;
  finalState: GameState;
  telemetry: OfflineMatchTelemetry;
  playerUserId?: string;
  completedAt?: string;
}): CompletedMatchSummary => {
  const opponentColor: PlayerColor = params.playerColor === 'light' ? 'dark' : 'light';
  const playerTelemetry = params.telemetry.players[params.playerColor];

  return {
    matchId: params.matchId,
    playerUserId: params.playerUserId ?? '',
    opponentType: params.opponentType,
    didWin: params.finalState.winner === params.playerColor,
    totalMoves: params.telemetry.totalMoves,
    playerMoveCount: playerTelemetry.playerMoveCount,
    piecesLost: playerTelemetry.capturesSuffered,
    maxRollCount: playerTelemetry.maxRollCount,
    capturesMade: playerTelemetry.capturesMade,
    capturesSuffered: playerTelemetry.capturesSuffered,
    contestedTilesLandedCount: playerTelemetry.contestedTilesLandedCount,
    borneOffCount: params.finalState[params.playerColor].finishedCount,
    opponentBorneOffCount: params.finalState[opponentColor].finishedCount,
    wasBehindDuringMatch: playerTelemetry.wasBehindDuringMatch,
    behindCheckpointCount: playerTelemetry.behindCheckpointCount,
    behindReasons: [...playerTelemetry.behindReasons],
    timestamp: params.completedAt ?? new Date().toISOString(),
  };
};
