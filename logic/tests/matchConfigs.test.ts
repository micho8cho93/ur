import {
  GAME_MODE_CONFIGS,
  MATCH_MODE_SELECTION_OPTIONS,
  PRIVATE_MATCH_OPTIONS,
  getMatchConfig,
} from '@/logic/matchConfigs';

describe('matchConfigs', () => {
  it('includes local PvP in offline game modes', () => {
    expect(GAME_MODE_CONFIGS.map((config) => config.modeId)).toContain('gameMode_pvp');
    expect(getMatchConfig('gameMode_pvp').displayName).toBe('PvP');
  });

  it('excludes Quick Play and local PvP from private match options', () => {
    expect(PRIVATE_MATCH_OPTIONS.map((option) => option.modeId)).not.toContain('standard');
    expect(PRIVATE_MATCH_OPTIONS.map((option) => option.modeId)).not.toContain('gameMode_pvp');
  });

  it('omits retired Pure Luck and Extended Path modes from selectable UI lists', () => {
    expect(GAME_MODE_CONFIGS.map((config) => config.modeId)).not.toContain('gameMode_1_piece');
    expect(GAME_MODE_CONFIGS.map((config) => config.modeId)).not.toContain('gameMode_full_path');
    expect(MATCH_MODE_SELECTION_OPTIONS.map((option) => option.modeId)).not.toContain('gameMode_1_piece');
    expect(MATCH_MODE_SELECTION_OPTIONS.map((option) => option.modeId)).not.toContain('gameMode_full_path');
    expect(PRIVATE_MATCH_OPTIONS.map((option) => option.modeId)).not.toContain('gameMode_1_piece');
    expect(PRIVATE_MATCH_OPTIONS.map((option) => option.modeId)).not.toContain('gameMode_full_path');
  });
});
