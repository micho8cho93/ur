import { applyMove, getValidMoves } from '../engine';
import { isRosette } from '../constants';
import { GameState, MoveAction, Player, PlayerColor } from '../types';
import { getPathCoord, getPathLength } from '../pathVariants';
import { BotDifficulty, DEFAULT_BOT_DIFFICULTY } from './types';
import { isContestedWarTile } from '../rules';

type SearchContext = {
  rootColor: PlayerColor;
  cache: Map<string, number>;
};

const ROLL_OUTCOMES = [
  { roll: 0, probability: 1 / 16 },
  { roll: 1, probability: 4 / 16 },
  { roll: 2, probability: 6 / 16 },
  { roll: 3, probability: 4 / 16 },
  { roll: 4, probability: 1 / 16 },
] as const;

const EPSILON = 1e-6;
const otherColor = (color: PlayerColor): PlayerColor => (color === 'light' ? 'dark' : 'light');

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

const stripHistory = (state: GameState): GameState => (state.history.length === 0 ? state : { ...state, history: [] });

const sortPositions = (player: Player): string =>
  player.pieces
    .map(piece => piece.position)
    .sort((left, right) => left - right)
    .join(',');

const buildStateKey = (state: GameState, depth: number, rootColor: PlayerColor): string =>
  [
    rootColor,
    depth,
    state.currentTurn,
    state.phase,
    state.rollValue ?? 'n',
    state.matchConfig.modeId,
    sortPositions(state.light),
    sortPositions(state.dark),
  ].join('|');

const getPieceProgress = (position: number, pathLength: number): number => {
  if (position === -1) {
    return 0;
  }

  if (position >= pathLength) {
    return pathLength + 2;
  }

  return position + 1;
};

const getProgressScore = (player: Player, pathLength: number): number =>
  player.pieces.reduce((total, piece) => total + getPieceProgress(piece.position, pathLength), 0);

const countReservePieces = (player: Player): number =>
  player.pieces.filter(piece => piece.position === -1 && !piece.isFinished).length;

const getStatePathVariant = (state: GameState) => state.matchConfig.pathVariant;

const getPieceCoord = (state: GameState, color: PlayerColor, position: number) =>
  getPathCoord(getStatePathVariant(state), color, position);

const countRosetteOccupancyForState = (state: GameState, player: Player): number =>
  player.pieces.reduce((count, piece) => {
    const coord = getPieceCoord(state, player.color, piece.position);
    if (!coord) {
      return count;
    }

    return isRosette(coord.row, coord.col) ? count + 1 : count;
  }, 0);

const canReachCoordOnNextRoll = (state: GameState, attackerColor: PlayerColor, row: number, col: number): boolean => {
  const attacker = state[attackerColor];
  const pathLength = getPathLength(state.matchConfig.pathVariant);

  return attacker.pieces.some((piece) => {
    if (piece.isFinished) {
      return false;
    }

    for (let roll = 1; roll <= 4; roll += 1) {
      const targetIndex = piece.position + roll;
      if (targetIndex < 0 || targetIndex >= pathLength) {
        continue;
      }

      const coord = getPieceCoord(state, attackerColor, targetIndex);
      if (coord && coord.row === row && coord.col === col) {
        return true;
      }
    }

    return false;
  });
};

const countThreatenedPieces = (state: GameState, defenderColor: PlayerColor): number => {
  const attackerColor = otherColor(defenderColor);
  const defender = state[defenderColor];

  return defender.pieces.reduce((count, piece) => {
    const coord = getPieceCoord(state, defenderColor, piece.position);
    if (!isContestedWarTile(state.matchConfig, coord)) {
      return count;
    }

    return canReachCoordOnNextRoll(state, attackerColor, coord.row, coord.col) ? count + 1 : count;
  }, 0);
};

const countCaptureThreats = (state: GameState, attackerColor: PlayerColor): number => {
  const defenderColor = otherColor(attackerColor);
  const defender = state[defenderColor];

  return defender.pieces.reduce((count, piece) => {
    const coord = getPieceCoord(state, defenderColor, piece.position);
    if (!isContestedWarTile(state.matchConfig, coord)) {
      return count;
    }

    return canReachCoordOnNextRoll(state, attackerColor, coord.row, coord.col) ? count + 1 : count;
  }, 0);
};

