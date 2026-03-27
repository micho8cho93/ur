import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { AudioSettingsModal } from './AudioSettingsModal';

const baseProps = {
  visible: true,
  announcementCuesEnabled: true,
  musicEnabled: true,
  musicVolume: 1,
  sfxEnabled: true,
  sfxVolume: 1,
  diceAnimationEnabled: true,
  diceAnimationSpeed: 1 as const,
  bugAnimationEnabled: true,
  autoRollEnabled: true,
  moveHintEnabled: true,
  timerEnabled: true,
  timerDurationSeconds: 20 as const,
  onClose: jest.fn(),
  onToggleAnnouncementCues: jest.fn(),
  onToggleMusic: jest.fn(),
  onSetMusicVolume: jest.fn(),
  onToggleSfx: jest.fn(),
  onSetSfxVolume: jest.fn(),
  onToggleDiceAnimation: jest.fn(),
  onSetDiceAnimationSpeed: jest.fn(),
  onToggleBugAnimation: jest.fn(),
  onToggleAutoRoll: jest.fn(),
  onToggleMoveHint: jest.fn(),
  onSetTimerDuration: jest.fn(),
  onToggleTimer: jest.fn(),
};

describe('AudioSettingsModal', () => {
  it('hides the timer-length picker when requested for online play', () => {
    render(
      <AudioSettingsModal
        {...baseProps}
        showTimerToggle={false}
        showTimerDurationPicker={false}
      />,
    );

    expect(screen.queryByText('Turn Timer Length')).toBeNull();
    expect(screen.queryByText('Turn Timer')).toBeNull();
  });

  it('shows offline timer controls when both timer flags are enabled', () => {
    render(
      <AudioSettingsModal
        {...baseProps}
        showTimerToggle
        showTimerDurationPicker
      />,
    );

    expect(screen.getByText('Turn Timer')).toBeTruthy();
    expect(screen.getByText('Turn Timer Length')).toBeTruthy();
  });
});
