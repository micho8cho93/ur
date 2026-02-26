import { urTheme, urTextures, urTypography } from '@/constants/urTheme';
import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

interface EdgeScoreProps {
  label: string;
  value: string;
  active?: boolean;
  align?: 'left' | 'right';
}

export const EdgeScore: React.FC<EdgeScoreProps> = ({ label, value, active = false, align = 'left' }) => {
  return (
    <View style={[styles.wrap, align === 'right' && styles.rightWrap, active && styles.activeWrap]}>
      <Image source={urTextures.lapisMosaic} resizeMode="cover" style={styles.texture} />
      <View style={styles.topGlow} />
      <View style={styles.innerBorder} />
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    minWidth: urTheme.hud.badgeMinWidth,
    paddingVertical: urTheme.spacing.xs,
    paddingHorizontal: urTheme.spacing.sm,
    borderRadius: urTheme.scoreBadge.radius,
    borderWidth: urTheme.scoreBadge.borderWidth,
    borderColor: 'rgba(200,155,80,0.58)',
    backgroundColor: urTheme.colors.navyPanel,
    alignItems: 'flex-start',
    overflow: 'hidden',
  },
  rightWrap: {
    alignItems: 'flex-end',
  },
  activeWrap: {
    borderColor: urTheme.colors.goldAccent,
    shadowColor: '#F0C040',
    shadowOpacity: 0.34,
    shadowRadius: 8,
    elevation: 5,
  },
  texture: {
    ...StyleSheet.absoluteFillObject,
    opacity: urTheme.hud.textureOpacity,
  },
  topGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '40%',
    backgroundColor: 'rgba(255, 231, 189, 0.08)',
  },
  innerBorder: {
    ...StyleSheet.absoluteFillObject,
    margin: 3,
    borderRadius: urTheme.board.tileRadius,
    borderWidth: 1,
    borderColor: 'rgba(248, 228, 188, 0.2)',
  },
  label: {
    ...urTypography.label,
    fontSize: urTheme.scoreBadge.labelSize,
    color: 'rgba(241, 230, 208, 0.82)',
  },
  value: {
    marginTop: 3,
    color: '#F7E9CD',
    fontSize: urTheme.scoreBadge.valueSize,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
