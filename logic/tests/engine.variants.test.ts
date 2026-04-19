import { getMatchConfig } from '@/logic/matchConfigs';
import { applyMove, createInitialState, getValidMoves } from '@/logic/engine';
import { getPathLength } from '@/logic/pathVariants';
import { getGameModePresetDefaults } from '@/shared/gameModes';

describe('engine variants', () => {
  it('configures Pure Luck as a three-piece no-capture variant', () => {
    const pureLuckState = createInitialState(getMatchConfig('gameMode_1_piece'));

    expect(pureLuckState.matchConfig.modeId).toBe('gameMode_1_piece');
    expect(pureLuckState.matchConfig.rulesVariant).toBe('no-capture');
    expect(pureLuckState.light.pieces).toHaveLength(3);
    expect(pureLuckState.dark.pieces).toHaveLength(3);
  });

  it('creates Race matches with three pieces per side', () => {
    const threePieceState = createInitialState(getMatchConfig('gameMode_3_pieces'));

    expect(threePieceState.matchConfig.modeId).toBe('gameMode_3_pieces');
    expect(threePieceState.light.pieces).toHaveLength(3);
    expect(threePieceState.dark.pieces).toHaveLength(3);
  });

  it('supports the full-path variant without altering the default path', () => {
    const fullPathConfig = getMatchConfig('gameMode_full_path');
    const state = createInitialState(fullPathConfig);
    const fullPathLength = getPathLength(fullPathConfig.pathVariant);

    state.currentTurn = 'light';
    state.phase = 'moving';
    state.rollValue = 1;
    state.light.pieces[0].position = fullPathLength - 1;

    const moves = getValidMoves(state, 1);

    expect(moves).toContainEqual({
      pieceId: state.light.pieces[0].id,
      fromIndex: fullPathLength - 1,
      toIndex: fullPathLength,
    });

    const next = applyMove(state, moves[0]!);
    expect(next.light.finishedCount).toBe(1);
    expect(next.light.pieces[0].isFinished).toBe(true);
    expect(next.matchConfig.pathVariant).toBe('full-path');
  });

  it('keeps the default path for Finkel Rules while using seven pieces per side', () => {
    const finkelConfig = getMatchConfig('gameMode_finkel_rules');
    const state = createInitialState(finkelConfig);

    expect(state.matchConfig.modeId).toBe('gameMode_finkel_rules');
    expect(state.matchConfig.pathVariant).toBe('default');
    expect(state.light.pieces).toHaveLength(7);
    expect(state.dark.pieces).toHaveLength(7);
  });

  it('creates local PvP with seven pieces per side and no bot opponent', () => {
    const localPvPConfig = getMatchConfig('gameMode_pvp');
    const state = createInitialState(localPvPConfig);

    expect(state.matchConfig.modeId).toBe('gameMode_pvp');
    expect(state.matchConfig.rulesVariant).toBe('standard');
    expect(state.matchConfig.pathVariant).toBe('default');
    expect(state.matchConfig.opponentType).toBe('human');
    expect(state.light.pieces).toHaveLength(7);
    expect(state.dark.pieces).toHaveLength(7);
  });

  it('uses the default path with the Capture rules variant', () => {
    const captureConfig = getMatchConfig('gameMode_capture');
    const state = createInitialState(captureConfig);

    expect(state.matchConfig.modeId).toBe('gameMode_capture');
    expect(state.matchConfig.rulesVariant).toBe('capture');
    expect(state.matchConfig.pathVariant).toBe('default');
    expect(state.light.pieces).toHaveLength(5);
    expect(state.dark.pieces).toHaveLength(5);
  });

  it('maps the historical presets to the expected routes and throw profiles', () => {
    expect(getGameModePresetDefaults('finkel_rules')).toEqual(
      expect.objectContaining({
        rulesVariant: 'standard',
        pathVariant: 'default',
        throwProfile: 'standard',
        bonusTurnOnRosette: true,
        bonusTurnOnCapture: false,
      }),
    );
    expect(getGameModePresetDefaults('hjr_murray')).toEqual(
      expect.objectContaining({
        rulesVariant: 'standard',
        pathVariant: 'murray',
        throwProfile: 'standard',
        bonusTurnOnRosette: true,
        bonusTurnOnCapture: false,
      }),
    );
    expect(getGameModePresetDefaults('rc_bell')).toEqual(
      expect.objectContaining({
        rulesVariant: 'standard',
        pathVariant: 'default',
        throwProfile: 'bell',
        bonusTurnOnRosette: false,
        bonusTurnOnCapture: false,
      }),
    );
    expect(getGameModePresetDefaults('masters')).toEqual(
      expect.objectContaining({
        rulesVariant: 'standard',
        pathVariant: 'masters',
        throwProfile: 'masters',
        bonusTurnOnRosette: true,
        bonusTurnOnCapture: false,
      }),
    );
    expect(getGameModePresetDefaults('skiryuk')).toEqual(
      expect.objectContaining({
        rulesVariant: 'standard',
        pathVariant: 'skiryuk',
        throwProfile: 'standard',
        bonusTurnOnRosette: true,
        bonusTurnOnCapture: false,
      }),
    );
  });

  it('exposes the route lengths for the historical variants', () => {
    expect(getPathLength('default')).toBe(14);
    expect(getPathLength('masters')).toBe(16);
    expect(getPathLength('full-path')).toBe(16);
    expect(getPathLength('murray')).toBe(27);
    expect(getPathLength('skiryuk')).toBe(23);
  });
});
