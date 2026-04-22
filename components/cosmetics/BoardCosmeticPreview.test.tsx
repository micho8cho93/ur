import { render, screen } from '@testing-library/react-native';
import React from 'react';
import { StyleSheet } from 'react-native';

import type { CosmeticDefinition } from '@/shared/cosmetics';
import { BoardCosmeticPreview } from './BoardCosmeticPreview';

const mockBoardSource = { uri: 'board-preview' };
const mockLightPieceSource = { uri: 'piece-light-preview' };
const mockDarkPieceSource = { uri: 'piece-dark-preview' };

jest.mock('@/src/store/CosmeticThemeContext', () => ({
  useCosmeticTheme: () => ({
    boardImageSource: mockBoardSource,
    pieceImageSources: {
      light: mockLightPieceSource,
      dark: mockDarkPieceSource,
      reserveLight: mockLightPieceSource,
      reserveDark: mockDarkPieceSource,
    },
  }),
}));

const createCosmetic = (type: CosmeticDefinition['type']): CosmeticDefinition => ({
  id: `${type}_test`,
  name: `${type} test`,
  tier: 'rare',
  type,
  price: { currency: 'soft', amount: 100 },
  rotationPools: ['daily'],
  rarityWeight: 1,
  releasedDate: '2026-04-15T00:00:00.000Z',
  assetKey: `${type}_test`,
});

describe('BoardCosmeticPreview', () => {
  it('shows the standalone piece artwork for piece cosmetics', () => {
    render(<BoardCosmeticPreview cosmetic={createCosmetic('pieces')} testID="preview-root" />);

    expect(screen.getByTestId('preview-root')).toBeTruthy();
    expect(screen.getByTestId('cosmetic-preview-piece')).toBeTruthy();
    expect(screen.getByTestId('cosmetic-preview-piece-light-image').props.source).toBe(mockLightPieceSource);
    expect(screen.queryByTestId('cosmetic-preview-board-image')).toBeNull();
  });

  it('renders the board scene at half width and keeps pieces overlaid on the board', () => {
    render(<BoardCosmeticPreview cosmetic={createCosmetic('board')} testID="preview-root" />);

    expect(screen.getByTestId('preview-root')).toBeTruthy();
    expect(screen.getByTestId('cosmetic-preview-board-image').props.source).toBe(mockBoardSource);

    const sceneStyle = StyleSheet.flatten(screen.getByTestId('cosmetic-preview-board-scene').props.style);
    expect(sceneStyle.width).toBe('50%');

    const topPieceStyle = StyleSheet.flatten(screen.getByTestId('cosmetic-preview-board-piece-top').props.style);
    const centerPieceStyle = StyleSheet.flatten(screen.getByTestId('cosmetic-preview-board-piece-center').props.style);
    const bottomPieceStyle = StyleSheet.flatten(screen.getByTestId('cosmetic-preview-board-piece-bottom').props.style);

    expect(topPieceStyle.width).toBe('9%');
    expect(topPieceStyle.top).toBe('15%');
    expect(topPieceStyle.left).toBe('44%');
    expect(centerPieceStyle.top).toBe('48%');
    expect(centerPieceStyle.left).toBe('49%');
    expect(bottomPieceStyle.top).toBe('71%');
    expect(bottomPieceStyle.left).toBe('39%');
  });
});
