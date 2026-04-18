import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { Image, StyleSheet } from 'react-native';
import { Piece, PIECE_ART_VISUAL_CENTER_OFFSET_Y_RATIO } from './Piece';
import { CosmeticThemeProvider } from '@/src/store/CosmeticThemeContext';
import { DEFAULT_DARK_PIECE_IMAGE_SOURCE } from '@/src/cosmetics/pieceAssets';

const getRenderedPieceArtTranslateY = (color: 'light' | 'dark') => {
  const { UNSAFE_getAllByType } = render(
    <Piece
      color={color}
      pixelSize={40}
      artScale={1.2}
    />,
  );
  const imageStyle = StyleSheet.flatten(UNSAFE_getAllByType(Image)[0].props.style) as {
    transform?: { translateY?: number }[];
  };

  return imageStyle.transform?.find((transform) => typeof transform.translateY === 'number')?.translateY;
};

describe('Piece', () => {
  it('uses the dark piece visual center for both light and dark artwork', () => {
    const expectedOffset = 40 * 1.2 * PIECE_ART_VISUAL_CENTER_OFFSET_Y_RATIO;

    expect(getRenderedPieceArtTranslateY('light')).toBeCloseTo(expectedOffset, 5);
    expect(getRenderedPieceArtTranslateY('dark')).toBeCloseTo(expectedOffset, 5);
  });

  it('keeps opponent pieces on the default art when a cosmetic player color is set', () => {
    render(
      <CosmeticThemeProvider
        theme={{
          pieces: {
            lightPieceImageUri: 'https://example.com/light-piece.png',
            darkPieceImageUri: 'https://example.com/dark-piece.png',
            reservePieceImageUri: 'https://example.com/reserve-piece.png',
          },
        }}
      >
        <Piece color="light" cosmeticPlayerColor="light" pixelSize={40} />
        <Piece color="dark" cosmeticPlayerColor="light" pixelSize={40} />
      </CosmeticThemeProvider>,
    );

    const images = screen.UNSAFE_getAllByType(Image);
    expect(images[0].props.source).toEqual({ uri: 'https://example.com/light-piece.png' });
    expect(images[1].props.source).toBe(DEFAULT_DARK_PIECE_IMAGE_SOURCE);
  });
});
