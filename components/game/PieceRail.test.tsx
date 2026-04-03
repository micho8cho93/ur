import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Platform, StyleSheet } from 'react-native';
import { getNewlyVisibleReserveSlotIndices, PieceRail } from './PieceRail';

const getTranslateY = (style: { transform?: { translateY?: number }[] }) =>
  style.transform?.find((transform) => 'translateY' in transform)?.translateY ?? 0;

describe('PieceRail', () => {
  const reactNative = jest.requireActual('react-native') as typeof import('react-native');
  let useWindowDimensionsSpy: jest.SpyInstance;

  beforeEach(() => {
    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      get: () => 'ios',
    });
    useWindowDimensionsSpy = jest.spyOn(reactNative, 'useWindowDimensions');
    useWindowDimensionsSpy.mockReturnValue({ width: 393, height: 852, scale: 3, fontScale: 1 });
  });

  afterEach(() => {
    useWindowDimensionsSpy.mockRestore();
  });

  it('detects newly visible reserve slots for both left-anchored and right-anchored trays', () => {
    expect(getNewlyVisibleReserveSlotIndices([0, 1, 2, 3, 4], [0, 1, 2, 3, 4, 5])).toEqual([5]);
    expect(getNewlyVisibleReserveSlotIndices([2, 3, 4, 5, 6], [1, 2, 3, 4, 5, 6])).toEqual([1]);
  });

  it('keeps horizontal reserve slot geometry stable when pieces are removed', () => {
    const view = render(
      <PieceRail
        color="light"
        piecePixelSize={40}
        reserveCount={7}
        totalCount={7}
      />,
    );

    const initialStackStyle = StyleSheet.flatten(screen.getByTestId('piece-rail-stack').props.style) as {
      paddingLeft?: number;
    };
    const initialSecondSlotStyle = StyleSheet.flatten(screen.getByTestId('piece-rail-slot-1').props.style) as {
      height: number;
      marginLeft?: number;
      width: number;
    };

    view.rerender(
      <PieceRail
        color="light"
        piecePixelSize={40}
        reserveCount={5}
        totalCount={7}
      />,
    );

    const nextStackStyle = StyleSheet.flatten(screen.getByTestId('piece-rail-stack').props.style) as {
      paddingLeft?: number;
    };
    const nextSecondSlotStyle = StyleSheet.flatten(screen.getByTestId('piece-rail-slot-1').props.style) as {
      height: number;
      marginLeft?: number;
      width: number;
    };

    expect(nextStackStyle.paddingLeft).toBe(initialStackStyle.paddingLeft);
    expect(nextSecondSlotStyle.marginLeft).toBe(initialSecondSlotStyle.marginLeft);
    expect(Math.abs(nextSecondSlotStyle.marginLeft ?? 0)).toBeLessThanOrEqual(6);
    expect(nextSecondSlotStyle.width).toBe(initialSecondSlotStyle.width);
    expect(nextSecondSlotStyle.height).toBe(initialSecondSlotStyle.height);
  });

  it('lifts the horizontal reserve stack into the tray interior', () => {
    render(
      <PieceRail
        color="light"
        piecePixelSize={40}
        reserveCount={7}
        totalCount={7}
      />,
    );

    const stackStyle = StyleSheet.flatten(screen.getByTestId('piece-rail-stack').props.style) as {
      justifyContent?: string;
      transform?: { translateY?: number }[];
    };

    expect(stackStyle.justifyContent).toBe('flex-start');
    expect(getTranslateY(stackStyle)).toBeLessThan(0);
  });

  it('anchors dark reserve pieces to the right edge without shifting the surviving slots', () => {
    const view = render(
      <PieceRail
        color="dark"
        piecePixelSize={40}
        reserveCount={7}
        totalCount={7}
      />,
    );

    const initialStackStyle = StyleSheet.flatten(screen.getByTestId('piece-rail-stack').props.style) as {
      paddingRight?: number;
      justifyContent?: string;
    };
    const initialRightSlotStyle = StyleSheet.flatten(screen.getByTestId('piece-rail-slot-6').props.style) as {
      height: number;
      marginLeft?: number;
      width: number;
    };

    view.rerender(
      <PieceRail
        color="dark"
        piecePixelSize={40}
        reserveCount={5}
        totalCount={7}
      />,
    );

    const nextStackStyle = StyleSheet.flatten(screen.getByTestId('piece-rail-stack').props.style) as {
      paddingRight?: number;
      justifyContent?: string;
    };
    const nextRightSlotStyle = StyleSheet.flatten(screen.getByTestId('piece-rail-slot-6').props.style) as {
      height: number;
      marginLeft?: number;
      width: number;
    };

    expect(initialStackStyle.justifyContent).toBe('flex-end');
    expect(nextStackStyle.justifyContent).toBe('flex-end');
    expect(nextStackStyle.paddingRight).toBe(initialStackStyle.paddingRight);
    expect(nextRightSlotStyle.marginLeft).toBe(initialRightSlotStyle.marginLeft);
    expect(nextRightSlotStyle.width).toBe(initialRightSlotStyle.width);
    expect(nextRightSlotStyle.height).toBe(initialRightSlotStyle.height);
  });

  it('pins the horizontal reserve stack to the tray well after layout and keeps overlap light', () => {
    render(
      <PieceRail
        color="light"
        piecePixelSize={40}
        reserveCount={7}
        totalCount={7}
      />,
    );

    fireEvent(screen.getByTestId('piece-rail-root'), 'layout', {
      nativeEvent: {
        layout: {
          width: 260,
          height: 163,
        },
      },
    });

    const stackStyle = StyleSheet.flatten(screen.getByTestId('piece-rail-stack').props.style) as {
      height?: number;
      justifyContent?: string;
      left?: number;
      position?: string;
      top?: number;
      width?: number;
    };
    const secondSlotStyle = StyleSheet.flatten(screen.getByTestId('piece-rail-slot-1').props.style) as {
      marginLeft?: number;
    };

    expect(stackStyle.position).toBe('absolute');
    expect(stackStyle.justifyContent).toBe('flex-start');
    expect(stackStyle.width).toBeGreaterThanOrEqual(220);
    expect(stackStyle.height).toBeGreaterThanOrEqual(40);
    expect(stackStyle.left).toBeLessThanOrEqual(0);
    expect(stackStyle.top).toBeGreaterThan(0);
    expect(Math.abs(secondSlotStyle.marginLeft ?? 0)).toBeLessThanOrEqual(4);
  });

  it('shrinks and nudges the mobile web vertical reserve stack to the right inside the tray', () => {
    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      get: () => 'web',
    });

    const view = render(
      <PieceRail
        color="light"
        orientation="vertical"
        piecePixelSize={40}
        reserveCount={7}
        totalCount={7}
      />,
    );

    const webStackStyle = StyleSheet.flatten(screen.getByTestId('piece-rail-stack').props.style) as {
      paddingLeft?: number;
    };
    const webSlotStyle = StyleSheet.flatten(screen.getByTestId('piece-rail-slot-0').props.style) as {
      height: number;
      width: number;
    };

    view.rerender(
      <PieceRail
        color="light"
        orientation="vertical"
        piecePixelSize={40}
        reserveCount={7}
        totalCount={7}
      />,
    );

    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      get: () => 'ios',
    });

    view.rerender(
      <PieceRail
        color="light"
        orientation="vertical"
        piecePixelSize={40}
        reserveCount={7}
        totalCount={7}
      />,
    );

    const nativeStackStyle = StyleSheet.flatten(screen.getByTestId('piece-rail-stack').props.style) as {
      paddingLeft?: number;
    };
    const nativeSlotStyle = StyleSheet.flatten(screen.getByTestId('piece-rail-slot-0').props.style) as {
      height: number;
      width: number;
    };

    expect(webStackStyle.paddingLeft).toBeGreaterThan(nativeStackStyle.paddingLeft ?? 0);
    expect(webSlotStyle.width).toBeLessThan(nativeSlotStyle.width);
    expect(webSlotStyle.height).toBeLessThan(nativeSlotStyle.height);
  });

  it('drops tray padding for the mobile web vertical stack when tray art is hidden', () => {
    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      get: () => 'web',
    });

    render(
      <PieceRail
        color="light"
        orientation="vertical"
        showTrayArt={false}
        piecePixelSize={40}
        reserveCount={7}
        totalCount={7}
      />,
    );

    const rootStyle = StyleSheet.flatten(screen.getByTestId('piece-rail-root').props.style) as {
      paddingBottom?: number;
      paddingTop?: number;
    };
    const stackStyle = StyleSheet.flatten(screen.getByTestId('piece-rail-stack').props.style) as {
      paddingVertical?: number;
    };

    expect(rootStyle.paddingTop).toBe(0);
    expect(rootStyle.paddingBottom).toBe(0);
    expect(stackStyle.paddingVertical).toBe(0);
  });
});
