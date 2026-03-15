import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { FiveStepTutorialModal } from './FiveStepTutorialModal';

jest.mock('@/components/tutorial/HowToPlayBoardPreview', () => ({
  HowToPlayBoardPreview: ({ previewId }: { previewId: string }) => {
    const React = jest.requireActual('react');
    const { Text, View } = jest.requireActual('react-native');
    return (
      <View testID={`mock-preview-${previewId}`}>
        <Text>{previewId}</Text>
      </View>
    );
  },
}));

jest.mock('@/components/ui/Button', () => ({
  Button: ({ title, onPress, disabled }: { title: string; onPress?: () => void; disabled?: boolean }) => {
    const React = jest.requireActual('react');
    const { Text, TouchableOpacity } = jest.requireActual('react-native');
    return (
      <TouchableOpacity accessibilityState={{ disabled }} disabled={disabled} onPress={onPress}>
        <Text>{title}</Text>
      </TouchableOpacity>
    );
  },
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}));

describe('FiveStepTutorialModal', () => {
  it('renders the first step by default', () => {
    const view = render(<FiveStepTutorialModal visible onClose={jest.fn()} />);

    expect(view.getByText('Step 1 of 5')).toBeTruthy();
    expect(view.getByText('Goal')).toBeTruthy();
    expect(view.getByTestId('mock-preview-goal')).toBeTruthy();
    expect(view.queryByTestId('tutorial-dot-1')).toBeNull();
    expect(view.getByTestId('tutorial-dot-active')).toBeTruthy();
  });

  it('moves forward and backward through the steps', () => {
    const view = render(<FiveStepTutorialModal visible onClose={jest.fn()} />);

    fireEvent.press(view.getByText('Next'));
    expect(view.getByText('Step 2 of 5')).toBeTruthy();
    expect(view.getByText('Taking a turn')).toBeTruthy();
    expect(view.getByTestId('mock-preview-takingTurn')).toBeTruthy();
    expect(view.getByTestId('tutorial-dot-1')).toBeTruthy();

    fireEvent.press(view.getByText('Back'));
    expect(view.getByText('Step 1 of 5')).toBeTruthy();
    expect(view.getByText('Goal')).toBeTruthy();
  });

  it('resets back to the first page when reopened', () => {
    const onClose = jest.fn();
    const view = render(<FiveStepTutorialModal visible onClose={onClose} />);

    fireEvent.press(view.getByText('Next'));
    expect(view.getByText('Step 2 of 5')).toBeTruthy();

    view.rerender(<FiveStepTutorialModal visible={false} onClose={onClose} />);
    view.rerender(<FiveStepTutorialModal visible onClose={onClose} />);

    expect(view.getByText('Step 1 of 5')).toBeTruthy();
    expect(view.getByText('Goal')).toBeTruthy();
  });
});
