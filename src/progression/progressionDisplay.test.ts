import {
  PROGRESSION_DISPLAY_RANKS,
  buildDisplayedProgressionSnapshot,
  formatProgressionXp,
  getProgressionDisplayTitle,
} from './progressionDisplay';

describe('progression display helpers', () => {
  it('maps backend rank titles to the requested display titles', () => {
    expect(getProgressionDisplayTitle('Royalty')).toBe('King');
    expect(getProgressionDisplayTitle('Laborer')).toBe('Laborer');
    expect(getProgressionDisplayTitle(null)).toBeNull();
  });

  it('exposes the full display ladder with the king title', () => {
    expect(PROGRESSION_DISPLAY_RANKS).toHaveLength(15);
    expect(PROGRESSION_DISPLAY_RANKS[11]).toMatchObject({
      index: 12,
      displayTitle: 'King',
      threshold: 13175,
    });
  });

  it('builds a display-ready snapshot using mapped titles', () => {
    expect(buildDisplayedProgressionSnapshot(13175)).toMatchObject({
      totalXp: 13175,
      currentRank: 'King',
      nextRank: 'High Priest',
    });
  });

  it('formats xp values for the ui', () => {
    expect(formatProgressionXp(28175)).toBe('28,175');
  });
});
