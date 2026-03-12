import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Canvas } from '@react-three/fiber/native';
import { DICE_ROLL_CAMERA, DiceRollSceneContent, type DiceRollSceneContentProps } from './DiceRollScene.shared';

export const DiceRollScene: React.FC<DiceRollSceneContentProps> = (props) => (
  <View pointerEvents="none" style={styles.wrap}>
    <Canvas
      style={styles.canvas}
      camera={DICE_ROLL_CAMERA}
      gl={{ antialias: true, alpha: true }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0);
      }}
    >
      <DiceRollSceneContent {...props} />
    </Canvas>
  </View>
);

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  canvas: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});