const evaluateHeuristic = (state: GameState, rootColor: PlayerColor): number => {
  if (state.winner === rootColor) {
    return 1;
  }

  const opponentColor = otherColor(rootColor);
  if (state.winner === opponentColor) {
    return 0;
  }

  const root = state[rootColor];
  const opponent = state[opponentColor];
  const pathLength = getPathLength(state.matchConfig.pathVariant);

  const finishedDiff = root.finishedCount - opponent.finishedCount;
  const progressDiff = getProgressScore(root, pathLength) - getProgressScore(opponent, pathLength);
  const reserveDiff = countReservePieces(opponent) - countReservePieces(root);
  const rosetteDiff = countRosetteOccupancyForState(state, root) - countRosetteOccupancyForState(state, opponent);
  const threatDiff = countCaptureThreats(state, rootColor) - countCaptureThreats(state, opponentColor);
  const safetyDiff = countThreatenedPieces(state, opponentColor) - countThreatenedPieces(state, rootColor);
  const tempoBonus = state.currentTurn === rootColor ? 5 : -5;

  const score =
    finishedDiff * 150 +
    progressDiff * 6 +
    reserveDiff * 18 +
    rosetteDiff * 16 +
    threatDiff * 14 +
    safetyDiff * 18 +
    tempoBonus;

  return clamp(1 / (1 + Math.exp(-score / 100)), 0, 1);
};

const doesMoveCapture = (state: GameState, move: MoveAction): boolean => {
  const mover = state.currentTurn;
  const opponent = state[otherColor(mover)];
  const coord = getPieceCoord(state, mover, move.toIndex);
  if (!coord) {
    return false;
  }

  return opponent.pieces.some((piece) => {
    const pieceCoord = getPieceCoord(state, opponent.color, piece.position);
    return Boolean(pieceCoord && pieceCoord.row === coord.row && pieceCoord.col === coord.col);
  });
};

const isMoveUnsafe = (state: GameState, moverColor: PlayerColor, move: MoveAction): boolean => {
  const coord = getPieceCoord(state, moverColor, move.toIndex);
  if (!isContestedWarTile(state.matchConfig, coord)) {
    return false;
  }

  return canReachCoordOnNextRoll(state, otherColor(moverColor), coord.row, coord.col);
};

const scoreImmediateMove = (state: GameState, move: MoveAction, rootColor: PlayerColor): number => {
  const moverColor = state.currentTurn;
  const coord = getPieceCoord(state, moverColor, move.toIndex);
  const landsOnRosette = Boolean(coord && isRosette(coord.row, coord.col));
  const captures = doesMoveCapture(state, move);
  const nextState = stripHistory(applyMove(state, move));
  const pathLength = getPathLength(state.matchConfig.pathVariant);

  let score = evaluateHeuristic(nextState, rootColor) * 100;

  if (move.toIndex >= pathLength) {
    score += 120;
  }

  if (captures) {
    score += 90;
  }

  if (landsOnRosette) {
    score += 55;
  }

  if (move.fromIndex === -1) {
    score += 16;
  }

  score += Math.max(move.toIndex, 0) * 3.5;

  if (isMoveUnsafe(nextState, moverColor, move)) {
    score -= 46;
  }

  return score;
};

const simulateRollState = (state: GameState, roll: number): GameState => {
  const rollingState: GameState = {
    ...state,
    phase: 'moving',
    rollValue: roll,
  };

  const validMoves = getValidMoves(rollingState, roll);
  if (validMoves.length > 0) {
    return stripHistory(rollingState);
  }

  return stripHistory({
    ...rollingState,
    currentTurn: otherColor(rollingState.currentTurn),
    phase: 'rolling',
    rollValue: null,
    history: [...state.history, `${state.currentTurn} rolled ${roll} but had no moves.`],
  });
};

