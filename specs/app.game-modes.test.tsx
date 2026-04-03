import { render } from '@testing-library/react-native';
import React from 'react';
import * as ReactNative from 'react-native';

import GameModesScreen from '@/app/(game)/game-modes';

const mockBack = jest.fn();
const mockPush = jest.fn();

const originalPlatform = ReactNative.Platform.OS;

const setPlatform = (platform: typeof ReactNative.Platform.OS) => {
  (ReactNative.Platform as { OS: typeof ReactNative.Platform.OS }).OS = platform;
};

jest.mock('expo-font', () => ({
  useFonts: () => [true],
}));

jest.mock('expo-router', () => ({
  Stack: {
    Screen: () => null,
  },
  useRouter: () => ({
    back: mockBack,
    push: mockPush,
  }),
}));

jest.mock('@expo/vector-icons/MaterialIcons', () => {
  const React = jest.requireActual('react');
  const { Text } = jest.requireActual('react-native');

  return function MockMaterialIcons(props: { name: string }) {
    return <Text>{props.name}</Text>;
  };
});

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  }),
}));

describe('GameModesScreen', () => {
  let useWindowDimensionsSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    setPlatform('web');
    useWindowDimensionsSpy = jest.spyOn(ReactNative, 'useWindowDimensions');
    useWindowDimensionsSpy.mockReturnValue({ width: 430, height: 932, scale: 1, fontScale: 1 });
  });

  afterEach(() => {
    useWindowDimensionsSpy.mockRestore();
  });

  afterAll(() => {
    setPlatform(originalPlatform);
  });

  it('renders the vertical compact layout on narrow mobile web', () => {
    const view = render(<GameModesScreen />);

    expect(view.getByText('Offline Games')).toBeTruthy();
    expect(view.getByText('Back')).toBeTruthy();
    expect(view.getByText('Race')).toBeTruthy();
    expect(view.getByText('Capture')).toBeTruthy();
    expect(view.getByText('Finkel Rules')).toBeTruthy();
    expect(view.getByText('PvP')).toBeTruthy();
  });
});
