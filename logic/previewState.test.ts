import { createPreviewGameState } from './previewState';

describe('createPreviewGameState', () => {
  it('creates a stable rolling preview state with distributed pieces', () => {
    const state = createPreviewGameState();

    expect(state.currentTurn).toBe('light');
    expect(state.phase).toBe('rolling');
    expect(state.rollValue).toBeNull();
    expect(state.winner).toBeNull();
    expect(state.light.pieces.map((piece) => piece.position)).toEqual([5, 8, 12, -1, -1, -1, -1]);
    expect(state.dark.pieces.map((piece) => piece.position)).toEqual([6, 10, 12, -1, -1, -1, -1]);
    expect(state.light.finishedCount).toBe(0);
    expect(state.dark.finishedCount).toBe(0);
    expect(state.light.pieces.every((piece) => !piece.isFinished)).toBe(true);
    expect(state.dark.pieces.every((piece) => !piece.isFinished)).toBe(true);
  });

  it('returns a fresh object each time', () => {
    const first = createPreviewGameState();
    const second = createPreviewGameState();

    first.light.pieces[0].position = 0;

    expect(second.light.pieces[0].position).toBe(5);
  });
});
