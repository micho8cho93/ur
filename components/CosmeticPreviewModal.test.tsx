import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { Pressable, Text } from 'react-native';

import type { CosmeticDefinition } from '@/shared/cosmetics';
import { CosmeticPreviewModal } from './CosmeticPreviewModal';

const mockAudioPlayer = {
  loop: false,
  volume: 1,
  play: jest.fn(),
  pause: jest.fn(),
  remove: jest.fn(),
};
const mockCreateAudioPlayer = jest.fn((_source: unknown, _options: unknown) => mockAudioPlayer);

jest.mock('expo-audio', () => ({
  createAudioPlayer: (source: unknown, options: unknown) => mockCreateAudioPlayer(source, options),
}));

jest.mock('@/components/game/Board', () => ({
  Board: ({ gameStateOverride }: { gameStateOverride: { light: { pieces: { position: number }[] } } }) => {
    const React = jest.requireActual('react');
    const { Text } = jest.requireActual('react-native');

    return (
      <Text testID="mock-preview-board">
        {gameStateOverride.light.pieces.map((piece) => piece.position).join(',')}
      </Text>
    );
  },
}));

jest.mock('@/components/game/Dice', () => ({
  Dice: ({ value, onRoll }: { value: number | null; onRoll: () => void }) => {
    const React = jest.requireActual('react');
    const { Pressable, Text } = jest.requireActual('react-native');

    return (
      <Pressable testID="mock-preview-dice-roll" onPress={onRoll}>
        <Text testID="mock-preview-dice-value">{String(value)}</Text>
      </Pressable>
    );
  },
}));

jest.mock('@/components/ui/Button', () => ({
  Button: ({
    title,
    disabled,
    onPress,
    testID,
  }: {
    title: string;
    disabled?: boolean;
    onPress?: () => void;
    testID?: string;
  }) => {
    const React = jest.requireActual('react');
    const { Pressable, Text } = jest.requireActual('react-native');

    return (
      <Pressable testID={testID} disabled={disabled} onPress={onPress}>
        <Text>{title}</Text>
        <Text testID={`${testID}-disabled`}>{String(Boolean(disabled))}</Text>
      </Pressable>
    );
  },
}));

const createCosmetic = (
  id: string,
  type: CosmeticDefinition['type'],
  name = id,
): CosmeticDefinition => ({
  id,
  name,
  tier: 'rare',
  type,
  price: { currency: 'soft', amount: 700 },
  rotationPools: ['daily'],
  rarityWeight: 1,
  releasedDate: '2026-04-15T00:00:00.000Z',
  assetKey: id,
});

const renderModal = (
  props: Partial<React.ComponentProps<typeof CosmeticPreviewModal>> = {},
) =>
  render(
    <CosmeticPreviewModal
      visible
      cosmetic={createCosmetic('board_lapis_001', 'board', 'Lapis Board')}
      onClose={jest.fn()}
      onBuy={jest.fn()}
      isOwned={false}
      {...props}
    />,
  );

describe('CosmeticPreviewModal', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it('renders a board preview for board and piece cosmetics', () => {
    const firstRender = renderModal();

    expect(screen.getByTestId('cosmetic-preview-board')).toBeTruthy();
    expect(screen.getByTestId('mock-preview-board').props.children).toBe('5,8,12,-1,-1,-1,-1');

    firstRender.unmount();

    renderModal({
      cosmetic: createCosmetic('pieces_gold_001', 'pieces', 'Gold Royal Pieces'),
    });

    expect(screen.getByTestId('cosmetic-preview-board')).toBeTruthy();
  });

  it('switches comparison chips without closing the modal', () => {
    renderModal({
      relatedCosmetics: [createCosmetic('board_gold_001', 'board', 'Gold Inlay Board')],
    });

    fireEvent.press(screen.getByTestId('cosmetic-preview-chip-board_gold_001'));

    expect(screen.getByTestId('cosmetic-preview-title').props.children).toBe('Gold Inlay Board');
    expect(screen.getByTestId('mock-preview-board')).toBeTruthy();
  });

  it('renders dice cosmetics and updates the local roll value', () => {
    jest
      .spyOn(Math, 'random')
      .mockReturnValueOnce(0.2)
      .mockReturnValueOnce(0.2)
      .mockReturnValueOnce(0.8);

    renderModal({
      cosmetic: createCosmetic('dice_lapis_001', 'dice_animation', 'Lapis Comet Roll'),
    });

    expect(screen.getByTestId('cosmetic-preview-dice')).toBeTruthy();

    fireEvent.press(screen.getByTestId('mock-preview-dice-roll'));

    expect(screen.getByTestId('mock-preview-dice-value').props.children).toBe('4');
  });

  it('renders the emote placeholder for emote cosmetics', () => {
    renderModal({
      cosmetic: createCosmetic('emote_scribe_001', 'emote', "Scribe's Nod"),
    });

    expect(screen.getByTestId('cosmetic-preview-emote')).toBeTruthy();
    expect(screen.getByText('Emote preview coming soon')).toBeTruthy();
  });

  it('previews music and sound effect cosmetics through audio assets', () => {
    renderModal({
      cosmetic: createCosmetic('music_procession_001', 'music', 'Royal Procession Theme'),
    });

    expect(screen.getByTestId('cosmetic-preview-music')).toBeTruthy();
    fireEvent.press(screen.getByText('Play'));

    expect(mockCreateAudioPlayer).toHaveBeenCalled();
    expect(mockAudioPlayer.play).toHaveBeenCalled();

    renderModal({
      cosmetic: createCosmetic('sfx_bronze_001', 'sound_effect', 'Bronze Court Sounds'),
    });

    expect(screen.getByTestId('cosmetic-preview-sound-effect')).toBeTruthy();
    fireEvent.press(screen.getByText('Move'));

    expect(mockCreateAudioPlayer).toHaveBeenCalled();
  });

  it('calls onBuy for unowned cosmetics and disables the owned action', () => {
    const onBuy = jest.fn();
    const cosmetic = createCosmetic('board_lapis_001', 'board', 'Lapis Board');

    renderModal({ cosmetic, onBuy });
    fireEvent.press(screen.getByTestId('cosmetic-preview-buy'));

    expect(onBuy).toHaveBeenCalledWith(cosmetic);

    renderModal({ cosmetic, isOwned: true });

    expect(screen.getAllByTestId('cosmetic-preview-buy-disabled').at(-1)?.props.children).toBe('true');
  });
});
