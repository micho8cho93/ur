import { urTheme, urTextures, urTypography } from '@/constants/urTheme';
import React from 'react';
import { Image, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

type RankBadgeTone = 'current' | 'max' | 'muted';
type RankBadgeSize = 'sm' | 'md';

interface RankBadgeProps {
  title: string;
  tone?: RankBadgeTone;
  size?: RankBadgeSize;
  style?: StyleProp<ViewStyle>;
}

const toneStyles: Record<RankBadgeTone, ViewStyle> = {
  current: {
    backgroundColor: 'rgba(17, 41, 69, 0.9)',
    borderColor: 'rgba(244, 216, 162, 0.55)',
  },
  max: {
    backgroundColor: 'rgba(88, 48, 11, 0.94)',
    borderColor: 'rgba(246, 210, 138, 0.72)',
  },
  muted: {
    backgroundColor: 'rgba(12, 18, 24, 0.58)',
    borderColor: 'rgba(231, 203, 160, 0.22)',
  },
};

export const RankBadge: React.FC<RankBadgeProps> = ({
  title,
  tone = 'current',
  size = 'md',
  style,
}) => (
  <View style={[styles.base, toneStyles[tone], size === 'sm' ? styles.smallBase : styles.mediumBase, style]}>
    <Image source={urTextures.lapisMosaic} resizeMode="repeat" style={styles.texture} />
    <View style={styles.glow} />
    <Text style={[styles.label, size === 'sm' ? styles.smallLabel : styles.mediumLabel]} numberOfLines={1}>
      {title}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
    borderWidth: 1,
    borderRadius: urTheme.radii.pill,
    alignSelf: 'flex-start',
    justifyContent: 'center',
  },
  mediumBase: {
    minHeight: 34,
    paddingHorizontal: urTheme.spacing.sm + 2,
    paddingVertical: 7,
  },
  smallBase: {
    minHeight: 28,
    paddingHorizontal: urTheme.spacing.sm,
    paddingVertical: 5,
  },
  texture: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.12,
  },
  glow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '58%',
    backgroundColor: 'rgba(247, 226, 189, 0.12)',
  },
  label: {
    ...urTypography.label,
    color: '#F8ECD6',
  },
  mediumLabel: {
    fontSize: 11,
  },
  smallLabel: {
    fontSize: 10,
  },
});
