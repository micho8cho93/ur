import React from 'react';
import { StyleSheet } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { GameStageHUD } from './GameStageHUD';

jest.mock('expo-font', () => ({
  useFonts: () => [true],
}));

jest.mock('@/components/timer/HourglassTimer', () => {
  const { Text: MockText } = require('react-native');
  return {
    HourglassTimer: () => <MockText testID="mock-hourglass">hourglass</MockText>,
  };
});

describe('GameStageHUD', () => {
  it('renders the countdown without a trailing seconds suffix', () => {
    render(
      <GameStageHUD
        isMyTurn
        canRoll
        layout="inline"
        phase="rolling"
        timerDurationMs={10_000}
        timerRemainingMs={9_000}
      />,
    );

    expect(screen.getByTestId('game-stage-hud-countdown').props.children).toBe(9);
    expect(screen.queryByText('9s')).toBeNull();
  });

  it('keeps a fixed countdown slot width as the visible digit changes', () => {
    const { rerender } = render(
      <GameStageHUD
        isMyTurn
        canRoll
        layout="inline"
        phase="rolling"
        timerDurationMs={10_000}
        timerRemainingMs={9_000}
      />,
    );

    const initialWidth = StyleSheet.flatten(screen.getByTestId('game-stage-hud-countdown-slot').props.style)?.width;

    rerender(
      <GameStageHUD
        isMyTurn
        canRoll
        layout="inline"
        phase="rolling"
        timerDurationMs={10_000}
        timerRemainingMs={1_000}
      />,
    );

    const nextWidth = StyleSheet.flatten(screen.getByTestId('game-stage-hud-countdown-slot').props.style)?.width;
    expect(initialWidth).toBe(nextWidth);
  });
});