const evaluateSearch = (state: GameState, depth: number, context: SearchContext): number => {
  if (state.winner) {
    return state.winner === context.rootColor ? 1 : 0;
  }

  if (depth <= 0) {
    return evaluateHeuristic(state, context.rootColor);
  }

  const cacheKey = buildStateKey(state, depth, context.rootColor);
  const cached = context.cache.get(cacheKey);
  if (cached !== undefined) {
    return cached;
  }

  let value = 0;

  if (state.phase === 'moving' && state.rollValue !== null) {
    const validMoves = getValidMoves(state, state.rollValue);
    if (validMoves.length === 0) {
      value = evaluateSearch(
        stripHistory({
          ...state,
          currentTurn: otherColor(state.currentTurn),
          phase: 'rolling',
          rollValue: null,
        }),
        depth,
        context,
      );
    } else {
      const maximize = state.currentTurn === context.rootColor;
      const orderedMoves = [...validMoves].sort((left, right) => {
        const delta = scoreImmediateMove(state, right, context.rootColor) - scoreImmediateMove(state, left, context.rootColor);
        return maximize ? delta : -delta;
      });

      value = maximize ? -Infinity : Infinity;
      for (const move of orderedMoves) {
        const childValue = evaluateSearch(stripHistory(applyMove(state, move)), depth, context);
        value = maximize ? Math.max(value, childValue) : Math.min(value, childValue);
      }
    }
  } else {
    value = ROLL_OUTCOMES.reduce((total, outcome) => {
      const nextState = simulateRollState(state, outcome.roll);
      return total + outcome.probability * evaluateSearch(nextState, depth - 1, context);
    }, 0);
  }

  context.cache.set(cacheKey, value);
  return value;
};

const chooseRandomMove = (moves: MoveAction[]): MoveAction => moves[Math.floor(Math.random() * moves.length)];

const pickMediumMove = (state: GameState, moves: MoveAction[]): MoveAction => {
  const rootColor = state.currentTurn;
  const rankedMoves = moves
    .map(move => ({ move, score: scoreImmediateMove(state, move, rootColor) }))
    .sort((left, right) => right.score - left.score);

  const bestScore = rankedMoves[0]?.score ?? 0;
  const shortlist = rankedMoves.filter(entry => bestScore - entry.score <= 10);
  return chooseRandomMove(shortlist.map(entry => entry.move));
};

const getSearchDepth = (difficulty: BotDifficulty, state: GameState): number => {
  const remainingPieces =
    state.matchConfig.pieceCountPerSide * 2 - (state.light.finishedCount + state.dark.finishedCount);

  if (difficulty === 'hard') {
    if (remainingPieces <= 4) return 4;
    if (remainingPieces <= 8) return 3;
    return 2;
  }

  if (remainingPieces <= 4) return 6;
  if (remainingPieces <= 8) return 5;
  return 4;
};

const pickSearchMove = (state: GameState, moves: MoveAction[], difficulty: BotDifficulty): MoveAction => {
  const rootColor = state.currentTurn;
  const context: SearchContext = {
    rootColor,
    cache: new Map<string, number>(),
  };
  const depth = getSearchDepth(difficulty, state);

  let bestMove = moves[0]!;
  let bestScore = -Infinity;
  let bestImmediateScore = -Infinity;

  const orderedMoves = [...moves].sort(
    (left, right) => scoreImmediateMove(state, right, rootColor) - scoreImmediateMove(state, left, rootColor),
  );

  for (const move of orderedMoves) {
    const immediateScore = scoreImmediateMove(state, move, rootColor);
    const nextState = stripHistory(applyMove(state, move));
    const searchScore = evaluateSearch(nextState, depth, context);

    if (
      searchScore > bestScore + EPSILON ||
      (Math.abs(searchScore - bestScore) <= EPSILON && immediateScore > bestImmediateScore)
    ) {
      bestMove = move;
      bestScore = searchScore;
      bestImmediateScore = immediateScore;
    }
  }

  return bestMove;
};

export const getBotMove = (
  state: GameState,
  roll: number,
  difficulty: BotDifficulty = DEFAULT_BOT_DIFFICULTY,
): MoveAction | null => {
  const searchState = stripHistory(state);
  const moves = getValidMoves(searchState, roll);
  if (moves.length === 0) return null;

  switch (difficulty) {
    case 'medium':
      return pickMediumMove(searchState, moves);
    case 'hard':
    case 'perfect':
      return pickSearchMove(searchState, moves, difficulty);
    case 'easy':
    default:
      return chooseRandomMove(moves);
  }
};
