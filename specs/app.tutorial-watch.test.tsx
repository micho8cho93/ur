import React from 'react';
import { render, screen } from '@testing-library/react-native';
import WatchTutorialScreen from '@/app/tutorial/watch';

const mockReplace = jest.fn();

jest.mock('expo-router', () => ({
  Stack: {
    Screen: () => null,
  },
  useRouter: () => ({
    replace: mockReplace,
  }),
}));

describe('WatchTutorialScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('redirects legacy watch tutorial visits into the play tutorial flow', () => {
    render(<WatchTutorialScreen />);

    expect(screen.getByText('Loading the guided tutorial...')).toBeTruthy();
    expect(mockReplace).toHaveBeenCalledWith(expect.stringContaining('/match/local-'));
    expect(mockReplace).toHaveBeenCalledWith(expect.stringContaining('tutorial=playthrough'));
  });
});
