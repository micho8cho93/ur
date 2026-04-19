import { boxShadow } from '@/constants/styleEffects';
import { urTheme, urTypography } from '@/constants/urTheme';
import type { EmojiReactionKey } from '@/shared/urMatchProtocol';
import React from 'react';
import { Image, Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

export type EmojiReactionMenuOption = {
  key: EmojiReactionKey;
  emoji: string;
  label: string;
};

interface EmojiReactionMenuProps {
  buttonWidth?: number;
  compact?: boolean;
  disabled?: boolean;
  menuVisible: boolean;
  onSelect: (key: EmojiReactionKey) => void;
  onToggle: () => void;
  options: readonly EmojiReactionMenuOption[];
  remainingCount: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const emojiReactionTriggerImage = require('../../assets/buttons/emoji_reaction_trigger.png');
const EMOJI_TRIGGER_ASPECT_RATIO = 520 / 236;
const DEFAULT_TRIGGER_WIDTH = 112;
const DEFAULT_TRIGGER_WIDTH_COMPACT = 94;
const COMPACT_MENU_ITEMS_PER_ROW = 5;

export function EmojiReactionMenu({
  buttonWidth,
  compact = false,
  disabled = false,
  menuVisible,
  onSelect,
  onToggle,
  options,
  remainingCount,
  style,
  testID,
}: EmojiReactionMenuProps) {
  const resolvedTriggerWidth = Math.max(
    1,
    Math.round(buttonWidth ?? (compact ? DEFAULT_TRIGGER_WIDTH_COMPACT : DEFAULT_TRIGGER_WIDTH)),
  );
  const resolvedTriggerHeight = Math.max(1, Math.round(resolvedTriggerWidth / EMOJI_TRIGGER_ASPECT_RATIO));
  const triggerRadius = Math.round(resolvedTriggerHeight / 2);
  const menuRows = React.useMemo(() => {
    if (!compact) {
      return [options];
    }

    const rows: EmojiReactionMenuOption[][] = [];
    for (let index = 0; index < options.length; index += COMPACT_MENU_ITEMS_PER_ROW) {
      rows.push(options.slice(index, index + COMPACT_MENU_ITEMS_PER_ROW));
    }
    return rows;
  }, [compact, options]);

  return (
    <View testID={testID} style={[styles.wrap, style]}>
      {menuVisible ? (
        <View style={styles.menu}>
          {menuRows.map((row, rowIndex) => (
            <View key={`emoji-row-${rowIndex}`} style={styles.menuRow}>
              {row.map((option) => (
                <Pressable
                  key={option.key}
                  accessibilityRole="button"
                  accessibilityLabel={`Send ${option.label} emoji reaction`}
                  onPress={() => onSelect(option.key)}
                  style={({ pressed }) => [
                    styles.emojiButton,
                    compact && styles.emojiButtonCompact,
                    pressed && styles.emojiButtonPressed,
                  ]}
                >
                  <Text style={[styles.emojiText, compact && styles.emojiTextCompact]}>{option.emoji}</Text>
                </Pressable>
              ))}
            </View>
          ))}
        </View>
      ) : null}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Send emoji. ${remainingCount} left.`}
        accessibilityState={{ disabled, expanded: menuVisible }}
        disabled={disabled}
        onPress={onToggle}
        style={[
          styles.triggerButton,
          compact && styles.triggerButtonCompact,
          disabled && styles.triggerButtonDisabled,
          { width: resolvedTriggerWidth },
        ]}
      >
        {({ pressed }) => {
          const showSunkenState = !disabled && (menuVisible || pressed);

          return (
            <>
              <View
                style={[
                  styles.triggerImageFrame,
                  showSunkenState ? styles.triggerImageFrameSunken : styles.triggerImageFrameRaised,
                  { borderRadius: triggerRadius },
                ]}
              >
                <Image
                  accessibilityIgnoresInvertColors
                  resizeMode="cover"
                  source={emojiReactionTriggerImage}
                  style={[
                    styles.triggerImage,
                    {
                      width: resolvedTriggerWidth,
                      height: resolvedTriggerHeight,
                    },
                  ]}
                />
                <View
                  pointerEvents="none"
                  style={[
                    styles.triggerImageOverlay,
                    showSunkenState && styles.triggerImageOverlaySunken,
                    disabled && styles.triggerImageOverlayDisabled,
                  ]}
                />
              </View>
              <Text style={[styles.triggerButtonText, compact && styles.triggerButtonTextCompact]}>
                {`${remainingCount} left`}
              </Text>
            </>
          );
        }}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
    alignItems: 'center',
    gap: urTheme.spacing.xs,
  },
  menu: {
    position: 'absolute',
    bottom: '100%',
    marginBottom: urTheme.spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    gap: urTheme.spacing.xs,
    paddingHorizontal: urTheme.spacing.xs,
    paddingVertical: urTheme.spacing.xs,
    borderRadius: urTheme.radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(244, 205, 123, 0.72)',
    backgroundColor: 'rgba(19, 14, 10, 0.96)',
    ...boxShadow({
      color: '#000',
      opacity: 0.26,
      offset: { width: 0, height: 6 },
      blurRadius: 12,
      elevation: 10,
    }),
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: urTheme.spacing.xs,
  },
  emojiButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(244, 227, 200, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(248, 225, 184, 0.2)',
  },
  emojiButtonCompact: {
    width: 38,
    height: 38,
  },
  emojiButtonPressed: {
    opacity: 0.8,
  },
  emojiText: {
    fontSize: 24,
    lineHeight: 28,
  },
  emojiTextCompact: {
    fontSize: 22,
    lineHeight: 24,
  },
  triggerButton: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  triggerButtonCompact: {
    gap: 3,
  },
  triggerButtonDisabled: {
    opacity: 0.52,
  },
  triggerImageFrame: {
    overflow: 'hidden',
  },
  triggerImageFrameRaised: {
    transform: [{ translateY: 0 }],
  },
  triggerImageFrameSunken: {
    transform: [{ translateY: 5 }, { scale: 0.97 }],
  },
  triggerImage: {
    maxWidth: '100%',
  },
  triggerImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
  },
  triggerImageOverlaySunken: {
    backgroundColor: 'rgba(10, 7, 5, 0.24)',
  },
  triggerImageOverlayDisabled: {
    backgroundColor: 'rgba(8, 6, 4, 0.28)',
  },
  triggerButtonText: {
    ...urTypography.label,
    color: 'rgba(250, 237, 214, 0.92)',
    fontSize: 10,
    letterSpacing: 0.4,
    textAlign: 'center',
  },
  triggerButtonTextCompact: {
    fontSize: 9,
  },
});
