import { HOW_TO_PLAY_STEPS } from './howToPlayFiveStep';

describe('HOW_TO_PLAY_STEPS', () => {
  it('defines exactly five ordered tutorial pages', () => {
    expect(HOW_TO_PLAY_STEPS.map((step) => step.heading)).toEqual([
      'Goal',
      'Taking a turn',
      'Legal moves',
      'Captures',
      'Safe squares + strategy tips',
    ]);
  });

  it('keeps safe squares and strategy tips together on the final page', () => {
    const finalStep = HOW_TO_PLAY_STEPS[HOW_TO_PLAY_STEPS.length - 1];

    expect(HOW_TO_PLAY_STEPS).toHaveLength(5);
    expect(finalStep.items.some((item) => item.toLowerCase().includes('rosette'))).toBe(true);
    expect(finalStep.items.some((item) => item.toLowerCase().includes('prioritize'))).toBe(true);
  });
});
