import React from 'react';
import { render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { Tile } from './Tile';

jest.mock('./Piece', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    Piece: () => <View testID="mock-piece" />,
  };
});

const getPressableStyle = (
  pressable: { props: { style: unknown } },
  pressed = false,
) => {
  const style =
    typeof pressable.props.style === 'function'
      ? pressable.props.style({ pressed })
      : pressable.props.style;

  return StyleSheet.flatten(style);
};

describe('Tile', () => {
  it('keeps transparent board hitboxes invisible and non-clipping', () => {
    const { getByTestId } = render(
      <Tile
        row={2}
        col={3}
        cellSize={80}
        skin="transparent"
        isSelectedPiece
        isValidTarget
        piece={{ id: 'light-0', color: 'light' }}
      />,
    );

    const style = getPressableStyle(getByTestId('tile-touchable-2-3'));

    expect(style.backgroundColor).toBe('transparent');
    expect(style.borderColor).toBe('transparent');
    expect(style.borderWidth).toBe(0);
    expect(style.overflow).toBe('visible');
    expect(style.boxShadow).toBeUndefined();
    expect(style.elevation).toBeUndefined();
  });

  it('keeps default tiles visually surfaced', () => {
    const { getByTestId } = render(<Tile row={2} col={3} cellSize={80} isValidTarget />);

    const style = getPressableStyle(getByTestId('tile-touchable-2-3'));

    expect(style.overflow).toBe('hidden');
    expect(style.boxShadow).toBeTruthy();
  });
});
