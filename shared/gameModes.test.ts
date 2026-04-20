import {
  GAME_MODE_PRESET_BY_ID,
  GAME_MODE_PRESET_OPTIONS,
  isGameModeDefinition,
  getGameModePresetDefaults,
  isLegacyGameModeBaseRulesetPreset,
  normalizeGameModeBaseRulesetPreset,
} from '@/shared/gameModes';

describe('shared gameModes presets', () => {
  it('exposes only the requested six preset options', () => {
    expect(GAME_MODE_PRESET_OPTIONS.map((option) => option.id)).toEqual([
      'finkel_rules',
      'hjr_murray',
      'rc_bell',
      'masters',
      'skiryuk',
      'custom',
    ]);
    expect(Object.keys(GAME_MODE_PRESET_BY_ID).sort()).toEqual([
      'custom',
      'finkel_rules',
      'hjr_murray',
      'masters',
      'rc_bell',
      'skiryuk',
    ]);
  });

  it('normalizes legacy presets to custom defaults', () => {
    expect(isLegacyGameModeBaseRulesetPreset('capture')).toBe(true);
    expect(isLegacyGameModeBaseRulesetPreset('masters')).toBe(false);
    expect(normalizeGameModeBaseRulesetPreset('capture')).toBe('custom');
    expect(getGameModePresetDefaults('capture')).toEqual(
      expect.objectContaining({
        baseRulesetPreset: 'custom',
        pathVariant: 'default',
        throwProfile: 'standard',
      }),
    );
  });

  it('rejects malformed game mode enum values', () => {
    expect(
      isGameModeDefinition({
        id: 'custom_mode',
        name: 'Custom Mode',
        description: 'Broken mode',
        baseRulesetPreset: 'custom',
        pieceCountPerSide: 7,
        rulesVariant: 'experimental',
        rosetteSafetyMode: 'standard',
        exitStyle: 'standard',
        eliminationMode: 'return_to_start',
        fogOfWar: false,
        boardAssetKey: 'board_design',
      }),
    ).toBe(false);
  });
});
