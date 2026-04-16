import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';

import type { CosmeticDefinition } from '@/shared/cosmetics';
import StoreScreen from '@/app/(game)/store';

const mockUseStore = jest.fn();
const mockUseWallet = jest.fn();
const mockGetFullCatalog = jest.fn();

jest.mock('expo-router', () => ({
  Stack: {
    Screen: () => null,
  },
}));

jest.mock('@/src/store/StoreProvider', () => ({
  useStore: () => mockUseStore(),
}));

jest.mock('@/src/wallet/useWallet', () => ({
  useWallet: () => mockUseWallet(),
}));

jest.mock('@/services/cosmetics', () => ({
  getFullCatalog: (...args: unknown[]) => mockGetFullCatalog(...args),
}));

jest.mock('@/components/ui/Button', () => ({
  Button: ({
    title,
    disabled,
    onPress,
  }: {
    title: string;
    disabled?: boolean;
    onPress?: () => void;
  }) => {
    const React = jest.requireActual('react');
    const { Pressable, Text } = jest.requireActual('react-native');

    return (
      <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress}>
        <Text>{title}</Text>
      </Pressable>
    );
  },
}));

jest.mock('@/components/CosmeticPreviewModal', () => ({
  CosmeticPreviewModal: ({
    visible,
    cosmetic,
    relatedCosmetics,
  }: {
    visible: boolean;
    cosmetic: CosmeticDefinition | null;
    relatedCosmetics?: CosmeticDefinition[];
  }) => {
    const React = jest.requireActual('react');
    const { Text, View } = jest.requireActual('react-native');

    return visible && cosmetic ? (
      <View testID="store-preview-modal">
        <Text testID="store-preview-name">{cosmetic.name}</Text>
        <Text testID="store-preview-related-count">{String(relatedCosmetics?.length ?? 0)}</Text>
      </View>
    ) : null;
  },
}));

const createCosmetic = (
  id: string,
  type: CosmeticDefinition['type'],
  name: string,
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

const featured = [
  createCosmetic('board_lapis_001', 'board', 'Lapis Board'),
  createCosmetic('pieces_gold_001', 'pieces', 'Gold Royal Pieces'),
];

const dailyRotation = [
  createCosmetic('dice_lapis_001', 'dice_animation', 'Lapis Comet Roll'),
  createCosmetic('emote_scribe_001', 'emote', "Scribe's Nod"),
];

describe('StoreScreen preview wiring', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetFullCatalog.mockResolvedValue({ items: [] });
    mockUseStore.mockReturnValue({
      storefront: {
        featured,
        dailyRotation,
        limitedTime: [],
        bundles: [],
        ownedIds: [],
        rotationExpiresAt: '2026-04-16T00:00:00.000Z',
      },
      softCurrency: 1000,
      loading: false,
      errorMessage: null,
      purchaseItem: jest.fn(),
      refresh: jest.fn(),
    });
    mockUseWallet.mockReturnValue({
      softCurrency: 1000,
    });
  });

  it('opens the preview modal from featured cards with section peers', async () => {
    render(<StoreScreen />);
    await waitFor(() => expect(mockGetFullCatalog).toHaveBeenCalled());

    fireEvent.press(screen.getAllByText('Preview')[0]);

    expect(screen.getByTestId('store-preview-modal')).toBeTruthy();
    expect(screen.getByTestId('store-preview-name').props.children).toBe('Lapis Board');
    expect(screen.getByTestId('store-preview-related-count').props.children).toBe('1');
  });

  it('opens the preview modal from daily cards with section peers', async () => {
    render(<StoreScreen />);
    await waitFor(() => expect(mockGetFullCatalog).toHaveBeenCalled());

    fireEvent.press(screen.getAllByText('Preview')[2]);

    expect(screen.getByTestId('store-preview-modal')).toBeTruthy();
    expect(screen.getByTestId('store-preview-name').props.children).toBe('Lapis Comet Roll');
    expect(screen.getByTestId('store-preview-related-count').props.children).toBe('1');
  });
});
