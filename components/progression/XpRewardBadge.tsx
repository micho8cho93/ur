import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { boxShadow } from '@/constants/styleEffects';
import { urTheme, urTypography } from '@/constants/urTheme';

interface XpRewardBadgeProps {
  amount: number;
  style?: StyleProp<ViewStyle>;
}

export const XpRewardBadge: React.FC<XpRewardBadgeProps> = ({ amount, style }) => (
  <View
    accessibilityRole="text"
    accessibilityLabel={`Win reward ${amount} XP`}
    style={[styles.badge, style]}
  >
    <Text style={styles.label}>Win XP</Text>
    <Text style={styles.value}>+{amount} XP</Text>
  </View>
);

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-end',
    borderRadius: urTheme.radii.md,
    paddingHorizontal: urTheme.spacing.sm,
    paddingVertical: urTheme.spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(244, 214, 157, 0.38)',
    backgroundColor: 'rgba(31, 22, 10, 0.82)',
    minWidth: 88,
    ...boxShadow({
      color: '#000',
      opacity: 0.2,
      offset: { width: 0, height: 4 },
      blurRadius: 8,
      elevation: 4,
    }),
  },
  label: {
    ...urTypography.label,
    color: 'rgba(245, 227, 193, 0.72)',
    fontSize: 9,
    textAlign: 'center',
  },
  value: {
    ...urTypography.label,
    color: urTheme.colors.goldBright,
    fontSize: 14,
    textAlign: 'center',
  },
});
