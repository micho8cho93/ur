import { urTheme, urTypography } from '@/constants/urTheme';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface EdgeScoreProps {
  label: string;
  value: string;
  active?: boolean;
  align?: 'left' | 'right';
}

export const EdgeScore: React.FC<EdgeScoreProps> = ({ label, value, active = false, align = 'left' }) => {
  return (
    <View style={[styles.wrap, align === 'right' && styles.rightWrap, active && styles.activeWrap]}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    minWidth: 110,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: urTheme.radii.sm,
    borderWidth: 1,
    borderColor: 'rgba(217, 164, 65, 0.55)',
    backgroundColor: 'rgba(10, 13, 18, 0.66)',
    alignItems: 'flex-start',
  },
  rightWrap: {
    alignItems: 'flex-end',
  },
  activeWrap: {
    borderColor: 'rgba(111, 184, 255, 0.9)',
    shadowColor: urTheme.colors.glow,
    shadowOpacity: 0.28,
    shadowRadius: 7,
    elevation: 5,
  },
  label: {
    ...urTypography.label,
    fontSize: 10,
    color: 'rgba(241, 230, 208, 0.82)',
  },
  value: {
    marginTop: 3,
    color: '#F7E9CD',
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
