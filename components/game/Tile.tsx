import { urTheme, urTextures } from '@/constants/urTheme';
import { isRosette, isWarZone } from '@/logic/constants';
import { PlayerColor } from '@/logic/types';
import React, { useEffect, useMemo, useRef } from 'react';
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
import Svg, { Circle, Ellipse, Polygon } from 'react-native-svg';
import { Piece } from './Piece';

interface TileProps {
  row: number;
  col: number;
  piece?: { id: string; color: PlayerColor };
  isValidTarget?: boolean;
  isSelectedPiece?: boolean;
  isInteractive?: boolean;
  onPress?: () => void;
  highlightMode?: 'subtle' | 'theatrical';
}

// Rosette SVG: 8-petal flower with alternating teal/orange petals
const RosetteArtwork: React.FC<{ size: number }> = ({ size }) => {
  const cx = size / 2;
  const cy = size / 2;
  const petalRx = size * 0.18;
  const petalRy = size * 0.32;
  const petalOffset = size * 0.15;
  const ringR = size * 0.42;
  const centerR = size * 0.1;
  const dotR = size * 0.035;

  return (
    <Svg width={size} height={size} pointerEvents="none" style={StyleSheet.absoluteFillObject}>
      {/* 8 petals at 45° intervals */}
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
        const angleDeg = i * 45;
        const angleRad = (angleDeg * Math.PI) / 180;
        const ex = cx + Math.cos(angleRad) * petalOffset;
        const ey = cy + Math.sin(angleRad) * petalOffset;
        const fill = i % 2 === 0 ? '#2AA89A' : '#D4702A';
        return (
          <Ellipse
            key={i}
            cx={ex}
            cy={ey}
            rx={petalRx}
            ry={petalRy}
            fill={fill}
            fillOpacity={0.82}
            transform={`rotate(${angleDeg}, ${ex}, ${ey})`}
          />
        );
      })}
      {/* Outer gold ring */}
      <Circle cx={cx} cy={cy} r={ringR} fill="none" stroke="#C8981E" strokeWidth={1.2} strokeOpacity={0.85} />
      {/* Central shell circle */}
      <Circle cx={cx} cy={cy} r={centerR} fill="#F2E8D5" />
      {/* Bitumen center dot */}
      <Circle cx={cx} cy={cy} r={dotR} fill="#1A1208" />
    </Svg>
  );
};

// Regular tile: 2×2 grid of pip dots
const PipArtwork: React.FC<{ size: number }> = ({ size }) => {
  const spacing = size * 0.22;
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.07;
  const pipColor = 'rgba(90, 60, 30, 0.55)';

  const positions = [
    { x: cx - spacing, y: cy - spacing },
    { x: cx + spacing, y: cy - spacing },
    { x: cx - spacing, y: cy + spacing },
    { x: cx + spacing, y: cy + spacing },
  ];

  return (
    <Svg width={size} height={size} pointerEvents="none" style={StyleSheet.absoluteFillObject}>
      {positions.map((pos, i) => (
        <Circle key={i} cx={pos.x} cy={pos.y} r={r} fill={pipColor} />
      ))}
    </Svg>
  );
};

// War zone tile: 2×2 grid of diamond shapes
const WarZoneArtwork: React.FC<{ size: number }> = ({ size }) => {
  const spacing = size * 0.24;
  const cx = size / 2;
  const cy = size / 2;
  const d = size * 0.09; // half-width of diamond
  const fill = 'rgba(60, 30, 10, 0.4)';

  const centers = [
    { x: cx - spacing, y: cy - spacing },
    { x: cx + spacing, y: cy - spacing },
    { x: cx - spacing, y: cy + spacing },
    { x: cx + spacing, y: cy + spacing },
  ];

  return (
    <Svg width={size} height={size} pointerEvents="none" style={StyleSheet.absoluteFillObject}>
      {centers.map((c, i) => (
        <Polygon
          key={i}
          points={`${c.x},${c.y - d} ${c.x + d},${c.y} ${c.x},${c.y + d} ${c.x - d},${c.y}`}
          fill={fill}
        />
      ))}
    </Svg>
  );
};

