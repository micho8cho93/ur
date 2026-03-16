import React from 'react';
import { Image, ImageSourcePropType, Platform, StyleSheet, View, useWindowDimensions } from 'react-native';
import { MIN_WIDE_WEB_BACKGROUND_WIDTH } from './WideScreenBackground';

type MobileBackgroundProps = {
  source: ImageSourcePropType;
  visible: boolean;
  overlayColor?: string;
  imageOpacity?: number;
};

export function useMobileBackground(): boolean {
  const { width } = useWindowDimensions();
  return Platform.OS !== 'web' || width < MIN_WIDE_WEB_BACKGROUND_WIDTH;
}

export function MobileBackground({
  source,
  visible,
  overlayColor = 'rgba(6, 9, 14, 0.32)',
  imageOpacity = 1,
}: MobileBackgroundProps) {
  if (!visible) {
    return null;
  }

  return (
    <View pointerEvents="none" style={styles.container}>
      <Image
        accessible={false}
        source={source}
        resizeMode="contain"
        style={[styles.image, { opacity: imageOpacity }]}
      />
      <View style={[styles.overlay, { backgroundColor: overlayColor }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  image: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
});
