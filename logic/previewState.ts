import { createInitialState } from './engine';
import type { GameState, PlayerColor } from './types';

const PREVIEW_POSITIONS: Record<PlayerColor, readonly number[]> = {
  light: [5, 8, 12, -1],
  dark: [6, 10, 12, -1],
};

export const createPreviewGameState = (): GameState => {
  const state = JSON.parse(JSON.stringify(createInitialState())) as GameState;

  state.currentTurn = 'light';
  state.phase = 'rolling';
  state.rollValue = null;
  state.winner = null;
  state.history = [];

  (['light', 'dark'] as const).forEach((color) => {
    state[color].pieces.forEach((piece, index) => {
      piece.position = PREVIEW_POSITIONS[color][index] ?? -1;
      piece.isFinished = false;
    });
    state[color].capturedCount = 0;
    state[color].finishedCount = 0;
  });

  return state;
};
