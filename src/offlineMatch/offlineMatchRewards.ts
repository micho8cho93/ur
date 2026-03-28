import { BotDifficulty } from '@/logic/bot/types';
import { GameState, PlayerColor } from '@/logic/types';
import {
  CHALLENGE_THRESHOLDS,
  CompletedMatchSummary,
  MatchSummaryCheckpointReason,
  OpponentType,
  calculateComebackCheckpoint,
  calculateDoubleStrikeTurnSpan,
  countActivePiecesOnBoard,
  getOpponentDifficultyFromType,
  getPositionLeadRelation,
  hasPlayerExitedStartingArea,
  isContestedLanding,
  isOneSuccessfulMoveFromVictory,
} from '@/shared/challenges';
import { getPathLength } from '@/logic/pathVariants';

export type OfflinePlayerMatchTelemetry = {
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
  behindReasons: MatchSummaryCheckpointReason[];
  firstStartingAreaExitTurn: number | null;
  opponentReachedBrink: boolean;
  lastBehindTurnIndex: number | null;
  momentumShiftAchieved: boolean;
  momentumShiftTurnSpan: number | null;
  maxActivePiecesOnBoard: number;
};

export type OfflineMatchTelemetry = {
  totalMoves: number;
  totalTurns: number;
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
  behindReasons: [],
  firstStartingAreaExitTurn: null,
  opponentReachedBrink: false,
  lastBehindTurnIndex: null,
  momentumShiftAchieved: false,
  momentumShiftTurnSpan: null,
  maxActivePiecesOnBoard: 0,
});

export const createOfflineMatchTelemetry = (): OfflineMatchTelemetry => ({
  totalMoves: 0,
  totalTurns: 0,
  players: {
    light: createPlayerTelemetry(),
    dark: createPlayerTelemetry(),
  },
});

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

