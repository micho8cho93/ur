import { render, screen } from '@testing-library/react-native';
import React from 'react';
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
  it('shows the actual piece art without the board frame for piece cosmetics', () => {
    render(<BoardCosmeticPreview cosmetic={createCosmetic('pieces')} testID="preview-root" />);

    expect(screen.getByTestId('preview-root')).toBeTruthy();
    expect(screen.getByTestId('cosmetic-preview-piece')).toBeTruthy();
    expect(screen.getByTestId('cosmetic-preview-piece-light-image').props.source).toBe(mockLightPieceSource);
    expect(screen.getByTestId('cosmetic-preview-piece-dark-image').props.source).toBe(mockDarkPieceSource);
    expect(screen.queryByTestId('cosmetic-preview-board')).toBeNull();
  });

  it('keeps the board-scene preview for board cosmetics', () => {
    render(<BoardCosmeticPreview cosmetic={createCosmetic('board')} testID="preview-root" />);

    expect(screen.getByTestId('preview-root')).toBeTruthy();
    expect(screen.getByTestId('cosmetic-preview-board')).toBeTruthy();
    expect(screen.getByTestId('cosmetic-preview-board-image').props.source).toBe(mockBoardSource);
    expect(screen.queryByTestId('cosmetic-preview-piece')).toBeNull();
  });
});
