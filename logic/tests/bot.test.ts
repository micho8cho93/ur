import { getBotMove } from '@/logic/bot/bot';
import { getMatchConfig } from '@/logic/matchConfigs';
import { PATH_LENGTH } from '@/logic/constants';
import { createInitialState } from '@/logic/engine';
import { getPathLength } from '@/logic/pathVariants';
import { GameState, PlayerColor } from '@/logic/types';

const setActivePieces = (state: GameState, color: PlayerColor, positions: Record<number, number>) => {
  const player = state[color];
  const pathLength = getPathLength(state.matchConfig.pathVariant);

  player.finishedCount = 0;
  player.pieces.forEach((piece, index) => {
    const position = positions[index];
    if (position === undefined) {
      piece.position = pathLength;
      piece.isFinished = true;
      player.finishedCount += 1;
      return;
    }

    piece.position = position;
    piece.isFinished = position >= pathLength;
    if (piece.isFinished) {
      player.finishedCount += 1;
    }
  });
};

describe('bot difficulty selection', () => {
  it('easy returns the only legal move when there is no choice', () => {
    const state = createInitialState();
    state.currentTurn = 'dark';
    state.phase = 'moving';
    state.rollValue = 1;

    setActivePieces(state, 'dark', { 0: PATH_LENGTH - 1 });
    setActivePieces(state, 'light', {});

    expect(getBotMove(state, 1, 'easy')).toEqual({
      pieceId: state.dark.pieces[0].id,
      fromIndex: PATH_LENGTH - 1,
      toIndex: PATH_LENGTH,
    });
  });

  it('medium, hard, and perfect all prioritize an immediate capture over a quiet move', () => {
    const state = createInitialState();
    state.currentTurn = 'dark';
    state.phase = 'moving';
    state.rollValue = 1;

    setActivePieces(state, 'dark', {
      0: 4,
      1: 0,
    });
    setActivePieces(state, 'light', {
      0: 5,
    });

    const expectedMove = {
      pieceId: state.dark.pieces[0].id,
      fromIndex: 4,
      toIndex: 5,
    };

    expect(getBotMove(state, 1, 'medium')).toEqual(expectedMove);
    expect(getBotMove(state, 1, 'hard')).toEqual(expectedMove);
    expect(getBotMove(state, 1, 'perfect')).toEqual(expectedMove);
  });

  it('uses the configured full-path finish square for practice modes', () => {
    const fullPathConfig = getMatchConfig('gameMode_full_path');
    const fullPathLength = getPathLength(fullPathConfig.pathVariant);
    const state = createInitialState(fullPathConfig);
    state.currentTurn = 'dark';
    state.phase = 'moving';
    state.rollValue = 1;

    setActivePieces(state, 'dark', { 0: fullPathLength - 1 });
    setActivePieces(state, 'light', {});

    expect(getBotMove(state, 1, 'hard')).toEqual({
      pieceId: state.dark.pieces[0].id,
      fromIndex: fullPathLength - 1,
      toIndex: fullPathLength,
    });
  });

  it('treats the shared rosette as capturable in Capture mode', () => {
    const captureConfig = getMatchConfig('gameMode_capture');
    const state = createInitialState(captureConfig);
    state.currentTurn = 'dark';
    state.phase = 'moving';
    state.rollValue = 4;

    setActivePieces(state, 'dark', {
      0: 3,
      1: 0,
    });
    setActivePieces(state, 'light', {
      0: 7,
    });

    const expectedMove = {
      pieceId: state.dark.pieces[0].id,
      fromIndex: 3,
      toIndex: 7,
    };

    expect(getBotMove(state, 4, 'medium')).toEqual(expectedMove);
    expect(getBotMove(state, 4, 'hard')).toEqual(expectedMove);
    expect(getBotMove(state, 4, 'perfect')).toEqual(expectedMove);
  });
});
