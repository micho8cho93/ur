import React from 'react';
import { Image, ImageSourcePropType, StyleSheet, View } from 'react-native';

export const MIN_WIDE_WEB_BACKGROUND_WIDTH = 768;

type WideScreenBackgroundProps = {
  source: ImageSourcePropType;
  visible: boolean;
  overlayColor?: string;
  imageOpacity?: number;
};

export function WideScreenBackground({
  source,
  visible,
  overlayColor = 'rgba(6, 9, 14, 0.26)',
  imageOpacity = 1,
}: WideScreenBackgroundProps) {
  if (!visible) {
    return null;
  }

  return (
    <View pointerEvents="none" style={styles.container}>
      <Image
        accessible={false}
        source={source}
        resizeMode="cover"
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
