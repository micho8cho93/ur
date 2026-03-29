// import { produce } from 'immer';
import { GameState, PlayerColor, Piece, Player, MoveAction } from './types';
import { isRosette, isWarZone } from './constants';
import { DEFAULT_MATCH_CONFIG, type MatchConfig } from './matchConfigs';
import { getPathCoord, getPathLength } from './pathVariants';
import { isProtectedFromCapture, shouldGrantExtraTurn } from './rules';

export const INITIAL_PIECE_COUNT = DEFAULT_MATCH_CONFIG.pieceCountPerSide;

const createPlayer = (color: PlayerColor, pieceCountPerSide: number): Player => ({
    id: color,
    color,
    pieces: Array.from({ length: pieceCountPerSide }).map((_, i) => ({
        id: `${color}-${i}`,
        owner: color,
        position: -1,
        isFinished: false,
    })),
    capturedCount: 0,
    finishedCount: 0,
});

export const createInitialState = (matchConfig: MatchConfig = DEFAULT_MATCH_CONFIG): GameState => ({
    currentTurn: 'light',
    rollValue: null,
    phase: 'rolling',
    matchConfig,
    light: createPlayer('light', matchConfig.pieceCountPerSide),
    dark: createPlayer('dark', matchConfig.pieceCountPerSide),
    winner: null,
    history: [],
});

export const rollDice = (): number => {
    let sum = 0;
    for (let i = 0; i < 4; i++) {
        if (Math.random() >= 0.5) sum++;
    }
    return sum;
};

export const getValidMoves = (state: GameState, roll: number): MoveAction[] => {
    if (roll === 0) return [];

    const player = state[state.currentTurn];
    const opponent = state[state.currentTurn === 'light' ? 'dark' : 'light'];
    const moves: MoveAction[] = [];
    const processedPositions = new Set<number>();
    const pathLength = getPathLength(state.matchConfig.pathVariant);

    for (const piece of player.pieces) {
        if (piece.isFinished) continue;

        if (piece.position === -1 && processedPositions.has(-1)) continue;
        if (piece.position === -1) processedPositions.add(-1);

        const targetIndex = piece.position + roll;

        if (targetIndex > pathLength) continue;

        if (targetIndex === pathLength) {
            moves.push({ pieceId: piece.id, fromIndex: piece.position, toIndex: targetIndex });
            continue;
        }

        const myPieceAtTarget = player.pieces.find(p => p.position === targetIndex && !p.isFinished);
        if (myPieceAtTarget) continue;

        const targetCoord = getPathCoord(state.matchConfig.pathVariant, player.color, targetIndex);
        if (!targetCoord) continue;
        const isShared = isWarZone(targetCoord.row, targetCoord.col);

        const opponentPiece = opponent.pieces.find(p => {
            if (p.isFinished || p.position === -1) return false;
            const opCoord = getPathCoord(state.matchConfig.pathVariant, opponent.color, p.position);
            if (!opCoord) return false;
            return opCoord.row === targetCoord.row && opCoord.col === targetCoord.col;
        });

        if (opponentPiece) {
            if (isShared && isProtectedFromCapture(state.matchConfig, targetCoord)) {
                continue;
            }
        }

        moves.push({ pieceId: piece.id, fromIndex: piece.position, toIndex: targetIndex });
    }

    return moves;
};

export const applyMove = (state: GameState, move: MoveAction): GameState => {
    const newState = JSON.parse(JSON.stringify(state)) as GameState;

    const player = newState[newState.currentTurn];
    const opponent = newState[newState.currentTurn === 'light' ? 'dark' : 'light'];
    const pathLength = getPathLength(newState.matchConfig.pathVariant);

    const piece = player.pieces.find(p => p.id === move.pieceId)!;
    piece.position = move.toIndex;

    if (move.toIndex === pathLength) {
        piece.isFinished = true;
        player.finishedCount++;
    }

    let didCapture = false;
    if (move.toIndex < pathLength) {
        const targetCoord = getPathCoord(newState.matchConfig.pathVariant, player.color, move.toIndex);
        if (!targetCoord) {
            throw new Error(`Missing path coordinate for ${player.color} at index ${move.toIndex}.`);
        }
        const opponentPiece = opponent.pieces.find(p => {
            if (p.isFinished || p.position === -1) return false;
            const opCoord = getPathCoord(newState.matchConfig.pathVariant, opponent.color, p.position);
            if (!opCoord) return false;
            return opCoord.row === targetCoord.row && opCoord.col === targetCoord.col;
        });

        if (opponentPiece) {
            opponentPiece.position = -1;
            player.capturedCount++;
            didCapture = true;
            newState.history.push(`${player.color} captured ${opponent.color}`);
        }
    }

    let isRosetteLanding = false;
    if (move.toIndex < pathLength) {
        const coord = getPathCoord(newState.matchConfig.pathVariant, player.color, move.toIndex);
        if (coord && isRosette(coord.row, coord.col)) {
            isRosetteLanding = true;
        }
    }

    newState.history.push(`${player.color} moved to ${move.toIndex}. Rosette: ${isRosetteLanding}`);

    if (shouldGrantExtraTurn(newState.matchConfig, { didCapture, landedOnRosette: isRosetteLanding })) {
        newState.phase = 'rolling';
        newState.rollValue = null;
    } else {
        newState.currentTurn = newState.currentTurn === 'light' ? 'dark' : 'light';
        newState.phase = 'rolling';
        newState.rollValue = null;
    }

    if (player.finishedCount >= newState.matchConfig.pieceCountPerSide) {
        newState.winner = player.color;
        newState.phase = 'ended';
    }

    return newState;
};
