import { Button } from '@/components/ui/Button';
import { boxShadow } from '@/constants/styleEffects';
import { urTheme, urTextures, urTypography } from '@/constants/urTheme';
import {
  DEFAULT_MATCH_PREFERENCES,
  TURN_TIMER_SECONDS_OPTIONS,
  type DiceAnimationSpeed,
  type TurnTimerSeconds,
} from '@/services/matchPreferences';
import React from 'react';
import {
  Image,
  Modal as RNModal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const VOLUME_OPTIONS = [0, 0.25, 0.5, 0.75, 1] as const;
const TURN_TIMER_OPTIONS: ReadonlyArray<{ label: string; value: TurnTimerSeconds }> = TURN_TIMER_SECONDS_OPTIONS.map(
  (option) => ({ label: `${option}s`, value: option }),
);

interface AudioSettingsModalProps {
  visible: boolean;
  announcementCuesEnabled: boolean;
  musicEnabled: boolean;
  musicVolume: number;
  sfxEnabled: boolean;
  sfxVolume: number;
  diceAnimationEnabled: boolean;
  diceAnimationSpeed: DiceAnimationSpeed;
  bugAnimationEnabled: boolean;
  autoRollEnabled: boolean;
  moveHintEnabled: boolean;
  timerEnabled?: boolean;
  timerDurationSeconds: TurnTimerSeconds;
  showTimerToggle?: boolean;
  showTimerDurationSetting?: boolean;
  onClose: () => void;
  onToggleAnnouncementCues: (enabled: boolean) => void;
  onToggleMusic: (enabled: boolean) => void;
  onSetMusicVolume: (volume: number) => void;
  onToggleSfx: (enabled: boolean) => void;
  onSetSfxVolume: (volume: number) => void;
  onToggleDiceAnimation: (enabled: boolean) => void;
  onSetDiceAnimationSpeed: (speed: DiceAnimationSpeed) => void;
  onToggleBugAnimation: (enabled: boolean) => void;
  onToggleAutoRoll: (enabled: boolean) => void;
  onToggleMoveHint: (enabled: boolean) => void;
  onSetTimerDuration: (seconds: TurnTimerSeconds) => void;
  onToggleTimer?: (enabled: boolean) => void;
}

type ToggleSettingRowProps = {
  title: string;
  hint: string;
  value: boolean;
  onValueChange?: (enabled: boolean) => void;
  disabled?: boolean;
};

type ChoiceRowProps<T extends string | number> = {
  title: string;
  hint: string;
  value: T;
  valueLabel?: string;
  options: ReadonlyArray<{ label: string; value: T }>;
  onValueChange: (value: T) => void;
  disabled?: boolean;
};

const formatPercent = (value: number) => `${Math.round(value * 100)}%`;
const formatDiceAnimationSpeedLabel = (value: DiceAnimationSpeed) => (value === 1 ? '1x' : `${value.toFixed(2)}x`);
const DICE_SPEED_OPTIONS: ReadonlyArray<{ label: string; value: DiceAnimationSpeed }> = [
  { label: formatDiceAnimationSpeedLabel(0.25), value: 0.25 },
  { label: formatDiceAnimationSpeedLabel(0.5), value: 0.5 },
  { label: formatDiceAnimationSpeedLabel(0.75), value: 0.75 },
  { label: formatDiceAnimationSpeedLabel(1), value: 1 },
];

const ToggleSettingRow: React.FC<ToggleSettingRowProps> = ({
  title,
  hint,
  value,
  onValueChange,
  disabled = false,
}) => (
  <View style={[styles.optionCard, disabled && styles.optionCardDisabled]}>
    <View style={styles.optionHeader}>
      <View style={styles.copyWrap}>
        <Text style={styles.optionTitle}>{title}</Text>
        <Text style={styles.optionHint}>{hint}</Text>
      </View>
      <Switch
        value={value}
        disabled={disabled}
        onValueChange={onValueChange}
        trackColor={{ false: 'rgba(92, 66, 41, 0.72)', true: 'rgba(200, 152, 32, 0.62)' }}
        thumbColor={value ? '#F4D38A' : '#E7D2B1'}
      />
    </View>
  </View>
);

const ChoiceSettingRow = <T extends string | number,>({
  title,
  hint,
  value,
  valueLabel,
  options,
  onValueChange,
  disabled = false,
}: ChoiceRowProps<T>) => (
  <View style={[styles.optionCard, disabled && styles.optionCardDisabled]}>
    <View style={styles.optionHeader}>
      <View style={styles.copyWrap}>
        <Text style={styles.optionTitle}>{title}</Text>
        <Text style={styles.optionHint}>{hint}</Text>
      </View>
      {valueLabel ? <Text style={styles.optionValue}>{valueLabel}</Text> : null}
    </View>

    <View style={styles.choiceWrap}>
      {options.map((option) => {
        const selected = option.value === value;

        return (
          <Pressable
            key={String(option.value)}
            accessibilityRole="button"
            disabled={disabled}
            onPress={() => onValueChange(option.value)}
            style={({ pressed }) => [
              styles.choiceChip,
              selected && styles.choiceChipSelected,
              disabled && styles.choiceChipDisabled,
              pressed && !disabled && styles.choiceChipPressed,
            ]}
          >
            <Text style={[styles.choiceLabel, selected && styles.choiceLabelSelected]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  </View>
);

export const AudioSettingsModal: React.FC<AudioSettingsModalProps> = ({
  visible,
  announcementCuesEnabled,
  musicEnabled,
  musicVolume,
  sfxEnabled,
  sfxVolume,
  diceAnimationEnabled,
  diceAnimationSpeed,
  bugAnimationEnabled,
  autoRollEnabled,
  moveHintEnabled,
  timerEnabled = true,
  timerDurationSeconds = DEFAULT_MATCH_PREFERENCES.timerDurationSeconds,
  showTimerToggle = false,
  showTimerDurationSetting = true,
  onClose,
  onToggleAnnouncementCues,
  onToggleMusic,
  onSetMusicVolume,
  onToggleSfx,
  onSetSfxVolume,
  onToggleDiceAnimation,
  onSetDiceAnimationSpeed,
  onToggleBugAnimation,
  onToggleAutoRoll,
  onToggleMoveHint,
  onSetTimerDuration,
  onToggleTimer,
}) => {
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isMobileWeb = isWeb && width < 760;

  if (!visible) {
    return null;
  }

  const sheet = (
    <View
      style={[
        styles.sheet,
        isMobileWeb && styles.sheetMobileWeb,
      ]}
      accessibilityViewIsModal
    >
      <Image source={urTextures.woodDark} resizeMode="repeat" style={styles.texture} />
      <Image source={urTextures.border} resizeMode="repeat" style={styles.borderTexture} />
      <View style={styles.sheetGlow} />
      <View style={styles.border} />

      <Text style={styles.title}>Match Settings</Text>
      <Text style={styles.subtitle}>
        Tune the match atmosphere, visual pacing, and how much of the rolling flow happens automatically.
      </Text>

      <ScrollView
        style={styles.scroll}
        alwaysBounceVertical={false}
        contentContainerStyle={styles.optionList}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <ToggleSettingRow
          title="Background Music"
          hint="Ancient ambience during the match"
          value={musicEnabled}
          onValueChange={onToggleMusic}
        />

        <ChoiceSettingRow
          title="Music Volume"
          hint="Master level for the background playlist"
          value={musicVolume}
          valueLabel={formatPercent(musicVolume)}
          options={VOLUME_OPTIONS.map((option) => ({ label: formatPercent(option), value: option }))}
          onValueChange={onSetMusicVolume}
        />

        <ToggleSettingRow
          title="Sound Effects"
          hint="Board drops, rolls, captures, scores, and tray drops"
          value={sfxEnabled}
          onValueChange={onToggleSfx}
        />

        <ChoiceSettingRow
          title="Sound Volume"
          hint="Master level for rolls, movement, scoring, and impact cues"
          value={sfxVolume}
          valueLabel={formatPercent(sfxVolume)}
          options={VOLUME_OPTIONS.map((option) => ({ label: formatPercent(option), value: option }))}
          onValueChange={onSetSfxVolume}
        />

        <ToggleSettingRow
          title="Dice Animation"
          hint="Show the rolling dice scene before the result lands"
          value={diceAnimationEnabled}
          onValueChange={onToggleDiceAnimation}
        />

        <ChoiceSettingRow
          title="Dice Animation Speed"
          hint="Lower values make the roll animation last longer"
          value={diceAnimationSpeed}
          valueLabel={formatDiceAnimationSpeedLabel(diceAnimationSpeed)}
          options={DICE_SPEED_OPTIONS}
          onValueChange={onSetDiceAnimationSpeed}
          disabled={!diceAnimationEnabled}
        />

        <ToggleSettingRow
          title="Bug Animation"
          hint="Show the wandering ambient bugs around the board"
          value={bugAnimationEnabled}
          onValueChange={onToggleBugAnimation}
        />

        <ToggleSettingRow
          title="Roll Dice Automatically"
          hint="Trigger your roll shortly after your turn begins"
          value={autoRollEnabled}
          onValueChange={onToggleAutoRoll}
        />

        <ToggleSettingRow
          title="Available Move Hint"
          hint="Highlight one legal piece or reserve entry and preview its route by default"
          value={moveHintEnabled}
          onValueChange={onToggleMoveHint}
        />

        {showTimerToggle ? (
          <ToggleSettingRow
            title="Turn Timer"
            hint="Show the hourglass and allow timeout auto-roll and auto-move in bot matches"
            value={timerEnabled}
            onValueChange={onToggleTimer}
          />
        ) : null}

        {showTimerDurationSetting ? (
          <ChoiceSettingRow
            title="Turn Timer Length"
            hint="Choose how long the match countdown runs before timeout assistance steps in"
            value={timerDurationSeconds}
            valueLabel={`${timerDurationSeconds}s`}
            options={TURN_TIMER_OPTIONS}
            onValueChange={onSetTimerDuration}
          />
        ) : null}

        <ToggleSettingRow
          title="Announcement Cues"
          hint="Show prompts like Play!, Roll Again, and private match status during the match"
          value={announcementCuesEnabled}
          onValueChange={onToggleAnnouncementCues}
        />
      </ScrollView>

      <View style={styles.buttonWrap}>
        <Button title="Close" variant="secondary" onPress={onClose} />
      </View>
    </View>
  );

  if (isWeb) {
    return (
      <View style={styles.webOverlayRoot}>
        <Pressable
          style={styles.backdrop}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close match settings"
        />
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']} pointerEvents="box-none">
          <View pointerEvents="box-none" style={[styles.centerWrap, isMobileWeb && styles.centerWrapMobileWeb]}>
            {sheet}
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <RNModal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
      presentationStyle="overFullScreen"
    >
      <View style={styles.modalRoot}>
        <Pressable
          style={styles.backdrop}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close match settings"
        />
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']} pointerEvents="box-none">
          <View pointerEvents="box-none" style={styles.centerWrap}>
            {sheet}
          </View>
        </SafeAreaView>
      </View>
    </RNModal>
  );
};

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    backgroundColor: 'rgba(4, 7, 12, 0.24)',
  },
  webOverlayRoot: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 90,
    elevation: 90,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(4, 7, 12, 0.68)',
  },
  safeArea: {
    flex: 1,
  },
  centerWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: urTheme.spacing.md,
    paddingVertical: urTheme.spacing.md,
  },
  centerWrapMobileWeb: {
    justifyContent: 'flex-start',
    paddingTop: urTheme.spacing.lg + urTheme.spacing.sm,
  },
  sheet: {
    width: '100%',
    maxWidth: 680,
    maxHeight: '92%',
    borderRadius: urTheme.radii.lg,
    overflow: 'hidden',
    backgroundColor: '#3B2416',
    borderWidth: 1.5,
    borderColor: 'rgba(217, 164, 65, 0.7)',
    paddingHorizontal: urTheme.spacing.lg,
    paddingTop: urTheme.spacing.lg,
    paddingBottom: urTheme.spacing.md,
    ...boxShadow({
      color: '#000',
      opacity: 0.34,
      offset: { width: 0, height: 12 },
      blurRadius: 18,
      elevation: 12,
    }),
  },
  sheetMobileWeb: {
    maxWidth: 520,
    maxHeight: '88%',
  },
  texture: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.22,
  },
  borderTexture: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.18,
  },
  sheetGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '40%',
    backgroundColor: 'rgba(255, 219, 164, 0.16)',
  },
  border: {
    ...StyleSheet.absoluteFillObject,
    margin: urTheme.spacing.xs,
    borderRadius: urTheme.radii.md,
    borderWidth: 1,
    borderColor: 'rgba(252, 225, 177, 0.33)',
  },
  title: {
    ...urTypography.title,
    color: urTheme.colors.parchment,
    fontSize: 28,
    textAlign: 'center',
  },
  subtitle: {
    color: 'rgba(247, 229, 203, 0.88)',
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
    marginTop: urTheme.spacing.xs,
    marginBottom: urTheme.spacing.md,
  },
  scroll: {
    flexGrow: 0,
    flexShrink: 1,
  },
  optionList: {
    gap: urTheme.spacing.sm,
    paddingBottom: urTheme.spacing.xs,
  },
  optionCard: {
    borderRadius: urTheme.radii.md,
    borderWidth: 1,
    borderColor: 'rgba(246, 219, 163, 0.18)',
    backgroundColor: 'rgba(10, 12, 16, 0.16)',
    paddingHorizontal: urTheme.spacing.md,
    paddingVertical: urTheme.spacing.sm + 2,
  },
  optionCardDisabled: {
    opacity: 0.55,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: urTheme.spacing.md,
  },
  copyWrap: {
    flex: 1,
    minWidth: 0,
  },
  optionTitle: {
    ...urTypography.label,
    color: urTheme.colors.parchment,
    fontSize: 12,
    letterSpacing: 0.9,
  },
  optionHint: {
    color: 'rgba(247, 229, 203, 0.76)',
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
  },
  optionValue: {
    color: urTheme.colors.goldBright,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  choiceWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: urTheme.spacing.xs,
    marginTop: urTheme.spacing.sm,
  },
  choiceChip: {
    minWidth: 56,
    borderRadius: urTheme.radii.pill,
    borderWidth: 1,
    borderColor: 'rgba(235, 205, 152, 0.22)',
    backgroundColor: 'rgba(26, 17, 10, 0.44)',
    paddingHorizontal: urTheme.spacing.sm,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceChipSelected: {
    borderColor: 'rgba(240, 198, 98, 0.72)',
    backgroundColor: 'rgba(186, 128, 28, 0.28)',
  },
  choiceChipDisabled: {
    borderColor: 'rgba(235, 205, 152, 0.14)',
  },
  choiceChipPressed: {
    transform: [{ scale: 0.98 }],
  },
  choiceLabel: {
    color: 'rgba(247, 229, 203, 0.8)',
    fontSize: 12,
    fontWeight: '600',
  },
  choiceLabelSelected: {
    color: urTheme.colors.parchment,
  },
  buttonWrap: {
    marginTop: urTheme.spacing.md,
    width: '100%',
  },
});
