import AsyncStorage from '@react-native-async-storage/async-storage';

export type BotMatchPreferences = {
  timerEnabled: boolean;
};

const BOT_MATCH_PREFERENCES_KEY = 'ur.bot.match.preferences';

const DEFAULT_BOT_MATCH_PREFERENCES: BotMatchPreferences = {
  timerEnabled: true,
};

export const getBotMatchPreferences = async (): Promise<BotMatchPreferences> => {
  try {
    const rawPreferences = await AsyncStorage.getItem(BOT_MATCH_PREFERENCES_KEY);

    if (!rawPreferences) {
      return DEFAULT_BOT_MATCH_PREFERENCES;
    }

    const parsed = JSON.parse(rawPreferences) as Partial<BotMatchPreferences>;

    return {
      timerEnabled: parsed.timerEnabled ?? DEFAULT_BOT_MATCH_PREFERENCES.timerEnabled,
    };
  } catch (error) {
    console.warn('[bot-match-preferences] Could not load saved bot match settings. Using defaults instead.', error);
    return DEFAULT_BOT_MATCH_PREFERENCES;
  }
};

export const setBotTimerEnabled = async (timerEnabled: boolean): Promise<void> => {
  const nextPreferences: BotMatchPreferences = { timerEnabled };

  try {
    await AsyncStorage.setItem(BOT_MATCH_PREFERENCES_KEY, JSON.stringify(nextPreferences));
  } catch (error) {
    console.warn('[bot-match-preferences] Could not save bot match settings.', error);
  }
};
