import { act, render, screen } from '@testing-library/react-native';
import React from 'react';
import { Platform } from 'react-native';

import { CinematicXpRewardModal } from './CinematicXpRewardModal';

describe('CinematicXpRewardModal', () => {
  const platformDescriptor = Object.getOwnPropertyDescriptor(Platform, 'OS');

  beforeEach(() => {
    jest.useFakeTimers();
    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      get: () => 'web',
    });
  });

  afterEach(() => {
    jest.useRealTimers();

    if (platformDescriptor) {
      Object.defineProperty(Platform, 'OS', platformDescriptor);
    }
  });

  it('animates to the final XP total and completes automatically', () => {
    const onComplete = jest.fn();

    render(
      <CinematicXpRewardModal
        visible
        previousTotalXp={500}
        newTotalXp={660}
        onComplete={onComplete}
      />,
    );

    expect(screen.getByTestId('cinematic-xp-modal')).toBeTruthy();
    expect(screen.getByText('XP Unleashed')).toBeTruthy();

    act(() => {
      jest.advanceTimersByTime(5_000);
    });

    expect(screen.getByText('500 -> 660 total XP')).toBeTruthy();
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('shows the title-advance state when the reveal crosses a rank threshold', () => {
    render(
      <CinematicXpRewardModal
        visible
        previousTotalXp={90}
        newTotalXp={120}
        onComplete={() => undefined}
      />,
    );

    act(() => {
      jest.advanceTimersByTime(4_000);
    });

    expect(screen.getByText('Title advanced')).toBeTruthy();
    expect(screen.getByText('Servant of the Temple')).toBeTruthy();
  });
});
