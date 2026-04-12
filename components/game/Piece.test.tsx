import React from 'react';
import { render } from '@testing-library/react-native';
import { Image, StyleSheet } from 'react-native';
import { Piece, PIECE_ART_VISUAL_CENTER_OFFSET_Y_RATIO } from './Piece';

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
});
