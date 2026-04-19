import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import { Platform, Pressable, StyleSheet, ViewStyle } from 'react-native';

import { urTheme } from '@/constants/urTheme';

type MatchEconomyInfoButtonProps = {
  accessibilityLabel: string;
  onPress: () => void;
  style?: ViewStyle;
};

export const MatchEconomyInfoButton: React.FC<MatchEconomyInfoButtonProps> = ({
  accessibilityLabel,
  onPress,
  style,
}) => (
  <Pressable
    accessibilityRole="button"
    accessibilityLabel={accessibilityLabel}
    hitSlop={8}
    onPress={(event) => {
      event?.stopPropagation?.();
      onPress();
    }}
    style={({ pressed }) => [styles.button, pressed && styles.buttonPressed, style]}
  >
    <MaterialIcons name="info-outline" size={15} color={urTheme.colors.ivory} />
  </Pressable>
);

const styles = StyleSheet.create({
  button: {
    width: 28,
    height: 28,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(246, 214, 151, 0.48)',
    backgroundColor: 'rgba(32, 21, 10, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web'
      ? {
          cursor: 'pointer',
          userSelect: 'none',
        }
      : {}),
  },
  buttonPressed: {
    transform: [{ scale: 0.96 }],
  },
});
