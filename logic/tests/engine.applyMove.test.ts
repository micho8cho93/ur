import { applyMove, createInitialState, INITIAL_PIECE_COUNT } from '@/logic/engine';
import { PATH_LENGTH } from '@/logic/constants';
import { getMatchConfig } from '@/logic/matchConfigs';
import { buildGameModeMatchConfig } from '@/shared/gameModes';

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

  it('grants another turn after a capture in Capture mode', () => {
    const state = createInitialState(getMatchConfig('gameMode_capture'));
    state.phase = 'moving';
    state.rollValue = 1;
    state.light.pieces[0].position = 4;
    state.dark.pieces[0].position = 5;

    const move = { pieceId: state.light.pieces[0].id, fromIndex: 4, toIndex: 5 };
    const next = applyMove(state, move);

    expect(next.currentTurn).toBe('light');
    expect(next.phase).toBe('rolling');
    expect(next.rollValue).toBeNull();
    expect(next.dark.pieces[0].position).toBe(-1);
  });

  it('grants another turn after a capture in a custom mode that uses capture rules', () => {
    const customCaptureConfig = buildGameModeMatchConfig({
      id: 'custom_capture',
      name: 'Custom Capture',
      description: 'Protected rosette capture mode',
      baseRulesetPreset: 'custom',
      pieceCountPerSide: 7,
      rulesVariant: 'capture',
      rosetteSafetyMode: 'standard',
      exitStyle: 'standard',
      eliminationMode: 'return_to_start',
      fogOfWar: false,
      boardAssetKey: 'board_design',
    });
    const state = createInitialState(customCaptureConfig);
    state.phase = 'moving';
    state.rollValue = 1;
    state.light.pieces[0].position = 4;
    state.dark.pieces[0].position = 5;

    const move = { pieceId: state.light.pieces[0].id, fromIndex: 4, toIndex: 5 };
    const next = applyMove(state, move);

    expect(next.currentTurn).toBe('light');
    expect(next.phase).toBe('rolling');
    expect(next.rollValue).toBeNull();
    expect(next.dark.pieces[0].position).toBe(-1);
  });

  it('keeps the turn on a Bell bonus throw even without a rosette landing', () => {
    const bellConfig = {
      ...getMatchConfig('gameMode_finkel_rules'),
      baseRulesetPreset: 'rc_bell' as const,
      rosetteSafetyMode: 'open' as const,
      throwProfile: 'bell' as const,
      bonusTurnOnRosette: false,
      bonusTurnOnCapture: false,
    };
    const state = createInitialState(bellConfig);
    state.phase = 'moving';
    state.rollValue = 2;
    state.light.pieces[0].position = 4;

    const move = { pieceId: state.light.pieces[0].id, fromIndex: 4, toIndex: 5 };
    const next = applyMove(state, move);

    expect(next.currentTurn).toBe('light');
    expect(next.phase).toBe('rolling');
    expect(next.rollValue).toBeNull();
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
