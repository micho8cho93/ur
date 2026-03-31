import { boxShadow } from '@/constants/styleEffects';
import { urTheme, urTypography } from '@/constants/urTheme';
import type { EmojiReactionKey } from '@/shared/urMatchProtocol';
import React from 'react';
import { Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

export type EmojiReactionMenuOption = {
  key: EmojiReactionKey;
  emoji: string;
  label: string;
};

interface EmojiReactionMenuProps {
  compact?: boolean;
  disabled?: boolean;
  menuVisible: boolean;
  onSelect: (key: EmojiReactionKey) => void;
  onToggle: () => void;
  options: readonly EmojiReactionMenuOption[];
  remainingCount: number;
  style?: StyleProp<ViewStyle>;
}

export function EmojiReactionMenu({
  compact = false,
  disabled = false,
  menuVisible,
  onSelect,
  onToggle,
  options,
  remainingCount,
  style,
}: EmojiReactionMenuProps) {
  return (
    <View style={[styles.wrap, style]}>
      {menuVisible ? (
        <View style={styles.menu}>
          {options.map((option) => (
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
      ) : null}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Send emoji. ${remainingCount} left.`}
        disabled={disabled}
        onPress={onToggle}
        style={({ pressed }) => [
          styles.triggerButton,
          compact && styles.triggerButtonCompact,
          disabled && styles.triggerButtonDisabled,
          pressed && !disabled && styles.triggerButtonPressed,
        ]}
      >
        <Text style={[styles.triggerButtonText, compact && styles.triggerButtonTextCompact]}>
          {`Send Emoji (${remainingCount} left)`}
        </Text>
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
    flexDirection: 'row',
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
    minHeight: 34,
    paddingHorizontal: urTheme.spacing.md,
    paddingVertical: 7,
    borderRadius: urTheme.radii.pill,
    borderWidth: 1.2,
    borderColor: 'rgba(244, 205, 123, 0.72)',
    backgroundColor: 'rgba(20, 14, 10, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    ...boxShadow({
      color: '#000',
      opacity: 0.2,
      offset: { width: 0, height: 4 },
      blurRadius: 8,
      elevation: 5,
    }),
  },
  triggerButtonCompact: {
    minHeight: 30,
    paddingHorizontal: urTheme.spacing.sm,
    paddingVertical: 6,
  },
  triggerButtonDisabled: {
    opacity: 0.52,
  },
  triggerButtonPressed: {
    opacity: 0.82,
  },
  triggerButtonText: {
    ...urTypography.label,
    color: urTheme.colors.ivory,
    fontSize: 11,
    textAlign: 'center',
  },
  triggerButtonTextCompact: {
    fontSize: 10,
  },
});
