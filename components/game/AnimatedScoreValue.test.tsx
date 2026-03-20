import React from 'react';
import { render } from '@testing-library/react-native';
import { AnimatedScoreValue } from './AnimatedScoreValue';

describe('AnimatedScoreValue', () => {
  it('does not trigger the score animation on mount, unchanged values, or decreases', () => {
    const handleScoreIncrease = jest.fn();
    const { rerender } = render(
      <AnimatedScoreValue value={2} maxValue={7} onScoreIncrease={handleScoreIncrease} />,
    );

    rerender(<AnimatedScoreValue value={2} maxValue={7} onScoreIncrease={handleScoreIncrease} />);
    rerender(<AnimatedScoreValue value={1} maxValue={7} onScoreIncrease={handleScoreIncrease} />);

    expect(handleScoreIncrease).not.toHaveBeenCalled();
  });

  it('triggers the score animation exactly when the score increases', () => {
    const handleScoreIncrease = jest.fn();
    const { rerender } = render(
      <AnimatedScoreValue value={0} maxValue={7} onScoreIncrease={handleScoreIncrease} />,
    );

    rerender(<AnimatedScoreValue value={1} maxValue={7} onScoreIncrease={handleScoreIncrease} />);
    rerender(<AnimatedScoreValue value={1} maxValue={7} onScoreIncrease={handleScoreIncrease} />);
    rerender(<AnimatedScoreValue value={3} maxValue={7} onScoreIncrease={handleScoreIncrease} />);

    expect(handleScoreIncrease).toHaveBeenCalledTimes(2);
  });
});
