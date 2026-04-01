import type { GameState } from '@/logic/types';

export const hasOnePieceLeftToPlay = (state: GameState, color: 'light' | 'dark'): boolean =>
  state.matchConfig.pieceCountPerSide - state[color].finishedCount === 1;

export const isSuddenDeathState = (state: GameState): boolean =>
  hasOnePieceLeftToPlay(state, 'light') && hasOnePieceLeftToPlay(state, 'dark');
