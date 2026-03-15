import React from 'react';
import { render, screen } from '@testing-library/react-native';

const mockDiceRollScene = jest.fn(({ playbackId, variant }: { playbackId: number; variant: string }) => {
  const { Text } = require('react-native');
  return <Text testID="mock-dice-roll-scene">{`${playbackId}:${variant}`}</Text>;
});

jest.mock('@/components/3d/DiceRollScene', () => ({
  DiceRollScene: (props: { playbackId: number; variant: string }) => mockDiceRollScene(props),
}));

import { Dice } from './Dice';

describe('Dice', () => {
  beforeEach(() => {
    mockDiceRollScene.mockClear();
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
});
