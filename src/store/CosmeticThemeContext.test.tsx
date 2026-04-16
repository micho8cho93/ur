import { render, screen } from '@testing-library/react-native';
import React from 'react';
import { Text } from 'react-native';

import { DEFAULT_BOARD_IMAGE_SOURCE } from '@/src/cosmetics/boardAssets';
import { DEFAULT_MARKED_DIE_IMAGE_SOURCE } from '@/src/cosmetics/diceAssets';
import { DEFAULT_LIGHT_PIECE_IMAGE_SOURCE } from '@/src/cosmetics/pieceAssets';
import { DEFAULT_NORMAL_TILE_IMAGE_SOURCE } from '@/src/cosmetics/tileAssets';
import { CosmeticThemeProvider, useCosmeticTheme } from './CosmeticThemeContext';

const ThemeProbe = () => {
  const theme = useCosmeticTheme();

  return (
    <>
      <Text testID="board-source">{theme.boardImageSource === DEFAULT_BOARD_IMAGE_SOURCE ? 'default' : 'custom'}</Text>
      <Text testID="tile-source">{theme.tileImageSources.normal === DEFAULT_NORMAL_TILE_IMAGE_SOURCE ? 'default' : 'custom'}</Text>
      <Text testID="piece-source">{theme.pieceImageSources.light === DEFAULT_LIGHT_PIECE_IMAGE_SOURCE ? 'default' : 'custom'}</Text>
      <Text testID="dice-source">{theme.diceImageSources.marked === DEFAULT_MARKED_DIE_IMAGE_SOURCE ? 'default' : 'custom'}</Text>
      <Text testID="piece-override">{String(theme.hasPieceAssetOverride)}</Text>
      <Text testID="dice-override">{String(theme.hasDiceAssetOverride)}</Text>
      <Text testID="music-override">{String(theme.hasMusicAssetOverride)}</Text>
      <Text testID="sfx-override">{String(theme.hasSoundEffectAssetOverride)}</Text>
    </>
  );
};

describe('CosmeticThemeContext', () => {
  it('returns resolved defaults outside a provider', () => {
    render(<ThemeProbe />);

    expect(screen.getByTestId('board-source').props.children).toBe('default');
    expect(screen.getByTestId('tile-source').props.children).toBe('default');
    expect(screen.getByTestId('piece-source').props.children).toBe('default');
    expect(screen.getByTestId('dice-source').props.children).toBe('default');
    expect(screen.getByTestId('piece-override').props.children).toBe('false');
    expect(screen.getByTestId('dice-override').props.children).toBe('false');
    expect(screen.getByTestId('music-override').props.children).toBe('false');
    expect(screen.getByTestId('sfx-override').props.children).toBe('false');
  });

  it('merges provider overrides with defaults', () => {
    render(
      <CosmeticThemeProvider
        theme={{
          board: { normalTileAssetKey: 'board_lapis_001', imageAssetKey: 'board_lapis_001' },
          pieces: { lightPieceAssetKey: 'pieces_gold_001' },
          dice: { markedDieAssetKey: 'dice_lapis_001' },
          music: { trackAssetKey: 'music_procession_001' },
          soundEffects: { moveAssetKey: 'sfx_bronze_001' },
        }}
      >
        <ThemeProbe />
      </CosmeticThemeProvider>,
    );

    expect(screen.getByTestId('board-source').props.children).toBe('default');
    expect(screen.getByTestId('tile-source').props.children).toBe('default');
    expect(screen.getByTestId('piece-source').props.children).toBe('default');
    expect(screen.getByTestId('dice-source').props.children).toBe('default');
    expect(screen.getByTestId('piece-override').props.children).toBe('true');
    expect(screen.getByTestId('dice-override').props.children).toBe('true');
    expect(screen.getByTestId('music-override').props.children).toBe('true');
    expect(screen.getByTestId('sfx-override').props.children).toBe('true');
  });
});
