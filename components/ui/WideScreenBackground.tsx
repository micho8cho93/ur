import React from 'react';
import { Animated, ImageSourcePropType, Platform, StyleSheet, View, useWindowDimensions } from 'react-native';

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
  const { width, height } = useWindowDimensions();
  const opacity = React.useRef(new Animated.Value(0)).current;
  const overscan = Platform.OS === 'web' ? Math.max(48, Math.round(Math.max(width, height) * 0.08)) : 0;
  const overscannedBounds =
    overscan > 0
      ? {
          top: -overscan,
          left: -overscan,
          width: width + overscan * 2,
          height: height + overscan * 2,
        }
      : null;

  const handleLoad = React.useCallback(() => {
    Animated.timing(opacity, {
      toValue: imageOpacity,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [opacity, imageOpacity]);

  if (!visible) {
    return null;
  }

  return (
    <View pointerEvents="none" style={styles.container}>
      <Animated.Image
        accessible={false}
        source={source}
        resizeMode="cover"
        onLoad={handleLoad}
        style={[styles.image, overscannedBounds, { opacity }]}
      />
      <View style={[styles.overlay, overscannedBounds, { backgroundColor: overlayColor }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgb(6, 9, 14)',
  },
  image: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
});
