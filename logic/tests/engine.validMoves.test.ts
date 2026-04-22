import { createInitialState, getValidMoves } from '@/logic/engine';
import { PATH_LENGTH } from '@/logic/constants';
import { getMatchConfig } from '@/logic/matchConfigs';
import { GameState, PlayerColor } from '@/logic/types';
import { buildGameModeMatchConfig } from '@/shared/gameModes';

const setOnlyActivePiece = (state: GameState, color: PlayerColor, pieceIndex: number, position: number) => {
  const player = state[color];

  player.pieces.forEach((piece, index) => {
    piece.position = -1;
    piece.isFinished = index !== pieceIndex;
  });

  player.pieces[pieceIndex].position = position;
  player.pieces[pieceIndex].isFinished = false;
};

describe('engine getValidMoves', () => {
  it('returns no valid moves for a roll of 0', () => {
    const state = createInitialState();

    expect(getValidMoves(state, 0)).toEqual([]);
  });

  it('does not allow a move beyond PATH_LENGTH', () => {
    const state = createInitialState();
    setOnlyActivePiece(state, 'light', 0, PATH_LENGTH - 1);

    const moves = getValidMoves(state, 2);

    expect(moves).toEqual([]);
  });

  it('does not allow landing on a friendly occupied target', () => {
    const state = createInitialState();
    const player = state.light;
    state.currentTurn = 'light';

    player.pieces.forEach(piece => {
      piece.position = -1;
      piece.isFinished = true;
    });

    player.pieces[0].isFinished = false;
    player.pieces[0].position = 4;
    player.pieces[1].isFinished = false;
    player.pieces[1].position = 5;

    const moves = getValidMoves(state, 1);

    expect(moves.some(move => move.pieceId === player.pieces[0].id && move.toIndex === 5)).toBe(false);
  });

  it('allows jumping over a friendly piece when the destination is open', () => {
    const state = createInitialState();
    const player = state.light;
    state.currentTurn = 'light';

    player.pieces.forEach(piece => {
      piece.position = -1;
      piece.isFinished = true;
    });

    player.pieces[0].isFinished = false;
    player.pieces[0].position = 0;
    player.pieces[1].isFinished = false;
    player.pieces[1].position = 1;

    const moves = getValidMoves(state, 2);

    expect(moves).toContainEqual({
      pieceId: player.pieces[0].id,
      fromIndex: 0,
      toIndex: 2,
    });
  });

  it('collapses duplicate reserve-origin moves to a single move', () => {
    const state = createInitialState();

    const moves = getValidMoves(state, 2);
    const reserveMoves = moves.filter(move => move.fromIndex === -1);

    expect(reserveMoves).toHaveLength(1);
  });

  it('includes finishing exactly at PATH_LENGTH as a valid move', () => {
    const state = createInitialState();
    setOnlyActivePiece(state, 'light', 0, PATH_LENGTH - 1);

    const moves = getValidMoves(state, 1);

    expect(moves).toEqual([
      {
        pieceId: state.light.pieces[0].id,
        fromIndex: PATH_LENGTH - 1,
        toIndex: PATH_LENGTH,
      },
    ]);
  });

  it('allows capture on shared war-zone squares when legal', () => {
    const state = createInitialState();
    state.currentTurn = 'light';
    setOnlyActivePiece(state, 'light', 0, 4);
    setOnlyActivePiece(state, 'dark', 0, 5);

    const moves = getValidMoves(state, 1);

    expect(moves).toContainEqual({
      pieceId: state.light.pieces[0].id,
      fromIndex: 4,
      toIndex: 5,
    });
  });

  it('does not allow landing on a shared rosette occupied by an opponent', () => {
    const state = createInitialState();
    state.currentTurn = 'light';
    setOnlyActivePiece(state, 'light', 0, 6);
    setOnlyActivePiece(state, 'dark', 0, 7);

    const moves = getValidMoves(state, 1);

    expect(moves).toEqual([]);
  });

  it('allows capturing an opponent on the shared rosette in Capture mode', () => {
    const state = createInitialState(getMatchConfig('gameMode_capture'));
    state.currentTurn = 'light';
    setOnlyActivePiece(state, 'light', 0, 6);
    setOnlyActivePiece(state, 'dark', 0, 7);

    const moves = getValidMoves(state, 1);

    expect(moves).toContainEqual({
      pieceId: state.light.pieces[0].id,
      fromIndex: 6,
      toIndex: 7,
    });
  });

  it('keeps the shared rosette protected when a custom capture mode explicitly enables safe rosettes', () => {
    const protectedCaptureConfig = buildGameModeMatchConfig({
      id: 'protected_capture',
      name: 'Protected Capture',
      description: 'Capture turns with a safe middle rosette.',
      baseRulesetPreset: 'custom',
      pieceCountPerSide: 7,
      rulesVariant: 'capture',
      rosetteSafetyMode: 'standard',
      exitStyle: 'standard',
      eliminationMode: 'return_to_start',
      fogOfWar: false,
      boardAssetKey: 'board_design',
    });
    const state = createInitialState(protectedCaptureConfig);
    state.currentTurn = 'light';
    setOnlyActivePiece(state, 'light', 0, 6);
    setOnlyActivePiece(state, 'dark', 0, 7);

    const moves = getValidMoves(state, 1);

    expect(moves).toEqual([]);
  });

  it('does not allow captures anywhere in Pure Luck', () => {
    const state = createInitialState(getMatchConfig('gameMode_1_piece'));
    state.currentTurn = 'light';
    setOnlyActivePiece(state, 'light', 0, 4);
    setOnlyActivePiece(state, 'dark', 0, 5);

    const moves = getValidMoves(state, 1);

    expect(moves).toEqual([]);
  });

  it('resolves Bell raw throw faces into historical move distances', () => {
    const bellConfig = {
      ...getMatchConfig('gameMode_finkel_rules'),
      baseRulesetPreset: 'rc_bell' as const,
      rosetteSafetyMode: 'open' as const,
      throwProfile: 'bell' as const,
      bonusTurnOnRosette: false,
      bonusTurnOnCapture: false,
    };
    const state = createInitialState(bellConfig);
    state.currentTurn = 'light';
    setOnlyActivePiece(state, 'light', 0, 0);

    expect(getValidMoves(state, 0)).toContainEqual({
      pieceId: state.light.pieces[0].id,
      fromIndex: 0,
      toIndex: 4,
    });
    expect(getValidMoves(state, 1)).toEqual([]);
  });
});
