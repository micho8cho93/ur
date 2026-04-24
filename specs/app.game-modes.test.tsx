import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import * as ReactNative from 'react-native';

import GameModesScreen from '@/app/(game)/game-modes';

const mockBack = jest.fn();
const mockPush = jest.fn();
const mockGetPublicGameModes = jest.fn();
const mockUseAuth = jest.fn();

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

jest.mock('@/services/gameModes', () => ({
  getPublicGameModes: (...args: unknown[]) => mockGetPublicGameModes(...args),
}));

jest.mock('@/src/auth/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

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
    mockUseAuth.mockReturnValue({
      user: {
        id: 'user-1',
        username: 'Player',
        email: null,
        avatarUrl: null,
        provider: 'google',
        createdAt: '2026-03-30T10:00:00.000Z',
      },
    });
    mockGetPublicGameModes.mockResolvedValue({
      featuredMode: {
        id: 'moonlight_sprint',
        name: 'Moonlight Sprint',
        description: 'Seven pieces, fog of war, and a single-exit board.',
        baseRulesetPreset: 'custom',
        pieceCountPerSide: 7,
        rulesVariant: 'standard',
        rosetteSafetyMode: 'standard',
        exitStyle: 'single_exit',
        eliminationMode: 'return_to_start',
        fogOfWar: true,
        boardAssetKey: 'board_single_exit',
      },
      activeModes: [
        {
          id: 'moonlight_sprint',
          name: 'Moonlight Sprint',
          description: 'Seven pieces, fog of war, and a single-exit board.',
          baseRulesetPreset: 'custom',
          pieceCountPerSide: 7,
          rulesVariant: 'standard',
          rosetteSafetyMode: 'standard',
          exitStyle: 'single_exit',
          eliminationMode: 'return_to_start',
          fogOfWar: true,
          boardAssetKey: 'board_single_exit',
        },
        {
          id: 'ember_trial',
          name: 'Ember Trial',
          description: 'Capture-focused custom mode with an open rosette.',
          baseRulesetPreset: 'capture',
          pieceCountPerSide: 5,
          rulesVariant: 'capture',
          rosetteSafetyMode: 'open',
          exitStyle: 'standard',
          eliminationMode: 'eliminated',
          fogOfWar: false,
          boardAssetKey: 'board_design',
        },
      ],
    });
  });

  afterEach(() => {
    useWindowDimensionsSpy.mockRestore();
  });

  afterAll(() => {
    setPlatform(originalPlatform);
  });

  it('renders the fixed built-ins and backend-managed featured modes', async () => {
    const view = render(<GameModesScreen />);

    await waitFor(() => expect(view.getByText('Mode of the Month')).toBeTruthy());

    expect(view.getByText('Offline Games')).toBeTruthy();
    expect(view.getByText('Back')).toBeTruthy();
    expect(view.getByText('Race')).toBeTruthy();
    expect(view.getByText('Finkel Rules')).toBeTruthy();
    expect(view.getByText('PvP')).toBeTruthy();
    expect(view.queryByText('Capture')).toBeNull();
    expect(view.queryByText('Win XP')).toBeNull();
    expect(view.getByLabelText('Open economy details for Race')).toBeTruthy();
    expect(view.queryByLabelText('Open economy details for PvP')).toBeNull();
    expect(view.queryByLabelText('Open economy details for Moonlight Sprint')).toBeNull();
    expect(view.getByText('Moonlight Sprint')).toBeTruthy();
    expect(view.getByText('Seven pieces, fog of war, and a single-exit board.')).toBeTruthy();
    expect(view.queryByText('Ember Trial')).toBeNull();

    fireEvent.press(view.getByLabelText('Open economy details for Race'));
    expect(mockPush).not.toHaveBeenCalled();
    expect(view.getByText('Race Economy')).toBeTruthy();
    expect(view.getByText('This mode awards XP on a win.')).toBeTruthy();
    expect(view.getByText('XP on win')).toBeTruthy();
    expect(view.getAllByText('+20 XP').length).toBeGreaterThan(0);
    expect(view.queryByText('Coins on win')).toBeNull();
    expect(view.queryByText('Coins on loss')).toBeNull();
    expect(view.queryByText('Join cost')).toBeNull();
    expect(view.queryByText('Gems')).toBeNull();
    fireEvent.press(view.getByText('Close'));

    fireEvent.press(view.getByLabelText('Choose Race'));
    expect(mockPush).toHaveBeenCalledWith('/(game)/bot?modeId=gameMode_3_pieces');

    fireEvent.press(view.getByLabelText('Play featured mode Moonlight Sprint'));
    expect(mockPush).toHaveBeenCalledWith('/(game)/bot?modeId=moonlight_sprint');
  });

  it('hides inactive featured modes from the quick play catalog', async () => {
    mockGetPublicGameModes.mockResolvedValueOnce({
      featuredMode: {
        id: 'moonlight_sprint',
        name: 'Moonlight Sprint',
        description: 'Seven pieces, fog of war, and a single-exit board.',
        baseRulesetPreset: 'custom',
        pieceCountPerSide: 7,
        rulesVariant: 'standard',
        rosetteSafetyMode: 'standard',
        exitStyle: 'single_exit',
        eliminationMode: 'return_to_start',
        fogOfWar: true,
        boardAssetKey: 'board_single_exit',
      },
      activeModes: [
        {
          id: 'ember_trial',
          name: 'Ember Trial',
          description: 'Capture-focused custom mode with an open rosette.',
          baseRulesetPreset: 'capture',
          pieceCountPerSide: 5,
          rulesVariant: 'capture',
          rosetteSafetyMode: 'open',
          exitStyle: 'standard',
          eliminationMode: 'eliminated',
          fogOfWar: false,
          boardAssetKey: 'board_design',
        },
      ],
    });

    const view = render(<GameModesScreen />);

    await waitFor(() => expect(view.getByText('Mode of the Month')).toBeTruthy());

    expect(view.getByText('No active featured mode is currently configured.')).toBeTruthy();
    expect(view.queryByText('Moonlight Sprint')).toBeNull();
    expect(view.queryByText('Ember Trial')).toBeNull();
    expect(view.queryByLabelText('Play featured mode Moonlight Sprint')).toBeNull();
  });

  it('hides the transport-disabled warning for guest users', async () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: 'guest-1',
        username: 'Guest',
        email: null,
        avatarUrl: null,
        provider: 'guest',
        createdAt: '2026-03-30T10:00:00.000Z',
      },
    });
    mockGetPublicGameModes.mockRejectedValueOnce(
      new Error('Nakama transport is disabled. Set EXPO_PUBLIC_GAME_TRANSPORT=nakama to enable.'),
    );

    const view = render(<GameModesScreen />);

    await waitFor(() => expect(view.getByText('Mode of the Month')).toBeTruthy());

    expect(view.queryByText('Featured modes unavailable')).toBeNull();
    expect(view.queryByText('Nakama transport is disabled. Set EXPO_PUBLIC_GAME_TRANSPORT=nakama to enable.')).toBeNull();
    expect(view.getByText('No active featured mode is currently configured.')).toBeTruthy();
  });
});
