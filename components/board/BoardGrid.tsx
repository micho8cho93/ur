import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Tile } from './Tile';

export const BOARD_GAP = 4;
export const BOARD_PADDING = 12;

export const ROSETTE_COORDS = new Set(['0,0', '2,0', '1,3', '1,6', '0,7', '2,7']);

const VALID_COORDS: { x: number; y: number }[] = [
  { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 },
  { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 },
  { x: 0, y: 2 }, { x: 1, y: 2 }, { x: 2, y: 2 },
  { x: 0, y: 3 }, { x: 1, y: 3 }, { x: 2, y: 3 },
  { x: 1, y: 4 },
  { x: 1, y: 5 },
  { x: 0, y: 6 }, { x: 1, y: 6 }, { x: 2, y: 6 },
  { x: 0, y: 7 }, { x: 1, y: 7 }, { x: 2, y: 7 },
];

export const getTilePosition = (
  x: number,
  y: number,
  tileSize: number,
  gap: number,
  originX: number,
  originY: number,
) => ({
  left: originX + x * (tileSize + gap),
  top: originY + y * (tileSize + gap),
  width: tileSize,
  height: tileSize,
});

type BoardGridProps = {
  tileSize: number;
  originX?: number;
  originY?: number;
  onTilePress?: (x: number, y: number) => void;
  disabled?: boolean;
  highlighted?: Set<string>;
};

export const BoardGrid: React.FC<BoardGridProps> = ({
  tileSize,
  originX = 0,
  originY = 0,
  onTilePress,
  disabled = false,
  highlighted,
}) => {
  return (
    <View style={StyleSheet.absoluteFill}>
      {VALID_COORDS.map(({ x, y }) => {
        const key = `${x},${y}`;
        const isRosette = ROSETTE_COORDS.has(key);
        const isPath = x === 1;
        const type = isRosette ? 'rosette' : isPath ? 'path' : 'stone';
        const pos = getTilePosition(x, y, tileSize, BOARD_GAP, originX, originY);

        return (
          <View key={key} style={[styles.tileWrap, pos]}>
            <Tile
              x={x}
              y={y}
              type={type}
              size={tileSize}
              onPress={onTilePress ? () => onTilePress(x, y) : undefined}
              disabled={disabled}
              highlighted={!!highlighted?.has(key)}
            />
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  tileWrap: {
    position: 'absolute',
    zIndex: 0,
  },
});
