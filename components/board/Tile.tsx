import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Rosette } from './Rosette';

export type TileProps = {
  x: number;
  y: number;
  type: 'stone' | 'path' | 'rosette';
  size: number;
  onPress?: () => void;
  disabled?: boolean;
  highlighted?: boolean;
};

export const Tile: React.FC<TileProps> = ({ type, size, onPress, disabled = false, highlighted = false }) => {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.base,
        { width: size, height: size },
        type === 'stone' && styles.stoneTile,
        type === 'path' && styles.pathTile,
        type === 'rosette' && styles.rosetteTile,
        highlighted && styles.highlight,
      ]}
    >
      {type === 'stone' && <StonePattern />}
      {type === 'path' && <PathPattern />}
      {type === 'rosette' && <Rosette size={size} />}
    </Pressable>
  );
};

const StonePattern = () => (
  <>
    {[0.25, 0.75].map((x) =>
      [0.25, 0.75].map((y) => (
        <View
          key={`${x}-${y}`}
          style={{
            position: 'absolute',
            left: `${x * 100}%`,
            top: `${y * 100}%`,
            width: 4,
            height: 4,
            marginLeft: -2,
            marginTop: -2,
            borderRadius: 2,
            backgroundColor: '#8C7A5A',
          }}
        />
      )),
    )}
  </>
);

const PathPattern = () => (
  <>
    {[0.3, 0.7].map((x) =>
      [0.3, 0.7].map((y) => (
        <View
          key={`${x}-${y}`}
          style={{
            position: 'absolute',
            left: `${x * 100}%`,
            top: `${y * 100}%`,
            width: 6,
            height: 6,
            marginLeft: -3,
            marginTop: -3,
            backgroundColor: '#5A3A24',
            transform: [{ rotate: '45deg' }],
          }}
        />
      )),
    )}
  </>
);

const styles = StyleSheet.create({
  base: {
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stoneTile: {
    backgroundColor: '#D8C3A5',
    borderColor: '#B89F7A',
  },
  pathTile: {
    backgroundColor: '#8B5E3C',
    borderColor: '#6E472C',
  },
  rosetteTile: {
    backgroundColor: '#D8C3A5',
    borderColor: '#B89F7A',
  },
  highlight: {
    borderColor: '#F2E6D8',
    borderWidth: 2,
  },
});
