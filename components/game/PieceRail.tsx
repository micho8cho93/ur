import { urTheme, urTypography } from '@/constants/urTheme';
import React, { useEffect } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
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

const TRAY_ASSETS = {
  light: require('../../assets/trays/tray_light.png'),
  dark: require('../../assets/trays/tray_dark.png'),
};

const TRAY_ART_FIT = {
  // Artwork-only fit tuning; does not affect piece coordinates or hitboxes.
  scale: 1.12,
  offsetX: 0,
  offsetY: 0,
};

const RESERVE_PIECE_ART_SCALE = 1.74;
const RESERVE_STACK_OFFSET_Y = 2;
const RESERVE_PIECE_OVERLAP = 6;
const RESERVE_STACK_LEFT_INSET = 4;

interface PieceRailProps {
  label: string;
  color: 'light' | 'dark';
  tokenVariant?: 'light' | 'dark' | 'reserve';
  reserveCount: number;
  totalCount?: number;
  active?: boolean;
}

export const PieceRail: React.FC<PieceRailProps> = ({
  label,
  color,
  tokenVariant,
  reserveCount,
  totalCount = 7,
  active = false,
}) => {
  const glow = useSharedValue(active ? 0.5 : 0);

  useEffect(() => {
    if (active) {
      glow.value = withRepeat(
        withSequence(
          withTiming(0.82, { duration: 700, easing: Easing.inOut(Easing.quad) }),
          withTiming(0.25, { duration: 700, easing: Easing.inOut(Easing.quad) }),
        ),
        -1,
        true,
      );
      return;
    }

    cancelAnimation(glow);
    glow.value = withTiming(0, { duration: 180 });
  }, [active, glow]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value,
    transform: [{ scale: 0.96 + glow.value * 0.06 }],
  }));

  const shownCount = Math.min(totalCount, reserveCount);
  const resolvedVariant = tokenVariant ?? color;

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>

      <View style={styles.rail}>
        {/*
          Reserve tray artwork is rendered as a background PNG.
          Piece positions and stacking geometry are determined by gameplay layout,
          not by the tray image.
        */}
        <View pointerEvents="none" style={styles.trayArtLayer}>
          <Image
            source={TRAY_ASSETS[color]}
            resizeMode="cover"
            style={[
              styles.trayArt,
              {
                transform: [
                  { translateX: TRAY_ART_FIT.offsetX },
                  { translateY: TRAY_ART_FIT.offsetY },
                  { scale: TRAY_ART_FIT.scale },
                ],
              },
            ]}
          />
        </View>
        <Animated.View style={[styles.activeGlow, glowStyle]} />

        <View style={styles.pieceStack}>
          {Array.from({ length: shownCount }).map((_, index) => (
            <View key={`piece-${index}`} style={[styles.stackPiece, { marginLeft: index === 0 ? 0 : -RESERVE_PIECE_OVERLAP }]}>
              <Piece
                color={color}
                size="sm"
                variant={resolvedVariant}
                artScale={RESERVE_PIECE_ART_SCALE}
              />
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    gap: 8,
  },
  label: {
    ...urTypography.label,
    color: urTheme.colors.clay,
    fontSize: 12,
    textAlign: 'left',
  },
  rail: {
    minHeight: 76,
    borderRadius: urTheme.radii.pill,
    borderWidth: 1.2,
    borderColor: 'transparent',
    backgroundColor: 'transparent',
    overflow: 'hidden',
    justifyContent: 'center',
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOpacity: 0.24,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 5 },
    elevation: 6,
  },
  trayArtLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  trayArt: {
    width: '100%',
    height: '100%',
  },
  activeGlow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(200, 152, 30, 0.16)',
    zIndex: 1,
  },
  pieceStack: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    alignItems: 'center',
    paddingLeft: RESERVE_STACK_LEFT_INSET,
    transform: [{ translateY: RESERVE_STACK_OFFSET_Y }],
    zIndex: 2,
  },
  stackPiece: {
    zIndex: 5,
  },
});
