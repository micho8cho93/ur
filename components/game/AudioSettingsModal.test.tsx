import React from 'react';
import * as ReactNative from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { Platform } from 'react-native';
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
    expect(screen.getByText('10s')).toBeTruthy();
    expect(screen.getAllByText('20s').length).toBeGreaterThan(0);
    expect(screen.queryByText('30s')).toBeNull();
  });

  it('tightens the sheet padding on compact mobile web viewports', () => {
    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      get: () => 'web',
    });
    useWindowDimensionsSpy.mockReturnValue({ width: 390, height: 844, scale: 1, fontScale: 1 });

    render(<AudioSettingsModal {...baseProps} />);

    expect(screen.getByTestId('audio-settings-sheet')).toBeTruthy();
    expect(screen.getByTestId('audio-settings-scroll')).toBeTruthy();
  });
});
