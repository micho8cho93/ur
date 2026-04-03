import React from 'react';
import * as ReactNative from 'react-native';
import { Platform, Text } from 'react-native';
import { render, screen } from '@testing-library/react-native';

import { Modal } from './Modal';

jest.mock('./Button', () => ({
  Button: ({ title, onPress }: { title: string; onPress?: () => void }) => {
    const React = jest.requireActual('react');
    const { Pressable, Text } = jest.requireActual('react-native');

    return (
      <Pressable onPress={onPress}>
        <Text>{title}</Text>
      </Pressable>
    );
  },
}));

describe('Modal', () => {
  let useWindowDimensionsSpy: jest.SpyInstance;

  beforeEach(() => {
    useWindowDimensionsSpy = jest.spyOn(ReactNative, 'useWindowDimensions');
    useWindowDimensionsSpy.mockReturnValue({ width: 1024, height: 768, scale: 1, fontScale: 1 });
    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      get: () => 'ios',
    });
  });

  afterEach(() => {
    useWindowDimensionsSpy.mockRestore();
  });

  it('wraps modal content in a scroll container for tall reward stacks on mobile web', () => {
    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      get: () => 'web',
    });
    useWindowDimensionsSpy.mockReturnValue({ width: 390, height: 844, scale: 1, fontScale: 1 });

    render(
      <Modal visible title="Tournament Champion" message="Result locked" actionLabel="Return" onAction={jest.fn()}>
        <Text>Long tournament reward content</Text>
      </Modal>,
    );

    expect(screen.getByTestId('shared-modal-sheet')).toBeTruthy();
    expect(screen.getByTestId('shared-modal-scroll')).toBeTruthy();
  });

  it('renders bullet copy as a dedicated list block', () => {
    render(
      <Modal
        visible
        title="Pure Luck"
        message={'This variant keeps the race short.\n\n• Each side plays with 3 pieces.\n• Captures are disabled everywhere.'}
        actionLabel="Close"
        onAction={jest.fn()}
      />,
    );

    expect(screen.getByTestId('shared-modal-bullet-list')).toBeTruthy();
    expect(screen.getByText('Each side plays with 3 pieces.')).toBeTruthy();
    expect(screen.getByText('Captures are disabled everywhere.')).toBeTruthy();
  });
});
