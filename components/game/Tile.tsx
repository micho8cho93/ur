import { urTheme, urTextures } from '@/constants/urTheme';
import { isRosette, isWarZone } from '@/logic/constants';
import { PlayerColor } from '@/logic/types';
import React, { useEffect } from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Piece } from './Piece';

interface TileProps {
  row: number;
  col: number;
  piece?: { id: string; color: PlayerColor };
  isValidTarget?: boolean;
  onPress?: () => void;
}

export const Tile: React.FC<TileProps> = ({ row, col, piece, isValidTarget = false, onPress }) => {
  const rosette = isRosette(row, col);
  const war = isWarZone(row, col);
  const pulse = useSharedValue(isValidTarget ? 1 : 0);
  const rosetteGlow = useSharedValue(rosette ? 0.2 : 0);

  useEffect(() => {
    if (isValidTarget) {
      pulse.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 700, easing: Easing.inOut(Easing.quad) }),
          withTiming(0.45, { duration: 700, easing: Easing.inOut(Easing.quad) }),
        ),
        -1,
        true,
      );
      return;
    }

    cancelAnimation(pulse);
    pulse.value = withTiming(0, { duration: 180 });
  }, [isValidTarget, pulse]);

  useEffect(() => {
    if (rosette) {
      rosetteGlow.value = withRepeat(
        withSequence(
          withTiming(0.52, { duration: 1400, easing: Easing.inOut(Easing.quad) }),
          withTiming(0.18, { duration: 1300, easing: Easing.inOut(Easing.quad) }),
        ),
        -1,
        true,
      );
      return;
    }

    rosetteGlow.value = 0;
  }, [rosette, rosetteGlow]);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulse.value,
    transform: [{ scale: 0.9 + pulse.value * 0.22 }],
  }));

  const rosetteGlowStyle = useAnimatedStyle(() => ({
    opacity: rosetteGlow.value,
  }));

  const baseBackground = rosette ? '#AB7A3B' : war ? '#D0B089' : '#DCC5A2';
  const borderColor = rosette ? 'rgba(255, 219, 144, 0.65)' : 'rgba(98, 62, 36, 0.46)';

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!isValidTarget}
      activeOpacity={0.86}
      style={[
        styles.tile,
        {
          backgroundColor: baseBackground,
          borderColor,
          borderWidth: rosette ? 1.6 : 1.1,
        },
        isValidTarget && styles.validTile,
      ]}
    >
      <Image source={urTextures.wood} resizeMode="repeat" style={styles.tileTexture} />
      {rosette && <Image source={urTextures.rosette} resizeMode="repeat" style={styles.rosettePattern} />}

      <View style={[styles.innerInset, rosette && styles.rosetteInset]} />
      <View style={styles.edgeHighlight} />

      {isValidTarget && <Animated.View style={[styles.validRing, pulseStyle]} />}
      {rosette && <Animated.View style={[styles.rosetteGlow, rosetteGlowStyle]} />}

      {rosette && !piece && (
        <View style={styles.rosetteGlyphWrap}>
          <View style={styles.rosetteGlyphDiamond} />
          <View style={[styles.rosetteGlyphDiamond, styles.rosetteGlyphDiamondAlt]} />
          <View style={styles.rosetteGlyphCore} />
        </View>
      )}

      {isValidTarget && !piece && <View style={styles.validDot} />}

      {piece && (
        <View style={styles.pieceWrap}>
          <Piece color={piece.color} highlight={isValidTarget} />
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    borderRadius: urTheme.radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#1A0E06',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  validTile: {
    shadowColor: urTheme.colors.gold,
    shadowOpacity: 0.34,
    shadowRadius: 7,
    elevation: 5,
  },
  tileTexture: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.22,
  },
  rosettePattern: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.23,
  },
  innerInset: {
    ...StyleSheet.absoluteFillObject,
    margin: 2.4,
    borderRadius: urTheme.radii.xs,
    borderWidth: 1,
    borderColor: 'rgba(53, 31, 17, 0.3)',
    backgroundColor: 'rgba(37, 21, 12, 0.06)',
  },
  rosetteInset: {
    borderColor: 'rgba(252, 220, 155, 0.4)',
  },
  edgeHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '36%',
    backgroundColor: 'rgba(255, 226, 176, 0.16)',
  },
  validRing: {
    position: 'absolute',
    width: '78%',
    height: '78%',
    borderRadius: urTheme.radii.pill,
    borderWidth: 2.2,
    borderColor: 'rgba(238, 192, 98, 0.95)',
  },
  rosetteGlow: {
    position: 'absolute',
    width: '82%',
    height: '82%',
    borderRadius: urTheme.radii.pill,
    backgroundColor: 'rgba(255, 210, 120, 0.2)',
  },
  rosetteGlyphWrap: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rosetteGlyphDiamond: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 224, 173, 0.8)',
    transform: [{ rotate: '45deg' }],
  },
  rosetteGlyphDiamondAlt: {
    width: 12,
    height: 12,
    borderWidth: 1.4,
  },
  rosetteGlyphCore: {
    width: 7,
    height: 7,
    borderRadius: urTheme.radii.pill,
    backgroundColor: 'rgba(255, 239, 206, 0.82)',
  },
  validDot: {
    width: 14,
    height: 14,
    borderRadius: urTheme.radii.pill,
    backgroundColor: 'rgba(251, 224, 173, 0.86)',
    borderWidth: 1,
    borderColor: 'rgba(67, 40, 21, 0.45)',
  },
  pieceWrap: {
    opacity: 0.98,
  },
});
