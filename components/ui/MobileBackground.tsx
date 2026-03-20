import React from 'react';
import { Animated, ImageSourcePropType, Platform, StyleSheet, View, useWindowDimensions } from 'react-native';
import { MIN_WIDE_WEB_BACKGROUND_WIDTH } from './WideScreenBackground';

export function useMobileBackground(): boolean {
  const { width } = useWindowDimensions();
  return Platform.OS !== 'web' || width < MIN_WIDE_WEB_BACKGROUND_WIDTH;
}

type MobileBackgroundProps = {
  source: ImageSourcePropType;
  visible: boolean;
  overlayColor?: string;
  imageOpacity?: number;
};

export function MobileBackground({
  source,
  visible,
  overlayColor = 'rgba(6, 9, 14, 0.26)',
  imageOpacity = 1,
}: MobileBackgroundProps) {
  const { width, height } = useWindowDimensions();
  const opacity = React.useRef(new Animated.Value(0)).current;
  const overscan = Platform.OS === 'web' ? Math.max(48, Math.round(Math.max(width, height) * 0.08)) : 0;
  const baseBounds =
    overscan > 0
      ? {
          top: -overscan,
          left: -overscan,
          width: width + overscan * 2,
          height: height + overscan * 2,
        }
      : {};
  const imageBounds = (Platform.OS === 'web'
    ? {
        position: 'fixed',
        ...baseBounds,
      }
    : baseBounds) as any;

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
        style={[styles.image, imageBounds, { opacity }]}
      />
      <View style={[styles.overlay, imageBounds, { backgroundColor: overlayColor }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgb(6, 9, 14)',
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
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
});
