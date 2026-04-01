import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  DEFAULT_MATCH_PREFERENCES,
  getMatchPreferences,
  updateMatchPreferences,
} from './matchPreferences';

const mockedAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

describe('matchPreferences', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('falls back to the legacy timer toggle when no saved match preferences exist', async () => {
    mockedAsyncStorage.getItem.mockImplementation(async (key: string) => {
      if (key === 'ur.match.preferences') {
        return null;
      }

      if (key === 'ur.bot.match.preferences') {
        return JSON.stringify({ timerEnabled: false });
      }

      return null;
    });

    await expect(getMatchPreferences()).resolves.toEqual({
      ...DEFAULT_MATCH_PREFERENCES,
      timerEnabled: false,
    });
  });

  it('normalizes saved timer durations and defaults announcement cues to enabled', async () => {
    mockedAsyncStorage.getItem.mockResolvedValue(
      JSON.stringify({
        ...DEFAULT_MATCH_PREFERENCES,
        announcementCuesEnabled: undefined,
        timerDurationSeconds: 26,
      }),
    );

    await expect(getMatchPreferences()).resolves.toEqual({
      ...DEFAULT_MATCH_PREFERENCES,
      timerDurationSeconds: 20,
    });
  });

  it('normalizes legacy dice animation speeds to the closest supported option', async () => {
    mockedAsyncStorage.getItem.mockResolvedValue(
      JSON.stringify({
        ...DEFAULT_MATCH_PREFERENCES,
        diceAnimationSpeed: 1.4,
      }),
    );

    await expect(getMatchPreferences()).resolves.toEqual({
      ...DEFAULT_MATCH_PREFERENCES,
      diceAnimationSpeed: 1,
    });
  });

  it('persists partial updates while preserving the rest of the match preferences', async () => {
    mockedAsyncStorage.getItem.mockResolvedValue(JSON.stringify(DEFAULT_MATCH_PREFERENCES));

    await expect(
      updateMatchPreferences({
        announcementCuesEnabled: false,
        timerDurationSeconds: 10,
      }),
    ).resolves.toEqual({
      ...DEFAULT_MATCH_PREFERENCES,
      announcementCuesEnabled: false,
      timerDurationSeconds: 10,
    });

    expect(mockedAsyncStorage.setItem).toHaveBeenCalledWith(
      'ur.match.preferences',
      JSON.stringify({
        ...DEFAULT_MATCH_PREFERENCES,
        announcementCuesEnabled: false,
        timerDurationSeconds: 10,
      }),
    );
  });
});
