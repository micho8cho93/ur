import { boxShadow } from '@/constants/styleEffects';
import { urTheme, urTextures } from '@/constants/urTheme';
import { isRosette, isWarZone } from '@/logic/constants';
import { PlayerColor } from '@/logic/types';
import React, { useEffect, useMemo, useRef } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle, Ellipse, G, Polygon } from 'react-native-svg';
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
  cellSize?: number;
  piecePixelSize?: number;
  piece?: { id: string; color: PlayerColor };
  isValidTarget?: boolean;
  isSelectedPiece?: boolean;
  isInteractive?: boolean;
  onPress?: () => void;
  onHoverIn?: () => void;
  onHoverOut?: () => void;
  highlightMode?: 'subtle' | 'theatrical';
  skin?: 'default' | 'transparent';
}

const RosetteArtwork: React.FC<{ size: number }> = ({ size }) => {
  const cx = size / 2;
  const cy = size / 2;
  const petalRx = size * 0.18;
  const petalRy = size * 0.1;
  const petalOffset = size * 0.19;
  const colors = ['#2AA89A', '#D4702A', '#2AA89A', '#D4702A', '#2AA89A', '#D4702A', '#2AA89A', '#D4702A'];
  const angles = [0, 45, 90, 135, 180, 225, 270, 315];

  return (
    <Svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ position: 'absolute' }}
      pointerEvents="none"
    >
      <G>
        {angles.map((angle, i) => {
          const rad = (angle * Math.PI) / 180;
          const ex = cx + Math.cos(rad) * petalOffset;
          const ey = cy + Math.sin(rad) * petalOffset;
          return (
            <Ellipse
              key={i}
              cx={ex}
              cy={ey}
              rx={petalRx}
              ry={petalRy}
              fill={colors[i]}
              opacity={0.88}
              transform={`rotate(${angle}, ${ex}, ${ey})`}
            />
          );
        })}
        <Circle cx={cx} cy={cy} r={size * 0.14} fill="#F2E8D5" stroke="#C8981E" strokeWidth={1.2} />
        <Circle cx={cx} cy={cy} r={size * 0.05} fill="#1A1208" />
        <Circle cx={cx} cy={cy} r={size * 0.42} fill="none" stroke="#C8981E" strokeWidth={1} opacity={0.7} />
      </G>
    </Svg>
  );
};

const PipArtwork: React.FC<{ size: number }> = ({ size }) => {
  const positions = [
    { x: size * 0.33, y: size * 0.33 },
    { x: size * 0.67, y: size * 0.33 },
    { x: size * 0.33, y: size * 0.67 },
    { x: size * 0.67, y: size * 0.67 },
  ];

  return (
    <Svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ position: 'absolute' }}
      pointerEvents="none"
    >
      {positions.map((pos, i) => (
        <Circle key={i} cx={pos.x} cy={pos.y} r={size * 0.065} fill="rgba(90,60,30,0.52)" />
      ))}
    </Svg>
  );
};

const WarArtwork: React.FC<{ size: number }> = ({ size }) => {
  const half = size / 2;
  const d = size * 0.13;
  const diamonds = [
    { cx: half * 0.6, cy: half * 0.6 },
    { cx: half * 1.4, cy: half * 0.6 },
    { cx: half * 0.6, cy: half * 1.4 },
    { cx: half * 1.4, cy: half * 1.4 },
  ];

  return (
    <Svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ position: 'absolute' }}
      pointerEvents="none"
    >
      {diamonds.map((pos, i) => (
        <Polygon
          key={i}
          points={`${pos.cx},${pos.cy - d} ${pos.cx + d},${pos.cy} ${pos.cx},${pos.cy + d} ${pos.cx - d},${pos.cy}`}
          fill="rgba(60,30,10,0.38)"
        />
      ))}
    </Svg>
  );
};

