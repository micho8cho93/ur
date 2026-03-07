import { applyMove, createInitialState, INITIAL_PIECE_COUNT } from '@/logic/engine';
import { PATH_LENGTH } from '@/logic/constants';

describe('engine applyMove', () => {
  it('applies a normal move and changes turn', () => {
    const state = createInitialState();
    state.phase = 'moving';
    state.rollValue = 1;

    const move = { pieceId: state.light.pieces[0].id, fromIndex: -1, toIndex: 0 };
    const next = applyMove(state, move);

    expect(next.light.pieces[0].position).toBe(0);
    expect(next.currentTurn).toBe('dark');
    expect(next.phase).toBe('rolling');
    expect(next.rollValue).toBeNull();
  });

  it('keeps the same turn on rosette landing and resets phase/roll state', () => {
    const state = createInitialState();
    state.phase = 'moving';
    state.rollValue = 1;
    state.light.pieces[0].position = 2;

    const move = { pieceId: state.light.pieces[0].id, fromIndex: 2, toIndex: 3 };
    const next = applyMove(state, move);

    expect(next.light.pieces[0].position).toBe(3);
    expect(next.currentTurn).toBe('light');
    expect(next.phase).toBe('rolling');
    expect(next.rollValue).toBeNull();
  });

  it('captures an opponent piece, returns it to reserve, and increments captured count', () => {
    const state = createInitialState();
    state.history = ['start'];
    state.light.pieces[0].position = 4;
    state.dark.pieces[0].position = 5;

    const move = { pieceId: state.light.pieces[0].id, fromIndex: 4, toIndex: 5 };
    const next = applyMove(state, move);

    expect(next.dark.pieces[0].position).toBe(-1);
    expect(next.light.capturedCount).toBe(1);
    expect(next.history).toEqual([
      'start',
      'light captured dark',
      'light moved to 5. Rosette: false',
    ]);
  });

  it('marks a piece finished and increments finished count on bearing off', () => {
    const state = createInitialState();
    state.light.pieces[0].position = PATH_LENGTH - 1;

    const move = { pieceId: state.light.pieces[0].id, fromIndex: PATH_LENGTH - 1, toIndex: PATH_LENGTH };
    const next = applyMove(state, move);

    expect(next.light.pieces[0].isFinished).toBe(true);
    expect(next.light.finishedCount).toBe(1);
  });

  it('sets winner and ended phase when all pieces are finished', () => {
    const state = createInitialState();
    state.light.finishedCount = INITIAL_PIECE_COUNT - 1;
    state.light.pieces[0].position = PATH_LENGTH - 1;

    const move = { pieceId: state.light.pieces[0].id, fromIndex: PATH_LENGTH - 1, toIndex: PATH_LENGTH };
    const next = applyMove(state, move);

    expect(next.winner).toBe('light');
    expect(next.phase).toBe('ended');
  });

  it('appends history entries in a stable, meaningful order', () => {
    const state = createInitialState();
    state.history = ['before'];

    const move = { pieceId: state.light.pieces[0].id, fromIndex: -1, toIndex: 0 };
    const next = applyMove(state, move);

    expect(next.history).toEqual(['before', 'light moved to 0. Rosette: false']);
  });
});
