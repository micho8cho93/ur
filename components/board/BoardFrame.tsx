import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';

type BoardFrameProps = {
  children: React.ReactNode;
  width: number;
  height: number;
};

export const BoardFrame: React.FC<BoardFrameProps> = ({ children, width, height }) => {
  return (
    <View style={[styles.frame, { width, height }]}> 
      <View style={styles.innerStroke}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  frame: {
    backgroundColor: '#4A3426',
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
    ...(Platform.OS === 'web'
      ? {
          boxShadow: '0px 6px 16px rgba(0,0,0,0.35)',
        }
      : null),
  },
  innerStroke: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#2E1F15',
    borderRadius: 10,
    padding: 12,
  },
});
