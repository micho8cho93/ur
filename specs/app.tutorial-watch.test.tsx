import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import WatchTutorialScreen from '@/app/tutorial/watch';

jest.mock('@/components/HowToPlayModal', () => {
  const React = jest.requireActual('react');
  const { View } = jest.requireActual('react-native');
  const MockLegacyHowToPlayModal = ({ visible }: { visible: boolean }) =>
    visible ? <View testID="legacy-how-to-play" /> : null;

  MockLegacyHowToPlayModal.displayName = 'MockLegacyHowToPlayModal';

  return {
    HowToPlayModal: MockLegacyHowToPlayModal,
  };
});

jest.mock('@/components/game/Board', () => {
  const React = jest.requireActual('react');
  const { View } = jest.requireActual('react-native');
  return {
    Board: () => <View testID="mock-board" />,
    getBoardPiecePixelSize: () => 28,
  };
});

jest.mock('@/components/game/Dice', () => {
  const React = jest.requireActual('react');
  const { View } = jest.requireActual('react-native');
  return {
    Dice: () => <View testID="mock-dice" />,
  };
});

jest.mock('@/components/game/EdgeScore', () => {
  const React = jest.requireActual('react');
  const { View } = jest.requireActual('react-native');
  return {
    EdgeScore: () => <View testID="mock-edge-score" />,
  };
});

jest.mock('@/components/game/GameStageHUD', () => {
  const React = jest.requireActual('react');
  const { View } = jest.requireActual('react-native');
  return {
    GameStageHUD: () => <View testID="mock-stage-hud" />,
  };
});

jest.mock('@/components/game/PieceRail', () => {
  const React = jest.requireActual('react');
  const { View } = jest.requireActual('react-native');
  return {
    PieceRail: () => <View testID="mock-piece-rail" />,
  };
});

jest.mock('@/components/tutorial/TutorialControls', () => {
  const React = jest.requireActual('react');
  const { View } = jest.requireActual('react-native');
  return {
    TutorialControls: () => <View testID="mock-tutorial-controls" />,
  };
});

jest.mock('@/components/tutorial/TutorialModal', () => {
  const React = jest.requireActual('react');
  const { View } = jest.requireActual('react-native');
  return {
    TutorialModal: () => <View testID="mock-tutorial-modal" />,
  };
});

jest.mock('@/components/ui/Button', () => ({
  Button: ({ title, onPress }: { title: string; onPress?: () => void }) => {
    const React = jest.requireActual('react');
    const { Text, TouchableOpacity } = jest.requireActual('react-native');
    return (
      <TouchableOpacity onPress={onPress}>
        <Text>{title}</Text>
      </TouchableOpacity>
    );
  },
}));

jest.mock('expo-router', () => ({
  Stack: {
    Screen: () => null,
  },
  useRouter: () => ({
    replace: jest.fn(),
  }),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  }),
}));

jest.mock('@expo/vector-icons/MaterialIcons', () => {
  const React = jest.requireActual('react');
  const { Text } = jest.requireActual('react-native');
  const MockMaterialIcons = ({ name }: { name: string }) => <Text>{name}</Text>;

  MockMaterialIcons.displayName = 'MockMaterialIcons';

  return MockMaterialIcons;
});

describe('WatchTutorialScreen', () => {
  it('keeps using the legacy how-to-play modal for the Help button', () => {
    render(<WatchTutorialScreen />);

    fireEvent.press(screen.getByText('Help'));

    expect(screen.getByTestId('legacy-how-to-play')).toBeTruthy();
  });
});
