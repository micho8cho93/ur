import AsyncStorage from '@react-native-async-storage/async-storage';

export const DICE_ANIMATION_SPEED_OPTIONS = [0.75, 1, 1.25, 1.5] as const;
export const TURN_TIMER_SECONDS_OPTIONS = [10, 20, 30] as const;

export type DiceAnimationSpeed = (typeof DICE_ANIMATION_SPEED_OPTIONS)[number];
export type TurnTimerSeconds = (typeof TURN_TIMER_SECONDS_OPTIONS)[number];

export type MatchPreferences = {
  announcementCuesEnabled: boolean;
  autoRollEnabled: boolean;
  bugAnimationEnabled: boolean;
  diceAnimationEnabled: boolean;
  diceAnimationSpeed: DiceAnimationSpeed;
  moveHintEnabled: boolean;
  timerDurationSeconds: TurnTimerSeconds;
  timerEnabled: boolean;
};

const MATCH_PREFERENCES_KEY = 'ur.match.preferences';
const LEGACY_BOT_MATCH_PREFERENCES_KEY = 'ur.bot.match.preferences';

export const DEFAULT_MATCH_PREFERENCES: MatchPreferences = {
  announcementCuesEnabled: true,
  autoRollEnabled: false,
  bugAnimationEnabled: true,
  diceAnimationEnabled: true,
  diceAnimationSpeed: 1,
  moveHintEnabled: true,
  timerDurationSeconds: 20,
  timerEnabled: true,
};

type LegacyBotMatchPreferences = {
  timerEnabled: boolean;
};

const normalizeDiceAnimationSpeed = (value: unknown): DiceAnimationSpeed => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return DEFAULT_MATCH_PREFERENCES.diceAnimationSpeed;
  }

  return DICE_ANIMATION_SPEED_OPTIONS.reduce((closest, candidate) =>
    Math.abs(candidate - value) < Math.abs(closest - value) ? candidate : closest,
  );
};

const normalizeTurnTimerSeconds = (value: unknown): TurnTimerSeconds => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return DEFAULT_MATCH_PREFERENCES.timerDurationSeconds;
  }

  return TURN_TIMER_SECONDS_OPTIONS.reduce((closest, candidate) =>
    Math.abs(candidate - value) < Math.abs(closest - value) ? candidate : closest,
  );
};

const normalizeMatchPreferences = (
  preferences: Partial<MatchPreferences> | null | undefined,
  legacyTimerEnabled = DEFAULT_MATCH_PREFERENCES.timerEnabled,
): MatchPreferences => ({
  announcementCuesEnabled: preferences?.announcementCuesEnabled ?? DEFAULT_MATCH_PREFERENCES.announcementCuesEnabled,
  autoRollEnabled: preferences?.autoRollEnabled ?? DEFAULT_MATCH_PREFERENCES.autoRollEnabled,
  bugAnimationEnabled: preferences?.bugAnimationEnabled ?? DEFAULT_MATCH_PREFERENCES.bugAnimationEnabled,
  diceAnimationEnabled: preferences?.diceAnimationEnabled ?? DEFAULT_MATCH_PREFERENCES.diceAnimationEnabled,
  diceAnimationSpeed: normalizeDiceAnimationSpeed(preferences?.diceAnimationSpeed),
  moveHintEnabled: preferences?.moveHintEnabled ?? DEFAULT_MATCH_PREFERENCES.moveHintEnabled,
  timerDurationSeconds: normalizeTurnTimerSeconds(preferences?.timerDurationSeconds),
  timerEnabled: preferences?.timerEnabled ?? legacyTimerEnabled,
});

const getLegacyTimerEnabled = async () => {
  try {
    const rawPreferences = await AsyncStorage.getItem(LEGACY_BOT_MATCH_PREFERENCES_KEY);
    if (!rawPreferences) {
      return DEFAULT_MATCH_PREFERENCES.timerEnabled;
    }

    const parsed = JSON.parse(rawPreferences) as Partial<LegacyBotMatchPreferences>;
    return parsed.timerEnabled ?? DEFAULT_MATCH_PREFERENCES.timerEnabled;
  } catch (error) {
    console.warn('[match-preferences] Could not load legacy bot timer setting. Using defaults instead.', error);
    return DEFAULT_MATCH_PREFERENCES.timerEnabled;
  }
};

export const getMatchPreferences = async (): Promise<MatchPreferences> => {
  try {
    const rawPreferences = await AsyncStorage.getItem(MATCH_PREFERENCES_KEY);

    if (!rawPreferences) {
      const legacyTimerEnabled = await getLegacyTimerEnabled();
      return normalizeMatchPreferences(undefined, legacyTimerEnabled);
    }

    const parsed = JSON.parse(rawPreferences) as Partial<MatchPreferences>;
    return normalizeMatchPreferences(parsed);
  } catch (error) {
    console.warn('[match-preferences] Could not load saved match settings. Using defaults instead.', error);
    return DEFAULT_MATCH_PREFERENCES;
  }
};

export const setMatchPreferences = async (preferences: MatchPreferences): Promise<void> => {
  const nextPreferences = normalizeMatchPreferences(preferences, preferences.timerEnabled);

  try {
    await AsyncStorage.setItem(MATCH_PREFERENCES_KEY, JSON.stringify(nextPreferences));
  } catch (error) {
    console.warn('[match-preferences] Could not save match settings.', error);
  }
};

export const updateMatchPreferences = async (preferences: Partial<MatchPreferences>): Promise<MatchPreferences> => {
  const currentPreferences = await getMatchPreferences();
  const nextPreferences = normalizeMatchPreferences({
    ...currentPreferences,
    ...preferences,
  }, currentPreferences.timerEnabled);

  await setMatchPreferences(nextPreferences);
  return nextPreferences;
};