export const Tile: React.FC<TileProps> = ({
  row,
  col,
  piece,
  isValidTarget = false,
  isSelectedPiece = false,
  isInteractive = false,
  onPress,
  highlightMode = 'theatrical',
}) => {
  const rosette = isRosette(row, col);
  const war = isWarZone(row, col);
  const pulse = useSharedValue(isValidTarget ? 1 : 0);
  const selectedPulse = useSharedValue(isSelectedPiece ? 1 : 0);
  const rosetteGlow = useSharedValue(rosette ? 0.2 : 0);
  const rosetteBurst = useSharedValue(0);
  const prevPieceId = useRef<string | null>(piece?.id ?? null);

  const tileSeed = useMemo(() => (row * 13 + col * 7) % 5, [col, row]);

  useEffect(() => {
    if (isValidTarget) {
      pulse.value = withRepeat(
        withSequence(
          withTiming(1, {
            duration: highlightMode === 'theatrical' ? 520 : 900,
            easing: Easing.inOut(Easing.quad),
          }),
          withTiming(0.45, {
            duration: highlightMode === 'theatrical' ? 520 : 900,
            easing: Easing.inOut(Easing.quad),
          }),
        ),
        -1,
        true,
      );
      return;
    }

    cancelAnimation(pulse);
    pulse.value = withTiming(0, { duration: 180 });
  }, [highlightMode, isValidTarget, pulse]);

  useEffect(() => {
    if (isSelectedPiece) {
      selectedPulse.value = withRepeat(
        withSequence(
          withTiming(0.95, { duration: 520, easing: Easing.inOut(Easing.quad) }),
          withTiming(0.25, { duration: 520, easing: Easing.inOut(Easing.quad) }),
        ),
        -1,
        true,
      );
      return;
    }

    cancelAnimation(selectedPulse);
    selectedPulse.value = withTiming(0, { duration: 180 });
  }, [isSelectedPiece, selectedPulse]);

  useEffect(() => {
    if (rosette) {
      rosetteGlow.value = withRepeat(
        withSequence(
          withTiming(0.52, { duration: 1200, easing: Easing.inOut(Easing.quad) }),
          withTiming(0.18, { duration: 1200, easing: Easing.inOut(Easing.quad) }),
        ),
        -1,
        true,
      );
      return;
    }

    rosetteGlow.value = 0;
  }, [rosette, rosetteGlow]);

  useEffect(() => {
    const prev = prevPieceId.current;
    const next = piece?.id ?? null;
    if (rosette && next && prev !== next) {
      rosetteBurst.value = withSequence(
        withTiming(1, { duration: 160, easing: Easing.out(Easing.cubic) }),
        withTiming(0, { duration: 360, easing: Easing.inOut(Easing.quad) }),
      );
    }
    prevPieceId.current = next;
  }, [piece?.id, rosette, rosetteBurst]);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: highlightMode === 'theatrical' ? pulse.value : pulse.value * 0.6,
    transform: [{ scale: 0.9 + pulse.value * (highlightMode === 'theatrical' ? 0.26 : 0.14) }],
  }));

  const rosetteGlowStyle = useAnimatedStyle(() => ({
    opacity: rosetteGlow.value,
  }));

  const selectedPulseStyle = useAnimatedStyle(() => ({
    opacity: selectedPulse.value,
    transform: [{ scale: 0.93 + selectedPulse.value * 0.13 }],
  }));

  const rosetteBurstStyle = useAnimatedStyle(() => ({
    opacity: rosetteBurst.value * 0.8,
    transform: [{ scale: 0.82 + rosetteBurst.value * 0.7 }],
  }));

  // Period-accurate background colors
  const toneOffset = tileSeed * 4;
  const baseBackground = rosette
    ? '#B8803A'
    : war
      ? `rgb(${184 + toneOffset}, ${120 + Math.floor(toneOffset / 2)}, ${64 + Math.floor(toneOffset / 3)})`
      : `rgb(${200 + toneOffset}, ${152 + Math.floor(toneOffset / 2)}, ${88 + Math.floor(toneOffset / 3)})`;

  const borderColor = 'rgba(26, 18, 8, 0.7)';

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!isInteractive}
      activeOpacity={0.86}
      style={[
        styles.tile,
        {
          backgroundColor: baseBackground,
          borderColor,
          borderWidth: rosette ? 1.8 : 1.1,
        },
        isValidTarget && styles.validTile,
        isSelectedPiece && styles.selectedTile,
      ]}
    >
      <Image source={urTextures.wood} resizeMode="repeat" style={styles.tileTexture} />

      {/* Period-accurate SVG artwork — rendered behind overlays */}
      {rosette && !piece && <RosetteArtwork size={48} />}
      {!rosette && war && !piece && <WarZoneArtwork size={48} />}
      {!rosette && !war && !piece && <PipArtwork size={48} />}

      <View style={[styles.innerInset, rosette && styles.rosetteInset]} />
      <View style={styles.edgeHighlight} />
      <View style={styles.lowerShade} />

      {isSelectedPiece && <Animated.View style={[styles.selectedRing, selectedPulseStyle]} />}
      {isValidTarget && <Animated.View style={[styles.validRing, pulseStyle]} />}
      {rosette && <Animated.View style={[styles.rosetteGlow, rosetteGlowStyle]} />}
      {rosette && <Animated.View style={[styles.rosetteBurst, rosetteBurstStyle]} />}

      {isValidTarget && !piece && <View style={styles.validDot} />}

      {piece && (
        <View style={styles.pieceWrap}>
          <Piece color={piece.color} highlight={isValidTarget} state={isValidTarget ? 'active' : 'idle'} />
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
    shadowColor: urTheme.colors.goldGlow,
    shadowOpacity: 0.34,
    shadowRadius: 7,
    elevation: 5,
  },
  selectedTile: {
    borderColor: 'rgba(240, 192, 64, 0.85)',
    shadowColor: urTheme.colors.goldGlow,
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 7,
  },
  tileTexture: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.18,
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
    height: '34%',
    backgroundColor: 'rgba(255, 226, 176, 0.16)',
  },
  lowerShade: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '28%',
    backgroundColor: 'rgba(34, 17, 9, 0.14)',
  },
  validRing: {
    position: 'absolute',
    width: '78%',
    height: '78%',
    borderRadius: urTheme.radii.pill,
    borderWidth: 2.2,
    borderColor: 'rgba(240, 192, 64, 0.98)',
  },
  selectedRing: {
    position: 'absolute',
    width: '88%',
    height: '88%',
    borderRadius: urTheme.radii.pill,
    borderWidth: 1.7,
    borderColor: 'rgba(240, 192, 64, 0.92)',
    backgroundColor: 'rgba(240, 192, 64, 0.12)',
  },
  rosetteGlow: {
    position: 'absolute',
    width: '82%',
    height: '82%',
    borderRadius: urTheme.radii.pill,
    backgroundColor: 'rgba(255, 210, 120, 0.2)',
  },
  rosetteBurst: {
    position: 'absolute',
    width: '72%',
    height: '72%',
    borderRadius: urTheme.radii.pill,
    borderWidth: 2,
    borderColor: 'rgba(255, 239, 196, 0.92)',
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
