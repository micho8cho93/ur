import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { Platform, StyleSheet } from 'react-native';
import { Dice } from './Dice';

const mockDiceRollScene = jest.fn(({ playbackId, variant }: { playbackId: number; variant: string }) => {
  const React = jest.requireActual('react');
  const { Text } = jest.requireActual('react-native');
  return <Text testID="mock-dice-roll-scene">{`${playbackId}:${variant}`}</Text>;
});

jest.mock('@/components/3d/DiceRollScene', () => ({
  DiceRollScene: (props: { playbackId: number; variant: string }) => mockDiceRollScene(props),
}));

describe('Dice', () => {
  beforeEach(() => {
    mockDiceRollScene.mockClear();
    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      get: () => 'ios',
    });
  });

  it('does not mount the inline scene while the external match stage is active', () => {
    render(
      <Dice
        value={null}
        rolling
        onRoll={jest.fn()}
        canRoll={false}
        mode="stage"
        compact
        visualPlacement="external"
      />,
    );

    expect(screen.queryByTestId('dice-roll-scene-host')).toBeNull();
    expect(mockDiceRollScene).not.toHaveBeenCalled();
  });

  it('hides the embedded scene when visuals are disabled', () => {
    render(
      <Dice
        value={2}
        rolling={false}
        onRoll={jest.fn()}
        canRoll={false}
        mode="stage"
        compact
        showVisual={false}
      />,
    );

    expect(screen.queryByTestId('dice-roll-scene-host')).toBeNull();
    expect(mockDiceRollScene).not.toHaveBeenCalled();
  });

  it('uses the roll button art for the web stage control', () => {
    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      get: () => 'web',
    });

    render(
      <Dice
        value={null}
        rolling={false}
        onRoll={jest.fn()}
        canRoll
        mode="stage"
        showVisual={false}
      />,
    );

    expect(screen.getByTestId('dice-roll-art')).toBeTruthy();
    expect(screen.queryByTestId('dice-roll-scene-host')).toBeNull();
    expect(mockDiceRollScene).not.toHaveBeenCalled();
  });

  it('renders the roll button in a sunk state when latched', () => {
    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      get: () => 'web',
    });

    render(
      <Dice
        value={null}
        rolling={false}
        onRoll={jest.fn()}
        canRoll
        pressedIn
        mode="stage"
        showVisual={false}
      />,
    );

    const shellStyle = StyleSheet.flatten(screen.getByTestId('dice-roll-button-shell').props.style);
    const translateY = shellStyle.transform.find(
      (transform: { translateY?: number }) => typeof transform.translateY === 'number',
    )?.translateY;

    expect(translateY).toBeGreaterThan(0);
  });
});
