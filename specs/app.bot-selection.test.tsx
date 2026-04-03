import { render } from '@testing-library/react-native';
import React from 'react';
import * as ReactNative from 'react-native';

import BotSelection from '@/app/(game)/bot';

const mockBack = jest.fn();
const mockUseLocalSearchParams = jest.fn();
const mockUseMatchmaking = jest.fn();

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
  useLocalSearchParams: () => mockUseLocalSearchParams(),
  useRouter: () => ({
    back: mockBack,
  }),
}));

jest.mock('@/hooks/useMatchmaking', () => ({
  useMatchmaking: (...args: unknown[]) => mockUseMatchmaking(...args),
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

describe('BotSelection', () => {
  let useWindowDimensionsSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    setPlatform('web');
    useWindowDimensionsSpy = jest.spyOn(ReactNative, 'useWindowDimensions');
    useWindowDimensionsSpy.mockReturnValue({ width: 430, height: 932, scale: 1, fontScale: 1 });
    mockUseLocalSearchParams.mockReturnValue({ modeId: 'gameMode_finkel_rules' });
    mockUseMatchmaking.mockReturnValue({
      startBotGame: jest.fn(),
      startOfflineMatch: jest.fn(),
    });
  });

  afterEach(() => {
    useWindowDimensionsSpy.mockRestore();
  });

  afterAll(() => {
    setPlatform(originalPlatform);
  });

  it('renders the vertical compact layout on narrow mobile web', () => {
    const view = render(<BotSelection />);

    expect(view.getByText('Finkel Rules Difficulty')).toBeTruthy();
    expect(view.getByText('Back')).toBeTruthy();
    expect(view.getByText('Easy')).toBeTruthy();
    expect(view.getByText('Medium')).toBeTruthy();
    expect(view.getByText('Hard')).toBeTruthy();
    expect(view.getByText('Perfect')).toBeTruthy();
  });
});
