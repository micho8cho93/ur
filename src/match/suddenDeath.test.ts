import { createInitialState } from '@/logic/engine';
import { isSuddenDeathState } from './suddenDeath';

describe('isSuddenDeathState', () => {
  it('returns true when each side has one unscored piece left', () => {
    const state = createInitialState();
    state.light.finishedCount = state.matchConfig.pieceCountPerSide - 1;
    state.dark.finishedCount = state.matchConfig.pieceCountPerSide - 1;

    expect(isSuddenDeathState(state)).toBe(true);
  });

  it('returns false until both sides reach their final piece', () => {
    const state = createInitialState();
    state.light.finishedCount = state.matchConfig.pieceCountPerSide - 1;
    state.dark.finishedCount = state.matchConfig.pieceCountPerSide - 2;

    expect(isSuddenDeathState(state)).toBe(false);
  });
});