const updateComebackTelemetry = (
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

const updateActivePieceTelemetry = (
  telemetry: OfflineMatchTelemetry,
  state: GameState,
): OfflineMatchTelemetry => {
  const pathLength = getPathLength(state.matchConfig.pathVariant);
  let nextTelemetry = telemetry;

  (['light', 'dark'] as PlayerColor[]).forEach((playerColor) => {
    const activePieceCount = countActivePiecesOnBoard(state[playerColor], pathLength);
    nextTelemetry = patchPlayerTelemetry(nextTelemetry, playerColor, (current) => ({
      ...current,
      maxActivePiecesOnBoard: Math.max(current.maxActivePiecesOnBoard, activePieceCount),
    }));
  });

  return nextTelemetry;
};

const updateStartingAreaExitTelemetry = (
  telemetry: OfflineMatchTelemetry,
  state: GameState,
  playerColor: PlayerColor,
): OfflineMatchTelemetry =>
  patchPlayerTelemetry(telemetry, playerColor, (current) => {
    if (current.firstStartingAreaExitTurn !== null) {
      return current;
    }

    if (!hasPlayerExitedStartingArea(state[playerColor], state.matchConfig.pathVariant)) {
      return current;
    }

    return {
      ...current,
      firstStartingAreaExitTurn: current.playerTurnCount,
    };
  });

const updateOpponentBrinkTelemetry = (
  telemetry: OfflineMatchTelemetry,
  state: GameState,
): OfflineMatchTelemetry => {
  let nextTelemetry = telemetry;

  (['light', 'dark'] as PlayerColor[]).forEach((playerColor) => {
    const opponentColor: PlayerColor = playerColor === 'light' ? 'dark' : 'light';
    if (isOneSuccessfulMoveFromVictory(state, opponentColor)) {
      nextTelemetry = patchPlayerTelemetry(nextTelemetry, playerColor, (current) => ({
        ...current,
        opponentReachedBrink: true,
      }));
    }
  });

  return nextTelemetry;
};

const updateMomentumTelemetry = (
  telemetry: OfflineMatchTelemetry,
  state: GameState,
): OfflineMatchTelemetry => {
  let nextTelemetry = telemetry;
  const turnIndex = telemetry.totalTurns;

  (['light', 'dark'] as PlayerColor[]).forEach((playerColor) => {
    const relation = getPositionLeadRelation(state, playerColor);
    nextTelemetry = patchPlayerTelemetry(nextTelemetry, playerColor, (current) => {
      if (relation === 'behind') {
        return {
          ...current,
          lastBehindTurnIndex: turnIndex,
        };
      }

      if (relation !== 'ahead' || current.lastBehindTurnIndex === null) {
        return current;
      }

      const turnSpan = turnIndex - current.lastBehindTurnIndex;
      if (turnSpan > CHALLENGE_THRESHOLDS.MOMENTUM_SHIFT_MAX_TURN_WINDOW) {
        return current;
      }

      return {
        ...current,
        momentumShiftAchieved: true,
        momentumShiftTurnSpan:
          current.momentumShiftTurnSpan === null ? turnSpan : Math.min(current.momentumShiftTurnSpan, turnSpan),
      };
    });
  });

  return nextTelemetry;
};

const completePlayerTurnTelemetry = (
  telemetry: OfflineMatchTelemetry,
  state: GameState,
  playerColor: PlayerColor,
  options: { didCapture: boolean; unusableRoll: boolean },
): OfflineMatchTelemetry => {
  let nextTelemetry: OfflineMatchTelemetry = {
    ...telemetry,
    totalTurns: telemetry.totalTurns + 1,
  };

  nextTelemetry = patchPlayerTelemetry(nextTelemetry, playerColor, (current) => {
    const nextTurnCount = current.playerTurnCount + 1;

    if (options.unusableRoll) {
      return {
        ...current,
        playerTurnCount: nextTurnCount,
        unusableRollCount: current.unusableRollCount + 1,
        currentCaptureTurnStreak: 0,
      };
    }

    if (!options.didCapture) {
      return {
        ...current,
        playerTurnCount: nextTurnCount,
        currentCaptureTurnStreak: 0,
      };
    }

    const nextCaptureStreak = current.currentCaptureTurnStreak + 1;
    return {
      ...current,
      playerTurnCount: nextTurnCount,
      captureTurnNumbers: [...current.captureTurnNumbers, nextTurnCount],
      currentCaptureTurnStreak: nextCaptureStreak,
      maxCaptureTurnStreak: Math.max(current.maxCaptureTurnStreak, nextCaptureStreak),
    };
  });

  nextTelemetry = updateStartingAreaExitTelemetry(nextTelemetry, state, playerColor);
  nextTelemetry = updateActivePieceTelemetry(nextTelemetry, state);
  nextTelemetry = updateComebackTelemetry(nextTelemetry, state);
  nextTelemetry = updateMomentumTelemetry(nextTelemetry, state);
  nextTelemetry = updateOpponentBrinkTelemetry(nextTelemetry, state);
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
  previousState: GameState,
  nextState: GameState,
  newEntries: string[],
): OfflineMatchTelemetry => {
  let nextTelemetry = telemetry;
  const capturesByPlayer: Partial<Record<PlayerColor, boolean>> = {};

  newEntries.forEach((entry) => {
    const captureMatch = entry.match(CAPTURE_HISTORY_RE);
    if (captureMatch) {
      const capturer = captureMatch[1] as PlayerColor;
      const victim = captureMatch[2] as PlayerColor;

      capturesByPlayer[capturer] = true;
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

      nextTelemetry = {
        ...patchPlayerTelemetry(nextTelemetry, mover, (current) => ({
          ...current,
          playerMoveCount: current.playerMoveCount + 1,
          contestedTilesLandedCount:
            current.contestedTilesLandedCount +
            (isContestedLanding(nextState.matchConfig.pathVariant, mover, toIndex) ? 1 : 0),
        })),
        totalMoves: nextTelemetry.totalMoves + 1,
      };
      nextTelemetry = completePlayerTurnTelemetry(nextTelemetry, nextState, mover, {
        didCapture: capturesByPlayer[mover] === true,
        unusableRoll: false,
      });
      capturesByPlayer[mover] = false;
      return;
    }

    if (NO_MOVE_HISTORY_RE.test(entry)) {
      const playerColor = entry.startsWith('light') ? 'light' : 'dark';
      nextTelemetry = completePlayerTurnTelemetry(nextTelemetry, nextState, playerColor, {
        didCapture: false,
        unusableRoll: true,
      });
    }
  });

  if (previousState.winner !== nextState.winner) {
    nextTelemetry = updateActivePieceTelemetry(nextTelemetry, nextState);
    nextTelemetry = updateOpponentBrinkTelemetry(nextTelemetry, nextState);
  }

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
  const opponentTelemetry = params.telemetry.players[opponentColor];
  const doubleStrikeTurnSpan = calculateDoubleStrikeTurnSpan(playerTelemetry.captureTurnNumbers);

  return {
    matchId: params.matchId,
    playerUserId: params.playerUserId ?? '',
    opponentType: params.opponentType,
    opponentDifficulty: getOpponentDifficultyFromType(params.opponentType),
    didWin: params.finalState.winner === params.playerColor,
    totalMoves: params.telemetry.totalMoves,
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
    borneOffCount: params.finalState[params.playerColor].finishedCount,
    opponentBorneOffCount: params.finalState[opponentColor].finishedCount,
    wasBehindDuringMatch: playerTelemetry.wasBehindDuringMatch,
    behindCheckpointCount: playerTelemetry.behindCheckpointCount,
    behindReasons: [...playerTelemetry.behindReasons],
    opponentReachedBrink: playerTelemetry.opponentReachedBrink,
    momentumShiftAchieved: playerTelemetry.momentumShiftAchieved,
    momentumShiftTurnSpan: playerTelemetry.momentumShiftTurnSpan,
    maxActivePiecesOnBoard: playerTelemetry.maxActivePiecesOnBoard,
    modeId: params.finalState.matchConfig.modeId,
    pieceCountPerSide: params.finalState.matchConfig.pieceCountPerSide,
    isPrivateMatch: false,
    isFriendMatch: false,
    isTournamentMatch: false,
    tournamentEliminationRisk: false,
    timestamp: params.completedAt ?? new Date().toISOString(),
  };
};
