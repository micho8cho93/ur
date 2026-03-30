import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { Platform, StyleSheet } from 'react-native';
import { Dice } from './Dice';

const mockSlotDiceScene = jest.fn(
  ({
    playbackId,
    onSettled,
    rollValue,
    variant,
  }: {
    playbackId: number;
    onSettled?: () => void;
    rollValue: number | null;
    variant: string;
  }) => {
  const React = jest.requireActual('react');
  const { Text } = jest.requireActual('react-native');
  return <Text testID="mock-slot-dice-scene">{`${playbackId}:${variant}:${String(rollValue)}`}</Text>;
});

jest.mock('@/components/game/SlotDiceScene', () => ({
  SlotDiceScene: (props: {
    playbackId: number;
    onSettled?: () => void;
    rollValue: number | null;
    variant: string;
  }) => mockSlotDiceScene(props),
}));

describe('Dice', () => {
  beforeEach(() => {
    mockSlotDiceScene.mockClear();
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
    expect(mockSlotDiceScene).not.toHaveBeenCalled();
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
    expect(mockSlotDiceScene).not.toHaveBeenCalled();
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
    expect(mockSlotDiceScene).not.toHaveBeenCalled();
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

  it('forwards the settled callback to the visual scene', () => {
    const onResultShown = jest.fn();

    render(
      <Dice
        value={2}
        rolling={false}
        onRoll={jest.fn()}
        onResultShown={onResultShown}
        canRoll={false}
        mode="panel"
      />,
    );

    const latestCall = mockSlotDiceScene.mock.calls.at(-1)?.[0] as { onSettled?: () => void } | undefined;
    expect(latestCall?.onSettled).toBeDefined();

    latestCall?.onSettled?.();

    expect(onResultShown).toHaveBeenCalledTimes(1);
  });

  it('renders the settled status label when provided', () => {
    render(
      <Dice
        value={3}
        rolling={false}
        onRoll={jest.fn()}
        canRoll={false}
        mode="panel"
        showNumericResult={false}
        settledStatusLabel="No Move"
      />,
    );

    expect(screen.getByText('No Move')).toBeTruthy();
  });
});