export const Tile: React.FC<TileProps> = ({
  row,
  col,
  cellSize = 44,
  piecePixelSize,
  piece,
  isValidTarget = false,
  isSelectedPiece = false,
  isInteractive = false,
  onPress,
  onHoverIn,
  onHoverOut,
  highlightMode = 'theatrical',
  skin = 'default',
}) => {
  const rosette = isRosette(row, col);
  const war = isWarZone(row, col);
  const pulse = useSharedValue(isValidTarget ? 1 : 0);
  const selectedPulse = useSharedValue(isSelectedPiece ? 1 : 0);
  const rosetteGlow = useSharedValue(rosette ? 0.2 : 0);
  const rosetteBurst = useSharedValue(0);
  const prevPieceId = useRef<string | null>(piece?.id ?? null);

  const tileSeed = useMemo(() => (row * 13 + col * 7) % 5, [col, row]);
  const toneOffset = tileSeed * 4;
  const cellRenderedSize = cellSize;
  const tileRadius = Math.max(3, Math.round(cellRenderedSize * 0.06));
  const innerInsetMargin = Math.max(1.5, Math.round(cellRenderedSize * 0.03));
  const destinationGlowSize = useMemo(() => {
    const baseSize =
      typeof piecePixelSize === 'number' && Number.isFinite(piecePixelSize) && piecePixelSize > 0
        ? piecePixelSize
        : Math.max(14, Math.round(cellRenderedSize * 0.74));
    // Additional 15% reduction from the prior 0.8x size target.
    return Math.max(10, Math.round(baseSize * 0.68));
  }, [cellRenderedSize, piecePixelSize]);

  const tileStyle = ({ pressed }: { pressed: boolean }) => [
    styles.tile,
    skin === 'transparent'
      ? {
        backgroundColor: 'transparent',
        borderColor: 'transparent',
        borderWidth: 0,
        borderRadius: tileRadius,
      }
      : {
        backgroundColor: baseBackground,
        borderColor,
        borderWidth: rosette ? 1.8 : 1.1,
        borderRadius: tileRadius,
      },
    isValidTarget && styles.validTile,
    isSelectedPiece && styles.selectedTile,
    isInteractive && pressed && styles.tilePressed,
  ];

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

  const baseBackground = rosette
    ? `rgb(${176 + toneOffset}, ${130 + Math.floor(toneOffset / 2)}, ${74 + Math.floor(toneOffset / 3)})`
    : war
      ? `rgb(${154 + toneOffset}, ${106 + Math.floor(toneOffset / 2)}, ${66 + Math.floor(toneOffset / 3)})`
      : `rgb(${210 + toneOffset}, ${187 + Math.floor(toneOffset / 2)}, ${147 + Math.floor(toneOffset / 3)})`;
  const borderColor = rosette ? 'rgba(246, 214, 151, 0.38)' : 'rgba(90, 63, 39, 0.28)';

  return (
    <Pressable
      onPress={onPress}
      onHoverIn={onHoverIn}
      onHoverOut={onHoverOut}
      disabled={!isInteractive}
      style={tileStyle}
    >
      {skin !== 'transparent' && (
        <>
          <Image
            source={urTextures.lapisMosaic}
            resizeMode="cover"
            style={[
              styles.tileTexture,
              styles.tileMottleTexture,
              rosette && styles.rosetteTextureTint,
              war && styles.warTextureTint,
            ]}
          />
          <Image source={urTextures.wood} resizeMode="repeat" style={styles.tileTexture} />
          {rosette && <RosetteArtwork size={cellRenderedSize} />}
          {!rosette && war && <WarArtwork size={cellRenderedSize} />}
          {!rosette && !war && <PipArtwork size={cellRenderedSize} />}

          <View
            style={[
              styles.innerInset,
              {
                margin: innerInsetMargin,
                borderRadius: Math.max(2, tileRadius - 2),
              },
              rosette && styles.rosetteInset,
            ]}
          />
          <View style={[styles.topLeftBevel, { borderTopLeftRadius: tileRadius }]} />
          <View style={[styles.bottomRightShade, { borderBottomRightRadius: tileRadius }]} />
          <View style={styles.edgeHighlight} />
          <View style={styles.lowerShade} />
          <View style={styles.tileDust} />
        </>
      )}

      {isSelectedPiece && <Animated.View style={[styles.selectedRing, selectedPulseStyle]} />}
      {isValidTarget && (
        <Animated.View
          style={[
            styles.validDestinationGlow,
            pulseStyle,
            {
              width: destinationGlowSize,
              height: destinationGlowSize,
              borderRadius: destinationGlowSize / 2,
              left: (cellRenderedSize - destinationGlowSize) / 2,
              top: (cellRenderedSize - destinationGlowSize) / 2,
            },
          ]}
        />
      )}
      {rosette && <Animated.View style={[styles.rosetteGlow, rosetteGlowStyle]} />}
      {rosette && <Animated.View style={[styles.rosetteBurst, rosetteBurstStyle]} />}

      {piece && (
        <View style={styles.pieceWrap}>
          <Piece
            color={piece.color}
            pixelSize={piecePixelSize}
            highlight={isValidTarget}
            state={isValidTarget ? 'active' : 'idle'}
          />
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    borderRadius: urTheme.radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    ...boxShadow({
      color: '#140B06',
      opacity: 0.16,
      offset: { width: 0, height: 1 },
      blurRadius: 2,
      elevation: 2,
    }),
  },
  tilePressed: {
    opacity: 0.92,
  },
  validTile: {
    ...boxShadow({
      color: '#B8FFB3',
      opacity: 0.22,
      blurRadius: 6,
      elevation: 5,
    }),
  },
  selectedTile: {
    borderColor: 'rgba(240, 200, 104, 0.72)',
    ...boxShadow({
      color: urTheme.colors.goldGlow,
      opacity: 0.26,
      blurRadius: 7,
      elevation: 7,
    }),
  },
  tileTexture: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.12,
  },
  tileMottleTexture: {
    opacity: 0.1,
    tintColor: '#6A5B44',
  },
  rosetteTextureTint: {
    opacity: 0.14,
    tintColor: '#7A4B2A',
  },
  warTextureTint: {
    opacity: 0.12,
    tintColor: '#5E3D29',
  },
  innerInset: {
    ...StyleSheet.absoluteFillObject,
    margin: 2.4,
    borderRadius: urTheme.radii.xs,
    borderWidth: 1,
    borderColor: 'rgba(64, 43, 28, 0.28)',
    backgroundColor: 'rgba(18, 10, 6, 0.045)',
  },
  rosetteInset: {
    borderColor: 'rgba(252, 220, 155, 0.32)',
  },
  topLeftBevel: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '58%',
    height: '58%',
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderColor: 'rgba(255, 243, 211, 0.22)',
    backgroundColor: 'rgba(255, 239, 201, 0.04)',
  },
  bottomRightShade: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: '62%',
    height: '62%',
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(27, 15, 8, 0.22)',
    backgroundColor: 'rgba(28, 16, 9, 0.03)',
  },
  edgeHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '28%',
    backgroundColor: 'rgba(255, 236, 196, 0.12)',
  },
  lowerShade: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '34%',
    backgroundColor: 'rgba(22, 12, 7, 0.1)',
  },
  tileDust: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 248, 228, 0.018)',
  },
  validDestinationGlow: {
    position: 'absolute',
    borderWidth: 1.8,
    borderColor: 'rgba(246, 212, 138, 0.95)',
    backgroundColor: 'rgba(240, 192, 64, 0.18)',
    ...boxShadow({
      color: urTheme.colors.goldGlow,
      opacity: 0.35,
      blurRadius: 8,
      elevation: 6,
    }),
  },
  selectedRing: {
    position: 'absolute',
    width: '90%',
    height: '90%',
    borderRadius: urTheme.radii.sm,
    borderWidth: 1.8,
    borderColor: 'rgba(245, 214, 143, 0.92)',
    backgroundColor: 'rgba(242, 194, 84, 0.08)',
  },
  rosetteGlow: {
    position: 'absolute',
    width: '82%',
    height: '82%',
    borderRadius: urTheme.radii.sm,
    backgroundColor: 'rgba(255, 210, 120, 0.12)',
  },
  rosetteBurst: {
    position: 'absolute',
    width: '72%',
    height: '72%',
    borderRadius: urTheme.radii.xs,
    borderWidth: 1.6,
    borderColor: 'rgba(255, 239, 196, 0.78)',
  },
  pieceWrap: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.98,
  },
});
